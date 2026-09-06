using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Holds the administrator's stored AI settings for the life of the process, and tells the
/// options system when they change.
/// </summary>
/// <remarks>
/// <para>
/// This is what makes the admin console real rather than decorative. Every consumer of AI
/// configuration - the registry composing a chain, each provider reading its base URL, the
/// quota guard reading a ceiling - already reads
/// <c>IOptionsMonitor&lt;AiOptions&gt;</c>. Publishing the stored settings through the same
/// monitor means switching a provider on takes effect on the next call, with no restart
/// and without a single one of those consumers knowing that an admin console exists.
/// </para>
/// <para>
/// The change token follows the pattern the configuration system itself uses: the current
/// token is handed out, and a write swaps in a fresh one and then fires the old one, so a
/// monitor re-registers against the new token rather than against one that has already
/// fired.
/// </para>
/// </remarks>
public sealed class AiRuntimeSettings
{
    private AiSettings? _current;
    private ConfigurationReloadToken _token = new();

    public AiSettings? Current => Volatile.Read(ref _current);

    public IChangeToken Token => Volatile.Read(ref _token);

    /// <summary>
    /// Publishes a new snapshot. The value is stored before the token fires, so a listener
    /// that recomputes options synchronously sees the change it was told about.
    /// </summary>
    public void Publish(AiSettings settings)
    {
        Volatile.Write(ref _current, settings);

        var previous = Interlocked.Exchange(ref _token, new ConfigurationReloadToken());
        previous.OnReload();
    }
}

/// <summary>
/// Applies the stored settings on top of the values bound from <c>appsettings.json</c>.
/// Runs after every <c>Configure</c>, which is what makes it an override rather than a
/// default.
/// </summary>
public sealed class AiSettingsPostConfigure(AiRuntimeSettings runtime) : IPostConfigureOptions<AiOptions>
{
    public void PostConfigure(string? name, AiOptions options) =>
        AiSettingsOverlay.Apply(options, runtime.Current);
}

/// <summary>Makes <c>IOptionsMonitor&lt;AiOptions&gt;</c> recompute when an admin saves.</summary>
public sealed class AiSettingsChangeTokenSource(AiRuntimeSettings runtime)
    : IOptionsChangeTokenSource<AiOptions>
{
    public string Name => Microsoft.Extensions.Options.Options.DefaultName;

    public IChangeToken GetChangeToken() => runtime.Token;
}
