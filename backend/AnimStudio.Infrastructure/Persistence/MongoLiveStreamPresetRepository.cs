using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoLiveStreamPresetRepository(MongoDbService mongo) : ILiveStreamPresetRepository
{
    private IMongoCollection<LiveStreamPreset> Collection =>
        mongo.GetCollection<LiveStreamPreset>(MongoCollections.LiveStreamPresets);

    public async Task<IReadOnlyList<LiveStreamPreset>> ListAsync(string userId, CancellationToken ct)
    {
        var list = await Collection.Find(p => p.UserId == userId).ToListAsync(ct).ConfigureAwait(false);
        return list.OrderByDescending(p => p.LastUsedAtUtc ?? p.UpdatedAtUtc).ToList();
    }

    public async Task<LiveStreamPreset?> GetAsync(string userId, string id, CancellationToken ct) =>
        await Collection.Find(p => p.Id == id && p.UserId == userId).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(LiveStreamPreset preset, CancellationToken ct) =>
        Collection.ReplaceOneAsync(p => p.Id == preset.Id, preset, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(p => p.Id == id && p.UserId == userId, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
