using System.Buffers.Binary;
using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Speech from Gemini's text-to-speech models, through the same <c>generateContent</c> route
/// as <see cref="GeminiTextProvider"/> with the response modality set to audio.
/// </summary>
/// <remarks>
/// <para>
/// <b>The audio arrives as raw PCM</b> (16-bit mono, 24 kHz, base64 inside the JSON), not as a
/// file. It is wrapped in a WAV header here, because this pipeline sizes a scene by reading
/// its narration's duration from that header the moment the audio arrives.
/// </para>
/// <para>
/// <b>There is no speed parameter.</b> Gemini's speech is steered by asking, so a rate away
/// from normal becomes a short spoken-style direction in front of the line - the way the
/// service's own documentation steers tone ("Say cheerfully: ..."). The same mechanism means
/// a line the user writes as "Say angrily: ..." is performed rather than read out.
/// </para>
/// <para>
/// Only stock voices: a recording of someone's voice is never sent here. Lines in the user's
/// own voice stay with the local engines (<see cref="IVoiceTuningSpeechProvider"/>, Seed-VC).
/// </para>
/// </remarks>
public sealed class GeminiTtsProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<GeminiTtsProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Speech, clients, secrets, options, logger), ISpeechAiProvider
{
    private const string DefaultModel = "gemini-2.5-flash-preview-tts";

    /// <summary>The model's input window is a few thousand tokens; a narration line is far shorter.</summary>
    private const int MaxTextLength = 5_000;

    /// <summary>Under the API response buffer, and far more than any one line produces.</summary>
    private const int MaxAudioBytes = 24 * 1024 * 1024;

    private const int DefaultSampleRate = 24_000;

