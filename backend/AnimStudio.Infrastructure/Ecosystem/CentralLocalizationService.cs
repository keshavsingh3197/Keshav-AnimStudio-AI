using System.Collections.Concurrent;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Domain.System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Ecosystem;

public sealed class StudioLocalizationConfig
{
    public bool OverrideCentralLocalization { get; set; } = false;
    public string DefaultLocale { get; set; } = "en";
    public List<string> EnabledLocales { get; set; } = ["en", "hi"];
    public bool AllowVisitorLanguageSwitch { get; set; } = true;
    public bool ShowLanguagePicker { get; set; } = true;
    public bool ForceLocale { get; set; } = false;
    public Dictionary<string, Dictionary<string, string>> LocalOverrides { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public string? LastUpdatedByUserId { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed record StudioLocaleDto(
    string Code,
    string NativeName,
    string EnglishName,
    string Direction = "ltr",
    string Icon = "",
    bool IsDefault = false);

public sealed record EffectiveLocalizationPolicyDto(
    string SiteKey,
    string DefaultLocale,
    IReadOnlyList<string> EnabledLocales,
    bool AllowVisitorLanguageSwitch,
    bool ShowLanguagePicker,
    bool ForceLocale,
    string ControlledBy,
    bool OverrideCentralLocalization,
    bool UiOnlyNote = true);

public sealed record LocalizationManifestResponse(
    EffectiveLocalizationPolicyDto Policy,
    IReadOnlyList<StudioLocaleDto> Locales,
    IReadOnlyDictionary<string, string> Versions,
    string Source);

public sealed record LocalizationBundleResponse(
    string Locale,
    string Version,
    EffectiveLocalizationPolicyDto Policy,
    IReadOnlyDictionary<string, string> Entries,
    string Source);

public sealed record SiteLocalizationAdminStateResponse(
    EffectiveLocalizationPolicyDto CentralAdminPolicy,
    StudioLocalizationConfig LocalSettings,
    EffectiveLocalizationPolicyDto EffectivePolicy);

public sealed record UpdateSiteLocalizationRequest(
    bool OverrideCentralLocalization,
    string DefaultLocale,
    IReadOnlyList<string>? EnabledLocales,
    bool AllowVisitorLanguageSwitch,
    bool ShowLanguagePicker,
    bool ForceLocale,
    Dictionary<string, Dictionary<string, string>>? LocalOverrides = null);

/// <summary>
/// Direct AdminDb MongoDB localization + ecosystem config reader for AnimStudio AI.
/// Controls Studio UI chrome &amp; navigation labels ONLY — per-job Video &amp; Song content generation
/// languages remain strictly independent.
/// </summary>
public sealed class CentralLocalizationService
{
    public const string SiteKey = "studio";
    public const string StudioLocalizationSettingKey = "Studio:Localization:Json";
    private static readonly string[] Namespaces = ["ecosystem", "common", "studio"];
    private static readonly ConcurrentDictionary<string, MongoClient> Clients = new(StringComparer.Ordinal);
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private readonly IServiceScopeFactory? _scopeFactory;
    private readonly string? _centralConnectionString;
    private readonly string _centralDbName;
    private readonly ILogger<CentralLocalizationService> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private CentralSnapshot? _cached;
    private DateTime _cacheExpiresAtUtc = DateTime.MinValue;
    private StudioLocalizationConfig? _inMemoryLocalFallback;

    public CentralLocalizationService(
        IConfiguration configuration,
        ILogger<CentralLocalizationService> logger,
        IServiceScopeFactory? scopeFactory = null)
    {
        _scopeFactory = scopeFactory;
        _centralConnectionString = FirstNonEmpty(
            configuration["CentralMongo:ConnectionString"],
            Environment.GetEnvironmentVariable("CentralMongo__ConnectionString"),
            configuration["Mongo:ConnectionString"],
            Environment.GetEnvironmentVariable("Mongo__ConnectionString"),
            configuration["MongoDbSettings:ConnectionString"],
            Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING"));
        _centralDbName = FirstNonEmpty(
            configuration["CentralMongo:DatabaseName"],
            configuration["CentralMongo:Database"],
            Environment.GetEnvironmentVariable("CentralMongo__DatabaseName"),
            Environment.GetEnvironmentVariable("CentralMongo__Database")) ?? "AdminDb";
        _logger = logger;
    }

    public async Task<LocalizationManifestResponse> GetManifestAsync(CancellationToken ct = default)
    {
        var snap = await GetSnapshotAsync(ct).ConfigureAwait(false);
        var local = await GetLocalConfigAsync(ct).ConfigureAwait(false);
        var policy = ResolvePolicy(snap.CentralPolicy, local);
        var locales = FilterLocales(snap.Locales, policy);
        var versions = locales.ToDictionary(
            l => l.Code,
            l => $"{l.Code}:{snap.LoadedAtUtc.Ticks:x}:{local.UpdatedAtUtc.Ticks:x}",
            StringComparer.OrdinalIgnoreCase);

        return new LocalizationManifestResponse(
            policy,
            locales,
            versions,
            snap.LoadedFromCentralMongo ? "mongodb-central" : "builtin-fallback");
    }

    public async Task<LocalizationBundleResponse> GetBundleAsync(string? requestedLocale, CancellationToken ct = default)
    {
        var snap = await GetSnapshotAsync(ct).ConfigureAwait(false);
        var local = await GetLocalConfigAsync(ct).ConfigureAwait(false);
        var policy = ResolvePolicy(snap.CentralPolicy, local);

        var requested = NormalizeLocale(requestedLocale, policy.DefaultLocale);
        var effectiveLocale = policy.ForceLocale
            ? policy.DefaultLocale
            : (policy.EnabledLocales.Contains(requested, StringComparer.OrdinalIgnoreCase)
                ? requested
                : policy.DefaultLocale);

        var merged = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        ApplyEntries(merged, BuiltInFallback(effectiveLocale));
        if (snap.TranslationsByLocale.TryGetValue("en", out var centralEn))
            ApplyEntries(merged, centralEn);
        if (snap.TranslationsByLocale.TryGetValue(effectiveLocale, out var centralTarget))
            ApplyEntries(merged, centralTarget);
        if (local.OverrideCentralLocalization && local.LocalOverrides.TryGetValue(effectiveLocale, out var localMap))
            ApplyEntries(merged, localMap);

        var version = $"{effectiveLocale}:{snap.LoadedAtUtc.Ticks:x}:{local.UpdatedAtUtc.Ticks:x}";
        return new LocalizationBundleResponse(
            effectiveLocale,
            version,
            policy,
            merged,
            snap.LoadedFromCentralMongo ? "mongodb-central" : "builtin-fallback");
    }

    public async Task<SiteLocalizationAdminStateResponse> GetAdminStateAsync(CancellationToken ct = default)
    {
        var snap = await GetSnapshotAsync(ct).ConfigureAwait(false);
        var local = await GetLocalConfigAsync(ct).ConfigureAwait(false);
        return new SiteLocalizationAdminStateResponse(
            snap.CentralPolicy,
            local,
            ResolvePolicy(snap.CentralPolicy, local));
    }

    public async Task<SiteLocalizationAdminStateResponse> UpdateLocalSettingsAsync(
        UpdateSiteLocalizationRequest req,
        string? adminUserId,
        CancellationToken ct = default)
    {
        var existing = await GetLocalConfigAsync(ct).ConfigureAwait(false);
        var defaultLocale = NormalizeLocale(req.DefaultLocale, "en");
        var enabled = NormalizeEnabledLocales(req.EnabledLocales, defaultLocale);

        var updated = new StudioLocalizationConfig
        {
            OverrideCentralLocalization = req.OverrideCentralLocalization,
            DefaultLocale = defaultLocale,
            EnabledLocales = enabled.ToList(),
            AllowVisitorLanguageSwitch = req.AllowVisitorLanguageSwitch,
            ShowLanguagePicker = req.ShowLanguagePicker,
            ForceLocale = req.ForceLocale,
            LocalOverrides = req.LocalOverrides ?? existing.LocalOverrides,
            LastUpdatedByUserId = adminUserId,
            UpdatedAtUtc = DateTime.UtcNow,
        };

        await SaveLocalConfigAsync(updated, adminUserId, ct).ConfigureAwait(false);
        InvalidateCache();
        return await GetAdminStateAsync(ct).ConfigureAwait(false);
    }

    public async Task<CentralConfigEnvelope?> TryLoadCentralEnvelopeFromMongoAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_centralConnectionString))
            return null;

        try
        {
            var client = Clients.GetOrAdd(_centralConnectionString, cs => new MongoClient(cs));
            var db = client.GetDatabase(_centralDbName);

            var siteDocs = await db.GetCollection<BsonDocument>("websites")
                .Find(Builders<BsonDocument>.Filter.Eq("IsEnabled", true))
                .ToListAsync(ct)
                .ConfigureAwait(false);

            var channelDocs = await db.GetCollection<BsonDocument>("creator_channels")
                .Find(Builders<BsonDocument>.Filter.Eq("IsEnabled", true))
                .ToListAsync(ct)
                .ConfigureAwait(false);

            var cfgDocs = await db.GetCollection<BsonDocument>("config_entries")
                .Find(Builders<BsonDocument>.Filter.Ne("IsSecret", true))
                .ToListAsync(ct)
                .ConfigureAwait(false);

            var appCfgDoc = await db.GetCollection<BsonDocument>("config")
                .Find(FilterDefinition<BsonDocument>.Empty)
                .FirstOrDefaultAsync(ct)
                .ConfigureAwait(false);

            var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            foreach (var d in cfgDocs)
            {
                var k = GetString(d, "Key");
                var val = GetString(d, "Value");
                if (string.IsNullOrWhiteSpace(val))
                    val = GetString(d, "DefaultValue");
                if (!string.IsNullOrWhiteSpace(k))
                    values[k] = val;
            }

            var siteTitle = GetNullableString(appCfgDoc, "SiteTitle")
                ?? (values.TryGetValue("site_title", out var st) ? st : null)
                ?? "Keshav Ecosystem";
            var blogUrl = GetNullableString(appCfgDoc, "BlogUrl")
                ?? (values.TryGetValue("blog_url", out var bu) ? bu : null);
            var blogAdminUrl = GetNullableString(appCfgDoc, "BlogAdminUrl")
                ?? (values.TryGetValue("blog_admin_url", out var bau) ? bau : null);

            var websites = siteDocs
                .Select(d =>
                {
                    var name = GetString(d, "Name");
                    return new CentralWebsiteDto(
                        Key: GetString(d, "Key"),
                        Name: name,
                        ShortLabel: GetNullableString(d, "ShortLabel") ?? name,
                        Tagline: GetNullableString(d, "Tagline"),
                        Url: GetString(d, "Url"),
                        Description: GetNullableString(d, "Description"),
                        Icon: GetNullableString(d, "Icon") ?? "🌐",
                        BadgeText: GetNullableString(d, "BadgeText"),
                        AccentColor: GetNullableString(d, "AccentColor"),
                        IsPrimary: GetBool(d, "IsPrimary", false),
                        SortOrder: GetInt(d, "SortOrder", 10));
                })
                .OrderBy(w => w.SortOrder)
                .ToList();

            var channels = channelDocs
                .Select(d => new CentralCreatorChannelDto(
                    Id: d.TryGetValue("_id", out var id) ? id.ToString() ?? string.Empty : string.Empty,
                    Key: GetString(d, "Key"),
                    Name: GetString(d, "Name"),
                    Handle: GetString(d, "Handle"),
                    Platform: GetString(d, "Platform", "YouTube"),
                    ChannelId: GetString(d, "ChannelId"),
                    Url: GetString(d, "Url"),
                    Niche: GetString(d, "Niche"),
                    Tagline: GetString(d, "Tagline"),
                    Description: GetString(d, "Description"),
                    EngineName: GetString(d, "EngineName"),
                    VisualsCredit: GetString(d, "VisualsCredit"),
                    Hashtags: ReadStringArray(d, "Hashtags"),
                    Tags: ReadStringArray(d, "Tags"),
                    RetiredHandles: ReadStringArray(d, "RetiredHandles"),
                    RetiredUrls: ReadStringArray(d, "RetiredUrls"),
                    IsPrimary: GetBool(d, "IsPrimary", false),
                    IsEnabled: GetBool(d, "IsEnabled", true),
                    ShowInAnalytics: GetBool(d, "ShowInAnalytics", true),
                    ShowInPanchang: GetBool(d, "ShowInPanchang", false),
                    ShowInStudio: GetBool(d, "ShowInStudio", false),
                    ShowInFooter: GetBool(d, "ShowInFooter", true),
                    SortOrder: GetInt(d, "SortOrder", 10)))
                .OrderBy(c => c.SortOrder)
                .ToList();

            return new CentralConfigEnvelope(
                SiteTitle: siteTitle,
                BlogUrl: blogUrl,
                BlogAdminUrl: blogAdminUrl,
                Version: $"{DateTime.UtcNow.Ticks:x}",
                Values: values,
                Websites: websites,
                Channels: channels);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Direct AdminDb envelope read failed; HTTP /api/config fallback will be used.");
            return null;
        }
    }

    public static EffectiveLocalizationPolicyDto ResolvePolicy(
        EffectiveLocalizationPolicyDto central,
        StudioLocalizationConfig local)
    {
        if (!local.OverrideCentralLocalization)
            return central with { ControlledBy = "admin", OverrideCentralLocalization = false, UiOnlyNote = true };

        var def = NormalizeLocale(local.DefaultLocale, central.DefaultLocale);
        var enabled = NormalizeEnabledLocales(local.EnabledLocales, def);
        return new EffectiveLocalizationPolicyDto(
            SiteKey,
            def,
            enabled,
            local.AllowVisitorLanguageSwitch,
            local.ShowLanguagePicker,
            local.ForceLocale,
            "site-override",
            true,
            true);
    }

    public void InvalidateCache() => _cacheExpiresAtUtc = DateTime.MinValue;

    private async Task<StudioLocalizationConfig> GetLocalConfigAsync(CancellationToken ct)
    {
        if (_scopeFactory is null)
            return _inMemoryLocalFallback ?? new StudioLocalizationConfig();

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetService<IWebSettingRepository>();
            if (repo is null)
                return _inMemoryLocalFallback ?? new StudioLocalizationConfig();

            var settings = await repo.ListAsync(ct).ConfigureAwait(false);
            var row = settings.FirstOrDefault(s => string.Equals(s.Id, StudioLocalizationSettingKey, StringComparison.OrdinalIgnoreCase));
            if (row is null || string.IsNullOrWhiteSpace(row.Value))
                return new StudioLocalizationConfig();

            return JsonSerializer.Deserialize<StudioLocalizationConfig>(row.Value, JsonOpts)
                ?? new StudioLocalizationConfig();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read Studio localization override from WebSettings; using defaults.");
            return _inMemoryLocalFallback ?? new StudioLocalizationConfig();
        }
    }

