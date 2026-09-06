using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

public enum AiCredentialSource
{
    /// <summary>No key is installed for this provider.</summary>
    None = 0,

    /// <summary>Set through the admin API and held encrypted in the database.</summary>
    Database = 1,

    /// <summary>
    /// Supplied by the host through user-secrets, an environment variable or a vault. Read
    /// only: the admin UI must show it as such rather than offering an edit box that
    /// silently does nothing on the next restart.
    /// </summary>
    Configuration = 2
}

/// <summary>
/// Everything the admin UI is allowed to know about an installed key. Enough to prove
/// which key is in place, never enough to use it.
/// </summary>
public sealed record AiCredentialStatus(
    string ProviderId,
    AiCredentialSource Source,
    string? Fingerprint,
    string? Last4,
    DateTime? CreatedAt,
    DateTime? RotatedAt)
{
    public bool Configured => Source != AiCredentialSource.None;

    /// <summary>The <c>••••9f2c</c> the UI shows. Empty when nothing is installed.</summary>
    public string Masked => Last4 is null ? string.Empty : $"••••{Last4}";

    public static AiCredentialStatus NotConfigured(string providerId) =>
        new(providerId, AiCredentialSource.None, null, null, null, null);
}

/// <summary>
/// Stores and retrieves AI provider API keys.
/// <para>
/// The only component in the application permitted to see a key in plaintext, and even
/// here it exists for the duration of one call. Everything else - controllers, services,
/// logs, responses - deals in <see cref="AiCredentialStatus"/>.
/// </para>
/// </summary>
public interface IAiCredentialStore
{
    /// <summary>
    /// The plaintext key, for a provider's HTTP handler and nothing else.
    /// <para>
    /// Never return this from a controller, put it in a log line, an exception message, a
    /// cache key or a usage record. If you are calling this from outside an
    /// <c>IAiProvider</c> implementation, you are almost certainly doing something wrong.
    /// </para>
    /// </summary>
    Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct);

    Task<AiCredentialStatus> SetAsync(
        AiProviderId provider, string secret, string? actorUserId, CancellationToken ct);

    Task<AiCredentialStatus> DescribeAsync(AiProviderId provider, CancellationToken ct);

    Task<IReadOnlyList<AiCredentialStatus>> DescribeAllAsync(CancellationToken ct);

    /// <summary>Removes a database-held key. Returns false when there was nothing to remove.</summary>
    Task<bool> DeleteAsync(AiProviderId provider, CancellationToken ct);
}

/// <summary>Thrown when a supplied key is not plausibly a key. Never quotes the value.</summary>
public sealed class AiCredentialException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
