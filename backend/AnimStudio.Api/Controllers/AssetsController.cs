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
    /// <summary>
    /// 25MB. The ceiling for a still image, a voice recording or a music bed.
    /// <para>
    /// Public because the screens that upload one of these quote the limit before sending,
    /// which is the same reason <see cref="MaxVideoUploadBytes"/> is public.
    /// </para>
    /// </summary>
    public const long MaxUploadBytes = 25 * 1024 * 1024;

    /// <summary>
    /// 512MB for video, because 25MB is not a video.
    /// <para>
    /// A single 1080p clip off a phone passes 25MB in about fifteen seconds, so the general
    /// limit would refuse essentially every real clip. Video therefore gets its own, much
    /// larger ceiling - and because the request-size attributes below have to be compile-time
    /// constants, THIS is the limit the framework enforces on the request. The tighter
    /// per-kind limit is applied afterwards, once the file's real type is known from its
    /// bytes, which is the same order the subtitle limit already uses.
    /// </para>
    /// <para>
    /// Uploads over 64KB are spooled to disk by the form reader rather than held in memory,
    /// so a large clip costs scratch space and not the server's heap.
    /// </para>
    /// </summary>
    public const long MaxVideoUploadBytes = 512L * 1024 * 1024;

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
    [RequestSizeLimit(MaxVideoUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxVideoUploadBytes)]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Upload(
        string projectId, IFormFile file, [FromForm] string? folderId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "Choose a file to upload.", new ApiError("file-required", "Choose a file to upload.")));

        // Checked against the largest ceiling first; the tighter per-kind one is applied
        // below, once the bytes have said what the file actually is.
        if (file.Length > MaxVideoUploadBytes)
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

        // Only video gets the large ceiling. A 300MB "PNG" is not a still image, whatever
        // the request was allowed to carry.
        if (validation.Kind != AssetKind.Video
            && validation.Kind != AssetKind.Subtitle
            && file.Length > MaxUploadBytes)
        {
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "Images and audio must be 25MB or smaller.",
                new ApiError("file-too-large", "Images and audio must be 25MB or smaller.")));
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
            FolderId = folderId,
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
        MetaCache.TryAdd(asset.Id, (asset.StorageKey, asset.MimeType, asset.ProjectId));

        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string StorageKey, string MimeType, string ProjectId)> MetaCache = new();

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
    [HttpHead("api/assets/{id}/content")]
    public async Task<IActionResult> Content(string id, CancellationToken ct)
    {
        try
        {
            if (ct.IsCancellationRequested || HttpContext.RequestAborted.IsCancellationRequested)
                return StatusCode(499);

            if (!MetaCache.TryGetValue(id, out var meta))
            {
                var asset = await assets.GetAsync(id, ct);
                if (asset is null && (id.Contains("_a_") || id.Contains("_b_") || id.Contains("_part")))
                {
                    var baseId = System.Text.RegularExpressions.Regex.Replace(id, @"(_[ab]_\d+|_part.*)$", "");
                    asset = await assets.GetAsync(baseId, ct);
                }
                if (asset is null) throw new KeyNotFoundException();
                meta = (asset.StorageKey, asset.MimeType, asset.ProjectId);
                MetaCache.TryAdd(id, meta);
            }

            await EnsureOwnedAsync(meta.ProjectId, ct);

            var stream = await store.OpenAsync(meta.StorageKey, ct) ?? throw new KeyNotFoundException();

            Response.Headers.XContentTypeOptions = "nosniff";
            Response.Headers.CacheControl = "public, max-age=86400";
            return File(stream, meta.MimeType, enableRangeProcessing: stream.CanSeek);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex) when (ex.Message.Contains("cancelled", StringComparison.OrdinalIgnoreCase) ||
                                   ex.Message.Contains("aborted", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(499);
        }
    }

    /// <summary>
    /// Serves a lightweight image thumbnail for an asset (e.g., 320px JPEG for videos, or direct image stream).
    /// Prevents browser connection saturation when browsing large media libraries or timeline filmstrips.
    /// </summary>
    [HttpGet("api/assets/{id}/thumbnail")]
    [HttpHead("api/assets/{id}/thumbnail")]
    public async Task<IActionResult> Thumbnail(string id, CancellationToken ct)
    {
        try
        {
            if (ct.IsCancellationRequested || HttpContext.RequestAborted.IsCancellationRequested)
                return StatusCode(499);

            if (!MetaCache.TryGetValue(id, out var meta))
            {
                var asset = await assets.GetAsync(id, ct);
                if (asset is null && (id.Contains("_a_") || id.Contains("_b_") || id.Contains("_part")))
                {
                    var baseId = System.Text.RegularExpressions.Regex.Replace(id, @"(_[ab]_\d+|_part.*)$", "");
                    asset = await assets.GetAsync(baseId, ct);
                }
                if (asset is null) throw new KeyNotFoundException();
                meta = (asset.StorageKey, asset.MimeType, asset.ProjectId);
                MetaCache.TryAdd(id, meta);
            }

            await EnsureOwnedAsync(meta.ProjectId, ct);

            Response.Headers.XContentTypeOptions = "nosniff";
            Response.Headers.CacheControl = "public, max-age=604800";

            if (meta.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                var imgStream = await store.OpenAsync(meta.StorageKey, ct) ?? throw new KeyNotFoundException();
                return File(imgStream, meta.MimeType);
            }

            if (meta.MimeType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
            {
                var thumbDir = Path.Combine("D:", "AI_STUDIO", "temp", "thumbnails");
                Directory.CreateDirectory(thumbDir);
                var thumbPath = Path.Combine(thumbDir, $"{id}.jpg");

                if (System.IO.File.Exists(thumbPath))
                {
                    return PhysicalFile(thumbPath, "image/jpeg");
                }

                var videoPath = Path.IsPathRooted(meta.StorageKey)
                    ? meta.StorageKey
                    : Path.Combine("D:", "AI_STUDIO", "objects", meta.StorageKey.Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(videoPath))
                {
                    try
                    {
                        var psi = new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = "ffmpeg",
                            Arguments = $"-ss 00:00:00.100 -i \"{videoPath}\" -vframes 1 -vf \"scale=320:-1\" -q:v 4 \"{thumbPath}\" -y",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };
                        using var proc = System.Diagnostics.Process.Start(psi);
                        if (proc != null)
                        {
                            await proc.WaitForExitAsync(ct);
                            if (System.IO.File.Exists(thumbPath))
                            {
                                return PhysicalFile(thumbPath, "image/jpeg");
                            }
                        }
                    }
                    catch
                    {
                        // Fall back to stream
                    }
                }
            }

            var stream = await store.OpenAsync(meta.StorageKey, ct) ?? throw new KeyNotFoundException();
            return File(stream, meta.MimeType);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex) when (ex.Message.Contains("cancelled", StringComparison.OrdinalIgnoreCase) ||
                                   ex.Message.Contains("aborted", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(499);
        }
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
        if (string.Equals(projectId, "global", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(projectId, "system", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    public sealed record ReorderAssetsRequest
    {
        public List<string> AssetIds { get; init; } = [];
    }

    [HttpPut("api/projects/{projectId}/assets/reorder")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> ReorderAssets(
        string projectId, [FromBody] ReorderAssetsRequest req, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);
        var projectAssets = await assets.ListByProjectAsync(projectId, ct);
        for (int i = 0; i < req.AssetIds.Count; i++)
        {
            var id = req.AssetIds[i];
            var asset = projectAssets.FirstOrDefault(a => a.Id == id);
            if (asset != null)
            {
                asset.OrderIndex = i;
                await assets.ReplaceAsync(asset, ct);
            }
        }
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    public sealed record MoveAssetRequest
    {
        public string? FolderId { get; init; }
    }

    [HttpPut("api/projects/{projectId}/assets/{assetId}/folder")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> MoveAsset(
        string projectId, string assetId, [FromBody] MoveAssetRequest req, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var asset = await assets.GetAsync(assetId, ct);
        if (asset == null || asset.ProjectId != projectId)
            return NotFound();

        asset.FolderId = req.FolderId;
        await assets.ReplaceAsync(asset, ct);

        return Ok(ApiResponse<AssetResponse>.Ok(asset.ToResponse()));
    }
}
