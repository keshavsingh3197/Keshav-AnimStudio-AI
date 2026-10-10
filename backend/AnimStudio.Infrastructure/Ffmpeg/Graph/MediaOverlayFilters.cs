using System.Globalization;
using System.Text;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Draws an image or video overlay onto the joined video: cropped, sized against the canvas,
/// cut to a shape with an optional ring, and brought in and out with a fade, slide or zoom.
/// <para>
/// A plain rectangle that only fades takes exactly the path it always did, so older jobs
/// render the graph they always rendered. Everything else is added only when asked for.
/// </para>
/// <para>
/// A shape is a per-pixel <c>geq</c>, which is slow, so it is never run per frame. A shaped
/// still is cut ONCE and then looped; a shaped video is masked by an alpha stencil that is
/// itself drawn once and looped. Either way the cost is one frame's worth of <c>geq</c>.
/// </para>
/// <para>
/// Motion uses the text overlays' easing (a cubic ease-out in, a quadratic ease out) so a
/// picture and a caption that enter together arrive together. The fade itself is ffmpeg's
/// linear <c>fade</c>, which the studio preview matches.
/// </para>
/// </summary>
internal static class MediaOverlayFilters
{
    /// <summary>Appends the overlay to <paramref name="graph"/> and returns the label it ends on.</summary>
    public static string Append(
        StringBuilder graph, List<FfmpegInputSpec> inputs, string current, int index,
        MergeOverlayItem overlay, Canvas canvas)
    {
        var rate = canvas.FrameRate;
        var start = overlay.StartSeconds;
        var end = overlay.StartSeconds + overlay.DurationSeconds;
        var startSec = FilterExpr.N(start);
        var endSec = FilterExpr.N(end);
        var media = overlay.Media;
        var isImage = overlay.Type == "image";

        var scale = TextOverlayLayout.Scale(canvas.Width, canvas.Height);
        var border = media is null || media.BorderWidth <= 0
            ? 0
            : Math.Max(1, (int)Math.Round(media.BorderWidth * scale));
        var shaped = media is not null && (media.Shape != OverlayShape.Rect || border > 0);

        // Target size: a share of the canvas width; the height from the studio's measured
        // aspect when it sent one, so a shaped video's stencil can be drawn the same size.
        int? width = overlay.WidthPercent is { } wp ? Even(canvas.Width * wp / 100) : null;
        int? height = width is { } w && media?.AspectRatio is { } ar ? Even(w / ar) : null;

        // A shaped video needs a known size for its stencil; without one it stays a rectangle.
        var stencil = shaped && !isImage && width is not null && height is not null;
        var shapeOnce = shaped && isImage;

        var input = inputs.Count;
        if (isImage)
        {
            // Looped by the input for a plain still; a shaped one is looped AFTER its cut.
            inputs.Add(shapeOnce
                ? new FfmpegInputSpec([], overlay.RelativePath!)
                : new FfmpegInputSpec(
                    ["-loop", "1", "-framerate", rate.ToFfmpegRate(), "-t", FilterExpr.N(overlay.DurationSeconds)],
                    overlay.RelativePath!));
        }
        else
        {
            var trim = media?.TrimStartSeconds ?? 0;
            List<string> args = trim > 0 ? ["-ss", FilterExpr.N(trim)] : [];
            args.AddRange(["-t", FilterExpr.N(overlay.DurationSeconds)]);
            inputs.Add(new FfmpegInputSpec(args, overlay.RelativePath!));
        }

        var chain = new StringBuilder($"[{input}:v]format=rgba");

        if (media is { HasCrop: true })
        {
            var keepW = FilterExpr.N(1 - (media.CropLeft + media.CropRight) / 100);
            var keepH = FilterExpr.N(1 - (media.CropTop + media.CropBottom) / 100);
            chain.Append($",crop=w=iw*{keepW}:h=ih*{keepH}")
                 .Append($":x=iw*{FilterExpr.N(media.CropLeft / 100)}:y=ih*{FilterExpr.N(media.CropTop / 100)}");
        }

        if (width is { } targetW)
        {
            chain.Append(height is { } targetH ? $",scale={targetW}:{targetH},setsar=1" : $",scale={targetW}:-2");
        }
        else if (overlay.Scale != 1.0)
        {
            chain.Append($",scale=iw*{FilterExpr.N(overlay.Scale)}:-1");
        }

        if (shapeOnce)
        {
            chain.Append(',').Append(ShapedPixels(media!, border));
        }

        if (overlay.Opacity < 1.0) chain.Append($",colorchannelmixer=aa={FilterExpr.N(overlay.Opacity)}");

        if (shapeOnce)
        {
            // One cut frame, repeated for the overlay's length.
            chain.Append(",loop=loop=-1:size=1:start=0")
                 .Append($",setpts=N/({rate.ToFfmpegRate()}*TB)")
                 .Append($",trim=duration={FilterExpr.N(overlay.DurationSeconds)}");
        }

        if (stencil)
        {
            var masked = $"ov_m_{index}";
            chain.Append($",setpts=PTS-STARTPTS,fps={rate.ToFfmpegRate()}[ov_c_{index}];\n");
            graph.Append(chain);
            AppendStencil(graph, index, media!, border, width!.Value, height!.Value, overlay.DurationSeconds, rate, masked);
            chain = new StringBuilder($"[{masked}]null");
        }

        // Moved onto the joined video's clock, so it starts at its own start time instead of
        // playing (unseen) from zero, and the fades and moves land where they belong.
        chain.Append($",setpts=PTS-STARTPTS+{startSec}/TB");

        var inKind = Normalize(overlay.TransitionIn);
        var outKind = Normalize(overlay.TransitionOut);
        var inSeconds = overlay.TransitionInDuration > 0 ? overlay.TransitionInDuration : 0.5;
        var outSeconds = overlay.TransitionOutDuration > 0 ? overlay.TransitionOutDuration : 0.5;
        var easeIn = $"(1-pow(1-clip((t-{startSec})/{FilterExpr.N(inSeconds)},0,1),3))";
        var easeOut = $"pow(clip(({endSec}-t)/{FilterExpr.N(outSeconds)},0,1),2)";

        var zoom = ZoomFactor(inKind, outKind, start, inSeconds, easeOut);
        if (zoom is not null)
        {
            // Per frame, around the centre: the overlay is placed by (W-w)/2, which follows w.
            chain.Append($",scale=w={FilterExpr.Quote($"max(2,trunc(iw*{zoom}/2)*2)")}:h=-2:eval=frame");
        }

        // Every entrance but a plain cut also fades, as text does - a slide that pops in at
        // full strength reads as a glitch, not a move.
        if (inKind != "none" && overlay.TransitionInDuration > 0)
        {
            chain.Append($",fade=t=in:st={startSec}:d={FilterExpr.N(overlay.TransitionInDuration)}:alpha=1");
        }
        if (outKind != "none" && overlay.TransitionOutDuration > 0)
        {
            var outStart = overlay.StartSeconds + Math.Max(0, overlay.DurationSeconds - overlay.TransitionOutDuration);
            chain.Append($",fade=t=out:st={FilterExpr.N(outStart)}:d={FilterExpr.N(overlay.TransitionOutDuration)}:alpha=1");
        }

        var placed = $"ov_s_{index}";
        graph.Append(chain).Append($"[{placed}];\n");

        var xPos = overlay.X != 0 ? $"(W-w)/2+W*{FilterExpr.N(overlay.X / 100.0)}" : "(W-w)/2";
        var yPos = overlay.Y != 0 ? $"(H-h)/2+H*{FilterExpr.N(overlay.Y / 100.0)}" : "(H-h)/2";
        var (slideX, slideY) = Slide(inKind, outKind, easeIn, easeOut);
        var x = slideX.Length > 0 ? FilterExpr.Quote(xPos + slideX) : xPos;
        var y = slideY.Length > 0 ? FilterExpr.Quote(yPos + slideY) : yPos;

        var next = $"v_ov_{index}";
        graph.Append($"[{current}][{placed}]overlay=x={x}:y={y}:enable='between(t,{startSec},{endSec})'[{next}];\n");
        return next;
    }

