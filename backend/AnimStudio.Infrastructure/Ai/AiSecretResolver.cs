using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Bridges singleton providers to the scoped credential store, and caches only whether a
/// key exists - never the key.
/// </summary>
/// <remarks>
/// <para>
/// The scope is opened here, once, rather than in every provider. Each
/// <see cref="GetSecretAsync"/> call opens a fresh scope, reads the encrypted key and
/// decrypts it; that is a Mongo round trip and an AES operation against a network call to
/// a language model, so the cost is not worth trading for the risk of holding plaintext
/// keys in a process-wide cache.
/// </para>
/// <para>
/// Presence is cached because <c>IAiProvider.IsConfigured</c> is synchronous and runs on
/// every chain composition - which is every AI call and every capabilities request. An
/// unknown provider answers from configuration alone and schedules a refresh, and
/// <see cref="WarmAsync"/> fills the cache at startup, so the window in which a
/// database-held key reads as absent is the first few milliseconds of the process.
/// </para>
/// </remarks>
public sealed class AiSecretResolver(
    IServiceScopeFactory scopeFactory,
    ILogger<AiSecretResolver> logger) : IAiSecretResolver
{
    private readonly ConcurrentDictionary<AiProviderId, bool> _installed = new();

    public async Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty) return null;

        using var scope = scopeFactory.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IAiCredentialStore>();

        var secret = await store.GetSecretAsync(provider, ct).ConfigureAwait(false);

        // Free information: we just learned the truth, so record it.
        _installed[provider] = !string.IsNullOrEmpty(secret);

        return secret;
    }

    public bool IsInstalled(AiProviderId provider)
    {
        if (provider.IsEmpty) return false;

        if (_installed.TryGetValue(provider, out var installed)) return installed;

        // Not yet known. Kick off a refresh and answer "no" for now: claiming a key exists
        // and then failing the call would report a capability as available when it is not.
        _ = RefreshAsync(provider);

        return false;
    }

    public void Invalidate(AiProviderId provider)
    {
        if (provider.IsEmpty) return;

        _installed.TryRemove(provider, out _);
        _ = RefreshAsync(provider);
    }

    public async Task WarmAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetRequiredService<IAiCredentialStore>();

            foreach (var status in await store.DescribeAllAsync(ct).ConfigureAwait(false))
            {
                if (AiProviderId.TryParse(status.ProviderId, out var id))
                    _installed[id] = status.Configured;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A database that is not up yet must not stop the application from starting:
            // the app is required to run with no AI at all, so this is a degraded start,
            // not a failed one. Presence is rediscovered per provider on first use.
            logger.LogWarning(ex, "Could not warm the AI credential presence cache.");
        }
    }

    private async Task RefreshAsync(AiProviderId provider)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetRequiredService<IAiCredentialStore>();

            var status = await store.DescribeAsync(provider, CancellationToken.None)
                .ConfigureAwait(false);

            _installed[provider] = status.Configured;
        }
        catch (Exception ex)
        {
            // Fire-and-forget: nothing is awaiting this, so it must never surface as an
            // unobserved task exception.
            logger.LogWarning(ex,
                "Could not refresh credential presence for AI provider {ProviderId}.",
                provider.Value);
        }
    }
}

/// <summary>
/// Fills the credential presence cache once at startup, so the first capabilities request
/// after a restart reports database-held keys rather than reporting nothing and correcting
/// itself a moment later.
/// </summary>
public sealed class AiSecretWarmup(IAiSecretResolver resolver) : IHostedService
{
    public Task StartAsync(CancellationToken ct) => resolver.WarmAsync(ct);

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
