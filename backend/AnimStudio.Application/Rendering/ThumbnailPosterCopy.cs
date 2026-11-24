using System.Text.RegularExpressions;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// High-CTR poster copy distilled from long SEO video titles so both YouTube thumbnails (16:9 / 9:16)
/// and opening video cover headers clearly state what the video or Short is about in large, readable text.
/// </summary>
public enum ThumbnailEmotion
{
    Shock = 0,
    Rage = 1,
    Laugh = 2,
    Devotion = 3,
    Mystery = 4,
    Alert = 5
}

public sealed record PosterOverlayCopy(
    string CategoryPill,
    string HeroTitle,
    string PurposeSubline,
    ThumbnailEmotion Emotion = ThumbnailEmotion.Devotion);

public static partial class ThumbnailPosterCopy
{
    public static PosterOverlayCopy Build(
        string? eventType,
        string? title,
        string? subtitleOrSummary,
        string? dateText,
        bool isPortrait)
    {
        var type = (eventType ?? string.Empty).Trim();
        var rawTitle = Clean(title);
        var readableDate = FormatReadableHindiDate(dateText);

        var emotion = ResolveEmotion(type, rawTitle, subtitleOrSummary);
        if (string.Equals(type, "HinduPanchang", StringComparison.OrdinalIgnoreCase))
        {
            var tithiFocus = ExtractPanchangFocus(rawTitle, subtitleOrSummary);
            var pill = string.IsNullOrWhiteSpace(readableDate) ? "पंचांग विशेष (IST)" : $"{readableDate} • IST";
            return new PosterOverlayCopy(
                CategoryPill: pill,
                HeroTitle: "आज का पंचांग",
                PurposeSubline: string.IsNullOrWhiteSpace(tithiFocus)
                    ? "तिथि • नक्षत्र • शुभ मुहूर्त व राहुकाल ✨"
                    : tithiFocus,
                Emotion: ThumbnailEmotion.Devotion);
        }

        if (string.Equals(type, "DailyRashifal", StringComparison.OrdinalIgnoreCase))
        {
            return new PosterOverlayCopy(
                CategoryPill: string.IsNullOrWhiteSpace(readableDate) ? "दैनिक राशिफल" : readableDate,
                HeroTitle: ExtractConciseHeadline(rawTitle, maxWords: 4, fallback: "आज का राशिफल"),
                PurposeSubline: "किसकी चमकेगी किस्मत? • सभी 12 राशियाँ ✨",
                Emotion: ThumbnailEmotion.Mystery);
        }

        if (string.Equals(type, "HinduFestival", StringComparison.OrdinalIgnoreCase))
        {
            var festName = ExtractFestivalName(rawTitle);
            return new PosterOverlayCopy(
                CategoryPill: string.IsNullOrWhiteSpace(readableDate) ? "व्रत एवं त्योहार विशेष" : $"व्रत विशेष • {readableDate}",
                HeroTitle: festName,
                PurposeSubline: "शुभ मुहूर्त • पूजा विधि व दुर्लभ नियम 🙏",
                Emotion: ThumbnailEmotion.Devotion);
        }

        if (string.Equals(type, "DailyKatha", StringComparison.OrdinalIgnoreCase))
        {
            var kathaHead = ExtractKathaHeadline(rawTitle);
            var lowerRaw = rawTitle.ToLowerInvariant();
            var isFierce = lowerRaw.Contains("नरसिंह", StringComparison.Ordinal) || lowerRaw.Contains("narasimha", StringComparison.Ordinal)
                || lowerRaw.Contains("महाकाल", StringComparison.Ordinal) || lowerRaw.Contains("रुद्र", StringComparison.Ordinal);
            var kathaHook = (lowerRaw.Contains("मार्कण्डेय", StringComparison.Ordinal) || lowerRaw.Contains("markandeya", StringComparison.Ordinal))
                ? "यमराज पर महाकाल की विजय 🔥"
                : (lowerRaw.Contains("प्रह्लाद", StringComparison.Ordinal) || lowerRaw.Contains("prahlad", StringComparison.Ordinal) || lowerRaw.Contains("नरसिंह", StringComparison.Ordinal))
                    ? "खंभा फाड़ प्रगट हुए भगवान नरसिंह! ⚡"
                    : (lowerRaw.Contains("नीलकंठ", StringComparison.Ordinal) || lowerRaw.Contains("neelkanth", StringComparison.Ordinal))
                        ? "समुद्र मंथन में महादेव का अद्भुत रूप 🙏"
                        : (isPortrait ? "क्यों हुआ ये चमत्कार? • देखें 🙏" : "भक्ति और रहस्य की अमर गाथा 🔥");
            return new PosterOverlayCopy(
                CategoryPill: isPortrait ? "पौराणिक शॉर्ट्स 🔥" : "संपूर्ण पौराणिक कथा",
                HeroTitle: kathaHead,
                PurposeSubline: kathaHook,
                Emotion: isFierce ? ThumbnailEmotion.Rage : ThumbnailEmotion.Devotion);
        }

        if (string.Equals(type, "AajKaItihaas", StringComparison.OrdinalIgnoreCase))
        {
            var histHead = ExtractHistoryHeadline(rawTitle, dateText);
            return new PosterOverlayCopy(
                CategoryPill: isPortrait
                    ? (string.IsNullOrWhiteSpace(readableDate) ? "आज का इतिहास" : $"आज का इतिहास • {readableDate}")
                    : (string.IsNullOrWhiteSpace(readableDate) ? "इतिहास का बड़ा सच" : $"इतिहास विशेष • {readableDate}"),
                HeroTitle: histHead.Hero,
                PurposeSubline: histHead.Subline,
                Emotion: ThumbnailEmotion.Mystery);
        }

        return new PosterOverlayCopy(
            CategoryPill: string.IsNullOrWhiteSpace(readableDate) ? "विशेष प्रस्तुति" : readableDate,
            HeroTitle: ExtractConciseHeadline(rawTitle, maxWords: 5, fallback: "विशेष वीडियो"),
            PurposeSubline: ExtractConciseHeadline(subtitleOrSummary, maxWords: 8, fallback: string.Empty),
            Emotion: emotion);
    }

