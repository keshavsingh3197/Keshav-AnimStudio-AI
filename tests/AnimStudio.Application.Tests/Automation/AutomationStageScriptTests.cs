using AnimStudio.Application.Automation;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Infrastructure.Rendering;
using Xunit;

namespace AnimStudio.Application.Tests.Automation;

public sealed class AutomationStageScriptTests
{
    [Fact]
    public void Location_becomes_the_opening_scene_line()
    {
        var script = AutomationStageScript.WithLocation("[Raju]: Namaste!", "river ghat at sunrise");
        Assert.StartsWith("[SCENE]: river ghat at sunrise | IMAGE: river ghat at sunrise", script);
        Assert.EndsWith("[Raju]: Namaste!", script);

        var plan = DialogueScriptParser.ParsePlan("t", script, null, 60, true, "Raju", "Guru");
        Assert.DoesNotContain(plan.Turns, t => t.Text.Contains("ghat", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Script_with_its_own_scenes_is_left_alone()
    {
        const string script = "[SCENE]: palace court | day\n[Raja]: Swagat hai.";
        Assert.Equal(script, AutomationStageScript.WithLocation(script, "forest"));
    }

    [Fact]
    public void No_location_leaves_the_script_unchanged()
    {
        Assert.Equal("[A]: hi", AutomationStageScript.WithLocation("[A]: hi", "   "));
    }

    [Theory]
    [InlineData("temple]\n[Narrator]: injected", "temple Narrator : injected")]
    [InlineData("a | b {c} <d>", "a b c d")]
    public void Location_cannot_open_another_script_line(string input, string expected)
    {
        Assert.Equal(expected, AutomationStageScript.CleanLocation(input));
    }

    [Fact]
    public void Location_is_capped()
    {
        var clean = AutomationStageScript.CleanLocation(new string('x', 500));
        Assert.Equal(AutomationStageScript.MaxLocationChars, clean!.Length);
    }

    [Fact]
    public void Normalize_clamps_placements_into_the_frame()
    {
        var stage = AutomationStageScript.Normalize(new AutomationStageSettings
        {
            LeftCharacter = new AutomationCharacterPlacement { X = -3, Y = 0.01, Scale = 9 },
            RightCharacter = new AutomationCharacterPlacement { X = double.NaN, Y = 2, Scale = 0 }
        });

        Assert.Equal(0.05, stage.LeftCharacter!.X);
        Assert.Equal(0.25, stage.LeftCharacter.Y);
        Assert.Equal(ProceduralStagePlacement.MaxScale, stage.LeftCharacter.Scale);
        Assert.Equal(0.5, stage.RightCharacter!.X);
        Assert.Equal(0.95, stage.RightCharacter.Y);
        Assert.Equal(ProceduralStagePlacement.MinScale, stage.RightCharacter.Scale);
    }

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("abc def")]
    public void Normalize_rejects_a_malformed_asset_id(string id)
    {
        Assert.Throws<ArgumentException>(() =>
            AutomationStageScript.Normalize(new AutomationStageSettings { BackgroundTemplateAssetId = id }));
    }

    [Fact]
    public void Defaults_follow_the_script_with_music()
    {
        var stage = AutomationStageScript.Normalize(null);
        Assert.True(stage.FollowScriptExactly);
        Assert.True(stage.IncludeBackgroundMusic);
        Assert.Null(AutomationStageScript.ToLayout(stage, usingTemplate: false));
    }

    [Fact]
    public void Placed_characters_render_on_their_spot_over_a_still_template()
    {
        const int w = 180, h = 320;
        var plan = DialogueScriptParser.ParsePlan("t", "[Raju]: Namaste guruji.\n[Guru]: Ayushman bhava.", null, 20, true, "Raju", "Guru");
        var palette = ProceduralEventPalette.Resolve("HinduPanchang", ProceduralSceneTheme.Auto);
        var template = new byte[w * h * 4];
        for (var i = 0; i < template.Length; i += 4) { template[i] = 30; template[i + 1] = 140; template[i + 2] = 60; template[i + 3] = 255; }

        ProceduralSceneRasterizer Make(ProceduralStageLayout layout) => new(w, h, ProceduralSceneTheme.CosmosSacred3D, 7, palette, plan,
            backdropFrames: [template], stageLayout: layout);

        var defaults = Make(new ProceduralStageLayout(null, null, TemplateBackdrop: true)).RenderFrame(5, 20).ToArray();
        var moved = Make(new ProceduralStageLayout(
            new ProceduralStagePlacement(0.15, 0.9, 0.7), new ProceduralStagePlacement(0.85, 0.9, 0.7), TemplateBackdrop: true))
            .RenderFrame(5, 20).ToArray();
        Assert.NotEqual(defaults, moved);

        // Still template: two moments with nobody speaking in between differ only by animation, never by a zoomed backdrop,
        // so a top-left pixel under the header band area keeps the template's hue (green dominant).
        var px = (int)(h * 0.45) * w * 4 + 2 * 4;
        Assert.True(moved[px + 1] > moved[px] && moved[px + 1] > moved[px + 2]);
    }

    [Fact]
    public void Template_without_placements_still_marks_the_layout()
    {
        var layout = AutomationStageScript.ToLayout(new AutomationStageSettings(), usingTemplate: true);
        Assert.NotNull(layout);
        Assert.True(layout!.TemplateBackdrop);
        Assert.Null(layout.Left);
    }
}
