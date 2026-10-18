using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>What <c>videos.list</c> returned for one video. Raw values stay inside the server.</summary>
public sealed record YouTubeVideoStatusSnapshot(
    string VideoId,
    string? UploadStatus,
    string? FailureReason,
    string? RejectionReason,
    string? PrivacyStatus,
    string? ProcessingStatus,
    string? ThumbnailUrl);

/// <summary>
/// Reads the status of videos the channel owns with <c>videos.list</c> (1 quota unit per call
/// of up to 50 ids). Needs only the <c>youtube.readonly</c> scope the connection already has.
/// A video missing from the answer was deleted or removed.
/// </summary>
public sealed class YouTubeVideoStatusClient : IDisposable
{
    public const int MaxIdsPerCall = 50;
    private const string ListUrl = "https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails,snippet&maxResults=50&id=";

    private readonly ILogger<YouTubeVideoStatusClient> _logger;
    private readonly HttpClient _http;

    public YouTubeVideoStatusClient(ILogger<YouTubeVideoStatusClient> logger) : this(logger, null)
    {
    }

    public YouTubeVideoStatusClient(ILogger<YouTubeVideoStatusClient> logger, HttpMessageHandler? handler)
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

    /// <param name="videoIds">At most <see cref="MaxIdsPerCall"/>, each already validated as a video id.</param>
    /// <returns>The videos YouTube still has, keyed by id.</returns>
    public async Task<IReadOnlyDictionary<string, YouTubeVideoStatusSnapshot>> GetAsync(
        IReadOnlyCollection<string> videoIds, string accessToken, CancellationToken ct)
    {
        if (videoIds.Count == 0) return new Dictionary<string, YouTubeVideoStatusSnapshot>();
        if (videoIds.Count > MaxIdsPerCall || videoIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            throw new ArgumentException("Up to 50 valid video ids per call.", nameof(videoIds));

        using var request = new HttpRequestMessage(HttpMethod.Get, ListUrl + string.Join(',', videoIds));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached to check the videos. Try again later.");
        }

        using (response)
        {
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube videos.list answered {Status} ({Reason})", (int)response.StatusCode, reason ?? "unknown");
                throw reason is "quotaExceeded" or "dailyLimitExceeded" or "rateLimitExceeded"
                    ? new YouTubePublishException("youtube-quota", "This server has used its YouTube API quota for today. Video checks resume tomorrow.")
                    : new YouTubePublishException("youtube-reconnect", "YouTube refused the check for this channel. Connect the channel again.");
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("YouTube videos.list answered {Status}", (int)response.StatusCode);
                throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't check the videos just now. Try again later.");
            }

            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            return Parse(document.RootElement);
        }
    }

    internal static IReadOnlyDictionary<string, YouTubeVideoStatusSnapshot> Parse(JsonElement root)
    {
        var result = new Dictionary<string, YouTubeVideoStatusSnapshot>(StringComparer.Ordinal);
        if (!root.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array) return result;

        foreach (var item in items.EnumerateArray())
        {
            var id = Str(item, "id");
            if (!YouTubeRelatedVideos.IsVideoId(id)) continue;

            item.TryGetProperty("status", out var status);
            item.TryGetProperty("processingDetails", out var processing);

            result[id!] = new YouTubeVideoStatusSnapshot(
                id!,
                Token(status, "uploadStatus"),
                Token(status, "failureReason"),
                Token(status, "rejectionReason"),
                Token(status, "privacyStatus"),
                Token(processing, "processingStatus"),
                Thumbnail(item));
        }
        return result;
    }

    /// <summary>Only YouTube's own image host, over https - the URL ends up in an img tag.</summary>
    private static string? Thumbnail(JsonElement item)
    {
        if (!item.TryGetProperty("snippet", out var snippet) || !snippet.TryGetProperty("thumbnails", out var thumbs)) return null;
        foreach (var size in new[] { "medium", "default", "high" })
        {
            if (!thumbs.TryGetProperty(size, out var thumb)) continue;
            if (Uri.TryCreate(Str(thumb, "url"), UriKind.Absolute, out var url)
                && url.Scheme == Uri.UriSchemeHttps
                && url.Host.Equals("i.ytimg.com", StringComparison.OrdinalIgnoreCase))
                return url.ToString();
        }
        return null;
    }

    private static string? Str(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    /// <summary>A plain identifier like "processed" or "termsOfUse"; anything else is dropped.</summary>
    private static string? Token(JsonElement element, string name)
    {
        var value = Str(element, name);
        return value is { Length: > 0 and <= 40 } && value.All(char.IsAsciiLetterOrDigit) ? value : null;
    }

    public void Dispose() => _http.Dispose();
}
