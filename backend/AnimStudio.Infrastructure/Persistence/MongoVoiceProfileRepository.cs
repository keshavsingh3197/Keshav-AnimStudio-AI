using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Voices;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoVoiceProfileRepository(MongoDbService mongo) : IVoiceProfileRepository
{
    private IMongoCollection<VoiceProfile> Collection =>
        mongo.GetCollection<VoiceProfile>(MongoCollections.VoiceProfiles);

    public async Task<VoiceProfile?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(v => v.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<VoiceProfile>> ListByUserAsync(string userId, CancellationToken ct) =>
        await Collection.Find(v => v.UserId == userId)
            .SortBy(v => v.CreatedAtUtc)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(VoiceProfile profile, CancellationToken ct) =>
        Collection.ReplaceOneAsync(v => v.Id == profile.Id, profile, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(v => v.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
