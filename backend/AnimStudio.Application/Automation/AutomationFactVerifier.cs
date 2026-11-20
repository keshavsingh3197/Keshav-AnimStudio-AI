using System.Globalization;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

public sealed record KnownHistoricalMilestone(
    string MonthDay,
    int Year,
    string Title,
    string Category,
    string Description,
    string CulturalSignificance,
    string SourceName,
    string SourceUrl,
    IReadOnlyList<string> Keywords);

public sealed record HistoricalClaimCheckResult(
    bool IsValid,
    string Status,
    string? Message,
    string? SourceUrl = null);

public sealed record PostVerificationResult(
    string Status,
    string Summary,
    string? SourceName,
    string? SourceUrl,
    IReadOnlyList<string> Issues);

/// <summary>
/// Strictly verifies event dates, historical anniversary alignment, and Panchang/Festival temporal
/// integrity so wrong-date facts (such as Nov 19 Rani Lakshmibai displayed under Nov 18) can never
/// silently surface on websites or auto-publish to YouTube channels.
/// </summary>
public static partial class AutomationFactVerifier
{
    public const string StatusVerified = "Verified";
    public const string StatusWarning = "NeedsReview";
    public const string StatusMismatch = "Mismatch";
    public const string StatusUnverified = "Unverified";

