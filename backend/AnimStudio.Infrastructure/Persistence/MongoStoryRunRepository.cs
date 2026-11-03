using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Stories;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoStoryRunRepository(MongoDbService mongo) : IStoryRunRepository
{
    private IMongoCollection<StoryRun> Collection =>
        mongo.GetCollection<StoryRun>(MongoCollections.StoryRuns);

    public async Task<StoryRun?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(r => r.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<StoryRun>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
        await Collection.Find(r => r.UserId == userId)
            .SortByDescending(r => r.UpdatedAtUtc)
            .Limit(Math.Clamp(limit, 1, 500))
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<StoryRun>> ListWorkingAsync(CancellationToken ct)
    {
        var working = StoryRun.WorkingStatuses;
        return await Collection.Find(r => working.Contains(r.Status))
            .SortBy(r => r.UpdatedAtUtc)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<int> CountWorkingByUserAsync(string userId, CancellationToken ct)
    {
        var working = StoryRun.WorkingStatuses;
        var count = await Collection.CountDocumentsAsync(r => r.UserId == userId && working.Contains(r.Status), cancellationToken: ct)
            .ConfigureAwait(false);
        return (int)count;
    }

    public Task UpsertAsync(StoryRun run, CancellationToken ct) =>
        Collection.ReplaceOneAsync(r => r.Id == run.Id, run, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(r => r.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
