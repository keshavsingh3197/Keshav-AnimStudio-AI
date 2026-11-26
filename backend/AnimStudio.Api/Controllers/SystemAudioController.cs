using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Recordings;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Sound the user's computer was playing - a shared browser tab, window or the whole screen -
/// recorded in the browser and saved to the library as an MP3.
/// </summary>
[ApiController]
public sealed class SystemAudioController(
    ISystemAudioEncoder encoder,
    IAssetRepository assets,
    IAssetFolderRepository folders,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<SystemAudioController> logger) : ControllerBase
{
    /// <summary>Thirty minutes of the 192 kbps Opus the library records, with room to spare.</summary>
    public const long MaxTakeBytes = 64 * 1024 * 1024;

    private const int MaxNameChars = 80;

    /// <summary>Marks a library file as recorded from the computer's own sound.</summary>
    private const string SystemAudioSource = "system-audio";

    /// <summary>Encoding is quick, but a few long takes at once would still crowd the CPU.</summary>
    private static readonly SemaphoreSlim Slots = new(2, 2);

    /// <summary>
    /// Multipart: <c>file</c> is the take as WebM or MP4, <c>name</c> (optional) what the library
    /// calls it, <c>folderId</c> (optional) one of this project's folders to file it in.
    /// </summary>
    [HttpPost("api/projects/{projectId}/assets/system-audio")]
    [RequestSizeLimit(MaxTakeBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxTakeBytes + 64 * 1024)]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Record(
        string projectId, IFormFile? file, [FromForm] string? name, [FromForm] string? folderId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (string.IsNullOrEmpty(currentUser.UserId)
            || !string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} tried to add a system-audio recording to project {ProjectId}, which is not theirs.",
                currentUser.UserId, projectId);
            throw new UnauthorizedAccessException();
        }

        if (!string.IsNullOrEmpty(folderId))
        {
            var folder = await folders.GetAsync(folderId, ct);
            if (folder is null || !string.Equals(folder.ProjectId, projectId, StringComparison.Ordinal))
                return NotFound();
        }

        if (!encoder.IsAvailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "system-audio-unavailable",
                "Recordings can't be saved on this server: ffmpeg isn't available.");
        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Record something first.", "file");
        if (file.Length > MaxTakeBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large",
                "That recording is too long. Record up to thirty minutes at a time.", "file");

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
        if (SystemAudioRecording.Sniff(bytes) is not { } container)
            return Fail(StatusCodes.Status400BadRequest, "file-unsupported", "The recording must be WebM or MP4.", "file");

        if (!await Slots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return Fail(StatusCodes.Status429TooManyRequests, "system-audio-busy",
                "Other recordings are being saved right now. Try again in a minute.");
        byte[] mp3;
        try
        {
            mp3 = await encoder.EncodeAsync(bytes, container, ct);
        }
        catch (SystemAudioEncodingException ex)
        {
            return Fail(StatusCodes.Status422UnprocessableEntity, "system-audio-failed", ex.Message);
        }
        finally
        {
            Slots.Release();
        }

        var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}.mp3";
        await using (var content = new MemoryStream(mp3, writable: false))
        {
            await store.SaveAsync(storageKey, content, AiAudioValidator.Mp3, ct);
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var displayName = UploadValidator.SanitizeDisplayName(
            $"{(label.Length > 0 ? label : $"System audio {now:yyyy-MM-dd HH.mm.ss}")}.mp3");
        var asset = new Asset
        {
            ProjectId = projectId,
            FolderId = string.IsNullOrEmpty(folderId) ? null : folderId,
            Name = displayName,
            DisplayFileName = displayName,
            StorageKey = storageKey,
            Kind = AssetKind.Audio,
            MimeType = AiAudioValidator.Mp3,
            FileSizeBytes = mp3.LongLength,
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            Provenance = new AssetProvenance
            {
                SourceProvider = SystemAudioSource,
                FetchedAtUtc = now,
                FetchedByUserId = currentUser.UserId
            },
            CreatedAt = now
        };
        asset.Probe = await probe.ProbeAsync(storageKey, ct);
        if (asset.Probe.DurationSeconds is not > 0.2)
        {
            await store.DeleteAsync(storageKey, ct);
            return Fail(StatusCodes.Status422UnprocessableEntity, "system-audio-silent",
                "Nothing was heard in that recording. Make sure audio was shared and something was playing.");
        }

        await assets.InsertAsync(asset, ct);

        logger.LogInformation("System-audio recording {AssetId} ({Seconds:F1}s) saved for project {ProjectId}.",
            asset.Id, asset.Probe.DurationSeconds, projectId);
        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<AssetResponse>.Fail(message, new ApiError(code, message, field)));
}
