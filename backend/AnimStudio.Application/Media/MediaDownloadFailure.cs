using System.Text.RegularExpressions;

namespace AnimStudio.Application.Media;

/// <summary>
/// Why a probe or download failed, in words a user can act on.
/// <para>
/// <see cref="Detail"/> is the downloader's own error line, scrubbed of file-system paths,
/// for the "technical details" disclosure - never a stack trace.
/// </para>
/// </summary>
public sealed record MediaDownloadFailure(string Code, string Message, string Hint, string? Detail = null);

public sealed class MediaDownloadException(MediaDownloadFailure failure, Exception? inner = null)
    : Exception(failure.Message, inner)
{
    public MediaDownloadFailure Failure { get; } = failure;
}

/// <summary>Maps yt-dlp's stderr onto a short list of causes the user can do something about.</summary>
public static partial class MediaDownloadFailureClassifier
{
    private const string UpdateHint =
        "The site may have changed its page layout. Update the downloader (run \"yt-dlp -U\" or \"winget upgrade yt-dlp\") and try again.";

    private const string CookiesHint =
        "Sign in to the site in your browser and set Ingest:YtDlp:CookiesFromBrowser (e.g. \"firefox\" or \"chrome\") in the API settings, then restart the API.";

    // First match wins, so specific causes come before the generic ones at the bottom.
    private static readonly (string Code, string[] Needles, string Message, string Hint)[] Rules =
    [
        ("bot-check", ["sign in to confirm you", "confirm you're not a bot", "confirm you’re not a bot"],
            "{0} is asking for a bot check before serving this video.", CookiesHint),
        ("login-required", ["login required", "log in", "logged-in", "requires authentication", "private video",
                            "this video is private", "rate-limit reached or login required", "use --cookies",
                            "only available for registered users", "members-only", "join this channel"],
            "This {0} video is private or needs you to be signed in.", CookiesHint),
        ("age-restricted", ["age-restricted", "confirm your age", "age restricted", "inappropriate for some users"],
            "This {0} video is age-restricted.", CookiesHint),
        ("geo-blocked", ["not available in your country", "geo restriction", "geo-restricted", "not made this video available in your country"],
            "This {0} video is blocked in your region.", "Try a different video, or download from a network in a region where it is available."),
        ("drm-protected", ["drm"],
            "This {0} video is DRM-protected and cannot be downloaded.", "DRM-protected media (paid films, some music videos) is intentionally unsupported."),
        ("live-not-ready", ["this live event will begin", "live event", "premieres in", "is not a finished"],
            "This {0} stream is live or hasn't started yet.", "Wait until the stream ends and the replay is published, then try again."),
        ("no-video", ["no video formats found", "no video could be found", "there's no video", "there is no video",
                      "does not contain a video", "no media found", "no formats found"],
            "This {0} post doesn't contain a downloadable video.", "It may contain only text or images, or the video is an external link. Open the post and check it plays on the site."),
        ("ffmpeg-missing", ["ffmpeg not found", "ffprobe and ffmpeg not found", "ffmpeg is not installed"],
            "FFmpeg is required to merge video and audio but wasn't found.", "Install FFmpeg and make sure it is on the API's PATH, then restart the API."),
        ("rate-limited", ["http error 429", "too many requests"],
            "{0} is rate-limiting downloads right now.", "Wait a few minutes before trying again."),
        ("unavailable", ["video unavailable", "video is unavailable", "is no longer available","has been removed", "does not exist", "this post is unavailable",
                         "content isn't available", "not found", "http error 404", "http error 410", "account has been terminated"],
            "This {0} video is unavailable - it may have been deleted or made private.", "Check the link opens in a private/incognito browser window."),
        ("unsupported-url", ["unsupported url"],
            "The downloader doesn't recognise this {0} link.", "Copy the link directly from the post's Share button. " + UpdateHint),
        ("network", ["getaddrinfo failed", "name or service not known", "temporary failure in name resolution",
                     "connection refused", "connection reset", "timed out", "urlopen error", "network is unreachable",
                     "ssl: ", "certificate verify failed"],
            "Couldn't reach {0}.", "Check the API machine's internet connection, VPN or proxy, then try again."),

        ("downloader-outdated", ["unable to extract", "please report this issue", "extractor error"],
            "The downloader couldn't read this {0} page.", UpdateHint),
    ];

    public static MediaDownloadFailure Classify(string? stderr, string platformName)
    {
        var detail = ExtractDetail(stderr);
        var haystack = (stderr ?? string.Empty).ToLowerInvariant();

        foreach (var (code, needles, message, hint) in Rules)
        {
            if (needles.Any(n => haystack.Contains(n, StringComparison.Ordinal)))
                return new MediaDownloadFailure(code, string.Format(message, platformName), hint, detail);
        }

        return new MediaDownloadFailure(
            "download-failed",
            $"The download from {platformName} failed.",
            "Check the link opens in your browser. If it does, update the downloader (\"yt-dlp -U\") and try again.",
            detail);
    }

    public static MediaDownloadFailure DownloaderMissing() => new(
        "downloader-missing",
        "The video downloader (yt-dlp) isn't installed on the API machine.",
        "Install it with \"winget install yt-dlp\" (or pip install yt-dlp), or set Ingest:YtDlp:ExecutablePath, then restart the API.");

    public static MediaDownloadFailure TimedOut(string platformName) => new(
        "timeout",
        $"The download from {platformName} took too long and was stopped.",
        "Try a lower resolution or a shorter video, or raise Ingest:YtDlp:TimeoutSeconds.");

    public static MediaDownloadFailure Disabled() => new(
        "download-disabled",
        "Media downloading is turned off on this server.",
        "An administrator can enable it with Ingest:AllowMediaDownload.");

    /// <summary>The last "ERROR:" line, without file-system paths or yt-dlp's bug-report boilerplate.</summary>
    public static string? ExtractDetail(string? stderr)
    {
        if (string.IsNullOrWhiteSpace(stderr)) return null;

        var line = stderr
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault(l => l.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
            ?? stderr.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).LastOrDefault();

        if (string.IsNullOrWhiteSpace(line)) return null;

        var reportAt = line.IndexOf("; please report", StringComparison.OrdinalIgnoreCase);
        if (reportAt > 0) line = line[..reportAt];

        line = WindowsPath().Replace(line, "<path>");
        line = UnixPath().Replace(line, "<path>");

        return line.Length > 300 ? line[..300] + "…" : line;
    }

    [GeneratedRegex(@"[A-Za-z]:[\\/][^\s'""]*", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 200)]
    private static partial Regex WindowsPath();

    [GeneratedRegex(@"(?<![\w:/])/(?:home|Users|tmp|var|mnt|opt|root|usr)/[^\s'""]*", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 200)]
    private static partial Regex UnixPath();
}
