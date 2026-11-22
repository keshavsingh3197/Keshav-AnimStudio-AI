using System.Globalization;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Automation;

/// <summary>Analyzed historical audience peak hour on one YouTube channel.</summary>
public sealed record ChannelHourlyPeak(
    int LocalHour,
    int SampleVideos,
    double PerformanceMultiplier,
    double MedianViewsPerDay,
    string Reason);

/// <summary>
/// Derives data-backed audience peak publish hours from a channel's analyzed upload history
/// (<see cref="YouTubeChannelAnalysis"/>) and blends them with category timing windows so
/// prepared posts schedule at each channel's actual high-viewer hours without colliding.
/// </summary>
public static class ChannelAudiencePeakAnalyzer
{
    private static readonly TimeSpan SameDayMinimumGap = TimeSpan.FromMinutes(90);
    private static readonly TimeSpan MinScheduleLead = TimeSpan.FromMinutes(25);

    public static IReadOnlyList<ChannelHourlyPeak> AnalyzeHourlyPeaks(
        YouTubeChannelAnalysis? analysis,
        TimeZoneInfo timeZone,
        DateTime nowUtc)
    {
        if (analysis?.Videos is not { Count: > 0 })
            return [];

        var settled = analysis.Videos
            .Where(v => string.Equals(v.Privacy, "public", StringComparison.OrdinalIgnoreCase)
                && v.PublishedAtUtc is { } at
                && at <= nowUtc
                && (nowUtc - at).TotalDays >= YouTubeChannelAnalyzer.MinAgeDays
                && v.Views is not null)
            .Select(v => YouTubeChannelAnalyzer.Score(v, nowUtc))
            .ToList();

        if (settled.Count < 3)
            return [];

        var allMedian = Math.Max(0.1, YouTubeChannelAnalyzer.Median(settled.Select(s => s.ViewsPerDay)));
        var shortMedian = YouTubeChannelAnalyzer.Median(settled.Where(s => s.IsShort).Select(s => s.ViewsPerDay));
        var longMedian = YouTubeChannelAnalyzer.Median(settled.Where(s => !s.IsShort).Select(s => s.ViewsPerDay));

        double NormalizedScore(YouTubeVideoScore score)
        {
            var baseline = (score.IsShort ? shortMedian : longMedian) is > 0.1 and var formatMed
                ? formatMed
                : allMedian;
            var velocityRatio = score.ViewsPerDay / baseline;
            var engagementBoost = 1.0 + Math.Clamp((score.Engagement ?? 0) / 25.0, 0.0, 0.35);
            var retentionBoost = score.Video.Analytics is { AverageViewPercent: > 0 } a
                ? Math.Clamp(0.85 + (a.AverageViewPercent / 200.0), 0.85, 1.35)
                : 1.0;
            return velocityRatio * engagementBoost * retentionBoost;
        }

        return [.. settled
            .GroupBy(s => TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(s.Video.PublishedAtUtc!.Value, DateTimeKind.Utc), timeZone).Hour)
            .Where(g => g.Count() >= 2 || settled.Count < 8)
            .Select(g =>
            {
                var scores = g.Select(NormalizedScore).ToList();
                var multiplier = Math.Round(YouTubeChannelAnalyzer.Median(scores), 2);
                var viewsPerDay = Math.Round(YouTubeChannelAnalyzer.Median(g.Select(s => s.ViewsPerDay)), 1);
                var hourLabel = DateTime.Today.AddHours(g.Key).ToString("h tt", CultureInfo.InvariantCulture);
                var reason = $"Channel analytics peak at {hourLabel}: {multiplier:0.0}× typical views/day ({viewsPerDay:0.#}/day across {g.Count()} video{(g.Count() == 1 ? "" : "s")})";
                return new ChannelHourlyPeak(g.Key, g.Count(), multiplier, viewsPerDay, reason);
            })
            .Where(p => p.SampleVideos >= 2 || p.PerformanceMultiplier >= 1.35)
            .OrderByDescending(p => p.PerformanceMultiplier)
            .ThenByDescending(p => p.SampleVideos)
            .Take(6)];
    }

    public static AutomationPublishAdvice EnrichAdvice(
        AutomationPublishAdvice baseAdvice,
        AutomationSourceType sourceType,
        AutomationVideoFormat format,
        YouTubeChannelAnalysis? analysis,
        TimeZoneInfo timeZone,
        DateTime nowUtc,
        IReadOnlyList<DateTime> takenUtc,
        int count = 4,
        string? targetDateKey = null)
    {
        var peaks = AnalyzeHourlyPeaks(analysis, timeZone, nowUtc);
        var targetDate = ParseDateOnlyOrNull(targetDateKey);
        if (peaks.Count == 0 && targetDate is null)
            return baseAdvice;

        var insights = analysis is not null && analysis.Videos.Count > 0
            ? YouTubeChannelAnalyzer.Insights(analysis, nowUtc)
            : null;

        var window = AllowedHourWindow(sourceType);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, timeZone);
        var occupied = takenUtc.ToList();
        var merged = new List<RecommendedPublishSlot>();

        // 1. Add data-backed channel peak hours on target date (or today/tomorrow) when they match content cadence.
        var anchorStartDay = targetDate is { } explicitDate
            ? explicitDate.ToDateTime(TimeOnly.MinValue)
            : localNow.Date;
        var daysToScan = targetDate.HasValue ? 1 : 3;

        for (var d = 0; d < daysToScan && merged.Count < count; d++)
        {
            var dayDate = anchorStartDay.AddDays(d);
            foreach (var peak in peaks)
            {
                if (merged.Count >= count) break;
                if (peak.LocalHour < window.MinHour || peak.LocalHour > window.MaxHour) continue;

                var candidateUtc = TryResolveCleanUtc(dayDate.AddHours(peak.LocalHour).AddMinutes(15), timeZone, nowUtc, occupied, merged);
                if (candidateUtc is null) continue;

                var localDt = TimeZoneInfo.ConvertTimeFromUtc(candidateUtc.Value, timeZone);
                var bestDay = insights?.BestWeekday;
                var weekdayBoost = !string.IsNullOrWhiteSpace(bestDay)
                    && string.Equals(localDt.DayOfWeek.ToString(), bestDay, StringComparison.OrdinalIgnoreCase);
                var tier = peak.PerformanceMultiplier >= 1.35 || weekdayBoost ? "Channel Peak A+" : "Channel Peak A";
                var reason = weekdayBoost
                    ? $"{peak.Reason} • Strongest day ({bestDay})"
                    : peak.Reason;
                merged.Add(new RecommendedPublishSlot(
                    candidateUtc.Value,
                    localDt.ToString("ddd dd MMM, hh:mm tt", CultureInfo.InvariantCulture),
                    reason,
                    tier));
            }
        }

        // 2. Keep target-date category slots from peak defaults or baseAdvice so every slot satisfies lead + spacing.
        if (targetDate is { } target)
        {
            var categoryFallbackHours = CategoryFallbackHours(sourceType, format);
            foreach (var (hour, minute, reason, tier) in categoryFallbackHours)
            {
                if (merged.Count >= count) break;
                var candidateUtc = TryResolveCleanUtc(
                    target.ToDateTime(new TimeOnly(hour, minute)),
                    timeZone,
                    nowUtc,
                    occupied,
                    merged);
                if (candidateUtc is null) continue;

                var localDt = TimeZoneInfo.ConvertTimeFromUtc(candidateUtc.Value, timeZone);
                merged.Add(new RecommendedPublishSlot(
                    candidateUtc.Value,
                    localDt.ToString("ddd dd MMM, hh:mm tt", CultureInfo.InvariantCulture),
                    reason,
                    tier));
            }
        }

        foreach (var fallback in baseAdvice.Slots)
        {
            if (merged.Count >= count) break;
            if (targetDate.HasValue)
            {
                var fallbackLocal = TimeZoneInfo.ConvertTimeFromUtc(fallback.AtUtc, timeZone).Date;
                if (fallbackLocal != targetDate.Value.ToDateTime(TimeOnly.MinValue))
                    continue;
            }
            if (fallback.AtUtc < nowUtc + MinScheduleLead) continue;
            if (HasCollision(fallback.AtUtc, occupied, merged)) continue;
            merged.Add(fallback);
        }

        if (merged.Count == 0)
            return baseAdvice;

        return baseAdvice with
        {
            RecommendedAtUtc = merged[0].AtUtc,
            Slots = merged
        };
    }

    private static DateTime? TryResolveCleanUtc(
        DateTime localDt,
        TimeZoneInfo timeZone,
        DateTime nowUtc,
        IReadOnlyList<DateTime> occupied,
        IReadOnlyList<RecommendedPublishSlot> existing)
    {
        if (timeZone.IsInvalidTime(localDt))
            localDt = localDt.AddHours(1);
        var utc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localDt, DateTimeKind.Unspecified), timeZone);
        if (utc < nowUtc + MinScheduleLead)
            return null;
        if (!HasCollision(utc, occupied, existing))
            return utc;

        // Nudge by +30m increments inside the same peak band if an earlier post already holds that hour on the channel.
        foreach (var offsetMin in new[] { 30, 60, -30, 90 })
        {
            var shiftedLocal = localDt.AddMinutes(offsetMin);
            if (shiftedLocal.Date != localDt.Date || timeZone.IsInvalidTime(shiftedLocal)) continue;
            var shiftedUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(shiftedLocal, DateTimeKind.Unspecified), timeZone);
            if (shiftedUtc < nowUtc + MinScheduleLead) continue;
            if (!HasCollision(shiftedUtc, occupied, existing))
                return shiftedUtc;
        }
        return null;
    }

    private static bool HasCollision(DateTime candidateUtc, IReadOnlyList<DateTime> occupied, IReadOnlyList<RecommendedPublishSlot> existing) =>
        occupied.Any(t => (t - candidateUtc).Duration() < SameDayMinimumGap)
        || existing.Any(s => (s.AtUtc - candidateUtc).Duration() < SameDayMinimumGap);

    private static (int MinHour, int MaxHour) AllowedHourWindow(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal => (5, 11),
        AutomationSourceType.DailyKatha => (16, 22),
        AutomationSourceType.HinduFestival => (6, 21),
        AutomationSourceType.AajKaItihaas or AutomationSourceType.Pratiyogita or AutomationSourceType.EcosystemSpotlight => (8, 22),
        _ => (6, 22)
    };

    private static (int Hour, int Minute, string Reason, string Tier)[] CategoryFallbackHours(
        AutomationSourceType sourceType,
        AutomationVideoFormat format) => sourceType switch
        {
            AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal =>
            [
                (6, 15, "Morning Panchang & Rashifal search rush (IST sunrise window)", "Peak A+"),
                (7, 45, "Morning commute spiritual & panchang check-in", "Peak A"),
                (9, 15, "Late morning Muhurat lookup window", "Peak B+"),
            ],
            AutomationSourceType.HinduFestival =>
            [
                (8, 30, "Morning Vrat & Puja Vidhi preparation peak", "Peak A+"),
                (17, 15, "Pre-Pradosh / Sandhya Aarti evening peak", "Peak A+"),
                (11, 30, "Mid-morning temple & Vrat Katha viewers", "Peak A"),
            ],
            AutomationSourceType.DailyKatha =>
            [
                (19, 15, "Evening Aarti & Katha devotional listening peak", "Peak A+"),
                (20, 30, "Post-dinner family spiritual storytelling window", "Peak A"),
                (17, 45, "Evening Pradosh / temple Sandhya slot", "Peak A"),
            ],
            AutomationSourceType.AajKaItihaas =>
            [
                (18, 15, "Evening student & history/GK discovery prime time", "Peak A+"),
                (20, 15, "Prime-time documentary & world history surge", "Peak A+"),
                (12, 30, "Midday break Shorts & GK facts surge", "Peak A"),
                (9, 30, "Sunday/morning reading & UPSC history wave", "Peak B+"),
            ],
            AutomationSourceType.Pratiyogita or AutomationSourceType.EcosystemSpotlight =>
            [
                (18, 45, "Evening learner & creator engagement wave", "Peak A+"),
                (13, 0, "Afternoon break & quiz discovery wave", "Peak A"),
            ],
            _ => format == AutomationVideoFormat.Vertical
                ? [(18, 0, "Evening Shorts discovery peak", "Peak A+"), (20, 15, "Night prime time", "Peak A")]
                : [(19, 0, "Evening widescreen prime time", "Peak A+"), (12, 0, "Weekend late morning", "Peak A")]
        };

    private static DateOnly? ParseDateOnlyOrNull(string? dateKey) =>
        !string.IsNullOrWhiteSpace(dateKey) && DateOnly.TryParse(dateKey.Trim(), out var d) ? d : null;
}
