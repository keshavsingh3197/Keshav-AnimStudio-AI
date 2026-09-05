using System.Globalization;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

public class SceneGraphBuilderTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    private static SpritePlan Sprite(
        string id = "rahul", bool withOpenMouth = true, params (double Start, double End)[] speaking) =>
        new()
        {
            CharacterId = id,
            ClosedMouthRelativePath = $"in/{id}_closed.png",
            OpenMouthRelativePath = withOpenMouth ? $"in/{id}_open.png" : null,
            HeightPixels = 756,
            XExpression = "260",
            YExpression = "H-h-40",
            Presence = new FrameRange(FrameCount.Zero, new FrameCount(360)),
            SpeakingWindows =
            [
                .. speaking.Select(w => FrameRange.FromSeconds(w.Start, w.End, FrameRate.Fps30))
            ]
        };

    private static SceneRenderPlan Plan(
        AnimationSettings? animation = null, params SpritePlan[] sprites) =>
        new()
        {
            SceneIndex = 0,
            SceneId = "scene-1",
            Canvas = Canvas.Hd1080p30,
            Duration = new FrameCount(360),               // 12.0s
            BackgroundRelativePath = "in/bg.jpg",
            BackgroundAnimation = animation ?? AnimationSettings.None,
            Sprites = sprites,
            AudioRelativePath = "in/voice.m4a",
            SubtitleRelativePath = "sub/scene_001.ass",
            OutputRelativePath = "scenes/scene_001.mp4"
        };

    [Fact]
    public void Always_states_the_frame_rate_on_zoompan()
    {
        // zoompan defaults to 25fps. Leaving it implicit would silently turn a 12s scene
        // into 300 frames instead of 360.
        var plan = Plan(new AnimationSettings(BackgroundEffect.ZoomIn));

        var graph = NewBuilder().BuildScene(plan).FilterComplex;

        Assert.Contains("zoompan=", graph);
        Assert.Contains("fps=30", graph);
        // d=1 makes "on" the absolute output frame index.
        Assert.Contains(":d=1:", graph);
    }

    [Theory]
    [InlineData(BackgroundEffect.ZoomIn, "1+0.15*(")]
    [InlineData(BackgroundEffect.ZoomOut, "(1+0.15)-0.15*(")]
    public void Emits_the_expected_zoom_expression(BackgroundEffect effect, string expected)
    {
        var graph = NewBuilder().BuildScene(Plan(new AnimationSettings(effect))).FilterComplex;

        Assert.Contains(expected.Replace(":", "\\:"), graph.Replace("\\,", ","));
    }

    [Theory]
    [InlineData(BackgroundEffect.PanLeft)]
    [InlineData(BackgroundEffect.PanRight)]
    public void A_pan_pins_the_zoom_above_one_so_there_is_travel_available(BackgroundEffect effect)
    {
        var graph = NewBuilder().BuildScene(Plan(new AnimationSettings(effect))).FilterComplex;

        Assert.Contains("z='1+0.15'", graph);
        Assert.Contains("iw-iw/zoom", graph);
    }

    [Fact]
    public void Supersamples_the_background_then_composites_in_4_4_4()
    {
        // Overlay defaults to yuv420 blending, which fringes sprite edges in colour.
        var graph = NewBuilder().BuildScene(Plan()).FilterComplex;

        Assert.Contains("scale=3840:2160:force_original_aspect_ratio=decrease", graph);
        Assert.Contains("format=yuv444p[bg]", graph);
        Assert.Contains("format=yuv420p[vout]", graph);
    }

    [Fact]
    public void Mouth_flap_enables_are_exact_complements()
    {
        var plan = Plan(null, Sprite(speaking: [(1.0, 4.5), (8.5, 11.5)]));

        var graph = NewBuilder().BuildScene(plan).FilterComplex;
        var unescaped = graph.Replace("\\,", ",").Replace("\\:", ":");

        // Two dialogue windows OR'd together, collapsed to a boolean by min(sum,1).
        const string speaking = "min(between(t,1,4.5)+between(t,8.5,11.5),1)";
        const string flap = "lt(mod(t*8,2),1)";

        // The closed sprite shows whenever the open one does not, and vice versa: no frame
        // ever renders both sprites or neither.
        Assert.Contains($"enable='between(t,0,12)*(1-{speaking}*{flap})'", unescaped);
        Assert.Contains($"enable='between(t,0,12)*{speaking}*{flap}'", unescaped);
    }

    [Fact]
    public void A_single_dialogue_window_needs_no_min_collapse()
    {
        var plan = Plan(null, Sprite(speaking: [(1.0, 4.5)]));

        var unescaped = NewBuilder().BuildScene(plan).FilterComplex
            .Replace("\\,", ",").Replace("\\:", ":");

        Assert.Contains("between(t,1,4.5)*lt(mod(t*8,2),1)", unescaped);
        Assert.DoesNotContain("min(between(t,1,4.5),1)", unescaped);
    }

    [Fact]
    public void A_character_with_one_sprite_still_renders_and_warns()
    {
        var plan = Plan(null, Sprite(withOpenMouth: false, speaking: [(1.0, 4.5)]));

        var result = NewBuilder().BuildScene(plan);

        // One overlay only, and no open-mouth input.
        Assert.Single(result.Inputs, i => i.RelativePath.Contains("closed"));
        Assert.DoesNotContain("_open.png", result.FilterComplex);
        Assert.Contains(result.Warnings, w => w.StartsWith("MOUTH_FLAP_UNAVAILABLE"));
    }

    [Fact]
    public void Guarantees_an_alpha_plane_on_every_sprite()
    {
        // A palette PNG would otherwise composite as an opaque rectangle.
        var graph = NewBuilder().BuildScene(Plan(null, Sprite())).FilterComplex;

        Assert.Contains("format=rgba", graph);
        Assert.Contains("scale=-2:756", graph);   // -2 keeps the width even
    }

    [Fact]
    public void Clamps_scene_audio_to_the_exact_scene_length()
    {
        // atrim cuts long audio, apad=whole_dur pads short audio: audio length always
        // equals video length, which is what makes cross-scene drift impossible.
        var graph = NewBuilder().BuildScene(Plan()).FilterComplex;

        Assert.Contains("atrim=start=0:end=12", graph);
        Assert.Contains("apad=whole_dur=12", graph);
        Assert.Contains("asetpts=N/SR/TB", graph);
    }

    [Fact]
    public void Supplies_silence_when_a_scene_has_no_audio()
    {
        // Every scene needs exactly one audio stream or concat and acrossfade misbehave.
        var plan = Plan() with { AudioRelativePath = null };

        var result = NewBuilder().BuildScene(plan);

        Assert.Contains(result.Inputs, i => i.IsLavfi && i.RelativePath.StartsWith("anullsrc"));
    }

    [Fact]
    public void Slices_audio_from_the_original_media_clock()
    {
        var plan = Plan() with { AudioSliceStartSeconds = 12.4, AudioSliceEndSeconds = 24.55 };

        var graph = NewBuilder().BuildScene(plan).FilterComplex;

        Assert.Contains("atrim=start=12.4:end=24.55", graph);
    }

    [Fact]
    public void Burns_subtitles_when_libass_is_available()
    {
        var graph = NewBuilder().BuildScene(Plan()).FilterComplex;

        Assert.Contains("subtitles=filename=sub/scene_001.ass", graph);
    }

    [Fact]
    public void Degrades_without_failing_when_libass_is_missing()
    {
        var result = NewBuilder(RenderFeature.BurnedSubtitles).BuildScene(Plan());

        Assert.DoesNotContain("subtitles=", result.FilterComplex);
        Assert.Contains("SUBTITLES_DEGRADED", result.Warnings);
    }

    [Fact]
    public void Pins_the_exact_output_frame_count()
    {
        var result = NewBuilder().BuildScene(Plan());

        var frames = result.OutputArguments
            .SkipWhile(a => a != "-frames:v").Skip(1).First();
        Assert.Equal("360", frames);
        Assert.Equal(360, result.ExpectedFrames.Value);
    }

    [Fact]
    public void Every_stream_reference_in_the_graph_has_a_matching_input()
    {
        var plan = Plan(null, Sprite("rahul", true, (1.0, 4.5)), Sprite("priya", true, (5.0, 8.0)));

        var result = NewBuilder().BuildScene(plan);
        var referenced = System.Text.RegularExpressions.Regex
            .Matches(result.FilterComplex, @"\[(\d+):[av]\]")
            .Select(m => int.Parse(m.Groups[1].Value))
            .Distinct();

        Assert.All(referenced, index =>
            Assert.True(index < result.Inputs.Count,
                $"graph references input [{index}] but only {result.Inputs.Count} inputs exist"));
    }

    [Fact]
    public void Emits_invariant_decimals_under_any_culture()
    {
        // Under de-DE, 0.5 would serialize as "0,5" and the comma would split the filter
        // chain, producing a graph that is garbage in a hard-to-read way.
        var original = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = new CultureInfo("de-DE");

            var plan = Plan(new AnimationSettings(BackgroundEffect.ZoomIn, 0.15,
                FadeIn: new FrameCount(15), FadeOut: new FrameCount(15)));
            var graph = NewBuilder().BuildScene(plan).FilterComplex;

            Assert.Contains("0.15", graph);
            Assert.Contains("d=0.5", graph);
            Assert.DoesNotContain("0,15", graph.Replace("\\,", "@"));
        }
        finally
        {
            CultureInfo.CurrentCulture = original;
        }
    }

    [Fact]
    public void Applies_a_slide_entrance_as_a_clamped_interpolation()
    {
        var sprite = Sprite() with
        {
            Entrance = SpriteEntrance.SlideFromLeft,
            EntranceDuration = new FrameCount(15)   // 0.5s
        };

        var unescaped = NewBuilder().BuildScene(Plan(null, sprite)).FilterComplex
            .Replace("\\,", ",").Replace("\\:", ":");

        Assert.Contains("min(t/0.5,1)", unescaped);
        Assert.Contains("(-w)", unescaped);
    }

    [Fact]
    public void Is_deterministic_for_the_same_plan()
    {
        var plan = Plan(new AnimationSettings(BackgroundEffect.ZoomIn), Sprite(speaking: [(1, 4)]));

        Assert.Equal(
            NewBuilder().BuildScene(plan).FilterComplex,
            NewBuilder().BuildScene(plan).FilterComplex);
    }
}
