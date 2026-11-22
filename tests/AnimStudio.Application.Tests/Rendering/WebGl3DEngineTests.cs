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

    [Fact]
    public void TrimLeadingAndTrailingSilence_removes_dead_padding_around_active_speech()
    {
        const int sr = 48_000;
        const int ch = 2;
        var leadSamples = (int)(0.65 * sr);
        var voiceSamples = (int)(1.00 * sr);
        var tailSamples = (int)(0.75 * sr);
        var totalSamples = leadSamples + voiceSamples + tailSamples;
        var pcm = new byte[totalSamples * ch * 2];

        for (var i = 0; i < voiceSamples; i++)
        {
            var s = (short)(Math.Sin(2.0 * Math.PI * 320.0 * i / sr) * 14000.0);
            var idx = (leadSamples + i) * ch * 2;
            pcm[idx] = (byte)(s & 0xFF);
            pcm[idx + 1] = (byte)(s >> 8);
            pcm[idx + 2] = (byte)(s & 0xFF);
            pcm[idx + 3] = (byte)(s >> 8);
        }

        var rawWav = new byte[44 + pcm.Length];
        var span = rawWav.AsSpan();
        "RIFF"u8.CopyTo(span[..4]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span.Slice(4, 4), 36 + pcm.Length);
        "WAVE"u8.CopyTo(span.Slice(8, 4));
        "fmt "u8.CopyTo(span.Slice(12, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span.Slice(16, 4), 16);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span.Slice(20, 2), 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span.Slice(22, 2), ch);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span.Slice(24, 4), sr);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span.Slice(28, 4), sr * ch * 2);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span.Slice(32, 2), ch * 2);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span.Slice(34, 2), 16);
        "data"u8.CopyTo(span.Slice(36, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span.Slice(40, 4), pcm.Length);
        pcm.CopyTo(rawWav, 44);

        var trimmed = ProceduralSpeechSynthesizer.TrimLeadingAndTrailingSilence(rawWav);
        var trimmedDur = AnimStudio.Application.Ai.AiAudioValidator.TryGetWavDuration(trimmed);
        Assert.NotNull(trimmedDur);
        Assert.InRange(trimmedDur!.Value, 0.98, 1.18);
    }

    [Fact]
    public void AssSubtitleWriter_karaoke_highlights_speaker_prefix_instantly_and_sums_exact_duration()
    {
        var styles = new Dictionary<string, AnimStudio.Application.Abstractions.Rendering.SubtitleStyle>
        {
            ["spkA"] = new("SpeakerA", "#FDE047", Bold: true, Alignment: 2, MarginV: 352, SecondaryColorHex: "#F8FAFC", MotionPreset: AnimStudio.Application.Abstractions.Rendering.SubtitleMotionPreset.KaraokePulse)
        };
        var line = new AnimStudio.Domain.Scenes.DialogueLine
        {
            Text = "पप्पू भैया: ख्र्र्र... बस पाँच मिनट",
            RelativeStartFrame = 24,
            RelativeEndFrame = 96, // 3.0s = 300cs at 24fps
            SpeakerCharacterId = "spkA",
            SpeakerLabel = "पप्पू भैया"
        };

        var ass = new AnimStudio.Infrastructure.Subtitles.AssSubtitleWriter()
            .Write(new AnimStudio.Application.Abstractions.Rendering.SubtitleRequest(
                new AnimStudio.Domain.Rendering.Canvas(720, 1280, new AnimStudio.Domain.Rendering.FrameRate(24, 1)), [line], styles));

        Assert.Contains(@"{\k0}पप्पू {\k0}भैया:", ass, StringComparison.Ordinal);
        var matches = System.Text.RegularExpressions.Regex.Matches(ass, @"\\k(\d+)");
        var sumCs = matches.Cast<System.Text.RegularExpressions.Match>().Sum(m => int.Parse(m.Groups[1].Value));
        Assert.Equal(300, sumCs);
    }

    [Fact]
    public void ComedyPlan_differentiates_characters_wakes_sleeper_on_shout_and_isolates_meme_gaps()
    {
        const string script = """
            [SCENE]: bedroom | night | playful
            [पप्पू भैया]: ख्र्र्र... बस पाँच मिनट...
            [बबलू यार]: अरे पप्पू! आधी रात को ये रसोई में कड़ाही कौन खड़का रहा है?!
            [MEME]: shocked_face | रंगे हाथ पकड़ा गया! | 1.6
            [SCENE]: kitchen | night | mischievous
            [पप्पू भैया]: आहाहा! आज मलाईदार रबड़ी अकेले साफ कर दूँगा...
            """;

        var plan = DialogueScriptParser.ParsePlan(
            "Midnight Rabdi", script, null, 24, enableDialogue: true, "पप्पू भैया", "बबलू यार", "FunnyComedy");

        Assert.NotNull(plan.LeftCharacter);
        Assert.NotNull(plan.RightCharacter);
        Assert.NotEqual(plan.LeftCharacter!.Role, plan.RightCharacter!.Role);
        Assert.NotEqual(plan.LeftCharacter.RobeHex, plan.RightCharacter.RobeHex);

        var spoken = plan.Turns.Where(t => !t.IsTitleHook).ToList();
        Assert.Equal("sleeping", spoken[0].Action);
        Assert.Equal("wakingUp", spoken[1].ListenerAction);

        var measured = DialogueScriptParser.WithMeasuredTurns(plan, [
            plan.Turns[0],
            spoken[0] with { StartSeconds = 0.35, EndSeconds = 3.20 },
            spoken[1] with { StartSeconds = 3.44, EndSeconds = 6.80 },
            spoken[2] with { StartSeconds = 7.75, EndSeconds = 11.10 }
        ]);

        var meme = Assert.Single(measured.Memes);
        Assert.True(meme.StartSeconds >= 6.80, $"Meme start {meme.StartSeconds} should wait until turn ends at 6.80.");
        Assert.True(meme.StartSeconds + meme.Seconds <= 7.75, $"Meme end should finish cleanly before next turn starts at 7.75.");
    }

    [Fact]
    public void DialogueScriptParser_infers_held_props_and_role_blocking_across_any_story()
    {
        const string script = """
            [SCENE]: barber shop | day | funny
            [अमरेंद्र नाई]: ले पहला झटका... चक-चक-चक केंची चलेगी!
            [पप्पू ग्राहक]: अरे तौलिया तो हटा, ये क्या कर दिया?!
            [SCENE]: neighborhood gate | sunset | dramatic
            [PROP]: key
            [पापा जी]: अरे चाबी तो जेब में ही थी!
            [हवलदार]: पुलिस को फ़ोन मिलाओ जल्दी!
            """;

        var plan = DialogueScriptParser.ParsePlan(
            "Salon & Gate Props", script, null, 30, enableDialogue: true, "अमरेंद्र नाई", "पप्पू ग्राहक", "FunnyComedy");
        var spoken = plan.Turns.Where(t => !t.IsTitleHook).ToList();

        Assert.Equal("scissors", spoken[0].SpeakerProp);
        Assert.Equal("cape", spoken[0].ListenerProp);
        Assert.Equal("cutting", spoken[0].Action);
        Assert.Equal("barberStand", spoken[0].StageTarget);

        Assert.Equal("removingTowel", spoken[1].Action);
        Assert.Equal("barberChair", spoken[1].StageTarget);
        Assert.Equal("scissors", spoken[1].ListenerProp);

        Assert.Equal("key", spoken[2].SpeakerProp);
        Assert.Equal("showingKey", spoken[2].Action);
        Assert.Equal("phone", spoken[3].SpeakerProp);
        Assert.Equal("callingPhone", spoken[3].Action);
    }
}
