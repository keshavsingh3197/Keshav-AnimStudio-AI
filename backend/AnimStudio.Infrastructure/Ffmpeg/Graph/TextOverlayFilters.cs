using System.Text;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Draws a timeline text overlay onto the joined video: a strip or plates if the style has
/// one, then each line in its own drawtext.
/// <para>
/// The vertical layout is plain arithmetic on the canvas - lines at a fixed pitch around
/// the style's centre - because it has to match the studio preview, which lays the same
/// lines out the same way (see <see cref="TextOverlayLayout"/>). Only the horizontal
/// centring is left to drawtext's own <c>text_w</c>, since how wide a line is depends on
/// the font this server actually has.
/// </para>
/// <para>
/// Fades and slides use the preview's easing - a cubic ease-out in, a quadratic ease out -
/// so an overlay arrives and leaves on the same frames in both. Zoom has no drawtext
/// equivalent and renders as the fade it is paired with. A full-width strip that moves or
/// fades is drawn as an overlaid colour source, since drawbox can do neither.
/// </para>
/// </summary>
internal static class TextOverlayFilters
{
    /// <summary>Plate margin around each line, as a share of the font size.</summary>
    private const double BoxPadding = 0.2;

    /// <summary>Strip margin above and below the block, as a share of the font size.</summary>
    private const double BandPadding = 0.35;

    /// <summary>How far a slide travels, in 360-reference pixels - the preview's 40px.</summary>
    private const double SlideDistance = 40;

    /// <summary>Appends the overlay to <paramref name="graph"/> and returns the label it ends on.</summary>
    public static string Append(
        StringBuilder graph, string input, string labelPrefix,
        MergeOverlayItem overlay, MergeTextOverlay text, Canvas canvas)
    {
        var look = text.Look;
        var scale = TextOverlayLayout.Scale(canvas.Width, canvas.Height);
        var size = Math.Max(1, (int)Math.Round(look.FontSize * scale));
        var pitch = (int)Math.Round(size * TextOverlayLayout.LineHeight);
        var lines = text.LineRelativePaths.Count;
        var blockHeight = lines * pitch;

        var bandPad = look.Box == TextBoxStyle.Band ? (int)Math.Round(size * BandPadding) : 0;
        var boxPad = look.Box == TextBoxStyle.Box ? (int)Math.Round(size * BoxPadding) : 0;
        var border = look.OutlineWidth > 0 ? Math.Max(1, (int)Math.Round(look.OutlineWidth * scale)) : 0;

        // Held inside the frame: a block centred near an edge would otherwise hang off it.
        var centreY = look.CenterY / 100 * canvas.Height;
        var top = (int)Math.Round(Math.Clamp(
            centreY - blockHeight / 2.0, bandPad, Math.Max(bandPad, canvas.Height - blockHeight - bandPad)));

        var start = overlay.StartSeconds;
        var end = overlay.StartSeconds + overlay.DurationSeconds;
        var enable = FilterExpr.Quote($"between(t,{FilterExpr.N(start)},{FilterExpr.N(end)})");
        var (alpha, slide, slideX) = Motion(overlay, start, end, SlideDistance * scale);

        var current = input;
        var step = 0;

        if (look.Box == TextBoxStyle.Band && look.BoxOpacity > 0 && (alpha is not null || slide.Length > 0 || slideX.Length > 0))
        {
            // drawbox cannot move or fade, so a moving strip is a colour source laid over
            // the frame, travelling with its text. Its fade is ffmpeg's linear one - close
            // enough to the text's ease that the two read as one block.
            var bandLabel = $"{labelPrefix}_band";
            var bandHeight = blockHeight + 2 * bandPad;
            var fades = new StringBuilder();
            var inKind = Normalize(overlay.TransitionIn);
            var outKind = Normalize(overlay.TransitionOut);
            if (inKind != "none" && overlay.TransitionInDuration > 0)
            {
                fades.Append($",fade=t=in:st={FilterExpr.N(start)}:d={FilterExpr.N(overlay.TransitionInDuration)}:alpha=1");
            }
            if (outKind != "none" && overlay.TransitionOutDuration > 0)
            {
                var outStart = start + Math.Max(0, overlay.DurationSeconds - overlay.TransitionOutDuration);
                fades.Append($",fade=t=out:st={FilterExpr.N(outStart)}:d={FilterExpr.N(overlay.TransitionOutDuration)}:alpha=1");
            }

            graph.Append($"color=c=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}")
                 .Append($":s={canvas.Width}x{Math.Max(2, bandHeight)}:r={canvas.FrameRate.ToFfmpegRate()}:d={FilterExpr.N(end)}")
                 .Append($",format=rgba{fades}[{bandLabel}];\n");

            var bx = slideX.Length > 0 ? FilterExpr.Quote("0" + slideX.Replace("{W}", "W")) : "0";
            var by = slide.Length > 0 ? FilterExpr.Quote(FilterExpr.N(top - bandPad) + slide) : FilterExpr.N(top - bandPad);
            var next = $"{labelPrefix}_{step++}";
            graph.Append($"[{current}][{bandLabel}]overlay=x={bx}:y={by}:enable={enable}[{next}];\n");
            current = next;
        }
        else if (look.Box == TextBoxStyle.Band && look.BoxOpacity > 0)
        {
            var next = $"{labelPrefix}_{step++}";
            graph.Append($"[{current}]drawbox=x=0:y={FilterExpr.N(top - bandPad)}")
                 .Append($":w=iw:h={FilterExpr.N(blockHeight + 2 * bandPad)}")
                 .Append($":color=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}:t=fill")
                 .Append($":enable={enable}[{next}];\n");
            current = next;
        }

        var edge = Math.Max(boxPad, border) + 2;
        var centreX = FilterExpr.N(look.CenterX / 100 * canvas.Width);
        // A sideways slide is added OUTSIDE the clamp, or the clamp would hold the text still.
        var x = FilterExpr.Quote($"max({edge},min(w-text_w-{edge},{centreX}-text_w/2)){slideX.Replace("{W}", "w")}");

        for (var i = 0; i < lines; i++)
        {
            // A blank line is spacing; it holds its slot but draws nothing - an empty
            // drawtext with a plate would leave a sliver of box behind.
            if (text.LineRelativePaths[i] is not { } path) continue;

            var lineTop = top + i * pitch;
            var y = FilterExpr.Quote($"{FilterExpr.N(lineTop)}+({FilterExpr.N(pitch)}-text_h)/2{slide}");

            var parts = new List<string>
            {
                $"textfile={FilterExpr.Quote(FilterExpr.Path(path))}",
                $"fontfile={FilterExpr.Quote(FilterExpr.Path(text.FontFilePath))}",
                "reload=0",
                // A caption is shown, not interpreted: %{pts} in it is text, not a timestamp.
                "expansion=none",
                $"fontsize={FilterExpr.N(size)}",
                $"fontcolor=0x{look.ColorRgb}",
                $"x={x}",
                $"y={y}"
            };

            if (look.Box == TextBoxStyle.Box && look.BoxOpacity > 0)
            {
                parts.Add("box=1");
                parts.Add($"boxcolor=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}");
                parts.Add($"boxborderw={FilterExpr.N(boxPad)}");
            }

            if (border > 0)
            {
                parts.Add($"borderw={FilterExpr.N(border)}");
                parts.Add($"bordercolor=0x{look.OutlineRgb}");
            }

            if (look.Shadow)
            {
                var offset = Math.Max(1, (int)Math.Round(size / 16.0));
                parts.Add("shadowcolor=0x000000@0.7");
                parts.Add($"shadowx={FilterExpr.N(offset)}");
                parts.Add($"shadowy={FilterExpr.N(offset)}");
            }

            if (alpha is not null) parts.Add($"alpha={FilterExpr.Quote(alpha)}");
            parts.Add($"enable={enable}");

            var next = $"{labelPrefix}_{step++}";
            graph.Append($"[{current}]drawtext={string.Join(':', parts)}[{next}];\n");
            current = next;
        }

        return current;
    }

