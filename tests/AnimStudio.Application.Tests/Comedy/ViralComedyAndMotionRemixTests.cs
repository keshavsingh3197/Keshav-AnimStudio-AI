using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Rendering;

namespace AnimStudio.Application.Tests.Comedy;

public sealed class ViralComedyAndMotionRemixTests
{
    private static EcosystemSignalsSnapshot EmptySignals(string dateKey) => new(
        DateKey: dateKey,
        Location: "New Delhi",
        Panchang: null,
        UpcomingFestivals: [],
        DailyKatha: null,
        HistoricalIncidents: [],
        Competitions: [],
        FunnelCampaigns: [],
        Warnings: [],
        FetchedAtUtc: DateTimeOffset.UtcNow);

    private static StudioEcosystemConfig EmptyEcosystem() => new(
        StudioTitle: "AnimStudio AI",
        StudioTagline: "3D Studio",
        CreatorName: "Keshav Singh",
        CreatorPortfolioUrl: "https://keshavsingh.in",
        LegalUpdatedDate: "2026-11-18",
        CopyrightNotice: "Copyright Keshav",
        AdminUrl: "https://admin.keshavsingh.in",
        IdpUrl: "https://admin.keshavsingh.in",
        StudioUrl: "https://studio.example.com",
        DefaultChannelKey: "ploptoonz",
        EngineName: "AnimStudio",
        VisualsCredit: "AnimStudio",
        DefaultBranding: new ChannelBranding(),
        Websites: [],
        Channels: [],
        SocialLinks: [],
        RetiredChannelUrls: [],
        RetiredChannelNames: [],
        SyncedFromCentral: true,
        LastSyncedAt: DateTimeOffset.UtcNow);

    [Theory]
    [InlineData("sky gauntlet obstacle bridge challenge", SceneSetting.SkyGauntlet)]
    [InlineData("desert tank arena bunker showdown", SceneSetting.TankArena)]
    [InlineData("doorway hallway slapstick peek", SceneSetting.DoorwaySet)]
    public void SceneDirectives_parses_viral_3d_comedy_stages(string text, SceneSetting expected)
    {
        var actual = SceneDirectives.InferSetting(text);
        Assert.Equal(expected, actual);
        Assert.Equal(ProceduralSceneTheme.ComedyStage3D, SceneDirectives.ThemeFor(actual, ProceduralSceneTheme.Auto));
    }

    [Theory]
    [InlineData("KV-Tiny Tank", CharacterVisualRole.CartoonTank)]
    [InlineData("Woody Log Buddy", CharacterVisualRole.BrainrotLog)]
    [InlineData("Cuppy Espresso", CharacterVisualRole.CupDancer)]
    [InlineData("Bobble Comedian", CharacterVisualRole.ComicBobble)]
    public void DialogueScriptParser_infers_viral_3d_comedy_roles(string name, CharacterVisualRole expected)
    {
        Assert.Equal(expected, DialogueScriptParser.InferRole(name));
    }

