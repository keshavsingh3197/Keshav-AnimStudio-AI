using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Publishing;
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
    bool HasTranscript)
{
    /// <summary>Every caption line with its start time (up to <see cref="YouTubeTranscriptFetcher.MaxSegments"/>), for chapters and the full text.</summary>
    public IReadOnlyList<YouTubeCaptionSegment> Segments { get; init; } = [];

    /// <summary>Whether the captions were YouTube's automatic ones; null when unknown (the yt-dlp fallback).</summary>
    public bool? CaptionsAreAuto { get; init; }

    /// <summary>The channel the video is on, as YouTube's player reports it; null when that wasn't read.</summary>
    public string? ChannelId { get; init; }
}

/// <summary>What a public watch page adds: the music YouTube recognised, and when and by whom it was published.</summary>
public sealed record YouTubeWatchPageInfo(IReadOnlyList<YouTubeDetectedSong> Songs, string? PublishedText, string? ChannelTitle)
{
    public static readonly YouTubeWatchPageInfo Empty = new([], null, null);
}

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
    /// <summary>Caption lines kept with their timing; the transcript text itself stays at its first 120.</summary>
    public const int MaxSegments = 3000;

    /// <summary>A watch page's JSON is large but not this large; anything bigger is not read.</summary>
    private const long MaxNextResponseBytes = 8 * 1024 * 1024;

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
        IReadOnlyList<YouTubeCaptionSegment> segments = [];
        bool? captionsAreAuto = null;
        string? channelId = null;

        var innertubeSucceeded = false;
        var innertubeTrackCount = 0;
        // 1. Try YouTube Innertube Player API (fast, free, returns videoDetails + captionTracks)
        try
        {
            var (itTitle, itDesc, itKeywords, itAuthor, itDur, captionTracks, itChannelId) =
                await FetchInnertubePlayerAsync(videoId, ct).ConfigureAwait(false);
            channelId = itChannelId;
            innertubeSucceeded = !string.IsNullOrWhiteSpace(itTitle);
            innertubeTrackCount = captionTracks.Count;

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
                    captionsAreAuto = chosen.IsAuto;
                    segments = await DownloadCaptionTrackXmlAsync(chosen.BaseUrl, ct).ConfigureAwait(false);
                    transcriptText = FormatSegments(segments, 120);
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
        if (string.IsNullOrWhiteSpace(transcriptText) && (!innertubeSucceeded || innertubeTrackCount > 0) && _ytDlp is not null)
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
                    segments = ParseVttSegments(dl.Content);
                    captionsAreAuto = null;
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
            hasTranscript)
        {
            Segments = segments,
            CaptionsAreAuto = hasTranscript ? captionsAreAuto : null,
            ChannelId = channelId
        };
    }

    /// <summary>
    /// The watch page's own data (Innertube <c>next</c>, the web client): the songs in its
    /// "Music" section, the published date as shown, and the channel name. Free and keyless,
    /// and best effort - YouTube changes this shape without notice, so anything that fails
    /// returns <see cref="YouTubeWatchPageInfo.Empty"/> instead of throwing.
    /// </summary>
    public async Task<YouTubeWatchPageInfo> FetchWatchPageInfoAsync(string videoId, CancellationToken ct)
    {
        if (!VideoIdOnlyPattern().IsMatch(videoId)) return YouTubeWatchPageInfo.Empty;
        try
        {
            var body = new
            {
                context = new { client = new { hl = "en", gl = "US", clientName = "WEB", clientVersion = "2.20240726.00.00" } },
                videoId
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://www.youtube.com/youtubei/v1/next?prettyPrint=false")
            {
                Content = JsonContent.Create(body)
            };
            req.Headers.TryAddWithoutValidation("X-YouTube-Client-Name", "1");
            req.Headers.TryAddWithoutValidation("X-YouTube-Client-Version", "2.20240726.00.00");

            using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            if (!resp.IsSuccessStatusCode || resp.Content.Headers.ContentLength > MaxNextResponseBytes) return YouTubeWatchPageInfo.Empty;

            await using var stream = await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);
            var root = doc.RootElement;

            var songs = YouTubeMusicDetector.FromInnertubeNext(root);
            string? published = null, channel = null;
            if (FindProperty(root, "videoPrimaryInfoRenderer", 0) is { } primary && primary.TryGetProperty("dateText", out var date))
                published = InnertubeText(date);
            if (FindProperty(root, "videoOwnerRenderer", 0) is { } owner && owner.TryGetProperty("title", out var ownerTitle))
                channel = InnertubeText(ownerTitle);
            return new YouTubeWatchPageInfo(songs, Clip(published, 80), Clip(channel, 120));
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            _logger.LogDebug(ex, "Watch-page details for {VideoId} could not be read.", videoId);
            return YouTubeWatchPageInfo.Empty;
        }
    }

    /// <summary>The first object under <paramref name="name"/>, depth-limited.</summary>
    private static JsonElement? FindProperty(JsonElement element, string name, int depth)
    {
        if (depth > 24) return null;
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var p in element.EnumerateObject())
            {
                if (p.NameEquals(name) && p.Value.ValueKind == JsonValueKind.Object) return p.Value;
                if (FindProperty(p.Value, name, depth + 1) is { } found) return found;
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                if (FindProperty(item, name, depth + 1) is { } found) return found;
            }
        }
        return null;
    }

    private static string? InnertubeText(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String) return element.GetString();
        if (element.ValueKind != JsonValueKind.Object) return null;
        if (element.TryGetProperty("simpleText", out var simple) && simple.ValueKind == JsonValueKind.String) return simple.GetString();
        if (element.TryGetProperty("runs", out var runs) && runs.ValueKind == JsonValueKind.Array)
            return string.Concat(runs.EnumerateArray().Take(10)
                .Select(r => r.ValueKind == JsonValueKind.Object && r.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null));
        return null;
    }

    /// <summary>One line, no control characters or angle brackets, at most <paramref name="max"/> characters.</summary>
    private static string? Clip(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var clean = new string(value.Where(c => !char.IsControl(c) && c is not '<' and not '>').ToArray()).Trim();
        if (clean.Length > max) clean = clean[..max].TrimEnd();
        return clean.Length == 0 ? null : clean;
    }

    /// <summary>"[mm:ss] text" lines, the transcript format every caller already reads.</summary>
    private static string FormatSegments(IReadOnlyList<YouTubeCaptionSegment> segments, int max)
    {
        var sb = new StringBuilder();
        foreach (var segment in segments.Take(max))
        {
            var ts = TimeSpan.FromSeconds(Math.Max(0, segment.StartSeconds));
            sb.AppendLine($"[{ts:mm\\:ss}] {segment.Text}");
        }
        return sb.ToString().Trim();
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

    private async Task<(string Title, string Description, List<string> Keywords, string? Author, double? DurationSeconds, List<CaptionTrackItem> Tracks, string? ChannelId)>
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
                    clientVersion = "20.10.38",
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
        req.Headers.TryAddWithoutValidation("X-YouTube-Client-Version", "20.10.38");

        using var resp = await _http.SendAsync(req, ct).ConfigureAwait(false);
        resp.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false), cancellationToken: ct).ConfigureAwait(false);
        var root = doc.RootElement;

        string title = string.Empty;
        string description = string.Empty;
        var keywords = new List<string>();
        string? author = null;
        double? durationSeconds = null;
        string? channelId = null;

        if (root.TryGetProperty("videoDetails", out var vd) && vd.ValueKind == JsonValueKind.Object)
        {
            if (vd.TryGetProperty("channelId", out var ch) && ch.ValueKind == JsonValueKind.String
                && YouTubePublishValidator.IsYouTubeChannelId(ch.GetString()))
                channelId = ch.GetString();
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

        return (title, description, keywords, author, durationSeconds, tracks, channelId);
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

    private async Task<IReadOnlyList<YouTubeCaptionSegment>> DownloadCaptionTrackXmlAsync(string baseUrl, CancellationToken ct)
    {
        using var resp = await _http.GetAsync(baseUrl, ct).ConfigureAwait(false);
        if (!resp.IsSuccessStatusCode) return [];

        var xmlText = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(xmlText)) return [];

        var doc = XDocument.Parse(xmlText);
        var segments = new List<YouTubeCaptionSegment>();

        // Format 1: <transcript><text start="1.23" dur="2.5">...</text></transcript>
        foreach (var el in doc.Descendants("text"))
        {
            var raw = WebUtility.HtmlDecode(el.Value).Replace('\n', ' ').Trim();
            if (string.IsNullOrWhiteSpace(raw)) continue;
            double.TryParse(el.Attribute("start")?.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var startSec);
            segments.Add(new YouTubeCaptionSegment(Math.Max(0, startSec), raw));
            if (segments.Count >= MaxSegments) break;
        }

        // Format 2: <timedtext><body><p t="1230" d="2500">...</p></body></timedtext>
        if (segments.Count == 0)
        {
            foreach (var el in doc.Descendants("p"))
            {
                var raw = WebUtility.HtmlDecode(el.Value).Replace('\n', ' ').Trim();
                if (string.IsNullOrWhiteSpace(raw)) continue;
                double.TryParse(el.Attribute("t")?.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var startMs);
                segments.Add(new YouTubeCaptionSegment(Math.Max(0, startMs) / 1000.0, raw));
                if (segments.Count >= MaxSegments) break;
            }
        }

        return segments;
    }

    /// <summary>A WebVTT file's cues as segments, repeated lines (rolling auto-captions) dropped.</summary>
    private static IReadOnlyList<YouTubeCaptionSegment> ParseVttSegments(string vtt)
    {
        if (string.IsNullOrWhiteSpace(vtt)) return [];
        var segments = new List<YouTubeCaptionSegment>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        double? start = null;
        foreach (var line in vtt.Split('\n', StringSplitOptions.TrimEntries))
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("WEBVTT", StringComparison.OrdinalIgnoreCase)
                || line.StartsWith("Kind:", StringComparison.OrdinalIgnoreCase)
                || line.StartsWith("Language:", StringComparison.OrdinalIgnoreCase))
                continue;

            var arrowIdx = line.IndexOf("-->", StringComparison.Ordinal);
            if (arrowIdx > 0)
            {
                start = TimeSpan.TryParse(line[..arrowIdx].Trim(), CultureInfo.InvariantCulture, out var ts) ? ts.TotalSeconds : null;
                continue;
            }

            var cleaned = Regex.Replace(line, @"<[^>]+>", "").Trim();
            if (start is null || string.IsNullOrWhiteSpace(cleaned) || int.TryParse(cleaned, out _) || !seen.Add(cleaned)) continue;
            segments.Add(new YouTubeCaptionSegment(start.Value, cleaned));
            if (segments.Count >= MaxSegments) break;
        }
        return segments;
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

