using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Voiceover from a script: one line of text becomes a spoken audio asset in the project's
/// library, ready to drop on the A1 track. The speech comes from whichever speech provider
/// the <c>Ai:Chains:Speech</c> chain has enabled (Kokoro, Piper, ...).
/// </summary>
[ApiController]
public sealed class VoiceoverController(
    IAiExecutor ai,
    IAiProviderRegistry registry,
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<VoiceoverController> logger) : ControllerBase
{
    /// <summary>A long paragraph; a whole script is sent line by line.</summary>
    public const int MaxTextChars = 2000;

    /// <summary>The same ceiling an uploaded voice recording gets.</summary>
    private const long MaxAudioBytes = AssetsController.MaxUploadBytes;

    private const double MinRate = 0.5;
    private const double MaxRate = 2.0;

    /// <summary>A provider voice id, or a Kokoro blend such as <c>af_bella+af_sky</c>.</summary>
    private static readonly Regex VoiceIdPattern =
        new(@"^[A-Za-z0-9_.+\-]{1,64}$", RegexOptions.CultureInvariant);

    /// <summary>Speech keeps a CPU (or the local TTS server) busy, so only a few run at once.</summary>
    private static readonly SemaphoreSlim Renders = new(3, 3);

    [HttpGet("api/voiceover/voices")]
    public async Task<ActionResult<ApiResponse<VoiceoverVoicesResponse>>> Voices(CancellationToken ct)
    {
        var status = registry.Describe(Domain.Ai.AiCapability.Speech);
        var voices = new List<VoiceoverVoiceResponse>();

        // The first provider that answers decides the list: it is also the one SpeechAsync
        // will try first, so the ids it offers are the ids that will actually be spoken.
        foreach (var provider in registry.SpeechChain())
        {
            try
            {
                var listed = await provider.ListVoicesAsync(ct);
                voices.AddRange(listed.Select(v =>
                    new VoiceoverVoiceResponse(v.VoiceId, v.DisplayName, v.LanguageCode, v.Gender)));
                if (voices.Count > 0) break;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning("Speech provider {Provider} could not list voices: {Error}",
                    provider.Id, ex.GetType().Name);
            }
        }

        return Ok(ApiResponse<VoiceoverVoicesResponse>.Ok(new VoiceoverVoicesResponse(
            status.Available, status.ProviderId, status.Reason.ToString(), voices)));
    }

    [HttpPost("api/projects/{projectId}/voiceover")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Generate(
        string projectId, [FromBody] VoiceoverRequest? body, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var text = body?.Text?.Trim() ?? string.Empty;
        if (text.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "text-required", "Write the line to speak.", "text");
        if (text.Length > MaxTextChars)
            return Fail(StatusCodes.Status400BadRequest, "text-too-long",
                $"A line can be at most {MaxTextChars} characters. Split it into shorter lines.", "text");

        var voiceId = body!.VoiceId?.Trim() ?? string.Empty;
        if (!VoiceIdPattern.IsMatch(voiceId))
            return Fail(StatusCodes.Status400BadRequest, "voice-invalid", "Pick a voice.", "voiceId");

        var rate = body.Rate ?? 1.0;
        if (double.IsNaN(rate) || rate < MinRate || rate > MaxRate)
            return Fail(StatusCodes.Status400BadRequest, "rate-invalid",
                $"Speed must be between {MinRate} and {MaxRate}.", "rate");

        if (!await Renders.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return Fail(StatusCodes.Status429TooManyRequests, "voiceover-busy",
                "Other voiceovers are being made right now. Try again in a minute.");

        AiOutcome<AiSpeechResult> outcome;
        try
        {
            outcome = await ai.SpeechAsync(
                new AiSpeechRequest { Text = text, VoiceId = voiceId, Rate = rate },
                new AiCallContext(projectId, currentUser.UserId), ct);
        }
        finally
        {
            Renders.Release();
        }

        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "voiceover-unavailable",
                outcome.Message ?? "No speech engine is turned on. Enable Kokoro or Piper under Ai:Providers.");
        if (!outcome.IsSuccess)
            return Fail(StatusCodes.Status502BadGateway, outcome.ErrorCode ?? "voiceover-failed",
                outcome.Message ?? "The speech engine could not speak that line.");

        // Provider output is untrusted: the bytes, not its Content-Type, say what it is, and
        // only formats the upload allowlist admits may become an asset.
        var speech = outcome.Value!;
        var sniffed = AiAudioValidator.Sniff(speech.Content);
        var extension = sniffed switch
        {
            AiAudioValidator.Wav => ".wav",
            AiAudioValidator.Mp3 => ".mp3",
            _ => null
        };
        if (extension is null)
            return Fail(StatusCodes.Status502BadGateway, "voiceover-format",
                "The speech engine returned audio in a format the studio can't use (WAV or MP3 needed).");
        if (speech.Content.LongLength > MaxAudioBytes)
            return Fail(StatusCodes.Status400BadRequest, "voiceover-too-long",
                "That line makes more than 25MB of audio. Split it into shorter lines.");

        var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}{extension}";
        await using (var content = new MemoryStream(speech.Content, writable: false))
        {
            await store.SaveAsync(storageKey, content, sniffed!, ct);
        }

        var displayName = UploadValidator.SanitizeDisplayName(
            $"{NameFor(body.Name, text)}{extension}");

        var asset = new Asset
        {
            ProjectId = projectId,
            Name = displayName,
            DisplayFileName = displayName,
            StorageKey = storageKey,
            Kind = AssetKind.Audio,
            MimeType = sniffed!,
            FileSizeBytes = speech.Content.LongLength,
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };
        asset.Probe = await probe.ProbeAsync(storageKey, ct);

        await assets.InsertAsync(asset, ct);

        // The script itself is never logged: it can be personal data.
        logger.LogInformation("Voiceover asset {AssetId} made for project {ProjectId} by {Provider}",
            asset.Id, projectId, speech.Provenance.ProviderId);

        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    /// <summary>"VO - " plus the first words of the line, so the library says what each file is.</summary>
    private static string NameFor(string? requested, string text)
    {
        var source = string.IsNullOrWhiteSpace(requested) ? text : requested.Trim();
        var words = string.Join(' ', source.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Take(6));
        if (words.Length > 48) words = words[..48];
        return $"VO - {words}";
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<AssetResponse>.Fail(message, new ApiError(code, message, field)));
}
