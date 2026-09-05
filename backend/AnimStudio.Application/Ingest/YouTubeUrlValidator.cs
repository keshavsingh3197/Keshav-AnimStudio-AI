using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Ingest;

public sealed record YouTubeUrlValidationResult(
    bool IsValid, string? VideoId, string? CanonicalUrl, string? UrlHash, string? ErrorCode);

/// <summary>
/// Validates a YouTube URL and rebuilds it from scratch.
/// <para>
/// The rebuild is the important part. Rather than sanitizing the user's string and passing
/// it along, this extracts an 11-character video id, checks it against a strict pattern,
/// and constructs a fresh canonical URL. The user's raw text therefore never reaches the
/// downloader's argument vector, which structurally eliminates argument injection and the
/// entire SSRF class for this path - the destination host becomes a compile-time constant
/// set rather than something an attacker influences.
/// </para>
/// </summary>
public static partial class YouTubeUrlValidator
{
    /// <summary>Exact-match allowlist. Never suffix matching - see <see cref="IsAllowedHost"/>.</summary>
    private static readonly string[] AllowedHosts =
    [
        "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
        "youtu.be", "www.youtu.be"
    ];

    [GeneratedRegex(@"^[A-Za-z0-9_-]{11}$", RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
        matchTimeoutMilliseconds: 500)]
    private static partial Regex VideoIdPattern();

    private const int MaxUrlLength = 2048;

    public static YouTubeUrlValidationResult Validate(string? input, bool allowHttp = false)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Invalid("url-required");

        if (input.Length > MaxUrlLength)
            return Invalid("url-too-long");

        if (!Uri.TryCreate(input.Trim(), UriKind.Absolute, out var uri))
            return Invalid("url-malformed");

        var isHttps = string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
        var isHttp = string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase);
        if (!isHttps && !(allowHttp && isHttp))
            return Invalid("url-scheme-not-allowed");

        // "https://youtube.com@evil.tld/..." reads as youtube.com to a human but resolves
        // to evil.tld, so any userinfo section is rejected outright.
        if (!string.IsNullOrEmpty(uri.UserInfo))
            return Invalid("url-userinfo-not-allowed");

        if (!uri.IsDefaultPort)
            return Invalid("url-port-not-allowed");

        if (!IsAllowedHost(uri))
            return Invalid("url-host-not-allowed");

        var videoId = ExtractVideoId(uri);
        if (videoId is null)
            return Invalid("url-not-a-video");

        if (!VideoIdPattern().IsMatch(videoId))
            return Invalid("url-video-id-invalid");

        // Rebuilt from the validated id: every query parameter the user supplied (t, list,
        // si, and anything else) is discarded.
        var canonical = $"https://www.youtube.com/watch?v={videoId}";

        return new YouTubeUrlValidationResult(true, videoId, canonical, HashUrl(canonical), null);
    }

    /// <summary>
    /// Exact membership only. <c>EndsWith("youtube.com")</c> would accept
    /// "evil-youtube.com", and prefix matching would accept
    /// "youtube.com.attacker.tld" - so this is an allowlist compared whole.
    /// </summary>
    private static bool IsAllowedHost(Uri uri)
    {
        // IdnHost normalizes punycode, and a trailing dot is a valid but sneaky variant.
        var host = uri.IdnHost.TrimEnd('.').ToLowerInvariant();
        return Array.Exists(AllowedHosts, allowed =>
            string.Equals(allowed, host, StringComparison.Ordinal));
    }

    private static string? ExtractVideoId(Uri uri)
    {
        var host = uri.IdnHost.TrimEnd('.').ToLowerInvariant();
        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        // youtu.be/<id>
        if (host is "youtu.be" or "www.youtu.be")
            return segments.Length > 0 ? segments[0] : null;

        // /watch?v=<id>
        if (uri.AbsolutePath.Equals("/watch", StringComparison.OrdinalIgnoreCase))
        {
            var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
            return query["v"];
        }

        // /shorts/<id>, /live/<id>, /embed/<id>
        if (segments.Length >= 2 && segments[0] is "shorts" or "live" or "embed")
            return segments[1];

        // Playlists, channels and user pages are deliberately not accepted: this ingests
        // one video's captions, not a whole channel.
        return null;
    }

    private static string HashUrl(string canonical)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexStringLower(bytes);
    }

    private static YouTubeUrlValidationResult Invalid(string code) => new(false, null, null, null, code);
}
