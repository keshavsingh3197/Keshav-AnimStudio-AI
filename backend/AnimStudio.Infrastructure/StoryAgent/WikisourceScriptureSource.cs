using System.Collections.Concurrent;
using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Security.Authentication;
using System.Text.Json;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Reads the Granths from sa.wikisource.org through its public API.
/// <para>
/// It is a guest on a shared, volunteer-run site, so it behaves like one: one request at a time with
/// a pause between them (a burst is answered with HTTP 429), a User-Agent that says who is asking,
/// a wait for <c>Retry-After</c> when told to slow down, and every page kept for a day. The host is
/// fixed in code and nothing in a response is followed anywhere, so a reply can never point this
/// server at another address.
/// </para>
/// </summary>
public sealed class WikisourceScriptureSource : IScriptureSource, IDisposable
{
    public const string SourceId = "wikisource";
    public const string License = "Wikisource (sa.wikisource.org), CC BY-SA 4.0";

    private const string ProjectUrl = "https://github.com/keshavsingh3197/Keshav-AnimStudio-AI";
    private const int MaxRetryAfterSeconds = 20;
    private const int MaxCachedPages = 200;

    /// <summary>A page smaller than this is a redirect, an index or a stub; there is nothing in it to read.</summary>
    private const int MinHitBytes = 400;

    private const int MinReadableChars = 40;

    private readonly IOptionsMonitor<StoryAgentOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<WikisourceScriptureSource> _logger;
    private readonly HttpClient _http;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly ConcurrentDictionary<string, CachedPage> _pages = new(StringComparer.Ordinal);
    private long? _lastRequestAt;

    private sealed record CachedPage(DateTime Expires, WikiPage? Page);

    private sealed record WikiPage(string Title, string Text);

