using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoYouTubeChannelAnalysisRepository(MongoDbService mongo) : IYouTubeChannelAnalysisRepository
{
    private IMongoCollection<YouTubeChannelAnalysis> Collection =>
        mongo.GetCollection<YouTubeChannelAnalysis>(MongoCollections.YouTubeChannelAnalyses);

    public async Task<YouTubeChannelAnalysis?> GetAsync(string userId, string channelId, CancellationToken ct) =>
        await Collection.Find(a => a.UserId == userId && a.ChannelId == channelId)
            .SortByDescending(a => a.UpdatedAtUtc)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<YouTubeChannelAnalysis>> ListByUserAsync(string userId, CancellationToken ct) =>
        await Collection.Find(a => a.UserId == userId)
            .SortByDescending(a => a.UpdatedAtUtc)
            .Limit(100)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(YouTubeChannelAnalysis analysis, CancellationToken ct) =>
        Collection.ReplaceOneAsync(a => a.Id == analysis.Id, analysis, new ReplaceOptions { IsUpsert = true }, ct);
}
