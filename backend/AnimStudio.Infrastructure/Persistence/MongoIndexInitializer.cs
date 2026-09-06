using AnimStudio.Domain.Ai;
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

            // Every AI call checks the quota, which counts by provider within a day range,
            // and the admin dashboard reads the same rows by day.
            var aiUsage = mongo.GetCollection<AiUsageRecord>(MongoCollections.AiUsage);
            await aiUsage.Indexes.CreateManyAsync(
            [
                new CreateIndexModel<AiUsageRecord>(Builders<AiUsageRecord>.IndexKeys
                    .Ascending(r => r.ProviderId)
                    .Ascending(r => r.DayBucket)
                    .Ascending(r => r.Outcome)),
                new CreateIndexModel<AiUsageRecord>(Builders<AiUsageRecord>.IndexKeys
                    .Ascending(r => r.DayBucket))
            ], ct).ConfigureAwait(false);

            // Templates are append-only, so every read is "the highest version of this key".
            var prompts = mongo.GetCollection<PromptTemplate>(MongoCollections.PromptTemplates);
            await prompts.Indexes.CreateOneAsync(
                new CreateIndexModel<PromptTemplate>(Builders<PromptTemplate>.IndexKeys
                    .Ascending(t => t.TemplateKey)
                    .Descending(t => t.Version)), cancellationToken: ct).ConfigureAwait(false);

            // The audit trail is only ever read newest-first.
            var auditEntries = mongo.GetCollection<AdminAuditEntry>(MongoCollections.AdminAudit);
            await auditEntries.Indexes.CreateOneAsync(
                new CreateIndexModel<AdminAuditEntry>(Builders<AdminAuditEntry>.IndexKeys
                    .Descending(e => e.AtUtc)), cancellationToken: ct).ConfigureAwait(false);

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
