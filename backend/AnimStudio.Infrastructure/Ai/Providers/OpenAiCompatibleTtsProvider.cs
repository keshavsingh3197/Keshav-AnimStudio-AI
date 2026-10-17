using System.Net.Http.Headers;
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
/// Speech from any endpoint that implements OpenAI's <c>/audio/speech</c>.
/// </summary>
/// <remarks>
/// <para>
/// This covers Kokoro-FastAPI as well as the hosted services, which is why there is no
/// separate Kokoro class: Kokoro deliberately implements the same route, and a second class
/// would have differed only in its default base URL - a configuration value. The one place
/// they genuinely differ is voice discovery, and that is handled by asking and degrading
/// rather than by branching on which service someone thinks they are talking to.
/// </para>
/// <para>
/// <b>WAV is requested rather than MP3</b>, even though MP3 is smaller. This pipeline times
/// scenes by the length of their narration, and a WAV's duration is a header read while a
/// compressed format's is a decode - so asking for WAV is what lets a scene be sized to its
/// line the moment the audio arrives, with no second pass over the file.
/// </para>
/// </remarks>
public sealed class OpenAiCompatibleTtsProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<OpenAiCompatibleTtsProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Speech, clients, secrets, options, logger), IVoiceTuningSpeechProvider
{
    private const int MaxAudioBytes = 64 * 1024 * 1024;
    private const int MaxTextLength = 8_000;

    /// <summary>Kokoro's own cap on a reference recording.</summary>
    private const int MaxReferenceBytes = 10 * 1024 * 1024;

    /// <summary>What Kokoro's <c>save_voice</c> accepts; it appends <see cref="TunedSuffix"/>.</summary>
    private static readonly Regex TuneName =
        new(@"^[ab][a-z]?_[a-z0-9]+(_[a-z0-9]+)*$", RegexOptions.CultureInvariant);

    private const string TunedSuffix = "_tuned";

    /// <summary>Kokoro's one-letter language codes; anything else is not sent, so a hosted service never sees the field.</summary>
    private static readonly Regex KokoroLanguage = new(@"^[abefhijpz]$", RegexOptions.CultureInvariant);

    /// <summary>
    /// What OpenAI's own service offers. Used only when an endpoint has no voice-listing
    /// route, so that a voice picker is never empty on a service that does have voices.
    /// </summary>
    private static readonly string[] FallbackVoices =
        ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

