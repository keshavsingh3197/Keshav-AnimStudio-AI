using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>
/// What a provider is allowed to ask about its own API key.
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
