using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;

namespace AnimStudio.Application.Abstractions.Persistence;

public interface IProjectRepository
{
    Task<Project?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<Project>> ListAsync(string userId, CancellationToken ct);
    Task InsertAsync(Project project, CancellationToken ct);
    Task ReplaceAsync(Project project, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}

public interface ICharacterRepository
{
    Task<Character?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<Character>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task InsertAsync(Character character, CancellationToken ct);
    Task ReplaceAsync(Character character, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}

public interface ISceneRepository
{
    Task<Scene?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<Scene>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task InsertAsync(Scene scene, CancellationToken ct);
    Task InsertManyAsync(IEnumerable<Scene> scenes, CancellationToken ct);
    Task ReplaceAsync(Scene scene, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
    Task DeleteByProjectAsync(string projectId, CancellationToken ct);
}

public interface IAssetRepository
{
    Task<Asset?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<Asset>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task<IReadOnlyList<Asset>> GetManyAsync(IEnumerable<string> ids, CancellationToken ct);
    Task InsertAsync(Asset asset, CancellationToken ct);
    Task ReplaceAsync(Asset asset, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}

public interface IScriptRepository
{
    Task<Script?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<Script>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task InsertAsync(Script script, CancellationToken ct);
    Task ReplaceAsync(Script script, CancellationToken ct);
}

public interface IIngestRepository
{
    Task<TranscriptIngest?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<TranscriptIngest>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task<TranscriptIngest?> FindByIdempotencyKeyAsync(string projectId, string key, CancellationToken ct);
    Task<TranscriptIngest?> FindBySourceUrlHashAsync(string projectId, string hash, CancellationToken ct);
    Task InsertAsync(TranscriptIngest ingest, CancellationToken ct);
    Task ReplaceAsync(TranscriptIngest ingest, CancellationToken ct);
}

/// <summary>Progress/lease update result, so a worker learns it was cancelled or lost its lease.</summary>
public sealed record JobHeartbeatResult(bool LeaseHeld, bool CancelRequested);

public interface IRenderJobRepository
{
    Task<RenderJob?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct);
    Task InsertAsync(RenderJob job, CancellationToken ct);

    /// <summary>
    /// Atomically claims one runnable job: either Pending, or Processing with an expired
    /// lease (a crashed worker). Returns null when there is nothing to do.
    /// </summary>
    Task<RenderJob?> ClaimNextAsync(string leaseOwner, TimeSpan leaseDuration, int maxAttempts,
        CancellationToken ct);

    /// <summary>
    /// One write that reports progress, renews the lease and reads back cancellation.
    /// Doing all three in a single round trip is what keeps a 10-minute render from
    /// hammering the database.
    /// </summary>
    Task<JobHeartbeatResult> ReportProgressAsync(string jobId, string leaseOwner, int progress,
        string? message, Domain.Rendering.RenderStage stage, int scenesDone, TimeSpan leaseDuration,
        CancellationToken ct);

    Task CompleteAsync(RenderJob job, CancellationToken ct);
    Task RequestCancelAsync(string jobId, CancellationToken ct);
    Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct);

    /// <summary>
    /// The most recent jobs across every project, for the admin job console. Not scoped to
    /// an owner, which is precisely why it is only reachable behind the admin policy.
    /// </summary>
    Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct);

    /// <summary>
    /// Puts a finished-but-unsuccessful job back in the queue: attempts reset, lease and
    /// error cleared. Returns false when the job is missing or did not end in a state worth
    /// retrying - a completed render is not requeued, because that would silently discard
    /// its output.
    /// </summary>
    Task<bool> RequeueAsync(string jobId, CancellationToken ct);
}
