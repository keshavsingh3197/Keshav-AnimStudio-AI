using System.Collections.Concurrent;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Media;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Infrastructure.Media;
using AnimStudio.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/media")]
public sealed class MediaToolsController(
    YtDlpMediaDownloader ytDlp,
    FfmpegVideoChunker chunker,
    IAssetRepository assets,
    IAssetFolderRepository folders,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    IAiSettingsRepository aiSettingsRepo,
    IOptions<IngestOptions> ingestOptions,
    ICurrentUser currentUser,
    AppDataPaths dataPaths,
    ILogger<MediaToolsController> logger) : ControllerBase
{
    private const int MaxFolderNameLength = 100;
    private const int MaxAssetNameLength = 200;

    private sealed record MediaTicket(string FilePath, string FileName, string MimeType, DateTime CreatedAt);

    private static readonly ConcurrentDictionary<string, MediaTicket> Tickets = new();
    private static readonly ConcurrentDictionary<string, string> ChunkWorkspaces = new();

    /// <summary>
    /// Which sites links can be downloaded from, and whether the downloader is ready.
    /// </summary>
    [HttpGet("sources")]
    public async Task<ActionResult<ApiResponse<MediaSourcesResponse>>> GetSources(CancellationToken ct)
    {
        var version = await ytDlp.GetVersionAsync(ct);
        var platforms = MediaSourceValidator.Platforms
            .Select(p => new SupportedPlatformInfo(p.Id, p.Name, p.DisplayHosts, p.Example, p.Notes, p.LoginOftenRequired))
            .ToList();

        return Ok(ApiResponse<MediaSourcesResponse>.Ok(new MediaSourcesResponse(
            DownloadEnabled: ingestOptions.Value.AllowMediaDownload,
            DownloaderAvailable: version is not null,
            DownloaderVersion: version,
            CookiesConfigured: ytDlp.CookiesConfigured,
            Platforms: platforms)));
    }

    /// <summary>
    /// Probes video metadata from any supported platform's video URL.
    /// </summary>
    [HttpPost("probe")]
    public async Task<ActionResult<ApiResponse<MediaProbeResponse>>> ProbeUrl(
        [FromBody] MediaProbeRequest request, CancellationToken ct)
    {
        if (!ingestOptions.Value.AllowMediaDownload)
            return Failure<MediaProbeResponse>(StatusCodes.Status403Forbidden, MediaDownloadFailureClassifier.Disabled());

        var validation = MediaSourceValidator.Validate(request?.Url, allowHttp: true);
        if (!validation.IsValid)
            return InvalidUrl<MediaProbeResponse>(validation);

        try
        {
            var probeResult = await ytDlp.ProbeAsync(new Uri(validation.CanonicalUrl!), validation.Platform!, ct);
            return Ok(ApiResponse<MediaProbeResponse>.Ok(probeResult));
        }
        catch (MediaDownloadException ex)
        {
            logger.LogWarning("Probe of {Platform} URL failed: {Code}", validation.Platform!.Id, ex.Failure.Code);
            return Failure<MediaProbeResponse>(StatusFor(ex.Failure), ex.Failure);
        }
    }

    /// <summary>
    /// Downloads video or audio in the requested format (MP4, WebM, MOV, MP3, WAV, AAC, etc.),
    /// optionally importing it into one of the caller's projects and asset folders.
    /// </summary>
    [HttpPost("download")]
    public async Task<ActionResult<ApiResponse<MediaDownloadResult>>> DownloadMedia(
        [FromBody] MediaDownloadRequest request, CancellationToken ct)
    {
        if (!ingestOptions.Value.AllowMediaDownload)
            return Failure<MediaDownloadResult>(StatusCodes.Status403Forbidden, MediaDownloadFailureClassifier.Disabled());

        var validation = MediaSourceValidator.Validate(request?.Url, allowHttp: true);
        if (!validation.IsValid)
            return InvalidUrl<MediaDownloadResult>(validation);

        // Checked before anything is downloaded, and outside the catch below, so a project or
        // folder that is not the caller's is a 403/404 and never receives the file.
        var targetProject = request!.ImportAsAsset && !string.IsNullOrWhiteSpace(request.ProjectId)
            ? await LoadOwnedProjectAsync(request.ProjectId, ct)
            : null;

        AssetFolder? existingFolder = null;
        string? newFolderName = null;
        if (targetProject is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.FolderId))
            {
                existingFolder = await folders.GetAsync(request.FolderId, ct);
                if (existingFolder is null || !string.Equals(existingFolder.ProjectId, targetProject.Id, StringComparison.Ordinal))
                    throw new KeyNotFoundException();
            }
            else if (!string.IsNullOrWhiteSpace(request.FolderName))
            {
                newFolderName = request.FolderName.Trim();
                if (newFolderName.Length > MaxFolderNameLength || newFolderName.Any(char.IsControl))
                {
                    return BadRequest(ApiResponse<MediaDownloadResult>.Fail(
                        "That folder name isn't valid.",
                        new ApiError("folder-name-invalid",
                            $"Folder names must be 1-{MaxFolderNameLength} characters with no control characters.",
                            Field: "folderName")));
                }
            }
        }

        var workDir = Path.Combine(dataPaths.Downloads, Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(workDir);

        DownloadedMediaFile downloaded;
        try
        {
            downloaded = await ytDlp.DownloadAsync(request, new Uri(validation.CanonicalUrl!), validation.Platform!, workDir, ct);
        }
        catch (MediaDownloadException ex)
        {
            logger.LogWarning("Download from {Platform} failed: {Code}", validation.Platform!.Id, ex.Failure.Code);
            return Failure<MediaDownloadResult>(StatusFor(ex.Failure), ex.Failure);
        }

        string? assetId = null;
        AssetFolder? folder = existingFolder;

        if (targetProject is not null)
        {
            var project = targetProject;
            if (folder is null && newFolderName is not null)
                folder = await GetOrCreateFolderAsync(project.Id, newFolderName, ct);

            var storageKey = $"projects/{project.Id}/assets/{Guid.NewGuid():n}_{downloaded.FileName}";
            await using (var fileStream = System.IO.File.OpenRead(downloaded.FilePath))
            {
                await store.SaveAsync(storageKey, fileStream, downloaded.MimeType, ct);
            }

            var mediaProbe = await probe.ProbeAsync(storageKey, ct);
            var assetKind = downloaded.IsAudioOnly ? AssetKind.Audio : AssetKind.Video;
            var assetName = string.IsNullOrWhiteSpace(request.AssetName) ? downloaded.Title : request.AssetName.Trim();

            var asset = new Asset
            {
                Id = Guid.NewGuid().ToString("n"),
                ProjectId = project.Id,
                FolderId = folder?.Id,
                Name = assetName.Length > MaxAssetNameLength ? assetName[..MaxAssetNameLength] : assetName,
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

            // Video assets also join the clip order so they show up in Clip Studio immediately.
            if (assetKind == AssetKind.Video && request.AddToClipOrder)
            {
                project.Settings.ClipOrderAssetIds = new List<string>(project.Settings.ClipOrderAssetIds) { asset.Id };
                await projects.ReplaceAsync(project, ct);
            }
        }

        var ticketId = Guid.NewGuid().ToString("n");
        Tickets[ticketId] = new MediaTicket(downloaded.FilePath, downloaded.FileName, downloaded.MimeType, DateTime.UtcNow);

        return Ok(ApiResponse<MediaDownloadResult>.Ok(new MediaDownloadResult(
            Ticket: ticketId,
            FileName: downloaded.FileName,
            MimeType: downloaded.MimeType,
            FileSizeBytes: downloaded.FileSizeBytes,
            DurationSeconds: downloaded.DurationSeconds,
            IsAudioOnly: downloaded.IsAudioOnly,
            AssetId: assetId,
            StreamUrl: $"/api/media/stream/{ticketId}",
            ProjectId: targetProject?.Id,
            FolderId: folder?.Id,
            FolderName: folder?.Name)));
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
        [FromForm] string compressionPreset = "original",
        CancellationToken ct = default)
    {
        // Load default chunk duration from settings if not explicitly specified
        var settings = await aiSettingsRepo.GetAsync(ct);
        var chunkDuration = (chunkDurationSeconds.HasValue && chunkDurationSeconds.Value > 0)
            ? chunkDurationSeconds.Value
            : (settings?.DefaultChunkDurationSeconds ?? 10.0);

        // Checked up front, and outside the catch-all below, so chunks are never cut for -
        // or imported into - a project that is not the caller's.
        var targetProject = importAsClips && !string.IsNullOrWhiteSpace(projectId)
            ? await LoadOwnedProjectAsync(projectId, ct)
            : null;

        Asset? sourceAsset = null;
        if (file is not { Length: > 0 } && !string.IsNullOrWhiteSpace(assetId))
        {
            sourceAsset = await assets.GetAsync(assetId, ct);

            // The source must be the caller's own, and chunks imported into a project must
            // come from that project's library: an asset id from project A must not have its
            // footage copied into project B.
            if (sourceAsset is null
                || !await IsOwnedAssetAsync(sourceAsset, ct)
                || (targetProject is not null
                    && !string.Equals(sourceAsset.ProjectId, targetProject.Id, StringComparison.Ordinal)
                    && !IsSharedLibrary(sourceAsset.ProjectId)))
            {
                return NotFound(ApiResponse<VideoChunkResult>.Fail("Asset not found.", new ApiError("asset-not-found", "Asset not found.")));
            }
        }

        // URL sources are validated before a workspace exists, like the other endpoints.
        MediaSourceValidationResult? urlSource = null;
        if (file is not { Length: > 0 } && sourceAsset is null && !string.IsNullOrWhiteSpace(url))
        {
            if (!ingestOptions.Value.AllowMediaDownload)
                return Failure<VideoChunkResult>(StatusCodes.Status403Forbidden, MediaDownloadFailureClassifier.Disabled());

            urlSource = MediaSourceValidator.Validate(url, allowHttp: true);
            if (!urlSource.IsValid)
                return InvalidUrl<VideoChunkResult>(urlSource);
        }

        var jobId = Guid.NewGuid().ToString("n");
        var workDir = Path.Combine(dataPaths.Chunks, jobId);
        Directory.CreateDirectory(workDir);
        ChunkWorkspaces[jobId] = workDir;

        string inputVideoPath;
        string sourceTitle = "video";

        try
        {
            if (file != null && file.Length > 0)
            {
                sourceTitle = Path.GetFileNameWithoutExtension(file.FileName);
                // Generated name: the client's filename may carry "..\" segments and must
                // never decide where on disk the upload lands.
                inputVideoPath = Path.Combine(workDir, "source_upload" + SafeExtension(file.FileName));
                await using var fs = new FileStream(inputVideoPath, FileMode.Create, FileAccess.Write);
                await file.CopyToAsync(fs, ct);
            }
            else if (sourceAsset is { } asset)
            {
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
            else if (urlSource is { CanonicalUrl: { } canonicalUrl, Platform: { } platform })
            {
                var downloadReq = new MediaDownloadRequest(canonicalUrl, "mp4", "1080p", CompressionPreset: compressionPreset);
                var downloaded = await ytDlp.DownloadAsync(downloadReq, new Uri(canonicalUrl), platform, workDir, ct);
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
                inputVideoPath, sourceTitle, chunkDuration, accurateCut, convertTo916, jobId, workDir, compressionPreset, ct);

            // If requested, import chunks as Project Clips!
            if (targetProject is not null)
            {
                var project = targetProject;
                {
                    var updatedClipOrder = new List<string>(project.Settings.ClipOrderAssetIds);
                    var updatedChunks = new List<ChunkItemResponse>();

                    foreach (var ch in chunkResult.Chunks)
                    {
                        var chunkFilePath = Path.Combine(workDir, "chunks", ch.FileName);
                        if (!System.IO.File.Exists(chunkFilePath)) continue;

                        var storageKey = $"projects/{project.Id}/assets/chunks/{jobId}_{ch.FileName}";
                        await using (var cs = System.IO.File.OpenRead(chunkFilePath))
                        {
                            await store.SaveAsync(storageKey, cs, "video/mp4", ct);
                        }

                        var chunkProbe = await probe.ProbeAsync(storageKey, ct);
                        var chunkAsset = new Asset
                        {
                            Id = Guid.NewGuid().ToString("n"),
                            ProjectId = project.Id,
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
        catch (MediaDownloadException ex)
        {
            logger.LogWarning("Chunk source download failed: {Code}", ex.Failure.Code);
            return Failure<VideoChunkResult>(StatusFor(ex.Failure), ex.Failure);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to chunk video");
            return StatusCode(500, ApiResponse<VideoChunkResult>.Fail(
                "Chunking failed. Check the Logs page for details.", new ApiError("chunk-failed", "Chunking failed.")));
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

    private ObjectResult Failure<T>(int status, MediaDownloadFailure failure) =>
        StatusCode(status, ApiResponse<T>.Fail(
            failure.Message,
            new ApiError(failure.Code, failure.Message, Hint: failure.Hint, Detail: failure.Detail)));

    private BadRequestObjectResult InvalidUrl<T>(MediaSourceValidationResult validation) =>
        BadRequest(ApiResponse<T>.Fail(
            validation.ErrorMessage ?? "That link can't be downloaded.",
            new ApiError(validation.ErrorCode ?? "url-invalid",
                validation.ErrorMessage ?? "That link can't be downloaded.",
                Field: "url",
                Hint: validation.Hint)));

    /// <summary>The source's fault is a 422; ours (missing tools, network) is a 502/503/504.</summary>
    private static int StatusFor(MediaDownloadFailure failure) => failure.Code switch
    {
        "downloader-missing" or "ffmpeg-missing" => StatusCodes.Status503ServiceUnavailable,
        "timeout" => StatusCodes.Status504GatewayTimeout,
        "network" or "rate-limited" or "downloader-outdated" or "download-failed" => StatusCodes.Status502BadGateway,
        _ => StatusCodes.Status422UnprocessableEntity,
    };

    private async Task<AssetFolder> GetOrCreateFolderAsync(string projectId, string name, CancellationToken ct)
    {
        var existing = (await folders.ListByProjectAsync(projectId, ct))
            .FirstOrDefault(f => f.ParentId is null && string.Equals(f.Name, name, StringComparison.OrdinalIgnoreCase));
        if (existing is not null) return existing;

        var folder = new AssetFolder
        {
            Id = Guid.NewGuid().ToString("N"),
            ProjectId = projectId,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };
        await folders.InsertAsync(folder, ct);
        return folder;
    }

    private static bool IsSharedLibrary(string projectId) =>
        string.Equals(projectId, "global", StringComparison.OrdinalIgnoreCase)
        || string.Equals(projectId, "system", StringComparison.OrdinalIgnoreCase);

    /// <summary>A short, plain extension from a client filename, or ".mp4".</summary>
    private static string SafeExtension(string? fileName)
    {
        var extension = Path.GetExtension(Path.GetFileName(fileName ?? string.Empty));
        return extension is { Length: > 1 and <= 6 } && extension[1..].All(char.IsAsciiLetterOrDigit)
            ? extension.ToLowerInvariant()
            : ".mp4";
    }

    private async Task<Project> LoadOwnedProjectAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }

    private async Task<bool> IsOwnedAssetAsync(Asset asset, CancellationToken ct)
    {
        if (IsSharedLibrary(asset.ProjectId)) return true;

        var project = await projects.GetAsync(asset.ProjectId, ct);
        return project is not null
            && string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal);
    }
}
