using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Adds a subtitle track to a video with <c>captions.insert</c> (400 quota units): one multipart request carrying the
/// track's details and the SRT file. Needs the <c>youtube.force-ssl</c> scope, the same one comments need.
/// <para>
/// The host is fixed, the token travels only in the <c>Authorization</c> header, and only Google's status and reason
/// code are logged - never the subtitles' text.
/// </para>
/// </summary>
public sealed class YouTubeCaptionClient : IDisposable
{
    private const string InsertUrl = "https://www.googleapis.com/upload/youtube/v3/captions?part=snippet&uploadType=multipart";

    /// <summary>YouTube takes caption files up to 100 MB; a story's are a few kilobytes, so anything near this is wrong.</summary>
    public const int MaxTrackBytes = 1024 * 1024;

    private readonly ILogger<YouTubeCaptionClient> _logger;
    private readonly HttpClient _http;

    public YouTubeCaptionClient(ILogger<YouTubeCaptionClient> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeCaptionClient(ILogger<YouTubeCaptionClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(60)
        };
    }

    /// <returns>The new caption track's id.</returns>
    /// <exception cref="YouTubePublishException">
    /// <c>youtube-caption-scope</c> when the channel must be reconnected, <c>youtube-caption-not-ready</c> when YouTube
    /// does not know the video yet, <c>youtube-caption-invalid</c>, or <c>youtube-caption-failed</c>.
    /// </exception>
    public async Task<string> InsertAsync(string videoId, string language, string name, byte[] srt, string accessToken, CancellationToken ct)
    {
        if (!YouTubeRelatedVideos.IsVideoId(videoId))
            throw new ArgumentException("Not a YouTube video id.", nameof(videoId));
        if (srt.Length == 0 || srt.Length > MaxTrackBytes)
            throw new ArgumentException("The subtitle file is empty or far too large.", nameof(srt));

        var snippet = JsonSerializer.Serialize(new { snippet = new { videoId, language, name, isDraft = false } });
        using var body = new MultipartContent("related")
        {
            new StringContent(snippet, Encoding.UTF8, "application/json"),
            new ByteArrayContent(srt) { Headers = { ContentType = new MediaTypeHeaderValue("application/octet-stream") } }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, InsertUrl) { Content = body };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("YouTube could not be reached to add subtitles: {ErrorType}", ex.GetType().Name);
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached to add the subtitles. Try again in a minute.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube captions.insert for video {VideoId} ({Language}) answered {Status} ({Reason})",
                    videoId, language, (int)response.StatusCode, reason ?? "unknown");
                throw Classify(response.StatusCode, reason);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);
            return document.RootElement.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String
                ? id.GetString()!
                : throw new YouTubePublishException("youtube-caption-failed", "YouTube didn't confirm the subtitles.");
        }
    }

    public static YouTubePublishException Classify(HttpStatusCode status, string? reason) => (status, reason) switch
    {
        (HttpStatusCode.Forbidden, "insufficientPermissions" or "ACCESSTOKENSCOPEINSUFFICIENT")
            or (HttpStatusCode.Unauthorized, _) => new YouTubePublishException("youtube-caption-scope",
                "This channel was connected without permission to add subtitles. Reconnect it on the YouTube page, then try again."),
        (HttpStatusCode.Forbidden, "forbidden") => new YouTubePublishException("youtube-caption-forbidden",
            "YouTube did not allow subtitles on this video. Check it is on a channel you manage."),
        (HttpStatusCode.NotFound, _) => new YouTubePublishException("youtube-caption-not-ready",
            "YouTube does not know the video yet. Wait a minute while it processes, then try again."),
        (HttpStatusCode.BadRequest, _) => new YouTubePublishException("youtube-caption-invalid",
            "YouTube could not read the subtitle file. Download it and add it in YouTube Studio instead."),
        _ => new YouTubePublishException("youtube-caption-failed",
            "The subtitles weren't added. Try again, or add the SRT file in YouTube Studio.")
    };

    public void Dispose() => _http.Dispose();
}
