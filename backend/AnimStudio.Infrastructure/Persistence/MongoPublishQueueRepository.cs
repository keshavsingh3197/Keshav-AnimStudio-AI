using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoPublishQueueRepository(MongoDbService mongo) : IPublishQueueRepository
{
    private IMongoCollection<PublishQueueItem> Collection =>
        mongo.GetCollection<PublishQueueItem>(MongoCollections.PublishQueue);

    public async Task<PublishQueueItem?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(i => i.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<PublishQueueItem>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
        await Collection.Find(i => i.UserId == userId)
            .SortByDescending(i => i.CreatedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<PublishQueueItem>> ListDueAsync(DateTime dueBefore, int limit, CancellationToken ct) =>
        await Collection.Find(i => i.State == PublishQueueState.Waiting && i.DueAt != null && i.DueAt <= dueBefore)
            .SortBy(i => i.DueAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<PublishQueueItem>> ListByStateAsync(PublishQueueState state, int limit, CancellationToken ct) =>
        await Collection.Find(i => i.State == state)
            .SortBy(i => i.CreatedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(PublishQueueItem item, CancellationToken ct) =>
        Collection.InsertOneAsync(item, cancellationToken: ct);

    public async Task<bool> ReplaceAsync(PublishQueueItem item, CancellationToken ct)
    {
        var expected = item.Version;
        item.Version = expected + 1;
        var result = await Collection.ReplaceOneAsync(i => i.Id == item.Id && i.Version == expected, item, cancellationToken: ct)
            .ConfigureAwait(false);
        if (result.MatchedCount > 0) return true;

        item.Version = expected;
        return false;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(i => i.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