    [Fact]
    public void ComedyChannelMatcher_recognizes_international_and_indian_comedy_handles()
    {
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("@KESHAV-ANIM-FF"));
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("@PlopToonz3D"));
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("@KaleshAdda3D"));
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("@GappaToonz"));
        Assert.False(ComedyChannelMatcher.IsComedyChannelHint("Sanatan Bhakti Panchang"));

        Assert.True(ComedyChannelMatcher.IsInternationalComedyHint("@PlopToonz3D"));
        Assert.False(ComedyChannelMatcher.IsInternationalComedyHint("@KaleshAdda3D"));
    }

    [Theory]
    [InlineData(ComedyToneStyle.GlobalSlapstick, "doorway set")]
    [InlineData(ComedyToneStyle.TankSeries, "tank arena")]
    public void AutomationContentComposer_generates_international_slapstick_and_tank_series(
        ComedyToneStyle style,
        string expectedSceneToken)
    {
        var rule = new AutomationRule
        {
            Id = "ar_intl",
            SourceType = AutomationSourceType.FunnyComedy,
            Language = "en",
            ComedyStyle = style,
            AutoInsertMemes = true,
            EnableCharacterDialogue = true,
            TargetChannelHandle = "@PlopToonz3D"
        };

        var post = AutomationContentComposer.ComposeForRule(rule, EmptySignals("2026-11-18"), EmptyEcosystem()).Single();
        Assert.Contains(expectedSceneToken, post.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("[CAST]:", post.Script, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task WriteComedySfxWavAsync_synthesizes_non_silent_pcm_for_comedy_cues()
    {
        const string script = """
            [CAST]: Woody Log | log | carved timber
            [CAST]: Cuppy | cup | ceramic mug
            [SCENE]: doorway set | day | slapstick
            [Woody Log]: (proud) Sneaking past the trophy case!
            [Cuppy]: (surprised) Look behind you!
            [MEME]: shocked_face | BUSTED! | 1.5
            """;

        var plan = DialogueScriptParser.ParsePlan(
            "Doorway Heist", script, null, 12, enableDialogue: true, "Woody Log", "Cuppy", "FunnyComedy");
        var wavPath = Path.Combine(Path.GetTempPath(), $"animstudio-sfx-{Guid.NewGuid():n}.wav");
        try
        {
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(wavPath, plan, 12, CancellationToken.None);
            var bytes = await File.ReadAllBytesAsync(wavPath);
            Assert.True(bytes.Length > 44);
            Assert.Contains(bytes.Skip(44), b => b != 0);
        }
        finally
        {
            if (File.Exists(wavPath)) File.Delete(wavPath);
        }
    }

    [Fact]
    public void WebGlJobJson_and_CpuFallbackRasterizer_handle_new_roles_and_stages()
    {
        const string script = """
            [CAST]: KV-Tiny | tank | olive green
            [CAST]: Blitz | bobble | orange jacket
            [SCENE]: tank arena | sunset | dramatic
            [KV-Tiny]: (angry) Ready to fire!
            [SCENE]: sky gauntlet | day | playful
            [Blitz]: (surprised) Why did the cannon shoot a duck?!
            """;

        var plan = DialogueScriptParser.ParsePlan(
            "Tank Chaos", script, null, 10, enableDialogue: true, "KV-Tiny", "Blitz", "FunnyComedy");
        var palette = ProceduralEventPalette.Resolve("FunnyComedy", ProceduralSceneTheme.ComedyStage3D);
        var req = new ProceduralVideoRequest
        {
            Title = "Tank Chaos",
            Script = script,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            EventType = "FunnyComedy",
            EnableCharacterDialogue = true,
            EnableComedySfx = true,
            EpisodeNumber = 7,
            IsSeamlessLoop = true
        };

        var json = WebGlVideoFrameRenderer.SerializeJobJson(
            540, 960, 24, 10, 240, 42, ProceduralSceneTheme.ComedyStage3D, req, palette, plan, null, 0);
        Assert.Contains("\"isComedyMode\":true", json, StringComparison.Ordinal);
        Assert.Contains("\"isSeamlessLoop\":true", json, StringComparison.Ordinal);
        Assert.Contains("CartoonTank", json, StringComparison.Ordinal);
        Assert.Contains("TankArena", json, StringComparison.Ordinal);
        Assert.Contains("SkyGauntlet", json, StringComparison.Ordinal);

        var rasterizer = new ProceduralSceneRasterizer(180, 320, ProceduralSceneTheme.ComedyStage3D, 7, palette, plan);
        var frame1 = rasterizer.RenderFrame(1.5, 10.0);
        var frame2 = rasterizer.RenderFrame(7.5, 10.0);
        Assert.Equal(180 * 320 * 4, frame1.Length);
        Assert.True(frame2.IndexOfAnyExcept((byte)0) >= 0);
    }

    [Fact]
    public async Task UploadValidator_accepts_webm_recording_with_ebml_magic_and_rejects_fake()
    {
        byte[] validWebm = [0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 0x01];
        var ok = await UploadValidator.ValidateAsync("remix.webm", "video/webm", new MemoryStream(validWebm), CancellationToken.None);
        Assert.True(ok.IsValid);
        Assert.Equal(AssetKind.Video, ok.Kind);
        Assert.Equal(".webm", ok.CanonicalExtension);

        byte[] fakeWebm = "NOT_A_WEBM_HEADER"u8.ToArray();
        var bad = await UploadValidator.ValidateAsync("remix.webm", "video/webm", new MemoryStream(fakeWebm), CancellationToken.None);
        Assert.False(bad.IsValid);
    }
}
