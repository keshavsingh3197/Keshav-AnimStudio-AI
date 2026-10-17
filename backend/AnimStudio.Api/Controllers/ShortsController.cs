using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Application.Shorts;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The Shorts page: every short the user has made, across all projects, with where each one
/// has gone (Google Drive, YouTube) - so a batch can be found, finished and sent on after
/// the dialog that started it is long closed, and many can be sent in one go.
/// <para>
/// Everything is read and written for the signed-in user only: shorts are gathered from
/// the user's own projects, and every id a bulk action names is checked against its owner
/// one by one, so a foreign id is simply reported as not found.
/// </para>
/// </summary>
[ApiController]
[Route("api/shorts")]
public sealed class ShortsController(
    IProjectRepository projects,
    IRenderJobRepository jobs,
    IAssetRepository assets,
    IPhoneHandoffRepository handoffs,
    IYouTubePublicationRepository publications,
    YouTubeUploadManager uploads,
    PhoneHandoffManager handoffManager,
    GoogleDriveConnectionStore drive,
    IOptionsMonitor<ShortsOptions> options,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<ShortsController> logger) : ControllerBase
{
    /// <summary>Publish records and Drive copies read per overview; far more than one person makes.</summary>
    private const int MaxRecords = 2000;

    /// <summary>
    /// Every short (or, with <paramref name="scope"/> <c>all</c>, every render) with its Drive
    /// and YouTube state, the counts the page's tiles show, each auto-shorts project's stock
    /// of unused clips, and what needs attention.
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<ShortsOverviewResponse>>> Overview(
        [FromQuery] string? projectId, [FromQuery] string? scope, CancellationToken ct)
    {
        if (projectId is not null && !ShortsIds.IsEntityId(projectId))
            return BadRequest(ApiResponse<ShortsOverviewResponse>.Fail("Unknown project.", new ApiError("project-invalid", "Unknown project.", Field: "projectId")));

        var userId = currentUser.UserId;
        var owned = await projects.ListAsync(userId, ct);
        var inScope = projectId is null ? owned : [.. owned.Where(p => p.Id == projectId)];
        if (projectId is not null && inScope.Count == 0) throw new KeyNotFoundException();

        var everything = string.Equals(scope, "all", StringComparison.OrdinalIgnoreCase);
        var rows = new List<ShortRowResponse>();
        var states = new List<ShortState>();
        var pools = new List<ShortsPool>();

        var published = (await publications.ListByUserAsync(userId, projectId, MaxRecords, ct))
            .Where(p => !string.IsNullOrEmpty(p.JobId))
            .GroupBy(p => p.JobId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(p => p.PublishedAt).First(), StringComparer.Ordinal);
        var uploading = uploads.List(userId, null)
            .GroupBy(u => u.JobId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(u => u.StartedAt).First(), StringComparer.Ordinal);
        var copies = (await handoffs.ListByUserAsync(userId, null, MaxRecords, ct))
            .Where(h => h.State != PhoneHandoffState.Cancelled)
            .GroupBy(h => h.JobId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(h => h.CreatedAt).First(), StringComparer.Ordinal);

        foreach (var project in inScope)
        {
            var projectJobs = await jobs.ListByProjectAsync(project.Id, ct);

            foreach (var job in projectJobs.Where(j => everything || IsShort(j)))
            {
                var youtube = YouTubeState(job.Id, published, uploading, copies);
                var copy = copies.GetValueOrDefault(job.Id);
                var driveState = copy is null ? null : DriveState(copy);
                rows.Add(new ShortRowResponse(job.ToResponse(), project.Name, driveState, youtube));
                states.Add(new ShortState(job,
                    youtube?.State == "Published",
                    copy?.State is PhoneHandoffState.Saved or PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Applied or PhoneHandoffState.Expired,
                    copy?.State == PhoneHandoffState.Failed));
            }

            // Stock is only worth reading for a project that makes auto shorts (or the one asked about).
            if (projectId is not null || projectJobs.Any(j => j.Batch is not null))
                pools.Add(ShortsOverview.Pool(project.Id, project.Name, await assets.ListByProjectAsync(project.Id, ct), projectJobs));
        }

        var settings = options.CurrentValue;
        var now = clock.GetUtcNow().UtcDateTime;
        var counts = new ShortsCountsResponse(
            states.Count,
            states.Count(s => !s.Job.IsTerminal),
            states.Count(s => ShortsOverview.IsReady(s.Job)),
            states.Count(s => s.Job.Status == RenderJobStatus.Failed),
            states.Count(s => s.OnYouTube),
            states.Count(s => ShortsOverview.IsReady(s.Job) && !s.OnYouTube),
            states.Count(s => s.OnDrive),
            states.Count(s => ShortsOverview.IsReady(s.Job) && !s.OnDrive),
            states.Count(s => s.Job.CreatedAt >= now.AddDays(-7) && s.Job.Status is not (RenderJobStatus.Failed or RenderJobStatus.Cancelled)),
            Math.Max(0, settings.WeeklyGoal));

        return Ok(ApiResponse<ShortsOverviewResponse>.Ok(new ShortsOverviewResponse(
            [.. rows.OrderByDescending(r => r.Job.CreatedAt)],
            counts,
            [.. pools.Select(p => new ShortsPoolResponse(p.ProjectId, p.ProjectName, p.Videos, p.Images, p.UnusedVideos, p.UnusedImages, p.Batches, p.Shorts))],
            ShortsOverview.Alerts(states, pools, settings, now))));
    }

    /// <summary>How many renders each of a project's files has been used in, for the Auto Shorts picker's "used" marks.</summary>
    [HttpGet("usage")]
    public async Task<ActionResult<ApiResponse<Dictionary<string, int>>>> Usage([FromQuery] string projectId, CancellationToken ct)
    {
        if (!ShortsIds.IsEntityId(projectId))
            return BadRequest(ApiResponse<Dictionary<string, int>>.Fail("Unknown project.", new ApiError("project-invalid", "Unknown project.", Field: "projectId")));

        await EnsureOwnedAsync(projectId, ct);
        return Ok(ApiResponse<Dictionary<string, int>>.Ok(ShortsOverview.CountUses(await jobs.ListByProjectAsync(projectId, ct))));
    }

    /// <summary>
    /// Renders still running and Drive copies still on their way, across every project, so
    /// the activity panel can pick them back up after a page refresh.
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<ShortsActiveResponse>>> Active(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var running = new List<RenderJobResponse>();
        foreach (var project in await projects.ListAsync(userId, ct))
            running.AddRange((await jobs.ListByProjectAsync(project.Id, ct)).Where(j => !j.IsTerminal).Select(j => j.ToResponse()));

        var sending = (await handoffs.ListByUserAsync(userId, null, MaxRecords, ct))
            .Where(h => h.State is PhoneHandoffState.Sending or PhoneHandoffState.WaitingForRender)
            .Select(handoffManager.Describe)
            .ToList();

        return Ok(ApiResponse<ShortsActiveResponse>.Ok(new ShortsActiveResponse([.. running.OrderBy(j => j.CreatedAt)], sending)));
    }

    /// <summary>
    /// Copies many renders to Google Drive in one go. A finished render starts copying now;
    /// one still rendering is copied the moment it finishes. Renders already on Drive (or on
    /// their way) are skipped unless <see cref="ShortsDriveRequest.Again"/> is set.
    /// </summary>
    [HttpPost("drive")]
    public async Task<ActionResult<ApiResponse<ShortsBulkResponse>>> SaveToDrive([FromBody] ShortsDriveRequest request, CancellationToken ct)
    {
        if (!request.JobIds.All(ShortsIds.IsEntityId)) return BadJobIds();

        DriveTarget target;
        try
        {
            target = await drive.ResolveAsync(currentUser.UserId, request.ChannelId, request.FolderName, ct);
        }
        catch (YouTubePublishException ex)
        {
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail(ex.Message,
                new ApiError(ex.Code, ex.Message, Field: ex.Code == "drive-folder-invalid" ? "folderName" : "drive")));
        }

        var results = new List<ShortsBulkResult>();
        foreach (var jobId in request.JobIds.Distinct(StringComparer.Ordinal))
        {
            var job = await LoadOwnedJobOrNullAsync(jobId, ct);
            if (job is null) { results.Add(ShortsBulkResult.Refuse(jobId, "not-found", "This render is no longer there.")); continue; }

            if (job.Status is RenderJobStatus.Failed or RenderJobStatus.Cancelled)
            {
                results.Add(ShortsBulkResult.Refuse(jobId, "render-not-ready", "This render didn't finish, so there is nothing to copy."));
                continue;
            }

            if (!request.Again)
            {
                var existing = (await handoffs.ListByUserAsync(currentUser.UserId, job.Id, 10, ct))
                    .FirstOrDefault(h => h.State is not (PhoneHandoffState.Failed or PhoneHandoffState.Cancelled));
                if (existing is not null)
                {
                    results.Add(ShortsBulkResult.Skip(jobId, "already-on-drive", "Already on Google Drive, or on its way."));
                    continue;
                }
            }

            var title = string.IsNullOrWhiteSpace(job.Name) ? "AnimStudio video" : job.Name.Trim();
            var ready = ShortsOverview.IsReady(job);
            var handoff = DriveCopies.SaveOnly(currentUser.UserId, job.ProjectId, job.Id, request.ChannelId, title, target,
                ready ? PhoneHandoffState.Sending : PhoneHandoffState.WaitingForRender);
            handoff.TotalBytes = job.OutputSizeBytes ?? 0;
            await handoffs.UpsertAsync(handoff, ct);
            if (ready) handoffManager.StartSending(handoff, job.OutputStorageKey!, job.OutputSizeBytes ?? 0);
            results.Add(ShortsBulkResult.Start(jobId, ready ? "Copying to Google Drive." : "Will copy as soon as it finishes rendering."));
        }

        logger.LogInformation("User {UserId} sent {Count} renders to Google Drive", currentUser.UserId, results.Count(r => r.Ok && !r.Skipped));
        return Accepted(ApiResponse<ShortsBulkResponse>.Ok(ShortsBulkResponse.From(results)));
    }

    /// <summary>Puts failed or cancelled renders back in the queue.</summary>
    [HttpPost("retry")]
    public async Task<ActionResult<ApiResponse<ShortsBulkResponse>>> Retry([FromBody] ShortsJobIdsRequest request, CancellationToken ct)
    {
        if (!request.JobIds.All(ShortsIds.IsEntityId)) return BadJobIds();

        var results = new List<ShortsBulkResult>();
        foreach (var jobId in request.JobIds.Distinct(StringComparer.Ordinal))
        {
            var job = await LoadOwnedJobOrNullAsync(jobId, ct);
            if (job is null) { results.Add(ShortsBulkResult.Refuse(jobId, "not-found", "This render is no longer there.")); continue; }

            results.Add(await jobs.RequeueAsync(job.Id, ct)
                ? ShortsBulkResult.Start(jobId, "Back in the queue.")
                : ShortsBulkResult.Skip(jobId, "not-retryable", "Only a failed or cancelled render can be tried again."));
        }

        logger.LogInformation("User {UserId} requeued {Count} renders", currentUser.UserId, results.Count(r => r.Ok && !r.Skipped));
        return Ok(ApiResponse<ShortsBulkResponse>.Ok(ShortsBulkResponse.From(results)));
    }

    private BadRequestObjectResult BadJobIds() =>
        BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Unknown render.", new ApiError("job-invalid", "Unknown render.", Field: "jobIds")));

    /// <summary>An auto short, or any render made upright for Shorts and Reels.</summary>
    private static bool IsShort(RenderJob job) =>
        job.Batch is not null || (job.Width is { } w && job.Height is { } h && w < h);

    private static ShortDriveResponse DriveState(PhoneHandoff h) => new(
        h.Id,
        h.State.ToString(),
        h.DriveFolderName,
        h.DriveFileId is null ? null : $"https://drive.google.com/file/d/{Uri.EscapeDataString(h.DriveFileId)}/view",
        h.State == PhoneHandoffState.Failed ? h.Error : null);

    private static ShortYouTubeResponse? YouTubeState(
        string jobId,
        IReadOnlyDictionary<string, YouTubePublication> published,
        IReadOnlyDictionary<string, YouTubeUploadStatus> uploading,
        IReadOnlyDictionary<string, PhoneHandoff> copies)
    {
        if (published.TryGetValue(jobId, out var p))
            return new ShortYouTubeResponse("Published", p.VideoId, $"https://youtube.com/shorts/{p.VideoId}", p.ChannelTitle, p.Privacy, 100, null);

        // A phone upload the prepared details were applied to is on YouTube too.
        if (copies.TryGetValue(jobId, out var h) && h.State == PhoneHandoffState.Applied && h.VideoId is { } phoneVideo)
            return new ShortYouTubeResponse("Published", phoneVideo, $"https://youtube.com/shorts/{phoneVideo}", h.ChannelTitle, h.Privacy, 100, null);

        if (uploading.TryGetValue(jobId, out var u))
        {
            return u.State switch
            {
                YouTubeUploadState.Completed when u.VideoId is not null =>
                    new ShortYouTubeResponse("Published", u.VideoId, u.VideoUrl, u.ChannelTitle, u.Privacy, 100, null),
                YouTubeUploadState.Queued or YouTubeUploadState.Uploading =>
                    new ShortYouTubeResponse(u.State.ToString(), null, null, u.ChannelTitle, u.Privacy, u.Percent, null),
                YouTubeUploadState.Failed => new ShortYouTubeResponse("Failed", null, null, u.ChannelTitle, u.Privacy, 0, u.Error),
                _ => null,
            };
        }
        return null;
    }

    private async Task<RenderJob?> LoadOwnedJobOrNullAsync(string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct);
        // Someone else's render is reported exactly like a missing one.
        return job is not null && string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal) ? job : null;
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }
}

