using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Planning;
using AnimStudio.Domain.Planning;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Planning;

/// <summary>A recent upload on the topic's channel that could be the post's video.</summary>
public sealed record ContentUploadCandidate(ContentUploadSnapshot Video, bool Suggested);

/// <summary>
/// The YouTube side of the calendar: linking a post to its video (also one uploaded from the
/// phone), reading back whether it is scheduled or live, and putting the planned publish time
/// on it. Every call uses the owner's own channel token.
/// </summary>
public sealed class ContentCalendarYouTubeService(
    IContentPlanItemRepository items,
    IContentTopicRepository topics,
    ContentPlanningService planning,
    YouTubeConnectionStore connections,
    YouTubeChannelVideosClient videos,
    TimeProvider clock,
    ILogger<ContentCalendarYouTubeService> logger)
{
    private const int RecentUploadsToScan = 25;

    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    /// <summary>
    /// Links the post to a video by id or link. With a connected channel the video is checked
    /// to be on it; without one the link is kept as given and can't be synced.
    /// </summary>
    public async Task<ContentPlanItem> LinkAsync(ContentPlanItem item, string? reference, CancellationToken ct)
    {
        if (!ContentPlanRules.TryParseVideoReference(reference, out var videoId))
            throw EditingException.Invalid("video-invalid", "Paste the video's YouTube link or its 11-character id.");

        if (await items.FindByVideoIdAsync(item.UserId, videoId, ct) is { } other && other.Id != item.Id)
            throw EditingException.Conflict("video-already-linked", $"That video is already linked to \"{other.Title}\".");

        var topic = await topics.GetAsync(item.TopicId, ct);
        item.ChannelId ??= topic?.ChannelId;
        item.VideoId = videoId;
        item.VideoAutoLinked = false;
        item.SyncMessage = null;

        if (item.ChannelId is not null)
        {
            var token = await connections.GetAccessTokenAsync(item.UserId, item.ChannelId, ct);
            var video = await videos.GetVideoAsync(token, videoId, ct);
            if (video is null || !string.Equals(video.ChannelId, item.ChannelId, StringComparison.Ordinal))
                throw EditingException.Invalid("video-not-on-channel", "That video isn't on this topic's channel (or isn't visible to it).");
            ContentPlanRules.ApplyYouTube(item, Snapshot(video), Now);
            if (topic?.AutoSchedule == true) await TryAutoScheduleAsync(item, token, ct);
        }

        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    public async Task<ContentPlanItem> UnlinkAsync(ContentPlanItem item, CancellationToken ct)
    {
        item.VideoId = null;
        item.VideoAutoLinked = false;
        item.YouTube = null;
        item.SyncMessage = null;
        if (item.Status is ContentPlanStatus.Scheduled or ContentPlanStatus.Published) item.Status = ContentPlanStatus.Ready;
        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    /// <summary>The owner confirmed an automatic link was right.</summary>
    public async Task<ContentPlanItem> ConfirmLinkAsync(ContentPlanItem item, CancellationToken ct)
    {
        item.VideoAutoLinked = false;
        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    /// <summary>Re-reads the linked video from YouTube and folds its state into the post.</summary>
    public async Task<ContentPlanItem> SyncAsync(ContentPlanItem item, CancellationToken ct)
    {
        var channelId = RequireChannel(item);
        if (item.VideoId is null) throw EditingException.Invalid("video-not-linked", "Link the post to its YouTube video first.");

        var token = await connections.GetAccessTokenAsync(item.UserId, channelId, ct);
        var video = await videos.GetVideoAsync(token, item.VideoId, ct);
        ContentPlanRules.ApplyYouTube(item, video is null ? null : Snapshot(video), Now);
        item.SyncMessage = null;

        var topic = await topics.GetAsync(item.TopicId, ct);
        if (topic?.AutoSchedule == true) await TryAutoScheduleAsync(item, token, ct);

        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    /// <summary>Puts the planned publish time on the linked video now.</summary>
    public async Task<ContentPlanItem> ApplyScheduleAsync(ContentPlanItem item, CancellationToken ct)
    {
        var channelId = RequireChannel(item);
        if (item.VideoId is null) throw EditingException.Invalid("video-not-linked", "Link the post to its YouTube video first.");
        if (item.PublishAt - Now < ContentPlanRules.MinScheduleLead)
            throw EditingException.Invalid("schedule-too-soon", "The planned time is too close (or past). Move it at least 10 minutes ahead first.");

        var token = await connections.GetAccessTokenAsync(item.UserId, channelId, ct);
        await videos.SetScheduleAsync(token, item.VideoId, item.PublishAt, ct, channelId);
        var video = await videos.GetVideoAsync(token, item.VideoId, ct);
        ContentPlanRules.ApplyYouTube(item, video is null ? null : Snapshot(video), Now);
        item.SyncMessage = null;
        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    /// <summary>
    /// After the plan moved a post, puts the new time on its linked private video when the topic
    /// allows automatic scheduling. Never throws for YouTube: a refusal is written on the post.
    /// </summary>
    public async Task<ContentPlanItem> FollowPlanAsync(ContentPlanItem item, CancellationToken ct)
    {
        if (item.ChannelId is null || !ContentPlanRules.NeedsSchedule(item, Now)) return item;
        if (await topics.GetAsync(item.TopicId, ct) is not { AutoSchedule: true }) return item;
        try
        {
            var token = await connections.GetAccessTokenAsync(item.UserId, item.ChannelId, ct);
            await TryAutoScheduleAsync(item, token, ct);
        }
        catch (YouTubePublishException ex)
        {
            item.SyncMessage = ex.Message;
        }
        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return item;
    }

    /// <summary>Recent uploads on the channel not linked to another post, the likely one flagged.</summary>
    public async Task<IReadOnlyList<ContentUploadCandidate>> CandidatesAsync(ContentPlanItem item, CancellationToken ct)
    {
        var channelId = RequireChannel(item);
        var token = await connections.GetAccessTokenAsync(item.UserId, channelId, ct);
        var recent = await videos.ListRecentAsync(token, channelId, RecentUploadsToScan, ct);

        var free = new List<ContentUploadSnapshot>();
        foreach (var v in recent)
        {
            var owner = await items.FindByVideoIdAsync(item.UserId, v.VideoId, ct);
            if (owner is null || owner.Id == item.Id) free.Add(Snapshot(v));
        }
        var unlinked = new ContentPlanItem { Title = item.Title, PublishAt = item.PublishAt, Status = ContentPlanStatus.Ready };
        return [.. free.Select(v => new ContentUploadCandidate(v, ContentPlanRules.MatchUpload(v, [unlinked]) is not null))];
    }

    /// <summary>
    /// One background pass for one owner's channel: link fresh uploads to the posts they
    /// match, then re-read every linked post and fix its schedule when the topic allows.
    /// Failures are written on the post (user-safe) and logged, never thrown.
    /// </summary>
    public async Task SweepChannelAsync(string userId, string channelId, IReadOnlyList<ContentPlanItem> posts,
        IReadOnlyDictionary<string, ContentTopic> topicById, CancellationToken ct)
    {
        string token;
        try
        {
            token = await connections.GetAccessTokenAsync(userId, channelId, ct);
        }
        catch (YouTubePublishException ex)
        {
            logger.LogInformation("Calendar sync skipped a channel: {Code}", ex.Code);
            return;
        }

        var unlinked = posts.Where(p => p.VideoId is null
            && topicById.TryGetValue(p.TopicId, out var t) && t.AutoLinkUploads).ToList();
        if (unlinked.Count > 0)
        {
            try
            {
                var recent = await videos.ListRecentAsync(token, channelId, RecentUploadsToScan, ct);
                foreach (var upload in recent.Where(v => v.PublishedAt is null || v.PublishedAt >= Now.AddDays(-14)))
                {
                    if (await items.FindByVideoIdAsync(userId, upload.VideoId, ct) is not null) continue;
                    var snapshot = Snapshot(upload);
                    if (ContentPlanRules.MatchUpload(snapshot, unlinked) is not { } match) continue;

                    match.VideoId = upload.VideoId;
                    match.ChannelId = channelId;
                    match.VideoAutoLinked = true;
                    ContentPlanRules.ApplyYouTube(match, snapshot, Now);
                    unlinked.Remove(match);
                    await SaveAfterAsync(match, topicById, token, ct);
                    logger.LogInformation("Calendar linked an upload to post {PostId}", match.Id);
                }
            }
            catch (YouTubePublishException ex)
            {
                logger.LogWarning("Calendar upload scan failed: {Code}", ex.Code);
            }
        }

        // Posts linked a moment ago (above, or by the owner) were just read; skip them this pass.
        var recentlyChecked = Now.AddMinutes(-5);
        foreach (var post in posts.Where(p => p.VideoId is not null && !(p.YouTube?.CheckedAt >= recentlyChecked)))
        {
            if (post.Status == ContentPlanStatus.Skipped) continue;
            if (post.Status == ContentPlanStatus.Published && post.PublishAt < Now.AddDays(-2)) continue;
            try
            {
                var video = await videos.GetVideoAsync(token, post.VideoId!, ct);
                ContentPlanRules.ApplyYouTube(post, video is null ? null : Snapshot(video), Now);
                post.SyncMessage = null;
                await SaveAfterAsync(post, topicById, token, ct);
            }
            catch (YouTubePublishException ex)
            {
                post.SyncMessage = ex.Message;
                await items.UpsertAsync(post, ct);
                if (ex.Code is "youtube-quota" or "youtube-reconnect") return;
            }
        }
    }

    private async Task SaveAfterAsync(ContentPlanItem post, IReadOnlyDictionary<string, ContentTopic> topicById, string token, CancellationToken ct)
    {
        if (topicById.TryGetValue(post.TopicId, out var topic) && topic.AutoSchedule)
            await TryAutoScheduleAsync(post, token, ct);
        post.UpdatedAt = Now;
        await items.UpsertAsync(post, ct);
    }

    /// <summary>Puts the planned time on a private video that wouldn't otherwise go live then. A refusal is noted on the post.</summary>
    private async Task TryAutoScheduleAsync(ContentPlanItem item, string token, CancellationToken ct)
    {
        if (!ContentPlanRules.NeedsSchedule(item, Now)) return;
        try
        {
            await videos.SetScheduleAsync(token, item.VideoId!, item.PublishAt, ct, item.ChannelId);
            var video = await videos.GetVideoAsync(token, item.VideoId!, ct);
            ContentPlanRules.ApplyYouTube(item, video is null ? null : Snapshot(video), Now);
            logger.LogInformation("Calendar scheduled the video of post {PostId}", item.Id);
        }
        catch (YouTubePublishException ex)
        {
            item.SyncMessage = ex.Message;
            logger.LogWarning("Calendar could not schedule post {PostId}: {Code}", item.Id, ex.Code);
        }
    }

    private static string RequireChannel(ContentPlanItem item) =>
        item.ChannelId ?? throw EditingException.Invalid("topic-no-channel",
            "Pick the YouTube channel for this topic first (edit the topic).");

    private static ContentUploadSnapshot Snapshot(YouTubeChannelVideo v) =>
        new(v.VideoId, v.Title, v.PrivacyStatus, v.ScheduledAt, v.PublishedAt, v.ThumbnailUrl);

    private static ContentUploadSnapshot Snapshot(YouTubeVideoFullDetails v) =>
        new(v.VideoId, v.Title, v.PrivacyStatus, v.ScheduledAt, v.PublishedAt, v.ThumbnailUrl);

    /// <summary>Plans every active topic's upcoming slots. Used by the background planner.</summary>
    public async Task<int> PlanAllAsync(IReadOnlyList<ContentTopic> active, CancellationToken ct)
    {
        var added = 0;
        foreach (var topic in active)
        {
            try
            {
                added += await planning.PlanSlotsAsync(topic, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Planning slots for topic {TopicId} failed", topic.Id);
            }
        }
        return added;
    }
}
