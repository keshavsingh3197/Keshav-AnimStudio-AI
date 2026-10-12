using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// A picture on an image lane with a camera move or look: drawn full frame in its slot and
/// moved like a V1 picture clip, so the export matches what the studio monitor plays.
/// </summary>
public class LaneImageShotTests
{
    private static readonly Canvas Wide = Canvas.Hd1080p30;

    private static MergePlan Plan(MergeOverlayItem overlay) => new()
    {
        Canvas = Wide,
        Scenes =
        [
            new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300), TransitionSettings.None),
            new MergeSceneInput("clips/slot_001.mp4", new FrameCount(150), TransitionSettings.None)
        ],
        Overlays = [overlay],
        OutputRelativePath = "out/final.mp4"
    };

    private static MergeOverlayItem Picture(CinematicImageSettings? shot, ClipFit fit = ClipFit.Cover) =>
        new("image", "in/photo.png", 10, 5, 0.5, 20, -30, 1, "fade", 0.5, "fade", 0.5)
        {
            WidthPercent = 40,
            Shot = shot is null ? null : new MergeImageShot(shot, fit, "112233", 2)
        };

    private static string Build(MergeOverlayItem overlay, params RenderFeature[] unsupported) =>
        new FfmpegFilterGraphBuilder(new FakeCapabilities(unsupported)).BuildMerge(Plan(overlay)).FilterComplex;

    private static CinematicImageSettings Settings(string motion = "zoom-in", string? look = null, bool bars = false) =>
        CinematicImageSettings.From(motion, 0.2, 50, 50, "ease", look, false, false, bars)!;

    [Fact]
    public void A_moving_picture_fills_the_canvas_and_runs_the_zoompan()
    {
        var graph = Build(Picture(Settings()));

        Assert.Contains("scale=3840:2160:force_original_aspect_ratio=increase", graph);
        Assert.Contains("zoompan=", graph);
        Assert.Contains(":s=1920x1080", graph);
        // Full frame: the overlay's own width and offsets no longer place it.
        Assert.DoesNotContain("scale=768", graph);
        Assert.Contains("overlay=x=(W-w)/2:y=(H-h)/2:enable='between(t,10,15)'", graph);
    }

    [Fact]
    public void A_look_without_a_move_is_graded_at_canvas_size()
    {
        var graph = Build(Picture(Settings("none", "noir", bars: true), ClipFit.Contain));

        Assert.DoesNotContain("zoompan", graph);
        Assert.Contains("pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x112233", graph);
        Assert.Contains("hue=s=0", graph);
        Assert.Contains("drawbox=", graph);
    }

    [Fact]
    public void Without_zoompan_the_move_is_dropped_but_the_grade_stays()
    {
        var graph = Build(Picture(Settings("pan-left", "warm")), RenderFeature.KenBurns);

        Assert.DoesNotContain("zoompan", graph);
        Assert.Contains("colorbalance=", graph);
    }

    [Fact]
    public void A_picture_without_a_shot_keeps_the_placed_overlay()
    {
        var graph = Build(Picture(null));

        Assert.DoesNotContain("zoompan", graph);
        Assert.Contains("scale=768:-2", graph);
        Assert.Contains("overlay=x=(W-w)/2+W*0.2:y=(H-h)/2+H*-0.3", graph);
    }
}
