using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

public sealed record RecommendedPublishSlot(
    DateTime AtUtc,
    string LocalLabel,
    string Reason,
    string ExpectedReachTier);

public sealed record PromotionDestinationAdvice(
    string Platform,
    string Title,
    string TimingHint,
    string ActionSummary,
    string Priority);

public sealed record AutomationPublishAdvice(
    string SourceType,
    string TimeZoneId,
    DateTime RecommendedAtUtc,
    IReadOnlyList<RecommendedPublishSlot> Slots,
    IReadOnlyList<PromotionDestinationAdvice> Promotions);

/// <summary>
/// Recommends optimal YouTube publish times (tailored per category &amp; channel history) along with
/// where to cross-post and promote (Community Tab Poll, Pinned Comment Funnel, Website Hubs, Shorts Loop)
/// so each generated video earns peak initial reach instead of uploading at cold hours.
/// </summary>
public static class AutomationPublishAdvisor
{
    public static AutomationPublishAdvice BuildAdvice(
        AutomationSourceType sourceType,
        AutomationVideoFormat format,
        TimeZoneInfo timeZone,
        DateTime nowUtc,
        IReadOnlyList<DateTime> takenUtc,
        IReadOnlyList<DateTime> channelHistoryUtc,
        int count = 4)
    {
        var isShort = format == AutomationVideoFormat.Vertical;
        var baseSlots = PublishSlotSuggester.Suggest(new PublishSlotRequest(
            NowUtc: nowUtc,
            TimeZone: timeZone,
            IsShort: isShort,
            Taken: takenUtc,
            History: channelHistoryUtc,
            Count: Math.Max(count, 6)));

        // Category-specific peak slots aligned to Indian & Global audience habits
        var peakHours = PeakHoursFor(sourceType, format);
        var combined = new List<RecommendedPublishSlot>();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, timeZone);

        for (var day = 0; day <= 3 && combined.Count < count; day++)
        {
            var date = localNow.Date.AddDays(day);
            foreach (var (hour, minute, reason, tier) in peakHours)
            {
                if (combined.Count >= count) break;
                var local = date.AddHours(hour).AddMinutes(minute);
                if (timeZone.IsInvalidTime(local)) continue;
                var utc = DateTime.SpecifyKind(
                    TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), timeZone),
                    DateTimeKind.Utc);
                if (utc <= nowUtc.AddMinutes(15)) continue;
                if (takenUtc.Any(t => (t - utc).Duration() < TimeSpan.FromMinutes(90))) continue;
                if (combined.Any(s => (s.AtUtc - utc).Duration() < TimeSpan.FromMinutes(60))) continue;

