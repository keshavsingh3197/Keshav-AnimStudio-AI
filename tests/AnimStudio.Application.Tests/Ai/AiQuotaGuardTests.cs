using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiQuotaGuardTests
{
    private static readonly DateTimeOffset Noon = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
    private static readonly AiProviderId Groq = AiProviderId.Parse("groq");

    private static (AiQuotaGuard Guard, InMemoryAiUsageRepository Usage, ManualTimeProvider Clock)
        Build(int? daily = null, int? monthly = null)
    {
        var options = new AiOptions();
        options.Providers["groq"] = new AiProviderOptions
        {
            DailyRequestLimit = daily,
            MonthlyRequestLimit = monthly
        };

        var usage = new InMemoryAiUsageRepository();
        var clock = new ManualTimeProvider(Noon);

        var guard = new AiQuotaGuard(
            usage, new StaticOptionsMonitor<AiOptions>(options), clock,
            NullLogger<AiQuotaGuard>.Instance);

        return (guard, usage, clock);
    }

    private static AiUsageRecord Call(DateTime at, AiCallOutcome outcome) => new()
    {
        ProviderId = "groq",
        Capability = AiCapability.Text,
        DayBucket = AiUsageRecord.BucketFor(at),
        Outcome = outcome,
        RequestCount = 1,
        CreatedAt = at
    };

    [Fact]
    public async Task A_provider_with_no_ceiling_is_never_refused()
    {
        var (guard, _, _) = Build();

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.True(verdict.Allowed);
        Assert.Null(verdict.DailyRemaining);
        Assert.Null(verdict.MonthlyRemaining);
    }

    [Fact]
    public async Task A_provider_that_is_not_configured_at_all_is_unlimited()
    {
        var (guard, _, _) = Build();

        Assert.True((await guard.CheckAsync(
            AiProviderId.Parse("unknown"), CancellationToken.None)).Allowed);
    }

    [Fact]
    public async Task Remaining_counts_down_as_calls_are_recorded()
    {
        var (guard, usage, _) = Build(daily: 3);

        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Succeeded), CancellationToken.None);

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.True(verdict.Allowed);
        Assert.Equal(2, verdict.DailyRemaining);
    }

    [Fact]
    public async Task The_call_is_refused_once_the_daily_ceiling_is_reached()
    {
        var (guard, usage, _) = Build(daily: 2);

        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Succeeded), CancellationToken.None);
        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Failed), CancellationToken.None);

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.False(verdict.Allowed);
        Assert.Equal(0, verdict.DailyRemaining);
    }

    [Fact]
    public async Task Cache_hits_and_quota_refusals_do_not_consume_the_allowance()
    {
        // Counting a cache hit against the quota would make the cache exhaust the very
        // allowance it exists to protect.
        var (guard, usage, _) = Build(daily: 2);

        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.CacheHit), CancellationToken.None);
        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.RefusedByQuota), CancellationToken.None);
        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Unavailable), CancellationToken.None);

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.True(verdict.Allowed);
        Assert.Equal(2, verdict.DailyRemaining);
    }

    [Fact]
    public async Task Yesterdays_calls_do_not_count_against_todays_daily_ceiling()
    {
        var (guard, usage, clock) = Build(daily: 1);

        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Succeeded), CancellationToken.None);
        Assert.False((await guard.CheckAsync(Groq, CancellationToken.None)).Allowed);

        clock.Advance(TimeSpan.FromDays(1));

        Assert.True((await guard.CheckAsync(Groq, CancellationToken.None)).Allowed);
    }

    [Fact]
    public async Task The_monthly_window_starts_at_the_first_of_the_month()
    {
        var (guard, usage, _) = Build(monthly: 2);

        // Earlier this month: counts. Last month: does not.
        await usage.RecordAsync(
            Call(new DateTime(2026, 9, 1, 8, 0, 0, DateTimeKind.Utc), AiCallOutcome.Succeeded),
            CancellationToken.None);
        await usage.RecordAsync(
            Call(new DateTime(2026, 8, 31, 8, 0, 0, DateTimeKind.Utc), AiCallOutcome.Succeeded),
            CancellationToken.None);

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.True(verdict.Allowed);
        Assert.Equal(1, verdict.MonthlyRemaining);
    }

    [Fact]
    public async Task Either_ceiling_alone_is_enough_to_refuse()
    {
        var (guard, usage, _) = Build(daily: 5, monthly: 1);

        await usage.RecordAsync(Call(Noon.UtcDateTime, AiCallOutcome.Succeeded), CancellationToken.None);

        var verdict = await guard.CheckAsync(Groq, CancellationToken.None);

        Assert.False(verdict.Allowed);
        Assert.Equal(4, verdict.DailyRemaining);
        Assert.Equal(0, verdict.MonthlyRemaining);
    }

    [Fact]
    public async Task An_unreadable_counter_fails_open()
    {
        // These ceilings protect a free allowance, not a security boundary. Refusing every
        // AI call because the counter is unreadable would be a worse failure than briefly
        // overshooting one.
        var (guard, usage, _) = Build(daily: 1);
        usage.ReadFailure = new InvalidOperationException("mongo is down");

        Assert.True((await guard.CheckAsync(Groq, CancellationToken.None)).Allowed);
    }
}
