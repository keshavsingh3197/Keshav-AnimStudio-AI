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

    /// <summary>
    /// A ceiling on timed music clips, matching the practical limit of what a timeline can
    /// show and what one amix filter chain should be asked to mix at once.
    /// </summary>
    public const int MaxMusicTracks = 12;

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

    /// <summary>
    /// Per-junction transition overrides, one entry per gap between consecutive clips
    /// (so <c>Count == AssetIds.Count - 1</c> when set). Empty means every junction uses
    /// the single <see cref="Transition"/>/<see cref="TransitionFrames"/> above - which
    /// keeps every existing job document, and every caller that never heard of junctions,
    /// reading exactly as it always did.
    /// </summary>
    public List<ClipJunctionSpec> Junctions { get; set; } = [];

    /// <summary>
    /// Extra music clips placed at their own point on the timeline, mixed in ADDITION to
    /// the single looped bed above. Each one keeps its own volume and, optionally, its own
    /// slice of the source file - "add music at any point" without disturbing the simple
    /// one-bed path most stitches still use.
    /// </summary>
    public List<TimedMusicClipSpec> MusicTracks { get; set; } = [];

    /// <summary>
    /// Per-clip sound: one entry per clip, in the same order as <see cref="AssetIds"/>
    /// (so <c>Count == AssetIds.Count</c> when set). Empty means every clip keeps its own
    /// audio at its own level, which is what every job written before this existed says.
    /// <para>
    /// Positional rather than keyed by asset id, for the same reason
    /// <see cref="Junctions"/> is: the running order may legitimately use the same clip
    /// twice, and those two placements are allowed to sound different.
    /// </para>
    /// </summary>
    public List<ClipAudioSpec> ClipAudio { get; set; } = [];
}

/// <summary>
/// One clip's sound.
/// <para>
/// Two independent things, because they answer different questions. <see cref="Volume"/>
/// is how loud the footage's OWN audio is - the one control that fixes a clip recorded far
/// too quietly or a clip full of wind noise. <see cref="AudioAssetId"/> is a different
/// sound for this clip alone: a voice-over, a sting, a music change for one segment. A
/// file either replaces the clip's own audio or sits on top of it, which is what
/// <see cref="KeepOriginalAudio"/> decides.
/// </para>
/// </summary>
public sealed class ClipAudioSpec
{
    /// <summary>
    /// Gain on the clip's own audio. 1 leaves it untouched, 0 silences it, and up to
    /// <see cref="MaxGain"/> lifts a clip that was recorded too quietly.
    /// </summary>
    public double Volume { get; set; } = 1.0;

    /// <summary>An audio (or video) asset whose sound plays over this clip. Null for none.</summary>
    public string? AudioAssetId { get; set; }

    public double AudioVolume { get; set; } = 1.0;

    /// <summary>
    /// With a sound of its own attached: mix it UNDER the clip's own audio rather than
    /// replacing it. Ignored when there is no <see cref="AudioAssetId"/>.
    /// </summary>
    public bool KeepOriginalAudio { get; set; }

    /// <summary>
    /// Loudest anything may be lifted, as a multiplier. +6dB is enough to rescue a quiet
    /// recording; past that, a clip is not quiet but broken, and boosting it only makes
    /// the noise floor louder.
    /// </summary>
    public const double MaxGain = 2.0;
}

/// <summary>One gap between two consecutive clips, and what plays across it.</summary>
public sealed class ClipJunctionSpec
{
    public SceneTransition Transition { get; set; } = SceneTransition.None;

    /// <summary>Clamped against the measured neighbouring clip lengths at render time.</summary>
    public int TransitionFrames { get; set; }
}

/// <summary>
/// One music (or other audio) asset, placed at a specific point on the finished
/// timeline rather than looped under the whole thing.
/// </summary>
public sealed class TimedMusicClipSpec
{
    public string AssetId { get; set; } = string.Empty;

    /// <summary>Where this clip starts, in seconds on the FINISHED timeline.</summary>
    public double StartSeconds { get; set; }

    public double Volume { get; set; } = 0.5;

    /// <summary>Optional window on the SOURCE file. Null on either end plays from/to the end.</summary>
    public double? TrimStartSeconds { get; set; }
    public double? TrimEndSeconds { get; set; }
}
