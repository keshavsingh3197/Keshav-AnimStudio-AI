using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text.Json;
using System.Text.RegularExpressions;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A broadcast created (or found) on YouTube, ready to stream to. Never carries the key.</summary>
public sealed record YouTubeLiveBroadcast(
    string BroadcastId,
    string? StreamId,
    string Title,
    string Privacy,
    string LifeCycleStatus,
    DateTime? ScheduledStartTime)
{
    public string WatchUrl => $"https://www.youtube.com/watch?v={BroadcastId}";
    public string StudioUrl => $"https://studio.youtube.com/video/{BroadcastId}/livestreaming";
}

/// <summary>Where a broadcast's stream is sent. The key is the stream's <c>cdn.ingestionInfo.streamName</c>.</summary>
public sealed record YouTubeLiveIngest(string StreamKey, string? RtmpsIngestUrl);

/// <summary>
/// The YouTube Live Streaming API: a broadcast (the watch page viewers see, with its title,
/// description and visibility) bound to a stream (the ingest the encoder sends to, with its
/// key). Creating both here means nobody has to visit YouTube Studio to set up a stream.
/// <para>
/// Needs the <c>youtube.force-ssl</c> scope, the same one comments use; a channel connected
/// before it was asked for has to be connected again. Each insert/bind/update costs 50 quota
/// units and each list 1, so one created broadcast is about 200 units.
/// </para>
/// <para>
/// The host is fixed, the token travels only in the <c>Authorization</c> header, and only
/// Google's status and reason code are logged - never a stream key, title or description.
/// </para>
/// </summary>
public sealed partial class YouTubeLiveClient : IDisposable
{
    private const string Api = "https://www.googleapis.com/youtube/v3/";

    private readonly ILogger<YouTubeLiveClient> _logger;
    private readonly HttpClient _http;

    public YouTubeLiveClient(ILogger<YouTubeLiveClient> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeLiveClient(ILogger<YouTubeLiveClient> logger, HttpMessageHandler? handler)
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

    public static bool IsBroadcastId(string? value) => value is not null && BroadcastIdPattern().IsMatch(value);

    /// <summary>
    /// Creates the stream, the broadcast and the binding between them, then sets the tags and
    /// category (which only the broadcast's video takes). Auto-start and auto-stop are on, so
    /// the broadcast goes live when the encoder connects and ends when it stops.
    /// </summary>
    public async Task<YouTubeLiveBroadcast> CreateAsync(NormalizedYouTubeMetadata metadata, DateTime scheduledStartUtc,
        bool enableDvr, string accessToken, CancellationToken ct)
    {
        // The stream first: a broadcast left unbound when this fails part-way would sit in Studio as clutter.
        var streamBody = new
        {
            snippet = new { title = Shorten(metadata.Title, 128) },
            cdn = new { ingestionType = "rtmp", resolution = "variable", frameRate = "variable" },
            contentDetails = new { isReusable = false }
        };
        using var stream = await SendAsync(HttpMethod.Post, "liveStreams?part=snippet,cdn,contentDetails", streamBody,
            accessToken, "liveStreams.insert", ct).ConfigureAwait(false);
        var streamId = ReadString(stream.RootElement, "id")
            ?? throw new YouTubePublishException("youtube-live-failed", "YouTube didn't return the new stream.");

        var broadcastBody = new
        {
            snippet = new
            {
                title = metadata.Title,
                description = metadata.Description,
                scheduledStartTime = scheduledStartUtc.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture)
            },
            status = new { privacyStatus = metadata.Privacy, selfDeclaredMadeForKids = metadata.MadeForKids },
            contentDetails = new
            {
                enableAutoStart = true,
                enableAutoStop = true,
                enableDvr,
                recordFromStart = true,
                latencyPreference = "normal",
                monitorStream = new { enableMonitorStream = false }
            }
        };
        using var broadcast = await SendAsync(HttpMethod.Post, "liveBroadcasts?part=snippet,status,contentDetails", broadcastBody,
            accessToken, "liveBroadcasts.insert", ct).ConfigureAwait(false);
        var broadcastId = ReadString(broadcast.RootElement, "id");
        if (!IsBroadcastId(broadcastId))
            throw new YouTubePublishException("youtube-live-failed", "YouTube didn't return the new broadcast.");

        using (await SendAsync(HttpMethod.Post,
                   $"liveBroadcasts/bind?part=id,contentDetails&id={Uri.EscapeDataString(broadcastId!)}&streamId={Uri.EscapeDataString(streamId)}",
                   null, accessToken, "liveBroadcasts.bind", ct).ConfigureAwait(false))
        {
        }

        // Tags and category belong to the broadcast's video; videos.update replaces the whole
        // snippet, so title and description are sent again with them.
        {
            var videoBody = new
            {
                id = broadcastId,
                snippet = new
                {
                    title = metadata.Title,
                    description = metadata.Description,
                    tags = metadata.Tags,
                    categoryId = metadata.CategoryId
                }
            };
            try
            {
                using (await SendAsync(HttpMethod.Put, "videos?part=snippet", videoBody, accessToken, "videos.update", ct).ConfigureAwait(false))
                {
                }
            }
            catch (YouTubePublishException ex) when (ex.Code != "youtube-unreachable")
            {
                // The broadcast exists and works; only its tags are missing. Better than failing the whole setup.
                _logger.LogWarning("Broadcast {BroadcastId} was created, but its tags and category weren't set: {Code}", broadcastId, ex.Code);
            }
        }

        return new YouTubeLiveBroadcast(broadcastId!, streamId, metadata.Title, metadata.Privacy, "created", scheduledStartUtc);
    }

