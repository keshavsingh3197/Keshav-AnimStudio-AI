using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Wipes rectangles of a clip's SOURCE frame - another channel's logo, a stock-site mark -
/// before the clip is cropped, fitted and given our own watermark.
/// <para>
/// Every coordinate is an expression over the frame's own size (<c>iw</c>, <c>main_w</c>),
/// never a pixel count. A phone clip's probed width and height ignore its rotation, so a
/// box measured in pixels can land on the wrong half of the picture; a fraction of the
/// decoded frame cannot.
/// </para>
/// <para>
/// Not <c>delogo</c>, deliberately: it takes no frame-size variables, and it fails the
/// whole render with "Logo area is outside of the frame" for any box that touches an
/// edge - which is exactly where watermarks sit.
/// </para>
/// </summary>
internal static class EraseFilters
{
    /// <summary>
    /// Smallest patch side, in pixels. A box this small still holds no mark worth erasing,
    /// but it keeps the blur radius below boxblur's limit on a tiny source.
    /// </summary>
    private const int MinPatchPixels = 8;

    /// <summary>Share of the box the replacement mark may fill, leaving a little air around it.</summary>
    private const double BrandFill = 0.85;

    /// <summary>
    /// Appends the erase passes reading <paramref name="input"/> and returns the label of
    /// the result, or <paramref name="input"/> itself when there is nothing to erase.
    /// </summary>
    /// <param name="replacesCornerMark">
    /// True when a Brand box drew our mark and did not ask to keep the corner one as well -
    /// the caller then skips the corner watermark for this clip.
    /// </param>
    /// <param name="mark">The project's own watermark, drawn into <see cref="EraseStyle.Brand"/> boxes.</param>
    /// <param name="inputs">Where a Brand box's logo input is added.</param>
    public static string Append(
        StringBuilder graph, string input, IReadOnlyList<EraseRegionSpec> regions, out bool replacesCornerMark,
        WatermarkPlan? mark = null, IRenderCapabilities? capabilities = null,
        List<FfmpegInputSpec>? inputs = null, List<string>? warnings = null)
    {
        var current = input;
        replacesCornerMark = false;
        for (var i = 0; i < regions.Count; i++)
        {
            var r = regions[i];
            var next = $"er{i}";

            switch (r.Style)
            {
                case EraseStyle.Fill:
                    if (r.Opacity <= 0) continue;
                    // Hex validated by EraseRegionSpec.Normalized - nothing else reaches here.
                    var color = "0x" + (r.FillColor ?? "#000000")[1..];
                    graph.Append($"[{current}]drawbox=x='iw*{P(r.X)}':y='ih*{P(r.Y)}':w='iw*{P(r.Width)}':h='ih*{P(r.Height)}'")
                         .Append($":color={color}@{FilterExpr.N(r.Opacity / 100)}:t=fill[{next}];\n");
                    break;

                case EraseStyle.Clean:
                    AppendClean(graph, current, next, r);
                    break;

                case EraseStyle.Blur:
                    // A radius of 0.4 of the patch's short side at full strength is well
                    // past legibility, and always under boxblur's hard limit of half of it.
                    var outer = r.Outer();
                    AppendPatch(graph, current, next, r, (outer.X, outer.Y),
                        blurFactor: r.Strength / 250, power: 2);
                    break;

                default:
                    // Patch and Brand: footage from beside the box, lightly softened so a
                    // copied texture does not visibly repeat.
                    AppendPatch(graph, current, next, r, r.PatchOrigin(),
                        blurFactor: r.Strength / 2000, power: 1);
                    if (r.Style == EraseStyle.Brand)
                    {
                        var branded = $"{next}k";
                        if (AppendMark(graph, next, branded, r, i, mark, capabilities, inputs))
                        {
                            next = branded;
                            replacesCornerMark |= !r.KeepCornerMark;
                        }
                        else
                            warnings?.Add("ERASE_BRAND_UNAVAILABLE");
                    }
                    break;
            }

            current = next;
        }

        return current;
    }

