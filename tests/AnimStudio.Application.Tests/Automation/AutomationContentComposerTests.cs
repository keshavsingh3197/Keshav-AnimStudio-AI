using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Automation;

namespace AnimStudio.Application.Tests.Automation;

public class AutomationContentComposerTests
{
    private static StudioEcosystemConfig SampleEcosystem() => new(
        StudioTitle: "AnimStudio AI",
        StudioTagline: "AI Shorts & Stories",
        CreatorName: "Creator",
        CreatorPortfolioUrl: "https://example.com",
        LegalUpdatedDate: "2026-11-14",
        CopyrightNotice: "Copyright",
        AdminUrl: "https://admin.example.com",
        IdpUrl: "https://id.example.com",
        StudioUrl: "https://studio.example.com",
        DefaultChannelKey: "ch-devo",
        EngineName: "AnimStudio Engine",
        VisualsCredit: null,
        DefaultBranding: new ChannelBranding(),
        Websites:
        [
            new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Vedic Calendar", "https://panchang.example.com", null, null, null, null, true, 1),
            new EcosystemWebsiteItem("studio", "AnimStudio AI", "Studio", "AI Video Maker", "https://studio.example.com", null, null, null, null, false, 2),
            new EcosystemWebsiteItem("pratiyogita", "Pratiyogita Hub", "Pratiyogita", "Competitions", "https://pratiyogita.example.com", null, null, null, null, false, 3),
            new EcosystemWebsiteItem("blog", "Content Blog", "Blog", "Articles", "https://blog.example.com", null, null, null, null, false, 4),
            new EcosystemWebsiteItem("social", "SocialPulse", "SocialPulse", "Analytics", "https://social.example.com", null, null, null, null, false, 5)
        ],
        Channels:
        [
            new EcosystemChannelItem(
                Key: "ch-devo",
                Name: "Devotional Channel",
                Handle: "@devotionaltest",
                Platform: "YouTube",
                ChannelId: "UC_DEVO_TEST",
                Url: "https://youtube.com/@devotionaltest",
                Niche: "Hindu Panchang & Bhakti",
                Tagline: "Daily Vedic Wisdom",
                Description: null,
                EngineName: null,
                VisualsCredit: null,
                Hashtags: ["SanatanDharma", "Bhakti"],
                Tags: ["Panchang", "Vedic"],
                RetiredHandles: [],
                RetiredUrls: [],
                IsPrimary: true,
                SortOrder: 1),
            new EcosystemChannelItem(
                Key: "ch-world",
                Name: "World & History Channel",
                Handle: "@worldhistorytest",
                Platform: "YouTube",
                ChannelId: "UC_WORLD_TEST",
                Url: "https://youtube.com/@worldhistorytest",
                Niche: "World History & Learning",
                Tagline: "On This Day",
                Description: null,
                EngineName: null,
                VisualsCredit: null,
                Hashtags: ["WorldHistory"],
                Tags: ["Itihaas", "GK"],
                RetiredHandles: [],
                RetiredUrls: [],
                IsPrimary: false,
                SortOrder: 2)
        ],
        SocialLinks: [],
        RetiredChannelUrls: [],
        RetiredChannelNames: [],
        SyncedFromCentral: true,
        LastSyncedAt: DateTimeOffset.UtcNow);

    private static EcosystemSignalsSnapshot SampleSignals(string dateKey = "2026-11-14") => new(
        DateKey: dateKey,
        Location: "New Delhi, India",
        Panchang: new EcosystemPanchangSignal(
            DateKey: dateKey,
            Location: "New Delhi, India",
            Tithi: "Shukla Panchami",
            TithiEndTime: "04:15 PM",
            Nakshatra: "Rohini",
            NakshatraEndTime: "07:45 PM",
            Yoga: "Siddha",
            Karana: "Bava",
            Vaara: "Shanivara",
            Paksha: "Shukla Paksha",
            MonthPurnimanta: "Margashirsha",
            VikramSamvat: "2083",
            Sunrise: "06:42 AM",
            Sunset: "05:29 PM",
            AbhijitMuhurat: "11:44 AM - 12:28 PM",
            BrahmaMuhurat: "05:06 AM - 05:54 AM",
            AmritKaal: "08:10 AM - 09:42 AM",
            RahuKaal: "09:20 AM - 10:42 AM",
            DailySanskritSutra: "सत्यमेव जयते",
            DailySutraMeaning: "Truth alone triumphs."),
        UpcomingFestivals:
        [
            new EcosystemFestivalSignal("f1", "छठ पूजा", "Chhath Puja", dateKey, "Shukla Shashthi", "Kartika", "Sun worship festival.", "Arghya at sunset", "Nirjala", true, "Vrat"),
            new EcosystemFestivalSignal("f2", "देव दीपावली", "Dev Deepawali", "2026-11-20", "Purnima", "Kartika", "Festival of lights in Kashi.", null, null, true, "Festival")
        ],
        DailyKatha: new EcosystemDailyKathaSignal(
            Id: "k1",
            Title: "Savitr & Surya Upasana",
            DeityOrSage: "Bhagwan Surya",
            StorySummary: "Offering morning Arghya builds steadiness and discipline.",
            MoralTeaching: "Consistency illuminates even the hardest path.",
            SanskritMantra: "ॐ घृणि सूर्याय नमः"),
        HistoricalIncidents:
        [
            new EcosystemHistoricalSignal("h1", dateKey, 1922, "BBC Begins Daily Radio Broadcast", "Media & World", "The British Broadcasting Company begins regular daily transmissions.", "Marked a turning point in global mass communication."),
            new EcosystemHistoricalSignal("h2", dateKey, 1889, "Historic Birth Anniversary", "India History", "Key milestone in modern Indian history.", null)
        ],
        Competitions:
        [
            new EcosystemCompetitionSignal("c1", "Sanskriti Quiz 2026", "Culture & GK", "Active", "Certificates & Featured Hall of Fame", "2026-11-30", null)
        ],
        FunnelCampaigns:
        [
            new EcosystemFunnelCampaignSignal("fc1", "panchang-daily", "Daily Panchang Web", "youtube", "https://panchang.example.com/daily", "Check Panchang")
        ],
        Warnings: [],
        FetchedAtUtc: DateTimeOffset.UtcNow);

