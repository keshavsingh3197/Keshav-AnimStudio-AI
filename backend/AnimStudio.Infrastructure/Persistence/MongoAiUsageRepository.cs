using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoAiUsageRepository(MongoDbService mongo) : IAiUsageRepository
{
    /// <summary>
    /// Outcomes that actually reached a provider, and so count against its rate limit. A
    /// failed call still consumed a request - a 429 is a request - which is why it is here
    /// and a cache hit is not.
    /// </summary>
    private static readonly AiCallOutcome[] Billable =
        [AiCallOutcome.Succeeded, AiCallOutcome.Failed];

    private IMongoCollection<AiUsageRecord> Collection =>
        mongo.GetCollection<AiUsageRecord>(MongoCollections.AiUsage);

    public Task RecordAsync(AiUsageRecord record, CancellationToken ct) =>
        Collection.InsertOneAsync(record, cancellationToken: ct);

    public async Task<long> CountBillableRequestsAsync(
        string providerId, string fromDayBucket, string toDayBucket, CancellationToken ct)
    {
        // Day buckets are yyyy-MM-dd, so a lexicographic range is a chronological range.
        var filter = Builders<AiUsageRecord>.Filter.And(
            Builders<AiUsageRecord>.Filter.Eq(r => r.ProviderId, providerId),
            Builders<AiUsageRecord>.Filter.Gte(r => r.DayBucket, fromDayBucket),
            Builders<AiUsageRecord>.Filter.Lte(r => r.DayBucket, toDayBucket),
            Builders<AiUsageRecord>.Filter.In(r => r.Outcome, Billable));

        return await Collection.CountDocumentsAsync(filter, cancellationToken: ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiUsageDailyTotal>> SummarizeAsync(
        string fromDayBucket, string toDayBucket, CancellationToken ct)
    {
        var filter = Builders<AiUsageRecord>.Filter.And(
            Builders<AiUsageRecord>.Filter.Gte(r => r.DayBucket, fromDayBucket),
            Builders<AiUsageRecord>.Filter.Lte(r => r.DayBucket, toDayBucket));

        // Grouped by outcome as well, then folded here. The extra grouping key costs
        // nothing - there are five outcomes - and it keeps the pipeline to plain sums the
        // driver translates predictably, rather than conditional aggregates whose
        // translation would have to be verified against every driver upgrade.
        var groups = await Collection.Aggregate()
            .Match(filter)
            .Group(
                r => new { r.DayBucket, r.ProviderId, r.Capability, r.Outcome },
                g => new
                {
                    g.Key,
                    Requests = g.Sum(x => (long)x.RequestCount),
                    Units = g.Sum(x => x.Units)
                })
            .ToListAsync(ct).ConfigureAwait(false);

        return [.. groups
            .GroupBy(g => (g.Key.DayBucket, g.Key.ProviderId, g.Key.Capability))
            .Select(bucket => new AiUsageDailyTotal(
                bucket.Key.DayBucket,
                bucket.Key.ProviderId,
                bucket.Key.Capability,
                bucket.Sum(g => g.Requests),
                bucket.Sum(g => g.Units),
                bucket.Where(g => g.Key.Outcome == AiCallOutcome.CacheHit).Sum(g => g.Requests),
                bucket.Where(g => g.Key.Outcome == AiCallOutcome.Failed).Sum(g => g.Requests)))
            .OrderByDescending(t => t.DayBucket)
            .ThenBy(t => t.ProviderId)];
    }
}

public sealed class MongoAiCredentialRepository(MongoDbService mongo) : IAiCredentialRepository
{
    private IMongoCollection<AiCredential> Collection =>
        mongo.GetCollection<AiCredential>(MongoCollections.AiCredentials);

    public async Task<AiCredential?> GetAsync(string providerId, CancellationToken ct) =>
        await Collection.Find(c => c.ProviderId == providerId)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) =>
        await Collection.Find(FilterDefinition<AiCredential>.Empty)
            .SortBy(c => c.ProviderId)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(AiCredential credential, CancellationToken ct) =>
        Collection.ReplaceOneAsync(
            c => c.ProviderId == credential.ProviderId,
            credential,
            new ReplaceOptions { IsUpsert = true },
            ct);

    public async Task<bool> DeleteAsync(string providerId, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(c => c.ProviderId == providerId, ct)
            .ConfigureAwait(false);

        return result.DeletedCount > 0;
    }
}

public sealed class MongoPromptTemplateRepository(MongoDbService mongo) : IPromptTemplateRepository
{
    private IMongoCollection<PromptTemplate> Collection =>
        mongo.GetCollection<PromptTemplate>(MongoCollections.PromptTemplates);

    public async Task<PromptTemplate?> GetLatestAsync(string templateKey, CancellationToken ct) =>
        await Collection
            .Find(t => t.TemplateKey == templateKey && t.Enabled)
            .SortByDescending(t => t.Version)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<PromptTemplate>> ListLatestAsync(CancellationToken ct)
    {
        var all = await Collection
            .Find(FilterDefinition<PromptTemplate>.Empty)
            .SortByDescending(t => t.Version)
            .ToListAsync(ct).ConfigureAwait(false);

        // Grouped here rather than in an aggregation: there are a few dozen templates at
        // most, and the pipeline that would replace this is far harder to read than the
        // saving justifies.
        return [.. all
            .GroupBy(t => t.TemplateKey, StringComparer.Ordinal)
            .Select(g => g.MaxBy(t => t.Version)!)
            .OrderBy(t => t.TemplateKey, StringComparer.Ordinal)];
    }

    public async Task<IReadOnlyList<PromptTemplate>> ListVersionsAsync(
        string templateKey, CancellationToken ct) =>
        await Collection
            .Find(t => t.TemplateKey == templateKey)
            .SortByDescending(t => t.Version)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(PromptTemplate template, CancellationToken ct) =>
        Collection.InsertOneAsync(template, cancellationToken: ct);
}