    public WikisourceScriptureSource(IOptionsMonitor<StoryAgentOptions> options, TimeProvider clock, ILogger<WikisourceScriptureSource> logger)
        : this(options, clock, logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public WikisourceScriptureSource(IOptionsMonitor<StoryAgentOptions> options, TimeProvider clock,
        ILogger<WikisourceScriptureSource> logger, HttpMessageHandler? handler)
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
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    public string Id => SourceId;

    private WikisourceOptions Current => _options.CurrentValue.Wikisource;

    public async Task<ScripturePassage?> FetchChapterAsync(string textId, int division, int unit, CancellationToken ct)
    {
        if (!Current.Enabled) return null;

        var title = WikisourceTitleMap.TitleFor(textId, division, unit);
        if (title is null) return null;

        var page = await ReadPageAsync(title, ct).ConfigureAwait(false);
        if (page is null) return null;

        // A Gita page holds the whole chapter, so it is cited as the chapter; elsewhere it is chapter and unit.
        var reference = textId == "bhagavad-gita"
            ? division.ToString(CultureInfo.InvariantCulture)
            : $"{division.ToString(CultureInfo.InvariantCulture)}.{unit.ToString(CultureInfo.InvariantCulture)}";

        return new ScripturePassage
        {
            TextId = textId,
            TextName = GranthCatalog.Get(textId)?.English ?? textId,
            Ref = reference,
            Title = page.Title,
            Language = "sa",
            Url = WikiUrl(page.Title),
            Excerpt = page.Text,
            Direct = true,
            License = License
        };
    }

    public async Task<IReadOnlyList<ScripturePassage>> SearchAsync(string query, int max, CancellationToken ct)
    {
        var words = query?.Trim() ?? string.Empty;
        if (!Current.Enabled || max <= 0 || words.Length == 0) return [];
        if (words.Length > 100) words = words[..100];

        var limit = Math.Clamp(max * 2, 2, 10);
        var uri = new Uri(
            $"https://{WikisourceTitleMap.Host}/w/api.php?action=query&format=json&formatversion=2&list=search"
            + $"&srnamespace=0&srprop=size&srlimit={limit.ToString(CultureInfo.InvariantCulture)}&srsearch={Uri.EscapeDataString(words)}");

        var found = new List<string>();
        using (var document = await GetAsync(uri, ct).ConfigureAwait(false))
        {
            try
            {
                if (document.RootElement.TryGetProperty("query", out var queryElement)
                    && queryElement.TryGetProperty("search", out var results)
                    && results.ValueKind == JsonValueKind.Array)
                {
                    foreach (var hit in results.EnumerateArray())
                    {
                        var title = hit.TryGetProperty("title", out var t) ? t.GetString() : null;
                        var size = hit.TryGetProperty("size", out var s) && s.TryGetInt32(out var bytes) ? bytes : int.MaxValue;
                        if (!string.IsNullOrWhiteSpace(title) && size >= MinHitBytes) found.Add(title);
                    }
                }
            }
            catch (InvalidOperationException)
            {
                throw new ScriptureSourceException("scripture-bad-response", "The text source sent a search reply that could not be read.");
            }
        }

        var passages = new List<ScripturePassage>();
        foreach (var title in found)
        {
            if (passages.Count >= max) break;

            var page = await ReadPageAsync(title, ct).ConfigureAwait(false);
            if (page is null || passages.Any(p => p.Title == page.Title)) continue;

            var described = WikisourceTitleMap.Describe(page.Title);
            var text = described is null ? null : GranthCatalog.Get(described.Value.TextId);
            passages.Add(new ScripturePassage
            {
                TextId = described?.TextId ?? string.Empty,
                TextName = text?.English ?? page.Title.Split('/')[0],
                Ref = described?.Ref ?? string.Empty,
                Title = page.Title,
                Language = "sa",
                Url = WikiUrl(page.Title),
                Excerpt = page.Text,
                Direct = false,
                License = License
            });
        }

        return passages;
    }

    private async Task<WikiPage?> ReadPageAsync(string title, CancellationToken ct)
    {
        var now = _clock.GetUtcNow().UtcDateTime;
        if (_pages.TryGetValue(title, out var cached) && cached.Expires > now) return cached.Page;

        var uri = new Uri(
            $"https://{WikisourceTitleMap.Host}/w/api.php?action=parse&format=json&formatversion=2&prop=text"
            + $"&disablelimitreport=1&disableeditsection=1&redirects=1&page={Uri.EscapeDataString(title)}");

        WikiPage? page;
        using (var document = await GetAsync(uri, ct).ConfigureAwait(false))
        {
            var root = document.RootElement;
            try
            {
                if (root.TryGetProperty("error", out var error))
                {
                    var code = error.TryGetProperty("code", out var c) ? c.GetString() : null;
                    if (code != "missingtitle")
                        throw new ScriptureSourceException("scripture-bad-response", "The text source refused that page.");
                    page = null;
                }
                else if (root.TryGetProperty("parse", out var parse)
                    && parse.TryGetProperty("text", out var html) && html.ValueKind == JsonValueKind.String)
                {
                    var resolved = parse.TryGetProperty("title", out var t) ? t.GetString() : null;
                    var text = WikisourceHtml.Truncate(WikisourceHtml.ToText(html.GetString()), Math.Clamp(Current.MaxExcerptChars, 500, 100_000));
                    page = text.Length >= MinReadableChars ? new WikiPage(string.IsNullOrWhiteSpace(resolved) ? title : resolved, text) : null;
                }
                else
                {
                    throw new ScriptureSourceException("scripture-bad-response", "The text source sent a page that could not be read.");
                }
            }
            catch (InvalidOperationException)
            {
                throw new ScriptureSourceException("scripture-bad-response", "The text source sent a page that could not be read.");
            }
        }

        Remember(title, page, now);
        return page;
    }

    private void Remember(string title, WikiPage? page, DateTime now)
    {
        if (_pages.Count >= MaxCachedPages)
        {
            foreach (var (key, value) in _pages)
                if (value.Expires <= now) _pages.TryRemove(key, out _);
            if (_pages.Count >= MaxCachedPages) _pages.Clear();
        }

        // A page the site does not have is remembered too, but not for long: it may be added.
        var keep = page is null ? TimeSpan.FromHours(1) : TimeSpan.FromHours(Math.Clamp(Current.CacheHours, 0, 168));
        _pages[title] = new CachedPage(now + keep, page);
    }

    /// <summary>One GET, serial with every other and paced; waits once for Retry-After when told to slow down.</summary>
    private async Task<JsonDocument> GetAsync(Uri uri, CancellationToken ct)
    {
        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            for (var attempt = 0; ; attempt++)
            {
                await PauseAsync(ct).ConfigureAwait(false);

                HttpResponseMessage response;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Get, uri);
                    request.Headers.TryAddWithoutValidation("User-Agent", UserAgent());
                    request.Headers.TryAddWithoutValidation("Accept", "application/json");
                    response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
                {
                    _lastRequestAt = Stopwatch.GetTimestamp();
                    _logger.LogWarning("The text source could not be reached: {ErrorType}", ex.GetType().Name);
                    throw new ScriptureSourceException("scripture-unreachable",
                        "The text source could not be reached. Check the server's internet connection.");
                }

                using (response)
                {
                    _lastRequestAt = Stopwatch.GetTimestamp();

                    if (response.StatusCode == HttpStatusCode.OK)
                        return await ReadJsonAsync(response, ct).ConfigureAwait(false);

                    var slowDown = response.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable;
                    if (slowDown && attempt == 0 && RetryAfter(response) is { } wait && wait <= TimeSpan.FromSeconds(MaxRetryAfterSeconds))
                    {
                        _logger.LogInformation("The text source asked for a pause of {Seconds:0.#}s", wait.TotalSeconds);
                        if (wait > TimeSpan.Zero) await Task.Delay(wait, ct).ConfigureAwait(false);
                        continue;
                    }

                    _logger.LogWarning("The text source answered {Status}", (int)response.StatusCode);
                    throw slowDown
                        ? new ScriptureSourceException("scripture-rate-limited", "The text source is asking readers to slow down. Try again in a few minutes.")
                        : new ScriptureSourceException("scripture-unavailable", "The text source did not answer properly.");
                }
            }
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task PauseAsync(CancellationToken ct)
    {
        if (_lastRequestAt is not { } last) return;

        var interval = TimeSpan.FromMilliseconds(Math.Clamp(Current.MinIntervalMs, 0, 10_000));
        var wait = interval - Stopwatch.GetElapsedTime(last);
        if (wait > TimeSpan.Zero) await Task.Delay(wait, ct).ConfigureAwait(false);
    }

    private async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var limit = Math.Clamp(Current.MaxResponseKilobytes, 64, 32_768) * 1024L;
        if (response.Content.Headers.ContentLength > limit)
            throw new ScriptureSourceException("scripture-too-large", "The text source sent more than this tool will read.");

        await using var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        using var buffer = new MemoryStream();
        var chunk = new byte[16 * 1024];
        int read;
        while ((read = await stream.ReadAsync(chunk, ct).ConfigureAwait(false)) > 0)
        {
            if (buffer.Length + read > limit)
                throw new ScriptureSourceException("scripture-too-large", "The text source sent more than this tool will read.");
            buffer.Write(chunk, 0, read);
        }

        buffer.Position = 0;
        try
        {
            return await JsonDocument.ParseAsync(buffer, cancellationToken: ct).ConfigureAwait(false);
        }
        catch (JsonException)
        {
            throw new ScriptureSourceException("scripture-bad-response", "The text source sent a reply that could not be read.");
        }
    }

