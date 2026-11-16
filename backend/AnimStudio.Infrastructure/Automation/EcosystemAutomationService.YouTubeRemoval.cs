using AnimStudio.Application.Common;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// What to do with a card's published YouTube video: delete it through the API (or record that it was already
/// deleted in YouTube Studio), optionally retarget the card to another connected channel, and optionally upload again.
/// </summary>
public sealed record AutomationYouTubeRemovalRequest(bool DeleteOnYouTube, string? TargetChannelId, bool RepublishNow);

public sealed partial class EcosystemAutomationService
{
    /// <summary>How often the worker checks that published automation videos still exist on YouTube.</summary>
    private static readonly TimeSpan RemovedVideoSweepInterval = TimeSpan.FromMinutes(30);

    /// <summary>A published card is re-checked at most this often.</summary>
    private static readonly TimeSpan PerPostCheckInterval = TimeSpan.FromHours(2);

    /// <summary>Videos this fresh may still be invisible to <c>videos.list</c>; they are checked next time.</summary>
    private static readonly TimeSpan FreshUploadGrace = TimeSpan.FromMinutes(20);

    private static readonly TimeSpan CheckWindow = TimeSpan.FromDays(45);
    private static long _lastRemovedVideoSweepTicks;

    /// <summary>
    /// Takes a card's video off YouTube (or records that it is already gone) and returns the card to "video ready" with
    /// its rendered video still attached, so it can be published again - to the same channel or a different one.
    /// </summary>
    public async Task<AutomationPost> RemoveFromYouTubeAsync(
        string userId,
        string postId,
        AutomationYouTubeRemovalRequest request,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status == AutomationPostStatus.Publishing)
            throw EditingException.Conflict("post-uploading", "Wait for the upload to finish before removing it from YouTube.");

        var videoId = post.PublishedVideoId;
        if (string.IsNullOrWhiteSpace(videoId) || !YouTubeRelatedVideos.IsVideoId(videoId))
            throw EditingException.Invalid("video-not-published", "This card has no YouTube video to remove.");

        // Validate the new target before touching YouTube so a typo never leaves the card half-moved.
        YouTubeChannelConnection? newTarget = null;
        if (!string.IsNullOrWhiteSpace(request.TargetChannelId))
        {
            newTarget = await connections.GetAsync(userId, request.TargetChannelId.Trim(), ct).ConfigureAwait(false)
                ?? throw EditingException.Invalid("channel-not-connected", "Connect that YouTube channel first in YouTube settings.");
            if (newTarget.RevokedAt is not null)
                throw EditingException.Invalid("channel-reconnect", "That YouTube connection expired. Reconnect it before posting.");
        }

        var channelId = post.PublishedChannelId ?? post.TargetChannelId;
        var channelTitle = post.PublishedChannelTitle ?? post.TargetChannelTitle;
        var deletedByApp = false;
        if (request.DeleteOnYouTube)
        {
            if (string.IsNullOrWhiteSpace(channelId))
                throw EditingException.Invalid("channel-missing", "This card doesn't say which channel the video is on. Delete it in YouTube Studio, then choose 'I already deleted it'.");

            var connection = await connections.GetAsync(userId, channelId, ct).ConfigureAwait(false);
            if (connection is null || connection.RevokedAt is not null)
                throw EditingException.Invalid("channel-not-connected", $"Reconnect {channelTitle ?? "that channel"} to delete from the app, or delete it in YouTube Studio and choose 'I already deleted it'.");
            if (!YouTubeOAuthClient.AllowsComments(connection.Scopes))
                throw EditingException.Invalid("youtube-reconnect", $"{connection.ChannelTitle} was connected without permission to manage videos. Reconnect it in YouTube settings, or delete it in YouTube Studio and choose 'I already deleted it'.");

            try
            {
                var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
                deletedByApp = await videoClient.DeleteAsync(videoId, token, ct).ConfigureAwait(false);
            }
            catch (YouTubePublishException ex)
            {
                throw EditingException.Invalid(ex.Code, ex.Message);
            }
            logger.LogInformation("Automation post {PostId}: YouTube video {VideoId} {Outcome} on channel {ChannelId}",
                post.Id, videoId, deletedByApp ? "deleted" : "was already gone", channelId);
        }

