using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using AnimStudio.Application.Ingest;
using AnimStudio.Infrastructure.Ingest;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

public sealed record YouTubeFetchedVideoData(
    string VideoId,
    string CanonicalUrl,
    string Title,
    string Description,
    IReadOnlyList<string> Keywords,
    string? Author,
    double? DurationSeconds,
    string TranscriptText,
    string? Language,
    bool HasTranscript);

/// <summary>
/// 100% Free, Zero-Key YouTube Metadata &amp; Spoken Transcript / Lyrics Extractor, plus
/// Keyless Free Cloud AI helper.
/// <para>
/// Extracts video title, description, tags, duration, and timed captions (<c>[mm:ss] text</c>)
/// directly from YouTube (preferring Hindi <c>hi</c>, then English <c>en</c>, then any track)
/// with fallback to <see cref="YtDlpCaptionDownloader"/> when installed.
/// </para>
/// </summary>
public sealed partial class YouTubeTranscriptFetcher : IDisposable
{
    private readonly ILogger<YouTubeTranscriptFetcher> _logger;
    private readonly YtDlpCaptionDownloader? _ytDlp;
    private readonly HttpClient _http;

    public YouTubeTranscriptFetcher(
        ILogger<YouTubeTranscriptFetcher> logger,
        YtDlpCaptionDownloader? ytDlp = null,
        HttpMessageHandler? handler = null)
    {
        _logger = logger;
        _ytDlp = ytDlp;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        })
        {
            Timeout = TimeSpan.FromSeconds(18)
        };
        _http.DefaultRequestHeaders.UserAgent.ParseAdd(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    }

    public static (bool IsValid, string? VideoId, string? CanonicalUrl, string? ErrorMessage) ParseUrlOrVideoId(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return (false, null, null, "Paste a YouTube video or Short URL first.");

        var trimmed = input.Trim();
        if (VideoIdOnlyPattern().IsMatch(trimmed))
        {
            return (true, trimmed, $"https://www.youtube.com/watch?v={trimmed}", null);
        }

        var validated = YouTubeUrlValidator.Validate(trimmed, allowHttp: true);
        if (!validated.IsValid || validated.VideoId is null || validated.CanonicalUrl is null)
        {
            return (false, null, null, "Enter a valid YouTube video or Short URL (e.g. https://youtube.com/shorts/... or https://youtu.be/...).");
        }

        return (true, validated.VideoId, validated.CanonicalUrl, null);
    }

    public async Task<YouTubeFetchedVideoData> FetchAsync(string urlOrVideoId, CancellationToken ct)
    {
        var (isValid, videoId, canonicalUrl, error) = ParseUrlOrVideoId(urlOrVideoId);
        if (!isValid || videoId is null || canonicalUrl is null)
            throw new ArgumentException(error ?? "Invalid YouTube URL.");

        string title = string.Empty;
        string description = string.Empty;
        var keywords = new List<string>();
        string? author = null;
        double? durationSeconds = null;
        string transcriptText = string.Empty;
        string? language = null;

        // 1. Try YouTube Innertube Player API (fast, free, returns videoDetails + captionTracks)
        try
        {
            var (itTitle, itDesc, itKeywords, itAuthor, itDur, captionTracks) =
                await FetchInnertubePlayerAsync(videoId, ct).ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(itTitle)) title = itTitle;
            if (!string.IsNullOrWhiteSpace(itDesc)) description = itDesc;
            if (itKeywords.Count > 0) keywords.AddRange(itKeywords);
            if (!string.IsNullOrWhiteSpace(itAuthor)) author = itAuthor;
            if (itDur is > 0) durationSeconds = itDur;

            if (captionTracks.Count > 0)
            {
                var chosen = ChooseBestTrack(captionTracks);
                if (chosen is not null)
                {
                    language = chosen.LanguageCode;
                    transcriptText = await DownloadCaptionTrackXmlAsync(chosen.BaseUrl, ct).ConfigureAwait(false);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Innertube metadata/caption fetch for {VideoId} did not complete.", videoId);
        }

        // 2. If title is still empty, try YouTube oEmbed (always public, zero quota)
        if (string.IsNullOrWhiteSpace(title))
        {
            try
            {
                var oembedUrl = $"https://www.youtube.com/oembed?url={Uri.EscapeDataString(canonicalUrl)}&format=json";
                using var resp = await _http.GetAsync(oembedUrl, ct).ConfigureAwait(false);
                if (resp.IsSuccessStatusCode)
                {
                    using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false), cancellationToken: ct).ConfigureAwait(false);
                    if (doc.RootElement.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String)
                        title = t.GetString() ?? string.Empty;
                    if (string.IsNullOrWhiteSpace(author) && doc.RootElement.TryGetProperty("author_name", out var a) && a.ValueKind == JsonValueKind.String)
                        author = a.GetString();
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogDebug(ex, "oEmbed fetch failed for {VideoId}.", videoId);
            }
        }

        // 3. Fallback to yt-dlp if transcript is still empty and yt-dlp is installed on the machine
        if (string.IsNullOrWhiteSpace(transcriptText) && _ytDlp is not null)
        {
            try
            {
                var ver = await _ytDlp.GetVersionAsync(ct).ConfigureAwait(false);
                if (!string.IsNullOrWhiteSpace(ver))
                {
                    var dl = await _ytDlp.DownloadAsync(new Uri(canonicalUrl), ct).ConfigureAwait(false);
                    if (string.IsNullOrWhiteSpace(title) && !string.IsNullOrWhiteSpace(dl.Title))
                        title = dl.Title;
                    language ??= dl.Language;
                    transcriptText = FormatVttAsTimestampedTranscript(dl.Content);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogDebug(ex, "yt-dlp fallback caption fetch did not find captions for {VideoId}.", videoId);
            }
        }

        var hasTranscript = !string.IsNullOrWhiteSpace(transcriptText);
        return new YouTubeFetchedVideoData(
            videoId,
            canonicalUrl,
            title,
            description,
            keywords,
            author,
            durationSeconds,
            transcriptText,
            language,
            hasTranscript);
    }

    /// <summary>
    /// Calls Pollinations' 100% free, zero-API-key OpenAI-compatible text endpoint.
    /// Returns null if offline or rate-limited so the caller can seamlessly fall back to
    /// <see cref="AnimStudio.Application.Publishing.YouTubeFreeSeoEngine"/>.
    /// </summary>
    public async Task<string?> CallFreePollinationsAiAsync(string systemPrompt, string userPrompt, CancellationToken ct)
    {
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(14));

            var payload = new
            {
                model = "openai",
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                response_format = new { type = "json_object" },
                temperature = 0.65
            };

            using var response = await _http.PostAsJsonAsync(
                "https://text.pollinations.ai/openai", payload, timeoutCts.Token).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(timeoutCts.Token).ConfigureAwait(false),
                cancellationToken: timeoutCts.Token).ConfigureAwait(false);

            if (doc.RootElement.TryGetProperty("choices", out var choices)
                && choices.ValueKind == JsonValueKind.Array
                && choices.GetArrayLength() > 0
                && choices[0].TryGetProperty("message", out var msg)
                && msg.TryGetProperty("content", out var content)
                && content.ValueKind == JsonValueKind.String)
            {
                return content.GetString();
            }

            return null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            _logger.LogDebug(ex, "Free Pollinations AI text request did not complete; using local SEO engine.");
            return null;
        }
    }

    private sealed record CaptionTrackItem(string BaseUrl, string LanguageCode, bool IsAuto);

    private async Task<(string Title, string Description, List<string> Keywords, string? Author, double? DurationSeconds, List<CaptionTrackItem> Tracks)>
        FetchInnertubePlayerAsync(string videoId, CancellationToken ct)
    {
        var body = new
        {
            context = new
            {
                client = new
                {
                    hl = "hi",
                    gl = "IN",
                    clientName = "ANDROID",
                    clientVersion = "19.09.37",
                    androidSdkVersion = 34
                }
            },
            videoId
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://www.youtube.com/youtubei/v1/player?prettyPrint=false")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.TryAddWithoutValidation("X-YouTube-Client-Name", "3");
        req.Headers.TryAddWithoutValidation("X-YouTube-Client-Version", "19.09.37");

        using var resp = await _http.SendAsync(req, ct).ConfigureAwait(false);
        resp.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false), cancellationToken: ct).ConfigureAwait(false);
        var root = doc.RootElement;

        string title = string.Empty;
        string description = string.Empty;
        var keywords = new List<string>();
        string? author = null;
        double? durationSeconds = null;

        if (root.TryGetProperty("videoDetails", out var vd) && vd.ValueKind == JsonValueKind.Object)
        {
            if (vd.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String)
                title = t.GetString() ?? string.Empty;
            if (vd.TryGetProperty("shortDescription", out var sd) && sd.ValueKind == JsonValueKind.String)
                description = sd.GetString() ?? string.Empty;
            if (vd.TryGetProperty("author", out var au) && au.ValueKind == JsonValueKind.String)
                author = au.GetString();
            if (vd.TryGetProperty("lengthSeconds", out var ls) && ls.ValueKind == JsonValueKind.String
                && double.TryParse(ls.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var secs))
                durationSeconds = secs;
            if (vd.TryGetProperty("keywords", out var kw) && kw.ValueKind == JsonValueKind.Array)
            {
                foreach (var k in kw.EnumerateArray().Take(35))
                {
                    if (k.ValueKind == JsonValueKind.String && k.GetString() is { Length: > 0 } s)
                        keywords.Add(s);
                }
            }
        }

        var tracks = new List<CaptionTrackItem>();
        if (root.TryGetProperty("captions", out var caps)
            && caps.TryGetProperty("playerCaptionsTracklistRenderer", out var renderer)
            && renderer.TryGetProperty("captionTracks", out var trackArr)
            && trackArr.ValueKind == JsonValueKind.Array)
        {
            foreach (var tr in trackArr.EnumerateArray())
            {
                var baseUrl = tr.TryGetProperty("baseUrl", out var bu) && bu.ValueKind == JsonValueKind.String ? bu.GetString() : null;
                var lang = tr.TryGetProperty("languageCode", out var lc) && lc.ValueKind == JsonValueKind.String ? lc.GetString() : null;
                var kind = tr.TryGetProperty("kind", out var kd) && kd.ValueKind == JsonValueKind.String ? kd.GetString() : null;
                if (!string.IsNullOrWhiteSpace(baseUrl) && Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
                {
                    tracks.Add(new CaptionTrackItem(baseUrl, lang ?? "en", string.Equals(kind, "asr", StringComparison.OrdinalIgnoreCase)));
                }
            }
        }

        return (title, description, keywords, author, durationSeconds, tracks);
    }

    private static CaptionTrackItem? ChooseBestTrack(List<CaptionTrackItem> tracks)
    {
        if (tracks.Count == 0) return null;
        // Prefer Hindi ("hi"), then English ("en"), manual over auto-generated
        return tracks.FirstOrDefault(t => t.LanguageCode.StartsWith("hi", StringComparison.OrdinalIgnoreCase) && !t.IsAuto)
               ?? tracks.FirstOrDefault(t => t.LanguageCode.StartsWith("hi", StringComparison.OrdinalIgnoreCase))
               ?? tracks.FirstOrDefault(t => t.LanguageCode.StartsWith("en", StringComparison.OrdinalIgnoreCase) && !t.IsAuto)
               ?? tracks.FirstOrDefault(t => t.LanguageCode.StartsWith("en", StringComparison.OrdinalIgnoreCase))
               ?? tracks.FirstOrDefault(t => !t.IsAuto)
               ?? tracks[0];
    }

    private async Task<string> DownloadCaptionTrackXmlAsync(string baseUrl, CancellationToken ct)
    {
        using var resp = await _http.GetAsync(baseUrl, ct).ConfigureAwait(false);
        if (!resp.IsSuccessStatusCode) return string.Empty;

        var xmlText = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(xmlText)) return string.Empty;

        var doc = XDocument.Parse(xmlText);
        var sb = new StringBuilder();
        var count = 0;

        // Format 1: <transcript><text start="1.23" dur="2.5">...</text></transcript>
        foreach (var el in doc.Descendants("text"))
        {
            var raw = WebUtility.HtmlDecode(el.Value).Replace('\n', ' ').Trim();
            if (string.IsNullOrWhiteSpace(raw)) continue;
            var startAttr = el.Attribute("start")?.Value;
            double.TryParse(startAttr, NumberStyles.Any, CultureInfo.InvariantCulture, out var startSec);
            var ts = TimeSpan.FromSeconds(Math.Max(0, startSec));
            sb.AppendLine($"[{ts:mm\\:ss}] {raw}");
            if (++count >= 120) break;
        }

        // Format 2: <timedtext><body><p t="1230" d="2500">...</p></body></timedtext>
        if (count == 0)
        {
            foreach (var el in doc.Descendants("p"))
            {
                var raw = WebUtility.HtmlDecode(el.Value).Replace('\n', ' ').Trim();
                if (string.IsNullOrWhiteSpace(raw)) continue;
                var tAttr = el.Attribute("t")?.Value;
                double.TryParse(tAttr, NumberStyles.Any, CultureInfo.InvariantCulture, out var startMs);
                var ts = TimeSpan.FromMilliseconds(Math.Max(0, startMs));
                sb.AppendLine($"[{ts:mm\\:ss}] {raw}");
                if (++count >= 120) break;
            }
        }

        return sb.ToString().Trim();
    }

    private static string FormatVttAsTimestampedTranscript(string vtt)
    {
        if (string.IsNullOrWhiteSpace(vtt)) return string.Empty;
        var sb = new StringBuilder();
        var lines = vtt.Split('\n', StringSplitOptions.TrimEntries);
        string? currentStamp = null;
        var seenLines = new HashSet<string>(StringComparer.Ordinal);

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("WEBVTT", StringComparison.OrdinalIgnoreCase)
                || line.StartsWith("Kind:", StringComparison.OrdinalIgnoreCase)
                || line.StartsWith("Language:", StringComparison.OrdinalIgnoreCase))
                continue;

            var arrowIdx = line.IndexOf("-->", StringComparison.Ordinal);
            if (arrowIdx > 0)
            {
                var startPart = line[..arrowIdx].Trim();
                if (TimeSpan.TryParse(startPart, CultureInfo.InvariantCulture, out var ts))
                    currentStamp = $"[{ts:mm\\:ss}]";
                continue;
            }

            var cleaned = Regex.Replace(line, @"<[^>]+>", "").Trim();
            if (string.IsNullOrWhiteSpace(cleaned) || int.TryParse(cleaned, out _)) continue;
            if (seenLines.Add(cleaned))
            {
                sb.AppendLine(currentStamp is not null ? $"{currentStamp} {cleaned}" : cleaned);
                if (seenLines.Count >= 120) break;
            }
        }

        return sb.ToString().Trim();
    }

    public void Dispose() => _http.Dispose();

    [GeneratedRegex(@"^[A-Za-z0-9_-]{11}$", RegexOptions.CultureInvariant)]
    private static partial Regex VideoIdOnlyPattern();
}