    /// <summary>
    /// Redraws the box grown by its feather from footage at <paramref name="from"/> (the
    /// box itself for a blur, a neighbouring area for a patch), fading out across the
    /// margin so no hard edge is left.
    /// </summary>
    private static void AppendPatch(
        StringBuilder graph, string current, string next, EraseRegionSpec r,
        (double X, double Y) from, double blurFactor, int power)
    {
        var (ox, oy, ow, oh) = r.Outer();
        var w = P(ow);
        var h = P(oh);

        graph.Append($"[{current}]split=2[{next}m][{next}s];\n")
             .Append($"[{next}s]crop=w='min(iw,max({MinPatchPixels},iw*{w}))'")
             .Append($":h='min(ih,max({MinPatchPixels},ih*{h}))':x='iw*{P(from.X)}':y='ih*{P(from.Y)}'");

        if (blurFactor > 0)
        {
            var f = FilterExpr.N(Math.Round(blurFactor, 4));
            graph.Append($",boxblur=luma_radius='min(w,h)*{f}':luma_power={power}")
                 .Append($":chroma_radius='min(cw,ch)*{f}':chroma_power={power}");
        }

        var alpha = FeatherAlpha(r, ox, oy, ow, oh);
        if (alpha is not null)
        {
            graph.Append($",format=yuva444p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='{alpha}'");
        }

        // Clamped the way crop clamps, so a patch widened to the minimum at an edge goes
        // back exactly where crop took it from.
        graph.Append($"[{next}b];\n")
             .Append($"[{next}m][{next}b]overlay=x='min(main_w*{P(ox)},main_w-overlay_w)'")
             .Append($":y='min(main_h*{P(oy)},main_h-overlay_h)'")
             .Append(alpha is null ? "" : ":format=auto")
             .Append($"[{next}];\n");
    }

    /// <summary>Pixels kept around a Clean box: its outermost row and column are what it is rebuilt from.</summary>
    private const int CleanEdge = 2;

    /// <summary>
    /// Rebuilds the box from the footage just outside it: each pixel is the edge above and
    /// below blended by height, and the edge left and right blended by width, mixed by
    /// which edge is nearer - the way delogo interpolates, without delogo's pixel-only
    /// coordinates or its failure on a box that touches the frame edge. A side against the
    /// frame edge has nothing to read, so the box is built from the other sides alone.
    /// <para>
    /// The patch starts on an even pixel so a 4:2:0 overlay does not round it a pixel off
    /// what it was cut from.
    /// </para>
    /// </summary>
    private static void AppendClean(StringBuilder graph, string current, string next, EraseRegionSpec r)
    {
        bool top = r.Y > 0.5, bottom = r.Y + r.Height < 99.5, left = r.X > 0.5, right = r.X + r.Width < 99.5;
        if (!(top || bottom || left || right))
        {
            // The whole frame: there is nothing outside to rebuild it from.
            graph.Append($"[{current}]drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill[{next}];\n");
            return;
        }

        int mt = top ? CleanEdge : 0, mb = bottom ? CleanEdge : 0, ml = left ? CleanEdge : 0, mr = right ? CleanEdge : 0;
        var x0 = $"2*floor(max(0,floor(iw*{P(r.X)})-{ml})/2)";
        var y0 = $"2*floor(max(0,floor(ih*{P(r.Y)})-{mt})/2)";
        var w = $"min(iw,ceil(iw*{P(r.X + r.Width)})+{mr})-{x0}";
        var h = $"min(ih,ceil(ih*{P(r.Y + r.Height)})+{mb})-{y0}";

        string Plane(string p)
        {
            string? v = null, dy = null, hz = null, dx = null;
            if (top && bottom)
            {
                v = $"{p}(X,0)*(1-Y/(H-1))+{p}(X,H-1)*Y/(H-1)";
                dy = "min(Y,H-1-Y)";
            }
            else if (top) { v = $"{p}(X,0)"; dy = "Y"; }
            else if (bottom) { v = $"{p}(X,H-1)"; dy = "(H-1-Y)"; }

            if (left && right)
            {
                hz = $"{p}(0,Y)*(1-X/(W-1))+{p}(W-1,Y)*X/(W-1)";
                dx = "min(X,W-1-X)";
            }
            else if (left) { hz = $"{p}(0,Y)"; dx = "X"; }
            else if (right) { hz = $"{p}(W-1,Y)"; dx = "(W-1-X)"; }

            // Near a top or bottom edge the vertical blend wins, near a side the horizontal one.
            var fill = v is not null && hz is not null
                ? $"(({v})*{dx}+({hz})*{dy})/max(0.001,{dx}+{dy})"
                : v ?? hz!;
            var inside = $"gte(Y,{mt})*lt(Y,H-{mb})*gte(X,{ml})*lt(X,W-{mr})";
            return $"if({inside},{fill},{p}(X,Y))";
        }

        graph.Append($"[{current}]split=2[{next}m][{next}s];\n")
             .Append($"[{next}s]crop=w='{w}':h='{h}':x='{x0}':y='{y0}':exact=1,format=yuv444p,")
             .Append($"geq=lum='{Plane("lum")}':cb='{Plane("cb")}':cr='{Plane("cr")}'[{next}b];\n")
             .Append($"[{next}m][{next}b]overlay=x='{x0.Replace("iw", "main_w")}'")
             .Append($":y='{y0.Replace("ih", "main_h")}'[{next}];\n");
    }

