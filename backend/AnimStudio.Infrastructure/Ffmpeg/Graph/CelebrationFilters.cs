using System.Text;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Draws a celebration - confetti, a flower shower, hearts, sparkles, snow, balloons - over the
/// joined video, with nothing but ffmpeg: no sprite files, no image library.
/// <para>
/// Each particle is a tiny sprite whose shape is a <c>geq</c> mask computed for ONE frame and
/// then looped, so its cost is a few hundred pixels once. The sprites are overlaid onto a
/// transparent layer the size of the canvas, moving by the planner's formulas in the layer's
/// own time; the layer fades in and out as a whole and is composited onto the video once.
/// The studio preview draws the same particles with the same formulas.
/// </para>
/// </summary>
internal static class CelebrationFilters
{
    /// <summary>Drag on a cannon's confetti (per second) when the planner gave a piece none of its own.</summary>
    private const double CannonDrag = 2.2;

    /// <summary>How fast cannon confetti settles once its push is spent, in canvas heights per second.</summary>
    private const double CannonSettle = 0.12;

    public static string Append(StringBuilder graph, string current, int index, MergeOverlayItem overlay, Canvas canvas)
    {
        var settings = overlay.Celebration!;
        var seconds = overlay.DurationSeconds;
        var rate = canvas.FrameRate.ToFfmpegRate();
        var duration = FilterExpr.N(seconds);
        var particles = CelebrationPlanner.Plan(settings, canvas.Width, canvas.Height, seconds);

        var layer = $"cel{index}_0";
        graph.Append($"color=c=black@0:s={canvas.Width}x{canvas.Height}:r={rate}:d={duration},format=rgba[{layer}];\n");

        for (var k = 0; k < particles.Count; k++)
        {
            var p = particles[k];
            var sprite = $"cel{index}_p{k}";
            graph.Append($"color=c=black:s={p.Width}x{p.Height}:r={rate},format=rgba,")
                 .Append(Mask(p))
                 .Append($",trim=end_frame=1,loop=loop=-1:size=1:start=0,setpts=N/({rate}*TB),trim=duration={duration}");
            if (p.Motion == ParticleMotion.Twinkle)
            {
                graph.Append(",geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a=")
                     .Append(FilterExpr.Quote($"alpha(X,Y)*(0.2+0.8*abs(sin(T*{FilterExpr.N(p.TwinkleHz * Math.PI * 2)}+{FilterExpr.N(p.Phase)})))"));
            }
            if (p.SpinDegreesPerSecond != 0)
            {
                graph.Append(",rotate=a=")
                     .Append(FilterExpr.Quote($"{FilterExpr.N(p.SpinDegreesPerSecond * Math.PI / 180)}*t+{FilterExpr.N(p.Phase)}"))
                     .Append(":c=none:ow=").Append(FilterExpr.Quote("hypot(iw,ih)")).Append(":oh=ow");
            }
            graph.Append($"[{sprite}];\n");

            var (x, y) = Position(p, settings.Mode, seconds);
            var next = $"cel{index}_{k + 1}";
            graph.Append($"[{layer}][{sprite}]overlay=x={FilterExpr.Quote(x)}:y={FilterExpr.Quote(y)}:eval=frame:format=auto:eof_action=pass[{next}];\n");
            layer = next;
        }

        var fade = FilterExpr.N(Math.Min(CelebrationPlanner.FadeSeconds, seconds / 3));
        var fadeOutAt = FilterExpr.N(Math.Max(0, seconds - Math.Min(CelebrationPlanner.FadeSeconds, seconds / 3)));
        var start = FilterExpr.N(overlay.StartSeconds);
        var end = FilterExpr.N(overlay.StartSeconds + seconds);
        var placed = $"cel{index}_out";
        var output = $"v_cel_{index}";
        graph.Append($"[{layer}]fade=t=in:st=0:d={fade}:alpha=1,fade=t=out:st={fadeOutAt}:d={fade}:alpha=1,")
             .Append($"setpts=PTS-STARTPTS+{start}/TB[{placed}];\n")
             .Append($"[{current}][{placed}]overlay=x=0:y=0:enable='between(t,{start},{end})':eof_action=pass[{output}];\n");
        return output;
    }