    [Fact]
    public void ComposeForRule_PanchangHindi_EmbedsMuhuratAndTrackedWebsiteLinks()
    {
        var rule = new AutomationRule
        {
            Id = "ar_panchang",
            Name = "Daily Morning Panchang",
            SourceType = AutomationSourceType.HinduPanchang,
            VideoFormat = AutomationVideoFormat.Vertical,
            TargetChannelId = "UC_DEVO_TEST",
            TargetChannelHandle = "@devotionaltest",
            Language = "hi",
            IncludePinnedComment = true
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, SampleSignals(), SampleEcosystem());

        var item = Assert.Single(composed);
        Assert.Equal("panchang:2026-11-14", item.SourceItemKey);
        Assert.True(item.Title.Length <= 95);
        Assert.Contains("Shukla Panchami", item.Title);
        Assert.Contains("11:44 AM - 12:28 PM", item.Script);
        Assert.Contains("09:20 AM - 10:42 AM", item.Script);
        Assert.Contains("9:16 vertical short reel", item.AiVideoPrompt);
        Assert.Contains("utm_source=youtube&utm_medium=automation&utm_campaign=auto_hindupanchang_20261114&utm_content=devotionaltest", item.PrimaryDestinationUrl);
        Assert.NotNull(item.PinnedComment);
        Assert.Contains("https://panchang.example.com", item.Description);
        Assert.InRange(item.Tags.Count, 5, 22);
    }

    [Fact]
    public void ComposeForRule_AajKaItihaasEnglish_RoutesMultiSiteFunnelLinksAndWideFormat()
    {
        var rule = new AutomationRule
        {
            Id = "ar_history",
            Name = "On This Day Documentary",
            SourceType = AutomationSourceType.AajKaItihaas,
            VideoFormat = AutomationVideoFormat.Wide,
            TargetChannelId = "UC_WORLD_TEST",
            TargetChannelHandle = "@worldhistorytest",
            Language = "en",
            IncludePinnedComment = true
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, SampleSignals(), SampleEcosystem());

        var item = Assert.Single(composed);
        Assert.Contains("1922", item.Title);
        Assert.Contains("BBC Begins Daily Radio Broadcast", item.Title);
        Assert.Contains("16:9 widescreen cinematic", item.AiVideoPrompt);
        Assert.Contains("Why it shaped today", item.Script);
        Assert.Contains(item.TrackedLinks, l => l.Key == "panchang");
        Assert.Contains(item.TrackedLinks, l => l.Key == "pratiyogita");
        Assert.Contains(item.TrackedLinks, l => l.Key == "blog");
    }

    [Fact]
    public void ComposeForRule_Festivals_HonorsFestivalLeadDaysWindow()
    {
        var rule = new AutomationRule
        {
            Id = "ar_fest",
            Name = "Upcoming Hindu Festivals",
            SourceType = AutomationSourceType.HinduFestival,
            FestivalLeadDays = 1,
            Language = "hi"
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, SampleSignals("2026-11-14"), SampleEcosystem());

        var item = Assert.Single(composed);
        Assert.Contains("Chhath Puja", item.SourceTitle);
        Assert.DoesNotContain(composed, c => c.SourceTitle.Contains("Dev Deepawali"));
    }

    [Fact]
    public void ComposeForRule_DailyKatha_IncludesDeityMantraAndFunnel()
    {
        var rule = new AutomationRule
        {
            Id = "ar_katha",
            Name = "Evening Katha",
            SourceType = AutomationSourceType.DailyKatha,
            Language = "en",
            FunnelWebsiteKeys = ["panchang", "social"]
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, SampleSignals(), SampleEcosystem());

        var item = Assert.Single(composed);
        Assert.Contains("Bhagwan Surya", item.Title);
        Assert.Contains("ॐ घृणि सूर्याय नमः", item.Script);
        Assert.Contains(item.TrackedLinks, l => l.Key == "social");
    }

    [Theory]
    [InlineData("https://keshav-hindu-panchang.onrender.com/api/", true, "https://keshav-hindu-panchang.onrender.com")]
    [InlineData("http://localhost:5050/api", true, "http://localhost:5050")]
    [InlineData("http://127.0.0.1:8080", true, "http://127.0.0.1:8080")]
    [InlineData("http://insecure-remote.example.com", false, null)]
    [InlineData("javascript:alert(1)", false, null)]
    public void IsSafeEndpoint_AcceptsHttpsAndLoopbackRejectsInsecureRemote(string input, bool expectedOk, string? expectedNorm)
    {
        var ok = EcosystemSignalsClient.IsSafeEndpoint(input, out var normalized);
        Assert.Equal(expectedOk, ok);
        Assert.Equal(expectedNorm, normalized);
    }
}
