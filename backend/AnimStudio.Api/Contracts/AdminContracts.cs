namespace AnimStudio.Api.Contracts;

// --- what the UI is told about its own access -------------------------------------------

/// <summary>
/// Whether this caller may administer the server, so the UI can decide whether to offer an
/// admin link at all rather than showing one that leads to a refusal.
/// </summary>
public sealed record AdminAccessResponse(string Mode, bool CanAdminister, string Explanation);

// --- providers ---------------------------------------------------------------------------

/// <summary>
/// Everything the console may know about an installed key: enough to prove which key is in
/// place, never enough to use it.
/// </summary>
public sealed record AdminKeyResponse(
    bool Configured,
    string Source,
    string Masked,
    string? Fingerprint,
    DateTime? CreatedAt,
    DateTime? RotatedAt);

/// <summary>
/// One provider as the console shows it: what it is, what it is set to, whether it works,
/// and which of its settings can be changed from here.
/// </summary>
/// <param name="ManagedHere">
/// True once someone has saved this provider through the console, at which point the stored
/// values win over <c>appsettings.json</c>. False means it is running exactly as the file
/// describes it.
/// </param>
/// <param name="NeedsExecutable">
/// True for a provider that is a program on this machine rather than an address. Its paths
/// are shown but never editable here - a web request that could set the program to run
/// would be a web request that could run any program.
/// </param>
public sealed record AdminProviderResponse(
    string Id,
    string DisplayName,
    string Capability,
    string Family,
    bool RunsLocally,
    bool RequiresApiKey,
    string FreeTierNote,
    string? KeyUrl,
    bool Enabled,
    string? Model,
    string? BaseUrl,
    int? DailyRequestLimit,
    int? MonthlyRequestLimit,
    int? TimeoutSeconds,
    bool SupportsJsonMode,
    bool ManagedHere,
    AdminKeyResponse Key,
    bool Ready,
    string ReadyReason,
    long? DailyRemaining,
    int? ChainPosition,
    bool NeedsExecutable,
    bool ExecutableConfigured,
    bool ModelFolderConfigured,
    string? DefaultBaseUrl,
    string? DefaultModel);

/// <summary>
/// The fallback order for one capability, and every provider that could legitimately be
/// added to it.
/// </summary>
public sealed record AdminChainResponse(
    string Capability,
    IReadOnlyList<string> ProviderIds,
    bool ManagedHere,
    IReadOnlyList<string> Candidates);

public sealed record AdminProvidersResponse(
    IReadOnlyList<AdminProviderResponse> Providers,
    IReadOnlyList<AdminChainResponse> Chains,
    IReadOnlyList<string> HostAllowlist,
    bool EncryptionConfigured);

public sealed record AdminProviderTestResponse(string ProviderId, bool Healthy, string? Reason);

// --- usage -------------------------------------------------------------------------------

public sealed record AdminUsageRowResponse(
    string Day,
    string ProviderId,
    string Capability,
    long Requests,
    long Units,
    long CacheHits,
    long Failures);

public sealed record AdminUsageResponse(
    string FromDay, string ToDay, IReadOnlyList<AdminUsageRowResponse> Rows);

// --- health ------------------------------------------------------------------------------

public sealed record AdminHealthProbeResponse(
    string Key, string DisplayName, string State, string? Detail, string? Advice, bool Required);

public sealed record AdminHealthResponse(
    bool Healthy, DateTime CheckedAtUtc, IReadOnlyList<AdminHealthProbeResponse> Probes);

// --- jobs --------------------------------------------------------------------------------

/// <summary>
/// A render job as the console shows it - across every project, which is why this shape
/// exists separately from the owner-scoped one the render screen uses.
/// </summary>
public sealed record AdminJobResponse(
    string Id,
    string ProjectId,
    string? ProjectName,
    string Status,
    int Progress,
    string? Message,
    string Stage,
    int ScenesTotal,
    int ScenesDone,
    int Attempts,
    string? ErrorCode,
    string? ErrorMessage,
    bool HasOutput,
    bool IsTerminal,
    DateTime CreatedAt,
    DateTime? CompletedAt);

// --- audit -------------------------------------------------------------------------------

public sealed record AdminAuditResponse(
    string Action,
    string? Target,
    string? ActorUserId,
    string? RemoteAddress,
    string? Before,
    string? After,
    DateTime AtUtc);

// --- requests ----------------------------------------------------------------------------

/// <summary>
/// A provider settings change. Every field is optional except the switch, and an omitted
/// value means "no ceiling" or "keep what configuration says" - see
/// <c>AiProviderSettingsRequest</c>, which this maps onto.
/// </summary>
public sealed record UpdateAdminProviderRequest
{
    public bool Enabled { get; init; }
    public string? Model { get; init; }
    public string? BaseUrl { get; init; }
    public int? DailyRequestLimit { get; init; }
    public int? MonthlyRequestLimit { get; init; }
    public int? TimeoutSeconds { get; init; }
    public bool? SupportsJsonMode { get; init; }
}

public sealed record SetProviderKeyRequest
{
    public string? Key { get; init; }
}

public sealed record SaveChainRequest
{
    /// <summary>An empty list restores the order from configuration.</summary>
    public IReadOnlyList<string>? ProviderIds { get; init; }
}
