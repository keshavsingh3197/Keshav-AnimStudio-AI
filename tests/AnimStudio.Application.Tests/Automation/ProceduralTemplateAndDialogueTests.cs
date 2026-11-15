using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Persistence;
using AnimStudio.Infrastructure.Persistence.SqlServer;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Storage;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Automation;

public sealed class ProceduralTemplateAndDialogueTests
{
    [Fact]
    public void ProceduralEventPalette_Resolve_assigns_distinct_fixed_colors_by_event_type()
    {
        var panchang = ProceduralEventPalette.Resolve("HinduPanchang", ProceduralSceneTheme.Auto);
        var festival = ProceduralEventPalette.Resolve("HinduFestival", ProceduralSceneTheme.Auto);
        var katha = ProceduralEventPalette.Resolve("DailyKatha", ProceduralSceneTheme.Auto);
        var history = ProceduralEventPalette.Resolve("AajKaItihaas", ProceduralSceneTheme.Auto);
        var pratiyogita = ProceduralEventPalette.Resolve("Pratiyogita", ProceduralSceneTheme.Auto);
        var spotlight = ProceduralEventPalette.Resolve("EcosystemSpotlight", ProceduralSceneTheme.Auto);

        var distinctHex = new[]
        {
            panchang.PrimaryHex,
            festival.PrimaryHex,
            katha.PrimaryHex,
            history.PrimaryHex,
            pratiyogita.PrimaryHex,
            spotlight.PrimaryHex
        }.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        Assert.Equal(6, distinctHex.Count);
        Assert.Equal("TODAY'S HINDU PANCHANG", panchang.HeaderBadgeText);
        Assert.Equal("AAJ KA ITIHAAS • ON THIS DAY", history.HeaderBadgeText);
        Assert.Equal(ProceduralSceneTheme.HistoryChronicle3D, history.RecommendedTheme);
    }

    [Fact]
    public void DialogueScriptParser_extracts_two_speakers_with_roles_and_alternating_slots()
    {
        var script =
            "[Raja Harishchandra]: Truth and dharma never bend before fear.\n" +
            "[Maharishi Vishwamitra]: Then prove your vow when everything is tested, O King.\n" +
            "[Raja Harishchandra]: My word stands eternal above crown or wealth.";

        var plan = DialogueScriptParser.ParsePlan(
            title: "Raja Harishchandra & Maharishi Vishwamitra",
            script: script,
            prompt: null,
            durationSeconds: 30,
            enableDialogue: true,
            eventType: "DailyKatha");

        Assert.True(plan.HasCharacters);
        Assert.NotNull(plan.LeftCharacter);
        Assert.NotNull(plan.RightCharacter);
        Assert.Equal("Raja Harishchandra", plan.LeftCharacter!.Name);
        Assert.Equal(CharacterVisualRole.KingCrown, plan.LeftCharacter.Role);
        Assert.Equal("Maharishi Vishwamitra", plan.RightCharacter!.Name);
        Assert.Equal(CharacterVisualRole.SageRishi, plan.RightCharacter.Role);

        Assert.Contains(plan.Turns, t => t.IsTitleHook);
        Assert.Contains(plan.Turns, t => t.Slot == DialogueSpeakerSlot.Left && !t.IsTitleHook);
        Assert.Contains(plan.Turns, t => t.Slot == DialogueSpeakerSlot.Right && !t.IsTitleHook);
    }

