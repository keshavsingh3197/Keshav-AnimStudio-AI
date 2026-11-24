using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

public sealed record AiSecretCandidate(
    string? KeyId,
    string Fingerprint,
    string Secret,
    string? Label = null);

public enum AiSecretOutcomeKind
{
    Succeeded = 0,
    RateLimited = 1,
    QuotaExhausted = 2,
    CredentialRejected = 3
}

public sealed record AiSecretPoolCooldown(
    bool AllInCooldown,
    DateTime? EarliestResetUtc,
    string? Reason)
{
    public static readonly AiSecretPoolCooldown None = new(false, null, null);
}

/// <summary>
/// What a provider is allowed to ask about its own API key(s).
/// </summary>
/// <remarks>
/// <para>
/// This exists because of a lifetime mismatch. Providers are singletons - the registry
/// holds them and the circuit state has to outlive a request - but
/// <see cref="IAiCredentialStore"/> is scoped, because it reads an encrypted key through a
/// scoped repository. A singleton cannot hold a scoped dependency, and having every
/// provider open its own service scope would be the same awkward code written twelve times.
/// </para>
/// <para>
/// The split between the two members is deliberate and is a security decision.
/// <see cref="IsInstalled"/> answers "is there a key?" from a cached flag, because
/// <c>IAiProvider.IsConfigured</c> is synchronous and is called every time a chain is
/// composed. <see cref="GetSecretAsync"/> fetches the key itself fresh on every call and
/// never caches it: a boolean sitting in memory is harmless, a plaintext API key sitting
/// in memory between calls is an exposure with no upside, since the cost of a decrypt is
/// nothing next to the network call it precedes.
/// </para>
/// </remarks>
public interface IAiSecretResolver
{
    /// <summary>
    /// The plaintext key for one call. Never cached, never logged, never returned from a
    /// controller. Null when no key is installed.
    /// </summary>
    Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct);

    /// <summary>
    /// Ordered candidate keys for failover on <paramref name="provider"/>, excluding keys in
    /// active cooldown. Default falls back cleanly to <see cref="GetSecretAsync"/>.
    /// </summary>
    async Task<IReadOnlyList<AiSecretCandidate>> GetSecretCandidatesAsync(
        AiProviderId provider, CancellationToken ct)
    {
        var secret = await GetSecretAsync(provider, ct).ConfigureAwait(false);
        return string.IsNullOrEmpty(secret)
            ? []
            : [new AiSecretCandidate(null, "single", secret)];
    }

    /// <summary>
    /// Reports whether every key for <paramref name="provider"/> is temporarily in cooldown.
    /// </summary>
    AiSecretPoolCooldown GetPoolCooldown(AiProviderId provider) => AiSecretPoolCooldown.None;

    /// <summary>
    /// Records success or a key-level failure (quota exhaustion, rate limit, rejection) so
    /// subsequent calls immediately prioritize healthy backup keys.
    /// </summary>
    Task RecordSecretOutcomeAsync(
        AiProviderId provider,
        string? keyId,
        string? fingerprint,
        AiSecretOutcomeKind outcome,
        string? errorCode,
        DateTime? retryAfterUtc,
        CancellationToken ct) => Task.CompletedTask;

    /// <summary>
    /// Whether a key is installed, cheaply enough to be called on every chain composition.
    /// Answers from configuration immediately and from the database once warmed.
    /// </summary>
    bool IsInstalled(AiProviderId provider);

    /// <summary>
    /// Called after a key is added or removed so that the next capability check reflects
    /// it, rather than the admin console appearing to save a key that changes nothing.
    /// </summary>
    void Invalidate(AiProviderId provider);

    /// <summary>Populates the presence cache. Run once at startup.</summary>
    Task WarmAsync(CancellationToken ct);
}
