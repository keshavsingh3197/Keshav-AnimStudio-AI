using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

/// <summary>
/// A watermark resolved all the way down to pixels and workspace-relative paths.
/// <para>
/// The fractions in <see cref="WatermarkSettings"/> are turned into pixels ONCE here,
/// against the project canvas, so the graph builder stays a pure function over integers
/// and every position expression it emits can be asserted as a literal string.
/// </para>
/// <para>
/// Note <see cref="TextRelativePath"/> rather than the text itself. drawtext's own option
/// parser treats <c>:</c>, <c>,</c>, <c>%</c>, <c>\</c> and quotes as syntax, and a
/// watermark is nearly always a URL - which is to say, a string made almost entirely of
/// those characters. Handing ffmpeg a file to read instead removes that escaping problem
/// completely rather than solving it repeatedly.
/// </para>
/// </summary>
public sealed record WatermarkPlan
{
    public required WatermarkKind Kind { get; init; }
    public required WatermarkPosition Position { get; init; }

    /// <summary>A file in the workspace holding exactly the line to draw, no newline.</summary>
    public string? TextRelativePath { get; init; }

    /// <summary>The logo image, already materialized into the workspace.</summary>
    public string? LogoRelativePath { get; init; }

    /// <summary>Text cap height / logo height, in pixels.</summary>
    public required int HeightPixels { get; init; }

    /// <summary>Inset from both nearest edges, in pixels.</summary>
    public required int MarginPixels { get; init; }

    /// <summary>Widest the logo may be drawn, so a banner-shaped file cannot span the frame.</summary>
    public required int MaxWidthPixels { get; init; }

    public required double Opacity { get; init; }

    /// <summary>"RRGGBB", already validated as six hex digits. Text only.</summary>
    public required string ColorRgb { get; init; }

    public required double BackplateOpacity { get; init; }

    /// <summary>
    /// ABSOLUTE path to the .ttf/.otf the text is drawn with - the only way a font is ever
    /// named here. There is deliberately no family-name alternative: <c>drawtext</c>'s
    /// <c>font=</c> resolves through fontconfig, and on a build that has fontconfig but no
    /// <c>fonts.conf</c> - every stock Windows ffmpeg - the failed lookup crashes the
    /// process with an access violation rather than reporting a missing font. Null means
    /// the host has no font file at all, and the mark is then skipped with a warning: an
    /// undrawn watermark costs a decoration, a crashed renderer costs the whole render.
    /// </summary>
    public string? FontFilePath { get; init; }
}

/// <summary>
/// One source clip, normalized onto the project canvas and watermarked.
/// <para>
/// This is the first of the two passes a stitch takes, and the reason it exists as a
/// separate pass at all: once every clip has been re-encoded to identical settings - same
/// codec, resolution, pixel format, frame rate, GOP and audio layout - the join itself
/// becomes a stream copy that costs seconds instead of minutes. Clips arrive from phones,
/// screen recorders and other editors, so assuming they already agree on any of that is
/// how a "merge" produces a video that plays the first clip and then stalls.
/// </para>
/// </summary>
public sealed record ClipRenderPlan
{
    public required int ClipIndex { get; init; }
    public required string SourceRelativePath { get; init; }
    public required Canvas Canvas { get; init; }
    public required string OutputRelativePath { get; init; }

    /// <summary>
    /// The length the upload probe reported, used for the progress bar and for nothing
    /// else. It is NOT imposed on the output: a container's declared duration and its real
    /// frame count disagree often enough that forcing it would truncate or freeze clips.
    /// The true length is measured after this pass runs.
    /// </summary>
    public required FrameCount ExpectedFrames { get; init; }

    /// <summary>How a clip shaped differently from the canvas is fitted to it.</summary>
    public ClipFit Fit { get; init; } = ClipFit.Contain;

    /// <summary>True when the source is an image asset requiring looped frame generation.</summary>
    public bool SourceIsImage { get; init; }

    /// <summary>Duration in seconds for an image clip (default 5.0 seconds).</summary>
    public double ImageDurationSeconds { get; init; } = 5.0;

    /// <summary>Optional trim start in-point on the video source.</summary>
    public double? TrimStartSeconds { get; init; }

    /// <summary>Optional trim end out-point on the video source.</summary>
    public double? TrimEndSeconds { get; init; }

