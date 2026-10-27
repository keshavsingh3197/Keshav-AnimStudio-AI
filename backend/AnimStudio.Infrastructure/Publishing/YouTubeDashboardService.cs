using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A connected channel with its live counters. Counters are null when they couldn't be read.</summary>
public sealed record YouTubeChannelOverview(
    string ChannelId,
    string ChannelTitle,
    string? ChannelHandle,
    string? ThumbnailUrl,
    string ChannelUrl,
    string StudioUrl,
    DateTime ConnectedAt,
    DateTime? LastUploadAt,
    bool NeedsReconnect,
    long? Subscribers,
    bool SubscribersHidden,
    long? TotalViews,
    long? TotalVideos,
    int AppUploads,
    string? StatsError);

/// <summary>Everything the YouTube page shows, in one call.</summary>
public sealed record YouTubeDashboard(
    bool Configured,
    IReadOnlyList<YouTubeChannelOverview> Channels,
    IReadOnlyList<YouTubePublicationStatus> Videos,
    /// <summary>Views, likes and comments by YouTube video id; videos YouTube no longer has are absent.</summary>
    IReadOnlyDictionary<string, YouTubeVideoStats> VideoStats,
    DateTime? StatsFetchedAt);

/// <summary>
/// The counters last read from YouTube, per user. Reopening the page within a few minutes
/// costs no quota; only the owner's own entry is ever read back.
/// </summary>
public sealed class YouTubeDashboardCache(TimeProvider clock)
{
    private const int MaxUsers = 1000;
    private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.Ordinal);

    public sealed record Entry(
        DateTime FetchedAt,
        IReadOnlyDictionary<string, (YouTubeChannelStats? Stats, string? Error)> Channels,
        IReadOnlyDictionary<string, YouTubeVideoStats> Videos);

    public Entry? Get(string userId, TimeSpan maxAge) =>
        _entries.TryGetValue(userId, out var entry) && clock.GetUtcNow().UtcDateTime - entry.FetchedAt < maxAge ? entry : null;

    public void Set(string userId, Entry entry)
    {
        if (_entries.Count >= MaxUsers)
        {
            var stale = clock.GetUtcNow().UtcDateTime - TimeSpan.FromHours(1);
            foreach (var (key, value) in _entries)
                if (value.FetchedAt < stale) _entries.TryRemove(key, out _);
            if (_entries.Count >= MaxUsers) return;
        }
        _entries[userId] = entry;
    }
}

/// <summary>
/// The YouTube page: connected channels with subscriber/view counts, and every video uploaded
/// from the app with its views, likes and comments. Counters are read live from YouTube
/// (one call per channel plus one per 50 videos) and cached briefly per user.
/// </summary>
public sealed class YouTubeDashboardService(
    IYouTubePublicationRepository publications,
    YouTubeConnectionStore connections,
    YouTubeOAuthClient oauth,
    YouTubeStatsClient stats,
    YouTubeDashboardCache cache,
    TimeProvider clock,
    ILogger<YouTubeDashboardService> logger)
{
    private static readonly TimeSpan CacheAge = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ForcedCacheAge = TimeSpan.FromSeconds(60);

    public async Task<YouTubeDashboard> GetAsync(string userId, bool force, CancellationToken ct)
    {
        var channels = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var videos = await publications.ListByUserAsync(userId, null, YouTubePublicationService.MaxList, ct).ConfigureAwait(false);

        var entry = oauth.IsConfigured && channels.Count > 0
            ? cache.Get(userId, force ? ForcedCacheAge : CacheAge) ?? await FetchAsync(userId, channels, videos, ct).ConfigureAwait(false)
            : null;

        var uploadsByChannel = videos.GroupBy(v => v.ChannelId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.Ordinal);

        var overview = channels.Select(c =>
        {
            (YouTubeChannelStats? Stats, string? Error) live = default;
            entry?.Channels.TryGetValue(c.ChannelId, out live);
            return new YouTubeChannelOverview(
                c.ChannelId, c.ChannelTitle, c.ChannelHandle, c.ThumbnailUrl,
                $"https://www.youtube.com/channel/{c.ChannelId}",
                $"https://studio.youtube.com/channel/{c.ChannelId}",
                c.ConnectedAt, c.LastUploadAt, c.NeedsReconnect,
                live.Stats?.Subscribers, live.Stats?.SubscribersHidden ?? false, live.Stats?.Views, live.Stats?.Videos,
                uploadsByChannel.GetValueOrDefault(c.ChannelId),
                live.Error);
        }).ToList();

        return new YouTubeDashboard(
            oauth.IsConfigured,
            overview,
            [.. videos.Select(YouTubePublicationService.Describe)],
            entry?.Videos ?? new Dictionary<string, YouTubeVideoStats>(),
            entry?.FetchedAt is { } at ? DateTime.SpecifyKind(at, DateTimeKind.Utc) : null);
    }

    private async Task<YouTubeDashboardCache.Entry> FetchAsync(
        string userId,
        IReadOnlyList<YouTubeConnectionStatus> channels,
        IReadOnlyList<YouTubePublication> videos,
        CancellationToken ct)
    {
        var channelResults = new Dictionary<string, (YouTubeChannelStats?, string?)>(StringComparer.Ordinal);
        var videoResults = new Dictionary<string, YouTubeVideoStats>(StringComparer.Ordinal);

        foreach (var channel in channels)
        {
            ct.ThrowIfCancellationRequested();
            if (channel.NeedsReconnect)
            {
                channelResults[channel.ChannelId] = (channelResults.GetValueOrDefault(channel.ChannelId).Item1,
                    "YouTube access for this channel has expired or was removed. Connect the channel again.");
                continue;
            }
            try
            {
                var token = await connections.GetAccessTokenAsync(userId, channel.ChannelId, ct).ConfigureAwait(false);
                channelResults[channel.ChannelId] = (await stats.GetMyChannelAsync(token, ct).ConfigureAwait(false), null);

                var ids = videos
                    .Where(v => string.Equals(v.ChannelId, channel.ChannelId, StringComparison.Ordinal)
                        && v.Health != YouTubeVideoHealth.Removed
                        && YouTubeRelatedVideos.IsVideoId(v.VideoId))
                    .Select(v => v.VideoId)
                    .Distinct(StringComparer.Ordinal);

                foreach (var batch in ids.Chunk(YouTubeStatsClient.MaxIdsPerCall))
                {
                    foreach (var (id, s) in await stats.GetVideosAsync(batch, token, ct).ConfigureAwait(false))
                        videoResults[id] = s;
                }
            }
            catch (YouTubePublishException ex)
            {
                // The message is one of our own user-safe sentences, never Google's raw answer.
                logger.LogInformation("Couldn't read YouTube numbers for channel {ChannelId}: {Code}", channel.ChannelId, ex.Code);
                channelResults[channel.ChannelId] = (channelResults.GetValueOrDefault(channel.ChannelId).Item1, ex.Message);
            }
        }

        var entry = new YouTubeDashboardCache.Entry(clock.GetUtcNow().UtcDateTime, channelResults, videoResults);
        cache.Set(userId, entry);
        return entry;
    }
}
