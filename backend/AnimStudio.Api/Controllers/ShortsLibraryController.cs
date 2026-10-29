using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The shorts already on the user's Drive as a library: searched, filtered and paged on the
/// server, filed under shared topics, downloaded to any device, marked used so one isn't posted
/// twice, and archived once used.
/// <para>
/// Topics are the content calendar's own topics (one list for the whole app). Filing a copy
/// under one moves it into <c>Topics/&lt;name&gt;</c> on Drive; Archive is <c>Archive/&lt;name&gt;</c>.
/// Every handoff id is checked against its owner; a foreign id is reported as not found.
/// </para>
/// </summary>
[ApiController]
[Route("api/shorts/library")]
public sealed class ShortsLibraryController(
    IPhoneHandoffRepository handoffs,
    IGoogleDriveConnectionRepository connections,
    IContentTopicRepository topics,
    IProjectRepository projects,
    IRenderJobRepository jobs,
    IObjectStore store,
    AppDataPaths dataPaths,
    PhoneHandoffManager handoffManager,
    ContentPlanningService planning,
    GoogleDriveConnectionStore drive,
    GoogleDriveClient driveClient,
    ICurrentUser currentUser,
    ILogger<ShortsLibraryController> logger) : ControllerBase
{
    private const int MaxRecords = 2000;
    private const int MaxPageSize = 100;
    private const int MaxBulk = 200;
    private const string DeletedCode = "library-deleted";

    private static readonly PhoneHandoffState[] OnDriveStates =
        [PhoneHandoffState.Saved, PhoneHandoffState.WaitingForPhone, PhoneHandoffState.Applied, PhoneHandoffState.Expired];

    /// <summary>One page of the library for the filters given, with the counts the filter chips show.</summary>
    [HttpGet("items")]
    public async Task<ActionResult<ApiResponse<LibraryPageResponse>>> Items([FromQuery] LibraryQuery query, CancellationToken ct)
    {
        var (copies, topicMap, jobMap, names) = await LoadAsync(ct);

        var matching = Filter(copies, query, topicMap).ToList();
        var sorted = (query.Sort switch
        {
            "oldest" => matching.OrderBy(h => h.CreatedAt),
            "name" => matching.OrderBy(h => h.Title, StringComparer.CurrentCultureIgnoreCase),
            "used" => matching.OrderByDescending(h => h.UsedAt ?? DateTime.MinValue),
            _ => matching.OrderByDescending(h => h.CreatedAt),
        }).ToList();

        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var pages = Math.Max(1, (int)Math.Ceiling(sorted.Count / (double)pageSize));
        var page = Math.Clamp(query.Page, 1, pages);
        var items = sorted.Skip((page - 1) * pageSize).Take(pageSize).Select(h => ToItem(h, topicMap, names, jobMap)).ToList();

        var live = copies.Where(h => !h.Archived).ToList();
        var counts = new LibraryCounts(
            live.Count,
            live.Count(h => h.UsedAt is null),
            live.Count(h => h.UsedAt is not null),
            copies.Count(h => h.Archived),
            live.Count(h => TopicOf(h, topicMap) is null));
        var perTopic = topicMap.Values
            .Select(t => new LibraryTopicCount(t.Id, t.Name, t.Color,
                live.Count(h => h.TopicId == t.Id), live.Count(h => h.TopicId == t.Id && h.UsedAt is null)))
            .OrderBy(t => t.Name, StringComparer.CurrentCultureIgnoreCase)
            .ToList();

        return Ok(ApiResponse<LibraryPageResponse>.Ok(new LibraryPageResponse(items, sorted.Count, page, pageSize, pages, counts, perTopic)));
    }

    /// <summary>Every id the filters match (not just one page), so "select all N" works across pages.</summary>
    [HttpGet("ids")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<string>>>> Ids([FromQuery] LibraryQuery query, CancellationToken ct)
    {
        var (copies, topicMap, _, _) = await LoadAsync(ct);
        IReadOnlyList<string> ids = [.. Filter(copies, query, topicMap).Select(h => h.Id)];
        return Ok(ApiResponse<IReadOnlyList<string>>.Ok(ids));
    }

    /// <summary>Files the copies under a topic (moving them on Drive), or out of any topic when none is named.</summary>
    [HttpPost("move")]
    public async Task<ActionResult<ApiResponse<LibraryBulkResponse>>> Move([FromBody] LibraryMoveRequest request, CancellationToken ct)
    {
        ContentTopic? topic;
        try
        {
            topic = await DriveCopies.ResolveTopicAsync(topics, currentUser.UserId, request.TopicId, ct);
        }
        catch (YouTubePublishException ex)
        {
            return BadRequest(ApiResponse<LibraryBulkResponse>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, Field: "topicId")));
        }

        var folder = topic is null ? null : DriveCopies.TopicFolderName(topic);
        var result = await ForEachCopyAsync(request.HandoffIds, async (h, token, file, target) =>
        {
            string[] folders = h.Archived ? ArchivePath(folder) : folder is null ? [] : DriveCopies.TopicPath(folder);
            if (token is not null && file is not null)
            {
                var folderId = await drive.EnsureFolderPathAsync(target, folders, token, ct);
                await driveClient.MoveFileAsync(token, file, folderId, file.Name, ct);
            }
            h.TopicId = topic?.Id;
            h.Topic = folder;
            h.DriveSubfolders = [.. folders];
        }, ct);
        return Ok(ApiResponse<LibraryBulkResponse>.Ok(result));
    }

    /// <summary>Marks copies used (or unused again), so they stay out of the next round of posting.</summary>
    [HttpPost("used")]
    public async Task<ActionResult<ApiResponse<LibraryBulkResponse>>> MarkUsed([FromBody] LibraryUsedRequest request, CancellationToken ct)
    {
        // Used shorts go to Archive/<their topic>; marking one unused brings it back to its topic folder.
        var result = await ForEachCopyAsync(request.HandoffIds, async (h, token, file, target) =>
        {
            if (request.Used)
            {
                h.UsedAt ??= DateTime.UtcNow;
                if (request.Archive)
                {
                    await DeleteCopyAsync(h, token, file, ct);
                }
            }
            else
            {
                h.UsedAt = null;
                if (h.Archived)
                {
                    if (token is not null && file is not null)
                        await UnarchiveOnDriveAsync(h, token, file, target, ct);
                    else
                    {
                        h.Archived = false;
                        h.DriveSubfolders = h.Topic is null ? [] : [.. DriveCopies.TopicPath(h.Topic)];
                    }
                }
            }
        }, ct);
        return Ok(ApiResponse<LibraryBulkResponse>.Ok(result));
    }

    private async Task ArchiveOnDriveAsync(PhoneHandoff h, string token, GoogleDriveFileInfo file, DriveTarget target, CancellationToken ct)
    {
        var folders = ArchivePath(h.Topic);
        var folderId = await drive.EnsureFolderPathAsync(target, folders, token, ct);
        await driveClient.MoveFileAsync(token, file, folderId, file.Name, ct);
        h.Archived = true;
        h.DriveSubfolders = [.. folders];
    }

    private async Task UnarchiveOnDriveAsync(PhoneHandoff h, string token, GoogleDriveFileInfo file, DriveTarget target, CancellationToken ct)
    {
        string[] folders = h.Topic is null ? [] : DriveCopies.TopicPath(h.Topic);
        var folderId = await drive.EnsureFolderPathAsync(target, folders, token, ct);
        await driveClient.MoveFileAsync(token, file, folderId, file.Name, ct);
        h.Archived = false;
        h.DriveSubfolders = [.. folders];
    }

    /// <summary>
    /// Moves used copies to the Archive folder on Drive (keeping their topic). With no ids,
    /// every used copy that isn't archived yet.
    /// </summary>
    [HttpPost("archive")]
    public async Task<ActionResult<ApiResponse<LibraryBulkResponse>>> Archive([FromBody] LibraryArchiveRequest? request, CancellationToken ct)
    {
        IReadOnlyList<string> ids = request?.HandoffIds is { Count: > 0 } given
            ? given
            : [.. (await LoadAsync(ct)).Copies.Where(h => h.UsedAt is not null && !h.Archived).Select(h => h.Id).Take(MaxBulk)];

        var result = await ForEachCopyAsync(ids, async (h, token, file, target) =>
        {
            var folders = ArchivePath(h.Topic);
            if (token is not null && file is not null)
            {
                var folderId = await drive.EnsureFolderPathAsync(target, folders, token, ct);
                await driveClient.MoveFileAsync(token, file, folderId, file.Name, ct);
            }
            h.UsedAt ??= DateTime.UtcNow;
            h.Archived = true;
            h.DriveSubfolders = [.. folders];
        }, ct);
        return Ok(ApiResponse<LibraryBulkResponse>.Ok(result));
    }

    /// <summary>Takes archived copies back out of Archive (they stay marked used).</summary>
    [HttpPost("restore")]
    public async Task<ActionResult<ApiResponse<LibraryBulkResponse>>> Restore([FromBody] LibraryRestoreRequest request, CancellationToken ct)
    {
        var result = await ForEachCopyAsync(request.HandoffIds, async (h, token, file, target) =>
        {
            string[] folders = h.Topic is null ? [] : DriveCopies.TopicPath(h.Topic);
            if (token is not null && file is not null)
            {
                var folderId = await drive.EnsureFolderPathAsync(target, folders, token, ct);
                await driveClient.MoveFileAsync(token, file, folderId, file.Name, ct);
            }
            h.Archived = false;
            h.DriveSubfolders = [.. folders];
        }, ct);
        return Ok(ApiResponse<LibraryBulkResponse>.Ok(result));
    }

    /// <summary>Deletes archived or used copies: the Drive file goes to the Drive trash and the copy leaves the library for good. With no ids, every used copy.</summary>
    [HttpPost("delete")]
    public async Task<ActionResult<ApiResponse<LibraryBulkResponse>>> Delete([FromBody] LibraryArchiveRequest? request, CancellationToken ct)
    {
        IReadOnlyList<string> ids = request?.HandoffIds is { Count: > 0 } given
            ? given
            : [.. (await LoadAsync(ct)).Copies.Where(h => h.UsedAt is not null).Select(h => h.Id).Take(MaxBulk)];

        var result = await ForEachCopyAsync(ids, async (h, token, file, target) =>
        {
            if (!h.Archived && h.UsedAt is null) throw new YouTubePublishException("not-used", "Only used or archived items can be deleted.");
            await DeleteCopyAsync(h, token, file, ct);
        }, ct);
        return Ok(ApiResponse<LibraryBulkResponse>.Ok(result));
    }

    private async Task DeleteCopyAsync(PhoneHandoff h, string? token, GoogleDriveFileInfo? file, CancellationToken ct)
    {
        if (token is not null && file is not null) await driveClient.TrashFileAsync(token, file.Id, ct);
        h.UsedAt ??= DateTime.UtcNow;
        h.State = PhoneHandoffState.Cancelled;
        h.ErrorCode = DeletedCode;
        h.Error = "Deleted from the library.";
    }

    /// <summary>
    /// Streams the copy from Drive (or local render storage) to whatever device is asking (browser or phone app).
    /// With <paramref name="inline"/> it streams inline for video preview/sampling; with <paramref name="markUsed"/>
    /// it is marked used once downloaded.
    /// </summary>
    [AllowMediaTicket]
    [HttpGet("download/{handoffId}")]
    public async Task<IActionResult> Download(
        string handoffId,
        [FromQuery] bool markUsed,
        [FromQuery] bool autoArchive = true,
        [FromQuery] bool inline = false,
        CancellationToken ct = default)
    {
        var h = await OwnedAsync(handoffId, ct);
        if (h is null || h.State == PhoneHandoffState.Cancelled) return NotFound();

        var fileName = h.DriveFileName ?? PhoneHandoffManager.FileNameFor(h.Title);
        var servedLocally = false;

        // When previewing inline or when the copy is not on Drive yet, prefer the local render output if present (supports byte-range seeking).
        if (inline || h.DriveFileId is null || h.DriveMissing || !OnDriveStates.Contains(h.State))
        {
            var job = await jobs.GetAsync(h.JobId, ct);
            if (job is not null && string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal) && job.OutputStorageKey is not null)
            {
                try
                {
                    if (inline)
                    {
                        var previewPath = await RenderPreviewFile.EnsureAsync(store, dataPaths, job, ct);
                        return PhysicalFile(previewPath, "video/mp4", enableRangeProcessing: true);
                    }
                    var stream = await store.OpenAsync(job.OutputStorageKey, ct);
                    if (stream is not null)
                    {
                        Response.ContentType = "video/mp4";
                        if (job.OutputSizeBytes is { } size) Response.ContentLength = size;
                        Response.Headers.ContentDisposition = new System.Net.Mime.ContentDisposition
                        {
                            FileName = fileName,
                            DispositionType = "attachment"
                        }.ToString();
                        await using (stream)
                        {
                            await stream.CopyToAsync(Response.Body, ct);
                        }
                        servedLocally = true;
                    }
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning("Serving local render for handoff {HandoffId} failed ({Type}); falling back to Drive.", h.Id, ex.GetType().Name);
                }
            }
        }

        if (!servedLocally)
        {
            if (h.DriveFileId is null || h.DriveMissing || !OnDriveStates.Contains(h.State)) return NotFound();

            try
            {
                var target = new DriveTarget(currentUser.UserId, h.DriveChannelId, h.DriveFolderName);
                var token = await drive.GetAccessTokenAsync(target, ct);
                await driveClient.DownloadAsync(token, h.DriveFileId, length =>
                {
                    Response.ContentType = "video/mp4";
                    if (length is { } size) Response.ContentLength = size;
                    Response.Headers.ContentDisposition = new System.Net.Mime.ContentDisposition
                    {
                        FileName = fileName,
                        DispositionType = inline ? "inline" : "attachment"
                    }.ToString();
                    return Task.FromResult(Response.Body);
                }, ct);
            }
            catch (YouTubePublishException ex) when (!Response.HasStarted)
            {
                logger.LogWarning("Downloading Drive copy {HandoffId} failed: {Code}", h.Id, ex.Code);
                return ex.Code == "drive-not-found"
                    ? NotFound(ApiResponse<bool>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)))
                    : BadRequest(ApiResponse<bool>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
            }
        }

        if (!inline && markUsed && h.UsedAt is null)
        {
            h.UsedAt = DateTime.UtcNow;
            if (autoArchive)
            {
                if (h.DriveFileId is not null && !h.DriveMissing)
                {
                    try
                    {
                        var target = new DriveTarget(currentUser.UserId, h.DriveChannelId, h.DriveFolderName);
                        var token = await drive.GetAccessTokenAsync(target, CancellationToken.None);
                        var file = await driveClient.GetFileAsync(token, h.DriveFileId, CancellationToken.None);
                        await DeleteCopyAsync(h, token, file, CancellationToken.None);
                    }
                    catch (YouTubePublishException ex)
                    {
                        logger.LogWarning("Deleting downloaded copy {HandoffId} failed: {Code}", h.Id, ex.Code);
                    }
                }
                else
                {
                    await DeleteCopyAsync(h, null, null, CancellationToken.None);
                }
            }
            await handoffs.UpsertAsync(h, CancellationToken.None);
        }
        return new EmptyResult();
    }

    private static IEnumerable<PhoneHandoff> Filter(
        IEnumerable<PhoneHandoff> copies, LibraryQuery q, IReadOnlyDictionary<string, ContentTopic> topicMap)
    {
        var view = q.View ?? "active";
        var search = q.Search?.Trim();
        return copies.Where(h =>
        {
            if (view == "archived" ? !h.Archived : view != "all" && h.Archived) return false;
            if (view == "unused" && h.UsedAt is not null) return false;
            if (view == "used" && h.UsedAt is null) return false;

            if (!string.IsNullOrEmpty(q.TopicId))
            {
                var topic = TopicOf(h, topicMap);
                if (q.TopicId == "none" ? topic is not null : topic?.Id != q.TopicId) return false;
            }

            if (!string.IsNullOrEmpty(search))
            {
                var topicName = TopicOf(h, topicMap)?.Name;
                var hit = h.Title.Contains(search, StringComparison.CurrentCultureIgnoreCase)
                          || (h.DriveFileName?.Contains(search, StringComparison.CurrentCultureIgnoreCase) ?? false)
                          || (topicName?.Contains(search, StringComparison.CurrentCultureIgnoreCase) ?? false);
                if (!hit) return false;
            }
            return true;
        });
    }

    /// <summary>The copy's topic as it exists now; a topic deleted from the calendar counts as none.</summary>
    private static ContentTopic? TopicOf(PhoneHandoff h, IReadOnlyDictionary<string, ContentTopic> topicMap) =>
        h.TopicId is { } id && topicMap.TryGetValue(id, out var t) ? t : null;

    private static LibraryItemResponse ToItem(
        PhoneHandoff h,
        IReadOnlyDictionary<string, ContentTopic> topicMap,
        IReadOnlyDictionary<string, string> names,
        IReadOnlyDictionary<string, RenderJob> jobMap)
    {
        var topic = TopicOf(h, topicMap);
        var job = jobMap.GetValueOrDefault(h.JobId);
        var width = job?.Width;
        var height = job?.Height;
        var hasLocalPreview = job is { OutputStorageKey: not null, Status: RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings };
        var format = width is > 0 && height is > 0
            ? (height > width ? "short" : height == width ? "square" : "video")
            : null;
        var duration = h.DurationSeconds ?? job?.Diagnostics?.OutputDurationSeconds;
        var sizeBytes = h.TotalBytes > 0 ? h.TotalBytes : job?.OutputSizeBytes;
        return new LibraryItemResponse(
            h.Id, h.JobId, h.ProjectId, names.GetValueOrDefault(h.ProjectId, string.Empty), h.Title,
            duration, sizeBytes, h.CreatedAt,
            topic?.Id, topic?.Name, topic?.Color, h.UsedAt, h.Archived,
            PhoneHandoffManager.DrivePath(h),
            h.DriveFileId is null ? null : $"https://drive.google.com/file/d/{Uri.EscapeDataString(h.DriveFileId)}/view",
            width, height, hasLocalPreview, format);
    }

    private static string[] ArchivePath(string? topicFolder) =>
        topicFolder is null ? [DriveCopies.ArchiveFolder] : [DriveCopies.ArchiveFolder, topicFolder];

    private async Task<(
        IReadOnlyList<PhoneHandoff> Copies,
        IReadOnlyDictionary<string, ContentTopic> Topics,
        IReadOnlyDictionary<string, RenderJob> Jobs,
        IReadOnlyDictionary<string, string> ProjectNames)> LoadAsync(CancellationToken ct)
    {
        var ownedProjects = await projects.ListAsync(currentUser.UserId, ct);
        var projectNames = ownedProjects.ToDictionary(p => p.Id, p => p.Name, StringComparer.Ordinal);
        var jobMap = new Dictionary<string, RenderJob>(StringComparer.Ordinal);
        foreach (var p in ownedProjects)
        {
            foreach (var j in await jobs.ListByProjectAsync(p.Id, ct))
            {
                jobMap[j.Id] = j;
            }
        }

        var allHandoffs = (await handoffs.ListByUserAsync(currentUser.UserId, null, MaxRecords, ct)).ToList();
        var allTopics = await topics.ListByUserAsync(currentUser.UserId, ct);
        if (await MigrateLegacyTopicsAsync(allHandoffs, allTopics, ct))
            allTopics = await topics.ListByUserAsync(currentUser.UserId, ct);
        var topicMap = allTopics.ToDictionary(t => t.Id, StringComparer.Ordinal);

        // Ensure any completed render job that has a TopicId (from Auto Shorts or Video Export)
        // is linked to its topic in the library and queued to Drive if Drive is connected.
        var handoffsByJobId = allHandoffs
            .Where(h => h.State != PhoneHandoffState.Cancelled)
            .GroupBy(h => h.JobId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(h => h.CreatedAt).First(), StringComparer.Ordinal);

        DriveTarget? defaultDriveTarget = null;
        var resolvedDefaultDrive = false;

        // A copy deleted from the library must not be recreated from its topic-tagged render.
        var deletedJobIds = allHandoffs.Where(h => h.ErrorCode == DeletedCode).Select(h => h.JobId).ToHashSet(StringComparer.Ordinal);

        foreach (var job in jobMap.Values)
        {
            if (job.TopicId is null || !topicMap.TryGetValue(job.TopicId, out var jobTopic)) continue;
            if (deletedJobIds.Contains(job.Id)) continue;
            var ready = job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings && job.OutputStorageKey is not null;

            if (handoffsByJobId.TryGetValue(job.Id, out var existingHandoff))
            {
                if (existingHandoff.TopicId is null)
                {
                    existingHandoff.TopicId = jobTopic.Id;
                    existingHandoff.Topic ??= DriveCopies.TopicFolderName(jobTopic);
                    if (existingHandoff.DriveSubfolders.Count == 0 && existingHandoff.Topic is not null)
                    {
                        existingHandoff.DriveSubfolders = [.. DriveCopies.TopicPath(existingHandoff.Topic)];
                    }
                    await handoffs.UpsertAsync(existingHandoff, ct);
                }
                continue;
            }

            if (!ready) continue;

            if (!resolvedDefaultDrive)
            {
                resolvedDefaultDrive = true;
                try
                {
                    defaultDriveTarget = await drive.ResolveAsync(currentUser.UserId, null, null, ct);
                }
                catch (YouTubePublishException)
                {
                    defaultDriveTarget = null;
                }
            }

            var projectName = projectNames.GetValueOrDefault(job.ProjectId);
            var title = DriveLayout.TitleFor(job, projectName);
            var target = defaultDriveTarget ?? new DriveTarget(currentUser.UserId, null, "AnimStudio Shorts");
            var state = defaultDriveTarget is not null ? PhoneHandoffState.Sending : PhoneHandoffState.Saved;
            var created = DriveCopies.SaveOnly(currentUser.UserId, job, projectName, null, title, target, state, jobTopic);
            created.TotalBytes = job.OutputSizeBytes ?? 0;
            await handoffs.UpsertAsync(created, ct);
            if (defaultDriveTarget is not null)
            {
                handoffManager.StartSending(created, job.OutputStorageKey!, job.OutputSizeBytes ?? 0);
            }
            allHandoffs.Add(created);
            handoffsByJobId[job.Id] = created;
        }

        var copies = allHandoffs
            .Where(h =>
                (h.DriveFileId is not null && !h.DriveMissing && OnDriveStates.Contains(h.State))
                || (h.State != PhoneHandoffState.Cancelled
                    && h.TopicId is not null
                    && jobMap.TryGetValue(h.JobId, out var rj)
                    && rj.OutputStorageKey is not null
                    && rj.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings))
            .ToList();

        return (copies, topicMap, jobMap, projectNames);
    }

    /// <summary>
    /// Topics made on the library before topics were shared with the calendar were plain names.
    /// Each becomes (or is matched to) a calendar topic, once, and its copies are linked to it.
    /// </summary>
    private async Task<bool> MigrateLegacyTopicsAsync(IReadOnlyList<PhoneHandoff> copies, IReadOnlyList<ContentTopic> existing, CancellationToken ct)
    {
        var drives = await connections.ListByUserAsync(currentUser.UserId, ct);
        var legacy = drives.SelectMany(d => d.Topics)
            .Concat(copies.Where(h => h.TopicId is null && h.Topic is not null).Select(h => h.Topic!))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (legacy.Count == 0) return false;

        var byName = new Dictionary<string, ContentTopic>(StringComparer.OrdinalIgnoreCase);
        foreach (var t in existing) byName.TryAdd(t.Name, t);
        var created = false;
        foreach (var name in legacy)
        {
            if (byName.ContainsKey(name)) continue;
            try
            {
                byName[name] = await planning.CreateTopicAsync(currentUser.UserId,
                    new ContentTopicCommand(name, null, null, null, null, null, null, null, 3, 21, true, true, null, null, false), ct);
                created = true;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning("Could not turn the library topic into a calendar topic: {Type}", ex.GetType().Name);
            }
        }

        foreach (var h in copies.Where(h => h.TopicId is null && h.Topic is not null))
        {
            if (!byName.TryGetValue(h.Topic!, out var topic)) continue;
            h.TopicId = topic.Id;
            await handoffs.UpsertAsync(h, ct);
        }

        foreach (var d in drives.Where(d => d.Topics.Count > 0))
        {
            // Only forget the names once each has a calendar topic.
            if (d.Topics.Any(t => !byName.ContainsKey(t))) continue;
            d.Topics.Clear();
            await connections.UpsertAsync(d, ct);
        }
        return created;
    }

    private async Task<PhoneHandoff?> OwnedAsync(string id, CancellationToken ct)
    {
        var h = await handoffs.GetAsync(id, ct);
        return h is not null && string.Equals(h.UserId, currentUser.UserId, StringComparison.Ordinal) ? h : null;
    }

    /// <summary>
    /// Runs a change on each copy, moving it on Drive when it is on Drive and saving the updated
    /// handoff record; local topic-tagged copies without a Drive file yet are updated in the DB too.
    /// </summary>
    private async Task<LibraryBulkResponse> ForEachCopyAsync(
        IEnumerable<string> ids,
        Func<PhoneHandoff, string?, GoogleDriveFileInfo?, DriveTarget, Task> change,
        CancellationToken ct)
    {
        var tokens = new Dictionary<string, string?>(StringComparer.Ordinal);
        int done = 0, failed = 0;
        string? firstError = null;

        foreach (var id in ids.Distinct(StringComparer.Ordinal).Take(MaxBulk))
        {
            var h = await OwnedAsync(id, ct);
            if (h is null || h.State == PhoneHandoffState.Cancelled) { failed++; continue; }

            var target = new DriveTarget(currentUser.UserId, h.DriveChannelId, h.DriveFolderName);

            // If the copy isn't on Drive yet (e.g. a local topic-tagged export), still apply the metadata/status change locally.
            if (h.DriveFileId is null || !OnDriveStates.Contains(h.State))
            {
                try
                {
                    await change(h, null, null, target);
                    await handoffs.UpsertAsync(h, ct);
                    done++;
                }
                catch (YouTubePublishException ex)
                {
                    failed++;
                    firstError ??= ex.Message;
                }
                continue;
            }

            if (h.DriveMissing) { failed++; continue; }

            try
            {
                var key = h.DriveChannelId ?? string.Empty;
                if (!tokens.TryGetValue(key, out var token))
                {
                    try { token = await drive.GetAccessTokenAsync(target, ct); }
                    finally { tokens[key] = token; }
                }
                if (token is null) { failed++; continue; }

                var file = await driveClient.GetFileAsync(token, h.DriveFileId, ct);
                if (file is null || file.Trashed)
                {
                    h.DriveMissing = true;
                    await handoffs.UpsertAsync(h, ct);
                    failed++;
                    firstError ??= "A short is no longer on Google Drive.";
                    continue;
                }

                await change(h, token, file, target);
                await handoffs.UpsertAsync(h, ct);
                done++;
            }
            catch (YouTubePublishException ex)
            {
                failed++;
                firstError ??= ex.Message;
                logger.LogWarning("Changing Drive copy {HandoffId} failed: {Code}", h.Id, ex.Code);
            }
        }
        return new LibraryBulkResponse(done, failed, firstError);
    }
}

