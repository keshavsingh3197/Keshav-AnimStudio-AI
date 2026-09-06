using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>
/// What an administrator may change about a provider, as it arrives from the API.
/// </summary>
/// <param name="Model">Empty keeps the configured model.</param>
/// <param name="BaseUrl">Empty keeps the configured base URL. Checked before it is stored.</param>
/// <param name="DailyRequestLimit">Null means no daily ceiling.</param>
/// <param name="TimeoutSeconds">Null keeps the configured timeout.</param>
public sealed record AiProviderSettingsRequest(
    bool Enabled,
    string? Model = null,
    string? BaseUrl = null,
    int? DailyRequestLimit = null,
    int? MonthlyRequestLimit = null,
    int? TimeoutSeconds = null,
    bool? SupportsJsonMode = null);

/// <summary>
/// Reads and writes the administrator-editable half of the AI configuration.
/// </summary>
/// <remarks>
/// Every write validates first and then makes the change take effect immediately - an
/// admin console whose changes need a restart is one nobody trusts, and one where a
/// provider that has just been switched off keeps spending quota.
/// </remarks>
public interface IAiSettingsStore
{
    Task<AiSettings> GetAsync(CancellationToken ct);

    Task<AiSettings> SaveProviderAsync(
        AiProviderId provider, AiProviderSettingsRequest request, string? actorUserId,
        CancellationToken ct);

    /// <summary>Removes a provider's overrides, so configuration governs it again.</summary>
    Task<AiSettings> ResetProviderAsync(
        AiProviderId provider, string? actorUserId, CancellationToken ct);

    /// <summary>
    /// Replaces the fallback order for one capability. An empty list restores the order
    /// from configuration rather than leaving the capability with no providers at all.
    /// </summary>
    Task<AiSettings> SaveChainAsync(
        AiCapability capability, IReadOnlyList<string> providerIds, string? actorUserId,
        CancellationToken ct);
}

/// <summary>Thrown when a settings change is refused. The message is safe to show.</summary>
public sealed class AiSettingsException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
