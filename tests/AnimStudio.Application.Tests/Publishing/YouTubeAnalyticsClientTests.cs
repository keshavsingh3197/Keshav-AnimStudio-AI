using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Publishing;

public class YouTubeAnalyticsClientTests
{
    [Fact]
    public void Video_totals_are_read_by_column_name()
    {
        using var doc = JsonDocument.Parse("""
            {"columnHeaders":[{"name":"video"},{"name":"views"},{"name":"estimatedMinutesWatched"},{"name":"averageViewDuration"},
                              {"name":"averageViewPercentage"},{"name":"subscribersGained"},{"name":"subscribersLost"},{"name":"shares"}],
             "rows":[["abcdefghijk",1200,340.5,17,88.46,25,3,9],["not-an-id",1,1,1,1,1,1,1],["zyxwvutsrqp","x",-4,0,0,0,0,0]]}
            """);

        var totals = YouTubeAnalyticsClient.ParseVideoTotals(doc.RootElement);

        Assert.Equal(2, totals.Count);
        var a = totals["abcdefghijk"];
        Assert.Equal(340.5, a.WatchMinutes);
        Assert.Equal(17, a.AverageViewSeconds);
        Assert.Equal(88.5, a.AverageViewPercent);
        Assert.Equal(25, a.SubscribersGained);
        Assert.Equal(3, a.SubscribersLost);
        Assert.Equal(9, a.Shares);
        // Text and negative numbers are unknown, read as zero.
        Assert.Equal(0, totals["zyxwvutsrqp"].WatchMinutes);
    }

    [Fact]
    public void Daily_rows_come_back_oldest_first_and_bad_days_are_skipped()
    {
        using var doc = JsonDocument.Parse("""
            {"columnHeaders":[{"name":"day"},{"name":"views"},{"name":"estimatedMinutesWatched"},{"name":"subscribersGained"},{"name":"subscribersLost"}],
             "rows":[["2026-11-02",50,10,2,0],["yesterday",1,1,1,1],["2026-11-01",40,8,1,1]]}
            """);

        var days = YouTubeAnalyticsClient.ParseDaily(doc.RootElement);

        Assert.Equal([new DateTime(2026, 11, 1), new DateTime(2026, 11, 2)], days.Select(d => d.Day));
        Assert.Equal(DateTimeKind.Utc, days[0].Day.Kind);
        Assert.Equal(2, days[1].SubscribersGained);
    }

    [Fact]
    public void No_rows_means_nothing()
    {
        using var doc = JsonDocument.Parse("""{"columnHeaders":[{"name":"day"}]}""");
        Assert.Empty(YouTubeAnalyticsClient.ParseDaily(doc.RootElement));
    }

    [Theory]
    [InlineData("accessNotConfigured", "analytics-not-enabled")]
    [InlineData("insufficientPermissions", "analytics-permission")]
    [InlineData("quotaExceeded", "analytics-quota")]
    public async Task A_refusal_becomes_a_safe_message_and_never_googles_text(string reason, string code)
    {
        var body = """{"error":{"code":403,"message":"secret internal detail","errors":[{"reason":"REASON"}]}}""".Replace("REASON", reason, StringComparison.Ordinal);
        using var client = new YouTubeAnalyticsClient(NullLogger<YouTubeAnalyticsClient>.Instance, new Answer(HttpStatusCode.Forbidden, body));

        var ex = await Assert.ThrowsAsync<YouTubePublishException>(() =>
            client.GetDailyAsync(null, new DateOnly(2026, 10, 1), new DateOnly(2026, 11, 1), "token", CancellationToken.None));

        Assert.Equal(code, ex.Code);
        Assert.DoesNotContain("secret", ex.Message);
    }

    [Fact]
    public async Task The_request_asks_for_the_owner_channel_and_filters_one_video()
    {
        var answer = new Answer(HttpStatusCode.OK, """{"columnHeaders":[],"rows":[]}""");
        using var client = new YouTubeAnalyticsClient(NullLogger<YouTubeAnalyticsClient>.Instance, answer);

        await client.GetDailyAsync("abcdefghijk", new DateOnly(2026, 10, 1), new DateOnly(2026, 11, 1), "token", CancellationToken.None);

        var url = answer.Seen!.ToString();
        Assert.StartsWith("https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3DMINE&startDate=2026-10-01&endDate=2026-11-01", url);
        Assert.Contains("filters=video%3D%3Dabcdefghijk", url);
        Assert.Equal("Bearer", answer.Auth);
    }

    [Fact]
    public async Task Ids_that_are_not_video_ids_are_refused_before_any_call()
    {
        using var client = new YouTubeAnalyticsClient(NullLogger<YouTubeAnalyticsClient>.Instance, new Answer(HttpStatusCode.OK, "{}"));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            client.GetVideoTotalsAsync(["abc,def;ghi"], new DateOnly(2026, 1, 1), new DateOnly(2026, 2, 1), "token", CancellationToken.None));
    }

    private sealed class Answer(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public Uri? Seen { get; private set; }
        public string? Auth { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Seen = request.RequestUri;
            Auth = request.Headers.Authorization?.Scheme;
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
        }
    }
}
