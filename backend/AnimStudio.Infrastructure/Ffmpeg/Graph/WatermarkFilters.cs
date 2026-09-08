using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Draws the watermark: a line of text, or a logo image, pinned to an edge.
/// <para>
/// Every position is expressed relative to ffmpeg's own frame and mark variables rather
/// than as absolute pixels, so the same expression is correct whatever the text turns out
/// to measure or the logo turns out to be shaped. That matters more than it sounds: text
/// width depends on the font the server actually has, so a mark positioned by arithmetic
/// on an assumed width would drift off the edge on any machine with a different font.
/// </para>
/// </summary>
internal static class WatermarkFilters
{
    /// <summary>
    /// The plate behind text, as a fraction of font size. Enough to clear the glyphs
    /// without becoming a banner.
    /// </summary>
    private const double BoxBorderFraction = 0.3;

    /// <summary>
    /// Scales and fades the logo, ready to be overlaid.
    /// <para>
    /// <c>format=rgba</c> comes before the alpha adjustment on purpose: a logo saved as a
    /// palette or plain RGB PNG has no alpha plane at all, and <c>colorchannelmixer</c>
    /// would then have nothing to scale - the mark would composite as a solid rectangle.
    /// </para>
    /// </summary>
    public static string LogoChain(int inputIndex, string label, WatermarkPlan mark) =>
        $"[{inputIndex}:v]scale={FilterExpr.N(mark.MaxWidthPixels)}:{FilterExpr.N(mark.HeightPixels)}"
        + ":force_original_aspect_ratio=decrease:flags=lanczos,"
        + $"format=rgba,colorchannelmixer=aa={FilterExpr.N(mark.Opacity)},setsar=1[{label}];\n";

    public static string LogoOverlay(
        string baseLabel, string logoLabel, string outLabel, WatermarkPlan mark)
    {
        var (x, y) = OverlayPosition(mark.Position, mark.MarginPixels);

        // eof_action=repeat because the logo is a single frame and the clip is not: without
        // it the overlay - and therefore the whole output - would end after one frame.
        return $"[{baseLabel}][{logoLabel}]overlay=format=auto:eof_action=repeat"
             + $":x={x}:y={y}[{outLabel}];\n";
    }

    /// <summary>
    /// Draws the text mark.
    /// <para>
    /// The line itself is read from a file rather than embedded in the graph. A watermark is
    /// almost always a URL, and <c>:</c> <c>/</c> <c>%</c> and <c>\</c> are all syntax to
    /// drawtext's option parser - so passing the text inline means escaping it correctly
    /// through two nested parsers, every time, forever. <c>textfile</c> removes the problem
    /// instead of re-solving it.
    /// </para>
    /// <para>
    /// The font is ALWAYS passed as <c>fontfile=</c>. The <c>font=</c> spelling resolves a
    /// family through fontconfig, and on a build where fontconfig is compiled in but has
    /// no <c>fonts.conf</c> - which is every stock Windows ffmpeg - the lookup returns
    /// nothing and drawtext dereferences it. The process does not report a missing font, it
    /// takes an access violation: exit <c>0xC0000005</c> right after
    /// <c>Fontconfig error: Cannot load default config file</c>. So a mark with no font
    /// file is not drawn in a fallback family, it is not drawn at all - see
    /// <see cref="FfmpegFilterGraphBuilder.BuildClip"/>, which skips it with a warning.
    /// </para>
    /// </summary>
    /// <exception cref="ArgumentException">
    /// The mark has no font file. Throwing beats emitting the graph: this is the one input
    /// that kills the renderer instead of failing it.
    /// </exception>
    public static string DrawText(string baseLabel, string outLabel, WatermarkPlan mark)
    {
        ArgumentNullException.ThrowIfNull(mark);

        if (string.IsNullOrEmpty(mark.FontFilePath))
        {
            throw new ArgumentException(
                "A text watermark needs a font file: drawtext's font-by-name lookup crashes "
                + "ffmpeg builds that have no fontconfig configuration.", nameof(mark));
        }

        var size = mark.HeightPixels;
        var border = (int)Math.Round(size * BoxBorderFraction);

        // The plate grows outward from the text, so at a small margin it would hang off the
        // frame. Insetting by at least the border keeps the whole mark on screen.
        var inset = mark.BackplateOpacity > 0
            ? Math.Max(mark.MarginPixels, border)
            : mark.MarginPixels;

        var (x, y) = DrawTextPosition(mark.Position, inset);

        var parts = new List<string>
        {
            $"textfile={FilterExpr.Quote(FilterExpr.Path(mark.TextRelativePath!))}",
            $"fontfile={FilterExpr.Quote(FilterExpr.Path(mark.FontFilePath))}",
            // The file is written once per job and never changes; re-reading it every frame
            // would be thousands of pointless opens.
            "reload=0",
            $"fontsize={FilterExpr.N(size)}",
            $"fontcolor=0x{mark.ColorRgb}@{FilterExpr.N(mark.Opacity)}",
            $"x={x}",
            $"y={y}"
        };

        if (mark.BackplateOpacity > 0)
        {
            parts.Add("box=1");
            parts.Add($"boxcolor=0x000000@{FilterExpr.N(mark.BackplateOpacity)}");
            parts.Add($"boxborderw={FilterExpr.N(border)}");
        }
        else
        {
            // With no plate, white-on-white is a real outcome. A hard shadow costs nothing
            // and keeps the mark readable over a bright frame.
            var offset = Math.Max(1, size / 24);
            parts.Add("shadowcolor=0x000000@0.6");
            parts.Add($"shadowx={FilterExpr.N(offset)}");
            parts.Add($"shadowy={FilterExpr.N(offset)}");
        }

        return $"[{baseLabel}]drawtext={string.Join(':', parts)}[{outLabel}];\n";
    }

    /// <summary>
    /// Position for <c>overlay</c>, in its own variables: the mark is measured by ffmpeg,
    /// not by us.
    /// </summary>
    private static (string X, string Y) OverlayPosition(WatermarkPosition position, int margin)
    {
        var m = FilterExpr.N(margin);

        var x = position switch
        {
            WatermarkPosition.TopLeft or WatermarkPosition.BottomLeft => m,
            WatermarkPosition.TopCenter or WatermarkPosition.BottomCenter => "(main_w-overlay_w)/2",
            _ => $"main_w-overlay_w-{m}"
        };

        var y = position switch
        {
            WatermarkPosition.BottomLeft
                or WatermarkPosition.BottomCenter
                or WatermarkPosition.BottomRight => $"main_h-overlay_h-{m}",
            _ => m
        };

        return (x, y);
    }

    /// <summary>Position for <c>drawtext</c>, whose variables are named differently.</summary>
    private static (string X, string Y) DrawTextPosition(WatermarkPosition position, int margin)
    {
        var m = FilterExpr.N(margin);

        var x = position switch
        {
            WatermarkPosition.TopLeft or WatermarkPosition.BottomLeft => m,
            WatermarkPosition.TopCenter or WatermarkPosition.BottomCenter => "(w-text_w)/2",
            _ => $"w-text_w-{m}"
        };

        var y = position switch
        {
            WatermarkPosition.BottomLeft
                or WatermarkPosition.BottomCenter
                or WatermarkPosition.BottomRight => $"h-text_h-{m}",
            _ => m
        };

        return (x, y);
    }
}
