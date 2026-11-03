using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Queues the project's render on the same queue the Render button uses and follows it to the end, so the run is not
/// "completed" until there is a video. Stopping the run stops the render, unless the server itself is going down - then the
/// render's own lease takes care of it, exactly as it would for a render started by hand.
/// </summary>
public sealed class RenderStage(
    IRenderJobRepository jobs,
    IProjectRepository projects,
    ISceneRepository scenes,
    IRenderCapabilities capabilities,
    ProjectStatusService status,
    IOptionsMonitor<RenderOptions> renderOptions,
    TimeProvider clock,
    ILogger<RenderStage> logger) : IStoryStage
{
    private static readonly TimeSpan PollEvery = TimeSpan.FromSeconds(2);

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

        // A render from an earlier try is followed, not repeated, unless it ended badly.
        var job = string.IsNullOrEmpty(run.RenderJobId) ? null : await jobs.GetAsync(run.RenderJobId, ct).ConfigureAwait(false);
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
        return StoryStageOutcome.Completed("The video is rendered.");
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
