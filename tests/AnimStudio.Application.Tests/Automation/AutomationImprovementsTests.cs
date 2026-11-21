using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Subtitles;

namespace AnimStudio.Application.Tests.Automation;

public class AutomationImprovementsTests
{
    private static StudioEcosystemConfig SampleEcosystem() => new(
        StudioTitle: "AnimStudio AI",
        StudioTagline: "AI Shorts & Stories",
        CreatorName: "Creator",
        CreatorPortfolioUrl: "https://example.com",
        LegalUpdatedDate: "2026-11-21",
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
        ],
        Channels: [],
        SocialLinks: [],
        RetiredChannelUrls: [],
        RetiredChannelNames: [],
        SyncedFromCentral: true,
        LastSyncedAt: DateTimeOffset.UtcNow);

    private static EcosystemSignalsSnapshot SampleSignalsWithAstrology(string dateKey = "2026-11-21") => new(
        DateKey: dateKey,
        Location: "New Delhi, India",
        Panchang: new EcosystemPanchangSignal(
            DateKey: dateKey,
            Location: "New Delhi, India",
            Tithi: "Shukla Dwitiya",
            TithiEndTime: "06:10 PM",
            Nakshatra: "Moola",
            NakshatraEndTime: "08:25 PM",
            Yoga: "Shula",
            Karana: "Balava",
            Vaara: "Shanivara",
            Paksha: "Shukla Paksha",
            MonthPurnimanta: "Margashirsha",
            VikramSamvat: "2083",
            Sunrise: "06:48 AM",
            Sunset: "05:25 PM",
            AbhijitMuhurat: "11:46 AM - 12:28 PM",
            BrahmaMuhurat: "05:12 AM - 06:00 AM",
            AmritKaal: "08:15 AM - 09:45 AM",
            RahuKaal: "09:27 AM - 10:47 AM",
            DailySanskritSutra: "सत्यमेव जयते",
            DailySutraMeaning: "Truth prevails.",
            NextTithi: "Shukla Tritiya",
            MoonSign: "Dhanu",
            SunSign: "Vrishchika",
            PanchakStatus: "None",
            ChandrabalamGoodRashis: ["Mesha", "Mithuna", "Simha", "Tula", "Dhanu", "Kumbha"]),
        UpcomingFestivals: [],
        DailyKatha: null,
        HistoricalIncidents: [],
        Competitions: [],
        FunnelCampaigns: [],
        Warnings: [],
        FetchedAtUtc: DateTimeOffset.UtcNow);

    [Fact]
    public void ComedyChannelMatcher_never_picks_devotional_channel_when_non_devotional_exists()
    {
        var channels = new[]
        {
            new { Handle = "@omkarshivbhakti", Title = "OMKAR SHIV Bhakti", Explicit = false },
            new { Handle = "@KeshavSinghWorld", Title = "KeshavSinghWorld", Explicit = false },
        };

        var pickedDesi = ComedyChannelMatcher.PickBestComedyChannel(
            channels,
            c => (c.Handle, c.Title, c.Explicit),
            international: false);

        Assert.NotNull(pickedDesi);
        Assert.Equal("@KeshavSinghWorld", pickedDesi!.Handle);
        Assert.True(ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint("@omkarshivbhakti", "OMKAR SHIV Bhakti"));
    }

    [Fact]
    public void ComedyChannelMatcher_prefers_explicit_brand_comedy_channel_over_generic_handle()
    {
        var channels = new[]
        {
            new { Handle = "@omkarshivbhakti", Title = "OMKAR SHIV Bhakti", Explicit = false },
            new { Handle = "@KeshavSinghWorld", Title = "KeshavSinghWorld", Explicit = true },
            new { Handle = "@funny-unflagged", Title = "Funny Clips", Explicit = false },
        };

        var picked = ComedyChannelMatcher.PickBestComedyChannel(
            channels,
            c => (c.Handle, c.Title, c.Explicit),
            international: false);

        Assert.NotNull(picked);
        Assert.Equal("@KeshavSinghWorld", picked!.Handle);
    }

    [Fact]
    public void YouTubePolicyComplianceSanitizer_cleans_bait_shorteners_caps_limits_and_tags()
    {
        var veryLongTitle = "SUB4SUB! FREE CLICK HERE " + new string('A', 120) + " Watch now https://bit.ly/spam123";
        var rawDesc = "Like and subscribe! Visit https://bit.ly/badshort and check pin for gift.\n" +
                      string.Join(" ", Enumerable.Range(1, 20).Select(i => $"#tag{i}"));
        var rawTags = Enumerable.Range(1, 35).Select(i => $"VeryLongKeywordPhraseTagNumber{i}").ToArray();

        var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: veryLongTitle,
            rawDescription: rawDesc,
            rawTags: rawTags,
            rawPinnedComment: "Subscribe for subscribe! https://tinyurl.com/bad",
            fallbackTopicTitle: "Daily Panchang Update",
            primaryDestinationUrl: "https://panchang.example.com/daily?utm_source=youtube",
            requestedMadeForKids: null,
            isShort: true,
            language: "hi");

        Assert.InRange(sanitized.Title.Length, 3, YouTubePublishValidator.MaxTitleLength);
        Assert.DoesNotContain("sub4sub", sanitized.Title, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("bit.ly", sanitized.Title, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("bit.ly", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("tinyurl.com", sanitized.PinnedComment ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("https://panchang.example.com/daily?utm_source=youtube", sanitized.Description);
        Assert.True(YouTubePublishValidator.TagsLength(sanitized.Tags) <= YouTubePublishValidator.MaxTagsLength);
        Assert.InRange(sanitized.Tags.Count, 3, 30);
        Assert.False(sanitized.MadeForKids);

        var hashCount = sanitized.Description.Split([' ', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Count(t => t.StartsWith('#'));
        Assert.InRange(hashCount, 3, 8);
    }

    [Fact]
    public void DailyRashifalEngine_builds_all_12_rashis_with_meaning_forecast_aacharan_and_validates()
    {
        var signals = SampleSignalsWithAstrology("2026-11-21");
        var report = DailyRashifalEngine.BuildReport(signals);

        Assert.Equal("2026-11-21", report.DateKey);
        Assert.Equal("Dhanu", report.MoonSign);
        Assert.Equal("Moola", report.Nakshatra);
        Assert.Equal(12, report.Rashis.Count);
        Assert.Equal(["mesha", "vrishabha", "mithuna", "karka", "simha", "kanya", "tula", "vrishchika", "dhanu", "makara", "kumbha", "meena"],
            report.Rashis.Select(r => r.Key).ToArray());

        foreach (var r in report.Rashis)
        {
            Assert.False(string.IsNullOrWhiteSpace(r.MeaningSummary));
            Assert.False(string.IsNullOrWhiteSpace(r.TodayPredictionHindi));
            Assert.False(string.IsNullOrWhiteSpace(r.TodayPredictionEnglish));
            Assert.False(string.IsNullOrWhiteSpace(r.AacharanUpayHindi));
            Assert.False(string.IsNullOrWhiteSpace(r.LuckyColor));
            Assert.InRange(r.LuckyNumber, 1, 9);
            Assert.False(string.IsNullOrWhiteSpace(r.Mantra));
        }

        // Compose & verify full AutomationRule output + fact verification
        var rule = new AutomationRule
        {
            Id = "ar_rashifal",
            Name = "Daily Rashifal Shorts",
            SourceType = AutomationSourceType.DailyRashifal,
            VideoFormat = AutomationVideoFormat.Vertical,
            Language = "hi",
            IncludePinnedComment = true,
            PreferFast2DAnimation = true,
            ShowWatermark = false
        };

        var packages = AutomationContentComposer.ComposeForRule(rule, signals, SampleEcosystem());
        var main = Assert.Single(packages);
        Assert.InRange(main.Title.Length, 10, YouTubePublishValidator.MaxTitleLength);
        Assert.Contains("Dhanu", main.Script);

        var post = new AutomationPost
        {
            Id = "ap_rashifal_test",
            DateKey = "2026-11-21",
            SourceType = AutomationSourceType.DailyRashifal,
            Title = main.Title,
            Script = main.Script,
            Description = main.Description
        };
        var verification = AutomationFactVerifier.VerifyPost(post, signals);
        Assert.Equal("Verified", verification.Status);
    }

    [Fact]
    public void AutomationPublishAdvisor_returns_category_peak_slots_and_promotion_steps()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "India Standard Time" : "Asia/Kolkata");
        var nowUtc = new DateTime(2026, 11, 21, 0, 0, 0, DateTimeKind.Utc); // 05:30 AM IST

        var panchangAdvice = AutomationPublishAdvisor.BuildAdvice(
            AutomationSourceType.HinduPanchang,
            AutomationVideoFormat.Vertical,
            tz,
            nowUtc,
            takenUtc: [],
            channelHistoryUtc: [],
            count: 3);

        var comedyAdvice = AutomationPublishAdvisor.BuildAdvice(
            AutomationSourceType.FunnyComedy,
            AutomationVideoFormat.Vertical,
            tz,
            nowUtc,
            takenUtc: [],
            channelHistoryUtc: [],
            count: 3);

        Assert.Equal(3, panchangAdvice.Slots.Count);
        Assert.Equal(3, comedyAdvice.Slots.Count);
        Assert.NotEmpty(panchangAdvice.Promotions);
        Assert.NotEmpty(comedyAdvice.Promotions);

        var panchangFirstIst = TimeZoneInfo.ConvertTimeFromUtc(panchangAdvice.Slots[0].AtUtc, tz);
        var comedyFirstIst = TimeZoneInfo.ConvertTimeFromUtc(comedyAdvice.Slots[0].AtUtc, tz);
        Assert.True(panchangFirstIst.Hour <= 12, $"Expected morning/noon peak for Panchang, got {panchangFirstIst}");
        Assert.True(comedyFirstIst.Hour >= 12, $"Expected afternoon/evening peak for Comedy, got {comedyFirstIst}");
    }

    [Fact]
    public void ProceduralVideo_ShowWatermark_false_omits_FooterLabel_from_generated_subtitles()
    {
        const string title = "आज का पंचांग | Shukla Dwitiya";
        const string footer = "panchang.keshavsingh.in";
        var plan = DialogueScriptParser.ParsePlan(title, "शुभ मुहूर्त व तिथि विवरण", null, 15, enableDialogue: false, eventType: "HinduPanchang");
        var palette = ProceduralEventPalette.Resolve("HinduPanchang", ProceduralSceneTheme.VedicTempleSunrise3D);

        var withoutWatermark = new ProceduralVideoRequest
        {
            Title = title,
            EventType = "HinduPanchang",
            Language = "hi",
            DurationSeconds = 15,
            FooterLabel = footer,
            ShowWatermark = false
        };
        var withWatermark = new ProceduralVideoRequest
        {
            Title = title,
            EventType = "HinduPanchang",
            Language = "hi",
            DurationSeconds = 15,
            FooterLabel = footer,
            ShowWatermark = true
        };

        var assHidden = ProceduralVideoGeneratorService.BuildAssSubtitlesWithWriter(
            new AssSubtitleWriter(), title, withoutWatermark, palette, plan, 720, 1280, 24, 15);
        var assShown = ProceduralVideoGeneratorService.BuildAssSubtitlesWithWriter(
            new AssSubtitleWriter(), title, withWatermark, palette, plan, 720, 1280, 24, 15);

        Assert.DoesNotContain(footer, assHidden, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(footer, assShown, StringComparison.OrdinalIgnoreCase);
    }
}
