using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Ecosystem;

/// <summary>Raw envelope deserialized from the central Identity/Admin `/api/config` endpoint.</summary>
public sealed record CentralConfigEnvelope(
    string? SiteTitle,
    string? BlogUrl,
    string? BlogAdminUrl,
    string? Version,
    Dictionary<string, string?>? Values,
    IReadOnlyList<CentralWebsiteDto>? Websites,
    IReadOnlyList<CentralCreatorChannelDto>? Channels);

public sealed record CentralWebsiteDto(
    string? Key,
    string? Name,
    string? ShortLabel,
    string? Tagline,
    string? Url,
    string? Description,
    string? Icon,
    string? BadgeText,
    string? AccentColor,
    bool IsPrimary,
    int SortOrder);

public sealed record CentralCreatorChannelDto(
    string? Id,
    string? Key,
    string? Name,
    string? Handle,
    string? Platform,
    string? ChannelId,
    string? Url,
    string? Niche,
    string? Tagline,
    string? Description,
    string? EngineName,
    string? VisualsCredit,
    IReadOnlyList<string>? Hashtags,
    IReadOnlyList<string>? Tags,
    IReadOnlyList<string>? RetiredHandles,
    IReadOnlyList<string>? RetiredUrls,
    bool IsPrimary,
    bool IsEnabled,
    bool ShowInAnalytics,
    bool ShowInPanchang,
    bool ShowInStudio,
    bool ShowInFooter,
    int SortOrder);

public sealed record EcosystemWebsiteItem(
    string Key,
    string Name,
    string ShortLabel,
    string? Tagline,
    string Url,
    string? Description,
    string? Icon,
    string? BadgeText,
    string? AccentColor,
    bool IsPrimary,
    int SortOrder);

public sealed record EcosystemChannelItem(
    string Key,
    string Name,
    string? Handle,
    string Platform,
    string? ChannelId,
    string Url,
    string? Niche,
    string? Tagline,
    string? Description,
    string? EngineName,
    string? VisualsCredit,
    IReadOnlyList<string> Hashtags,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> RetiredHandles,
    IReadOnlyList<string> RetiredUrls,
    bool IsPrimary,
    int SortOrder);

public sealed record EcosystemSocialLink(
    string Key,
    string Name,
    string? Handle,
    string Platform,
    string Url,
    string? Description);

/// <summary>Public runtime ecosystem metadata pushed from central Admin + Studio DB.</summary>
public sealed record StudioEcosystemConfig(
    string StudioTitle,
    string StudioTagline,
    string CreatorName,
    string? CreatorPortfolioUrl,
    string? LegalUpdatedDate,
    string? CopyrightNotice,
    string AdminUrl,
    string IdpUrl,
    string StudioUrl,
    string? DefaultChannelKey,
    string EngineName,
    string? VisualsCredit,
    ChannelBranding DefaultBranding,
    IReadOnlyList<EcosystemWebsiteItem> Websites,
    IReadOnlyList<EcosystemChannelItem> Channels,
    IReadOnlyList<EcosystemSocialLink> SocialLinks,
    IReadOnlyList<string> RetiredChannelUrls,
    IReadOnlyList<string> RetiredChannelNames,
    bool SyncedFromCentral,
    DateTimeOffset? LastSyncedAt);

public sealed record UpdateRetiredAliasesRequest(
    IReadOnlyList<string>? RetiredChannelUrls,
    IReadOnlyList<string>? RetiredChannelNames);

public sealed record CentralChannelSyncSummary(
    int SyncedChannelsCount,
    int CreatedBrandChannels,
    int UpdatedBrandChannels,
    bool UpdatedStudioBranding,
    IReadOnlyList<string> RetiredChannelUrls,
    IReadOnlyList<string> RetiredChannelNames);

public interface IEcosystemConfigProvider
{
    StudioEcosystemConfig Current { get; }
    Task<StudioEcosystemConfig> GetAsync(bool forceRefresh = false, CancellationToken ct = default);
    void ApplyBrandKit(AiSettings? aiSettings, StudioEcosystemConfig? config = null);
    Task<CentralChannelSyncSummary> SyncToAiSettingsAsync(string? actorUserId, CancellationToken ct = default);
}

/// <summary>
/// Thread-safe runtime store for Admin-configured UI tab visibility, hydrated from DB at startup
/// and whenever an Admin updates access control.
/// </summary>
public sealed class UiNavigationState
{
    private UiNavigationSettings? _persisted;
    private readonly Lock _gate = new();

    public void Set(UiNavigationSettings? settings)
    {
        lock (_gate)
        {
            _persisted = settings is null
                ? null
                : new UiNavigationSettings
                {
                    EnforceGuestRestrictions = settings.EnforceGuestRestrictions,
                    Tabs = [.. settings.Tabs.Select(t => new UiNavigationItemConfig
                    {
                        Id = t.Id,
                        Label = t.Label,
                        Path = t.Path,
                        Icon = t.Icon,
                        VisibleToAnonymous = t.VisibleToAnonymous,
                        VisibleToMembers = t.VisibleToMembers,
                        RequiresAuth = t.RequiresAuth,
                        IsSensitive = t.IsSensitive,
                        Enabled = t.Enabled,
                        Description = t.Description,
                    })],
                };
        }
    }

    public UiNavigationSettings Get(UiNavigationSettings fallback)
    {
        lock (_gate)
        {
            return _persisted ?? fallback;
        }
    }
}