    private async Task SaveLocalConfigAsync(StudioLocalizationConfig config, string? actorUserId, CancellationToken ct)
    {
        _inMemoryLocalFallback = config;
        if (_scopeFactory is null) return;

        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetService<IWebSettingRepository>();
        if (repo is null) return;

        await repo.UpsertAsync(new WebSetting
        {
            Id = StudioLocalizationSettingKey,
            Value = JsonSerializer.Serialize(config, JsonOpts),
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = actorUserId,
        }, ct).ConfigureAwait(false);
    }

    private async Task<CentralSnapshot> GetSnapshotAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        if (_cached is not null && now < _cacheExpiresAtUtc)
            return _cached;

        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            now = DateTime.UtcNow;
            if (_cached is not null && now < _cacheExpiresAtUtc)
                return _cached;

            var snapshot = await LoadCentralSnapshotAsync(ct).ConfigureAwait(false);
            _cached = snapshot;
            _cacheExpiresAtUtc = now.AddSeconds(60);
            return snapshot;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<CentralSnapshot> LoadCentralSnapshotAsync(CancellationToken ct)
    {
        var defaultPolicy = new EffectiveLocalizationPolicyDto(
            SiteKey, "en", ["en", "hi"], true, true, false, "admin", false, true);

        if (string.IsNullOrWhiteSpace(_centralConnectionString))
        {
            return new CentralSnapshot(defaultPolicy, DefaultLocales(), new(StringComparer.OrdinalIgnoreCase), false, DateTime.UtcNow);
        }

        try
        {
            var client = Clients.GetOrAdd(_centralConnectionString, cs => new MongoClient(cs));
            var db = client.GetDatabase(_centralDbName);

            var websiteFilter = Builders<BsonDocument>.Filter.In("Key", [SiteKey, "animstudio"]);
            var websiteDoc = await db.GetCollection<BsonDocument>("websites")
                .Find(websiteFilter)
                .FirstOrDefaultAsync(ct)
                .ConfigureAwait(false);

            var centralPolicy = defaultPolicy;
            if (websiteDoc is not null)
            {
                var def = NormalizeLocale(GetString(websiteDoc, "DefaultLocale", "en"), "en");
                var enabled = ReadStringArray(websiteDoc, "EnabledLocales");
                centralPolicy = new EffectiveLocalizationPolicyDto(
                    SiteKey,
                    def,
                    NormalizeEnabledLocales(enabled, def),
                    GetBool(websiteDoc, "AllowVisitorLanguageSwitch", true),
                    GetBool(websiteDoc, "ShowLanguagePicker", true),
                    GetBool(websiteDoc, "ForceLocale", false),
                    "admin",
                    false,
                    true);
            }

            var localeDocs = await db.GetCollection<BsonDocument>("locales")
                .Find(Builders<BsonDocument>.Filter.Eq("IsEnabled", true))
                .ToListAsync(ct)
                .ConfigureAwait(false);

            var locales = localeDocs.Count > 0
                ? localeDocs.Select(d => new StudioLocaleDto(
                    NormalizeLocale(GetString(d, "Code", "en"), "en"),
                    GetString(d, "NativeName", "English"),
                    GetString(d, "EnglishName", "English"),
                    GetString(d, "Direction", "ltr"),
                    GetString(d, "Icon", ""),
                    false)).ToList()
                : DefaultLocales();

            var trDocs = await db.GetCollection<BsonDocument>("translations")
                .Find(Builders<BsonDocument>.Filter.In("Namespace", Namespaces))
                .ToListAsync(ct)
                .ConfigureAwait(false);

            var translations = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var doc in trDocs)
            {
                var key = GetString(doc, "Key");
                if (string.IsNullOrWhiteSpace(key)) continue;
                if (!doc.TryGetValue("Values", out var vals) || !vals.IsBsonDocument) continue;
                foreach (var el in vals.AsBsonDocument.Elements)
                {
                    var loc = NormalizeLocale(el.Name, string.Empty);
                    var text = el.Value.IsString ? el.Value.AsString : string.Empty;
                    if (string.IsNullOrWhiteSpace(loc) || string.IsNullOrWhiteSpace(text)) continue;
                    if (!translations.TryGetValue(loc, out var map))
                    {
                        map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                        translations[loc] = map;
                    }
                    map[key] = text;
                }
            }

            return new CentralSnapshot(centralPolicy, locales, translations, true, DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Central AdminDb localization lookup failed; using built-in bilingual fallback.");
            return new CentralSnapshot(defaultPolicy, DefaultLocales(), new(StringComparer.OrdinalIgnoreCase), false, DateTime.UtcNow);
        }
    }