    /// <summary>The channel's broadcasts that haven't ended yet, newest first, so one made earlier can be streamed to.</summary>
    public async Task<IReadOnlyList<YouTubeLiveBroadcast>> ListUpcomingAsync(string accessToken, CancellationToken ct)
    {
        using var document = await SendAsync(HttpMethod.Get,
            "liveBroadcasts?part=id,snippet,status,contentDetails&broadcastStatus=upcoming&broadcastType=all&maxResults=25",
            null, accessToken, "liveBroadcasts.list", ct).ConfigureAwait(false);

        var list = new List<YouTubeLiveBroadcast>();
        if (!document.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array) return list;
        foreach (var item in items.EnumerateArray())
        {
            if (Describe(item) is { } broadcast) list.Add(broadcast);
        }
        return list;
    }

    /// <summary>
    /// The key of the stream bound to one of the caller's broadcasts. Looked up from YouTube
    /// each time rather than kept anywhere: the token proves the broadcast is the caller's.
    /// </summary>
    /// <exception cref="YouTubePublishException">
    /// <c>youtube-live-not-found</c> when the broadcast isn't on this channel,
    /// <c>youtube-live-ended</c> when it is over, <c>youtube-live-unbound</c> when it has no stream.
    /// </exception>
    public async Task<YouTubeLiveIngest> GetIngestAsync(string broadcastId, string accessToken, CancellationToken ct)
    {
        if (!IsBroadcastId(broadcastId)) throw new ArgumentException("Not a broadcast id.", nameof(broadcastId));

        using var broadcasts = await SendAsync(HttpMethod.Get,
            $"liveBroadcasts?part=id,snippet,status,contentDetails&id={Uri.EscapeDataString(broadcastId)}",
            null, accessToken, "liveBroadcasts.list", ct).ConfigureAwait(false);
        var item = FirstItem(broadcasts.RootElement)
            ?? throw new YouTubePublishException("youtube-live-not-found",
                "That broadcast isn't on this channel any more. Create a new one.");
        var broadcast = Describe(item)
            ?? throw new YouTubePublishException("youtube-live-not-found", "That broadcast isn't on this channel any more. Create a new one.");

        if (broadcast.LifeCycleStatus is "complete" or "revoked")
            throw new YouTubePublishException("youtube-live-ended",
                "That broadcast has already ended on YouTube. Create a new one for this stream.");
        if (broadcast.StreamId is null)
            throw new YouTubePublishException("youtube-live-unbound",
                "That broadcast has no stream attached on YouTube. Create a new one here.");

        using var streams = await SendAsync(HttpMethod.Get,
            $"liveStreams?part=id,cdn&id={Uri.EscapeDataString(broadcast.StreamId)}",
            null, accessToken, "liveStreams.list", ct).ConfigureAwait(false);
        var stream = FirstItem(streams.RootElement);
        if (stream is { } s
            && s.TryGetProperty("cdn", out var cdn)
            && cdn.TryGetProperty("ingestionInfo", out var info)
            && ReadString(info, "streamName") is { Length: > 0 } key)
        {
            return new YouTubeLiveIngest(key, ReadString(info, "rtmpsIngestionAddress"));
        }

        throw new YouTubePublishException("youtube-live-unbound",
            "YouTube didn't return a stream key for that broadcast. Create a new one here.");
    }

