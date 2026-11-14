using System.Text.Json;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Reads live Panchang, Hindu Festivals, Daily Katha, Aaj Ka Itihaas, Pratiyogita competitions,
/// and SocialPulse traffic funnels using dynamic URLs configured in workspace/ecosystem config
/// or appsettings — gracefully isolating upstream timeouts so one slow microservice never blocks the rest.
/// </summary>
public sealed class EcosystemSignalsClient(
    IHttpClientFactory httpFactory,
    IOptionsMonitor<EcosystemServiceOptions> serviceOptions,
    IEcosystemConfigProvider ecosystemProvider,
    ILogger<EcosystemSignalsClient> logger) : IEcosystemSignalsClient
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly TimeSpan UpstreamTimeout = TimeSpan.FromSeconds(18);

    public async Task<EcosystemSignalsSnapshot> FetchAsync(
        string dateKey,
        string? location = null,
        string? panchangOverrideUrl = null,
        string? socialOverrideUrl = null,
        string? pratiyogitaOverrideUrl = null,
        CancellationToken ct = default)
    {
        var effectiveDate = string.IsNullOrWhiteSpace(dateKey)
            ? DateTime.UtcNow.ToString("yyyy-MM-dd")
            : dateKey.Trim();
        var effectiveLoc = string.IsNullOrWhiteSpace(location) ? "New Delhi, India" : location.Trim();

        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var opts = serviceOptions.CurrentValue;

        var panchangBase = ResolveSafeBaseUrl(panchangOverrideUrl, opts.PanchangApiBaseUrl, ecosystem, "panchang", "https://keshav-hindu-panchang.onrender.com");
        var socialBase = ResolveSafeBaseUrl(socialOverrideUrl, opts.SocialApiBaseUrl, ecosystem, "social", "https://keshav-social-analytics.onrender.com");
        var pratiyogitaBase = ResolveSafeBaseUrl(pratiyogitaOverrideUrl, opts.PratiyogitaApiBaseUrl, ecosystem, "pratiyogita", "https://pratiyogita.onrender.com");

        var warnings = new List<string>();
        var client = httpFactory.CreateClient();
        client.Timeout = UpstreamTimeout;

        var panchangTask = SafeGetJsonAsync<EcosystemPanchangSignal>(
            client,
            $"{panchangBase}/api/panchang/daily?date={Uri.EscapeDataString(effectiveDate)}&location={Uri.EscapeDataString(effectiveLoc)}",
            "Hindu Panchang daily feed",
            warnings,
            ct);

        var festivalsTask = SafeGetJsonAsync<List<FestivalPayload>>(
            client,
            $"{panchangBase}/api/festivals/upcoming",
            "Hindu Panchang festivals feed",
            warnings,
            ct);

        var kathaTask = SafeGetJsonAsync<EcosystemDailyKathaSignal>(
            client,
            $"{panchangBase}/api/culturalhistory/daily-katha?date={Uri.EscapeDataString(effectiveDate)}",
            "Hindu Panchang daily katha feed",
            warnings,
            ct);

        var historyTask = SafeGetJsonAsync<List<HistoricalPayload>>(
            client,
            $"{panchangBase}/api/culturalhistory/aaj-ka-itihaas?date={Uri.EscapeDataString(effectiveDate)}",
            "Aaj Ka Itihaas history feed",
            warnings,
            ct);

        var competitionsTask = SafeGetJsonAsync<List<CompetitionPayload>>(
            client,
            $"{pratiyogitaBase}/api/competitions",
            "Pratiyogita competitions feed",
            warnings,
            ct);

        var funnelsTask = SafeGetJsonAsync<List<FunnelPayload>>(
            client,
            $"{socialBase}/api/trafficfunnel/campaigns",
            "SocialPulse traffic funnels",
            warnings,
            ct);

        await Task.WhenAll(panchangTask, festivalsTask, kathaTask, historyTask, competitionsTask, funnelsTask).ConfigureAwait(false);

        var festivals = (festivalsTask.Result ?? [])
            .Select(f => new EcosystemFestivalSignal(
                f.Id ?? f.NameEnglish ?? f.Date ?? Guid.NewGuid().ToString("N"),
                f.NameHindi ?? f.NameEnglish ?? "पर्व",
                f.NameEnglish ?? f.NameHindi ?? "Festival",
                NormalizeDateKey(f.Date, effectiveDate),
                f.Tithi,
                f.MonthVedic,
                f.Description ?? string.Empty,
                f.RitualsAndPujaVidhi,
                f.FastingRules,
                f.IsMajorFestival,
                f.Category))
            .ToList();

        var incidents = (historyTask.Result ?? [])
            .Select(h => new EcosystemHistoricalSignal(
                h.Id,
                string.IsNullOrWhiteSpace(h.DateKey) ? effectiveDate : h.DateKey,
                h.Year,
                h.Title ?? string.Empty,
                string.IsNullOrWhiteSpace(h.Category) ? "History" : h.Category,
                h.Description ?? string.Empty,
                h.CulturalSignificance))
            .Where(h => !string.IsNullOrWhiteSpace(h.Title))
            .ToList();

        var pratiyogitaWebUrl = ecosystem.Websites
            .FirstOrDefault(w => string.Equals(w.Key, "pratiyogita", StringComparison.OrdinalIgnoreCase))?.Url
            ?? "https://pratiyogita.keshavsingh.in";

        var competitions = (competitionsTask.Result ?? [])
            .Where(c => !string.IsNullOrWhiteSpace(c.Title))
            .OrderByDescending(c => string.Equals(c.Status, "Live", StringComparison.OrdinalIgnoreCase))
            .Take(5)
            .Select(c => new EcosystemCompetitionSignal(
                c.Id ?? c.Title!,
                c.Title!,
                c.Category ?? "Competition",
                c.Status ?? "Open",
                c.Description ?? c.PrizePool,
                c.RegistrationDeadline?.ToString("yyyy-MM-dd"),
                pratiyogitaWebUrl))
            .ToList();

        var funnels = (funnelsTask.Result ?? [])
            .Where(f => !string.IsNullOrWhiteSpace(f.Slug) && !string.IsNullOrWhiteSpace(f.DestinationUrl))
            .Select(f => new EcosystemFunnelCampaignSignal(
                f.Id ?? f.Slug!,
                f.Slug!,
                f.Title ?? f.Slug!,
                f.SourcePlatform ?? "YouTube",
                f.DestinationUrl!,
                f.CallToActionText))
            .ToList();

        return new EcosystemSignalsSnapshot(
            effectiveDate,
            effectiveLoc,
            panchangTask.Result,
            festivals,
            kathaTask.Result,
            incidents,
            competitions,
            funnels,
            warnings,
            DateTimeOffset.UtcNow);
    }

    private async Task<T?> SafeGetJsonAsync<T>(
        HttpClient client,
        string url,
        string label,
        List<string> warnings,
        CancellationToken ct) where T : class
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return null;

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                warnings.Add($"{label} answered {(int)res.StatusCode}");
                return null;
            }

            await using var stream = await res.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            return await JsonSerializer.DeserializeAsync<T>(stream, JsonOpts, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not fetch {Label} from {Host}", label, uri.Host);
            warnings.Add($"{label} is warming up or unreachable right now.");
            return null;
        }
    }

    private static string ResolveSafeBaseUrl(
        string? workspaceOverride,
        string? configValue,
        StudioEcosystemConfig ecosystem,
        string websiteKey,
        string fallbackRenderUrl)
    {
        foreach (var candidate in new[] { workspaceOverride, configValue, fallbackRenderUrl })
        {
            if (IsSafeEndpoint(candidate, out var clean))
                return clean!;
        }

        var site = ecosystem.Websites.FirstOrDefault(w => string.Equals(w.Key, websiteKey, StringComparison.OrdinalIgnoreCase))?.Url;
        if (IsSafeEndpoint(site, out var siteClean))
            return siteClean!;

        return fallbackRenderUrl;
    }

    public static bool IsSafeEndpoint(string? url, out string? normalized)
    {
        normalized = null;
        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)) return false;
        if (uri.IsLoopback)
        {
            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
                return false;
        }
        else if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        normalized = uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        return true;
    }

    private static string NormalizeDateKey(string? rawDate, string fallbackDateKey)
    {
        if (string.IsNullOrWhiteSpace(rawDate)) return fallbackDateKey;
        if (DateTimeOffset.TryParse(rawDate, out var dto))
            return dto.ToString("yyyy-MM-dd");
        return rawDate.Length >= 10 ? rawDate[..10] : fallbackDateKey;
    }

    private sealed record FestivalPayload(
        string? Id,
        string? NameHindi,
        string? NameEnglish,
        string? Date,
        string? Tithi,
        string? MonthVedic,
        string? Description,
        string? RitualsAndPujaVidhi,
        string? FastingRules,
        bool IsMajorFestival,
        string? Category);

    private sealed record HistoricalPayload(
        string? Id,
        string? DateKey,
        int Year,
        string? Title,
        string? Category,
        string? Description,
        string? CulturalSignificance);

    private sealed record CompetitionPayload(
        string? Id,
        string? Title,
        string? Category,
        string? Status,
        string? Description,
        string? PrizePool,
        DateTime? RegistrationDeadline);

    private sealed record FunnelPayload(
        string? Id,
        string? Slug,
        string? Title,
        string? SourcePlatform,
        string? DestinationUrl,
        string? CallToActionText);
}
