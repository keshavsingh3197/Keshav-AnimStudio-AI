namespace AnimStudio.Domain.Rendering;

/// <summary>Output geometry and frame rate for a render.</summary>
public sealed record Canvas(int Width, int Height, FrameRate FrameRate)
{
    public static readonly Canvas Hd1080p30 = new(1920, 1080, FrameRate.Fps30);
    public static readonly Canvas Hd720p30 = new(1280, 720, FrameRate.Fps30);
    public static readonly Canvas Vertical1080x1920 = new(1080, 1920, FrameRate.Fps30);
    public static readonly Canvas Square1080 = new(1080, 1080, FrameRate.Fps30);

    public void Validate()
    {
        FrameRate.Validate();
        if (Width <= 0 || Height <= 0)
            throw new ArgumentOutOfRangeException(nameof(Width), "Canvas dimensions must be positive.");
        // yuv420p chroma subsampling requires even dimensions; libx264 rejects odd ones.
        if (Width % 2 != 0 || Height % 2 != 0)
            throw new ArgumentException("Canvas dimensions must be even for yuv420p output.", nameof(Width));
    }

    public string Size => $"{Width}x{Height}";
}