internal static class ShortsIds
{
    public const string Pattern = "^[A-Za-z0-9_-]{1,64}$";

    public static bool IsEntityId(string? value) =>
        value is not null && System.Text.RegularExpressions.Regex.IsMatch(value, Pattern);
}

public sealed record ShortsJobIdsRequest
{
    [Required, MinLength(1), MaxLength(100)]
    public List<string> JobIds { get; init; } = [];
}

public sealed record ShortsDriveRequest
{
    [Required, MinLength(1), MaxLength(100)]
    public List<string> JobIds { get; init; } = [];

    /// <summary>Whose Drive: a channel's own (or its folder on the personal one). Null is the personal Drive.</summary>
    [RegularExpression("^UC[A-Za-z0-9_-]{22}$")] public string? ChannelId { get; init; }

    /// <summary>A folder for these copies; empty uses the channel's (or the Drive's) default.</summary>
    [StringLength(100)] public string? FolderName { get; init; }

    /// <summary>Copy even renders already on Drive.</summary>
    public bool Again { get; init; }
}

public sealed record ShortDriveResponse(string HandoffId, string State, string FolderName, string? DriveUrl, string? Error);

/// <summary>State: Published, Queued, Uploading or Failed.</summary>
public sealed record ShortYouTubeResponse(
    string State, string? VideoId, string? VideoUrl, string? ChannelTitle, string? Privacy, int Percent, string? Error);

