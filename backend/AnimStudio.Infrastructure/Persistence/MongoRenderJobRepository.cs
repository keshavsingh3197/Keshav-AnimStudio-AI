using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoRenderJobRepository(MongoDbService mongo, TimeProvider clock)
    : IRenderJobRepository
{
    private IMongoCollection<RenderJob> Collection =>
        mongo.GetCollection<RenderJob>(MongoCollections.RenderJobs);

    public async Task<RenderJob?> GetAsync(string id, CancellationToken ct) =>
        await Collection.Find(j => j.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<IReadOnlyList<RenderJob>> ListByProjectAsync(
        string projectId, CancellationToken ct) =>
        await Collection.Find(j => j.ProjectId == projectId)
            .SortByDescending(j => j.CreatedAt)
            .Limit(50)
            .ToListAsync(ct).ConfigureAwait(false);

    public Task InsertAsync(RenderJob job, CancellationToken ct) =>
        Collection.InsertOneAsync(job, cancellationToken: ct);

    /// <summary>
    /// Claims one runnable job in a single atomic operation.
    /// <para>
    /// The filter matches either a Pending job or a Processing one whose lease has expired.
    /// That second case is what makes the queue self-healing: if a worker is killed
    /// mid-render it cannot release its own lease, so without expiry the job would sit in
    /// Processing forever. Because the claim is one FindOneAndUpdate, two workers racing
    /// for the same job cannot both win.
    /// </para>
    /// </summary>
    public async Task<RenderJob?> ClaimNextAsync(
        string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var builder = Builders<RenderJob>.Filter;

        var runnable = builder.And(
            builder.Lt(j => j.Attempts, maxAttempts),
            builder.Or(
                builder.Eq(j => j.Status, RenderJobStatus.Pending),
                builder.And(
                    builder.Eq(j => j.Status, RenderJobStatus.Processing),
                    builder.Lt(j => j.LeaseExpiresAt, now))));

        var update = Builders<RenderJob>.Update
            .Set(j => j.Status, RenderJobStatus.Processing)
            .Set(j => j.LeaseOwner, leaseOwner)
            .Set(j => j.LeaseExpiresAt, now + leaseDuration)
            .Set(j => j.HeartbeatAt, now)
            .Set(j => j.StartedAt, now)
            .Set(j => j.CurrentStage, RenderStage.Preparing)
            // Incremented on every claim, so a job that crashes the worker repeatedly is
            // eventually failed instead of looping forever.
            .Inc(j => j.Attempts, 1);

        return await Collection.FindOneAndUpdateAsync(
            runnable, update,
            new FindOneAndUpdateOptions<RenderJob>
            {
                // Oldest first, so the queue is fair.
                Sort = Builders<RenderJob>.Sort.Ascending(j => j.CreatedAt),
                ReturnDocument = ReturnDocument.After
            }, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// One write that reports progress, renews the lease and reads back cancellation.
    /// <para>
    /// Folding all three into a single round trip is what keeps a ten-minute render from
    /// hammering the database, and it means a worker discovers both "the user cancelled"
    /// and "someone stole my lease" without any extra polling query. The
    /// <c>LeaseOwner</c> term in the filter is the lost-lease guard: if it no longer
    /// matches, nothing is updated and the worker learns to abort.
    /// </para>
    /// </summary>
    public async Task<JobHeartbeatResult> ReportProgressAsync(
        string jobId, string leaseOwner, int progress, string? message, RenderStage stage,
        int scenesDone, TimeSpan leaseDuration, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var builder = Builders<RenderJob>.Filter;

        var mine = builder.And(
            builder.Eq(j => j.Id, jobId),
            builder.Eq(j => j.LeaseOwner, leaseOwner));

        var update = Builders<RenderJob>.Update
            .Set(j => j.Progress, progress)
            .Set(j => j.Message, message)
            .Set(j => j.CurrentStage, stage)
            .Set(j => j.ScenesDone, scenesDone)
            .Set(j => j.HeartbeatAt, now)
            .Set(j => j.LeaseExpiresAt, now + leaseDuration);

        var updated = await Collection.FindOneAndUpdateAsync(
            mine, update,
            new FindOneAndUpdateOptions<RenderJob> { ReturnDocument = ReturnDocument.After },
            ct).ConfigureAwait(false);

        return updated is null
            ? new JobHeartbeatResult(LeaseHeld: false, CancelRequested: false)
            : new JobHeartbeatResult(LeaseHeld: true, updated.CancelRequested);
    }

    public Task CompleteAsync(RenderJob job, CancellationToken ct)
    {
        job.CompletedAt = clock.GetUtcNow().UtcDateTime;

        // The lease is cleared so a terminal job is never re-claimed.
        job.LeaseOwner = null;
        job.LeaseExpiresAt = null;

        return Collection.ReplaceOneAsync(j => j.Id == job.Id, job, cancellationToken: ct);
    }

    public Task RequestCancelAsync(string jobId, CancellationToken ct) =>
        Collection.UpdateOneAsync(
            j => j.Id == jobId,
            Builders<RenderJob>.Update.Set(j => j.CancelRequested, true),
            cancellationToken: ct);

    /// <summary>Ids of jobs that are not finished, used by the workspace janitor.</summary>
    public async Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct)
    {
        var builder = Builders<RenderJob>.Filter;
        var active = builder.In(j => j.Status,
            new[] { RenderJobStatus.Pending, RenderJobStatus.Processing });

        var jobs = await Collection.Find(active)
            .Project(j => j.Id)
            .ToListAsync(ct).ConfigureAwait(false);

        return jobs;
    }
}
