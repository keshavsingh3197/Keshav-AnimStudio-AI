using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>One provider's activity on one day, for the admin dashboard.</summary>
public sealed record AiUsageDailyTotal(
    string DayBucket,
    string ProviderId,
    AiCapability Capability,
    long Requests,
    long Units,
    long CacheHits,
    long Failures);

public interface IAiUsageRepository
{
    Task RecordAsync(AiUsageRecord record, CancellationToken ct);

    /// <summary>
    /// Requests that actually reached the provider, between two day buckets inclusive.
    /// Cache hits and quota refusals are excluded on purpose: neither spent anything, and
    /// counting them would make the cache look like it exhausts the quota it exists to
    /// protect.
    /// </summary>
    Task<long> CountBillableRequestsAsync(
        string providerId, string fromDayBucket, string toDayBucket, CancellationToken ct);

    Task<IReadOnlyList<AiUsageDailyTotal>> SummarizeAsync(
        string fromDayBucket, string toDayBucket, CancellationToken ct);
}

public interface IAiCredentialRepository
{
    Task<AiCredential?> GetAsync(string providerId, CancellationToken ct);
    Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct);

    /// <summary>Insert or replace by provider id - one key per provider, always.</summary>
    Task UpsertAsync(AiCredential credential, CancellationToken ct);

    Task<bool> DeleteAsync(string providerId, CancellationToken ct);
}

public interface IPromptTemplateRepository
{
    /// <summary>The highest enabled version of one template, or null when none is stored.</summary>
    Task<PromptTemplate?> GetLatestAsync(string templateKey, CancellationToken ct);

    /// <summary>The latest version of every stored template, for the admin console.</summary>
    Task<IReadOnlyList<PromptTemplate>> ListLatestAsync(CancellationToken ct);

    /// <summary>Every version of one template, newest first, so an edit can be compared or undone.</summary>
    Task<IReadOnlyList<PromptTemplate>> ListVersionsAsync(string templateKey, CancellationToken ct);

    /// <summary>
    /// Inserts a new version. Templates are append-only: an edit writes version n+1 rather
    /// than overwriting, because a generated asset's provenance names the version that
    /// produced it, and that reference has to stay resolvable.
    /// </summary>
    Task InsertAsync(PromptTemplate template, CancellationToken ct);
}
