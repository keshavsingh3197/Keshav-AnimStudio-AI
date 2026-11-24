using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
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

    [Fact]
    public void Channel_refresh_unlocks_shortly_after_analytics_error_instead_of_30_minute_lockout()
    {
        var fetched = new DateTime(2026, 11, 20, 6, 27, 9, DateTimeKind.Utc);
        var channel = new YouTubeConnectionStatus(
            "UC1234567890123456789012", "OMKAR SHIV Bhakti", "@omkar", null,
            fetched.AddDays(-5), null, false, CanComment: true, CanReadAnalytics: true);

        var errored = new YouTubeChannelAnalysis
        {
            ChannelId = channel.ChannelId,
            FetchedAtUtc = fetched,
            UpdatedAtUtc = fetched,
            FetchError = null,
            AnalyticsError = "The YouTube Analytics API isn't switched on for this server's Google project.",
            AnalyticsFetchedAtUtc = null
        };

        var retryAt = YouTubeChannelAnalysisService.ComputeNextRefreshAtUtc(channel, errored);
        Assert.Equal(fetched + YouTubeChannelAnalysisService.AnalyticsRetryCooldown, retryAt);
        Assert.True(YouTubeChannelAnalysisService.NeedsAnalyticsRetry(channel, errored));

        errored.AnalyticsError = null;
        errored.AnalyticsFetchedAtUtc = fetched.AddMinutes(1);
        var settledAt = YouTubeChannelAnalysisService.ComputeNextRefreshAtUtc(channel, errored);
        Assert.Equal(fetched + YouTubeChannelAnalysisService.MinRefresh, settledAt);
        Assert.False(YouTubeChannelAnalysisService.NeedsAnalyticsRetry(channel, errored));
    }

    [Fact]
    public async Task ContentType_breakdown_separates_YPP_eligible_long_form_and_live_watch_minutes_from_Shorts()
    {
        const string body = """
            {
              "columnHeaders": [
                { "name": "creatorContentType" },
                { "name": "views" },
                { "name": "estimatedMinutesWatched" }
              ],
              "rows": [
                [ "VIDEO_ON_DEMAND", 12400, 18600.5 ],
                [ "LIVE_STREAM", 1500, 2400.0 ],
                [ "SHORTS", 210000, 44250.0 ]
              ]
            }
            """;
        var answer = new Answer(HttpStatusCode.OK, body);
        using var client = new YouTubeAnalyticsClient(NullLogger<YouTubeAnalyticsClient>.Instance, answer);

        var breakdown = await client.GetWatchTimeByContentTypeAsync(
            new DateOnly(2025, 11, 24), new DateOnly(2026, 11, 23), "token", CancellationToken.None);

        Assert.Contains("dimensions=creatorContentType", answer.Seen!.ToString());
        Assert.Equal(21000.5, breakdown.LongFormWatchMinutes);
        Assert.Equal(2400.0, breakdown.LiveStreamWatchMinutes);
        Assert.Equal(44250.0, breakdown.ShortsWatchMinutes);
        Assert.Equal(65250.5, breakdown.TotalWatchMinutes);
        Assert.Equal(13900, breakdown.LongFormViews);
        Assert.Equal(210000, breakdown.ShortsViews);
        Assert.Equal("creatorContentType", breakdown.Source);
        Assert.Equal(365, breakdown.WindowDays);
    }

    [Fact]
    public void EstimateWatchTimeBreakdown_separates_long_videos_from_Shorts_when_contentType_report_absent()
    {
        var analysis = new YouTubeChannelAnalysis
        {
            ChannelId = "UChEkPFnexqQTL0aPqcmwlMw",
            ChannelTitle = "OMKAR SHIV Bhakti",
            Videos =
            [
                new YouTubeAnalyzedVideo { VideoId = "long1234567", DurationSeconds = 220, Views = 1400, Analytics = new YouTubeVideoAnalytics { WatchMinutes = 636.0 } },
                new YouTubeAnalyzedVideo { VideoId = "shrt1234567", DurationSeconds = 58, Views = 45000, Analytics = new YouTubeVideoAnalytics { WatchMinutes = 2286.0 } }
            ],
            Daily =
            [
                new YouTubeDailyPoint { Day = new DateTime(2026, 11, 22, 0, 0, 0, DateTimeKind.Utc), Views = 50000, WatchMinutes = 44250.0 }
            ]
        };

        var breakdown = YouTubeChannelAnalysisService.EstimateWatchTimeBreakdown(analysis);
        Assert.Equal(636.0, breakdown.LongFormWatchMinutes);
        Assert.Equal(44250.0, breakdown.TotalWatchMinutes);
        Assert.Equal(43614.0, breakdown.ShortsWatchMinutes);
        Assert.Equal("video-duration-estimate", breakdown.Source);
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
