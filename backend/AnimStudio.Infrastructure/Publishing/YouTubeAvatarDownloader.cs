using System.Net;
using System.Security.Authentication;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

public sealed record DownloadedImage(byte[] Bytes, string MimeType, string Extension);

/// <summary>
/// Fetches a channel's profile picture from YouTube's image hosts, so it can become a
/// watermark logo without saving and re-uploading it by hand.
/// <para>
/// The URL comes from YouTube's API, but it is still checked before any request: https,
/// default port, and only Google's image hosts - so a tampered settings document can't
/// point the server at an internal address. No redirects, a size cap, and the bytes must
/// actually be a PNG, JPEG or WEBP whatever the response claims.
/// </para>
/// </summary>
public sealed class YouTubeAvatarDownloader : IDisposable
{
    public const int MaxBytes = 5 * 1024 * 1024;

    private static readonly string[] AllowedHostSuffixes = [".ggpht.com", ".googleusercontent.com", ".ytimg.com"];

    private readonly HttpClient _http;
    private readonly ILogger<YouTubeAvatarDownloader> _logger;

    public YouTubeAvatarDownloader(ILogger<YouTubeAvatarDownloader> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeAvatarDownloader(ILogger<YouTubeAvatarDownloader> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(20),
            MaxResponseContentBufferSize = MaxBytes
        };
    }

    public static bool IsAllowed(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && uri.IsDefaultPort
        && string.IsNullOrEmpty(uri.UserInfo)
        && AllowedHostSuffixes.Any(s => uri.Host.EndsWith(s, StringComparison.OrdinalIgnoreCase));

    public async Task<DownloadedImage> DownloadAsync(string? url, CancellationToken ct)
    {
        if (!IsAllowed(url))
            throw new YouTubePublishException("avatar-url-invalid", "This channel has no YouTube picture to use. Sync it from YouTube first.");

        try
        {
            using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseContentRead, ct).ConfigureAwait(false);
            if (response.StatusCode != HttpStatusCode.OK)
            {
                _logger.LogWarning("YouTube image host answered {Status} for a channel picture", (int)response.StatusCode);
                throw new YouTubePublishException("avatar-download-failed", "YouTube didn't return the channel picture. Sync from YouTube and try again.");
            }

            var bytes = await response.Content.ReadAsByteArrayAsync(ct).ConfigureAwait(false);
            return Sniff(bytes) ?? throw new YouTubePublishException("avatar-not-image", "The channel picture isn't a PNG, JPEG or WEBP image.");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("YouTube image host could not be reached: {ErrorType}", ex.GetType().Name);
            throw new YouTubePublishException("youtube-unreachable", "YouTube couldn't be reached. Check the server's internet connection and try again.");
        }
    }

    /// <summary>The image type from its first bytes, or null if it isn't one we accept.</summary>
    public static DownloadedImage? Sniff(byte[] bytes)
    {
        if (bytes.Length is 0 or > MaxBytes) return null;
        if (bytes.AsSpan().StartsWith((byte[])[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return new(bytes, "image/png", ".png");
        if (bytes.AsSpan().StartsWith((byte[])[0xFF, 0xD8, 0xFF])) return new(bytes, "image/jpeg", ".jpg");
        if (bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8))
            return new(bytes, "image/webp", ".webp");
        return null;
    }

    public void Dispose() => _http.Dispose();
}
