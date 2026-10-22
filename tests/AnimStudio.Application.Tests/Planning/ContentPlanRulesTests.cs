using AnimStudio.Application.Planning;
using AnimStudio.Domain.Planning;

namespace AnimStudio.Application.Tests.Planning;

public sealed class ContentPlanRulesTests
{
    // Wednesday 21 Oct 2026, 10:00 UTC (15:30 in India).
    private static readonly DateTime Now = new(2026, 10, 21, 10, 0, 0, DateTimeKind.Utc);

    private static ContentTopic Topic(params DayOfWeek[] days) => new()
    {
        Id = "t1",
        UserId = "u1",
        Name = "Monday motivation",
        Days = [.. days],
        PublishTime = "18:00",
        TimeZone = "Asia/Kolkata",
        PlanAheadDays = 14,
        LeadDays = 3
    };

    private static ContentPlanItem Item(DateTime publishAt, ContentPlanStatus status = ContentPlanStatus.Idea) => new()
    {
        Id = "i1",
        TopicId = "t1",
        Title = "Morning routine that works",
        PublishAt = publishAt,
        Status = status
    };

    [Fact]
    public void A_late_post_moves_to_the_next_cadence_day_nobody_has()
    {
        var topic = Topic(DayOfWeek.Monday, DayOfWeek.Thursday);
        var late = Item(new DateTime(2026, 10, 26, 12, 30, 0, DateTimeKind.Utc));
        var thursday = Item(new DateTime(2026, 10, 29, 12, 30, 0, DateTimeKind.Utc));
        thursday.Id = "i2";

        var next = ContentPlanRules.NextFreeTime(topic, late, [late, thursday], Now);

        // Thursday is taken, so the following Monday.
        Assert.Equal(new DateTime(2026, 11, 2, 12, 30, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void A_missed_post_can_still_take_todays_slot_and_a_skipped_post_leaves_its_day_free()
    {
        var topic = Topic(DayOfWeek.Wednesday);
        var missed = Item(new DateTime(2026, 10, 14, 12, 30, 0, DateTimeKind.Utc));
        var skipped = Item(new DateTime(2026, 10, 21, 12, 30, 0, DateTimeKind.Utc), ContentPlanStatus.Skipped);
        skipped.Id = "i2";

        // 15:30 in India now; today's 18:00 is still ahead.
        Assert.Equal(new DateTime(2026, 10, 21, 12, 30, 0, DateTimeKind.Utc),
            ContentPlanRules.NextFreeTime(topic, missed, [missed, skipped], Now));
    }

    [Fact]
    public void A_topic_without_fixed_days_moves_to_the_next_free_day()
    {
        var topic = Topic();
        var item = Item(new DateTime(2026, 10, 22, 12, 30, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 10, 23, 12, 30, 0, DateTimeKind.Utc), ContentPlanRules.NextFreeTime(topic, item, [item], Now));
    }

    [Fact]
    public void Only_a_post_still_being_worked_on_gets_later_ready_posts_to_swap_with()
    {
        var late = Item(new DateTime(2026, 10, 26, 12, 30, 0, DateTimeKind.Utc), ContentPlanStatus.InProgress);
        var ready = Item(new DateTime(2026, 11, 2, 12, 30, 0, DateTimeKind.Utc), ContentPlanStatus.Ready);
        ready.Id = "i2";
        var earlierReady = Item(new DateTime(2026, 10, 22, 12, 30, 0, DateTimeKind.Utc), ContentPlanStatus.Ready);
        earlierReady.Id = "i3";
        var idea = Item(new DateTime(2026, 11, 9, 12, 30, 0, DateTimeKind.Utc));
        idea.Id = "i4";

        Assert.Equal(["i2"], ContentPlanRules.SwapCandidates(late, [late, ready, earlierReady, idea], Now).Select(p => p.Id));
        Assert.Empty(ContentPlanRules.SwapCandidates(ready, [late, ready], Now));

        // Too close to go out for YouTube to take a new schedule.
        var dueNow = Item(Now.AddMinutes(5), ContentPlanStatus.Idea);
        Assert.Empty(ContentPlanRules.SwapCandidates(dueNow, [dueNow, ready], Now));
    }

    [Fact]
    public void Slots_follow_the_cadence_in_the_topic_time_zone()
    {
        var slots = ContentPlanRules.UpcomingSlots(Topic(DayOfWeek.Monday), Now);

        Assert.Equal(2, slots.Count);
        Assert.Equal(new DateOnly(2026, 10, 26), slots[0].LocalDate);
        // 18:00 IST is 12:30 UTC.
        Assert.Equal(new DateTime(2026, 10, 26, 12, 30, 0, DateTimeKind.Utc), slots[0].PublishAtUtc);
        Assert.Equal("t1:2026-10-26", slots[0].SlotKey);
    }

    [Fact]
    public void Todays_slot_is_kept_until_its_time_passes()
    {
        var today = ContentPlanRules.UpcomingSlots(Topic(DayOfWeek.Thursday), new DateTime(2026, 10, 21, 22, 0, 0, DateTimeKind.Utc));
        // 22:00 UTC is already Thursday 03:30 in India, and 18:00 there is still ahead.
        Assert.Equal(new DateOnly(2026, 10, 22), today[0].LocalDate);

        // 13:00 UTC is 18:30 in India: today's 18:00 slot has gone.
        var passed = ContentPlanRules.UpcomingSlots(Topic(DayOfWeek.Wednesday), Now.AddHours(3));
        Assert.DoesNotContain(passed, s => s.LocalDate == new DateOnly(2026, 10, 21));
    }

    [Fact]
    public void Missing_slots_skip_existing_and_dismissed_ones()
    {
        var topic = Topic(DayOfWeek.Monday, DayOfWeek.Thursday);
        topic.DismissedSlots.Add("t1:2026-10-22");
        var existing = new[] { new ContentPlanItem { SlotKey = "t1:2026-10-26" } };

        var missing = ContentPlanRules.MissingSlots(topic, existing, Now);

        Assert.DoesNotContain(missing, s => s.SlotKey is "t1:2026-10-22" or "t1:2026-10-26");
        Assert.Contains(missing, s => s.SlotKey == "t1:2026-10-29");
    }

    [Fact]
    public void No_slots_without_days_or_when_archived()
    {
        Assert.Empty(ContentPlanRules.UpcomingSlots(Topic(), Now));
        var archived = Topic(DayOfWeek.Monday);
        archived.Archived = true;
        Assert.Empty(ContentPlanRules.UpcomingSlots(archived, Now));
    }

    [Fact]
    public void Daylight_saving_gap_moves_forward_an_hour()
    {
        TimeZoneInfo.TryFindSystemTimeZoneById("Europe/London", out var london);
        Assert.NotNull(london);
        // 29 Mar 2026: clocks jump 01:00 -> 02:00, so 01:30 doesn't exist.
        var utc = ContentPlanRules.ToUtc(new DateOnly(2026, 3, 29), new TimeOnly(1, 30), london!);
        Assert.Equal(new DateTime(2026, 3, 29, 1, 30, 0, DateTimeKind.Utc), utc);
    }

    [Theory]
    [InlineData("18:00", true)]
    [InlineData("00:05", true)]
    [InlineData("24:00", false)]
    [InlineData("7:30", false)]
    [InlineData("18:00:00", false)]
    public void Publish_time_is_strict_hh_mm(string value, bool valid) =>
        Assert.Equal(valid, ContentPlanRules.TryParseTime(value, out _));

    [Fact]
    public void Late_preparation_is_flagged_after_the_lead_time()
    {
        var item = Item(Now.AddDays(2)); // lead is 3 days, so it's due already
        var attention = ContentPlanRules.Attention(item, 3, Now);
        Assert.Contains(attention, a => a.Code == "prep-late" && a.Level == ContentAttentionLevel.Warning);

        var early = ContentPlanRules.Attention(Item(Now.AddDays(10)), 3, Now);
        Assert.Empty(early);
    }

    [Fact]
    public void Missed_post_is_a_problem_and_sorted_first()
    {
        var attention = ContentPlanRules.Attention(Item(Now.AddHours(-1), ContentPlanStatus.InProgress), 3, Now);
        Assert.Equal("missed", attention[0].Code);
        Assert.Equal(ContentAttentionLevel.Problem, attention[0].Level);
    }

    [Fact]
    public void Ready_without_a_video_warns_on_the_last_day()
    {
        var far = ContentPlanRules.Attention(Item(Now.AddDays(3), ContentPlanStatus.Ready), 3, Now);
        Assert.Contains(far, a => a.Code == "upload-needed" && a.Level == ContentAttentionLevel.Info);

        var close = ContentPlanRules.Attention(Item(Now.AddHours(5), ContentPlanStatus.Ready), 3, Now);
        Assert.Contains(close, a => a.Code == "upload-needed" && a.Level == ContentAttentionLevel.Warning);
    }

    [Fact]
    public void Private_video_without_schedule_is_a_problem_and_needs_scheduling()
    {
        var item = Item(Now.AddDays(2), ContentPlanStatus.Ready);
        item.VideoId = "abcdefghijk";
        ContentPlanRules.ApplyYouTube(item, new ContentUploadSnapshot("abcdefghijk", "x", "private", null, Now, null), Now);

        Assert.Equal(ContentPlanStatus.Ready, item.Status);
        Assert.Contains(ContentPlanRules.Attention(item, 3, Now), a => a.Code == "not-scheduled");
        Assert.True(ContentPlanRules.NeedsSchedule(item, Now));
    }

    [Fact]
    public void Scheduled_at_the_planned_time_is_on_track()
    {
        var item = Item(Now.AddDays(2), ContentPlanStatus.InProgress);
        item.VideoId = "abcdefghijk";
        ContentPlanRules.ApplyYouTube(item, new ContentUploadSnapshot("abcdefghijk", "x", "private", item.PublishAt.AddSeconds(30), Now, null), Now);

        Assert.Equal(ContentPlanStatus.Scheduled, item.Status);
        Assert.NotNull(item.ReadyAt);
        Assert.False(ContentPlanRules.NeedsSchedule(item, Now));
        Assert.Empty(ContentPlanRules.Attention(item, 3, Now));
    }

    [Fact]
    public void Scheduled_at_another_time_is_a_mismatch()
    {
        var item = Item(Now.AddDays(2), ContentPlanStatus.Ready);
        item.VideoId = "abcdefghijk";
        ContentPlanRules.ApplyYouTube(item, new ContentUploadSnapshot("abcdefghijk", "x", "private", item.PublishAt.AddHours(3), Now, null), Now);

        Assert.Contains(ContentPlanRules.Attention(item, 3, Now), a => a.Code == "schedule-mismatch");
        Assert.True(ContentPlanRules.NeedsSchedule(item, Now));
    }

    [Fact]
    public void Public_video_marks_published_and_a_removed_one_falls_back_to_ready()
    {
        var item = Item(Now.AddHours(-2), ContentPlanStatus.Scheduled);
        item.VideoId = "abcdefghijk";
        ContentPlanRules.ApplyYouTube(item, new ContentUploadSnapshot("abcdefghijk", "x", "public", null, Now.AddHours(-2), null), Now);
        Assert.Equal(ContentPlanStatus.Published, item.Status);
        Assert.Empty(ContentPlanRules.Attention(item, 3, Now));

        ContentPlanRules.ApplyYouTube(item, null, Now);
        Assert.Equal(ContentPlanStatus.Ready, item.Status);
        Assert.Contains(ContentPlanRules.Attention(item, 3, Now), a => a.Code == "video-missing");
    }

    [Fact]
    public void Skipped_post_ignores_youtube()
    {
        var item = Item(Now.AddDays(1), ContentPlanStatus.Skipped);
        ContentPlanRules.ApplyYouTube(item, new ContentUploadSnapshot("abcdefghijk", "x", "public", null, Now, null), Now);
        Assert.Equal(ContentPlanStatus.Skipped, item.Status);
    }

    [Fact]
    public void Too_close_to_schedule_is_not_attempted()
    {
        var item = Item(Now.AddMinutes(5), ContentPlanStatus.Ready);
        item.VideoId = "abcdefghijk";
        item.YouTube = new ContentYouTubeState { Privacy = "private", Exists = true };
        Assert.False(ContentPlanRules.NeedsSchedule(item, Now));
    }

    [Fact]
    public void Upload_matches_by_scheduled_time_or_title_only_when_unambiguous()
    {
        var a = Item(Now.AddDays(2));
        var b = new ContentPlanItem { Id = "i2", Title = "Something else entirely", PublishAt = Now.AddDays(5) };

        var byTime = new ContentUploadSnapshot("abcdefghijk", "Untitled", "private", a.PublishAt, Now, null);
        Assert.Same(a, ContentPlanRules.MatchUpload(byTime, [a, b]));

        var byTitle = new ContentUploadSnapshot("abcdefghijk", "Morning routine that works #shorts", "private", null, Now, null);
        Assert.Same(a, ContentPlanRules.MatchUpload(byTitle, [a, b]));

        var twin = new ContentPlanItem { Id = "i3", Title = a.Title, PublishAt = Now.AddDays(9) };
        Assert.Null(ContentPlanRules.MatchUpload(byTitle, [a, twin]));

        var linked = Item(Now.AddDays(2));
        linked.VideoId = "zzzzzzzzzzz";
        Assert.Null(ContentPlanRules.MatchUpload(byTime, [linked]));
    }

    [Theory]
    [InlineData("dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ")]
    [InlineData("https://studio.youtube.com/video/dQw4w9WgXcQ/edit", "dQw4w9WgXcQ")]
    public void Video_reference_accepts_ids_and_links(string input, string expected)
    {
        Assert.True(ContentPlanRules.TryParseVideoReference(input, out var id));
        Assert.Equal(expected, id);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not a video")]
    [InlineData("https://evil-youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("http://studio.youtube.com/video/dQw4w9WgXcQ/edit")]
    [InlineData("https://studio.youtube.com.evil.tld/video/dQw4w9WgXcQ")]
    public void Video_reference_rejects_anything_else(string input) =>
        Assert.False(ContentPlanRules.TryParseVideoReference(input, out _));
}