    private static readonly Regex RateParameter =
        new(@"rate=(?<rate>\d{4,6})", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    /// <summary>
    /// The prebuilt voices and the character Google gives each. A fixed list rather than a
    /// request: the API has no voice-listing route, and a picker should not cost a call.
    /// Each voice speaks every supported language; the language is detected from the text.
    /// </summary>
    internal static readonly IReadOnlyList<(string Name, string Character)> Voices =
    [
        ("Zephyr", "Bright"), ("Puck", "Upbeat"), ("Charon", "Informative"), ("Kore", "Firm"),
        ("Fenrir", "Excitable"), ("Leda", "Youthful"), ("Orus", "Firm"), ("Aoede", "Breezy"),
        ("Callirrhoe", "Easy-going"), ("Autonoe", "Bright"), ("Enceladus", "Breathy"), ("Iapetus", "Clear"),
        ("Umbriel", "Easy-going"), ("Algieba", "Smooth"), ("Despina", "Smooth"), ("Erinome", "Clear"),
        ("Algenib", "Gravelly"), ("Rasalgethi", "Informative"), ("Laomedeia", "Upbeat"), ("Achernar", "Soft"),
        ("Alnilam", "Firm"), ("Schedar", "Even"), ("Gacrux", "Mature"), ("Pulcherrima", "Forward"),
        ("Achird", "Friendly"), ("Zubenelgenubi", "Casual"), ("Vindemiatrix", "Gentle"), ("Sadachbia", "Lively"),
        ("Sadaltager", "Knowledgeable"), ("Sulafat", "Warm")
    ];

    /// <summary>Gemini is a hosted service; there is no local variant to fall back to.</summary>
    public override bool IsConfigured => base.IsConfigured && ProviderOptions?.IsLocal != true;

    protected override void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Add("x-goog-api-key", secret);

    /// <summary>ISO 639's code for "multiple languages": the panel offers these voices for any script.</summary>
    internal const string AnyLanguage = "mul";

    public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<AiVoice>>(
            [.. Voices.Select(v => new AiVoice(v.Name, $"{v.Name} ({v.Character})", AnyLanguage, null))]);

    public async Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
    {
        var text = request.Text?.Trim() ?? string.Empty;

        if (text.Length == 0)
            throw new AiProviderException("text-required", "There is nothing to speak.");

        if (text.Length > MaxTextLength)
        {
            throw new AiProviderException("text-too-long",
                $"'{Id.Value}' takes at most {MaxTextLength} characters in one call.");
        }

        // Matched against the known list rather than passed through: the name travels into
        // a request body, and an unknown one is a 400 that reads less clearly than this.
        var voice = Voices.FirstOrDefault(v =>
            string.Equals(v.Name, request.VoiceId?.Trim(), StringComparison.OrdinalIgnoreCase)).Name;

        if (voice is null)
            throw new AiProviderException("voice-required", $"'{request.VoiceId}' is not a Gemini voice.");

        // A per-request model was checked against the catalogue by the caller; it still goes
        // through the same name check, because it still reaches the URL path.
        var model = GeminiModelName.Resolve(request.Model ?? Model, DefaultModel);

        var body = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = Direction(request.Rate) + text } } }
            },
            generationConfig = new
            {
                responseModalities = new[] { "AUDIO" },
                speechConfig = new
                {
                    voiceConfig = new { prebuiltVoiceConfig = new { voiceName = voice } }
                }
            }
        };

        using var response = await PostJsonAsync(
            $"v1beta/models/{model}:generateContent", body, ct).ConfigureAwait(false);

        var (data, mimeType) = ReadAudio(response.RootElement);

        byte[] pcmOrFile;
        try
        {
            pcmOrFile = Convert.FromBase64String(data);
        }
        catch (FormatException ex)
        {
            throw new AiProviderException("malformed-response", "Gemini returned audio that is not base64.", ex);
        }

        if (pcmOrFile.Length > MaxAudioBytes)
            throw new AiProviderException("response-too-large", $"'{Id.Value}' returned more audio than one line makes.");

        // Raw PCM is the documented answer; a container is accepted as-is should that change.
        // Decided by the declared type, not by sniffing: PCM opening on a sample of -1 is
        // FF FF, which looks exactly like an MP3 frame header.
        var bytes = IsRawPcm(mimeType) ? WrapPcm(pcmOrFile, SampleRateOf(mimeType)) : pcmOrFile;

        var sniffed = AiAudioValidator.Require(bytes, Id.Value);

        return new AiSpeechResult(bytes, sniffed, AiAudioValidator.TryGetDuration(bytes, sniffed), new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Speech,
            Model = $"{model}/{voice}",
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    /// <summary>
    /// The pace, asked for in words. Near-normal rates send nothing, so an ordinary line is
    /// spoken exactly as written.
    /// </summary>
    internal static string Direction(double rate) => rate switch
    {
        <= 0 => string.Empty,
        < 0.8 => "Say slowly and clearly: ",
        < 0.93 => "Say at a relaxed pace: ",
        > 1.3 => "Say quickly: ",
        > 1.08 => "Say at a brisk pace: ",
        _ => string.Empty
    };

    private (string Data, string? MimeType) ReadAudio(JsonElement root)
    {
        if (root.TryGetProperty("promptFeedback", out var feedback) &&
            feedback.ValueKind == JsonValueKind.Object &&
            feedback.TryGetProperty("blockReason", out var blocked) &&
            blocked.ValueKind == JsonValueKind.String)
        {
            throw new AiProviderException("content-blocked", $"Gemini declined the line ({blocked.GetString()}).");
        }

        if (!root.TryGetProperty("candidates", out var candidates) ||
            candidates.ValueKind != JsonValueKind.Array ||
            candidates.GetArrayLength() == 0)
        {
            throw new AiProviderException("empty-response", "Gemini returned no candidates.");
        }

        var candidate = candidates[0];

        if (candidate.TryGetProperty("finishReason", out var finish) &&
            finish.ValueKind == JsonValueKind.String &&
            finish.GetString() is "SAFETY" or "RECITATION" or "BLOCKLIST" or "PROHIBITED_CONTENT")
        {
            throw new AiProviderException("content-blocked", $"Gemini stopped speaking ({finish.GetString()}).");
        }

        if (candidate.TryGetProperty("content", out var content) &&
            content.ValueKind == JsonValueKind.Object &&
            content.TryGetProperty("parts", out var parts) &&
            parts.ValueKind == JsonValueKind.Array)
        {
            foreach (var part in parts.EnumerateArray())
            {
                if (part.ValueKind == JsonValueKind.Object &&
                    part.TryGetProperty("inlineData", out var inline) &&
                    inline.ValueKind == JsonValueKind.Object &&
                    inline.TryGetProperty("data", out var data) &&
                    data.ValueKind == JsonValueKind.String &&
                    data.GetString() is { Length: > 0 } encoded)
                {
                    var mime = inline.TryGetProperty("mimeType", out var m) && m.ValueKind == JsonValueKind.String
                        ? m.GetString()
                        : null;
                    return (encoded, mime);
                }
            }
        }

        // A text model named by mistake answers 200 with words instead of sound.
        throw new AiProviderException("empty-response",
            "Gemini returned no audio. Check that the configured model is a TTS model.");
    }

    /// <summary>No type at all is taken as the documented PCM.</summary>
    internal static bool IsRawPcm(string? mimeType) =>
        mimeType is null ||
        mimeType.StartsWith("audio/L16", StringComparison.OrdinalIgnoreCase) ||
        mimeType.Contains("pcm", StringComparison.OrdinalIgnoreCase);

    /// <summary>Reads <c>rate=</c> from e.g. <c>audio/L16;codec=pcm;rate=24000</c>, within sane bounds.</summary>
    internal static int SampleRateOf(string? mimeType)
    {
        var match = mimeType is null ? Match.Empty : RateParameter.Match(mimeType);

        return match.Success &&
               int.TryParse(match.Groups["rate"].Value, NumberStyles.None, CultureInfo.InvariantCulture, out var rate) &&
               rate is >= 8_000 and <= 96_000
            ? rate
            : DefaultSampleRate;
    }

    /// <summary>A canonical 44-byte header in front of 16-bit mono little-endian PCM.</summary>
    internal static byte[] WrapPcm(byte[] pcm, int sampleRate)
    {
        // An odd byte would be half a sample; dropped rather than played as a click.
        var dataSize = pcm.Length & ~1;
        var bytes = new byte[44 + dataSize];
        var span = bytes.AsSpan();

        "RIFF"u8.CopyTo(span);
        BinaryPrimitives.WriteUInt32LittleEndian(span[4..], (uint)(36 + dataSize));
        "WAVE"u8.CopyTo(span[8..]);

        "fmt "u8.CopyTo(span[12..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[16..], 16);
        BinaryPrimitives.WriteUInt16LittleEndian(span[20..], 1);
        BinaryPrimitives.WriteUInt16LittleEndian(span[22..], 1);
        BinaryPrimitives.WriteUInt32LittleEndian(span[24..], (uint)sampleRate);
        BinaryPrimitives.WriteUInt32LittleEndian(span[28..], (uint)(sampleRate * 2));
        BinaryPrimitives.WriteUInt16LittleEndian(span[32..], 2);
        BinaryPrimitives.WriteUInt16LittleEndian(span[34..], 16);

        "data"u8.CopyTo(span[36..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[40..], (uint)dataSize);

        pcm.AsSpan(0, dataSize).CopyTo(span[44..]);
        return bytes;
    }
}
