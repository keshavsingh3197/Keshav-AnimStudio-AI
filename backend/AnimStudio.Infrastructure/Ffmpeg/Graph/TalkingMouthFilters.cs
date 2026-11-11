using System.Text;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Makes characters painted into a still talk. For each mouth a patch from the upper lip to the chin is cut out of the
/// picture, stretched downwards in time with the speech and laid back with feathered edges, which reads as the jaw
/// opening and closing - the motion-comic look, with no sprite and no video model.
/// <para>
/// It runs on the picture at its own size, before the camera move, so the jaw rides along with any push or pan. Every
/// position is an expression of the picture's own width and height, which the graph never needs to know.
/// </para>
/// </summary>
internal static class TalkingMouthFilters
{
    /// <summary>Patch width and height, and how far above the mouth's middle it starts, as fractions of the face's width.</summary>
    private const double PatchWidth = 0.62;
    private const double PatchHeight = 0.40;
    private const double PatchLift = 0.06;

    /// <summary>How far the jaw drops at its widest: the patch grows by this fraction of its height.</summary>
    private const double JawDrop = 0.28;

    /// <summary>
    /// Appends the chain from <paramref name="input"/> to <paramref name="output"/>. Each mouth's patch is a split of
    /// the same frame, so they all move against the unchanged picture.
    /// </summary>
    public static void Append(StringBuilder graph, string input, string output, IReadOnlyList<MouthPlan> mouths, FrameRate rate)
    {
        var count = mouths.Count;
        graph.Append($"[{input}]format=rgba,split={FilterExpr.N(count + 1)}[tm0]");
        for (var i = 0; i < count; i++) graph.Append($"[tp{i}]");
        graph.Append(";\n");

        for (var i = 0; i < count; i++)
        {
            var mouth = mouths[i];
            var w = FilterExpr.N(PatchWidth * mouth.FaceWidth);
            var h = FilterExpr.N(PatchHeight * mouth.FaceWidth);
            var lift = FilterExpr.N(PatchLift * mouth.FaceWidth);
            var x = FilterExpr.N(mouth.X);
            var y = FilterExpr.N(mouth.Y);

            var cropX = $"max(0,min(iw-ow,iw*{x}-ow/2))";
            var cropY = $"max(0,min(ih-oh,ih*{y}-iw*{lift}))";
            var height = $"trunc(ih*(1+{FilterExpr.N(JawDrop)}*{Open(mouth, rate, i)})/2)*2";
            var feather = "255*clip((1-hypot((X-W/2)/(W/2),(Y-H*0.45)/(H*0.55)))*3,0,1)";

            graph.Append($"[tp{i}]crop=w={FilterExpr.Quote($"min(iw,iw*{w})")}:h={FilterExpr.Quote($"min(ih,iw*{h})")}")
                 .Append($":x={FilterExpr.Quote(cropX)}:y={FilterExpr.Quote(cropY)},")
                 .Append($"scale=w=iw:h={FilterExpr.Quote(height)}:eval=frame,")
                 .Append($"geq=r={FilterExpr.Quote("r(X,Y)")}:g={FilterExpr.Quote("g(X,Y)")}:b={FilterExpr.Quote("b(X,Y)")}:a={FilterExpr.Quote(feather)}[tq{i}];\n");

            // The same corner the patch was cut from: its width is unchanged, its uncropped height is the crop's.
            var overlayX = $"max(0,min(W-w,W*{x}-w/2))";
            var overlayY = $"max(0,min(H-min(H,W*{h}),H*{y}-W*{lift}))";
            var next = i == count - 1 ? output : $"tm{i + 1}";
            graph.Append($"[tm{i}][tq{i}]overlay=x={FilterExpr.Quote(overlayX)}:y={FilterExpr.Quote(overlayY)}")
                 .Append($":eval=init:format=rgb[{next}];\n");
        }
    }

    /// <summary>
    /// How open the mouth is, 0 to 1: two out-of-step waves while the character speaks, so it reads as words rather
    /// than a metronome, and shut otherwise. Each mouth is shifted a little so two speakers never flap together.
    /// </summary>
    internal static string Open(MouthPlan mouth, FrameRate rate, int index)
    {
        var speaking = SpriteOverlayFilters.Speaking(mouth.SpeakingWindows, rate);
        var phase = FilterExpr.N(index * 0.7);
        return $"({speaking})*(0.6*abs(sin(2*PI*2.3*t+{phase}))+0.4*abs(sin(2*PI*3.7*t+{phase}+1)))";
    }
}
