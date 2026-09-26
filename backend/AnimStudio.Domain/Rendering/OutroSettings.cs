namespace AnimStudio.Domain.Rendering;

public enum OutroKind
{
    None = 0,

    /// <summary>A video bumper (MP4/WebM) attached at the end of the video.</summary>
    Video = 1,

    /// <summary>A static graphic or end-card image (PNG/JPG/WEBP) held for a specified duration.</summary>
    Image = 2
}

/// <summary>
/// Channel bumper or outro end-card attached to the end of rendered videos.
/// </summary>
public sealed class OutroSettings
{
    public OutroKind Kind { get; set; } = OutroKind.None;

    /// <summary>Asset ID or storage key of the outro video or end-card graphic.</summary>
    public string? AssetId { get; set; }

    /// <summary>Duration in seconds to display an end-card image (default: 4.0s).</summary>
    public double DurationSeconds { get; set; } = 4.0;

    /// <summary>Transition leading into the outro bumper.</summary>
    public SceneTransition Transition { get; set; } = SceneTransition.Fade;

    /// <summary>Transition duration in frames (default: 15 frames = 0.5s at 30fps).</summary>
    public int TransitionDurationFrames { get; set; } = 15;

    public bool IsEnabled => Kind switch
    {
        OutroKind.Video or OutroKind.Image => !string.IsNullOrWhiteSpace(AssetId),
        _ => false
    };

    public void Clamp()
    {
        DurationSeconds = Math.Clamp(DurationSeconds, 1.0, 30.0);
        TransitionDurationFrames = Math.Clamp(TransitionDurationFrames, 0, 120);
    }
}