    private static string GetString(BsonDocument doc, string field, string fallback = "") =>
        doc.TryGetValue(field, out var v) && v.IsString ? v.AsString : fallback;

    private static string? GetNullableString(BsonDocument? doc, string field) =>
        doc is not null && doc.TryGetValue(field, out var v) && v.IsString && !string.IsNullOrWhiteSpace(v.AsString)
            ? v.AsString
            : null;

    private static bool GetBool(BsonDocument doc, string field, bool fallback) =>
        doc.TryGetValue(field, out var v) && v.IsBoolean ? v.AsBoolean : fallback;

    private static int GetInt(BsonDocument doc, string field, int fallback) =>
        doc.TryGetValue(field, out var v) && v.IsInt32 ? v.AsInt32 : fallback;

    private static List<string> ReadStringArray(BsonDocument doc, string field)
    {
        if (!doc.TryGetValue(field, out var val) || !val.IsBsonArray) return [];
        return val.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
    }

    private static List<StudioLocaleDto> FilterLocales(
        IReadOnlyList<StudioLocaleDto> all,
        EffectiveLocalizationPolicyDto policy)
    {
        var enabled = policy.EnabledLocales.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var list = all.Where(l => enabled.Contains(l.Code)).ToList();
        if (list.Count == 0)
            list = DefaultLocales().Where(l => enabled.Contains(l.Code)).ToList();
        return list.Select(l => l with { IsDefault = string.Equals(l.Code, policy.DefaultLocale, StringComparison.OrdinalIgnoreCase) }).ToList();
    }

