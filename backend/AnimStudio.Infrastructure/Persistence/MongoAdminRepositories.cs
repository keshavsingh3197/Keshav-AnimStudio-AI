using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

/// <summary>
/// The one AI settings document. A fixed id means the collection can never quietly grow a
/// second, shadowing copy.
/// </summary>
public sealed class MongoAiSettingsRepository(MongoDbService mongo) : IAiSettingsRepository
{
    private IMongoCollection<AiSettings> Collection =>
        mongo.GetCollection<AiSettings>(MongoCollections.AiSettings);

    public async Task<AiSettings?> GetAsync(CancellationToken ct) =>
        await Collection.Find(s => s.Id == AiSettings.SingletonId)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task SaveAsync(AiSettings settings, CancellationToken ct)
    {
        settings.Id = AiSettings.SingletonId;

        return Collection.ReplaceOneAsync(
            s => s.Id == AiSettings.SingletonId,
            settings,
            new ReplaceOptions { IsUpsert = true },
            ct);
    }
}

/// <summary>
/// The admin audit trail. Insert and read, and nothing else - the interface offers no
/// update or delete, so a record cannot be tidied away by the person it records.
/// </summary>
public sealed class MongoAdminAuditRepository(MongoDbService mongo) : IAdminAuditRepository
{
    /// <summary>A page nobody reads past. The trail is a record, not a report.</summary>
    private const int MaxLimit = 500;

    private IMongoCollection<AdminAuditEntry> Collection =>
        mongo.GetCollection<AdminAuditEntry>(MongoCollections.AdminAudit);

    public Task AppendAsync(AdminAuditEntry entry, CancellationToken ct) =>
        Collection.InsertOneAsync(entry, cancellationToken: ct);

    public async Task<IReadOnlyList<AdminAuditEntry>> ListRecentAsync(int limit, CancellationToken ct) =>
        await Collection.Find(FilterDefinition<AdminAuditEntry>.Empty)
            .SortByDescending(e => e.AtUtc)
            .Limit(Math.Clamp(limit, 1, MaxLimit))
            .ToListAsync(ct).ConfigureAwait(false);
}
