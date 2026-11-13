using System.Text;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Makes characters painted into a still talk with real artwork: the same still redrawn with their mouths open is cut
/// around each mouth, feathered, and laid over the picture while that character speaks. Nothing is stretched or
/// masked out - each frame shows either the picture as it was or the image model's own open mouth, blended through
/// two in-between strengths so the mouth eases open and shut instead of snapping.
/// <para>
/// It runs on the picture at its own size, before the camera move, so the mouth rides along with any push or pan.
/// The open-mouth still is a single frame: each patch is cut and feathered once, and overlay repeats it, so the cost
/// per frame is a handful of small overlays switched by a per-frame <c>enable</c>, not a per-pixel expression.
/// </para>
/// </summary>
internal static class TalkingMouthFilters
{
    /// <summary>Patch width and height, as fractions of the face's width: lips, jaw and chin - below the nose, which a redraw may have turned.</summary>
    private const double PatchWidth = 0.66;
    private const double PatchHeight = 0.42;

    /// <summary>How far below the mouth's middle the patch is centred, as a fraction of the face's width: the jaw drops.</summary>
    private const double PatchDrop = 0.1;

    /// <summary>
    /// The strengths the open mouth is laid in at, each from the openness at which it takes over. The first two are the
    /// in-betweens that make the move read as smooth at 24-30 fps.
    /// </summary>
    private static readonly (double From, double Strength)[] Levels = [(0.22, 0.45), (0.5, 0.8), (0.75, 1.0)];

    /// <summary>How long the mouth takes to ease in at the start of a line and out at its end, in seconds.</summary>
    private const double EaseSeconds = 0.08;

    /// <summary>
    /// Appends the chain from <paramref name="input"/> to <paramref name="output"/>, with the open-mouth still as input
    /// <paramref name="openInput"/>. Each mouth's patch is cut from where that mouth is in the open-mouth still and
    /// scaled to the patch around the same mouth in the picture, so the two line up mouth by mouth whatever size or
    /// framing the image model drew at.
    /// </summary>
    public static void Append(
        StringBuilder graph, string input, int openInput, string output, IReadOnlyList<MouthPlan> mouths,
        TalkingBackgroundPlan talking, FrameRate rate)
    {
        var (width, height) = (talking.Width, talking.Height);
        var count = mouths.Count;
        graph.Append($"[{input}]setsar=1,format=rgba[tm0];\n");
        graph.Append($"[{openInput}:v]setsar=1,format=rgba");
        graph.Append(count == 1 ? "[to0];\n" : $",split={count}");
        if (count > 1)
        {
            for (var i = 0; i < count; i++) graph.Append($"[to{i}]");
            graph.Append(";\n");
        }

        var stage = 0;
        for (var i = 0; i < count; i++)
        {
            var mouth = mouths[i];
            var (x, y, w, h) = Patch(mouth.X, mouth.Y, mouth.FaceWidth, width, height);
            var (ox, oy, ow, oh) = Patch(mouth.OpenX ?? mouth.X, mouth.OpenY ?? mouth.Y, mouth.OpenFaceWidth ?? mouth.FaceWidth,
                talking.OpenWidth, talking.OpenHeight);

            // Opaque in the middle, easing to nothing at the edge, so no seam shows where the redraw differs.
            const string feather = "255*pow(clip((1-hypot((X-W/2)/(W/2),(Y-H/2)/(H/2)))/0.45,0,1),1.5)";
            graph.Append($"[to{i}]crop={ow}:{oh}:{ox}:{oy},scale={w}:{h}:flags=bicubic,")
                 .Append($"geq=r={FilterExpr.Quote("r(X,Y)")}:g={FilterExpr.Quote("g(X,Y)")}:b={FilterExpr.Quote("b(X,Y)")}")
                 .Append($":a={FilterExpr.Quote(feather)},split={Levels.Length}");
            for (var l = 0; l < Levels.Length; l++) graph.Append($"[tf{i}_{l}]");
            graph.Append(";\n");

            var open = Openness(mouth, rate, i);
            for (var l = 0; l < Levels.Length; l++)
            {
                var (from, strength) = Levels[l];
                var to = l + 1 < Levels.Length ? Levels[l + 1].From : (double?)null;
                var enable = to is null
                    ? $"gte({open},{FilterExpr.N(from)})"
                    : $"gte({open},{FilterExpr.N(from)})*lt({open},{FilterExpr.N(to.Value)})";

                var patch = $"tq{i}_{l}";
                graph.Append(strength >= 1
                    ? $"[tf{i}_{l}]null[{patch}];\n"
                    : $"[tf{i}_{l}]colorchannelmixer=aa={FilterExpr.N(strength)}[{patch}];\n");

                var last = i == count - 1 && l == Levels.Length - 1;
                var next = last ? output : $"tm{++stage}";
                graph.Append($"[tm{stage - (last ? 0 : 1)}][{patch}]overlay=x={x}:y={y}:format=rgb:eof_action=repeat")
                     .Append($":enable={FilterExpr.Quote(enable)}[{next}];\n");
            }
        }
    }

    /// <summary>The patch around a mouth in pixels, held inside the picture and never smaller than 2x2.</summary>
    internal static (int X, int Y, int W, int H) Patch(double mouthX, double mouthY, double faceWidth, int width, int height)
    {
        var face = faceWidth * width;
        var w = Math.Clamp((int)Math.Round(PatchWidth * face), 2, width);
        var h = Math.Clamp((int)Math.Round(PatchHeight * face), 2, height);
        var x = Math.Clamp((int)Math.Round(mouthX * width - w / 2.0), 0, width - w);
        var y = Math.Clamp((int)Math.Round(mouthY * height + PatchDrop * face - h / 2.0), 0, height - h);
        return (x, y, w, h);
    }

    /// <summary>
    /// How open the mouth is, 0 to 1: two out-of-step syllable waves while the character speaks, so it reads as words
    /// rather than a metronome, eased in and out at each line's ends and shut otherwise. Each mouth is shifted a little
    /// so two speakers never move together.
    /// </summary>
    internal static string Openness(MouthPlan mouth, FrameRate rate, int index)
    {
        if (mouth.SpeakingWindows.Count == 0) return "0";

        var ease = FilterExpr.N(EaseSeconds);
        var gates = mouth.SpeakingWindows.Select(w =>
            $"clip(min(t-{FilterExpr.Sec(w.Start, rate)},{FilterExpr.Sec(w.End, rate)}-t)/{ease},0,1)");
        var gate = string.Join("+", gates);
        if (mouth.SpeakingWindows.Count > 1) gate = $"min({gate},1)";

        var phase = FilterExpr.N(index * 0.7);
        return $"({gate})*(0.55*abs(sin(2*PI*2.2*t+{phase}))+0.45*abs(sin(2*PI*1.45*t+{phase}+1.3)))";
    }
}
