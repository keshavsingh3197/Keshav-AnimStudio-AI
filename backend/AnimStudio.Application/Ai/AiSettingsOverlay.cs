using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Lays an administrator's stored decisions over the values bound from configuration.
/// </summary>
/// <remarks>
/// <para>
/// Pure, and separate from where it is called, because this is the rule that decides what
/// a running server actually does with AI - which is worth being able to test without a
/// database, a host, or an options monitor.
/// </para>
/// <para>
/// It runs as an <c>IPostConfigureOptions</c> so that everything downstream - the registry
/// composing a chain, a provider reading its base URL, the quota guard reading a ceiling -
/// keeps reading <c>IOptionsMonitor&lt;AiOptions&gt;</c> and needs no knowledge that an
/// admin console exists.
/// </para>
/// </remarks>
public static class AiSettingsOverlay
{
    public static void Apply(AiOptions options, AiSettings? settings)
    {
        if (settings is null) return;

        foreach (var stored in settings.Providers)
        {
            if (!AiProviderId.TryParse(stored.ProviderId, out var id)) continue;

            var target = Resolve(options, id);

            target.Enabled = stored.Enabled;

            if (!string.IsNullOrWhiteSpace(stored.Model)) target.Model = stored.Model.Trim();
            if (!string.IsNullOrWhiteSpace(stored.BaseUrl)) target.BaseUrl = stored.BaseUrl.Trim();

            // Assigned unconditionally: null is the administrator saying "no ceiling", which
            // has to be able to override a ceiling that configuration set.
            target.DailyRequestLimit = stored.DailyRequestLimit;
            target.MonthlyRequestLimit = stored.MonthlyRequestLimit;

            if (stored.TimeoutSeconds is { } timeout) target.TimeoutSeconds = timeout;
            if (stored.SupportsJsonMode is { } json) target.SupportsJsonMode = json;
        }

        foreach (var (capability, chain) in settings.Chains)
        {
            // An empty stored chain means "I have not chosen"; it must not blank out the
            // configured order, which would silently switch every capability off.
            if (chain.Count == 0) continue;

            options.Chains[capability] = [.. chain];
        }
    }

    /// <summary>
    /// The options entry for a provider, created from the catalogue when configuration has
    /// never mentioned it.
    /// <para>
    /// Without this, switching on a supported provider that is absent from
    /// appsettings.json would enable an entry with no base URL and no model, and the admin
    /// console would have to make the operator retype values this build already knows.
    /// </para>
    /// </summary>
    private static AiProviderOptions Resolve(AiOptions options, AiProviderId id)
    {
        if (options.Providers.TryGetValue(id.Value, out var existing)) return existing;

        var descriptor = KnownAiProviders.Find(id.Value);

        var created = new AiProviderOptions
        {
            Enabled = false,
            BaseUrl = descriptor?.DefaultBaseUrl,
            Model = descriptor?.DefaultModel,
            IsLocal = descriptor?.RunsLocally ?? false,
            LicenseClass = descriptor?.LicenseClass ?? "Unknown",
            DailyRequestLimit = descriptor?.DefaultDailyRequestLimit
        };

        options.Providers[id.Value] = created;
        return created;
    }
}
