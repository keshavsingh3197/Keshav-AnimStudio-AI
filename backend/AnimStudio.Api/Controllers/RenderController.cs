using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class RenderController(
    IRenderJobRepository jobs,
    IProjectRepository projects,
    ISceneRepository scenes,
    IObjectStore store,
    IRenderCapabilities capabilities,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<RenderController> logger) : ControllerBase
{
    /// <summary>Queues a render. Long-running, so it returns a job to poll.</summary>
    [HttpPost("api/projects/{projectId}/render")]
    public async Task<ActionResult<ApiResponse<RenderJobResponse>>> Render(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        // Refuse up front rather than accepting a job that cannot possibly succeed.
        if (!capabilities.IsAvailable)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<RenderJobResponse>.Fail(
                    capabilities.UnavailableReason ?? "Video rendering is not configured on this server.",
                    new ApiError("RendererUnavailable",
                        capabilities.UnavailableReason
                        ?? "Video rendering is not configured on this server.")));
        }

        var sceneList = await scenes.ListByProjectAsync(projectId, ct);
        if (sceneList.Count == 0)
        {
            return BadRequest(ApiResponse<RenderJobResponse>.Fail(
                "This project has no scenes to render.",
                new ApiError("NoScenes", "This project has no scenes to render.")));
        }

        var job = new RenderJob
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Status = RenderJobStatus.Pending,
            ScenesTotal = sceneList.Count,
            Message = "Queued",
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };

        await jobs.InsertAsync(job, ct);
        logger.LogInformation("Queued render job {JobId} for project {ProjectId}.", job.Id, projectId);

        return Accepted(ApiResponse<RenderJobResponse>.Ok(Map(job)));
    }

    /// <summary>Poll target. Stop polling once the status is terminal.</summary>
    [HttpGet("api/render-jobs/{jobId}")]
    public async Task<ActionResult<ApiResponse<RenderJobResponse>>> GetJob(
        string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);
        return Ok(ApiResponse<RenderJobResponse>.Ok(Map(job)));
    }

    [HttpGet("api/projects/{projectId}/render-jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RenderJobResponse>>>> ListJobs(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await jobs.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<RenderJobResponse>>.Ok([.. list.Select(Map)]));
    }

    [HttpPost("api/render-jobs/{jobId}/cancel")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Cancel(
        string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        if (job.IsTerminal)
        {
            return BadRequest(ApiResponse<EmptyPayload>.Fail(
                "That render has already finished.",
                new ApiError("job-already-finished", "That render has already finished.")));
        }

        // The flag is picked up by the worker's next progress write, which then stops the
        // renderer - so cancelling does not need to reach into the process from here.
        await jobs.RequestCancelAsync(jobId, ct);

        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    /// <summary>Downloads the finished file as an attachment.</summary>
    [HttpGet("api/render-jobs/{jobId}/download")]
    public async Task<IActionResult> Download(string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        if (job.OutputStorageKey is null)
            throw new KeyNotFoundException();

        var stream = await store.OpenAsync(job.OutputStorageKey, ct)
            ?? throw new KeyNotFoundException();

        return File(stream, "video/mp4", $"animstudio-{jobId}.mp4");
    }

    /// <summary>
    /// Serves the finished video for in-page playback.
    /// <para>
    /// This exists separately from the download endpoint because <see cref="IObjectStore"/>
    /// returns a non-seekable stream, so ASP.NET cannot answer the HTTP range requests a
    /// &lt;video&gt; element makes when the viewer scrubs - and Safari will not play at all
    /// without them. The object is therefore staged to a local file once and served with
    /// range processing enabled. When storage moves to a bucket this becomes a redirect to
    /// a presigned URL, which is why it is isolated here.
    /// </para>
    /// </summary>
    [HttpGet("api/render-jobs/{jobId}/preview")]
    public async Task<IActionResult> Preview(string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        if (job.OutputStorageKey is null)
            throw new KeyNotFoundException();

        var cacheDirectory = Path.Combine(Path.GetTempPath(), "animstudio-preview");
        Directory.CreateDirectory(cacheDirectory);

        var cached = Path.Combine(cacheDirectory, $"{jobId}.mp4");

        if (!System.IO.File.Exists(cached)
            || new FileInfo(cached).Length != (job.OutputSizeBytes ?? -1))
        {
            await using var source = await store.OpenAsync(job.OutputStorageKey, ct)
                ?? throw new KeyNotFoundException();

            // Written to a temp name first so a concurrent request never reads a half file.
            var staging = cached + ".partial";
            await using (var file = new FileStream(staging, FileMode.Create, FileAccess.Write,
                FileShare.None, 1 << 20, useAsync: true))
            {
                await source.CopyToAsync(file, 1 << 20, ct);
            }

            System.IO.File.Move(staging, cached, overwrite: true);
        }

        return PhysicalFile(cached, "video/mp4", enableRangeProcessing: true);
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    private async Task<RenderJob> LoadOwnedJobAsync(string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct) ?? throw new KeyNotFoundException();

        // Ownership is re-verified on the job itself, not inferred from possessing its id.
        if (!string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return job;
    }

    private static RenderJobResponse Map(RenderJob job) => new(
        job.Id, job.ProjectId, job.Status.ToString(), job.Progress, job.Message,
        job.CurrentStage.ToString(), job.ScenesTotal, job.ScenesDone,
        job.ErrorCode, job.ErrorMessage, job.Warnings,
        job.OutputStorageKey is not null,
        job.OutputDurationFrames.HasValue
            ? new FrameCount(job.OutputDurationFrames.Value).ToSeconds(FrameRate.Fps30)
            : null,
        job.CreatedAt, job.CompletedAt);
}