    private async Task<JsonDocument> SendAsync(HttpMethod method, string path, object? body, string accessToken,
        string operation, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, Api + path);
        if (body is not null) request.Content = JsonContent.Create(body);
        else if (method == HttpMethod.Post) request.Content = new ByteArrayContent([]);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("YouTube could not be reached for {Operation}: {ErrorType}", operation, ex.GetType().Name);
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached. Try again in a minute.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
                _logger.LogWarning("YouTube {Operation} answered {Status} ({Reason})", operation, (int)response.StatusCode, reason ?? "unknown");
                throw Classify(response.StatusCode, reason);
            }

            await using var content = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            return await JsonDocument.ParseAsync(content, cancellationToken: ct).ConfigureAwait(false);
        }
    }

    public static YouTubePublishException Classify(HttpStatusCode status, string? reason) => (status, reason) switch
    {
        (HttpStatusCode.Forbidden, "insufficientPermissions" or "ACCESSTOKENSCOPEINSUFFICIENT")
            or (HttpStatusCode.Unauthorized, _) => new YouTubePublishException("youtube-live-scope",
                "This channel was connected without permission to manage live streams. Reconnect it under YouTube, then try again."),
        (HttpStatusCode.Forbidden, "liveStreamingNotEnabled" or "livePermissionBlocked") => new YouTubePublishException(
            "youtube-live-not-enabled",
            "Live streaming isn't turned on for this channel. Enable it once at youtube.com/features (it can take up to 24 hours), then try again."),
        (HttpStatusCode.Forbidden, "userRequestsExceedRateLimit" or "rateLimitExceeded" or "quotaExceeded") => new YouTubePublishException(
            "youtube-busy", "YouTube's daily limit for this app has been reached. Try again later, or paste a key from YouTube Studio."),
        (HttpStatusCode.BadRequest, "invalidScheduledStartTime") => new YouTubePublishException(
            "youtube-live-invalid", "YouTube refused the start time. Choose a time in the future."),
        (HttpStatusCode.BadRequest, "invalidAutoStart" or "invalidAutoStop" or "invalidEnableDvr") => new YouTubePublishException(
            "youtube-live-invalid", "YouTube refused the broadcast's settings."),
        (HttpStatusCode.BadRequest, "invalidTitle" or "invalidDescription") => new YouTubePublishException(
            "youtube-live-invalid", "YouTube refused the title or description. Shorten it, and remove < and >."),
        (HttpStatusCode.NotFound, _) => new YouTubePublishException("youtube-live-not-found",
            "That broadcast isn't on this channel any more. Create a new one."),
        _ => new YouTubePublishException("youtube-live-failed", "YouTube couldn't set up the live stream. Try again in a minute.")
    };

    private static YouTubeLiveBroadcast? Describe(JsonElement item)
    {
        var id = ReadString(item, "id");
        if (!IsBroadcastId(id)) return null;

        var snippet = item.TryGetProperty("snippet", out var sn) ? sn : default;
        var status = item.TryGetProperty("status", out var st) ? st : default;
        var details = item.TryGetProperty("contentDetails", out var cd) ? cd : default;

        DateTime? scheduled = null;
        if (snippet.ValueKind == JsonValueKind.Object
            && ReadString(snippet, "scheduledStartTime") is { } when
            && DateTime.TryParse(when, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var parsed))
        {
            scheduled = parsed;
        }

        return new YouTubeLiveBroadcast(
            id!,
            details.ValueKind == JsonValueKind.Object ? ReadString(details, "boundStreamId") : null,
            snippet.ValueKind == JsonValueKind.Object ? ReadString(snippet, "title") ?? string.Empty : string.Empty,
            status.ValueKind == JsonValueKind.Object ? ReadString(status, "privacyStatus") ?? "private" : "private",
            status.ValueKind == JsonValueKind.Object ? ReadString(status, "lifeCycleStatus") ?? "created" : "created",
            scheduled);
    }

    private static JsonElement? FirstItem(JsonElement root) =>
        root.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array && items.GetArrayLength() > 0
            ? items[0]
            : null;

    private static string? ReadString(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string Shorten(string value, int max) => value.Length <= max ? value : value[..max];

    public void Dispose() => _http.Dispose();

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex BroadcastIdPattern();
}
