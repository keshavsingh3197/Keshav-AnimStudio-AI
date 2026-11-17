using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public sealed class YouTubeMonetizationPolicyAuditTests
{
    private static readonly DateTime Now = new(2026, 11, 17, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Healthy_original_channel_receives_strong_score_good_checks_and_honest_verify_steps()
    {
        var videos = new List<YouTubePolicyVideoInput>
        {
            new("vid1", "Why Kartik Purnima Deep Daan Lights Every Ghat", "In this episode we explore the Vedic meaning behind Kartik Purnima lamps and river offerings across Varanasi. #kartikpurnima #sanatan #katha", ["kartik purnima", "deep daan"], "27", false, false, Now.AddDays(-2), 4_200, "public", InPlaylist: true, UploadedByApp: true, ContainsSyntheticMedia: false),
            new("vid2", "How Young Dhruva Earned the Eternal Pole Star", "Narrated moral story from Vishnu Purana showing Dhruva's unwavering resolve in Madhuvana forest. #dhruva #vedickatha #shorts", ["dhruva", "vishnu purana"], "1", false, true, Now.AddDays(-5), 8_100, "public", InPlaylist: true, UploadedByApp: true, ContainsSyntheticMedia: false),
            new("vid3", "Gita Verse 2.47 Explained Through Everyday Choices", "Practical breakdown of Nishkama Karma with dialogue between Acharya and Shishya. #gita #karma #philosophy", ["bhagavad gita", "karma"], "27", false, false, Now.AddDays(-9), 2_900, "public", InPlaylist: true, UploadedByApp: false, ContainsSyntheticMedia: true),
        };

        var audit = YouTubeMonetizationPolicyAudit.Analyze(videos, playlistsKnown: true);

        Assert.Equal(YouTubeMonetizationPolicyAudit.OfficialPolicyUrl, audit.PolicyUrl);
        Assert.Equal("Strong", audit.OverallStatus);
        Assert.True(audit.ScoreOutOf100 >= 85);
        Assert.Equal(2, audit.AppUploadedCount);
        Assert.Equal(1, audit.MobileOrExternalCount);
        Assert.DoesNotContain(audit.Items, i => i.Verdict == "wrong");
        Assert.Contains(audit.Items, i => i.Verdict == "good" && i.Id == "policy-titles-unique");
        Assert.Contains(audit.Items, i => i.Verdict == "good" && i.Id == "policy-metadata-clean");
        Assert.Contains(audit.Items, i => i.Verdict == "good" && i.Id == "policy-reviewer-focus-good");
        Assert.Contains(audit.Items, i => i.Verdict == "verify" && i.Detail.Contains("outside AnimStudio", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(audit.Items, i => i.Verdict == "verify" && i.Title.Contains("1 upload(s)", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Repetitive_template_and_spam_metadata_on_mobile_uploads_are_flagged_as_wrong_with_steps()
    {
        var sameDesc = "Watch daily video and subscribe for more updates every single day! #daily #video #subscribe #like";
        var videos = new List<YouTubePolicyVideoInput>
        {
            new("v1", "Daily Panchang Part 1 #panchang", sameDesc, [], null, null, true, Now.AddDays(-1), 500, "public", InPlaylist: false, UploadedByApp: false),
            new("v2", "Daily Panchang Part 2 #panchang", sameDesc, [], null, null, true, Now.AddDays(-2), 900, "public", InPlaylist: false, UploadedByApp: false),
            new("v3", "Daily Panchang Part 3 #panchang", sameDesc + "\nTags: panchang, rashifal, daily, today, hindu, panchang2", [], null, false, true, Now.AddDays(-3), 1200, "public", InPlaylist: false, UploadedByApp: false),
        };

        var audit = YouTubeMonetizationPolicyAudit.Analyze(videos, playlistsKnown: true);

        Assert.Equal("AtRisk", audit.OverallStatus);
        Assert.True(audit.ScoreOutOf100 < 65);
        Assert.Equal(0, audit.AppUploadedCount);
        Assert.Equal(3, audit.MobileOrExternalCount);
        Assert.Contains(audit.Items, i => i.Verdict == "wrong" && i.Id == "policy-inauthentic-titles");
        Assert.Contains(audit.Items, i => i.Verdict == "wrong" && i.Id == "policy-metadata-quality");
        Assert.Contains(audit.Items, i => i.Verdict == "wrong" && i.Id == "policy-audience-unset");
        Assert.Contains(audit.Items, i => i.Verdict == "wrong" && i.Id == "policy-playlists-missing");
        Assert.All(audit.Items, i => Assert.NotEmpty(i.Steps));
    }

    [Fact]
    public void Channel_analyzer_rule_report_and_prompt_block_include_policy_audit_details()
    {
        var policy = YouTubeMonetizationPolicyAudit.Analyze(
        [
            new("v1", "VID_20261117", "", [], null, null, true, Now.AddDays(-1), 800, "public", UploadedByApp: false),
            new("v2", "Short 2", "", [], null, null, true, Now.AddDays(-2), 400, "public", UploadedByApp: false),
            new("v3", "Fresh Original Episode About Ayodhya", "Full narrative explaining history and culture with original script and voiceover. #ayodhya #history", ["ayodhya"], "27", false, false, Now.AddDays(-3), 1_500, "public", UploadedByApp: true),
        ]);

        var analysis = new YouTubeChannelAnalysis
        {
            ChannelTitle = "Test Studio",
            Videos =
            [
                new() { VideoId = "v1", Title = "VID_20261117", PublishedAtUtc = Now.AddDays(-1), DurationSeconds = 45, Privacy = "public", Views = 800 },
                new() { VideoId = "v2", Title = "Short 2", PublishedAtUtc = Now.AddDays(-2), DurationSeconds = 50, Privacy = "public", Views = 400 },
                new() { VideoId = "v3", Title = "Fresh Original Episode About Ayodhya", PublishedAtUtc = Now.AddDays(-3), DurationSeconds = 320, Privacy = "public", Views = 1_500 },
            ],
            PolicyAudit = policy
        };

        var insights = YouTubeChannelAnalyzer.Insights(analysis, Now);
        var block = YouTubeChannelAnalyzer.ChannelBlock(analysis, insights);
        var report = YouTubeChannelAnalyzer.RuleReport(analysis, insights, null, Now);

        Assert.Contains(YouTubeMonetizationPolicyAudit.OfficialPolicyUrl, block);
        Assert.Contains(report.Suggestions, s => s.Title.StartsWith("Verify 2 mobile / external upload(s)", StringComparison.Ordinal));
        Assert.NotEmpty(report.WhatToFix);
    }
}
