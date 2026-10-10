using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

public sealed record MergeSceneInput(string RelativePath, FrameCount Length, TransitionSettings TransitionToNext);

/// <summary>
/// One audio file mixed in at its own point on the merged timeline, instead of looped
/// under the whole thing.
/// </summary>
public sealed record MergeMusicTrack(
    string RelativePath, double StartSeconds, double Volume,
    double? TrimStartSeconds, double? TrimEndSeconds, bool IsVoiceover = false);

/// <summary>
/// One stretch of the finished timeline over which the music plays at a reduced level.
/// </summary>
public sealed record MergeDuckWindow(double StartSeconds, double EndSeconds, double Level);

public sealed record MergeOverlayItem(
    string Type,
    string? RelativePath,
    double StartSeconds,
    double DurationSeconds,
    double Scale,
    double X,
    double Y,
    double Opacity,
    string? TransitionIn = "fade",
    double TransitionInDuration = 0.5,
    string? TransitionOut = "fade",
    double TransitionOutDuration = 0.5)
{
    /// <summary>What to draw for a text overlay; null for image and video overlays.</summary>
    public MergeTextOverlay? Text { get; init; }

    /// <summary>
    /// Image and video overlays: width in percent of the canvas, already held to 1-100.
    /// Null falls back to <see cref="Scale"/> on the source's own pixels.
    /// </summary>
    public double? WidthPercent { get; init; }

    /// <summary>Image and video overlays: crop, shape, ring and source trim. Null draws the whole source as a rectangle.</summary>
    public MergeMediaOverlay? Media { get; init; }
}

/// <summary>
/// How an image or video overlay is cut and framed, already validated: crops are percent of
/// the source held so something always shows, the ring colour is a checked <c>rrggbb</c>.
/// </summary>
/// <param name="BorderWidth">Ring width in 360-reference pixels; zero for none.</param>
/// <param name="AspectRatio">Width / height after the crop, or null when the studio did not send one.</param>
/// <param name="TrimStartSeconds">Video overlays: where in the source to start playing.</param>
public sealed record MergeMediaOverlay(
    double CropLeft, double CropTop, double CropRight, double CropBottom,
    OverlayShape Shape, double BorderWidth, string BorderRgb, double? AspectRatio,
    double TrimStartSeconds = 0)
{
    public bool HasCrop => CropLeft > 0 || CropTop > 0 || CropRight > 0 || CropBottom > 0;
}

/// <summary>
/// A text overlay ready to draw: already wrapped into lines, each line already in a file.
/// <para>
/// Files for the same reason as <see cref="WatermarkPlan"/>: a caption is free text, and
/// <c>:</c> <c>,</c> <c>'</c> <c>%</c> and <c>\</c> are all syntax to drawtext's option
/// parser. One file per line because drawtext cannot centre the lines of a block, only the
/// block - each line is its own drawtext, centred on its own.
/// </para>
/// </summary>
/// <param name="LineRelativePaths">One per line, top to bottom; null for a blank line, which keeps its slot.</param>
/// <param name="LineLengths">
/// Characters (text elements) on each line, for a typed entrance that reveals a line one
/// character's width at a time. Null when unknown - the reveal then sweeps evenly.
/// </param>
public sealed record MergeTextOverlay(
    IReadOnlyList<string?> LineRelativePaths,
    string FontFilePath,
    TextOverlayLook Look,
    IReadOnlyList<int>? LineLengths = null);

public sealed record MergePlan
{
    public required Canvas Canvas { get; init; }
    public required IReadOnlyList<MergeSceneInput> Scenes { get; init; }

    public string? BackgroundMusicRelativePath { get; init; }
    public double BackgroundMusicVolume { get; init; } = 0.18;

    /// <summary>
    /// Extra tracks mixed in ADDITION to the bed above, each starting at its own offset.
    /// Empty in the common case, which is exactly the one bed the filter graph has always
    /// built.
    /// </summary>
    public IReadOnlyList<MergeMusicTrack> MusicTracks { get; init; } = [];

    /// <summary>
    /// Where the music steps back under the clips above it. Empty - the common case - leaves
    /// the music holding one level throughout, exactly as it always did.
    /// </summary>
    public IReadOnlyList<MergeDuckWindow> MusicDuckWindows { get; init; } = [];

    /// <summary>Level the finished mix to YouTube's loudness target (-14 LUFS) before it is encoded.</summary>
    public bool YouTubeLoudness { get; init; }

    public IReadOnlyList<MergeOverlayItem> Overlays { get; init; } = [];

    public required string OutputRelativePath { get; init; }

    /// <summary>Concat list file, used only on the stream-copy path.</summary>
    public string ConcatListRelativePath { get; init; } = "concat.txt";

    public EncoderProfile Encoder { get; init; } = EncoderProfile.Default;

    /// <summary>
    /// Decoder threads to allow EACH input on the crossfade path, or 0 to let ffmpeg decide.
    /// <para>
    /// This is a memory control, not a speed one. An <c>xfade</c> chain names one input per
    /// clip, so ffmpeg opens every clip at once and gives each decoder as many threads as
    /// the host has cores - and a multi-threaded h264 decoder sizes its frame pool by its
    /// thread count. Left alone, twenty-four 1080p inputs reached 2068 MB of working set;
    /// capped at two threads each, the same join peaked at 927 MB and took the same 35s,
    /// because the bottleneck is the single output encoder rather than the decoders. At one
    /// thread each it drops to 824 MB but decode does become the bottleneck (58s), which is
    /// why the default is two rather than one.
    /// </para>
    /// <para>
    /// Only decoders are affected. The output encoder still gets the whole machine.
    /// </para>
    /// </summary>
    public int DecoderThreadsPerInput { get; init; }

    public IReadOnlyList<FrameCount> Lengths => [.. Scenes.Select(s => s.Length)];

    /// <summary>Transition durations between consecutive scenes (one fewer than scenes).</summary>
    public IReadOnlyList<FrameCount> TransitionDurations =>
        [.. Scenes.Take(Scenes.Count - 1).Select(s => s.TransitionToNext.IsCut
            ? FrameCount.Zero
            : s.TransitionToNext.Duration)];
}
