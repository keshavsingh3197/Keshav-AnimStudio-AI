using System.Text.Json;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Options;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ecosystem;

/// <summary>
/// Hydrates dynamic ecosystem metadata (websites bar, studio/creator branding, creator channels,
/// retired alias rules, and UI navigation) from the central Identity/Admin service (<c>/api/config</c>)
/// combined with Studio's own Mongo-persisted admin overrides — keeping zero channel or brand
/// constants hardcoded in source.
/// </summary>
public sealed class EcosystemConfigService(
    IHttpClientFactory httpFactory,
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<AdminOptions> adminOptions,
    IConfiguration configuration,
    UiNavigationState uiNavigationState,
    ILogger<EcosystemConfigService> logger) : IEcosystemConfigProvider
{
    public const string UiNavigationSettingKey = "Admin:UiNavigation:Json";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private StudioEcosystemConfig _current = CreateEmpty();
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public StudioEcosystemConfig Current => Volatile.Read(ref _current);

    public async Task<StudioEcosystemConfig> GetAsync(bool forceRefresh = false, CancellationToken ct = default)
    {
        if (!forceRefresh && DateTimeOffset.UtcNow < _expiresAt)
        {
            return Current;
        }

        await _refreshLock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (!forceRefresh && DateTimeOffset.UtcNow < _expiresAt)
            {
                return Current;
            }

            var idpBase = ResolveIdpBaseUrl();
            var envelope = await FetchCentralEnvelopeAsync(idpBase, ct).ConfigureAwait(false);

            AiSettings? aiSettings = null;
            using (var scope = scopeFactory.CreateScope())
            {
                var aiRepo = scope.ServiceProvider.GetRequiredService<IAiSettingsRepository>();
                var webRepo = scope.ServiceProvider.GetRequiredService<IWebSettingRepository>();

                aiSettings = await aiRepo.GetAsync(ct).ConfigureAwait(false);
                var storedSettings = await webRepo.ListAsync(ct).ConfigureAwait(false);
                var navRow = storedSettings.FirstOrDefault(s =>
                    string.Equals(s.Id, UiNavigationSettingKey, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrWhiteSpace(navRow?.Value))
                {
                    try
                    {
                        var nav = JsonSerializer.Deserialize<UiNavigationSettings>(navRow.Value, JsonOpts);
                        if (nav is not null)
                        {
                            if (nav.Tabs is { Count: > 0 })
                            {
                                var knownIds = nav.Tabs.Select(t => t.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
                                foreach (var fallbackTab in UiNavigationSettings.CreateDefault().Tabs)
                                {
                                    if (!knownIds.Contains(fallbackTab.Id)) nav.Tabs.Add(fallbackTab);
                                }
                                adminOptions.CurrentValue.UiNavigation.Tabs = nav.Tabs;
                            }
                            uiNavigationState.Set(nav);
                            adminOptions.CurrentValue.UiNavigation.EnforceGuestRestrictions = nav.EnforceGuestRestrictions;
                        }
                    }
                    catch (JsonException ex)
                    {
                        logger.LogWarning(ex, "Stored UI navigation setting could not be deserialized.");
                    }
                }
            }

            var built = BuildConfig(idpBase, envelope, aiSettings);
            Volatile.Write(ref _current, built);
            _expiresAt = DateTimeOffset.UtcNow.Add(CacheTtl);

            ApplyBrandKit(aiSettings, built);
            return built;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public void ApplyBrandKit(AiSettings? aiSettings, StudioEcosystemConfig? config = null)
    {
        var active = config ?? Current;
        var mergedUrls = MergeDistinct(active.RetiredChannelUrls, aiSettings?.RetiredChannelUrls);
        var mergedNames = MergeDistinct(active.RetiredChannelNames, aiSettings?.RetiredChannelNames);
        var defaultBranding = aiSettings?.StudioBranding is not null && HasAnyBranding(aiSettings.StudioBranding)
            ? MergeBranding(aiSettings.StudioBranding, active.DefaultBranding)
            : active.DefaultBranding;

        YouTubeBrandKit.ConfigureRuntime(defaultBranding, mergedUrls, mergedNames);
    }

    public async Task<CentralChannelSyncSummary> SyncToAiSettingsAsync(string? actorUserId, CancellationToken ct = default)
    {
        var central = await GetAsync(forceRefresh: true, ct).ConfigureAwait(false);

        using var scope = scopeFactory.CreateScope();
        var aiRepo = scope.ServiceProvider.GetRequiredService<IAiSettingsRepository>();
        var settings = await aiRepo.GetAsync(ct).ConfigureAwait(false) ?? new AiSettings();

        var updatedStudioBranding = false;
        if (HasAnyBranding(central.DefaultBranding))
        {
            var merged = MergeBranding(settings.StudioBranding, central.DefaultBranding);
            merged.ChannelName = null;
            merged.ChannelUrl = null;
            settings.StudioBranding = merged;
            updatedStudioBranding = true;
        }

        settings.RetiredChannelUrls = MergeDistinct(settings.RetiredChannelUrls, central.RetiredChannelUrls).ToList();
        settings.RetiredChannelNames = MergeDistinct(settings.RetiredChannelNames, central.RetiredChannelNames).ToList();

        var created = 0;
        var updated = 0;

        foreach (var ch in central.Channels.Where(c =>
            string.Equals(c.Platform, "YouTube", StringComparison.OrdinalIgnoreCase)))
        {
            var existing = FindMatchingChannel(settings, ch);
            var centralBranding = new ChannelBranding
            {
                ChannelName = ch.Name,
                Tagline = ch.Tagline,
                ChannelUrl = ch.Url,
                StudioUrl = central.StudioUrl,
                CreatorUrl = central.CreatorPortfolioUrl,
                CreatorName = central.CreatorName,
                EngineName = ch.EngineName ?? central.EngineName,
                VisualsCredit = ch.VisualsCredit ?? central.VisualsCredit,
                Hashtags = [.. ch.Hashtags],
                Tags = [.. ch.Tags],
            };

            if (existing is null)
            {
                if (settings.Channels.Count >= BrandChannel.MaxChannels) continue;
                var publishing = (settings.DefaultPublishing?.CopyDefaults()) ?? new ChannelPublishSettings();
                publishing.YouTubeChannelId = YouTubePublishValidator.IsYouTubeChannelId(ch.ChannelId) ? ch.ChannelId : null;
                publishing.YouTubeChannelTitle = ch.Name;
                publishing.YouTubeChannelHandle = ch.Handle;
                publishing.Tags = [.. ch.Tags];
                publishing.Branding = centralBranding;

                settings.Channels.Add(new BrandChannel
                {
                    Id = $"central-{ch.Key}",
                    Name = ch.Name.Length > BrandChannel.MaxNameLength ? ch.Name[..BrandChannel.MaxNameLength] : ch.Name,
                    Watermark = settings.DefaultWatermark?.Clone() ?? new WatermarkSettings(),
                    Outro = settings.DefaultOutro?.Clone() ?? new OutroSettings(),
                    Publishing = publishing,
                });
                created++;
            }
            else
            {
                existing.Publishing ??= new ChannelPublishSettings();
                if (string.IsNullOrWhiteSpace(existing.Publishing.YouTubeChannelId) &&
                    YouTubePublishValidator.IsYouTubeChannelId(ch.ChannelId))
                {
                    existing.Publishing.YouTubeChannelId = ch.ChannelId;
                }
                if (string.IsNullOrWhiteSpace(existing.Publishing.YouTubeChannelTitle))
                    existing.Publishing.YouTubeChannelTitle = ch.Name;
                if (string.IsNullOrWhiteSpace(existing.Publishing.YouTubeChannelHandle) && !string.IsNullOrWhiteSpace(ch.Handle))
                    existing.Publishing.YouTubeChannelHandle = ch.Handle;
                existing.Publishing.Branding = MergeBranding(existing.Publishing.Branding, centralBranding);
                updated++;
            }
        }

        settings.UpdatedByUserId = actorUserId;
        settings.UpdatedAt = DateTime.UtcNow;
        await aiRepo.SaveAsync(settings, ct).ConfigureAwait(false);

        var refreshed = BuildConfig(ResolveIdpBaseUrl(), null, settings, preserveCentralFrom: central);
        Volatile.Write(ref _current, refreshed);
        ApplyBrandKit(settings, refreshed);

        return new CentralChannelSyncSummary(
            central.Channels.Count,
            created,
            updated,
            updatedStudioBranding,
            refreshed.RetiredChannelUrls,
            refreshed.RetiredChannelNames);
    }

    private string ResolveIdpBaseUrl()
    {
        var explicitUrl = configuration["Admin:IdpBaseUrl"] ?? configuration["Auth:IdpUrl"];
        if (!string.IsNullOrWhiteSpace(explicitUrl))
            return explicitUrl.Trim().TrimEnd('/');

        return string.Equals(adminOptions.CurrentValue.Jwt.Issuer, "keshavsingh-idp", StringComparison.OrdinalIgnoreCase)
            ? "https://id.keshavsingh.in"
            : "http://localhost:5000";
    }

    private async Task<CentralConfigEnvelope?> FetchCentralEnvelopeAsync(string idpBase, CancellationToken ct)
    {
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(6));

            var client = httpFactory.CreateClient("IdP");
            using var resp = await client.GetAsync($"{idpBase}/api/config", timeoutCts.Token).ConfigureAwait(false);
            if (!resp.IsSuccessStatusCode) return null;

            await using var stream = await resp.Content.ReadAsStreamAsync(timeoutCts.Token).ConfigureAwait(false);
            return await JsonSerializer.DeserializeAsync<CentralConfigEnvelope>(stream, JsonOpts, timeoutCts.Token)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Central Admin /api/config not reachable; using database & local configuration.");
            return null;
        }
    }

    private StudioEcosystemConfig BuildConfig(
        string idpBase,
        CentralConfigEnvelope? envelope,
        AiSettings? aiSettings,
        StudioEcosystemConfig? preserveCentralFrom = null)
    {
        var values = envelope?.Values ?? new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        string? Value(string key) =>
            values.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v.Trim() : null;

        var websites = envelope?.Websites?
            .Where(w => !string.IsNullOrWhiteSpace(w.Url) && !string.IsNullOrWhiteSpace(w.Name))
            .OrderBy(w => w.SortOrder)
            .Select(w => new EcosystemWebsiteItem(
                w.Key?.Trim() ?? string.Empty,
                w.Name!.Trim(),
                string.IsNullOrWhiteSpace(w.ShortLabel) ? w.Name!.Trim() : w.ShortLabel.Trim(),
                w.Tagline?.Trim(),
                w.Url!.Trim(),
                w.Description?.Trim(),
                w.Icon?.Trim(),
                w.BadgeText?.Trim(),
                w.AccentColor?.Trim(),
                w.IsPrimary,
                w.SortOrder))
            .ToList() ?? preserveCentralFrom?.Websites.ToList() ?? [];

        var allCentralChannels = (envelope?.Channels ?? [])
            .Where(c => c.IsEnabled && !string.IsNullOrWhiteSpace(c.Name) && !string.IsNullOrWhiteSpace(c.Url))
            .OrderBy(c => c.SortOrder)
            .Select(c => new EcosystemChannelItem(
                c.Key?.Trim() ?? string.Empty,
                c.Name!.Trim(),
                c.Handle?.Trim(),
                string.IsNullOrWhiteSpace(c.Platform) ? "YouTube" : c.Platform.Trim(),
                c.ChannelId?.Trim(),
                c.Url!.Trim(),
                c.Niche?.Trim(),
                c.Tagline?.Trim(),
                c.Description?.Trim(),
                c.EngineName?.Trim(),
                c.VisualsCredit?.Trim(),
                c.Hashtags?.Where(h => !string.IsNullOrWhiteSpace(h)).Select(h => h.Trim().TrimStart('#')).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? [],
                c.Tags?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? [],
                c.RetiredHandles?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? [],
                c.RetiredUrls?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? [],
                c.IsPrimary,
                c.SortOrder))
            .ToList();

        var studioChannels = allCentralChannels.Count > 0
            ? allCentralChannels
            : preserveCentralFrom?.Channels.ToList() ?? [];

        var socialLinks = studioChannels
            .Select(c => new EcosystemSocialLink(c.Key, c.Name, c.Handle, c.Platform, c.Url, c.Description ?? c.Tagline))
            .ToList();

        var studioUrl = websites.FirstOrDefault(w => string.Equals(w.Key, "studio", StringComparison.OrdinalIgnoreCase))?.Url
            ?? aiSettings?.StudioBranding?.StudioUrl
            ?? configuration["AllowedOrigins:1"]
            ?? string.Empty;

        var adminUrl = Value("ecosystem.adminUrl")
            ?? websites.FirstOrDefault(w => string.Equals(w.Key, "admin", StringComparison.OrdinalIgnoreCase))?.Url
            ?? "https://admin.keshavsingh.in";

        var creatorName = Value("ecosystem.creatorName")
            ?? aiSettings?.StudioBranding?.CreatorName
            ?? string.Empty;

        var creatorPortfolioUrl = Value("ecosystem.creatorPortfolioUrl")
            ?? aiSettings?.StudioBranding?.CreatorUrl;

        var primaryChannel = studioChannels.FirstOrDefault(c => c.IsPrimary)
            ?? studioChannels.FirstOrDefault();

        var engineName = aiSettings?.StudioBranding?.EngineName
            ?? Value("studio.engineName")
            ?? primaryChannel?.EngineName
            ?? "AnimStudio";

        var visualsCredit = aiSettings?.StudioBranding?.VisualsCredit
            ?? Value("studio.visualsCredit")
            ?? primaryChannel?.VisualsCredit;

        var studioBranding = new ChannelBranding
        {
            ChannelName = aiSettings?.StudioBranding?.ChannelName ?? primaryChannel?.Name,
            Tagline = aiSettings?.StudioBranding?.Tagline ?? Value("studio.tagline") ?? primaryChannel?.Tagline,
            ChannelUrl = aiSettings?.StudioBranding?.ChannelUrl ?? primaryChannel?.Url,
            StudioUrl = aiSettings?.StudioBranding?.StudioUrl ?? (string.IsNullOrWhiteSpace(studioUrl) ? null : studioUrl),
            CreatorUrl = aiSettings?.StudioBranding?.CreatorUrl ?? creatorPortfolioUrl,
            CreatorName = aiSettings?.StudioBranding?.CreatorName ?? (string.IsNullOrWhiteSpace(creatorName) ? null : creatorName),
            EngineName = engineName,
            VisualsCredit = visualsCredit,
            Hashtags = aiSettings?.StudioBranding?.Hashtags is { Count: > 0 } h ? [.. h] : [.. (primaryChannel?.Hashtags ?? [])],
            Tags = aiSettings?.StudioBranding?.Tags is { Count: > 0 } t ? [.. t] : [.. (primaryChannel?.Tags ?? [])],
        };

        var retiredUrls = MergeDistinct(
            aiSettings?.RetiredChannelUrls,
            studioChannels.SelectMany(c => c.RetiredUrls));
        var retiredNames = MergeDistinct(
            aiSettings?.RetiredChannelNames,
            studioChannels.SelectMany(c => c.RetiredHandles));

        return new StudioEcosystemConfig(
            StudioTitle: Value("studio.title") ?? "AnimStudio",
            StudioTagline: Value("studio.tagline") ?? studioBranding.Tagline ?? string.Empty,
            CreatorName: creatorName,
            CreatorPortfolioUrl: creatorPortfolioUrl,
            LegalUpdatedDate: Value("ecosystem.legalUpdatedDate") ?? preserveCentralFrom?.LegalUpdatedDate,
            CopyrightNotice: Value("ecosystem.copyrightNotice") ?? preserveCentralFrom?.CopyrightNotice,
            AdminUrl: adminUrl,
            IdpUrl: $"{idpBase}/api",
            StudioUrl: studioUrl,
            DefaultChannelKey: Value("studio.defaultChannelKey") ?? primaryChannel?.Key,
            EngineName: engineName,
            VisualsCredit: visualsCredit,
            DefaultBranding: studioBranding,
            Websites: websites,
            Channels: studioChannels,
            SocialLinks: socialLinks,
            RetiredChannelUrls: retiredUrls,
            RetiredChannelNames: retiredNames,
            SyncedFromCentral: envelope is not null || preserveCentralFrom?.SyncedFromCentral == true,
            LastSyncedAt: DateTimeOffset.UtcNow);
    }

    private static BrandChannel? FindMatchingChannel(AiSettings settings, EcosystemChannelItem ch) =>
        settings.Channels.FirstOrDefault(c =>
            string.Equals(c.Id, $"central-{ch.Key}", StringComparison.OrdinalIgnoreCase) ||
            (!string.IsNullOrWhiteSpace(ch.ChannelId) && string.Equals(c.Publishing?.YouTubeChannelId, ch.ChannelId, StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrWhiteSpace(ch.Handle) && string.Equals(c.Publishing?.YouTubeChannelHandle?.TrimStart('@'), ch.Handle.TrimStart('@'), StringComparison.OrdinalIgnoreCase)));

    private static ChannelBranding MergeBranding(ChannelBranding? current, ChannelBranding fallback) => new()
    {
        ChannelName = NullIfWhiteSpace(current?.ChannelName) ?? NullIfWhiteSpace(fallback.ChannelName),
        Tagline = NullIfWhiteSpace(current?.Tagline) ?? NullIfWhiteSpace(fallback.Tagline),
        ChannelUrl = NullIfWhiteSpace(current?.ChannelUrl) ?? NullIfWhiteSpace(fallback.ChannelUrl),
        StudioUrl = NullIfWhiteSpace(current?.StudioUrl) ?? NullIfWhiteSpace(fallback.StudioUrl),
        CreatorUrl = NullIfWhiteSpace(current?.CreatorUrl) ?? NullIfWhiteSpace(fallback.CreatorUrl),
        CreatorName = NullIfWhiteSpace(current?.CreatorName) ?? NullIfWhiteSpace(fallback.CreatorName),
        EngineName = NullIfWhiteSpace(current?.EngineName) ?? NullIfWhiteSpace(fallback.EngineName),
        VisualsCredit = NullIfWhiteSpace(current?.VisualsCredit) ?? NullIfWhiteSpace(fallback.VisualsCredit),
        Hashtags = current?.Hashtags is { Count: > 0 } h ? [.. h] : [.. fallback.Hashtags],
        Tags = current?.Tags is { Count: > 0 } t ? [.. t] : [.. fallback.Tags],
    };

    private static bool HasAnyBranding(ChannelBranding b) =>
        !string.IsNullOrWhiteSpace(b.ChannelName)
        || !string.IsNullOrWhiteSpace(b.Tagline)
        || !string.IsNullOrWhiteSpace(b.ChannelUrl)
        || !string.IsNullOrWhiteSpace(b.StudioUrl)
        || !string.IsNullOrWhiteSpace(b.CreatorUrl)
        || !string.IsNullOrWhiteSpace(b.CreatorName)
        || !string.IsNullOrWhiteSpace(b.EngineName)
        || !string.IsNullOrWhiteSpace(b.VisualsCredit)
        || b.Hashtags.Count > 0
        || b.Tags.Count > 0;

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static IReadOnlyList<string> MergeDistinct(IEnumerable<string>? a, IEnumerable<string>? b) =>
        [.. (a ?? []).Concat(b ?? [])
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)];

    private static StudioEcosystemConfig CreateEmpty() => new(
        StudioTitle: "AnimStudio",
        StudioTagline: string.Empty,
        CreatorName: string.Empty,
        CreatorPortfolioUrl: null,
        LegalUpdatedDate: null,
        CopyrightNotice: null,
        AdminUrl: "https://admin.keshavsingh.in",
        IdpUrl: "https://id.keshavsingh.in/api",
        StudioUrl: string.Empty,
        DefaultChannelKey: null,
        EngineName: "AnimStudio",
        VisualsCredit: null,
        DefaultBranding: new ChannelBranding(),
        Websites: [],
        Channels: [],
        SocialLinks: [],
        RetiredChannelUrls: [],
        RetiredChannelNames: [],
        SyncedFromCentral: false,
        LastSyncedAt: null);
}
