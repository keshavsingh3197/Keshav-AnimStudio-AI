using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// How a still moves over its time on screen - the camera moves that make a photo slideshow
/// read as footage instead of a slideshow.
/// </summary>
public enum ImageMotion
{
    None = 0,
    ZoomIn = 1,
    ZoomOut = 2,
    PanLeft = 3,
    PanRight = 4,
    PanUp = 5,
    PanDown = 6,

    /// <summary>A slow push in that also travels from the opposite corner towards the focus.</summary>
    Drift = 7,

    /// <summary>A held, slightly zoomed frame that sways like a camera on someone's shoulder.</summary>
    Handheld = 8,

    /// <summary>A gentle in-and-out zoom, one breath over the shot.</summary>
    Breathe = 9
}

/// <summary>A colour grade laid over a still after it moves.</summary>
public enum ImageLook
{
    None = 0,
    /// <summary>Teal shadows, warm highlights, a little extra contrast.</summary>
    Cinematic = 1,
    Warm = 2,
    Cool = 3,
    Vintage = 4,
    /// <summary>High-contrast black and white.</summary>
    Noir = 5,
    Vivid = 6,
    /// <summary>Lifted blacks and softened colour.</summary>
    Matte = 7
}

/// <summary>
/// Motion, grade and lens finish for one image clip, already validated: every number here
/// ends up inside an ffmpeg expression.
/// </summary>
/// <param name="Intensity">Zoom amount or pan travel as a fraction of the frame, 0.02-0.5.</param>
/// <param name="FocusX">Where a zoom heads, 0 (left edge) to 1 (right edge).</param>
/// <param name="FocusY">Where a zoom heads, 0 (top) to 1 (bottom).</param>
public sealed record CinematicImageSettings(
    ImageMotion Motion,
    double Intensity,
    double FocusX,
    double FocusY,
    Easing Easing,
    ImageLook Look,
    bool Vignette,
    bool Grain,
    bool CinemaBars)
{
    public const double MinIntensity = 0.02;
    public const double MaxIntensity = 0.5;
    public const double DefaultIntensity = 0.15;

    public bool Moves => Motion != ImageMotion.None;

    public bool IsEmpty =>
        Motion == ImageMotion.None && Look == ImageLook.None && !Vignette && !Grain && !CinemaBars;

    /// <summary>
    /// Settings from the studio's loosely typed fields; null when they ask for nothing, which
    /// keeps an image clip on exactly the static graph it always had.
    /// </summary>
    public static CinematicImageSettings? From(
        string? motion, double intensity, double focusXPercent, double focusYPercent,
        string? easing, string? look, bool vignette, bool grain, bool cinemaBars)
    {
        var settings = new CinematicImageSettings(
            ParseMotion(motion),
            double.IsFinite(intensity) ? Math.Clamp(intensity, MinIntensity, MaxIntensity) : DefaultIntensity,
            Focus(focusXPercent),
            Focus(focusYPercent),
            string.Equals(easing?.Trim(), "linear", StringComparison.OrdinalIgnoreCase) ? Easing.Linear : Easing.EaseInOut,
            ParseLook(look),
            vignette,
            grain,
            cinemaBars);

        return settings.IsEmpty ? null : settings;
    }

    public static ImageMotion ParseMotion(string? value) => Normalize(value) switch
    {
        "zoom-in" => ImageMotion.ZoomIn,
        "zoom-out" => ImageMotion.ZoomOut,
        "pan-left" => ImageMotion.PanLeft,
        "pan-right" => ImageMotion.PanRight,
        "pan-up" => ImageMotion.PanUp,
        "pan-down" => ImageMotion.PanDown,
        "drift" => ImageMotion.Drift,
        "handheld" => ImageMotion.Handheld,
        "breathe" => ImageMotion.Breathe,
        _ => ImageMotion.None
    };

    public static ImageLook ParseLook(string? value) => Normalize(value) switch
    {
        "cinematic" => ImageLook.Cinematic,
        "warm" => ImageLook.Warm,
        "cool" => ImageLook.Cool,
        "vintage" => ImageLook.Vintage,
        "noir" => ImageLook.Noir,
        "vivid" => ImageLook.Vivid,
        "matte" => ImageLook.Matte,
        _ => ImageLook.None
    };

    /// <summary>Studio sends percent; held to the frame, centre when missing or nonsense.</summary>
    private static double Focus(double percent) =>
        double.IsFinite(percent) ? Math.Clamp(percent, 0, 100) / 100 : 0.5;

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToLowerInvariant();
}