    private static void ApplyEntries(IDictionary<string, string> target, IReadOnlyDictionary<string, string> source)
    {
        foreach (var kv in source)
        {
            if (!string.IsNullOrWhiteSpace(kv.Value))
                target[kv.Key] = kv.Value;
        }
    }

    public static string NormalizeLocale(string? locale, string fallback = "en")
    {
        var raw = (locale ?? string.Empty).Trim().ToLowerInvariant();
        if (raw.StartsWith("hi", StringComparison.Ordinal)) return "hi";
        if (raw.StartsWith("en", StringComparison.Ordinal)) return "en";
        return string.IsNullOrWhiteSpace(raw) ? fallback : raw;
    }

    public static IReadOnlyList<string> NormalizeEnabledLocales(IEnumerable<string>? locales, string defaultLocale)
    {
        var list = new List<string>();
        if (locales is not null)
        {
            foreach (var raw in locales)
            {
                var norm = NormalizeLocale(raw, string.Empty);
                if (!string.IsNullOrWhiteSpace(norm) && !list.Contains(norm, StringComparer.OrdinalIgnoreCase))
                    list.Add(norm);
            }
        }
        if (list.Count == 0)
        {
            list.Add("en");
            list.Add("hi");
        }
        var def = NormalizeLocale(defaultLocale, "en");
        if (!list.Contains(def, StringComparer.OrdinalIgnoreCase))
            list.Insert(0, def);
        return list;
    }

