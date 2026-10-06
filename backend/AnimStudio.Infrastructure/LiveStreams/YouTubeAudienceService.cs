using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.LiveStreams;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.LiveStreams;

public sealed class YouTubeAudienceException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>
/// Reads public audience numbers - a channel's subscribers and a live broadcast's
/// concurrent viewers - from the YouTube Data API for the camera page's overlays.
/// <para>
/// The host is fixed, so callers only ever choose <i>which</i> public channel or video is
/// looked up, by ids that are checked against YouTube's own id shapes. The API key travels
/// in the <c>X-Goog-Api-Key</c> header rather than the query string, so it never appears in
/// a URL that a log line or proxy could keep. Answers are cached because every lookup
/// costs quota and YouTube only refreshes these numbers every few seconds anyway.
/// </para>
/// </summary>
public sealed class YouTubeAudienceService : IDisposable
{
    private const string BaseUrl = "https://www.googleapis.com/youtube/v3/";
    private const int MaxCacheEntries = 500;

    private readonly IOptionsMonitor<YouTubeDataOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<YouTubeAudienceService> _logger;
    private readonly HttpClient _http;
    private readonly ConcurrentDictionary<string, (DateTime At, object? Value)> _cache = new(StringComparer.Ordinal);

    public YouTubeAudienceService(IOptionsMonitor<YouTubeDataOptions> options, TimeProvider clock, ILogger<YouTubeAudienceService> logger)
        : this(options, clock, logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and a bounded connection lifetime.</summary>
    public YouTubeAudienceService(
        IOptionsMonitor<YouTubeDataOptions> options, TimeProvider clock, ILogger<YouTubeAudienceService> logger, HttpMessageHandler? handler)
    {
        _options = options;
        _clock = clock;
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            AutomaticDecompression = DecompressionMethods.All,
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            BaseAddress = new Uri(BaseUrl),
            Timeout = TimeSpan.FromSeconds(10)
        };
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.CurrentValue.ApiKey);

    /// <param name="channel">A UC… channel id or an @handle, already validated.</param>
    /// <param name="videoId">A live broadcast's video id, already validated. Optional.</param>
    public async Task<YouTubeAudienceStats> GetAsync(string? channel, string? videoId, CancellationToken ct)
    {
        if (!IsConfigured)
            throw new YouTubeAudienceException("youtube-not-configured", "Live subscriber counts aren't set up on this server.");

        var channelStats = channel is null ? null
            : await CachedAsync($"c|{channel}", () => FetchChannelAsync(channel, ct)).ConfigureAwait(false);
        var liveStats = videoId is null ? null
            : await CachedAsync($"v|{videoId}", () => FetchLiveAsync(videoId, ct)).ConfigureAwait(false);

        return new YouTubeAudienceStats(channelStats, liveStats, _clock.GetUtcNow().UtcDateTime);
    }

    private async Task<T?> CachedAsync<T>(string key, Func<Task<T?>> fetch) where T : class
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        var ttl = TimeSpan.FromSeconds(Math.Clamp(_options.CurrentValue.CacheSeconds, 5, 600));
        if (_cache.TryGetValue(key, out var hit) && now - hit.At < ttl) return hit.Value as T;