    /// <summary>
    /// geq alpha for the grown box: opaque over the box, ramping to clear across each
    /// margin. A side with no margin (feather 0, or the box against the frame edge) gets
    /// no ramp at all - fading there would let the mark show through. Null when no side
    /// fades.
    /// </summary>
    private static string? FeatherAlpha(EraseRegionSpec r, double ox, double oy, double ow, double oh)
    {
        var terms = new List<string>();
        void Side(double margin, double size, string distance, string dim)
        {
            if (margin <= 0.01) return;
            terms.Add($"{distance}/max(1,{dim}*{FilterExpr.N(Math.Round(margin / size, 4))})");
        }

        Side(r.X - ox, ow, "X", "W");
        Side(ox + ow - (r.X + r.Width), ow, "(W-1-X)", "W");
        Side(r.Y - oy, oh, "Y", "H");
        Side(oy + oh - (r.Y + r.Height), oh, "(H-1-Y)", "H");
        if (terms.Count == 0) return null;

        var min = terms.Aggregate((a, b) => $"min({a},{b})");
        return $"255*clip({min},0,1)";
    }

    /// <summary>
    /// Draws the project's own watermark centred in the box, fitted to it. False when
    /// there is no mark, or this ffmpeg cannot size or draw it - the box is then still
    /// patched, just left clean.
    /// </summary>
    private static bool AppendMark(
        StringBuilder graph, string current, string next, EraseRegionSpec r, int index,
        WatermarkPlan? mark, IRenderCapabilities? capabilities, List<FfmpegInputSpec>? inputs)
    {
        if (mark is null || capabilities is null) return false;

        var (x, y, w, h) = (P(r.X), P(r.Y), P(r.Width), P(r.Height));
        var fill = FilterExpr.N(BrandFill);

        if (mark.Kind == WatermarkKind.Logo && mark.LogoRelativePath is { Length: > 0 } logo)
        {
            if (inputs is null || !capabilities.Supports(RenderFeature.ScaleToReference)) return false;

            var logoInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec([], logo));

            // The box's pixel size exists only inside the graph, so a crop of it is the
            // reference the logo is scaled against. The logo is one frame; overlay's
            // eof_action=repeat holds it for the whole clip.
            graph.Append($"[{current}]split=2[{next}m][{next}r];\n")
                 .Append($"[{next}r]crop=w='max(2,iw*{w})':h='max(2,ih*{h})':x=0:y=0[{next}ref];\n")
                 .Append($"[{logoInput}:v][{next}ref]scale=w='rw*{fill}':h='rh*{fill}'")
                 .Append(":force_original_aspect_ratio=decrease:flags=lanczos,")
                 .Append($"format=rgba,colorchannelmixer=aa={FilterExpr.N(mark.Opacity)},setsar=1[{next}l];\n")
                 .Append($"[{next}m][{next}l]overlay=x='main_w*{x}+(main_w*{w}-overlay_w)/2'")
                 .Append($":y='main_h*{y}+(main_h*{h}-overlay_h)/2':eof_action=repeat:format=auto[{next}];\n");
            return true;
        }

        if (mark.Kind == WatermarkKind.Text
            && mark.TextRelativePath is { Length: > 0 } text
            && mark.FontFilePath is { Length: > 0 } font
            && capabilities.Supports(RenderFeature.DrawText))
        {
            // drawtext cannot fit text to a width, so the size is the smaller of "fills the
            // box's height" and "an average glyph (~0.55em) times the line fills its width".
            var chars = FilterExpr.N(Math.Max(1, mark.TextLength) * 0.55);
            var parts = new[]
            {
                $"textfile={FilterExpr.Quote(FilterExpr.Path(text))}",
                $"fontfile={FilterExpr.Quote(FilterExpr.Path(font))}",
                "reload=0",
                $"fontsize='max(6,min(h*{h}*0.6,w*{w}*{fill}/{chars}))'",
                $"fontcolor=0x{mark.ColorRgb}@{FilterExpr.N(mark.Opacity)}",
                $"x='w*{x}+(w*{w}-text_w)/2'",
                $"y='h*{y}+(h*{h}-text_h)/2'",
                "shadowcolor=0x000000@0.6",
                "shadowx=2",
                "shadowy=2"
            };
            graph.Append($"[{current}]drawtext={string.Join(':', parts)}[{next}];\n");
            return true;
        }

        return false;
    }

    /// <summary>Percent to a fraction of the frame, as an ffmpeg literal.</summary>
    private static string P(double percent) => FilterExpr.N(Math.Round(percent / 100.0, 6));
}
