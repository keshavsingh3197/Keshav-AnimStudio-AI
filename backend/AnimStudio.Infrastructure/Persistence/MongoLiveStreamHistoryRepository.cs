using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoLiveStreamHistoryRepository(MongoDbService mongo) : ILiveStreamHistoryRepository
{
    private IMongoCollection<LiveStreamHistoryEntry> Collection =>
        mongo.GetCollection<LiveStreamHistoryEntry>(MongoCollections.LiveStreamHistory);

    public async Task<IReadOnlyList<LiveStreamHistoryEntry>> ListAsync(string userId, CancellationToken ct)
    {
        var list = await Collection.Find(e => e.UserId == userId).ToListAsync(ct).ConfigureAwait(false);
        return list.OrderByDescending(e => e.CreatedAtUtc).ToList();
    }

    public async Task<LiveStreamHistoryEntry?> GetAsync(string userId, string id, CancellationToken ct) =>
        await Collection.Find(e => e.Id == id && e.UserId == userId).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(LiveStreamHistoryEntry entry, CancellationToken ct) =>
        Collection.ReplaceOneAsync(e => e.Id == entry.Id, entry, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(e => e.Id == id && e.UserId == userId, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }

    public async Task<int> DeleteAllAsync(string userId, CancellationToken ct)
    {
        var result = await Collection.DeleteManyAsync(e => e.UserId == userId, ct).ConfigureAwait(false);
        return (int)result.DeletedCount;
    }
}
