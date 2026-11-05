using System.Globalization;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Queues the project's render on the same queue the Render button uses and follows it to the end, so the run is not
/// "completed" until there is a video. Stopping the run stops the render, unless the server itself is going down - then the
/// render's own lease takes care of it, exactly as it would for a render started by hand.
/// <para>
/// When the story's video speed is not 1, a copy of that render at the speed becomes the story's video, and the scene
/// timings move with it so the subtitles and chapters match.
/// </para>
/// </summary>
public sealed class RenderStage(
    IRenderJobRepository jobs,
    IProjectRepository projects,
    ISceneRepository scenes,
    IRenderCapabilities capabilities,
    ProjectStatusService status,
    IOptionsMonitor<RenderOptions> renderOptions,
    IFfmpegRunner runner,
    IRenderWorkspaceFactory workspaces,
    TimeProvider clock,
    ILogger<RenderStage> logger) : IStoryStage
{
    private static readonly TimeSpan PollEvery = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan SpeedTimeout = TimeSpan.FromMinutes(45);

    public string Id => StoryStageIds.Render;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        if (!run.Options.RenderWhenReady)
            return StoryStageOutcome.Skipped("render-off", "Rendering was left for you: open the project and press Render when you are ready.");

        var projectId = run.ProjectId ?? throw new StoryStageException("no-project", "The project was not built, so there is nothing to render.");
        if (!capabilities.IsAvailable)
        {
            throw new StoryStageException("renderer-unavailable",
                capabilities.UnavailableReason ?? "Video rendering is not set up on this server (it needs ffmpeg).");
        }

        // A render from an earlier try is followed, not repeated, unless it ended badly. It is the project's own render - the
        // copy at the video's speed is made from it below - so a change of speed alone never renders the project again.
        var sourceId = run.SourceRenderJobId ?? run.RenderJobId;
        var job = string.IsNullOrEmpty(sourceId) ? null : await jobs.GetAsync(sourceId, ct).ConfigureAwait(false);
        if (job is null || job.Status is RenderJobStatus.Failed or RenderJobStatus.Cancelled)
            job = await QueueAsync(context, projectId, ct).ConfigureAwait(false);

        try
        {
            while (!job.IsTerminal)
            {
                await context.Report(job.Progress, string.IsNullOrWhiteSpace(job.Message) ? "Rendering the video" : job.Message).ConfigureAwait(false);
                await Task.Delay(PollEvery, ct).ConfigureAwait(false);
                job = await jobs.GetAsync(job.Id, ct).ConfigureAwait(false)
                    ?? throw new StoryStageException("render-missing", "The render job was removed before it finished.");
            }
        }
        catch (OperationCanceledException) when (!context.Shutdown.IsCancellationRequested)
        {
            // The person stopped the run: stop the render too, rather than leave it eating the CPU.
            await jobs.RequestCancelAsync(job.Id, CancellationToken.None).ConfigureAwait(false);
            throw;
        }

        if (job.Status == RenderJobStatus.Failed)
            throw new StoryStageException(job.ErrorCode ?? "render-failed", job.ErrorMessage ?? "The render failed. Open the project's render list for the details.");
        if (job.Status == RenderJobStatus.Cancelled)
            throw new StoryStageException("render-cancelled", "The render was cancelled.");

        foreach (var warning in job.Warnings) StoryRunWarnings.Add(run, warning);
        run.SourceRenderJobId = job.Id;

        var speed = StoryVideoSpeed.Normalize(run.Options.VideoSpeed);
        if (StoryVideoSpeed.Same(speed, 1.0))
        {
            run.RenderJobId = job.Id;
            StoryVideoSpeed.Retime(run, 1.0);
            return StoryStageOutcome.Completed("The video is rendered.");
        }

        // No video until the copy exists, so nothing is ever watched or sent at a speed its subtitles were not timed for.
        run.RenderJobId = null;
        await context.Save().ConfigureAwait(false);

        var copy = await SpeedCopyAsync(context, job, speed, ct).ConfigureAwait(false);
        run.RenderJobId = copy.Id;
        StoryVideoSpeed.Retime(run, speed);
        return StoryStageOutcome.Completed($"The video is rendered at {Times(speed)}, {Clock(run.TotalSeconds)} long.");
    }

    /// <summary>
    /// Re-encodes the finished render at <paramref name="speed"/>: the pictures retimed, the voice and music sped up with
    /// their pitch kept. Recorded as a render of the project only once it is done - a waiting job would be picked up by the
    /// render worker and rendered from the project instead.
    /// </summary>
    private async Task<RenderJob> SpeedCopyAsync(StoryStageContext context, RenderJob source, double speed, CancellationToken ct)
    {
        var sourceKey = source.OutputStorageKey ?? throw new StoryStageException("render-missing", "The rendered video file is missing. Render the story again.");
        var copyId = ObjectId.GenerateNewId().ToString();
        // How long the copy will run, for the progress figure: the render's own length, else the build's timings at 1×.
        var run = context.Run;
        var sourceSeconds = source.Diagnostics?.OutputDurationSeconds is > 0
            ? source.Diagnostics.OutputDurationSeconds.Value
            : run.TotalSeconds * (run.TimingSpeed > 0 ? run.TimingSpeed : 1.0);
        var expected = sourceSeconds / speed;

        await context.Report(0, $"Making the video {Times(speed)}").ConfigureAwait(false);
        await using var workspace = await workspaces.CreateAsync($"story-speed-{copyId}", ct).ConfigureAwait(false);
        var input = await workspace.MaterializeAsync(sourceKey, "in/source.mp4", ct).ConfigureAwait(false);

        var rate = speed.ToString("0.###", CultureInfo.InvariantCulture);
        var invocation = new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            CaptureProgress = true,
            StderrLogPath = "logs/speed.log",
            Timeout = SpeedTimeout,
            Arguments =
            [
                "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-nostats", "-progress", "pipe:1",
                "-i", input,
                "-map", "0:v:0", "-map", "0:a:0?",
                // The frame rate stays the file's own: frames are dropped (faster) or repeated (slower), not respaced.
                "-vf", $"setpts=PTS/{rate}",
                "-af", $"atempo={rate}",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                "-movflags", "+faststart",
                "out/final.mp4"
            ]
        };

        // ffmpeg reports on its own thread; the latest figure is passed on every couple of seconds. Stopping the run stops
        // ffmpeg through ct, and the encode then ends the wait by itself.
        var done = 0;
        var progress = new Progress<FfmpegProgress>(p =>
        {
            if (expected > 0) Volatile.Write(ref done, (int)Math.Clamp(p.OutTime.TotalSeconds / expected * 100, 0, 99));
        });

        var encode = runner.RunAsync(invocation, progress, ct);
        while (await Task.WhenAny(encode, Task.Delay(PollEvery, CancellationToken.None)).ConfigureAwait(false) != encode)
            await context.Report(Volatile.Read(ref done), $"Making the video {Times(speed)}").ConfigureAwait(false);

        var result = await encode.ConfigureAwait(false);
        if (result.ExitCode != 0)
        {
            workspace.MarkFailed("speed-copy-failed");
            logger.LogWarning("The {Speed}x copy of render {JobId} failed (exit {ExitCode}): {Stderr}",
                rate, source.Id, result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new StoryStageException("speed-copy-failed", $"The video could not be made {Times(speed)}. Retry, or set the speed back to 1×.");
        }

        var outputKey = $"renders/{source.ProjectId}/{copyId}/final.mp4";
        var size = new FileInfo(workspace.Resolve("out/final.mp4")).Length;
        await workspace.PublishAsync("out/final.mp4", outputKey, "video/mp4", ct).ConfigureAwait(false);

        var now = clock.GetUtcNow().UtcDateTime;
        var copy = new RenderJob
        {
            Id = copyId,
            ProjectId = source.ProjectId,
            UserId = source.UserId,
            Name = $"{source.Name ?? "Render"} · {Times(speed)}",
            Status = RenderJobStatus.Completed,
            Progress = 100,
            Message = $"A copy of the render at {Times(speed)}",
            CurrentStage = source.CurrentStage,
            ScenesTotal = source.ScenesTotal,
            ScenesDone = source.ScenesDone,
            OutputStorageKey = outputKey,
            OutputSizeBytes = size,
            OutputDurationFrames = source.OutputDurationFrames is { } frames ? (int)Math.Round(frames / speed) : null,
            Width = source.Width,
            Height = source.Height,
            TargetFormat = source.TargetFormat,
            Warnings = [.. source.Warnings],
            CreatedAt = now,
            StartedAt = now - result.Elapsed,
            CompletedAt = now
        };

        await jobs.InsertAsync(copy, ct).ConfigureAwait(false);
        logger.LogInformation("Story run {RunId}: render {JobId} copied at {Speed}x as {CopyId} in {Elapsed}.",
            context.Run.Id, source.Id, rate, copyId, result.Elapsed);
        return copy;
    }

    private static string Times(double speed) => $"{speed.ToString("0.##", CultureInfo.InvariantCulture)}×";

    private static string Clock(double seconds)
    {
        var time = TimeSpan.FromSeconds(Math.Max(0, Math.Round(seconds)));
        return time.TotalHours >= 1 ? time.ToString(@"h\:mm\:ss", CultureInfo.InvariantCulture) : time.ToString(@"m\:ss", CultureInfo.InvariantCulture);
    }

    private async Task<RenderJob> QueueAsync(StoryStageContext context, string projectId, CancellationToken ct)
    {
        var run = context.Run;
        var sceneList = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        if (sceneList.Count == 0) throw new StoryStageException("no-scenes", "The project has no scenes to render.");

        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false);
        var width = project?.Settings.Width ?? 1920;
        var height = project?.Settings.Height ?? 1080;
        var targetFormat = width < height ? "Short" : width == height ? "Square" : "Video";
        var createdAt = clock.GetUtcNow().UtcDateTime;
        var renderNumber = (await jobs.ListByProjectAsync(projectId, ct).ConfigureAwait(false)).Count + 1;

        var job = new RenderJob
        {
            ProjectId = projectId,
            UserId = run.UserId,
            Name = RenderJobNaming.Expand(renderOptions.CurrentValue.JobNameTemplate,
                new RenderNameContext(project?.Name, targetFormat, AspectLabel(width, height), width, height, renderNumber, createdAt)),
            Status = RenderJobStatus.Pending,
            ScenesTotal = sceneList.Count,
            Message = "Queued",
            Width = width,
            Height = height,
            TargetFormat = targetFormat,
            CreatedAt = createdAt
        };

        await jobs.InsertAsync(job, ct).ConfigureAwait(false);
        await status.MarkRenderingAsync(projectId, ct).ConfigureAwait(false);

        // Said before the first poll, so a restart now finds this job instead of queueing a second.
        run.SourceRenderJobId = job.Id;
        run.RenderJobId = job.Id;
        await context.Save().ConfigureAwait(false);

        logger.LogInformation("Story run {RunId} queued render job {JobId} for project {ProjectId}.", run.Id, job.Id, projectId);
        return job;
    }

    private static string AspectLabel(int width, int height)
    {
        if (width <= 0 || height <= 0) return "16:9";
        int a = width, b = height;
        while (b != 0) (a, b) = (b, a % b);
        return $"{width / a}:{height / a}";
    }
}
