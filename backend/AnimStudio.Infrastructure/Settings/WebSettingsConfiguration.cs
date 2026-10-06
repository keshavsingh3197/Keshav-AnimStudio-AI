using AnimStudio.Application.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Settings;

/// <summary>
/// The WebSettings table as a configuration source. Added last in Program.cs so its values
/// win over appsettings.json and environment variables; it starts empty and is filled from
/// the database once the app is built, and again on every save or refresh.
/// </summary>
public sealed class WebSettingsConfigurationSource : IConfigurationSource
{
    public WebSettingsConfigurationProvider Provider { get; } = new();

    public IConfigurationProvider Build(IConfigurationBuilder builder) => Provider;
}

public sealed class WebSettingsConfigurationProvider : ConfigurationProvider
{
    /// <summary>
    /// Replaces every override at once and signals a reload, which is what makes
    /// <see cref="IOptionsMonitor{TOptions}"/> recompute the bound options. Keys outside the
    /// catalog are dropped here too, so a row inserted by hand can't reach a secret.
    /// </summary>
    public void Apply(IReadOnlyDictionary<string, string> values)
    {
        var data = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in values)
        {
            if (WebSettingCatalog.Find(key) is { } definition && WebSettingCatalog.Normalize(definition, value).Value is { } normalized)
                data[definition.Key] = normalized;
        }

        Data = data;
        OnReload();
    }

    public IReadOnlyDictionary<string, string?> Snapshot() => new Dictionary<string, string?>(Data, StringComparer.OrdinalIgnoreCase);
}

/// <summary>
/// <see cref="IOptions{TOptions}"/> that always answers with the monitor's current value,
/// so a service that reads <c>options.Value</c> when it does its work sees a saved setting
/// without a restart. A singleton that copied the value in its constructor still holds the
/// old one - those settings are marked "after restart" in the catalog.
/// </summary>
public sealed class LiveOptions<TOptions>(IOptionsMonitor<TOptions> monitor) : IOptions<TOptions>
    where TOptions : class
{
    public TOptions Value => monitor.CurrentValue;
}
