using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Music;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Music;

/// <summary>
/// Searches Jamendo (api.jamendo.com/v3.0), a catalogue of Creative Commons music with
/// weekly and all-time popularity rankings, and downloads tracks its artists allow to be
/// downloaded.
/// <para>
/// The API host is fixed and every URL in a response is kept only if it is HTTPS on a
/// jamendo.com host. Redirects are followed by hand, one hop at a time, under the same rule,
/// so a response can never send this server anywhere else. The client id travels in the
/// query string as Jamendo requires, so request URLs are never logged.
/// </para>
/// </summary>
public sealed class JamendoMusicCatalog : IMusicCatalog, IDisposable
{
    public const string Provider = "jamendo";
    private const string TracksUrl = "https://api.jamendo.com/v3.0/tracks/";
    private const int MaxRedirects = 3;
    private const int MaxTextLength = 200;
    private const int MaxCachedPages = 200;

    private readonly IOptionsMonitor<MusicLibraryOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<JamendoMusicCatalog> _logger;
    private readonly HttpClient _http;
    private readonly ConcurrentDictionary<string, (DateTime Expires, MusicSearchPage Page)> _cache = new(StringComparer.Ordinal);

    public JamendoMusicCatalog(IOptionsMonitor<MusicLibraryOptions> options, TimeProvider clock, ILogger<JamendoMusicCatalog> logger)
        : this(options, clock, logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no automatic redirects.</summary>
    public JamendoMusicCatalog(IOptionsMonitor<MusicLibraryOptions> options, TimeProvider clock, ILogger<JamendoMusicCatalog> logger,
        HttpMessageHandler? handler)
    {
        _options = options;
        _clock = clock;
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            AutomaticDecompression = DecompressionMethods.All,
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(60)
        };
    }

    public string ProviderId => Provider;

    public bool IsConfigured => _options.CurrentValue.IsConfigured;

    public async Task<MusicSearchPage> SearchAsync(MusicSearchQuery query, CancellationToken ct)
    {
        var parameters = new List<KeyValuePair<string, string>>
        {
            new("limit", MusicFilters.PageSize.ToString(CultureInfo.InvariantCulture)),
            new("offset", ((query.Page - 1) * MusicFilters.PageSize).ToString(CultureInfo.InvariantCulture)),
            new("order", query.Sort switch
            {
                MusicSort.PopularMonth => "popularity_month",
                MusicSort.Top => "popularity_total",
                MusicSort.Newest => "releasedate_desc",
                MusicSort.BestMatch => "relevance",
                _ => "popularity_week"
            }),
            // No-derivatives music can't be set to video, so it is never worth a result slot.
            new("ccnd", "false")
        };
        if (!query.IncludeNonCommercial) parameters.Add(new("ccnc", "false"));
        if (query.Text is { } text) parameters.Add(new("search", text));
        if (query.Genre is { } genre) parameters.Add(new("tags", genre));
        if (query.Mood is { } mood) parameters.Add(new("fuzzytags", mood));
        if (query.Tempo is { } tempo) parameters.Add(new("speed", tempo));
        if (query.InstrumentalOnly) parameters.Add(new("vocalinstrumental", "instrumental"));
        if (query.MinSeconds is not null || query.MaxSeconds is not null)
            parameters.Add(new("durationbetween", $"{query.MinSeconds ?? 0}_{query.MaxSeconds ?? 3600}"));

        var cacheKey = string.Join('&', parameters.Select(p => $"{p.Key}={p.Value}"));
        var now = _clock.GetUtcNow().UtcDateTime;
        if (_cache.TryGetValue(cacheKey, out var cached) && cached.Expires > now) return cached.Page;

        using var document = await GetTracksAsync(parameters, ct).ConfigureAwait(false);
        var tracks = ParseTracks(document.RootElement);
        var page = new MusicSearchPage(tracks, query.Page,
            tracks.Count == MusicFilters.PageSize && query.Page < MusicFilters.MaxPage);

        if (_cache.Count >= MaxCachedPages)
        {
            foreach (var (key, value) in _cache)
                if (value.Expires <= now) _cache.TryRemove(key, out _);
            if (_cache.Count >= MaxCachedPages) _cache.Clear();
        }
        _cache[cacheKey] = (now.AddMinutes(Math.Clamp(_options.CurrentValue.CacheMinutes, 0, 60)), page);
        return page;
    }

