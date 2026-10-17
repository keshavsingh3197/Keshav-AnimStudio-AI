using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using AnimStudio.Application.Media;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Media;

/// <summary>A Suno song, resolved to a file on Suno's CDN that yt-dlp can fetch directly.</summary>
public sealed record SunoSong(
    string Id,
    Uri MediaUrl,
    string? Title,
    string? Artist,
    string? ThumbnailUrl,
    double? DurationSeconds);

/// <summary>
/// Turns a validated suno.com link into the song's file on <c>cdn1.suno.ai</c>.
/// <para>
/// yt-dlp refuses suno.com, but the song page names the files its player streams. Only the
/// song id is taken from the page; the media URL is rebuilt from that id and a fixed host, so
/// nothing the page says can point the downloader anywhere else. Share links (<c>/s/{code}</c>)
/// redirect to <c>/song/{id}</c>; redirects are followed by hand and only within suno.com.
/// </para>
/// </summary>
public sealed partial class SunoSongResolver : IDisposable
{
    private const int MaxRedirects = 3;
    private const int MaxPageChars = 4 * 1024 * 1024;

    private readonly HttpClient _http;
    private readonly ILogger<SunoSongResolver> _logger;

    public SunoSongResolver(ILogger<SunoSongResolver> logger)
    {
        _logger = logger;
        _http = new HttpClient(new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
            AutomaticDecompression = DecompressionMethods.All,
        })
        {
            Timeout = TimeSpan.FromSeconds(20),
        };
        // Suno serves a bare shell to clients it doesn't recognise as a browser.
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimStudio");
    }

    public async Task<SunoSong> ResolveAsync(Uri canonicalUrl, CancellationToken ct)
    {
        var id = SongIdFromPath(canonicalUrl) ?? await FollowShareLinkAsync(canonicalUrl, ct).ConfigureAwait(false);
        var page = await GetPageAsync(new Uri($"https://suno.com/song/{id}"), ct).ConfigureAwait(false);

        // The page names cdn1.suno.ai/{id}.mp3 only when the creator allows audio downloads;
        // the song video is published either way.
        var ext = page.Contains($"cdn1.suno.ai/{id}.mp3", StringComparison.OrdinalIgnoreCase) ? "mp3"
            : page.Contains($"cdn1.suno.ai/{id}.mp4", StringComparison.OrdinalIgnoreCase) ? "mp4"
            : null;
        if (ext is null)
        {
            throw new MediaDownloadException(new MediaDownloadFailure(
                "no-video",
                "This Suno song has no downloadable file yet.",
                "Open the song on suno.com and check it plays. A song that is still generating, or whose creator turned off sharing, can't be downloaded."));
        }

        var thumb = Match(OgImage(), page);
        return new SunoSong(
            Id: id,
            MediaUrl: new Uri($"https://cdn1.suno.ai/{id}.{ext}"),
            Title: Match(OgTitle(), page) is { } t ? WebUtility.HtmlDecode(t) : null,
            Artist: Match(Handle(), page),
            ThumbnailUrl: thumb is not null && thumb.StartsWith("https://cdn2.suno.ai/", StringComparison.Ordinal) ? thumb : null,
            DurationSeconds: double.TryParse(Match(Duration(), page), NumberStyles.Float, CultureInfo.InvariantCulture, out var d) && d > 0 ? d : null);
    }

    private async Task<string> FollowShareLinkAsync(Uri url, CancellationToken ct)
    {
        var current = url;
        for (var hop = 0; hop < MaxRedirects; hop++)
        {
            using var response = await SendAsync(current, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            if ((int)response.StatusCode is < 300 or >= 400 || response.Headers.Location is not { } location)
                break;

            var next = location.IsAbsoluteUri ? location : new Uri(current, location);
            if (next.Scheme != Uri.UriSchemeHttps
                || MediaSourceValidator.Suno.Hosts.All(h => !string.Equals(h, next.IdnHost, StringComparison.OrdinalIgnoreCase)))
            {
                _logger.LogWarning("Suno share link redirected off suno.com to {Host}", next.IdnHost);
                break;
            }

            if (SongIdFromPath(next) is { } id) return id;
            current = next;
        }

        throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify("not found", MediaSourceValidator.Suno.Name));
    }

    private async Task<string> GetPageAsync(Uri url, CancellationToken ct)
    {
        using var response = await SendAsync(url, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify(
                $"HTTP Error {(int)response.StatusCode}", MediaSourceValidator.Suno.Name));
        }

        using var reader = new StreamReader(await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false));
        var buffer = new char[MaxPageChars];
        var read = await reader.ReadBlockAsync(buffer, ct).ConfigureAwait(false);
        return new string(buffer, 0, read);
    }

    private async Task<HttpResponseMessage> SendAsync(Uri url, HttpCompletionOption completion, CancellationToken ct)
    {
        try
        {
            return await _http.SendAsync(new HttpRequestMessage(HttpMethod.Get, url), completion, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Suno request failed");
            throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify("timed out", MediaSourceValidator.Suno.Name), ex);
        }
    }

    /// <summary>The id from <c>/song/{guid}</c>, normalised so it is safe to put back in a URL.</summary>
    private static string? SongIdFromPath(Uri url)
    {
        var segments = url.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments is ["song", var raw, ..] && Guid.TryParse(raw, out var id) ? id.ToString("D") : null;
    }

    private static string? Match(Regex regex, string page) =>
        regex.Match(page) is { Success: true } m ? m.Groups["v"].Value : null;

    public void Dispose() => _http.Dispose();

    [GeneratedRegex(@"<meta property=""og:title"" content=""(?<v>[^""]{1,300})""", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex OgTitle();

    [GeneratedRegex(@"<meta property=""og:image"" content=""(?<v>https://[^""]{1,300})""", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex OgImage();

    // The page embeds its data as escaped JSON: \"handle\":\"name\".
    [GeneratedRegex(@"\\""handle\\"":\\""(?<v>[A-Za-z0-9_.-]{1,64})\\""", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex Handle();

    [GeneratedRegex(@"\\""duration\\"":(?<v>\d{1,6}(?:\.\d+)?)[,}]", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex Duration();
}
