using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
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
        Assert.Contains("https://panchang.example.com", sanitized.Description);
        Assert.DoesNotContain("utm_source", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("/daily", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.True(YouTubePublishValidator.TagsLength(sanitized.Tags) <= YouTubePublishValidator.MaxTagsLength);
        Assert.InRange(sanitized.Tags.Count, 3, 30);
        Assert.False(sanitized.MadeForKids);

        var hashCount = sanitized.Description.Split([' ', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Count(t => t.StartsWith('#'));
        Assert.InRange(hashCount, 3, 8);
    }

    [Fact]
    public void YouTubePolicyComplianceSanitizer_trims_urls_to_root_subdomain_and_keeps_multiple_portal_links()
    {
        var rawDesc = """
            Desi 3D Comedy Short — Watch full animated episodes!

            🌐 Keshav Hub: https://keshavsingh.in?utm_source=youtube&utm_medium=automation
            • AnimStudio AI: https://studio.keshavsingh.in/projects?utm_campaign=c1
            • Pratiyogita: https://pratiyogita.keshavsingh.in/competitions
            • Hindu Panchang: https://panchang.keshavsingh.in/festivals?city=patna
            • Duplicate Hub: https://keshavsingh.in/about

            #Shorts #HindiComedy #3DAnimation
            """;

        var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: "Desi Comedy Episode",
            rawDescription: rawDesc,
            rawTags: ["Shorts", "Hindi Comedy", "3D Cartoon"],
            rawPinnedComment: "Explore: https://studio.keshavsingh.in/editor?utm_source=youtube",
            primaryDestinationUrl: "https://keshavsingh.in?utm_source=youtube",
            isShort: true,
            language: "hi");

        Assert.DoesNotContain("utm_source", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("/projects", sanitized.Description, StringComparison.Ordinal);
        Assert.DoesNotContain("/competitions", sanitized.Description, StringComparison.Ordinal);
        Assert.DoesNotContain("/festivals", sanitized.Description, StringComparison.Ordinal);
        Assert.DoesNotContain("Duplicate Hub", sanitized.Description, StringComparison.Ordinal);
        Assert.Contains("https://keshavsingh.in", sanitized.Description, StringComparison.Ordinal);
        Assert.Contains("https://studio.keshavsingh.in", sanitized.Description, StringComparison.Ordinal);
        Assert.Contains("https://pratiyogita.keshavsingh.in", sanitized.Description, StringComparison.Ordinal);
        Assert.Contains("https://panchang.keshavsingh.in", sanitized.Description, StringComparison.Ordinal);
        Assert.DoesNotContain("utm_source", sanitized.PinnedComment ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("https://studio.keshavsingh.in", sanitized.PinnedComment ?? string.Empty, StringComparison.Ordinal);
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

    [Fact]
    public async Task LongForm_60Min_Caps_MJO_Environments_and_Zero_Unrendered_ProceduralFallback_Work()
    {
        Assert.Equal(3600, StoryRunService.MaxTargetSeconds);
        Assert.Equal(3600, ProceduralVideoRequest.MaxSeconds);
        Assert.Equal(200, StoryScriptParser.MaxScenes);
        Assert.Equal(120, DialogueScriptParser.MaxScenes);

        // 30m (1800s) and 60m (3600s) scale scene counts well past the old 40-scene limit
        Assert.True(StoryScriptPrompt.SceneCount(1800) > 100);
        Assert.Equal(160, StoryScriptPrompt.SceneCount(3600));

        // MJO environments parse cleanly and map to ComedyStage3D
        Assert.Equal(SceneSetting.BarberShop, SceneDirectives.InferSetting("अमरेंद्र नाई का सैलून barber shop"));
        Assert.Equal(SceneSetting.NeighborhoodGate, SceneDirectives.InferSetting("मोहल्ला gate और पड़ोसी"));
        Assert.Equal(SceneSetting.Courtroom, SceneDirectives.InferSetting("अदालत courtroom मुकदमा"));
        Assert.Equal(ProceduralSceneTheme.ComedyStage3D, SceneDirectives.ThemeFor(SceneSetting.BarberShop, ProceduralSceneTheme.Auto));
        Assert.Contains("barber", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.BarberShop), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("gate", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.NeighborhoodGate), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("courtroom", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.Courtroom), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("clinic", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.DoctorClinic), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("classroom", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.Classroom), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("quiz", AutomationBackgroundPromptBuilder.SubjectFor(SceneSetting.QuizStudio), StringComparison.OrdinalIgnoreCase);

        // Zero-Unrendered guarantee: offline ProceduralSceneIllustrationRenderer creates full PNGs (never empty or plain)
        var renderer = new ProceduralSceneIllustrationRenderer();
        var scenePng = await renderer.RenderSceneIllustrationAsync(
            "Barbershop comedy argument between Amrendra barber and Pappu",
            "कंटाप हेयरकट कांड",
            "funny",
            "Comedy",
            "FunnyComedy",
            vertical: false,
            width: 1280,
            height: 720,
            seed: 42,
            CancellationToken.None);

        Assert.NotNull(scenePng);
        Assert.True(scenePng!.Length > 10_000, "Procedural scene fallback PNG should contain textured pixels, not empty bytes");
        Assert.Equal([0x89, 0x50, 0x4E, 0x47], scenePng[..4]);

        // MJO SFX + sparse comedy jingle bed generate valid stereo WAVs on disk
        var plan = DialogueScriptParser.ParsePlan(
            "अमरेंद्र नाई कांड",
            "[SCENE]: barber shop | day | funny\n[अमरेंद्र नाई]: कंटाप मारबे चक्कर गिन्नी केंची चलेगी तेज़!\n[पप्पू]: अरे बावले बाल काट दे भाई!",
            prompt: null,
            durationSeconds: 18,
            enableDialogue: true,
            eventType: "FunnyComedy");
        Assert.True(plan.Turns.Count >= 3);

        var tempDir = Path.Combine(Path.GetTempPath(), "animstudio-mjo-audio-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var bgmPath = Path.Combine(tempDir, "bgm.wav");
            var sfxPath = Path.Combine(tempDir, "sfx.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(bgmPath, ProceduralSceneTheme.ComedyStage3D, 18, CancellationToken.None, sparseDialogueBed: true);
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(sfxPath, plan, 18, CancellationToken.None, comedyIntensity: true);

            Assert.True(new FileInfo(bgmPath).Length > 44_000);
            Assert.True(new FileInfo(sfxPath).Length > 44_000);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    public void AutomationPublishAdvisor_skips_occupied_channel_days_and_rolls_to_next_open_day()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "India Standard Time" : "Asia/Kolkata");
        // Saturday 2026-11-21 15:30 IST (10:00 UTC)
        var nowUtc = new DateTime(2026, 11, 21, 10, 0, 0, DateTimeKind.Utc);
        // Channel ALREADY uploaded one video earlier today at 14:00 IST (08:30 UTC)
        var earlierTodayUtc = new DateTime(2026, 11, 21, 8, 30, 0, DateTimeKind.Utc);

        var advice = AutomationPublishAdvisor.BuildAdvice(
            AutomationSourceType.FunnyComedy,
            AutomationVideoFormat.Wide,
            tz,
            nowUtc,
            takenUtc: [],
            channelHistoryUtc: [earlierTodayUtc],
            count: 3);

        Assert.Equal(3, advice.Slots.Count);
        var slotLocalDays = advice.Slots
            .Select(s => TimeZoneInfo.ConvertTimeFromUtc(s.AtUtc, tz).Date)
            .ToList();

        Assert.All(slotLocalDays, d => Assert.True(d > new DateTime(2026, 11, 21), $"Should skip already-uploaded Sat 21 Nov, got {d:yyyy-MM-dd}"));
        Assert.Equal(slotLocalDays.Count, slotLocalDays.Distinct().Count());
        Assert.Equal(new DateTime(2026, 11, 22), slotLocalDays[0]);
    }

    [Fact]
    public void ComedyComposer_and_PolicySanitizer_prevent_internal_enum_leaks_brackets_and_link_spam()
    {
        var rule = new AutomationRule
        {
            Id = "ar_clean_desc",
            Name = "Comedy Channel",
            SourceType = AutomationSourceType.FunnyComedy,
            VideoFormat = AutomationVideoFormat.Wide,
            Language = "hi",
            ComedyStyle = ComedyToneStyle.DesiKhadiSitcom,
            FunnelWebsiteKeys = ["hub", "studio", "pratiyogita", "social"],
            IncludePinnedComment = true
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, SampleSignalsWithAstrology("2026-11-21"), SampleEcosystem());
        var item = Assert.Single(composed);

        Assert.DoesNotContain("DesiKhadiSitcom", item.Description, StringComparison.Ordinal);
        Assert.DoesNotContain("DesiKhadiSitcom", item.SourceSummary, StringComparison.Ordinal);
        Assert.DoesNotContain("utm_source", item.Description, StringComparison.OrdinalIgnoreCase);
        var httpCount = System.Text.RegularExpressions.Regex.Matches(item.Description, @"https?://").Count;
        Assert.InRange(httpCount, 1, 4);

        var dirtyDesc = "Test <script>alert(1)</script> — DesiKhadiSitcom देसी कॉमेडी\n👉 A: https://one.example.com/page?utm_source=x\n👉 B: https://two.example.com\n👉 C: https://three.example.com\n👉 D: https://four.example.com\n👉 E: https://five.example.com\n👉 Dup: https://one.example.com/other\n#tag1 #tag2 #tag3";
        var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: "Test <Title>",
            rawDescription: dirtyDesc,
            rawTags: ["HindiComedy", "Shorts", "DesiComedy"],
            rawPinnedComment: "Watch here",
            fallbackTopicTitle: "Fallback",
            primaryDestinationUrl: "https://one.example.com",
            requestedMadeForKids: false,
            isShort: false,
            language: "hi");

        Assert.DoesNotContain("<", sanitized.Title);
        Assert.DoesNotContain(">", sanitized.Title);
        Assert.DoesNotContain("<", sanitized.Description);
        Assert.DoesNotContain(">", sanitized.Description);
        Assert.DoesNotContain("DesiKhadiSitcom", sanitized.Description);
        Assert.DoesNotContain("utm_source", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("five.example.com", sanitized.Description, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Dup:", sanitized.Description, StringComparison.Ordinal);
        Assert.Equal(4, System.Text.RegularExpressions.Regex.Matches(sanitized.Description, @"https?://").Count);
    }

    [Fact]
    public void ProceduralSpeechSynthesizer_casts_expressive_male_comic_voices_and_distinct_supporting_voices()
    {
        var script = """
            [CAST]: अमरेंद्र नाई | villager | mustache, white shirt
            [CAST]: पप्पू ग्राहक | bobble | hoodie
            [SCENE]: barber shop | day | funny
            [अमरेंद्र नाई]: (angry) अबे चुपचाप बैठ, केंची चल रही है!
            [पप्पू ग्राहक]: (surprised) अरे भैया बाल काटो, कान नहीं!
            [चुन्नू चाचा]: (laughing) अरे गज़ब कटोरा कट मारा है भाई!
            [पिंकी दीदी]: (sarcastic) भैया मेरा भी नंबर है क्या आज?
            """;
        var plan = DialogueScriptParser.ParsePlan(
            "कंटाप हेयरकट कांड 😂 | नाई की दुकान",
            script,
            prompt: null,
            durationSeconds: 24,
            enableDialogue: true,
            eventType: "FunnyComedy");
        var req = new ProceduralVideoRequest
        {
            Title = "कंटाप हेयरकट कांड 😂",
            Language = "hi",
            EventType = "FunnyComedy"
        };

        var (voiceA, voiceB) = ProceduralSpeechSynthesizer.SelectGeminiCastVoices(plan, isComedy: true);
        Assert.NotEqual("Aoede", voiceA);
        Assert.NotEqual("Aoede", voiceB);
        Assert.NotEqual("Charon", voiceA);
        Assert.NotEqual(voiceA, voiceB);

        var chachaTurn = plan.Turns.First(t => t.SpeakerName.Contains("चुन्नू", StringComparison.Ordinal));
        var didiTurn = plan.Turns.First(t => t.SpeakerName.Contains("पिंकी", StringComparison.Ordinal));

        var chachaVoice = ProceduralSpeechSynthesizer.ResolveGeminiTurnVoice(plan, req, chachaTurn, voiceA, voiceB, isComedy: true);
        var didiVoice = ProceduralSpeechSynthesizer.ResolveGeminiTurnVoice(plan, req, didiTurn, voiceA, voiceB, isComedy: true);

        Assert.NotEqual(voiceA, chachaVoice);
        Assert.NotEqual(voiceB, chachaVoice);
        Assert.Contains(didiVoice, new[] { "Aoede", "Leda", "Zephyr", "Kore" });

        // Also test peak drama timestamp & headline extraction helpers for 3D comedy thumbnail service
        var peakTs = ProceduralComedyThumbnailService.PickPeakDramaTimestamp(script, 62.0);
        Assert.InRange(peakTs, 1.2, 60.8);
        var hook = ProceduralComedyThumbnailService.ExtractPunchHookHeadline("कंटाप हेयरकट कांड 😂 | नाई की दुकान का बवाल");
        Assert.DoesNotContain("|", hook);
        Assert.Contains("कंटाप हेयरकट कांड", hook);
    }

    [Theory]
    [InlineData("hi", "पंचांग डॉट केशवसिंह डॉट इन", "राशिफल")]
    [InlineData("en", "panchang dot keshavsingh dot in", "Rashifal")]
    public void ComposePanchang_uses_natural_spoken_website_invitation_without_raw_urls_while_preserving_description_links(
        string language, string expectedSpokenDomain, string expectedRashifalHint)
    {
        var signals = SampleSignalsWithAstrology("2026-11-23");
        var rule = new AutomationRule
        {
            Id = "ar_panchang_cta",
            Name = "Daily Panchang",
            SourceType = AutomationSourceType.HinduPanchang,
            VideoFormat = AutomationVideoFormat.Vertical,
            Language = language,
            IncludePinnedComment = true,
            EnableCharacterDialogue = true,
            FunnelWebsiteKeys = ["panchang", "studio"]
        };

        var composed = Assert.Single(AutomationContentComposer.ComposeForRule(rule, signals, SampleEcosystem()));
        Assert.DoesNotContain("https://", composed.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(expectedSpokenDomain, composed.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(expectedRashifalHint, composed.Script, StringComparison.OrdinalIgnoreCase);

        var spoken = DialogueScriptParser.ToSpokenText(composed.Script, language);
        Assert.Contains(expectedSpokenDomain, spoken, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("https://panchang.example.com", composed.Description, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("https://panchang.example.com", composed.PinnedComment ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }
}
