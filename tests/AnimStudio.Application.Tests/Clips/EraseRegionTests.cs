using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// Erasing a mark already burned into a clip: where it sits in the conform graph, and the
/// clamping that keeps a stored region from ever reaching ffmpeg outside the frame.
/// </summary>
public class EraseRegionTests
{
    private static ClipRenderPlan Plan(params EraseRegionSpec[] regions) => new()
    {
        ClipIndex = 0,
        SourceRelativePath = "in/vid_abc.mp4",
        Canvas = Canvas.Hd1080p30,
        OutputRelativePath = "clips/clip_001.mp4",
        ExpectedFrames = new FrameCount(300),
        SourceHasAudio = true,
        EraseRegions = regions
    };

    private static string Graph(ClipRenderPlan plan) =>
        new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildClip(plan).FilterComplex;

    // --- the graph ----------------------------------------------------------

    [Fact]
    public void Leaves_the_graph_untouched_when_there_is_nothing_to_erase()
    {
        var graph = Graph(Plan());

        Assert.StartsWith("[0:v]", graph);
        Assert.DoesNotContain("boxblur", graph);
        Assert.DoesNotContain("drawbox", graph);
    }

    [Fact]
    public void Erases_on_the_source_frame_before_crop_and_scale()
    {
        // The region is a patch of the FOOTAGE. Erasing after the fit would move it with
        // every framing change, and a cover fit could push it off the canvas entirely.
        var graph = Graph(Plan(new EraseRegionSpec { X = 80, Y = 0, Width = 20, Height = 10 }) with
        {
            CropLeft = 10
        });

        var blur = graph.IndexOf("boxblur", StringComparison.Ordinal);
        Assert.True(blur >= 0);
        Assert.StartsWith("[0:v]split=2", graph);
        Assert.True(blur < graph.IndexOf("crop=w='max(1", StringComparison.Ordinal));
        Assert.True(blur < graph.IndexOf("scale=1920:1080", StringComparison.Ordinal));
        Assert.Contains("[er0]crop=w='max(1", graph);
    }

    [Fact]
    public void Positions_every_region_relative_to_the_decoded_frame_not_in_pixels()
    {
        // A rotated phone clip's probed size is the wrong way round; a fraction of the
        // decoded frame is right however it was stored.
        var graph = Graph(Plan(new EraseRegionSpec { X = 70, Y = 5, Width = 25, Height = 10, Feather = 0 }));

        Assert.Contains("x='iw*0.7':y='ih*0.05'", graph);
        Assert.Contains("iw*0.25", graph);
        Assert.Contains("overlay=x='min(main_w*0.7,main_w-overlay_w)'", graph);
    }

    [Fact]
    public void Keeps_the_blur_radius_inside_boxblurs_limit_on_any_patch()
    {
        // boxblur rejects a radius of half the short side or more, and a floor of 1 breaks
        // a 2-pixel patch - the render then fails rather than merely missing a blur.
        var graph = Graph(Plan(new EraseRegionSpec { X = 99, Y = 99, Width = 1, Height = 1, Strength = 100 }));

        Assert.Contains("luma_radius='min(w,h)*0.4'", graph);
        Assert.Contains("chroma_radius='min(cw,ch)*0.4'", graph);
        Assert.Contains("min(iw,max(8,", graph);
    }

    [Fact]
    public void Fills_a_solid_region_with_the_requested_colour()
    {
        var graph = Graph(Plan(new EraseRegionSpec
        {
            X = 0, Y = 90, Width = 30, Height = 10, Style = EraseStyle.Fill, FillColor = "#1a2B3c"
        }));

        Assert.Contains("[0:v]drawbox=x='iw*0':y='ih*0.9':w='iw*0.3':h='ih*0.1':color=0x1a2B3c@1:t=fill[er0]", graph);
        Assert.Contains("[er0]scale=", graph);
    }

    [Fact]
    public void Chains_several_regions_and_draws_our_own_watermark_after_them()
    {
        var graph = Graph(Plan(
            new EraseRegionSpec { X = 0, Y = 0, Width = 10, Height = 10 },
            new EraseRegionSpec { X = 90, Y = 90, Width = 10, Height = 10, Style = EraseStyle.Fill }));

        Assert.Contains("[0:v]split=2[er0m][er0s]", graph);
        Assert.Contains("[er0]drawbox=", graph);
        Assert.Contains("[er1]", graph);
        Assert.DoesNotContain("[0:v]scale", graph);
    }

    [Fact]
    public void Fills_at_the_requested_density()
    {
        var graph = Graph(Plan(new EraseRegionSpec
        {
            X = 0, Y = 0, Width = 10, Height = 10, Style = EraseStyle.Fill, FillColor = "#ffffff", Opacity = 45
        }));

        Assert.Contains("color=0xffffff@0.45:t=fill", graph);
    }

