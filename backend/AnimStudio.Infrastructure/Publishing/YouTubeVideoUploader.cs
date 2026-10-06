using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

public sealed record UploadedYouTubeVideo(string VideoId, string? UploadStatus);

/// <summary>
/// Sends one file to <c>videos.insert</c> with YouTube's resumable protocol: a session is
/// opened with the metadata, then the bytes go in fixed-size chunks. A dropped connection or
/// a 5xx costs one chunk, not the whole file - the session is asked how much arrived and the
/// upload carries on from there.
/// <para>
/// The source stream is read strictly forwards, one chunk into memory at a time, so it can
/// be any object-store stream, seekable or not.
/// </para>
/// </summary>
public sealed class YouTubeVideoUploader : IDisposable
{
    private const string InsertUrl =
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

    /// <summary>YouTube requires every chunk but the last to be a multiple of this.</summary>
    private const int ChunkGranularity = 256 * 1024;

    private const int MaxRetries = 6;

    private readonly IOptionsMonitor<YouTubePublishOptions> _options;
    private readonly ILogger<YouTubeVideoUploader> _logger;
    private readonly HttpClient _http;

    public YouTubeVideoUploader(IOptionsMonitor<YouTubePublishOptions> options, ILogger<YouTubeVideoUploader> logger)
        : this(options, logger, null)
    {
    }