    [Fact]
    public void ComposeForRule_populates_community_post_poll_palette_and_katha_dialogue()
    {
        var signals = new EcosystemSignalsSnapshot(
            DateKey: "2026-11-14",
            Location: "New Delhi, India",
            Panchang: new EcosystemPanchangSignal(
                DateKey: "2026-11-14",
                Location: "New Delhi, India",
                Tithi: "Kartik Shukla Chaturdashi",
                TithiEndTime: "19:30 IST",
                Nakshatra: "Ashwini",
                NakshatraEndTime: "21:15 IST",
                Yoga: "Siddha",
                Karana: "Vanija",
                Vaara: "Shanivaar",
                Paksha: "Shukla",
                MonthPurnimanta: "Kartik",
                VikramSamvat: "2083",
                Sunrise: "06:42 AM",
                Sunset: "05:27 PM",
                AbhijitMuhurat: "11:44 AM - 12:26 PM",
                BrahmaMuhurat: "04:58 AM - 05:49 AM",
                AmritKaal: "02:10 PM - 03:45 PM",
                RahuKaal: "09:23 AM - 10:44 AM",
                DailySanskritSutra: "सत्यमेव जयते नानृतम्।",
                DailySutraMeaning: "Truth alone triumphs, never falsehood."),
            UpcomingFestivals: [],
            DailyKatha: new EcosystemDailyKathaSignal(
                Id: "katha-1",
                Title: "Raja Harishchandra & Maharishi Vishwamitra",
                DeityOrSage: "Raja Harishchandra",
                StorySummary: "The timeless trial of truthfulness between Raja Harishchandra and Maharishi Vishwamitra.",
                MoralTeaching: "Unwavering dharma shines beyond every worldly test.",
                SanskritMantra: "ॐ सत्यं वद धर्मं चर।"),
            HistoricalIncidents: [],
            Competitions: [],
            FunnelCampaigns: [],
            Warnings: [],
            FetchedAtUtc: DateTimeOffset.UtcNow);

        var ecosystem = new StudioEcosystemConfig(
            StudioTitle: "AnimStudio AI",
            StudioTagline: "3D Creator Studio",
            CreatorName: "Keshav Singh",
            CreatorPortfolioUrl: "https://keshavsingh.in",
            LegalUpdatedDate: "2026-11-14",
            CopyrightNotice: "Copyright Keshav",
            AdminUrl: "https://admin.keshavsingh.in",
            IdpUrl: "https://admin.keshavsingh.in",
            StudioUrl: "https://studio.keshavsingh.in",
            DefaultChannelKey: "omkar",
            EngineName: "AnimStudio",
            VisualsCredit: "AnimStudio",
            DefaultBranding: new ChannelBranding(),
            Websites:
            [
                new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Panchang",
                    "https://panchang.keshavsingh.in", "Daily Vedic Panchang", "ॐ", "LIVE", "#F59E0B", true, 1)
            ],
            Channels: [],
            SocialLinks: [],
            RetiredChannelUrls: [],
            RetiredChannelNames: [],
            SyncedFromCentral: true,
            LastSyncedAt: DateTimeOffset.UtcNow);

        var rule = new AutomationRule
        {
            Id = "rule-katha-community",
            Name = "Daily Katha Community",
            SourceType = AutomationSourceType.DailyKatha,
            VideoFormat = AutomationVideoFormat.CommunityPost,
            Language = "en",
            FunnelWebsiteKeys = ["panchang"],
            EnableCharacterDialogue = true,
            SubtitlePreset = "karaoke-pulse"
        };

        var composed = AutomationContentComposer.ComposeForRule(rule, signals, ecosystem);