public sealed record LibraryQuery
{
    [StringLength(100)] public string? Search { get; init; }

    /// <summary>A topic id, or <c>none</c> for shorts without a topic; empty for every topic.</summary>
    [RegularExpression("^(none|[A-Za-z0-9_-]{1,64})$")] public string? TopicId { get; init; }

    /// <summary><c>active</c> (default, not archived), <c>unused</c>, <c>used</c>, <c>archived</c> or <c>all</c>.</summary>
    [RegularExpression("^(active|unused|used|archived|all)$")] public string? View { get; init; }

    /// <summary><c>newest</c> (default), <c>oldest</c>, <c>name</c> or <c>used</c>.</summary>
    [RegularExpression("^(newest|oldest|name|used)$")] public string? Sort { get; init; }

    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 25;
}

public sealed record LibraryItemResponse(
    string HandoffId, string JobId, string ProjectId, string ProjectName, string Title,
    double? DurationSeconds, long? SizeBytes, DateTime CreatedAt,
    string? TopicId, string? TopicName, string? TopicColor, DateTime? UsedAt, bool Archived,
    string DrivePath, string? DriveUrl,
    int? Width = null, int? Height = null, bool HasLocalPreview = false, string? Format = null);

public sealed record LibraryCounts(int Active, int Unused, int Used, int Archived, int NoTopic);

