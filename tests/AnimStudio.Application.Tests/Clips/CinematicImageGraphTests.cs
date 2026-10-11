using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// Stills turned into shots: the camera move, grade and lens finish an image clip carries,
/// asserted on the conform graph with no ffmpeg installed.
/// </summary>
public class CinematicImageGraphTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    private static CinematicImageSettings Settings(
        string motion = "zoom-in", string? look = null, bool vignette = false, bool grain = false, bool bars = false,
        double focusX = 50, double focusY = 50) =>
        CinematicImageSettings.From(motion, 0.2, focusX, focusY, "ease", look, vignette, grain, bars)!;

    private static ClipRenderPlan ImagePlan(CinematicImageSettings? cinematic, ClipFit fit = ClipFit.Cover) =>
        new()
        {
            ClipIndex = 0,
            SourceRelativePath = "in/img_abc.png",
            Canvas = Canvas.Hd1080p30,
            OutputRelativePath = "clips/clip_001.mp4",
            ExpectedFrames = new FrameCount(150),
            Fit = fit,
            SourceIsImage = true,
            ImageDurationSeconds = 5,
            SourceHasAudio = false,
            Cinematic = cinematic,
            MotionSupersample = 2
        };

    [Fact]
    public void A_still_without_settings_keeps_the_static_graph()
    {
        var graph = NewBuilder().BuildClip(ImagePlan(null)).FilterComplex;

        Assert.DoesNotContain("zoompan", graph);
        Assert.Contains("crop=1920:1080", graph);
    }

    [Fact]
    public void Settings_that_ask_for_nothing_are_null()
    {
        Assert.Null(CinematicImageSettings.From("none", 0.15, 50, 50, null, "none", false, false, false));
        Assert.Null(CinematicImageSettings.From(null, 0.15, 50, 50, null, null, false, false, false));
    }

    [Fact]
    public void A_move_fits_at_the_supersampled_size_and_zooms_back_down_to_the_canvas()
    {
        var graph = NewBuilder().BuildClip(ImagePlan(Settings())).FilterComplex;

        Assert.Contains("scale=3840:2160:force_original_aspect_ratio=increase", graph);
        Assert.Contains("crop=3840:2160", graph);
        Assert.Contains("zoompan=z='1+0.2*(", graph);
        // Frame count from 5s at 30fps: progress runs over on/149.
        Assert.Contains("on/149", graph);
        Assert.Contains(":d=1:s=1920x1080:fps=30", graph);
        Assert.Contains("[base]zoompan=", graph);
    }

    [Fact]
    public void A_zoom_heads_for_the_focus_point()
    {
        var graph = NewBuilder().BuildClip(ImagePlan(Settings(focusX: 25, focusY: 80))).FilterComplex;

        Assert.Contains(@"x='(iw-iw/zoom)*0.25'", graph);
        Assert.Contains(@"y='(ih-ih/zoom)*0.8'", graph);
    }

    [Theory]
    [InlineData("pan-left", @"(iw-iw/zoom)*(1-(")]
    [InlineData("drift", "1+0.2*(0.5+0.5*(")]
    [InlineData("handheld", "sin(on/30*1.13)")]
    [InlineData("breathe", "cos(2*PI*(")]
    public void Every_move_has_its_own_expression(string motion, string expected)
    {
        var graph = NewBuilder().BuildClip(ImagePlan(Settings(motion))).FilterComplex;

        Assert.Contains(expected, graph.Replace("\\,", ","));
    }

    [Fact]
    public void Grade_and_lens_finish_follow_the_move()
    {
        var graph = NewBuilder()
            .BuildClip(ImagePlan(Settings(look: "noir", vignette: true, grain: true, bars: true)))
            .FilterComplex;

        var move = graph.IndexOf("zoompan", StringComparison.Ordinal);
        var grade = graph.IndexOf("hue=s=0", StringComparison.Ordinal);
        Assert.True(move >= 0 && grade > move, graph);
        Assert.Contains("vignette=angle=PI/5", graph);
        Assert.Contains("noise=alls=10:allf=t+u", graph);
        // 2.39:1 on 1920x1080: (1080 - 803.35) / 2 = 138.3, rounded to an even 138.
        Assert.Contains("drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill", graph);
        Assert.Contains("drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill", graph);
    }

    [Fact]
    public void A_grade_alone_needs_no_move()
    {
        var graph = NewBuilder().BuildClip(ImagePlan(Settings(motion: "none", look: "warm"))).FilterComplex;

        Assert.DoesNotContain("zoompan", graph);
        Assert.Contains("scale=1920:1080", graph);
        Assert.Contains("[base]colorbalance=rs=0.08", graph);
    }

    [Fact]
    public void Without_zoompan_the_move_is_dropped_with_a_warning_but_the_grade_stays()
    {
        var plan = NewBuilder(RenderFeature.KenBurns).BuildClip(ImagePlan(Settings(look: "vivid")));

        Assert.DoesNotContain("zoompan", plan.FilterComplex);
        Assert.Contains("eq=saturation=1.4", plan.FilterComplex);
        Assert.Contains("IMAGE_MOTION_UNAVAILABLE", plan.Warnings);
    }

    [Fact]
    public void A_video_clip_ignores_image_settings()
    {
        var plan = ImagePlan(Settings(look: "noir")) with { SourceIsImage = false, SourceRelativePath = "in/vid.mp4" };

        var graph = NewBuilder().BuildClip(plan).FilterComplex;

        Assert.DoesNotContain("zoompan", graph);
        Assert.DoesNotContain("hue=s=0", graph);
    }

    [Fact]
    public void Out_of_range_numbers_are_held_to_safe_values()
    {
        var s = CinematicImageSettings.From("zoom-in", 9, -20, double.NaN, "linear", null, false, false, false)!;

        Assert.Equal(CinematicImageSettings.MaxIntensity, s.Intensity);
        Assert.Equal(0, s.FocusX);
        Assert.Equal(0.5, s.FocusY);
        Assert.Equal(Easing.Linear, s.Easing);
    }
}
