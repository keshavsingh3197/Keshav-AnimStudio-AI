using AnimStudio.Application.Abstractions.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Re-checks recently published videos on YouTube every <see cref="YouTubePublishOptions.HealthCheckMinutes"/>,
/// so a video YouTube rejects or fails to process after the upload "succeeded" is flagged in
/// the app without anyone having to open the render page. Each sweep is capped; the least
/// recently checked go first, so a big backlog drains over a few sweeps instead of one burst
/// of quota.
/// </summary>
public sealed class YouTubeHealthMonitor(
    IServiceScopeFactory scopes,
    IOptionsMonitor<YouTubePublishOptions> options,
    TimeProvider clock,
    ILogger<YouTubeHealthMonitor> logger) : BackgroundService
{
    private const int MaxPerSweep = 200;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let startup (index creation, schema) finish first.
        try { await Task.Delay(TimeSpan.FromMinutes(1), clock, stoppingToken).ConfigureAwait(false); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            var current = options.CurrentValue;
            var interval = TimeSpan.FromMinutes(Math.Clamp(current.HealthCheckMinutes, 0, 24 * 60));

            if (interval > TimeSpan.Zero && current.IsConfigured)
            {
                try
                {
                    await SweepAsync(interval, Math.Clamp(current.HealthCheckDays, 1, 365), stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    // One bad sweep must not stop the next; the detail stays in the log.
                    logger.LogError(ex, "YouTube health sweep failed");
                }
            }

            try
            {
                await Task.Delay(interval > TimeSpan.Zero ? interval : TimeSpan.FromMinutes(15), clock, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    private async Task SweepAsync(TimeSpan interval, int days, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IYouTubePublicationRepository>();
        var service = scope.ServiceProvider.GetRequiredService<YouTubePublicationService>();

        var now = clock.GetUtcNow().UtcDateTime;
        var due = await repository.ListDueForCheckAsync(now.AddDays(-days), now - interval, MaxPerSweep, ct).ConfigureAwait(false);
        if (due.Count == 0) return;

        await service.CheckAsync(due, ct).ConfigureAwait(false);
        logger.LogInformation("YouTube health sweep checked {Count} video(s)", due.Count);
    }
}