        await MarkPublicationRemovedAsync(userId, videoId, deletedByApp, ct).ConfigureAwait(false);
        await TryUnlistFromPanchangAsync(post, ct).ConfigureAwait(false);
        if (catalogWriter is not null) await catalogWriter.MarkRemovedAsync(videoId, ct).ConfigureAwait(false);
        ResetAfterYouTubeRemoval(post, channelId, channelTitle, deletedByApp,
            deletedByApp
                ? $"Deleted from YouTube ({channelTitle ?? channelId}) in the app."
                : $"Marked as removed from YouTube ({channelTitle ?? channelId}).");

        if (newTarget is not null)
        {
            post.TargetChannelId = newTarget.ChannelId;
            post.TargetChannelTitle = newTarget.ChannelTitle;
            post.TargetChannelHandle = newTarget.ChannelHandle;
        }

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);

        if (request.RepublishNow)
            return await ExecutePublishAsync(userId, post, publishNow: true, scheduledAtUtc: null, ct).ConfigureAwait(false);
        return post;
    }

    /// <summary>
    /// Worker step: finds published cards whose video no longer exists on YouTube (deleted in YouTube Studio, removed
    /// by YouTube) and returns them to "video ready" with a clear note. 1 quota unit per 50 videos per channel.
    /// </summary>
    internal async Task<int> DetectRemovedYouTubeVideosAsync(CancellationToken ct)
    {
        var nowTicks = UtcNow.Ticks;
        var last = Interlocked.Read(ref _lastRemovedVideoSweepTicks);
        if (nowTicks - last < RemovedVideoSweepInterval.Ticks) return 0;
        if (Interlocked.CompareExchange(ref _lastRemovedVideoSweepTicks, nowTicks, last) != last) return 0;

        var now = UtcNow;
        var due = (await repository.ListPostsByStatusesAsync([AutomationPostStatus.Published], 500, ct).ConfigureAwait(false))
            .Where(p => YouTubeRelatedVideos.IsVideoId(p.PublishedVideoId)
                && p.PublishedAtUtc is { } at && at > now - CheckWindow && at < now - FreshUploadGrace
                && (p.YouTubeCheckedAtUtc is null || p.YouTubeCheckedAtUtc < now - PerPostCheckInterval))
            .ToList();
        if (due.Count == 0) return 0;

        var changed = 0;
        foreach (var byUser in due.GroupBy(p => p.UserId, StringComparer.Ordinal))
        {
            // Legacy cards don't record the upload channel; the app's own upload record does.
            var records = await publications.ListByVideoIdsAsync(
                byUser.Key, [.. byUser.Select(p => p.PublishedVideoId!).Distinct(StringComparer.Ordinal)], ct).ConfigureAwait(false);
            var channelByVideo = records
                .GroupBy(r => r.VideoId, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.PublishedAt).First().ChannelId, StringComparer.Ordinal);

            foreach (var byChannel in byUser.GroupBy(p =>
                p.PublishedChannelId
                ?? (channelByVideo.TryGetValue(p.PublishedVideoId!, out var ch) ? ch : null)
                ?? p.TargetChannelId))
            {
                if (string.IsNullOrWhiteSpace(byChannel.Key)) continue;

                string token;
                try
                {
                    token = await connections.GetAccessTokenAsync(byUser.Key, byChannel.Key, ct).ConfigureAwait(false);
                }
                catch (YouTubePublishException ex)
                {
                    logger.LogInformation("Skipped removed-video check for channel {ChannelId}: {Code}", byChannel.Key, ex.Code);
                    continue;
                }

                foreach (var batch in byChannel.Chunk(YouTubeVideoStatusClient.MaxIdsPerCall))
                {
                    IReadOnlyDictionary<string, YouTubeVideoStatusSnapshot> found;
                    try
                    {
                        found = await videoClient.GetAsync(
                            [.. batch.Select(p => p.PublishedVideoId!).Distinct(StringComparer.Ordinal)], token, ct).ConfigureAwait(false);
                    }
                    catch (YouTubePublishException ex)
                    {
                        // A failed check proves nothing: never reset a card on an error.
                        logger.LogWarning("Removed-video check for channel {ChannelId} failed: {Code}", byChannel.Key, ex.Code);
                        break;
                    }

                    foreach (var post in batch)
                    {
                        post.YouTubeCheckedAtUtc = now;
                        if (!found.ContainsKey(post.PublishedVideoId!))
                        {
                            logger.LogWarning("Automation post {PostId}: YouTube video {VideoId} no longer exists; returning card to ready.",
                                post.Id, post.PublishedVideoId);
                            await MarkPublicationRemovedAsync(post.UserId, post.PublishedVideoId!, deletedByApp: false, ct).ConfigureAwait(false);
                            await TryUnlistFromPanchangAsync(post, ct).ConfigureAwait(false);
                            if (catalogWriter is not null) await catalogWriter.MarkRemovedAsync(post.PublishedVideoId, ct).ConfigureAwait(false);
                            ResetAfterYouTubeRemoval(post, byChannel.Key, post.PublishedChannelTitle ?? post.TargetChannelTitle, deletedByApp: false,
                                "This video is no longer on YouTube (deleted in YouTube Studio or removed by YouTube).");
                            post.LastError = "Video was removed from YouTube. Publish it again (to any channel) or delete this card.";
                            changed++;
                        }
                        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    }
                }
            }
        }
        return changed;
    }

    /// <summary>A video gone from YouTube should not stay on the Panchang Video Hub as a dead player. Best effort.</summary>
    private async Task TryUnlistFromPanchangAsync(AutomationPost post, CancellationToken ct)
    {
        if (post.SyncedToEcosystemAtUtc is null)
            return;
        if (!await TryRemovePostFromEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false))
            logger.LogWarning("Automation post {PostId}: could not take the removed video off Panchang Video Hub.", post.Id);
    }

    /// <summary>Returns a card whose video left YouTube to "video ready", keeping the rendered video and a history entry.</summary>
    private void ResetAfterYouTubeRemoval(AutomationPost post, string? channelId, string? channelTitle, bool deletedByApp, string note)
    {
        post.RemovedVideos.Add(new AutomationRemovedVideo
        {
            VideoId = post.PublishedVideoId ?? string.Empty,
            ChannelId = channelId,
            ChannelTitle = channelTitle,
            RemovedAtUtc = UtcNow,
            DeletedByApp = deletedByApp
        });
        if (post.RemovedVideos.Count > 10)
            post.RemovedVideos.RemoveRange(0, post.RemovedVideos.Count - 10);

        post.PublishedVideoId = null;
        post.PublishedVideoUrl = null;
        post.PublishedAtUtc = null;
        post.PublishedChannelId = null;
        post.PublishedChannelTitle = null;
        post.YouTubeCheckedAtUtc = null;
        post.QueueItemId = null;
        post.UploadId = null;
        post.SyncedToEcosystemAtUtc = null;
        post.Status = post.Format == AutomationVideoFormat.CommunityPost || HasVideo(post)
            ? AutomationPostStatus.VideoReadyForReview
            : AutomationPostStatus.PreparedPreview;
        post.LastError = null;
        post.Notes = string.IsNullOrWhiteSpace(post.Notes) ? note : $"{note}\n{post.Notes}";
        if (post.Notes.Length > 1500) post.Notes = post.Notes[..1500];
        post.UpdatedAtUtc = UtcNow;
    }

    private async Task MarkPublicationRemovedAsync(string userId, string videoId, bool deletedByApp, CancellationToken ct)
    {
        var records = await publications.ListByVideoIdsAsync(userId, [videoId], ct).ConfigureAwait(false);
        foreach (var record in records)
        {
            record.Health = YouTubeVideoHealth.Removed;
            record.IssueCode = deletedByApp ? "deleted-in-app" : "removed";
            record.IssueMessage = deletedByApp
                ? "Deleted from YouTube from the Auto Post board."
                : "This video is no longer on YouTube.";
            record.LastCheckedAt = UtcNow;
            await publications.UpsertAsync(record, ct).ConfigureAwait(false);
        }
    }
}
