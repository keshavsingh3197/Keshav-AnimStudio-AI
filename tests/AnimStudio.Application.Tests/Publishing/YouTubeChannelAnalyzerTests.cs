using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Reading a channel's recent videos into findings, and a plan from them when no model is on.</summary>
public sealed class YouTubeChannelAnalyzerTests
{
    private static readonly DateTime Now = new(2026, 11, 5, 12, 0, 0, DateTimeKind.Utc);

    private static YouTubeAnalyzedVideo Video(int n, int daysAgo, long views, double seconds, string privacy = "public", long likes = 10, long comments = 1) => new()
    {
        VideoId = $"vid{n:00000000}",
        Title = $"Story {n}",
        PublishedAtUtc = Now.AddDays(-daysAgo),
        DurationSeconds = seconds,
        Privacy = privacy,
        Views = views,
        Likes = likes,
        Comments = comments,
        Tags = ["story"]
    };

    /// <summary>Ten videos two days apart; Shorts get about four times the views a day of the long ones.</summary>
    private static YouTubeChannelAnalysis Channel() => new()
    {
        ChannelTitle = "Kahani Ghar",
        Subscribers = 1200,
        Videos =
        [
            .. Enumerable.Range(0, 5).Select(i => Video(i, 3 + i * 4, 4_000, 45)),
            .. Enumerable.Range(5, 5).Select(i => Video(i, 3 + (i - 5) * 4 + 2, 1_000, 420)),
            Video(99, 1, 50_000, 60, privacy: "private")
        ]
    };

    [Fact]
    public void Shorts_and_longer_videos_are_compared_by_views_a_day_and_private_videos_are_left_out()
    {
        var insights = YouTubeChannelAnalyzer.Insights(Channel(), Now);

        Assert.Equal(10, insights.PublicVideos);
        Assert.Equal(5, insights.Shorts);
        Assert.Equal(5, insights.LongVideos);
        Assert.True(insights.ShortsMedianViewsPerDay > insights.LongMedianViewsPerDay);
        Assert.Contains(insights.Findings, f => f.Kind == "good" && f.Text.StartsWith("Shorts get", StringComparison.Ordinal));
        Assert.DoesNotContain(insights.Top, s => s.Video.VideoId == "vid00000099");
        Assert.Equal(2, insights.DaysBetweenUploads);
        Assert.Equal(3, insights.DaysSinceLastUpload);
    }

    [Fact]
    public void A_channel_that_has_gone_quiet_is_told_so()
    {
        var channel = new YouTubeChannelAnalysis
        {
            ChannelTitle = "Quiet",
            Videos = [.. Enumerable.Range(0, 4).Select(i => Video(i, 30 + i * 20, 500, 300))]
        };

        var insights = YouTubeChannelAnalyzer.Insights(channel, Now);

        Assert.Contains(insights.Findings, f => f.Kind == "warn" && f.Text.Contains("30 days ago", StringComparison.Ordinal));
        Assert.Contains(insights.Findings, f => f.Kind == "warn" && f.Text.Contains("every 20 days", StringComparison.Ordinal));
    }

    [Fact]
    public void The_plan_without_a_model_builds_on_the_best_video_and_invents_nothing()
    {
        var channel = Channel();
        var insights = YouTubeChannelAnalyzer.Insights(channel, Now);

        var report = YouTubeChannelAnalyzer.RuleReport(channel, insights, goal: null, Now);

        Assert.Equal("built-in", report.By);
        Assert.Contains("10 public videos", report.Summary);
        Assert.Contains(report.Suggestions, s => s.Title == "Follow up your best video");
        Assert.Equal($"{insights.Top[0].Video.Title} - Part 2", report.Ideas[0].Title);
        Assert.NotEmpty(report.Plan);
    }

    [Fact]
    public void A_few_more_views_do_not_count_as_new_numbers_but_a_real_change_or_a_new_goal_does()
    {
        var channel = Channel();
        var before = YouTubeChannelAnalyzer.Fingerprint(channel, "grow subscribers");

        channel.Videos[0].Views += 15;
        Assert.Equal(before, YouTubeChannelAnalyzer.Fingerprint(channel, "grow subscribers"));

        channel.Videos[0].Views *= 3;
        Assert.NotEqual(before, YouTubeChannelAnalyzer.Fingerprint(channel, "grow subscribers"));
        Assert.NotEqual(YouTubeChannelAnalyzer.Fingerprint(channel, "grow subscribers"), YouTubeChannelAnalyzer.Fingerprint(channel, "more Shorts"));
    }

