using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Assets;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Projects;

/// <summary>How a project's assets relate to its parent's.</summary>
public enum ParentAssetMode
{
    /// <summary>Live link: the project sees its family's files, and later uploads show up on both sides.</summary>
    Share,

    /// <summary>Independent copies of the parent's files at this moment.</summary>
    Copy,

    /// <summary>Its own files only.</summary>
    None
}

/// <summary>
/// Puts an existing project under another (making it a sub-project) or takes it back out, and
/// decides what happens to the files the two share.
/// <para>
/// A project's scenes, cast and music bed point at files by id. If the project stops seeing the
/// files of the family it leaves (or switches from sharing to not), the files it actually uses
/// from there are copied into it and those references repointed, so nothing breaks at render time.
/// </para>
/// </summary>
public sealed class ProjectHierarchyService(
    IProjectRepository projects,
    IAssetRepository assets,
    ISceneRepository scenes,
    ICharacterRepository characters,
    AssetLibraryService library,
    AssetScopeService scope,
    TimeProvider clock)
{
    /// <summary>Copies the parent's own files into a (new or just-attached) project.</summary>
    public async Task CopyParentAssetsAsync(string parentId, string projectId, string userId, CancellationToken ct)
    {
        var ids = (await assets.ListByProjectAsync(parentId, ct).ConfigureAwait(false)).Select(a => a.Id).ToList();
        var now = clock.GetUtcNow().UtcDateTime;
        foreach (var batch in ids.Chunk(AssetLibraryService.MaxCopyPerRequest))
            await library.CopyIntoProjectAsync(parentId, projectId, batch, userId, now, ct).ConfigureAwait(false);
    }

    /// <param name="newParentId">Null makes the project top-level again.</param>
    public async Task<Project> SetParentAsync(
        string projectId, string userId, string? newParentId, ParentAssetMode mode, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();

        newParentId = string.IsNullOrWhiteSpace(newParentId) ? null : newParentId;
        Project? parent = null;
        if (newParentId is not null)
        {
            if (string.Equals(newParentId, project.Id, StringComparison.Ordinal))
                throw EditingException.Invalid("parent-self", "A project can't be a sub-project of itself.");

            parent = await projects.GetAsync(newParentId, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
            if (!string.Equals(parent.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
            if (parent.IsSubProject)
                throw EditingException.Invalid("nesting-not-allowed", "Sub-projects cannot contain sub-projects.");

            if ((await projects.ListSubProjectsAsync(project.Id, ct).ConfigureAwait(false)).Count > 0)
                throw EditingException.Invalid("has-subprojects",
                    "This project has sub-projects of its own. Move them out before making it a sub-project.");
        }

        var unchanged = string.Equals(project.ParentProjectId, newParentId, StringComparison.Ordinal);
        var before = (await scope.GetVisibleProjectIdsAsync(project.Id, ct).ConfigureAwait(false)).ToHashSet(StringComparer.Ordinal);

        project.ParentProjectId = newParentId;
        project.Settings.UseSharedAssets = newParentId is null || mode == ParentAssetMode.Share;
        project.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await projects.ReplaceAsync(project, ct).ConfigureAwait(false);

        if (parent is not null && mode == ParentAssetMode.Copy && !unchanged)
            await CopyParentAssetsAsync(parent.Id, project.Id, userId, ct).ConfigureAwait(false);

        // Whatever it could use before but can't now must be copied in, or its scenes would break.
        var after = (await scope.GetVisibleProjectIdsAsync(project.Id, ct).ConfigureAwait(false)).ToHashSet(StringComparer.Ordinal);
        var lost = before.Where(id => !after.Contains(id) && !string.Equals(id, project.Id, StringComparison.Ordinal)).ToHashSet(StringComparer.Ordinal);
        if (lost.Count > 0) await RehomeReferencesAsync(project, lost, userId, ct).ConfigureAwait(false);

        return project;
    }

    private async Task RehomeReferencesAsync(Project project, HashSet<string> lostProjectIds, string userId, CancellationToken ct)
    {
        var projectScenes = await scenes.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);
        var projectCast = await characters.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);

        var referenced = new HashSet<string>(StringComparer.Ordinal);
        void Add(string? id) { if (!string.IsNullOrEmpty(id)) referenced.Add(id); }
        foreach (var s in projectScenes) { Add(s.BackgroundAssetId); Add(s.Audio?.AssetId); }
        foreach (var c in projectCast) { Add(c.Sprites.ClosedMouthAssetId); Add(c.Sprites.OpenMouthAssetId); Add(c.Voice?.AiSampleAssetId); }
        Add(project.Settings.BackgroundMusicAssetId);
        if (referenced.Count == 0) return;

        var found = await assets.GetManyAsync(referenced, ct).ConfigureAwait(false);
        var bySource = found.Where(a => lostProjectIds.Contains(a.ProjectId)).GroupBy(a => a.ProjectId, StringComparer.Ordinal);

        var now = clock.GetUtcNow().UtcDateTime;
        var mapping = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var group in bySource)
        {
            var copied = await library.CopyIntoProjectAsync(group.Key, project.Id, [.. group.Select(a => a.Id)], userId, now, ct).ConfigureAwait(false);
            foreach (var (from, to) in copied) mapping[from] = to;
        }
        if (mapping.Count == 0) return;

        string? Map(string? id) => id is not null && mapping.TryGetValue(id, out var to) ? to : id;

        foreach (var s in projectScenes)
        {
            var bg = Map(s.BackgroundAssetId);
            var audio = Map(s.Audio?.AssetId);
            if (bg == s.BackgroundAssetId && audio == s.Audio?.AssetId) continue;
            s.BackgroundAssetId = bg;
            if (s.Audio is not null) s.Audio.AssetId = audio;
            await scenes.ReplaceAsync(s, ct).ConfigureAwait(false);
        }

        foreach (var c in projectCast)
        {
            var closed = Map(c.Sprites.ClosedMouthAssetId);
            var open = Map(c.Sprites.OpenMouthAssetId);
            var sample = Map(c.Voice?.AiSampleAssetId);
            if (closed == c.Sprites.ClosedMouthAssetId && open == c.Sprites.OpenMouthAssetId && sample == c.Voice?.AiSampleAssetId) continue;
            c.Sprites.ClosedMouthAssetId = closed;
            c.Sprites.OpenMouthAssetId = open;
            if (c.Voice is not null) c.Voice.AiSampleAssetId = sample;
            await characters.ReplaceAsync(c, ct).ConfigureAwait(false);
        }

        var music = Map(project.Settings.BackgroundMusicAssetId);
        if (music != project.Settings.BackgroundMusicAssetId)
        {
            project.Settings.BackgroundMusicAssetId = music;
            await projects.ReplaceAsync(project, ct).ConfigureAwait(false);
        }
    }
}