    /// <summary>
    /// The zoom multiplier at time t, or null when nothing zooms. "pop" overshoots a little
    /// before settling - a sticker landing rather than a picture growing.
    /// </summary>
    private static string? ZoomFactor(string inKind, string outKind, double start, double inSeconds, string easeOut)
    {
        var from = FilterExpr.N(MediaOverlayShape.ZoomFrom);
        var rest = FilterExpr.N(1 - MediaOverlayShape.ZoomFrom);
        var p = $"clip((t-{FilterExpr.N(start)})/{FilterExpr.N(inSeconds)},0,1)";

        string? zIn = inKind switch
        {
            "zoom" or "zoom-in" => $"({from}+{rest}*(1-pow(1-{p},3)))",
            "pop" => $"({from}+{rest}*(1+2.70158*pow({p}-1,3)+1.70158*pow({p}-1,2)))",
            _ => null
        };
        string? zOut = outKind is "zoom" or "zoom-out" or "pop" ? $"({from}+{rest}*{easeOut})" : null;

        return (zIn, zOut) switch
        {
            (null, null) => null,
            ({ } a, null) => a,
            (null, { } b) => b,
            ({ } a, { } b) => $"{a}*{b}"
        };
    }

    /// <summary>Terms to append to the overlay's x and y; empty when it does not move that way.</summary>
    private static (string X, string Y) Slide(string inKind, string outKind, string easeIn, string easeOut)
    {
        var s = FilterExpr.N(MediaOverlayShape.SlideShare);
        var x = new StringBuilder();
        var y = new StringBuilder();

        // In: arrives FROM the side it is named away from - slide-up rises from below.
        switch (inKind)
        {
            case "slide-up": y.Append($"+H*{s}*(1-{easeIn})"); break;
            case "slide-down": y.Append($"-H*{s}*(1-{easeIn})"); break;
            case "slide-left": x.Append($"+W*{s}*(1-{easeIn})"); break;
            case "slide-right": x.Append($"-W*{s}*(1-{easeIn})"); break;
        }

        // Out: leaves TOWARDS the side it is named after.
        switch (outKind)
        {
            case "slide-up": y.Append($"-H*{s}*(1-{easeOut})"); break;
            case "slide-down": y.Append($"+H*{s}*(1-{easeOut})"); break;
            case "slide-left": x.Append($"-W*{s}*(1-{easeOut})"); break;
            case "slide-right": x.Append($"+W*{s}*(1-{easeOut})"); break;
        }

        return (x.ToString(), y.ToString());
    }

