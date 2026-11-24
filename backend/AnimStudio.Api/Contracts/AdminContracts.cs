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
    string? DefaultModel,
    IReadOnlyList<AdminModelChoiceResponse>? Models = null,
    int PoolKeyCount = 0,
    int PoolReadyCount = 0);

/// <summary>A model offered in the console's dropdown, with what it trades against the others.</summary>
public sealed record AdminModelChoiceResponse(
    string Id, string Label, string? Detail, string? Tier, bool Recommended);

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

// --- multi-key pool / api keys vault -------------------------------------------------------

public sealed record AdminApiKeyResponse(
    string Id,
    string Vendor,
    string Label,
    string? Notes,
    IReadOnlyList<string> ProviderIds,
    int Priority,
    bool Enabled,
    string Source,
    string Masked,
    string? Fingerprint,
    DateTime? CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? RotatedAtUtc,
    DateTime? LastUsedAtUtc,
    DateTime? LastSucceededAtUtc,
    DateTime? CooldownUntilUtc,
    string? CooldownReason,
    string? LastErrorCode,
    string? UsageDayBucket,
    long UsageCountToday,
    string Status);

public sealed record AdminApiKeyVendorProviderResponse(
    string Id,
    string DisplayName,
    string Capability,
    bool Enabled,
    string? Model);

public sealed record AdminApiKeyVendorResponse(
    string Vendor,
    string DisplayName,
    string Description,
    string? KeyUrl,
    bool ExpandedByDefault,
    IReadOnlyList<AdminApiKeyVendorProviderResponse> Providers,
    IReadOnlyList<AdminApiKeyResponse> Keys);

public sealed record AdminApiKeysResponse(
    IReadOnlyList<AdminApiKeyVendorResponse> Vendors,
    bool EncryptionConfigured);

public sealed record AdminApiKeyTestResponse(
    string KeyId,
    string Vendor,
    string Label,
    bool Healthy,
    int? StatusCode,
    string? Reason,
    AdminApiKeysResponse Snapshot);

public sealed record CreateAdminApiKeyRequest
{
    public string Vendor { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public IReadOnlyList<string>? ProviderIds { get; init; }
    public string? Key { get; init; }
    public bool Enabled { get; init; } = true;
    public int? Priority { get; init; }
}

public sealed record UpdateAdminApiKeyRequest
{
    public string Label { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public IReadOnlyList<string>? ProviderIds { get; init; }
    public bool Enabled { get; init; } = true;
    public string? Key { get; init; }
    public bool ClearCooldown { get; init; }
}

public sealed record ReorderAdminApiKeysRequest
{
    public IReadOnlyList<string>? OrderedKeyIds { get; init; }
}

// --- access control & anonymous tier ---------------------------------------------------

public sealed record AdminAccessControlResponse(
    string Mode,
    AnimStudio.Application.Options.AnonymousAccessPolicy AnonymousPolicy,
    AnimStudio.Application.Options.UiNavigationSettings UiNavigation,
    IReadOnlyList<string> AvailableRoles);

public sealed record UpdateAccessControlRequest(
    AnimStudio.Application.Options.AnonymousAccessPolicy? AnonymousPolicy,
    AnimStudio.Application.Options.UiNavigationSettings? UiNavigation);

public sealed record StudioSessionResponse(
    bool IsAuthenticated,
    string UserId,
    string? DisplayName,
    string? Email,
    bool IsAdmin,
    IReadOnlyList<string> Roles,
    AnimStudio.Application.Options.AnonymousAccessPolicy AnonymousPolicy,
    AnimStudio.Application.Options.UiNavigationSettings UiNavigation);

public sealed record UserScopeItemResponse(
    string UserId,
    bool IsGuest,
    string DisplayName,
    int ProjectCount,
    DateTime? LastActiveUtc,
    string StorageEstimate);

public sealed record UserScopesOverviewResponse(
    int TotalUsers,
    int RegisteredMembers,
    int GuestSessions,
    int TotalProjects,
    IReadOnlyList<UserScopeItemResponse> Scopes);

public sealed record PurgeGuestProjectsRequest(int DaysInactive = 7);

public sealed record PurgeGuestProjectsResponse(int ProjectsPurged, int GuestScopesCleaned);
