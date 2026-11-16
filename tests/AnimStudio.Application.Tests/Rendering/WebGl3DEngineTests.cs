using System.Text.Json;
using AnimStudio.Application.Rendering;
using AnimStudio.Infrastructure.Rendering;
using Microsoft.Extensions.Configuration;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class WebGl3DEngineTests
{
    [Fact]
    public void DialogueScriptParser_extracts_and_infers_emotions_without_leaking_tags()
    {
        var script =
            "[Pappu Bhaiya]: (surprised) Are yaar, yeh kya ho gaya!\n" +
            "[Bablu]: (laughing) हाहा, कमाल कर दिया भाई!\n" +
            "[Pappu Bhaiya]: क्या यह चाय बिना चीनी की है?\n" +
            "[Narada]: देव लोक से तुम्हें शुभ वरदान प्राप्त हो।";

        var plan = DialogueScriptParser.ParsePlan(
            title: "Comedy & Blessing",
            script: script,
            prompt: null,
            durationSeconds: 30,
            enableDialogue: true,
            eventType: "FunnyComedy");

        var spoken = plan.Turns.Where(t => !t.IsTitleHook).ToList();
        Assert.Equal(4, spoken.Count);
        Assert.Equal("surprised", spoken[0].Emotion);
        Assert.DoesNotContain("(surprised)", spoken[0].Text, StringComparison.OrdinalIgnoreCase);

        Assert.Equal("laughing", spoken[1].Emotion);
        Assert.DoesNotContain("(laughing)", spoken[1].Text, StringComparison.OrdinalIgnoreCase);

        Assert.Equal("confused", spoken[2].Emotion);
        Assert.Equal("proud", spoken[3].Emotion);
    }

    [Fact]
    public void WebGl_renderer_embeds_self_contained_threejs_assets()
    {
        var asm = typeof(WebGlVideoFrameRenderer).Assembly;
        var names = asm.GetManifestResourceNames();

        Assert.Contains("AnimStudio.WebGl3D.index.html", names);
        Assert.Contains("AnimStudio.WebGl3D.render-3d-frames.mjs", names);
        Assert.Contains("AnimStudio.WebGl3D.scene-3d.bundle.js", names);

        using var bundle = asm.GetManifestResourceStream("AnimStudio.WebGl3D.scene-3d.bundle.js");
        Assert.NotNull(bundle);
        Assert.True(bundle!.Length > 100_000);
    }

    [Fact]
    public void WebGl_job_serializer_maps_comedy_vfx_scene_runs_and_template_layout()
    {
        var script =
            "[SCENE]: chai stall | sunset | playful\n" +
            "[Pappu]: (laughing) एक कप स्पेशल चाय बनाओ!";
        var plan = DialogueScriptParser.ParsePlan(
            "Chai Comedy", script, null, 15, enableDialogue: true, eventType: "FunnyComedy");
        var palette = ProceduralEventPalette.Resolve("FunnyComedy", ProceduralSceneTheme.ComedyStage3D);
        var layout = new ProceduralStageLayout(
            new ProceduralStagePlacement(0.28, 0.78, 1.1),
            new ProceduralStagePlacement(0.72, 0.78, 1.0),
            TemplateBackdrop: true,
            TemplateMotion: TemplateBackdropMotion.GentleZoom);

        var req = new ProceduralVideoRequest
        {
            Title = "Chai Comedy",
            Theme = ProceduralSceneTheme.ComedyStage3D,
            VfxStyle = ProceduralVfxStyle.Auto,
            StageLayout = layout,
            EnableDynamicCamera = true
        };

        var json = WebGlVideoFrameRenderer.SerializeJobJson(
            720, 1280, 24, 15, 360, 123,
            ProceduralSceneTheme.ComedyStage3D, req, palette, plan, new float[360], backdropCount: 1);

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.Equal("ComedyStage3D", root.GetProperty("theme").GetString());
        Assert.Equal("ComedyBurst", root.GetProperty("vfxStyle").GetString());
        Assert.Equal(1, root.GetProperty("backdropCount").GetInt32());
        Assert.True(root.GetProperty("stageLayout").GetProperty("templateBackdrop").GetBoolean());
        Assert.Equal("GentleZoom", root.GetProperty("stageLayout").GetProperty("templateMotion").GetString());
        Assert.Contains("ChaiStall", root.GetProperty("sceneRuns").GetRawText());
    }

    [Fact]
    public void WebGl_availability_honors_disable_configuration_flag()
    {
        var cfg = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Render:EnableWebGl3D"] = "false" })
            .Build();

        Assert.False(WebGlVideoFrameRenderer.IsAvailable(cfg));
    }
}
