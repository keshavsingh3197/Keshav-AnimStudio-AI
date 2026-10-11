using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Turns a still image clip into a shot: a camera move via zoompan, then a colour grade and
/// an optional lens finish (vignette, grain, cinema bars).
/// <para>
/// The move follows <see cref="BackgroundMotionFilters"/>: <c>d=1</c> so <c>on</c> is the
/// absolute output frame and every move is a closed-form function of it, the rate always
/// stated, and the still fitted at a multiple of the canvas first so zoompan's whole-pixel
/// crop steps by sub-pixels once it scales back down.
/// </para>
/// </summary>
internal static class CinematicImageFilters
{
    /// <summary>The zoompan step: supersampled frames in, canvas-size frames out.</summary>
    public static string Motion(CinematicImageSettings settings, Canvas canvas, int frames)
    {
        var p = FilterExpr.Progress(Math.Max(frames, 1), settings.Easing);
        var i = FilterExpr.N(settings.Intensity);
        var fx = FilterExpr.N(settings.FocusX);
        var fy = FilterExpr.N(settings.FocusY);
        var fps = FilterExpr.N(canvas.FrameRate.AsDouble);

        // Crop origin that keeps the focus point where it sits in the frame as the zoom grows.
        var focusX = $"(iw-iw/zoom)*{fx}";
        var focusY = $"(ih-ih/zoom)*{fy}";
        const string midX = "(iw-iw/zoom)/2";
        const string midY = "(ih-ih/zoom)/2";

        // Seconds into the shot, for the moves that sway rather than travel.
        var t = $"on/{fps}";

        var (zoom, x, y) = settings.Motion switch
        {
            ImageMotion.ZoomIn => ($"1+{i}*({p})", focusX, focusY),
            ImageMotion.ZoomOut => ($"(1+{i})-{i}*({p})", focusX, focusY),

            // A pan needs a zoom above 1 to have anywhere to travel, so these pin the zoom.
            ImageMotion.PanLeft => ($"1+{i}", $"(iw-iw/zoom)*(1-({p}))", focusY),
            ImageMotion.PanRight => ($"1+{i}", $"(iw-iw/zoom)*({p})", focusY),
            ImageMotion.PanUp => ($"1+{i}", focusX, $"(ih-ih/zoom)*(1-({p}))"),
            ImageMotion.PanDown => ($"1+{i}", focusX, $"(ih-ih/zoom)*({p})"),

            // Starts half pushed in so there is room to travel, from the corner opposite the
            // focus towards it.
            ImageMotion.Drift => (
                $"1+{i}*(0.5+0.5*({p}))",
                $"(iw-iw/zoom)*((1-{fx})*(1-({p}))+{fx}*({p}))",
                $"(ih-ih/zoom)*((1-{fy})*(1-({p}))+{fy}*({p}))"),

            // Two sines per axis at unrelated rates, so the sway never visibly repeats. The
            // amplitudes sum to 0.5, which keeps the crop inside the frame.
            ImageMotion.Handheld => (
                $"1+{i}",
                $"(iw-iw/zoom)*(0.5+0.32*sin({t}*1.13)+0.18*sin({t}*2.71+1.3))",
                $"(ih-ih/zoom)*(0.5+0.3*sin({t}*0.87+2.1)+0.2*sin({t}*2.23+0.4))"),

            // In and back out once over the shot, around the focus.
            ImageMotion.Breathe => ($"1+{i}*0.5*(1-cos(2*PI*({p})))", focusX, focusY),

            _ => ("1", midX, midY)
        };

        return $"zoompan=z={FilterExpr.Quote(zoom)}:x={FilterExpr.Quote(x)}:y={FilterExpr.Quote(y)}"
             + $":d=1:s={canvas.Size}:fps={fps}";
    }

    /// <summary>
    /// The grade and lens finish as one comma-joined chain; empty when none is asked for.
    /// Every filter here works on the canvas-size frame, after the move.
    /// </summary>
    public static string Finish(CinematicImageSettings settings, Canvas canvas)
    {
        var steps = new List<string>();

        var look = Look(settings.Look);
        if (look.Length > 0) steps.Add(look);

        if (settings.Vignette) steps.Add("vignette=angle=PI/5");

        // Temporal + uniform noise: changes every frame like film, without clumping.
        if (settings.Grain) steps.Add("noise=alls=10:allf=t+u");

        var bar = CinemaBarPixels(canvas);
        if (settings.CinemaBars && bar > 0)
        {
            steps.Add($"drawbox=x=0:y=0:w=iw:h={bar}:color=black:t=fill");
            steps.Add($"drawbox=x=0:y=ih-{bar}:w=iw:h={bar}:color=black:t=fill");
        }

        return string.Join(",", steps);
    }

    /// <summary>
    /// Height of each bar: a landscape frame is cut to 2.39:1 scope; a square or portrait one
    /// has no scope to match, so it gets a fixed 8% band top and bottom.
    /// </summary>
    internal static int CinemaBarPixels(Canvas canvas)
    {
        var bar = canvas.Width > canvas.Height
            ? (canvas.Height - canvas.Width / 2.39) / 2
            : canvas.Height * 0.08;
        return Math.Max(0, (int)Math.Round(bar / 2) * 2);
    }

    private static string Look(ImageLook look) => look switch
    {
        ImageLook.Cinematic =>
            "colorbalance=rs=-0.05:gs=-0.01:bs=0.07:rh=0.07:gh=0.02:bh=-0.07,eq=contrast=1.08:saturation=1.12",
        ImageLook.Warm => "colorbalance=rs=0.08:gs=0.02:bs=-0.08:rm=0.05:bm=-0.05",
        ImageLook.Cool => "colorbalance=rs=-0.06:bs=0.08:rm=-0.04:bm=0.06",
        ImageLook.Vintage => "curves=preset=vintage,eq=saturation=0.85",
        ImageLook.Noir => "hue=s=0,eq=contrast=1.3:brightness=-0.03",
        ImageLook.Vivid => "eq=saturation=1.4:contrast=1.06",
        ImageLook.Matte => "curves=all='0/0.08 1/0.92',eq=saturation=0.85",
        _ => string.Empty
    };
}
