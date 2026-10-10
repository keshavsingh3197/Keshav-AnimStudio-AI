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
    public const int MaxClips = 1000;

    /// <summary>
    /// A ceiling on timed music clips, matching the practical limit of what a timeline can
    /// show and what one amix filter chain should be asked to mix at once.
    /// </summary>
    public const int MaxMusicTracks = 100;

    /// <summary>
    /// Ceiling on the duck envelope. Each window adds a term to one ffmpeg expression, and a
    /// runaway list would build a filtergraph too long for the command line.
    /// </summary>
    public const int MaxDuckWindows = 2000;

    /// <summary>Video asset ids in playback order.</summary>
    public string? ExportName { get; set; }
    public List<string> AssetIds { get; set; } = [];

    /// <summary>How clips shaped differently from the canvas are fitted to it.</summary>
    public ClipFit Fit { get; set; } = ClipFit.Contain;

    /// <summary>
    /// <c>#rrggbb</c> the <see cref="ClipFit.Contain"/> bars are filled with - the space
    /// above and below a wide clip in a Short, where a headline or caption usually goes.
    /// Null is black, which is what every job written before this existed says.
    /// </summary>
    public string? BackgroundColor { get; set; }

    /// <summary>Custom output resolution override (e.g. 1080x1920 for Shorts conversion).</summary>
    public int? OutputWidth { get; set; }
    public int? OutputHeight { get; set; }

    /// <summary>Picture quality of the delivered encode. Defaults to High.</summary>
    public ExportQuality Quality { get; set; } = ExportQuality.High;

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

    /// <summary>Level the finished mix to YouTube's loudness target (-14 LUFS). False on every job written before it existed.</summary>
    public bool YouTubeLoudness { get; set; }

    /// <summary>
    /// Seconds the last clip's final frame is held before the outro, so the outro starts
    /// once the music or text running past the clips has finished. Zero on older jobs.
    /// </summary>
    public double OutroHoldSeconds { get; set; }
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

    /// <summary>A voiceover line: music ducks under it, and it never ducks itself.</summary>
    public bool IsVoiceover { get; set; }
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
    /// <summary>
    /// Size in pixels on a frame whose SHORT side is 360 - the size the studio monitor
    /// shows it at. The render scales it to the real canvas, so a caption is the same
    /// share of the picture in the preview and in the 1080x1920 export.
    /// </summary>
    public double FontSize { get; set; } = 36;
    public string Color { get; set; } = "#ffffff";

    /// <summary>
    /// The CSS colour older clients sent for the plate. Read only when
    /// <see cref="BoxStyle"/> is absent; <see cref="BoxColor"/>/<see cref="BoxOpacity"/>
    /// replace it.
    /// </summary>
    public string BackgroundColor { get; set; } = "rgba(0,0,0,0.6)";

    /// <summary>top, center, bottom - or custom, which places it at <see cref="X"/>/<see cref="Y"/>.</summary>
    public string Position { get; set; } = "bottom";

    /// <summary>Centre of the text block, in percent of the frame. Used when Position is custom.</summary>
    public double? X { get; set; }
    public double? Y { get; set; }

    /// <summary>none, box (a plate behind each line) or band (a full-width strip). Null on older jobs.</summary>
    public string? BoxStyle { get; set; }

    /// <summary><c>#rrggbb</c>.</summary>
    public string? BoxColor { get; set; }

    /// <summary>0-1.</summary>
    public double? BoxOpacity { get; set; }

    /// <summary><c>#rrggbb</c>; ignored while <see cref="OutlineWidth"/> is zero.</summary>
    public string? OutlineColor { get; set; }

    /// <summary>Stroke width, in the same 360-reference pixels as <see cref="FontSize"/>.</summary>
    public double OutlineWidth { get; set; }

    public bool Shadow { get; set; }
    public bool Uppercase { get; set; }

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

    /// <summary>
    /// Areas of the SOURCE frame to wipe before anything else happens to it - another
    /// channel's logo or a stock-site mark burned into footage the user is licensed to
    /// edit. Applied ahead of crop and fit, so the region means the same patch of the
    /// footage however the clip is later framed, and our own watermark is drawn after.
    /// </summary>
    public List<EraseRegionSpec> EraseRegions { get; set; } = [];
}

/// <summary>How an erased region is filled.</summary>
public enum EraseStyle
{
    /// <summary>A heavy blur of the region's own pixels. Blends into moving footage.</summary>
    Blur = 0,

    /// <summary>A solid box. Removes the mark completely, at the cost of being visible.</summary>
    Fill = 1,

    /// <summary>
    /// Covers the mark with the footage right next to it, feathered in. On sky, water,
    /// grass or any other texture it reads as if nothing was ever there.
    /// </summary>
    Patch = 2,

    /// <summary>
    /// <see cref="Patch"/>, then the project's own watermark drawn inside the box - the old
    /// mark is replaced by ours in the very same spot.
    /// </summary>
    Brand = 3
}

/// <summary>Which neighbouring footage a <see cref="EraseStyle.Patch"/> is copied from.</summary>
public enum EraseSource
{
    /// <summary>Whichever side has room for a full copy; above or below first.</summary>
    Auto = 0,
    Above = 1,
    Below = 2,
    Left = 3,
    Right = 4
}

