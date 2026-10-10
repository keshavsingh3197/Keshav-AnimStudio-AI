using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Image overlays - a logo or sticker placed on the frame. Sized against the canvas so the
/// preview's "30% of the width" is the export's, and timed on the joined video's clock.
/// </summary>
public class ImageOverlayTests
{
    private static readonly Canvas Short = new(1080, 1920, FrameRate.Fps30);

    private static MergePlan Plan(params MergeOverlayItem[] overlays) => new()
    {
        Canvas = Short,
        Scenes =
        [
            new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300), TransitionSettings.None),
            new MergeSceneInput("clips/clip_002.mp4", new FrameCount(300), TransitionSettings.None)
        ],
        Overlays = overlays,
        OutputRelativePath = "out/final.mp4"
    };

    private static MergeOverlayItem Image(double? widthPercent, string transition = "none") =>
        new("image", "in/logo.png", 2, 6, 1, 20, -30, 1, transition, 0.5, transition, 0.5)
        {
            WidthPercent = widthPercent
        };

    private static FilterGraphPlan Build(MergeOverlayItem overlay) =>
        new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildMerge(Plan(overlay));

    [Fact]
    public void A_width_percent_is_measured_against_the_canvas_not_the_source()
    {
        var graph = Build(Image(30)).FilterComplex;

        // 30% of 1080, height following the aspect at an even number.
        Assert.Contains("scale=324:-2", graph);
        Assert.DoesNotContain("scale=iw*", graph);
    }

    [Fact]
    public void Without_a_width_the_old_source_scale_still_applies()
    {
        var overlay = Image(null) with { Scale = 0.5 };

        Assert.Contains("scale=iw*0.5:-1", Build(overlay).FilterComplex);
    }

    [Fact]
    public void A_still_is_looped_for_its_length_so_it_has_frames_to_fade()
    {
        var plan = Build(Image(30, "fade"));

        var input = Assert.Single(plan.Inputs, i => i.RelativePath == "in/logo.png");
        Assert.Equal(["-loop", "1", "-framerate", "30/1", "-t", "6"], input.PreInputArguments);

        // On the joined video's clock: shifted to its start, fades at absolute times.
        Assert.Contains("setpts=PTS-STARTPTS+2/TB", plan.FilterComplex);
        Assert.Contains("fade=t=in:st=2:d=0.5:alpha=1", plan.FilterComplex);
        Assert.Contains("fade=t=out:st=7.5:d=0.5:alpha=1", plan.FilterComplex);
    }

    [Fact]
    public void Placed_by_its_offset_from_the_centre_and_shown_only_in_its_window()
    {
        var graph = Build(Image(30)).FilterComplex;

        Assert.Contains("overlay=x=(W-w)/2+W*0.2:y=(H-h)/2+H*-0.3:enable='between(t,2,8)'", graph);
    }

    private static MergeMediaOverlay Shaped(
        OverlayShape shape, double border = 0, double? aspect = 1, double trim = 0,
        double cropLeft = 0, double cropRight = 0) =>
        new(cropLeft, 0, cropRight, 0, shape, border, "FFD400", aspect, trim);

    [Fact]
    public void A_circle_still_is_cut_once_and_then_looped()
    {
        var plan = Build(Image(30) with { Media = Shaped(OverlayShape.Circle, border: 4) });

        // The input is ONE frame: a per-pixel geq on a looped input would run every frame.
        var input = Assert.Single(plan.Inputs, i => i.RelativePath == "in/logo.png");
        Assert.Empty(input.PreInputArguments);

        var graph = plan.FilterComplex;
        var geq = graph.IndexOf("geq=", StringComparison.Ordinal);
        var loop = graph.IndexOf("loop=loop=-1:size=1:start=0", StringComparison.Ordinal);
        Assert.True(geq >= 0 && loop > geq, "the shape must be cut before the loop");
        Assert.Contains("scale=324:324,setsar=1", graph);
        Assert.Contains("trim=duration=6", graph);
        // Ring painted in the chosen colour, 4 reference px = 12px on a 1080-wide Short.
        Assert.Contains("+255*", graph);
        Assert.Contains("212*", graph);
        Assert.Contains("/2-12)", graph);
    }

    [Fact]
    public void A_crop_is_applied_before_sizing()
    {
        var graph = Build(Image(30) with { Media = Shaped(OverlayShape.Rect, cropLeft: 10, cropRight: 15) }).FilterComplex;

        var crop = graph.IndexOf("crop=w=iw*0.75:h=ih*1:x=iw*0.1:y=ih*0", StringComparison.Ordinal);
        Assert.True(crop >= 0, graph);
        Assert.True(crop < graph.IndexOf("scale=324:", StringComparison.Ordinal));
    }

    [Fact]
    public void A_shaped_video_is_masked_by_a_stencil_drawn_once()
    {
        var overlay = new MergeOverlayItem("video", "in/pip.mp4", 2, 6, 1, 0, 0, 1, "none", 0.5, "none", 0.5)
        {
            WidthPercent = 30,
            Media = Shaped(OverlayShape.Circle, border: 4, aspect: 1, trim: 3.5)
        };
        var plan = Build(overlay);

        var input = Assert.Single(plan.Inputs, i => i.RelativePath == "in/pip.mp4");
        Assert.Equal(["-ss", "3.5", "-t", "6"], input.PreInputArguments);

        var graph = plan.FilterComplex;
        Assert.Contains("color=c=black:s=324x324", graph);
        Assert.Contains("alphamerge", graph);
        Assert.Contains("color=c=0xFFD400:s=324x324", graph);
        // The moving picture itself is never run through geq.
        Assert.DoesNotContain("[0:v]format=rgba,scale=324:324,setsar=1,geq", graph);
    }

    [Theory]
    [InlineData("slide-up", "y='(H-h)/2+H*-0.3+H*0.25*(1-")]
    [InlineData("slide-down", "y='(H-h)/2+H*-0.3-H*0.25*(1-")]
    [InlineData("slide-left", "x='(W-w)/2+W*0.2+W*0.25*(1-")]
    [InlineData("slide-right", "x='(W-w)/2+W*0.2-W*0.25*(1-")]
    public void Slides_in_from_the_side_it_is_named_away_from(string kind, string expected)
    {
        var overlay = Image(30) with { TransitionIn = kind, TransitionOut = "none" };
        var graph = Build(overlay).FilterComplex;

        Assert.Contains(expected, graph);
        Assert.Contains("fade=t=in:st=2:d=0.5:alpha=1", graph);
    }

    [Fact]
    public void A_zoom_scales_every_frame_around_the_centre()
    {
        var overlay = Image(30) with { TransitionIn = "pop", TransitionOut = "zoom" };
        var graph = Build(overlay).FilterComplex;

        Assert.Contains(":h=-2:eval=frame", graph);
        Assert.Contains("1.70158", graph);
    }
}