    public async Task<MusicTrack?> GetAsync(string trackId, CancellationToken ct)
    {
        if (!IsTrackId(trackId)) return null;
        using var document = await GetTracksAsync([new("id", trackId)], ct).ConfigureAwait(false);
        return ParseTracks(document.RootElement).FirstOrDefault(t => t.Id == trackId);
    }

    public async Task<byte[]> DownloadAsync(MusicTrack track, long maxBytes, CancellationToken ct)
    {
        if (track.DownloadUrl is null || ToJamendoUrl(track.DownloadUrl) is not { } url)
            throw new MusicCatalogException("music-not-downloadable", "The artist doesn't allow this track to be downloaded.");

        for (var hop = 0; ; hop++)
        {
            using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Get, url), HttpCompletionOption.ResponseHeadersRead, ct)
                .ConfigureAwait(false);

            if (IsRedirect(response.StatusCode))
            {
                var next = response.Headers.Location is { } location ? new Uri(url, location) : null;
                if (hop >= MaxRedirects || next is null || ToJamendoUrl(next.ToString()) is not { } allowed)
                {
                    _logger.LogWarning("Jamendo download for track {TrackId} redirected somewhere it may not go", track.Id);
                    throw new MusicCatalogException("music-download-failed", "The track couldn't be downloaded. Try another one.");
                }
                url = allowed;
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Jamendo download for track {TrackId} answered {Status}", track.Id, (int)response.StatusCode);
                throw new MusicCatalogException("music-download-failed", "The track couldn't be downloaded. Try another one.");
            }

