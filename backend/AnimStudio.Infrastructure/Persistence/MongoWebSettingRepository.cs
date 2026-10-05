using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.System;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoWebSettingRepository(MongoDbService mongo) : IWebSettingRepository
{
    private IMongoCollection<WebSetting> Collection =>
        mongo.GetCollection<WebSetting>(MongoCollections.WebSettings);

    public async Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct) =>
        await Collection.Find(FilterDefinition<WebSetting>.Empty)
            .SortBy(s => s.Id)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task UpsertAsync(WebSetting setting, CancellationToken ct) =>
        Collection.ReplaceOneAsync(s => s.Id == setting.Id, setting, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        var result = await Collection.DeleteOneAsync(s => s.Id == id, ct).ConfigureAwait(false);
        return result.DeletedCount > 0;
    }
}
