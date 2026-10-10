using System.Text.RegularExpressions;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Timeline text overlays: the layout rules the preview mirrors, and the graph the export
/// draws them with. The layout is asserted as numbers because the studio's
/// <c>text-overlay-layout.ts</c> runs the same rules - a change here that is not made
/// there is a caption that wraps differently in the export than it did on screen.
/// </summary>
public class TextOverlayTests
{
    private static readonly Canvas Short = new(1080, 1920, FrameRate.Fps30);

    // --- style -------------------------------------------------------------

    [Fact]
    public void Reads_the_three_css_plates_older_clients_sent()
    {
        var none = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec { BackgroundColor = "transparent" });
        var dark = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec { BackgroundColor = "rgba(0,0,0,0.6)" });
        var black = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec { BackgroundColor = "#000000" });

        Assert.Equal(TextBoxStyle.None, none.Box);
        Assert.Equal((TextBoxStyle.Box, "000000", 0.6), (dark.Box, dark.BoxRgb, dark.BoxOpacity));
        Assert.Equal((TextBoxStyle.Box, "000000", 1.0), (black.Box, black.BoxRgb, black.BoxOpacity));
    }

    [Fact]
    public void Anything_that_is_not_a_hex_colour_falls_back_rather_than_reaching_the_graph()
    {
        // These strings are written into a filtergraph. A comma or colon in one would split
        // the filter chain, so nothing but six hex digits may come out of here.
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Color = "red,drawbox=x=0",
            BoxStyle = "band",
            BoxColor = "rgba(1,2,3,4)",
            OutlineColor = "#12345:",
            OutlineWidth = 3
        });

        Assert.Equal("ffffff", look.ColorRgb);
        Assert.Equal("000000", look.BoxRgb);
        Assert.Equal("000000", look.OutlineRgb);
    }

    [Fact]
    public void A_custom_position_is_held_inside_the_frame()
    {
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Position = "custom", X = 140, Y = -20
        });

        Assert.Equal((100d, 0d), (look.CenterX, look.CenterY));
    }

    [Fact]
    public void Named_positions_ignore_stale_coordinates()
    {
        // Dragging writes X/Y; clicking Top afterwards must win over them.
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Position = "top", X = 10, Y = 90
        });

        Assert.Equal((50d, TextOverlayLayout.TopY), (look.CenterX, look.CenterY));
    }

    // --- wrapping ----------------------------------------------------------

    [Fact]
    public void Wraps_at_word_boundaries_to_the_width_of_the_frame()
    {
        // 9:16 at size 28: floor(0.9 * 360 / (0.6 * 28)) = 19 characters a line.
        Assert.Equal(19, TextOverlayLayout.MaxCharsPerLine(28, 1080, 1920));

        var lines = TextOverlayLayout.Wrap("Wait for the ending, it is worth it", 28, 1080, 1920);

        Assert.Equal(["Wait for the", "ending, it is worth", "it"], lines);
    }

    [Fact]
    public void A_wide_frame_fits_more_on_a_line_than_a_tall_one()
    {
        Assert.True(TextOverlayLayout.MaxCharsPerLine(28, 1920, 1080)
                    > TextOverlayLayout.MaxCharsPerLine(28, 1080, 1920));
    }

    [Fact]
    public void Keeps_explicit_line_breaks_and_inner_blank_lines_but_trims_the_ends()
    {
        var lines = TextOverlayLayout.Wrap("\n\nPART 1\n\nThe beginning\n\n", 28, 1080, 1920);

        Assert.Equal(["PART 1", "", "The beginning"], lines);
    }

    [Fact]
    public void Splits_a_word_too_long_for_any_line()
    {
        var limit = TextOverlayLayout.MaxCharsPerLine(28, 1080, 1920);
        var word = new string('x', limit * 2 + 3);

        var lines = TextOverlayLayout.Wrap(word, 28, 1080, 1920);

        Assert.Equal([limit, limit, 3], lines.Select(l => l.Length));
    }

    [Fact]
    public void Drops_lines_past_the_ceiling()
    {
        var text = string.Join('\n', Enumerable.Range(1, 20).Select(i => $"line {i}"));

        Assert.Equal(TextOverlayLayout.MaxLines, TextOverlayLayout.Wrap(text, 28, 1080, 1920).Count);
    }

    // --- graph -------------------------------------------------------------

    private static FfmpegFilterGraphBuilder NewBuilder() => new(new FakeCapabilities());

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

    private static MergeOverlayItem Text(
        TimelineItemTextStyleSpec style, string? transitionIn = "fade", string? transitionOut = "fade",
        params string?[] lines) =>
        new("text", null, 1, 4, 1, 0, 0, 1, transitionIn, 0.5, transitionOut, 0.5)
        {
            Text = new MergeTextOverlay(
                lines.Length > 0 ? lines : ["txt/overlay_000_0.txt"],
                "C:/Windows/Fonts/arialbd.ttf",
                TextOverlayLayout.Resolve(style))
        };

    [Fact]
    public void Draws_each_line_from_its_file_with_an_explicit_font()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec(),
            lines: ["txt/overlay_000_0.txt", "txt/overlay_000_1.txt"]))).FilterComplex;

        Assert.Equal(2, Regex.Matches(graph, "drawtext=").Count);
        Assert.Contains(@"textfile='txt/overlay_000_0.txt'", graph);
        Assert.Contains(@"textfile='txt/overlay_000_1.txt'", graph);
        Assert.Contains(@"fontfile='C\:/Windows/Fonts/arialbd.ttf'", graph);
        Assert.Contains("expansion=none", graph);
        Assert.DoesNotContain("text='", graph);
    }

    [Fact]
    public void Every_filter_output_label_is_defined_once_and_the_chain_reaches_the_output()
    {
        // The bug this replaces emitted each overlay's filter twice under the same labels,
        // which ffmpeg refuses outright - every export with a text overlay failed.
        var graph = NewBuilder().BuildMerge(Plan(
            Text(new TimelineItemTextStyleSpec { BoxStyle = "band" }),
            Text(new TimelineItemTextStyleSpec { Position = "top" }, lines: ["a.txt", null, "b.txt"]))).FilterComplex;

        var outputs = Regex.Matches(graph, @"\[([A-Za-z0-9_]+)\];").Select(m => m.Groups[1].Value).ToList();
        Assert.Equal(outputs.Count, outputs.Distinct().Count());

        var last = Regex.Matches(graph, @"\[(v_ov_[0-9_]+)\];").Select(m => m.Groups[1].Value).Last();
        Assert.Contains($"[{last}]format=", graph);
    }

    [Fact]
    public void A_blank_line_keeps_its_slot_but_draws_nothing()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec(),
            lines: ["a.txt", null, "b.txt"]))).FilterComplex;

        Assert.Equal(2, Regex.Matches(graph, "drawtext=").Count);
    }

    [Fact]
    public void Sizes_text_against_the_canvas_not_the_preview()
    {
        // 28 on the 360px monitor is 84 on a 1080-wide Short: the same share of the frame.
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec { FontSize = 28 })))
            .FilterComplex;

        Assert.Contains("fontsize=84", graph);
    }

    [Fact]
    public void A_band_is_a_full_width_strip_drawn_before_the_text()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec
        {
            BoxStyle = "band", BoxColor = "#ff0055", BoxOpacity = 1
        }, "none", "none"))).FilterComplex;

        var band = graph.IndexOf("drawbox=x=0:", StringComparison.Ordinal);
        Assert.True(band >= 0, "no strip drawn");
        Assert.True(band < graph.IndexOf("drawtext=", StringComparison.Ordinal));
        Assert.Contains(":w=iw:", graph);
        Assert.Contains("color=0xff0055@1:t=fill", graph);
        Assert.DoesNotContain("box=1", graph);
    }

    [Fact]
    public void A_band_that_fades_or_slides_is_a_moving_colour_source_under_its_text()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec
        {
            BoxStyle = "band", BoxColor = "#ff0055", BoxOpacity = 1
        }, "slide-right", "fade"))).FilterComplex;

        // drawbox can neither move nor fade, so it is not used at all.
        Assert.DoesNotContain("drawbox", graph);
        var band = graph.IndexOf("color=c=0xff0055@1:s=1080x", StringComparison.Ordinal);
        Assert.True(band >= 0, "no strip drawn");
        Assert.True(band < graph.IndexOf("drawtext=", StringComparison.Ordinal));
        Assert.Contains("fade=t=in:st=1:d=0.5:alpha=1", graph);
        Assert.Contains("fade=t=out:st=4.5:d=0.5:alpha=1", graph);
        // Comes in from the left, by the quarter-frame the text travels too.
        Assert.Contains("overlay=x='0-W*0.25*(1-(1-pow(1-clip((t-1)/0.5\\,0\\,1)\\,3)))'", graph);
        Assert.Contains("-w*0.25*(1-(1-pow(", graph);
    }

    [Fact]
    public void A_line_with_runs_draws_each_run_in_its_own_face_on_one_baseline_under_one_plate()
    {
        var item = Text(new TimelineItemTextStyleSpec { BoxStyle = "box", BoxColor = "#112233", BoxOpacity = 0.5 },
            "none", "none");
        item = item with
        {
            Text = item.Text! with
            {
                LineRuns =
                [
                    new MergeTextLineRuns(
                    [
                        new MergeTextRun("txt/overlay_000_0_r0.txt", "C:/Windows/Fonts/Nirmala.ttc", 0),
                        new MergeTextRun("txt/overlay_000_0_r1.txt", "C:/Windows/Fonts/seguiemj.ttf", 4.5)
                    ], 5.75, 1.0, 0.3)
                ]
            }
        };

        var graph = NewBuilder().BuildMerge(Plan(item)).FilterComplex;

        Assert.Equal(2, Regex.Matches(graph, "drawtext=").Count);
        Assert.Contains(@"textfile='txt/overlay_000_0_r0.txt':fontfile='C\:/Windows/Fonts/Nirmala.ttc'", graph);
        Assert.Contains(@"textfile='txt/overlay_000_0_r1.txt':fontfile='C\:/Windows/Fonts/seguiemj.ttf'", graph);
        Assert.DoesNotContain("overlay_000_0.txt", graph);

        // Both runs share one baseline expression; neither draws a plate of its own.
        var ys = Regex.Matches(graph, @"y='([0-9.]+)-max_glyph_a'").Select(m => m.Groups[1].Value).ToList();
        Assert.Equal(2, ys.Count);
        Assert.Single(ys.Distinct());
        Assert.DoesNotContain("box=1", graph);
        Assert.Single(Regex.Matches(graph, "drawbox=").Cast<Match>());

        // The emoji starts 4.5em to the right of the text run.
        var xs = Regex.Matches(graph, @"drawtext=[^\[]*?:x='([0-9.]+)'").Select(m => double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture)).ToList();
        var size = int.Parse(Regex.Match(graph, "fontsize=([0-9]+)").Groups[1].Value);
        Assert.Equal(4.5 * size, xs[1] - xs[0], 0.2);
    }

    [Fact]
    public void A_box_plate_outline_and_shadow_are_drawtext_options()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec
        {
            BoxStyle = "box", BoxColor = "#112233", BoxOpacity = 0.5,
            OutlineColor = "#000000", OutlineWidth = 2, Shadow = true
        }))).FilterComplex;

        Assert.Contains("box=1:boxcolor=0x112233@0.5", graph);
        Assert.Contains("borderw=6:bordercolor=0x000000", graph);
        Assert.Contains("shadowcolor=0x000000@0.7", graph);
    }

    [Fact]
    public void A_cut_has_no_alpha_and_a_slide_moves_the_line()
    {
        var cut = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec(), "none", "none")))
            .FilterComplex;
        var slide = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec(), "slide-up", "none")))
            .FilterComplex;

        Assert.DoesNotContain("alpha=", cut);
        Assert.Contains("alpha=", slide);

        // 40 on the 360 reference is 120 on a 1080-wide frame.
        Assert.Contains(@"+120*(1-(1-pow(1-clip((t-1)/0.5\,0\,1)\,3)))", slide);
    }

    [Fact]
    public void Shows_only_between_its_start_and_end()
    {
        var graph = NewBuilder().BuildMerge(Plan(Text(new TimelineItemTextStyleSpec()))).FilterComplex;

        Assert.Contains(@"enable='between(t\,1\,5)'", graph);
    }
}
