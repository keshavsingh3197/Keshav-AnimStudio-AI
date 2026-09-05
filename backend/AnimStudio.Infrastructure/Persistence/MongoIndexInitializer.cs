using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Scenes;
using KeshavSingh.Mongo.NoSql;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

/// <summary>
/// Creates the indexes the query patterns depend on. Index creation is idempotent, so
/// this runs safely on every start.
/// </summary>
public sealed class MongoIndexInitializer(
    MongoDbService mongo,
    ILogger<MongoIndexInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            // The claim query filters on status + lease and sorts by age.
            var jobs = mongo.GetCollection<RenderJob>(MongoCollections.RenderJobs);
            await jobs.Indexes.CreateManyAsync(
            [
                new CreateIndexModel<RenderJob>(Builders<RenderJob>.IndexKeys
                    .Ascending(j => j.Status)
                    .Ascending(j => j.LeaseExpiresAt)
                    .Ascending(j => j.CreatedAt)),
                new CreateIndexModel<RenderJob>(Builders<RenderJob>.IndexKeys
                    .Ascending(j => j.ProjectId)
                    .Descending(j => j.CreatedAt))
            ], ct).ConfigureAwait(false);

            // Scenes are always listed by project in order.
            var scenes = mongo.GetCollection<Scene>(MongoCollections.Scenes);
            await scenes.Indexes.CreateOneAsync(
                new CreateIndexModel<Scene>(Builders<Scene>.IndexKeys
                    .Ascending(s => s.ProjectId)
                    .Ascending(s => s.OrderKey)), cancellationToken: ct).ConfigureAwait(false);

            logger.LogInformation("Mongo indexes verified.");
        }
        catch (Exception ex)
        {
            // A database that is unreachable at startup must not stop the app from booting;
            // the failure will surface on the first request instead, with a clearer message.
            logger.LogWarning(ex, "Could not verify Mongo indexes at startup.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
