using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Projects;

/// <summary>
/// Keeps a project's status telling the truth.
/// <para>
/// The status is stored rather than derived on read, because the dashboard lists every
/// project and deriving it there would mean loading every project's scenes and jobs. It is
/// therefore moved by explicit transitions at the few moments that can change it: a scene
/// edit that makes the project renderable or breaks it, and a render starting or finishing.
/// </para>
/// <para>
/// "Rendered" means this project has produced a video, and deliberately survives later
/// edits - it is a fact about the past, not a claim that the video is current.
/// </para>
/// </summary>
public sealed class ProjectStatusService(
    IProjectRepository projects,
    ISceneRepository scenes)
{
    /// <summary>
    /// Recomputes Draft vs Ready. Never overrides Rendering, Rendered or Archived: those
    /// say something the scene list cannot.
    /// </summary>
    public async Task RefreshAsync(
        string projectId, IReadOnlyList<Scene>? known, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false);
        if (project is null) return;

        var sceneList = known
            ?? await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        var renderable = sceneList.Count > 0
            && sceneList.All(s => !string.IsNullOrEmpty(s.BackgroundAssetId));

        var next = project.Status switch
        {
            // A render in flight, or an archived project, is not the scene list's business.
            ProjectStatus.Rendering or ProjectStatus.Archived => project.Status,

            // Losing a background makes even a finished project un-renderable again, and
            // that is worth saying however it got there.
            _ when !renderable => ProjectStatus.Draft,

            ProjectStatus.Draft => ProjectStatus.Ready,
            _ => project.Status
        };

        await SetAsync(project, next, ct).ConfigureAwait(false);
    }

    public async Task MarkRenderingAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false);
        if (project is null || project.Status == ProjectStatus.Archived) return;

        await SetAsync(project, ProjectStatus.Rendering, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Called once a render job reaches a terminal state. Success leaves the project
    /// Rendered; anything else hands it back to the scene list to decide.
    /// </summary>
    public async Task MarkRenderFinishedAsync(
        string projectId, bool producedOutput, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false);
        if (project is null || project.Status == ProjectStatus.Archived) return;

        if (producedOutput)
        {
            await SetAsync(project, ProjectStatus.Rendered, ct).ConfigureAwait(false);
            return;
        }

        // Drop out of Rendering first, so the refresh is free to pick Draft or Ready.
        await SetAsync(project, ProjectStatus.Draft, ct).ConfigureAwait(false);
        await RefreshAsync(projectId, null, ct).ConfigureAwait(false);
    }

    private async Task SetAsync(Project project, ProjectStatus status, CancellationToken ct)
    {
        if (project.Status == status) return;

        project.Status = status;

        // UpdatedAt is the user's "last edited" signal; a status move is not an edit.
        await projects.ReplaceAsync(project, ct).ConfigureAwait(false);
    }
}
