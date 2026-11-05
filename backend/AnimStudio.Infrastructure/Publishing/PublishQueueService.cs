using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Common;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A render to put on the publishing board, with everything the publish dialog collects.</summary>
/// <param name="ScheduledAt">When it should be out; null with <paramref name="Hold"/> false means as soon as possible.</param>
/// <param name="Hold">Put it on the board without pushing it: paused, or no time yet.</param>
public sealed record PublishQueueDraft(
    string JobId,
    string? ChannelId,
    YouTubeVideoMetadata? Metadata,
    IReadOnlyList<string>? RelatedVideoIds,
    string? FirstComment,
    YouTubeThumbnailChoice? Thumbnail,
    string? PlanItemId,
    DateTime? ScheduledAt,
    PublishQueueMode Mode,
    bool Hold,
    string? Notes);

/// <summary>Changes to an item on the board. A null field is left as it is.</summary>
public sealed record PublishQueueChange(
    string? ChannelId = null,
    string? Title = null,
    string? Description = null,
    IReadOnlyList<string>? Tags = null,
    string? CategoryId = null,
    string? Privacy = null,
    bool? MadeForKids = null,
    bool? NotifySubscribers = null,
    string? FirstComment = null,
    DateTime? ScheduledAt = null,
    PublishQueueMode? Mode = null,
    string? Notes = null,
    bool RemoveThumbnail = false);

/// <summary>An item as the board shows it.</summary>
public sealed record PublishQueueItemView(
    string Id,
    string JobId,
    string ProjectId,
    string? ProjectName,
    string ChannelId,
    string ChannelTitle,
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string CategoryId,
    string CategoryName,
    string Privacy,
    bool MadeForKids,
    bool NotifySubscribers,
    string? FirstComment,
    IReadOnlyList<string> RelatedVideoIds,
    string? PlanItemId,
    bool HasCustomThumbnail,
    double? ThumbnailFrameAt,
    string? Notes,
    DateTime? ScheduledAt,
    PublishQueueMode Mode,
    PublishQueueMode EffectiveMode,
    DateTime? DueAt,
    PublishQueueState State,
    int Attempts,
    string? ErrorCode,
    string? Error,
    string? Warning,
    int? Percent,
    string? VideoId,
    string? VideoUrl,
    string? StudioUrl,
    DateTime? YouTubePublishAt,
    double? DurationSeconds,
    bool IsVertical,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? StartedAt,
    DateTime? FinishedAt,
    bool CanEdit);

public sealed record PublishQueueCounts(int Waiting, int Held, int Uploading, int Published, int Failed, int Cancelled);

/// <param name="AutoPublish">False when the scheduler is off or YouTube isn't set up: nothing goes out on its own.</param>
public sealed record PublishQueueBoard(
    IReadOnlyList<PublishQueueItemView> Items,
    PublishQueueCounts Counts,
    DateTime ServerTimeUtc,
    int ReleaseLeadMinutes,
    bool AutoPublish);

/// <summary>A finished render that can go on the board.</summary>
public sealed record PublishQueueCandidate(
    string JobId,
    string ProjectId,
    string ProjectName,
    string Name,
    DateTime CreatedAt,
    double? DurationSeconds,
    int? Width,
    int? Height,
    long? SizeBytes,
    bool IsVertical,
    bool OnYouTube,
    bool InQueue);

