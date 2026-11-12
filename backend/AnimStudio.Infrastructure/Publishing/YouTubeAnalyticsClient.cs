using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Reads the YouTube Analytics API (<c>youtubeanalytics.googleapis.com/v2/reports</c>) for the channel the access token
/// belongs to: lifetime totals per video, and views and subscribers day by day. It needs the
/// <see cref="YouTubeOAuthClient.AnalyticsScope"/> permission and the YouTube Analytics API switched on in the server's
/// Google project. Its quota is separate from the Data API's.
/// </summary>
/// <remarks>
/// Thumbnail impressions and their click-through rate are not in this API - YouTube shows them only in Studio - so nothing
/// here claims to know them.
/// </remarks>
public sealed class YouTubeAnalyticsClient : IDisposable
{
    /// <summary>The most video ids put in one <c>filters=video==</c> list.</summary>
    public const int MaxIdsPerCall = 100;

    private const string ReportsUrl = "https://youtubeanalytics.googleapis.com/v2/reports";
    private const string VideoMetrics = "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,shares";
    private const string DailyMetrics = "views,estimatedMinutesWatched,subscribersGained,subscribersLost";

    /// <summary>The first day YouTube Analytics has data for.</summary>
    private static readonly DateOnly Earliest = new(2005, 2, 14);

    private readonly ILogger<YouTubeAnalyticsClient> _logger;
    private readonly HttpClient _http;

    public YouTubeAnalyticsClient(ILogger<YouTubeAnalyticsClient> logger) : this(logger, null)
    {
    }

