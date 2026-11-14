using System.Text;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

public sealed record ComposedAutomationContent(
    string SourceItemKey,
    string SourceTitle,
    string? SourceSummary,
    string Title,
    string Script,
    string AiVideoPrompt,
    string AiThumbnailPrompt,
    string Description,
    string? PinnedComment,
    IReadOnlyList<string> Tags,
    string? PrimaryDestinationUrl,
    IReadOnlyList<AutomationWebsiteLink> TrackedLinks);

/// <summary>
/// Builds rich bilingual YouTube & Shorts packages (Title, Narration Script, AI Video Prompt,
/// AI Thumbnail Prompt, SEO Description with tracked UTM & funnel links, Pinned Comment, Tags)
/// purely from dynamic live ecosystem signals and Central Admin website/channel metadata.
/// Zero channel URLs or brand constants are hardcoded here.
/// </summary>
public static class AutomationContentComposer
{
    private const int MaxTitleLength = 95;
    private const int MaxTagCount = 22;

    public static IReadOnlyList<ComposedAutomationContent> ComposeForRule(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        StudioEcosystemConfig ecosystem)
    {
        var dateKey = string.IsNullOrWhiteSpace(signals.DateKey)
            ? DateTime.UtcNow.ToString("yyyy-MM-dd")
            : signals.DateKey;

        var isHindi = !string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase);
        var isVertical = rule.VideoFormat == AutomationVideoFormat.Vertical;
        var ratioLabel = isVertical ? "9:16 vertical short reel" : "16:9 widescreen cinematic";

        var links = BuildTrackedLinks(rule, signals, ecosystem, dateKey);
        var primaryLink = links.FirstOrDefault()?.TrackedUrl ?? ecosystem.StudioUrl;

        var channelMeta = ResolveChannelMeta(rule, ecosystem);
        var baseTags = channelMeta?.Tags ?? [];
        var baseHashtags = channelMeta?.Hashtags ?? [];

