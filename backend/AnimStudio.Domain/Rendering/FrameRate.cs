namespace AnimStudio.Domain.Rendering;

/// <summary>
/// An exact rational frame rate. Kept rational rather than a double so that
/// frame-to-second conversions are exact and reproducible.
/// </summary>
public readonly record struct FrameRate(int Num, int Den)
{
    public static readonly FrameRate Fps24 = new(24, 1);
    public static readonly FrameRate Fps25 = new(25, 1);
    public static readonly FrameRate Fps30 = new(30, 1);
    public static readonly FrameRate Fps60 = new(60, 1);

    public double AsDouble => (double)Num / Den;

    /// <summary>The form ffmpeg's -r and fps= options expect, e.g. "30/1".</summary>
    public string ToFfmpegRate() => $"{Num}/{Den}";

    public void Validate()
    {
        if (Num <= 0 || Den <= 0)
            throw new ArgumentOutOfRangeException(nameof(Num), "Frame rate must be positive.");
    }
}
