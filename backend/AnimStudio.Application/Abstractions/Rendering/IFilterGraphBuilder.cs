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
    FilterGraphPlan BuildMerge(MergePlan plan);
}
