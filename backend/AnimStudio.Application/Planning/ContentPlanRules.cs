using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Planning;

namespace AnimStudio.Application.Planning;

public enum ContentAttentionLevel
{
    Info = 0,
    Warning = 1,
    Problem = 2
}

/// <summary>Something about a planned post the owner should look at, worst first.</summary>
public sealed record ContentAttention(string Code, ContentAttentionLevel Level, string Message);

/// <summary>A slot the topic's cadence asks for.</summary>
public sealed record ContentSlot(string SlotKey, DateOnly LocalDate, DateTime PublishAtUtc);

/// <summary>A video on the channel, as far as linking and scheduling need to know.</summary>
public sealed record ContentUploadSnapshot(
    string VideoId,
    string Title,
    string? Privacy,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    string? ThumbnailUrl);

/// <summary>
/// The calendar's pure rules: which days a topic needs a post, what "on time" means, and
/// how YouTube's view of a linked video maps onto the plan. No I/O, so every rule is tested
/// directly.
/// </summary>
public static partial class ContentPlanRules
{
    /// <summary>YouTube keeps publishAt to the minute; anything closer than this is the same time.</summary>
    public static readonly TimeSpan ScheduleTolerance = TimeSpan.FromMinutes(2);

    /// <summary>YouTube refuses a publishAt that isn't comfortably in the future.</summary>
    public static readonly TimeSpan MinScheduleLead = TimeSpan.FromMinutes(10);

    public const int MaxLeadDays = 30;
    public const int MaxPlanAheadDays = 90;

    public static bool TryFindTimeZone(string? id, out TimeZoneInfo zone)
    {
        zone = TimeZoneInfo.Utc;
        if (string.IsNullOrWhiteSpace(id) || id.Length > 64) return false;
        try
        {
            zone = TimeZoneInfo.FindSystemTimeZoneById(id);
            return true;
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return false;
        }
    }

    public static bool TryParseTime(string? value, out TimeOnly time)
    {
        time = default;
        return value is not null && TimeOfDayPattern().IsMatch(value)
            && TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }

    public static string SlotKeyFor(string topicId, DateOnly localDate) =>
        $"{topicId}:{localDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}";

