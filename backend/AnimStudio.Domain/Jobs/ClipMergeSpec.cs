using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Jobs;

/// <summary>
/// What a render job is for. Both kinds share one queue, one lease, one progress record
/// and one download endpoint, because everything that makes the queue safe - the atomic
/// claim, lease expiry, cancellation, the retry cap - is worth exactly as much to a clip
/// stitch as to a project render, and none of it is worth writing twice.
/// </summary>
public enum RenderJobKind
{
    /// <summary>Scenes composited from backgrounds, sprites and dialogue, then merged.</summary>
    Project = 0,

    /// <summary>Whole video clips normalized to one canvas, watermarked and joined.</summary>
    ClipMerge = 1
}

/// <summary>
/// A clip stitch: which clips, in what order, joined how, marked how.
/// <para>
/// The ORDER OF <see cref="AssetIds"/> IS THE EDIT. There is no separate sequence number
/// to keep in step with it, which is what makes "drag to reorder" and "paste a running
/// order" two ways of writing the same field rather than two features.
/// </para>
/// </summary>
public sealed class ClipMergeSpec
{
    /// <summary>
    /// A ceiling, not a target. Every clip is normalized in its own ffmpeg pass and the
    /// join then opens all of them at once, so an unbounded list is a way to run a machine
    /// out of file handles from a single HTTP request.
    /// </summary>
    public const int MaxClips = 60;

    /// <summary>Video asset ids in playback order.</summary>
    public List<string> AssetIds { get; set; } = [];

    /// <summary>How clips shaped differently from the canvas are fitted to it.</summary>
    public ClipFit Fit { get; set; } = ClipFit.Contain;

    public WatermarkSettings Watermark { get; set; } = new();

    /// <summary>None joins the clips as hard cuts, which is also the only stream-copy path.</summary>
    public SceneTransition Transition { get; set; } = SceneTransition.None;

    /// <summary>
    /// Crossfade length between consecutive clips. Clamped against the ACTUAL measured
    /// clip lengths at render time, not here: a 1-second transition is fine between two
    /// ten-second clips and impossible between two half-second ones.
    /// </summary>
    public int TransitionFrames { get; set; }

    /// <summary>Optional bed mixed under the whole stitch. Forces a re-encode of the join.</summary>
    public string? BackgroundMusicAssetId { get; set; }

    public double BackgroundMusicVolume { get; set; } = 0.18;

    /// <summary>
    /// Drops each clip's own audio and keeps only the music bed. Useful for a reel cut
    /// from screen recordings, where the source audio is room noise.
    /// </summary>
    public bool MuteClipAudio { get; set; }
}
