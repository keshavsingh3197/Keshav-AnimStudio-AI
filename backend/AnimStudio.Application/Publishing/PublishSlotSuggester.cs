namespace AnimStudio.Application.Publishing;

/// <param name="At">The slot, UTC.</param>
/// <param name="Reason">Why this hour, in words for the picker.</param>
public sealed record PublishSlot(DateTime At, string Reason);

/// <summary>What the next free publishing times are worked out from.</summary>
/// <param name="TimeZone">The owner's zone: hours are picked on their clock.</param>
/// <param name="Taken">Times already planned on the channel (queued or scheduled on YouTube), UTC.</param>
/// <param name="History">When the channel's past videos went out, UTC; their most common hours are preferred.</param>
public sealed record PublishSlotRequest(
    DateTime NowUtc,
    TimeZoneInfo TimeZone,
    bool IsShort,
    IReadOnlyList<DateTime> Taken,
    IReadOnlyList<DateTime> History,
    int Count = 6);

/// <summary>
/// Finds the next good times to publish on a channel: the hours its own videos usually go
/// out at, else the usual evening and lunchtime peaks, kept clear of what is already
/// planned and limited to a few a day so videos don't compete with each other.
/// </summary>
public static class PublishSlotSuggester
{
    public const int MaxCount = PublishQueueRules.MaxBulk;
    private const int MaxDays = 90;

    /// <summary>History only counts once there is enough of it to show a habit.</summary>
    private const int MinHistory = 5;

    /// <summary>Not before this much from now, so there is time to review and upload.</summary>
    private static readonly TimeSpan MinLead = TimeSpan.FromMinutes(45);

    private static readonly (int Hour, string Reason)[] ShortHours =
        [(12, "Lunch-break scrolling"), (18, "Evening peak"), (20, "Prime time")];

    private static readonly (int Hour, string Reason)[] LongHours =
        [(17, "Evening peak - indexed before prime time"), (19, "Prime time"), (11, "Weekend late morning")];

    public static IReadOnlyList<PublishSlot> Suggest(PublishSlotRequest request)
    {
        var count = Math.Clamp(request.Count, 1, MaxCount);
        var gap = request.IsShort ? TimeSpan.FromHours(2) : TimeSpan.FromHours(20);
        var perDay = request.IsShort ? 3 : 1;
        var tz = request.TimeZone;

        var hours = PreferredHours(request);
        var taken = request.Taken.ToList();
        var slots = new List<PublishSlot>();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(request.NowUtc, tz);

        for (var day = 0; day < MaxDays && slots.Count < count; day++)
        {
            var date = localNow.Date.AddDays(day);
            var weekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            var dayTaken = taken.Count(t => TimeZoneInfo.ConvertTimeFromUtc(t, tz).Date == date);

            foreach (var (hour, reason) in hours)
            {
                if (slots.Count >= count || dayTaken >= perDay) break;
                // The weekend-only hour is skipped on weekdays, when the audience is at work.
                if (reason.StartsWith("Weekend", StringComparison.Ordinal) && !weekend) continue;

                var local = date.AddHours(hour);
                if (tz.IsInvalidTime(local)) continue;
                var utc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), tz);
                if (utc - request.NowUtc < MinLead) continue;
                if (taken.Any(t => (t - utc).Duration() < gap)) continue;

                slots.Add(new PublishSlot(DateTime.SpecifyKind(utc, DateTimeKind.Utc), reason));
                taken.Add(utc);
                dayTaken++;
            }
        }

        return [.. slots.OrderBy(s => s.At)];
    }

    /// <summary>The channel's own habit first (its most used hours), then the defaults for the format.</summary>
    private static List<(int Hour, string Reason)> PreferredHours(PublishSlotRequest request)
    {
        var defaults = request.IsShort ? ShortHours : LongHours;
        var list = new List<(int, string)>();

        if (request.History.Count >= MinHistory)
        {
            var habit = request.History
                .Select(t => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(t, DateTimeKind.Utc), request.TimeZone).Hour)
                .GroupBy(h => h)
                .Where(g => g.Count() >= 2)
                .OrderByDescending(g => g.Count())
                .Take(2)
                .Select(g => (g.Key, "Your usual time"));
            list.AddRange(habit);
        }

        list.AddRange(defaults.Where(d => list.All(l => l.Item1 != d.Hour)));
        // Tried in this order, so the habit wins a day's last place over a default hour.
        return list;
    }

    /// <summary>A zone id from the browser (IANA, e.g. "Asia/Kolkata"), or UTC when it is unknown.</summary>
    public static TimeZoneInfo ResolveTimeZone(string? id)
    {
        if (string.IsNullOrWhiteSpace(id) || id.Length > 64) return TimeZoneInfo.Utc;
        return TimeZoneInfo.TryFindSystemTimeZoneById(id.Trim(), out var tz) ? tz : TimeZoneInfo.Utc;
    }
}
