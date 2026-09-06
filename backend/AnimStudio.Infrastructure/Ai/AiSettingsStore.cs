using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Reads and writes the administrator-editable AI configuration, and makes each change
/// take effect immediately.
/// </summary>
/// <remarks>
/// <para>
/// Writes are read-modify-write on a single document. That is deliberate rather than
/// careless: this is a settings screen operated by one person on their own server, and the
/// alternative - per-field atomic updates - would buy nothing here while making the stored
/// shape harder to reason about. The last write wins, which is what a settings screen has
/// always meant.
/// </para>
/// <para>
/// Every path validates before it stores. Nothing here trusts the caller for being an
/// administrator: being allowed to configure a provider is not the same as being allowed to
/// point the server at an arbitrary address - see <see cref="AiSettingsValidator"/>.
/// </para>
/// </remarks>
public sealed class AiSettingsStore(
    IAiSettingsRepository repository,
    AiRuntimeSettings runtime,
    IOptionsMonitor<AiOptions> options,
    TimeProvider clock,
    ILogger<AiSettingsStore> logger) : IAiSettingsStore
{
    public async Task<AiSettings> GetAsync(CancellationToken ct)
    {
        var stored = await repository.GetAsync(ct).ConfigureAwait(false);

        if (stored is null) return new AiSettings();

        // Republished on read as well as on write. Hosted services start after the server
        // begins accepting requests, so a first request that arrives before the warm-up has
        // finished would otherwise see configuration without the stored overrides.
        runtime.Publish(stored);

        return stored;
    }

    public async Task<AiSettings> SaveProviderAsync(
        AiProviderId provider, AiProviderSettingsRequest request, string? actorUserId,
        CancellationToken ct)
    {
        var settings = await LoadForWriteAsync(ct).ConfigureAwait(false);

        var validated = AiSettingsValidator.ValidateProvider(
            provider, request, options.CurrentValue, actorUserId, clock.GetUtcNow().UtcDateTime);

        settings.Providers.RemoveAll(p =>
            string.Equals(p.ProviderId, provider.Value, StringComparison.OrdinalIgnoreCase));

        settings.Providers.Add(validated);
        settings.Providers.Sort((a, b) => string.CompareOrdinal(a.ProviderId, b.ProviderId));

        await PersistAsync(settings, actorUserId, ct).ConfigureAwait(false);

        // Provider id and the switch position only. A model name is fine to log; a base URL
        // is operator input and stays out of the log line.
        logger.LogInformation(
            "AI provider {ProviderId} saved by {ActorUserId}: enabled {Enabled}.",
            provider.Value, actorUserId ?? "(unknown)", validated.Enabled);

        return settings;
    }

    public async Task<AiSettings> ResetProviderAsync(
        AiProviderId provider, string? actorUserId, CancellationToken ct)
    {
        var settings = await LoadForWriteAsync(ct).ConfigureAwait(false);

        settings.Providers.RemoveAll(p =>
            string.Equals(p.ProviderId, provider.Value, StringComparison.OrdinalIgnoreCase));

        await PersistAsync(settings, actorUserId, ct).ConfigureAwait(false);

        logger.LogInformation(
            "AI provider {ProviderId} reset to configuration by {ActorUserId}.",
            provider.Value, actorUserId ?? "(unknown)");

        return settings;
    }

    public async Task<AiSettings> SaveChainAsync(
        AiCapability capability, IReadOnlyList<string> providerIds, string? actorUserId,
        CancellationToken ct)
    {
        var settings = await LoadForWriteAsync(ct).ConfigureAwait(false);

        var validated = AiSettingsValidator.ValidateChain(capability, providerIds, options.CurrentValue);

        if (validated.Count == 0)
        {
            // Clearing the stored chain restores the configured order rather than leaving
            // the capability with nothing, which is what "reset" means to the person
            // clicking it.
            settings.Chains.Remove(capability.ToString());
        }
        else
        {
            settings.Chains[capability.ToString()] = validated;
        }

        await PersistAsync(settings, actorUserId, ct).ConfigureAwait(false);

        logger.LogInformation(
            "AI fallback order for {Capability} saved by {ActorUserId}: {Chain}.",
            capability, actorUserId ?? "(unknown)", string.Join(", ", validated));

        return settings;
    }

    private async Task<AiSettings> LoadForWriteAsync(CancellationToken ct) =>
        await repository.GetAsync(ct).ConfigureAwait(false) ?? new AiSettings();

    private async Task PersistAsync(AiSettings settings, string? actorUserId, CancellationToken ct)
    {
        settings.Id = AiSettings.SingletonId;
        settings.UpdatedByUserId = actorUserId;
        settings.UpdatedAt = clock.GetUtcNow().UtcDateTime;

        await repository.SaveAsync(settings, ct).ConfigureAwait(false);

        // Published only after the write succeeded: a change the database refused must not
        // be the one the server is running on.
        runtime.Publish(settings);
    }
}
