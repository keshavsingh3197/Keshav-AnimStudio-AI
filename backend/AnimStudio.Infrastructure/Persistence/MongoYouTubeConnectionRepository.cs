using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoYouTubeConnectionRepository(MongoDbService mongo) : IYouTubeConnectionRepository
{
    private IMongoCollection<YouTubeChannelConnection> Collection =>
        mongo.GetCollection<YouTubeChannelConnection>(MongoCollections.YouTubeConnections);

    public async Task<YouTubeChannelConnection?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(c => c.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<YouTubeChannelConnection>> ListByUserAsync(string userId, CancellationToken ct) =>
        await Collection.Find(c => c.UserId == userId)
            .SortBy(c => c.ConnectedAt)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(YouTubeChannelConnection connection, CancellationToken ct) =>
        Collection.ReplaceOneAsync(c => c.Id == connection.Id, connection, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(c => c.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
