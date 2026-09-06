using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>
/// The single administrator-editable AI settings document, and the admin audit trail.
/// </summary>
public interface IAiSettingsRepository
{
    /// <summary>Null when nobody has ever changed anything through the admin console.</summary>
    Task<AiSettings?> GetAsync(CancellationToken ct);

    Task SaveAsync(AiSettings settings, CancellationToken ct);
}

/// <summary>
/// Every administrative write, in the order it happened.
/// <para>
/// Append-only by contract: there is no update and no delete, because an audit trail an
/// administrator can edit answers no question worth asking.
/// </para>
/// </summary>
public interface IAdminAuditRepository
{
    Task AppendAsync(AdminAuditEntry entry, CancellationToken ct);

    Task<IReadOnlyList<AdminAuditEntry>> ListRecentAsync(int limit, CancellationToken ct);
}
