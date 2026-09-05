using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Assets;

/// <summary>
/// Deletion for the asset library.
/// <para>
/// A file is referenced by id from scenes, characters and the project's music bed, and
/// nothing in the render pipeline can recover from a missing one: the job fails minutes in
/// with a message about an asset the user has already forgotten deleting. So the reference
/// check happens here, before anything is removed, and the answer names what is using it.
/// </para>
/// </summary>
public sealed class AssetLibraryService(
    IAssetRepository assets,
    IProjectRepository projects,
    ISceneRepository scenes,
    ICharacterRepository characters,
    IObjectStore store)
{
    public async Task DeleteAsync(string assetId, string userId, CancellationToken ct)
    {
        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        var project = await projects.GetAsync(asset.ProjectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var usedBy = await FindUsageAsync(asset, ct).ConfigureAwait(false);

        if (usedBy is not null)
        {
            throw EditingException.Conflict("asset-in-use",
                $"'{asset.Name}' is still used by {usedBy}. Remove it there first.");
        }

        // The document goes first: an orphaned blob wastes disk, while an orphaned
        // document is a broken reference the renderer trips over.
        await assets.DeleteAsync(assetId, ct).ConfigureAwait(false);
        await store.DeleteAsync(asset.StorageKey, ct).ConfigureAwait(false);
    }

    /// <summary>A human-readable description of the first reference found, or null if unused.</summary>
    private async Task<string?> FindUsageAsync(Asset asset, CancellationToken ct)
    {
        var project = await projects.GetAsync(asset.ProjectId, ct).ConfigureAwait(false);

        if (string.Equals(project?.Settings.BackgroundMusicAssetId, asset.Id, StringComparison.Ordinal))
            return "this project's background music";

        var cast = await characters.ListByProjectAsync(asset.ProjectId, ct).ConfigureAwait(false);

        foreach (var character in cast)
        {
            if (string.Equals(character.Sprites.ClosedMouthAssetId, asset.Id, StringComparison.Ordinal)
                || string.Equals(character.Sprites.OpenMouthAssetId, asset.Id, StringComparison.Ordinal))
            {
                return $"the character \"{character.Name}\"";
            }
        }

        var list = await scenes.ListByProjectAsync(asset.ProjectId, ct).ConfigureAwait(false);

        foreach (var scene in list)
        {
            if (string.Equals(scene.BackgroundAssetId, asset.Id, StringComparison.Ordinal))
                return $"scene {scene.SceneNumber} as its background";

            if (string.Equals(scene.Audio.AssetId, asset.Id, StringComparison.Ordinal))
                return $"scene {scene.SceneNumber} as its audio";
        }

        return null;
    }
}
