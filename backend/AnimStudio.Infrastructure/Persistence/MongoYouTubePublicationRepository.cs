using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoYouTubePublicationRepository(MongoDbService mongo) : IYouTubePublicationRepository
{
    private IMongoCollection<YouTubePublication> Collection =>
        mongo.GetCollection<YouTubePublication>(MongoCollections.YouTubePublications);

    public async Task<YouTubePublication?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(p => p.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<YouTubePublication>> ListByUserAsync(string userId, string? projectId, int limit, CancellationToken ct)
    {
        var filter = Builders<YouTubePublication>.Filter.Eq(p => p.UserId, userId);
        if (projectId is not null)
            filter &= Builders<YouTubePublication>.Filter.Eq(p => p.ProjectId, projectId);

        return await Collection.Find(filter)
            .SortByDescending(p => p.PublishedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<YouTubePublication>> ListByVideoIdsAsync(string userId, IReadOnlyCollection<string> videoIds, CancellationToken ct)
    {
        if (videoIds.Count == 0) return [];
        return await Collection.Find(p => p.UserId == userId && videoIds.Contains(p.VideoId))
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<YouTubePublication>> ListDueForCheckAsync(DateTime publishedAfter, DateTime checkedBefore, int limit, CancellationToken ct)
    {
        var f = Builders<YouTubePublication>.Filter;
        var filter = f.Gte(p => p.PublishedAt, publishedAfter)
            & f.Ne(p => p.Health, YouTubeVideoHealth.Removed)
            & (f.Eq(p => p.LastCheckedAt, null) | f.Lt(p => p.LastCheckedAt, checkedBefore));

        return await Collection.Find(filter)
            .SortBy(p => p.LastCheckedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public Task UpsertAsync(YouTubePublication publication, CancellationToken ct) =>
        Collection.ReplaceOneAsync(p => p.Id == publication.Id, publication, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(p => p.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
