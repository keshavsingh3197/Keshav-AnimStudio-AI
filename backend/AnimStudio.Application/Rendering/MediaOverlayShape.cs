namespace AnimStudio.Application.Rendering;

/// <summary>The outline an image or video overlay is cut to.</summary>
public enum OverlayShape
{
    Rect = 0,
    Rounded = 1,
    Circle = 2
}

/// <summary>
/// Shape, ring and entrance/exit rules for image and video overlays - the same numbers the
/// studio preview draws with (frame-media.ts). Change one here and it must change there.
/// </summary>
public static class MediaOverlayShape
{
    /// <summary>Thickest ring, in 360-reference pixels.</summary>
    public const double MaxBorderWidth = 24;

    public const double MinAspectRatio = 0.05;
    public const double MaxAspectRatio = 20;

    /// <summary>Corner radius of <see cref="OverlayShape.Rounded"/>, as a share of the short side.</summary>
    public const double RoundedCornerShare = 0.12;

    /// <summary>How far an image or video slides in or out, as a share of the frame along that axis.</summary>
    public const double SlideShare = 0.25;

    /// <summary>The size a zoom entrance starts from (and an exit shrinks to), as a share of full size.</summary>
    public const double ZoomFrom = 0.5;

    public static OverlayShape Parse(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "rounded" => OverlayShape.Rounded,
        "circle" => OverlayShape.Circle,
        _ => OverlayShape.Rect
    };

    /// <summary>The ring width held to its range; zero when not finite.</summary>
    public static double ClampBorder(double width) =>
        double.IsFinite(width) ? Math.Clamp(width, 0, MaxBorderWidth) : 0;

    /// <summary>The aspect held to its range, or null when missing or nonsense.</summary>
    public static double? ClampAspect(double? aspect) =>
        aspect is { } a && double.IsFinite(a) && a > 0 ? Math.Clamp(a, MinAspectRatio, MaxAspectRatio) : null;

    /// <summary>A crop edge in percent, held so the four edges always leave at least 1% showing.</summary>
    public static double ClampCrop(double percent) =>
        double.IsFinite(percent) ? Math.Clamp(percent, 0, 49.5) : 0;
}
