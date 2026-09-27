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

    /// <summary>
    /// Ceiling on the duck envelope. Each window adds a term to one ffmpeg expression, and a
    /// runaway list would build a filtergraph too long for the command line.
    /// </summary>
    public const int MaxDuckWindows = 200;

    /// <summary>Video asset ids in playback order.</summary>
    public string? ExportName { get; set; }
    public List<string> AssetIds { get; set; } = [];

    /// <summary>How clips shaped differently from the canvas are fitted to it.</summary>
    public ClipFit Fit { get; set; } = ClipFit.Contain;

    /// <summary>Custom output resolution override (e.g. 1080x1920 for Shorts conversion).</summary>
    public int? OutputWidth { get; set; }
    public int? OutputHeight { get; set; }

    public WatermarkSettings Watermark { get; set; } = new();
    public OutroSettings Outro { get; set; } = new();

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
    /// Stretches where the music drops under the clips above it, already merged and in
    /// timeline order. Empty means the music holds one level throughout.
    /// </summary>
    public List<MusicDuckWindowSpec> MusicDuckWindows { get; set; } = [];

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

    public List<TimelineItemSpec> TimelineItems { get; set; } = [];
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

    /// <summary>Optional window on the SOURCE file. Null on either end plays from/to the end.</summary>
    public double? TrimStartSeconds { get; set; }
    public double? TrimEndSeconds { get; set; }

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

    /// <summary>
    /// Seconds the right clip (clip k+1) contributes at its head for the dissolve overlap.
    /// The conform pass freezes the first real frame for this window when
    /// <see cref="FreezeHead"/> is true, or widens the decode window when false.
    /// </summary>
    public double LeadInSeconds { get; set; }

    /// <summary>
    /// Seconds the left clip (clip k) contributes at its tail for the dissolve overlap.
    /// The conform pass freezes the last real frame for this window when
    /// <see cref="FreezeTail"/> is true, or widens the decode window when false.
    /// </summary>
    public double TailOutSeconds { get; set; }

    /// <summary>
    /// True when <see cref="LeadInSeconds"/> must be satisfied with a frozen first frame
    /// rather than real footage before the trim in-point.
    /// </summary>
    public bool FreezeHead { get; set; }

    /// <summary>
    /// True when <see cref="TailOutSeconds"/> must be satisfied with a frozen last frame
    /// rather than real footage after the trim out-point.
    /// </summary>
    public bool FreezeTail { get; set; }
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

/// <summary>One stretch of the finished timeline over which the music plays quieter.</summary>
public sealed class MusicDuckWindowSpec
{
    /// <summary>Start on the FINISHED timeline, in seconds.</summary>
    public double StartSeconds { get; set; }

    /// <summary>End on the FINISHED timeline, in seconds.</summary>
    public double EndSeconds { get; set; }

    /// <summary>Multiplier applied across the window. 1 is no duck, 0 silence.</summary>
    public double Level { get; set; } = 1.0;
}

public sealed class TimelineItemTextStyleSpec
{
    public double FontSize { get; set; } = 36;
    public string Color { get; set; } = "#ffffff";
    public string BackgroundColor { get; set; } = "rgba(0,0,0,0.6)";
    public string Position { get; set; } = "bottom";
    public string? TransitionIn { get; set; } = "fade";
    public double TransitionInDuration { get; set; } = 0.5;
    public string? TransitionOut { get; set; } = "fade";
    public double TransitionOutDuration { get; set; } = 0.5;
}

public sealed class TimelineItemTransformSpec
{
    public double Scale { get; set; } = 1.0;

    /// <summary>Normalized percentage offset [-50, 50] from canvas centre on X axis.</summary>
    public double X { get; set; }

    /// <summary>Normalized percentage offset [-50, 50] from canvas centre on Y axis.</summary>
    public double Y { get; set; }

    public double Opacity { get; set; } = 1.0;

    /// <summary>Clockwise rotation in degrees.</summary>
    public double Rotation { get; set; }

    /// <summary>Pixels to crop from left as a percentage of source width [0–99].</summary>
    public double CropLeft { get; set; }

    /// <summary>Pixels to crop from right as a percentage of source width [0–99].</summary>
    public double CropRight { get; set; }

    /// <summary>Pixels to crop from top as a percentage of source height [0–99].</summary>
    public double CropTop { get; set; }

    /// <summary>Pixels to crop from bottom as a percentage of source height [0–99].</summary>
    public double CropBottom { get; set; }

    /// <summary>Whether video stabilization post-process is requested for this clip.</summary>
    public bool Stabilization { get; set; }

    public string? TransitionIn { get; set; } = "fade";
    public double TransitionInDuration { get; set; } = 0.5;
    public string? TransitionOut { get; set; } = "fade";
    public double TransitionOutDuration { get; set; } = 0.5;

    /// <summary>Returns true when any crop edge is non-zero (crop filter needed).</summary>
    public bool HasCrop => CropLeft > 0 || CropRight > 0 || CropTop > 0 || CropBottom > 0;
}

public sealed class TimelineItemSpec
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "video";
    public string TrackId { get; set; } = "V1";
    public double StartTime { get; set; }
    public double Duration { get; set; }
    public string Src { get; set; } = string.Empty;
    public string? Name { get; set; }
    public TimelineItemTransformSpec? Transform { get; set; }
    public TimelineItemTextStyleSpec? TextStyle { get; set; }
    public double? Volume { get; set; }
    public double? TrimStartSeconds { get; set; }
    public double? TrimEndSeconds { get; set; }
}
