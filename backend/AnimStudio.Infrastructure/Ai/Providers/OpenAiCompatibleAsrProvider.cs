using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Transcription from any endpoint that implements OpenAI's <c>/audio/transcriptions</c>.
/// </summary>
/// <remarks>
/// <para>
/// One class covers faster-whisper-server on this machine, Groq's free Whisper endpoint and
/// the hosted services, for the same reason there is no separate Kokoro class: they all
/// speak the same route, and a second implementation would have differed only in a default
/// base URL. Groq matters here because it is a genuinely free hosted recognizer, and a
/// hosted one is the difference between a minute and twenty on a machine with no GPU.
/// </para>
/// <para>
/// <b>The request asks for <c>verbose_json</c> and builds the SubRip itself</b>, rather than
/// asking the service for <c>srt</c> directly. That costs a small writer and buys three
/// things a ready-made SubRip cannot: the detected language, a usable confidence, and
/// per-word timings - which drive mouth flap and karaoke captions and cannot be recovered
/// once the recognizer has merged words into sentences.
/// </para>
/// <para>
/// <b>The audio is buffered rather than streamed.</b> A free tier rate-limits constantly, so
/// a 429 retry is what makes a long job finish - and a request whose body is a live file
/// stream cannot be sent twice. Every hosted recognizer here caps uploads at 25 MB anyway,
/// so the buffer is bounded by a limit that already applied. Anything larger belongs on the
/// local recognizer, which is first in the chain.
/// </para>
/// </remarks>
public sealed class OpenAiCompatibleAsrProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<OpenAiCompatibleAsrProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Transcription, clients, secrets, options, logger),
      ITranscriptionProvider
{
    /// <summary>What OpenAI and Groq both document. Enforced before the upload, not after.</summary>
    private const int MaxUploadBytes = 25 * 1024 * 1024;

    /// <summary>A recognizer fed an hour of silence will happily emit far more than this.</summary>
    private const int MaxCues = 20_000;

    public async Task<AiTranscriptionResult> TranscribeAsync(
        AiTranscriptionRequest request, CancellationToken ct)
    {
        var audio = await ReadAudioAsync(request.AudioPath, ct).ConfigureAwait(false);

        using var content = BuildForm(request, audio);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "audio/transcriptions")
        {
            Content = content
        };

        using var document = await SendForJsonAsync(httpRequest, ct).ConfigureAwait(false);

        var root = document.RootElement;

        if (root.ValueKind != JsonValueKind.Object)
        {
            throw new AiProviderException("malformed-response",
                $"'{Id.Value}' returned a transcription that is not an object.");
        }

        var cues = ReadCues(root, request.RequestWordTimings);

        // A service that ignored verbose_json still answers with the plain text, and a
        // transcript with estimated timings beats no transcript at all - the parser
        // synthesizes cue times from a reading rate for exactly this case.
        var (text, format) = cues.Count > 0
            ? (BuildSubRip(cues), AiTranscriptValidator.SubRip)
            : (ReadPlainText(root), AiTranscriptValidator.PlainText);

        var subtitles = AiTranscriptValidator.Require(text, Id.Value);

        if (format == AiTranscriptValidator.PlainText)
        {
            Logger.LogInformation(
                "AI provider {ProviderId} returned no segment timings; the transcript will " +
                "have its cue times estimated.",
                Id.Value);
        }

        return new AiTranscriptionResult(
            subtitles,
            format,
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Transcription,
                Model = Model,
                GeneratedAtUtc = DateTime.UtcNow
            },
            ReadLanguage(root),
            ReadConfidence(root));
    }

    /// <summary>
    /// Reads the file, refusing one the service would reject anyway.
    /// </summary>
    /// <remarks>
    /// The path is composed by the server rather than supplied by a caller, so the checks
    /// here are about failing legibly: an over-sized upload otherwise comes back as a 413
    /// several minutes and one wasted allowance later.
    /// </remarks>
    private async Task<byte[]> ReadAudioAsync(string path, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            throw new AiProviderException("audio-missing",
                $"'{Id.Value}' was given an audio file that does not exist.");
        }

        var length = new FileInfo(path).Length;

        if (length == 0)
            throw new AiProviderException("audio-missing", $"'{Id.Value}' was given an empty file.");

        if (length > MaxUploadBytes)
        {
            throw new AiProviderException("request-too-large",
                $"'{Id.Value}' takes at most {MaxUploadBytes} bytes of audio in one call.");
        }

        try
        {
            return await File.ReadAllBytesAsync(path, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            throw new AiProviderException("audio-unreadable",
                $"'{Id.Value}' could not read the audio it was given.", ex);
        }
    }

    private MultipartFormDataContent BuildForm(AiTranscriptionRequest request, byte[] audio)
    {
        var form = new MultipartFormDataContent();

        var file = new ByteArrayContent(audio);
        file.Headers.ContentType = new MediaTypeHeaderValue("audio/wav");

        // The filename is fixed rather than taken from the path. Services route on its
        // extension, and a server-composed scratch name has nothing in it worth sending.
        file.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
        {
            Name = Quoted("file"),
            FileName = Quoted("audio.wav")
        };

        form.Add(file);

        // faster-whisper-server serves whatever it has loaded and treats the field as
        // advisory, so an unset model is legitimate rather than a misconfiguration.
        if (!string.IsNullOrWhiteSpace(Model)) AddField(form, "model", Model);

        AddField(form, "response_format", "verbose_json");

        if (LanguageArgument(request.LanguageHint) is { } language)
            AddField(form, "language", language);

        if (request.RequestWordTimings)
        {
            // Both granularities: the word times are what is wanted, and asking for them
            // alone makes some services drop the segments the fallback path needs.
            AddField(form, "timestamp_granularities[]", "segment");
            AddField(form, "timestamp_granularities[]", "word");
        }

        return form;
    }

    /// <summary>
    /// Adds one form field with its name quoted.
    /// </summary>
    /// <remarks>
    /// .NET writes an unquoted <c>name=model</c> unless the value forces quoting. RFC 7578
    /// says the name is a quoted string, and a strict parser - which several of these
    /// services sit behind - reads an unquoted one as a field it does not recognise, so the
    /// request fails as "no model given" rather than as anything to do with quoting. It is
    /// also what keeps <c>filename*</c> off the file part, which a different set of servers
    /// rejects.
    /// </remarks>
    private static void AddField(MultipartFormDataContent form, string name, string value)
    {
        var field = new StringContent(value, Encoding.UTF8);

        field.Headers.ContentDisposition =
            new ContentDispositionHeaderValue("form-data") { Name = Quoted(name) };

        form.Add(field);
    }

    private static string Quoted(string value) => $"\"{value}\"";

    /// <summary>
    /// The cues to write, preferring per-word ones when they were asked for and supplied.
    /// </summary>
    private static List<Cue> ReadCues(JsonElement root, bool preferWords)
    {
        if (preferWords)
        {
            var words = ReadWordCues(root);
            if (words.Count > 0) return words;
        }

        var cues = new List<Cue>();

        if (!root.TryGetProperty("segments", out var segments) ||
            segments.ValueKind != JsonValueKind.Array)
        {
            return cues;
        }

        foreach (var segment in segments.EnumerateArray())
        {
            if (segment.ValueKind != JsonValueKind.Object) continue;

            if (TryReadCue(segment, "text", out var cue)) cues.Add(cue);

            if (cues.Count >= MaxCues) break;
        }

        return cues;
    }

    /// <summary>
    /// Word timings arrive either at the top level or inside each segment, depending on the
    /// service. Both are read, because which one a build uses is not worth configuring.
    /// </summary>
    private static List<Cue> ReadWordCues(JsonElement root)
    {
        var cues = new List<Cue>();

        Collect(root);

        if (cues.Count == 0 &&
            root.TryGetProperty("segments", out var segments) &&
            segments.ValueKind == JsonValueKind.Array)
        {
            foreach (var segment in segments.EnumerateArray())
            {
                if (segment.ValueKind == JsonValueKind.Object) Collect(segment);
                if (cues.Count >= MaxCues) break;
            }
        }

        return cues;

        void Collect(JsonElement container)
        {
            if (!container.TryGetProperty("words", out var words) ||
                words.ValueKind != JsonValueKind.Array)
            {
                return;
            }

            foreach (var word in words.EnumerateArray())
            {
                if (word.ValueKind != JsonValueKind.Object) continue;

                if (TryReadCue(word, "word", out var cue)) cues.Add(cue);

                if (cues.Count >= MaxCues) return;
            }
        }
    }

    private static bool TryReadCue(JsonElement element, string textProperty, out Cue cue)
    {
        cue = default;

        var text = element.TryGetProperty(textProperty, out var value) &&
                   value.ValueKind == JsonValueKind.String
            ? AiOutputSanitizer.ToSafeLine(value.GetString())
            : null;

        if (text is null) return false;

        var start = ReadSeconds(element, "start");
        var end = ReadSeconds(element, "end");

        // A cue with no times is not a cue, and one that ends before it starts would put
        // the subtitle file into a state ffmpeg reads as a corrupt stream.
        if (start is null || end is null || end <= start) return false;

        cue = new Cue(start.Value, end.Value, text);
        return true;
    }

    private static double? ReadSeconds(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out var value)) return null;

        var seconds = value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetDouble(out var number) => number,
            JsonValueKind.String when double.TryParse(
                value.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
                => parsed,
            _ => (double?)null
        };

        return seconds is null || double.IsNaN(seconds.Value) || double.IsInfinity(seconds.Value)
            ? null
            : Math.Max(0, seconds.Value);
    }

    /// <summary>Writes SubRip, which is what the parser downstream reads best.</summary>
    private static string BuildSubRip(IReadOnlyList<Cue> cues)
    {
        var builder = new StringBuilder();

        for (var i = 0; i < cues.Count; i++)
        {
            builder.Append((i + 1).ToString(CultureInfo.InvariantCulture)).Append('\n');
            builder.Append(Timestamp(cues[i].Start)).Append(" --> ").Append(Timestamp(cues[i].End))
                   .Append('\n');
            builder.Append(cues[i].Text).Append("\n\n");
        }

        return builder.ToString();
    }

    private static string Timestamp(double seconds)
    {
        var time = TimeSpan.FromSeconds(seconds);

        return string.Create(CultureInfo.InvariantCulture,
            $"{(int)time.TotalHours:00}:{time.Minutes:00}:{time.Seconds:00},{time.Milliseconds:000}");
    }

    private static string? ReadPlainText(JsonElement root) =>
        root.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String
            ? text.GetString()
            : null;

    /// <summary>
    /// The language the service reports. Some answer with a code and some with an English
    /// name, so it is passed through rather than mapped - but only when it is short and
    /// letters, because it is stored and shown.
    /// </summary>
    private static string? ReadLanguage(JsonElement root)
    {
        if (!root.TryGetProperty("language", out var value) ||
            value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var language = value.GetString()?.Trim();

        if (language is not { Length: > 0 and <= 32 }) return null;

        return language.All(c => char.IsAsciiLetter(c) || c is '-' or '_' or ' ')
            ? language
            : null;
    }

    /// <summary>
    /// A rough confidence from the segments' mean log probability.
    /// </summary>
    /// <remarks>
    /// Whisper reports <c>avg_logprob</c>, a mean log probability per token; its exponential
    /// is the geometric mean token probability, which is the closest thing to a confidence
    /// the model actually produces. It is used to flag a transcript worth reviewing, never
    /// to gate one - so an approximation is the right shape of answer.
    /// </remarks>
    private static double? ReadConfidence(JsonElement root)
    {
        if (!root.TryGetProperty("segments", out var segments) ||
            segments.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var total = 0.0;
        var count = 0;

        foreach (var segment in segments.EnumerateArray())
        {
            if (segment.ValueKind != JsonValueKind.Object) continue;
            if (!segment.TryGetProperty("avg_logprob", out var value)) continue;
            if (value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var logProb)) continue;
            if (double.IsNaN(logProb) || double.IsInfinity(logProb)) continue;

            total += Math.Exp(logProb);
            count++;
        }

        return count == 0 ? null : AiOutputSanitizer.ToRange(total / count, 0, 1);
    }

    private static string? LanguageArgument(string? hint)
    {
        if (string.IsNullOrWhiteSpace(hint)) return null;

        var trimmed = hint.Trim();

        if (trimmed.Length is < 2 or > 5) return null;

        foreach (var c in trimmed)
        {
            if (!char.IsAsciiLetter(c) && c is not ('-' or '_')) return null;
        }

        // The services take the base code, as whisper itself does.
        return trimmed.Replace('_', '-').ToLowerInvariant().Split('-', 2)[0];
    }

    private readonly record struct Cue(double Start, double End, string Text);
}
