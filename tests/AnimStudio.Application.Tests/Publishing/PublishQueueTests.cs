using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>All titles, tags and times here are synthetic.</summary>
public class PublishQueueRulesTests
{
    private static readonly DateTime Now = new(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
    private static readonly TimeSpan Lead = TimeSpan.FromHours(2);

    [Fact]
    public void A_public_release_starts_uploading_ahead_of_its_time()
    {
        var at = Now.AddDays(1);
        Assert.Equal(at - Lead, PublishQueueRules.DueAt(PublishQueueState.Waiting, at, PublishQueueMode.ReleaseOnYouTube, "public", Lead));
    }

    [Theory]
    [InlineData("unlisted")]
    [InlineData("private")]
    public void Only_a_public_video_can_be_released_by_youtube(string privacy)
    {
        var at = Now.AddDays(1);
        Assert.Equal(PublishQueueMode.UploadAtTime, PublishQueueRules.EffectiveMode(PublishQueueMode.ReleaseOnYouTube, privacy));
        Assert.Equal(at, PublishQueueRules.DueAt(PublishQueueState.Waiting, at, PublishQueueMode.ReleaseOnYouTube, privacy, Lead));
    }

    [Theory]
    [InlineData(PublishQueueState.Held)]
    [InlineData(PublishQueueState.Uploading)]
    [InlineData(PublishQueueState.Published)]
    [InlineData(PublishQueueState.Failed)]
    public void Only_a_waiting_item_is_ever_due(PublishQueueState state) =>
        Assert.Null(PublishQueueRules.DueAt(state, Now, PublishQueueMode.UploadAtTime, "public", Lead));

    [Fact]
    public void YouTube_is_asked_to_release_only_while_there_is_time_left()
    {
        Assert.Equal(Now.AddHours(1), PublishQueueRules.YouTubeReleaseAt(PublishQueueMode.ReleaseOnYouTube, "public", Now.AddHours(1), Now));
        // Under the 10-minute lead YouTube insists on, it goes up public at once instead.
        Assert.Null(PublishQueueRules.YouTubeReleaseAt(PublishQueueMode.ReleaseOnYouTube, "public", Now.AddMinutes(8), Now));
        Assert.Null(PublishQueueRules.YouTubeReleaseAt(PublishQueueMode.UploadAtTime, "public", Now.AddHours(1), Now));
    }

    [Fact]
    public void A_time_a_moment_ago_reads_as_now_but_a_past_one_is_refused()
    {
        Assert.Equal(Now, PublishQueueRules.CheckSchedule(Now.AddMinutes(-2), Now).At);
        Assert.NotNull(PublishQueueRules.CheckSchedule(Now.AddHours(-1), Now).Error);
        Assert.NotNull(PublishQueueRules.CheckSchedule(Now.AddDays(400), Now).Error);
        Assert.NotNull(PublishQueueRules.CheckSchedule(null, Now).Error);
    }

    [Fact]
    public void A_time_without_a_zone_is_read_as_utc()
    {
        var unspecified = new DateTime(2026, 3, 11, 18, 0, 0, DateTimeKind.Unspecified);
        var at = PublishQueueRules.CheckSchedule(unspecified, Now).At!.Value;
        Assert.Equal(DateTimeKind.Utc, at.Kind);
        Assert.Equal(18, at.Hour);
    }

    [Fact]
    public void Transient_failures_are_retried_until_the_limit_with_growing_waits()
    {
        Assert.True(PublishQueueRules.ShouldRetry("youtube-unreachable", 1));
        Assert.True(PublishQueueRules.ShouldRetry("queue-upload-lost", 2));
        Assert.False(PublishQueueRules.ShouldRetry("youtube-unreachable", PublishQueueRules.MaxAttempts));
        Assert.False(PublishQueueRules.ShouldRetry("youtube-reconnect", 1));
        Assert.False(PublishQueueRules.ShouldRetry("title-too-long", 1));
        Assert.True(PublishQueueRules.RetryDelay(2) > PublishQueueRules.RetryDelay(1));
    }

    [Fact]
    public void Busy_upload_slots_do_not_count_as_a_failure() =>
        Assert.True(PublishQueueRules.IsBusy("youtube-too-many-uploads"));

    [Fact]
    public void Uploading_and_published_items_are_locked_for_editing()
    {
        Assert.False(PublishQueueRules.CanEdit(PublishQueueState.Uploading));
        Assert.False(PublishQueueRules.CanEdit(PublishQueueState.Published));
        Assert.True(PublishQueueRules.CanEdit(PublishQueueState.Failed));
    }

    [Fact]
    public void Spread_spaces_items_evenly()
    {
        var times = PublishQueueRules.Spread(Now, TimeSpan.FromHours(6), 3);
        Assert.Equal([Now, Now.AddHours(6), Now.AddHours(12)], times);
    }
}

public class YouTubeCategorySuggesterTests
{
    [Fact]
    public void A_bhajan_is_music()
    {
        var best = YouTubeCategorySuggester.Suggest(new("Shiv Bhajan - Om Namah Shivaya (Lyrics)", null, ["bhajan", "devotional song"]))[0];
        Assert.Equal("10", best.CategoryId);
        Assert.Equal("strong", best.Confidence);
        Assert.Contains("bhajan", best.Reason);
    }

