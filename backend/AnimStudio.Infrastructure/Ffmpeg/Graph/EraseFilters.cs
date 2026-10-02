using System.Text;
using AnimStudio.Domain.Jobs;

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

    /// <summary>
    /// Appends the erase passes reading <paramref name="input"/> and returns the label of
    /// the result, or <paramref name="input"/> itself when there is nothing to erase.
    /// </summary>
    public static string Append(StringBuilder graph, string input, IReadOnlyList<EraseRegionSpec> regions)
    {
        var current = input;
        for (var i = 0; i < regions.Count; i++)
        {
            var r = regions[i];
            var x = FilterExpr.N(r.X / 100.0);
            var y = FilterExpr.N(r.Y / 100.0);
            var w = FilterExpr.N(r.Width / 100.0);
            var h = FilterExpr.N(r.Height / 100.0);
            var next = $"er{i}";

            if (r.Style == EraseStyle.Fill)
            {
                // Hex validated by EraseRegionSpec.Normalized - nothing else reaches here.
                var color = "0x" + (r.FillColor ?? "#000000")[1..];
                graph.Append($"[{current}]drawbox=x='iw*{x}':y='ih*{y}':w='iw*{w}':h='ih*{h}'")
                     .Append($":color={color}@1:t=fill[{next}];\n");
            }
            else
            {
                // The patch is blurred on its own and laid back where it came from, so the
                // mark is smeared into its surroundings rather than the whole frame softened.
                // A radius of a third of the patch's short side is well past legibility, and
                // always under boxblur's hard limit of half of it (0 is allowed).
                graph.Append($"[{current}]split=2[{next}m][{next}s];\n")
                     .Append($"[{next}s]crop=w='min(iw,max({MinPatchPixels},iw*{w}))'")
                     .Append($":h='min(ih,max({MinPatchPixels},ih*{h}))':x='iw*{x}':y='ih*{y}',")
                     .Append("boxblur=luma_radius='min(w,h)/3':luma_power=3")
                     .Append($":chroma_radius='min(cw,ch)/3':chroma_power=3[{next}b];\n")
                     // Clamped the way crop clamps, so a patch widened to the minimum at
                     // an edge goes back exactly where crop took it from.
                     .Append($"[{next}m][{next}b]overlay=x='min(main_w*{x},main_w-overlay_w)'")
                     .Append($":y='min(main_h*{y},main_h-overlay_h)'[{next}];\n");
            }

            current = next;
        }

        return current;
    }
}
