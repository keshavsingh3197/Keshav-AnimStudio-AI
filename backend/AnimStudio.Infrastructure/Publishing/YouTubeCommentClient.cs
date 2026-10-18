using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Posts a top-level comment on a video with <c>commentThreads.insert</c> (50 quota units).
/// Needs the <c>youtube.force-ssl</c> scope; a channel connected before that scope was asked
/// for has to be connected again first.
/// <para>
/// The host is fixed, the token travels only in the <c>Authorization</c> header, and only
/// Google's status and reason code are logged - never the comment's text.
/// </para>
/// </summary>
public sealed class YouTubeCommentClient : IDisposable
{
    private const string InsertUrl = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet";

    private readonly ILogger<YouTubeCommentClient> _logger;
    private readonly HttpClient _http;

    public YouTubeCommentClient(ILogger<YouTubeCommentClient> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeCommentClient(ILogger<YouTubeCommentClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    /// <returns>The new comment thread's id.</returns>
    /// <exception cref="YouTubePublishException">
    /// <c>youtube-comment-scope</c> when the channel must be reconnected to allow comments,
    /// <c>youtube-comment-not-ready</c> when YouTube doesn't know the video yet (worth retrying),
    /// <c>youtube-comments-disabled</c>, or <c>youtube-comment-failed</c>.
    /// </exception>
    public async Task<string> PostAsync(string videoId, string text, string accessToken, CancellationToken ct)
    {
        if (!YouTubeRelatedVideos.IsVideoId(videoId))
            throw new ArgumentException("Not a YouTube video id.", nameof(videoId));

        var body = new
        {
            snippet = new
            {
                videoId,
                topLevelComment = new { snippet = new { textOriginal = text } }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, InsertUrl) { Content = JsonContent.Create(body) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("YouTube could not be reached to post a comment: {ErrorType}", ex.GetType().Name);
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached to post the first comment.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube commentThreads.insert for video {VideoId} answered {Status} ({Reason})",
                    videoId, (int)response.StatusCode, reason ?? "unknown");
                throw Classify(response.StatusCode, reason);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);
            return document.RootElement.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String
                ? id.GetString()!
                : throw new YouTubePublishException("youtube-comment-failed", "YouTube didn't confirm the first comment.");
        }
    }

    public static YouTubePublishException Classify(HttpStatusCode status, string? reason) => (status, reason) switch
    {
        (HttpStatusCode.Forbidden, "insufficientPermissions" or "ACCESSTOKENSCOPEINSUFFICIENT")
            or (HttpStatusCode.Unauthorized, _) => new YouTubePublishException("youtube-comment-scope",
                "The first comment wasn't posted: this channel was connected without permission to comment. Reconnect it to allow comments."),
        (HttpStatusCode.Forbidden, "commentsDisabled") => new YouTubePublishException("youtube-comments-disabled",
            "The first comment wasn't posted: comments are turned off for this video."),
        (HttpStatusCode.NotFound, _) or (HttpStatusCode.Forbidden, "forbidden" or "processingFailure") => new YouTubePublishException(
            "youtube-comment-not-ready", "The first comment wasn't posted: YouTube was still processing the video. Add it in YouTube Studio."),
        _ => new YouTubePublishException("youtube-comment-failed",
            "The first comment wasn't posted. Add it in YouTube Studio.")
    };

    public void Dispose() => _http.Dispose();
}
