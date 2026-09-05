namespace AnimStudio.Domain.Rendering;

/// <summary>
/// Transition between two consecutive scenes. Every value except None maps to an
/// ffmpeg xfade transition name and forces a full re-encode of the merged timeline;
/// None lets the merge run as a stream-copy concat instead.
/// </summary>
public enum SceneTransition
{
    None = 0,
    Fade = 1,
    Dissolve = 2,
    WipeLeft = 3,
    WipeRight = 4,
    SlideLeft = 5,
    SlideRight = 6,
    CircleOpen = 7,
    CircleClose = 8
}

public sealed record TransitionSettings(SceneTransition Kind, FrameCount Duration)
{
    public static readonly TransitionSettings None = new(SceneTransition.None, FrameCount.Zero);

    public bool IsCut => Kind == SceneTransition.None || Duration.Value <= 0;

    /// <summary>The ffmpeg xfade transition name, or null for a hard cut.</summary>
    public string? ToXfadeName() => Kind switch
    {
        SceneTransition.None => null,
        SceneTransition.Fade => "fade",
        SceneTransition.Dissolve => "dissolve",
        SceneTransition.WipeLeft => "wipeleft",
        SceneTransition.WipeRight => "wiperight",
        SceneTransition.SlideLeft => "slideleft",
        SceneTransition.SlideRight => "slideright",
        SceneTransition.CircleOpen => "circleopen",
        SceneTransition.CircleClose => "circleclose",
        _ => throw new ArgumentOutOfRangeException(nameof(Kind), Kind, "Unknown scene transition.")
    };
}