    public static readonly IReadOnlyList<KnownHistoricalMilestone> KnownMilestones =
    [
        new("01-12", 1863, "National Youth Day — Swami Vivekananda Jayanti", "Spiritual Saint",
            "Birth anniversary of Swami Vivekananda, pioneer of Vedanta and Yoga globally.",
            "Awakens spiritual confidence and selfless service.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Swami_Vivekananda",
            ["vivekananda", "विवेकानंद"]),
        new("01-23", 1897, "Parakram Diwas — Netaji Subhas Chandra Bose Jayanti", "Freedom Struggle",
            "Birth anniversary of Netaji Subhas Chandra Bose in Cuttack, founder of the Azad Hind Fauj.",
            "Celebrates fearless patriotism and disciplined courage.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Subhas_Chandra_Bose",
            ["subhas chandra bose", "सुभाष चंद्र बोस", "netaji", "नेताजी"]),
        new("01-26", 1950, "Republic Day — Constitution of India Adopted", "Indian History",
            "The Constitution of India came into effect on 26 January 1950.",
            "Marks India's democratic constitutional foundation.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Republic_Day_(India)",
            ["republic day", "गणतंत्र दिवस", "संविधान लागू"]),
        new("02-19", 1630, "Chhatrapati Shivaji Maharaj Jayanti", "Indian History",
            "Birth anniversary of Chhatrapati Shivaji Maharaj at Shivneri Fort (19 February 1630).",
            "Enduring symbol of Swarajya, strategic brilliance, and ethical governance.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Shivaji",
            ["shivaji maharaj", "छत्रपति शिवाजी"]),
        new("02-28", 1928, "National Science Day — Discovery of the Raman Effect", "Science & Astronomy",
            "Sir C.V. Raman announced the discovery of the Raman Effect on 28 February 1928.",
            "Celebrates Indian scientific discovery and Nobel-winning physics.",
            "Wikipedia", "https://en.wikipedia.org/wiki/National_Science_Day",
            ["raman effect", "रमन प्रभाव", "national science day"]),
        new("03-23", 1931, "Shaheed Diwas — Martyrdom of Bhagat Singh, Sukhdev & Rajguru", "Freedom Struggle",
            "Bhagat Singh, Sukhdev Thapar, and Shivaram Rajguru laid down their lives on 23 March 1931.",
            "Remembered forever as the supreme sacrifice of young revolutionaries.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Bhagat_Singh",
            ["martyrdom of bhagat singh", "शहीद दिवस", "23 march 1931"]),
        new("04-14", 1891, "Dr. B.R. Ambedkar Jayanti", "Indian History",
            "Birth anniversary of Dr. Bhimrao Ramji Ambedkar, chief architect of the Indian Constitution.",
            "Honors constitutional justice, equality, and education.",
            "Wikipedia", "https://en.wikipedia.org/wiki/B._R._Ambedkar",
            ["ambedkar jayanti", "अंबेडकर जयंती", "भीमराव अंबेडकर"]),
        new("05-11", 1998, "National Technology Day — Pokhran-II Scientific Milestone", "Science & Astronomy",
            "India conducted Operation Shakti (Pokhran-II) tests on 11 May 1998.",
            "Showcases indigenous scientific and engineering self-reliance.",
            "Wikipedia", "https://en.wikipedia.org/wiki/National_Technology_Day_(India)",
            ["pokhran-ii", "पोखरण", "national technology day"]),
        new("08-15", 1947, "India's Independence Day (Swatantrata Diwas)", "Freedom Struggle",
            "India achieved independence from British colonial rule on 15 August 1947.",
            "Commemorates generations of freedom struggle and national unity.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Independence_Day_(India)",
            ["independence day", "स्वतंत्रता दिवस", "15 august 1947"]),
        new("09-05", 1888, "Teachers' Day — Dr. Sarvepalli Radhakrishnan Jayanti", "Spiritual Saint",
            "Birth anniversary of philosopher-president Dr. Sarvepalli Radhakrishnan (5 September 1888).",
            "Celebrates educators and the Guru-Shishya tradition.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Sarvepalli_Radhakrishnan",
            ["radhakrishnan", "राधाकृष्णन", "teacher's day", "शिक्षक दिवस"]),
        new("09-28", 1907, "Shaheed Bhagat Singh Birth Anniversary", "Freedom Struggle",
            "Birth of revolutionary freedom fighter Bhagat Singh on 28 September 1907.",
            "Icon of fearless youth idealism and national sacrifice.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Bhagat_Singh",
            ["bhagat singh birth", "भगत सिंह जयंती"]),
        new("10-02", 1869, "Gandhi Jayanti & Lal Bahadur Shastri Jayanti", "Freedom Struggle",
            "Birth anniversaries of Mahatma Gandhi (1869) and Lal Bahadur Shastri (1904) on 2 October.",
            "Embodies truth, non-violence, and simplicity in public life.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Gandhi_Jayanti",
            ["gandhi jayanti", "गांधी जयंती", "shastri jayanti"]),
        new("10-15", 1931, "World Students' Day — Dr. A.P.J. Abdul Kalam Jayanti", "Science & Astronomy",
            "Birth anniversary of aerospace scientist and President Dr. A.P.J. Abdul Kalam (15 October 1931).",
            "Inspires young students toward science, humility, and innovation.",
            "Wikipedia", "https://en.wikipedia.org/wiki/A._P._J._Abdul_Kalam",
            ["abdul kalam", "अब्दुल कलाम", "kalam jayanti"]),
        new("11-12", 1930, "First Round Table Conference Inaugurated", "Indian History",
            "The first Round Table Conference on Indian constitutional reforms opened on 12 November 1930.",
            "Key constitutional dialogue milestone in India's freedom era.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Round_Table_Conferences_(India)",
            ["round table conference", "गोलमेज सम्मेलन"]),
        new("11-12", 1896, "Birth of Dr. Salim Ali (Birdman of India)", "Science & Astronomy",
            "Birth anniversary of pioneering Indian ornithologist Dr. Salim Ali (12 November 1896).",
            "Symbolizes Indian ecological research and bird conservation.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Salim_Ali",
            ["salim ali", "सलीम अली"]),
        new("11-13", 1780, "Maharaja Ranjit Singh Birth Anniversary", "Indian History",
            "Birth anniversary of Maharaja Ranjit Singh (13 November 1780), founder of the Sikh Empire.",
            "Remembered for valor, administration, and cultural patronage.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Ranjit_Singh",
            ["ranjit singh", "रणजीत सिंह"]),
        new("11-14", 1889, "Bal Diwas & Pandit Jawaharlal Nehru Jayanti", "Indian History",
            "Observed on 14 November across India as Children's Day honoring India's first Prime Minister.",
            "Celebrates childhood education and scientific institutions.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Children%27s_Day_(India)",
            ["bal diwas", "बाल दिवस", "jawaharlal nehru", "नेहरू जयंती"]),
        new("11-15", 1875, "Janjatiya Gaurav Divas — Birsa Munda Jayanti", "Freedom Struggle",
            "Birth anniversary of Bhagwan Birsa Munda (15 November 1875), revered tribal freedom hero.",
            "Honors indigenous stewardship, courage, and India's grassroots resistance.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Birsa_Munda",
            ["birsa munda", "बिरसा मुंडा", "janjatiya gaurav"]),
        new("11-18", 1727, "Foundation of Jaipur by Maharaja Sawai Jai Singh II", "Indian History",
            "On 18 November 1727, Maharaja Sawai Jai Singh II laid the foundation of Jaipur, India's iconic planned Pink City designed by Vidyadhar Bhattacharya.",
            "Celebrates classical Indian astronomy, Vastu urban planning, and heritage architecture.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Jaipur",
            ["jaipur", "जयपुर की स्थापना", "sawai jai singh"]),
        new("11-18", 1910, "Batukeshwar Dutt Birth Anniversary", "Freedom Struggle",
            "Birth of Indian revolutionary Batukeshwar Dutt on 18 November 1910, companion of Bhagat Singh in the 1929 Central Legislative Assembly protest.",
            "Honors selfless revolutionary courage for India's independence.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Batukeshwar_Dutt",
            ["batukeshwar dutt", "बटुकेश्वर दत्त"]),
        new("11-18", 1962, "Battle of Rezang La — Major Shaitan Singh & 13 Kumaon", "Indian History",
            "On 18 November 1962, Major Shaitan Singh Bhati and Charlie Company, 13 Kumaon made an immortal stand at Rezang La pass at 16,000+ feet in Ladakh.",
            "Remembered among the greatest last stands in military history; Param Vir Chakra honor.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Battle_of_Rezang_La",
            ["rezang la", "रेजांग ला", "shaitan singh", "शैतान सिंह"]),
        new("11-18", 1972, "Royal Bengal Tiger Designated as India's National Animal", "Indian History",
            "On 18 November 1972, India formally adopted the Royal Bengal Tiger as its national animal, paving the way for Project Tiger.",
            "Landmark moment in Indian wildlife preservation and conservation policy.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Bengal_tiger",
            ["national animal", "राष्ट्रीय पशु", "bengal tiger"]),
        new("11-19", 1828, "Rani Lakshmibai of Jhansi Birth Anniversary", "Freedom Struggle",
            "Birth of Veerangana Rani Lakshmibai on 19 November 1828 in Varanasi, heroic leader of India's 1857 First War of Independence.",
            "Eternal emblem of valor, self-respect, and Matrubhoomi devotion.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Rani_of_Jhansi",
            ["lakshmibai", "lakshmi bai", "लक्ष्मीबाई", "रानी लक्ष्मीबाई", "jhansi ki rani", "झांसी की रानी"]),
        new("12-22", 1887, "National Mathematics Day — Srinivasa Ramanujan Jayanti", "Science & Astronomy",
            "Birth anniversary of mathematical genius Srinivasa Ramanujan (22 December 1887).",
            "Celebrates India's deep mathematical and analytical heritage.",
            "Wikipedia", "https://en.wikipedia.org/wiki/Srinivasa_Ramanujan",
            ["ramanujan", "रामानुजन", "mathematics day"])
    ];

