using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

public sealed record MergeSceneInput(string RelativePath, FrameCount Length, TransitionSettings TransitionToNext);

public sealed record MergePlan
{
    public required Canvas Canvas { get; init; }
    public required IReadOnlyList<MergeSceneInput> Scenes { get; init; }

    public string? BackgroundMusicRelativePath { get; init; }
    public double BackgroundMusicVolume { get; init; } = 0.18;

    public required string OutputRelativePath { get; init; }

    /// <summary>Concat list file, used only on the stream-copy path.</summary>
    public string ConcatListRelativePath { get; init; } = "concat.txt";

    public EncoderProfile Encoder { get; init; } = EncoderProfile.Default;

    public IReadOnlyList<FrameCount> Lengths => [.. Scenes.Select(s => s.Length)];

    /// <summary>Transition durations between consecutive scenes (one fewer than scenes).</summary>
    public IReadOnlyList<FrameCount> TransitionDurations =>
        [.. Scenes.Take(Scenes.Count - 1).Select(s => s.TransitionToNext.IsCut
            ? FrameCount.Zero
            : s.TransitionToNext.Duration)];
}
