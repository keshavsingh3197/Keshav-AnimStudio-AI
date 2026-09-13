using System.Collections.Concurrent;
using System.IO.Compression;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Media;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Infrastructure.Media;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/media")]
public sealed class MediaToolsController(
    YtDlpMediaDownloader ytDlp,
    FfmpegVideoChunker chunker,
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    IAiSettingsRepository aiSettingsRepo,
    ILogger<MediaToolsController> logger) : ControllerBase
{
    private sealed record MediaTicket(string FilePath, string FileName, string MimeType, DateTime CreatedAt);

    private static readonly ConcurrentDictionary<string, MediaTicket> Tickets = new();
    private static readonly ConcurrentDictionary<string, string> ChunkWorkspaces = new();

    /// <summary>
    /// Probes video metadata from a YouTube Shorts or video URL.
    /// </summary>
    [HttpPost("probe")]
    public async Task<ActionResult<ApiResponse<MediaProbeResponse>>> ProbeUrl(
        [FromBody] MediaProbeRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.Url))
        {
            return BadRequest(ApiResponse<MediaProbeResponse>.Fail(
                "A video URL is required.", new ApiError("url-required", "A video URL is required.")));
        }

        var validation = YouTubeUrlValidator.Validate(request.Url, allowHttp: true);
        if (!validation.IsValid || string.IsNullOrWhiteSpace(validation.CanonicalUrl))
        {
            return BadRequest(ApiResponse<MediaProbeResponse>.Fail(
                "Invalid YouTube or video URL.", new ApiError("url-invalid", "That does not look like a valid video URL.")));
        }

        try
        {
            var probeResult = await ytDlp.ProbeAsync(new Uri(validation.CanonicalUrl), ct);
            return Ok(ApiResponse<MediaProbeResponse>.Ok(probeResult));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to probe video URL {Url}", request.Url);
            return StatusCode(502, ApiResponse<MediaProbeResponse>.Fail(
                $"Could not fetch video information: {ex.Message}",
                new ApiError("probe-failed", ex.Message)));
        }
    }

    /// <summary>
    /// Downloads video or audio in requested format (MP4, WebM, MOV, MP3, WAV, AAC, etc.)
    /// </summary>
    [HttpPost("download")]
    public async Task<ActionResult<ApiResponse<MediaDownloadResult>>> DownloadMedia(
        [FromBody] MediaDownloadRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.Url))
        {
            return BadRequest(ApiResponse<MediaDownloadResult>.Fail(
                "A video URL is required.", new ApiError("url-required", "A video URL is required.")));
        }

        var validation = YouTubeUrlValidator.Validate(request.Url, allowHttp: true);
        if (!validation.IsValid || string.IsNullOrWhiteSpace(validation.CanonicalUrl))
        {
            return BadRequest(ApiResponse<MediaDownloadResult>.Fail(
                "Invalid YouTube or video URL.", new ApiError("url-invalid", "That does not look like a valid video URL.")));
        }

        var workDir = Path.Combine(Path.GetTempPath(), "animstudio-downloads", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(workDir);

        try
        {
            var downloaded = await ytDlp.DownloadAsync(request, new Uri(validation.CanonicalUrl), workDir, ct);

            string? assetId = null;

            // Optional import directly into project assets
            if (request.ImportAsAsset && !string.IsNullOrWhiteSpace(request.ProjectId))
            {
                var project = await projects.GetAsync(request.ProjectId, ct);
                if (project != null)
                {
                    var storageKey = $"projects/{request.ProjectId}/assets/{Guid.NewGuid():n}_{downloaded.FileName}";
                    await using (var fileStream = System.IO.File.OpenRead(downloaded.FilePath))
                    {
                        await store.SaveAsync(storageKey, fileStream, downloaded.MimeType, ct);
                    }

                    var mediaProbe = await probe.ProbeAsync(storageKey, ct);
                    var assetKind = downloaded.IsAudioOnly ? AssetKind.Audio : AssetKind.Video;

                    var asset = new Asset
                    {
                        Id = Guid.NewGuid().ToString("n"),
                        ProjectId = request.ProjectId,
                        Name = string.IsNullOrWhiteSpace(request.AssetName) ? downloaded.FileName : request.AssetName,
                        DisplayFileName = downloaded.FileName,
                        Kind = assetKind,
                        MimeType = downloaded.MimeType,
                        StorageKey = storageKey,
                        FileSizeBytes = downloaded.FileSizeBytes,
                        Probe = mediaProbe,
                        UsageScope = AssetUsageScope.SceneUse,
                        ReviewStatus = AssetReviewStatus.NotRequired,
                        CreatedAt = DateTime.UtcNow
                    };

                    await assets.InsertAsync(asset, ct);
                    assetId = asset.Id;

                    // If video asset, also register in project clip order so it shows up in Clip Studio immediately!
                    if (assetKind == AssetKind.Video)
                    {
                        var updatedOrder = new List<string>(project.Settings.ClipOrderAssetIds) { asset.Id };
                        project.Settings.ClipOrderAssetIds = updatedOrder;
                        await projects.ReplaceAsync(project, ct);
                    }
                }
            }

            var ticketId = Guid.NewGuid().ToString("n");
            Tickets[ticketId] = new MediaTicket(downloaded.FilePath, downloaded.FileName, downloaded.MimeType, DateTime.UtcNow);

            var streamUrl = $"/api/media/stream/{ticketId}";

            return Ok(ApiResponse<MediaDownloadResult>.Ok(new MediaDownloadResult(
                Ticket: ticketId,
                FileName: downloaded.FileName,
                MimeType: downloaded.MimeType,
                FileSizeBytes: downloaded.FileSizeBytes,
                DurationSeconds: downloaded.DurationSeconds,
                IsAudioOnly: downloaded.IsAudioOnly,
                AssetId: assetId,
                StreamUrl: streamUrl)));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to download media for URL {Url}", request.Url);
            return StatusCode(500, ApiResponse<MediaDownloadResult>.Fail(
                $"Download failed: {ex.Message}",
                new ApiError("download-failed", ex.Message)));
        }
    }

    /// <summary>
    /// Streams downloaded file for browser download.
    /// </summary>
    [HttpGet("stream/{ticket}")]
    public IActionResult StreamFile(string ticket)
    {
        if (!Tickets.TryGetValue(ticket, out var item) || !System.IO.File.Exists(item.FilePath))
        {
            return NotFound(ApiResponse<string>.Fail("Download link expired or not found.", new ApiError("not-found", "File not found.")));
        }

        var stream = new FileStream(item.FilePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous);
        return File(stream, item.MimeType, item.FileName, enableRangeProcessing: true);
    }

    /// <summary>
    /// Chunks an uploaded video file or URL or asset into sequential clips (default 10s).
    /// </summary>
    [HttpPost("chunk")]
    [RequestSizeLimit(512L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 512L * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<VideoChunkResult>>> ChunkVideo(
        [FromForm] IFormFile? file,
        [FromForm] string? url,
        [FromForm] string? assetId,
        [FromForm] double? chunkDurationSeconds,
        [FromForm] bool accurateCut = false,
        [FromForm] bool convertTo916 = false,
        [FromForm] string? projectId = null,
        [FromForm] bool importAsClips = false,
        CancellationToken ct = default)
    {
        // Load default chunk duration from settings if not explicitly specified
        var settings = await aiSettingsRepo.GetAsync(ct);
        var chunkDuration = (chunkDurationSeconds.HasValue && chunkDurationSeconds.Value > 0)
            ? chunkDurationSeconds.Value
            : (settings?.DefaultChunkDurationSeconds ?? 10.0);

        var jobId = Guid.NewGuid().ToString("n");
        var workDir = Path.Combine(Path.GetTempPath(), "animstudio-chunks", jobId);
        Directory.CreateDirectory(workDir);
        ChunkWorkspaces[jobId] = workDir;

        string inputVideoPath;
        string sourceTitle = "video";

        try
        {
            if (file != null && file.Length > 0)
            {
                sourceTitle = Path.GetFileNameWithoutExtension(file.FileName);
                inputVideoPath = Path.Combine(workDir, "source_" + file.FileName);
                await using var fs = new FileStream(inputVideoPath, FileMode.Create, FileAccess.Write);
                await file.CopyToAsync(fs, ct);
            }
            else if (!string.IsNullOrWhiteSpace(assetId))
            {
                var asset = await assets.GetAsync(assetId, ct);
                if (asset == null)
                {
                    return NotFound(ApiResponse<VideoChunkResult>.Fail("Asset not found.", new ApiError("asset-not-found", "Asset not found.")));
                }

                sourceTitle = asset.Name;
                inputVideoPath = Path.Combine(workDir, "source_asset.mp4");
                await using var readStream = await store.OpenAsync(asset.StorageKey, ct);
                if (readStream == null)
                {
                    return NotFound(ApiResponse<VideoChunkResult>.Fail("Asset file not found in storage.", new ApiError("file-not-found", "File not found.")));
                }

                await using var fs = new FileStream(inputVideoPath, FileMode.Create, FileAccess.Write);
                await readStream.CopyToAsync(fs, ct);
            }
            else if (!string.IsNullOrWhiteSpace(url))
            {
                var validation = YouTubeUrlValidator.Validate(url, allowHttp: true);
                if (!validation.IsValid || string.IsNullOrWhiteSpace(validation.CanonicalUrl))
                {
                    return BadRequest(ApiResponse<VideoChunkResult>.Fail("Invalid video URL.", new ApiError("url-invalid", "Invalid video URL.")));
                }

                var downloadReq = new MediaDownloadRequest(validation.CanonicalUrl, "mp4", "1080p");
                var downloaded = await ytDlp.DownloadAsync(downloadReq, new Uri(validation.CanonicalUrl), workDir, ct);
                inputVideoPath = downloaded.FilePath;
                sourceTitle = downloaded.Title;
            }
            else
            {
                return BadRequest(ApiResponse<VideoChunkResult>.Fail(
                    "Please provide a video file, asset id, or video URL to chunk.",
                    new ApiError("source-required", "Video source required.")));
            }

            var chunkResult = await chunker.ChunkVideoAsync(
                inputVideoPath, sourceTitle, chunkDuration, accurateCut, convertTo916, jobId, workDir, ct);

            // If requested, import chunks as Project Clips!
            if (importAsClips && !string.IsNullOrWhiteSpace(projectId))
            {
                var project = await projects.GetAsync(projectId, ct);
                if (project != null)
                {
                    var updatedClipOrder = new List<string>(project.Settings.ClipOrderAssetIds);
                    var updatedChunks = new List<ChunkItemResponse>();

                    foreach (var ch in chunkResult.Chunks)
                    {
                        var chunkFilePath = Path.Combine(workDir, "chunks", ch.FileName);
                        if (!System.IO.File.Exists(chunkFilePath)) continue;

                        var storageKey = $"projects/{projectId}/assets/chunks/{jobId}_{ch.FileName}";
                        await using (var cs = System.IO.File.OpenRead(chunkFilePath))
                        {
                            await store.SaveAsync(storageKey, cs, "video/mp4", ct);
                        }

                        var chunkProbe = await probe.ProbeAsync(storageKey, ct);
                        var chunkAsset = new Asset
                        {
                            Id = Guid.NewGuid().ToString("n"),
                            ProjectId = projectId,
                            Name = $"{sourceTitle} Part {ch.Index} ({ch.StartFormatted}-{ch.EndFormatted})",
                            DisplayFileName = ch.FileName,
                            Kind = AssetKind.Video,
                            MimeType = "video/mp4",
                            StorageKey = storageKey,
                            FileSizeBytes = ch.FileSizeBytes,
                            Probe = chunkProbe,
                            UsageScope = AssetUsageScope.SceneUse,
                            ReviewStatus = AssetReviewStatus.NotRequired,
                            CreatedAt = DateTime.UtcNow
                        };

                        await assets.InsertAsync(chunkAsset, ct);
                        updatedClipOrder.Add(chunkAsset.Id);

                        updatedChunks.Add(ch with { AssetId = chunkAsset.Id });
                    }

                    project.Settings.ClipOrderAssetIds = updatedClipOrder;
                    await projects.ReplaceAsync(project, ct);

                    chunkResult = chunkResult with { Chunks = updatedChunks };
                }
            }

            return Ok(ApiResponse<VideoChunkResult>.Ok(chunkResult));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to chunk video");
            return StatusCode(500, ApiResponse<VideoChunkResult>.Fail(
                $"Chunking failed: {ex.Message}", new ApiError("chunk-failed", ex.Message)));
        }
    }

    /// <summary>
    /// Downloads all chunks bundled as a ZIP archive.
    /// </summary>
    [HttpGet("chunks/{jobId}/zip")]
    public IActionResult DownloadZip(string jobId)
    {
        if (!ChunkWorkspaces.TryGetValue(jobId, out var workDir))
        {
            return NotFound(ApiResponse<string>.Fail("Chunk job not found or expired.", new ApiError("not-found", "Job not found.")));
        }

        var zipPath = Path.Combine(workDir, $"{jobId}_chunks.zip");
        if (!System.IO.File.Exists(zipPath))
        {
            return NotFound(ApiResponse<string>.Fail("ZIP file not found.", new ApiError("zip-not-found", "ZIP not found.")));
        }

        var stream = new FileStream(zipPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous);
        return File(stream, "application/zip", $"{jobId}_chunks.zip", enableRangeProcessing: true);
    }

    /// <summary>
    /// Streams an individual chunk video file for preview or download.
    /// </summary>
    [HttpGet("chunks/{jobId}/{index:int}")]
    public IActionResult StreamChunk(string jobId, int index)
    {
        if (!ChunkWorkspaces.TryGetValue(jobId, out var workDir))
        {
            return NotFound(ApiResponse<string>.Fail("Chunk job not found or expired.", new ApiError("not-found", "Job not found.")));
        }

        var chunkPath = Path.Combine(workDir, "chunks", $"chunk_{index:D3}.mp4");
        if (!System.IO.File.Exists(chunkPath))
        {
            return NotFound(ApiResponse<string>.Fail("Chunk file not found.", new ApiError("chunk-not-found", "Chunk not found.")));
        }

        var stream = new FileStream(chunkPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous);
        return File(stream, "video/mp4", $"chunk_{index:D3}.mp4", enableRangeProcessing: true);
    }
}
