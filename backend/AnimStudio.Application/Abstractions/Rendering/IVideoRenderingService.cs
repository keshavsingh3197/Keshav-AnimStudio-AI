using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Abstractions.Rendering;

public sealed record RenderProgress(
    RenderStage Stage,
    int SceneIndex,
    int SceneCount,
    FrameCount StageFramesDone,
    FrameCount StageFramesTotal,
    int OverallPercent,
    string Message,
    double? Speed);

public sealed record SceneRenderResult(string RelativePath, FrameCount Frames, long SizeBytes);

public sealed record MergeRenderResult(string RelativePath, FrameCount Frames, long SizeBytes);

/// <summary>
/// Renders scenes and merges them.
/// <para>
/// Note what is absent: no output path and no list of input paths. The caller passes a
/// plan plus the workspace and never handles a physical path, so the same orchestration
/// works unchanged when storage moves to a bucket.
/// </para>
/// </summary>
public interface IVideoRenderingService
{
    Task<SceneRenderResult> RenderSceneAsync(
        SceneRenderPlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct);

    /// <summary>
    /// Conforms one source clip to the canvas and burns in the watermark.
    /// <para>
    /// Unlike a scene, the result's length is MEASURED rather than asserted. A scene is
    /// rendered from a plan that already knows its exact frame count, so a mismatch there
    /// is a bug worth failing on. A clip's length is whatever the source file turns out to
    /// contain, and container metadata disagrees with the real frame count often enough
    /// that treating the difference as an error would reject perfectly good footage.
    /// </para>
    /// </summary>
    Task<SceneRenderResult> RenderClipAsync(
        ClipRenderPlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct);

    Task<MergeRenderResult> MergeScenesAsync(
        MergePlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct);
}
