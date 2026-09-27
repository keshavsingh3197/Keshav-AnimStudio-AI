using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

public sealed record MergeSceneInput(string RelativePath, FrameCount Length, TransitionSettings TransitionToNext);

/// <summary>
/// One audio file mixed in at its own point on the merged timeline, instead of looped
/// under the whole thing.
/// </summary>
public sealed record MergeMusicTrack(
    string RelativePath, double StartSeconds, double Volume,
    double? TrimStartSeconds, double? TrimEndSeconds);

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
    string? Text,
    double FontSize,
    string Color,
    string BackgroundColor,
    string Position,
    string? TransitionIn = "fade",
    double TransitionInDuration = 0.5,
    string? TransitionOut = "fade",
    double TransitionOutDuration = 0.5);

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