    [Fact]
    public void The_models_report_is_read_defensively()
    {
        Assert.Null(YouTubeChannelAnalyzer.ParseReport("not json"));
        Assert.Null(YouTubeChannelAnalyzer.ParseReport("""{"suggestions": []}"""));

        var report = YouTubeChannelAnalyzer.ParseReport(
            """
            {"summary": "Doing well.",
             "whatWorks": ["Shorts", 4],
             "suggestions": [{"title": "Post weekly", "priority": "URGENT"}, {"detail": "no title"}, {"title": "Reply", "priority": "High"}],
             "plan": [{"when": "Day 1", "action": "Make part 2"}, {"when": "Day 2"}],
             "ideas": [{"title": "A Short", "format": "SHORT"}, {"title": "A long one", "format": "film"}]}
            """)!;

        Assert.Equal("Doing well.", report.Summary);
        Assert.Equal(["Shorts"], report.WhatWorks);
        Assert.Equal(["medium", "high"], report.Suggestions.Select(s => s.Priority));
        Assert.Single(report.Plan);
        Assert.Equal(["short", "long"], report.Ideas.Select(i => i.Format));
    }

    [Fact]
    public void The_model_is_given_the_numbers_one_video_a_line_without_private_ones()
    {
        var channel = Channel();
        var block = YouTubeChannelAnalyzer.VideosBlock(channel, Now);

        Assert.Equal(10, block.Split('\n').Length);
        Assert.DoesNotContain("Story 99", block);
        Assert.Contains("Subscribers: 1200", YouTubeChannelAnalyzer.ChannelBlock(channel, YouTubeChannelAnalyzer.Insights(channel, Now)));
    }
    [Fact]
    public void The_upload_gap_that_did_best_on_this_channel_is_recommended()
    {
        // Long videos alternating: one six days after the one before (30 views a day), one a day after it (10 a day).
        var ages = new[] { 100, 94, 93, 87, 86, 80, 79, 73, 72 };
        var channel = new YouTubeChannelAnalysis
        {
            ChannelTitle = "Rhythm",
            Videos = [.. ages.Select((age, i) => Video(i, age, (i % 2 == 1 ? 30 : 10) * age, 420))]
        };

        var rhythm = YouTubeChannelAnalyzer.Insights(channel, Now).Rhythm!;

        Assert.True(rhythm.FromHistory);
        Assert.Equal(5, rhythm.RecommendedGapDays);
        Assert.Contains(rhythm.Buckets, b => b.Label == "5-7 days" && b.Videos == 4 && b.MedianScore > 2.5);
        Assert.Contains(rhythm.Buckets, b => b.Label == "1-2 days" && b.Videos == 4);
        Assert.False(rhythm.LastIsHot);
        Assert.Contains("Upload rhythm: leave about 5 days", YouTubeChannelAnalyzer.ChannelBlock(channel, YouTubeChannelAnalyzer.Insights(channel, Now)));
    }

    [Fact]
    public void A_young_upload_doing_well_is_given_room_before_the_next()
    {
        var channel = new YouTubeChannelAnalysis
        {
            ChannelTitle = "Hot",
            Videos = [.. new[] { 30, 25, 20, 15, 10 }.Select((age, i) => Video(i, age, 100L * age, 45)), Video(9, 2, 2_000, 45)]
        };

        var rhythm = YouTubeChannelAnalyzer.Insights(channel, Now).Rhythm!;

        Assert.False(rhythm.FromHistory);
        Assert.True(rhythm.LastIsHot);
        Assert.True(rhythm.LastIsShort);
        Assert.Equal(3, rhythm.RecommendedGapDays);
        Assert.Equal("Story 9", rhythm.LastUploadTitle);
    }

    [Fact]
    public void Analytics_numbers_name_the_video_that_brought_the_most_subscribers()
    {
        var channel = Channel();
        for (var i = 0; i < channel.Videos.Count; i++)
            channel.Videos[i].Analytics = new YouTubeVideoAnalytics { SubscribersGained = i == 6 ? 40 : 2, AverageViewPercent = 50 };

        var insights = YouTubeChannelAnalyzer.Insights(channel, Now);

        Assert.Contains(insights.Findings, f => f.Kind == "good" && f.Text.StartsWith("\"Story 6\" brought the most subscribers (40)", StringComparison.Ordinal));
        Assert.Contains("| 40 | 50", YouTubeChannelAnalyzer.VideosBlock(channel, Now));
    }

    [Fact]
    public void A_plan_kept_from_before_Analytics_still_matches_until_Analytics_numbers_arrive()
    {
        var channel = Channel();
        var before = YouTubeChannelAnalyzer.Fingerprint(channel, null);
        Assert.Equal(before, YouTubeChannelAnalyzer.Fingerprint(channel, null));

        channel.Videos[0].Analytics = new YouTubeVideoAnalytics { SubscribersGained = 12 };
        Assert.NotEqual(before, YouTubeChannelAnalyzer.Fingerprint(channel, null));
    }
}
