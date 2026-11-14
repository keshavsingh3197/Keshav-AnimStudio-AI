namespace AnimStudio.Application.Automation;

public sealed record EcosystemPanchangSignal(
    string DateKey,
    string Location,
    string Tithi,
    string? TithiEndTime,
    string Nakshatra,
    string? NakshatraEndTime,
    string Yoga,
    string Karana,
    string Vaara,
    string? Paksha,
    string? MonthPurnimanta,
    string? VikramSamvat,
    string Sunrise,
    string Sunset,
    string AbhijitMuhurat,
    string BrahmaMuhurat,
    string AmritKaal,
    string RahuKaal,
    string? DailySanskritSutra,
    string? DailySutraMeaning);

public sealed record EcosystemFestivalSignal(
    string Id,
    string NameHindi,
    string NameEnglish,
    string DateKey,
    string? Tithi,
    string? MonthVedic,
    string Description,
    string? RitualsAndPujaVidhi,
    string? FastingRules,
    bool IsMajorFestival,
    string? Category);

public sealed record EcosystemDailyKathaSignal(
    string? Id,
    string Title,
    string DeityOrSage,
    string StorySummary,
    string? MoralTeaching,
    string? SanskritMantra);

public sealed record EcosystemHistoricalSignal(
    string? Id,
    string DateKey,
    int Year,
    string Title,
    string Category,
    string Description,
    string? CulturalSignificance);

public sealed record EcosystemCompetitionSignal(
    string Id,
    string Title,
    string Category,
    string Status,
    string? PrizeOrHighlight,
    string? DeadlineLabel,
    string? WebUrl);

public sealed record EcosystemFunnelCampaignSignal(
    string Id,
    string Slug,
    string Title,
    string SourcePlatform,
    string DestinationUrl,
    string? CallToActionText);

public sealed record EcosystemSignalsSnapshot(
    string DateKey,
    string Location,
    EcosystemPanchangSignal? Panchang,
    IReadOnlyList<EcosystemFestivalSignal> UpcomingFestivals,
    EcosystemDailyKathaSignal? DailyKatha,
    IReadOnlyList<EcosystemHistoricalSignal> HistoricalIncidents,
    IReadOnlyList<EcosystemCompetitionSignal> Competitions,
    IReadOnlyList<EcosystemFunnelCampaignSignal> FunnelCampaigns,
    IReadOnlyList<string> Warnings,
    DateTimeOffset FetchedAtUtc);

public sealed class EcosystemServiceOptions
{
    public const string Section = "Ecosystem";
    public string? AdminConfigUrl { get; set; }
    public string? PanchangApiBaseUrl { get; set; }
    public string? SocialApiBaseUrl { get; set; }
    public string? PratiyogitaApiBaseUrl { get; set; }
    public string? SyncKey { get; set; }
}

public interface IEcosystemSignalsClient
{
    Task<EcosystemSignalsSnapshot> FetchAsync(
        string dateKey,
        string? location = null,
        string? panchangOverrideUrl = null,
        string? socialOverrideUrl = null,
        string? pratiyogitaOverrideUrl = null,
        CancellationToken ct = default);
}