    [Fact]
    public void Hindi_words_are_matched_whole()
    {
        Assert.Equal("10", YouTubeCategorySuggester.Best(new("सुबह की आरती", null, null)));
    }

    [Fact]
    public void An_animated_story_is_film_and_animation()
    {
        Assert.Equal("1", YouTubeCategorySuggester.Best(new("The Clever Crow | 3D Animated Kahani for Kids", "A short story.", ["cartoon"])));
    }

    [Fact]
    public void A_how_to_is_howto_and_style()
    {
        Assert.Equal("26", YouTubeCategorySuggester.Best(new("How to make a paper lantern - DIY step by step", null, null)));
    }

    [Fact]
    public void Words_inside_other_words_do_not_match()
    {
        // "carpet" must not read as "car", nor "gamekeeper" as "game".
        var list = YouTubeCategorySuggester.Suggest(new("Carpet cleaning with a gamekeeper", null, null));
        Assert.DoesNotContain(list, s => s.CategoryId is "2" or "20");
    }

    [Fact]
    public void A_music_project_is_music_whatever_its_title_says()
    {
        Assert.Equal("10", YouTubeCategorySuggester.Best(new("Episode 4", null, null, IsMusicProject: true)));
    }

    [Fact]
    public void Nothing_to_go_on_falls_back_to_the_channel_default_then_animation()
    {
        var list = YouTubeCategorySuggester.Suggest(new("Untitled 7", null, null, ChannelDefault: "24"));
        Assert.Equal(["24", "1"], list.Select(s => s.CategoryId));
        Assert.All(list, s => Assert.Equal("weak", s.Confidence));
    }

    [Fact]
    public void Only_assignable_categories_are_suggested()
    {
        var list = YouTubeCategorySuggester.Suggest(new("Funny cricket game prank vlog news", "travel recipe song", ["tech"]));
        Assert.All(list, s => Assert.True(YouTubePublishValidator.Categories.ContainsKey(s.CategoryId)));
        Assert.True(list.Count <= YouTubeCategorySuggester.MaxSuggestions);
    }
}

public class PublishSlotSuggesterTests
{
    // A Tuesday morning in India.
    private static readonly DateTime Now = new(2026, 3, 10, 3, 30, 0, DateTimeKind.Utc);
    private static readonly TimeZoneInfo India = PublishSlotSuggester.ResolveTimeZone("Asia/Kolkata");

    private static DateTime Local(DateTime utc) => TimeZoneInfo.ConvertTimeFromUtc(utc, India);

    [Fact]
    public void Shorts_get_the_peak_hours_on_the_owners_clock()
    {
        var slots = PublishSlotSuggester.Suggest(new(Now, India, IsShort: true, [], [], Count: 3));
        Assert.Equal([12, 18, 20], slots.Select(s => Local(s.At).Hour));
        Assert.All(slots, s => Assert.Equal(DateTimeKind.Utc, s.At.Kind));
    }

    [Fact]
    public void Long_videos_get_one_a_day()
    {
        var slots = PublishSlotSuggester.Suggest(new(Now, India, IsShort: false, [], [], Count: 3));
        Assert.Equal(3, slots.Select(s => Local(s.At).Date).Distinct().Count());
    }

    [Fact]
    public void Times_already_taken_are_kept_clear()
    {
        var taken = Now.Date.AddHours(12).AddMinutes(30); // 18:00 in India
        var slots = PublishSlotSuggester.Suggest(new(Now, India, true, [taken], [], Count: 4));
        Assert.All(slots, s => Assert.True((s.At - taken).Duration() >= TimeSpan.FromHours(2)));
    }

    [Fact]
    public void The_channels_usual_hour_is_preferred()
    {
        // Five past videos at 21:00 India time.
        var history = Enumerable.Range(1, 5).Select(d => Now.Date.AddDays(-d).AddHours(15).AddMinutes(30)).ToList();
        var slots = PublishSlotSuggester.Suggest(new(Now, India, true, [], history, Count: 6));
        Assert.Contains(slots, s => Local(s.At).Hour == 21 && s.Reason == "Your usual time");
    }

    [Fact]
    public void Nothing_is_suggested_too_soon()
    {
        var slots = PublishSlotSuggester.Suggest(new(Now.Date.AddHours(6).AddMinutes(10), India, true, [], [], Count: 1)); // 11:40 India
        Assert.True(slots[0].At - Now.Date.AddHours(6).AddMinutes(10) >= TimeSpan.FromMinutes(45));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Not/AZone")]
    [InlineData("../../etc")]
    public void An_unknown_zone_is_utc(string? id) => Assert.Equal(TimeZoneInfo.Utc, PublishSlotSuggester.ResolveTimeZone(id));
}
