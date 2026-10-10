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
        var reveal = Reveal(overlay, text, start);

        var current = input;
        var step = 0;

        var moving = alpha is not null || slide.Length > 0 || slideX.Length > 0;

        if (look.Box == TextBoxStyle.Band && look.BoxOpacity > 0)
        {
            current = AppendRect(graph, current, $"{labelPrefix}_{step++}", look, overlay, start, end, enable,
                0, top - bandPad, canvas.Width, blockHeight + 2 * bandPad, moving, slide, slideX, canvas);
        }

        var edge = Math.Max(boxPad, border) + 2;
        var centreXPx = look.CenterX / 100 * canvas.Width;
        var centreX = FilterExpr.N(centreXPx);
        // A sideways slide is added OUTSIDE the clamp, or the clamp would hold the text still.
        var x = FilterExpr.Quote($"max({edge},min(w-text_w-{edge},{centreX}-text_w/2)){slideX.Replace("{W}", "w")}");

        for (var i = 0; i < lines; i++)
        {
            // A blank line is spacing; it holds its slot but draws nothing - an empty
            // drawtext with a plate would leave a sliver of box behind.
            if (text.LineRelativePaths[i] is not { } path) continue;
            var runs = text.LineRuns is { } allRuns && i < allRuns.Count ? allRuns[i] : null;

            var lineTop = top + i * pitch;

            // A typed entrance keeps the frame as it was before this line, to cover the
            // part of the line not typed yet.
            var window = reveal?.Line(i);
            var drawInput = current;
            string? before = null;
            if (window is not null)
            {
                before = $"{labelPrefix}_pre{i}";
                drawInput = $"{labelPrefix}_in{i}";
                graph.Append($"[{current}]split=2[{drawInput}][{before}];\n");
            }
            current = drawInput;

            if (runs is null)
            {
                var y = FilterExpr.Quote($"{FilterExpr.N(lineTop)}+({FilterExpr.N(pitch)}-text_h)/2{slide}");
                var parts = DrawParts(path, text.FontFilePath, size, look, x, y, alpha, enable, border,
                    look.Box == TextBoxStyle.Box && look.BoxOpacity > 0 ? boxPad : null);

                var next = $"{labelPrefix}_{step++}";
                graph.Append($"[{current}]drawtext={string.Join(':', parts)}[{next}];\n");
                current = next;
            }
            else
            {
                // Each run is measured only by drawtext itself, so the line is laid out here
                // from the measured widths: centred and held inside the frame as a whole, every
                // run's baseline on one line - y minus max_glyph_a is where drawtext puts it.
                var width = runs.WidthEm * size;
                var left = Math.Clamp(centreXPx - width / 2, edge, Math.Max(edge, canvas.Width - width - edge));
                var ascent = runs.AscentEm * size;
                var descent = runs.DescentEm * size;
                var baseline = lineTop + pitch / 2.0 + (ascent - descent) / 2;

                if (look.Box == TextBoxStyle.Box && look.BoxOpacity > 0)
                {
                    // One plate for the whole line: per-run plates would differ in height by face.
                    current = AppendRect(graph, current, $"{labelPrefix}_{step++}", look, overlay, start, end, enable,
                        left - boxPad, baseline - ascent - boxPad, width + 2 * boxPad, ascent + descent + 2 * boxPad,
                        moving, slide, slideX, canvas);
                }

                var y = FilterExpr.Quote($"{FilterExpr.N(Math.Round(baseline, 1))}-max_glyph_a{slide}");
                foreach (var run in runs.Runs)
                {
                    var rx = FilterExpr.Quote($"{FilterExpr.N(Math.Round(left + run.OffsetEm * size, 1))}{slideX.Replace("{W}", "w")}");
                    var parts = DrawParts(run.RelativePath, run.FontFilePath, size, look, rx, y, alpha, enable, border, null);

                    var next = $"{labelPrefix}_{step++}";
                    graph.Append($"[{current}]drawtext={string.Join(':', parts)}[{next}];\n");
                    current = next;
                }
            }

            if (window is { } wd)
            {
                var shadowPx = look.Shadow ? Math.Max(1, (int)Math.Round(size / 16.0)) : 0;
                var margin = Math.Max(boxPad, border) + shadowPx + 4;
                current = AppendRevealCover(
                    graph, current, before!, $"{labelPrefix}_{step++}", wd, reveal!,
                    lineTop, pitch, margin, size, edge, look.CenterX / 100 * canvas.Width, canvas);
            }
        }

        return current;
    }

    /// <summary>One drawtext's options; <paramref name="boxPad"/> non-null puts a plate behind the text.</summary>
    private static List<string> DrawParts(
        string textPath, string fontPath, int size, TextOverlayLook look, string x, string y,
        string? alpha, string enable, int border, int? boxPad)
    {
        var parts = new List<string>
        {
            $"textfile={FilterExpr.Quote(FilterExpr.Path(textPath))}",
            $"fontfile={FilterExpr.Quote(FilterExpr.Path(fontPath))}",
            "reload=0",
            // A caption is shown, not interpreted: %{pts} in it is text, not a timestamp.
            "expansion=none",
            $"fontsize={FilterExpr.N(size)}",
            $"fontcolor=0x{look.ColorRgb}",
            $"x={x}",
            $"y={y}"
        };

        if (boxPad is { } pad)
        {
            parts.Add("box=1");
            parts.Add($"boxcolor=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}");
            parts.Add($"boxborderw={FilterExpr.N(pad)}");
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
        return parts;
    }

    /// <summary>
    /// A filled rectangle in the box colour - the band's strip, or a run-drawn line's plate.
    /// Still, it is a drawbox. drawbox cannot move or fade, so a moving one is a colour
    /// source laid over the frame, travelling with its text; its fade is ffmpeg's linear
    /// one - close enough to the text's ease that the two read as one block.
    /// </summary>
    private static string AppendRect(
        StringBuilder graph, string current, string next, TextOverlayLook look, MergeOverlayItem overlay,
        double start, double end, string enable, double x, double y, double w, double h,
        bool moving, string slide, string slideX, Canvas canvas)
    {
        var rx = (int)Math.Round(x);
        var ry = (int)Math.Round(y);
        var rw = Math.Max(2, (int)Math.Round(w));
        var rh = Math.Max(2, (int)Math.Round(h));

        if (!moving)
        {
            graph.Append($"[{current}]drawbox=x={FilterExpr.N(rx)}:y={FilterExpr.N(ry)}")
                 .Append($":w={(rx == 0 && rw == canvas.Width ? "iw" : FilterExpr.N(rw))}:h={FilterExpr.N(rh)}")
                 .Append($":color=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}:t=fill")
                 .Append($":enable={enable}[{next}];\n");
            return next;
        }

        var fades = new StringBuilder();
        var inKind = Normalize(overlay.TransitionIn);
        var outKind = Normalize(overlay.TransitionOut);
        if (inKind != "none" && !IsReveal(inKind) && overlay.TransitionInDuration > 0)
        {
            fades.Append($",fade=t=in:st={FilterExpr.N(start)}:d={FilterExpr.N(overlay.TransitionInDuration)}:alpha=1");
        }
        if (outKind != "none" && overlay.TransitionOutDuration > 0)
        {
            var outStart = start + Math.Max(0, overlay.DurationSeconds - overlay.TransitionOutDuration);
            fades.Append($",fade=t=out:st={FilterExpr.N(outStart)}:d={FilterExpr.N(overlay.TransitionOutDuration)}:alpha=1");
        }

        var source = $"{next}_rect";
        graph.Append($"color=c=0x{look.BoxRgb}@{FilterExpr.N(look.BoxOpacity)}")
             .Append($":s={rw}x{rh}:r={canvas.FrameRate.ToFfmpegRate()}:d={FilterExpr.N(end)}")
             .Append($",format=rgba{fades}[{source}];\n");

        var ox = slideX.Length > 0 ? FilterExpr.Quote(FilterExpr.N(rx) + slideX.Replace("{W}", "W")) : FilterExpr.N(rx);
        var oy = slide.Length > 0 ? FilterExpr.Quote(FilterExpr.N(ry) + slide) : FilterExpr.N(ry);
        graph.Append($"[{current}][{source}]overlay=x={ox}:y={oy}:enable={enable}[{next}];\n");
        return next;
    }

    /// <summary>Entrances that type a line out rather than move or fade it.</summary>
    private static bool IsReveal(string kind) => kind is "typewriter" or "wipe";

    /// <summary>
    /// A typed (or wiped) entrance: when each line starts and how long it takes, shared out
    /// by each line's length so the whole block types at one even speed.
    /// </summary>
    private sealed record RevealPlan(double Start, double End, bool Stepped, IReadOnlyList<(double Start, double Seconds, int Chars)?> Lines)
    {
        public (double Start, double Seconds, int Chars)? Line(int i) => i < Lines.Count ? Lines[i] : null;
    }

    private static RevealPlan? Reveal(MergeOverlayItem overlay, MergeTextOverlay text, double start)
    {
        var kind = Normalize(overlay.TransitionIn);
        if (!IsReveal(kind)) return null;

        // Never longer than most of the time the text is on screen, so it is read whole.
        var total = Math.Clamp(overlay.TransitionInDuration > 0 ? overlay.TransitionInDuration : 1,
            0.1, Math.Max(0.1, overlay.DurationSeconds * 0.9));

        var count = text.LineRelativePaths.Count;
        var chars = Enumerable.Range(0, count)
            .Select(i => text.LineRelativePaths[i] is null ? 0
                : Math.Max(1, text.LineLengths is { } l && i < l.Count ? l[i] : 1))
            .ToList();
        var sum = Math.Max(1, chars.Sum());

        var lines = new List<(double, double, int)?>(count);
        var done = 0;
        foreach (var c in chars)
        {
            lines.Add(c == 0 ? null : (start + total * done / sum, total * c / sum, c));
            done += c;
        }

        return new RevealPlan(start, start + total, kind == "typewriter" && text.LineLengths is not null, lines);
    }

    /// <summary>
    /// Lays the frame from before the line over the part of the line not typed yet: a strip
    /// of it, padded to twice the width with clear pixels, cut at the reveal point and
    /// overlaid there - so what is to the right of the point is the untouched picture, and
    /// the drawn line shows only to its left. The point moves a character's width at a time
    /// for a typewriter, smoothly for a wipe. drawtext cannot draw part of a line, and
    /// drawing a growing prefix would shift a centred line on every keystroke.
    /// <para>
    /// The line's width is estimated - nothing is measured before drawing - so the sweep
    /// runs a little past both ends of it; the frames before and after are untouched.
    /// </para>
    /// </summary>
    private static string AppendRevealCover(
        StringBuilder graph, string drawn, string before, string next,
        (double Start, double Seconds, int Chars) line, RevealPlan plan,
        int lineTop, int pitch, int margin, int size, int edge, double centreX, Canvas canvas)
    {
        var estimate = Math.Min(canvas.Width - 2.0 * edge, line.Chars * RevealCharWidth * size);
        var left = Math.Clamp(centreX - estimate / 2, edge, Math.Max(edge, canvas.Width - estimate - edge)) - margin;
        var right = left + estimate + 2 * margin;
        left = Math.Max(0, left);
        right = Math.Min(canvas.Width, right);

        // Even, so a 4:2:0 frame's crop and overlay round to the same row.
        var y0 = Math.Max(0, (lineTop - margin) & ~1);
        var h = Math.Min(canvas.Height - y0, (pitch + 2 * margin + 1) & ~1);
        if (h < 2 || right - left < 2) return drawn;

        var p = $"clip((t-{FilterExpr.N(line.Start)})/{FilterExpr.N(Math.Max(0.01, line.Seconds))},0,1)";
        var progress = plan.Stepped ? $"floor({p}*{line.Chars})/{line.Chars}" : p;
        var at = FilterExpr.Quote($"{FilterExpr.N(Math.Round(left, 1))}+{FilterExpr.N(Math.Round(right - left, 1))}*{progress}");
        var window = FilterExpr.Quote($"between(t,{FilterExpr.N(plan.Start)},{FilterExpr.N(plan.End)})");

        var cover = $"{next}c";
        graph.Append($"[{before}]trim=start={FilterExpr.N(plan.Start)}:end={FilterExpr.N(plan.End + 0.05)},")
             .Append($"crop=w=iw:h={h}:x=0:y={y0},format=yuva444p,")
             .Append("pad=w=iw*2:h=ih:x=0:y=0:color=black@0,")
             .Append($"crop=w=iw/2:h=ih:x={at}:y=0[{cover}];\n")
             .Append($"[{drawn}][{cover}]overlay=x={at}:y={y0}:eof_action=pass:enable={window}[{next}];\n");
        return next;
    }

    /// <summary>
    /// Average advance of a glyph for the reveal's sweep, a share of the font size - a little
    /// narrower than wrapping's deliberately wide estimate, so typing keeps pace with the text.
    /// </summary>
    private const double RevealCharWidth = 0.56;

    /// <summary>
    /// The opacity expression (null when the overlay simply cuts in and out) and the
    /// vertical offset to append to each line's y (empty when nothing slides), and the
    /// sideways offset for x, written against <c>{W}</c> - the frame width, which drawtext
    /// calls <c>w</c> and overlay <c>W</c>.
    /// </summary>
    private static (string? Alpha, string Slide, string SlideX) Motion(
        MergeOverlayItem overlay, double start, double end, double distance)
    {
        // A typed entrance is not a fade or a move: the text itself arrives at full strength.
        var inKind = IsReveal(Normalize(overlay.TransitionIn)) ? "none" : Normalize(overlay.TransitionIn);
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
