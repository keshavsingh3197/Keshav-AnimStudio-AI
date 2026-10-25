using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Assets;

public sealed class AssetScopeService(
    IProjectRepository projects,
    IAssetRepository assets)
{
    /// <summary>
    /// Computes the list of project IDs whose assets are visible to the specified project.
    /// - If the project is a sub-project and has UseSharedAssets enabled, it sees its parent's assets,
    ///   its own assets, and all siblings' assets.
    /// - If the project is a sub-project and has UseSharedAssets disabled, it sees only its own assets.
    /// - If the project is a root project, it sees its own assets and all assets uploaded by its sub-projects.
    /// </summary>
    public async Task<IReadOnlyList<string>> GetVisibleProjectIdsAsync(string projectId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(projectId)) return [];

        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false);
        if (project is null) return [projectId];

        if (project.IsSubProject)
        {
            if (!project.Settings.UseSharedAssets || string.IsNullOrWhiteSpace(project.ParentProjectId))
            {
                return [projectId];
            }

            var rootId = project.ParentProjectId;
            var siblings = await projects.ListSubProjectsAsync(rootId, ct).ConfigureAwait(false);

            var ids = new HashSet<string>(StringComparer.Ordinal) { rootId, projectId };
            foreach (var s in siblings)
            {
                ids.Add(s.Id);
            }
            return [.. ids];
        }

        // Root project: can see own assets + any assets uploaded in sub-projects
        var subProjects = await projects.ListSubProjectsAsync(projectId, ct).ConfigureAwait(false);
        var familyIds = new HashSet<string>(StringComparer.Ordinal) { projectId };
        foreach (var s in subProjects)
        {
            familyIds.Add(s.Id);
        }
        return [.. familyIds];
    }

    /// <summary>
    /// Checks whether an asset can be used in the given project context.
    /// System and global assets are always usable. Assets belonging to the project itself
    /// or family projects (if shared assets scope includes them) are usable.
    /// </summary>
    public async Task<bool> CanUseAssetAsync(Asset asset, string projectId, CancellationToken ct)
    {
        if (asset is null) return false;
        if (string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal)) return true;
        if (string.Equals(asset.ProjectId, "global", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(asset.ProjectId, "system", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(asset.ProjectId)) return false;

        var visibleIds = await GetVisibleProjectIdsAsync(projectId, ct).ConfigureAwait(false);
        return visibleIds.Contains(asset.ProjectId, StringComparer.Ordinal);
    }

    public async Task<bool> CanUseAssetAsync(string assetId, string projectId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(assetId)) return false;
        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false);
        if (asset is null) return false;
        return await CanUseAssetAsync(asset, projectId, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Lists all assets visible to the project (including shared family assets if enabled).
    /// </summary>
    public async Task<IReadOnlyList<Asset>> ListVisibleAssetsAsync(string projectId, CancellationToken ct)
    {
        var visibleIds = await GetVisibleProjectIdsAsync(projectId, ct).ConfigureAwait(false);
        if (visibleIds.Count <= 1)
        {
            return await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        }

        return await assets.ListByProjectsAsync(visibleIds, ct).ConfigureAwait(false);
    }
}