    /// <summary>Optional custom duration override for this clip in the edit.</summary>
    public double? DurationSeconds { get; init; }

    /// <summary>
    /// Seconds of frozen head material to prepend before the trimmed clip, supplying
    /// the first half of the incoming transition's dissolve window without touching the
    /// clip's own visible content. Zero for the first clip or when there is no transition.
    /// </summary>
    public double LeadInSeconds { get; init; }

    /// <summary>
    /// Seconds of frozen tail material to append after the trimmed clip, supplying the
    /// second half of the outgoing transition's dissolve window. Zero for the last clip or
    /// when there is no transition.
    /// </summary>
    public double TailOutSeconds { get; init; }

    /// <summary>
    /// True when <see cref="LeadInSeconds"/> is supplied via a frozen first frame (tpad)
    /// rather than real footage before the trim in-point.
    /// Always true in the current frontend; kept as a flag so spare-media borrowing can
    /// be introduced later without a protocol change.
    /// </summary>
    public bool FreezeHead { get; init; }

    /// <summary>
    /// True when <see cref="TailOutSeconds"/> is supplied via a frozen last frame (tpad)
    /// rather than real footage after the trim out-point.
    /// </summary>
    public bool FreezeTail { get; init; }

    /// <summary>False when the source is silent, in which case silence is generated.</summary>
    public bool SourceHasAudio { get; init; } = true;

    /// <summary>Discards the clip's own audio, leaving room for a music bed.</summary>
    public bool MuteAudio { get; init; }

    /// <summary>
    /// Gain on the clip's own audio: 1 leaves it alone, 0 silences this clip, above 1
    /// lifts footage that was recorded too quietly. Applied in pass one, so it is baked
    /// into the conformed clip and the join stays a stream copy.
    /// </summary>
    public double AudioVolume { get; init; } = 1.0;

    /// <summary>
    /// A sound of this clip's own - a voice-over, a sting, a music change for one segment -
    /// already materialized into the workspace. Null for the normal case.
    /// </summary>
    public string? ExtraAudioRelativePath { get; init; }
    public double? ExtraAudioTrimStartSeconds { get; init; }
    public double? ExtraAudioTrimEndSeconds { get; init; }

    public double ExtraAudioVolume { get; init; } = 1.0;

    /// <summary>
    /// With <see cref="ExtraAudioRelativePath"/> set: mix it over the clip's own audio
    /// instead of replacing it. Meaningless on its own, and ignored when the clip is
    /// silent or muted - there is then nothing to keep.
    /// </summary>
    public bool KeepOwnAudio { get; init; }

    public WatermarkPlan? Watermark { get; init; }

    public EncoderProfile Encoder { get; init; } = EncoderProfile.Default;

    /// <summary>
    /// Caps the encoder's own thread count, or 0 to let ffmpeg use every core.
    /// <para>
    /// Left at 0 when clips are conformed one at a time. When several run at once - see
    /// <c>ClipMergeOrchestrator</c>'s bounded parallelism - each process defaulting to
    /// "every core" would have them all fighting over the same cores instead of actually
    /// overlapping, so the orchestrator divides the machine between however many it is
    /// running concurrently.
    /// </para>
    /// </summary>
    public int EncoderThreads { get; init; }

    /// <summary>Crop percentages [0–99] applied BEFORE fit scaling.</summary>
    public double CropLeft { get; init; }
    public double CropRight { get; init; }
    public double CropTop { get; init; }
    public double CropBottom { get; init; }

    /// <summary>Original probe width of source video, if known.</summary>
    public int? SourceWidth { get; init; }

    /// <summary>Original probe height of source video, if known.</summary>
    public int? SourceHeight { get; init; }

    /// <summary>
    /// When true, the source clip already matches canvas dimensions, frame rate, pixel format,
    /// audio channels/sample rate, has no crops, trims, watermarks or transition padding,
    /// allowing Step 2 to bypass the filtergraph entirely with direct stream copy (-c copy).
    /// </summary>
    public bool CanStreamCopy { get; init; }

    /// <summary>True when any crop edge is non-zero.</summary>
    public bool HasCrop => CropLeft > 0 || CropRight > 0 || CropTop > 0 || CropBottom > 0;
}