public sealed record LibraryTopicCount(string TopicId, string Name, string Color, int Shorts, int Unused);

public sealed record LibraryPageResponse(
    IReadOnlyList<LibraryItemResponse> Items, int Total, int Page, int PageSize, int Pages,
    LibraryCounts Counts, IReadOnlyList<LibraryTopicCount> Topics);

public sealed record LibraryMoveRequest
{
    [Required, MinLength(1), MaxLength(200)]
    public List<string> HandoffIds { get; init; } = [];

    /// <summary>The topic to file under; empty takes them out of any topic.</summary>
    [RegularExpression("^[A-Za-z0-9_-]{1,64}$")] public string? TopicId { get; init; }
}

public sealed record LibraryUsedRequest
{
    [Required, MinLength(1), MaxLength(200)]
    public List<string> HandoffIds { get; init; } = [];

    public bool Used { get; init; } = true;

    /// <summary>Also move newly used copies to the Archive folder (default).</summary>
    public bool Archive { get; init; } = true;
}

public sealed record LibraryArchiveRequest
{
    [MaxLength(200)]
    public List<string>? HandoffIds { get; init; }
}

public sealed record LibraryRestoreRequest
{
    [Required, MinLength(1), MaxLength(200)]
    public List<string> HandoffIds { get; init; } = [];
}

public sealed record LibraryBulkResponse(int Done, int Failed, string? Error);
