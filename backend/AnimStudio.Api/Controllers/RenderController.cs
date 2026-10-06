using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class RenderController(
    IRenderJobRepository jobs,
    IProjectRepository projects,
    ISceneRepository scenes,
    IObjectStore store,
    IRenderCapabilities capabilities,
    ProjectStatusService status,
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

        var project = await projects.GetAsync(projectId, ct);
        var jobWidth = project?.Settings.Width ?? 1920;
        var jobHeight = project?.Settings.Height ?? 1080;
        var targetFormat = (jobWidth < jobHeight) ? "Short" : (jobWidth == jobHeight ? "Square" : "Video");

        var job = new RenderJob
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Status = RenderJobStatus.Pending,
            ScenesTotal = sceneList.Count,
            Message = "Queued",
            Width = jobWidth,
            Height = jobHeight,
            TargetFormat = targetFormat,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };

        await jobs.InsertAsync(job, ct);
        await status.MarkRenderingAsync(projectId, ct);

        logger.LogInformation("Queued render job {JobId} for project {ProjectId}.", job.Id, projectId);

        return Accepted(ApiResponse<RenderJobResponse>.Ok(job.ToResponse()));
    }

    /// <summary>Poll target. Stop polling once the status is terminal.</summary>
    [HttpGet("api/render-jobs/{jobId}")]
    public async Task<ActionResult<ApiResponse<RenderJobResponse>>> GetJob(
        string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);
        return Ok(ApiResponse<RenderJobResponse>.Ok(job.ToResponse()));
    }

    [HttpGet("api/projects/{projectId}/render-jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RenderJobResponse>>>> ListJobs(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await jobs.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<RenderJobResponse>>.Ok([.. list.Select(Mappings.ToResponse)]));
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

    /// <summary>
    /// Downloads the finished file as an attachment, named for what it is.
    /// <para>
    /// The name carries the project and the format - <c>lion-reel-short-6aa41839.mp4</c> -
    /// because a downloads folder is where these files are actually sorted, and a folder of
    /// <c>animstudio-&lt;hex&gt;.mp4</c> is unsortable: the one thing a person needs to know
    /// before uploading is whether they are holding the Short or the landscape cut. The job
    /// id stays on the end so two builds of the same project remain distinguishable.
    /// </para>
    /// </summary>
    [HttpGet("api/render-jobs/{jobId}/download")]
    public async Task<IActionResult> Download(string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        if (job.OutputStorageKey is null)
            throw new KeyNotFoundException();

        var stream = await store.OpenAsync(job.OutputStorageKey, ct)
            ?? throw new KeyNotFoundException();

        // A deleted project costs a plainer filename, not a failed download.
        var project = await projects.GetAsync(job.ProjectId, ct);

        return File(stream, "video/mp4", DownloadName(job, project, jobId));
    }

    /// <summary>
    /// Downloads where each clip, sound and overlay sits in the finished file:
    /// <c>youtube</c> (a description draft with chapters and credits), <c>csv</c> or <c>json</c>.
    /// Only clip exports completed since the timeline was recorded have one; anything else
    /// is a 404, the same answer as a job with no output.
    /// </summary>
    [HttpGet("api/render-jobs/{jobId}/timeline")]
    public async Task<IActionResult> DownloadTimeline(
        string jobId, [FromQuery] string? format, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        // Allowlist, not Enum.TryParse: that would also accept "1" or "YouTube, Csv".
        ExportTimelineFormat? requested = (format ?? "youtube").ToLowerInvariant() switch
        {
            "youtube" => ExportTimelineFormat.YouTube,
            "csv" => ExportTimelineFormat.Csv,
            "json" => ExportTimelineFormat.Json,
            _ => null
        };

        if (requested is not { } parsed)
        {
            const string message = "format must be youtube, csv or json.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("invalid-format", message)));
        }

        if (job.Timeline is not { Entries.Count: > 0 } timeline)
            throw new KeyNotFoundException();

        var project = await projects.GetAsync(job.ProjectId, ct);
        var title = job.ClipMerge?.ExportName is { Length: > 0 } exportName ? exportName : project?.Name;

        var (content, contentType, extension) = ExportTimelineFormatter.Format(timeline, parsed, title);
        var suffix = parsed == ExportTimelineFormat.YouTube ? "youtube-description" : "timeline";
        var name = $"{Path.GetFileNameWithoutExtension(DownloadName(job, project, jobId))}-{suffix}.{extension}";

        // A BOM so Excel reads a CSV of non-ASCII labels as UTF-8 rather than the ANSI codepage.
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(content)).ToArray();
        return File(bytes, $"{contentType}; charset=utf-8", name);
    }

    /// <summary>
    /// Builds the attachment filename: project slug, format, and a short job id.
    /// <para>
    /// Reduced to lowercase ASCII letters, digits and single hyphens. The framework encodes
    /// whatever it is given per RFC 6266, so this is about a name that is readable and
    /// portable across filesystems rather than about escaping.
    /// </para>
    /// <para>
    /// A clip export carries the name of the Short/Video it was built from, and that name
    /// wins as-is: the file is called what the person called the cut, not the project.
    /// </para>
    /// </summary>
    private static string DownloadName(RenderJob job, Project? project, string jobId)
    {
        if (ReadableName(job.ClipMerge?.ExportName) is { } exportName)
            return $"{exportName}.mp4";

        var format = project is null
            ? "video"
            : Canvas.Describe(project.Settings.Width, project.Settings.Height)
                .ToString()
                .ToLowerInvariant();

        var slug = Slug(project?.Name);
        var suffix = jobId.Length > 8 ? jobId[..8] : jobId;

        return $"{slug}-{format}-{suffix}.mp4";
    }

    /// <summary>
    /// The name kept readable - case, spaces, any script - but reduced to characters every
    /// filesystem accepts. Anything outside the allowlist becomes a space, so a slash or a
    /// colon cannot turn the name into a path. Null when nothing usable is left.
    /// </summary>
    private static string? ReadableName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        const string allowedPunctuation = " -_.,()[]!&'+#";
        var builder = new StringBuilder(name.Length);
        foreach (var ch in name)
        {
            // Marks are kept so Devanagari and other combining scripts stay intact.
            var keep = char.IsLetterOrDigit(ch)
                || char.GetUnicodeCategory(ch) is UnicodeCategory.NonSpacingMark or UnicodeCategory.SpacingCombiningMark
                || allowedPunctuation.Contains(ch);
            var c = keep ? ch : ' ';
            if (c == ' ' && (builder.Length == 0 || builder[^1] == ' ')) continue;
            builder.Append(c);
        }

        // Trailing dots and spaces are invalid on Windows.
        var cleaned = builder.ToString().Trim().TrimEnd('.', ' ');
        if (cleaned.Length == 0) return null;
        return cleaned.Length <= 120 ? cleaned : cleaned[..120].TrimEnd('.', ' ');
    }

    private static string Slug(string? name)
    {
        const string fallback = "animstudio";

        if (string.IsNullOrWhiteSpace(name)) return fallback;

        var builder = new StringBuilder(name.Length);
        var lastWasHyphen = false;

        foreach (var ch in name)
        {
            if (char.IsAsciiLetterOrDigit(ch))
            {
                builder.Append(char.ToLowerInvariant(ch));
                lastWasHyphen = false;
            }
            else if (!lastWasHyphen && builder.Length > 0)
            {
                // Anything else - spaces, punctuation, any non-ASCII script - collapses to
                // one hyphen, so a name in Devanagari yields a short slug rather than a
                // string of escapes.
                builder.Append('-');
                lastWasHyphen = true;
            }
        }

        var slug = builder.ToString().Trim('-');
        if (slug.Length == 0) return fallback;

        return slug.Length <= 60 ? slug : slug[..60].TrimEnd('-');
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
}
