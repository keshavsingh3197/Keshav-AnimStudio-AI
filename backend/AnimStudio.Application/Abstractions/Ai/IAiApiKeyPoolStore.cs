using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

public enum AiApiKeyHealthStatus
{
    Ready = 0,
    Cooldown = 1,
    QuotaExhausted = 2,
    Rejected = 3,
    Disabled = 4
}

public sealed record AiApiKeySnapshot(
    string Id,
    string Vendor,
    string Label,
    string? Notes,
    IReadOnlyList<string> ProviderIds,
    int Priority,
    bool Enabled,
    AiCredentialSource Source,
    string Masked,
    string? Fingerprint,
    DateTime? CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? RotatedAtUtc,
    DateTime? LastUsedAtUtc,
    DateTime? LastSucceededAtUtc,
    DateTime? CooldownUntilUtc,
    string? CooldownReason,
    string? LastErrorCode,
    string? UsageDayBucket,
    long UsageCountToday,
    AiApiKeyHealthStatus Status);

public sealed record AiApiKeyVendorSnapshot(
    string Vendor,
    string DisplayName,
    string Description,
    string? KeyUrl,
    bool ExpandedByDefault,
    IReadOnlyList<string> ProviderIds,
    IReadOnlyList<AiApiKeySnapshot> Keys);

public sealed record AiApiKeyTestVerdict(
    string KeyId,
    string Vendor,
    string Label,
    bool Healthy,
    int? StatusCode,
    string? Reason);

public sealed record CreateAiApiKeyCommand(
    string Vendor,
    string Label,
    string? Notes,
    IReadOnlyList<string>? ProviderIds,
    string Key,
    bool Enabled = true,
    int? Priority = null);

public sealed record UpdateAiApiKeyCommand(
    string Label,
    string? Notes,
    IReadOnlyList<string>? ProviderIds,
    bool Enabled,
    string? Key = null,
    bool ClearCooldown = false);

/// <summary>
/// Manages ordered, encrypted multi-key pools grouped by vendor (for instance multiple Google AI Studio
/// keys under <c>google</c>) with automatic quota failover and backwards-compatible sync to legacy
/// single-key storage.
/// </summary>
public interface IAiApiKeyPoolStore
{
    /// <summary>Idempotently mirrors legacy database-held single provider keys into the pool on first run.</summary>
    Task EnsureBackfilledAsync(CancellationToken ct);

    Task<IReadOnlyList<AiApiKeyVendorSnapshot>> ListVendorsAsync(CancellationToken ct);

    Task<AiApiKeySnapshot> AddKeyAsync(CreateAiApiKeyCommand command, string? actorUserId, CancellationToken ct);

    Task<AiApiKeySnapshot> UpdateKeyAsync(string keyId, UpdateAiApiKeyCommand command, string? actorUserId, CancellationToken ct);

    Task ReorderVendorAsync(string vendor, IReadOnlyList<string> orderedKeyIds, string? actorUserId, CancellationToken ct);

    Task<bool> DeleteKeyAsync(string keyId, CancellationToken ct);

    Task<AiApiKeySnapshot?> ResetKeyStatusAsync(string keyId, CancellationToken ct);

    Task<AiApiKeyTestVerdict> TestKeyAsync(string keyId, CancellationToken ct);

    /// <summary>
    /// Ordered secret candidates for runtime requests on <paramref name="provider"/>, excluding disabled or
    /// actively cooling-down keys.
    /// </summary>
    Task<(IReadOnlyList<AiSecretCandidate> Candidates, AiSecretPoolCooldown Cooldown)> ResolveCandidatesAsync(
        AiProviderId provider, CancellationToken ct);

    Task<bool> HasInstalledKeysAsync(AiProviderId provider, CancellationToken ct);

    Task RecordOutcomeAsync(
        AiProviderId provider,
        string? keyId,
        string? fingerprint,
        AiSecretOutcomeKind outcome,
        string? errorCode,
        DateTime? retryAfterUtc,
        CancellationToken ct);
}