    public static string? ExtractIsoDateKey(string? rawDate)
    {
        if (string.IsNullOrWhiteSpace(rawDate)) return null;
        var match = IsoDatePrefixRegex().Match(rawDate.Trim());
        if (match.Success && DateOnly.TryParseExact(match.Value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            return match.Value;
        return null;
    }

    public static string? ExtractMonthDay(string? rawDateKey)
    {
        if (string.IsNullOrWhiteSpace(rawDateKey)) return null;
        var trimmed = rawDateKey.Trim();

        var iso = ExtractIsoDateKey(trimmed);
        if (iso is not null) return iso[5..]; // MM-dd

        var md = MonthDayRegex().Match(trimmed);
        if (md.Success && DateOnly.TryParseExact($"2024-{md.Value}", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            return md.Value;

        return null;
    }

    public static bool MatchesMonthDay(string? candidateDateKey, string targetDateKey)
    {
        var candMd = ExtractMonthDay(candidateDateKey);
        var targetMd = ExtractMonthDay(targetDateKey);
        return candMd is not null && targetMd is not null && string.Equals(candMd, targetMd, StringComparison.Ordinal);
    }

    public static IReadOnlyList<EcosystemHistoricalSignal> GetCuratedHistoricalForDate(string targetDateKey)
    {
        var md = ExtractMonthDay(targetDateKey);
        if (md is null) return [];

        return
        [
            .. KnownMilestones
                .Where(m => string.Equals(m.MonthDay, md, StringComparison.Ordinal))
                .Select(m => new EcosystemHistoricalSignal(
                    Id: $"curated-{m.MonthDay}-{m.Year}",
                    DateKey: md,
                    Year: m.Year,
                    Title: m.Title,
                    Category: m.Category,
                    Description: m.Description,
                    CulturalSignificance: m.CulturalSignificance,
                    IsExactDateMatch: true,
                    IsVerified: true,
                    SourceName: m.SourceName,
                    SourceUrl: m.SourceUrl,
                    VerificationNote: $"Verified exact calendar date {m.MonthDay} milestone."))
        ];
    }

    public static HistoricalClaimCheckResult CheckHistoricalClaim(
        string targetDateKey,
        string? itemDateKey,
        bool? isExactDateMatch,
        string title,
        string? extraText = null)
    {
        var targetMd = ExtractMonthDay(targetDateKey);
        if (targetMd is null)
            return new HistoricalClaimCheckResult(false, StatusWarning, $"Invalid target date '{targetDateKey}'.");

        if (isExactDateMatch == false)
        {
            var actualLabel = string.IsNullOrWhiteSpace(itemDateKey) ? "another date" : itemDateKey;
            return new HistoricalClaimCheckResult(
                false,
                StatusMismatch,
                $"Non-exact historical entry: belongs to '{actualLabel}', not target date '{targetDateKey}'.");
        }

        if (!string.IsNullOrWhiteSpace(itemDateKey) && !MatchesMonthDay(itemDateKey, targetDateKey))
        {
            return new HistoricalClaimCheckResult(
                false,
                StatusMismatch,
                $"Date mismatch: event is dated '{itemDateKey}', not '{targetMd}' ({targetDateKey}).");
        }

        var combined = $"{title} {extraText}".ToLowerInvariant();
        foreach (var milestone in KnownMilestones)
        {
            if (string.Equals(milestone.MonthDay, targetMd, StringComparison.Ordinal)) continue;
            if (milestone.Keywords.Any(kw => combined.Contains(kw, StringComparison.OrdinalIgnoreCase)))
            {
                return new HistoricalClaimCheckResult(
                    false,
                    StatusMismatch,
                    $"Fact & date mismatch: '{milestone.Title}' ({milestone.Year}) belongs to {FormatReadableMonthDay(milestone.MonthDay)} ({milestone.MonthDay}), not {FormatReadableMonthDay(targetMd)} ({targetDateKey}).",
                    milestone.SourceUrl);
            }
        }

        return new HistoricalClaimCheckResult(true, StatusVerified, null);
    }

    public static SignalVerificationReport VerifySignals(string effectiveDate, EcosystemSignalsSnapshot snapshot)
    {
        var checks = new List<SignalVerificationCheck>();
        var targetMd = ExtractMonthDay(effectiveDate) ?? effectiveDate;

        // 1. Panchang check
        if (snapshot.Panchang is { } p)
        {
            var panchangDateMatches = string.Equals(ExtractIsoDateKey(p.DateKey), effectiveDate, StringComparison.Ordinal);
            var hasCore = !string.IsNullOrWhiteSpace(p.Tithi) && !string.IsNullOrWhiteSpace(p.Nakshatra) && !string.IsNullOrWhiteSpace(p.Sunrise);
            var tithiExtra = string.IsNullOrWhiteSpace(p.TithiEndTime)
                ? string.Empty
                : string.IsNullOrWhiteSpace(p.NextTithi) ? $" ({p.TithiEndTime})" : $" ({p.TithiEndTime} → {p.NextTithi})";
            checks.Add(new SignalVerificationCheck(
                Category: "Panchang",
                Status: panchangDateMatches && hasCore ? StatusVerified : StatusWarning,
                Message: panchangDateMatches && hasCore
                    ? $"Verified astronomical Panchang for {effectiveDate} ({p.Tithi}{tithiExtra} • {p.Nakshatra}, {p.Location})."
                    : $"Panchang date/fields need check (returned DateKey '{p.DateKey}' for requested '{effectiveDate}').",
                SourceName: p.SourceName ?? "Lahiri Chitrapaksha Ephemeris",
                SourceUrl: p.SourceUrl ?? "https://panchang.keshavsingh.in",
                VerifySearchUrl: GoogleVerifyUrl($"{effectiveDate} Hindu Panchang {p.Location} Tithi Nakshatra DrikPanchang")));
        }
        else
        {
            checks.Add(new SignalVerificationCheck(
                Category: "Panchang",
                Status: StatusUnverified,
                Message: $"No live Panchang signal available for {effectiveDate}.",
                SourceName: "HinduPanchang API",
                SourceUrl: "https://panchang.keshavsingh.in",
                VerifySearchUrl: GoogleVerifyUrl($"{effectiveDate} Hindu Panchang New Delhi DrikPanchang")));
        }

        // 2. Festivals check
        if (snapshot.UpcomingFestivals.Count > 0)
        {
            var targetDate = DateOnly.ParseExact(effectiveDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var invalidFestivals = snapshot.UpcomingFestivals
                .Where(f => !DateOnly.TryParseExact(f.DateKey, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fd)
                    || fd < targetDate.AddDays(-2))
                .ToList();
            var lead = snapshot.UpcomingFestivals[0];
            checks.Add(new SignalVerificationCheck(
                Category: "Festivals",
                Status: invalidFestivals.Count == 0 ? StatusVerified : StatusWarning,
                Message: invalidFestivals.Count == 0
                    ? $"{snapshot.UpcomingFestivals.Count} upcoming festivals date-aligned (Next: {lead.NameEnglish} on {lead.DateKey})."
                    : $"{invalidFestivals.Count} festival entries have stale or unaligned dates relative to {effectiveDate}.",
                SourceName: lead.VerificationSource ?? "Lahiri Chitrapaksha Tithi Engine",
                SourceUrl: lead.VerificationUrl ?? "https://www.drikpanchang.com/",
                VerifySearchUrl: GoogleVerifyUrl($"{lead.NameEnglish} {lead.DateKey} date DrikPanchang")));
        }

        // 3. Aaj Ka Itihaas strict verification check
        if (snapshot.HistoricalIncidents.Count > 0)
        {
            var mismatched = new List<string>();
            foreach (var h in snapshot.HistoricalIncidents)
            {
                var claim = CheckHistoricalClaim(effectiveDate, h.DateKey, h.IsExactDateMatch, h.Title, h.Description);
                if (!claim.IsValid) mismatched.Add(claim.Message ?? h.Title);
            }

            var leadHist = snapshot.HistoricalIncidents[0];
            checks.Add(new SignalVerificationCheck(
                Category: "AajKaItihaas",
                Status: mismatched.Count == 0 && leadHist.IsVerified ? StatusVerified : mismatched.Count > 0 ? StatusMismatch : StatusWarning,
                Message: mismatched.Count == 0
                    ? $"Verified {snapshot.HistoricalIncidents.Count} exact On-This-Day event(s) for {FormatReadableMonthDay(targetMd)} ({leadHist.Year}: {leadHist.Title})."
                    : mismatched[0],
                SourceName: leadHist.SourceName ?? "Wikipedia On This Day",
                SourceUrl: leadHist.SourceUrl ?? $"https://en.wikipedia.org/wiki/{targetMd.Replace('-', '_')}",
                VerifySearchUrl: GoogleVerifyUrl($"On this day {FormatReadableMonthDay(targetMd)} {leadHist.Year} {leadHist.Title}")));
        }
        else
        {
            checks.Add(new SignalVerificationCheck(
                Category: "AajKaItihaas",
                Status: StatusUnverified,
                Message: $"No verified exact-date events returned for {FormatReadableMonthDay(targetMd)} — other dates were blocked to avoid misinformation.",
                SourceName: "Strict Date Guard",
                SourceUrl: $"https://en.wikipedia.org/wiki/{targetMd.Replace('-', '_')}",
                VerifySearchUrl: GoogleVerifyUrl($"आज का इतिहास {FormatReadableMonthDay(targetMd)}")));
        }

        var mismatchesCount = checks.Count(c => c.Status == StatusMismatch);
        var warningsCount = checks.Count(c => c.Status is StatusWarning or StatusUnverified);
        var overall = mismatchesCount > 0 ? StatusMismatch : warningsCount > 0 ? StatusWarning : StatusVerified;
        var summary = overall switch
        {
            StatusMismatch => $"Date/fact mismatch detected on {mismatchesCount} feed(s) for {effectiveDate}.",
            StatusWarning => $"Verified with {warningsCount} note(s) for {effectiveDate}.",
            _ => $"All feeds date-verified for {effectiveDate} ({FormatReadableMonthDay(targetMd)})."
        };

        return new SignalVerificationReport(overall, summary, checks, mismatchesCount, warningsCount);
    }

    public static PostVerificationResult VerifyPost(AutomationPost post, EcosystemSignalsSnapshot? liveSignals)
    {
        var issues = new List<string>();
        string status = StatusVerified;
        string? sourceName = post.VerificationSourceName;
        string? sourceUrl = post.VerificationSourceUrl;

        var effectiveDate = ExtractIsoDateKey(post.DateKey) ?? post.DateKey;
        var targetMd = ExtractMonthDay(effectiveDate) ?? effectiveDate;

        switch (post.SourceType)
        {
            case AutomationSourceType.AajKaItihaas:
            {
                var claim = CheckHistoricalClaim(effectiveDate, null, isExactDateMatch: true, post.Title, $"{post.SourceTitle} {post.Script} {post.Description}");
                if (!claim.IsValid)
                {
                    status = StatusMismatch;
                    issues.Add(claim.Message!);
                    sourceUrl ??= claim.SourceUrl;
                }

                if (liveSignals?.HistoricalIncidents is { Count: > 0 } liveHist)
                {
                    var leadLive = liveHist[0];
                    sourceName ??= leadLive.SourceName ?? "Wikipedia On This Day";
                    sourceUrl ??= leadLive.SourceUrl;

                    // If an already-saved card cites a totally different historical event than ANY live verified entry
                    // for this MM-dd (or was composed from yesterday/tomorrow's fallback), flag it loudly!
                    var matchesLive = liveHist.Any(h =>
                        post.Title.Contains(h.Year.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal)
                        || (!string.IsNullOrWhiteSpace(post.SourceTitle) && post.SourceTitle.Contains(h.Year.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal))
                        || SharesSignificantWords(post.Title, h.Title));
                    if (!matchesLive && issues.Count == 0)
                    {
                        status = StatusMismatch;
                        issues.Add($"Saved event '{post.SourceTitle}' does not match verified {FormatReadableMonthDay(targetMd)} events (e.g., {leadLive.Year}: {leadLive.Title}). Click Re-Verify & Fix.");
                    }
                }
                else if (issues.Count == 0 && string.IsNullOrWhiteSpace(sourceUrl))
                {
                    status = StatusWarning;
                    issues.Add($"Historical source link could not be confirmed online for {FormatReadableMonthDay(targetMd)}.");
                }
                break;
            }

            case AutomationSourceType.HinduPanchang:
            {
                sourceName ??= liveSignals?.Panchang?.SourceName ?? "Lahiri Chitrapaksha Ephemeris";
                sourceUrl ??= liveSignals?.Panchang?.SourceUrl ?? "https://panchang.keshavsingh.in";
                var keyParts = (post.SourceItemKey ?? string.Empty).Split(':');
                var itemDate = keyParts.Length >= 2 ? ExtractIsoDateKey(keyParts[1]) : null;
                if (itemDate is not null && !string.Equals(itemDate, effectiveDate, StringComparison.Ordinal))
                {
                    status = StatusMismatch;
                    issues.Add($"Panchang date mismatch: post is dated '{effectiveDate}' while source key targets '{itemDate}'.");
                }
                if (liveSignals?.Panchang is { } p && string.Equals(ExtractIsoDateKey(p.DateKey), effectiveDate, StringComparison.Ordinal))
                {
                    var hasTithi = !string.IsNullOrWhiteSpace(p.Tithi)
                        && (post.Title.Contains(p.Tithi, StringComparison.OrdinalIgnoreCase)
                            || post.Script.Contains(p.Tithi, StringComparison.OrdinalIgnoreCase));
                    var hasNextTithi = !string.IsNullOrWhiteSpace(p.NextTithi)
                        && (post.Title.Contains(p.NextTithi, StringComparison.OrdinalIgnoreCase)
                            || post.Script.Contains(p.NextTithi, StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrWhiteSpace(p.Tithi) && !hasTithi && !hasNextTithi)
                    {
                        status = StatusMismatch;
                        issues.Add($"Panchang mismatch for {effectiveDate}: verified Tithi is '{p.Tithi}'{(string.IsNullOrWhiteSpace(p.NextTithi) ? "" : $" / {p.NextTithi}")} ({p.Nakshatra}), which differs from this post.");
                    }
                }
                var bannerDates = ExtractInlineIsoDates(post.HeaderBannerText);
                if (bannerDates.Any(d => !string.Equals(d, effectiveDate, StringComparison.Ordinal)))
                {
                    status = StatusMismatch;
                    issues.Add($"Panchang banner date mismatch: header cites '{bannerDates.First(d => d != effectiveDate)}' instead of '{effectiveDate}'.");
                }
                break;
            }

            case AutomationSourceType.HinduFestival:
            {
                sourceName ??= "Lahiri Chitrapaksha Tithi Engine";
                // SourceItemKey format: festival:{yyyy-MM-dd}:{id}
                var keyParts = (post.SourceItemKey ?? string.Empty).Split(':');
                var keyDate = keyParts.Length >= 2 ? ExtractIsoDateKey(keyParts[1]) : null;
                var keyId = keyParts.Length >= 3 ? string.Join(':', keyParts.Skip(2)) : null;

                EcosystemFestivalSignal? matchingFest = null;
                if (liveSignals?.UpcomingFestivals is { Count: > 0 } upcoming)
                {
                    // Match festival identity FIRST (by ID, then by NameEnglish/NameHindi), never purely by date first.
                    matchingFest = (!string.IsNullOrWhiteSpace(keyId)
                            ? upcoming.FirstOrDefault(f => string.Equals(f.Id, keyId, StringComparison.OrdinalIgnoreCase))
                            : null)
                        ?? upcoming.FirstOrDefault(f =>
                            (!string.IsNullOrWhiteSpace(f.NameEnglish)
                                && ((post.SourceTitle?.Contains(f.NameEnglish, StringComparison.OrdinalIgnoreCase) == true)
                                    || post.Title.Contains(f.NameEnglish, StringComparison.OrdinalIgnoreCase)))
                            || (!string.IsNullOrWhiteSpace(f.NameHindi)
                                && ((post.SourceTitle?.Contains(f.NameHindi, StringComparison.OrdinalIgnoreCase) == true)
                                    || post.Title.Contains(f.NameHindi, StringComparison.OrdinalIgnoreCase))))
                        ?? (keyDate is not null
                            ? upcoming.FirstOrDefault(f => string.Equals(f.DateKey, keyDate, StringComparison.Ordinal))
                            : null);
                }

                var canonicalDate = matchingFest?.DateKey ?? keyDate;
                var festLabel = matchingFest is not null
                    ? (!string.IsNullOrWhiteSpace(matchingFest.NameHindi) ? $"{matchingFest.NameHindi} ({matchingFest.NameEnglish})" : matchingFest.NameEnglish)
                    : (post.SourceTitle ?? post.Title);

                if (!string.IsNullOrWhiteSpace(matchingFest?.VerificationUrl))
                    sourceUrl = matchingFest.VerificationUrl;
                else if (string.IsNullOrWhiteSpace(sourceUrl) || sourceUrl.Equals("https://www.drikpanchang.com/", StringComparison.OrdinalIgnoreCase))
                    sourceUrl = "https://panchang.keshavsingh.in/festivals";

                if (keyDate is not null && !string.Equals(keyDate, effectiveDate, StringComparison.Ordinal))
                {
                    status = StatusMismatch;
                    issues.Add($"Festival date mismatch: card date/schedule is {effectiveDate}, whereas '{festLabel}' falls on {keyDate}.");
                }
                else if (matchingFest is not null && !string.Equals(matchingFest.DateKey, effectiveDate, StringComparison.Ordinal))
                {
                    status = StatusMismatch;
                    issues.Add($"Festival date mismatch: Lahiri Chitrapaksha Tithi Engine places '{festLabel}' on {matchingFest.DateKey}, not {effectiveDate}.");
                }
                else if (canonicalDate is not null)
                {
                    var contradictingDates = ExtractInlineIsoDates(post.HeaderBannerText)
                        .Concat(ExtractInlineIsoDates(post.Title))
                        .Where(d => !string.Equals(d, canonicalDate, StringComparison.Ordinal))
                        .Distinct(StringComparer.Ordinal)
                        .ToList();
                    if (contradictingDates.Count > 0)
                    {
                        status = StatusMismatch;
                        issues.Add($"Festival banner/title cites '{contradictingDates[0]}', contradicting verified festival date '{canonicalDate}'.");
                    }
                }
                break;
            }

            default:
                sourceName ??= "AnimStudio Verified Content Pipeline";
                break;
        }

        sourceUrl ??= GoogleVerifyUrl($"{post.Title} {effectiveDate}");
        var summary = issues.Count > 0
            ? string.Join(" ", issues)
            : $"Verified for {effectiveDate} ({sourceName ?? "Verified Source"}).";

        return new PostVerificationResult(status, summary, sourceName, sourceUrl, issues);
    }

    public static string GoogleVerifyUrl(string query) =>
        $"https://www.google.com/search?q={Uri.EscapeDataString(query)}";

    public static string FormatReadableMonthDay(string monthDay)
    {
        if (DateOnly.TryParseExact($"2024-{monthDay}", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            return d.ToString("d MMM", CultureInfo.InvariantCulture);
        return monthDay;
    }

    private static bool SharesSignificantWords(string a, string b)
    {
        static HashSet<string> Words(string s) =>
        [
            .. Regex.Split(s.ToLowerInvariant(), @"[^\p{L}\p{N}]+")
                .Where(w => w.Length >= 4)
        ];
        var wa = Words(a);
        var wb = Words(b);
        return wa.Any(wb.Contains);
    }

    private static IReadOnlyList<string> ExtractInlineIsoDates(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return [];
        return
        [
            .. InlineIsoDateRegex().Matches(text)
                .Select(m => m.Value)
                .Where(v => DateOnly.TryParseExact(v, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                .Distinct(StringComparer.Ordinal)
        ];
    }

    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}")]
    private static partial Regex IsoDatePrefixRegex();

    [GeneratedRegex(@"\b\d{4}-\d{2}-\d{2}\b")]
    private static partial Regex InlineIsoDateRegex();

    [GeneratedRegex(@"^\d{2}-\d{2}$")]
    private static partial Regex MonthDayRegex();
}
