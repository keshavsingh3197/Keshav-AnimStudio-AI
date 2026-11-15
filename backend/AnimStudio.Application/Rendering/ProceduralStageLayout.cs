namespace AnimStudio.Application.Rendering;

/// <summary>
/// Where one main character stands on the frame, as fractions of the frame: <see cref="X"/> is the centre of the
/// figure across the width, <see cref="Y"/> is the ground line (the feet) down the height, and <see cref="Scale"/>
/// multiplies the default figure size.
/// </summary>
public sealed record ProceduralStagePlacement(double X, double Y, double Scale)
{
    public const double MinScale = 0.5;
    public const double MaxScale = 1.8;

    /// <summary>
    /// Keeps a placement inside the frame: the ground line stays between 25% and 95% of the height so the
    /// figure (drawn upward from it) is never cut off at the top or hidden under the bottom edge.
    /// </summary>
    public static ProceduralStagePlacement Clamp(double x, double y, double scale) => new(
        Math.Round(Math.Clamp(Finite(x, 0.5), 0.05, 0.95), 4),
        Math.Round(Math.Clamp(Finite(y, 0.6), 0.25, 0.95), 4),
        Math.Round(Math.Clamp(Finite(scale, 1.0), MinScale, MaxScale), 3));

    private static double Finite(double value, double fallback) =>
        double.IsFinite(value) ? value : fallback;
}

/// <summary>
/// Optional stage arrangement for the procedural renderer. Without it the stage keeps its built-in places.
/// </summary>
/// <param name="Left">Placement of the left main character, or null for the default place.</param>
/// <param name="Right">Placement of the right main character, or null for the default place.</param>
/// <param name="TemplateBackdrop">
/// True when the backdrop is a user-supplied template picture: it is shown still and whole (no zoom or pan, so
/// characters placed on it stay on their spot), and the theme's abstract 3D geometry is not drawn over it. Light
/// and particle effects and the characters still play on top.
/// </param>
public sealed record ProceduralStageLayout(
    ProceduralStagePlacement? Left,
    ProceduralStagePlacement? Right,
    bool TemplateBackdrop);
