using AnimStudio.Application.Automation;
using AnimStudio.Domain.Automation;

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
}
