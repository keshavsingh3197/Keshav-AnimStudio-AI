using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Voices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Voiceover from a script: one line of text becomes a spoken audio asset in the project's
/// library, ready to drop on the A1 track. The speech comes from whichever speech provider
/// the <c>Ai:Chains:Speech</c> chain has enabled (Kokoro, Piper, ...). A line in one of the
/// user's own voices is spoken by the engine's voice tuned from their sample when it is English
/// and the engine can tune one; otherwise it is re-voiced from the sample by the AI voice converter.
/// </summary>
[ApiController]
public sealed class VoiceoverController(
    IAiExecutor ai,
    IAiProviderRegistry registry,
    IAssetRepository assets,
    IProjectRepository projects,
    IVoiceProfileRepository myVoices,
    IStudioVoiceRenderer voiceRenderer,
    MyVoiceTuning tuning,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    IOptionsMonitor<AiOptions> aiOptions,
    ILogger<VoiceoverController> logger) : ControllerBase
{
    /// <summary>A long paragraph; a whole script is sent line by line.</summary>
    public const int MaxTextChars = 2000;

    /// <summary>The same ceiling an uploaded voice recording gets.</summary>
    private const long MaxAudioBytes = AssetsController.MaxUploadBytes;

    private const double MinRate = 0.5;
    private const double MaxRate = 2.0;

    /// <summary>Marks a library file as made here, so the same line is not saved twice.</summary>
    private const string VoiceoverSource = "voiceover";

    /// <summary>Lines kept per voice; the oldest are deleted beyond this.</summary>
    private const int MaxCachedLinesPerVoice = 400;

    /// <summary>A provider voice id, or a Kokoro blend such as <c>af_bella+af_sky</c>.</summary>
    private static readonly Regex VoiceIdPattern =
        new(@"^[A-Za-z0-9_.+\-]{1,64}$", RegexOptions.CultureInvariant);

    /// <summary>Speech keeps a CPU (or the local TTS server) busy, so only a few run at once.</summary>
    private static readonly SemaphoreSlim Renders = new(3, 3);

    /// <summary>
    /// The voices to pick from. With <paramref name="engine"/>, that engine's own; without, the
    /// first engine that answers - the one a line with no engine named is spoken by.
    /// </summary>
    [HttpGet("api/voiceover/voices")]
    public async Task<ActionResult<ApiResponse<VoiceoverVoicesResponse>>> Voices(
        [FromQuery] string? engine, CancellationToken ct)
    {
        var status = registry.Describe(Domain.Ai.AiCapability.Speech);
        var voices = new List<VoiceoverVoiceResponse>();
        var chain = registry.SpeechChain();
        var engines = chain.Select(EngineResponse).ToList();
        var answered = false;
        string? listedBy = null;

        // An engine that is off or unknown is not an error here: the panel remembers the last
        // one used, and the operator may have turned it off since. The default list is served.
        var chosen = chain.FirstOrDefault(p => string.Equals(p.Id.Value, engine, StringComparison.OrdinalIgnoreCase));
        IEnumerable<ISpeechAiProvider> candidates = chosen is null ? chain : [chosen];

        // The first provider that answers decides the list: it is also the one SpeechAsync
        // will try first, so the ids it offers are the ids that will actually be spoken.
        foreach (var provider in candidates)
        {
            try
            {
                var listed = await provider.ListVoicesAsync(ct);
                answered = true;
                listedBy = provider.Id.Value;
                // Voices tuned from someone's sample are theirs, and reached only through their profile.
                voices.AddRange(listed.Where(v => !MyVoiceTuning.IsTunedVoice(v.VoiceId)).Select(v =>
                    new VoiceoverVoiceResponse(v.VoiceId, v.DisplayName, v.LanguageCode, v.Gender)));
                if (voices.Count > 0) break;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning("Speech provider {Provider} could not list voices: {Error}",
                    provider.Id, ex is AiProviderException typed ? typed.Code : ex.GetType().Name);
            }
        }

        var mine = (await myVoices.ListByUserAsync(currentUser.UserId, ct)).Select(MyVoicesController.ToResponse).ToList();
        var myVoicesAvailable = voiceRenderer.CanReVoice || tuning.CanTune;

        // Configured but not one engine answered: say so now, rather than let every line
        // fail later with a generic "no provider could complete the request".
        if (status.Available && chain.Count > 0 && !answered)
            return Ok(ApiResponse<VoiceoverVoicesResponse>.Ok(new VoiceoverVoicesResponse(
                false, chosen?.Id.Value ?? status.ProviderId, "Unreachable", voices, mine, myVoicesAvailable, engines)));

        return Ok(ApiResponse<VoiceoverVoicesResponse>.Ok(new VoiceoverVoicesResponse(
            status.Available, listedBy ?? status.ProviderId, status.Reason.ToString(), voices, mine, myVoicesAvailable, engines)));
    }

    private VoiceoverEngineResponse EngineResponse(ISpeechAiProvider provider)
    {
        var descriptor = KnownAiProviders.Find(provider.Id.Value);
        var configured = aiOptions.CurrentValue.ProviderFor(provider.Id);
        return new VoiceoverEngineResponse(
            provider.Id.Value,
            descriptor?.DisplayName ?? provider.Id.Value,
            configured?.IsLocal ?? descriptor?.RunsLocally ?? false,
            configured?.Model ?? descriptor?.DefaultModel,
            [.. (descriptor?.Models ?? []).Select(m => new VoiceoverModelResponse(m.Id, m.Label))]);
    }

    /// <summary>
    /// Speaks one line and returns the audio without saving anything, so the script can be
    /// heard (alone or against the clips) before any of it lands in the library or on A1.
    /// The speech is cached by text, voice and speed, so applying it afterwards is not a
    /// second synthesis.
    /// </summary>
    [HttpPost("api/projects/{projectId}/voiceover/preview")]
    public async Task<IActionResult> Preview(
        string projectId, [FromBody] VoiceoverRequest? body, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var line = await ParseAsync(body, ct);
        if (line.Failure is not null) return line.Failure;

        var spoken = await SpeakAsync(projectId, line, ct);
        if (spoken.Failure is not null) return spoken.Failure;

        return File(spoken.Content!, spoken.MimeType!);
    }

    /// <summary>
    /// Saves one spoken line to the library. Applying the same line again (same text, voice
    /// and speed) returns the file already saved instead of adding a duplicate.
    /// </summary>
    [HttpPost("api/projects/{projectId}/voiceover")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Generate(
        string projectId, [FromBody] VoiceoverRequest? body, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var line = await ParseAsync(body, ct);
        if (line.Failure is not null) return line.Failure;

        var existing = (await assets.ListByProjectAsync(projectId, ct)).FirstOrDefault(a =>
            a.Kind == AssetKind.Audio
            && a.Provenance is { SourceProvider: VoiceoverSource } p
            && string.Equals(p.ExternalId, line.Fingerprint, StringComparison.Ordinal));
        if (existing is not null)
            return Ok(ApiResponse<AssetResponse>.Ok(existing.ToResponse()));

        var spoken = await SpeakAsync(projectId, line, ct);
        if (spoken.Failure is not null) return spoken.Failure;

        var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}{spoken.Extension}";
        await using (var content = new MemoryStream(spoken.Content!, writable: false))
        {
            await store.SaveAsync(storageKey, content, spoken.MimeType!, ct);
        }

        var displayName = UploadValidator.SanitizeDisplayName(
            $"{NameFor(body!.Name, line.Text!)}{spoken.Extension}");
        var now = clock.GetUtcNow().UtcDateTime;

        var asset = new Asset
        {
            ProjectId = projectId,
            Name = displayName,
            DisplayFileName = displayName,
            StorageKey = storageKey,
            Kind = AssetKind.Audio,
            MimeType = spoken.MimeType!,
            FileSizeBytes = spoken.Content!.LongLength,
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            Provenance = new AssetProvenance
            {
                SourceProvider = VoiceoverSource,
                ExternalId = line.Fingerprint,
                FetchedAtUtc = now,
                FetchedByUserId = currentUser.UserId
            },
            CreatedAt = now
        };
        asset.Probe = await probe.ProbeAsync(storageKey, ct);

        await assets.InsertAsync(asset, ct);

        // The script itself is never logged: it can be personal data.
        logger.LogInformation("Voiceover asset {AssetId} made for project {ProjectId} by {Provider}",
            asset.Id, projectId, spoken.ProviderId);

        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    /// <summary>A checked request: what to say, in which voice, and - for a line in one of the user's voices - whose.</summary>
    private sealed record Line(
        ObjectResult? Failure, string? Text = null, string? VoiceId = null, double Rate = 1.0,
        VoiceProfile? MyVoice = null, string? Fingerprint = null, string? Engine = null, string? Model = null);

    private sealed record Spoken(
        ObjectResult? Failure, byte[]? Content = null, string? MimeType = null,
        string? Extension = null, string? ProviderId = null);

    private async Task<Line> ParseAsync(VoiceoverRequest? body, CancellationToken ct)
    {
        var text = body?.Text?.Trim() ?? string.Empty;
        if (text.Length == 0)
            return new(Fail(StatusCodes.Status400BadRequest, "text-required", "Write the line to speak.", "text"));
        if (text.Length > MaxTextChars)
            return new(Fail(StatusCodes.Status400BadRequest, "text-too-long",
                $"A line can be at most {MaxTextChars} characters. Split it into shorter lines.", "text"));

        var voiceId = body!.VoiceId?.Trim() ?? string.Empty;
        if (!VoiceIdPattern.IsMatch(voiceId) || MyVoiceTuning.IsTunedVoice(voiceId))
            return new(Fail(StatusCodes.Status400BadRequest, "voice-invalid", "Pick a voice.", "voiceId"));

        var rate = body.Rate ?? 1.0;
        if (double.IsNaN(rate) || rate < MinRate || rate > MaxRate)
            return new(Fail(StatusCodes.Status400BadRequest, "rate-invalid",
                $"Speed must be between {MinRate} and {MaxRate}.", "rate"));

        VoiceProfile? mine = null;
        if (!string.IsNullOrEmpty(body.MyVoiceId))
        {
            if (!MyVoicesController.IdPattern.IsMatch(body.MyVoiceId))
                return new(Fail(StatusCodes.Status400BadRequest, "my-voice-invalid", "Pick one of your voices.", "myVoiceId"));
            mine = await myVoices.GetAsync(body.MyVoiceId, ct) ?? throw new KeyNotFoundException();
            if (!string.Equals(mine.UserId, currentUser.UserId, StringComparison.Ordinal))
            {
                logger.LogWarning("User {UserId} asked for voice {VoiceId}, which is not theirs.", currentUser.UserId, mine.Id);
                throw new UnauthorizedAccessException();
            }
        }

        // A line in the user's own voice is made on this machine whatever engine is picked:
        // the recording behind it is never sent to a hosted one.
        string? engine = null, model = null;
        if (mine is null)
        {
            var choice = CheckEngine(body.Engine, body.Model);
            if (choice.Failure is not null) return new(choice.Failure);
            (engine, model) = (choice.Engine, choice.Model);
        }

        // The tuned voice is part of it: a line it spoke is not the line the converter made.
        // So is the engine and model: the same words in Kokoro's "Kore" are not Gemini's.
        var fingerprint = Sha256Hex(string.Join('\n',
            text, voiceId, rate.ToString("R", CultureInfo.InvariantCulture), mine?.Id, mine?.StorageKey, mine?.TunedVoiceId,
            mine is null ? null : MyVoiceTuning.Revision, engine, model));
        return new(null, text, voiceId, rate, mine, fingerprint, engine, model);
    }

    /// <summary>
    /// An engine that is on and answering, and a model it offers (or its configured one). Both
    /// are client input headed for a provider call, so each is matched against what exists.
    /// </summary>
    private (ObjectResult? Failure, string? Engine, string? Model) CheckEngine(string? engine, string? model)
    {
        engine = string.IsNullOrWhiteSpace(engine) ? null : engine.Trim();
        model = string.IsNullOrWhiteSpace(model) ? null : model.Trim();
        if (engine is null)
            return model is null
                ? (null, null, null)
                : (Fail(StatusCodes.Status400BadRequest, "model-invalid", "Pick a speech engine before a model.", "model"), null, null);

        var provider = registry.SpeechChain().FirstOrDefault(p =>
            string.Equals(p.Id.Value, engine, StringComparison.OrdinalIgnoreCase));
        if (provider is null)
            return (Fail(StatusCodes.Status503ServiceUnavailable, "engine-unavailable",
                "That speech engine is turned off, or is being skipped for a couple of minutes after failing. " +
                "Pick another engine, or reopen this panel to see which are on."), null, null);

        if (model is not null)
        {
            var descriptor = KnownAiProviders.Find(provider.Id.Value);
            var configured = aiOptions.CurrentValue.ProviderFor(provider.Id)?.Model;
            if (descriptor is null || !descriptor.Allows(model, configured))
                return (Fail(StatusCodes.Status400BadRequest, "model-invalid",
                    "That model isn't one this speech engine offers.", "model"), null, null);
        }

        return (null, provider.Id.Value, model);
    }

    /// <summary>
    /// Speaks a checked line - in the user's tuned voice when there is one for it, else in the
    /// stock voice and then re-voiced - and checks what came back is usable audio.
    /// </summary>
    private async Task<Spoken> SpeakAsync(string projectId, Line line, CancellationToken ct)
    {
        var tunedVoice = line.MyVoice is { } mine ? await tuning.VoiceForAsync(mine, line.VoiceId!, ct) : null;
        if (line.MyVoice is not null && tunedVoice is null && !voiceRenderer.CanReVoice)
            return new(Fail(StatusCodes.Status503ServiceUnavailable, "my-voice-unavailable",
                @"Your own voices need Kokoro with voice tuning (start it with scripts\setup-voiceover.ps1), " +
                @"or the AI voice converter for any language (install it once with scripts\setup-voice-ai.ps1, then restart the API)."));

        var reVoice = line.MyVoice is not null && tunedVoice is null;
        AiOutcome<AiSpeechResult>? outcome = null;
        if (tunedVoice is not null)
        {
            outcome = await SynthesizeAsync(projectId, line, tunedVoice, ct, MyVoiceTuning.LanguageOf(line.VoiceId!));
            if (outcome is null) return new(Busy());
            if (!outcome.IsSuccess && voiceRenderer.CanReVoice)
            {
                // The engine lost the voice or is down: the converter can still make the line.
                logger.LogWarning("The tuned voice of {VoiceId} could not speak a line ({Code}); re-voicing instead.",
                    line.MyVoice!.Id, outcome.ErrorCode);
                outcome = null;
                reVoice = true;
            }
        }

        outcome ??= await SynthesizeAsync(projectId, line, line.VoiceId!, ct);
        if (outcome is null) return new(Busy());

        if (outcome.Kind == AiOutcomeKind.Unavailable && line.Engine is not null)
            return new(Fail(StatusCodes.Status503ServiceUnavailable, "engine-unavailable",
                "The chosen speech engine is out of today's allowance, turned off, or being skipped after failing. " +
                "Pick another engine, or try again later."));
        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return new(Fail(StatusCodes.Status503ServiceUnavailable, "voiceover-unavailable",
                "No speech engine is available: it is turned off, or it is being skipped for a couple of minutes " +
                @"after failing repeatedly. Start it with scripts\setup-voiceover.ps1, then try again."));
        if (!outcome.IsSuccess)
            return new(Fail(
                outcome.ErrorCode is "transport-failed" or "timeout"
                    ? StatusCodes.Status503ServiceUnavailable
                    : StatusCodes.Status502BadGateway,
                outcome.ErrorCode ?? "voiceover-failed",
                MessageFor(outcome.ErrorCode)));

        var content = outcome.Value!.Content;
        if (reVoice)
        {
            var revoiced = await ReVoiceAsync(content, line.MyVoice!, line.Fingerprint!, ct);
            if (revoiced.Failure is not null) return new(revoiced.Failure);
            content = revoiced.Content!;
        }

        // Provider output is untrusted: the bytes, not its Content-Type, say what it is, and
        // only formats the upload allowlist admits may become an asset.
        var sniffed = AiAudioValidator.Sniff(content);
        var extension = sniffed switch
        {
            AiAudioValidator.Wav => ".wav",
            AiAudioValidator.Mp3 => ".mp3",
            _ => null
        };
        if (extension is null)
            return new(Fail(StatusCodes.Status502BadGateway, "voiceover-format",
                "The speech engine returned audio in a format the studio can't use (WAV or MP3 needed)."));
        if (content.LongLength > MaxAudioBytes)
            return new(Fail(StatusCodes.Status400BadRequest, "voiceover-too-long",
                "That line makes more than 25MB of audio. Split it into shorter lines."));

        return new(null, content, sniffed, extension, outcome.Value.Provenance.ProviderId);
    }

    /// <summary>Null when the line waited too long for one of the few speech slots.</summary>
    private async Task<AiOutcome<AiSpeechResult>?> SynthesizeAsync(
        string projectId, Line line, string voiceId, CancellationToken ct, string? languageCode = null)
    {
        if (!await Renders.WaitAsync(TimeSpan.FromSeconds(30), ct)) return null;
        try
        {
            return await ai.SpeechAsync(
                new AiSpeechRequest
                {
                    Text = line.Text!, VoiceId = voiceId, Rate = line.Rate, LanguageCode = languageCode,
                    ProviderId = line.Engine, Model = line.Model
                },
                new AiCallContext(projectId, currentUser.UserId), ct);
        }
        finally
        {
            Renders.Release();
        }
    }

    private ObjectResult Busy() =>
        Fail(StatusCodes.Status429TooManyRequests, "voiceover-busy",
            "Other voiceovers are being made right now. Try again in a minute.");

    /// <summary>
    /// The line in the user's own voice. Converting is slow on a CPU, so each result is kept
    /// under the voice and reused - previewing a script and then applying it converts once.
    /// </summary>
    private async Task<(ObjectResult? Failure, byte[]? Content)> ReVoiceAsync(
        byte[] speech, VoiceProfile voice, string fingerprint, CancellationToken ct)
    {
        var cacheKey = $"voice-profiles/{voice.Id}/lines/{fingerprint}.wav";
        await using (var cached = await store.OpenAsync(cacheKey, ct))
        {
            if (cached is not null)
            {
                using var buffer = new MemoryStream();
                await cached.CopyToAsync(buffer, ct);
                return (null, buffer.ToArray());
            }
        }

        byte[] revoiced;
        try
        {
            revoiced = await voiceRenderer.ReVoiceAsync(speech, voice.StorageKey, ct);
        }
        catch (StudioVoiceException ex)
        {
            logger.LogWarning("Re-voicing a line into voice {VoiceId} failed: {Reason}", voice.Id, ex.Message);
            return (Fail(StatusCodes.Status502BadGateway, "my-voice-failed", ex.Message), null);
        }

        await using (var content = new MemoryStream(revoiced, writable: false))
        {
            await store.SaveAsync(cacheKey, content, AiAudioValidator.Wav, ct);
        }

        // Re-read so two lines finishing together don't drop each other's key.
        var fresh = await myVoices.GetAsync(voice.Id, ct);
        if (fresh is null)
        {
            // Deleted while this line was converting: don't leave its voice behind.
            await store.DeleteAsync(cacheKey, ct);
            return (null, revoiced);
        }
        if (!fresh.CachedLineKeys.Contains(cacheKey, StringComparer.Ordinal)) fresh.CachedLineKeys.Add(cacheKey);
        while (fresh.CachedLineKeys.Count > MaxCachedLinesPerVoice)
        {
            await store.DeleteAsync(fresh.CachedLineKeys[0], ct);
            fresh.CachedLineKeys.RemoveAt(0);
        }
        await myVoices.UpsertAsync(fresh, ct);

        return (null, revoiced);
    }

    /// <summary>What the user can do about a failed line, by the provider's error code.</summary>
    private static string MessageFor(string? errorCode) => errorCode switch
    {
        "transport-failed" =>
            @"The speech engine is not running (nothing answered on its address). Start it with scripts\setup-voiceover.ps1, then try again.",
        "timeout" =>
            "The speech engine took too long. The first line after starting it loads the model; try again in a moment.",
        "endpoint-or-model-not-found" =>
            "The speech engine does not know that voice or model. Pick another from the list, or check the model in Settings → AI providers.",
        "voice-required" =>
            "That voice belongs to a different speech engine. Pick a voice from the list for this engine.",
        "credential-rejected" or "credential-missing" =>
            "The speech engine refused its API key. Check the key in Settings → AI providers.",
        "rate-limited" =>
            "The speech engine is getting too many requests right now. Wait a minute and try again.",
        "content-blocked" =>
            "The speech engine declined to speak that line.",
        _ => "The speech engine could not speak that line."
    };

    /// <summary>"VO - " plus the first words of the line, so the library says what each file is.</summary>
    private static string NameFor(string? requested, string text)
    {
        var source = string.IsNullOrWhiteSpace(requested) ? text : requested.Trim();
        var words = string.Join(' ', source.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Take(6));
        if (words.Length > 48) words = words[..48];
        return $"VO - {words}";
    }

    private static string Sha256Hex(string value) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<AssetResponse>.Fail(message, new ApiError(code, message, field)));
}
