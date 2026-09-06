using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Counts what a provider has already been asked to do today and this month, and compares
/// it against the configured ceilings.
/// </summary>
/// <remarks>
/// Counts come from the usage collection rather than an in-memory tally. An in-memory
/// counter would be faster and would be wrong after every restart, in exactly the
/// situation where being wrong is expensive - a fresh process happily spending a daily
/// allowance it had already used. One indexed count is nothing next to the image
/// generation it is guarding.
/// </remarks>
public sealed class AiQuotaGuard(
    IAiUsageRepository usage,
    IOptionsMonitor<AiOptions> options,
    TimeProvider clock,
    ILogger<AiQuotaGuard> logger) : IAiQuotaGuard
{
    public async Task<AiQuotaVerdict> CheckAsync(AiProviderId provider, CancellationToken ct)
    {
        var providerOptions = options.CurrentValue.ProviderFor(provider);

        if (providerOptions is null) return AiQuotaVerdict.Unlimited;
        if (providerOptions.DailyRequestLimit is null && providerOptions.MonthlyRequestLimit is null)
            return AiQuotaVerdict.Unlimited;

        var now = clock.GetUtcNow().UtcDateTime;
        var today = AiUsageRecord.BucketFor(now);

        long? dailyRemaining = null;
        long? monthlyRemaining = null;

        try
        {
            if (providerOptions.DailyRequestLimit is { } dailyLimit)
            {
                var used = await usage
                    .CountBillableRequestsAsync(provider.Value, today, today, ct)
                    .ConfigureAwait(false);

                dailyRemaining = Math.Max(0, dailyLimit - used);
            }

            if (providerOptions.MonthlyRequestLimit is { } monthlyLimit)
            {
                var firstOfMonth = AiUsageRecord.BucketFor(new DateTime(now.Year, now.Month, 1));

                var used = await usage
                    .CountBillableRequestsAsync(provider.Value, firstOfMonth, today, ct)
                    .ConfigureAwait(false);

                monthlyRemaining = Math.Max(0, monthlyLimit - used);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A quota check that cannot run must not become an outage. Failing open is the
            // right call here: the ceilings protect a free allowance, not a security
            // boundary, and refusing every AI call because the counter is unreadable would
            // be a worse failure than briefly overshooting one.
            logger.LogWarning(ex,
                "Could not read AI usage for provider {ProviderId}; allowing the call.", provider.Value);

            return AiQuotaVerdict.Unlimited;
        }

        var allowed = dailyRemaining is not 0 && monthlyRemaining is not 0;
        return new AiQuotaVerdict(allowed, dailyRemaining, monthlyRemaining);
    }
}
