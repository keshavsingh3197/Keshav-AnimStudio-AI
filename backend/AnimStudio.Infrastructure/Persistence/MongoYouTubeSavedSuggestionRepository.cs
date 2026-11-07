using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoYouTubeSavedSuggestionRepository(MongoDbService mongo) : IYouTubeSavedSuggestionRepository
{
    private IMongoCollection<YouTubeSavedSuggestion> Collection =>
        mongo.GetCollection<YouTubeSavedSuggestion>(MongoCollections.YouTubeSavedSuggestions);

    public async Task<YouTubeSavedSuggestion?> FindAsync(string userId, string fingerprint, CancellationToken ct) =>
        await Collection.Find(s => s.UserId == userId && s.Fingerprint == fingerprint)
            .SortByDescending(s => s.CreatedAtUtc)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<YouTubeSavedSuggestion>> ListRecentAsync(string userId, string language, int limit, CancellationToken ct) =>
        await Collection.Find(s => s.UserId == userId && s.Language == language)
            .SortByDescending(s => s.CreatedAtUtc)
            .Limit(limit)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(YouTubeSavedSuggestion suggestion, CancellationToken ct) =>
        Collection.ReplaceOneAsync(s => s.Id == suggestion.Id, suggestion, new ReplaceOptions { IsUpsert = true }, ct);
}
