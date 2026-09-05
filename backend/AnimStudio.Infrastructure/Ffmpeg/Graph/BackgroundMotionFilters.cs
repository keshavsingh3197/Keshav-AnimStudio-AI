using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Ken Burns background motion via zoompan.
/// <para>
/// Two non-obvious requirements are encoded here. zoompan defaults to 25fps, so the rate
/// must always be stated or a 12-second scene silently becomes 300 frames instead of 360.
/// And <c>d=1</c> (one output frame per input frame) makes <c>on</c> the absolute output
/// frame index, which lets every effect be a closed-form function of the frame number -
/// including zoom-out, which otherwise needs an awkward accumulator workaround.
/// </para>
/// </summary>
internal static class BackgroundMotionFilters
{
    public static string Build(AnimationSettings animation, Canvas canvas, FrameCount duration)
    {
        var frames = Math.Max(duration.Value, 1);
        var progress = FilterExpr.Progress(frames, animation.Easing);
        var intensity = FilterExpr.N(animation.Intensity);
        var size = canvas.Size;
        var fps = FilterExpr.N(canvas.FrameRate.AsDouble);

        // Centred crop expressions, reused by the zoom effects.
        const string centreX = "iw/2-(iw/zoom/2)";
        const string centreY = "ih/2-(ih/zoom/2)";

        var (zoom, x, y) = animation.Background switch
        {
            BackgroundEffect.ZoomIn => ($"1+{intensity}*({progress})", centreX, centreY),
            BackgroundEffect.ZoomOut => ($"(1+{intensity})-{intensity}*({progress})", centreX, centreY),

            // A pan needs a zoom above 1 to have anywhere to travel, so these pin the zoom
            // and animate the crop origin instead.
            BackgroundEffect.PanLeft =>
                ($"1+{intensity}", $"(iw-iw/zoom)*(1-({progress}))", "(ih-ih/zoom)/2"),
            BackgroundEffect.PanRight =>
                ($"1+{intensity}", $"(iw-iw/zoom)*({progress})", "(ih-ih/zoom)/2"),
            BackgroundEffect.PanUp =>
                ($"1+{intensity}", "(iw-iw/zoom)/2", $"(ih-ih/zoom)*(1-({progress}))"),
            BackgroundEffect.PanDown =>
                ($"1+{intensity}", "(iw-iw/zoom)/2", $"(ih-ih/zoom)*({progress})"),

            _ => ("1", centreX, centreY)
        };

        return $"zoompan=z={FilterExpr.Quote(zoom)}:x={FilterExpr.Quote(x)}:y={FilterExpr.Quote(y)}"
             + $":d=1:s={size}:fps={fps}";
    }

    /// <summary>
    /// Supersampled letterbox for the background before motion is applied. zoompan
    /// quantizes its crop to whole source pixels, so a slow move at 1:1 visibly steps;
    /// working at 2x and letting zoompan downscale makes that step sub-pixel. This is the
    /// single biggest visual-quality lever in the pipeline.
    /// </summary>
    public static string Prepare(Canvas canvas, int supersample)
    {
        var factor = Math.Max(supersample, 1);
        var width = canvas.Width * factor;
        var height = canvas.Height * factor;

        return $"scale={width}:{height}:force_original_aspect_ratio=decrease,"
             + $"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=black,"
             // Some JPEGs carry a non-1 sample aspect ratio, which makes overlay and
             // xfade reject the stream later on.
             + "setsar=1";
    }
}