    /// <summary>
    /// A geq that cuts an RGBA still to its shape and paints the ring over its edge, keeping
    /// the picture's own transparency inside the shape.
    /// </summary>
    private static string ShapedPixels(MergeMediaOverlay media, int border)
    {
        var inside = Inside(media.Shape);
        var ring = border > 0 ? Ring(media.Shape, border) : "0";
        var (r, g, b) = Channels(media.BorderRgb);

        string Mix(string own, int ringValue) =>
            border > 0 ? $"{own}*(1-{ring})+{ringValue}*{ring}" : own;

        var alpha = border > 0 ? $"{inside}*(alpha(X,Y)*(1-{ring})+255*{ring})" : $"{inside}*alpha(X,Y)";
        return "geq="
            + $"r={FilterExpr.Quote(Mix("r(X,Y)", r))}"
            + $":g={FilterExpr.Quote(Mix("g(X,Y)", g))}"
            + $":b={FilterExpr.Quote(Mix("b(X,Y)", b))}"
            + $":a={FilterExpr.Quote(alpha)}";
    }

    /// <summary>
    /// A video cut to its shape: an alpha mask and a ring, each drawn once at the overlay's
    /// size and looped, merged onto the moving picture.
    /// </summary>
    private static void AppendStencil(
        StringBuilder graph, int index, MergeMediaOverlay media, int border,
        int width, int height, double seconds, FrameRate rate, string output)
    {
        var size = $"s={width}x{height}:r={rate.ToFfmpegRate()}:d={FilterExpr.N(1 / rate.AsDouble)}";
        var loop = $"loop=loop=-1:size=1:start=0,setpts=N/({rate.ToFfmpegRate()}*TB),trim=duration={FilterExpr.N(seconds)}";
        var inside = Inside(media.Shape);

        graph.Append($"color=c=black:{size},format=gray,geq=lum={FilterExpr.Quote($"255*{inside}")},{loop}[ov_k_{index}];\n");

        if (border <= 0)
        {
            graph.Append($"[ov_c_{index}][ov_k_{index}]alphamerge[{output}];\n");
            return;
        }

        graph.Append($"[ov_c_{index}][ov_k_{index}]alphamerge[ov_a_{index}];\n")
             .Append($"color=c=0x{media.BorderRgb}:{size},format=rgba,")
             .Append($"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a={FilterExpr.Quote($"255*{inside}*{Ring(media.Shape, border)}")},{loop}[ov_r_{index}];\n")
             .Append($"[ov_a_{index}][ov_r_{index}]overlay=format=auto[{output}];\n");
    }

