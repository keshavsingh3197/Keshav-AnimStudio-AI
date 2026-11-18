using System.Diagnostics;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

public sealed record MotionCopyExportResponse(
    string RenderJobId,
    string ProjectId,
    string StorageKey,
    string? AutomationPostId,
    int Width,
    int Height,
    double DurationSeconds,
    long SizeBytes);

/// <summary>
/// Converts a browser-rendered Motion Copy 3D remix video (WebM or MP4) into a YouTube-ready
/// H.264 MP4, registers it as a finished Studio render job, and optionally queues it straight
/// into the Daily Auto-Post hub ready for publishing or scheduling.
/// </summary>
[ApiController]
[Authorize]
[Route("api/motion-copy")]
public sealed class MotionCopyController(
    IProjectRepository projects,
    IRenderJobRepository renderJobs,
    IAutomationRepository automationRepo,
    IObjectStore objectStore,
    IMediaProbeService mediaProbe,
    IRenderWorkspaceFactory workspaces,
    IAiSettingsRepository aiSettingsRepo,
    IOptions<FfmpegOptions> ffmpegOptions,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<MotionCopyController> logger) : ControllerBase
{
    private const string RemixProjectName = "Motion Copy 3D Remixes";

    [HttpPost("export")]
    [RequestSizeLimit(AssetsController.MaxVideoUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = AssetsController.MaxVideoUploadBytes)]
    public async Task<ActionResult<ApiResponse<MotionCopyExportResponse>>> Export(
        IFormFile file,
        [FromForm] string? title,
        [FromForm] string? description,
        [FromForm] string? tags,
        [FromForm] string? targetChannelId,
        [FromForm] bool sendToAutoPost = true,
        [FromForm] int width = 720,
        [FromForm] int height = 1280,
        CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Sign in to save 3D remixes and send them to YouTube or Auto-Post.";
            return StatusCode(403, ApiResponse<MotionCopyExportResponse>.Fail(msg, new ApiError("auth-required", msg)));
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<MotionCopyExportResponse>.Fail(
                "Render a video first before saving.",
                new ApiError("file-required", "Choose or render a video first.")));
        }

        if (file.Length > AssetsController.MaxVideoUploadBytes)
        {
            return BadRequest(ApiResponse<MotionCopyExportResponse>.Fail(
                "Rendered video is too large.",
                new ApiError("file-too-large", "Maximum video size is 512 MB.")));
        }

        await using var probeStream = file.OpenReadStream();
        var validation = await UploadValidator.ValidateAsync(file.FileName, file.ContentType, probeStream, ct);
        if (!validation.IsValid || validation.Kind != AssetKind.Video)
        {
            return BadRequest(ApiResponse<MotionCopyExportResponse>.Fail(
                validation.Message ?? "Upload a valid WebM or MP4 video.",
                new ApiError(validation.Code ?? "invalid-video", validation.Message ?? "Unsupported video format.")));
        }

        var jobId = Guid.NewGuid().ToString("N");
        var storageKey = $"renders/{jobId}.mp4";
        await using var workspace = await workspaces.CreateAsync(jobId, ct);
        var srcPath = workspace.Resolve($"in/source{validation.CanonicalExtension}");
        Directory.CreateDirectory(Path.GetDirectoryName(srcPath)!);
        await using (var fs = System.IO.File.Create(srcPath))
        {
            await using var uploadStream = file.OpenReadStream();
            await uploadStream.CopyToAsync(fs, ct);
        }

        var outPath = workspace.Resolve("out/remix.mp4");
        Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);

        byte[] mp4Bytes;
        if (string.Equals(validation.CanonicalExtension, ".mp4", StringComparison.OrdinalIgnoreCase))
        {
            mp4Bytes = await System.IO.File.ReadAllBytesAsync(srcPath, ct);
        }
        else
        {
            var ffmpegExe = string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath)
                ? "ffmpeg"
                : ffmpegOptions.Value.FfmpegPath;

            var transcodeOk = await TranscodeToMp4Async(ffmpegExe, srcPath, outPath, logger, ct);
            if (!transcodeOk || !System.IO.File.Exists(outPath))
            {
                return StatusCode(500, ApiResponse<MotionCopyExportResponse>.Fail(
                    "Could not encode the recorded WebM remix into MP4. Ensure FFmpeg is configured.",
                    new ApiError("transcode-failed", "FFmpeg could not convert the recorded WebM stream into MP4.")));
            }
            mp4Bytes = await System.IO.File.ReadAllBytesAsync(outPath, ct);
        }

        await using (var saveStream = new MemoryStream(mp4Bytes, writable: false))
        {
            await objectStore.SaveAsync(storageKey, saveStream, "video/mp4", ct);
        }

        MediaProbe? probed = null;
        try { probed = await mediaProbe.ProbeAsync(storageKey, ct); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Probe after Motion Copy MP4 save failed; using fallback dimensions.");
        }

        var finalW = probed?.Width > 0 ? probed.Width!.Value : Math.Clamp(width, 320, 3840);
        var finalH = probed?.Height > 0 ? probed.Height!.Value : Math.Clamp(height, 320, 3840);
        var duration = probed?.DurationSeconds > 0 ? Math.Round(probed.DurationSeconds!.Value, 2) : 15.0;
        var cleanTitle = string.IsNullOrWhiteSpace(title)
            ? "3D Character Remix #Shorts"
            : title.Trim().Length > 100 ? title.Trim()[..100].TrimEnd() : title.Trim();

        var now = clock.GetUtcNow().UtcDateTime;
        var projectId = await EnsureRemixProjectAsync(currentUser.UserId, finalW, finalH, now, ct);

        var job = new RenderJob
        {
            Id = jobId,
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Name = cleanTitle.Length > 90 ? cleanTitle[..90].TrimEnd() : cleanTitle,
            Kind = RenderJobKind.ProceduralAnimated,
            Status = RenderJobStatus.Completed,
            Progress = 100,
            Message = "Motion Copy 3D Remix",
            CurrentStage = RenderStage.Completed,
            ScenesTotal = 1,
            ScenesDone = 1,
            OutputStorageKey = storageKey,
            OutputSizeBytes = mp4Bytes.Length,
            OutputDurationFrames = (int)Math.Round(duration * 30),
            Width = finalW,
            Height = finalH,
            TargetFormat = finalH > finalW ? "Short" : finalW == finalH ? "Square" : "Video",
            CreatedAt = now,
            StartedAt = now,
            CompletedAt = now,
            Diagnostics = new RenderDiagnostics
            {
                OutputDurationSeconds = duration,
                ItemsCount = 1,
                CompletedAt = now
            }
        };
        await renderJobs.InsertAsync(job, ct);

        string? postId = null;
        if (sendToAutoPost)
        {
            var settings = await aiSettingsRepo.GetAsync(ct);
            var cleanChannelId = string.IsNullOrWhiteSpace(targetChannelId) ? null : targetChannelId.Trim();
            var matchedChannel = cleanChannelId is null
                ? null
                : settings?.Channels?.FirstOrDefault(c =>
                    string.Equals(c.Id, cleanChannelId, StringComparison.Ordinal)
                    || string.Equals(c.Publishing?.YouTubeChannelId, cleanChannelId, StringComparison.Ordinal));

            var dateKey = now.ToString("yyyy-MM-dd");
            var tagList = (tags ?? "3D Animation,Comedy Shorts,Motion Remix,Shorts")
                .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(15)
                .ToList();

            var post = new AutomationPost
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = currentUser.UserId,
                RuleId = "motion-copy-3d",
                RuleName = RemixProjectName,
                SourceType = AutomationSourceType.FunnyComedy,
                DateKey = dateKey,
                Fingerprint = $"motion-remix:{dateKey}:{jobId}",
                SourceItemKey = jobId,
                SourceTitle = cleanTitle,
                SourceSummary = "Unique 3D character & stage remix created in Motion Copy studio.",
                TargetChannelId = matchedChannel?.Publishing?.YouTubeChannelId ?? matchedChannel?.Id ?? cleanChannelId,
                TargetChannelHandle = matchedChannel?.Publishing?.YouTubeChannelHandle,
                TargetChannelTitle = matchedChannel?.Publishing?.YouTubeChannelTitle ?? matchedChannel?.Name,
                Title = cleanTitle,
                Script = cleanTitle,
                AiVideoPrompt = "3D character motion replacement remix with custom stage backdrop and camera angles.",
                AiThumbnailPrompt = $"Bold expressive 3D cartoon thumbnail for '{cleanTitle}', high contrast reaction close-up.",
                Description = string.IsNullOrWhiteSpace(description)
                    ? $"{cleanTitle}\n\n#3DAnimation #ComedyShorts #Shorts"
                    : description.Trim(),
                Tags = tagList,
                CategoryId = "23",
                Privacy = "public",
                Format = finalH > finalW
                    ? AutomationVideoFormat.Vertical
                    : finalW == finalH ? AutomationVideoFormat.CommunityPost : AutomationVideoFormat.Wide,
                Language = "en",
                AttachedRenderJobId = jobId,
                AttachedVideoSourceLabel = "Motion Copy 3D Remix",
                Status = AutomationPostStatus.VideoReadyForReview,
                VerificationStatus = "Verified",
                VerificationSummary = "Original Motion Copy 3D remix rendered cleanly in AnimStudio.",
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            };
            await automationRepo.UpsertPostAsync(post, ct);
            postId = post.Id;
        }

        logger.LogInformation("Saved Motion Copy 3D remix render job {JobId} ({W}x{H}, {Bytes}B, post={PostId}) for {UserId}.",
            jobId, finalW, finalH, mp4Bytes.Length, postId ?? "none", currentUser.UserId);

        return Ok(ApiResponse<MotionCopyExportResponse>.Ok(new MotionCopyExportResponse(
            jobId, projectId, storageKey, postId, finalW, finalH, duration, mp4Bytes.Length)));
    }

    private async Task<string> EnsureRemixProjectAsync(
        string userId, int width, int height, DateTime now, CancellationToken ct)
    {
        var owned = await projects.ListAsync(userId, ct);
        var existing = owned.FirstOrDefault(p =>
            string.Equals(p.Name, RemixProjectName, StringComparison.OrdinalIgnoreCase));
        if (existing is not null) return existing.Id;

        var created = new Project
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Name = RemixProjectName,
            Description = "Unique 3D character and stage remixes exported from Motion Copy.",
            Status = ProjectStatus.Rendered,
            Settings = new ProjectSettings
            {
                Width = width,
                Height = height,
                FrameRateNum = 30,
                FrameRateDen = 1
            },
            CreatedAt = now,
            UpdatedAt = now
        };
        await projects.InsertAsync(created, ct);
        return created.Id;
    }

    private static async Task<bool> TranscodeToMp4Async(
        string ffmpegExe, string srcPath, string outPath, ILogger logger, CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = ffmpegExe,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi.ArgumentList.Add("-y");
        psi.ArgumentList.Add("-i");
        psi.ArgumentList.Add(srcPath);
        psi.ArgumentList.Add("-map");
        psi.ArgumentList.Add("0:v:0");
        psi.ArgumentList.Add("-map");
        psi.ArgumentList.Add("0:a:0?");
        psi.ArgumentList.Add("-c:v");
        psi.ArgumentList.Add("libx264");
        psi.ArgumentList.Add("-preset");
        psi.ArgumentList.Add("veryfast");
        psi.ArgumentList.Add("-crf");
        psi.ArgumentList.Add("21");
        psi.ArgumentList.Add("-pix_fmt");
        psi.ArgumentList.Add("yuv420p");
        psi.ArgumentList.Add("-c:a");
        psi.ArgumentList.Add("aac");
        psi.ArgumentList.Add("-ar");
        psi.ArgumentList.Add("48000");
        psi.ArgumentList.Add("-ac");
        psi.ArgumentList.Add("2");
        psi.ArgumentList.Add("-b:a");
        psi.ArgumentList.Add("192k");
        psi.ArgumentList.Add("-movflags");
        psi.ArgumentList.Add("+faststart");
        psi.ArgumentList.Add(outPath);

        using var proc = new Process { StartInfo = psi };
        try
        {
            if (!proc.Start()) return false;
            var stderrTask = proc.StandardError.ReadToEndAsync(ct);
            await proc.WaitForExitAsync(ct);
            if (proc.ExitCode != 0)
            {
                var err = await stderrTask;
                logger.LogWarning("Motion Copy WebM->MP4 transcode failed (exit {Code}): {Err}",
                    proc.ExitCode, err.Length > 500 ? err[^500..] : err);
                return false;
            }
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not launch FFmpeg for Motion Copy transcode.");
            return false;
        }
    }
}
