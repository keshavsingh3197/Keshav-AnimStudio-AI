using System.Text.RegularExpressions;
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
/// <para>
/// <see cref="HostSuffixes"/> is the one concession to wildcards, for media CDNs that shard over
/// generated subdomains. Each entry must begin with a dot and name a whole registrable domain,
/// so <c>.cdninstagram.com</c> matches <c>scontent-lhr8-1.cdninstagram.com</c> but not
/// <c>evil-cdninstagram.com</c>.
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
    string? NotAVideoHint = null,
    IReadOnlyList<string>? HostSuffixes = null,
    Func<Uri, string>? CanonicalPath = null,
    Func<Uri, bool>? IsVideoUri = null,
    bool KeepAllQuery = false)
{
    /// <summary>Every host form to show the user, with suffixes written as <c>*.example.com</c>.</summary>
    public IReadOnlyList<string> DisplayHosts =>
        HostSuffixes is { Count: > 0 } suffixes ? [.. Hosts, .. suffixes.Select(s => '*' + s)] : Hosts;

    public bool Matches(string host) =>
        Hosts.Any(h => string.Equals(h, host, StringComparison.Ordinal))
        || (HostSuffixes?.Any(s => host.EndsWith(s, StringComparison.Ordinal)) ?? false);
}

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
public static partial class MediaSourceValidator
{
    private const int MaxUrlLength = 2048;

    public static readonly MediaPlatform YouTube = new(
        "youtube", "YouTube",
        ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"],
        "https://www.youtube.com/shorts/…",
        "Videos, Shorts and live replays. Playlists and channels are not accepted - link one video.",
        LoginOftenRequired: false);

    /// <summary>
    /// The media file itself, copied out of the browser's DevTools - Network panel.
    /// <para>
    /// This is the escape hatch for posts no link can reach: LinkedIn group posts, private
    /// Facebook groups, member-only Instagram. Those pages send a signed-out fetch to a sign-in
    /// wall, so there is no page for the downloader to read - but the CDN URL the player is
    /// already streaming is signed, self-contained and needs no session.
    /// </para>
    /// <para>
    /// The allowlist still applies and lists only the platforms' own media CDNs, so this cannot
    /// be used to make the API fetch an arbitrary host on the operator's behalf.
    /// </para>
    /// </summary>
    public static readonly MediaPlatform DirectMedia = new(
        "direct", "Direct media link",
        [
            "dms.licdn.com", "media.licdn.com",   // LinkedIn
            "video.twimg.com",                    // X / Twitter
            "vod-progressive.akamaized.net",      // Vimeo progressive
        ],
        "https://dms.licdn.com/playlist/vid/v2/…",
        "The video file itself, from DevTools - Network (filter \"Media\"). Use this when the post is members-only. These links are signed and expire after a few hours.",
        LoginOftenRequired: false,
        HostSuffixes:
        [
            ".cdninstagram.com", ".fbcdn.net",              // Instagram / Facebook
            ".tiktokcdn.com", ".tiktokcdn-us.com",          // TikTok
            ".vimeocdn.com", ".ttvnw.net", ".dmcdn.net",    // Vimeo / Twitch / Dailymotion
            ".redd.it",                                     // Reddit
        ],
        IsVideoUri: IsDirectMediaFile,
        KeepAllQuery: true,
        NotAVideoHint: "That CDN link doesn't look like a media file. Pick the request whose type is \"media\" (or whose name ends in .mp4 or .m3u8) and use Copy - Copy URL.");

    public static readonly IReadOnlyList<MediaPlatform> Platforms =
    [
        YouTube,
        new("linkedin", "LinkedIn",
            ["linkedin.com", "www.linkedin.com"],
            "https://www.linkedin.com/posts/…",
            "Public posts with a native video. Use ⋯ → Copy link to post. Group and member-only posts cannot be fetched by link - use a direct media link for those.",
            LoginOftenRequired: false,
            IsVideoPath: s => s.Length >= 2 && s[0] is "posts" or "feed" or "video" or "events" or "embed",
            NotAVideoHint: "That LinkedIn link points to a profile or page, not a post. Open the post, click ⋯ and choose \"Copy link to post\".",
            CanonicalPath: LinkedInCanonicalPath),
        new("instagram", "Instagram",
            ["instagram.com", "www.instagram.com"],
            "https://www.instagram.com/reel/…",
            "Reels and video posts. Many need a signed-in browser session (cookies).",
            LoginOftenRequired: true,
            VerticalByDefault: true,
            // "share" is Instagram's current copy-link shape (/share/abc and /share/reel/abc).
            // It redirects to the real /reel/ URL, which the downloader follows.
            IsVideoPath: s => s.Length >= 2 && (s[0] is "p" or "reel" or "reels" or "tv" or "stories" or "share"
                                                || (s.Length >= 3 && s[1] is "p" or "reel" or "reels" or "tv")),
            NotAVideoHint: "That Instagram link is a profile, not a post. Open the reel and use Share → Copy link."),
        new("facebook", "Facebook",
            ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"],
            "https://www.facebook.com/reel/…",
            "Public videos, Reels and Watch links. Private groups need cookies, or a direct media link.",
            LoginOftenRequired: true,
            KeptQueryKeys: ["v", "story_fbid", "id"]),
        new("x", "X / Twitter",
            ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com", "mobile.x.com"],
            "https://x.com/user/status/…",
            "Posts that contain a video or GIF. X increasingly requires a signed-in session.",
            LoginOftenRequired: true,
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
        DirectMedia,
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

        var absolutePath = platform.CanonicalPath?.Invoke(uri) ?? uri.AbsolutePath;

        var segments = absolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0)
        {
            return Invalid("url-not-a-video", $"That is the {platform.Name} home page, not a video.",
                $"Open the video and copy its link - e.g. {platform.Example}", platform);
        }

        if ((platform.IsVideoPath is { } isVideoPath && !isVideoPath(segments))
            || (platform.IsVideoUri is { } isVideoUri && !isVideoUri(uri)))
        {
            return Invalid("url-not-a-video", $"That {platform.Name} link doesn't point to a video.",
                platform.NotAVideoHint, platform);
        }

        // Only reachable for KeepAllQuery platforms; every other query is rebuilt key by key.
        if (platform.KeepAllQuery && uri.Query.Length > 1 && !uri.Query.All(IsQueryChar))
        {
            return Invalid("url-malformed", "That link contains characters that aren't valid in a web address.",
                "Use the browser's own \"Copy URL\" rather than retyping the link.", platform);
        }

        return new MediaSourceValidationResult(true, platform, Rebuild(uri, host, absolutePath, platform), null, null);
    }

