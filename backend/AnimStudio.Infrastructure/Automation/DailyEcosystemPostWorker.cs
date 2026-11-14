using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Periodically drives daily ecosystem content preparation (Hindu Panchang, Festivals, Daily Katha,
/// Aaj Ka Itihaas, Pratiyogita/Ecosystem spotlights), tracks Story Agent video renders, triggers due
/// scheduled auto-posts, and finalizes YouTube publish tracking.
/// </summary>
public sealed class DailyEcosystemPostWorker(
    IServiceScopeFactory scopes,
    TimeProvider clock,
    ILogger<DailyEcosystemPostWorker> logger) : BackgroundService
{
    private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(35);
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(3);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try { await Task.Delay(StartupDelay, clock, stoppingToken).ConfigureAwait(false); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var automation = scope.ServiceProvider.GetRequiredService<EcosystemAutomationService>();
                var touched = await automation.ProcessBackgroundTickAsync(stoppingToken).ConfigureAwait(false);
                if (touched > 0)
                    logger.LogInformation("Ecosystem automation worker processed {Count} item(s).", touched);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ecosystem automation background pass failed");
            }

            try { await Task.Delay(PollInterval, clock, stoppingToken).ConfigureAwait(false); }
            catch (OperationCanceledException) { return; }
        }
    }
}
