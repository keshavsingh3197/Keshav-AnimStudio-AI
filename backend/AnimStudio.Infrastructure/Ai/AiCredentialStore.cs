using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// AI provider keys, encrypted at rest with AES-256-GCM and readable only as a mask.
/// </summary>
/// <remarks>
/// <para>
/// Two sources, checked in this order: a key set through the admin UI (encrypted in
/// Mongo), then one supplied by the host through user-secrets, an environment variable or
/// a vault. The database wins because it is the more specific, more recent decision -
/// someone who just pasted a new key in the admin screen expects it to take effect - and
/// the source is reported back so the UI can say "this one comes from the environment and
/// cannot be edited here" instead of offering a box that silently does nothing.
/// </para>
/// <para>
/// Encryption uses <see cref="DataProtector"/> from KeshavSingh.Security rather than a
/// local implementation: it already does authenticated encryption with a key-id header, so
/// rotating <c>Encryption:DataKey</c> does not orphan every stored key.
/// </para>
/// <para>
/// The protector is <see cref="Lazy{T}"/> because constructing it requires
/// <c>Encryption:DataKey</c>. Someone who supplies every key through environment variables
/// never stores one, and should not be forced to configure an encryption key to protect
/// data they are not keeping.
/// </para>
/// </remarks>
public sealed class AiCredentialStore(
    IAiCredentialRepository repository,
    Lazy<DataProtector> protector,
    IConfiguration configuration,
    IAiSecretResolver resolver,
    TimeProvider clock,
    ILogger<AiCredentialStore> logger) : IAiCredentialStore
{
    /// <summary>
    /// Where a host-supplied key is read from, e.g. <c>Ai:Secrets:groq</c>, which in
    /// practice means <c>Ai__Secrets__groq</c> as an environment variable. Deliberately not
    /// under <c>Ai:Providers</c>, so nothing invites someone to type a key next to a model
    /// name in appsettings.json.
    /// </summary>
    private const string SecretsSection = "Ai:Secrets";

    private const int MinSecretLength = 8;
    private const int MaxSecretLength = 512;

    public async Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty) return null;

        var stored = await repository.GetAsync(provider.Value, ct).ConfigureAwait(false);

        if (stored is not null)
        {
            try
            {
                return protector.Value.Decrypt(stored.CipherText);
            }
            catch (CryptographicException ex)
            {
                // Almost always a rotated Encryption:DataKey without the old key retained.
                // Say so, without echoing any part of the ciphertext.
                logger.LogError(ex,
                    "The stored key for AI provider {ProviderId} could not be decrypted. " +
                    "If Encryption:DataKey was rotated, add the previous key to " +
                    "Encryption:PreviousDataKeys, or set the provider key again.",
                    provider.Value);

                return null;
            }
        }

        return NormalizeOrNull(configuration[$"{SecretsSection}:{provider.Value}"]);
    }

    public async Task<AiCredentialStatus> SetAsync(
        AiProviderId provider, string secret, string? actorUserId, CancellationToken ct)
    {
        if (provider.IsEmpty)
            throw new AiCredentialException("provider-invalid", "That is not a valid provider id.");

        var normalized = NormalizeOrNull(secret)
            ?? throw new AiCredentialException("key-required", "Enter the provider's API key.");

        // Length bounds, not a format guess: every provider invents its own prefix, and a
        // store that rejected an unfamiliar shape would age badly.
        if (normalized.Length < MinSecretLength)
            throw new AiCredentialException("key-too-short", "That key looks too short to be valid.");

        if (normalized.Length > MaxSecretLength)
            throw new AiCredentialException("key-too-long", "That key is longer than any provider issues.");

        // A key that arrived with an embedded newline or tab is a paste accident. Sending it
        // would produce an authentication failure that looks like a wrong key, so it is
        // caught here where the message can be accurate.
        if (normalized.Any(char.IsControl))
            throw new AiCredentialException("key-invalid",
                "That key contains line breaks or control characters - paste it as a single line.");

        var now = clock.GetUtcNow().UtcDateTime;
        var existing = await repository.GetAsync(provider.Value, ct).ConfigureAwait(false);

        var credential = new AiCredential
        {
            Id = existing?.Id ?? string.Empty,
            ProviderId = provider.Value,
            CipherText = protector.Value.Encrypt(normalized),
            Fingerprint = Fingerprint(normalized),
            Last4 = Last4(normalized),
            CreatedByUserId = existing?.CreatedByUserId ?? actorUserId,
            CreatedAt = existing?.CreatedAt ?? now,
            RotatedAt = existing is null ? null : now
        };

        await repository.UpsertAsync(credential, ct).ConfigureAwait(false);

        // Without this the key would save correctly and the capability would keep reporting
        // NotConfigured until the next restart, because provider availability is answered
        // from a cached presence flag - see IAiSecretResolver.
        resolver.Invalidate(provider);

        // Fingerprint only - it identifies the key without disclosing it, which is exactly
        // what an audit trail needs.
        logger.LogInformation(
            "AI provider key {Action} for {ProviderId} (fingerprint {Fingerprint}).",
            existing is null ? "installed" : "rotated", provider.Value, credential.Fingerprint);

        return Describe(credential);
    }

    public async Task<AiCredentialStatus> DescribeAsync(AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty) return AiCredentialStatus.NotConfigured(string.Empty);

        var stored = await repository.GetAsync(provider.Value, ct).ConfigureAwait(false);
        if (stored is not null) return Describe(stored);

        var fromConfiguration = NormalizeOrNull(configuration[$"{SecretsSection}:{provider.Value}"]);

        return fromConfiguration is null
            ? AiCredentialStatus.NotConfigured(provider.Value)
            : new AiCredentialStatus(
                provider.Value, AiCredentialSource.Configuration,
                Fingerprint(fromConfiguration), Last4(fromConfiguration), null, null);
    }

    public async Task<IReadOnlyList<AiCredentialStatus>> DescribeAllAsync(CancellationToken ct)
    {
        var stored = await repository.ListAsync(ct).ConfigureAwait(false);
        var byProvider = stored.ToDictionary(c => c.ProviderId, Describe, StringComparer.Ordinal);

        // Host-supplied keys are listed too, so the admin screen shows every provider that
        // actually has a key rather than only the ones set through the UI.
        foreach (var entry in configuration.GetSection(SecretsSection).GetChildren())
        {
            if (byProvider.ContainsKey(entry.Key)) continue;

            var value = NormalizeOrNull(entry.Value);
            if (value is null) continue;

            byProvider[entry.Key] = new AiCredentialStatus(
                entry.Key, AiCredentialSource.Configuration,
                Fingerprint(value), Last4(value), null, null);
        }

        return [.. byProvider.Values.OrderBy(c => c.ProviderId, StringComparer.Ordinal)];
    }

    public async Task<bool> DeleteAsync(AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty) return false;

        var removed = await repository.DeleteAsync(provider.Value, ct).ConfigureAwait(false);

        if (removed)
        {
            resolver.Invalidate(provider);
            logger.LogInformation("AI provider key removed for {ProviderId}.", provider.Value);
        }

        return removed;
    }

    private static AiCredentialStatus Describe(AiCredential credential) => new(
        credential.ProviderId, AiCredentialSource.Database,
        credential.Fingerprint, credential.Last4, credential.CreatedAt, credential.RotatedAt);

    /// <summary>
    /// Identifies a key without disclosing it: eight hex characters of its SHA-256. Enough
    /// to confirm two systems hold the same key, useless to anyone who obtains it.
    /// </summary>
    private static string Fingerprint(string secret) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(secret)))[..8];

    private static string Last4(string secret) =>
        secret.Length <= 4 ? new string('*', secret.Length) : secret[^4..];

    /// <summary>Trims surrounding whitespace - a trailing newline from a paste is the single
    /// most common reason a correct key is rejected by a provider.</summary>
    private static string? NormalizeOrNull(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
