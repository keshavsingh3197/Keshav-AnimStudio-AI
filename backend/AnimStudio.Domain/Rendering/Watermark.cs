namespace AnimStudio.Domain.Rendering;

public enum WatermarkKind
{
    None = 0,

    /// <summary>A line of text, e.g. a site address, drawn straight onto the frame.</summary>
    Text = 1,

    /// <summary>A transparent PNG from the asset library, composited over the frame.</summary>
    Logo = 2
}

/// <summary>
/// Where the mark sits.
/// <para>
/// There is deliberately no centre option. A watermark in the middle of the frame covers
/// whatever the viewer came to see, and every value here keeps the mark inside a corner or
/// against an edge. <see cref="TopRight"/> is the default because it is the broadcast
/// convention, it is clear of the player's own bottom chrome (scrubber, timestamps,
/// captions) and clear of the top-left area where most platforms draw their own overlays.
/// </para>
/// </summary>
public enum WatermarkPosition
{
    TopRight = 0,
    TopLeft = 1,
    TopCenter = 2,
    BottomRight = 3,
    BottomLeft = 4,
    BottomCenter = 5
}

/// <summary>
/// A watermark, described in FRACTIONS of the canvas rather than pixels.
/// <para>
/// That is what makes one setting correct for 1920x1080 and for a 1080x1920 vertical cut
/// at the same time: the mark keeps its size relative to the frame, and its inset from the
/// edge scales with it, so it never ends up hugging the edge of a tall video or floating in
/// the middle of a small one. Pixels are computed once, against the project's canvas, at
/// plan time.
/// </para>
/// </summary>
public sealed class WatermarkSettings
{
    /// <summary>Mark height as a fraction of canvas height. ~5.5% of 1080 is about 59px.</summary>
    public const double DefaultHeightFraction = 0.055;

    /// <summary>
    /// Inset from both nearest edges, as a fraction of canvas HEIGHT - height on both axes
    /// on purpose, so the gap looks square rather than stretching on a wide canvas.
    /// </summary>
    public const double DefaultMarginFraction = 0.04;

    public WatermarkKind Kind { get; set; } = WatermarkKind.None;

    /// <summary>The line to draw. Single line, no control characters - see the validator.</summary>
    public string? Text { get; set; }

    /// <summary>An image asset in the same project. Transparency is respected.</summary>
    public string? LogoAssetId { get; set; }

    public WatermarkPosition Position { get; set; } = WatermarkPosition.TopRight;

    /// <summary>0 = invisible, 1 = solid. Below ~0.5 a mark stops surviving re-encoding.</summary>
    public double Opacity { get; set; } = 0.8;

    public double HeightFraction { get; set; } = DefaultHeightFraction;
    public double MarginFraction { get; set; } = DefaultMarginFraction;

    /// <summary>Text colour, "#RRGGBB". Ignored for a logo.</summary>
    public string ColorHex { get; set; } = "#FFFFFF";

    /// <summary>
    /// Opacity of the dark plate drawn behind text. 0 for no plate. Without it, white text
    /// disappears completely over a bright frame, which is the one failure mode a
    /// watermark cannot afford.
    /// </summary>
    public double BackplateOpacity { get; set; } = 0.3;

    public bool IsEnabled => Kind switch
    {
        WatermarkKind.Text => !string.IsNullOrWhiteSpace(Text),
        WatermarkKind.Logo => !string.IsNullOrWhiteSpace(LogoAssetId),
        _ => false
    };

    /// <summary>
    /// Clamps every fraction into a range that still produces a legible mark inside the
    /// frame. Called on the way in, so a stored spec is always renderable and the graph
    /// builder never has to defend itself against a 400%-tall watermark.
    /// </summary>
    public void Clamp()
    {
        Opacity = Clamped(Opacity, 0.15, 1.0, 0.8);
        HeightFraction = Clamped(HeightFraction, 0.02, 0.2, DefaultHeightFraction);
        MarginFraction = Clamped(MarginFraction, 0.0, 0.2, DefaultMarginFraction);
        BackplateOpacity = Clamped(BackplateOpacity, 0.0, 1.0, 0.3);
    }

    private static double Clamped(double value, double min, double max, double fallback) =>
        double.IsNaN(value) || double.IsInfinity(value)
            ? fallback
            : Math.Clamp(value, min, max);
}
