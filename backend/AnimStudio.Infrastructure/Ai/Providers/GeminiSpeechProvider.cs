using System.Buffers.Binary;
using System.Globalization;
using System.Text;
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
/// Speech from Google's Gemini TTS models through the native <c>generateContent</c> route.
/// </summary>
/// <remarks>
/// <para>
/// Gemini's OpenAI-compatible endpoint has no <c>/audio/speech</c>, which is why this is not
/// another <see cref="OpenAiCompatibleTtsProvider"/>. It is worth a class of its own because it
/// is the one hosted engine that is free on the AI Studio tier and speaks Hindi well - the
/// language is detected from the text, so there is no language field to send.
/// </para>
/// <para>
/// The voices are Google's catalogue (<c>GET /voices</c>): the 30 classic voices, which speak
/// any language, the larger per-language library, and voices designed from a description in
/// the operator's Google project. Voices replicated from a recording are never offered: they
/// are a real person's voice, and in this studio a person's voice is reached only through
/// their own profile. That profile stays on this machine unless its owner sends it to Google
/// with their spoken consent (<see cref="ReplicateVoiceAsync"/>); the voice Google makes is
/// then spoken only through that profile, as <see cref="AiSpeechRequest.ReplicatedVoiceId"/>.
/// </para>
/// <para>
/// The model answers with headerless 16-bit PCM. It is wrapped in a WAV header here, because
/// this pipeline sizes a scene by reading its narration's length from that header.
/// </para>
/// </remarks>
public sealed partial class GeminiSpeechProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<GeminiSpeechProvider> logger,
    TimeProvider? clock = null)
    : HttpAiProviderBase(id, AiCapability.Speech, clients, secrets, options, logger), IVoiceReplicatingSpeechProvider, IMusicGeneratingProvider,
      IImageReadingProvider
{
    private const string DefaultReadingModel = "gemini-3.8-flash";
    private const int MaxReadImageBytes = 15 * 1024 * 1024;
    private const int MaxReadPromptLength = 8_000;
    private const int MaxReadAnswerLength = 20_000;

    private const string DefaultModel = "gemini-3.8-flash-tts";
    private const string DefaultMusicModel = "lyria-3.5";
    private const string InteractionsRevision = "2026-05-20";
    private const int MaxMusicPromptLength = 2_000;
    private const int MaxAudioBytes = 24 * 1024 * 1024;
    private const int MaxTextLength = 5_000;
    private const int DefaultSampleRate = 24_000;

    /// <summary>A delivery instruction is a short phrase; anything longer is cut, not refused.</summary>
    internal const int MaxStyleLength = 300;

    private const string ClassicGroup = "Gemini - any language";
    private const string DesignedGroup = "Designed voices (your Google project)";

    /// <summary>The catalogue changes when someone designs a voice; an hour is fresh enough.</summary>
    private static readonly TimeSpan CatalogLifetime = TimeSpan.FromHours(1);

    /// <summary>The soonest an unknown voice id may read the catalogue again.</summary>
    private static readonly TimeSpan MinRefreshInterval = TimeSpan.FromMinutes(1);

    private static readonly TimeSpan RetryAfterFailure = TimeSpan.FromMinutes(5);

    private const int CatalogPageSize = 1000;
    private const int MaxCatalogPages = 5;

    /// <summary>
    /// Gemini's classic voices and how each sounds. They speak every language, are offered even
    /// when the catalogue cannot be read, and are sent as a prebuilt voice name.
    /// </summary>
    private static readonly (string Name, string Character)[] ClassicVoices =
    [
        ("Zephyr", "Bright"), ("Puck", "Upbeat"), ("Charon", "Informative"), ("Kore", "Firm"),
        ("Fenrir", "Excitable"), ("Leda", "Youthful"), ("Orus", "Firm"), ("Aoede", "Breezy"),
        ("Callirrhoe", "Easy-going"), ("Autonoe", "Bright"), ("Enceladus", "Breathy"),
        ("Iapetus", "Clear"), ("Umbriel", "Easy-going"), ("Algieba", "Smooth"), ("Despina", "Smooth"),
        ("Erinome", "Clear"), ("Algenib", "Gravelly"), ("Rasalgethi", "Informative"),
        ("Laomedeia", "Upbeat"), ("Achernar", "Soft"), ("Alnilam", "Firm"), ("Schedar", "Even"),
        ("Gacrux", "Mature"), ("Pulcherrima", "Forward"), ("Achird", "Friendly"),
        ("Zubenelgenubi", "Casual"), ("Vindemiatrix", "Gentle"), ("Sadachbia", "Lively"),
        ("Sadaltager", "Knowledgeable"), ("Sulafat", "Warm")
    ];

    /// <summary>A listed voice id must look like one before it is offered or sent back.</summary>
    private static readonly Regex VoiceIdPattern = new(@"^[A-Za-z0-9_\-]{1,64}$", RegexOptions.CultureInvariant);

    /// <summary>A stored replicated voice, as <c>POST /voices</c> names it.</summary>
    internal static readonly Regex ReplicatedVoiceIdPattern = new(@"^voice_[A-Za-z0-9_\-]{1,120}$", RegexOptions.CultureInvariant);

    /// <summary>A dialogue's speaker label is written into the text the model reads, so it is a plain word.</summary>
    private static readonly Regex SpeakerLabelPattern = new(@"^[A-Za-z][A-Za-z0-9]{0,19}$", RegexOptions.CultureInvariant);

    /// <summary>Google refuses a replication sample outside 10-30 s; a WAV is at most this.</summary>
    private const int MaxReplicationAudioBytes = 4 * 1024 * 1024;
    private static readonly TimeSpan ReplicationRetryDelay = TimeSpan.FromSeconds(2);

    private readonly TimeProvider _clock = clock ?? TimeProvider.System;
    private readonly SemaphoreSlim _catalogLock = new(1, 1);
    private Catalog? _catalog;

    /// <summary>When the catalogue last failed to read; only touched under <see cref="_catalogLock"/>.</summary>
    private DateTimeOffset? _failedAt;

    /// <summary>The voices last read from Google, by id, and when.</summary>
    private sealed record Catalog(IReadOnlyList<AiVoice> Voices, IReadOnlySet<string> Ids, DateTimeOffset ReadAt);

    public async Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
        (await CatalogAsync(refresh: false, ct).ConfigureAwait(false)).Voices;

    /// <summary>The native API takes its key in a header, not as a bearer token.</summary>
    protected override void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Add("x-goog-api-key", secret);

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

        // A voice id travels into the request body; only one Google offered is sent - or a voice
        // replicated from the user's own, which only the server sets, from a profile it checked.
        object speechConfig;
        if (request.Speakers is { Count: > 0 } speakers)
        {
            if (speakers.Count != 2 || speakers.Any(s => !SpeakerLabelPattern.IsMatch(s.Label))
                || string.Equals(speakers[0].Label, speakers[1].Label, StringComparison.OrdinalIgnoreCase))
            {
                throw new AiProviderException("speakers-invalid", "A Gemini dialogue takes exactly two speakers with different plain labels.");
            }

            var configs = new List<object>(2);
            foreach (var speaker in speakers)
            {
                configs.Add(new
                {
                    speaker = speaker.Label,
                    voiceConfig = await VoiceConfigAsync(speaker.VoiceId, speaker.ReplicatedVoiceId, ct).ConfigureAwait(false)
                });
            }

            speechConfig = new { multiSpeakerVoiceConfig = new { speakerVoiceConfigs = configs } };
        }
        else
        {
            speechConfig = new { voiceConfig = await VoiceConfigAsync(request.VoiceId, request.ReplicatedVoiceId, ct).ConfigureAwait(false) };
        }

        // The model is part of the request path, so it is validated like one.
        var model = !string.IsNullOrWhiteSpace(request.Model) ? request.Model.Trim()
            : string.IsNullOrWhiteSpace(Model) ? DefaultModel : Model.Trim();
        if (!IsSafePathValue(model, allowSlashes: false))
            throw new AiProviderException("endpoint-rejected", $"'{Id.Value}' has a model name that cannot be used in a URL.");

        var style = DeliveryOf(request.Style, request.Rate);
        var parts = new List<Dictionary<string, object>>();
        if (request.Speakers is { Count: > 0 } turnSpeakers)
        {
            // Gemini 3.8 reads text as a verbatim transcript: each turn is its own part, its speaker named in the metadata.
            var turns = text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            for (var turn = 0; turn < turns.Length; turn++)
            {
                var line = turns[turn];
                var colon = line.IndexOf(':');
                var label = colon > 0 ? line[..colon] : null;
                var words = colon > 0 ? line[(colon + 1)..].Trim() : string.Empty;
                if (label is null || words.Length == 0 || !turnSpeakers.Any(s => string.Equals(s.Label, label, StringComparison.Ordinal)))
                    throw new AiProviderException("speakers-invalid", "Each line of a Gemini dialogue starts with one of its speakers' labels.");

                // The line's own delivery (its emotion) when the caller gave one, else the request's.
                var turnStyle = request.LineStyles is { } lineStyles && turn < lineStyles.Count && !string.IsNullOrWhiteSpace(lineStyles[turn])
                    ? DeliveryOf(lineStyles[turn], request.Rate)
                    : style;
                var metadata = new Dictionary<string, object> { ["speaker"] = label };
                if (turnStyle is not null) metadata["style"] = turnStyle;
                parts.Add(new Dictionary<string, object> { ["text"] = words, ["speechMetadata"] = metadata });
            }
        }
        else
        {
            var part = new Dictionary<string, object> { ["text"] = text };
            if (style is not null)
                part["speechMetadata"] = new { style };
            parts.Add(part);
        }

        var body = new
        {
            contents = new[] { new { parts } },
            generationConfig = new
            {
                responseModalities = new[] { "AUDIO" },
                speechConfig
            }
        };

        using var response = await PostJsonAsync($"models/{model}:generateContent", body, ct).ConfigureAwait(false);

        var (data, mimeType) = ReadInlineAudio(response.RootElement)
            ?? throw new AiProviderException("empty-response", $"'{Id.Value}' returned no audio.");

        byte[] pcm;
        try
        {
            pcm = Convert.FromBase64String(data);
        }
        catch (FormatException ex)
        {
            throw new AiProviderException("malformed-response", $"'{Id.Value}' returned audio that is not base64.", ex);
        }

        if (pcm.Length > MaxAudioBytes)
        {
            throw new AiProviderException("response-too-large",
                $"'{Id.Value}' returned more than the {MaxAudioBytes} bytes allowed.");
        }

        // Already a container (a future default, or a configured format) - kept as it is.
        var bytes = AiAudioValidator.Sniff(pcm) is null ? WrapPcmAsWav(pcm, SampleRate(mimeType)) : pcm;

        var sniffed = AiAudioValidator.Require(bytes, Id.Value);

        return new AiSpeechResult(bytes, sniffed, AiAudioValidator.TryGetDuration(bytes, sniffed), new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Speech,
            Model = model,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    /// <summary>
    /// <c>POST /voices</c> with a replicated voice, stored in the operator's Google project (Google
    /// keeps it for a year). Google checks that the consent recording is the same speaker reading
    /// its consent statement, and refuses with 400 otherwise.
    /// </summary>
    public async Task<string> ReplicateVoiceAsync(byte[] sampleWav, byte[] consentWav, string displayName, CancellationToken ct)
    {
        if (AiAudioValidator.Sniff(sampleWav) != AiAudioValidator.Wav || AiAudioValidator.Sniff(consentWav) != AiAudioValidator.Wav)
            throw new AiProviderException("bad-request", "The sample and the consent recording must be WAV.");
        if (sampleWav.Length > MaxReplicationAudioBytes || consentWav.Length > MaxReplicationAudioBytes)
            throw new AiProviderException("request-too-large", "The sample or the consent recording is too long.");

        var model = string.IsNullOrWhiteSpace(Model) ? DefaultModel : Model.Trim();
        var name = Clip(new string([.. (displayName ?? string.Empty).Where(c => !char.IsControl(c))]), 60) ?? "My voice";

        var body = new Dictionary<string, object>
        {
            ["store"] = true,
            ["voice"] = new Dictionary<string, object>
            {
                ["model"] = model,
                ["type"] = "replicated",
                ["display_name"] = name,
                ["replicated"] = new Dictionary<string, object>
                {
                    ["source_audio"] = new Dictionary<string, string>
                    {
                        ["mime_type"] = "audio/wav", ["data"] = Convert.ToBase64String(sampleWav)
                    },
                    ["consent_audio"] = new Dictionary<string, string>
                    {
                        ["mime_type"] = "audio/wav", ["data"] = Convert.ToBase64String(consentWav)
                    }
                }
            }
        };

        // Google's voice service sometimes fails with a 5xx that a second try gets past.
        JsonDocument response;
        try
        {
            response = await PostJsonAsync("voices", body, ct).ConfigureAwait(false);
        }
        catch (AiProviderException ex) when (ex.Code == "provider-error")
        {
            await Task.Delay(ReplicationRetryDelay, _clock, ct).ConfigureAwait(false);
            response = await PostJsonAsync("voices", body, ct).ConfigureAwait(false);
        }

        using var _ = response;
        var root = response.RootElement;

        // The id, or a resource name such as "voices/voice_…", at the top or under "voice".
        var voiceId = StringOf(root, "id", "id")
            ?? (Property(root, "voice", "voice") is { ValueKind: JsonValueKind.Object } nested ? StringOf(nested, "id", "id") : null);
        if (voiceId is null && StringOf(root, "name", "name") is { } resource && resource.StartsWith("voices/", StringComparison.Ordinal))
            voiceId = resource["voices/".Length..];
        if (voiceId is null || !ReplicatedVoiceIdPattern.IsMatch(voiceId))
            throw new AiProviderException("malformed-response", $"'{Id.Value}' did not return a voice id.");

        return voiceId;
    }

    public async Task DeleteReplicatedVoiceAsync(string voiceId, CancellationToken ct)
    {
        if (!ReplicatedVoiceIdPattern.IsMatch(voiceId))
            throw new ArgumentException("Not a replicated voice id.", nameof(voiceId));

        try
        {
            using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"voices/{voiceId}"), ct)
                .ConfigureAwait(false);
        }
        catch (AiProviderException ex) when (ex.Code == "endpoint-or-model-not-found")
        {
            // Already gone - expired after its year, or deleted in AI Studio.
        }
    }

    /// <summary>
    /// <c>POST /interactions</c> with a Lyria model: the track comes back as base64 audio in the interaction's steps,
    /// next to text describing its structure, which is not kept.
    /// </summary>
    public async Task<AiGeneratedMusic> GenerateMusicAsync(string prompt, string? model, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(prompt) || prompt.Length > MaxMusicPromptLength)
            throw new AiProviderException("bad-request", "The music description is empty or too long.");

        model = string.IsNullOrWhiteSpace(model) ? DefaultMusicModel : model.Trim();
        if (!IsSafePathValue(model, allowSlashes: false, maxLength: 64))
            throw new AiProviderException("bad-request", "That music model name can't be used.");

        var request = JsonRequest(HttpMethod.Post, "interactions", new Dictionary<string, object>
        {
            ["model"] = model,
            ["input"] = prompt
        });
        request.Headers.Add("Api-Revision", InteractionsRevision);

        using var response = await SendForJsonAsync(request, ct).ConfigureAwait(false);
        var data = FindAudio(response.RootElement, depth: 0)
            ?? throw new AiProviderException("empty-response", $"'{Id.Value}' returned no music.");

        byte[] audio;
        try
        {
            audio = Convert.FromBase64String(data);
        }
        catch (FormatException ex)
        {
            throw new AiProviderException("malformed-response", $"'{Id.Value}' returned music that is not base64.", ex);
        }

        if (audio.Length > MaxAudioBytes)
            throw new AiProviderException("response-too-large", $"'{Id.Value}' returned more than the {MaxAudioBytes} bytes allowed.");

        var sniffed = AiAudioValidator.Sniff(audio);
        if (sniffed is not (AiAudioValidator.Mp3 or AiAudioValidator.Wav))
            throw new AiProviderException("malformed-response", $"'{Id.Value}' returned music in a format that can't be used.");

        return new AiGeneratedMusic(audio, sniffed, model);
    }

    /// <summary>
    /// <c>generateContent</c> with the picture inline and a JSON answer asked for. The answer's text parts are joined and
    /// returned as they are; nothing here trusts them.
    /// </summary>
    public async Task<string> ReadImageAsync(byte[] image, string mimeType, string prompt, string? model, CancellationToken ct)
    {
        if (image is not { Length: > 0 } || image.Length > MaxReadImageBytes)
            throw new AiProviderException("bad-request", "The picture is empty or too large to read.");
        if (mimeType is not ("image/png" or "image/jpeg" or "image/webp"))
            throw new AiProviderException("bad-request", "Only PNG, JPEG and WebP pictures can be read.");
        if (string.IsNullOrWhiteSpace(prompt) || prompt.Length > MaxReadPromptLength)
            throw new AiProviderException("bad-request", "The question about the picture is empty or too long.");

        model = string.IsNullOrWhiteSpace(model) ? DefaultReadingModel : model.Trim();
        if (!IsSafePathValue(model, allowSlashes: false, maxLength: 64))
            throw new AiProviderException("bad-request", "That model name can't be used.");

        var body = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { inline_data = new { mime_type = mimeType, data = Convert.ToBase64String(image) } },
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new { responseMimeType = "application/json", temperature = 0 }
        };

        using var response = await PostJsonAsync($"models/{model}:generateContent", body, ct).ConfigureAwait(false);

        var answer = new StringBuilder();
        if (response.RootElement.TryGetProperty("candidates", out var candidates) && candidates.ValueKind == JsonValueKind.Array
            && candidates.GetArrayLength() > 0
            && candidates[0].TryGetProperty("content", out var content)
            && content.TryGetProperty("parts", out var parts) && parts.ValueKind == JsonValueKind.Array)
        {
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String)
                    answer.Append(text.GetString());
            }
        }

        if (answer.Length == 0)
            throw new AiProviderException("empty-response", $"'{Id.Value}' said nothing about the picture.");
        if (answer.Length > MaxReadAnswerLength)
            throw new AiProviderException("response-too-large", $"'{Id.Value}' said more about the picture than is allowed.");
        return answer.ToString();
    }

    /// <summary>The first <c>{"type":"audio","data":"…"}</c> block, wherever the revision of the API nests it.</summary>
    private static string? FindAudio(JsonElement element, int depth)
    {
        if (depth > 8) return null;

        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.String
                    && type.GetString() == "audio"
                    && element.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.String)
                {
                    return data.GetString();
                }

                foreach (var property in element.EnumerateObject())
                {
                    if (FindAudio(property.Value, depth + 1) is { } found) return found;
                }

                return null;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    if (FindAudio(item, depth + 1) is { } found) return found;
                }

                return null;

            default:
                return null;
        }
    }

    /// <summary>
    /// The <c>voiceConfig</c> for a voice Google offers, or null. A classic voice goes as a
    /// prebuilt name; a library or designed voice as its id. A voice not seen in the last
    /// catalogue may be new, so the catalogue is read again once before it is refused.
    /// </summary>
    /// <summary>A voice replicated from the user's own when one is given, else one of Google's voices.</summary>
    private async Task<object> VoiceConfigAsync(string? voiceId, string? replicatedVoiceId, CancellationToken ct)
    {
        if (replicatedVoiceId is { } replicated)
        {
            if (!ReplicatedVoiceIdPattern.IsMatch(replicated))
                throw new AiProviderException("voice-required", "That is not a voice Google replicated.");
            return new { voice = replicated };
        }

        return await VoiceConfigAsync(voiceId, ct).ConfigureAwait(false)
            ?? throw new AiProviderException("voice-required", $"'{voiceId}' is not a Gemini voice.");
    }

    private async Task<object?> VoiceConfigAsync(string? voiceId, CancellationToken ct)
    {
        var requested = voiceId?.Trim() ?? string.Empty;

        var classic = ClassicVoices.FirstOrDefault(v => string.Equals(v.Name, requested, StringComparison.OrdinalIgnoreCase)).Name;
        if (classic is not null) return new { prebuiltVoiceConfig = new { voiceName = classic } };

        if (!VoiceIdPattern.IsMatch(requested)) return null;

        var catalog = await CatalogAsync(refresh: false, ct).ConfigureAwait(false);
        // Throttled, so a run of unknown ids cannot turn every line into a catalogue read.
        if (!catalog.Ids.Contains(requested) && _clock.GetUtcNow() - catalog.ReadAt >= MinRefreshInterval)
            catalog = await CatalogAsync(refresh: true, ct).ConfigureAwait(false);

        return catalog.Ids.Contains(requested) ? new { voice = requested } : null;
    }

    /// <summary>
    /// The voices to offer: Google's catalogue when it can be read, else the last one read, else
    /// the classic voices. After a failed read the next try waits a little, so a key that is
    /// wrong or a service that is down is not asked again by every line.
    /// </summary>
    private async Task<Catalog> CatalogAsync(bool refresh, CancellationToken ct)
    {
        var now = _clock.GetUtcNow();
        if (!refresh && _catalog is { } fresh && now - fresh.ReadAt < CatalogLifetime) return fresh;

        await _catalogLock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            // Another caller may have read it while this one waited.
            if (_catalog is { } read && (refresh ? read.ReadAt > now : now - read.ReadAt < CatalogLifetime)) return read;
            if (_failedAt is { } failed && now - failed < RetryAfterFailure) return _catalog ?? ClassicOnly();

            var listed = await ReadCatalogAsync(ct).ConfigureAwait(false);
            if (listed is null)
            {
                _failedAt = _clock.GetUtcNow();
                return _catalog ?? ClassicOnly();
            }

            _failedAt = null;
            var voices = MergeWithClassic(listed);
            _catalog = new Catalog(
                voices,
                new HashSet<string>(voices.Select(v => v.VoiceId), StringComparer.Ordinal),
                _clock.GetUtcNow());
            return _catalog;
        }
        finally
        {
            _catalogLock.Release();
        }
    }

    private static Catalog ClassicOnly()
    {
        var voices = ClassicVoices.Select(Classic).ToList();
        return new Catalog(voices, new HashSet<string>(voices.Select(v => v.VoiceId), StringComparer.Ordinal), DateTimeOffset.MinValue);
    }

    private static AiVoice Classic((string Name, string Character) v) =>
        new(v.Name, $"{v.Name} - {v.Character}", null, null, ClassicGroup);

    /// <summary>Designed voices first, then the classic voices, then the per-language library.</summary>
    private static List<AiVoice> MergeWithClassic(List<AiVoice> listed)
    {
        var classicNames = new HashSet<string>(ClassicVoices.Select(v => v.Name), StringComparer.OrdinalIgnoreCase);

        return
        [
            .. listed.Where(v => v.Group == DesignedGroup),
            .. ClassicVoices.Select(Classic),
            .. listed.Where(v => v.Group != DesignedGroup && !classicNames.Contains(v.VoiceId))
        ];
    }

    /// <summary>Every page of <c>GET /voices</c>, or null when it cannot be read.</summary>
    private async Task<List<AiVoice>?> ReadCatalogAsync(CancellationToken ct)
    {
        var voices = new List<AiVoice>();
        string? pageToken = null;

        try
        {
            for (var page = 0; page < MaxCatalogPages; page++)
            {
                var url = $"voices?page_size={CatalogPageSize}" +
                          (pageToken is null ? string.Empty : $"&page_token={Uri.EscapeDataString(pageToken)}");

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                using var response = await SendForJsonAsync(request, ct).ConfigureAwait(false);
                var root = response.RootElement;

                if (Property(root, "voices", "voices") is { ValueKind: JsonValueKind.Array } list)
                {
                    foreach (var entry in list.EnumerateArray())
                    {
                        if (ToVoice(entry) is { } voice) voices.Add(voice);
                    }
                }

                pageToken = StringOf(root, "next_page_token", "nextPageToken");
                if (string.IsNullOrEmpty(pageToken)) break;
            }
        }
        catch (AiProviderException ex)
        {
            Logger.LogInformation(
                "AI provider {ProviderId} could not list Google's voice catalogue ({Code}); offering the classic voices.",
                Id.Value, ex.Code);
            return null;
        }

        return voices;
    }

    /// <summary>
    /// One catalogue entry as a voice to offer, or null for one that is not offered: a
    /// replicated voice, or an entry whose id does not look like a voice id.
    /// </summary>
    private static AiVoice? ToVoice(JsonElement entry)
    {
        if (entry.ValueKind != JsonValueKind.Object) return null;

        var id = StringOf(entry, "id", "id");
        if (id is null || !VoiceIdPattern.IsMatch(id)) return null;

        var type = StringOf(entry, "type", "type")?.ToLowerInvariant();
        var name = Clip(StringOf(entry, "display_name", "displayName"), 60) ?? id;
        var description = Clip(StringOf(entry, "description", "description"), 60);
        var gender = StringOf(entry, "gender", "gender")?.ToLowerInvariant() switch
        {
            "female" => "female",
            "male" => "male",
            "neutral" => "neutral",
            _ => null
        };

        switch (type)
        {
            case "prompted":
                return new AiVoice(id, description is null ? name : $"{name} - {description}", null, gender, DesignedGroup);
            case "prebuilt":
            {
                var language = StringOf(entry, "language_code", "languageCode");
                if (language is not null && !Regex.IsMatch(language, "^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$"))
                    language = null;
                return new AiVoice(id, description is null ? name : $"{name} - {description}", language, gender,
                    language is null ? ClassicGroup : null);
            }
            default:
                // "replicated", or a kind this code does not know: never offered.
                return null;
        }
    }

    /// <summary>
    /// The delivery instruction: the caller's style, plus the pace, since this engine has no
    /// speed setting. Control characters are dropped and the length capped - the style is
    /// user text headed for a model, and is sent only in the field meant for it.
    /// </summary>
    internal static string? DeliveryOf(string? style, double rate)
    {
        var parts = new List<string>(2);

        if (!string.IsNullOrWhiteSpace(style))
        {
            var clean = new StringBuilder(style.Length);
            foreach (var c in style.Trim())
                clean.Append(char.IsControl(c) ? ' ' : c);
            parts.Add(Clip(clean.ToString(), MaxStyleLength)!);
        }

        if (rate > 0 && Math.Abs(rate - 1.0) >= 0.05)
        {
            var pace = rate.ToString("0.##", CultureInfo.InvariantCulture);
            parts.Add(rate > 1
                ? $"speak faster than normal, at about {pace}x pace"
                : $"speak slower than normal, at about {pace}x pace");
        }

        return parts.Count == 0 ? null : string.Join("; ", parts);
    }

    private static string? Clip(string? value, int max)
    {
        value = value?.Trim();
        if (string.IsNullOrEmpty(value)) return null;
        return value.Length <= max ? value : value[..max].TrimEnd();
    }

    /// <summary>A property in either casing: Google's REST answers in one, its docs show the other.</summary>
    private static JsonElement? Property(JsonElement element, string snake, string camel) =>
        element.ValueKind == JsonValueKind.Object &&
        (element.TryGetProperty(snake, out var value) || element.TryGetProperty(camel, out value))
            ? value
            : null;

    private static string? StringOf(JsonElement element, string snake, string camel) =>
        Property(element, snake, camel) is { ValueKind: JsonValueKind.String } value ? value.GetString() : null;

    /// <summary>The first inline audio part of the first candidate, in either casing.</summary>
    private static (string Data, string? MimeType)? ReadInlineAudio(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) ||
            candidates.ValueKind != JsonValueKind.Array ||
            candidates.GetArrayLength() == 0 ||
            !candidates[0].TryGetProperty("content", out var content) ||
            !content.TryGetProperty("parts", out var parts) ||
            parts.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var part in parts.EnumerateArray())
        {
            if (part.ValueKind != JsonValueKind.Object) continue;

            if (Property(part, "inline_data", "inlineData") is not { } inline) continue;

            if (StringOf(inline, "data", "data") is { Length: > 0 } value)
                return (value, StringOf(inline, "mime_type", "mimeType"));
        }

        return null;
    }

    /// <summary>Reads <c>rate=24000</c> out of a mime type such as <c>audio/L16;codec=pcm;rate=24000</c>.</summary>
    private static int SampleRate(string? mimeType)
    {
        foreach (var parameter in (mimeType ?? string.Empty).Split(';'))
        {
            var pair = parameter.Split('=', 2, StringSplitOptions.TrimEntries);

            if (pair.Length == 2 &&
                string.Equals(pair[0], "rate", StringComparison.OrdinalIgnoreCase) &&
                int.TryParse(pair[1], out var rate) &&
                rate is >= 8_000 and <= 48_000)
            {
                return rate;
            }
        }

        return DefaultSampleRate;
    }

    /// <summary>A 44-byte RIFF header for mono 16-bit little-endian PCM, followed by the samples.</summary>
    internal static byte[] WrapPcmAsWav(byte[] pcm, int sampleRate)
    {
        const short channels = 1;
        const short bitsPerSample = 16;
        const short blockAlign = channels * bitsPerSample / 8;

        var wav = new byte[44 + pcm.Length];
        var span = wav.AsSpan();

        "RIFF"u8.CopyTo(span);
        BinaryPrimitives.WriteInt32LittleEndian(span[4..], 36 + pcm.Length);
        "WAVE"u8.CopyTo(span[8..]);
        "fmt "u8.CopyTo(span[12..]);
        BinaryPrimitives.WriteInt32LittleEndian(span[16..], 16);
        BinaryPrimitives.WriteInt16LittleEndian(span[20..], 1);
        BinaryPrimitives.WriteInt16LittleEndian(span[22..], channels);
        BinaryPrimitives.WriteInt32LittleEndian(span[24..], sampleRate);
        BinaryPrimitives.WriteInt32LittleEndian(span[28..], sampleRate * blockAlign);
        BinaryPrimitives.WriteInt16LittleEndian(span[32..], blockAlign);
        BinaryPrimitives.WriteInt16LittleEndian(span[34..], bitsPerSample);
        "data"u8.CopyTo(span[36..]);
        BinaryPrimitives.WriteInt32LittleEndian(span[40..], pcm.Length);
        pcm.CopyTo(span[44..]);

        return wav;
    }
}
