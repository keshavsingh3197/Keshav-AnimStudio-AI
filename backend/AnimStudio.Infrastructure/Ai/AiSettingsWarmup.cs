using AnimStudio.Application.Abstractions.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Loads the administrator's stored AI settings once at startup.
/// </summary>
/// <remarks>
/// Without this, the first request after a restart would run against
/// <c>appsettings.json</c> alone - so a provider someone switched on last week would be
/// reported as off until something happened to read the settings. The store also
/// republishes on every read, so a request that beats this to the punch still gets the
/// right answer; this is what makes the common case not depend on that.
/// </remarks>
public sealed class AiSettingsWarmup(
    IServiceScopeFactory scopes,
    AiRuntimeSettings runtime,
    ILogger<AiSettingsWarmup> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IAiSettingsRepository>();

            var stored = await repository.GetAsync(ct).ConfigureAwait(false);

            if (stored is null) return;

            runtime.Publish(stored);

            logger.LogInformation(
                "Loaded AI settings for {ProviderCount} provider(s) from the database.",
                stored.Providers.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A database that is briefly unreachable at startup must not stop the app from
            // booting. Configuration still applies, and the first successful read
            // republishes - see AiSettingsStore.GetAsync.
            logger.LogWarning(ex, "Could not load stored AI settings at startup.");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