                combined.Add(new RecommendedPublishSlot(
                    AtUtc: utc,
                    LocalLabel: local.ToString("ddd, dd MMM • h:mm tt"),
                    Reason: reason,
                    ExpectedReachTier: tier));
            }
        }

        foreach (var s in baseSlots)
        {
            if (combined.Count >= count) break;
            if (combined.Any(x => (x.AtUtc - s.At).Duration() < TimeSpan.FromMinutes(60))) continue;
            var local = TimeZoneInfo.ConvertTimeFromUtc(s.At, timeZone);
            combined.Add(new RecommendedPublishSlot(
                AtUtc: s.At,
                LocalLabel: local.ToString("ddd, dd MMM • h:mm tt"),
                Reason: s.Reason,
                ExpectedReachTier: "Channel Habit / Peak"));
        }

        combined = [.. combined.OrderBy(c => c.AtUtc).Take(count)];
        var bestUtc = combined.FirstOrDefault()?.AtUtc ?? nowUtc.AddHours(1);
        var promotions = BuildPromotions(sourceType, format);

        return new AutomationPublishAdvice(
            SourceType: sourceType.ToString(),
            TimeZoneId: timeZone.Id,
            RecommendedAtUtc: bestUtc,
            Slots: combined,
            Promotions: promotions);
    }

    private static (int Hour, int Minute, string Reason, string Tier)[] PeakHoursFor(
        AutomationSourceType sourceType,
        AutomationVideoFormat format) => sourceType switch
        {
            AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal =>
            [
                (5, 30, "Brahma Muhurat — high morning search wave for Panchang & Rashifal", "Peak A+"),
                (7, 0, "Morning Puja & Horoscope peak traffic", "Peak A"),
                (18, 30, "Evening Sandhya & next-day Muhurat lookup", "Peak B+")
            ],
            AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha =>
            [
                (6, 45, "Morning Bhakti & Puja Vidhi peak", "Peak A"),
                (19, 15, "Evening family Katha & Aarti prime time", "Peak A+")
            ],
            AutomationSourceType.FunnyComedy => format == AutomationVideoFormat.Vertical
                ? [
                    (12, 30, "Lunch-break Shorts scroll surge", "Peak A"),
                    (19, 30, "After-work / college evening prime comedy rush", "Peak A+"),
                    (21, 15, "Night Shorts binge peak (high replay loop retention)", "Peak A+")
                ]
                : [
                    (18, 30, "Evening relaxation prime time for full comedy episodes", "Peak A"),
                    (20, 30, "Dinner & prime night comedy viewing", "Peak A+")
                ],
            AutomationSourceType.AajKaItihaas or AutomationSourceType.Pratiyogita =>
            [
                (8, 0, "Morning student GK & current-affairs window", "Peak A"),
                (18, 0, "Evening revision & quiz discovery hour", "Peak A+"),
                (21, 0, "Late evening GK / competitive exam learners", "Peak B+")
            ],
            _ =>
            [
                (12, 15, "Midday browse peak", "Peak B+"),
                (19, 0, "Evening prime audience peak", "Peak A")
            ]
        };

    private static IReadOnlyList<PromotionDestinationAdvice> BuildPromotions(
        AutomationSourceType sourceType,
        AutomationVideoFormat format)
    {
        var list = new List<PromotionDestinationAdvice>
        {
            new(
                Platform: "YouTube Schedule (publishAt)",
                Title: "Upload Private Now -> Auto-Publish at Peak",
                TimingHint: "At least 15 mins before target slot",
                ActionSummary: "YouTube finishes HD/Shorts processing while private and releases publicly at the exact peak minute.",
                Priority: "High"),
            new(
                Platform: "YouTube Community Tab",
                Title: "Companion Poll + 1:1 Promo Card",
                TimingHint: "+2 hours after video goes public",
                ActionSummary: "Post your pre-built Community Poll & link to recapture subscribers who missed the notification.",
                Priority: "High"),
            new(
                Platform: "Pinned Comment Funnel",
                Title: "First Comment Question + Website Link",
                TimingHint: "Immediately on publish",
                ActionSummary: "Drives reply engagement (boosting algorithm velocity) and sends viewers to your portal.",
                Priority: "Medium")
        };

        if (sourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha)
        {
            list.Add(new PromotionDestinationAdvice(
                Platform: "HinduPanchang Video Hub",
                Title: "Sync to panchang.keshavsingh.in/videos",
                TimingHint: "Auto-synced on publish",
                ActionSummary: "Embeds the video on today's Panchang / Rashifal traffic pages for evergreen organic discovery.",
                Priority: "High"));
        }
        else if (sourceType == AutomationSourceType.FunnyComedy)
        {
            list.Add(new PromotionDestinationAdvice(
                Platform: "Playlist & Best-Of Compilation",
                Title: format == AutomationVideoFormat.Vertical
                    ? "Group 4-6 Shorts into <3m Best-Of Highlight Episode"
                    : "Link top 3 Shorts to this full episode via Pinned Comment",
                TimingHint: "Weekly compilation boost",
                ActionSummary: "Turns short-form viewers into higher-RPM long-form watch hours.",
                Priority: "High"));
        }
        else
        {
            list.Add(new PromotionDestinationAdvice(
                Platform: "Ecosystem Hub & Pratiyogita",
                Title: "Cross-link in Blog / Quiz Portal",
                TimingHint: "Same day after publish",
                ActionSummary: "Adds external session traffic from Pratiyogita / Blog readers directly onto your video.",
                Priority: "Medium"));
        }

        return list;
    }
}
