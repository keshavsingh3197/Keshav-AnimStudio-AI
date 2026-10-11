using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A channel's public counters. Subscribers is null when the owner hides the count.</summary>
public sealed record YouTubeChannelStats(string ChannelId, long? Subscribers, bool SubscribersHidden, long? Views, long? Videos);

/// <summary>One video's public counters. Likes is null when the owner hides them.</summary>
public sealed record YouTubeVideoStats(long? Views, long? Likes, long? Comments);

/// <summary>
/// Reads channel and video counters with <c>channels.list</c> / <c>videos.list</c>
/// (<c>part=statistics</c>, 1 quota unit per call). Needs only the <c>youtube.readonly</c>
/// scope the connection already has.
/// </summary>
public sealed class YouTubeStatsClient : IDisposable
{
    public const int MaxIdsPerCall = 50;
    private const string ChannelUrl = "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true";
    private const string VideosUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics&maxResults=50&id=";

    private readonly ILogger<YouTubeStatsClient> _logger;
    private readonly HttpClient _http;

    public YouTubeStatsClient(ILogger<YouTubeStatsClient> logger) : this(logger, null)
    {
    }

    public YouTubeStatsClient(ILogger<YouTubeStatsClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 }
        })
        {
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    /// <summary>The counters of the channel the access token belongs to, or null if it has none.</summary>
    public async Task<YouTubeChannelStats?> GetMyChannelAsync(string accessToken, CancellationToken ct)
    {
        using var document = await GetJsonAsync(ChannelUrl, accessToken, "channels.list", ct).ConfigureAwait(false);
        return ParseChannel(document.RootElement);
    }

    /// <param name="videoIds">At most <see cref="MaxIdsPerCall"/>, each already validated as a video id.</param>
    /// <returns>Counters for the videos YouTube still has, keyed by id.</returns>
    public async Task<IReadOnlyDictionary<string, YouTubeVideoStats>> GetVideosAsync(
        IReadOnlyCollection<string> videoIds, string accessToken, CancellationToken ct)
    {
        if (videoIds.Count == 0) return new Dictionary<string, YouTubeVideoStats>();
        if (videoIds.Count > MaxIdsPerCall || videoIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            throw new ArgumentException("Up to 50 valid video ids per call.", nameof(videoIds));

        using var document = await GetJsonAsync(VideosUrl + string.Join(',', videoIds), accessToken, "videos.list", ct).ConfigureAwait(false);
        return ParseVideos(document.RootElement);
    }

    public static YouTubeChannelStats? ParseChannel(JsonElement root)
    {
        if (!root.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array || items.GetArrayLength() == 0)
            return null;

        var item = items[0];
        var id = item.TryGetProperty("id", out var idElement) && idElement.ValueKind == JsonValueKind.String ? idElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(id)) return null;

        item.TryGetProperty("statistics", out var stats);
        var hidden = stats.ValueKind == JsonValueKind.Object
            && stats.TryGetProperty("hiddenSubscriberCount", out var h) && h.ValueKind == JsonValueKind.True;

        return new YouTubeChannelStats(
            id,
            hidden ? null : Count(stats, "subscriberCount"),
            hidden,
            Count(stats, "viewCount"),
            Count(stats, "videoCount"));
    }

    public static IReadOnlyDictionary<string, YouTubeVideoStats> ParseVideos(JsonElement root)
    {
        var result = new Dictionary<string, YouTubeVideoStats>(StringComparer.Ordinal);
        if (!root.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array) return result;

        foreach (var item in items.EnumerateArray())
        {
            var id = item.TryGetProperty("id", out var idElement) && idElement.ValueKind == JsonValueKind.String ? idElement.GetString() : null;
            if (!YouTubeRelatedVideos.IsVideoId(id)) continue;

            item.TryGetProperty("statistics", out var stats);
            result[id!] = new YouTubeVideoStats(Count(stats, "viewCount"), Count(stats, "likeCount"), Count(stats, "commentCount"));
        }
        return result;
    }

    /// <summary>YouTube sends counters as digit strings; anything else is treated as unknown.</summary>
    private static long? Count(JsonElement element, string name)
    {
        if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(name, out var value)) return null;
        return value.ValueKind switch
        {
            JsonValueKind.String when long.TryParse(value.GetString(), System.Globalization.NumberStyles.None,
                System.Globalization.CultureInfo.InvariantCulture, out var parsed) => parsed,
            JsonValueKind.Number when value.TryGetInt64(out var number) && number >= 0 => number,
            _ => null
        };
    }

    private async Task<JsonDocument> GetJsonAsync(string url, string accessToken, string call, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached to read the numbers. Try again later.");
        }

        using (response)
        {
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube {Call} answered {Status} ({Reason})", call, (int)response.StatusCode, reason ?? "unknown");
                throw reason is "quotaExceeded" or "dailyLimitExceeded" or "rateLimitExceeded"
                    ? new YouTubePublishException("youtube-quota", "This server has used its YouTube API quota for today. Numbers update again tomorrow.")
                    : new YouTubePublishException("youtube-reconnect", "YouTube refused to share this channel's numbers. Connect the channel again.");
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("YouTube {Call} answered {Status}", call, (int)response.StatusCode);
                throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't share the numbers just now. Try again later.");
            }

            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            try
            {
                return await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            }
            catch (JsonException)
            {
                _logger.LogWarning("YouTube {Call} answered with a body that isn't JSON", call);
                throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't share the numbers just now. Try again later.");
            }
        }
    }

    public void Dispose() => _http.Dispose();
}
