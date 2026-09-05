using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// Turns per-stage frame counts into one 0-100 figure, weighted by frames so a 30-second
/// scene counts three times a 10-second one.
/// </summary>
public sealed class RenderProgressAggregator
{
    /// <summary>
    /// A stream-copy merge is roughly this much faster than encoding. Without the
    /// discount the bar parks at 95% for a merge that finishes in two seconds.
    /// </summary>
    private const int CopyConcatSpeedup = 50;

    private readonly IReadOnlyList<FrameCount> _sceneLengths;
    private readonly int _sceneWork;
    private readonly int _mergeWork;

    public RenderProgressAggregator(
        IReadOnlyList<FrameCount> sceneLengths, FrameCount mergedLength, bool mergeIsStreamCopy)
    {
        _sceneLengths = sceneLengths;
        _sceneWork = sceneLengths.Sum(l => l.Value);
        _mergeWork = mergeIsStreamCopy
            ? Math.Max(mergedLength.Value / CopyConcatSpeedup, 1)
            : mergedLength.Value;
    }

    private int TotalWork => Math.Max(_sceneWork + _mergeWork, 1);

    public int Percent(RenderStage stage, int sceneIndex, FrameCount stageFramesDone)
    {
        var done = stage switch
        {
            RenderStage.Preparing => 0,
            RenderStage.RenderingScene =>
                _sceneLengths.Take(sceneIndex).Sum(l => l.Value) + stageFramesDone.Value,
            RenderStage.Merging => _sceneWork + stageFramesDone.Value,
            RenderStage.Publishing or RenderStage.Completed => TotalWork,
            _ => 0
        };

        // Capped at 99: only a terminal job status reports 100.
        return Math.Clamp(100 * done / TotalWork, 0, stage == RenderStage.Completed ? 100 : 99);
    }

    public static string Message(RenderStage stage, int sceneIndex, int sceneCount) => stage switch
    {
        RenderStage.Preparing => "Preparing assets",
        RenderStage.RenderingScene => $"Rendering scene {sceneIndex + 1} of {sceneCount}",
        RenderStage.Merging => sceneCount == 1 ? "Finalising video" : $"Merging {sceneCount} scenes",
        RenderStage.Publishing => "Saving final video",
        RenderStage.Completed => "Completed",
        _ => "Queued"
    };
}
