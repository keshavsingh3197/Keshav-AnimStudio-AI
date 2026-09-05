namespace AnimStudio.Domain.Rendering;

/// <summary>Ken Burns style motion applied to a scene's background image.</summary>
public enum BackgroundEffect
{
    None = 0,
    ZoomIn = 1,
    ZoomOut = 2,
    PanLeft = 3,
    PanRight = 4,
    PanUp = 5,
    PanDown = 6
}

public enum Easing
{
    Linear = 0,
    EaseInOut = 1
}

/// <summary>
/// Background motion plus scene-level fades. Intensity is the zoom amount or pan
/// travel as a fraction (0.15 => a 15% push in), so the same settings look the
/// same at any canvas size.
/// </summary>
public sealed record AnimationSettings(
    BackgroundEffect Background = BackgroundEffect.None,
    double Intensity = 0.15,
    Easing Easing = Easing.Linear,
    FrameCount FadeIn = default,
    FrameCount FadeOut = default)
{
    public static readonly AnimationSettings None = new();

    public void Validate(FrameCount sceneDuration)
    {
        if (Intensity is < 0 or > 1)
            throw new ArgumentOutOfRangeException(nameof(Intensity), "Intensity must be between 0 and 1.");
        if (FadeIn.Value < 0 || FadeOut.Value < 0)
            throw new ArgumentOutOfRangeException(nameof(FadeIn), "Fades cannot be negative.");
        if (FadeIn.Value + FadeOut.Value > sceneDuration.Value)
            throw new ArgumentException("Combined fades exceed the scene duration.", nameof(FadeIn));
    }
}
