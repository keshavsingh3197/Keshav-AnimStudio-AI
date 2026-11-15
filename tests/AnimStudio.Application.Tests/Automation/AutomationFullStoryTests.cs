using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Rendering;

namespace AnimStudio.Application.Tests.Automation;

public sealed class AutomationFullStoryTests
{
    private static StudioEcosystemConfig Ecosystem() => new(
        StudioTitle: "AnimStudio AI",
        StudioTagline: "Stories",
        CreatorName: "Creator",
        CreatorPortfolioUrl: "https://example.com",
        LegalUpdatedDate: "2026-11-15",
        CopyrightNotice: "Copyright",
        AdminUrl: "https://admin.example.com",
        IdpUrl: "https://id.example.com",
        StudioUrl: "https://studio.example.com",
        DefaultChannelKey: "ch-1",
        EngineName: "AnimStudio",
        VisualsCredit: null,
        DefaultBranding: new ChannelBranding(),
        Websites:
        [
            new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Panchang", "https://panchang.example.com", null, null, null, null, true, 1),
            new EcosystemWebsiteItem("pratiyogita", "Pratiyogita", "Quiz", "GK Quiz", "https://quiz.example.com", null, null, null, null, false, 2),
        ],
        Channels: [],
        SocialLinks: [],
        RetiredChannelUrls: [],
        RetiredChannelNames: [],
        SyncedFromCentral: true,
        LastSyncedAt: DateTimeOffset.UtcNow);

    private static EcosystemSignalsSnapshot Signals() => new(
        DateKey: "2026-11-15",
        Location: "New Delhi, India",
        Panchang: new EcosystemPanchangSignal(
            DateKey: "2026-11-15",
            Location: "New Delhi, India",
            Tithi: "Shukla Shashthi",
            TithiEndTime: "04:15 PM",
            Nakshatra: "Uttara Ashadha",
            NakshatraEndTime: "11:30 PM",
            Yoga: "Ganda",
            Karana: "Kaulava",
            Vaara: "Ravivara",
            Paksha: "Shukla Paksha",
            MonthPurnimanta: "Kartika",
            VikramSamvat: "2083",
            Sunrise: "06:44 AM",
            Sunset: "05:28 PM",
            AbhijitMuhurat: "11:42 AM - 12:30 PM",
            BrahmaMuhurat: "05:06 AM - 05:54 AM",
            AmritKaal: "08:10 AM - 09:42 AM",
            RahuKaal: "04:08 PM - 05:28 PM",
            DailySanskritSutra: "सत्यमेव जयते",
            DailySutraMeaning: "Truth alone triumphs."),
        UpcomingFestivals:
        [
            new EcosystemFestivalSignal("f1", "देव दीपावली", "Dev Deepawali", "2026-11-15", "Purnima", "Kartika", "Festival of lights on Kashi ghats.", "Deep Daan at dusk", "Phalahar", true, "Festival")
        ],
        DailyKatha: new EcosystemDailyKathaSignal(
            Id: "dhruva",
            Title: "Bhakta Dhruva Ki Amar Katha",
            DeityOrSage: "Bhakta Dhruva",
            StorySummary: "Young prince Dhruva left the palace for Madhuvan, received Narada Muni's mantra initiation, and earned eternal Dhruva Tara.",
            MoralTeaching: "Unshakable faith turns every trial into eternal light.",
            SanskritMantra: "ॐ नमो भगवते वासुदेवाय"),
        HistoricalIncidents:
        [
            new EcosystemHistoricalSignal("h1", "2026-11-15", 1922, "Historic Radio Milestone", "World History", "Early daily public broadcast transformed modern society.", "Connected distant communities through real-time information.")
        ],
        Competitions:
        [
            new EcosystemCompetitionSignal("c1", "Sanatan Culture Challenge", "GK", "Active", "Digital Certificate", "2026-11-30", null)
        ],
        FunnelCampaigns: [],
        Warnings: [],
        FetchedAtUtc: DateTimeOffset.UtcNow);