    /// <summary>
    /// A local wall-clock time as UTC. A time skipped by a daylight-saving jump moves forward
    /// an hour; a repeated one takes the first (daylight) occurrence.
    /// </summary>
    public static DateTime ToUtc(DateOnly date, TimeOnly time, TimeZoneInfo zone)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        if (zone.IsInvalidTime(local)) local = local.AddHours(1);
        if (zone.IsAmbiguousTime(local))
        {
            var offset = zone.GetAmbiguousTimeOffsets(local).Max();
            return DateTime.SpecifyKind(local - offset, DateTimeKind.Utc);
        }
        return TimeZoneInfo.ConvertTimeToUtc(local, zone);
    }

    /// <summary>
    /// The slots the topic's cadence asks for from today (in the topic's zone) through
    /// <see cref="ContentTopic.PlanAheadDays"/>, skipping times already past.
    /// </summary>
    public static IReadOnlyList<ContentSlot> UpcomingSlots(ContentTopic topic, DateTime nowUtc)
    {
        if (topic.Archived || topic.Days.Count == 0) return [];
        if (!TryFindTimeZone(topic.TimeZone, out var zone) || !TryParseTime(topic.PublishTime, out var time)) return [];

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(nowUtc, zone));
        var days = Math.Clamp(topic.PlanAheadDays, 1, MaxPlanAheadDays);
        var wanted = topic.Days.ToHashSet();

        var slots = new List<ContentSlot>();
        for (var i = 0; i <= days; i++)
        {
            var date = today.AddDays(i);
            if (!wanted.Contains(date.DayOfWeek)) continue;
            var at = ToUtc(date, time, zone);
            if (at <= nowUtc) continue;
            slots.Add(new ContentSlot(SlotKeyFor(topic.Id, date), date, at));
        }
        return slots;
    }

    /// <summary>The slots not yet on the calendar and not dismissed by the owner.</summary>
    public static IReadOnlyList<ContentSlot> MissingSlots(ContentTopic topic, IEnumerable<ContentPlanItem> existing, DateTime nowUtc)
    {
        var taken = existing.Select(i => i.SlotKey).Where(k => k is not null).ToHashSet(StringComparer.Ordinal);
        taken.UnionWith(topic.DismissedSlots);
        return [.. UpcomingSlots(topic, nowUtc).Where(s => !taken.Contains(s.SlotKey))];
    }

    /// <summary>The calendar day <paramref name="utc"/> falls on in the topic's zone (UTC when the zone is unknown).</summary>
    public static DateOnly LocalDate(DateTime utc, ContentTopic topic)
    {
        TryFindTimeZone(topic.TimeZone, out var zone);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), zone));
    }

    /// <summary>"Monday motivation · 27 Oct" - the default title of a planned slot.</summary>
    public static string SlotTitle(ContentTopic topic, DateOnly localDate) =>
        $"{topic.Name} · {localDate.ToString("d MMM", CultureInfo.InvariantCulture)}";

    public static DateTime PrepareBy(ContentPlanItem item, int leadDays) =>
        item.PublishAt.AddDays(-Math.Clamp(leadDays, 0, MaxLeadDays));

    public static bool SameTime(DateTime? a, DateTime b) =>
        a is { } value && (value - b).Duration() <= ScheduleTolerance;

    private static bool IsDone(ContentPlanStatus status) =>
        status is ContentPlanStatus.Published or ContentPlanStatus.Skipped;

    /// <summary>
    /// The linked video is private and won't go live at the planned time, and the planned time
    /// is far enough ahead for YouTube to accept it - so the schedule can (and should) be put on it.
    /// </summary>
    public static bool NeedsSchedule(ContentPlanItem item, DateTime nowUtc) =>
        item.VideoId is not null
        && item.YouTube is { Exists: true } yt
        && string.Equals(yt.Privacy, "private", StringComparison.Ordinal)
        && !SameTime(yt.ScheduledAt, item.PublishAt)
        && item.PublishAt - nowUtc >= MinScheduleLead
        && !IsDone(item.Status);

    /// <summary>
    /// Folds YouTube's view of the linked video into the plan. Only the YouTube-owned states
    /// (Scheduled, Published) move here; an owner's Idea/InProgress becomes Ready once a video
    /// exists, because uploading is the step after ready.
    /// </summary>
    public static void ApplyYouTube(ContentPlanItem item, ContentUploadSnapshot? video, DateTime nowUtc)
    {
        if (item.Status == ContentPlanStatus.Skipped) return;

        if (video is null)
        {
            item.YouTube ??= new ContentYouTubeState();
            item.YouTube.Exists = false;
            item.YouTube.CheckedAt = nowUtc;
            if (item.Status is ContentPlanStatus.Scheduled or ContentPlanStatus.Published)
                item.Status = ContentPlanStatus.Ready;
            return;
        }

        item.YouTube = new ContentYouTubeState
        {
            Title = video.Title,
            Privacy = video.Privacy,
            ScheduledAt = video.ScheduledAt,
            PublishedAt = video.PublishedAt,
            ThumbnailUrl = video.ThumbnailUrl,
            Exists = true,
            CheckedAt = nowUtc
        };

        var previous = item.Status;
        item.Status = video.Privacy switch
        {
            "public" => ContentPlanStatus.Published,
            "private" when video.ScheduledAt is not null => ContentPlanStatus.Scheduled,
            _ => ContentPlanStatus.Ready
        };
        if (item.Status != previous && item.Status >= ContentPlanStatus.Ready) item.ReadyAt ??= nowUtc;
    }

    /// <summary>What needs the owner's attention on this post, worst first. Empty when it's on track.</summary>
    public static IReadOnlyList<ContentAttention> Attention(ContentPlanItem item, int leadDays, DateTime nowUtc)
    {
        var list = new List<ContentAttention>();
        if (IsDone(item.Status))
        {
            if (item.Status == ContentPlanStatus.Published && item.YouTube is { Exists: false })
                list.Add(new("video-missing", ContentAttentionLevel.Problem, "The linked video isn't on YouTube any more."));
            return list;
        }

        var yt = item.YouTube;
        var linked = item.VideoId is not null;

        if (item.PublishAt <= nowUtc)
            list.Add(new("missed", ContentAttentionLevel.Problem, "The planned time has passed and it isn't live."));

        if (linked && yt is { Exists: false })
            list.Add(new("video-missing", ContentAttentionLevel.Problem, "The linked video isn't on YouTube any more."));

        if (linked && yt is { Exists: true })
        {
            if (yt.Privacy == "unlisted")
                list.Add(new("unlisted", ContentAttentionLevel.Warning, "The video is unlisted, so it will never go public on its own."));
            else if (yt.Privacy == "private" && yt.ScheduledAt is null && item.PublishAt > nowUtc)
                list.Add(new("not-scheduled", ContentAttentionLevel.Problem, "The video is private with no publish time - it won't go live on its own."));
            else if (yt.Privacy == "private" && yt.ScheduledAt is { } at && !SameTime(at, item.PublishAt))
                list.Add(new("schedule-mismatch", ContentAttentionLevel.Warning, "YouTube's scheduled time doesn't match the plan."));
        }

        if (item.Status is ContentPlanStatus.Idea or ContentPlanStatus.InProgress && item.PublishAt > nowUtc)
        {
            var due = PrepareBy(item, leadDays);
            if (nowUtc >= due)
                list.Add(new("prep-late", ContentAttentionLevel.Warning, "It should already be ready by now."));
            else if (nowUtc >= due.AddDays(-2))
                list.Add(new("prep-soon", ContentAttentionLevel.Info, "Due to be ready within two days."));
        }

        if (item.Status == ContentPlanStatus.Ready && !linked && item.PublishAt > nowUtc)
        {
            list.Add(item.PublishAt - nowUtc <= TimeSpan.FromHours(24)
                ? new("upload-needed", ContentAttentionLevel.Warning, "Ready but not on YouTube yet - upload and schedule it.")
                : new("upload-needed", ContentAttentionLevel.Info, "Ready - upload it and schedule it for the planned time."));
        }

        if (item.VideoAutoLinked)
            list.Add(new("check-link", ContentAttentionLevel.Info, "The video was linked automatically - check it's the right one."));

        return [.. list.OrderByDescending(a => a.Level)];
    }

    /// <summary>
    /// The slot key a post on <paramref name="localDate"/> holds: the cadence key when the topic
    /// posts that weekday (so the planner doesn't add a second post there), otherwise null.
    /// </summary>
    public static string? SlotKeyOn(ContentTopic topic, DateOnly localDate) =>
        topic.Days.Contains(localDate.DayOfWeek) ? SlotKeyFor(topic.Id, localDate) : null;

    /// <summary>
    /// Where a post that won't be ready in time can move: the first day after its current day
    /// (and not before today) that the topic posts on and no other live post of the topic
    /// occupies, at the topic's publish time. A topic with no fixed days takes any free day.
    /// Null when nothing is free within <see cref="MaxPlanAheadDays"/>.
    /// </summary>
    public static DateTime? NextFreeTime(ContentTopic topic, ContentPlanItem item, IEnumerable<ContentPlanItem> topicPosts, DateTime nowUtc)
    {
        TryFindTimeZone(topic.TimeZone, out var zone);
        if (!TryParseTime(topic.PublishTime, out var time))
            time = TimeOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(item.PublishAt, DateTimeKind.Utc), zone));

        var current = LocalDate(item.PublishAt, topic);
        var today = LocalDate(nowUtc, topic);
        var taken = topicPosts
            .Where(p => p.Id != item.Id && p.Status != ContentPlanStatus.Skipped)
            .Select(p => LocalDate(p.PublishAt, topic))
            .ToHashSet();

        var start = today > current ? today : current.AddDays(1);
        for (var i = 0; i <= MaxPlanAheadDays; i++)
        {
            var date = start.AddDays(i);
            if (topic.Days.Count > 0 && !topic.Days.Contains(date.DayOfWeek)) continue;
            if (taken.Contains(date)) continue;
            var at = ToUtc(date, time, zone);
            if (at - nowUtc < MinScheduleLead) continue;
            return at;
        }
        return null;
    }

    /// <summary>A post that is still being worked on and could trade places with a ready one.</summary>
    public static bool CanTrade(ContentPlanItem item, DateTime nowUtc) =>
        !IsDone(item.Status) && item.PublishAt - nowUtc >= MinScheduleLead;

    /// <summary>
    /// Later posts of the same topic that are already ready (or scheduled) and could go out in
    /// <paramref name="item"/>'s place, earliest first. Empty when the post itself is ready or
    /// its time is too close for YouTube to take a new schedule.
    /// </summary>
    public static IReadOnlyList<ContentPlanItem> SwapCandidates(ContentPlanItem item, IEnumerable<ContentPlanItem> topicPosts, DateTime nowUtc)
    {
        if (item.Status is not (ContentPlanStatus.Idea or ContentPlanStatus.InProgress) || !CanTrade(item, nowUtc)) return [];
        return [.. topicPosts
            .Where(p => p.Id != item.Id && p.TopicId == item.TopicId && p.PublishAt > item.PublishAt)
            .Where(p => p.Status is ContentPlanStatus.Ready or ContentPlanStatus.Scheduled)
            .OrderBy(p => p.PublishAt)
            .Take(5)];
    }

    /// <summary>
    /// The one post an upload belongs to, or null when none or more than one could. A post
    /// matches when YouTube's scheduled time equals its planned time, or the titles agree.
    /// </summary>
    public static ContentPlanItem? MatchUpload(ContentUploadSnapshot upload, IEnumerable<ContentPlanItem> candidates)
    {
        var title = NormalizeTitle(upload.Title);
        var matches = candidates
            .Where(i => i.VideoId is null && !IsDone(i.Status))
            .Where(i => SameTime(upload.ScheduledAt, i.PublishAt) || TitlesAgree(title, NormalizeTitle(i.Title)))
            .Take(2)
            .ToList();
        return matches.Count == 1 ? matches[0] : null;
    }

    private static bool TitlesAgree(string upload, string planned) =>
        upload.Length >= 8 && planned.Length >= 8
        && (upload == planned || upload.StartsWith(planned, StringComparison.Ordinal) || planned.StartsWith(upload, StringComparison.Ordinal));

    /// <summary>Lower case, hashtags and punctuation dropped, whitespace collapsed.</summary>
    public static string NormalizeTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)) return string.Empty;
        var noTags = HashtagPattern().Replace(title, " ");
        var sb = new StringBuilder(noTags.Length);
        foreach (var c in noTags.ToLowerInvariant())
            sb.Append(char.IsLetterOrDigit(c) ? c : ' ');
        return WhitespacePattern().Replace(sb.ToString(), " ").Trim();
    }

    /// <summary>
    /// A video id from what the owner pasted: the bare id, any watch/Shorts/youtu.be link, or
    /// a YouTube Studio link. The id is checked against the strict pattern either way.
    /// </summary>
    public static bool TryParseVideoReference(string? input, out string videoId)
    {
        videoId = string.Empty;
        var text = input?.Trim();
        if (string.IsNullOrEmpty(text) || text.Length > 2048) return false;

        if (VideoIdPattern().IsMatch(text))
        {
            videoId = text;
            return true;
        }

        var link = Ingest.YouTubeUrlValidator.Validate(text);
        if (link.IsValid && link.VideoId is not null)
        {
            videoId = link.VideoId;
            return true;
        }

        if (Uri.TryCreate(text, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps
            && string.IsNullOrEmpty(uri.UserInfo) && uri.IsDefaultPort
            && string.Equals(uri.IdnHost, "studio.youtube.com", StringComparison.OrdinalIgnoreCase))
        {
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length >= 2 && segments[0] == "video" && VideoIdPattern().IsMatch(segments[1]))
            {
                videoId = segments[1];
                return true;
            }
        }
        return false;
    }

    public static string HashUrl(string canonicalUrl) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalUrl)));

    [GeneratedRegex("^([01][0-9]|2[0-3]):[0-5][0-9]$")]
    private static partial Regex TimeOfDayPattern();

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex VideoIdPattern();

    [GeneratedRegex(@"#\w+")]
    private static partial Regex HashtagPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespacePattern();
}