    private static List<StudioLocaleDto> DefaultLocales() =>
    [
        new("en", "English", "English", "ltr", "🌐", true),
        new("hi", "हिन्दी", "Hindi", "ltr", "🇮🇳", false),
    ];

    private static Dictionary<string, string> BuiltInFallback(string locale) =>
        string.Equals(locale, "hi", StringComparison.OrdinalIgnoreCase)
            ? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["studio.nav.projects"] = "प्रोजेक्ट्स",
                ["studio.nav.story-agent"] = "स्टोरी एजेंट",
                ["studio.nav.shorts"] = "शॉर्ट्स",
                ["studio.nav.calendar"] = "कैलेंडर",
                ["studio.nav.effects"] = "इफेक्ट्स",
                ["studio.nav.clips"] = "वीडियो एडिटर",
                ["studio.nav.tools"] = "मीडिया स्टूडियो",
                ["studio.nav.release"] = "म्यूजिक रिलीज़",
                ["studio.nav.songs"] = "गीत स्टूडियो",
                ["studio.nav.youtube"] = "यूट्यूब",
                ["studio.nav.queue"] = "पब्लिशिंग",
                ["studio.nav.automation"] = "ऑटो पोस्ट",
                ["studio.nav.details"] = "वीडियो विवरण",
                ["studio.nav.live"] = "गो लाइव",
                ["studio.nav.camera"] = "कैमरा स्टूडियो",
                ["studio.nav.motion-copy"] = "मोशन कॉपी",
                ["studio.nav.animate"] = "एनिमेट इमेज",
                ["studio.nav.collab"] = "कोलैब",
                ["studio.nav.logs"] = "लॉग्स",
                ["studio.nav.admin"] = "सेटिंग्स",
                ["studio.nav.settings"] = "सेटिंग्स",
                ["studio.ui.signIn"] = "साइन इन",
                ["studio.ui.signOut"] = "साइन आउट",
                ["studio.ui.credits"] = "क्रेडिट्स",
                ["studio.ui.activity"] = "गतिविधि",
                ["studio.ui.themeLight"] = "लाइट",
                ["studio.ui.themeDark"] = "डार्क",
                ["studio.language.label"] = "स्टूडियो UI भाषा",
                ["studio.language.uiOnlyNote"] = "केवल स्टूडियो UI लेबल — वीडियो व गीत की ऑडियो भाषा प्रत्येक जॉब से अलग तय होती है",
                ["ecosystem.language.label"] = "भाषा",
            }
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["studio.nav.projects"] = "Projects",
                ["studio.nav.story-agent"] = "Story Agent",
                ["studio.nav.shorts"] = "Shorts",
                ["studio.nav.calendar"] = "Calendar",
                ["studio.nav.effects"] = "Effects",
                ["studio.nav.clips"] = "Video Editor",
                ["studio.nav.tools"] = "Media Studio",
                ["studio.nav.release"] = "Music Release",
                ["studio.nav.songs"] = "Songs",
                ["studio.nav.youtube"] = "YouTube",
                ["studio.nav.queue"] = "Publishing",
                ["studio.nav.automation"] = "Auto Post",
                ["studio.nav.details"] = "Video Details",
                ["studio.nav.live"] = "Go Live",
                ["studio.nav.camera"] = "Camera Studio",
                ["studio.nav.motion-copy"] = "Motion Copy",
                ["studio.nav.animate"] = "Animate Image",
                ["studio.nav.collab"] = "Collab",
                ["studio.nav.logs"] = "Logs",
                ["studio.nav.admin"] = "Settings",
                ["studio.nav.settings"] = "Settings",
                ["studio.ui.signIn"] = "Sign in",
                ["studio.ui.signOut"] = "Sign out",
                ["studio.ui.credits"] = "Credits",
                ["studio.ui.activity"] = "Activity",
                ["studio.ui.themeLight"] = "Light",
                ["studio.ui.themeDark"] = "Dark",
                ["studio.language.label"] = "Studio UI Language",
                ["studio.language.uiOnlyNote"] = "UI labels only — video & song audio language is set per job",
                ["ecosystem.language.label"] = "Language",
            };

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();

    private sealed record CentralSnapshot(
        EffectiveLocalizationPolicyDto CentralPolicy,
        IReadOnlyList<StudioLocaleDto> Locales,
        Dictionary<string, Dictionary<string, string>> TranslationsByLocale,
        bool LoadedFromCentralMongo,
        DateTime LoadedAtUtc);
}