    public YouTubeVideoUploader(IOptionsMonitor<YouTubePublishOptions> options, ILogger<YouTubeVideoUploader> logger, HttpMessageHandler? handler)
    {
        _options = options;
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            // 308 is YouTube's "resume incomplete", not a redirect to follow.
            AllowAutoRedirect = false
        })
        {
            // Per request, so per chunk: generous enough for a slow uplink.
            Timeout = TimeSpan.FromMinutes(15)
        };
    }

    /// <param name="accessToken">Returns a usable token; <c>true</c> asks for a fresh one after a 401.</param>
    /// <param name="progress">Bytes YouTube has confirmed so far.</param>
    public async Task<UploadedYouTubeVideo> UploadAsync(
        Stream content,
        long length,
        NormalizedYouTubeMetadata metadata,
        Func<bool, CancellationToken, Task<string>> accessToken,
        IProgress<long> progress,
        CancellationToken ct)
    {
        var token = await accessToken(false, ct).ConfigureAwait(false);
        var session = await OpenSessionAsync(length, metadata, token, accessToken, ct).ConfigureAwait(false);
        token = session.Token;

        var chunkSize = Math.Max(1, Math.Clamp(_options.CurrentValue.ChunkSizeMegabytes, 1, 128) * 1024 * 1024 / ChunkGranularity) * ChunkGranularity;
        var buffer = new byte[chunkSize];
        long confirmed = 0;
        var retries = 0;
        var refreshes = 0;

        while (true)
        {
            ct.ThrowIfCancellationRequested();

            // Fill the buffer with the next chunk, starting where YouTube says it has data up to.
            var chunkStart = confirmed;
            var read = await ReadFullyAsync(content, buffer, (int)Math.Min(chunkSize, length - chunkStart), ct).ConfigureAwait(false);
            if (read == 0 && chunkStart < length)
                throw new YouTubePublishException("video-truncated", "The video file ended sooner than expected. Render it again and retry.");

            var offsetInChunk = 0;
            while (offsetInChunk < read)
            {
                var from = chunkStart + offsetInChunk;
                var to = chunkStart + read - 1;

                ChunkResult result;
                try
                {
                    result = await PutChunkAsync(session.Url, buffer, offsetInChunk, read - offsetInChunk, from, to, length, token, ct).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
                {
                    _logger.LogWarning("YouTube upload chunk failed in transit ({ErrorType}); asking how much arrived", ex.GetType().Name);
                    result = ChunkResult.Retry;
                }

                if (result.Status == ChunkStatus.Unauthorized)
                {
                    // An hour-long upload outlives its access token; a fresh one that is refused too means access is gone.
                    if (++refreshes > 3)
                        throw new YouTubePublishException("youtube-reconnect", "YouTube stopped accepting this channel's access. Connect the channel again.");
                    token = await accessToken(true, ct).ConfigureAwait(false);
                    continue;
                }

                if (result.Status == ChunkStatus.Retry)
                {
                    if (++retries > MaxRetries)
                        throw new YouTubePublishException("youtube-unreachable", "The upload kept failing to reach YouTube. Try again later.");

                    await Task.Delay(Backoff(retries), ct).ConfigureAwait(false);
                    result = await QueryStatusAsync(session.Url, length, token, ct).ConfigureAwait(false);
                    if (result.Status is ChunkStatus.Retry or ChunkStatus.Unauthorized) continue;
                }

                if (result.Status == ChunkStatus.Done)
                {
                    progress.Report(length);
                    return result.Video!;
                }

                // Incomplete: YouTube says it holds bytes 0..received-1.
                retries = 0;
                refreshes = 0;
                if (result.Received < chunkStart || result.Received > chunkStart + read)
                    throw new YouTubePublishException("youtube-upload-failed", "YouTube lost track of the upload. Start it again.");

                progress.Report(result.Received);
                offsetInChunk = (int)(result.Received - chunkStart);
                confirmed = result.Received;
            }
        }
    }

    private async Task<(Uri Url, string Token)> OpenSessionAsync(
        long length, NormalizedYouTubeMetadata metadata, string token,
        Func<bool, CancellationToken, Task<string>> accessToken, CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new
        {
            snippet = new
            {
                title = metadata.Title,
                description = metadata.Description,
                tags = metadata.Tags,
                categoryId = metadata.CategoryId
            },
            status = new
            {
                privacyStatus = metadata.Privacy,
                selfDeclaredMadeForKids = metadata.MadeForKids,
                embeddable = true
            }
        });

        for (var attempt = 1; ; attempt++)
        {
            var url = InsertUrl + (metadata.NotifySubscribers ? string.Empty : "&notifySubscribers=false");
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("X-Upload-Content-Type", "video/mp4");
            request.Headers.Add("X-Upload-Content-Length", length.ToString(System.Globalization.CultureInfo.InvariantCulture));

            HttpResponseMessage response;
            try
            {
                response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                if (attempt > 3) throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached. Try again later.");
                await Task.Delay(Backoff(attempt), ct).ConfigureAwait(false);
                continue;
            }

            using (response)
            {
                if (response.StatusCode == HttpStatusCode.Unauthorized && attempt == 1)
                {
                    token = await accessToken(true, ct).ConfigureAwait(false);
                    continue;
                }

                if ((int)response.StatusCode >= 500 && attempt <= 3)
                {
                    await Task.Delay(Backoff(attempt), ct).ConfigureAwait(false);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                    throw await FailureAsync(response, ct).ConfigureAwait(false);

                // The session URL carries its own upload id; it must stay on Google's upload host.
                var location = response.Headers.Location;
                if (location is null || !location.IsAbsoluteUri || location.Scheme != Uri.UriSchemeHttps
                    || !string.Equals(location.Host, "www.googleapis.com", StringComparison.OrdinalIgnoreCase))
                {
                    throw new YouTubePublishException("youtube-upload-failed", "YouTube didn't open an upload session. Try again.");
                }

                return (location, token);
            }
        }
    }

    private async Task<ChunkResult> PutChunkAsync(
        Uri session, byte[] buffer, int offset, int count, long from, long to, long total, string token, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, session)
        {
            Content = new ByteArrayContent(buffer, offset, count)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("video/mp4");
        request.Content.Headers.ContentRange = new ContentRangeHeaderValue(from, to, total);

        using var response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        return await InterpretAsync(response, ct).ConfigureAwait(false);
    }

    private async Task<ChunkResult> QueryStatusAsync(Uri session, long total, string token, CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, session) { Content = new ByteArrayContent([]) };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content.Headers.ContentRange = new ContentRangeHeaderValue(total);

            using var response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            return await InterpretAsync(response, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            return ChunkResult.Retry;
        }
    }

    private async Task<ChunkResult> InterpretAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var status = (int)response.StatusCode;

        if (status == 308)
        {
            // "Range: bytes=0-N" - N is the last byte held. No header means nothing arrived yet.
            var received = 0L;
            if (response.Headers.TryGetValues("Range", out var ranges)
                && ranges.FirstOrDefault() is { } range
                && range.LastIndexOf('-') is var dash and > 0
                && long.TryParse(range[(dash + 1)..], System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out var last))
            {
                received = last + 1;
            }
            return ChunkResult.Incomplete(received);
        }

        if (status is 200 or 201)
        {
            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            var root = document.RootElement;
            var id = root.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
            if (string.IsNullOrEmpty(id))
                throw new YouTubePublishException("youtube-upload-failed", "YouTube finished the upload but didn't return a video id.");

            var uploadStatus = root.TryGetProperty("status", out var s) && s.TryGetProperty("uploadStatus", out var u) ? u.GetString() : null;
            return ChunkResult.Done(new UploadedYouTubeVideo(id, uploadStatus));
        }

        if (status == 401) return ChunkResult.Unauthorized;
        if (status >= 500) return ChunkResult.Retry;

        throw await FailureAsync(response, ct).ConfigureAwait(false);
    }

    private async Task<YouTubePublishException> FailureAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
        _logger.LogWarning("YouTube upload answered {Status} ({Reason})", (int)response.StatusCode, reason ?? "unknown");

        return reason switch
        {
            "quotaExceeded" or "dailyLimitExceeded" or "rateLimitExceeded" => new("youtube-quota",
                "This server has used its YouTube API quota for today (each upload costs about a sixth of the default daily quota). Try again after midnight Pacific time."),
            "uploadLimitExceeded" => new("youtube-upload-limit",
                "This channel has reached YouTube's daily upload limit. Try again tomorrow."),
            "youtubeSignupRequired" => new("youtube-no-channel",
                "That Google account has no YouTube channel yet. Create one on youtube.com, then connect again."),
            "insufficientPermissions" or "forbidden" => new("youtube-reconnect",
                "YouTube refused the upload for this channel. Connect the channel again and allow uploading."),
            "invalidTitle" => new("youtube-rejected", "YouTube rejected the title."),
            "invalidDescription" => new("youtube-rejected", "YouTube rejected the description."),
            "invalidTags" => new("youtube-rejected", "YouTube rejected the tags."),
            "invalidCategoryId" => new("youtube-rejected", "YouTube rejected the category."),
            _ => new("youtube-upload-failed", $"YouTube refused the upload (HTTP {(int)response.StatusCode}).")
        };
    }

    private static async Task<int> ReadFullyAsync(Stream stream, byte[] buffer, int count, CancellationToken ct)
    {
        var total = 0;
        while (total < count)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(total, count - total), ct).ConfigureAwait(false);
            if (read == 0) break;
            total += read;
        }
        return total;
    }

    private static TimeSpan Backoff(int attempt) =>
        TimeSpan.FromSeconds(Math.Min(60, Math.Pow(2, attempt)) + Random.Shared.NextDouble());

    private enum ChunkStatus { Incomplete, Done, Retry, Unauthorized }

    private sealed record ChunkResult(ChunkStatus Status, long Received = 0, UploadedYouTubeVideo? Video = null)
    {
        public static readonly ChunkResult Retry = new(ChunkStatus.Retry);
        public static readonly ChunkResult Unauthorized = new(ChunkStatus.Unauthorized);
        public static ChunkResult Incomplete(long received) => new(ChunkStatus.Incomplete, received);
        public static ChunkResult Done(UploadedYouTubeVideo video) => new(ChunkStatus.Done, Video: video);
    }

    public void Dispose() => _http.Dispose();
}
