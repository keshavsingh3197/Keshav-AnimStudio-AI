using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Stories;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoStoryGenreRepository(MongoDbService mongo) : IStoryGenreRepository
{
    private IMongoCollection<StoryGenre> Collection =>
        mongo.GetCollection<StoryGenre>(MongoCollections.StoryGenres);

    public async Task<IReadOnlyList<StoryGenre>> ListAsync(CancellationToken ct) =>
        await Collection.Find(FilterDefinition<StoryGenre>.Empty)
            .SortBy(g => g.Order)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task<StoryGenre?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(g => g.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(StoryGenre genre, CancellationToken ct) =>
        Collection.ReplaceOneAsync(g => g.Id == genre.Id, genre, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(g => g.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