/// <summary>
/// The publishing board: finished renders queued with their YouTube details and a time,
/// pushed to YouTube by <see cref="PublishQueueScheduler"/> when due (or at once with "Publish
/// now") through the same <see cref="YouTubeUploadManager"/> as every other upload. Details are
/// checked when an item is added and again when it goes out, since a channel or a render can
/// change in between. Every operation is scoped to the owner; someone else's item reads as
/// not found.
/// </summary>
public sealed class PublishQueueService(
    IPublishQueueRepository repository,
    IRenderJobRepository jobs,
    IProjectRepository projects,
    IYouTubePublicationRepository publicationRecords,
    YouTubeConnectionStore connections,
    YouTubePublicationService publications,
    YouTubeUploadManager uploads,
    YouTubeThumbnailService thumbnails,
    ContentPlanningService planning,
    IObjectStore store,
    AppDataPaths dataPaths,
    IOptionsMonitor<YouTubePublishOptions> options,
    TimeProvider clock,
    ILogger<PublishQueueService> logger)
{
    private const int MaxListed = 1000;

    /// <summary>Finished items stay on the board this long; older ones are only hidden, not deleted.</summary>
    private static readonly TimeSpan KeepFinishedOnBoard = TimeSpan.FromDays(45);

    /// <summary>Put back this long when every upload slot is busy.</summary>
    private static readonly TimeSpan BusyRetry = TimeSpan.FromMinutes(2);

    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    private TimeSpan ReleaseLead => TimeSpan.FromMinutes(Math.Clamp(options.CurrentValue.QueueReleaseLeadMinutes, 15, 24 * 60));

    // --- the board ---

    public async Task<PublishQueueBoard> BoardAsync(string userId, CancellationToken ct)
    {
        var now = Now;
        var all = await repository.ListByUserAsync(userId, MaxListed, ct).ConfigureAwait(false);
        var views = new List<PublishQueueItemView>(all.Count);
        foreach (var item in all)
        {
            // Follow an upload here too, so the board is current without waiting for the scheduler.
            var current = item.State == PublishQueueState.Uploading ? await FollowUploadAsync(item, ct).ConfigureAwait(false) : item;
            if (!PublishQueueRules.IsOpen(current.State) && current.State != PublishQueueState.Failed
                && (current.FinishedAt ?? current.UpdatedAt) < now - KeepFinishedOnBoard)
                continue;
            views.Add(View(current));
        }

        var counts = new PublishQueueCounts(
            views.Count(v => v.State == PublishQueueState.Waiting),
            views.Count(v => v.State == PublishQueueState.Held),
            views.Count(v => v.State == PublishQueueState.Uploading),
            views.Count(v => v.State == PublishQueueState.Published),
            views.Count(v => v.State == PublishQueueState.Failed),
            views.Count(v => v.State == PublishQueueState.Cancelled));

        var opts = options.CurrentValue;
        return new PublishQueueBoard(
            [.. views.OrderBy(v => v.ScheduledAt ?? DateTime.MaxValue).ThenBy(v => v.CreatedAt)],
            counts, now, (int)ReleaseLead.TotalMinutes, opts.IsConfigured && opts.QueueCheckSeconds > 0);
    }

    public async Task<PublishQueueItemView> GetAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.State == PublishQueueState.Uploading) item = await FollowUploadAsync(item, ct).ConfigureAwait(false);
        return View(item);
    }

    /// <summary>The owner's finished renders, newest first, marked when already on YouTube or on the board.</summary>
    public async Task<IReadOnlyList<PublishQueueCandidate>> CandidatesAsync(string userId, int limit, CancellationToken ct)
    {
        var onYouTube = (await publicationRecords.ListByUserAsync(userId, null, 2000, ct).ConfigureAwait(false))
            .Select(p => p.JobId).ToHashSet(StringComparer.Ordinal);
        var inQueue = (await repository.ListByUserAsync(userId, MaxListed, ct).ConfigureAwait(false))
            .Where(i => PublishQueueRules.IsOpen(i.State)).Select(i => i.JobId).ToHashSet(StringComparer.Ordinal);

        var list = new List<PublishQueueCandidate>();
        foreach (var project in await projects.ListAsync(userId, ct).ConfigureAwait(false))
        {
            foreach (var job in await jobs.ListByProjectAsync(project.Id, ct).ConfigureAwait(false))
            {
                if (!string.Equals(job.UserId, userId, StringComparison.Ordinal) || !IsReady(job)) continue;
                list.Add(new PublishQueueCandidate(
                    job.Id, project.Id, project.Name, string.IsNullOrWhiteSpace(job.Name) ? project.Name : job.Name!,
                    job.CompletedAt ?? job.CreatedAt, job.Diagnostics?.OutputDurationSeconds, job.Width, job.Height, job.OutputSizeBytes,
                    job.Width is > 0 && job.Height > job.Width, onYouTube.Contains(job.Id), inQueue.Contains(job.Id)));
            }
        }

        return [.. list.OrderByDescending(c => c.CreatedAt).Take(Math.Clamp(limit, 1, 500))];
    }

    /// <summary>
    /// The next good times on a channel, kept clear of what is already on the board or scheduled
    /// on YouTube, preferring the hours the channel's videos usually go out at.
    /// </summary>
    public async Task<IReadOnlyList<PublishSlot>> SuggestSlotsAsync(
        string userId, string? channelId, TimeZoneInfo timeZone, bool isShort, int count, CancellationToken ct)
    {
        var now = Now;
        var queued = await repository.ListByUserAsync(userId, MaxListed, ct).ConfigureAwait(false);
        var published = await publicationRecords.ListByUserAsync(userId, null, 200, ct).ConfigureAwait(false);
        bool OnChannel(string id) => channelId is null || string.Equals(id, channelId, StringComparison.Ordinal);

        var taken = queued
            .Where(i => PublishQueueRules.IsOpen(i.State) && i.ScheduledAt > now && OnChannel(i.ChannelId))
            .Select(i => i.ScheduledAt!.Value)
            .Concat(published.Where(p => p.PublishAt > now && OnChannel(p.ChannelId)).Select(p => p.PublishAt!.Value))
            .ToList();
        var history = published
            .Where(p => OnChannel(p.ChannelId))
            .Select(p => p.PublishAt ?? p.PublishedAt)
            .Where(t => t <= now)
            .Take(60)
            .ToList();

        return PublishSlotSuggester.Suggest(new PublishSlotRequest(now, timeZone, isShort, taken, history, count));
    }

    // --- adding and changing ---

    public async Task<PublishQueueItemView> AddAsync(string userId, PublishQueueDraft draft, CancellationToken ct)
    {
        var open = (await repository.ListByUserAsync(userId, MaxListed, ct).ConfigureAwait(false)).Count(i => PublishQueueRules.IsOpen(i.State));
        if (open >= PublishQueueRules.MaxOpenItemsPerUser)
            throw EditingException.Conflict("queue-full", $"The board holds up to {PublishQueueRules.MaxOpenItemsPerUser} waiting videos. Publish or remove some first.");

        var job = await LoadOwnedJobAsync(userId, draft.JobId, ct).ConfigureAwait(false);
        if (!IsReady(job))
            throw EditingException.Conflict("render-not-ready", "This render hasn't finished yet. Queue it once it has.");

        var connection = await RequireChannelAsync(userId, draft.ChannelId, ct).ConfigureAwait(false);
        var now = Now;

        var item = new PublishQueueItem
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            JobId = job.Id,
            ProjectId = job.ProjectId,
            ProjectName = (await projects.GetAsync(job.ProjectId, ct).ConfigureAwait(false))?.Name,
            DurationSeconds = job.Diagnostics?.OutputDurationSeconds,
            IsVertical = job.Width is > 0 && job.Height > job.Width,
            ChannelId = connection.ChannelId,
            ChannelTitle = connection.ChannelTitle,
            Mode = CheckMode(draft.Mode),
            Notes = CleanNotes(draft.Notes),
            CreatedAt = now,
            UpdatedAt = now,
        };

        ApplyDetails(item, draft.Metadata, Facts(job));
        item.FirstComment = CheckComment(draft.FirstComment, connection);
        item.RelatedVideoIds = await CheckRelatedAsync(userId, draft.RelatedVideoIds, item.Description, ct).ConfigureAwait(false);

        var planItemId = string.IsNullOrWhiteSpace(draft.PlanItemId) ? null : draft.PlanItemId.Trim();
        DateTime? requested = draft.ScheduledAt;
        if (planItemId is not null)
        {
            var post = await CheckPlanItemAsync(userId, planItemId, connection.ChannelId, ct).ConfigureAwait(false);
            item.PlanItemId = post.Id;
            // A calendar post already says when; that is the time unless one was picked.
            requested ??= post.PublishAt > now ? post.PublishAt : null;
        }

        if (draft.Hold)
        {
            item.State = PublishQueueState.Held;
            if (requested is not null) item.ScheduledAt = CheckTime(requested, now);
        }
        else
        {
            item.State = PublishQueueState.Waiting;
            item.ScheduledAt = requested is null ? now : CheckTime(requested, now);
        }

        await SetThumbnailAsync(item, draft.Thumbnail, job, ct).ConfigureAwait(false);
        Reschedule(item);
        await repository.InsertAsync(item, ct).ConfigureAwait(false);

        logger.LogInformation("User {UserId} queued render {JobId} for YouTube channel {ChannelId} as {QueueItemId} ({State}, mode {Mode})",
            userId, job.Id, item.ChannelId, item.Id, item.State, item.Mode);
        return View(item);
    }

    public async Task<PublishQueueItemView> UpdateAsync(string userId, string id, PublishQueueChange change, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (!PublishQueueRules.CanEdit(item.State))
            throw EditingException.Conflict("queue-item-locked", "This video is uploading or already on YouTube. Change it in YouTube Studio.");

        var job = await LoadOwnedJobAsync(userId, item.JobId, ct).ConfigureAwait(false);
        var now = Now;

        var connection = change.ChannelId is { } channelId && !string.Equals(channelId, item.ChannelId, StringComparison.Ordinal)
            ? await RequireChannelAsync(userId, channelId, ct).ConfigureAwait(false)
            : null;
        if (connection is not null)
        {
            item.ChannelId = connection.ChannelId;
            item.ChannelTitle = connection.ChannelTitle;
        }

        ApplyDetails(item, new YouTubeVideoMetadata
        {
            Title = change.Title ?? item.Title,
            Description = change.Description ?? item.Description,
            Tags = change.Tags ?? item.Tags,
            CategoryId = change.CategoryId ?? item.CategoryId,
            Privacy = change.Privacy ?? item.Privacy,
            MadeForKids = change.MadeForKids ?? item.MadeForKids,
            NotifySubscribers = change.NotifySubscribers ?? item.NotifySubscribers,
        }, Facts(job));

        if (change.FirstComment is not null || connection is not null)
        {
            connection ??= await RequireChannelAsync(userId, item.ChannelId, ct).ConfigureAwait(false);
            item.FirstComment = CheckComment(change.FirstComment ?? item.FirstComment, connection);
        }
        if (change.Mode is { } mode) item.Mode = CheckMode(mode);
        if (change.Notes is not null) item.Notes = CleanNotes(change.Notes);
        if (change.ScheduledAt is not null) item.ScheduledAt = CheckTime(change.ScheduledAt, now);
        if (change.RemoveThumbnail) await DropThumbnailAsync(item, ct).ConfigureAwait(false);

        // A failed or cancelled video that is edited goes back on the board, paused until it is scheduled again.
        if (item.State is PublishQueueState.Failed or PublishQueueState.Cancelled)
        {
            item.State = PublishQueueState.Held;
            item.Attempts = 0;
            item.ErrorCode = null;
            item.Error = null;
        }

        await SaveAsync(item, now, ct).ConfigureAwait(false);
        return View(item);
    }

    /// <summary>Pauses a waiting video; it keeps its time but is not pushed until resumed.</summary>
    public async Task<PublishQueueItemView> HoldAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.State != PublishQueueState.Waiting)
            throw EditingException.Conflict("queue-item-not-waiting", "Only a waiting video can be paused.");
        item.State = PublishQueueState.Held;
        await SaveAsync(item, Now, ct).ConfigureAwait(false);
        return View(item);
    }

    /// <summary>
    /// Schedules a held, failed or cancelled video again - at <paramref name="at"/>, or its own time
    /// when that is still ahead.
    /// </summary>
    public async Task<PublishQueueItemView> ScheduleAsync(string userId, string id, DateTime? at, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.State is not (PublishQueueState.Held or PublishQueueState.Failed or PublishQueueState.Cancelled or PublishQueueState.Waiting))
            throw EditingException.Conflict("queue-item-locked", "This video is uploading or already on YouTube.");

        var now = Now;
        item.ScheduledAt = CheckTime(at ?? item.ScheduledAt, now);
        Reopen(item);
        await SaveAsync(item, now, ct).ConfigureAwait(false);
        return View(item);
    }

    /// <summary>Starts the upload now, whatever its time was. Failed and held videos too.</summary>
    public async Task<PublishQueueItemView> PublishNowAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.State is not (PublishQueueState.Waiting or PublishQueueState.Held or PublishQueueState.Failed or PublishQueueState.Cancelled))
            throw EditingException.Conflict("queue-item-locked", "This video is uploading or already on YouTube.");

        var now = Now;
        // Out now means out now: YouTube is not asked to hold it back.
        item.ScheduledAt = now;
        Reopen(item);
        item.DueAt = now;
        if (!await repository.ReplaceAsync(item, ct).ConfigureAwait(false)) throw Changed();

        await PushAsync(item, ct).ConfigureAwait(false);
        return View(await repository.GetAsync(item.Id, ct).ConfigureAwait(false) ?? item);
    }

    /// <summary>Stops an upload under way, or takes a waiting video off the schedule for good.</summary>
    public async Task<PublishQueueItemView> CancelAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (!PublishQueueRules.IsOpen(item.State))
            throw EditingException.Conflict("queue-item-finished", "This video isn't waiting or uploading.");

        if (item.State == PublishQueueState.Uploading && item.UploadId is { } uploadId)
            uploads.Cancel(userId, uploadId);

        var now = Now;
        item.State = PublishQueueState.Cancelled;
        item.FinishedAt = now;
        await SaveAsync(item, now, ct).ConfigureAwait(false);
        logger.LogInformation("User {UserId} cancelled queued video {QueueItemId}", userId, item.Id);
        return View(item);
    }

    /// <summary>Takes the video off the board. A video already on YouTube stays there.</summary>
    public async Task RemoveAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.State == PublishQueueState.Uploading)
            throw EditingException.Conflict("queue-item-uploading", "This video is uploading. Cancel the upload first.");

        await DropThumbnailAsync(item, ct).ConfigureAwait(false);
        await repository.DeleteAsync(item.Id, ct).ConfigureAwait(false);
        logger.LogInformation("User {UserId} removed queued video {QueueItemId}", userId, item.Id);
    }

    /// <summary>The uploaded thumbnail of the owner's item, for the board; null when it uses a frame or none.</summary>
    public async Task<byte[]?> ReadThumbnailAsync(string userId, string id, CancellationToken ct)
    {
        var item = await LoadOwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (item.ThumbnailKey is not { } key) return null;

        await using var stream = await store.OpenAsync(key, ct).ConfigureAwait(false);
        if (stream is null) return null;
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
        return buffer.ToArray();
    }

    // --- the scheduler's side ---

    /// <summary>Starts every upload that is due, leaving users whose upload slots are all busy for the next round.</summary>
    public async Task<int> PushDueAsync(int max, CancellationToken ct)
    {
        var due = await repository.ListDueAsync(Now, max, ct).ConfigureAwait(false);
        var started = 0;
        var maxPerUser = Math.Max(1, options.CurrentValue.MaxUploadsPerUser);
        foreach (var item in due)
        {
            var active = uploads.List(item.UserId, null).Count(u => u.State is YouTubeUploadState.Queued or YouTubeUploadState.Uploading);
            if (active >= maxPerUser) continue;
            if (await PushAsync(item, ct).ConfigureAwait(false)) started++;
        }
        return started;
    }

    /// <summary>Brings every uploading item up to date with its upload.</summary>
    public async Task FollowUploadsAsync(CancellationToken ct)
    {
        foreach (var item in await repository.ListByStateAsync(PublishQueueState.Uploading, 500, ct).ConfigureAwait(false))
            await FollowUploadAsync(item, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Claims a waiting item and hands it to the upload manager. The claim is a versioned save,
    /// so an item the owner changed or paused a moment ago is left alone. False when it wasn't started.
    /// </summary>
    private async Task<bool> PushAsync(PublishQueueItem item, CancellationToken ct)
    {
        var now = Now;
        item.State = PublishQueueState.Uploading;
        item.Attempts++;
        item.StartedAt = now;
        item.DueAt = null;
        item.UploadId = null;
        item.UpdatedAt = now;
        if (!await repository.ReplaceAsync(item, ct).ConfigureAwait(false)) return false;

        try
        {
            var (request, warnings) = await BuildUploadAsync(item, now, ct).ConfigureAwait(false);
            var status = uploads.Start(request);

            item.UploadId = status.UploadId;
            item.YouTubePublishAt = request.Metadata.PublishAt;
            item.ErrorCode = null;
            item.Error = null;
            item.Warning = warnings.Count == 0 ? null : string.Join(" ", warnings);
            item.UpdatedAt = Now;
            if (!await repository.ReplaceAsync(item, ct).ConfigureAwait(false))
            {
                // Cancelled while the upload was being prepared: stop it again here.
                var latest = await repository.GetAsync(item.Id, ct).ConfigureAwait(false);
                if (latest?.State == PublishQueueState.Cancelled) uploads.Cancel(item.UserId, status.UploadId);
            }

            logger.LogInformation("Queued video {QueueItemId} started uploading to YouTube channel {ChannelId} (attempt {Attempt}, released by YouTube {Released})",
                item.Id, item.ChannelId, item.Attempts, request.Metadata.PublishAt is not null);
            return true;
        }
        catch (YouTubePublishException ex)
        {
            await FailAsync(item, ex.Code, ex.Message, ct).ConfigureAwait(false);
        }
        catch (EditingException ex)
        {
            await FailAsync(item, ex.Code, ex.Message, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
        {
            await FailAsync(item, "video-missing", "The render is no longer there. Remove this video from the board.", ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Fail closed with a generic message; the detail stays in the server log.
            logger.LogError(ex, "Starting the upload of queued video {QueueItemId} failed unexpectedly", item.Id);
            await FailAsync(item, "youtube-upload-failed", "The upload couldn't be started. It will be tried again.", ct).ConfigureAwait(false);
        }
        return false;
    }

    /// <summary>
    /// Everything a publish checks, done again now the video is going out: the render is still
    /// there, the channel still connected, the details still within YouTube's limits. What can
    /// be left out without harm (a comment, a thumbnail, a calendar link) becomes a warning.
    /// </summary>
    private async Task<(YouTubeUploadRequest Request, List<string> Warnings)> BuildUploadAsync(PublishQueueItem item, DateTime now, CancellationToken ct)
    {
        var warnings = new List<string>();
        var job = await LoadOwnedJobAsync(item.UserId, item.JobId, ct).ConfigureAwait(false);
        var facts = Facts(job);
        if (!facts.IsCompleted || !facts.HasOutput)
            throw new YouTubePublishException("video-missing", "The render's file is no longer there. Render it again and queue the new one.");

        var connection = await RequireChannelAsync(item.UserId, item.ChannelId, ct, asPublishError: true).ConfigureAwait(false);

        var related = await publications.ResolveRelatedAsync(item.UserId, item.RelatedVideoIds, ct).ConfigureAwait(false);
        if (related.Count != item.RelatedVideoIds.Count) warnings.Add("A related video is no longer in your list and was left out.");

        var releaseAt = PublishQueueRules.YouTubeReleaseAt(item.Mode, item.Privacy, item.ScheduledAt, now);
        if (releaseAt is null && PublishQueueRules.EffectiveMode(item.Mode, item.Privacy) == PublishQueueMode.ReleaseOnYouTube
            && item.ScheduledAt > now + TimeSpan.FromMinutes(1))
            warnings.Add("It was too close to its time for YouTube to release it, so it went up public straight away.");

        var metadata = new YouTubeVideoMetadata
        {
            Title = item.Title,
            Description = related.Count == 0 ? item.Description : YouTubeRelatedVideos.AppendToDescription(item.Description, related),
            Tags = item.Tags,
            CategoryId = item.CategoryId,
            Privacy = releaseAt is null ? item.Privacy : "private",
            MadeForKids = item.MadeForKids,
            NotifySubscribers = item.NotifySubscribers,
            PublishAt = releaseAt,
        };
        var validation = YouTubePublishValidator.Validate(metadata, facts, now);
        if (!validation.IsValid)
            throw new YouTubePublishException(validation.Errors[0].Code, validation.Errors[0].Message);

        var comment = item.FirstComment;
        if (comment is not null && !YouTubeOAuthClient.AllowsComments(connection.Scopes))
        {
            comment = null;
            warnings.Add("The first comment wasn't posted: reconnect the channel to allow comments.");
        }

        var thumbnail = await LoadThumbnailAsync(item, job, facts, warnings, ct).ConfigureAwait(false);

        string? planItemId = null;
        if (item.PlanItemId is { } postId)
        {
            try
            {
                planItemId = (await CheckPlanItemAsync(item.UserId, postId, connection.ChannelId, ct).ConfigureAwait(false)).Id;
            }
            catch (Exception ex) when (ex is EditingException or KeyNotFoundException or UnauthorizedAccessException)
            {
                warnings.Add("The calendar post was taken or removed, so the video isn't linked to it.");
            }
        }

        var request = new YouTubeUploadRequest(
            item.UserId, job.Id, job.OutputStorageKey!, job.OutputSizeBytes ?? 0,
            connection.ChannelId, connection.ChannelTitle, validation.Normalized!, job.ProjectId,
            [.. related.Select(r => r.VideoId)], comment) with { ThumbnailJpeg = thumbnail, PlanItemId = planItemId };
        return (request, warnings);
    }

    /// <summary>Reads the upload's state into the item, saving it once the upload has finished.</summary>
    private async Task<PublishQueueItem> FollowUploadAsync(PublishQueueItem item, CancellationToken ct)
    {
        if (item.UploadId is null)
        {
            // Claimed but never handed over (the server stopped in between): try again.
            if (item.StartedAt < Now - TimeSpan.FromMinutes(5))
                await FailAsync(item, "queue-upload-lost", "The server stopped before the upload started.", ct).ConfigureAwait(false);
            return item;
        }

        var status = uploads.Get(item.UserId, item.UploadId);
        if (status is null)
        {
            // The upload list forgets finished uploads after a while. If this one made it to YouTube,
            // its saved record says so - and trying again would put the video up twice.
            if (await FindPublicationAsync(item, ct).ConfigureAwait(false) is { } done)
            {
                item.State = PublishQueueState.Published;
                item.VideoId = done.VideoId;
                item.PublicationId = done.Id;
                item.YouTubePublishAt = done.PublishAt;
                item.FinishedAt = done.PublishedAt;
                item.ErrorCode = null;
                item.Error = null;
                await TrySaveAsync(item, ct).ConfigureAwait(false);
                return item;
            }
            await FailAsync(item, "queue-upload-lost", "The server restarted before the upload finished.", ct).ConfigureAwait(false);
            return item;
        }

        switch (status.State)
        {
            case YouTubeUploadState.Completed:
                item.State = PublishQueueState.Published;
                item.VideoId = status.VideoId;
                item.PublicationId = status.PublicationId;
                item.YouTubePublishAt = status.PublishAt;
                item.Warning = Join(item.Warning, status.Warning);
                item.FinishedAt = status.CompletedAt ?? Now;
                item.ErrorCode = null;
                item.Error = null;
                await TrySaveAsync(item, ct).ConfigureAwait(false);
                logger.LogInformation("Queued video {QueueItemId} is on YouTube as {VideoId}", item.Id, status.VideoId);
                break;
            case YouTubeUploadState.Failed:
                await FailAsync(item, status.ErrorCode ?? "youtube-upload-failed", status.Error ?? "The upload failed.", ct).ConfigureAwait(false);
                break;
            case YouTubeUploadState.Cancelled:
                item.State = PublishQueueState.Cancelled;
                item.Error = status.Error;
                item.FinishedAt = status.CompletedAt ?? Now;
                await TrySaveAsync(item, ct).ConfigureAwait(false);
                break;
        }
        return item;
    }

    /// <summary>This item's video on YouTube, recorded since its upload started; null when none was.</summary>
    private async Task<YouTubePublication?> FindPublicationAsync(PublishQueueItem item, CancellationToken ct)
    {
        var since = item.StartedAt ?? item.CreatedAt;
        var records = await publicationRecords.ListByUserAsync(item.UserId, item.ProjectId, 100, ct).ConfigureAwait(false);
        return records.FirstOrDefault(p => p.JobId == item.JobId && p.ChannelId == item.ChannelId && p.PublishedAt >= since);
    }

    /// <summary>Busy: back in line without spending an attempt. Transient: retried later. Otherwise: failed for the owner to fix.</summary>
    private async Task FailAsync(PublishQueueItem item, string code, string message, CancellationToken ct)
    {
        var now = Now;
        item.ErrorCode = code;
        item.Error = message;
        item.UploadId = null;

        if (PublishQueueRules.IsBusy(code))
        {
            item.Attempts = Math.Max(0, item.Attempts - 1);
            item.State = PublishQueueState.Waiting;
            item.DueAt = now + BusyRetry;
        }
        else if (PublishQueueRules.ShouldRetry(code, item.Attempts))
        {
            item.State = PublishQueueState.Waiting;
            item.DueAt = now + PublishQueueRules.RetryDelay(item.Attempts);
        }
        else
        {
            item.State = PublishQueueState.Failed;
            item.DueAt = null;
            item.FinishedAt = now;
        }

        logger.LogWarning("Queued video {QueueItemId} could not go out ({Code}, attempt {Attempt}); now {State}",
            item.Id, code, item.Attempts, item.State);
        await TrySaveAsync(item, ct).ConfigureAwait(false);
    }

    // --- helpers ---

    private async Task<PublishQueueItem> LoadOwnedAsync(string userId, string id, CancellationToken ct)
    {
        var item = await repository.GetAsync(id, ct).ConfigureAwait(false);
        // Someone else's item is reported exactly like a missing one.
        if (item is null || !string.Equals(item.UserId, userId, StringComparison.Ordinal)) throw new KeyNotFoundException();
        return item;
    }

    private async Task<RenderJob> LoadOwnedJobAsync(string userId, string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct).ConfigureAwait(false);
        if (job is null || !string.Equals(job.UserId, userId, StringComparison.Ordinal)) throw new KeyNotFoundException();
        return job;
    }

    private async Task<YouTubeChannelConnection> RequireChannelAsync(string userId, string? channelId, CancellationToken ct, bool asPublishError = false)
    {
        if (string.IsNullOrWhiteSpace(channelId))
            throw EditingException.Invalid("channel-missing", "Choose a channel to publish to.");

        var connection = await connections.GetAsync(userId, channelId, ct).ConfigureAwait(false);
        if (connection is null)
            throw asPublishError
                ? new YouTubePublishException("youtube-channel-not-connected", "That channel isn't connected any more. Connect it again, or move the video to another channel.")
                : EditingException.Invalid("youtube-channel-not-connected", "That channel isn't connected. Connect it first.");
        if (connection.RevokedAt is not null)
            throw asPublishError
                ? new YouTubePublishException("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again, then retry.")
                : EditingException.Invalid("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.");
        return connection;
    }

    /// <summary>Checks the details against YouTube's limits and keeps them as they will be sent.</summary>
    private static void ApplyDetails(PublishQueueItem item, YouTubeVideoMetadata? metadata, YouTubeVideoFacts facts)
    {
        // The time is the board's business; YouTube's own schedule is decided when the upload starts.
        var validation = YouTubePublishValidator.Validate(metadata is null ? null : metadata with { PublishAt = null }, facts);
        if (!validation.IsValid)
            throw EditingException.Invalid(validation.Errors[0].Code, validation.Errors[0].Message);

        var normalized = validation.Normalized!;
        item.Title = normalized.Title;
        item.Description = normalized.Description;
        item.Tags = [.. normalized.Tags];
        item.CategoryId = normalized.CategoryId;
        item.Privacy = normalized.Privacy;
        item.MadeForKids = normalized.MadeForKids;
        item.NotifySubscribers = normalized.NotifySubscribers;
    }

    private static string? CheckComment(string? text, YouTubeChannelConnection connection)
    {
        var (comment, error) = YouTubeCommentRules.Normalize(text);
        if (error is not null) throw EditingException.Invalid(error.Code, error.Message);
        if (comment is not null && !YouTubeOAuthClient.AllowsComments(connection.Scopes))
            throw EditingException.Invalid("youtube-comment-scope",
                "This channel was connected before AnimStudio could post comments. Reconnect it, or leave the first comment empty.");
        return comment;
    }

    private async Task<List<string>> CheckRelatedAsync(string userId, IReadOnlyList<string>? ids, string description, CancellationToken ct)
    {
        var relatedIds = (ids ?? []).Distinct(StringComparer.Ordinal).ToList();
        if (relatedIds.Count > YouTubeRelatedVideos.MaxRelated || relatedIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            throw EditingException.Invalid("related-invalid", $"Choose up to {YouTubeRelatedVideos.MaxRelated} related videos from the list.");

        var related = await publications.ResolveRelatedAsync(userId, relatedIds, ct).ConfigureAwait(false);
        if (related.Count != relatedIds.Count)
            throw EditingException.Invalid("related-not-found", "A related video is no longer in your list. Pick again.");

        // The links are added when it goes out; the whole description must still fit then.
        if (related.Count > 0)
        {
            var check = YouTubePublishValidator.ValidateDetails(new YouTubeVideoMetadata
            {
                Title = "x", Description = YouTubeRelatedVideos.AppendToDescription(description, related),
                CategoryId = "1", Privacy = "private", MadeForKids = false,
            });
            if (check.Errors.FirstOrDefault(e => e.Field == "description") is { } tooLong)
                throw EditingException.Invalid(tooLong.Code, tooLong.Message);
        }
        return relatedIds;
    }

    private async Task<ContentPlanItem> CheckPlanItemAsync(string userId, string planItemId, string channelId, CancellationToken ct)
    {
        if (planItemId.Length > 64 || !planItemId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_'))
            throw EditingException.Invalid("plan-item-invalid", "Choose a calendar post from the list.");

        var post = await planning.GetItemAsync(planItemId, userId, ct).ConfigureAwait(false);
        if (post.VideoId is not null
            || post.Status is not (ContentPlanStatus.Idea or ContentPlanStatus.InProgress or ContentPlanStatus.Ready))
            throw EditingException.Conflict("plan-item-taken", "That calendar post already has a video or is finished. Pick another.");
        var postChannel = post.ChannelId ?? (await planning.GetTopicAsync(post.TopicId, userId, ct).ConfigureAwait(false)).ChannelId;
        if (postChannel is not null && !string.Equals(postChannel, channelId, StringComparison.Ordinal))
            throw EditingException.Invalid("plan-item-other-channel", "That calendar post is for another channel. Pick another, or change the channel.");
        return post;
    }

    private static DateTime CheckTime(DateTime? requested, DateTime now)
    {
        var (at, error) = PublishQueueRules.CheckSchedule(requested, now);
        return at ?? throw EditingException.Invalid("queue-time-invalid", error!);
    }

    private static PublishQueueMode CheckMode(PublishQueueMode mode) =>
        Enum.IsDefined(mode) ? mode : throw EditingException.Invalid("queue-mode-invalid", "Pick how the time is kept from the list.");

    private static string? CleanNotes(string? notes)
    {
        var text = notes?.Trim();
        if (string.IsNullOrEmpty(text)) return null;
        if (text.Length > PublishQueueRules.MaxNotesLength)
            throw EditingException.Invalid("queue-notes-too-long", $"Keep the note under {PublishQueueRules.MaxNotesLength} characters.");
        return text;
    }

    /// <summary>Picks a frame (kept as its time) or keeps an uploaded picture, re-encoded, in the store.</summary>
    private async Task SetThumbnailAsync(PublishQueueItem item, YouTubeThumbnailChoice? choice, RenderJob job, CancellationToken ct)
    {
        var (source, frameAt, image, error) = YouTubeThumbnailRules.Check(choice, job.Diagnostics?.OutputDurationSeconds);
        if (error is not null) throw EditingException.Invalid(error.Code, error.Message);

        switch (source)
        {
            case YouTubeThumbnailSource.Frame:
                item.ThumbnailFrameAt = frameAt;
                break;
            case YouTubeThumbnailSource.Image:
                byte[] jpeg;
                try
                {
                    jpeg = await thumbnails.NormalizeAsync(image!, ct).ConfigureAwait(false);
                }
                catch (YouTubePublishException ex)
                {
                    throw EditingException.Invalid(ex.Code, ex.Message);
                }
                // Server-composed key: the item's own id, never anything from the client.
                var key = $"publish-queue/{item.Id}.jpg";
                using (var content = new MemoryStream(jpeg, writable: false))
                    await store.SaveAsync(key, content, "image/jpeg", ct).ConfigureAwait(false);
                item.ThumbnailKey = key;
                break;
        }
    }

    private async Task DropThumbnailAsync(PublishQueueItem item, CancellationToken ct)
    {
        item.ThumbnailFrameAt = null;
        if (item.ThumbnailKey is not { } key) return;
        item.ThumbnailKey = null;
        try
        {
            await store.DeleteAsync(key, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Housekeeping only: an orphaned picture doesn't stop the change.
            logger.LogWarning(ex, "Deleting the thumbnail of queued video {QueueItemId} failed", item.Id);
        }
    }

    private async Task<byte[]?> LoadThumbnailAsync(PublishQueueItem item, RenderJob job, YouTubeVideoFacts facts, List<string> warnings, CancellationToken ct)
    {
        try
        {
            if (item.ThumbnailKey is { } key)
            {
                await using var stream = await store.OpenAsync(key, ct).ConfigureAwait(false);
                if (stream is null)
                {
                    warnings.Add("The custom thumbnail was missing, so YouTube picks one.");
                    return null;
                }
                using var buffer = new MemoryStream();
                await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
                return buffer.ToArray();
            }

            if (item.ThumbnailFrameAt is { } at)
            {
                var path = await RenderPreviewFile.EnsureAsync(store, dataPaths, job, ct).ConfigureAwait(false);
                return await thumbnails.FrameAsync(path, YouTubeThumbnailRules.ClampFrame(at, facts.DurationSeconds),
                    YouTubeThumbnailRules.TargetWidth, ct).ConfigureAwait(false);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The video matters more than its picture: go without, and say so.
            logger.LogWarning("The thumbnail of queued video {QueueItemId} couldn't be prepared: {Error}", item.Id, ex.GetType().Name);
            warnings.Add("The custom thumbnail couldn't be prepared, so YouTube picks one.");
        }
        return null;
    }

    /// <summary>Back to waiting from any resting state, with a clean slate for retries.</summary>
    private void Reopen(PublishQueueItem item)
    {
        item.State = PublishQueueState.Waiting;
        item.Attempts = 0;
        item.ErrorCode = null;
        item.Error = null;
        item.Warning = null;
        item.FinishedAt = null;
        item.UploadId = null;
        Reschedule(item);
    }

    private void Reschedule(PublishQueueItem item) =>
        item.DueAt = PublishQueueRules.DueAt(item.State, item.ScheduledAt, item.Mode, item.Privacy, ReleaseLead);

    private async Task SaveAsync(PublishQueueItem item, DateTime now, CancellationToken ct)
    {
        item.UpdatedAt = now;
        Reschedule(item);
        if (!await repository.ReplaceAsync(item, ct).ConfigureAwait(false)) throw Changed();
    }

    /// <summary>The scheduler's saves: a lost race means someone else already moved the item on.</summary>
    private async Task TrySaveAsync(PublishQueueItem item, CancellationToken ct)
    {
        item.UpdatedAt = Now;
        if (!await repository.ReplaceAsync(item, ct).ConfigureAwait(false))
            logger.LogInformation("Queued video {QueueItemId} changed while it was being updated; keeping the newer copy", item.Id);
    }

    private static EditingException Changed() =>
        EditingException.Conflict("queue-item-changed", "This video changed meanwhile (it may have started uploading). Refresh and try again.");

    private static string? Join(string? a, string? b) =>
        string.IsNullOrEmpty(a) ? b : string.IsNullOrEmpty(b) ? a : $"{a} {b}";

    private static bool IsReady(RenderJob job) =>
        job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings && job.OutputStorageKey is not null;

    private static YouTubeVideoFacts Facts(RenderJob job) => new(
        job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings,
        job.OutputStorageKey is not null,
        job.OutputSizeBytes,
        job.Diagnostics?.OutputDurationSeconds,
        job.Width,
        job.Height);

    private PublishQueueItemView View(PublishQueueItem item)
    {
        int? percent = null;
        if (item.State == PublishQueueState.Uploading && item.UploadId is { } uploadId)
            percent = uploads.Get(item.UserId, uploadId)?.Percent;
        else if (item.State == PublishQueueState.Published)
            percent = 100;

        return new PublishQueueItemView(
            item.Id, item.JobId, item.ProjectId, item.ProjectName, item.ChannelId, item.ChannelTitle,
            item.Title, item.Description, item.Tags, item.CategoryId,
            YouTubePublishValidator.Categories.GetValueOrDefault(item.CategoryId, item.CategoryId),
            item.Privacy, item.MadeForKids, item.NotifySubscribers, item.FirstComment, item.RelatedVideoIds, item.PlanItemId,
            item.ThumbnailKey is not null || item.ThumbnailFrameAt is not null, item.ThumbnailFrameAt, item.Notes,
            item.ScheduledAt, item.Mode, PublishQueueRules.EffectiveMode(item.Mode, item.Privacy), item.DueAt,
            item.State, item.Attempts, item.ErrorCode, item.Error, item.Warning, percent,
            item.VideoId,
            item.VideoId is null ? null : $"https://youtu.be/{item.VideoId}",
            item.VideoId is null ? null : $"https://studio.youtube.com/video/{item.VideoId}/edit",
            item.YouTubePublishAt, item.DurationSeconds, item.IsVertical,
            item.CreatedAt, item.UpdatedAt, item.StartedAt, item.FinishedAt,
            PublishQueueRules.CanEdit(item.State));
    }
}
