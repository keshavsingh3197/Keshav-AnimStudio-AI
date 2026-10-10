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

    /// <summary>The most files one copy request may name; a long timeline uses a few hundred at most.</summary>
    public const int MaxCopyPerRequest = 500;

    /// <summary>
    /// Copies files from one of the user's projects into another, so a timeline brought over
    /// from the other project can be previewed and rendered here - a render only ever reads
    /// its own project's files (and the shared global/system ones).
    /// <para>
    /// Each copy gets its own stored bytes rather than sharing the source's key: deleting the
    /// file in either project must never pull it out from under the other. A file already
    /// copied into the target is reused. Ids that are not files of the source project are
    /// left out of the answer rather than failing the batch; shared global/system files map
    /// to themselves.
    /// </para>
    /// </summary>
    /// <returns>Source asset id to the id of the same file in the target project.</returns>
    public async Task<IReadOnlyDictionary<string, string>> CopyIntoProjectAsync(
        string sourceProjectId, string targetProjectId, IReadOnlyCollection<string> assetIds,
        string userId, DateTime now, CancellationToken ct)
    {
        await EnsureOwnedAsync(sourceProjectId, userId, ct).ConfigureAwait(false);
        await EnsureOwnedAsync(targetProjectId, userId, ct).ConfigureAwait(false);

        var wanted = assetIds.Where(id => !string.IsNullOrEmpty(id)).Distinct(StringComparer.Ordinal).ToList();
        if (wanted.Count > MaxCopyPerRequest)
            throw EditingException.Invalid("too-many-assets", $"Copy at most {MaxCopyPerRequest} files at a time.");

        var mapping = new Dictionary<string, string>(StringComparer.Ordinal);
        if (wanted.Count == 0) return mapping;

        var sources = await assets.GetManyAsync(wanted, ct).ConfigureAwait(false);
        var alreadyCopied = (await assets.ListByProjectAsync(targetProjectId, ct).ConfigureAwait(false))
            .Where(a => a.CopiedFromAssetId is not null)
            .GroupBy(a => a.CopiedFromAssetId!, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.Ordinal);

        foreach (var source in sources)
        {
            if (IsShared(source.ProjectId))
            {
                mapping[source.Id] = source.Id;
                continue;
            }

            // Only the named source project's own files: an id from anywhere else is not
            // this user's to copy, whatever it happens to point at.
            if (!string.Equals(source.ProjectId, sourceProjectId, StringComparison.Ordinal))
                continue;

            if (string.Equals(sourceProjectId, targetProjectId, StringComparison.Ordinal))
            {
                mapping[source.Id] = source.Id;
                continue;
            }

            if (alreadyCopied.TryGetValue(source.Id, out var existingId))
            {
                mapping[source.Id] = existingId;
                continue;
            }

            await using var content = await store.OpenAsync(source.StorageKey, ct).ConfigureAwait(false);
            if (content is null) continue;

            // Server-composed, like an upload's: only the source's own extension is reused.
            var storageKey = $"projects/{targetProjectId}/assets/{Guid.NewGuid():n}{Path.GetExtension(source.StorageKey)}";
            await store.SaveAsync(storageKey, content, source.MimeType, ct).ConfigureAwait(false);

            var copy = new Asset
            {
                ProjectId = targetProjectId,
                Name = source.Name,
                DisplayFileName = source.DisplayFileName,
                StorageKey = storageKey,
                Kind = source.Kind,
                MimeType = source.MimeType,
                FileSizeBytes = source.FileSizeBytes,
                Probe = source.Probe,
                // Licence review travels with the file: a copy is no more cleared than its source.
                ReviewStatus = source.ReviewStatus,
                UsageScope = source.UsageScope,
                Provenance = source.Provenance,
                IpRisk = source.IpRisk,
                CopiedFromAssetId = source.Id,
                CreatedAt = now
            };

            await assets.InsertAsync(copy, ct).ConfigureAwait(false);
            mapping[source.Id] = copy.Id;
        }

        return mapping;
    }

    private async Task EnsureOwnedAsync(string projectId, string userId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    private static bool IsShared(string projectId) =>
        string.Equals(projectId, "global", StringComparison.OrdinalIgnoreCase)
        || string.Equals(projectId, "system", StringComparison.OrdinalIgnoreCase);

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
