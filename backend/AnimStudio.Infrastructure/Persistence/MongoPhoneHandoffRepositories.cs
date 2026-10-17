using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoGoogleDriveConnectionRepository(MongoDbService mongo) : IGoogleDriveConnectionRepository
{
    private IMongoCollection<GoogleDriveConnection> Collection =>
        mongo.GetCollection<GoogleDriveConnection>(MongoCollections.GoogleDriveConnections);

    public async Task<GoogleDriveConnection?> GetAsync(string userId, string? channelId, CancellationToken ct)
    {
        var key = GoogleDriveConnection.KeyFor(userId, channelId);
        return await Collection.Find(c => c.Id == key && c.UserId == userId).FirstOrDefaultAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<GoogleDriveConnection>> ListByUserAsync(string userId, CancellationToken ct) =>
        await Collection.Find(c => c.UserId == userId).ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(GoogleDriveConnection connection, CancellationToken ct) =>
        Collection.ReplaceOneAsync(c => c.Id == connection.Id, connection, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string userId, string? channelId, CancellationToken ct)
    {
        var key = GoogleDriveConnection.KeyFor(userId, channelId);
        var result = await Collection.DeleteOneAsync(c => c.Id == key && c.UserId == userId, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}

public sealed class MongoPhoneHandoffRepository(MongoDbService mongo) : IPhoneHandoffRepository
{
    private IMongoCollection<PhoneHandoff> Collection =>
        mongo.GetCollection<PhoneHandoff>(MongoCollections.PhoneHandoffs);

    public async Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(h => h.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct)
    {
        var filter = Builders<PhoneHandoff>.Filter.Eq(h => h.UserId, userId);
        if (jobId is not null)
            filter &= Builders<PhoneHandoff>.Filter.Eq(h => h.JobId, jobId);

        return await Collection.Find(filter)
            .SortByDescending(h => h.CreatedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct) =>
        await Collection.Find(h => h.State == state)
            .SortBy(h => h.CreatedAt)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct) =>
        Collection.ReplaceOneAsync(h => h.Id == handoff.Id, handoff, new ReplaceOptions { IsUpsert = true }, ct);
}
