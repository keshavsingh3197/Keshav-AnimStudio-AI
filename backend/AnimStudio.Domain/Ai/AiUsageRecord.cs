namespace AnimStudio.Domain.Ai;

public enum AiCallOutcome
{
    Succeeded = 0,
    CacheHit = 1,
    RefusedByQuota = 2,
    Failed = 3,
    Unavailable = 4
}

/// <summary>
/// One row per attempted AI call, including the ones that never left the process.
/// <para>
/// Cache hits and quota refusals are recorded on purpose: without them the admin
/// dashboard cannot show a cache-hit rate, and the cache-hit rate is the number that
/// decides whether a free tier survives a 40-scene render.
/// </para>
/// </summary>
public sealed class AiUsageRecord
{
    public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public AiCapability Capability { get; set; }
    public string? Model { get; set; }

    public string? ProjectId { get; set; }
    public string? UserId { get; set; }

    /// <summary>UTC calendar day, <c>yyyy-MM-dd</c>. Quota windows and charts both group on this.</summary>
    public string DayBucket { get; set; } = string.Empty;

    /// <summary>Requests, tokens, pixels or audio seconds - whatever the provider bills.</summary>
    public long Units { get; set; }
    public int RequestCount { get; set; } = 1;

    public AiCallOutcome Outcome { get; set; }
    public string? ErrorCode { get; set; }
    public int DurationMs { get; set; }

    public DateTime CreatedAt { get; set; }

    public static string BucketFor(DateTime utc) => utc.ToString("yyyy-MM-dd");
}
