namespace AnimStudio.Domain.Ai;

/// <summary>
/// One administrative change: who, when, what, and what it looked like before and after.
/// </summary>
/// <remarks>
/// <para>
/// <see cref="Before"/> and <see cref="After"/> hold a short human-readable summary rather
/// than a serialized object. That is a deliberate limit as well as a convenience: an
/// audit row is read by a person, is retained far longer than the thing it describes, and
/// must never become a second place a secret is kept. A key change records the
/// fingerprint, never the key, and never any part of it beyond the last four characters
/// the console already shows.
/// </para>
/// </remarks>
public sealed class AdminAuditEntry
{
    public string Id { get; set; } = string.Empty;

    /// <summary>A stable verb, e.g. <c>ai.provider.update</c>. Filterable; not shown raw.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>What was changed - a provider id, a capability name, a job id.</summary>
    public string? Target { get; set; }

    public string? ActorUserId { get; set; }

    /// <summary>The caller's address, for the same reason an auth log records one.</summary>
    public string? RemoteAddress { get; set; }

    public string? Before { get; set; }
    public string? After { get; set; }

    public DateTime AtUtc { get; set; }
}
