namespace AnimStudio.Domain.Rendering;

/// <summary>
/// What a video of a given shape IS, in the terms the places it gets published use.
/// <para>
/// Derived from the canvas and never stored: the shape is the only thing that decides
/// which shelf a finished file lands on, so a stored label could only ever disagree with
/// it - resize a project and the label would be a lie.
/// </para>
/// <para>
/// <see cref="Short"/> is a claim about SHAPE, not about duration. YouTube publishes an
/// upright or square video as a Short when it also runs three minutes or less (sixty
/// seconds until October 2024); past that the same file goes out as an ordinary video.
/// Length is known only once the clips are in hand, so the duration half of that rule is
/// checked where the timeline is, not here.
/// </para>
/// </summary>
public enum VideoFormat
{
    /// <summary>Landscape. The ordinary YouTube shape.</summary>
    Video = 0,

    /// <summary>Upright. What Shorts, Reels and TikTok expect.</summary>
    Short = 1,

    /// <summary>Neither, and accepted as a Short too - but it does not fill a phone.</summary>
    Square = 2
}

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

    /// <summary>What this shape makes. See <see cref="VideoFormat"/>.</summary>
    public VideoFormat Format => Describe(Width, Height);

    /// <summary>
    /// The same rule, for callers holding a bare width and height rather than a canvas -
    /// so there is one definition of "this is a Short" on the server.
    /// </summary>
    public static VideoFormat Describe(int width, int height) =>
        height > width ? VideoFormat.Short
        : height == width ? VideoFormat.Square
        : VideoFormat.Video;
}