        var item = Assert.Single(composed);
        Assert.Contains("[Raja Harishchandra]:", item.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("[Maharishi Vishwamitra]:", item.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("#A855F7", item.EventColorHex);
        Assert.Equal("PAURANIK KATHA & DIALOGUE • 2026-11-14", item.HeaderBannerText);
        Assert.False(string.IsNullOrWhiteSpace(item.CommunityPostText));
        Assert.NotNull(item.CommunityPollOptions);
        Assert.True(item.CommunityPollOptions!.Count >= 2);
        Assert.Contains("1:1 square YouTube Community card", item.AiVideoPrompt);
    }

    [Fact]
    public void AssSubtitleWriter_writes_top_banner_and_motion_presets_while_neutralizing_user_braces()
    {
        var writer = new AssSubtitleWriter();
        var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
        {
            ["banner"] = new("TopBanner", "#FEF3C7", Bold: true, Alignment: 8, MarginV: 30, FontScalePercent: 72,
                MotionPreset: SubtitleMotionPreset.TopBannerReveal),
            ["left"] = new("SpeakerA", "#FCD34D", Bold: true, Alignment: 2, MarginV: 110, FontScalePercent: 105,
                SecondaryColorHex: "#A855F7", MotionPreset: SubtitleMotionPreset.KaraokePulse)
        };

        var request = new SubtitleRequest(
            Canvas.Hd1080p30,
            [
                new DialogueLine { Index = 0, SpeakerCharacterId = "banner", SpeakerLabel = "Top", Text = "PAURANIK KATHA", RelativeStartFrame = 0, RelativeEndFrame = 60 },
                new DialogueLine { Index = 1, SpeakerCharacterId = "left", SpeakerLabel = "King", Text = @"{\pos(0,0)}Truth never bends", RelativeStartFrame = 0, RelativeEndFrame = 90 }
            ],
            styles);

        var ass = writer.Write(request);

        Assert.Contains("Style: TopBanner,", ass);
        Assert.Contains(",8,72,72,30,1", ass);
        Assert.Contains(@"{\fad(320,160)", ass);
        Assert.Contains(@"{\k", ass);
        Assert.DoesNotContain(@"{\pos(0,0)}", ass);
        Assert.Contains("Truth", ass);
    }

    [Fact]
    public void PngFrameEncoder_and_ProceduralSceneRasterizer_produce_valid_png_and_animated_dialogue_frames()
    {
        var plan = DialogueScriptParser.ParsePlan(
            "Raja Harishchandra & Maharishi Vishwamitra",
            "[Raja Harishchandra]: Truth always shines.\n[Maharishi Vishwamitra]: Dharma endures forever.",
            null,
            12,
            enableDialogue: true,
            eventType: "DailyKatha");
        var palette = ProceduralEventPalette.Resolve("DailyKatha", ProceduralSceneTheme.Auto);

        var rasterizer = new ProceduralSceneRasterizer(320, 320, palette.RecommendedTheme, seed: 7, palette, plan);
        var frameEarly = rasterizer.RenderFrame(1.0, 12.0).ToArray();
        var frameTalking = rasterizer.RenderFrame(5.5, 12.0).ToArray();

        Assert.Equal(320 * 320 * 4, frameTalking.Length);
        Assert.False(frameEarly.AsSpan().SequenceEqual(frameTalking));

        var png = PngFrameEncoder.EncodeRgba(frameTalking, 320, 320);
        Assert.True(png.Length > 100);
        Assert.Equal([137, 80, 78, 71, 13, 10, 26, 10], png[..8]);
        var ascii = System.Text.Encoding.ASCII.GetString(png);
        Assert.Contains("IHDR", ascii);
        Assert.Contains("IDAT", ascii);
        Assert.Contains("IEND", ascii);
    }

    [Theory]
    [InlineData("Auto", true, false)]
    [InlineData("Auto", false, true)]
    [InlineData("", true, false)]
    [InlineData("", false, true)]
    [InlineData("Mongo", false, false)]
    [InlineData("SqlServer", true, true)]
    public void DependencyInjection_ResolveUseSqlServer_honors_prod_Auto_and_explicit_providers(
        string configuredProvider,
        bool hasMongoSecret,
        bool expectedUseSqlServer)
    {
        Assert.Equal(expectedUseSqlServer, DependencyInjection.ResolveUseSqlServer(configuredProvider, hasMongoSecret));
    }

    [Theory]
    // Local Development: always keep SQL Server for Studio data unless explicitly forced to "Mongo",
    // and enable Mongo alongside it for Auto-Post / Drive when Mongo is configured (unless opted out).
    [InlineData("SqlServer", true, true, null, true, true)]
    [InlineData("Auto", true, true, null, true, true)]
    [InlineData("LocalHybrid", true, true, null, true, true)]
    [InlineData("", true, true, null, true, true)]
    [InlineData("SqlServer", false, true, null, true, false)]
    [InlineData("SqlServer", true, true, false, true, false)]
    [InlineData("Mongo", true, true, true, false, false)]
    // Production / non-Development: NEVER enable local hybrid split rules, even if EnableLocalMongoHybrid=true.
    [InlineData("Mongo", true, false, true, false, false)]
    [InlineData("Auto", true, false, true, false, false)]
    [InlineData("SqlServer", true, false, true, true, false)]
    public void DependencyInjection_ResolveDatabaseRouting_restricts_hybrid_rule_to_local_development_only(
        string configuredProvider,
        bool hasMongoSecret,
        bool isDevelopment,
        bool? enableLocalMongoHybrid,
        bool expectedSqlServer,
        bool expectedMongoForAutoPostAndDrive)
    {
        var plan = DependencyInjection.ResolveDatabaseRouting(
            configuredProvider,
            hasMongoSecret,
            isDevelopment,
            enableLocalMongoHybrid);

        Assert.Equal(expectedSqlServer, plan.UseSqlServer);
        Assert.Equal(expectedMongoForAutoPostAndDrive, plan.UseMongoForAutoPostAndDrive);
    }

    [Fact]
    public void AddAnimStudioInfrastructure_in_local_development_uses_SqlServer_for_studio_and_Mongo_for_autopost_and_drive()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "SqlServer",
                ["Database:EnableLocalMongoHybrid"] = "true",
                ["SqlServer:ConnectionString"] = "Server=localhost;Database=AnimStudioDb;Trusted_Connection=True;TrustServerCertificate=True;",
                ["Mongo:ConnectionString"] = "mongodb://localhost:27017",
                ["Mongo:Database"] = "AnimStudioDb"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddAnimStudioInfrastructure(config, isDevelopment: true);

        // Main Studio data lives in local SQL Server
        Assert.Equal(typeof(SqlProjectRepository), Impl<IProjectRepository>(services));
        Assert.Equal(typeof(SqlAssetRepository), Impl<IAssetRepository>(services));
        Assert.Equal(typeof(SqlRenderJobRepository), Impl<IRenderJobRepository>(services));
        Assert.Equal(typeof(SqlSceneRepository), Impl<ISceneRepository>(services));
        Assert.Equal(typeof(SqlStoryRunRepository), Impl<IStoryRunRepository>(services));
        Assert.Equal(typeof(SqlWebSettingRepository), Impl<IWebSettingRepository>(services));

        // Auto-Post, Drive, Content Topics/Plan, and YouTube Publishing live in MongoDB locally
        Assert.Equal(typeof(MongoAutomationRepository), Impl<IAutomationRepository>(services));
        Assert.Equal(typeof(MongoGoogleDriveConnectionRepository), Impl<IGoogleDriveConnectionRepository>(services));
        Assert.Equal(typeof(MongoPhoneHandoffRepository), Impl<IPhoneHandoffRepository>(services));
        Assert.Equal(typeof(MongoContentTopicRepository), Impl<IContentTopicRepository>(services));
        Assert.Equal(typeof(MongoContentPlanItemRepository), Impl<IContentPlanItemRepository>(services));
        Assert.Equal(typeof(MongoContentSourceLinkRepository), Impl<IContentSourceLinkRepository>(services));
        Assert.Equal(typeof(MongoYouTubeConnectionRepository), Impl<IYouTubeConnectionRepository>(services));
        Assert.Equal(typeof(MongoYouTubePublicationRepository), Impl<IYouTubePublicationRepository>(services));
        Assert.Equal(typeof(MongoPublishQueueRepository), Impl<IPublishQueueRepository>(services));

        // Both initializers + local sync helpers are registered in Development hybrid mode
        Assert.Contains(services, d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(SqlDatabaseInitializer));
        Assert.Contains(services, d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(MongoIndexInitializer));
        Assert.Contains(services, d => d.ServiceType == typeof(DriveDataSyncService));
    }

