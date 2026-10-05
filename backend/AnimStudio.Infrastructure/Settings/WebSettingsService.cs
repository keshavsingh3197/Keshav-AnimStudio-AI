using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Settings;
using AnimStudio.Domain.System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Settings;

public sealed class WebSettingException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>One setting as the admin console shows it.</summary>
public sealed record WebSettingView(
    string Key,
    string Group,
    string Label,
    string Description,
    WebSettingType Type,
    bool AppliesLive,
    double? Min,
    double? Max,
    IReadOnlyList<string>? Choices,
    int MaxLength,
    /// <summary>From appsettings.json / environment - what Reset goes back to.</summary>
    string? FileValue,
    /// <summary>Set from the console, or null.</summary>
    string? StoredValue,
    /// <summary>What the app is configured with now.</summary>
    string? EffectiveValue,
    /// <summary>Changed since the server started, and only takes effect after a restart.</summary>
    bool PendingRestart,
    DateTime? UpdatedAt,
    string? UpdatedByUserId);

public sealed record WebSettingsOverview(IReadOnlyList<WebSettingView> Settings, DateTime? LoadedAt, int PendingRestartCount);

/// <summary>Remembers what was in force when the server started, to tell which changes still wait for a restart.</summary>
public sealed class WebSettingsRuntime(WebSettingsConfigurationSource source, TimeProvider clock)
{
    private readonly Lock _gate = new();
    private Dictionary<string, string?>? _atStartup;

    public DateTime? LoadedAt { get; private set; }

    public void Apply(IReadOnlyDictionary<string, string> values, IConfiguration configuration)
    {
        lock (_gate)
        {
            source.Provider.Apply(values);
            LoadedAt = clock.GetUtcNow().UtcDateTime;
            _atStartup ??= WebSettingCatalog.All.ToDictionary(d => d.Key, d => configuration[d.Key], StringComparer.OrdinalIgnoreCase);
        }
    }

    public string? StartupValue(string key, IConfiguration configuration)
    {
        lock (_gate)
        {
            return _atStartup is not null && _atStartup.TryGetValue(key, out var value) ? value : configuration[key];
        }
    }

    public WebSettingsConfigurationProvider Provider => source.Provider;
}

/// <summary>
/// Reads, validates, stores and applies console-managed settings. Every save reloads the
/// configuration straight away; <see cref="ReloadAsync"/> also picks up rows changed
/// directly in the database or by another server.
/// </summary>
public sealed class WebSettingsService(
    IWebSettingRepository repository,
    WebSettingsRuntime runtime,
    IConfiguration configuration,
    TimeProvider clock,
    ILogger<WebSettingsService> logger)
{
    public async Task<WebSettingsOverview> DescribeAsync(CancellationToken ct)
    {
        var stored = (await repository.ListAsync(ct).ConfigureAwait(false))
            .ToDictionary(s => s.Id, StringComparer.OrdinalIgnoreCase);

        var views = WebSettingCatalog.All.Select(d =>
        {
            stored.TryGetValue(d.Key, out var row);
            var effective = configuration[d.Key];
            var pending = !d.AppliesLive && !string.Equals(effective, runtime.StartupValue(d.Key, configuration), StringComparison.Ordinal);
            return new WebSettingView(
                d.Key, d.Group, d.Label, d.Description, d.Type, d.AppliesLive, d.Min, d.Max, d.Choices, d.MaxLength,
                FileValue(d.Key), row?.Value, effective, pending, row?.UpdatedAt, row?.UpdatedByUserId);
        }).ToList();

        return new WebSettingsOverview(views, runtime.LoadedAt, views.Count(v => v.PendingRestart));
    }

    public async Task<(string? Before, string After)> SetAsync(string? key, string? value, string? actorUserId, CancellationToken ct)
    {
        var definition = WebSettingCatalog.Find(key)
            ?? throw new WebSettingException("setting-unknown", "That setting can't be changed from the console.");

        var (normalized, error) = WebSettingCatalog.Normalize(definition, value);
        if (error is not null) throw new WebSettingException("setting-invalid", $"{definition.Label}: {error}");

        var before = configuration[definition.Key];
        await repository.UpsertAsync(new WebSetting
        {
            Id = definition.Key,
            Value = normalized!,
            UpdatedAt = clock.GetUtcNow().UtcDateTime,
            UpdatedByUserId = actorUserId
        }, ct).ConfigureAwait(false);

        await ReloadAsync(ct).ConfigureAwait(false);
        logger.LogInformation("Setting {Key} changed by {UserId}", definition.Key, actorUserId ?? "unknown");
        return (before, normalized!);
    }

    /// <summary>Removes the stored value, so appsettings.json / the environment apply again.</summary>
    public async Task<(string? Before, string? After)> ResetAsync(string? key, string? actorUserId, CancellationToken ct)
    {
        var definition = WebSettingCatalog.Find(key)
            ?? throw new WebSettingException("setting-unknown", "That setting can't be changed from the console.");

        var before = configuration[definition.Key];
        await repository.DeleteAsync(definition.Key, ct).ConfigureAwait(false);
        await ReloadAsync(ct).ConfigureAwait(false);

        logger.LogInformation("Setting {Key} reset to its configured default by {UserId}", definition.Key, actorUserId ?? "unknown");
        return (before, configuration[definition.Key]);
    }

    public async Task ReloadAsync(CancellationToken ct)
    {
        var rows = await repository.ListAsync(ct).ConfigureAwait(false);
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            if (WebSettingCatalog.Find(row.Id) is null)
            {
                logger.LogWarning("Ignoring stored setting {Key}: it isn't in the settings catalog", row.Id);
                continue;
            }
            values[row.Id] = row.Value;
        }

        runtime.Apply(values, configuration);
    }

    /// <summary>
    /// Loads stored settings before anything reads its options. A database that isn't
    /// reachable yet leaves the file configuration in force rather than stopping the app.
    /// </summary>
    public static async Task LoadAtStartupAsync(IServiceProvider services, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var provider = scope.ServiceProvider;

        try
        {
            await provider.GetRequiredService<WebSettingsService>().ReloadAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            provider.GetRequiredService<ILogger<WebSettingsService>>().LogWarning(ex,
                "Stored settings could not be loaded at startup; using appsettings.json until the next refresh.");
            provider.GetRequiredService<WebSettingsRuntime>().Apply(
                new Dictionary<string, string>(), provider.GetRequiredService<IConfiguration>());
        }
    }

    /// <summary>The value configuration would have without the WebSettings layer.</summary>
    private string? FileValue(string key)
    {
        if (configuration is not IConfigurationRoot root) return null;
        foreach (var provider in root.Providers.Reverse())
        {
            if (ReferenceEquals(provider, runtime.Provider)) continue;
            if (provider.TryGet(key, out var value)) return value;
        }
        return null;
    }
}