    /// <summary>0-1 coverage of the shape at (X, Y), anti-aliased over about a pixel.</summary>
    private static string Inside(OverlayShape shape) => shape switch
    {
        OverlayShape.Circle => "clip((1-hypot((X-W/2)/(W/2),(Y-H/2)/(H/2)))*min(W,H)/2,0,1)",
        OverlayShape.Rounded => RoundedRect("0", Radius()),
        _ => "1"
    };

    /// <summary>0-1 coverage of the ring: inside the shape, outside the shape inset by the border.</summary>
    private static string Ring(OverlayShape shape, int border)
    {
        var b = FilterExpr.N(border);
        if (shape == OverlayShape.Circle)
        {
            return $"clip((hypot((X-W/2)/(W/2-{b}),(Y-H/2)/(H/2-{b}))-1)*(min(W,H)/2-{b}),0,1)";
        }

        var inner = shape == OverlayShape.Rounded ? $"max({Radius()}-{b},0)" : "0";
        return $"(1-{RoundedRect(b, inner)})";
    }

    private static string Radius() =>
        $"min(W,H)*{FilterExpr.N(MediaOverlayShape.RoundedCornerShare)}";

    /// <summary>Coverage of a rectangle inset by <paramref name="inset"/> with corners of radius <paramref name="radius"/>.</summary>
    private static string RoundedRect(string inset, string radius) =>
        $"clip({radius}+1-hypot(max(abs(X-W/2)-(W/2-{inset}-{radius}),0),max(abs(Y-H/2)-(H/2-{inset}-{radius}),0)),0,1)";

    private static (int R, int G, int B) Channels(string rgb)
    {
        static int At(string s, int i) => int.Parse(s.AsSpan(i, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        return rgb is { Length: 6 } && rgb.All(char.IsAsciiHexDigit) ? (At(rgb, 0), At(rgb, 2), At(rgb, 4)) : (255, 255, 255);
    }

    private static int Even(double pixels) => Math.Max(2, (int)Math.Round(pixels / 2) * 2);

    private static string Normalize(string? kind) =>
        string.IsNullOrWhiteSpace(kind) ? "none" : kind.Trim().ToLowerInvariant();
}
