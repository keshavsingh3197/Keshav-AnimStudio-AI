using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoLiveStreamKeyRepository(MongoDbService mongo) : ILiveStreamKeyRepository
{
    private IMongoCollection<LiveStreamKey> Collection =>
        mongo.GetCollection<LiveStreamKey>(MongoCollections.LiveStreamKeys);

    public async Task<LiveStreamKey?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(k => k.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<LiveStreamKey>> ListAsync(CancellationToken ct) =>
        await Collection.Find(FilterDefinition<LiveStreamKey>.Empty)
            .SortBy(k => k.Id)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(LiveStreamKey key, CancellationToken ct) =>
        Collection.ReplaceOneAsync(k => k.Id == key.Id, key, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(k => k.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
