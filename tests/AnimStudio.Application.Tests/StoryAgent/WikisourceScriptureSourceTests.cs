using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Infrastructure.StoryAgent;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class WikisourceScriptureSourceTests
{
    private const string Bhagavata88Title = "श्रीमद्भागवतपुराणम्/स्कन्धः ८/अध्यायः ८";

    private const string VersesHtml =
        "<div class=\"poem\"><p>श्रीशुक उवाच।<br />\nपीते गरे वृषाङ्केण प्रीतास्तेऽमरदानवाः।<br />\nममन्थुस्तरसा सिन्धुं हविर्धानी ततोऽभवत् १।<br />\n</p></div>";

    private static HttpResponseMessage Json(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private static HttpResponseMessage Page(string title, string html = VersesHtml) =>
        Json(JsonSerializer.Serialize(new { parse = new { title, pageid = 1, text = html } }));

    private static WikisourceScriptureSource Make(
        Func<HttpRequestMessage, HttpResponseMessage> respond, Action<StoryAgentOptions>? configure = null, TimeProvider? clock = null)
    {
        var options = new StoryAgentOptions { Wikisource = { MinIntervalMs = 0 } };
        configure?.Invoke(options);
        return new WikisourceScriptureSource(new StaticOptions(options), clock ?? TimeProvider.System,
            NullLogger<WikisourceScriptureSource>.Instance, new StubHandler(respond));
    }

    [Fact]
    public async Task A_chapter_is_read_as_verses_with_its_place_and_an_address_people_can_open()
    {
        HttpRequestMessage? seen = null;
        using var source = Make(request =>
        {
            seen = request;
            return Page(Bhagavata88Title);
        });

        var passage = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("bhagavata-purana", passage.TextId);
        Assert.Equal("Bhagavata Purana", passage.TextName);
        Assert.Equal("8.8", passage.Ref);
        Assert.Equal(Bhagavata88Title, passage.Title);
        Assert.Equal("sa", passage.Language);
        Assert.True(passage.Direct);
        Assert.Contains("wikisource", passage.License, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(
            "श्रीशुक उवाच।\nपीते गरे वृषाङ्केण प्रीतास्तेऽमरदानवाः।\nममन्थुस्तरसा सिन्धुं हविर्धानी ततोऽभवत् १।",
            passage.Excerpt);

        Assert.StartsWith("https://sa.wikisource.org/wiki/", passage.Url);
        Assert.DoesNotContain(" ", passage.Url);
        Assert.DoesNotContain("%2F", passage.Url);

        Assert.NotNull(seen);
        Assert.Equal(HttpMethod.Get, seen.Method);
        Assert.Equal("sa.wikisource.org", seen.RequestUri!.Host);
        Assert.Equal("https", seen.RequestUri.Scheme);
        var query = Uri.UnescapeDataString(seen.RequestUri.Query);
        Assert.Contains("action=parse", query);
        Assert.Contains("redirects=1", query);
        Assert.Contains($"page={Bhagavata88Title}", query);
    }

    [Fact]
    public async Task Every_request_says_who_is_asking()
    {
        string? agent = null;
        using var source = Make(request =>
        {
            agent = request.Headers.UserAgent.ToString();
            return Page(Bhagavata88Title);
        }, o => o.Wikisource.Contact = "me@example.org");

        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.NotNull(agent);
        Assert.Contains("AnimStudioAI-StoryAgent", agent);
        Assert.Contains("github.com/keshavsingh3197/Keshav-AnimStudio-AI", agent);
        Assert.Contains("me@example.org", agent);
    }

    [Fact]
    public async Task A_contact_cannot_inject_header_lines()
    {
        string? agent = null;
        using var source = Make(request =>
        {
            agent = request.Headers.UserAgent.ToString();
            return Page(Bhagavata88Title);
        }, o => o.Wikisource.Contact = "me@example.org\r\nX-Evil: 1 (x)");

        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.NotNull(agent);
        Assert.DoesNotContain('\r', agent);
        Assert.DoesNotContain('\n', agent);
        Assert.Contains("me@example.org", agent);
    }

    [Fact]
    public async Task A_chapter_is_kept_so_reading_it_again_makes_no_request()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Page(Bhagavata88Title);
        });

        var first = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        var second = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.Equal(1, calls);
        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.NotSame(first, second);
        Assert.Equal(first.Excerpt, second.Excerpt);
    }

    [Fact]
    public async Task Two_verses_of_one_gita_chapter_are_one_page_cited_as_the_chapter()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Page("भगवद्गीता/साङ्ख्ययोगः");
        });

        var a = await source.FetchChapterAsync("bhagavad-gita", 2, 47, CancellationToken.None);
        var b = await source.FetchChapterAsync("bhagavad-gita", 2, 48, CancellationToken.None);

        Assert.Equal(1, calls);
        Assert.Equal("2", a!.Ref);
        Assert.Equal("2", b!.Ref);
        Assert.Equal("Bhagavad Gita", a.TextName);
    }

    [Fact]
    public async Task A_kept_chapter_is_read_again_after_it_expires()
    {
        var calls = 0;
        var clock = new ManualClock();
        using var source = Make(_ =>
        {
            calls++;
            return Page(Bhagavata88Title);
        }, o => o.Wikisource.CacheHours = 24, clock);

        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        clock.Advance(TimeSpan.FromHours(23));
        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        Assert.Equal(1, calls);

        clock.Advance(TimeSpan.FromHours(2));
        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task A_page_the_site_does_not_have_is_null_and_is_not_asked_for_again_soon()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Json("""{"error":{"code":"missingtitle","info":"The page you specified doesn't exist."}}""");
        });

        Assert.Null(await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
        Assert.Null(await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task A_page_with_nothing_readable_on_it_is_null()
    {
        using var source = Make(_ => Page(Bhagavata88Title, "<div class=\"mw-parser-output\"><figure><img src=\"x\" /></figure></div>"));

        Assert.Null(await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
    }

    [Fact]
    public async Task A_text_the_site_does_not_hold_by_name_makes_no_request()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Page("x");
        });

        Assert.Null(await source.FetchChapterAsync("valmiki-ramayana", 1, 1, CancellationToken.None));
        Assert.Null(await source.FetchChapterAsync("bhagavata-purana", 13, 1, CancellationToken.None));
        Assert.Equal(0, calls);
    }

    [Fact]
    public async Task Switched_off_it_makes_no_request_at_all()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Page("x");
        }, o => o.Wikisource.Enabled = false);

        Assert.Null(await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
        Assert.Empty(await source.SearchAsync("दीपावली", 3, CancellationToken.None));
        Assert.Equal(0, calls);
    }

    [Fact]
    public async Task A_long_chapter_is_cut_at_the_end_of_a_line()
    {
        var verses = string.Join(string.Empty, Enumerable.Range(1, 300).Select(i => $"<p>श्लोक संख्या {i} का पाठ यहाँ है</p>"));
        using var source = Make(_ => Page(Bhagavata88Title, verses), o => o.Wikisource.MaxExcerptChars = 1000);

        var passage = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.True(passage.Excerpt.Length <= 1010, $"{passage.Excerpt.Length}");
        Assert.EndsWith("...", passage.Excerpt);
    }

    [Fact]
    public async Task Told_to_slow_down_it_waits_once_and_tries_again()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            if (calls > 1) return Page(Bhagavata88Title);

            var limited = Json("{}", HttpStatusCode.TooManyRequests);
            limited.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.Zero);
            return limited;
        });

        var passage = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task Still_refused_after_waiting_it_says_so_and_stops()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            var limited = Json("{}", HttpStatusCode.TooManyRequests);
            limited.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.Zero);
            return limited;
        });

        var error = await Assert.ThrowsAsync<ScriptureSourceException>(
            () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));

        Assert.Equal("scripture-rate-limited", error.Code);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task A_request_to_wait_longer_than_a_story_run_can_afford_is_not_waited_for()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            var limited = Json("{}", HttpStatusCode.TooManyRequests);
            limited.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromHours(1));
            return limited;
        });

        var error = await Assert.ThrowsAsync<ScriptureSourceException>(
            () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));

        Assert.Equal("scripture-rate-limited", error.Code);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task A_server_error_a_dead_connection_and_a_reply_that_is_not_json_are_each_reported()
    {
        using (var source = Make(_ => Json("oops", HttpStatusCode.InternalServerError)))
        {
            var error = await Assert.ThrowsAsync<ScriptureSourceException>(
                () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
            Assert.Equal("scripture-unavailable", error.Code);
        }

        using (var source = Make(_ => throw new HttpRequestException("no route")))
        {
            var error = await Assert.ThrowsAsync<ScriptureSourceException>(
                () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
            Assert.Equal("scripture-unreachable", error.Code);
        }

        using (var source = Make(_ => Json("<html>not json</html>")))
        {
            var error = await Assert.ThrowsAsync<ScriptureSourceException>(
                () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
            Assert.Equal("scripture-bad-response", error.Code);
        }

        using (var source = Make(_ => Json("""{"unexpected":true}""")))
        {
            var error = await Assert.ThrowsAsync<ScriptureSourceException>(
                () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));
            Assert.Equal("scripture-bad-response", error.Code);
        }
    }

    [Fact]
    public async Task A_redirect_is_not_followed()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            var moved = new HttpResponseMessage(HttpStatusCode.Found);
            moved.Headers.Location = new Uri("http://169.254.169.254/latest/meta-data/");
            return moved;
        });

        var error = await Assert.ThrowsAsync<ScriptureSourceException>(
            () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));

        Assert.Equal("scripture-unavailable", error.Code);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task A_reply_larger_than_the_limit_is_refused()
    {
        var filler = new string('x', 200 * 1024);
        using var source = Make(_ => Page(Bhagavata88Title, $"<p>{filler}</p>"), o => o.Wikisource.MaxResponseKilobytes = 64);

        var error = await Assert.ThrowsAsync<ScriptureSourceException>(
            () => source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None));

        Assert.Equal("scripture-too-large", error.Code);
    }

    [Fact]
    public async Task Requests_are_spaced_by_the_configured_pause()
    {
        using var source = Make(_ => Page(Bhagavata88Title), o => o.Wikisource.MinIntervalMs = 150);

        var watch = System.Diagnostics.Stopwatch.StartNew();
        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        await source.FetchChapterAsync("bhagavata-purana", 8, 9, CancellationToken.None);
        await source.FetchChapterAsync("bhagavata-purana", 8, 10, CancellationToken.None);
        watch.Stop();

        // Two gaps of 150 ms; allow generously for timer rounding.
        Assert.True(watch.ElapsedMilliseconds >= 240, $"{watch.ElapsedMilliseconds} ms");
    }

    [Fact]
    public async Task Requests_never_overlap()
    {
        var running = 0;
        var most = 0;
        using var source = Make(_ =>
        {
            var now = Interlocked.Increment(ref running);
            most = Math.Max(most, now);
            Thread.Sleep(20);
            Interlocked.Decrement(ref running);
            return Page(Bhagavata88Title);
        });

        await Task.WhenAll(Enumerable.Range(1, 6)
            .Select(i => Task.Run(() => source.FetchChapterAsync("bhagavata-purana", 8, i, CancellationToken.None))));

        Assert.Equal(1, most);
    }

    [Fact]
    public async Task Cancelling_while_paused_stops_without_a_request()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Page(Bhagavata88Title);
        }, o => o.Wikisource.MinIntervalMs = 5000);

        await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        using var cancel = new CancellationTokenSource(TimeSpan.FromMilliseconds(100));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => source.FetchChapterAsync("bhagavata-purana", 8, 9, cancel.Token));

        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task A_search_reads_each_good_hit_and_labels_the_pages_it_knows()
    {
        var requests = new List<string>();
        using var source = Make(request =>
        {
            var query = Uri.UnescapeDataString(request.RequestUri!.Query);
            requests.Add(query);

            if (query.Contains("list=search"))
            {
                return Json(JsonSerializer.Serialize(new
                {
                    query = new
                    {
                        search = new object[]
                        {
                            new { ns = 0, title = "सूचिका", size = 120 },
                            new { ns = 0, title = Bhagavata88Title, size = 9000 },
                            new { ns = 0, title = "अन्यग्रन्थः/अध्यायः १", size = 5000 },
                            new { ns = 0, title = "तृतीयग्रन्थः", size = 5000 }
                        }
                    }
                }));
            }

            return Page(query.Contains("अन्यग्रन्थः") ? "अन्यग्रन्थः/अध्यायः १" : Bhagavata88Title);
        });

        var found = await source.SearchAsync("दीपावली", 2, CancellationToken.None);

        Assert.Equal(2, found.Count);
        Assert.Equal(("bhagavata-purana", "8.8"), (found[0].TextId, found[0].Ref));
        Assert.Equal("Bhagavata Purana", found[0].TextName);
        Assert.False(found[0].Direct);

        Assert.Equal(string.Empty, found[1].TextId);
        Assert.Equal(string.Empty, found[1].Ref);
        Assert.Equal("अन्यग्रन्थः", found[1].TextName);
        Assert.False(found[1].Direct);

        Assert.Equal(3, requests.Count);
        Assert.Contains("srsearch=दीपावली", requests[0]);
        Assert.Contains("srnamespace=0", requests[0]);
    }

    [Fact]
    public async Task A_search_with_no_words_or_no_hits_finds_nothing_without_failing()
    {
        var calls = 0;
        using var source = Make(_ =>
        {
            calls++;
            return Json("""{"query":{"search":[]}}""");
        });

        Assert.Empty(await source.SearchAsync("   ", 3, CancellationToken.None));
        Assert.Empty(await source.SearchAsync("दीपावली", 0, CancellationToken.None));
        Assert.Equal(0, calls);

        Assert.Empty(await source.SearchAsync("दीपावली", 3, CancellationToken.None));
        Assert.Equal(1, calls);

        using var odd = Make(_ => Json("""{"query":{}}"""));
        Assert.Empty(await odd.SearchAsync("दीपावली", 3, CancellationToken.None));
    }

    private sealed class StaticOptions(StoryAgentOptions value) : IOptionsMonitor<StoryAgentOptions>
    {
        public StoryAgentOptions CurrentValue => value;
        public StoryAgentOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<StoryAgentOptions, string?> listener) => null;
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(respond(request));
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 11, 2, 9, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => _now;
        public void Advance(TimeSpan by) => _now += by;
    }
}
