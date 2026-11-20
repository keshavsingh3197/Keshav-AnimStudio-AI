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

    [Fact]
    public void DialogueScriptParser_infers_actions_sleep_to_wakeup_camera_shots_and_indoor_rooms()
    {
        const string script = """
            [SCENE]: bedroom | night | playful
            [पप्पू भैया]: (sleeping) ख्र्र्र... बस पाँच मिनट और सोने दो...
            [बबलू यार]: (angry, pointing) अबे उठ जा नालायक!
            [SCENE]: kitchen | night | mischievous
            [पप्पू भैया]: (walking, eating) आहाहा, कड़ाही की गरम रबड़ी मस्त है!
            [बबलू यार]: (surprised) अरे बाप रे, सारी रबड़ी खा गया?!
            """;

        var plan = DialogueScriptParser.ParsePlan(
            "Midnight Rabdi Heist", script, null, 24, enableDialogue: true, "पप्पू भैया", "बबलू यार", "FunnyComedy");
        var spoken = plan.Turns.Where(t => !t.IsTitleHook).ToList();

        Assert.Equal(4, spoken.Count);
        Assert.Equal("sleeping", spoken[0].Action);
        Assert.Equal("bed", spoken[0].StageTarget);
        Assert.DoesNotContain("(sleeping)", spoken[0].Text, StringComparison.OrdinalIgnoreCase);

        Assert.Equal("pointing", spoken[1].Action);
        Assert.Equal("wakingUp", spoken[1].ListenerAction);
        Assert.DoesNotContain("(angry", spoken[1].Text, StringComparison.OrdinalIgnoreCase);

        Assert.Equal(SceneSetting.Kitchen, SceneDirectives.FromCue(spoken[2].SceneBackdropCue).Setting);
        Assert.Equal("walking", spoken[2].Action);
        Assert.Equal("counter", spoken[2].StageTarget);

        Assert.Equal("shockedFall", spoken[3].Action);
        Assert.Equal("crashPunch", spoken[3].CameraShot);

        var palette = ProceduralEventPalette.Resolve("FunnyComedy", ProceduralSceneTheme.ComedyStage3D);
        var req = new ProceduralVideoRequest
        {
            Title = "Midnight Rabdi Heist",
            Script = script,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            EventType = "FunnyComedy",
            EnableCharacterDialogue = true,
            EnableComedySfx = true
        };
        var json = WebGlVideoFrameRenderer.SerializeJobJson(
            720, 1280, 24, 24, 576, 99, ProceduralSceneTheme.ComedyStage3D, req, palette, plan, new float[576], 0);
        Assert.Contains("\"action\":\"sleeping\"", json, StringComparison.Ordinal);
        Assert.Contains("\"cameraShot\":\"crashPunch\"", json, StringComparison.Ordinal);
        Assert.Contains("Bedroom", json, StringComparison.Ordinal);
        Assert.Contains("Kitchen", json, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("पलंग पर सो रहा था", SceneSetting.Bedroom)]
    [InlineData("living room sofa with tea", SceneSetting.LivingRoom)]
    [InlineData("रसोई में गरम रबड़ी बन रही है", SceneSetting.Kitchen)]
    [InlineData("हलवाई की मिठाई दुकान पर जलेबी", SceneSetting.SweetShop)]
    public void SceneDirectives_matches_indoor_story_rooms(string text, SceneSetting expected)
    {
        var setting = SceneDirectives.InferSetting(text);
        Assert.Equal(expected, setting);
    }

    [Fact]
    public async Task WriteComedySfxWavAsync_synthesizes_sfx_for_action_transitions_even_outside_comedy()
    {
        const string script = """
            [SCENE]: bedroom | dawn
            [A]: (sleeping) आराम कर रहा था...
            [B]: (waking up) अरे जागो, मंदिर जाने का समय हो गया!
            [SCENE]: temple | dawn
            [A]: (walking) चलो मंदिर की ओर चलते हैं।
            [B]: (praying) भगवान को प्रणाम!
            """;
        var plan = DialogueScriptParser.ParsePlan(
            "Morning Temple", script, null, 14, enableDialogue: true, "A", "B", "HinduFestival");
        var wavPath = Path.Combine(Path.GetTempPath(), $"animstudio-action-sfx-{Guid.NewGuid():n}.wav");
        try
        {
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(wavPath, plan, 14, CancellationToken.None, comedyIntensity: false);
            var bytes = await File.ReadAllBytesAsync(wavPath);
            Assert.True(bytes.Length > 44);
            Assert.Contains(bytes.Skip(44), b => b != 0);
        }
        finally
        {
            if (File.Exists(wavPath)) File.Delete(wavPath);
        }
    }
}
