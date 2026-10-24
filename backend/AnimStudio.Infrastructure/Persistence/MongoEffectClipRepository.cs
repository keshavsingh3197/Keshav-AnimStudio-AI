using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Effects;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoEffectClipRepository(MongoDbService mongo) : IEffectClipRepository
{
    private IMongoCollection<EffectClip> Collection =>
        mongo.GetCollection<EffectClip>(MongoCollections.EffectClips);

    public async Task<EffectClip?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(e => e.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<EffectClip>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
        await Collection.Find(e => e.UserId == userId).SortByDescending(e => e.CreatedAt).Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<EffectClip?> FindBySourceAssetAsync(string userId, string sourceAssetId, CancellationToken ct) =>
        await Collection.Find(e => e.UserId == userId && e.SourceAssetId == sourceAssetId)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(EffectClip effect, CancellationToken ct) =>
        Collection.ReplaceOneAsync(e => e.Id == effect.Id, effect, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        (await Collection.DeleteOneAsync(e => e.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;
}