public sealed record ShortRowResponse(RenderJobResponse Job, string ProjectName, ShortDriveResponse? Drive, ShortYouTubeResponse? YouTube);

public sealed record ShortsCountsResponse(
    int Total, int Rendering, int Ready, int Failed,
    int OnYouTube, int NotOnYouTube, int OnDrive, int NotOnDrive,
    int MadeThisWeek, int WeeklyGoal);

public sealed record ShortsPoolResponse(
    string ProjectId, string ProjectName, int Videos, int Images, int UnusedVideos, int UnusedImages, int Batches, int Shorts);

public sealed record ShortsOverviewResponse(
    IReadOnlyList<ShortRowResponse> Shorts, ShortsCountsResponse Counts,
    IReadOnlyList<ShortsPoolResponse> Pools, IReadOnlyList<ShortsAlert> Alerts);

public sealed record ShortsActiveResponse(IReadOnlyList<RenderJobResponse> Jobs, IReadOnlyList<PhoneHandoffStatus> DriveCopies);

/// <summary>What happened to one render of a bulk action.</summary>
public sealed record ShortsBulkResult(string JobId, bool Ok, bool Skipped, string? Code, string Message)
{
    public static ShortsBulkResult Start(string jobId, string message) => new(jobId, true, false, null, message);
    public static ShortsBulkResult Skip(string jobId, string code, string message) => new(jobId, true, true, code, message);
    public static ShortsBulkResult Refuse(string jobId, string code, string message) => new(jobId, false, false, code, message);
}

public sealed record ShortsBulkResponse(int Started, int Skipped, int Failed, IReadOnlyList<ShortsBulkResult> Results)
{
    public static ShortsBulkResponse From(IReadOnlyList<ShortsBulkResult> results) => new(
        results.Count(r => r.Ok && !r.Skipped), results.Count(r => r.Skipped), results.Count(r => !r.Ok), results);
}