/// <summary>
/// One rectangle of a clip's source frame to erase, in PERCENT of the source frame so it
/// survives any resolution and needs no probe - a phone clip's probed size ignores its
/// rotation, and a pixel rectangle measured against the wrong orientation lands nowhere.
/// </summary>
public sealed class EraseRegionSpec
{
    /// <summary>Ceiling per clip. Each region is one more pass in the filtergraph.</summary>
    public const int MaxPerClip = 8;

    /// <summary>
    /// Smallest region side, in percent. Below it the box is too small to hold a mark and
    /// too small for the blur's radius to mean anything.
    /// </summary>
    public const double MinSizePercent = 1;

    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = 20;
    public double Height { get; set; } = 10;

    public EraseStyle Style { get; set; } = EraseStyle.Blur;

    /// <summary><c>#rrggbb</c> for <see cref="EraseStyle.Fill"/>; anything else is black.</summary>
    public string? FillColor { get; set; }

    /// <summary>
    /// 0-100. How hard a <see cref="EraseStyle.Blur"/> smears; for a patch, how much the
    /// copied footage is softened so its detail does not repeat visibly.
    /// </summary>
    public double Strength { get; set; } = DefaultStrength;

    /// <summary>
    /// 0-100. How far the edge fades into the surrounding footage, as a share of the box.
    /// The fade is OUTSIDE the box, so the box itself stays fully covered.
    /// </summary>
    public double Feather { get; set; } = DefaultFeather;

    /// <summary>0-100. Density of a <see cref="EraseStyle.Fill"/>; 100 is solid.</summary>
    public double Opacity { get; set; } = 100;

    /// <summary>Where a patch copies its footage from.</summary>
    public EraseSource Source { get; set; } = EraseSource.Auto;

    /// <summary>
    /// <see cref="EraseStyle.Brand"/> only: still draw our watermark at its usual corner too.
    /// Off by default - the box already carries the mark, and two of them looks like a mistake.
    /// </summary>
    public bool KeepCornerMark { get; set; }

    public const double DefaultStrength = 60;
    public const double DefaultFeather = 30;

    /// <summary>
    /// The region pulled inside the frame with a usable size, or null when it covers
    /// nothing. Done here rather than trusted from the request: the values end up inside
    /// an ffmpeg expression, and an out-of-frame crop fails the whole render.
    /// </summary>
    public EraseRegionSpec? Normalized()
    {
        static double Clamp(double v, double lo, double hi) =>
            double.IsFinite(v) ? Math.Clamp(v, lo, hi) : lo;

        var x = Clamp(X, 0, 100 - MinSizePercent);
        var y = Clamp(Y, 0, 100 - MinSizePercent);
        var w = Clamp(Width, 0, 100 - x);
        var h = Clamp(Height, 0, 100 - y);
        if (w < MinSizePercent || h < MinSizePercent) return null;

        return new EraseRegionSpec
        {
            X = x, Y = y, Width = w, Height = h,
            Style = Enum.IsDefined(Style) ? Style : EraseStyle.Blur,
            FillColor = IsHexColor(FillColor) ? FillColor : "#000000",
            Strength = Clamp(Strength, 0, 100),
            Feather = Clamp(Feather, 0, 100),
            Opacity = double.IsFinite(Opacity) ? Math.Clamp(Opacity, 0, 100) : 100,
            Source = Enum.IsDefined(Source) ? Source : EraseSource.Auto,
            KeepCornerMark = KeepCornerMark
        };
    }

    /// <summary>
    /// The box grown by its feather - the area actually redrawn, in percent of the frame.
    /// The fade lives in the margin, so the mark under the box is never half-visible.
    /// </summary>
    public (double X, double Y, double Width, double Height) Outer()
    {
        var mx = Width * Feather / 200;
        var my = Height * Feather / 200;
        var x0 = Math.Max(0, X - mx);
        var y0 = Math.Max(0, Y - my);
        return (x0, y0, Math.Min(100, X + Width + mx) - x0, Math.Min(100, Y + Height + my) - y0);
    }

    /// <summary>
    /// Top-left, in percent, of the footage a patch copies over <see cref="Outer"/>: the
    /// same-sized area one full box away, so the copy never contains the mark itself. A
    /// side without room is skipped by Auto; named explicitly it is clamped into frame.
    /// </summary>
    public (double X, double Y) PatchOrigin()
    {
        var (ox, oy, ow, oh) = Outer();
        var room = new Dictionary<EraseSource, (double X, double Y, bool Fits)>
        {
            [EraseSource.Above] = (ox, oy - oh, oy - oh >= 0),
            [EraseSource.Below] = (ox, oy + oh, oy + 2 * oh <= 100),
            [EraseSource.Left] = (ox - ow, oy, ox - ow >= 0),
            [EraseSource.Right] = (ox + ow, oy, ox + 2 * ow <= 100),
        };

        var side = Source;
        if (side == EraseSource.Auto)
        {
            side = new[] { EraseSource.Above, EraseSource.Below, EraseSource.Left, EraseSource.Right }
                .Where(s => room[s].Fits)
                .DefaultIfEmpty(oy >= 100 - oy - oh ? EraseSource.Above : EraseSource.Below)
                .First();
        }

        var (px, py, _) = room[side];
        return (Math.Clamp(px, 0, 100 - ow), Math.Clamp(py, 0, 100 - oh));
    }

    public static bool IsHexColor(string? value) =>
        value is { Length: 7 } && value[0] == '#' && value.Skip(1).All(char.IsAsciiHexDigit);
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
