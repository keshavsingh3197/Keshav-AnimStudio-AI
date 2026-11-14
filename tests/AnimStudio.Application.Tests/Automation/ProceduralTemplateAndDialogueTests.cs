using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Subtitles;

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
    public void DependencyInjection_ResolveUseSqlServer_honors_Auto_and_explicit_providers(
        string configuredProvider,
        bool hasMongoSecret,
        bool expectedUseSqlServer)
    {
        Assert.Equal(expectedUseSqlServer, DependencyInjection.ResolveUseSqlServer(configuredProvider, hasMongoSecret));
    }
}
