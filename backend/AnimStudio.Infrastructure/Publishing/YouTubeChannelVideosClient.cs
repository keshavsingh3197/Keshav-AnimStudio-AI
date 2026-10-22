using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Xml;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A video on the channel, as far as matching a phone upload needs to know.</summary>
public sealed record YouTubeChannelVideo(
    string VideoId,
    string Title,
    DateTime? PublishedAt,
    double? DurationSeconds,
    string? PrivacyStatus,
    string? UploadStatus,
    string? ThumbnailUrl,
    DateTime? ScheduledAt = null);

/// <summary>A video on the channel with the details the checkup looks at.</summary>
/// <param name="MadeForKids">Null when the audience was never declared.</param>
public sealed record YouTubeVideoFullDetails(
    string VideoId,
    string ChannelId,
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string? CategoryId,
    string? PrivacyStatus,
    bool? MadeForKids,
    DateTime? PublishedAt,
    double? DurationSeconds,
    string? ThumbnailUrl,
    DateTime? ScheduledAt = null,
    bool? LicensedContent = null);

public sealed record YouTubePlaylist(string Id, string Title, int ItemCount);

/// <summary>The details written onto a video uploaded elsewhere. Already validated and normalized.</summary>
public sealed record YouTubeVideoDetails(
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string CategoryId,
    string Privacy,
    bool MadeForKids);

/// <summary>
/// Reads a channel's newest uploads and edits one's details - what "send to phone" needs to
/// find the video uploaded from the YouTube app and put the prepared title, description,
/// tags and settings on it. Each list call costs 1 quota unit; the edit costs 50.
/// <para>
/// The edit reads the video first and changes only the fields AnimStudio owns, because
/// <c>videos.update</c> resets whatever a part's body leaves out - an altered-content
/// declaration or a licence set in the app would otherwise be wiped.
/// </para>
/// </summary>
public sealed partial class YouTubeChannelVideosClient : IDisposable
{
    private const string Api = "https://www.googleapis.com/youtube/v3/";

    private readonly ILogger<YouTubeChannelVideosClient> _logger;
    private readonly HttpClient _http;

