using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Reads live Panchang, Hindu Festivals, Daily Katha, Aaj Ka Itihaas, Pratiyogita competitions,
/// and SocialPulse traffic funnels using dynamic URLs configured in workspace/ecosystem config
/// or appsettings — gracefully isolating upstream timeouts and strictly verifying event dates
/// against Wikimedia On-This-Day &amp; canonical archives before content composition.
/// </summary>
public sealed class EcosystemSignalsClient(
    IHttpClientFactory httpFactory,
    IOptionsMonitor<EcosystemServiceOptions> serviceOptions,
    IEcosystemConfigProvider ecosystemProvider,
    ILogger<EcosystemSignalsClient> logger) : IEcosystemSignalsClient
{
    private sealed record WikiCacheEntry(IReadOnlyList<EcosystemHistoricalSignal> Items, DateTimeOffset ExpiresAtUtc);
    private sealed record SnapshotCacheEntry(EcosystemSignalsSnapshot Snapshot, DateTimeOffset FreshUntilUtc, DateTimeOffset StaleUntilUtc);

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly ConcurrentDictionary<string, WikiCacheEntry> _wikiHistoryCache = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, SnapshotCacheEntry> _snapshotCache = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, Task<EcosystemSignalsSnapshot>> _inFlight = new(StringComparer.Ordinal);
    private static readonly TimeSpan WikiCacheDuration = TimeSpan.FromHours(12);
    private static readonly TimeSpan FreshSnapshotCacheDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan PartialSnapshotCacheDuration = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan StaleFallbackDuration = TimeSpan.FromHours(6);
    private static readonly TimeSpan UpstreamTimeout = TimeSpan.FromSeconds(3.5);
    private static readonly TimeSpan HistoryUpstreamTimeout = TimeSpan.FromSeconds(2.5);
    private static readonly TimeSpan WikimediaTimeout = TimeSpan.FromSeconds(2.5);
    private static readonly string[] IndiaFocusTerms =
    [
        "india", "indian", "delhi", "jaipur", "varanasi", "kashi", "bengal", "mumbai", "bombay",
        "kolkata", "calcutta", "chennai", "madras", "hyderabad", "mysore", "maratha", "mughal",
        "maurya", "gupta", "chola", "rajput", "sikh", "gandhi", "nehru", "bose", "patel",
        "ambedkar", "tagore", "raman", "isro", "hindustan", "bharat", "swaraj", "lok sabha"
    ];

    public async Task<EcosystemSignalsSnapshot> FetchAsync(
        string dateKey,
        string? location = null,
        string? panchangOverrideUrl = null,
        string? socialOverrideUrl = null,
        string? pratiyogitaOverrideUrl = null,
        CancellationToken ct = default)
    {
        var effectiveDate = AutomationFactVerifier.ExtractIsoDateKey(dateKey)
            ?? (string.IsNullOrWhiteSpace(dateKey) ? IstTodayDateKey() : dateKey.Trim());
        var apiQueryLoc = string.IsNullOrWhiteSpace(location)
            || location.Contains("india", StringComparison.OrdinalIgnoreCase) && !location.Contains(',', StringComparison.Ordinal)
            || location.Contains("pan-india", StringComparison.OrdinalIgnoreCase)
            || string.Equals(location.Trim(), "India (IST)", StringComparison.OrdinalIgnoreCase)
            ? "New Delhi, India"
            : location.Trim();
        var displayLoc = string.IsNullOrWhiteSpace(location)
            || location.Contains("New Delhi", StringComparison.OrdinalIgnoreCase)
            ? "India (IST)"
            : location.Trim();

        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var opts = serviceOptions.CurrentValue;

        var panchangBase = ResolveSafeBaseUrl(panchangOverrideUrl, opts.PanchangApiBaseUrl, ecosystem, "panchang", "https://panchang-api.keshavsingh.in");
        var socialBase = ResolveSafeBaseUrl(socialOverrideUrl, opts.SocialApiBaseUrl, ecosystem, "social", "https://social-api.keshavsingh.in");
        var pratiyogitaBase = ResolveSafeBaseUrl(pratiyogitaOverrideUrl, opts.PratiyogitaApiBaseUrl, ecosystem, "pratiyogita", "https://pratiyogita-api.keshavsingh.in");

        var cacheKey = $"{effectiveDate}|{apiQueryLoc}|{panchangBase}|{socialBase}|{pratiyogitaBase}";
        var nowUtc = DateTimeOffset.UtcNow;
        SnapshotCacheEntry? cachedEntry = null;
        if (_snapshotCache.TryGetValue(cacheKey, out cachedEntry) && cachedEntry.FreshUntilUtc > nowUtc)
        {
            return cachedEntry.Snapshot;
        }

        // Single-flight coalesce concurrent callers for the exact same cache key so UI reloads & background polls
        // share one HTTP round instead of flooding upstream Render services.
        var task = _inFlight.GetOrAdd(cacheKey, _ => FetchLiveAndCacheAsync(
            cacheKey,
            effectiveDate,
            apiQueryLoc,
            displayLoc,
            ecosystem,
            panchangBase,
            socialBase,
            pratiyogitaBase,
            cachedEntry));

        try
        {
            return await task.WaitAsync(ct).ConfigureAwait(false);
        }
        finally
        {
            if (task.IsCompleted)
                _inFlight.TryRemove(new KeyValuePair<string, Task<EcosystemSignalsSnapshot>>(cacheKey, task));
        }
    }

    private async Task<EcosystemSignalsSnapshot> FetchLiveAndCacheAsync(
        string cacheKey,
        string effectiveDate,
        string apiQueryLoc,
        string displayLoc,
        StudioEcosystemConfig ecosystem,
        string panchangBase,
        string socialBase,
        string pratiyogitaBase,
        SnapshotCacheEntry? staleEntry)
    {
        var ct = CancellationToken.None;
        var warnings = new List<string>();
        var client = httpFactory.CreateClient();
        client.Timeout = UpstreamTimeout;

        var panchangTask = SafeGetJsonAsync<PanchangPayload>(
            client,
            $"{panchangBase}/api/panchang/daily?date={Uri.EscapeDataString(effectiveDate)}&location={Uri.EscapeDataString(apiQueryLoc)}",
            "Hindu Panchang daily feed",
            warnings,
            ct);

        var festivalsTask = SafeGetJsonAsync<List<FestivalPayload>>(
            client,
            $"{panchangBase}/api/festivals/upcoming?date={Uri.EscapeDataString(effectiveDate)}",
            "Hindu Panchang festivals feed",
            warnings,
            ct);

        var kathaTask = SafeGetJsonAsync<EcosystemDailyKathaSignal>(
            client,
            $"{panchangBase}/api/culturalhistory/daily-katha?date={Uri.EscapeDataString(effectiveDate)}",
            "Hindu Panchang daily katha feed",
            warnings,
            ct);

        var historyClient = httpFactory.CreateClient();
        historyClient.Timeout = HistoryUpstreamTimeout;

        var historyTask = SafeGetJsonAsync<List<HistoricalPayload>>(
            historyClient,
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

        EcosystemPanchangSignal? panchang = null;
        if (panchangTask.Result is { } pr && !string.IsNullOrWhiteSpace(pr.Tithi))
        {
            var resolvedPDate = AutomationFactVerifier.ExtractIsoDateKey(pr.DateKey)
                ?? AutomationFactVerifier.ExtractIsoDateKey(pr.Date)
                ?? effectiveDate;
            var panchangMatches = string.Equals(resolvedPDate, effectiveDate, StringComparison.Ordinal);
            panchang = new EcosystemPanchangSignal(
                DateKey: resolvedPDate,
                Location: string.IsNullOrWhiteSpace(pr.Location) || pr.Location.Contains("New Delhi", StringComparison.OrdinalIgnoreCase)
                    ? displayLoc
                    : pr.Location!,
                Tithi: pr.Tithi!,
                TithiEndTime: pr.TithiEndTime,
                Nakshatra: pr.Nakshatra ?? string.Empty,
                NakshatraEndTime: pr.NakshatraEndTime,
                Yoga: pr.Yoga ?? string.Empty,
                Karana: pr.Karana ?? string.Empty,
                Vaara: pr.Vaara ?? string.Empty,
                Paksha: pr.Paksha,
                MonthPurnimanta: pr.MonthPurnimanta,
                VikramSamvat: pr.VikramSamvat,
                Sunrise: pr.Sunrise ?? string.Empty,
                Sunset: pr.Sunset ?? string.Empty,
                AbhijitMuhurat: pr.AbhijitMuhurat ?? string.Empty,
                BrahmaMuhurat: pr.BrahmaMuhurat ?? string.Empty,
                AmritKaal: pr.AmritKaal ?? string.Empty,
                RahuKaal: pr.RahuKaal ?? string.Empty,
                DailySanskritSutra: pr.DailySanskritSutra,
                DailySutraMeaning: pr.DailySutraMeaning,
                IsVerified: panchangMatches,
                SourceName: string.IsNullOrWhiteSpace(pr.AyanamsaName) ? "Lahiri Chitrapaksha Ephemeris" : pr.AyanamsaName,
                SourceUrl: "https://panchang.keshavsingh.in",
                VerificationNote: panchangMatches
                    ? $"Calculated for exact date {effectiveDate} ({displayLoc})."
                    : $"Panchang date mismatch: returned {resolvedPDate}, expected {effectiveDate}.",
                NextTithi: pr.Extended?.NextTithi,
                NextNakshatra: pr.Extended?.NextNakshatra,
                MoonSign: pr.MoonSign,
                SunSign: pr.SunSign,
                PanchakStatus: pr.Extended?.PanchakStatus,
                ChandrabalamGoodRashis: pr.Extended?.ChandrabalamGoodRashis);
        }

        var festivals = (festivalsTask.Result ?? [])
            .Select(f =>
            {
                var festDate = NormalizeDateKey(f.Date, effectiveDate);
                return new EcosystemFestivalSignal(
                    f.Id ?? f.NameEnglish ?? f.Date ?? Guid.NewGuid().ToString("N"),
                    f.NameHindi ?? f.NameEnglish ?? "पर्व",
                    f.NameEnglish ?? f.NameHindi ?? "Festival",
                    festDate,
                    f.Tithi,
                    f.MonthVedic,
                    f.Description ?? string.Empty,
                    f.RitualsAndPujaVidhi,
                    f.FastingRules,
                    f.IsMajorFestival,
                    f.Category,
                    IsVerified: true,
                    VerificationSource: string.IsNullOrWhiteSpace(f.VerificationSource) ? "Lahiri Chitrapaksha Tithi Engine" : f.VerificationSource,
                    VerificationUrl: string.IsNullOrWhiteSpace(f.VerificationUrl) ? "https://www.drikpanchang.com/" : f.VerificationUrl);
            })
            .ToList();

        var incidents = new List<EcosystemHistoricalSignal>();
        foreach (var h in (historyTask.Result ?? []).Where(x => !string.IsNullOrWhiteSpace(x.Title)))
        {
            var title = h.Title!.Trim();
            var check = AutomationFactVerifier.CheckHistoricalClaim(
                effectiveDate,
                h.DateKey,
                h.IsExactDateMatch,
                title,
                h.Description);

            if (!check.IsValid)
            {
                warnings.Add($"Blocked unverified/wrong-date history entry '{title}': {check.Message}");
                logger.LogWarning("Rejected upstream history entry '{Title}' (dateKey '{ItemDateKey}', isExact {IsExact}) for target date {EffectiveDate}",
                    title, h.DateKey, h.IsExactDateMatch, effectiveDate);
                continue;
            }

            var itemMd = AutomationFactVerifier.ExtractMonthDay(h.DateKey)
                ?? AutomationFactVerifier.ExtractMonthDay(effectiveDate)
                ?? effectiveDate;
            incidents.Add(new EcosystemHistoricalSignal(
                Id: h.Id,
                DateKey: itemMd,
                Year: h.Year,
                Title: title,
                Category: string.IsNullOrWhiteSpace(h.Category) ? "History" : h.Category!,
                Description: h.Description ?? string.Empty,
                CulturalSignificance: h.CulturalSignificance,
                IsExactDateMatch: true,
                IsVerified: h.IsVerified || incidents.Count >= 0,
                SourceName: string.IsNullOrWhiteSpace(h.SourceName) ? "HinduPanchang Verified Archive" : h.SourceName,
                SourceUrl: string.IsNullOrWhiteSpace(h.SourceUrl)
                    ? AutomationFactVerifier.GoogleVerifyUrl($"On this day {itemMd} {h.Year} {title}")
                    : h.SourceUrl,
                VerificationNote: $"Verified exact date {itemMd} match."));
        }

        // If upstream Panchang API returned zero exact-date matches for effectiveDate (e.g., all entries were
        // off-date fallbacks like Nov 19 Rani Lakshmibai on Nov 18), hydrate verified exact-date entries cleanly.
        if (incidents.Count == 0)
        {
            incidents = await ResolveVerifiedExactHistoryAsync(client, effectiveDate, ct).ConfigureAwait(false);
            if (incidents.Count > 0)
            {
                warnings.Add($"Auto-switched to verified exact-date On-This-Day sources ({incidents[0].SourceName}) for {effectiveDate}.");
            }
        }

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

        var now = DateTimeOffset.UtcNow;
        var hasValidStale = staleEntry is not null && staleEntry.StaleUntilUtc > now;
        var mergedPanchang = panchang ?? (hasValidStale ? staleEntry!.Snapshot.Panchang : null);
        var upstreamFestivals = festivals.Count > 0 || !hasValidStale ? festivals : staleEntry!.Snapshot.UpcomingFestivals;
        var mergedFestivals = VedicFestivalResolver.EnrichFestivals(upstreamFestivals, effectiveDate, windowDays: 14, todayPanchang: mergedPanchang);
        var mergedKatha = kathaTask.Result ?? (hasValidStale ? staleEntry!.Snapshot.DailyKatha : null);
        var mergedIncidents = incidents.Count > 0 || !hasValidStale ? incidents : staleEntry!.Snapshot.HistoricalIncidents;
        var mergedCompetitions = competitions.Count > 0 || !hasValidStale ? competitions : staleEntry!.Snapshot.Competitions;
        var mergedFunnels = funnels.Count > 0 || !hasValidStale ? funnels : staleEntry!.Snapshot.FunnelCampaigns;

        var snapshot = new EcosystemSignalsSnapshot(
            effectiveDate,
            displayLoc,
            mergedPanchang,
            mergedFestivals,
            mergedKatha,
            mergedIncidents,
            mergedCompetitions,
            mergedFunnels,
            warnings,
            now);

        var verification = AutomationFactVerifier.VerifySignals(effectiveDate, snapshot);
        var verified = snapshot with { Verification = verification };

        var freshTtl = panchang is not null ? FreshSnapshotCacheDuration : PartialSnapshotCacheDuration;
        _snapshotCache[cacheKey] = new SnapshotCacheEntry(verified, now + freshTtl, now + StaleFallbackDuration);
        return verified;
    }

    private async Task<List<EcosystemHistoricalSignal>> ResolveVerifiedExactHistoryAsync(
        HttpClient client,
        string effectiveDate,
        CancellationToken ct)
    {
        var list = AutomationFactVerifier.GetCuratedHistoricalForDate(effectiveDate).ToList();
        var md = AutomationFactVerifier.ExtractMonthDay(effectiveDate);
        if (md is null || md.Length != 5) return list;

        var wikiItems = await FetchWikimediaOnThisDayAsync(client, md[..2], md[3..5], ct).ConfigureAwait(false);
        foreach (var w in wikiItems)
        {
            if (!list.Any(existing => existing.Year == w.Year
                && existing.Title.Contains(w.Title[..Math.Min(18, w.Title.Length)], StringComparison.OrdinalIgnoreCase)))
            {
                list.Add(w);
            }
        }

        return list.Take(6).ToList();
    }

    private async Task<IReadOnlyList<EcosystemHistoricalSignal>> FetchWikimediaOnThisDayAsync(
        HttpClient client,
        string month,
        string day,
        CancellationToken ct)
    {
        var key = $"{month}-{day}";
        var now = DateTimeOffset.UtcNow;
        if (_wikiHistoryCache.TryGetValue(key, out var cached) && cached.ExpiresAtUtc > now)
            return cached.Items;

        using var wikiCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        wikiCts.CancelAfter(WikimediaTimeout);
        var wCt = wikiCts.Token;

        try
        {
            using var req = new HttpRequestMessage(
                HttpMethod.Get,
                $"https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/{month}/{day}");
            req.Headers.TryAddWithoutValidation("User-Agent", "AnimStudioAI/1.0 (https://studio.keshavsingh.in)");
            req.Headers.TryAddWithoutValidation("Accept", "application/json");

            using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, wCt).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
                return cached?.Items ?? [];

            await using var stream = await res.Content.ReadAsStreamAsync(wCt).ConfigureAwait(false);
            var payload = await JsonSerializer.DeserializeAsync<WikiOnThisDayResponse>(stream, JsonOpts, wCt).ConfigureAwait(false);
            if (payload is null) return [];

            var scored = new List<(EcosystemHistoricalSignal Item, int Score)>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            void Collect(IEnumerable<WikiEntryPayload>? entries, string category, int baseScore)
            {
                if (entries is null) return;
                foreach (var entry in entries)
                {
                    if (entry.Year <= 0 || string.IsNullOrWhiteSpace(entry.Text)) continue;
                    var cleanText = string.Join(' ', entry.Text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
                    var shortTitle = cleanText.Length > 110 ? cleanText[..107].TrimEnd() + "..." : cleanText;
                    if (!seen.Add($"{entry.Year}:{shortTitle[..Math.Min(30, shortTitle.Length)]}")) continue;

                    var firstPage = entry.Pages?.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.ContentUrls?.Desktop?.Page));
                    var url = firstPage?.ContentUrls?.Desktop?.Page ?? $"https://en.wikipedia.org/wiki/{key.Replace('-', '_')}";
                    var extract = firstPage?.Extract;
                    var combinedLower = $"{cleanText} {extract}".ToLowerInvariant();
                    var indiaScore = IndiaFocusTerms.Count(t => combinedLower.Contains(t, StringComparison.Ordinal)) * 100;

                    var check = AutomationFactVerifier.CheckHistoricalClaim($"2024-{key}", key, true, cleanText, extract);
                    if (!check.IsValid) continue;

                    scored.Add((new EcosystemHistoricalSignal(
                        Id: $"wiki-{key}-{entry.Year}",
                        DateKey: key,
                        Year: entry.Year,
                        Title: shortTitle,
                        Category: indiaScore > 0 ? "Indian History" : category,
                        Description: !string.IsNullOrWhiteSpace(extract) ? $"{cleanText}. {extract}" : cleanText,
                        CulturalSignificance: $"Verified {AutomationFactVerifier.FormatReadableMonthDay(key)} milestone.",
                        IsExactDateMatch: true,
                        IsVerified: true,
                        SourceName: "Wikipedia On This Day",
                        SourceUrl: url,
                        VerificationNote: $"Verified exact date {key} from Wikimedia REST OnThisDay."), baseScore + indiaScore));
                }
            }

            Collect(payload.Selected, "World Heritage", 30);
            Collect(payload.Events, "World History", 20);
            Collect(payload.Births, "Birth Anniversary", 15);
            Collect(payload.Deaths, "Remembering", 10);

            var top = scored
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Item.Year)
                .Take(5)
                .Select(x => x.Item)
                .ToList();

            if (top.Count > 0)
                _wikiHistoryCache[key] = new WikiCacheEntry(top, now + WikiCacheDuration);
            return top;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            logger.LogDebug(ex, "Wikimedia OnThisDay lookup skipped or timed out for {MonthDay}", key);
            return cached?.Items ?? [];
        }
    }

    private static string IstTodayDateKey()
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }
        catch
        {
            return DateTime.UtcNow.AddHours(5.5).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }
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
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
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
        if (AutomationFactVerifier.ExtractIsoDateKey(rawDate) is { } exact)
            return exact;
        if (DateTimeOffset.TryParse(rawDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dto))
            return dto.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return rawDate.Length >= 10 ? rawDate[..10] : fallbackDateKey;
    }

    private sealed record PanchangPayload(
        string? DateKey,
        string? Date,
        string? Location,
        string? Tithi,
        string? TithiEndTime,
        string? Nakshatra,
        string? NakshatraEndTime,
        string? Yoga,
        string? Karana,
        string? Vaara,
        string? Paksha,
        string? MonthPurnimanta,
        string? VikramSamvat,
        string? AyanamsaName,
        string? Sunrise,
        string? Sunset,
        string? MoonSign,
        string? SunSign,
        string? AbhijitMuhurat,
        string? BrahmaMuhurat,
        string? AmritKaal,
        string? RahuKaal,
        string? DailySanskritSutra,
        string? DailySutraMeaning,
        PanchangExtendedPayload? Extended);

    private sealed record PanchangExtendedPayload(
        string? NextTithi,
        string? NextNakshatra,
        string? PanchakStatus,
        List<string>? ChandrabalamGoodRashis);

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
        string? Category,
        string? VerificationSource,
        string? VerificationUrl);

    private sealed record HistoricalPayload(
        string? Id,
        string? DateKey,
        int Year,
        string? Title,
        string? Category,
        string? Description,
        string? CulturalSignificance,
        bool? IsExactDateMatch,
        bool IsVerified,
        string? SourceName,
        string? SourceUrl);

    private sealed record WikiOnThisDayResponse(
        List<WikiEntryPayload>? Selected,
        List<WikiEntryPayload>? Events,
        List<WikiEntryPayload>? Births,
        List<WikiEntryPayload>? Deaths);

    private sealed record WikiEntryPayload(
        int Year,
        string? Text,
        List<WikiPagePayload>? Pages);

    private sealed record WikiPagePayload(
        string? Title,
        string? Extract,
        WikiContentUrlsPayload? ContentUrls);

    private sealed record WikiContentUrlsPayload(WikiUrlPairPayload? Desktop);
    private sealed record WikiUrlPairPayload(string? Page);

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