    [Fact]
    public void AddAnimStudioInfrastructure_in_production_never_enables_local_hybrid_split()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "Mongo",
                ["Database:EnableLocalMongoHybrid"] = "true",
                ["Mongo:ConnectionString"] = "mongodb://localhost:27017",
                ["Mongo:Database"] = "AnimStudioDb"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddAnimStudioInfrastructure(config, isDevelopment: false);

        Assert.Equal(typeof(MongoProjectRepository), Impl<IProjectRepository>(services));
        Assert.Equal(typeof(MongoAutomationRepository), Impl<IAutomationRepository>(services));
        Assert.Equal(typeof(MongoPhoneHandoffRepository), Impl<IPhoneHandoffRepository>(services));
        Assert.DoesNotContain(services, d => d.ImplementationType == typeof(SqlDatabaseInitializer));
        Assert.DoesNotContain(services, d => d.ServiceType == typeof(ISqlConnectionFactory));
    }

    [Fact]
    public void AddAnimStudioInfrastructure_in_local_development_without_mongo_uses_SqlServer_for_all_repositories()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "SqlServer",
                ["SqlServer:ConnectionString"] = "Server=localhost;Database=AnimStudioDb;Trusted_Connection=True;TrustServerCertificate=True;"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddAnimStudioInfrastructure(config, isDevelopment: true);

        Assert.Equal(typeof(SqlProjectRepository), Impl<IProjectRepository>(services));
        Assert.Equal(typeof(SqlAutomationRepository), Impl<IAutomationRepository>(services));
        Assert.Equal(typeof(SqlGoogleDriveConnectionRepository), Impl<IGoogleDriveConnectionRepository>(services));
        Assert.Equal(typeof(SqlPhoneHandoffRepository), Impl<IPhoneHandoffRepository>(services));
        Assert.DoesNotContain(services, d => d.ImplementationType == typeof(MongoIndexInitializer));
    }

    private static Type? Impl<TService>(IServiceCollection services) =>
        services.LastOrDefault(d => d.ServiceType == typeof(TService))?.ImplementationType;

    [Fact]
    public void DialogueScriptParser_ToSpokenText_keeps_panchang_facts_and_removes_stage_tags_and_raw_urls()
    {
        var raw = """
            [HOOK 0-4s] हर हर महादेव! आइए जानते हैं आज का संपूर्ण पंचांग।
            [CORE PANCHANG 4-35s]
            • तिथि: Shukla Shashthi (Until 02:02 AM) | पक्ष: Shukla Paksha
            • नक्षत्र: Uttara Ashadha | योग: Ganda | करण: Kaulava
            • अभिजित मुहूर्त: 11:42 AM - 12:30 PM | राहुकाल: 04:08 PM - 05:28 PM
            [CTA] पूरा पंचांग देखें: https://panchang.keshavsingh.in/today?utm_source=youtube&utm_medium=auto
            """;

        var spoken = DialogueScriptParser.ToSpokenText(raw, "hi");

        Assert.DoesNotContain("[HOOK", spoken);
        Assert.DoesNotContain("[CORE", spoken);
        Assert.DoesNotContain("[CTA]", spoken);
        Assert.DoesNotContain("https://", spoken);
        Assert.Contains("Shukla Shashthi", spoken);
        Assert.Contains("Uttara Ashadha", spoken);
        Assert.Contains("11:42 AM", spoken);
        Assert.Contains("04:08 PM", spoken);
        Assert.Contains("नीचे डिस्क्रिप्शन और पिन कमेंट के लिंक पर", spoken);
        Assert.DoesNotContain("utm_source", spoken);
    }

    [Fact]
    public void ProceduralVideoPlanner_BuildCaptionBeats_coalesces_long_scripts_without_dropping_details()
    {
        var longScript = """
            [HOOK] आज का संपूर्ण हिंदू पंचांग और शुभ मुहूर्त।
            तिथि: शुक्ल षष्ठी रात्रि 02:02 तक।
            पक्ष: शुक्ल पक्ष।
            नक्षत्र: उत्तराषाढ़ा।
            योग: गण्ड और करण: कौलव।
            सूर्योदय: 06:44 AM एवं सूर्यास्त: 05:28 PM।
            ब्रह्म मुहूर्त: 04:58 AM - 05:49 AM।
            अभिजित मुहूर्त: 11:42 AM - 12:30 PM।
            राहुकाल: 04:08 PM - 05:28 PM (अशुभ समय)।
            शुभ मंत्र: ॐ नमः शिवाय।
            विशेष उपाय: आज भगवान सूर्य को अर्घ्य दें।
            अंत में: https://panchang.keshavsingh.in?utm_source=yt पर संपूर्ण विवरण देखें।
            """;

        var beats = ProceduralVideoPlanner.BuildCaptionBeats("आज का पंचांग", longScript, prompt: null, 30);

        Assert.NotEmpty(beats);
        var joined = string.Join(" | ", beats.Select(b => b.Text));
        Assert.Contains("उत्तराषाढ़ा", joined);
        Assert.Contains("अभिजित मुहूर्त", joined);
        Assert.Contains("राहुकाल", joined);
        Assert.Contains("ॐ नमः शिवाय", joined);
        Assert.Contains("सूर्य को अर्घ्य", joined);
        Assert.DoesNotContain("utm_source", joined);
    }

    [Fact]
    public async Task ProceduralAudioSynthesizer_ComputeFrameEnvelope_extracts_envelope_from_warm_wav()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-audio-test-");
        try
        {
            var wavPath = Path.Combine(tempDir.FullName, "warm.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, ProceduralSceneTheme.VedicTempleSunrise3D, 3, CancellationToken.None);

            var duration = ProceduralAudioSynthesizer.TryGetWavDurationSeconds(wavPath);
            Assert.NotNull(duration);
            Assert.InRange(duration!.Value, 2.9, 3.1);

            var envelope = ProceduralAudioSynthesizer.ComputeFrameEnvelope(wavPath, 72, 24);
            Assert.Equal(72, envelope.Length);
            Assert.Contains(envelope, v => v > 0.05f);
            Assert.All(envelope, v => Assert.InRange(v, 0f, 1f));
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralBgmCacheService_generates_once_and_reuses_persistent_preset_wav()
    {
        var tempRoot = Directory.CreateTempSubdirectory("animstudio-bgm-cache-");
        try
        {
            var paths = AppDataPaths.Resolve(new ConfigurationBuilder().Build(), tempRoot.FullName);
            var cache = new ProceduralBgmCacheService(Microsoft.Extensions.Options.Options.Create(new FfmpegOptions()), paths);

            var initial = cache.ListPresets();
            Assert.Equal(5, initial.Count);
            Assert.All(initial, p => Assert.False(p.IsCached));

            var (firstPath, firstSource) = await cache.EnsurePresetWavAsync(ProceduralSceneTheme.VedicTempleSunrise3D);
            Assert.Equal("studio-pad-v2", firstSource);
            Assert.True(File.Exists(firstPath));
            var firstWriteUtc = File.GetLastWriteTimeUtc(firstPath);

            var after = cache.ListPresets();
            Assert.True(after.Single(p => p.Id == "vedic-sunrise").IsCached);

            var (secondPath, secondSource) = await cache.EnsurePresetWavAsync(ProceduralSceneTheme.VedicTempleSunrise3D);
            Assert.Equal(firstPath, secondPath);
            Assert.Equal("studio-pad-v2", secondSource);
            Assert.Equal(firstWriteUtc, File.GetLastWriteTimeUtc(secondPath));
        }
        finally
        {
            tempRoot.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_TrySynthesizeAsync_synthesizes_multi_speaker_voices_and_extends_duration()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-speech-test-");
        try
        {
            var wavBytesPath = Path.Combine(tempDir.FullName, "sample-2s.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavBytesPath, ProceduralSceneTheme.HistoryChronicle3D, 2, CancellationToken.None);
            var sampleWavBytes = await File.ReadAllBytesAsync(wavBytesPath);

            var fakeExecutor = new FakeSpeechAiExecutor(sampleWavBytes);
            var fakeRegistry = new FakeSpeechRegistry(new FakeSpeechProvider());

            var script = """
                Raja Harishchandra: सत्य के मार्ग पर चलने से क्या फल मिलता है?
                Maharishi Vishwamitra: हे राजन! सत्य ही परम धर्म और अटल तेज का आधार है।
                Raja Harishchandra: आज का शुभ पंचांग और शुक्ल षष्ठी हमें यही संदेश देती है।
                """;
            var plan = DialogueScriptParser.ParsePlan("Harishchandra & Vishwamitra", script, prompt: null, 8, true, "Raja Harishchandra", "Maharishi Vishwamitra", "DailyKatha");
            var request = new ProceduralVideoRequest
            {
                Title = "Harishchandra & Vishwamitra",
                Script = script,
                EventType = "DailyKatha",
                Language = "hi",
                DurationSeconds = 5,
                IncludeSpeech = true
            };

            var inputDir = Path.Combine(tempDir.FullName, "in");
            var result = await ProceduralSpeechSynthesizer.TrySynthesizeAsync(
                request,
                plan,
                inputDir,
                "user-1",
                baseDurationSeconds: 5,
                fakeExecutor,
                fakeRegistry,
                new FfmpegOptions(),
                logger: null,
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.True(File.Exists(result!.SpeechWavPath));
            Assert.True(result.RecommendedDurationSeconds >= 6);
            Assert.Equal(2, result.VoicesUsed.Count);
            Assert.Equal(3, fakeExecutor.Calls.Count);
            Assert.All(fakeExecutor.Calls, req => Assert.False(string.IsNullOrWhiteSpace(req.VoiceId)));

            var spokenTurns = result.UpdatedPlan.Turns.Where(t => !t.IsTitleHook).ToList();
            Assert.Equal(3, spokenTurns.Count);
            Assert.True(spokenTurns[1].StartSeconds > spokenTurns[0].StartSeconds);
            Assert.True(spokenTurns[2].StartSeconds > spokenTurns[1].StartSeconds);
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    private sealed class FakeSpeechProvider : ISpeechAiProvider
    {
        public AiProviderId Id => AiProviderId.Parse("gemini-tts");
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiVoice>>([new("Orus", "Orus", "hi", "Male"), new("Sadaltager", "Sadaltager", "hi", "Male")]);
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class FakeSpeechRegistry(ISpeechAiProvider provider) : IAiProviderRegistry
    {
        public IReadOnlyList<ITextAiProvider> TextChain() => [];
        public IReadOnlyList<ITextAiProvider> UsableTextProviders() => [];
        public IReadOnlyList<IImageAiProvider> ImageChain() => [];
        public IReadOnlyList<ISpeechAiProvider> SpeechChain() => [provider];
        public IReadOnlyList<ITranscriptionProvider> TranscriptionChain() => [];
        public AiCapabilityStatus Describe(AiCapability capability) =>
            new(capability, provider.Id.Value, null, true, AiUnavailableReason.None, [provider.Id.Value]);
        public IReadOnlyList<AiCapabilityStatus> DescribeAll() => [Describe(AiCapability.Speech)];
        public void ReportOutcome(AiProviderId providerId, bool success) { }
    }

    private sealed class FakeSpeechAiExecutor(byte[] wavBytes) : IAiExecutor
    {
        public List<AiSpeechRequest> Calls { get; } = [];
        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTextResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiImageResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTranscriptionResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct)
        {
            Calls.Add(request);
            return Task.FromResult(AiOutcome<AiSpeechResult>.Success(
                new AiSpeechResult(wavBytes, "audio/wav", 2.0, new AiProvenance { ProviderId = "gemini-tts", Capability = AiCapability.Speech })));
        }
    }

    [Fact]
    public void Portrait_ASS_subtitles_clear_YouTube_Shorts_overlay_and_wrap_full_Hindi_titles_without_ellipsis()
    {
        var title = "भक्त ध्रुव और देवर्षि नारद मुनि की संपूर्ण पावन कथा";
        var script = """
            [भक्त ध्रुव]: हे देवर्षि नारद मुनि, मुझे ऐसा अटल भक्ति मार्ग बताइए जो कभी न डगमगाए।
            [देवर्षि नारद मुनि]: बालक ध्रुव, एकाग्र मन से पावन मंत्र ॐ नमो भगवते वासुदेवाय का जप करो।
            """;
        var plan = DialogueScriptParser.ParsePlan(title, script, prompt: null, 24, enableDialogue: true, eventType: "DailyKatha");
        var palette = ProceduralEventPalette.Resolve("DailyKatha", ProceduralSceneTheme.VedicTempleSunrise3D);
        var request = new ProceduralVideoRequest
        {
            Title = title,
            EventType = "DailyKatha",
            Language = "hi",
            DurationSeconds = 24,
            EnableCharacterDialogue = true,
            SubtitlePreset = "event-glow"
        };

        var ass = ProceduralVideoGeneratorService.BuildAssSubtitlesWithWriter(
            new AssSubtitleWriter(),
            title,
            request,
            palette,
            plan,
            width: 720,
            height: 1280,
            fps: 24,
            durationSeconds: 24);

        Assert.Contains("भक्त ध्रुव", ass);
        Assert.DoesNotContain("...", ass);
        Assert.Contains(@"Style: SpeakerA,", ass);
        // Portrait 720x1280 should keep dialogue MarginV >= 310 and right margin >= 126 to clear Shorts right buttons & bottom metadata
        Assert.Contains(",46,130,352,", ass);
        Assert.Contains(",46,130,292,", ass);
    }

    [Fact]
    public void DialogueScriptParser_extracts_Dhruva_and_Narada_roles_and_InferTheme_prioritizes_DailyKatha()
    {
        var title = "Faith and Focus: Dhruva's Tapasya | Bhakta Dhruva & Narada Muni की कथा";
        var (speakerA, speakerB) = DialogueScriptParser.InferCharacterPairFromTitle(title, "DailyKatha");

        Assert.Equal("Bhakta Dhruva", speakerA);
        Assert.Equal("Narada Muni", speakerB);
        Assert.Equal(CharacterVisualRole.ChildDevotee, DialogueScriptParser.InferRole(speakerA!));
        Assert.Equal(CharacterVisualRole.SageRishi, DialogueScriptParser.InferRole(speakerB!));

        var theme = ProceduralVideoPlanner.InferTheme(
            ProceduralSceneTheme.Auto,
            title,
            "Read Panchang & more on Hindu Panchang calendar website",
            "Read full Panchang today",
            eventType: "DailyKatha");
        Assert.Equal(ProceduralSceneTheme.VedicTempleSunrise3D, theme);
    }

    [Fact]
    public void DevanagariToPhonetic_transliterates_Hindi_prayer_into_speakable_Roman_syllables()
    {
        var spoken = ProceduralSpeechSynthesizer.DevanagariToPhonetic("भक्त ध्रुव! ॐ नमो भगवते वासुदेवाय।");
        Assert.False(string.IsNullOrWhiteSpace(spoken));
        Assert.DoesNotContain("भक्त", spoken);
        Assert.Contains("Om", spoken, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("namo", spoken, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildFfmpegArguments_resamples_to_48kHz_stereo_AAC_LC_after_loudnorm_with_audible_bgm()
    {
        var speechAndBgm = string.Join(' ', ProceduralVideoGeneratorService.BuildFfmpegArguments(
            720, 1280, 24, 30, hasSpeech: true, hasBgm: true, hasSubtitles: true));
        Assert.Contains("loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[sp1][sp2]", speechAndBgm);
        Assert.Contains(",volume=0.45[bg]", speechAndBgm);
        Assert.Contains("sidechaincompress=threshold=0.025:ratio=3.5:attack=25:release=380", speechAndBgm);
        Assert.Contains("amix=inputs=2:duration=first:normalize=0,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo", speechAndBgm);
        Assert.Contains("-c:a aac -profile:a aac_low -ar 48000 -ac 2 -b:a 192k", speechAndBgm);

        var speechOnly = string.Join(' ', ProceduralVideoGeneratorService.BuildFfmpegArguments(
            720, 1280, 24, 30, hasSpeech: true, hasBgm: false, hasSubtitles: true));
        Assert.Contains("loudnorm=I=-16:TP=-1.5:LRA=9,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo", speechOnly);
        Assert.Contains("-c:a aac -profile:a aac_low -ar 48000 -ac 2 -b:a 192k", speechOnly);

        var bgmOnly = string.Join(' ', ProceduralVideoGeneratorService.BuildFfmpegArguments(
            720, 1280, 24, 30, hasSpeech: false, hasBgm: true, hasSubtitles: false));
        Assert.Contains("aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo", bgmOnly);
        Assert.Contains("-c:a aac -profile:a aac_low -ar 48000 -ac 2 -b:a 192k", bgmOnly);
    }

    [Fact]
    public void ProceduralBgmCacheService_IsStereo48kWav_distinguishes_48kHz_stereo_from_192kHz_and_mono()
    {
        var dir = Path.Combine(Path.GetTempPath(), "animstudio-wavhdr-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(dir);
        try
        {
            var wav48k = Path.Combine(dir, "ok-48k-stereo.wav");
            var wav192k = Path.Combine(dir, "bad-192k-stereo.wav");
            var wavMono = Path.Combine(dir, "bad-48k-mono.wav");

            WriteTestPcmHeader(wav48k, sampleRate: 48_000, channels: 2, bitsPerSample: 16);
            WriteTestPcmHeader(wav192k, sampleRate: 192_000, channels: 2, bitsPerSample: 16);
            WriteTestPcmHeader(wavMono, sampleRate: 48_000, channels: 1, bitsPerSample: 16);

            Assert.True(ProceduralBgmCacheService.IsStereo48kWav(wav48k));
            Assert.False(ProceduralBgmCacheService.IsStereo48kWav(wav192k));
            Assert.False(ProceduralBgmCacheService.IsStereo48kWav(wavMono));
        }
        finally
        {
            try { Directory.Delete(dir, recursive: true); } catch { }
        }

        static void WriteTestPcmHeader(string path, int sampleRate, short channels, short bitsPerSample)
        {
            using var fs = File.Create(path);
            using var bw = new BinaryWriter(fs);
            var byteRate = sampleRate * channels * (bitsPerSample / 8);
            var blockAlign = (short)(channels * (bitsPerSample / 8));
            bw.Write("RIFF"u8);
            bw.Write(36);
            bw.Write("WAVE"u8);
            bw.Write("fmt "u8);
            bw.Write(16);
            bw.Write((short)1);
            bw.Write(channels);
            bw.Write(sampleRate);
            bw.Write(byteRate);
            bw.Write(blockAlign);
            bw.Write(bitsPerSample);
            bw.Write("data"u8);
            bw.Write(0);
        }
    }

    [Fact]
    public void DialogueScriptParser_preserves_narrator_and_more_than_two_distinct_speakers_in_full_story()
    {
        var script =
            "[सूत्रधार]: आइए सुनते हैं बालक ध्रुव की अमर कथा, जब पाँच वर्ष के राजकुमार ने अटल स्थान पाने का संकल्प लिया।\n" +
            "[बालक ध्रुव]: माँ सुनीति, पिता की गोद से मुझे क्यों उतारा गया? क्या भगवान मुझे भी अपनाएंगे?\n" +
            "[रानी सुनीति]: बेटा ध्रुव, केवल भगवान श्रीहरि नारायण की शरण में ही परम अटल स्थान मिलता है।\n" +
            "[देवर्षि नारद मुनि]: वत्स ध्रुव, मधुवन में जाकर 'ॐ नमो भगवते वासुदेवाय' मंत्र का निरंतर जप करो।\n" +
            "[भगवान श्रीहरि विष्णु]: तेरी निश्छल भक्ति से मैं प्रसन्न हूँ; तू आकाश में ध्रुव तारे के रूप में अटल रहेगा।\n" +
            "[सूत्रधार]: इस कथा से सीख मिलती है कि अटूट श्रद्धा और धैर्य से असंभव भी संभव हो जाता है।";

        var plan = DialogueScriptParser.ParsePlan(
            title: "भक्त ध्रुव की अमर कथा",
            script: script,
            prompt: null,
            durationSeconds: 165,
            enableDialogue: true,
            eventType: "DailyKatha");

        Assert.True(plan.HasCharacters);
        Assert.Contains(plan.Turns, t => t.Slot == DialogueSpeakerSlot.Narrator && t.SpeakerName == "सूत्रधार");
        var distinctSpeakers = plan.Turns
            .Where(t => !t.IsTitleHook)
            .Select(t => t.SpeakerName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        Assert.True(distinctSpeakers.Count >= 4, $"Expected >= 4 speakers (Narrator + cast), got: {string.Join(", ", distinctSpeakers)}");
        Assert.Contains("बालक ध्रुव", distinctSpeakers);
        Assert.Contains("रानी सुनीति", distinctSpeakers);
        Assert.Contains("देवर्षि नारद मुनि", distinctSpeakers);
    }
}
