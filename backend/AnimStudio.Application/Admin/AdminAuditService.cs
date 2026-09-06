using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Admin;

/// <summary>
/// Records every administrative change.
/// </summary>
/// <remarks>
/// <para>
/// Written after the change has succeeded, not before: an entry recorded first would
/// describe a change that may then have been refused, and a trail that contains things
/// that did not happen is worse than no trail. The cost of that ordering is a change that
/// succeeds while its record fails to save, which is why that case is logged at error
/// level rather than passed over - the change itself is not undone, because rolling back a
/// provider setting because the audit collection was briefly unavailable would be a worse
/// outcome than a gap in a log.
/// </para>
/// <para>
/// Summaries are short human-readable strings. Nothing here may carry a secret: a key
/// change records its fingerprint, never the key or any part of it beyond what the console
/// already displays.
/// </para>
/// </remarks>
public sealed class AdminAuditService(
    IAdminAuditRepository repository,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<AdminAuditService> logger)
{
    public const string ProviderUpdated = "ai.provider.update";
    public const string ProviderReset = "ai.provider.reset";
    public const string KeyInstalled = "ai.key.install";
    public const string KeyRemoved = "ai.key.remove";
    public const string ChainSaved = "ai.chain.save";
    public const string ProviderTested = "ai.provider.test";
    public const string JobCancelled = "render.job.cancel";
    public const string JobRequeued = "render.job.requeue";

    private const int MaxSummaryLength = 400;

    public async Task RecordAsync(
        string action,
        string? target,
        string? before,
        string? after,
        string? remoteAddress,
        CancellationToken ct)
    {
        var entry = new AdminAuditEntry
        {
            Action = action,
            Target = target,
            ActorUserId = currentUser.UserId,
            RemoteAddress = remoteAddress,
            Before = Clip(before),
            After = Clip(after),
            AtUtc = clock.GetUtcNow().UtcDateTime
        };

        try
        {
            await repository.AppendAsync(entry, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex,
                "An administrative change was applied but could not be recorded in the audit " +
                "trail: {Action} on {Target} by {ActorUserId}.",
                action, target ?? "(none)", entry.ActorUserId);
        }
    }

    public async Task<IReadOnlyList<AdminAuditEntry>> ListRecentAsync(int limit, CancellationToken ct) =>
        await repository.ListRecentAsync(limit, ct).ConfigureAwait(false);

    private static string? Clip(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var cleaned = new string([.. value.Where(c => !char.IsControl(c))]).Trim();

        return cleaned.Length <= MaxSummaryLength ? cleaned : cleaned[..MaxSummaryLength] + "...";
    }
}