    public static MediaPlatform? FindPlatform(string host) =>
        Platforms.FirstOrDefault(p => p.Matches(host));

    public static MediaPlatform? FindPlatformById(string? id) =>
        Platforms.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// A LinkedIn group post URN is <c>{groupId}-{activityId}</c>, and that URL 404s for anyone
    /// who is not a member - yt-dlp's LinkedIn extractor only recognises <c>urn:li:activity:</c>
    /// and otherwise falls through to the generic one, which reports the 404 as "deleted or made
    /// private". Rewriting to the activity form reaches the real extractor, and the real error.
    /// <para>
    /// Only groupPost is rewritten. <c>ugcPost</c> and <c>share</c> URNs resolve as they are, and
    /// their ids are <em>not</em> interchangeable with an activity id.
    /// </para>
    /// </summary>
    private static string LinkedInCanonicalPath(Uri uri)
    {
        var path = uri.AbsolutePath;
        var match = LinkedInGroupPostUrn().Match(path);
        if (!match.Success) return path;

        return string.Concat(
            path.AsSpan(0, match.Index),
            "urn:li:activity:",
            match.Groups["id"].ValueSpan,
            path.AsSpan(match.Index + match.Length));
    }

    private static readonly string[] MediaFileExtensions =
        [".mp4", ".m4v", ".mov", ".webm", ".mkv", ".m4a", ".mp3", ".aac", ".ts", ".m3u8", ".mpd"];

    /// <summary>
    /// A direct link has to look like a media file. Most CDNs end the path in an extension;
    /// LinkedIn's does not (<c>/playlist/vid/v2/{asset}/mp4-720p-30fp-crf28/0/{timestamp}</c>),
    /// so its streaming path is recognised on its own.
    /// </summary>
    private static bool IsDirectMediaFile(Uri uri)
    {
        var path = uri.AbsolutePath;
        return MediaFileExtensions.Any(e => path.EndsWith(e, StringComparison.OrdinalIgnoreCase))
               || path.Contains("/playlist/vid/", StringComparison.OrdinalIgnoreCase)
               || path.Contains("/vid/v2/", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>RFC 3986's <c>query</c> grammar, plus the leading '?' and the '%' of an escape.</summary>
    private static bool IsQueryChar(char c) =>
        c is >= 'a' and <= 'z' or >= 'A' and <= 'Z' or >= '0' and <= '9'
        || "-._~%!$&'()*+,;=:@/?".Contains(c, StringComparison.Ordinal);

    /// <summary>
    /// https + the matched host + the escaped path + only the query keys the platform needs.
    /// <see cref="Uri.AbsolutePath"/> is already percent-escaped, so nothing the user typed
    /// survives unescaped.
    /// </summary>
    private static string Rebuild(Uri uri, string host, string absolutePath, MediaPlatform platform)
    {
        var canonical = $"https://{host}{absolutePath}";

        // A signed CDN link carries its signature in the query, and round-tripping that through a
        // parser would change the bytes the CDN signed ('+' decodes to a space and comes back as
        // %20). Validate has already checked every character, so the raw string is kept as it is.
        if (platform.KeepAllQuery)
            return uri.Query.Length > 1 ? canonical + uri.Query : canonical;

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

    // ':' survives unescaped in a path, but a link that has been through a share sheet often
    // arrives with %3A instead, so both spellings are matched.
    [GeneratedRegex(@"urn(?::|%3A)li(?::|%3A)groupPost(?::|%3A)\d+-(?<id>\d+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 200)]
    private static partial Regex LinkedInGroupPostUrn();
}
