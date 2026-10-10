using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The user's own narration: a take recorded in the browser is cleaned (rumble, room noise,
/// silence at the ends, uneven level) and saved to the library as a voiceover line, ready for A1.
/// </summary>
[ApiController]
public sealed class NarrationController(
    INarrationCleaner cleaner,
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<NarrationController> logger) : ControllerBase
{
    /// <summary>Five minutes of the 48 kHz mono WAV the panel records, with room to spare.</summary>
    private const long MaxTakeBytes = 32 * 1024 * 1024;

    private const int MaxNameChars = 60;

    /// <summary>Marks a library file as a cleaned narration take.</summary>
    private const string NarrationSource = "narration";

    /// <summary>Cleaning is quick, but a few long takes at once would still crowd the CPU.</summary>
    private static readonly SemaphoreSlim Slots = new(2, 2);

    /// <summary>
    /// Multipart: <c>file</c> is the take as WAV, <c>name</c> (optional) what the library calls it.
    /// Returns the saved asset; placing it on A1 is the caller's, as one Undo step.
    /// </summary>
    [HttpPost("api/projects/{projectId}/voiceover/narration")]
    [RequestSizeLimit(MaxTakeBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxTakeBytes + 64 * 1024)]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Record(
        string projectId, IFormFile? file, [FromForm] string? name, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} tried to add narration to project {ProjectId}, which is not theirs.",
                currentUser.UserId, projectId);
            throw new UnauthorizedAccessException();
        }

        if (!cleaner.IsAvailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "narration-unavailable",
                "Recordings can't be cleaned on this server: ffmpeg isn't available.");
        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Record your narration first.", "file");
        if (file.Length > MaxTakeBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large",
                "That take is too long. Record up to five minutes at a time.", "file");

        var label = (name ?? string.Empty).Trim();
        if (label.Length > MaxNameChars || label.Any(char.IsControl))
            return Fail(StatusCodes.Status400BadRequest, "name-invalid", $"A name can be up to {MaxNameChars} characters.", "name");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        // The bytes decide what the file is; the declared type and name are never trusted.
        if (AiAudioValidator.Sniff(bytes) != AiAudioValidator.Wav)
            return Fail(StatusCodes.Status400BadRequest, "file-unsupported", "The take must be a WAV file.", "file");

        if (!await Slots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return Fail(StatusCodes.Status429TooManyRequests, "narration-busy",
                "Other takes are being cleaned right now. Try again in a minute.");
        byte[] cleaned;
        try
        {
            cleaned = await cleaner.CleanAsync(bytes, ct);
        }
        catch (NarrationCleanupException ex)
        {
            return Fail(StatusCodes.Status422UnprocessableEntity, "narration-failed", ex.Message);
        }
        finally
        {
            Slots.Release();
        }

        var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}.wav";
        await using (var content = new MemoryStream(cleaned, writable: false))
        {
            await store.SaveAsync(storageKey, content, AiAudioValidator.Wav, ct);
        }

        var now = clock.GetUtcNow().UtcDateTime;
        // "VO - " puts it on A1 and lists it with the other voiceover lines.
        var displayName = UploadValidator.SanitizeDisplayName(
            $"VO - {(label.Length > 0 ? label : $"My narration {now:HH.mm.ss}")}.wav");
        var asset = new Asset
        {
            ProjectId = projectId,
            Name = displayName,
            DisplayFileName = displayName,
            StorageKey = storageKey,
            Kind = AssetKind.Audio,
            MimeType = AiAudioValidator.Wav,
            FileSizeBytes = cleaned.LongLength,
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            Provenance = new AssetProvenance
            {
                SourceProvider = NarrationSource,
                FetchedAtUtc = now,
                FetchedByUserId = currentUser.UserId
            },
            CreatedAt = now
        };
        asset.Probe = await probe.ProbeAsync(storageKey, ct);
        if (asset.Probe.DurationSeconds is not > 0.2)
        {
            await store.DeleteAsync(storageKey, ct);
            return Fail(StatusCodes.Status422UnprocessableEntity, "narration-silent",
                "No speech was heard in that take. Check the microphone and try again.");
        }

        await assets.InsertAsync(asset, ct);

        // What was said is never logged: it is the user's own voice.
        logger.LogInformation("Narration take {AssetId} cleaned and saved for project {ProjectId}.", asset.Id, projectId);
        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<AssetResponse>.Fail(message, new ApiError(code, message, field)));
}
