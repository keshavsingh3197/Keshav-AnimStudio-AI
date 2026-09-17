using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoProjectRepository(MongoDbService mongo) : IProjectRepository
{
    private IMongoCollection<Project> Collection =>
        mongo.GetCollection<Project>(MongoCollections.Projects);

    public async Task<Project?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(p => p.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Project>> ListAsync(string userId, CancellationToken ct) =>
        await Collection.Find(p => p.UserId == userId)
            .SortByDescending(p => p.UpdatedAt)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(Project project, CancellationToken ct) =>
        Collection.InsertOneAsync(project, cancellationToken: ct);

    public Task ReplaceAsync(Project project, CancellationToken ct) =>
        Collection.ReplaceOneAsync(p => p.Id == project.Id, project, cancellationToken: ct);

    public Task DeleteAsync(string id, CancellationToken ct) =>
        Collection.DeleteOneAsync(p => p.Id == id, ct);
}

public sealed class MongoCharacterRepository(MongoDbService mongo) : ICharacterRepository
{
    private IMongoCollection<Character> Collection =>
        mongo.GetCollection<Character>(MongoCollections.Characters);

    public async Task<Character?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(c => c.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Character>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        await Collection.Find(c => c.ProjectId == projectId)
            .SortBy(c => c.Name)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(Character character, CancellationToken ct) =>
        Collection.InsertOneAsync(character, cancellationToken: ct);

    public Task ReplaceAsync(Character character, CancellationToken ct) =>
        Collection.ReplaceOneAsync(c => c.Id == character.Id, character, cancellationToken: ct);

    public Task DeleteAsync(string id, CancellationToken ct) =>
        Collection.DeleteOneAsync(c => c.Id == id, ct);
}

public sealed class MongoSceneRepository(MongoDbService mongo) : ISceneRepository
{
    private IMongoCollection<Scene> Collection =>
        mongo.GetCollection<Scene>(MongoCollections.Scenes);

    public async Task<Scene?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(s => s.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Scene>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        await Collection
            // Only active scenes render; orphaned ones are retained for review.
            .Find(s => s.ProjectId == projectId && s.Status == SceneStatus.Active)
            .SortBy(s => s.OrderKey)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(Scene scene, CancellationToken ct) =>
        Collection.InsertOneAsync(scene, cancellationToken: ct);

    public Task InsertManyAsync(IEnumerable<Scene> scenes, CancellationToken ct)
    {
        var list = scenes.ToList();
        return list.Count == 0
            ? Task.CompletedTask
            : Collection.InsertManyAsync(list, cancellationToken: ct);
    }

    public Task ReplaceAsync(Scene scene, CancellationToken ct) =>
        Collection.ReplaceOneAsync(s => s.Id == scene.Id, scene, cancellationToken: ct);

    public Task DeleteAsync(string id, CancellationToken ct) =>
        Collection.DeleteOneAsync(s => s.Id == id, ct);

    public Task DeleteByProjectAsync(string projectId, CancellationToken ct) =>
        Collection.DeleteManyAsync(s => s.ProjectId == projectId, ct);
}

public sealed class MongoAssetFolderRepository(MongoDbService mongo) : IAssetFolderRepository
{
    private IMongoCollection<AssetFolder> Collection =>
        mongo.GetCollection<AssetFolder>(MongoCollections.AssetFolders);

    public async Task<AssetFolder?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(f => f.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<AssetFolder>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        await Collection.Find(f => f.ProjectId == projectId)
            .SortByDescending(f => f.CreatedAt)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(AssetFolder folder, CancellationToken ct) =>
        Collection.InsertOneAsync(folder, cancellationToken: ct);

    public Task ReplaceAsync(AssetFolder folder, CancellationToken ct) =>
        Collection.ReplaceOneAsync(f => f.Id == folder.Id, folder, cancellationToken: ct);

    public Task DeleteAsync(string id, CancellationToken ct) =>
        Collection.DeleteOneAsync(f => f.Id == id, ct);
}

public sealed class MongoAssetRepository(MongoDbService mongo) : IAssetRepository
{
    private IMongoCollection<Asset> Collection =>
        mongo.GetCollection<Asset>(MongoCollections.Assets);

    public async Task<Asset?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(a => a.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Asset>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        await Collection.Find(a => a.ProjectId == projectId)
            .SortByDescending(a => a.CreatedAt)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Asset>> GetManyAsync(
        IEnumerable<string> ids, CancellationToken ct)
    {
        var list = ids.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
        if (list.Count == 0) return [];

        return await Collection.Find(Builders<Asset>.Filter.In(a => a.Id, list))
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public Task InsertAsync(Asset asset, CancellationToken ct) =>
        Collection.InsertOneAsync(asset, cancellationToken: ct);

    public Task ReplaceAsync(Asset asset, CancellationToken ct) =>
        Collection.ReplaceOneAsync(a => a.Id == asset.Id, asset, cancellationToken: ct);

    public Task DeleteAsync(string id, CancellationToken ct) =>
        Collection.DeleteOneAsync(a => a.Id == id, ct);
}

public sealed class MongoScriptRepository(MongoDbService mongo) : IScriptRepository
{
    private IMongoCollection<Script> Collection =>
        mongo.GetCollection<Script>(MongoCollections.Scripts);

    public async Task<Script?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(s => s.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<Script>> ListByProjectAsync(string projectId, CancellationToken ct) =>
        await Collection.Find(s => s.ProjectId == projectId)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(Script script, CancellationToken ct) =>
        Collection.InsertOneAsync(script, cancellationToken: ct);

    public Task ReplaceAsync(Script script, CancellationToken ct) =>
        Collection.ReplaceOneAsync(s => s.Id == script.Id, script, cancellationToken: ct);
}

public sealed class MongoIngestRepository(MongoDbService mongo) : IIngestRepository
{
    private IMongoCollection<TranscriptIngest> Collection =>
        mongo.GetCollection<TranscriptIngest>(MongoCollections.Ingests);

    public async Task<TranscriptIngest?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(i => i.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<TranscriptIngest>> ListByProjectAsync(
        string projectId, CancellationToken ct) =>
        await Collection.Find(i => i.ProjectId == projectId)
            .SortByDescending(i => i.CreatedAt)
            .Limit(50)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<TranscriptIngest?> FindByIdempotencyKeyAsync(
        string projectId, string key, CancellationToken ct) =>
        await Collection.Find(i => i.ProjectId == projectId && i.IdempotencyKey == key)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<TranscriptIngest?> FindBySourceUrlHashAsync(
        string projectId, string hash, CancellationToken ct) =>
        await Collection.Find(i => i.ProjectId == projectId && i.SourceUrlHash == hash)
            .SortByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(TranscriptIngest ingest, CancellationToken ct) =>
        Collection.InsertOneAsync(ingest, cancellationToken: ct);

    public Task ReplaceAsync(TranscriptIngest ingest, CancellationToken ct) =>
        Collection.ReplaceOneAsync(i => i.Id == ingest.Id, ingest, cancellationToken: ct);
}
