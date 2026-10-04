using AnimStudio.Application.Ingest;

namespace AnimStudio.Application.Media;

/// <summary>
/// A site the media downloader accepts links from.
/// <para>
/// <see cref="Hosts"/> is an exact-match allowlist, the same rule <see cref="YouTubeUrlValidator"/>
/// uses. General-purpose shorteners (t.co, lnkd.in, bit.ly) are deliberately absent: they
/// redirect anywhere, which would hand the destination host back to whoever wrote the link.
/// A platform's own short host (fb.watch, vm.tiktok.com) only redirects within that platform.
/// </para>
/// </summary>
public sealed record MediaPlatform(
    string Id,
    string Name,
    IReadOnlyList<string> Hosts,
    string Example,
    string Notes,
    bool LoginOftenRequired,
    bool VerticalByDefault = false,
    IReadOnlyList<string>? KeptQueryKeys = null,
    Func<string[], bool>? IsVideoPath = null,
    string? NotAVideoHint = null);

public sealed record MediaSourceValidationResult(
    bool IsValid,
    MediaPlatform? Platform,
    string? CanonicalUrl,
    string? ErrorCode,
    string? ErrorMessage,
    string? Hint = null);

/// <summary>
/// Validates a media link from any supported platform and rebuilds it from scratch.
/// <para>
/// As with <see cref="YouTubeUrlValidator"/>, the rebuild is the security boundary: the host
/// is matched whole against an allowlist, userinfo and custom ports are refused, and the URL
/// handed to yt-dlp is reassembled from the scheme constant, the matched host, the path and
/// only the query keys a platform needs. Tracking parameters never reach the downloader, and
/// neither does any host the operator has not listed here.
/// </para>
/// </summary>
public static class MediaSourceValidator
{
    private const int MaxUrlLength = 2048;

    public static readonly MediaPlatform YouTube = new(
        "youtube", "YouTube",
        ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"],
        "https://www.youtube.com/shorts/…",
        "Videos, Shorts and live replays. Playlists and channels are not accepted - link one video.",
        LoginOftenRequired: false);

    public static readonly IReadOnlyList<MediaPlatform> Platforms =
    [
        YouTube,
        new("linkedin", "LinkedIn",
            ["linkedin.com", "www.linkedin.com"],
            "https://www.linkedin.com/posts/…",
            "Public posts with a native video. Use ⋯ → Copy link to post.",
            LoginOftenRequired: false,
            IsVideoPath: s => s.Length >= 2 && s[0] is "posts" or "feed" or "video" or "events" or "embed",
            NotAVideoHint: "That LinkedIn link points to a profile or page, not a post. Open the post, click ⋯ and choose \"Copy link to post\"."),
        new("instagram", "Instagram",
            ["instagram.com", "www.instagram.com"],
            "https://www.instagram.com/reel/…",
            "Reels and video posts. Many need a signed-in browser session (cookies).",
            LoginOftenRequired: true,
            VerticalByDefault: true,
            IsVideoPath: s => s.Length >= 2 && (s[0] is "p" or "reel" or "reels" or "tv" or "stories"
                                                || (s.Length >= 3 && s[1] is "p" or "reel" or "tv")),
            NotAVideoHint: "That Instagram link is a profile, not a post. Open the reel and use Share → Copy link."),
        new("facebook", "Facebook",
            ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"],
            "https://www.facebook.com/reel/…",
            "Public videos, Reels and Watch links. Private groups need cookies.",
            LoginOftenRequired: true,
            KeptQueryKeys: ["v", "story_fbid", "id"]),
        new("x", "X / Twitter",
            ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com", "mobile.x.com"],
            "https://x.com/user/status/…",
            "Posts that contain a video or GIF.",
            LoginOftenRequired: false,
            IsVideoPath: s => Array.IndexOf(s, "status") is >= 0 and var i && i + 1 < s.Length,
            NotAVideoHint: "That X link is a profile, not a post. Open the post and use Share → Copy link."),
        new("tiktok", "TikTok",
            ["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
            "https://www.tiktok.com/@user/video/…",
            "Single videos. Profile pages are not accepted.",
            LoginOftenRequired: false,
            VerticalByDefault: true),
        new("vimeo", "Vimeo",
            ["vimeo.com", "www.vimeo.com", "player.vimeo.com"],
            "https://vimeo.com/123456789",
            "Public and unlisted videos. Password-protected videos are not supported.",
            LoginOftenRequired: false,
            KeptQueryKeys: ["h"]),
        new("reddit", "Reddit",
            ["reddit.com", "www.reddit.com", "old.reddit.com", "v.redd.it"],
            "https://www.reddit.com/r/…/comments/…",
            "Posts with a Reddit-hosted video.",
            LoginOftenRequired: false),
        new("dailymotion", "Dailymotion",
            ["dailymotion.com", "www.dailymotion.com", "dai.ly"],
            "https://www.dailymotion.com/video/…",
            "Public videos.",
            LoginOftenRequired: false),
        new("twitch", "Twitch",
            ["twitch.tv", "www.twitch.tv", "m.twitch.tv", "clips.twitch.tv"],
            "https://clips.twitch.tv/…",
            "Clips and past broadcasts (VODs). Live streams are not downloaded.",
            LoginOftenRequired: false),
    ];

    public static MediaSourceValidationResult Validate(string? input, bool allowHttp = false)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Invalid("url-required", "Paste a video link to get started.");

        if (input.Length > MaxUrlLength)
            return Invalid("url-too-long", "That link is too long to be a video link.");

        if (!Uri.TryCreate(input.Trim(), UriKind.Absolute, out var uri))
            return Invalid("url-malformed", "That isn't a complete link.",
                "Copy the full address, starting with https://");

        var isHttps = string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
        var isHttp = string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase);
        if (!isHttps && !(allowHttp && isHttp))
            return Invalid("url-scheme-not-allowed", "Only https:// links can be downloaded.");

