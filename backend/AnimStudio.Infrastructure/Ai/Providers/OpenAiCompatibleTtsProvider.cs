using System.Text.Json;
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
    : HttpAiProviderBase(id, AiCapability.Speech, clients, secrets, options, logger), ISpeechAiProvider
{
    private const int MaxAudioBytes = 64 * 1024 * 1024;
    private const int MaxTextLength = 8_000;

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