    [Fact]
    public void Feathers_only_the_sides_that_have_room_to_fade()
    {
        // Against the right and bottom edges there is no margin; a ramp there would let
        // the mark show through instead of fading into footage.
        var graph = Graph(Plan(new EraseRegionSpec { X = 80, Y = 90, Width = 20, Height = 10, Feather = 50 }));

        Assert.Contains("geq=lum='lum(X,Y)'", graph);
        Assert.Contains("X/max(1,W*", graph);
        Assert.Contains("Y/max(1,H*", graph);
        Assert.DoesNotContain("(W-1-X)", graph);
        Assert.DoesNotContain("(H-1-Y)", graph);
        Assert.Contains(":format=auto[er0]", graph);
    }

    [Fact]
    public void Sharp_edges_need_no_alpha_pass()
    {
        var graph = Graph(Plan(new EraseRegionSpec { X = 40, Y = 40, Width = 10, Height = 10, Feather = 0 }));

        Assert.DoesNotContain("geq", graph);
    }

    [Theory]
    [InlineData(70, 80, EraseSource.Auto, 70, 70)]    // room above: copy from there
    [InlineData(70, 2, EraseSource.Auto, 70, 12)]     // top edge: copy from below
    [InlineData(70, 40, EraseSource.Left, 50, 40)]
    [InlineData(70, 40, EraseSource.Right, 80, 40)]   // clamped back inside the frame
    public void Patches_from_a_neighbouring_area_that_does_not_hold_the_mark(
        double x, double y, EraseSource source, double expectedX, double expectedY)
    {
        var r = new EraseRegionSpec { X = x, Y = y, Width = 20, Height = 10, Feather = 0, Source = source };

        var (px, py) = r.PatchOrigin();

        Assert.Equal(expectedX, px, 6);
        Assert.Equal(expectedY, py, 6);
    }

    private static WatermarkPlan LogoMark() => new()
    {
        Kind = WatermarkKind.Logo,
        Position = WatermarkPosition.TopRight,
        LogoRelativePath = "in/logo.png",
        HeightPixels = 60, MarginPixels = 40, MaxWidthPixels = 600,
        Opacity = 0.8, ColorRgb = "FFFFFF", BackplateOpacity = 0
    };

    [Fact]
    public void Replaces_the_mark_with_our_logo_fitted_inside_the_box()
    {
        var plan = Plan(new EraseRegionSpec { X = 70, Y = 80, Width = 20, Height = 10, Style = EraseStyle.Brand })
            with { Watermark = LogoMark() };

        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildClip(plan);

        Assert.Contains(result.Inputs, i => i.RelativePath == "in/logo.png");
        Assert.Contains("scale=w='rw*0.85':h='rh*0.85'", result.FilterComplex);
        Assert.Contains("overlay=x='main_w*0.7+(main_w*0.2-overlay_w)/2'", result.FilterComplex);
        Assert.DoesNotContain("ERASE_BRAND_UNAVAILABLE", result.Warnings);
    }

    [Fact]
    public void Still_patches_the_box_when_this_ffmpeg_cannot_size_the_logo()
    {
        var plan = Plan(new EraseRegionSpec { X = 70, Y = 80, Width = 20, Height = 10, Style = EraseStyle.Brand })
            with { Watermark = LogoMark() };

        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities(RenderFeature.ScaleToReference)).BuildClip(plan);

        Assert.DoesNotContain("rw*", result.FilterComplex);
        Assert.Contains("[er0m][er0b]overlay", result.FilterComplex);
        Assert.Contains("ERASE_BRAND_UNAVAILABLE", result.Warnings);
    }

    // --- normalization ------------------------------------------------------

    [Fact]
    public void Pulls_a_region_that_runs_off_the_frame_back_inside_it()
    {
        var r = new EraseRegionSpec { X = 90, Y = -5, Width = 40, Height = 200 }.Normalized()!;

        Assert.Equal(90, r.X);
        Assert.Equal(0, r.Y);
        Assert.Equal(10, r.Width);
        Assert.Equal(100, r.Height);
    }

    [Theory]
    [InlineData(10, 10, 0.5, 20)]
    [InlineData(10, 10, 20, 0)]
    [InlineData(double.NaN, 10, 20, 20)]
    public void Drops_or_repairs_a_region_too_small_or_malformed_to_mean_anything(
        double x, double y, double w, double h)
    {
        var r = new EraseRegionSpec { X = x, Y = y, Width = w, Height = h }.Normalized();

        if (double.IsNaN(x)) Assert.Equal(0, r!.X);
        else Assert.Null(r);
    }

    [Theory]
    [InlineData("red")]
    [InlineData("#12345")]
    [InlineData("#zzzzzz")]
    [InlineData("#000000:t=0,drawtext=text=x")]
    [InlineData(null)]
    public void Never_lets_anything_but_a_hex_colour_into_the_graph(string? color)
    {
        // The colour is interpolated into the filtergraph text, so this is the guard that
        // stands between a request body and ffmpeg's option parser.
        var r = new EraseRegionSpec { Style = EraseStyle.Fill, FillColor = color }.Normalized()!;

        Assert.Equal("#000000", r.FillColor);
    }

    [Fact]
    public void Falls_back_to_blur_for_a_style_it_does_not_know()
    {
        var r = new EraseRegionSpec { Style = (EraseStyle)42 }.Normalized()!;

        Assert.Equal(EraseStyle.Blur, r.Style);
    }
}
