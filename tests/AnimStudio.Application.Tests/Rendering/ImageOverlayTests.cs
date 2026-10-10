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
}