    private static TimeSpan? RetryAfter(HttpResponseMessage response)
    {
        var header = response.Headers.RetryAfter;
        if (header?.Delta is { } delta) return delta < TimeSpan.Zero ? TimeSpan.Zero : delta;
        if (header?.Date is { } date)
        {
            var wait = date - DateTimeOffset.UtcNow;
            return wait < TimeSpan.Zero ? TimeSpan.Zero : wait;
        }

        // No hint: a short pause is the polite default.
        return response.StatusCode == HttpStatusCode.TooManyRequests ? TimeSpan.FromSeconds(5) : null;
    }

    private string UserAgent()
    {
        var contact = Current.Contact;
        var safe = contact is null
            ? string.Empty
            : string.Concat(contact.Where(c => c >= ' ' && c < '\u007F' && c != '(' && c != ')').Take(100)).Trim();
        return safe.Length == 0
            ? $"AnimStudioAI-StoryAgent/1.0 (+{ProjectUrl})"
            : $"AnimStudioAI-StoryAgent/1.0 (+{ProjectUrl}; {safe})";
    }

    /// <summary>The address of a page for people, with the slashes in a title left as slashes.</summary>
    public static string WikiUrl(string title) =>
        $"https://{WikisourceTitleMap.Host}/wiki/"
        + string.Join('/', title.Replace(' ', '_').Split('/').Select(Uri.EscapeDataString));

    public void Dispose()
    {
        _http.Dispose();
        _gate.Dispose();
    }
}
