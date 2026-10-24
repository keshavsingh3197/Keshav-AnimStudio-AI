using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Planning;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoContentTopicRepository(MongoDbService mongo) : IContentTopicRepository
{
    private IMongoCollection<ContentTopic> Collection =>
        mongo.GetCollection<ContentTopic>(MongoCollections.ContentTopics);

    public async Task<ContentTopic?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(t => t.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) =>
        await Collection.Find(t => t.UserId == userId).SortBy(t => t.Name).Limit(200).ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) =>
        await Collection.Find(t => !t.Archived).SortBy(t => t.UpdatedAt).Limit(limit).ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(ContentTopic topic, CancellationToken ct) =>
        Collection.ReplaceOneAsync(t => t.Id == topic.Id, topic, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        (await Collection.DeleteOneAsync(t => t.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;
}

public sealed class MongoContentPlanItemRepository(MongoDbService mongo) : IContentPlanItemRepository
{
    private IMongoCollection<ContentPlanItem> Collection =>
        mongo.GetCollection<ContentPlanItem>(MongoCollections.ContentPlanItems);

    public async Task<ContentPlanItem?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(i => i.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<ContentPlanItem>> ListByUserAsync(
        string userId, DateTime fromUtc, DateTime toUtc, string? topicId, int limit, CancellationToken ct)
    {
        var f = Builders<ContentPlanItem>.Filter;
        var filter = f.Eq(i => i.UserId, userId) & f.Gte(i => i.PublishAt, fromUtc) & f.Lt(i => i.PublishAt, toUtc);
        if (topicId is not null) filter &= f.Eq(i => i.TopicId, topicId);
        return await Collection.Find(filter).SortBy(i => i.PublishAt).Limit(limit).ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ContentPlanItem>> ListByTopicAsync(string topicId, int limit, CancellationToken ct) =>
        await Collection.Find(i => i.TopicId == topicId).SortByDescending(i => i.PublishAt).Limit(limit).ToListAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<ContentPlanItem>> ListInWindowAsync(DateTime fromUtc, DateTime toUtc, int limit, CancellationToken ct) =>
        await Collection.Find(i => i.PublishAt >= fromUtc && i.PublishAt < toUtc)
            .SortBy(i => i.PublishAt).Limit(limit).ToListAsync(ct).ConfigureAwait(false);

    public async Task<ContentPlanItem?> FindByVideoIdAsync(string userId, string videoId, CancellationToken ct) =>
        await Collection.Find(i => i.UserId == userId && i.VideoId == videoId).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(ContentPlanItem item, CancellationToken ct) =>
        Collection.ReplaceOneAsync(i => i.Id == item.Id, item, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        (await Collection.DeleteOneAsync(i => i.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;

    public async Task<int> DeleteByTopicAsync(string topicId, CancellationToken ct) =>
        (int)(await Collection.DeleteManyAsync(i => i.TopicId == topicId, ct).ConfigureAwait(false)).DeletedCount;
}

public sealed class MongoContentSourceLinkRepository(MongoDbService mongo) : IContentSourceLinkRepository
{
    private IMongoCollection<ContentSourceLink> Collection =>
        mongo.GetCollection<ContentSourceLink>(MongoCollections.ContentSourceLinks);

    public async Task<ContentSourceLink?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(l => l.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<ContentSourceLink?> FindByUrlHashAsync(string userId, string urlHash, CancellationToken ct) =>
        await Collection.Find(l => l.UserId == userId && l.UrlHash == urlHash).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<ContentSourceLink>> ListByUserAsync(
        string userId, string? topicId, string? planItemId, int limit, CancellationToken ct)
    {
        var f = Builders<ContentSourceLink>.Filter;
        var filter = f.Eq(l => l.UserId, userId);
        if (topicId is not null) filter &= f.Eq(l => l.TopicId, topicId);
        if (planItemId is not null) filter &= f.Eq(l => l.PlanItemId, planItemId);
        return await Collection.Find(filter).SortByDescending(l => l.LastCapturedAt).Limit(limit).ToListAsync(ct).ConfigureAwait(false);
    }

    public Task UpsertAsync(ContentSourceLink link, CancellationToken ct) =>
        Collection.ReplaceOneAsync(l => l.Id == link.Id, link, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        (await Collection.DeleteOneAsync(l => l.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;
}
