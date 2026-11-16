using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Controllers;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Rendering;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests;

public sealed class ComedyAndSongBridgeTests
{
    [Fact]
    public void ComedyTheme_Setting_Palette_And_Pair_ResolveCleanly()
    {
        Assert.Equal(
            ProceduralSceneTheme.ComedyStage3D,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "Funny test", null, null, "FunnyComedy"));

        var setting = SceneDirectives.InferSetting("two friends arguing at a chai tapri over tea bill");
        Assert.Equal(SceneSetting.ChaiStall, setting);
        Assert.Equal(ProceduralSceneTheme.ComedyStage3D, SceneDirectives.ThemeFor(setting, ProceduralSceneTheme.Auto));

        var palette = ProceduralEventPalette.Resolve("FunnyComedy", ProceduralSceneTheme.Auto);
        Assert.Equal("KESHAV-ANIM-FF • COMEDY SHORT", palette.HeaderBadgeText);

        var (speakerA, speakerB) = DialogueScriptParser.InferCharacterPairFromTitle("Joke", "FunnyComedy");
        Assert.Equal("पप्पू भैया", speakerA);
        Assert.Equal("बबलू यार", speakerB);
    }

    [Fact]
    public void AutomationStageScript_Preserves_AttachedSongId_And_RejectsInvalidIds()
    {
        var normalized = AutomationStageScript.Normalize(new AutomationStageSettings
        {
            AttachedSongId = "  song_0123456789abcdef0123456789abcdef  ",
            IncludeBackgroundMusic = true
        });
        Assert.Equal("song_0123456789abcdef0123456789abcdef", normalized.AttachedSongId);

        Assert.Throws<ArgumentException>(() => AutomationStageScript.Normalize(new AutomationStageSettings
        {
            AttachedSongId = "bad/path/../traversal"
        }));
    }

    [Theory]
    [InlineData(10, true)]
    [InlineData(15, true)]
    [InlineData(30, true)]
    [InlineData(60, true)]
    [InlineData(9, false)]
    public void ComedyController_Allows_10To600_SecondMicroShorts(int targetSeconds, bool expectedValid)
    {
        var req = new ComedyWorkspaceRequest
        {
            Title = "Tea stall comedy",
            Material = "Pappu forgets his wallet at the chai stall.",
            Language = "hi",
            TargetSeconds = targetSeconds
        };
        var results = new List<ValidationResult>();
        var valid = Validator.TryValidateObject(req, new ValidationContext(req), results, validateAllProperties: true);
        Assert.Equal(expectedValid, valid);
    }

    [Fact]
    public async Task ComedyBgmPreset_And_Synthesizer_WorkWithoutExternalProviders()
    {
        var cache = new ProceduralBgmCacheService(Microsoft.Extensions.Options.Options.Create(new FfmpegOptions()));
        Assert.Equal(ProceduralSceneTheme.ComedyStage3D, cache.ResolveThemeByPresetId("comedy-stage"));

        var tmpWav = Path.Combine(Path.GetTempPath(), $"animstudio-comedy-test-{Guid.NewGuid():n}.wav");
        try
        {
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(tmpWav, ProceduralSceneTheme.ComedyStage3D, 10, CancellationToken.None);
            Assert.True(File.Exists(tmpWav));
            Assert.True(new FileInfo(tmpWav).Length > 44_000);
        }
        finally
        {
            if (File.Exists(tmpWav)) File.Delete(tmpWav);
        }
    }
}
