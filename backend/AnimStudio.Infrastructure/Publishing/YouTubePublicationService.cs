using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A published video as the client sees it: links built here, never taken from input.</summary>
public sealed record YouTubePublicationStatus(
    string Id,
    string ProjectId,
    string JobId,
    string ChannelId,
    string ChannelTitle,
    string VideoId,
    string Title,
    string Privacy,
    string VideoUrl,
    string StudioUrl,
    IReadOnlyList<string> RelatedVideoIds,
    DateTime PublishedAt,
    string Health,
    string? PrivacyStatus,
    string? IssueCode,
    string? IssueMessage,
    string? ThumbnailUrl,
    DateTime? LastCheckedAt);

/// <summary>
/// The durable record of videos uploaded from the app: written automatically when an upload
/// finishes, read by the render page and the related-videos picker, and refreshed against
/// YouTube so a rejected, failed or deleted video shows up as an issue in the app.
/// </summary>
public sealed class YouTubePublicationService(
    IYouTubePublicationRepository repository,
    YouTubeConnectionStore connections,
    YouTubeVideoStatusClient statusClient,
    TimeProvider clock,
    ILogger<YouTubePublicationService> logger)
{
    public const int MaxList = 500;

    public async Task<YouTubePublication> RecordAsync(
        string userId, string projectId, string jobId, string channelId, string channelTitle,
        string videoId, string title, string privacy, IReadOnlyList<string> relatedVideoIds, CancellationToken ct)
    {
        var publication = new YouTubePublication
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            ProjectId = projectId,
            JobId = jobId,
            ChannelId = channelId,
            ChannelTitle = channelTitle,
            VideoId = videoId,
            Title = title,
            Privacy = privacy,
            RelatedVideoIds = [.. relatedVideoIds],
            PublishedAt = clock.GetUtcNow().UtcDateTime,
            // Freshly uploaded: YouTube is processing it until the first check says otherwise.
            Health = YouTubeVideoHealth.Processing
        };
        await repository.UpsertAsync(publication, ct).ConfigureAwait(false);
        return publication;
    }

    public async Task<IReadOnlyList<YouTubePublicationStatus>> ListAsync(string userId, string? projectId, CancellationToken ct) =>
        [.. (await repository.ListByUserAsync(userId, projectId, MaxList, ct).ConfigureAwait(false)).Select(Describe)];

    /// <summary>The owner's videos for these ids, in the order asked; unknown ids are left out.</summary>
    public async Task<IReadOnlyList<RelatedYouTubeVideo>> ResolveRelatedAsync(
        string userId, IReadOnlyList<string> videoIds, CancellationToken ct)
    {
        var found = await repository.ListByVideoIdsAsync(userId, videoIds, ct).ConfigureAwait(false);
        var byId = found.GroupBy(p => p.VideoId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(p => p.PublishedAt).First(), StringComparer.Ordinal);
        return [.. videoIds.Where(byId.ContainsKey).Select(id => new RelatedYouTubeVideo(id, byId[id].Title))];
    }

    /// <summary>Removes the app's record only; the video on YouTube is untouched.</summary>
    public async Task<bool> ForgetAsync(string userId, string id, CancellationToken ct)
    {
        var existing = await repository.GetAsync(id, ct).ConfigureAwait(false);
        if (existing is null || !string.Equals(existing.UserId, userId, StringComparison.Ordinal)) return false;
        return await repository.DeleteAsync(id, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Checks the owner's videos (optionally one project's) that weren't checked within
    /// <paramref name="minAge"/>, then returns the whole list as it now stands.
    /// </summary>
    public async Task<IReadOnlyList<YouTubePublicationStatus>> RefreshAsync(
        string userId, string? projectId, TimeSpan minAge, CancellationToken ct)
    {
        var all = await repository.ListByUserAsync(userId, projectId, MaxList, ct).ConfigureAwait(false);
        var cutoff = clock.GetUtcNow().UtcDateTime - minAge;
        var due = all.Where(p => p.Health != YouTubeVideoHealth.Removed && (p.LastCheckedAt is null || p.LastCheckedAt < cutoff)).ToList();

        await CheckAsync(due, ct).ConfigureAwait(false);
        return [.. all.Select(Describe)];
    }

    /// <summary>Checks these records against YouTube, one call per channel per 50 videos, and saves the results.</summary>
    public async Task CheckAsync(IReadOnlyList<YouTubePublication> publications, CancellationToken ct)
    {
        foreach (var group in publications.GroupBy(p => (p.UserId, p.ChannelId)))
        {
            ct.ThrowIfCancellationRequested();
            var now = clock.GetUtcNow().UtcDateTime;

            string token;
            try
            {
                token = await connections.GetAccessTokenAsync(group.Key.UserId, group.Key.ChannelId, ct).ConfigureAwait(false);
            }
            catch (YouTubePublishException ex)
            {
                // Not the video's fault: say why it couldn't be checked, keep the last known health.
                logger.LogInformation("Skipped YouTube health check for channel {ChannelId}: {Code}", group.Key.ChannelId, ex.Code);
                foreach (var p in group)
                {
                    p.LastCheckedAt = now;
                    if (p.Health is YouTubeVideoHealth.Ok or YouTubeVideoHealth.Processing or YouTubeVideoHealth.Unknown)
                    {
                        p.IssueCode = "check-unavailable";
                        p.IssueMessage = $"Couldn't check this video: reconnect the channel {p.ChannelTitle}.";
                    }
                    await repository.UpsertAsync(p, ct).ConfigureAwait(false);
                }
                continue;
            }

            foreach (var batch in group.Chunk(YouTubeVideoStatusClient.MaxIdsPerCall))
            {
                var ids = batch.Select(p => p.VideoId).Where(YouTubeRelatedVideos.IsVideoId).Distinct(StringComparer.Ordinal).ToList();
                IReadOnlyDictionary<string, YouTubeVideoStatusSnapshot> found;
                try
                {
                    found = await statusClient.GetAsync(ids, token, ct).ConfigureAwait(false);
                }
                catch (YouTubePublishException ex)
                {
                    logger.LogWarning("YouTube health check for channel {ChannelId} failed: {Code}", group.Key.ChannelId, ex.Code);
                    // Leave LastCheckedAt alone so the next sweep tries again.
                    break;
                }

                foreach (var p in batch)
                {
                    found.TryGetValue(p.VideoId, out var snap);
                    var verdict = YouTubeVideoHealthEvaluator.Evaluate(
                        snap is not null, snap?.UploadStatus, snap?.FailureReason, snap?.RejectionReason, snap?.ProcessingStatus);

                    if (verdict.Health is YouTubeVideoHealth.Issue or YouTubeVideoHealth.Removed && p.Health != verdict.Health)
                        logger.LogWarning("YouTube video {VideoId} of render {JobId} now needs attention: {Code}", p.VideoId, p.JobId, verdict.IssueCode);

                    p.Health = verdict.Health;
                    p.IssueCode = verdict.IssueCode;
                    p.IssueMessage = verdict.IssueMessage;
                    p.UploadStatus = snap?.UploadStatus;
                    p.PrivacyStatus = snap?.PrivacyStatus ?? p.PrivacyStatus;
                    p.ThumbnailUrl = snap?.ThumbnailUrl ?? p.ThumbnailUrl;
                    p.LastCheckedAt = now;
                    await repository.UpsertAsync(p, ct).ConfigureAwait(false);
                }
            }
        }
    }

    public static YouTubePublicationStatus Describe(YouTubePublication p) => new(
        p.Id, p.ProjectId, p.JobId, p.ChannelId, p.ChannelTitle, p.VideoId, p.Title, p.Privacy,
        YouTubeRelatedVideos.WatchUrl(p.VideoId),
        $"https://studio.youtube.com/video/{p.VideoId}/edit",
        p.RelatedVideoIds,
        DateTime.SpecifyKind(p.PublishedAt, DateTimeKind.Utc),
        p.Health.ToString(),
        p.PrivacyStatus,
        p.IssueCode,
        p.IssueMessage,
        p.ThumbnailUrl,
        p.LastCheckedAt is { } checkedAt ? DateTime.SpecifyKind(checkedAt, DateTimeKind.Utc) : null);
}