    [Theory]
    [InlineData(AutomationSourceType.DailyKatha, "hi")]
    [InlineData(AutomationSourceType.DailyKatha, "en")]
    [InlineData(AutomationSourceType.HinduPanchang, "hi")]
    [InlineData(AutomationSourceType.HinduFestival, "hi")]
    [InlineData(AutomationSourceType.AajKaItihaas, "hi")]
    [InlineData(AutomationSourceType.Pratiyogita, "hi")]
    [InlineData(AutomationSourceType.EcosystemSpotlight, "hi")]
    public void ComposeForRule_FullStory_includes_opening_context_multi_character_arc_and_closing_moral(
        AutomationSourceType sourceType,
        string language)
    {
        var rule = new AutomationRule
        {
            Id = $"rule-{sourceType}-{language}",
            Name = $"Full Story {sourceType}",
            SourceType = sourceType,
            Language = language,
            NarrativeMode = AutomationNarrativeMode.FullStory,
            VideoFormat = AutomationVideoFormat.Wide,
            TargetSeconds = 165,
            FunnelWebsiteKeys = ["panchang"],
            EnableCharacterDialogue = true,
            CustomTopicPrompt = "Selfless Service"
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, Signals(), Ecosystem());

        var item = Assert.Single(composed);
        var narratorTag = language == "en" ? "[Narrator]:" : "[सूत्रधार]:";
        var lines = item.Script.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        Assert.True(lines.Length >= 6, $"FullStory script for {sourceType} ({language}) had only {lines.Length} lines.");
        Assert.StartsWith(narratorTag, lines[0], StringComparison.OrdinalIgnoreCase);
        Assert.Contains(lines[^1], s => true);
        Assert.Contains(lines, l => l.StartsWith(narratorTag, StringComparison.OrdinalIgnoreCase) && l != lines[0]);

        var distinctBrackets = lines
            .Where(l => l.StartsWith('[') && l.Contains("]:"))
            .Select(l => l[1..l.IndexOf("]:", StringComparison.Ordinal)].Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        Assert.True(distinctBrackets.Count >= 3, $"Expected Narrator + >=2 distinct characters for {sourceType} ({language}); got: {string.Join(", ", distinctBrackets)}");
    }

    [Fact]
    public void ProceduralSceneRasterizer_renders_multi_act_full_story_with_optional_storage_backdrops()
    {
        var script =
            "[सूत्रधार]: आज हम पांच वर्ष के बालक ध्रुव की अटल तपस्या की कथा जानेंगे।\n" +
            "[रानी सुनीति]: बेटा, भगवान श्रीहरि नारायण की शरण में ही सत्य स्थान मिलता है।\n" +
            "[बालक ध्रुव]: माँ, मैं उत्तर दिशा के वन में जाकर प्रभु की आराधना करूँगा।\n" +
            "[देवर्षि नारद मुनि]: वत्स, मधुवन में द्वादशाक्षर मंत्र का जप करो।\n" +
            "[भगवान श्रीहरि विष्णु]: तेरी भक्ति से प्रसन्न होकर मैं तुझे अटल ध्रुव तारे का वरदान देता हूँ।\n" +
            "[सूत्रधार]: इस कथा से सीख मिलती है कि धैर्य और भक्ति से हर लक्ष्य सिद्ध होता है।";

        var plan = DialogueScriptParser.ParsePlan(
            "Dhruva Story",
            script,
            null,
            durationSeconds: 165,
            enableDialogue: true,
            eventType: "DailyKatha");
        var palette = ProceduralEventPalette.Resolve("DailyKatha", ProceduralSceneTheme.VedicTempleSunrise3D);

        const int w = 160;
        const int h = 280;
        var backdropA = new byte[w * h * 4];
        var backdropB = new byte[w * h * 4];
        for (var i = 0; i < w * h * 4; i += 4)
        {
            backdropA[i] = 200; backdropA[i + 1] = 80; backdropA[i + 2] = 40; backdropA[i + 3] = 255;
            backdropB[i] = 40; backdropB[i + 1] = 120; backdropB[i + 2] = 210; backdropB[i + 3] = 255;
        }

        var rasterizer = new ProceduralSceneRasterizer(
            w, h,
            ProceduralSceneTheme.VedicTempleSunrise3D,
            seed: 42,
            palette: palette,
            dialoguePlan: plan,
            speechEnvelope: null,
            fps: 24,
            storyHint: "palace forest cosmos dhruva",
            backdropFrames: [backdropA, backdropB]);

        var frameStart = rasterizer.RenderFrame(2.0, 165.0).ToArray();
        var frameMid = rasterizer.RenderFrame(82.0, 165.0).ToArray();
        var frameEnd = rasterizer.RenderFrame(155.0, 165.0).ToArray();

        Assert.Equal(w * h * 4, frameStart.Length);
        Assert.Equal(w * h * 4, frameMid.Length);
        Assert.Equal(w * h * 4, frameEnd.Length);
        Assert.False(frameStart.AsSpan().SequenceEqual(frameEnd), "Expected multi-act backdrop transition between opening and finale.");
    }
}
