using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>A green-screen effect keyed out of a video overlay with ffmpeg's colorkey.</summary>
public sealed class ChromaKeyOverlayTests
{
    private static readonly Canvas Wide = new(1920, 1080, FrameRate.Fps30);

    [Fact]
    public void A_key_is_validated_and_clamped_before_it_reaches_ffmpeg()
    {
        var key = OverlayChromaKey.From(new ChromaKeySpec { Color = "#00b140", Similarity = 5, Blend = -1 });

        Assert.Equal(new OverlayChromaKey("00B140", 1, 0), key);
        Assert.Equal("colorkey=0x00B140:1:0", key!.Filter());

        Assert.Null(OverlayChromaKey.From(null));
        Assert.Null(OverlayChromaKey.From(new ChromaKeySpec { Enabled = false }));
        Assert.Null(OverlayChromaKey.From(new ChromaKeySpec { Color = "green:1;drawtext" }));
        Assert.Equal("colorkey=0x00FF00:0.3:0.1", OverlayChromaKey.From(new ChromaKeySpec { Color = null })!.Filter());
    }

    [Fact]
    public void A_keyed_video_overlay_is_keyed_after_its_crop_and_before_it_is_scaled()
    {
        var media = new MergeMediaOverlay(10, 0, 10, 0, OverlayShape.Rect, 0, "FFFFFF", null, 0,
            OverlayChromaKey.From(new ChromaKeySpec()));
        var overlay = new MergeOverlayItem("video", "in/green.mp4", 1, 4, 1, 0, 0, 1, "none", 0.5, "none", 0.5)
        {
            WidthPercent = 100,
            Media = media
        };

        var graph = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildMerge(new MergePlan
        {
            Canvas = Wide,
            Scenes = [new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300), TransitionSettings.None)],
            Overlays = [overlay],
            OutputRelativePath = "out/final.mp4"
        }).FilterComplex;

        var crop = graph.IndexOf("crop=", StringComparison.Ordinal);
        var key = graph.IndexOf("colorkey=0x00FF00:0.3:0.1", StringComparison.Ordinal);
        var scale = graph.IndexOf("scale=1920:-2", StringComparison.Ordinal);

        Assert.True(crop >= 0 && key > crop && scale > key, graph);
    }
}
