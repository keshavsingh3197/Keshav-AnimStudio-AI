using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>
/// Whether a provider may be called, and how much headroom is left. <c>Remaining</c> is
/// null when no ceiling is configured, which is different from zero and has to stay
/// distinguishable in the UI.
/// </summary>
public sealed record AiQuotaVerdict(
    bool Allowed,
    long? DailyRemaining,
    long? MonthlyRemaining)
{
    public static readonly AiQuotaVerdict Unlimited = new(true, null, null);
}

/// <summary>
/// Checked before a call, never after.
/// <para>
/// A free tier that has been exhausted should cost a skipped provider and a fallback, not
/// a request that travels the network to be refused. Asking first is also the only way the
/// capabilities endpoint can tell a user how much they have left before they start a
/// forty-scene render.
/// </para>
/// </summary>
public interface IAiQuotaGuard
{
    Task<AiQuotaVerdict> CheckAsync(AiProviderId provider, CancellationToken ct);
}