    private static string ExtractPanchangFocus(string rawTitle, string? summary)
    {
        var parts = rawTitle.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length >= 2)
        {
            var clauses = Clean(parts[1]).Split([',', '•'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var selected = new List<string>();
            var len = 0;
            foreach (var clause in clauses)
            {
                // Skip pure city tags (New Delhi / India IST) in poster subline to stay clean pan-India
                if (clause.Contains("Delhi", StringComparison.OrdinalIgnoreCase)
                    || clause.Contains("दिल्ली", StringComparison.Ordinal))
                    continue;
                var nextLen = selected.Count == 0 ? clause.Length : len + 3 + clause.Length;
                if (selected.Count > 0 && nextLen > 48) break;
                selected.Add(clause);
                len = nextLen;
                if (selected.Count >= 2) break;
            }
            if (selected.Count > 0)
            {
                var joined = selected.Count == 1 ? $"{selected[0]} • शुभ मुहूर्त व राहुकाल" : string.Join(" • ", selected);
                return TrimWords(joined, maxWords: 8, maxChars: 52);
            }
        }
        var fromSummary = ExtractConciseHeadline(summary, 7, string.Empty, maxChars: 48);
        return string.IsNullOrWhiteSpace(fromSummary) ? "तिथि • नक्षत्र • शुभ मुहूर्त व राहुकाल" : fromSummary;
    }

    private static string ExtractFestivalName(string rawTitle)
    {
        var head = rawTitle.Split(['|', '•'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? rawTitle;
        head = Regex.Replace(head, @"^(आज|Today'?s?)\s*", "", RegexOptions.IgnoreCase).Trim();
        head = Regex.Replace(head, @"\b(Chaitra|Vaishakha|Jyeshtha|Ashadha|Shravana|Bhadrapada|Ashwin|Kartika|Margashirsha|Pausha|Magha|Phalguna)\s+(Shukla|Krishna)?\s*", "", RegexOptions.IgnoreCase).Trim();
        head = Regex.Replace(head, @"(चैत्र|वैशाख|ज्येष्ठ|आषाढ़|श्रावण|भाद्रपद|आश्विन|कार्तिक|मार्गशीर्ष|पौष|माघ|फाल्गुन)\s*(शुक्ल|कृष्ण)?\s*(पक्ष)?\s*", "", RegexOptions.IgnoreCase).Trim();
        head = Clean(head);
        if (head.Length is >= 4 and <= 26)
            return head;
        return ExtractConciseHeadline(head, 4, "व्रत एवं पर्व");
    }

    private static string ExtractKathaHeadline(string rawTitle)
    {
        var cleaned = rawTitle;
        cleaned = Regex.Replace(cleaned, @"^आज की पौराणिक कथा\s*[•|:-]\s*", "", RegexOptions.IgnoreCase).Trim();
        var segments = cleaned.Split(['|', '•'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var primary = segments.FirstOrDefault() ?? cleaned;
        if (primary.Contains(':', StringComparison.Ordinal) && primary.Length > 28)
        {
            var colonParts = primary.Split(':', 2, StringSplitOptions.TrimEntries);
            primary = colonParts[1].Length >= 10 ? colonParts[1] : colonParts[0];
        }
        var fitted = TrimWords(primary, maxWords: 12, maxChars: 64);
        // Strip trailing incomplete Hindi postposition / conjunction left at a hard boundary
        return Regex.Replace(fitted, @"\s+(की|का|के|को|में|से|पर|और|व|एवं)…?$", "").Trim();
    }

    private static (string Hero, string Subline) ExtractHistoryHeadline(string rawTitle, string? dateText)
    {
        var cleaned = Regex.Replace(rawTitle, @"^आज का इतिहास(?:\s*\([^)]*\))?\s*[:|•-]\s*", "", RegexOptions.IgnoreCase).Trim();
        cleaned = Regex.Replace(cleaned, @"^\d{1,2}\s+\S+\s+का इतिहास\s*[:|•-]?\s*", "", RegexOptions.IgnoreCase).Trim();
        var primarySeg = cleaned.Split(['|', '•'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? cleaned;
        var currentYear = DateOnly.TryParse(IsoDatePattern().Match(dateText ?? string.Empty).Value, out var d) ? d.Year : -1;
        var historicalYear = YearPattern()
            .Matches(cleaned)
            .Select(m => int.TryParse(m.Value, out var y) ? y : -1)
            .FirstOrDefault(y => y > 1500 && y != currentYear);

        if (historicalYear > 0)
        {
            return (
                Hero: $"{historicalYear} की बड़ी घटना",
                Subline: TrimWords(primarySeg, maxWords: 10, maxChars: 56));
        }

        // Split compound "Hero और Sub" / "Hero , Sub" cleanly across Headline + Subline
        var parts = Regex.Split(primarySeg, @"\s+(?:और|एवं)\s+|\s*,\s*", RegexOptions.IgnoreCase)
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToArray();
        if (parts.Length >= 2)
        {
            return (
                Hero: TrimWords(parts[0], maxWords: 5, maxChars: 34),
                Subline: TrimWords(parts[1], maxWords: 8, maxChars: 52));
        }

        return (
            Hero: TrimWords(primarySeg, maxWords: 5, maxChars: 34),
            Subline: "जिस घटना ने बदल दिया इतिहास! 🤯");
    }

    public static ThumbnailEmotion ResolveEmotion(string? eventType, string? title, string? script)
    {
        var combined = $"{eventType} {title} {script}".ToLowerInvariant();
        if (combined.Contains("corpsesnapup", StringComparison.Ordinal)
            || combined.Contains("मार भी दे", StringComparison.Ordinal)
            || combined.Contains("साले", StringComparison.Ordinal)
            || combined.Contains("angry", StringComparison.Ordinal)
            || combined.Contains("क्रोध", StringComparison.Ordinal)
            || combined.Contains("नरसिंह", StringComparison.Ordinal))
        {
            return ThumbnailEmotion.Rage;
        }
        if (combined.Contains("shockedfall", StringComparison.Ordinal)
            || combined.Contains("surprised", StringComparison.Ordinal)
            || combined.Contains("ज़िंदा", StringComparison.Ordinal)
            || combined.Contains("साँप", StringComparison.Ordinal)
            || combined.Contains("करंट", StringComparison.Ordinal)
            || combined.Contains("बाप रे", StringComparison.Ordinal)
            || combined.Contains("कांड", StringComparison.Ordinal))
        {
            return ThumbnailEmotion.Shock;
        }
        if (combined.Contains("laugh", StringComparison.Ordinal) || combined.Contains("😂", StringComparison.Ordinal)
            || string.Equals(eventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase))
        {
            return ThumbnailEmotion.Laugh;
        }
        if (string.Equals(eventType, "AajKaItihaas", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "DailyRashifal", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "Pratiyogita", StringComparison.OrdinalIgnoreCase))
        {
            return ThumbnailEmotion.Mystery;
        }
        if (combined.Contains("alert", StringComparison.Ordinal) || combined.Contains("राहुकाल", StringComparison.Ordinal))
            return ThumbnailEmotion.Alert;
        return ThumbnailEmotion.Devotion;
    }

    /// <summary>
    /// Builds a curiosity-gap 2–4 word Hero Hook and short Reaction Badge that complement (not copy)
    /// the video title so high-CTR viewers click to discover what happened.
    /// </summary>
    public static (string HeroHook, string ReactionBadge, ThumbnailEmotion Emotion) ExtractComedyHooks(string? title, string? script)
    {
        var emotion = ResolveEmotion("FunnyComedy", title, script);
        var cleanTitle = Clean(title);
        var titleLead = cleanTitle.Split(['|', '•', '—', '\n'], StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim() ?? string.Empty;
        var titleLeadWords = Regex.Replace(titleLead, @"#[^\s]+", string.Empty).Trim();

        // Prefer short punchy [MEME] text or dramatic climax quote that avoids duplicating the opening title
        string? candidate = null;
        var memeMatch = Regex.Match(script ?? string.Empty, @"\[MEME\]:\s*[^|\r\n]+\|\s*([^\r\n]+)", RegexOptions.IgnoreCase);
        if (memeMatch.Success)
            candidate = Clean(memeMatch.Groups[1].Value);

        if (string.IsNullOrWhiteSpace(candidate) || IsDuplicateOfLead(candidate, titleLeadWords))
        {
            var scriptLines = (script ?? string.Empty)
                .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Reverse();
            foreach (var rawLine in scriptLines)
            {
                if (rawLine.StartsWith("[CAST", StringComparison.OrdinalIgnoreCase)
                    || rawLine.StartsWith("[SCENE", StringComparison.OrdinalIgnoreCase)
                    || rawLine.StartsWith("[MEME", StringComparison.OrdinalIgnoreCase))
                    continue;
                var colon = rawLine.IndexOf(':', StringComparison.Ordinal);
                var body = colon >= 0 ? rawLine[(colon + 1)..] : rawLine;
                body = Regex.Replace(body, @"\([^)]*\)", " ").Trim();
                body = body.Split(['—', '।'], StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim() ?? body;
                body = Regex.Split(body, @"(?<=[!?]+)\s+").FirstOrDefault()?.Trim() ?? body;
                if (body.Contains("!", StringComparison.Ordinal) || body.Contains("?", StringComparison.Ordinal)
                    || rawLine.Contains("corpseSnapUp", StringComparison.OrdinalIgnoreCase)
                    || rawLine.Contains("angry", StringComparison.OrdinalIgnoreCase))
                {
                    var shortQuote = TrimWords(body, maxWords: 4, maxChars: 24);
                    if (shortQuote.Length >= 5 && !IsDuplicateOfLead(shortQuote, titleLeadWords))
                    {
                        candidate = shortQuote;
                        break;
                    }
                }
            }
        }

        if (string.IsNullOrWhiteSpace(candidate) || IsDuplicateOfLead(candidate, titleLeadWords))
        {
            var segments = cleanTitle.Split(['|', '•', '—'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            candidate = segments.Length >= 2
                ? TrimWords(Regex.Replace(segments[1], @"#[^\s]+", string.Empty), 4, 24)
                : TrimWords(titleLeadWords, 4, 24);
        }

        candidate = Regex.Replace(candidate ?? string.Empty, @"#[^\s]+", string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(candidate))
            candidate = "गज़ब कांड हो गया!! 😱";

        var emojiTail = emotion switch
        {
            ThumbnailEmotion.Rage => "😡",
            ThumbnailEmotion.Shock => "😱",
            _ => "😂"
        };
        if (!candidate.Any(c => char.GetUnicodeCategory(c) == System.Globalization.UnicodeCategory.OtherSymbol))
            candidate = $"{candidate} {emojiTail}";

        var badge = emotion switch
        {
            ThumbnailEmotion.Rage => "आख़िर तक देखो 🔥",
            ThumbnailEmotion.Shock => "ट्विस्ट मत छोड़ो 😱",
            _ => "हंसी नहीं रुकेगी 😂"
        };
        return (TrimWords(candidate, 5, 26), badge, emotion);
    }

    private static bool IsDuplicateOfLead(string candidate, string lead)
    {
        if (string.IsNullOrWhiteSpace(lead)) return false;
        var a = Regex.Replace(candidate, @"[^\p{L}\p{N}\u0900-\u097F]+", string.Empty);
        var b = Regex.Replace(lead, @"[^\p{L}\p{N}\u0900-\u097F]+", string.Empty);
        return a.Length > 0 && b.Contains(a, StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractConciseHeadline(string? raw, int maxWords, string fallback, int maxChars = 34)
    {
        var clean = Clean(raw);
        if (string.IsNullOrWhiteSpace(clean)) return fallback;
        var primary = clean.Split(['|', '•'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? clean;
        return TrimWords(primary, maxWords, maxChars);
    }

    private static string TrimWords(string text, int maxWords, int maxChars = 42)
    {
        var words = Clean(text).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return string.Empty;
        var fit = new List<string>(maxWords);
        var currentLen = 0;
        foreach (var word in words.Take(maxWords))
        {
            var nextLen = fit.Count == 0 ? word.Length : currentLen + 1 + word.Length;
            if (fit.Count > 0 && nextLen > maxChars)
                break;
            fit.Add(word);
            currentLen = nextLen;
        }
        var joined = string.Join(' ', fit);
        return joined.Length <= maxChars ? joined : joined[..maxChars].TrimEnd();
    }

    private static string Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return Regex.Replace(value.Replace('\r', ' ').Replace('\n', ' '), @"\s+", " ").Trim();
    }

    private static string FormatReadableHindiDate(string? dateKey)
    {
        if (string.IsNullOrWhiteSpace(dateKey))
            return string.Empty;

        var isoMatch = IsoDatePattern().Match(dateKey.Trim());
        var parseCandidate = isoMatch.Success ? isoMatch.Value : dateKey.Trim();
        if (!DateOnly.TryParse(parseCandidate, out var d))
            return Clean(dateTextFallback: dateKey);

        var month = d.Month switch
        {
            1 => "जनवरी",
            2 => "फरवरी",
            3 => "मार्च",
            4 => "अप्रैल",
            5 => "मई",
            6 => "जून",
            7 => "जुलाई",
            8 => "अगस्त",
            9 => "सितंबर",
            10 => "अक्टूबर",
            11 => "नवंबर",
            _ => "दिसंबर"
        };
        var weekday = d.DayOfWeek switch
        {
            DayOfWeek.Sunday => "रविवार",
            DayOfWeek.Monday => "सोमवार",
            DayOfWeek.Tuesday => "मंगलवार",
            DayOfWeek.Wednesday => "बुधवार",
            DayOfWeek.Thursday => "गुरुवार",
            DayOfWeek.Friday => "शुक्रवार",
            _ => "शनिवार"
        };
        return $"{d.Day} {month} {d.Year} • {weekday}";
    }

    private static string Clean(string? dateTextFallback, bool _ = false) => Clean(dateTextFallback);

    [GeneratedRegex(@"\b(1[5-9]\d{2}|20[0-2]\d)\b")]
    private static partial Regex YearPattern();

    [GeneratedRegex(@"\b\d{4}-\d{2}-\d{2}\b")]
    private static partial Regex IsoDatePattern();
}