    /// <summary>
    /// The opacity expression (null when the overlay simply cuts in and out) and the
    /// vertical offset to append to each line's y (empty when nothing slides), and the
    /// sideways offset for x, written against <c>{W}</c> - the frame width, which drawtext
    /// calls <c>w</c> and overlay <c>W</c>.
    /// </summary>
    private static (string? Alpha, string Slide, string SlideX) Motion(
        MergeOverlayItem overlay, double start, double end, double distance)
    {
        var inKind = Normalize(overlay.TransitionIn);
        var outKind = Normalize(overlay.TransitionOut);
        var inSeconds = overlay.TransitionInDuration > 0 ? overlay.TransitionInDuration : 0.5;
        var outSeconds = overlay.TransitionOutDuration > 0 ? overlay.TransitionOutDuration : 0.5;

        // Eased progress: 0 -> 1 across the entrance, 1 -> 0 across the exit, 1 between.
        var easeIn = $"(1-pow(1-clip((t-{FilterExpr.N(start)})/{FilterExpr.N(inSeconds)},0,1),3))";
        var easeOut = $"pow(clip(({FilterExpr.N(end)}-t)/{FilterExpr.N(outSeconds)},0,1),2)";

        string? alpha = (inKind, outKind) switch
        {
            ("none", "none") => null,
            (_, "none") => easeIn,
            ("none", _) => easeOut,
            _ => $"min({easeIn},{easeOut})"
        };

        var d = FilterExpr.N(Math.Round(distance, 2));
        var slide = new StringBuilder();
        if (inKind == "slide-up") slide.Append($"+{d}*(1-{easeIn})");
        else if (inKind == "slide-down") slide.Append($"-{d}*(1-{easeIn})");
        if (outKind == "slide-up") slide.Append($"-{d}*(1-{easeOut})");
        else if (outKind == "slide-down") slide.Append($"+{d}*(1-{easeOut})");

        // Sideways: a quarter of the frame, the same travel an image's slide has.
        var s = FilterExpr.N(MediaOverlayShape.SlideShare);
        var slideX = new StringBuilder();
        if (inKind == "slide-left") slideX.Append($"+{{W}}*{s}*(1-{easeIn})");
        else if (inKind == "slide-right") slideX.Append($"-{{W}}*{s}*(1-{easeIn})");
        if (outKind == "slide-left") slideX.Append($"-{{W}}*{s}*(1-{easeOut})");
        else if (outKind == "slide-right") slideX.Append($"+{{W}}*{s}*(1-{easeOut})");

        return (alpha, slide.ToString(), slideX.ToString());
    }

    private static string Normalize(string? kind) =>
        string.IsNullOrWhiteSpace(kind) ? "none" : kind.Trim().ToLowerInvariant();
}