    public async Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "audio/voices");
            using var response = await SendForJsonAsync(request, ct).ConfigureAwait(false);

            var names = ReadVoiceNames(response.RootElement);

            if (names.Count > 0)
            {
                return [.. names.Select(name => new AiVoice(name, name, null, null))];
            }
        }
        catch (AiProviderException ex) when (ex.Code is not ("transport-failed" or "timeout"))
        {
            // A server that is not running is not "a server without the route": offering
            // OpenAI's names for it would make a dead engine look ready.
            // A service without the route is the normal case, not a fault worth surfacing:
            // OpenAI itself has no voice-listing endpoint.
            Logger.LogDebug(
                "AI provider {ProviderId} does not list its voices ({Code}); using the known set.",
                Id.Value, ex.Code);
        }

        return [.. FallbackVoices.Select(name => new AiVoice(name, name, null, null))];
    }

    public async Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
    {
        var text = request.Text?.Trim() ?? string.Empty;

        if (text.Length == 0)
            throw new AiProviderException("text-required", "There is nothing to speak.");

        if (text.Length > MaxTextLength)
        {
            // Refused here rather than sent and rejected, so the failure names the cause.
            throw new AiProviderException("text-too-long",
                $"'{Id.Value}' takes at most {MaxTextLength} characters in one call.");
        }

        if (string.IsNullOrWhiteSpace(request.VoiceId))
            throw new AiProviderException("voice-required", "A voice must be chosen.");

        var body = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["input"] = text,
            ["voice"] = request.VoiceId,
            ["response_format"] = "wav",
            ["speed"] = Math.Clamp(request.Rate <= 0 ? 1.0 : request.Rate, 0.25, 4.0)
        };

        // Kokoro serves whatever it has loaded and treats the field as advisory, so an
        // unset model is legitimate rather than a misconfiguration.
        if (!string.IsNullOrWhiteSpace(Model)) body["model"] = Model;

        // Kokoro reads a line in the language its voice's first letter names; a tuned voice
        // is named as English whatever it speaks, so its line's language is given instead.
        if (request.LanguageCode is { } language && KokoroLanguage.IsMatch(language)) body["lang_code"] = language;

        using var httpRequest = JsonRequest(HttpMethod.Post, "audio/speech", body);

        var bytes = await SendForBytesAsync(httpRequest, MaxAudioBytes, ct).ConfigureAwait(false);

        // Sniffed rather than trusted, for the same reason images are: a JSON error body
        // written into a scene's audio track fails much later and much less legibly.
        var mimeType = AiAudioValidator.Require(bytes, Id.Value);

        var duration = AiAudioValidator.TryGetDuration(bytes, mimeType);

        if (duration is null)
        {
            // Not fatal - the render can probe the file - but it means WAV was asked for
            // and something else came back, which is worth knowing about.
            Logger.LogInformation(
                "AI provider {ProviderId} returned {MimeType} rather than WAV; the duration " +
                "will have to be probed.",
                Id.Value, mimeType);
        }

        return new AiSpeechResult(bytes, mimeType, duration, new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Speech,
            Model = Model ?? request.VoiceId,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    public bool CanTuneVoices => ProviderOptions?.IsLocal == true;

    /// <remarks>
    /// <c>/dev/tune</c> sits beside <c>/v1</c>, not under it, hence the <c>../</c>. Kokoro
    /// answers 409 for a name it already keeps; the name is ours and deterministic, so that
    /// is an earlier tune whose answer was lost, and its voice is the one wanted.
    /// </remarks>
    public async Task<string> TuneVoiceAsync(byte[] referenceWav, string name, CancellationToken ct)
    {
        if (!CanTuneVoices)
            throw new AiProviderException("tuning-unavailable", $"'{Id.Value}' is not on this machine, so it is not sent voice recordings.");
        if (!TuneName.IsMatch(name) || name.EndsWith(TunedSuffix, StringComparison.Ordinal))
            throw new ArgumentException("Not a name the speech engine keeps a voice under.", nameof(name));
        if (referenceWav.Length == 0 || referenceWav.Length > MaxReferenceBytes)
            throw new AiProviderException("request-too-large", $"A reference recording must be 1 byte to {MaxReferenceBytes >> 20} MB.");

        var expected = name + TunedSuffix;

        using var form = new MultipartFormDataContent();
        var audio = new ByteArrayContent(referenceWav);
        audio.Headers.ContentType = new MediaTypeHeaderValue(AiAudioValidator.Wav);
        form.Add(audio, "audio", "reference.wav");
        form.Add(new StringContent(name), "save_voice");

        string? voice;
        try
        {
            using var response = await SendForJsonAsync(
                new HttpRequestMessage(HttpMethod.Post, "../dev/tune") { Content = form }, ct).ConfigureAwait(false);
            voice = response.RootElement.ValueKind == JsonValueKind.Object
                    && response.RootElement.TryGetProperty("voice", out var value)
                    && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
        }
        catch (AiProviderException ex) when (ex.Code == "http-409")
        {
            voice = expected;
        }

        if (!string.Equals(voice, expected, StringComparison.Ordinal))
            throw new AiProviderException("malformed-response", $"'{Id.Value}' kept the voice under a name it was not given.");
        return expected;
    }

    public async Task DeleteTunedVoiceAsync(string voiceId, CancellationToken ct)
    {
        if (!TuneName.IsMatch(voiceId) || !voiceId.EndsWith(TunedSuffix, StringComparison.Ordinal))
            throw new ArgumentException("Not a voice the speech engine tuned.", nameof(voiceId));

        try
        {
            using var _ = await SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"../dev/tune/{voiceId}"), ct)
                .ConfigureAwait(false);
        }
        catch (AiProviderException ex) when (ex.Code == "endpoint-or-model-not-found")
        {
            // Already gone - deleted by hand, or the engine was reinstalled.
        }
    }

    /// <summary>
    /// Reads a voice list in either shape services use: a bare array, or an object with a
    /// <c>voices</c> array of strings or of objects carrying an id.
    /// </summary>
    private static List<string> ReadVoiceNames(JsonElement root)
    {
        var element = root;

        if (root.ValueKind == JsonValueKind.Object)
        {
            if (root.TryGetProperty("voices", out var voices)) element = voices;
            else if (root.TryGetProperty("data", out var data)) element = data;
        }

        if (element.ValueKind != JsonValueKind.Array) return [];

        var names = new List<string>();

        foreach (var item in element.EnumerateArray())
        {
            var name = item.ValueKind switch
            {
                JsonValueKind.String => item.GetString(),
                JsonValueKind.Object => Text(item, "id") ?? Text(item, "name") ?? Text(item, "voice"),
                _ => null
            };

            // A voice id travels back into a request body, and an over-long or control
            // character-bearing one is not a voice.
            if (name is { Length: > 0 and <= 64 } && !name.Any(char.IsControl))
                names.Add(name);
        }

        return names;

        static string? Text(JsonElement element, string property) =>
            element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
    }
}
