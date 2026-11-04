using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Pushes the publishing board to YouTube: every <see cref="YouTubePublishOptions.QueueCheckSeconds"/>
/// it follows the uploads already started (so a finished one is marked published, and one lost
/// to a restart is retried) and starts the ones that are due. The board is in the database, so
/// nothing is lost when the server restarts; an item due while it was down goes out on the
/// first round after it comes back.
/// </summary>
public sealed class PublishQueueScheduler(
    IServiceScopeFactory scopes,
    IOptionsMonitor<YouTubePublishOptions> options,
    TimeProvider clock,
    ILogger<PublishQueueScheduler> logger) : BackgroundService
{
    /// <summary>Started per round at most; the upload manager limits how many run at once anyway.</summary>
    private const int MaxPerRound = 20;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let startup (index creation, schema) finish first.
        try { await Task.Delay(TimeSpan.FromSeconds(20), clock, stoppingToken).ConfigureAwait(false); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            var current = options.CurrentValue;
            var seconds = Math.Clamp(current.QueueCheckSeconds, 0, 3600);

            if (seconds > 0 && current.IsConfigured)
            {
                try
                {
                    await using var scope = scopes.CreateAsyncScope();
                    var queue = scope.ServiceProvider.GetRequiredService<PublishQueueService>();
                    await queue.FollowUploadsAsync(stoppingToken).ConfigureAwait(false);
                    var started = await queue.PushDueAsync(MaxPerRound, stoppingToken).ConfigureAwait(false);
                    if (started > 0) logger.LogInformation("Publishing board: started {Count} scheduled uploads", started);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    // One bad round must not stop the next; the detail stays in the log.
                    logger.LogError(ex, "Publishing board round failed");
                }
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(seconds > 0 ? seconds : 300), clock, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }
}
