using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Editing;

/// <summary>
/// In-memory stand-ins for the Mongo repositories.
/// <para>
/// They mimic the two behaviours the editing rules actually depend on: an insert assigns
/// the id (the driver does this server-side), and listing scenes returns only active ones,
/// ordered by their sparse order key.
/// </para>
/// </summary>
public sealed class FakeProjectRepository : IProjectRepository
{
    public List<Project> Items { get; } = [];

    public Task<Project?> GetAsync(string id, CancellationToken ct) =>
        Task.FromResult(Items.FirstOrDefault(p => p.Id == id));

    public Task<IReadOnlyList<Project>> ListAsync(string userId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Project>>([.. Items.Where(p => p.UserId == userId)]);

    public Task<IReadOnlyList<Project>> ListAllAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Project>>([.. Items]);

    public Task InsertAsync(Project project, CancellationToken ct)
    {
        project.Id = project.Id.Length > 0 ? project.Id : Guid.NewGuid().ToString("n");
        Items.Add(project);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(Project project, CancellationToken ct) => Task.CompletedTask;

    public Task DeleteAsync(string id, CancellationToken ct)
    {
        Items.RemoveAll(p => p.Id == id);
        return Task.CompletedTask;
    }
}

public sealed class FakeSceneRepository : ISceneRepository
{
    public List<Scene> Items { get; } = [];

    /// <summary>Counts writes, so a test can assert an edit did not rewrite the world.</summary>
    public int ReplaceCount { get; private set; }

    public Task<Scene?> GetAsync(string id, CancellationToken ct) =>
        Task.FromResult(Items.FirstOrDefault(s => s.Id == id));

    public Task<IReadOnlyList<Scene>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Scene>>(
            [.. Items.Where(s => s.ProjectId == projectId && s.Status == SceneStatus.Active)
                     .OrderBy(s => s.OrderKey)]);

    public Task InsertAsync(Scene scene, CancellationToken ct)
    {
        scene.Id = scene.Id.Length > 0 ? scene.Id : Guid.NewGuid().ToString("n");
        Items.Add(scene);
        return Task.CompletedTask;
    }

    public Task InsertManyAsync(IEnumerable<Scene> scenes, CancellationToken ct)
    {
        foreach (var scene in scenes) InsertAsync(scene, ct);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(Scene scene, CancellationToken ct)
    {
        ReplaceCount++;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id, CancellationToken ct)
    {
        Items.RemoveAll(s => s.Id == id);
        return Task.CompletedTask;
    }

    public Task DeleteByProjectAsync(string projectId, CancellationToken ct)
    {
        Items.RemoveAll(s => s.ProjectId == projectId);
        return Task.CompletedTask;
    }
}

public sealed class FakeCharacterRepository : ICharacterRepository
{
    public List<Character> Items { get; } = [];

    public Task<Character?> GetAsync(string id, CancellationToken ct) =>
        Task.FromResult(Items.FirstOrDefault(c => c.Id == id));

    public Task<IReadOnlyList<Character>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Character>>([.. Items.Where(c => c.ProjectId == projectId)]);

    public Task InsertAsync(Character character, CancellationToken ct)
    {
        character.Id = character.Id.Length > 0 ? character.Id : Guid.NewGuid().ToString("n");
        Items.Add(character);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(Character character, CancellationToken ct) => Task.CompletedTask;

    public Task DeleteAsync(string id, CancellationToken ct)
    {
        Items.RemoveAll(c => c.Id == id);
        return Task.CompletedTask;
    }
}

public sealed class FakeAssetRepository : IAssetRepository
{
    public List<Asset> Items { get; } = [];

    public Task<Asset?> GetAsync(string id, CancellationToken ct) =>
        Task.FromResult(Items.FirstOrDefault(a => a.Id == id));

    public Task<IReadOnlyList<Asset>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Asset>>([.. Items.Where(a => a.ProjectId == projectId)]);

    public Task<IReadOnlyList<Asset>> GetManyAsync(IEnumerable<string> ids, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Asset>>([.. Items.Where(a => ids.Contains(a.Id))]);

    public Task InsertAsync(Asset asset, CancellationToken ct)
    {
        asset.Id = asset.Id.Length > 0 ? asset.Id : Guid.NewGuid().ToString("n");
        Items.Add(asset);
        return Task.CompletedTask;
    }

    public Task ReplaceAsync(Asset asset, CancellationToken ct) => Task.CompletedTask;

    public Task DeleteAsync(string id, CancellationToken ct)
    {
        Items.RemoveAll(a => a.Id == id);
        return Task.CompletedTask;
    }
}

/// <summary>
/// An object store that actually holds the bytes, so a test can assert on what came out
/// as well as on what went in. An unknown key still reads as null, which is what the real
/// store does and what several callers branch on.
/// </summary>
public sealed class FakeObjectStore : IObjectStore
{
    public List<string> Deleted { get; } = [];

    public Dictionary<string, byte[]> Contents { get; } = new(StringComparer.Ordinal);

    public async Task SaveAsync(
        string key, Stream content, string contentType, CancellationToken ct = default)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, ct);
        Contents[key] = buffer.ToArray();
    }

    public void Put(string key, byte[] content) => Contents[key] = content;

    public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
        Task.FromResult<Stream?>(
            Contents.TryGetValue(key, out var bytes) ? new MemoryStream(bytes) : null);

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        Deleted.Add(key);
        Contents.Remove(key);
        return Task.CompletedTask;
    }
}
