using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Ai;

/// <summary>
/// What an administrator has changed about one provider, held in the database and applied
/// over the values bound from configuration.
/// </summary>
/// <remarks>
/// <para>
/// The fields here are exactly the ones it is safe to change from a web request. Notably
/// absent: <c>ExecutablePath</c>, <c>VoicesPath</c>, <c>ModelsPath</c> and
/// <c>WorkflowPath</c>. Those name a program to run and directories to read, so an admin
/// endpoint that wrote them would turn "may configure a provider" into "may run any
/// program on the server as the server". They stay in configuration, where changing them
/// needs access to the machine - which is the level of access the capability actually
/// implies.
/// </para>
/// <para>
/// A null field means "keep what configuration says", with two deliberate exceptions:
/// <see cref="DailyRequestLimit"/> and <see cref="MonthlyRequestLimit"/> are cleared to
/// null by an administrator who wants no ceiling, and "no ceiling" is a real choice that
/// has to be expressible. Once a row exists for a provider, its limits are the ones shown
/// in the admin console, so what the operator sees is what applies.
/// </para>
/// </remarks>
public sealed class AiProviderSettings
{
    public string ProviderId { get; set; } = string.Empty;

    public bool Enabled { get; set; }

    /// <summary>Null or empty keeps the configured model.</summary>
    public string? Model { get; set; }

    /// <summary>
    /// Null or empty keeps the configured base URL. A supplied value has already passed the
    /// endpoint guard - it is operator input pointed at by the server, so it is checked
    /// before it is stored and again before every call.
    /// </summary>
    public string? BaseUrl { get; set; }

    public int? DailyRequestLimit { get; set; }
    public int? MonthlyRequestLimit { get; set; }

    /// <summary>Null keeps the configured timeout.</summary>
    public int? TimeoutSeconds { get; set; }

    /// <summary>Null keeps the configured answer.</summary>
    public bool? SupportsJsonMode { get; set; }

    public string? UpdatedByUserId { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// The whole administrator-editable AI configuration: one document, because it is read on
/// every options recomputation and is only ever written by one person at a time.
/// </summary>
public sealed class AiSettings
{
    /// <summary>A fixed id, so the collection holds exactly one of these forever.</summary>
    public const string SingletonId = "ai-settings";

    public string Id { get; set; } = SingletonId;

    /// <summary>
    /// Capability name to an ordered list of provider ids. Empty means "use the chains from
    /// configuration", which is what a server nobody has administered yet looks like.
    /// </summary>
    public Dictionary<string, List<string>> Chains { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public List<AiProviderSettings> Providers { get; set; } = [];

    /// <summary>
    /// Global default studio watermark / hallmark applied to newly created projects and
    /// available as the server-wide default watermark.
    /// </summary>
    public WatermarkSettings? DefaultWatermark { get; set; }

    public string? UpdatedByUserId { get; set; }
    public DateTime UpdatedAt { get; set; }

    public AiProviderSettings? For(string providerId) =>
        Providers.FirstOrDefault(p =>
            string.Equals(p.ProviderId, providerId, StringComparison.OrdinalIgnoreCase));
}
