using AnimStudio.Application.Rendering.Models;

namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>
/// Turns a render plan into an ffmpeg invocation.
/// <para>
/// Intentionally a pure function - no Task, no CancellationToken, no storage, no process.
/// It cannot touch the renderer even by accident, which is what allows every animation,
/// sprite window and mouth-flap expression to be asserted as a string in a test suite that
/// runs with no ffmpeg installed.
/// </para>
/// </summary>
public interface IFilterGraphBuilder
{
    FilterGraphPlan BuildScene(SceneRenderPlan plan);

    /// <summary>
    /// Conforms one whole video clip to the canvas and burns in the watermark. Its output
    /// is encoded to exactly the settings <see cref="BuildScene"/> uses, which is what lets
    /// <see cref="BuildMerge"/> join clips and scenes by the same stream-copy path.
    /// </summary>
    FilterGraphPlan BuildClip(ClipRenderPlan plan);

    FilterGraphPlan BuildMerge(MergePlan plan);
}
