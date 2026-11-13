using AnimStudio.Application.Ecosystem;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ecosystem;

/// <summary>
/// Warms ecosystem config, central creator channels, retired aliases, and persisted UI navigation
/// rules at startup so every request immediately uses live DB/Admin settings.
/// </summary>
public sealed class EcosystemWarmup(
    IEcosystemConfigProvider ecosystem,
    ILogger<EcosystemWarmup> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            var config = await ecosystem.GetAsync(forceRefresh: true, ct).ConfigureAwait(false);
            logger.LogInformation(
                "Ecosystem warmup complete (centralSynced={Synced}, channels={ChannelCount}, websites={WebsiteCount}).",
                config.SyncedFromCentral, config.Channels.Count, config.Websites.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Ecosystem warmup skipped due to startup error.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
