using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Assets;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class AssetsController(
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    AssetLibraryService library,
    IOptions<IngestOptions> ingestOptions,
    ICurrentUser currentUser,
    TimeProvider clock) : ControllerBase
{
    /// <summary>25MB, also enforced by the counting stream during the copy.</summary>
    private const long MaxUploadBytes = 25 * 1024 * 1024;

    [HttpGet("api/projects/{projectId}/assets")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssetResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await assets.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<AssetResponse>>.Ok(
            [.. list.Select(a => a.ToResponse())]));
    }

    [HttpPost("api/projects/{projectId}/assets")]
    [RequestSizeLimit(MaxUploadBytes)]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Upload(
        string projectId, IFormFile file, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "Choose a file to upload.", new ApiError("file-required", "Choose a file to upload.")));

        if (file.Length > MaxUploadBytes)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "That file is too large.", new ApiError("file-too-large", "That file is too large.")));

        // Extension, declared content type AND sniffed magic bytes must all agree. A
        // client-declared content type is never trusted on its own.
        await using var probeStream = file.OpenReadStream();
        var validation = await UploadValidator
            .ValidateAsync(file.FileName, file.ContentType, probeStream, ct);

        if (!validation.IsValid)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                validation.Message!, new ApiError(validation.Code!, validation.Message!)));

        // A subtitle file is parsed cue by cue on import, so it gets the much tighter
        // transcript budget rather than the media one.
        var subtitleLimit = ingestOptions.Value.MaxSubtitleUploadBytes;
        if (validation.Kind == AssetKind.Subtitle && file.Length > subtitleLimit)
        {
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "That subtitle file is too large.",
                new ApiError("file-too-large", "That subtitle file is too large.")));
        }

        // Server-composed key with a generated filename: the client's name is never used
        // on disk, only kept for display.
        var storageKey =
            $"projects/{projectId}/assets/{Guid.NewGuid():n}{validation.CanonicalExtension}";

        await using (var content = file.OpenReadStream())
        {
            await store.SaveAsync(storageKey, content, validation.MimeType!, ct);
        }

        var asset = new Asset
        {
            ProjectId = projectId,
            Name = UploadValidator.SanitizeDisplayName(file.FileName),
            DisplayFileName = UploadValidator.SanitizeDisplayName(file.FileName),
            StorageKey = storageKey,
            Kind = validation.Kind,
            MimeType = validation.MimeType!,
            FileSizeBytes = file.Length,
            // Uploaded material needs no licence review; only searched assets do.
            ReviewStatus = AssetReviewStatus.NotRequired,
            // A subtitle is source material for an import, never something a scene can
            // point at, so it is marked reference-only and cannot reach a render.
            UsageScope = validation.Kind == AssetKind.Subtitle
                ? AssetUsageScope.ReferenceOnly
                : AssetUsageScope.SceneUse,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };

        // Probed now, so a sprite with no transparency is caught here rather than
        // appearing as an opaque rectangle in a finished render. Text has nothing to probe.
        if (validation.Kind != AssetKind.Subtitle)
            asset.Probe = await probe.ProbeAsync(storageKey, ct);

        await assets.InsertAsync(asset, ct);

        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    /// <summary>
    /// Serves an uploaded file back, so the library and the scene editor can show what a
    /// user actually picked instead of a filename.
    /// <para>
    /// Safe to serve inline because the upload allowlist admits only PNG/JPEG/WEBP, WAV/MP3/M4A
    /// and MP4 - no SVG, no HTML - and the stored type is the SNIFFED one, not the client's
    /// claim. nosniff is set anyway so a browser cannot decide otherwise. Range requests are
    /// not supported here (the object store hands back a forward-only stream), which is fine
    /// for thumbnails and straight-through audio preview.
    /// </para>
    /// </summary>
    [HttpGet("api/assets/{id}/content")]
    public async Task<IActionResult> Content(string id, CancellationToken ct)
    {
        var asset = await assets.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        await EnsureOwnedAsync(asset.ProjectId, ct);

        var stream = await store.OpenAsync(asset.StorageKey, ct) ?? throw new KeyNotFoundException();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, asset.MimeType);
    }

    /// <summary>
    /// Deletes a file from the library. Refused while anything still points at it, because
    /// a missing asset does not surface until a render is minutes in.
    /// </summary>
    [HttpDelete("api/assets/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(string id, CancellationToken ct)
    {
        await library.DeleteAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }
}