            if (response.Content.Headers.ContentLength > maxBytes)
                throw new MusicCatalogException("music-too-large", "That track is too large to add. Pick a shorter one.");

            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var buffer = new MemoryStream();
            var chunk = new byte[81920];
            int read;
            while ((read = await body.ReadAsync(chunk, ct).ConfigureAwait(false)) > 0)
            {
                // The header can lie or be absent; the count can't.
                if (buffer.Length + read > maxBytes)
                    throw new MusicCatalogException("music-too-large", "That track is too large to add. Pick a shorter one.");
                buffer.Write(chunk, 0, read);
            }
            return buffer.ToArray();
        }
    }

    private async Task<JsonDocument> GetTracksAsync(IEnumerable<KeyValuePair<string, string>> filters, CancellationToken ct)
    {
        var options = _options.CurrentValue;
        if (!options.IsConfigured)
            throw new MusicCatalogException("music-not-configured",
                "Music search isn't set up on this server. Ask an admin to set Music:JamendoClientId.");

        var query = new List<KeyValuePair<string, string>>
        {
            new("client_id", options.JamendoClientId!.Trim()),
            new("format", "json"),
            new("include", "musicinfo licenses"),
            new("audioformat", "mp32"),
            new("imagesize", "200")
        };
        query.AddRange(filters);
        var url = TracksUrl + "?" + string.Join('&', query.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));

        using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Get, url), HttpCompletionOption.ResponseContentRead, ct)
            .ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Jamendo tracks search answered {Status}", (int)response.StatusCode);
            throw new MusicCatalogException("music-search-failed", "The music catalogue didn't answer. Try again in a moment.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        JsonDocument document;
        try
        {
            document = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);
        }
        catch (JsonException)
        {
            _logger.LogWarning("Jamendo answered with a body that isn't JSON");
            throw new MusicCatalogException("music-search-failed", "The music catalogue didn't answer. Try again in a moment.");
        }

        // Jamendo reports errors (a bad client id among them) as 200 with a non-zero code.
        var root = document.RootElement;
        if (root.TryGetProperty("headers", out var headers) && headers.TryGetProperty("code", out var code)
            && code.TryGetInt32(out var value) && value != 0)
        {
            document.Dispose();
            _logger.LogWarning("Jamendo refused a tracks request with code {Code}", value);
            throw value is 4 or 5
                ? new MusicCatalogException("music-not-configured", "The server's Jamendo client id was refused. Ask an admin to check Music:JamendoClientId.")
                : new MusicCatalogException("music-search-failed", "The music catalogue didn't answer. Try again in a moment.");
        }
        return document;
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, HttpCompletionOption completion, CancellationToken ct)
    {
        using (request)
        {
            try
            {
                return await _http.SendAsync(request, completion, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                _logger.LogWarning("Jamendo could not be reached: {ErrorType}", ex.GetType().Name);
                throw new MusicCatalogException("music-unreachable", "The music catalogue couldn't be reached. Check the server's internet connection.");
            }
        }
    }

    /// <summary>Tracks from a <c>/tracks</c> response. Public for tests; untrusted fields are bounded and URLs vetted.</summary>
    public static IReadOnlyList<MusicTrack> ParseTracks(JsonElement root)
    {
        if (!root.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array) return [];

        var tracks = new List<MusicTrack>();
        foreach (var item in results.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            var id = Text(item, "id");
            if (id is null || !IsTrackId(id)) continue;

            item.TryGetProperty("musicinfo", out var info);
            JsonElement tags = default;
            if (info.ValueKind == JsonValueKind.Object) info.TryGetProperty("tags", out tags);

            var downloadAllowed = item.TryGetProperty("audiodownload_allowed", out var allowed) && allowed.ValueKind == JsonValueKind.True;
            tracks.Add(new MusicTrack(
                Provider,
                id,
                Text(item, "name") ?? "Untitled",
                Text(item, "artist_name") ?? "Unknown artist",
                item.TryGetProperty("duration", out var d) && d.TryGetDouble(out var seconds) ? Math.Max(0, seconds) : 0,
                ToJamendoUrl(Text(item, "album_image") ?? Text(item, "image"))?.ToString(),
                ToJamendoUrl(Text(item, "audio"))?.ToString(),
                ToJamendoUrl(Text(item, "shareurl"))?.ToString(),
                MusicLicensing.Parse(Text(item, "license_ccurl")),
                Words(tags, "genres"),
                Words(tags, "vartags"),
                Words(tags, "instruments"),
                info.ValueKind == JsonValueKind.Object && Text(info, "vocalinstrumental") == "instrumental",
                info.ValueKind == JsonValueKind.Object ? MusicFilters.Tempos.FirstOrDefault(t => t.Id == Text(info, "speed"))?.Id : null,
                Text(item, "releasedate") is { Length: 10 } date && DateOnly.TryParseExact(date, "yyyy-MM-dd", out _) ? date : null,
                downloadAllowed ? ToJamendoUrl(Text(item, "audiodownload"))?.ToString() : null));
        }
        return tracks;
    }

    /// <summary>The URL if it is HTTPS on jamendo.com or one of its subdomains; otherwise null.</summary>
    public static Uri? ToJamendoUrl(string? value)
    {
        if (value is null || value.Length > 1000 || !Uri.TryCreate(value, UriKind.Absolute, out var uri)) return null;
        if (uri.Scheme != Uri.UriSchemeHttps || !uri.IsDefaultPort || !string.IsNullOrEmpty(uri.UserInfo)) return null;
        var host = uri.IdnHost.ToLowerInvariant();
        return host == "jamendo.com" || host.EndsWith(".jamendo.com", StringComparison.Ordinal) ? uri : null;
    }

    public static bool IsTrackId(string? value) => value is { Length: > 0 and <= 12 } && value.All(char.IsAsciiDigit);

    private static bool IsRedirect(HttpStatusCode status) =>
        status is HttpStatusCode.MovedPermanently or HttpStatusCode.Found or HttpStatusCode.SeeOther
            or HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect;

    private static string? Text(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var value)) return null;
        var text = value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            _ => null
        };
        if (string.IsNullOrWhiteSpace(text)) return null;
        text = new string([.. text.Trim().Where(c => !char.IsControl(c))]);
        return text.Length <= MaxTextLength ? text : text[..MaxTextLength];
    }

    private static IReadOnlyList<string> Words(JsonElement tags, string name)
    {
        if (tags.ValueKind != JsonValueKind.Object || !tags.TryGetProperty(name, out var list) || list.ValueKind != JsonValueKind.Array)
            return [];
        return [.. list.EnumerateArray()
            .Where(w => w.ValueKind == JsonValueKind.String)
            .Select(w => w.GetString()!.Trim())
            .Where(w => w.Length is > 0 and <= 40 && w.All(c => char.IsLetterOrDigit(c) || c is ' ' or '-' or '_'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)];
    }

    public void Dispose() => _http.Dispose();
}