    public YouTubeChannelVideosClient(ILogger<YouTubeChannelVideosClient> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeChannelVideosClient(ILogger<YouTubeChannelVideosClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    /// <summary>The channel's newest uploads, newest first, private ones included (the token is the owner's).</summary>
    public async Task<IReadOnlyList<YouTubeChannelVideo>> ListRecentAsync(string accessToken, string channelId, int max, CancellationToken ct)
    {
        string? uploadsPlaylist;
        using (var channel = await SendAsync(HttpMethod.Get, $"channels?part=contentDetails&id={Uri.EscapeDataString(channelId)}",
                   null, accessToken, "channels.list", ct).ConfigureAwait(false))
        {
            uploadsPlaylist = FirstItem(channel.RootElement) is { } item
                && item.TryGetProperty("contentDetails", out var details)
                && details.TryGetProperty("relatedPlaylists", out var related)
                ? ReadString(related, "uploads")
                : null;
        }
        if (uploadsPlaylist is null || !PlaylistIdPattern().IsMatch(uploadsPlaylist)) return [];

        var ids = new List<string>();
        using (var items = await SendAsync(HttpMethod.Get,
                   $"playlistItems?part=contentDetails&maxResults={Math.Clamp(max, 1, 50)}&playlistId={Uri.EscapeDataString(uploadsPlaylist)}",
                   null, accessToken, "playlistItems.list", ct).ConfigureAwait(false))
        {
            if (items.RootElement.TryGetProperty("items", out var list) && list.ValueKind == JsonValueKind.Array)
            {
                foreach (var entry in list.EnumerateArray())
                {
                    if (entry.TryGetProperty("contentDetails", out var cd) && ReadString(cd, "videoId") is { } id && IsVideoId(id))
                        ids.Add(id);
                }
            }
        }
        if (ids.Count == 0) return [];

        using var videos = await SendAsync(HttpMethod.Get,
            $"videos?part=snippet,contentDetails,status&maxResults=50&id={Uri.EscapeDataString(string.Join(',', ids))}",
            null, accessToken, "videos.list", ct).ConfigureAwait(false);

        var found = new List<YouTubeChannelVideo>();
        if (videos.RootElement.TryGetProperty("items", out var videoItems) && videoItems.ValueKind == JsonValueKind.Array)
        {
            foreach (var v in videoItems.EnumerateArray())
            {
                if (Describe(v) is { } described) found.Add(described);
            }
        }
        return [.. found.OrderByDescending(v => v.PublishedAt ?? DateTime.MinValue)];
    }

    /// <summary>
    /// Up to <paramref name="max"/> of the channel's uploads with their full details, newest
    /// first: one list call per 50 videos plus one details call per 50.
    /// </summary>
    public async Task<IReadOnlyList<YouTubeVideoFullDetails>> ListUploadsDetailedAsync(
        string accessToken, string channelId, int max, CancellationToken ct)
    {
        max = Math.Clamp(max, 1, 500);
        string? uploadsPlaylist;
        using (var channel = await SendAsync(HttpMethod.Get, $"channels?part=contentDetails&id={Uri.EscapeDataString(channelId)}",
                   null, accessToken, "channels.list", ct).ConfigureAwait(false))
        {
            uploadsPlaylist = FirstItem(channel.RootElement) is { } item
                && item.TryGetProperty("contentDetails", out var details)
                && details.TryGetProperty("relatedPlaylists", out var related)
                ? ReadString(related, "uploads")
                : null;
        }
        if (uploadsPlaylist is null || !PlaylistIdPattern().IsMatch(uploadsPlaylist)) return [];

        var ids = await ListPlaylistVideoIdsAsync(accessToken, uploadsPlaylist, max, ct).ConfigureAwait(false);
        var found = new List<YouTubeVideoFullDetails>();
        foreach (var chunk in ids.Chunk(50))
        {
            using var videos = await SendAsync(HttpMethod.Get,
                $"videos?part=snippet,contentDetails,status&maxResults=50&id={Uri.EscapeDataString(string.Join(',', chunk))}",
                null, accessToken, "videos.list", ct).ConfigureAwait(false);
            if (videos.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
            {
                foreach (var v in items.EnumerateArray())
                {
                    if (DescribeFull(v) is { } described) found.Add(described);
                }
            }
        }
        return [.. found.OrderByDescending(v => v.PublishedAt ?? DateTime.MinValue)];
    }

    /// <summary>One video with its full details, or null when YouTube doesn't show it to this token.</summary>
    public async Task<YouTubeVideoFullDetails?> GetVideoAsync(string accessToken, string videoId, CancellationToken ct)
    {
        if (!IsVideoId(videoId)) return null;
        using var doc = await SendAsync(HttpMethod.Get, $"videos?part=snippet,contentDetails,status&id={Uri.EscapeDataString(videoId)}",
            null, accessToken, "videos.list", ct).ConfigureAwait(false);
        return FirstItem(doc.RootElement) is { } item ? DescribeFull(item) : null;
    }

    /// <summary>The token owner's playlists (up to 200), for the checkup's playlist picker.</summary>
    public async Task<IReadOnlyList<YouTubePlaylist>> ListPlaylistsAsync(string accessToken, CancellationToken ct)
    {
        var list = new List<YouTubePlaylist>();
        string? page = null;
        do
        {
            var url = "playlists?part=snippet,contentDetails&mine=true&maxResults=50"
                + (page is null ? string.Empty : "&pageToken=" + Uri.EscapeDataString(page));
            using var doc = await SendAsync(HttpMethod.Get, url, null, accessToken, "playlists.list", ct).ConfigureAwait(false);
            if (doc.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
            {
                foreach (var p in items.EnumerateArray())
                {
                    var id = ReadString(p, "id");
                    if (id is null || !PlaylistIdPattern().IsMatch(id)) continue;
                    var title = p.TryGetProperty("snippet", out var sn) ? ReadString(sn, "title") ?? string.Empty : string.Empty;
                    var count = p.TryGetProperty("contentDetails", out var cd) && cd.TryGetProperty("itemCount", out var c)
                        && c.TryGetInt32(out var n) ? n : 0;
                    list.Add(new YouTubePlaylist(id, title.Length <= 150 ? title : title[..150], count));
                }
            }
            page = ReadString(doc.RootElement, "nextPageToken");
        } while (page is not null && list.Count < 200);
        return list;
    }

    /// <summary>The ids of up to <paramref name="max"/> videos in a playlist, in its order.</summary>
    public async Task<IReadOnlyList<string>> ListPlaylistVideoIdsAsync(string accessToken, string playlistId, int max, CancellationToken ct)
    {
        if (!PlaylistIdPattern().IsMatch(playlistId)) return [];
        var ids = new List<string>();
        string? page = null;
        do
        {
            var url = $"playlistItems?part=contentDetails&maxResults=50&playlistId={Uri.EscapeDataString(playlistId)}"
                + (page is null ? string.Empty : "&pageToken=" + Uri.EscapeDataString(page));
            using var doc = await SendAsync(HttpMethod.Get, url, null, accessToken, "playlistItems.list", ct).ConfigureAwait(false);
            if (doc.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
            {
                foreach (var entry in items.EnumerateArray())
                {
                    if (entry.TryGetProperty("contentDetails", out var cd) && ReadString(cd, "videoId") is { } id && IsVideoId(id))
                        ids.Add(id);
                }
            }
            page = ReadString(doc.RootElement, "nextPageToken");
        } while (page is not null && ids.Count < max);
        return ids.Count > max ? ids.GetRange(0, max) : ids;
    }

    /// <summary>Adds a video to the end of one of the owner's playlists (50 quota units).</summary>
    public async Task AddToPlaylistAsync(string accessToken, string playlistId, string videoId, CancellationToken ct)
    {
        if (!PlaylistIdPattern().IsMatch(playlistId) || !IsVideoId(videoId))
            throw new YouTubePublishException("playlist-invalid", "Pick a playlist from the list.");
        var body = new JsonObject
        {
            ["snippet"] = new JsonObject
            {
                ["playlistId"] = playlistId,
                ["resourceId"] = new JsonObject { ["kind"] = "youtube#video", ["videoId"] = videoId }
            }
        };
        using (await SendAsync(HttpMethod.Post, "playlistItems?part=snippet", body, accessToken, "playlistItems.insert", ct).ConfigureAwait(false))
        {
        }
    }

    public static bool IsPlaylistId(string? value) => value is not null && PlaylistIdPattern().IsMatch(value);

    /// <summary>
    /// Writes <paramref name="details"/> onto one of the channel's videos, keeping every other
    /// snippet and status field as it is on YouTube.
    /// </summary>
    /// <param name="expectedChannelId">When set, the video must be on this channel, or nothing is changed.</param>
    public async Task UpdateDetailsAsync(string accessToken, string videoId, YouTubeVideoDetails details, CancellationToken ct,
        string? expectedChannelId = null)
    {
        if (!IsVideoId(videoId)) throw new YouTubePublishException("handoff-video-invalid", "That isn't a YouTube video id.");

        JsonObject snippet;
        JsonObject status;
        using (var current = await SendAsync(HttpMethod.Get, $"videos?part=snippet,status&id={Uri.EscapeDataString(videoId)}",
                   null, accessToken, "videos.list", ct).ConfigureAwait(false))
        {
            var item = FirstItem(current.RootElement)
                ?? throw new YouTubePublishException("handoff-video-missing", "That video isn't on the channel any more.");
            snippet = JsonNode.Parse(item.GetProperty("snippet").GetRawText())!.AsObject();
            status = JsonNode.Parse(item.GetProperty("status").GetRawText())!.AsObject();
        }
        if (expectedChannelId is not null
            && !string.Equals(snippet["channelId"]?.GetValue<string>(), expectedChannelId, StringComparison.Ordinal))
            throw new YouTubePublishException("handoff-video-missing", "That video isn't on this channel.");

        // Read-only on update, or derived by YouTube from what is set here.
        foreach (var name in new[] { "publishedAt", "channelId", "channelTitle", "thumbnails", "localized", "liveBroadcastContent" })
            snippet.Remove(name);
        foreach (var name in new[] { "uploadStatus", "failureReason", "rejectionReason", "madeForKids" })
            status.Remove(name);

        snippet["title"] = details.Title;
        snippet["description"] = details.Description;
        snippet["tags"] = new JsonArray([.. details.Tags.Select(t => (JsonNode)JsonValue.Create(t)!)]);
        snippet["categoryId"] = details.CategoryId;
        status["privacyStatus"] = details.Privacy;
        status["selfDeclaredMadeForKids"] = details.MadeForKids;
        // A scheduled time only goes with "private"; any other visibility must drop it.
        if (details.Privacy != "private") status.Remove("publishAt");

        var body = new JsonObject { ["id"] = videoId, ["snippet"] = snippet, ["status"] = status };
        using (await SendAsync(HttpMethod.Put, "videos?part=snippet,status", body, accessToken, "videos.update", ct).ConfigureAwait(false))
        {
        }
    }

    /// <summary>
    /// Makes the video private and has YouTube publish it at <paramref name="publishAtUtc"/>
    /// (50 quota units). Only the status part is written, read first so the licence,
    /// embedding and audience settings stay as they are.
    /// </summary>
    /// <param name="expectedChannelId">When set, the video must be on this channel, or nothing is changed.</param>
    public async Task SetScheduleAsync(string accessToken, string videoId, DateTime publishAtUtc, CancellationToken ct,
        string? expectedChannelId = null)
    {
        if (!IsVideoId(videoId)) throw new YouTubePublishException("handoff-video-invalid", "That isn't a YouTube video id.");

        JsonObject status;
        using (var current = await SendAsync(HttpMethod.Get, $"videos?part=snippet,status&id={Uri.EscapeDataString(videoId)}",
                   null, accessToken, "videos.list", ct).ConfigureAwait(false))
        {
            var item = FirstItem(current.RootElement)
                ?? throw new YouTubePublishException("handoff-video-missing", "That video isn't on the channel any more.");
            if (expectedChannelId is not null
                && (!item.TryGetProperty("snippet", out var sn)
                    || !string.Equals(ReadString(sn, "channelId"), expectedChannelId, StringComparison.Ordinal)))
                throw new YouTubePublishException("handoff-video-missing", "That video isn't on this channel.");
            status = JsonNode.Parse(item.GetProperty("status").GetRawText())!.AsObject();
        }
        if (string.Equals(status["privacyStatus"]?.GetValue<string>(), "public", StringComparison.Ordinal))
            throw new YouTubePublishException("schedule-already-public", "The video is already public, so YouTube can't schedule it.");

        foreach (var name in new[] { "uploadStatus", "failureReason", "rejectionReason", "madeForKids" })
            status.Remove(name);
        status["privacyStatus"] = "private";
        status["publishAt"] = DateTime.SpecifyKind(publishAtUtc, DateTimeKind.Utc)
            .ToString("yyyy-MM-dd'T'HH:mm:ss'.000Z'", CultureInfo.InvariantCulture);

        var body = new JsonObject { ["id"] = videoId, ["status"] = status };
        using (await SendAsync(HttpMethod.Put, "videos?part=status", body, accessToken, "videos.update", ct).ConfigureAwait(false))
        {
        }
    }

    /// <summary>
    /// Takes a private video's scheduled publish time off (50 quota units); it stays private.
    /// Nothing is written when no time is set.
    /// </summary>
    /// <param name="expectedChannelId">When set, the video must be on this channel, or nothing is changed.</param>
    public async Task ClearScheduleAsync(string accessToken, string videoId, CancellationToken ct, string? expectedChannelId = null)
    {
        if (!IsVideoId(videoId)) throw new YouTubePublishException("handoff-video-invalid", "That isn't a YouTube video id.");

        JsonObject status;
        using (var current = await SendAsync(HttpMethod.Get, $"videos?part=snippet,status&id={Uri.EscapeDataString(videoId)}",
                   null, accessToken, "videos.list", ct).ConfigureAwait(false))
        {
            var item = FirstItem(current.RootElement)
                ?? throw new YouTubePublishException("handoff-video-missing", "That video isn't on the channel any more.");
            if (expectedChannelId is not null
                && (!item.TryGetProperty("snippet", out var sn)
                    || !string.Equals(ReadString(sn, "channelId"), expectedChannelId, StringComparison.Ordinal)))
                throw new YouTubePublishException("handoff-video-missing", "That video isn't on this channel.");
            status = JsonNode.Parse(item.GetProperty("status").GetRawText())!.AsObject();
        }
        if (status["publishAt"] is null) return;

        foreach (var name in new[] { "uploadStatus", "failureReason", "rejectionReason", "madeForKids", "publishAt" })
            status.Remove(name);
        status["privacyStatus"] = "private";

        var body = new JsonObject { ["id"] = videoId, ["status"] = status };
        using (await SendAsync(HttpMethod.Put, "videos?part=status", body, accessToken, "videos.update", ct).ConfigureAwait(false))
        {
        }
    }

    public static bool IsVideoId(string? value) => value is not null && VideoIdPattern().IsMatch(value);

    private static YouTubeChannelVideo? Describe(JsonElement item)
    {
        var id = ReadString(item, "id");
        if (!IsVideoId(id)) return null;

        var snippet = item.TryGetProperty("snippet", out var sn) ? sn : default;
        var details = item.TryGetProperty("contentDetails", out var cd) ? cd : default;
        var status = item.TryGetProperty("status", out var st) ? st : default;

        var published = ReadUtc(snippet, "publishedAt");

        double? duration = null;
        if (ReadString(details, "duration") is { } iso)
        {
            try
            {
                duration = XmlConvert.ToTimeSpan(iso).TotalSeconds;
            }
            catch (FormatException)
            {
                // Still processing, or a shape YouTube hasn't used before; matching falls back to time alone.
            }
        }

        string? thumbnail = null;
        if (snippet.ValueKind == JsonValueKind.Object && snippet.TryGetProperty("thumbnails", out var thumbs) && thumbs.ValueKind == JsonValueKind.Object)
        {
            foreach (var size in new[] { "medium", "default", "high" })
            {
                if (thumbs.TryGetProperty(size, out var t) && Uri.TryCreate(ReadString(t, "url"), UriKind.Absolute, out var url)
                    && url.Scheme == Uri.UriSchemeHttps)
                {
                    thumbnail = url.ToString();
                    break;
                }
            }
        }

        var title = ReadString(snippet, "title") ?? string.Empty;
        return new YouTubeChannelVideo(id!, title.Length <= 200 ? title : title[..200], published, duration,
            ReadString(status, "privacyStatus"), ReadString(status, "uploadStatus"), thumbnail,
            ReadUtc(status, "publishAt"));
    }

    private static DateTime? ReadUtc(JsonElement element, string name) =>
        ReadString(element, name) is { } when
        && DateTime.TryParse(when, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed
            : null;

    private static YouTubeVideoFullDetails? DescribeFull(JsonElement item)
    {
        if (Describe(item) is not { } basic) return null;
        var snippet = item.TryGetProperty("snippet", out var sn) ? sn : default;
        var status = item.TryGetProperty("status", out var st) ? st : default;

        var tags = new List<string>();
        if (snippet.ValueKind == JsonValueKind.Object && snippet.TryGetProperty("tags", out var t) && t.ValueKind == JsonValueKind.Array)
        {
            foreach (var tag in t.EnumerateArray().Take(100))
            {
                if (tag.ValueKind == JsonValueKind.String && tag.GetString() is { Length: > 0 } value) tags.Add(value);
            }
        }

        // selfDeclaredMadeForKids is only shown to the owner; madeForKids is YouTube's own verdict.
        var kids = ReadBool(status, "selfDeclaredMadeForKids") ?? ReadBool(status, "madeForKids");

        var description = ReadString(snippet, "description") ?? string.Empty;
        var details = item.TryGetProperty("contentDetails", out var cd) ? cd : default;
        return new YouTubeVideoFullDetails(basic.VideoId, ReadString(snippet, "channelId") ?? string.Empty, basic.Title,
            description.Length <= 5000 ? description : description[..5000], tags, ReadString(snippet, "categoryId"),
            basic.PrivacyStatus, kids, basic.PublishedAt, basic.DurationSeconds, basic.ThumbnailUrl, basic.ScheduledAt,
            ReadBool(details, "licensedContent"));
    }

    private static bool? ReadBool(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value)
        && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : null;

    private async Task<JsonDocument> SendAsync(HttpMethod method, string path, JsonNode? body, string accessToken,
        string operation, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, Api + path);
        if (body is not null) request.Content = JsonContent.Create(body);
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
        (HttpStatusCode.Unauthorized, _) => new YouTubePublishException("youtube-reconnect",
            "YouTube access for this channel has expired or was removed. Connect the channel again."),
        (HttpStatusCode.Forbidden, "insufficientPermissions" or "ACCESSTOKENSCOPEINSUFFICIENT" or "forbidden") => new YouTubePublishException(
            "youtube-edit-scope", "This channel was connected without permission to edit videos. Reconnect it under YouTube, then try again."),
        (HttpStatusCode.Forbidden, "quotaExceeded" or "rateLimitExceeded" or "userRequestsExceedRateLimit") => new YouTubePublishException(
            "youtube-quota", "This server has used its YouTube API quota for today. It will try again after midnight Pacific time."),
        (HttpStatusCode.BadRequest, "invalidTitle" or "invalidDescription" or "invalidTags" or "invalidCategoryId") => new YouTubePublishException(
            "youtube-rejected", "YouTube refused the details. Check the title, description and tags."),
        (HttpStatusCode.BadRequest, "invalidPublishAt") => new YouTubePublishException(
            "schedule-rejected", "YouTube refused the publish time. It must be in the future, on a video that has never been public."),
        (HttpStatusCode.NotFound, _) => new YouTubePublishException("handoff-video-missing", "That video isn't on the channel any more."),
        _ => new YouTubePublishException("youtube-update-failed", $"YouTube refused the change (HTTP {(int)status}).")
    };

    private static JsonElement? FirstItem(JsonElement root) =>
        root.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array && items.GetArrayLength() > 0
            ? items[0]
            : null;

    private static string? ReadString(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    public void Dispose() => _http.Dispose();

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex VideoIdPattern();

    [GeneratedRegex("^[A-Za-z0-9_-]{10,64}$")]
    private static partial Regex PlaylistIdPattern();
}