        if (!string.IsNullOrEmpty(uri.UserInfo))
            return Invalid("url-userinfo-not-allowed", "Links containing a user name or password are not accepted.");

        if (!uri.IsDefaultPort)
            return Invalid("url-port-not-allowed", "Links with a custom port are not accepted.");

        var host = uri.IdnHost.TrimEnd('.').ToLowerInvariant();
        var platform = FindPlatform(host);
        if (platform is null)
        {
            return Invalid("url-host-not-allowed",
                $"Downloading from {host} isn't supported.",
                $"Supported sources: {string.Join(", ", Platforms.Select(p => p.Name))}.");
        }

        if (ReferenceEquals(platform, YouTube))
        {
            var yt = YouTubeUrlValidator.Validate(input, allowHttp);
            return yt.IsValid
                ? new MediaSourceValidationResult(true, platform, yt.CanonicalUrl, null, null)
                : Invalid(yt.ErrorCode ?? "url-invalid",
                    "That YouTube link doesn't point to a single video.",
                    "Use a video, Shorts or live link. Playlists and channel pages are not accepted.",
                    platform);
        }

        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0)
        {
            return Invalid("url-not-a-video", $"That is the {platform.Name} home page, not a video.",
                $"Open the video and copy its link - e.g. {platform.Example}", platform);
        }

        if (platform.IsVideoPath is { } isVideo && !isVideo(segments))
        {
            return Invalid("url-not-a-video", $"That {platform.Name} link doesn't point to a video.",
                platform.NotAVideoHint, platform);
        }

        return new MediaSourceValidationResult(true, platform, Rebuild(uri, host, platform), null, null);
    }

    public static MediaPlatform? FindPlatform(string host) =>
        Platforms.FirstOrDefault(p => p.Hosts.Any(h => string.Equals(h, host, StringComparison.Ordinal)));

    public static MediaPlatform? FindPlatformById(string? id) =>
        Platforms.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// https + the matched host + the escaped path + only the query keys the platform needs.
    /// <see cref="Uri.AbsolutePath"/> is already percent-escaped, so nothing the user typed
    /// survives unescaped.
    /// </summary>
    private static string Rebuild(Uri uri, string host, MediaPlatform platform)
    {
        var canonical = $"https://{host}{uri.AbsolutePath}";
        if (platform.KeptQueryKeys is not { Count: > 0 } keys || string.IsNullOrEmpty(uri.Query))
            return canonical;

        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var kept = keys
            .Where(k => !string.IsNullOrEmpty(query[k]))
            .Select(k => $"{k}={Uri.EscapeDataString(query[k]!)}")
            .ToList();

        return kept.Count == 0 ? canonical : $"{canonical}?{string.Join('&', kept)}";
    }

    private static MediaSourceValidationResult Invalid(
        string code, string message, string? hint = null, MediaPlatform? platform = null) =>
        new(false, platform, null, code, message, hint);
}