        var value = await fetch().ConfigureAwait(false);
        if (_cache.Count >= MaxCacheEntries) _cache.Clear();
        _cache[key] = (now, value);
        return value;
    }

    private async Task<YouTubeChannelStats?> FetchChannelAsync(string channel, CancellationToken ct)
    {
        var query = CameraStreamValidator.IsHandle(channel)
            ? $"forHandle={Uri.EscapeDataString(channel)}"
            : $"id={Uri.EscapeDataString(channel)}";

        using var document = await SendAsync($"channels?part=snippet,statistics&{query}", ct).ConfigureAwait(false);
        return ParseChannel(document.RootElement);
    }

    private async Task<YouTubeLiveStats?> FetchLiveAsync(string videoId, CancellationToken ct)
    {
        using var document = await SendAsync(
            $"videos?part=snippet,statistics,liveStreamingDetails&id={Uri.EscapeDataString(videoId)}", ct).ConfigureAwait(false);
        return ParseLive(document.RootElement);
    }

    private async Task<JsonDocument> SendAsync(string relativeUrl, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, relativeUrl);
        request.Headers.Add("X-Goog-Api-Key", _options.CurrentValue.ApiKey!.Trim());

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("YouTube Data API could not be reached: {ErrorType}", ex.GetType().Name);
            throw new YouTubeAudienceException("youtube-unreachable", "YouTube couldn't be reached for live numbers.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                // Only the status and Google's reason code are logged - never the request, which carries the key in a header.
                var reason = await ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube Data API answered {Status} ({Reason})", (int)response.StatusCode, reason ?? "unknown");
                throw reason is "quotaExceeded" or "rateLimitExceeded" or "dailyLimitExceeded"
                    ? new YouTubeAudienceException("youtube-quota", "This server has used its YouTube quota for today. Live numbers pause until it resets.")
                    : new YouTubeAudienceException("youtube-failed", "YouTube didn't return live numbers. Ask an admin to check the YouTube API key.");
            }

            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            return await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
        }
    }

    private static async Task<string?> ReadReasonAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            if (document.RootElement.TryGetProperty("error", out var error)
                && error.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array
                && errors.GetArrayLength() > 0 && errors[0].TryGetProperty("reason", out var reason))
            {
                var text = reason.GetString();
                // Echoed into a log line, so only a plain identifier survives.
                return text is { Length: <= 64 } && text.All(char.IsAsciiLetterOrDigit) ? text : null;
            }
        }
        catch (JsonException)
        {
            // Not JSON; the status says enough.
        }
        return null;
    }

    public static YouTubeChannelStats? ParseChannel(JsonElement root)
    {
        if (!TryFirstItem(root, out var item)) return null;

        var id = item.TryGetProperty("id", out var idElement) ? idElement.GetString() ?? string.Empty : string.Empty;
        var title = item.TryGetProperty("snippet", out var snippet) && snippet.TryGetProperty("title", out var t) ? t.GetString() ?? string.Empty : string.Empty;
        item.TryGetProperty("statistics", out var stats);

        var hidden = stats.ValueKind == JsonValueKind.Object
            && stats.TryGetProperty("hiddenSubscriberCount", out var h) && h.ValueKind == JsonValueKind.True;

        return new YouTubeChannelStats(
            id, title,
            hidden ? null : Count(stats, "subscriberCount"),
            hidden,
            Count(stats, "viewCount"),
            Count(stats, "videoCount"));
    }

    public static YouTubeLiveStats? ParseLive(JsonElement root)
    {
        if (!TryFirstItem(root, out var item)) return null;

        var id = item.TryGetProperty("id", out var idElement) ? idElement.GetString() ?? string.Empty : string.Empty;
        item.TryGetProperty("snippet", out var snippet);
        var title = snippet.ValueKind == JsonValueKind.Object && snippet.TryGetProperty("title", out var t) ? t.GetString() ?? string.Empty : string.Empty;
        var isLive = snippet.ValueKind == JsonValueKind.Object
            && snippet.TryGetProperty("liveBroadcastContent", out var content) && content.GetString() == "live";

        item.TryGetProperty("statistics", out var stats);
        item.TryGetProperty("liveStreamingDetails", out var live);

        return new YouTubeLiveStats(id, title, isLive, Count(live, "concurrentViewers"), Count(stats, "likeCount"), Count(stats, "viewCount"));
    }

    private static bool TryFirstItem(JsonElement root, out JsonElement item)
    {
        item = default;
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("items", out var items)
            || items.ValueKind != JsonValueKind.Array || items.GetArrayLength() == 0) return false;
        item = items[0];
        return item.ValueKind == JsonValueKind.Object;
    }

    /// <summary>The API sends counts as strings ("12345"); anything else reads as unknown.</summary>
    private static long? Count(JsonElement parent, string name)
    {
        if (parent.ValueKind != JsonValueKind.Object || !parent.TryGetProperty(name, out var value)) return null;
        return value.ValueKind switch
        {
            JsonValueKind.String when long.TryParse(value.GetString(), NumberStyles.None, CultureInfo.InvariantCulture, out var n) => n,
            JsonValueKind.Number when value.TryGetInt64(out var n) => n,
            _ => null
        };
    }

    public void Dispose() => _http.Dispose();
}