    public YouTubeAnalyticsClient(ILogger<YouTubeAnalyticsClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 }
        })
        {
            Timeout = TimeSpan.FromSeconds(25)
        };
    }

    /// <summary>Lifetime totals for each of the videos, keyed by id. Videos with no views yet are left out by YouTube.</summary>
    /// <param name="videoIds">At most <see cref="MaxIdsPerCall"/>, each already validated as a video id.</param>
    public async Task<IReadOnlyDictionary<string, YouTubeVideoAnalytics>> GetVideoTotalsAsync(
        IReadOnlyCollection<string> videoIds, DateOnly from, DateOnly to, string accessToken, CancellationToken ct)
    {
        if (videoIds.Count == 0) return new Dictionary<string, YouTubeVideoAnalytics>();
        if (videoIds.Count > MaxIdsPerCall || videoIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            throw new ArgumentException("Up to 100 valid video ids per call.", nameof(videoIds));

        var url = Url(from, to, VideoMetrics, "video", $"video=={string.Join(',', videoIds)}") + $"&sort=-views&maxResults={MaxIdsPerCall}";
        using var document = await GetJsonAsync(url, accessToken, "reports.video", ct).ConfigureAwait(false);
        return ParseVideoTotals(document.RootElement);
    }

    /// <summary>The channel's numbers day by day, oldest first; for one video when <paramref name="videoId"/> is given.</summary>
    public async Task<IReadOnlyList<YouTubeDailyPoint>> GetDailyAsync(
        string? videoId, DateOnly from, DateOnly to, string accessToken, CancellationToken ct)
    {
        if (videoId is not null && !YouTubeRelatedVideos.IsVideoId(videoId))
            throw new ArgumentException("Not a video id.", nameof(videoId));

        var url = Url(from, to, DailyMetrics, "day", videoId is null ? null : $"video=={videoId}") + "&sort=day";
        using var document = await GetJsonAsync(url, accessToken, videoId is null ? "reports.channelDaily" : "reports.videoDaily", ct).ConfigureAwait(false);
        return ParseDaily(document.RootElement);
    }

    private static string Url(DateOnly from, DateOnly to, string metrics, string dimensions, string? filters)
    {
        if (from < Earliest) from = Earliest;
        if (to < from) to = from;
        var url = $"{ReportsUrl}?ids=channel%3D%3DMINE&startDate={from:yyyy-MM-dd}&endDate={to:yyyy-MM-dd}&metrics={metrics}&dimensions={dimensions}";
        return filters is null ? url : url + "&filters=" + Uri.EscapeDataString(filters);
    }

    public static IReadOnlyDictionary<string, YouTubeVideoAnalytics> ParseVideoTotals(JsonElement root)
    {
        var result = new Dictionary<string, YouTubeVideoAnalytics>(StringComparer.Ordinal);
        foreach (var row in Rows(root))
        {
            if (row.Text("video") is not { } id || !YouTubeRelatedVideos.IsVideoId(id)) continue;
            result[id] = new YouTubeVideoAnalytics
            {
                WatchMinutes = row.Number("estimatedMinutesWatched"),
                AverageViewSeconds = row.Number("averageViewDuration"),
                AverageViewPercent = Math.Round(row.Number("averageViewPercentage"), 1),
                SubscribersGained = (long)row.Number("subscribersGained"),
                SubscribersLost = (long)row.Number("subscribersLost"),
                Shares = (long)row.Number("shares")
            };
        }
        return result;
    }

    public static IReadOnlyList<YouTubeDailyPoint> ParseDaily(JsonElement root)
    {
        var result = new List<YouTubeDailyPoint>();
        foreach (var row in Rows(root))
        {
            if (!DateTime.TryParseExact(row.Text("day"), "yyyy-MM-dd", CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var day)) continue;
            result.Add(new YouTubeDailyPoint
            {
                Day = DateTime.SpecifyKind(day, DateTimeKind.Utc),
                Views = (long)row.Number("views"),
                WatchMinutes = row.Number("estimatedMinutesWatched"),
                SubscribersGained = (long)row.Number("subscribersGained"),
                SubscribersLost = (long)row.Number("subscribersLost")
            });
        }
        return [.. result.OrderBy(p => p.Day)];
    }

    /// <summary>A report row read by column name, since YouTube answers with positional rows and a header list.</summary>
    private readonly record struct Row(JsonElement Values, IReadOnlyDictionary<string, int> Columns)
    {
        public string? Text(string name) =>
            Columns.TryGetValue(name, out var i) && i < Values.GetArrayLength() && Values[i].ValueKind == JsonValueKind.String ? Values[i].GetString() : null;

        public double Number(string name) =>
            Columns.TryGetValue(name, out var i) && i < Values.GetArrayLength() && Values[i].ValueKind == JsonValueKind.Number
                && Values[i].TryGetDouble(out var value) && double.IsFinite(value) && value >= 0 ? value : 0;
    }

    private static IEnumerable<Row> Rows(JsonElement root)
    {
        if (!root.TryGetProperty("columnHeaders", out var headers) || headers.ValueKind != JsonValueKind.Array) yield break;
        if (!root.TryGetProperty("rows", out var rows) || rows.ValueKind != JsonValueKind.Array) yield break;

        var columns = new Dictionary<string, int>(StringComparer.Ordinal);
        var index = 0;
        foreach (var header in headers.EnumerateArray())
        {
            if (header.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String && name.GetString() is { } n)
                columns[n] = index;
            index++;
        }

        foreach (var row in rows.EnumerateArray())
            if (row.ValueKind == JsonValueKind.Array) yield return new Row(row, columns);
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
            throw new YouTubePublishException("analytics-unreachable", "YouTube Analytics couldn't be reached. Try again later.");
        }

        using (response)
        {
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube Analytics {Call} answered {Status} ({Reason})", call, (int)response.StatusCode, reason ?? "unknown");
                throw reason switch
                {
                    "quotaExceeded" or "dailyLimitExceeded" or "rateLimitExceeded" =>
                        new YouTubePublishException("analytics-quota", "This server has used its YouTube Analytics quota for now. Try again later."),
                    "accessNotConfigured" or "SERVICE_DISABLED" =>
                        new YouTubePublishException("analytics-not-enabled", "The YouTube Analytics API isn't switched on for this server's Google project. An administrator can enable it in the Google Cloud console."),
                    _ => new YouTubePublishException("analytics-permission", "YouTube didn't allow reading this channel's Analytics. Connect the channel again and allow \"View YouTube Analytics reports\".")
                };
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("YouTube Analytics {Call} answered {Status}", call, (int)response.StatusCode);
                throw new YouTubePublishException("analytics-unreachable", "YouTube Analytics couldn't share the numbers just now. Try again later.");
            }

            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            try
            {
                return await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            }
            catch (JsonException)
            {
                _logger.LogWarning("YouTube Analytics {Call} answered with a body that isn't JSON", call);
                throw new YouTubePublishException("analytics-unreachable", "YouTube Analytics couldn't share the numbers just now. Try again later.");
            }
        }
    }

    public void Dispose() => _http.Dispose();
}
