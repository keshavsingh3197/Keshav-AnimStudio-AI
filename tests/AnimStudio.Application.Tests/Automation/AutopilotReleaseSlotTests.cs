using AnimStudio.Application.Automation;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Automation;

public class AutopilotReleaseSlotTests
{
    private static readonly TimeZoneInfo Utc = TimeZoneInfo.Utc;
    private static readonly TimeSpan Lead = TimeSpan.FromMinutes(30);

    private static AutomationPublishAdvice Advice(params DateTime[] slots) => new(
        SourceType: "FunnyComedy",
        TimeZoneId: "UTC",
        RecommendedAtUtc: slots.Length > 0 ? slots[0] : default,
        Slots: [.. slots.Select(s => new RecommendedPublishSlot(s, s.ToString("t"), "peak", "Peak A"))],
        Promotions: []);

    [Fact]
    public void It_picks_the_earliest_slot_that_leaves_processing_lead()
    {
        var now = new DateTime(2026, 11, 21, 10, 0, 0, DateTimeKind.Utc);
        var advice = Advice(now.AddMinutes(10), now.AddHours(2), now.AddHours(5));

        var picked = AutomationPublishAdvisor.PickAutopilotReleaseUtc(advice, AutomationSourceType.FunnyComedy, "2026-11-21", Utc, now, Lead);

        Assert.Equal(now.AddHours(2), picked);
    }

    [Fact]
    public void Comedy_can_be_held_into_tomorrow_but_not_past_the_hold_limit()
    {
        var now = new DateTime(2026, 11, 21, 22, 0, 0, DateTimeKind.Utc);
        var tomorrow = AutomationPublishAdvisor.PickAutopilotReleaseUtc(
            Advice(now.AddHours(14)), AutomationSourceType.FunnyComedy, "2026-11-21", Utc, now, Lead);
        var tooFar = AutomationPublishAdvisor.PickAutopilotReleaseUtc(
            Advice(now.AddHours(48)), AutomationSourceType.FunnyComedy, "2026-11-21", Utc, now, Lead);

        Assert.Equal(now.AddHours(14), tomorrow);
        Assert.Null(tooFar);
    }

    [Theory]
    [InlineData(AutomationSourceType.HinduPanchang)]
    [InlineData(AutomationSourceType.DailyRashifal)]
    [InlineData(AutomationSourceType.HinduFestival)]
    [InlineData(AutomationSourceType.AajKaItihaas)]
    public void Date_bound_content_is_never_held_past_its_day(AutomationSourceType source)
    {
        var now = new DateTime(2026, 11, 21, 20, 0, 0, DateTimeKind.Utc);
        var nextMorning = new DateTime(2026, 11, 22, 5, 30, 0, DateTimeKind.Utc);
        var tonight = new DateTime(2026, 11, 21, 21, 0, 0, DateTimeKind.Utc);

        Assert.Null(AutomationPublishAdvisor.PickAutopilotReleaseUtc(Advice(nextMorning), source, "2026-11-21", Utc, now, Lead));
        Assert.Equal(tonight, AutomationPublishAdvisor.PickAutopilotReleaseUtc(Advice(tonight, nextMorning), source, "2026-11-21", Utc, now, Lead));
    }

    [Fact]
    public void Date_bound_content_without_a_readable_day_publishes_now()
    {
        var now = new DateTime(2026, 11, 21, 8, 0, 0, DateTimeKind.Utc);

        Assert.Null(AutomationPublishAdvisor.PickAutopilotReleaseUtc(
            Advice(now.AddHours(2)), AutomationSourceType.HinduPanchang, "not-a-date", Utc, now, Lead));
    }

    [Fact]
    public void No_usable_slot_means_publish_now()
    {
        var now = new DateTime(2026, 11, 21, 8, 0, 0, DateTimeKind.Utc);

        Assert.Null(AutomationPublishAdvisor.PickAutopilotReleaseUtc(Advice(), AutomationSourceType.FunnyComedy, "2026-11-21", Utc, now, Lead));
        Assert.Null(AutomationPublishAdvisor.PickAutopilotReleaseUtc(
            Advice(now.AddMinutes(5)), AutomationSourceType.FunnyComedy, "2026-11-21", Utc, now, Lead));
    }

    [Fact]
    public void ChannelAudiencePeakAnalyzer_promotes_high_performing_channel_hours_on_target_date()
    {
        var ist = PublishSlotSuggester.ResolveTimeZone("Asia/Kolkata");
        var nowUtc = new DateTime(2026, 11, 21, 16, 30, 0, DateTimeKind.Utc); // 22:00 IST Nov 21

        // Historical uploads on KeshavSinghWorld: 10:00 IST videos avg 400 views/day, 15:00 IST videos avg 40 views/day
        var videos = new List<YouTubeAnalyzedVideo>
        {
            VideoAtIst("v1", new DateTime(2026, 11, 10, 10, 0, 0), 4000, ist),
            VideoAtIst("v2", new DateTime(2026, 11, 12, 10, 0, 0), 3600, ist),
            VideoAtIst("v3", new DateTime(2026, 11, 14, 15, 0, 0), 280, ist),
            VideoAtIst("v4", new DateTime(2026, 11, 16, 15, 0, 0), 240, ist),
        };
        var analysis = new AnimStudio.Domain.Publishing.YouTubeChannelAnalysis
        {
            Id = "yca_1",
            UserId = "u1",
            ChannelId = "UCVP_DbP7xIOc_LFQTqaLbyg",
            ChannelTitle = "KeshavSinghWorld",
            Videos = videos,
            FetchedAtUtc = nowUtc
        };

        var baseAdvice = AutomationPublishAdvisor.BuildAdvice(
            AutomationSourceType.AajKaItihaas,
            AutomationVideoFormat.Vertical,
            ist,
            nowUtc,
            [],
            []);

        var enriched = ChannelAudiencePeakAnalyzer.EnrichAdvice(
            baseAdvice,
            AutomationSourceType.AajKaItihaas,
            AutomationVideoFormat.Vertical,
            analysis,
            ist,
            nowUtc,
            [],
            count: 4,
            targetDateKey: "2026-11-22");

        Assert.NotEmpty(enriched.Slots);
        var firstLocal = TimeZoneInfo.ConvertTimeFromUtc(enriched.RecommendedAtUtc, ist);
        Assert.Equal(new DateTime(2026, 11, 22), firstLocal.Date);
        Assert.Equal(10, firstLocal.Hour);
        Assert.Contains("Channel Peak", enriched.Slots[0].ExpectedReachTier, StringComparison.Ordinal);
    }

    private static YouTubeAnalyzedVideo VideoAtIst(string id, DateTime istLocal, long views, TimeZoneInfo ist) => new()
    {
        VideoId = id,
        Title = $"History {id}",
        Privacy = "public",
        DurationSeconds = 55,
        PublishedAtUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(istLocal, DateTimeKind.Unspecified), ist),
        Views = views,
        Likes = views / 15,
        Comments = views / 80
    };
}
