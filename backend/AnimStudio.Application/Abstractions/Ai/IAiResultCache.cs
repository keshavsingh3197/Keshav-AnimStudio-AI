using System.Security.Cryptography;
using System.Text;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>
/// The identity of one cacheable AI result.
/// <para>
/// Content-addressed rather than keyed by anything human: two callers that want the same
/// image from the same provider with the same seed must collide on purpose. This is the
/// single biggest reason a free tier survives a long render - a retried pipeline stage, a
/// re-render, and forty scenes set in the same arena all cost one generation.
/// </para>
/// </summary>
public readonly record struct AiCacheKey
{
    /// <summary>
    /// Separates the parts of the hashed payload. A character that cannot occur in a
    /// provider id, a model name or a capability name, so "ab" + "c" and "a" + "bc" can
    /// never hash the same.
    /// </summary>
    private const char Separator = '\n';

    private AiCacheKey(AiCapability capability, string hash)
    {
        Capability = capability;
        Hash = hash;
    }

    public AiCapability Capability { get; }

    /// <summary>Lower-case hex SHA-256. Safe in a storage key by construction.</summary>
    public string Hash { get; }

    public bool IsEmpty => string.IsNullOrEmpty(Hash);

    /// <summary>
    /// Fanned out by the first two hex characters so a local disk cache does not end up
    /// with one directory holding every object.
    /// </summary>
    public string StorageKey =>
        $"ai-cache/{Capability.ToString().ToLowerInvariant()}/{Hash[..2]}/{Hash}";

    public string MetadataKey => $"{StorageKey}.json";

    /// <summary>
    /// <paramref name="fingerprint"/> must contain everything that changes the result -
    /// the prompt, every parameter and the seed. The provider and model are folded in
    /// separately because the same prompt sent to a different model is a different result.
    /// </summary>
    public static AiCacheKey Create(
        AiProviderId provider, AiCapability capability, string? model, string fingerprint)
    {
        var payload = string.Join(
            Separator, provider.Value, capability.ToString(), model ?? string.Empty, fingerprint);

        var hash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
        return new AiCacheKey(capability, hash);
    }
}

/// <summary>
/// What the cache gives back. The provenance a caller reconstructs from this is stamped
/// <c>FromCache</c>, so an originality report can tell a generated asset from a reused one.
/// </summary>
public sealed record AiCacheEntry(
    byte[] Content,
    string ContentType,
    string ProviderId,
    string? Model,
    DateTime CreatedAtUtc,
    double? DurationSeconds = null,
    string? Format = null,
    string? Language = null);

public interface IAiResultCache
{
    Task<AiCacheEntry?> TryGetAsync(AiCacheKey key, CancellationToken ct);

    Task SaveAsync(AiCacheKey key, AiCacheEntry entry, CancellationToken ct);
}