        return rule.SourceType switch
        {
            AutomationSourceType.HinduPanchang when signals.Panchang is { } p =>
                [ComposePanchang(rule, p, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            AutomationSourceType.HinduFestival =>
                ComposeFestivals(rule, signals, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi),

            AutomationSourceType.DailyKatha when signals.DailyKatha is { } k =>
                [ComposeDailyKatha(rule, k, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            AutomationSourceType.AajKaItihaas when signals.HistoricalIncidents.Count > 0 =>
                ComposeHistorical(rule, signals.HistoricalIncidents, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi),

            AutomationSourceType.Pratiyogita when signals.Competitions.Count > 0 =>
                [ComposePratiyogita(rule, signals.Competitions, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            AutomationSourceType.EcosystemSpotlight =>
                [ComposeEcosystemSpotlight(rule, signals, ecosystem, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            AutomationSourceType.CustomPrompt =>
                [ComposeCustom(rule, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            _ => []
        };
    }

    private static ComposedAutomationContent ComposePanchang(
        AutomationRule rule,
        EcosystemPanchangSignal p,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var title = isHindi
            ? Truncate($"आज का पंचांग {p.DateKey} | {p.Tithi} • {p.Nakshatra} • शुभ मुहूर्त & राहुकाल", MaxTitleLength)
            : Truncate($"Today's Hindu Panchang {p.DateKey} | {p.Tithi}, {p.Nakshatra} & Shubh Muhurat", MaxTitleLength);

        var sutraLine = !string.IsNullOrWhiteSpace(p.DailySanskritSutra)
            ? $"\nआज का श्लोक: {p.DailySanskritSutra} ({p.DailySutraMeaning})"
            : string.Empty;

        var script = isHindi
            ? $"""
               [HOOK 0-4s] हर हर महादेव! आइए जानते हैं {p.DateKey} ({p.Location}) का संपूर्ण दैनिक पंचांग और आज का सबसे शुभ मुहूर्त।
               [CORE PANCHANG 4-35s]
               • तिथि: {p.Tithi}{(string.IsNullOrWhiteSpace(p.TithiEndTime) ? "" : $" ({p.TithiEndTime} तक)")} | पक्ष: {p.Paksha ?? "शुक्ल/कृष्ण"}
               • नक्षत्र: {p.Nakshatra}{(string.IsNullOrWhiteSpace(p.NakshatraEndTime) ? "" : $" ({p.NakshatraEndTime} तक)")} | योग: {p.Yoga} | करण: {p.Karana}
               • सूर्योदय: {p.Sunrise} | सूर्यास्त: {p.Sunset}
               • आज का शुभ अभिजीत मुहूर्त: {p.AbhijitMuhurat} | ब्रह्म मुहूर्त: {p.BrahmaMuhurat}
               • सावधान समय (राहुकाल): {p.RahuKaal} — इस दौरान शुभ कार्य व निवेश टालें।{sutraLine}
               [WEBSITE CTA 35-50s] पूरे दिन का चौघड़िया, होरा, लाइव राशि-तारा फल और अपने शहर का सटीक पंचांग देखने के लिए डिस्क्रिप्शन या पिन कमेंट में दिए लिंक पर जाएं: {primaryLink}
               """
            : $"""
               [HOOK 0-4s] Namaste! Here is today's authentic Vedic Panchang for {p.DateKey} ({p.Location}).
               [CORE PANCHANG 4-35s]
               • Tithi: {p.Tithi} | Nakshatra: {p.Nakshatra} | Yoga: {p.Yoga} | Karana: {p.Karana}
               • Sunrise: {p.Sunrise} | Sunset: {p.Sunset}
               • Best Auspicious Window (Abhijit Muhurat): {p.AbhijitMuhurat}
               • Brahma Muhurat: {p.BrahmaMuhurat} | Amrit Kaal: {p.AmritKaal}
               • Avoid Important Starts (Rahu Kaal): {p.RahuKaal}
               [WEBSITE CTA 35-50s] Check live city-wise Choghadiya, Hora, Festivals, and Aaj Ka Itihaas directly on our portal (link in pinned comment): {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Create a devotional luminous {ratioLabel} video with glowing golden temple bells, rising morning Surya rays over sacred Ganga ghats, clean Devanagari/English calendar lower-third cards showing Tithi '{p.Tithi}', Nakshatra '{p.Nakshatra}', Abhijit Muhurat '{p.AbhijitMuhurat}', and Rahu Kaal '{p.RahuKaal}'. Warm saffron-gold cinematic color grade, calm spiritual flute + tanpura atmosphere, zero modern logos.");

        var thumbPrompt = $"High-contrast devotional sunrise poster background, radiant temple kalash, warm saffron & gold light, crisp bold text space for '{p.Tithi}' & 'Shubh Muhurat {p.AbhijitMuhurat}', ultra sharp 4K.";

        var tags = MergeTags(["Hindu Panchang", "Aaj Ka Panchang", p.Tithi, p.Nakshatra, "Shubh Muhurat", "Rahu Kaal", "Sanatan Dharma", "Daily Panchang", "Shorts"], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"📅 दिनांक / Date: {p.DateKey} ({p.Location})\n" +
            $"🔱 तिथि: {p.Tithi} | नक्षत्र: {p.Nakshatra} | योग: {p.Yoga} | करण: {p.Karana}\n" +
            $"🌅 सूर्योदय: {p.Sunrise} | सूर्यास्त: {p.Sunset}\n" +
            $"✨ अभिजीत मुहूर्त (शुभ): {p.AbhijitMuhurat} | ⛔ राहुकाल: {p.RahuKaal}\n" +
            (!string.IsNullOrWhiteSpace(p.DailySanskritSutra) ? $"📜 सुभाषित: {p.DailySanskritSutra} — {p.DailySutraMeaning}" : string.Empty),
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(isHindi
                ? $"🙏 हर हर महादेव! आज का पूरा पंचांग, चौघड़िया और आपके शहर का शुभ मुहूर्त यहाँ देखें 👇\n🔗 {primaryLink}\n\nकमेंट में 'हर हर महादेव' लिखें!"
                : $"🙏 Check today's full Choghadiya, city-wise Panchang & Festival calendar here 👇\n🔗 {primaryLink}",
                links)
            : null;

        return new ComposedAutomationContent(
            $"panchang:{p.DateKey}",
            $"Panchang {p.DateKey} - {p.Tithi}",
            $"{p.Vaara} • {p.Tithi} • {p.Nakshatra}",
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static IReadOnlyList<ComposedAutomationContent> ComposeFestivals(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        if (!DateOnly.TryParse(dateKey, out var targetDate)) targetDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var lead = Math.Clamp(rule.FestivalLeadDays, 0, 7);

        var matching = signals.UpcomingFestivals
            .Where(f => DateOnly.TryParse(f.DateKey, out var fDate)
                        && fDate >= targetDate
                        && fDate <= targetDate.AddDays(lead))
            .OrderByDescending(f => f.IsMajorFestival)
            .ThenBy(f => f.DateKey)
            .Take(2)
            .ToList();

        if (matching.Count == 0) return [];

        return [.. matching.Select(f =>
        {
            var isToday = string.Equals(f.DateKey, dateKey, StringComparison.OrdinalIgnoreCase);
            var whenLabel = isToday ? (isHindi ? "आज" : "Today") : f.DateKey;
            var displayName = !string.IsNullOrWhiteSpace(f.NameHindi) ? $"{f.NameHindi} ({f.NameEnglish})" : f.NameEnglish;

            var title = isHindi
                ? Truncate($"{whenLabel} {f.NameHindi} | व्रत विधि, शुभ मुहूर्त & महत्व • {f.NameEnglish}", MaxTitleLength)
                : Truncate($"{whenLabel}: {f.NameEnglish} | Puja Vidhi, Significance & Auspicious Time", MaxTitleLength);

            var script = isHindi
                ? $"""
                   [HOOK 0-4s] जय श्री हरि! {whenLabel} ({f.DateKey}) को पावन पर्व {displayName} है। आइए जानते हैं इसकी सरल पूजा विधि और विशेष लाभ।
                   [BODY 4-40s]
                   • पावन तिथि: {f.Tithi ?? "पवित्र तिथि"} ({f.MonthVedic ?? "वैदिक मास"})
                   • महत्व: {f.Description}
                   • पूजा व व्रत नियम: {f.RitualsAndPujaVidhi ?? f.FastingRules ?? "प्रातः स्नान के बाद दीप प्रज्वलन और भगवान का स्मरण करें।"}
                   [WEBSITE CTA 40-52s] पूरी व्रत कथा, आरती, और सटीक पारण/पूजा समय देखने के लिए पिन कमेंट के लिंक पर क्लिक करें: {primaryLink}
                   """
                : $"""
                   [HOOK 0-4s] {whenLabel} marks the sacred occasion of {displayName}!
                   [BODY 4-40s]
                   • Sacred Tithi: {f.Tithi ?? "Auspicious Vedic Date"} ({f.MonthVedic ?? "Hindu Calendar"})
                   • Why it matters: {f.Description}
                   • Puja Vidhi & Observance: {f.RitualsAndPujaVidhi ?? f.FastingRules ?? "Morning prayers, diya lighting, and mindful charity."}
                   [WEBSITE CTA 40-52s] Read the full Puja Vidhi & Muhurat table on our Panchang website: {primaryLink}
                   """;

            var prompt = ApplyPromptOverride(rule,
                $"Create a serene devotional {ratioLabel} featuring '{f.NameEnglish}', traditional diyas, marigold garlands, sacred temple sanctum glow, gentle incense smoke, traditional oil-painting + cinematic light beams celebrating '{displayName}'.");

            var thumbPrompt = $"Vibrant Hindu festival artwork for {f.NameEnglish}, glowing diyas, sacred deity aura, bold space for '{f.NameHindi}' & '{f.DateKey}'.";

            var tags = MergeTags([f.NameEnglish, f.NameHindi, f.Category ?? "Hindu Festival", "Vrat Vidhi", "Puja Muhurat", "Hindu Calendar", "Sanatan"], baseTags, baseHashtags);
            var description = BuildDescription(rule,
                $"🪔 पर्व / Festival: {displayName}\n" +
                $"📆 दिनांक: {f.DateKey} | तिथि: {f.Tithi ?? "विशेष"}\n" +
                $"📖 महत्व: {f.Description}\n" +
                (!string.IsNullOrWhiteSpace(f.RitualsAndPujaVidhi) ? $"🙏 पूजा विधि: {f.RitualsAndPujaVidhi}\n" : string.Empty) +
                (!string.IsNullOrWhiteSpace(f.FastingRules) ? $"✨ नियम: {f.FastingRules}" : string.Empty),
                links, tags);

            var comment = rule.IncludePinnedComment
                ? BuildPinnedComment($"🪔 {displayName} की संपूर्ण पूजा विधि और शुभ मुहूर्त यहाँ देखें 👇\n🔗 {primaryLink}", links)
                : null;

            return new ComposedAutomationContent(
                $"festival:{f.DateKey}:{f.Id}",
                displayName,
                f.Description,
                title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
        })];
    }

    private static ComposedAutomationContent ComposeDailyKatha(
        AutomationRule rule,
        EcosystemDailyKathaSignal k,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var title = isHindi
            ? Truncate($"{k.Title} | {k.DeityOrSage} की पावन कथा & जीवन मंत्र • {dateKey}", MaxTitleLength)
            : Truncate($"{k.Title} | Sacred Story of {k.DeityOrSage} & Daily Wisdom", MaxTitleLength);

        var script = isHindi
            ? $"""
               [HOOK 0-4s] क्या आप जानते हैं {k.DeityOrSage} से जुड़ा यह पावन प्रसंग जीवन की दिशा कैसे बदल सकता है?
               [STORY 4-42s]
               {k.StorySummary}
               • जीवन संदेश: {k.MoralTeaching ?? "सत्य, भक्ति और धैर्य से असंभव भी संभव हो जाता है।"}
               • आज का मंत्र: {k.SanskritMantra ?? "ॐ नमो भगवते वासुदेवाय"}
               [WEBSITE CTA 42-55s] आज का पूरा पंचांग, कथा और संस्कृत सुभाषित पढ़ने के लिए डिस्क्रिप्शन लिंक पर जाएं: {primaryLink}
               """
            : $"""
               [HOOK 0-4s] Here is today's sacred story from Indian wisdom: {k.Title}.
               [STORY 4-42s]
               {k.StorySummary}
               • Takeaway: {k.MoralTeaching ?? "Faith anchored in dharma brings clarity under pressure."}
               • Sacred Mantra: {k.SanskritMantra ?? "Om Shanti"}
               [WEBSITE CTA 42-55s] Read full stories & daily Vedic Panchang at: {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Generate an ethereal classical Indian spiritual painting in {ratioLabel} depicting '{k.Title}' featuring {k.DeityOrSage}: luminous golden temple architecture, peacock feathers, divine aura, smooth camera push-in, deeply respectful Puranic aesthetic.");

        var thumbPrompt = $"Epic Indian devotional painting of {k.DeityOrSage} symbolizing '{k.Title}', celestial warm lighting, space for bold Hindi/English hook.";
        var tags = MergeTags([k.DeityOrSage, k.Title, "Vedic Katha", "Puranic Story", "Sanatan Wisdom", "Daily Katha", "Shorts"], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"📿 आज की कथा: {k.Title}\n" +
            $"🙏 {k.DeityOrSage}\n" +
            $"{k.StorySummary}\n" +
            (!string.IsNullOrWhiteSpace(k.MoralTeaching) ? $"💡 शिक्षा: {k.MoralTeaching}\n" : string.Empty) +
            (!string.IsNullOrWhiteSpace(k.SanskritMantra) ? $"🕉️ मंत्र: {k.SanskritMantra}" : string.Empty),
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"🙏 {k.SanskritMantra ?? "हर हर महादेव"}\nपूरी कथा व दैनिक पंचांग पढ़ने के लिए 👇\n🔗 {primaryLink}", links)
            : null;

        return new ComposedAutomationContent(
            $"katha:{dateKey}:{k.Id ?? k.Title}",
            k.Title,
            $"{k.DeityOrSage} — {k.MoralTeaching}",
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static IReadOnlyList<ComposedAutomationContent> ComposeHistorical(
        AutomationRule rule,
        IReadOnlyList<EcosystemHistoricalSignal> incidents,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var leadIncident = incidents[0];
        var secondary = incidents.Skip(1).Take(2).ToList();
        var bulletSummary = string.Join("\n", incidents.Take(3).Select(i => $"• {i.Year}: {i.Title} — {i.Description}"));

        var title = isHindi
            ? Truncate($"आज का इतिहास ({dateKey}) | {leadIncident.Year}: {leadIncident.Title}", MaxTitleLength)
            : Truncate($"On This Day ({dateKey}) | {leadIncident.Year}: {leadIncident.Title}", MaxTitleLength);

        var script = isHindi
            ? $"""
               [HOOK 0-4s] {dateKey} — इतिहास के पन्नों में आज का दिन क्यों बेहद खास है? आइए जानते हैं {leadIncident.Year} की ऐतिहासिक घटना!
               [STORY 4-42s]
               {leadIncident.Year} में आज ही के दिन: {leadIncident.Title}।
               {leadIncident.Description}
               {(string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? "" : $"प्रभाव: {leadIncident.CulturalSignificance}")}
               {(secondary.Count > 0 ? "\nआज की अन्य प्रमुख घटनाएं:\n" + string.Join("\n", secondary.Select(s => $"• {s.Year}: {s.Title}")) : "")}
               [WEBSITE CTA 42-55s] इतिहास की पूरी टाइमलाइन, एग्जाम नोट्स और क्विज़ प्रैक्टिस के लिए हमारी वेबसाइट देखें: {primaryLink}
               """
            : $"""
               [HOOK 0-4s] What happened on this exact date ({dateKey}) that changed world & Indian history?
               [STORY 4-42s]
               Back in {leadIncident.Year}: {leadIncident.Title}.
               {leadIncident.Description}
               {(string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? "" : $"Why it shaped today: {leadIncident.CulturalSignificance}")}
               {(secondary.Count > 0 ? "\nAlso on this date:\n" + string.Join("\n", secondary.Select(s => $"• {s.Year}: {s.Title}")) : "")}
               [WEBSITE CTA 42-55s] Explore the full interactive Aaj Ka Itihaas archive & exam GK notes on our portal: {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Create a compelling documentary {ratioLabel} depicting '{leadIncident.Year}: {leadIncident.Title}' in historical cinematic realism: archival paper textures, dramatic chiaroscuro lighting, animated world map highlights showing India & global context, smooth parallax motion, crisp typography space for '{leadIncident.Year}'.");

        var thumbPrompt = $"Dramatic historical documentary thumbnail showing '{leadIncident.Year}: {leadIncident.Title}', vintage gold-sepia meets high-contrast cinematic teal, clean space for large date '{leadIncident.Year}'.";

        var tags = MergeTags(["On This Day", "Aaj Ka Itihaas", $"History {leadIncident.Year}", leadIncident.Category, "World History", "Indian History", "UPSC GK", "Shorts"], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"🌍 आज का इतिहास / On This Day ({dateKey})\n" +
            bulletSummary +
            (!string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? $"\n\n✨ महत्व: {leadIncident.CulturalSignificance}" : string.Empty),
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"📚 {dateKey} की सभी ऐतिहासिक घटनाएं और डेली GK क्विज़ यहाँ पढ़ें 👇\n🔗 {primaryLink}\n\nआपके हिसाब से आज की सबसे महत्वपूर्ण घटना कौन सी थी?", links)
            : null;

        return
        [
            new ComposedAutomationContent(
                $"history:{dateKey}:{leadIncident.Year}:{leadIncident.Title}",
                $"{leadIncident.Year} — {leadIncident.Title}",
                leadIncident.Description,
                title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links)
        ];
    }

    private static ComposedAutomationContent ComposePratiyogita(
        AutomationRule rule,
        IReadOnlyList<EcosystemCompetitionSignal> competitions,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var top = competitions[0];
        var title = isHindi
            ? Truncate($"प्रज्ञा / प्रतियोगिता अलर्ट: {top.Title} | अभी हिस्सा लें! ({dateKey})", MaxTitleLength)
            : Truncate($"Competition & Quiz Spotlight: {top.Title} | Register & Win", MaxTitleLength);

        var script = isHindi
            ? $"""
               [HOOK 0-4s] क्या आप अपनी तैयारी और नॉलेज को आज़माना चाहते हैं? सुनहरा मौका आ गया है!
               [DETAILS 4-40s]
               • प्रतियोगिता: {top.Title} ({top.Category})
               • स्टेटस: {top.Status}{(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $" | अंतिम तिथि: {top.DeadlineLabel}")}
               {(string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? "" : $"• खास बात: {top.PrizeOrHighlight}")}
               [CTA 40-55s] अभी फ्री रजिस्टर करने, लीडरबोर्ड और प्रैक्टिस सेट देखने के लिए पिन कमेंट के लिंक पर क्लिक करें: {primaryLink}
               """
            : $"""
               [HOOK 0-4s] Ready to test your skills and compete nationwide?
               [DETAILS 4-40s]
               • Event: {top.Title} ({top.Category}) — Status: {top.Status}
               {(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $"• Deadline: {top.DeadlineLabel}")}
               {(string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? "" : $"• Highlight: {top.PrizeOrHighlight}")}
               [CTA 40-55s] Join now & explore live competitions via the link in the pinned comment: {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Modern crisp energetic motion-graphic {ratioLabel} announcing '{top.Title}', electric indigo & emerald HUD accents, trophy emblem, fast upbeat transitions.");

        var thumbPrompt = $"Modern vibrant quiz & competition poster background for '{top.Title}', clean trophy glow, sharp typography space.";
        var tags = MergeTags(["Pratiyogita", top.Category, "Quiz", "Students", "Competition", "GK Challenge"], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"🏆 Featured Competition: {top.Title}\n" +
            $"📌 Category: {top.Category} | Status: {top.Status}\n" +
            (!string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? $"✨ {top.PrizeOrHighlight}" : string.Empty),
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"🎯 अभी भाग लें और अपनी रैंक चेक करें 👇\n🔗 {primaryLink}", links)
            : null;

        return new ComposedAutomationContent(
            $"pratiyogita:{dateKey}:{top.Id}",
            top.Title,
            top.PrizeOrHighlight ?? top.Category,
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static ComposedAutomationContent ComposeEcosystemSpotlight(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        StudioEcosystemConfig ecosystem,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var panchangNote = signals.Panchang is { } p ? $"Today's Tithi: {p.Tithi}" : $"Daily AI & Creator Hub ({dateKey})";
        var title = isHindi
            ? Truncate($"AI से ऑटो-वीडियो और YouTube ग्रोथ टूल्स | {ecosystem.StudioTitle} ({dateKey})", MaxTitleLength)
            : Truncate($"Automate AI Videos, Daily Panchang & Creator Growth Tools ({dateKey})", MaxTitleLength);

        var script = isHindi
            ? $"""
               [HOOK 0-4s] क्या आप हर दिन बिना घंटों एडिटिंग किए प्रोफेशनल AI वीडियो, शॉर्ट्स और चैनल ग्रोथ एनालिटिक्स चाहते हैं?
               [BODY 4-42s]
               हमारे ऑल-इन-वन क्रिएटर इकोसिस्टम पर आज ही एक्सप्लोर करें:
               • AI स्टोरी व शॉर्ट्स जनरेटर ({ecosystem.StudioTitle})
               • लाइव YouTube ग्रोथ और RPM कैलकुलेटर
               • आज का सटीक वैदिक पंचांग ({panchangNote}) और डेली इतिहास
               [CTA 42-55s] सभी फ्री टूल्स और वेबसाइट लिंक्स पिन कमेंट और डिस्क्रिप्शन में हैं: {primaryLink}
               """
            : $"""
               [HOOK 0-4s] Want AI storytelling, daily Vedic knowledge, and creator analytics in one unified workspace?
               [BODY 4-42s]
               Explore our creator platform: automated AI stories & Shorts ({ecosystem.StudioTitle}), YouTube RPM & Growth Advisor, daily Panchang ({panchangNote}), and interactive quizzes.
               [CTA 42-55s] Try all tools directly via our ecosystem links below: {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Futuristic creator workstation montage in {ratioLabel}: sleek dark glowing dashboard screens rendering animated stories, analytics charts rising upward, warm holographic accents.");

        var thumbPrompt = $"Futuristic AI creator studio workstation thumbnail, glowing timeline + rising analytics arrows, bold modern contrast.";
        var tags = MergeTags(["AI Video", "Creator Tools", "YouTube Growth", "Automation", ecosystem.EngineName], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"🚀 Explore the complete creator & culture web ecosystem ({dateKey}):\n" +
            "AI Video & Shorts Creation • Real-Time Panchang & History • YouTube Growth & Traffic Funnels",
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"🚀 आज ही ट्राई करें — सारे क्रिएटर टूल्स और लाइव वेब ऐप्स 👇\n🔗 {primaryLink}", links)
            : null;

        return new ComposedAutomationContent(
            $"ecosystem:{dateKey}:{rule.Id}",
            ecosystem.StudioTitle,
            panchangNote,
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static ComposedAutomationContent ComposeCustom(
        AutomationRule rule,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var topicSeed = !string.IsNullOrWhiteSpace(rule.CustomTopicPrompt) ? rule.CustomTopicPrompt!.Trim() : rule.Name;
        var title = Truncate($"{topicSeed} ({dateKey})", MaxTitleLength);

        var script = isHindi
            ? $"[HOOK 0-4s] {topicSeed} पर आज की विशेष प्रस्तुति।\n[BODY 4-42s] मुख्य विषय: {rule.Description ?? topicSeed}।\n[CTA 42-55s] अधिक जानकारी के लिए वेबसाइट पर जाएं: {primaryLink}"
            : $"[HOOK 0-4s] Today's feature spotlight: {topicSeed}.\n[BODY 4-42s] {rule.Description ?? topicSeed}\n[CTA 42-55s] Explore more on our website: {primaryLink}";

        var prompt = ApplyPromptOverride(rule,
            $"Cinematic {ratioLabel} illustrating '{topicSeed}': cohesive visual storytelling, crisp lighting, atmospheric music vibe.");

        var thumbPrompt = $"Clean striking thumbnail centered on '{topicSeed}', atmospheric depth and bold readability.";
        var tags = MergeTags([topicSeed, "Shorts", "DailyUpdate"], baseTags, baseHashtags);
        var description = BuildDescription(rule, $"{topicSeed}\n{rule.Description}", links, tags);
        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"🔗 और देखें / Learn more 👇\n{primaryLink}", links)
            : null;

        return new ComposedAutomationContent(
            $"custom:{dateKey}:{rule.Id}",
            topicSeed,
            rule.Description,
            title, script, prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static IReadOnlyList<AutomationWebsiteLink> BuildTrackedLinks(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        StudioEcosystemConfig ecosystem,
        string dateKey)
    {
        var campaign = $"auto_{rule.SourceType.ToString().ToLowerInvariant()}_{dateKey.Replace("-", string.Empty)}";
        var content = SanitizeUtmValue(rule.TargetChannelHandle ?? rule.TargetChannelTitle ?? "channel");

        var wantedKeys = rule.FunnelWebsiteKeys.Count > 0
            ? rule.FunnelWebsiteKeys
            : DefaultKeysForSource(rule.SourceType);

        var result = new List<AutomationWebsiteLink>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(rule.SocialFunnelSlug)
            && signals.FunnelCampaigns.FirstOrDefault(c =>
                string.Equals(c.Slug, rule.SocialFunnelSlug.Trim(), StringComparison.OrdinalIgnoreCase)) is { } matchedCampaign
            && seen.Add(matchedCampaign.DestinationUrl))
        {
            var tracked = AppendUtm(matchedCampaign.DestinationUrl, campaign, content);
            result.Add(new AutomationWebsiteLink
            {
                Key = matchedCampaign.Slug,
                Label = string.IsNullOrWhiteSpace(matchedCampaign.CallToActionText) ? matchedCampaign.Title : matchedCampaign.CallToActionText,
                BaseUrl = matchedCampaign.DestinationUrl,
                TrackedUrl = tracked
            });
        }

        foreach (var key in wantedKeys)
        {
            var site = ecosystem.Websites.FirstOrDefault(w =>
                string.Equals(w.Key, key, StringComparison.OrdinalIgnoreCase));
            if (site is null || string.IsNullOrWhiteSpace(site.Url) || !seen.Add(site.Url)) continue;

            var targetBase = key.Equals("panchang", StringComparison.OrdinalIgnoreCase) && rule.SourceType == AutomationSourceType.AajKaItihaas
                ? site.Url.TrimEnd('/') + "/aaj-ka-itihaas"
                : key.Equals("panchang", StringComparison.OrdinalIgnoreCase) && rule.SourceType == AutomationSourceType.HinduFestival
                    ? site.Url.TrimEnd('/') + "/festivals"
                    : site.Url;

            result.Add(new AutomationWebsiteLink
            {
                Key = site.Key,
                Label = site.Name,
                BaseUrl = targetBase,
                TrackedUrl = AppendUtm(targetBase, campaign, content)
            });
        }

        if (result.Count == 0)
        {
            foreach (var site in ecosystem.Websites.Take(2))
            {
                if (!seen.Add(site.Url)) continue;
                result.Add(new AutomationWebsiteLink
                {
                    Key = site.Key,
                    Label = site.Name,
                    BaseUrl = site.Url,
                    TrackedUrl = AppendUtm(site.Url, campaign, content)
                });
            }
        }

        return result;
    }

    private static IReadOnlyList<string> DefaultKeysForSource(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha
            => ["panchang", "studio"],
        AutomationSourceType.AajKaItihaas
            => ["panchang", "blog", "pratiyogita", "studio"],
        AutomationSourceType.Pratiyogita
            => ["pratiyogita", "social", "studio"],
        _ => ["studio", "social", "panchang", "blog"]
    };

    private static string BuildDescription(
        AutomationRule rule,
        string coreBody,
        IReadOnlyList<AutomationWebsiteLink> links,
        IReadOnlyList<string> tags)
    {
        var sb = new StringBuilder();
        sb.AppendLine(coreBody.Trim());
        sb.AppendLine();

        if (links.Count > 0)
        {
            sb.AppendLine("🌐 Official Website & Resources (Visit for full details):");
            foreach (var link in links)
            {
                sb.AppendLine($"👉 {link.Label}: {link.TrackedUrl}");
            }
            sb.AppendLine();
        }

        if (!string.IsNullOrWhiteSpace(rule.DescriptionFooterOverride))
        {
            sb.AppendLine(rule.DescriptionFooterOverride.Trim());
            sb.AppendLine();
        }

        var hashLine = string.Join(" ", tags.Take(10).Select(t => "#" + new string([.. t.Where(char.IsLetterOrDigit)])));
        if (!string.IsNullOrWhiteSpace(hashLine))
        {
            sb.AppendLine(hashLine.Trim());
        }

        return sb.ToString().Trim();
    }

    private static string BuildPinnedComment(string headline, IReadOnlyList<AutomationWebsiteLink> links)
    {
        if (links.Count <= 1) return headline;
        var extra = string.Join("\n", links.Skip(1).Take(2).Select(l => $"• {l.Label}: {l.TrackedUrl}"));
        return $"{headline}\n\n{extra}".Trim();
    }

    private static EcosystemChannelItem? ResolveChannelMeta(AutomationRule rule, StudioEcosystemConfig ecosystem)
    {
        if (ecosystem.Channels.Count == 0) return null;
        return ecosystem.Channels.FirstOrDefault(c =>
                   (!string.IsNullOrWhiteSpace(rule.TargetChannelId) && string.Equals(c.ChannelId, rule.TargetChannelId, StringComparison.OrdinalIgnoreCase))
                   || (!string.IsNullOrWhiteSpace(rule.TargetChannelHandle) && string.Equals(c.Handle, rule.TargetChannelHandle, StringComparison.OrdinalIgnoreCase)))
               ?? ecosystem.Channels.FirstOrDefault(c => c.IsPrimary);
    }

    private static List<string> MergeTags(IEnumerable<string> signalTags, IReadOnlyList<string> channelTags, IReadOnlyList<string> channelHashtags)
    {
        var merged = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in signalTags.Concat(channelTags).Concat(channelHashtags))
        {
            var cleaned = raw?.Trim().TrimStart('#');
            if (string.IsNullOrWhiteSpace(cleaned) || cleaned.Length > 45) continue;
            if (seen.Add(cleaned)) merged.Add(cleaned);
            if (merged.Count >= MaxTagCount) break;
        }
        return merged;
    }

    private static string ApplyPromptOverride(AutomationRule rule, string generated) =>
        string.IsNullOrWhiteSpace(rule.PromptTemplateOverride)
            ? generated
            : $"{rule.PromptTemplateOverride.Trim()}\n\n{generated}";

    private static string AppendUtm(string url, string campaign, string content)
    {
        var sep = url.Contains('?') ? "&" : "?";
        return $"{url}{sep}utm_source=youtube&utm_medium=automation&utm_campaign={Uri.EscapeDataString(campaign)}&utm_content={Uri.EscapeDataString(content)}";
    }

    private static string SanitizeUtmValue(string raw)
    {
        var chars = raw.Trim().TrimStart('@').Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_').ToArray();
        return chars.Length > 0 ? new string(chars).ToLowerInvariant() : "creator";
    }

    private static string Truncate(string input, int maxLen) =>
        input.Length <= maxLen ? input : input[..(maxLen - 1)].TrimEnd() + "…";
}