    /// <summary>
    /// The top-left corner of a particle's sprite at layer time <c>t</c>: the planner's centre
    /// minus half the (possibly rotated) sprite. W/H are the layer, w/h the sprite.
    /// </summary>
    internal static (string X, string Y) Position(CelebrationParticle p, CelebrationMode mode, double seconds)
    {
        var sway = $"{FilterExpr.N(p.SwayAmplitude)}*W*sin({FilterExpr.N(p.SwayHz * Math.PI * 2)}*t+{FilterExpr.N(p.Phase)})";
        var x = $"{FilterExpr.N(p.X0)}*W+{sway}-w/2";
        var v = FilterExpr.N(p.Speed);
        var delay = FilterExpr.N(p.Delay);
        // Rain spreads the particles over the whole fall by an offset instead of a delay.
        var offset = FilterExpr.N(seconds <= 0 ? 0 : p.Delay / seconds);

        string y;
        switch (p.Motion)
        {
            case ParticleMotion.Rise:
                y = mode == CelebrationMode.Rain
                    ? $"H+h/2-mod({v}*H*t+{offset}*(H+h),H+h)-h/2"
                    : $"H+{FilterExpr.N(p.Y0)}*H-{v}*H*(t-{delay})";
                break;
            case ParticleMotion.Cannon:
            {
                var tau = $"max(0,t-{delay})";
                var drag = FilterExpr.N(p.Drag > 0 ? p.Drag : CannonDrag);
                var push = $"(1-exp(-{drag}*{tau}))/{drag}";
                x = $"{FilterExpr.N(p.X0)}*W+{FilterExpr.N(p.VelocityX)}*W*{push}+{sway}-w/2";
                y = $"H+h/2-{v}*H*{push}+{FilterExpr.N(CannonSettle)}*H*{tau}-h/2";
                break;
            }
            case ParticleMotion.Twinkle:
                y = $"{FilterExpr.N(p.Y0)}*H-{v}*H*t-h/2";
                break;
            default:
                y = mode == CelebrationMode.Rain
                    ? $"mod({v}*H*t+{offset}*(H+h),H+h)-h"
                    : $"-h-{FilterExpr.N(p.Y0)}*H+{v}*H*(t-{delay})";
                break;
        }

        return (x, y);
    }

    /// <summary>The particle's colour and shape as a <c>geq</c>, in the sprite's own -1..1 coordinates.</summary>
    internal static string Mask(CelebrationParticle p)
    {
        var (r, g, b) = Rgb(p.Rgb);
        const string u = "((X-W/2)/(W/2))";
        const string v = "((Y-H/2)/(H/2))";
        var radius = $"hypot({u},{v})";

        // Shade: 1 keeps the colour, below darkens it, above (up to 2) lifts it towards white.
        string alpha, shade;
        switch (p.Shape)
        {
            case ParticleShape.Ribbon:
                alpha = "255";
                shade = $"0.8+0.2*(1-abs({v}))";
                break;
            case ParticleShape.Petal:
                alpha = $"255*clip((1-({u}*{u}+{v}*{v}))*6,0,1)";
                shade = $"0.7+0.3*(1-{u}*{u}-{v}*{v})";
                break;
            case ParticleShape.Marigold:
                alpha = $"255*clip((0.8+0.15*cos(10*atan2({v},{u}))-{radius})*10,0,1)";
                shade = $"0.55+0.45*min(1,{radius}/0.45)";
                break;
            case ParticleShape.Heart:
            {
                const string hx = $"({u}*1.25)";
                const string hy = $"(0.3-{v}*1.25)";
                const string q = $"({hx}*{hx}+{hy}*{hy}-1)";
                alpha = $"255*lt({q}*{q}*{q}-{hx}*{hx}*{hy}*{hy}*{hy},0)";
                shade = $"1+0.5*clip(1-hypot({u}+0.35,{v}+0.35)*3,0,1)";
                break;
            }
            case ParticleShape.Star:
                alpha = $"255*max(clip((1-sqrt(abs({u}))-sqrt(abs({v})))*3,0,1),0.45*clip(1-{radius}*1.5,0,1))";
                shade = $"1+clip(1-{radius}*2.5,0,1)";
                break;
            case ParticleShape.Flake:
                alpha = $"235*clip((1-{radius})*2.2,0,1)";
                shade = "1";
                break;
            default: // Balloon: a body, a knot below it and a short string.
            {
                const string body = $"(({u}/0.95)*({u}/0.95)+(({v}+0.17)/0.8)*(({v}+0.17)/0.8))";
                const string knot = $"(gte({v},0.6)*lte({v},0.72)*lt(abs({u}),({v}-0.56)*0.7))";
                const string line = $"(gt({v},0.72)*lt(abs({u}),0.035))";
                alpha = $"255*max(max(clip((1-{body})*8,0,1),{knot}),0.6*{line})";
                shade = $"1+0.6*clip(1-hypot({u}+0.35,{v}+0.5)*3.2,0,1)";
                break;
            }
        }

        string Channel(int c) => FilterExpr.Quote($"clip(if(lte({shade},1),{c}*({shade}),{c}+(255-{c})*(({shade})-1)),0,255)");
        return $"geq=r={Channel(r)}:g={Channel(g)}:b={Channel(b)}:a={FilterExpr.Quote(alpha)}";
    }

    private static (int R, int G, int B) Rgb(string hex)
    {
        // The planner's palettes are constants, but a malformed one must never reach the graph.
        if (hex.Length != 6 || !hex.All(char.IsAsciiHexDigit)) return (255, 255, 255);
        return (Convert.ToInt32(hex[..2], 16), Convert.ToInt32(hex[2..4], 16), Convert.ToInt32(hex[4..], 16));
    }
}
