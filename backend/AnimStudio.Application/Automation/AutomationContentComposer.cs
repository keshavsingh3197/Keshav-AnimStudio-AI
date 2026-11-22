using System.Text;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
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
    IReadOnlyList<AutomationWebsiteLink> TrackedLinks,
    string? CommunityPostText = null,
    IReadOnlyList<string>? CommunityPollOptions = null,
    string? HeaderBannerText = null,
    string? EventColorHex = null,
    string? EventDateKey = null);

/// <summary>
/// Builds rich bilingual YouTube & Shorts packages (Title, Narration Script, AI Video Prompt,
/// AI Thumbnail Prompt, SEO Description with tracked UTM & funnel links, Pinned Comment, Tags)
/// purely from dynamic live ecosystem signals and Central Admin website/channel metadata.
/// Zero channel URLs or brand constants are hardcoded here.
/// </summary>
public static class AutomationContentComposer
{
    private const int MaxTitleLength = 95;
    private const int MaxTagCount = 26;

    public static IReadOnlyList<ComposedAutomationContent> ComposeForRule(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        StudioEcosystemConfig ecosystem)
    {
        var dateKey = string.IsNullOrWhiteSpace(signals.DateKey)
            ? DateTime.UtcNow.ToString("yyyy-MM-dd")
            : signals.DateKey;

        var isHindi = !string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase);
        var ratioLabel = rule.VideoFormat switch
        {
            AutomationVideoFormat.Wide => "16:9 widescreen cinematic",
            AutomationVideoFormat.CommunityPost => "1:1 square YouTube Community card",
            _ => "9:16 vertical short reel"
        };

        var links = BuildTrackedLinks(rule, signals, ecosystem, dateKey);
        var primaryLink = links.FirstOrDefault()?.TrackedUrl ?? ecosystem.StudioUrl;

        var channelMeta = ResolveChannelMeta(rule, ecosystem);
        var baseTags = channelMeta?.Tags ?? [];
        var baseHashtags = channelMeta?.Hashtags ?? [];

        IReadOnlyList<ComposedAutomationContent> items = rule.SourceType switch
        {
            AutomationSourceType.HinduPanchang when signals.Panchang is { } p =>
                [ComposePanchang(rule, p, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

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

            AutomationSourceType.FunnyComedy =>
                [ComposeFunnyComedy(rule, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            AutomationSourceType.DailyRashifal =>
                ComposeDailyRashifal(rule, signals, links, primaryLink, isHindi),

            AutomationSourceType.DevotionalPrarthana =>
                [ComposeDevotionalPrarthana(rule, dateKey, links, primaryLink, baseTags, baseHashtags, ratioLabel, isHindi)],

            _ => []
        };

        var palette = ProceduralEventPalette.Resolve(rule.SourceType.ToString(), ProceduralSceneTheme.Auto);
        return [.. items.Select(item => EnrichCommunityAndTemplateMetadata(item, rule, palette, dateKey, isHindi))];
    }

    private static bool IsFullStoryMode(AutomationRule rule) =>
        rule.NarrativeMode == AutomationNarrativeMode.FullStory
        || (rule.NarrativeMode != AutomationNarrativeMode.ShortReel
            && (rule.TargetSeconds >= 95 || rule.VideoFormat == AutomationVideoFormat.Wide));

    private static ComposedAutomationContent ComposePanchang(
        AutomationRule rule,
        EcosystemPanchangSignal p,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var hasNextTithi = !string.IsNullOrWhiteSpace(p.NextTithi)
            && !string.Equals(p.NextTithi.Trim(), p.Tithi.Trim(), StringComparison.OrdinalIgnoreCase);
        var tithiTitleSuffix = hasNextTithi ? $"{p.Tithi} / {p.NextTithi}" : p.Tithi;
        var tithiDetailHi = string.IsNullOrWhiteSpace(p.TithiEndTime)
            ? (hasNextTithi ? $"{p.Tithi} (उपरांत {p.NextTithi})" : p.Tithi)
            : (hasNextTithi ? $"{p.Tithi} ({p.TithiEndTime} तक, फिर {p.NextTithi})" : $"{p.Tithi} ({p.TithiEndTime} तक)");
        var tithiDetailEn = string.IsNullOrWhiteSpace(p.TithiEndTime)
            ? (hasNextTithi ? $"{p.Tithi} (followed by {p.NextTithi})" : p.Tithi)
            : (hasNextTithi ? $"{p.Tithi} ({p.TithiEndTime}, then {p.NextTithi})" : $"{p.Tithi} ({p.TithiEndTime})");

        var title = isHindi
            ? Truncate($"आज का पंचांग {p.DateKey} | {tithiTitleSuffix} • {p.Nakshatra} • शुभ मुहूर्त व राहुकाल", MaxTitleLength)
            : Truncate($"Today's Hindu Panchang {p.DateKey} | {tithiTitleSuffix}, {p.Nakshatra} & Shubh Muhurat", MaxTitleLength);

        var (speakerA, speakerB) = ResolveSpeakerPair(rule, title, null, isHindi);
        var sutraLine = !string.IsNullOrWhiteSpace(p.DailySanskritSutra)
            ? $"\n[{speakerA}]: (praying) आज का पावन संस्कृत सूत्र भी याद रखें — {p.DailySanskritSutra}। अर्थात् {p.DailySutraMeaning}"
            : string.Empty;

        var panIndiaRefHi = IsGenericOrDefaultLocation(p.Location) ? "भारतीय मानक समय (संपूर्ण भारत IST)" : p.Location.Trim();
        var panIndiaRefEn = IsGenericOrDefaultLocation(p.Location) ? "Pan-India (IST Reference)" : p.Location.Trim();
        var isHindiChar = isHindi && rule.EnableCharacterDialogue;
        var fullStory = IsFullStoryMode(rule);
        string script;
        if (isHindiChar)
        {
                  var panchangScriptBody = $"""
                  [सूत्रधार]: (waving) हर हर महादेव! आइए जानते हैं {p.DateKey} का {panIndiaRefHi} के अनुसार संपूर्ण दैनिक पंचांग व शुभ मुहूर्त।
                  [SCENE]: cosmos | dawn | serene
                  [{speakerB}]: (waving) गुरुदेव, आज {p.DateKey} को संपूर्ण भारत में कौन सी पावन तिथि, नक्षत्र और शुभ योग बन रहे हैं?
                  [{speakerA}]: (proud, book) शुभ दिन! आज {p.Vaara ?? "पावन दिवस"}, तिथि {tithiDetailHi}, पक्ष {p.Paksha ?? "शुक्ल/कृष्ण"} व नक्षत्र {p.Nakshatra}{(string.IsNullOrWhiteSpace(p.NakshatraEndTime) ? "" : $" ({p.NakshatraEndTime} तक)")} है। योग {p.Yoga} तथा करण {p.Karana} है।
                  [SCENE]: temple | dawn | glowing
                  [{speakerB}]: (confused) गुरुदेव, आज शुभ कार्य प्रारंभ करने का श्रेष्ठ समय, राहुकाल और शहरों के अनुसार सूर्योदय कैसा रहेगा?
                  [{speakerA}]: (pointing, diya) अभिजीत मुहूर्त {p.AbhijitMuhurat} और ब्रह्म मुहूर्त {p.BrahmaMuhurat} अत्यंत शुभ हैं; राहुकाल {p.RahuKaal} में नया शुभ आरंभ टालें। सूर्योदय लगभग {p.Sunrise} व सूर्यास्त {p.Sunset} (IST मानक) के आसपास रहेगा, जो मुंबई, वाराणसी, जयपुर, कोलकाता और बेंगलुरु जैसे शहरों में कुछ मिनट भिन्न होता है।{sutraLine}
                  [SCENE]: river ghat | dawn | peaceful
                  [सूत्रधार]: (praying, diya) अपने शहर का सटीक सूर्योदय, चौघड़िया और लाइव पंचांग देखने के लिए डिस्क्रिप्शन में दी गई वेबसाइट लिंक पर जरूर जाएं: {primaryLink}
                  """;
            script = fullStory
                ? $"""
                  [सूत्रधार]: (waving) आज {p.DateKey} को {panIndiaRefHi} में नक्षत्र-ग्रहों की स्थिति और शुभ मुहूर्त क्यों विशेष हैं, आइए गुरु और शिष्य के संवाद से पूरा पंचांग समझते हैं।
                  [SCENE]: cosmos | dawn | serene
                  [{speakerB}]: (waving) हर हर महादेव गुरुदेव! आज {p.DateKey} को पंचांग में कौन सा शुभ योग और तिथि बन रही है?
                  [{speakerA}]: (proud, book) शुभ दिन! आज {p.Vaara ?? "पावन दिवस"} है। तिथि {tithiDetailHi} और पक्ष {p.Paksha ?? "शुक्ल/कृष्ण"} रहेगा, जो देशभर में मान्य है।
                  [SCENE]: temple | dawn | glowing
                  [{speakerB}]: (confused) आचार्य, दैनिक पूजा व कार्य सिद्धि के लिए आज का नक्षत्र, योग और अलग-अलग शहरों के अनुसार सूर्योदय का समय स्पष्ट बताइए।
                  [{speakerA}]: (praying, diya) आज नक्षत्र {p.Nakshatra}{(string.IsNullOrWhiteSpace(p.NakshatraEndTime) ? "" : $" ({p.NakshatraEndTime} तक)")} है, योग {p.Yoga} तथा करण {p.Karana} है। भारतीय मानक समय अनुसार सूर्योदय लगभग {p.Sunrise} और सूर्यास्त {p.Sunset} के आसपास रहेगा — मुंबई, वाराणसी, जयपुर, पटना, कोलकाता और बेंगलुरु में स्थानीय अंतर कुछ मिनटों का रहता है।
                  [{speakerB}]: (praying) नया शुभ कार्य शुरू करने के लिए आज सबसे श्रेष्ठ मुहूर्त कौन सा रहेगा और किस समय सावधान रहें?
                  [{speakerA}]: (pointing) सर्वोत्तम अभिजीत मुहूर्त {p.AbhijitMuhurat}, ब्रह्म मुहूर्त {p.BrahmaMuhurat} तथा अमृत काल {p.AmritKaal} है। वहीं राहुकाल {p.RahuKaal} रहेगा — इस दौरान बड़े शुभ कार्य टालें।{sutraLine}
                  [SCENE]: river ghat | dawn | peaceful
                  [सूत्रधार]: (praying) आज की जीवन सीख — समय और तिथि के अनुरूप अनुशासित कर्म करने से हर प्रयास सफल व मंगलमय बनता है।
                  [{speakerB}]: (waving) अपने शहर का चौघड़िया, होरा और पूरा पंचांग देखने के लिए डिस्क्रिप्शन में दिए गए हमारे पोर्टल लिंक पर जाएं: {primaryLink}
                  """
                : panchangScriptBody;
        }
        else if (isHindi)
        {
            script = $"""
                [HOOK 0-4s] हर हर महादेव! आइए जानते हैं {p.DateKey} का संपूर्ण भारत (IST मानक) अनुसार दैनिक पंचांग और आज का सबसे शुभ मुहूर्त।
                [CORE PANCHANG 4-35s]
                • तिथि: {tithiDetailHi} | पक्ष: {p.Paksha ?? "शुक्ल/कृष्ण"}
                • नक्षत्र: {p.Nakshatra}{(string.IsNullOrWhiteSpace(p.NakshatraEndTime) ? "" : $" ({p.NakshatraEndTime} तक)")} | योग: {p.Yoga} | करण: {p.Karana}
                • भारतीय मानक समय (IST) सूर्योदय ~{p.Sunrise} | सूर्यास्त ~{p.Sunset} (विभिन्न शहरों में कुछ मिनट का स्थानीय अंतर रहता है)
                • आज का शुभ अभिजीत मुहूर्त: {p.AbhijitMuhurat} | ब्रह्म मुहूर्त: {p.BrahmaMuhurat}
                • सावधान समय (राहुकाल): {p.RahuKaal} — इस दौरान शुभ कार्य व निवेश टालें।{(string.IsNullOrWhiteSpace(p.DailySanskritSutra) ? "" : $"\nआज का श्लोक: {p.DailySanskritSutra} ({p.DailySutraMeaning})")}
                [MORAL] सीख — अनुशासन और शुभ मुहूर्त के अनुसार किया गया कर्म सदैव कल्याणकारी होता है।
                [WEBSITE CTA 35-50s] पूरे दिन का चौघड़िया, होरा और अपने शहर (मुंबई, जयपुर, वाराणसी, पटना, बेंगलुरु, कोलकाता आदि) का सटीक पंचांग देखने के लिए डिस्क्रिप्शन लिंक पर जाएं: {primaryLink}
                """;
        }
        else
        {
            script = fullStory
                ? $"""
                  [Narrator]: Welcome to today's complete Vedic Panchang guide for {p.DateKey} ({panIndiaRefEn}) — let us understand both the sacred timings and the dharma wisdom behind the day.
                  [{speakerB}]: Teacher, what is today's Tithi, Paksha, and planetary alignment for {p.DateKey}?
                  [{speakerA}]: Today is {p.Vaara ?? "a sacred day"} under Tithi {tithiDetailEn}, Nakshatra {p.Nakshatra}, Yoga {p.Yoga}, and Karana {p.Karana}. Standard IST Sunrise is around {p.Sunrise} and Sunset around {p.Sunset}, shifting a few minutes by city.
                  [{speakerB}]: Which windows are most auspicious for prayers, study, and new beginnings, and when should we pause?
                  [{speakerA}]: Abhijit Muhurat ({p.AbhijitMuhurat}), Brahma Muhurat ({p.BrahmaMuhurat}), and Amrit Kaal ({p.AmritKaal}) carry uplifting harmony. Pause important starts during Rahu Kaal ({p.RahuKaal}).
                  [Narrator]: Moral of the day — aligning action with clarity, gratitude, and mindful timing turns ordinary hours into sacred progress.
                  [{speakerB}]: Explore exact city-wise Choghadiya, Sunrise, Hora, Festivals, and Aaj Ka Itihaas directly on our portal: {primaryLink}
                  """
                : $"""
                  [HOOK 0-4s] Namaste! Here is today's authentic Vedic Panchang for {p.DateKey} ({panIndiaRefEn}).
                  [CORE PANCHANG 4-35s]
                  • Tithi: {tithiDetailEn} | Nakshatra: {p.Nakshatra} | Yoga: {p.Yoga} | Karana: {p.Karana}
                  • Standard IST Sunrise: ~{p.Sunrise} | Sunset: ~{p.Sunset} (varies slightly by city)
                  • Best Auspicious Window (Abhijit Muhurat): {p.AbhijitMuhurat}
                  • Brahma Muhurat: {p.BrahmaMuhurat} | Amrit Kaal: {p.AmritKaal}
                  • Avoid Important Starts (Rahu Kaal): {p.RahuKaal}
                  [WEBSITE CTA 35-50s] Check exact city-wise Sunrise, Choghadiya, Hora, and Festivals in the description link: {primaryLink}
                  """;
        }

        var prompt = ApplyPromptOverride(rule,
            $"Create a devotional luminous {ratioLabel} video with glowing golden temple bells, rising morning Surya rays over sacred Ganga ghats, clean Devanagari/English calendar lower-third cards showing Tithi '{p.Tithi}', Nakshatra '{p.Nakshatra}', Abhijit Muhurat '{p.AbhijitMuhurat}', and Rahu Kaal '{p.RahuKaal}'. Warm saffron-gold cinematic color grade, calm spiritual flute + tanpura atmosphere, zero modern logos.");

        var thumbPrompt = $"High-contrast devotional sunrise poster background, radiant temple kalash, warm saffron & gold light, crisp bold text space for '{p.Tithi}' & 'Shubh Muhurat {p.AbhijitMuhurat}', ultra sharp 4K.";

        var tags = MergeTags(["Hindu Panchang", "Aaj Ka Panchang", p.Tithi, p.Nakshatra, "Shubh Muhurat", "Rahu Kaal", "Sanatan Dharma", "Daily Panchang", "Shorts"], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"📅 दिनांक / Date: {p.DateKey} ({panIndiaRefHi})\n" +
            $"🔱 तिथि: {tithiDetailHi} | नक्षत्र: {p.Nakshatra} | योग: {p.Yoga} | करण: {p.Karana}\n" +
            $"🌅 मानक भारतीय समय (IST) सूर्योदय ~{p.Sunrise} | सूर्यास्त ~{p.Sunset}\n" +
            $"🏙️ विभिन्न शहर नोट: तिथि व मुहूर्त पूरे भारत में मान्य हैं; मुंबई, वाराणसी, जयपुर, लखनऊ, पटना, कोलकाता, अहमदाबाद व बेंगलुरु में सूर्योदय/चौघड़िया कुछ मिनट भिन्न होता है — नीचे वेबसाइट पर अपना शहर चुनें!\n" +
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
            $"panchang:{dateKey}",
            $"Panchang {p.DateKey} - {tithiTitleSuffix}",
            $"{p.Vaara} • {tithiDetailEn} • {p.Nakshatra}",
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links, EventDateKey: p.DateKey);
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
            var festLinks = isToday ? links : RetargetLinksDate(links, dateKey, f.DateKey);
            var festPrimaryLink = festLinks.FirstOrDefault()?.TrackedUrl ?? primaryLink;
            var whenLabel = isToday ? (isHindi ? "आज" : "Today") : f.DateKey;
            var displayHindiName = LocalizeFestivalHindiLabel(!string.IsNullOrWhiteSpace(f.NameHindi) ? f.NameHindi : f.NameEnglish);
            var displayName = !string.IsNullOrWhiteSpace(f.NameEnglish) ? $"{displayHindiName} ({f.NameEnglish})" : displayHindiName;

            var title = isHindi
                ? Truncate($"{whenLabel} {displayHindiName} | व्रत विधि, शुभ मुहूर्त व पूजा नियम", MaxTitleLength)
                : Truncate($"{whenLabel}: {f.NameEnglish} | Puja Vidhi, Significance & Auspicious Time", MaxTitleLength);

            var (festA, festB) = ResolveSpeakerPair(rule, title, null, isHindi);
            var festFull = IsFullStoryMode(rule);
            var festDescHi = LocalizeBriefSummaryHindi(f.Description, $"{f.NameHindi} हमें भक्ति, संयम और सकारात्मक ऊर्जा से जोड़ता है।");
            var festVidhiHi = LocalizeBriefSummaryHindi(f.RitualsAndPujaVidhi ?? f.FastingRules, "प्रातः स्नान करके दीप प्रज्वलन करें, श्रद्धा से अर्घ्य और आरती करें तथा सात्विक आचरण रखें।");
            var script = isHindi && rule.EnableCharacterDialogue
                ? (festFull
                    ? $"""
                       [SCENE]: temple | sunset | glowing
                       [सूत्रधार]: (waving, wide) {whenLabel} ({f.DateKey}) को संपूर्ण भारत में {displayName} का पावन पर्व मनाया जा रहा है। आइए जानते हैं इसकी पौराणिक पृष्ठभूमि, संपूर्ण पूजा विधि और आध्यात्मिक संदेश।
                       [{festB}]: (praying, diya) जय श्री हरि पंडित जी! {displayName} किस वैदिक तिथि को आता है और इसके पीछे की कथा व महत्व क्या है?
                       [{festA}]: (proud, book) शुभ कल्याण हो! यह पर्व {f.Tithi ?? "पावन तिथि"} ({f.MonthVedic ?? "वैदिक मास"}) में आता है। {festDescHi}
                       [SCENE]: river ghat | dawn | peaceful
                       [{festB}]: (aarti, diya) घर में भक्ति व श्रद्धा के साथ पूजा और व्रत किस विधि से करना चाहिए?
                       [{festA}]: (praying) {festVidhiHi}
                       [SCENE]: temple | night | radiant
                       [{festB}]: (confused) पंडित जी, इस पर्व का मुख्य जीवन संदेश क्या है जो हर परिवार को अपनाना चाहिए?
                       [{festA}]: (praying, closeUpSpeaker) हर व्रत-त्योहार हमें संयम, कृतज्ञता, परोपकार और सत्य के मार्ग पर स्थिर रहने की प्रेरणा देता है।
                       [सूत्रधार]: (praying, wide) आज की सीख — जब पर्व बाहरी उत्सव के साथ भीतर करुणा और अनुशासन जगाए, तभी सच्चा आशीर्वाद प्राप्त होता है। संपूर्ण व्रत कथा व आरती समय देखें: {festPrimaryLink}
                       """
                    : $"""
                       [SCENE]: temple | sunset | glowing
                       [सूत्रधार]: (waving, wide) {whenLabel} ({f.DateKey}) को {displayName} का पावन पर्व है — आइए जानें इसका महत्व व पूजा विधि।
                       [{festB}]: (aarti, diya) हर हर महादेव पंडित जी! {displayName} का विशेष पौराणिक महत्व क्या है?
                       [{festA}]: (proud, book) यह पर्व {f.Tithi ?? "पावन तिथि"} ({f.MonthVedic ?? "वैदिक मास"}) में आता है। {festDescHi}
                       [SCENE]: forest ashram | dawn | peaceful
                       [{festB}]: (praying) आज पूजा और व्रत किस विधि से करना सबसे फलदायी रहेगा?
                       [{festA}]: (praying, diya) {festVidhiHi}
                       [सूत्रधार]: (praying, wide) जीवन सीख — श्रद्धा, संयम और सद्भावना से मनाया गया पर्व पूरे परिवार में मंगल लाता है। संपूर्ण व्रत कथा व पारण समय देखें: {festPrimaryLink}
                       """)
                : isHindi
                    ? $"""
                       [HOOK 0-4s] जय श्री हरि! {whenLabel} ({f.DateKey}) को पावन पर्व {displayName} है। आइए जानते हैं इसकी सरल पूजा विधि और विशेष लाभ।
                       [BODY 4-40s]
                       • पावन तिथि: {f.Tithi ?? "पवित्र तिथि"} ({f.MonthVedic ?? "वैदिक मास"})
                       • महत्व: {f.Description}
                       • पूजा व व्रत नियम: {f.RitualsAndPujaVidhi ?? f.FastingRules ?? "प्रातः स्नान के बाद दीप प्रज्वलन और भगवान का स्मरण करें।"}
                       [MORAL] सीख — भक्ति, संयम और करुणा हर पर्व को सार्थक बनाते हैं।
                       [WEBSITE CTA 40-52s] पूरी व्रत कथा, आरती, और सटीक पारण/पूजा समय देखने के लिए पिन कमेंट के लिंक पर क्लिक करें: {festPrimaryLink}
                       """
                    : $"""
                       [HOOK 0-4s] {whenLabel} marks the sacred occasion of {displayName}! Let us explore its story, rituals, and lasting wisdom.
                       [BODY 4-40s]
                       • Sacred Tithi: {f.Tithi ?? "Auspicious Vedic Date"} ({f.MonthVedic ?? "Hindu Calendar"})
                       • Why it matters: {f.Description}
                       • Puja Vidhi & Observance: {f.RitualsAndPujaVidhi ?? f.FastingRules ?? "Morning prayers, diya lighting, and mindful charity."}
                       [MORAL] Takeaway — Sacred festivals remind us to cultivate gratitude, discipline, and kindness toward all beings.
                       [WEBSITE CTA 40-52s] Read the full Puja Vidhi & Muhurat table on our Panchang website: {festPrimaryLink}
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
                festLinks, tags);

            var comment = rule.IncludePinnedComment
                ? BuildPinnedComment($"🪔 {displayName} की संपूर्ण पूजा विधि और शुभ मुहूर्त यहाँ देखें 👇\n🔗 {festPrimaryLink}", festLinks)
                : null;

            return new ComposedAutomationContent(
                $"festival:{f.DateKey}:{f.Id}",
                displayName,
                f.Description,
                title, script.Trim(), prompt, thumbPrompt, description, comment, tags, festPrimaryLink, festLinks, EventDateKey: f.DateKey);
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
        var (speakerA, speakerB) = ResolveSpeakerPair(rule, k.Title, k.DeityOrSage, isHindi);
        string title;
        string script;

        if (isHindi)
        {
            (title, script) = BuildHindiKathaPackage(rule, k, dateKey, primaryLink, speakerA, speakerB);
        }
        else
        {
            title = Truncate($"{k.Title} | Sacred Story of {k.DeityOrSage} & Daily Wisdom", MaxTitleLength);
            var mantraEn = k.SanskritMantra ?? "Om Namo Bhagavate Vasudevaya";
            var moralEn = k.MoralTeaching ?? "Faith anchored in dharma and perseverance brings clarity and divine grace.";
            script = IsFullStoryMode(rule)
                ? $"""
                   [Narrator]: Before the legend begins, let us step into the world of {k.Title} ({k.DeityOrSage}) — why it began and how one moment of resolve changed destiny forever.
                   [{speakerA}]: {k.StorySummary}
                   [{speakerB}]: Yet when hardship appears and no earthly comfort remains, what truly guides a seeker forward?
                   [{speakerA}]: Surrender without bitterness, courage without pride, and unwavering remembrance of the Divine.
                   [{speakerB}]: Meditate deeply upon the sacred chant — {mantraEn}.
                   [{speakerA}]: Steadfast devotion opens doors no obstacle in all the worlds can shut.
                   [Narrator]: Moral of the story — {moralEn} Reflect gently on how this timeless lesson speaks to your own challenges today.
                   [{speakerB}]: Explore complete Pauranik Katha stories & daily Vedic Panchang on our portal: {primaryLink}
                   """
                : $"""
                   [Narrator]: Today we bring you a living sacred story — {k.Title}.
                   [{speakerA}]: {k.StorySummary}
                   [{speakerB}]: Remember the timeless lesson: {moralEn}
                   [{speakerA}]: Chant together with devotion — {mantraEn}.
                   [Narrator]: Moral — {moralEn} Explore full Pauranik Katha dialogues & daily Panchang: {primaryLink}
                   """;
        }

        var visualSubject = string.IsNullOrWhiteSpace(k.DeityOrSage) ? speakerA : k.DeityOrSage;
        var prompt = ApplyPromptOverride(rule,
            $"Create an attractive classical Indian multi-scene spiritual animation in {ratioLabel} depicting '{k.Title}' with characters {speakerA} and {speakerB} ({visualSubject}): act 1 sacred Madhuvan forest ashram at dawn with lotus pond and swaying temple bells, act 2 radiant guru-shishya mantra initiation with golden light orbs, act 3 steadfast tapasya glow culminating in eternal starlight & flower petals blessing. Expressive talking characters, rich depth, zero text watermarks.");

        var thumbPrompt = $"Epic Indian devotional artwork with {speakerA} and {speakerB}, golden celestial glow and sacred temple horizon, crisp dark vignette space on the left for large gold Hindi headline, zero text";
        var formatTag = IsFullStoryMode(rule) || rule.VideoFormat == AutomationVideoFormat.Wide ? "Full Katha Video" : "Shorts";
        var tags = MergeTags([visualSubject, speakerA, speakerB, "Vedic Katha", "Pauranik Katha", "Hindi Kahani", "Sanatan Wisdom", "Daily Katha", formatTag], baseTags, baseHashtags);
        var hindiSummary = isHindi ? LocalizeBriefSummaryHindi(k.StorySummary, $"{speakerA} और {speakerB} की पावन भक्ति कथा।") : k.StorySummary;
        var hindiMoral = isHindi ? LocalizeBriefSummaryHindi(k.MoralTeaching, "सच्ची भक्ति और दृढ़ संकल्प से ईश्वर अवश्य दर्शन देते हैं।") : (k.MoralTeaching ?? string.Empty);
        var description = BuildDescription(rule,
            $"📿 आज की पावन कथा: {title}\n" +
            $"🙏 पात्र: {speakerA} व {speakerB}\n" +
            $"{hindiSummary}\n" +
            (!string.IsNullOrWhiteSpace(hindiMoral) ? $"💡 जीवन संदेश: {hindiMoral}\n" : string.Empty) +
            (!string.IsNullOrWhiteSpace(k.SanskritMantra) ? $"🕉️ पावन मंत्र: {k.SanskritMantra}" : string.Empty),
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment($"🙏 {k.SanskritMantra ?? "ॐ नमो भगवते वासुदेवाय"}\nसंपूर्ण पौराणिक कथा व आज का पंचांग पढ़ने के लिए 👇\n🔗 {primaryLink}", links)
            : null;

        return new ComposedAutomationContent(
            $"katha:{dateKey}",
            k.Title,
            $"{k.DeityOrSage} — {hindiMoral}",
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

        var (histA, histB) = ResolveSpeakerPair(rule, title, null, isHindi);
        var histFull = IsFullStoryMode(rule);
        var script = isHindi && rule.EnableCharacterDialogue
            ? (histFull
                ? $"""
                   [SCENE]: archive | dawn | dramatic
                   [सूत्रधार]: (waving, wide) आज की तारीख {dateKey} विश्व व भारत के इतिहास का एक निर्णायक मोड़ है। आइए समय के पन्नों से जानते हैं कि सन् {leadIncident.Year} में असल में क्या हुआ था और उसने हमारा आज कैसे बदला।
                   [{histB}]: (confused, book) इतिहासकार महोदय, {dateKey} की तारीख विश्व और भारत के इतिहास में क्यों इतनी महत्वपूर्ण मानी जाती है?
                   [{histA}]: (pointing, proud, closeUpSpeaker) आइए समय की यात्रा में पीछे चलते हैं! आज ही के दिन सन् {leadIncident.Year} में '{leadIncident.Title}' की ऐतिहासिक घटना घटी थी।
                   [SCENE]: palace court | sunset | dramatic
                   [{histB}]: (surprised) उस समय देश व समाज की परिस्थिति क्या थी और इसका भविष्य पर क्या प्रभाव पड़ा?
                   [{histA}]: (proud, twoShot) {LocalizeBriefSummaryHindi(leadIncident.Description, $"सन् {leadIncident.Year} की यह घटना इतिहास का एक निर्णायक मोड़ बनी।")} {LocalizeBriefSummaryHindi(leadIncident.CulturalSignificance, string.Empty)}
                   [SCENE]: modern city | day | radiant
                   {(secondary.Count > 0 ? $"[{histB}]: (waving) इसके अलावा आज के दिन इतिहास में {string.Join(" और ", secondary.Select(s => $"सन् {s.Year} की प्रमुख घटना '{s.Title}'"))} भी दर्ज है।" : $"[{histB}]: (waving) इतिहास की ये घटनाएं केवल तारीखें नहीं, बल्कि मानव साहस और दूरदृष्टि के प्रमाण हैं।")}
                   [सूत्रधार]: (proud, wide) आज की ऐतिहासिक सीख — अतीत के संघर्ष और नवाचार हमें वर्तमान में सही निर्णय लेने की स्पष्ट दृष्टि देते हैं। पूरी ऐतिहासिक टाइमलाइन व GK नोट्स देखें: {primaryLink}
                   """
                : $"""
                   [SCENE]: archive | dawn | dramatic
                   [सूत्रधार]: (waving, wide) जानिए {dateKey} की वो ऐतिहासिक घटना जिसने सन् {leadIncident.Year} में इतिहास बदल दिया!
                   [{histB}]: (confused, book) {dateKey} इतिहास में क्यों खास है?
                   [SCENE]: palace court | sunset | dramatic
                   [{histA}]: (pointing, closeUpSpeaker) सन् {leadIncident.Year} में आज ही के दिन '{leadIncident.Title}' घटी थी। {LocalizeBriefSummaryHindi(leadIncident.Description, $"सन् {leadIncident.Year} की यह घटना इतिहास का प्रमुख मोड़ रही।")}
                   [SCENE]: modern city | day | clear
                   {(secondary.Count > 0 ? $"[{histB}]: (waving) साथ ही आज के दिन {string.Join(" व ", secondary.Select(s => $"सन् {s.Year} की घटना '{s.Title}'"))} भी महत्वपूर्ण रही।" : $"[{histB}]: (waving) इसका दूरगामी प्रभाव आज भी महसूस किया जाता है।")}
                   [सूत्रधार]: (proud, wide) सीख — इतिहास हमें वर्तमान को संवारने की प्रेरणा देता है। पूरी टाइमलाइन व GK नोट्स देखें: {primaryLink}
                   """)
            : isHindi
                ? $"""
                   [HOOK 0-4s] {dateKey} — इतिहास के पन्नों में आज का दिन क्यों बेहद खास है? आइए जानते हैं {leadIncident.Year} की ऐतिहासिक घटना!
                   [STORY 4-42s]
                   {leadIncident.Year} में आज ही के दिन: {leadIncident.Title}।
                   {leadIncident.Description}
                   {(string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? "" : $"प्रभाव: {leadIncident.CulturalSignificance}")}
                   {(secondary.Count > 0 ? "\nआज की अन्य प्रमुख घटनाएं:\n" + string.Join("\n", secondary.Select(s => $"• {s.Year}: {s.Title}")) : "")}
                   [MORAL] सीख — अतीत की घटनाएं हमें धैर्य, दूरदृष्टि और जागरूकता का पाठ पढ़ाती हैं।
                   [WEBSITE CTA 42-55s] इतिहास की पूरी टाइमलाइन, एग्जाम नोट्स और क्विज़ प्रैक्टिस के लिए हमारी वेबसाइट देखें: {primaryLink}
                   """
                : $"""
                   [HOOK 0-4s] What happened on this exact date ({dateKey}) that changed world & Indian history?
                   [STORY 4-42s]
                   Back in {leadIncident.Year}: {leadIncident.Title}.
                   {leadIncident.Description}
                   {(string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? "" : $"Why it shaped today: {leadIncident.CulturalSignificance}")}
                   {(secondary.Count > 0 ? "\nAlso on this date:\n" + string.Join("\n", secondary.Select(s => $"• {s.Year}: {s.Title}")) : "")}
                   [MORAL] Lesson — Remembering pivotal turning points empowers wiser choices in the present.
                   [WEBSITE CTA 42-55s] Explore the full interactive world history archive & notes on our portal: {primaryLink}
                   """;

        var prompt = ApplyPromptOverride(rule,
            $"Create a compelling documentary {ratioLabel} depicting '{leadIncident.Year}: {leadIncident.Title}' in historical cinematic realism: archival paper textures, dramatic chiaroscuro lighting, {(isHindi ? "animated world map highlights showing India & global context" : "animated global world map highlights with international perspective")}, smooth parallax motion, crisp typography space for '{leadIncident.Year}'.");

        var thumbPrompt = $"Dramatic historical documentary thumbnail showing '{leadIncident.Year}: {leadIncident.Title}', vintage gold-sepia meets high-contrast cinematic teal, clean space for large date '{leadIncident.Year}'.";

        var tags = isHindi
            ? MergeTags(["Aaj Ka Itihaas", "On This Day", $"History {leadIncident.Year}", leadIncident.Category, "Indian History", "World History", "UPSC GK", "Shorts"], baseTags, baseHashtags)
            : MergeTags(["On This Day", "World History", $"History {leadIncident.Year}", leadIncident.Category, "Global History", "Historical Milestones", "History Documentary", "Shorts"], baseTags, baseHashtags);
        var verificationNote = !string.IsNullOrWhiteSpace(leadIncident.SourceUrl)
            ? $"\n\n✅ {(isHindi ? "Verified Historical Source" : "Verified Archive Source")} ({leadIncident.SourceName ?? "Historical Archive"}): {leadIncident.SourceUrl}"
            : string.Empty;
        var description = BuildDescription(rule,
            (isHindi
                ? $"🌍 आज का इतिहास / On This Day ({dateKey})\n" +
                  bulletSummary +
                  (!string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? $"\n\n✨ महत्व: {leadIncident.CulturalSignificance}" : string.Empty)
                : $"🌍 On This Day in World History ({dateKey})\n" +
                  bulletSummary +
                  (!string.IsNullOrWhiteSpace(leadIncident.CulturalSignificance) ? $"\n\n✨ Global Impact: {leadIncident.CulturalSignificance}" : string.Empty)) +
            verificationNote,
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(
                isHindi
                    ? $"📚 {dateKey} की सभी ऐतिहासिक घटनाएं और डेली GK क्विज़ यहाँ पढ़ें 👇\n🔗 {primaryLink}\n\nआपके हिसाब से आज की सबसे महत्वपूर्ण घटना कौन सी थी?"
                    : $"🌍 Which milestone from {dateKey} fascinates you most? Explore full world timelines & notes 👇\n🔗 {primaryLink}",
                links)
            : null;

        return
        [
            new ComposedAutomationContent(
                $"history:{dateKey}",
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

        var (mentorName, participantName) = ResolveSpeakerPair(rule, title, null, isHindi);
        var fullStory = IsFullStoryMode(rule);
        var script = isHindi
            ? (rule.EnableCharacterDialogue
                ? (fullStory
                    ? $"""
                       [सूत्रधार]: आज की युवा पीढ़ी व विद्यार्थियों के लिए बड़ी खबर — '{top.Title}' प्रतियोगिता अभी {top.Status} है! आइए जानते हैं इसकी पूरी तैयारी व नियम।
                       [{participantName}]: नमस्ते {mentorName}! क्या '{top.Title}' ({top.Category}) में हिस्सा लेने से मेरी तैयारी व रैंक मजबूत हो सकती है?
                       [{mentorName}]: बिल्कुल! इसकी खास बात है — {LocalizeBriefSummaryHindi(top.PrizeOrHighlight, "सटीक अभ्यास, लाइव लीडरबोर्ड और राष्ट्रीय स्तर का अनुभव।")}{(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $" ध्यान रहे अंतिम तिथि {top.DeadlineLabel} है।")}
                       [{participantName}]: इसमें सफलता पाने का सबसे सही तरीका क्या रहेगा?
                       [{mentorName}]: रोज़ नियमित अभ्यास करें, पिछले प्रश्नों का विश्लेषण करें और समय-प्रबंधन पर ध्यान दें।
                       [सूत्रधार]: आज की सीख — निरंतर प्रयास और स्वयं को परखने का साहस हर विद्यार्थी को विजेता बनाता है। अभी फ्री रजिस्टर करने के लिए पिन कमेंट के लिंक पर जाएं: {primaryLink}
                       """
                    : $"""
                       [सूत्रधार]: विद्यार्थियों के लिए बड़ा अवसर — '{top.Title}' ({top.Category}) में हिस्सा लें!
                       [{participantName}]: {mentorName}, इसकी अंतिम तिथि और खास लाभ क्या हैं?
                       [{mentorName}]: स्टेटस अभी {top.Status} है{(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $" (अंतिम तिथि: {top.DeadlineLabel})")}। {(string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? "" : LocalizeBriefSummaryHindi(top.PrizeOrHighlight, "लाइव प्रैक्टिस व सम्मान प्राप्त करें।"))}
                       [सूत्रधार]: सीख — जो अभ्यास की चुनौती स्वीकारते हैं, वही आगे बढ़ते हैं। फ्री रजिस्टर करें: {primaryLink}
                       """)
                : $"""
                   [HOOK 0-4s] क्या आप अपनी तैयारी और नॉलेज को आज़माना चाहते हैं? सुनहरा मौका आ गया है!
                   [DETAILS 4-40s]
                   • प्रतियोगिता: {top.Title} ({top.Category})
                   • स्टेटस: {top.Status}{(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $" | अंतिम तिथि: {top.DeadlineLabel}")}
                   {(string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? "" : $"• खास बात: {top.PrizeOrHighlight}")}
                   [MORAL] सीख — नियमित स्व-मूल्यांकन और अभ्यास हर लक्ष्य को आसान बनाता है।
                   [CTA 40-55s] अभी फ्री रजिस्टर करने, लीडरबोर्ड और प्रैक्टिस सेट देखने के लिए पिन कमेंट के लिंक पर क्लिक करें: {primaryLink}
                   """)
            : $"""
               [HOOK 0-4s] Ready to test your skills and compete nationwide? Here is what '{top.Title}' offers.
               [DETAILS 4-40s]
               • Event: {top.Title} ({top.Category}) — Status: {top.Status}
               {(string.IsNullOrWhiteSpace(top.DeadlineLabel) ? "" : $"• Deadline: {top.DeadlineLabel}")}
               {(string.IsNullOrWhiteSpace(top.PrizeOrHighlight) ? "" : $"• Highlight: {top.PrizeOrHighlight}")}
               [MORAL] Takeaway — Consistent practice under real challenge builds lasting mastery.
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
            ? BuildPinnedComment(
                isHindi
                    ? $"🎯 अभी भाग लें और अपनी रैंक चेक करें 👇\n🔗 {primaryLink}"
                    : $"🎯 Join the live quiz challenge and check global rankings 👇\n🔗 {primaryLink}",
                links)
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

        var (guideA, guideB) = ResolveSpeakerPair(rule, title, null, isHindi);
        var ecoFull = IsFullStoryMode(rule);
        var script = isHindi
            ? (rule.EnableCharacterDialogue
                ? (ecoFull
                    ? $"""
                       [सूत्रधार]: आज के डिजिटल युग में हर रचनात्मक व्यक्ति चाहता है कि उसके विचार, सनातन कथाएँ और ज्ञान बिना किसी जटिल सॉफ्टवेयर के करोड़ों दर्शकों तक पहुँचें।
                       [{guideB}]: {guideA}, एक साधारण व्यक्ति या छोटा क्रिएटर रोज़ समय पर उच्च-गुणवत्ता वाले एनिमेटेड कहानी वीडियो कैसे बना सकता है?
                       [{guideA}]: जब लेखन, आवाज़, पात्र निर्माण और दृश्य रचना एक ही बुद्धिमान प्रणाली से जुड़ जाते हैं, तब घंटों का काम मिनटों में पूरा हो जाता है!
                       [{guideB}]: क्या इसमें आज का सटीक वैदिक पंचांग ({panchangNote}), इतिहास और पौराणिक कथाएँ भी स्वतः जुड़ती हैं?
                       [{guideA}]: बिल्कुल! {ecosystem.StudioTitle} में स्वचालित स्क्रिप्ट, हिंदी आवाज़, जीवंत पात्र और सीधा YouTube प्रकाशन एक साथ काम करते हैं।
                       [सूत्रधार]: आज की सीख — सही प्रणाली और निरंतरता किसी भी अच्छे विचार को व्यापक प्रभाव में बदल सकती है। सभी फ्री टूल्स देखें: {primaryLink}
                       """
                    : $"""
                       [सूत्रधार]: आज डिजिटल युग में हर क्रिएटर चाहता है कि उसका ज्ञान और सनातन कहानियाँ बिना भारी तकनीकी झंझट के दुनिया तक पहुँचें।
                       [{guideB}]: {guideA}, क्या बिना घंटों एडिटिंग किए रोज़ प्रोफेशनल AI स्टोरी वीडियो और शॉर्ट्स बनाए जा सकते हैं?
                       [{guideA}]: बिल्कुल! {ecosystem.StudioTitle} में AI स्क्रिप्ट, हिंदी आवाज़, 3D एनिमेशन और लाइव वैदिक पंचांग ({panchangNote}) एक साथ काम करते हैं।
                       [सूत्रधार]: सीख — सही तकनीक का उपयोग सृजनशीलता को पंख देता है और आपका समय बचाता है। सभी फ्री टूल्स देखें: {primaryLink}
                       """)
                : $"""
                   [HOOK 0-4s] क्या आप हर दिन बिना घंटों एडिटिंग किए प्रोफेशनल AI वीडियो, शॉर्ट्स और चैनल ग्रोथ एनालिटिक्स चाहते हैं?
                   [BODY 4-42s]
                   हमारे ऑल-इन-वन क्रिएटर इकोसिस्टम पर आज ही एक्सप्लोर करें:
                   • AI स्टोरी व शॉर्ट्स जनरेटर ({ecosystem.StudioTitle})
                   • लाइव YouTube ग्रोथ और RPM कैलकुलेटर
                   • आज का सटीक वैदिक पंचांग ({panchangNote}) और डेली इतिहास
                   [MORAL] सीख — स्मार्ट टूल्स सार्थक विचारों को तेज़ी से लोगों तक पहुँचाते हैं।
                   [CTA 42-55s] सभी फ्री टूल्स और वेबसाइट लिंक्स पिन कमेंट और डिस्क्रिप्शन में हैं: {primaryLink}
                   """)
            : (ecoFull && rule.EnableCharacterDialogue
                ? $"""
                   [Narrator]: Before exploring the platform, consider how modern creators turn daily cultural knowledge and stories into consistent animated videos.
                   [{guideB}]: How can one creator publish daily Panchang updates, historical stories, and multi-character animations without a studio team?
                   [{guideA}]: By connecting research, scriptwriting, character design, voiceover, and publishing in one workflow inside {ecosystem.StudioTitle} ({panchangNote}).
                   [{guideB}]: So the creator stays focused on the message while scenes and voices build automatically?
                   [{guideA}]: Exactly — consistency becomes effortless while every story keeps clear visuals, clean music, and authentic citations.
                   [Narrator]: Takeaway — A well-designed creative workflow turns scattered ideas into lasting daily impact. Explore all tools: {primaryLink}
                   """
                : $"""
                   [HOOK 0-4s] Want AI storytelling, daily Vedic knowledge, and creator analytics in one unified workspace?
                   [BODY 4-42s]
                   Explore our creator platform: automated AI stories & Shorts ({ecosystem.StudioTitle}), YouTube RPM & Growth Advisor, daily Panchang ({panchangNote}), and interactive quizzes.
                   [MORAL] Takeaway — The right creative system turns ideas into finished stories consistently.
                   [CTA 42-55s] Try all tools directly via our ecosystem links below: {primaryLink}
                   """);

        var prompt = ApplyPromptOverride(rule,
            $"Futuristic creator workstation montage in {ratioLabel}: sleek dark glowing dashboard screens rendering animated stories, analytics charts rising upward, warm holographic accents.");

        var thumbPrompt = $"Futuristic AI creator studio workstation thumbnail, glowing timeline + rising analytics arrows, bold modern contrast.";
        var tags = MergeTags(["AI Video", "Creator Tools", "YouTube Growth", "Automation", ecosystem.EngineName], baseTags, baseHashtags);
        var description = BuildDescription(rule,
            $"🚀 Explore the complete creator & culture web ecosystem ({dateKey}):\n" +
            "AI Video & Shorts Creation • Real-Time Panchang & History • YouTube Growth & Traffic Funnels",
            links, tags);

        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(
                isHindi
                    ? $"🚀 आज ही ट्राई करें — सारे क्रिएटर टूल्स और लाइव वेब ऐप्स 👇\n🔗 {primaryLink}"
                    : $"🚀 Try our AI storytelling studio & YouTube analytics toolkit today 👇\n🔗 {primaryLink}",
                links)
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

        var (custA, custB) = ResolveSpeakerPair(rule, topicSeed, null, isHindi);
        var custDetail = string.IsNullOrWhiteSpace(rule.Description) ? topicSeed : rule.Description.Trim();
        var custFull = IsFullStoryMode(rule);
        var script = isHindi
            ? (rule.EnableCharacterDialogue
                ? (custFull
                    ? $"""
                       [सूत्रधार]: आइए जानते हैं '{topicSeed}' की पूरी पृष्ठभूमि और वह प्रेरणादायक यात्रा जो हर व्यक्ति को नई दिशा देती है।
                       [{custB}]: {custA}, '{topicSeed}' के पीछे मुख्य संदर्भ और वास्तविक घटना क्या है?
                       [{custA}]: {LocalizeBriefSummaryHindi(custDetail, $"{topicSeed} हमें धैर्य, सत्य और संकल्प का जीवंत उदाहरण दिखाता है।")}
                       [{custB}]: जब परिस्थिति सबसे कठिन हुई, तब आगे बढ़ने की शक्ति कहाँ से मिली?
                       [{custA}]: अटूट विश्वास, सही मार्गदर्शन और अपने कर्तव्य पर अडिग रहने से ही हर असंभव दिखने वाला मार्ग खुलता है।
                       [सूत्रधार]: इस कथा की मुख्य सीख — कठिन समय हमें तोड़ने नहीं, बल्कि भीतर की शक्ति जगाने आता है। अधिक जानकारी के लिए वेबसाइट पर जाएं: {primaryLink}
                       """
                    : $"""
                       [सूत्रधार]: आज की विशेष कथा — '{topicSeed}' का संक्षिप्त संदर्भ व प्रेरणादायक सीख!
                       [{custB}]: {custA}, '{topicSeed}' से हमें क्या विशेष जानने को मिलता है?
                       [{custA}]: {LocalizeBriefSummaryHindi(custDetail, $"{topicSeed} हमें कर्मनिष्ठा और आत्मविश्वास की राह दिखाता है।")}
                       [सूत्रधार]: मुख्य सीख — सच्चा संकल्प हमेशा विजय दिलाता है। अधिक देखें: {primaryLink}
                       """)
                : $"""
                   [HOOK 0-4s] {topicSeed} पर आज की विशेष प्रस्तुति।
                   [BODY 4-42s] मुख्य विषय: {custDetail}।
                   [MORAL] सीख — स्पष्ट उद्देश्य और धैर्य जीवन में बड़ा परिवर्तन लाते हैं।
                   [CTA 42-55s] अधिक जानकारी के लिए वेबसाइट पर जाएं: {primaryLink}
                   """)
            : $"""
               [Narrator]: Before we begin, here is the context behind {topicSeed}.
               [{custB}]: What happens at the heart of {topicSeed}, and why does it resonate so deeply?
               [{custA}]: {custDetail}. Through challenge and persistence, every scene moves toward clarity and transformation.
               [Narrator]: Moral of the story — Steadfast purpose and kindness turn obstacles into wisdom. Explore more on our website: {primaryLink}
               """;

        var prompt = ApplyPromptOverride(rule,
            $"Cinematic {ratioLabel} illustrating '{topicSeed}': cohesive visual storytelling, crisp lighting, atmospheric music vibe.");

        var thumbPrompt = $"Clean striking thumbnail centered on '{topicSeed}', atmospheric depth and bold readability.";
        var tags = MergeTags([topicSeed, "Shorts", "DailyUpdate"], baseTags, baseHashtags);
        var description = BuildDescription(rule, $"{topicSeed}\n{rule.Description}", links, tags);
        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(
                isHindi ? $"🔗 और देखें 👇\n{primaryLink}" : $"🔗 Explore more & try live tools 👇\n{primaryLink}",
                links)
            : null;

        return new ComposedAutomationContent(
            $"custom:{dateKey}:{rule.Id}",
            topicSeed,
            rule.Description,
            title, script, prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static ComposedAutomationContent ComposeDevotionalPrarthana(
        AutomationRule rule,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var entry = DevotionalPrarthanaCatalog.SelectForDate(rule.DeityFocus, dateKey, rule.CustomTopicPrompt);
        var title = isHindi
            ? Truncate($"{entry.TitleHindi} 🙏", MaxTitleLength)
            : Truncate($"{entry.TitleEnglish} 🙏", MaxTitleLength);

        var script = isHindi
            ? $"{entry.HookHindi}\n{entry.PrayerHindi}"
            : entry.PrayerEnglish;

        var customVisual = !string.IsNullOrWhiteSpace(rule.CustomTopicPrompt)
            ? $" Theme focus: {rule.CustomTopicPrompt.Trim()}."
            : string.Empty;

        var prompt = ApplyPromptOverride(rule,
            $"Devotional {ratioLabel} depicting {entry.DeityEnglish}: {entry.VisualSubject}.{customVisual} Soft golden rim light on deep dark sanctum backdrop, centered composition ideal for smooth non-shaking zoom and orbital motion, zero embedded text or watermarks.");

        var thumbPrompt = $"Serene glowing portrait artwork of {entry.DeityEnglish} framed in deep temple darkness with warm diya halo, zero text.";
        var deityLabel = isHindi ? entry.DeityHindi : entry.DeityEnglish;
        var tags = MergeTags([.. entry.Tags, deityLabel, "Sanatan", "Shorts"], baseTags, baseHashtags);

        var bodyCore = isHindi
            ? $"🙏 आज की पावन प्रार्थना — {entry.DeityHindi} ({dateKey})\n\n\"{entry.HookHindi}\n{entry.PrayerHindi}\"\n\n🕉️ मंत्र स्मरण: {entry.Mantra}"
            : $"🙏 Daily Devotional Prayer — {entry.DeityEnglish} ({dateKey})\n\n\"{entry.PrayerEnglish}\"\n\n🕉️ Sacred Chant: {entry.Mantra}";
        var description = BuildDescription(rule, bodyCore, links, tags);
        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(
                isHindi
                    ? $"🙏 {entry.Mantra} • रोज़ की पावन भक्ति प्रार्थना व पंचांग देखें 👇\n🔗 {primaryLink}"
                    : $"🙏 {entry.Mantra} • Explore daily Vedic prayers & sacred stories 👇\n🔗 {primaryLink}",
                links)
            : null;

        return new ComposedAutomationContent(
            $"prarthana:{dateKey}:{entry.DeityKey}",
            entry.DeityEnglish,
            entry.Mantra,
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static ComposedAutomationContent ComposeFunnyComedy(
        AutomationRule rule,
        string dateKey,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        IReadOnlyList<string> baseTags,
        IReadOnlyList<string> baseHashtags,
        string ratioLabel,
        bool isHindi)
    {
        var customSeed = string.IsNullOrWhiteSpace(rule.CustomTopicPrompt) ? null : rule.CustomTopicPrompt.Trim();
        var effectiveTone = rule.ComedyStyle;
        if (effectiveTone == AnimStudio.Domain.Stories.ComedyToneStyle.Auto && !isHindi)
            effectiveTone = AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick;
        var isKhadi = effectiveTone is AnimStudio.Domain.Stories.ComedyToneStyle.KhadiBhasha
            or AnimStudio.Domain.Stories.ComedyToneStyle.DesiKhadiSitcom;
        var isClean = effectiveTone == AnimStudio.Domain.Stories.ComedyToneStyle.FamilyClean;
        var isTank = effectiveTone == AnimStudio.Domain.Stories.ComedyToneStyle.TankSeries;
        var isGlobal = effectiveTone == AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick;
        var defaultPairSeed = isTank ? "KV-Tiny Tank & Blitz Tank"
            : isGlobal ? "Woody Log & Cuppy Mug"
            : "Comedy Chai Tapri";
        var (speakerA, speakerB) = ResolveSpeakerPair(rule, customSeed ?? defaultPairSeed, null, isHindi && !isTank && !isGlobal);
        var byStander = isHindi ? "टपरी भैया" : "Chai Guy";
        var slot = Math.Abs(StringComparer.Ordinal.GetHashCode($"{dateKey}:{rule.TargetChannelHandle}:{rule.Id}")) % 5;
        var isFull = IsFullStoryMode(rule);
        var includeMemes = rule.AutoInsertMemes;

        var topicTitleHi = customSeed ?? (isKhadi ? slot switch
        {
            0 => "ताऊ का खड़ी भाषा देसी जुगाड़ 😂 टपरी पर उधार कांड",
            1 => "सुबह 5 बजे का अलार्म और छोले-भटूरे का सपना 😂",
            2 => "भाई के 2 मिनट मतलब पूरा एक युग 😂 देसी रोस्ट",
            3 => "मम्मी का फ्लाइंग चप्पल रडार बनाम पप्पू 😂",
            _ => "शादी के बुफ़े में पनीर लूटने की खुफ़िया प्लानिंग 😂"
        } : slot switch
        {
            0 => "टपरी पर फ्री की चाय और दोस्त का 'वॉलेट घर पे' स्कैम 😂",
            1 => "सुबह 5 बजे जिम का जोश और 11 बजे तक खर्राटे 😂",
            2 => "'अबे 2 मिनट में आया' बोलकर चप्पल ढूँढता दोस्त 😂",
            3 => "फ्री वाई-फ़ाई पासवर्ड के लिए दोस्त की भयानक बेइज़्ज़ती 😂",
            _ => "शादी के बुफ़े में पनीर बचाने की सीक्रेट प्लानिंग 😂"
        });

        var topicTitleEn = customSeed ?? slot switch
        {
            0 => "Friend Shows Up Broke to Free Chai Tapri 😂",
            1 => "The 5 AM Gym Plan vs. Chole Bhature 😂",
            2 => "When '2 Minutes Away' Means Still In Bed 😂",
            3 => "Free Wi-Fi Password Negotiation Gone Wrong 😂",
            _ => "Wedding Buffet Paneer Strategy Exposed 😂"
        };

        var epTag = $"EP {(slot + 1):00}";
        var title = Truncate(
            isTank ? $"{topicTitleEn} | Cartoon Tank Series | {epTag}"
                : isHindi ? $"{topicTitleHi} | #Shorts Comedy"
                : $"{topicTitleEn} | 3D Comedy Loop",
            MaxTitleLength);

        var script = isTank || isGlobal
            ? BuildEnglishComedyScript(speakerA, speakerB, byStander, slot, isFull, includeMemes, rule.EnableCharacterDialogue, effectiveTone)
            : isHindi
                ? BuildHindiComedyScript(speakerA, speakerB, byStander, slot, effectiveTone, isFull, includeMemes, rule.EnableCharacterDialogue)
                : BuildEnglishComedyScript(speakerA, speakerB, byStander, slot, isFull, includeMemes, rule.EnableCharacterDialogue, effectiveTone);

        var styleLabelHi = FriendlyComedyStyleLabel(effectiveTone, isHindi: true);
        var summaryText = isTank
            ? $"{topicTitleEn} — {epTag} animated cartoon tank comedy"
            : isHindi
                ? $"{topicTitleHi} — {styleLabelHi}"
                : $"{topicTitleEn} — unique 3D slapstick loop";
        var prompt = ApplyPromptOverride(rule,
            isTank
                ? $"Vibrant 3D cartoon tank arena comedy in {ratioLabel}, expressive googly-eyed tanks, canyon dust and comic cannon twist on '{topicTitleEn}'."
                : isGlobal
                    ? $"World-friendly 3D cartoon slapstick animation in {ratioLabel}, stylized doorway & sky gauntlet characters, vivid reaction faces on '{topicTitleEn}'."
                    : $"Expressive colorful 3D comedy animation in {ratioLabel} across an Indian chai tapri and comedy spot stage: warm tangerine lighting, exaggerated wide-eyed cartoon reactions, rapid banter cuts on '{topicTitleHi}'.");
        var thumbPrompt = isHindi && !isTank && !isGlobal
            ? $"Bright MJO-style 3D cartoon comedy thumbnail for '{title}', shocked bulging eyes, bold high-contrast background, punchy 1-3 word Hinglish shock hook."
            : $"Bright viral 3D animation thumbnail for '{title}', extreme wide-eyed comic reaction close-up, saturated neon sky rim light, zero clutter.";
        var isInternational = isTank || isGlobal || !isHindi;
        var tags = isInternational
            ? MergeTags(
                [
                    "3D Comedy", "Animated Shorts", "Cartoon Comedy",
                    isTank ? "Cartoon Tank Series" : "Slapstick Loop",
                    "Funny 3D Animation", "Make Joke Of Style", "Comedy Cartoon",
                    "Funny Animation Video", "Viral Comedy Shorts", "Animated Sitcom",
                    "Cartoon Comedy Episode", "3D Character Comedy", "Laugh Out Loud",
                    "Funny Animated Series", "Comedy Reel", "Funny Shorts",
                    "Trending Shorts", "Shorts"
                ],
                baseTags,
                baseHashtags)
            : MergeTags(
                [
                    "Make Joke Of Style", "MJO Comedy", "Hindi Comedy Video",
                    "Desi 3D Cartoon", "Funny Cartoon Animation", "Hindi Funny Video",
                    "Kanpuria Comedy", "UP Style Comedy", "Comedy Shorts",
                    "Desi Comedy", isKhadi ? "Khadi Bhasha Comedy" : "Tu Tadak Comedy",
                    "Barber Shop Comedy", "Chai Tapri Comedy", "Mohalla Comedy",
                    "Funny Dubbing Hindi", "Animated Comedy Series", "KESHAV-ANIM-FF",
                    "Viral Hindi Shorts", "Hindi Cartoon Comedy", "3D Cartoon Comedy",
                    "Hinglish Comedy", "Shorts"
                ],
                baseTags,
                baseHashtags);
        var description = isInternational
            ? BuildDescription(rule,
                $"{summaryText}\n😂 Original 3D cartoon animation crafted in AnimStudio AI — subscribe for fresh comedy episodes!",
                links, tags)
            : BuildDescription(rule,
                $"{summaryText}\n😂 {(isClean ? "सबके साथ बैठकर देखें!" : "असली यारों वाला देसी रोस्ट!")} रोज़ ऐसे ही मज़ेदार 3D कॉमेडी वीडियो के लिए सब्सक्राइब करें!",
                links, tags);
        var comment = rule.IncludePinnedComment
            ? BuildPinnedComment(
                isInternational
                    ? $"😂 Which punchline caught you off guard? Drop a comment! 👇\n🔗 {primaryLink}"
                    : $"😂 ऐसा दोस्त किसके ग्रुप में है? नाम लिख के बेइज़्ज़ती करो 👇\n🔗 {primaryLink}",
                links)
            : null;

        return new ComposedAutomationContent(
            $"comedy:{dateKey}:{rule.Id}",
            summaryText,
            topicTitleEn,
            title, script.Trim(), prompt, thumbPrompt, description, comment, tags, primaryLink, links);
    }

    private static string BuildHindiComedyScript(
        string speakerA,
        string speakerB,
        string bystander,
        int slot,
        AnimStudio.Domain.Stories.ComedyToneStyle tone,
        bool isFull,
        bool includeMemes,
        bool dialogueEnabled)
    {
        if (!dialogueEnabled)
        {
            return $"""
                [SCENE]: chai stall | day | playful
                जब यार कहे आज टपरी का बिल मैं दूँगा, और जेब से सिर्फ़ खाली रसीद निकले!
                {(includeMemes ? "[MEME]: shocked_face | भाई का वॉलेट गायब!\n" : string.Empty)}बस यहीं से असली दोस्ती और खड़ी भाषा की बेइज़्ज़ती शुरू होती है — अपना ऐसा दोस्त कमेंट में टैग करो!
                """;
        }

        string memeMid(string key, string caption) => includeMemes ? $"[MEME]: {key} | {caption}\n" : string.Empty;

        if (tone is AnimStudio.Domain.Stories.ComedyToneStyle.KhadiBhasha or AnimStudio.Domain.Stories.ComedyToneStyle.DesiKhadiSitcom)
        {
            return (slot % 3) switch
            {
                0 => $"""
                    [CAST]: {speakerA} | scholar | bright orange hoodie, tousled hair, cheeky grin
                    [CAST]: {speakerB} | child | mustard kurta, funky scarf, mischievous look
                    [CAST]: {bystander} | villager | white apron, towel on shoulder, deadpan stare
                    [SCENE]: bedroom | day | playful
                    [{speakerA}]: (sleeping) ख्र्र्र... बस पाँच मिनट और सोने दे यार, आज रविवार है...
                    [{speakerB}]: (angry, pointing) अबे सुन बावले! ग्यारह बज गए — तू अभी तक पलंग पे ही सो रहा है क्या?!
                    [{speakerA}]: (waking up, surprised) अरे बाप रे! ग्यारह बज गए?! गरम समोसे खत्म हो जाएँगे, जल्दी चल!
                    {memeMid("shocked_face", "अरे बावले, यो के बोल दिया!")}[SCENE]: chai stall | day | playful
                    [{speakerA}]: (walking) {bystander}, दो बढ़िया अदरक की चाय और गरम समोसे ठोक दे — इब म्हारा भाई बिल देगा!
                    [{bystander}]: (pointing) यारा, थारा पिछला चार सौ रुपया का उधार खाता दीवार पे टँगा सै — किसे मूर्ख बनावै सै!
                    [{speakerB}]: (facepalm, laughing) ले इब कर ले जुगाड़ — बर्तन मांजने की ड्यूटी पक्की तेरी!
                    {(isFull ? $"[{speakerA}]: (running, surprised) अबे बबलू रुक! मेरी चप्पल तो उठा ले, दौड़ने का टैम आ गया!" : string.Empty)}
                    {memeMid("khatam_tata_bye", "इब बोल... मोये मोये हो गया!")}
                    """,
                1 => $"""
                    [CAST]: {speakerA} | scholar | vibrant yellow sweater, messy hair, oversized specs
                    [CAST]: {speakerB} | child | teal jacket, backwards cap, smug smile
                    [SCENE]: bedroom | night | playful
                    [{speakerA}]: (sleeping) ख्र्र्र... रसोई से गरम रबड़ी की खुशबू आ रही है...
                    [{speakerB}]: (waking up, confused) अरे पप्पू! आधी रात को ये रसोई में कड़ाही कौन खड़का रहा है?!
                    [SCENE]: kitchen | night | mischievous
                    [{speakerA}]: (eating, proud) आहाहा! आज गरम कड़ाही की सारी मलाईदार रबड़ी अकेले साफ कर दूँगा!
                    {memeMid("shocked_face", "रबड़ी कांड रंगे हाथ पकड़ा गया!")}[{speakerB}]: (angry, pointing) पकड़ लिया बे बावले! सारी रबड़ी अकेले चट कर गया नालायक?!
                    [{speakerA}]: (shocked) अरे नहीं यार! मैं तो बस चेक कर रहा था कि दूध ठंडा हुआ या नहीं!
                    [{speakerB}]: (facepalm, laughing) अबे पूरी कड़ाही चाट के टेम्परेचर चेक होता है क्या?!
                    {memeMid("run_comedy", "रबड़ी ग़ायब, बहाना तैयार!")}
                    """,
                _ => $"""
                    [CAST]: {speakerA} | scholar | yellow sweater, messy hair, oversized specs
                    [CAST]: {speakerB} | child | teal jacket, backwards cap, smug smile
                    [SCENE]: living room | dawn | playful
                    [{speakerA}]: (sitting) ताऊ की कसम खा के बोला था पाँच बजे जिम फोड़ूँगा — अब सोफे पे कमर सीधी कर लूँ!
                    [{speakerB}]: (sarcastic, pointing) अरे बावले! ग्यारह बज गए और हाथ में समोसा दबा के जिम हो रहा है?!
                    {memeMid("confused_math", "ताऊ का अलार्म फेल हो गया!")}[SCENE]: sweet shop | day | laughing
                    [{speakerB}]: (laughing) यो के जुगाड़ सै? बॉडी बनानी थी और हलवाई की दुकान पे लड्डू फोड़ रहा है!
                    [{speakerA}]: (eating) चुपचाप प्लेट पकड़ — डंबल से भारी तो अपना यह मलाई लड्डू सै!
                    {memeMid("run_comedy", "बॉडी नहीं, मिठाई चैंपियन!")}
                    """
            };
        }

        if (tone == AnimStudio.Domain.Stories.ComedyToneStyle.FamilyClean)
        {
            return $"""
                [CAST]: {speakerA} | scholar | sky blue shirt, neat hair, cheerful expression
                [CAST]: {speakerB} | child | sunny yellow vest, bright smile, curious eyes
                [SCENE]: chai stall | day | playful | IMAGE: cozy clean Indian tea corner courtyard with colorful bunting and clay cups, cheerful daylight, 3D cartoon background, no people
                [{speakerB}]: (excited) अरे वाह भैया, आज पूरे मोहल्ले को चाय पिलाने का इरादा है क्या?
                [{speakerA}]: (proud) बिल्कुल बबलू! आज अपनी नई लॉटरी निकलने ही वाली थी बस...
                {memeMid("surprised_kid", "अरे यह क्या गड़बड़ हो गई!")}[SCENE]: comedy stage | sunset | joyful | IMAGE: lively bright cartoon park bench scene, festive lamps, playful sunset light, no people
                [{speakerB}]: (surprised) भैया नंबर तो ठीक से पढ़ो — वह लॉटरी का नहीं, किराने का उधार बिल है!
                [{speakerA}]: (confused) अरे बाप रे! चलो कोई बात नहीं, अगले हफ़्ते चाय पक्की!
                {memeMid("laugh_clean", "सपना टूटा पर हँसी छूटी!")}
                """;
        }

        // Tu-Tadak / Auto / Roast & Twist desi Hindi buddy banter
        return slot switch
        {
            0 => $"""
                [CAST]: {speakerA} | scholar | vibrant orange jacket, wild spiky hair, smug shades
                [CAST]: {speakerB} | child | lime hoodie, raised eyebrow, cheeky smile
                [CAST]: {bystander} | villager | white apron, steaming tea kettle prop, stern look
                [SCENE]: bedroom | day | playful
                [{speakerA}]: (sleeping) ख्र्र्र... बस आ रहा हूँ भाई, रास्ते में ट्रैफिक बहुत है...
                [{speakerB}]: (angry, pointing) अबे सुन पप्पू! दस बार फ़ोन कर चुका — दो मिनट बोल के अभी तक पलंग पे ही सो रहा है क्या?!
                [{speakerA}]: (waking up, surprised) अरे बाप रे! इंडिया में 'दो मिनट' का मतलब आधा घंटा होता है, आ रहा हूँ!
                {memeMid("dimag_hang", "भाई का टाइम ज़ोन ही अलग है!")}[SCENE]: chai stall | sunset | excited
                [{bystander}]: (walking, sarcastic) तेरे इसी दो मिनट के चक्कर में इसकी चार चाय ठंडी हो गई — आज बिल तेरे नाम!
                [{speakerB}]: (facepalm, laughing) अबे निकल ले चुपचाप! बड़ा आया घड़ी का मालिक — अब समोसा भी खिला!
                {(isFull ? $"[{speakerA}]: (running, surprised) अरे ठहर यार, मेरा यूपीआई नेटवर्क सिर्फ़ तब काम करता है जब सामने वाला बिल दे!" : string.Empty)}
                {memeMid("khatam_tata_bye", "ख़त्म... टाटा... बाय-बाय!")}
                """,
            1 => $"""
                [CAST]: {speakerA} | scholar | red tracksuit, headband, dramatic pose
                [CAST]: {speakerB} | child | blue casual tee, coffee mug, deadpan face
                [SCENE]: modern city | dawn | tense | IMAGE: sunny Indian rooftop terrace apartment morning view with yoga mat, bright 3D cartoon background, no people
                [{speakerA}]: (proud) अबे सुन {speakerB}, आज से सुबह पाँच बजे जिम और सीधा सिक्स-पैक एब्स — तेरे से ना हो पाएगा!
                [{speakerB}]: (sarcastic) अच्छा? पर अभी साढ़े ग्यारह बज रहे हैं और हाथ में समोसा क्यों दबा रखा है भाई?
                {memeMid("overconfidence", "सपने सिक्स-पैक के, हाथ में समोसा!")}[SCENE]: comedy stage | day | laughing | IMAGE: vibrant living room sofa with snacks table, comic morning light, 3D cartoon background, no people
                [{speakerA}]: (mischievous) अबे यह प्री-वर्कआउट कार्ब लोडिंग है! कल से पक्का पसीना बहाऊँगा!
                [{speakerB}]: (laughing) हाँ पिछले तीन साल से तेरा 'कल' सोमवार को ही अटका है!
                {memeMid("emotional_damage", "दोस्त ने सरेआम धो दिया!")}
                """,
            _ => $"""
                [CAST]: {speakerA} | scholar | purple blazer, shiny watch, overconfident grin
                [CAST]: {speakerB} | child | teal shirt, phone in hand, suspicious look
                [SCENE]: chai stall | sunset | mischievous | IMAGE: bustling evening Indian street food corner with glowing stall signboards, bright comic atmosphere, 3D cartoon frame, no people
                [{speakerA}]: (proud) अबे सुन! तेरा भाई आज करोड़पति बिज़नेस आइडिया लाया है — फ्री वाई-फ़ाई वाली टपरी!
                [{speakerB}]: (confused) फ्री में वाई-फ़ाई बाँटेगा तो कमाई कहाँ से करेगा, मेरे दिमाग़ के बंद ताले?
                {memeMid("wait_what", "अरे भाई ये कौन सा बिज़नेस है!")}[SCENE]: comedy stage | night | excited | IMAGE: neon-lit bustling chai counter at night with funny signboard glow, vibrant 3D cartoon frame, no people
                [{speakerA}]: (laughing) पासवर्ड बोर्ड पे लिख दूँगा — 'पहले दो स्पेशल चाय पियो, वरना हॉटस्पॉट ऑफ़!'
                [{speakerB}]: (surprised) तेरा तो दिमाग़ चाचा चौधरी से भी तेज़ भाग गया बे!
                {memeMid("mind_blown", "असली जुगाड़ गुरु मिल गया!")}
                """
        };
    }

    private static string BuildEnglishComedyScript(
        string speakerA,
        string speakerB,
        string bystander,
        int slot,
        bool isFull,
        bool includeMemes,
        bool dialogueEnabled,
        AnimStudio.Domain.Stories.ComedyToneStyle tone = AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick)
    {
        if (!dialogueEnabled)
        {
            return $"""
                [CAST]: {speakerA} | log | warm carved wood, huge googly eyes
                [CAST]: {speakerB} | cup | bright ceramic mug, bouncing steam
                [SCENE]: doorway set | day | slapstick | IMAGE: colorful 3D hallway with central wooden slapstick doorway and spotlight
                Me tip-toeing past the doorway thinking nobody saw that sneaky snack grab...
                {(includeMemes ? "[MEME]: shocked_face | BUSTED IN 4K!\n" : string.Empty)}Wait... why is everyone standing right behind the door?!
                """;
        }

        string memeMid(string key, string caption) => includeMemes ? $"[MEME]: {key} | {caption}\n" : string.Empty;

        if (tone == AnimStudio.Domain.Stories.ComedyToneStyle.TankSeries
            || (tone != AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick && slot % 3 == 2))
        {
            return $"""
                [CAST]: {speakerA} | tank | olive green turret, googly eyes, oversized barrel
                [CAST]: {speakerB} | tank | crimson armor plating, nervous eyebrows
                [SCENE]: tank arena | sunset | dramatic | IMAGE: stylized cartoon desert canyon tank arena with bunkers and smoke plumes, no people
                [{speakerA}]: (proud) Step aside mini tank — one blast from this mega cannon ends the whole episode!
                [{speakerB}]: (surprised) Bro wait, did you check what ammo you actually loaded in that barrel?!
                {memeMid("shocked_face", "WRONG AMMO LOADED!")}[SCENE]: tank arena | day | laughing | IMAGE: colorful cartoon tank canyon with tiny confetti puff and shocked birds, no people
                [{speakerA}]: (confused) Wait... why did my super cannon just shoot one bouncy rubber duck?!
                [{speakerB}]: (laughing) Victory by rubber ducky — see you in the next episode!
                {(isFull ? $"[{speakerA}]: (angry) Don't laugh! Wait till Episode Next — I'm switching to water balloons!" : string.Empty)}
                {memeMid("emotional_damage", "TOTAL CONFUSION!")}
                """;
        }

        if (tone == AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick || slot % 3 == 0)
        {
            return $"""
                [CAST]: {speakerA} | log | carved wooden buddy, expressive giant eyes, sports bat
                [CAST]: {speakerB} | cup | pastel espresso dancer, golden rim, cheeky grin
                [SCENE]: bedroom | day | slapstick
                [{speakerA}]: (sleeping) Zzz... nobody knows my secret trophy heist plan yet...
                [{speakerB}]: (angry, pointing) Wake up sleepyhead — the alarm went off twenty minutes ago!
                [{speakerA}]: (waking up, surprised) Whoa!! Zero noise, maximum stealth — time to run for that golden trophy!
                [SCENE]: doorway set | day | slapstick
                [{speakerA}]: (walking) Tip-toe past the door without anyone noticing...
                {memeMid("brain_buffering", "LOOK BEHIND THE DOOR!")}[SCENE]: sky gauntlet | sunset | excited
                [{speakerB}]: (laughing) Spoiler alert: both doors lead straight onto the bouncy sky bridge!
                [{speakerA}]: (shocked, dancing) Who put a trampoline right behind the exit door?!
                {memeMid("shocked_face", "INSTANT REPLAY LOOP!")}
                """;
        }

        return $"""
            [CAST]: {speakerA} | bobble | bright orange hoodie, giant expressive cartoon eyes
            [CAST]: {speakerB} | bobble | cyan jacket, suspicious sideways glance
            [CAST]: {bystander} | cup | cafe mug mascot holding tray, unimpressed
            [SCENE]: chai stall | day | playful | IMAGE: bright stylized 3D cartoon corner cafe with floating neon mug sign, no people
            [{speakerB}]: (angry) Bro, you texted 'two minutes away' forty minutes ago — why are you still wearing slippers?!
            [{speakerA}]: (proud) Relax, my spirit arrived on time — my slippers just got stuck buffering on the couch!
            {memeMid("brain_buffering", "EXCUSE LEVEL 999+")}[SCENE]: comedy stage | sunset | laughing | IMAGE: vibrant 3D cartoon stage with spotlight rings and brick wall, no people
            [{bystander}]: (sarcastic) Hilarious — anyway your friend ordered four extra snacks on your tab while waiting!
            [{speakerA}]: (surprised) Wait... my payment app suddenly lost Wi-Fi right outside the door!
            {(isFull ? $"[{speakerB}]: (laughing) Nice try, I turned on my hotspot — pay up right now!" : string.Empty)}
            {memeMid("emotional_damage", "CAUGHT ZERO SIGNAL!")}
            """;
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

    private static IReadOnlyList<ComposedAutomationContent> ComposeDailyRashifal(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        bool isHindi)
    {
        var report = DailyRashifalEngine.BuildReport(signals);
        if (!string.IsNullOrWhiteSpace(rule.CustomTopicPrompt))
        {
            var rashiMatch = report.Rashis.FirstOrDefault(r =>
                rule.CustomTopicPrompt.Contains(r.Key, StringComparison.OrdinalIgnoreCase)
                || rule.CustomTopicPrompt.Contains(r.EnglishName, StringComparison.OrdinalIgnoreCase)
                || rule.CustomTopicPrompt.Contains(r.HindiName, StringComparison.OrdinalIgnoreCase));
            if (rashiMatch is not null)
                return [DailyRashifalEngine.ComposeSingleRashiPackage(report, rashiMatch, rule, links, primaryLink, isHindi)];
        }

        return [DailyRashifalEngine.ComposeCombinedOverviewPackage(report, rule, links, primaryLink, isHindi)];
    }

    private static IReadOnlyList<string> DefaultKeysForSource(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha or AutomationSourceType.DailyRashifal or AutomationSourceType.DevotionalPrarthana
            => ["panchang", "studio"],
        AutomationSourceType.AajKaItihaas
            => ["panchang", "blog", "pratiyogita", "studio"],
        AutomationSourceType.Pratiyogita
            => ["pratiyogita", "social", "studio"],
        AutomationSourceType.FunnyComedy
            => ["hub", "studio", "pratiyogita", "social"],
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
            var primary = links[0];
            sb.AppendLine($"🌐 {primary.Label}: {primary.TrackedUrl}");
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

    private static string FriendlyComedyStyleLabel(AnimStudio.Domain.Stories.ComedyToneStyle tone, bool isHindi) => tone switch
    {
        AnimStudio.Domain.Stories.ComedyToneStyle.DesiKhadiSitcom => isHindi ? "देसी खड़ी कॉमेडी शॉर्ट" : "Desi Sitcom Comedy",
        AnimStudio.Domain.Stories.ComedyToneStyle.KhadiBhasha => isHindi ? "खड़ी भाषा देसी कॉमेडी" : "Khadi Bhasha Comedy",
        AnimStudio.Domain.Stories.ComedyToneStyle.TuTadak => isHindi ? "असली यारों वाला देसी रोस्ट" : "Buddy Banter Comedy",
        AnimStudio.Domain.Stories.ComedyToneStyle.RoastAndTwist => isHindi ? "रोस्ट और ट्विस्ट कॉमेडी" : "Roast & Twist Comedy",
        AnimStudio.Domain.Stories.ComedyToneStyle.FamilyClean => isHindi ? "फैमिली कॉमेडी शॉर्ट" : "Family Comedy Short",
        AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick => isHindi ? "3D स्लैपस्टिक कॉमेडी" : "3D Slapstick Comedy",
        AnimStudio.Domain.Stories.ComedyToneStyle.TankSeries => isHindi ? "कार्टून टैंक कॉमेडी" : "Cartoon Tank Series",
        _ => isHindi ? "देसी 3D कॉमेडी शॉर्ट" : "3D Comedy Short"
    };

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

    private static (string SpeakerA, string SpeakerB) ResolveSpeakerPair(
        AutomationRule rule,
        string title,
        string? deityOrSage,
        bool isHindi = true)
    {
        if (!string.IsNullOrWhiteSpace(rule.SpeakerAName) && !string.IsNullOrWhiteSpace(rule.SpeakerBName))
            return (rule.SpeakerAName.Trim(), rule.SpeakerBName.Trim());

        var combined = $"{title} {deityOrSage}".ToLowerInvariant();
        if (isHindi)
        {
            if (combined.Contains("markandeya", StringComparison.Ordinal) || combined.Contains("मार्कण्डेय", StringComparison.Ordinal) || combined.Contains("प्रदोष", StringComparison.Ordinal))
                return ("बालक मार्कण्डेय", "भगवान शिव");
            if (combined.Contains("neelkanth", StringComparison.Ordinal) || combined.Contains("नीलकंठ", StringComparison.Ordinal) || combined.Contains("समुद्र मंथन", StringComparison.Ordinal))
                return ("भगवान शिव", "नारद मुनि");
            if (combined.Contains("savitri", StringComparison.Ordinal) || combined.Contains("सावित्री", StringComparison.Ordinal))
                return ("देवी सावित्री", "धर्मराज यम");
            if (combined.Contains("nachiketa", StringComparison.Ordinal) || combined.Contains("नचिकेता", StringComparison.Ordinal))
                return ("बालक नचिकेता", "यमराज");
            if (combined.Contains("dhruv", StringComparison.Ordinal) || combined.Contains("ध्रुव", StringComparison.Ordinal))
                return ("भक्त ध्रुव", "देवर्षि नारद मुनि");
            if (combined.Contains("harishchandra", StringComparison.Ordinal) || combined.Contains("हरिश्चंद्र", StringComparison.Ordinal))
                return ("राजा हरिश्चंद्र", "महर्षि विश्वामित्र");
            if (combined.Contains("prahlad", StringComparison.Ordinal) || combined.Contains("प्रह्लाद", StringComparison.Ordinal))
                return ("भक्त प्रह्लाद", "देवर्षि नारद मुनि");
            if (combined.Contains("sudama", StringComparison.Ordinal) || combined.Contains("सुदामा", StringComparison.Ordinal))
                return ("सुदामा", "भगवान श्रीकृष्ण");
            if (combined.Contains("arjun", StringComparison.Ordinal) || combined.Contains("अर्जुन", StringComparison.Ordinal) || combined.Contains("gita", StringComparison.Ordinal))
                return ("अर्जुन", "भगवान श्रीकृष्ण");
            if (combined.Contains("hanuman", StringComparison.Ordinal) || combined.Contains("हनुमान", StringComparison.Ordinal))
                return ("भगवान श्रीराम", "भक्त हनुमान");
        }

        var (inferredA, inferredB) = DialogueScriptParser.InferCharacterPairFromTitle(title, rule.SourceType.ToString());
        if (!string.IsNullOrWhiteSpace(inferredA) && !string.IsNullOrWhiteSpace(inferredB))
            return (inferredA, inferredB);

        var focus = !string.IsNullOrWhiteSpace(deityOrSage) ? deityOrSage.Trim() : (isHindi ? "जिज्ञासु" : "Curious Mind");
        return (isHindi ? "आचार्य" : "Acharya", focus);
    }

    private static (string Title, string Script) BuildHindiKathaPackage(
        AutomationRule rule,
        EcosystemDailyKathaSignal k,
        string dateKey,
        string? primaryLink,
        string speakerA,
        string speakerB)
    {
        var combined = $"{k.Title} {k.DeityOrSage} {k.StorySummary}".ToLowerInvariant();
        var mantra = !string.IsNullOrWhiteSpace(k.SanskritMantra)
            ? k.SanskritMantra.Trim()
            : "ॐ नमो भगवते वासुदेवाय";

        var fullStory = IsFullStoryMode(rule) || rule.VideoFormat == AutomationVideoFormat.Wide;
        var summaryBody = LocalizeBriefSummaryHindi(k.StorySummary, $"{k.Title} का यह अद्भुत प्रसंग हमें भक्ति, संयम और धर्म के मार्ग पर आगे बढ़ने की प्रेरणा देता है।");
        var moralBody = LocalizeBriefSummaryHindi(k.MoralTeaching, "सच्ची श्रद्धा, धैर्य और सद्कर्म से जीवन के हर संकट पर विजय मिलती है।");

        if (combined.Contains("markandeya", StringComparison.Ordinal)
            || combined.Contains("मार्कण्डेय", StringComparison.Ordinal)
            || combined.Contains("प्रदोष", StringComparison.Ordinal))
        {
            var title = Truncate($"मार्कण्डेय ऋषि और भगवान शिव की अमर कथा | प्रदोष व्रत महामृत्युंजय महिमा", MaxTitleLength);
            var script = fullStory
                ? $"""
                   [SCENE]: forest ashram | dawn | serene
                   [सूत्रधार]: (waving, wide) आज की यह पावन पौराणिक कथा प्रदोष वेला की महाशक्ति और ऋषि मृकण्डु के तेजस्वी पुत्र बालक मार्कण्डेय की अटूट शिव-भक्ति की अमर गाथा है। प्राचीन समय में आर्यावर्त के शांत तपोवन में ऋषि मृकण्डु और उनकी धर्मपत्नी माता मरुदमती संतान सुख की कामना से महादेव की आराधना करते रहे।
                   [ऋषि मृकण्डु]: (praying, diya) हे करुणासागर देवाधिदेव महादेव! हमारे तपोवन में धर्म और तपस्या का दीपक प्रज्वलित रखने के लिए एक सुयोग्य संतान का वरदान दीजिए।
                   [माता मरुदमती]: (praying) हे आशुतोष शंभो! हम वर्षों से निष्काम भाव से आपकी उपासना में लीन हैं — कृपया हमारी भक्ति स्वीकार करें।
                   [सूत्रधार]: (serene) उनकी निष्काम भक्ति से प्रसन्न होकर स्वयं महादेव प्रकट हुए और अनूठी परीक्षा रखी — सौ वर्ष का गुणहीन पुत्र या केवल सोलह वर्ष की अल्पायु वाला सर्वगुणसंपन्न शिवभक्त बालक?
                   [ऋषि मृकण्डु]: (proud, twoShot) हे प्रभो! सौ वर्षों का अज्ञान भला किस काम का? हमें तो वह अल्पजीवी किंतु धर्मनिष्ठ और शिवभक्त पुत्र ही स्वीकार है जो जीवन को परम सत्य से आलोकित कर दे।
                   [SCENE]: river ghat | day | peaceful
                   [सूत्रधार]: (happy) महादेव के वरदान से तेजस्वी बालक मार्कण्डेय का जन्म हुआ। माता-पिता के संस्कारों से मार्कण्डेय बचपन से ही वेदों और शिव मंत्र के परम साधक बन गए।
                   [{speakerA}]: (walking, happy, book) हे पूज्य पिताजी, मेरी सोलहवीं वर्षगाँठ समीप आ रही है, फिर आपके मुख पर यह गहरी चिंता और नेत्रों में अश्रु किस कारण हैं? कृपया यह रहस्य न छिपाएं।
                   [ऋषि मृकण्डु]: (sad, reactionZoom) वत्स मार्कण्डेय, तुम्हारे जन्म से पूर्व महादेव ने केवल सोलह वर्ष की ही आयु का विधान लिखा था। अब तुम्हारे जीवन का अंतिम प्रहर निकट आ रहा है।
                   [{speakerA}]: (proud, closeup) पिताजी, तनिक भी शोक न करें! जब महाकाल भगवान शिव सृष्टि के नियंता हैं, तब उनके चरणों की शरण में मृत्यु भी अमरता का द्वार बन जाती है।
                   [SCENE]: temple | sunset | glowing
                   [सूत्रधार]: (aarti, diya) बालक मार्कण्डेय प्रदोष वेला में संगम तट के पावन शिव मंदिर पहुँचे और दीप प्रज्वलित कर महादेव की एकाग्र भक्ति में लीन हो गए। चारों ओर मंत्रोच्चार गूँजने लगा: {mantra}।
                   [{speakerA}]: (aarti, diya) हे देवाधिदेव महादेव, प्रदोष वेला में यह पार्थिव शिवलिंग मेरी शरण है — ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्!
                   [SCENE]: cosmos | night | radiant
                   [यमराज]: (walking, angry, pointing, baton, lowDramatic) हे बालक मार्कण्डेय! सोलह वर्ष की आयु पूर्ण हो चुकी है। मृत्यु के अटल नियम से देवता और ऋषि भी मुक्त नहीं हो सकते। अब मेरे साथ यमलोक चलो!
                   [{speakerA}]: (praying, diya, closeUpSpeaker) हे धर्मराज यम, मैं महादेव के ध्यान और प्रदोष पूजन में स्थित हूँ। जब तक शिव आराधना पूर्ण नहीं होती, मैं अपने आराध्य के चरण नहीं छोड़ सकता!
                   [सूत्रधार]: (surprised, reactionZoom) जब यमराज ने कालपाश फेंका, तब नन्हे मार्कण्डेय ने भक्तिपूर्वक शिवलिंग का आलिंगन कर लिया — और उसी क्षण साक्षात् त्रिशूलधारी भगवान शिव प्रचंड दिव्य ज्योति से प्रकट हो गए!
                   [{speakerB}]: (proud, trishul, closeUpSpeaker) ठहरो धर्मराज! जो भक्त निष्काम प्रेम और प्रदोष भक्ति से मेरे चरणों में समर्पित होता है, काल उसे स्पर्श भी नहीं कर सकता। आज से मार्कण्डेय कल्प के अंत तक अजर-अमर रहेंगे!
                   [यमराज]: (praying, surprised) धन्य हो भक्तवत्सल महादेव! धन्य है बालक मार्कण्डेय की भक्ति — आज कालपाश स्वयं आपकी करुणा के आगे नतमस्तक है!
                   [{speakerA}]: (praying, twoShot) हे भक्तवत्सल शंभो! आपकी असीम कृपा से संपूर्ण जगत में महामृत्युंजय मंत्र और प्रदोष व्रत की महिमा सदैव अमर रहेगी।
                   [सूत्रधार]: (praying, wide) आज की पावन कथा की सीख — कठिनतम संकट में भी भय के बजाय ईश्वर पर अडिग विश्वास और सद्कर्म ही मनुष्य को विजयी बनाते हैं। संपूर्ण प्रदोष व्रत विधि और दैनिक पंचांग देखें: {primaryLink}
                   """
                : $"""
                   [SCENE]: temple | sunset | glowing
                   [सूत्रधार]: (waving) सोलह वर्ष की अल्पायु का वरदान पाने वाले बालक मार्कण्डेय ने प्रदोष वेला में साक्षात् महाकाल महादेव से अमरता कैसे प्राप्त की?
                   [{speakerA}]: (aarti, diya) पिताजी, महादेव की शरण में मृत्यु भी झुक जाती है। मैं आज प्रदोष काल में अखंड महामृत्युंजय जप करूँगा: {mantra}।
                   [SCENE]: cosmos | night | radiant
                   [यमराज]: (pointing, angry, baton) बालक मार्कण्डेय! तुम्हारे सोलह वर्ष पूर्ण हुए!
                   [{speakerB}]: (proud, trishul, closeUpSpeaker) ठहरो धर्मराज! मेरे अनन्य भक्त मार्कण्डेय पर कालपाश नहीं चल सकता — आज से यह अजर-अमर चिरंजीवी रहेगा!
                   [सूत्रधार]: (praying) जीवन सीख — अटल श्रद्धा और समर्पण हर महासंकट को विजय में बदल देते हैं। पूरी कथा व पंचांग देखें: {primaryLink}
                   """;
            return (title, script);
        }

        if (combined.Contains("neelkanth", StringComparison.Ordinal)
            || combined.Contains("नीलकंठ", StringComparison.Ordinal)
            || combined.Contains("समुद्र मंथन", StringComparison.Ordinal))
        {
            var title = Truncate($"समुद्र मंथन और भगवान शिव के नीलकंठ अवतार की संपूर्ण कथा | जीवन संदेश", MaxTitleLength);
            var script = $"""
                [सूत्रधार]: (waving) यह दिव्य कथा उस महासमुद्र मंथन की है जब अमरत्व और सृष्टि कल्याण के लिए देवताओं और असुरों ने मिलकर विशाल क्षीरसागर को मथा। मंदराचल पर्वत की मथानी और नागराज वासुकि की नेती बनी, किंतु अमृत से पहले जो प्रकट हुआ उसने तीनों लोकों को कंपकंपा दिया।
                [SCENE]: river bank | sunset | dramatic
                [{speakerB}]: (surprised) हे प्रभो श्रीहरि, समुद्र मंथन से अमृत के स्थान पर यह भयंकर कालकूट हलाहल विष निकल आया है! इसकी ज्वाला से समस्त वनस्पतियाँ, आकाश और प्राणी भस्म होने लगे हैं, अब सृष्टि की रक्षा कैसे होगी?
                [सूत्रधार]: चारों दिशाओं में त्राहि-त्राहि मच गई। ऐसे विकट क्षण में न कोई धन काम आया, न कोई अभिमान — तब सभी देवतागण करुण पुकार लेकर कैलाश पर्वत पर भगवान आशुतोष महादेव की शरण में पहुँचे।
                [SCENE]: himalaya | dawn | radiant
                [{speakerA}]: (praying) शांत हो जाओ देवगण! जब जीवन में विष और अमृत का मंथन होता है, तब पहले कड़वे संकटों को स्वीकार करना पड़ता है। लोककल्याण के लिए मैं स्वयं इस हलाहल विष को ग्रहण करता हूँ।
                [{speakerB}]: (confused) किंतु हे देवाधिदेव महादेव! यह विष इतना प्रबल है कि यदि आपने इसे पिया, तो संपूर्ण सृष्टि का संतुलन डगमगा सकता है।
                [{speakerA}]: (proud) चिन्ता न करो नारद! विश्व के मंगल के लिए मैं इस विष को न भीतर जाने दूँगा और न बाहर फैलने दूँगा — मैं इसे अपने कंठ में ही धारण करूँगा।
                [सूत्रधार]: महादेव ने निर्भय होकर हथेली पर संपूर्ण हलाहल विष लिया और जगत कल्याण की भावना से उसे कंठ में धारण कर लिया। विष के प्रभाव से महादेव का कंठ नीला हो गया और वे संपूर्ण ब्रह्मांड में 'नीलकंठ' कहलाए!
                [{speakerB}]: (praying) धन्य हो करुणासागर नीलकंठ! आज आपने हमें सिखाया कि सच्चा नेतृत्व सुख बांटने में नहीं, बल्कि समाज के विष को भी प्रेम और धैर्य से थाम लेने में है। {mantra}।
                [सूत्रधार]: कुछ समय पश्चात् धन्वंतरि भगवान अमृत कलश लेकर प्रकट हुए और देवताओं को नवजीवन प्राप्त हुआ। आज भी जीवन में सफलता से पहले संघर्षों का विष सामने आता है — जो धैर्य और परोपकार से उसे थाम लेता है, वही महान बनता है। पूरी कथा व दैनिक पंचांग देखें: {primaryLink}
                """;
            return (title, script);
        }

        if (combined.Contains("dhruv", StringComparison.Ordinal) || combined.Contains("ध्रुव", StringComparison.Ordinal))
        {
            var title = Truncate($"भक्त ध्रुव और देवर्षि नारद मुनि की संपूर्ण कथा | ध्रुव तारा की अमिट तपस्या", MaxTitleLength);
            var script = fullStory
                ? $"""
                   [सूत्रधार]: (waving) यह पावन कथा महाराज उत्तानपाद के पाँच वर्षीय नन्हे राजकुमार ध्रुव की है। एक दिन राजसभा में पिता की गोद में बैठने पर सौतेली माता रानी सुरुचि के कठोर वचनों से आहत होकर बालक ध्रुव रोते हुए अपनी माता सुनीति के पास पहुँचा।
                   [SCENE]: palace court | day | tense
                   [रानी सुनीति]: (sitting, sad) रोओ मत पुत्र ध्रुव! किसी के प्रति क्रोध मत रखो। जो स्थान ब्रह्मा और इंद्र से भी ऊपर तथा अटल है, वह राजसिंहासन से नहीं बल्कि केवल भगवान श्रीहरि विष्णु की भक्ति से मिलता है।
                   [{speakerA}]: (walking) माता, अब मैं उसी परमपिता श्रीहरि को पाने के लिए अभी उत्तर दिशा के वन की ओर जा रहा हूँ!
                   [SCENE]: forest ashram | dawn | serene
                   [सूत्रधार]: नन्हा बालक ध्रुव राजमहल का वैभव त्यागकर घने उत्तर वन पथ पर निकल पड़ा। मार्ग में आकाश मार्ग से विचरते देवर्षि नारद मुनि उसके सामने प्रकट हुए।
                   [{speakerB}]: (pointing) ठहरो बालक ध्रुव! अभी तुम्हारी उम्र खेलने की है। यह घोर मधुवन और कठोर तपस्या तुम्हारे बस की नहीं, लौट जाओ राजकुमार।
                   [{speakerA}]: (praying) हे देवर्षि नारद मुनि! स्वाभिमान और सत्य की अग्नि मेरे हृदय में प्रज्वलित है। मुझे ऐसा अटल पद चाहिए जो कभी न डगमगाए। कृपया मुझे भक्ति का सही मार्ग व मंत्र दीजिए।
                   [{speakerB}]: (proud) बालक ध्रुव, तुम्हारा संकल्प हिमालय जैसा अटल है! तो सुनो — यमुना तट स्थित पावन मधुवन में जाकर एकाग्र मन से द्वादशाक्षर महामंत्र जपो: {mantra}।
                   [SCENE]: cosmos | night | radiant
                   [सूत्रधार]: (sitting) नारद मुनि से मंत्र दीक्षा पाकर बालक ध्रुव ने मधुवन में निरंतर छह मास तक अखंड तपस्या की। उसके तेज से तीनों लोक आलोकित हो उठे!
                   [भगवान श्रीहरि विष्णु]: (proud, closeup) उठो प्यारे वत्स ध्रुव! मैं तुम्हारे निश्छल समर्पण से अत्यंत प्रसन्न हूँ। आज मैं तुम्हें आकाश मंडल में सप्तर्षियों से भी ऊपर अटल 'ध्रुव तारा' का अमर स्थान वरदान में देता हूँ, जो युगों-युगों तक दिशा दिखाएगा!
                   [{speakerA}]: (praying) हे प्रभो नारायण! आज मेरा जीवन सफल हुआ। जब भक्त निष्ठा से पुकारता है, तो आप स्वयं दर्शन देते हैं।
                   [सूत्रधार]: (praying) आज की पावन कथा की सीख — उम्र चाहे छोटी हो या परिस्थिति कितनी भी कठिन, सच्ची श्रद्धा, गुरु का मार्गदर्शन और अडिग संकल्प असंभव को भी संभव बना देता है। पूरी कथा व दैनिक पंचांग पढ़े: {primaryLink}
                   """
                : $"""
                   [सूत्रधार]: (waving) महाराज उत्तानपाद के पाँच वर्षीय पुत्र ध्रुव जब माता सुरुचि के कठोर वचनों से आहत हुए, तो माता सुनीति ने उन्हें राजमहल के बजाय भगवान श्रीहरि से अटल पद मांगने की प्रेरणा दी।
                   [SCENE]: palace court | day | tense
                   [{speakerB}]: (walking, surprised) ठहरो बालक ध्रुव! इतनी छोटी उम्र में तुम इस घोर वन की ओर क्यों जा रहे हो?
                   [SCENE]: forest ashram | dawn | serene
                   [{speakerA}]: (praying) हे देवर्षि नारद मुनि! मुझे तीनों लोकों में सबसे अटल स्थान पाना है। कृपया मुझे श्रीहरि की भक्ति का सही मंत्र व मार्ग बताइए।
                   [{speakerB}]: (proud) तुम्हारा संकल्प हिमालय जैसा अडिग है ध्रुव! यमुना तट पर मधुवन में जाकर एकाग्र मन से पावन मंत्र जपो: {mantra}।
                   [SCENE]: cosmos | night | radiant
                   [सूत्रधार]: (praying) छह मास की अखंड तपस्या के बाद स्वयं भगवान विष्णु ने दर्शन देकर ध्रुव को आकाश में अमर 'ध्रुव तारा' बनने का वरदान दिया!
                   [सूत्रधार]: कथा की सीख — उम्र या बाधा चाहे जैसी हो, निश्छल भक्ति, गुरु कृपा और अटूट संकल्प हर असंभव लक्ष्य दिलाते हैं। पूरी कथा पढ़ें: {primaryLink}
                   """;
            return (title, script);
        }

        if (combined.Contains("harishchandra", StringComparison.Ordinal) || combined.Contains("हरिश्चंद्र", StringComparison.Ordinal))
        {
            var title = Truncate($"राजा हरिश्चंद्र और महर्षि विश्वामित्र की सत्य परीक्षा | संपूर्ण पौराणिक संवाद", MaxTitleLength);
            var script = $"""
                [सूत्रधार]: सूर्यवंश के प्रतापी सम्राट राजा हरिश्चंद्र अपनी सत्यवादिता और दानशीलता के लिए तीनों लोकों में विख्यात थे। उनके अडिग सत्य की परीक्षा लेने स्वयं महर्षि विश्वामित्र पधारे।
                [{speakerA}]: हे महर्षि विश्वामित्र, वचन देकर मुकर जाना रघुकुल की मर्यादा नहीं। चाहे राज्य चला जाए, मैं अपने सत्य पर अडिग रहूँगा।
                [{speakerB}]: राजन्! आपकी परीक्षा अभी समाप्त नहीं हुई। जब राजपाट, परिवार और सर्वस्व छिन जाएगा, तब क्या यह सत्य का संकल्प टिक पाएगा?
                [{speakerA}]: धन, सिंहासन और वैभव तो अस्थायी हैं गुरुदेव, किंतु सत्य और धर्म अनंत हैं। मैं हर कठिन परीक्षा स्वीकार करता हूँ।
                [{speakerB}]: धन्य हो हरिश्चंद्र! आपके अटल सत्य ने आज स्वर्ग को भी नतमस्तक कर दिया। यही धर्म की वास्तविक विजय है: {mantra}।
                [सूत्रधार]: कथा की सीख — जो मनुष्य घोर संकट में भी सत्य और धर्म का साथ नहीं छोड़ता, अंततः ईश्वर स्वयं उसकी रक्षा व यश की पुनः स्थापना करते हैं। पूरी कथा व पंचांग देखें: {primaryLink}
                """;
            return (title, script);
        }

        if (combined.Contains("prahlad", StringComparison.Ordinal) || combined.Contains("प्रह्लाद", StringComparison.Ordinal))
        {
            var title = Truncate($"भक्त प्रह्लाद की अटूट भक्ति और श्रीहरि की रक्षा | संपूर्ण पौराणिक कथा", MaxTitleLength);
            var script = $"""
                [सूत्रधार]: असुरराज हिरण्यकशिपु के महल में जन्म लेकर भी बालक प्रह्लाद बचपन से ही भगवान श्रीहरि के अनन्य भक्त थे। पिता के घोर विरोध और प्राणदंड के बीच भी उन्होंने हरिनाम नहीं छोड़ा।
                [{speakerA}]: देवर्षि, चारों ओर भय और अत्याचार का साम्राज्य है, फिर भी मेरे हृदय में केवल भगवान श्रीहरि का नाम गूँजता है: {mantra}।
                [{speakerB}]: प्यारे प्रह्लाद, जहाँ निश्छल प्रेम और विश्वास होता है, वहाँ अग्नि, विष और पाषाण के खंभे में भी परमात्मा प्रकट हो जाते हैं!
                [सूत्रधार]: जब क्रोधित हिरण्यकशिपु ने खंभे पर प्रहार किया, तो स्वयं भगवान श्रीहरि ने अद्भुत नरसिंह अवतार लेकर अपने भक्त की रक्षा की!
                [सूत्रधार]: कथा की सीख — निश्छल भक्ति और धर्म का विश्वास संसार के हर भय और अहंकार पर विजयी होता है। पूरी कथा व पंचांग देखें: {primaryLink}
                """;
            return (title, script);
        }

        var hindiFocus = !IsMostlyLatin(k.Title) ? k.Title : $"{speakerA} और {speakerB} की पावन कथा";
        var genericTitle = Truncate($"आज की पौराणिक कथा • {hindiFocus} | {dateKey}", MaxTitleLength);

        var genericScript = $"""
            [सूत्रधार]: आइए समझते हैं '{hindiFocus}' की पावन पृष्ठभूमि — यह कथा कब, क्यों घटी और आज के जीवन के लिए क्यों महत्वपूर्ण है।
            [{speakerA}]: हे {speakerB}, आज की यह पावन कथा जीवन के सबसे गहरे सत्य को उजागर करती है — {hindiFocus}!
            [{speakerB}]: आप बिल्कुल सत्य कह रहे हैं {speakerA}। {summaryBody}
            [{speakerA}]: कठिन परिस्थिति और बदले हुए समय में भी जब मनुष्य अपने कर्तव्य और भक्ति से नहीं डिगता, तब ईश्वरीय कृपा स्वयं मार्ग बनाती है।
            [{speakerB}]: आइए स्मरण करें यह पावन मंत्र: {mantra}।
            [सूत्रधार]: कथा की अमूल्य सीख — {moralBody} इसी प्रकार की प्रेरणादायक कथाएं और दैनिक पंचांग पढ़ने के लिए पिन कमेंट के लिंक पर क्लिक करें: {primaryLink}
            """;

        return (genericTitle, genericScript);
    }

    private static string LocalizeFestivalHindiLabel(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "पर्व";
        var cleaned = raw.Trim()
            .Replace("Kartika ", "कार्तिक ", StringComparison.OrdinalIgnoreCase)
            .Replace("Margashirsha ", "मार्गशीर्ष ", StringComparison.OrdinalIgnoreCase)
            .Replace("Pausha ", "पौष ", StringComparison.OrdinalIgnoreCase)
            .Replace("Magha ", "माघ ", StringComparison.OrdinalIgnoreCase)
            .Replace("Phalguna ", "फाल्गुन ", StringComparison.OrdinalIgnoreCase)
            .Replace("Chaitra ", "चैत्र ", StringComparison.OrdinalIgnoreCase)
            .Replace("Vaishakha ", "वैशाख ", StringComparison.OrdinalIgnoreCase)
            .Replace("Jyeshtha ", "ज्येष्ठ ", StringComparison.OrdinalIgnoreCase)
            .Replace("Ashadha ", "आषाढ़ ", StringComparison.OrdinalIgnoreCase)
            .Replace("Shravana ", "श्रावण ", StringComparison.OrdinalIgnoreCase)
            .Replace("Bhadrapada ", "भाद्रपद ", StringComparison.OrdinalIgnoreCase)
            .Replace("Ashwin ", "आश्विन ", StringComparison.OrdinalIgnoreCase)
            .Replace("Shukla ", "शुक्ल ", StringComparison.OrdinalIgnoreCase)
            .Replace("Krishna ", "कृष्ण ", StringComparison.OrdinalIgnoreCase);
        return System.Text.RegularExpressions.Regex.Replace(cleaned, @"\s+", " ").Trim();
    }

    private static string LocalizeBriefSummaryHindi(string? raw, string hindiFallback)
    {
        if (string.IsNullOrWhiteSpace(raw)) return hindiFallback;
        var clean = raw.Trim();
        if (!IsMostlyLatin(clean)) return clean;

        // Clean known English prefixes so fallback narration never leaks mechanical labels like "Focus:" in Hindi videos.
        return hindiFallback;
    }

    public static bool IsMostlyLatin(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var latin = 0;
        var devanagari = 0;
        foreach (var ch in value)
        {
            if (ch is >= 'A' and <= 'Z' or >= 'a' and <= 'z') latin++;
            else if (ch is >= '\u0900' and <= '\u097F') devanagari++;
        }
        return latin > devanagari * 2 && latin >= 6;
    }

    public static bool NeedsHindiDialogueUpgrade(
        AutomationSourceType sourceType,
        string? language,
        string? title,
        string? script,
        bool isWideFormat = false)
    {
        if (string.Equals(language, "en", StringComparison.OrdinalIgnoreCase))
            return false;

        var dialogueCount = CountDialogueLines(script);
        if (dialogueCount == 0 || (script?.Contains("Focus:", StringComparison.OrdinalIgnoreCase) ?? false))
            return true;

        if (sourceType is AutomationSourceType.DailyKatha or AutomationSourceType.HinduPanchang
            or AutomationSourceType.HinduFestival or AutomationSourceType.AajKaItihaas)
        {
            if (IsMostlyLatin($"{title} {script}"))
                return true;
            if (isWideFormat && dialogueCount < 6)
                return true;
        }

        return false;
    }

    public static (string Title, string Script, string SpeakerA, string SpeakerB)? TryUpgradeLegacyPostToHindiDialogue(
        AutomationSourceType sourceType,
        string? language,
        string title,
        string script,
        string? dateKey,
        string? primaryUrl,
        string? speakerAName,
        string? speakerBName)
    {
        if (!NeedsHindiDialogueUpgrade(sourceType, language, title, script))
            return null;

        if (sourceType != AutomationSourceType.DailyKatha)
            return null;

        var syntheticRule = new AutomationRule
        {
            Language = "hi",
            SourceType = sourceType,
            EnableCharacterDialogue = true,
            SpeakerAName = speakerAName,
            SpeakerBName = speakerBName
        };
        var (speakerA, speakerB) = ResolveSpeakerPair(syntheticRule, title, null, isHindi: true);
        var syntheticKatha = new EcosystemDailyKathaSignal(
            null,
            title,
            $"{speakerA} & {speakerB}",
            script,
            null,
            null);
        var (upgradedTitle, upgradedScript) = BuildHindiKathaPackage(
            syntheticRule,
            syntheticKatha,
            dateKey ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            primaryUrl,
            speakerA,
            speakerB);
        return (upgradedTitle, upgradedScript, speakerA, speakerB);
    }

    private static int CountDialogueLines(string? script)
    {
        if (string.IsNullOrWhiteSpace(script)) return 0;
        var count = 0;
        foreach (var raw in script.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            var trimmed = raw.Trim();
            if (trimmed.StartsWith("[HOOK", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("[CORE", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("[CTA", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("[STORY", StringComparison.OrdinalIgnoreCase))
                continue;

            var colonIdx = trimmed.IndexOf(':');
            if (colonIdx > 1 && colonIdx <= 40 && !trimmed.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                count++;
        }
        return count;
    }

    private static ComposedAutomationContent EnrichCommunityAndTemplateMetadata(
        ComposedAutomationContent item,
        AutomationRule rule,
        ProceduralEventPalette palette,
        string dateKey,
        bool isHindi)
    {
        var poll = rule.SourceType switch
        {
            AutomationSourceType.HinduPanchang => isHindi
                ? new[] { "हां, हर हर महादेव 🙏", "सुबह शुभ मुहूर्त चेक कर लिया ✨", "पूरी पंचांग वेबसाइट देखना चाहता हूं 🔗" }
                : new[] { "Yes — checking Muhurat daily 🙏", "Useful Shubh Muhurat timing ✨", "Visit Panchang website 🔗" },
            AutomationSourceType.DailyRashifal => isHindi
                ? new[] { "आज का राशिफल व उपाय बहुत सटीक लगा ♈✨", "मेरी राशि का शुभ योग अच्छा है 🙏", "सभी 12 राशियों व पंचांग देखें 🔗" }
                : new[] { "Today's Rashi guidance feels spot on ♈✨", "Lucky transit & helpful Upay 🙏", "Check full Panchang & Rashifal 🔗" },
            AutomationSourceType.HinduFestival => isHindi
                ? new[] { "आज पूजा और व्रत कर रहे हैं 🪔", "कल के मुहूर्त की तैयारी ✨", "आरती व पूजा विधि लिंक देखें 🔗" }
                : new[] { "Celebrating today with Puja 🪔", "Preparing for tomorrow's Vrat ✨", "Read full Puja Vidhi 🔗" },
            AutomationSourceType.DailyKatha or AutomationSourceType.DevotionalPrarthana => isHindi
                ? new[] { "हर हर महादेव / जय श्री राम 🙏", "मन को बहुत शांति मिली ✨", "कल किस भगवान की प्रार्थना लाएँ? 🌸" }
                : new[] { "Feeling peaceful & blessed 🙏", "Daily devotion keeps us grounded ✨", "Share your favorite deity prayer 🌸" },
            AutomationSourceType.AajKaItihaas => isHindi
                ? new[] { "इतिहास से अनजानी जानकारी 📚", "एग्जाम GK के लिए उपयोगी ✅", "पूरी टाइमलाइन वेबसाइट पर पढ़ें 🔗" }
                : new[] { "Did not know this event! 📚", "Great for GK & Exam prep ✅", "Read full timeline 🔗" },
            AutomationSourceType.Pratiyogita => isHindi
                ? new[] { "क्विज़ में हिस्सा ले लिया 🏆", "आज ही प्रैक्टिस करूंगा ✍️", "रैंक और रिजल्ट लिंक देखें 🔗" }
                : new[] { "Already joined today's challenge 🏆", "Practicing right now ✍️", "View live leaderboard 🔗" },
            AutomationSourceType.FunnyComedy => isHindi
                ? new[] { "हाहा! आखिरी पंच ने लुटिया डुबो दी 😂", "पप्पू भैया और बबलू जैसा दोस्त सबको मिले 🤣", "अगला देसी रोस्ट किस टॉपिक पर लाएँ? 🔥" }
                : new[] { "That plot twist caught me off guard 😂", "Tag your friend who acts just like this 🤣", "Drop next comedy skit topic below! 🔥" },
            _ => isHindi
                ? new[] { "बहुत उपयोगी जानकारी 🚀", "प्रतिदिन उपयोग के लिए सेव किया ⭐", "सभी टूल्स व लिंक देखें 🔗" }
                : new[] { "Excited to try this tool 🚀", "Saving for daily workflow ⭐", "Visit full ecosystem links 🔗" }
        };

        var primaryUrl = item.PrimaryDestinationUrl ?? string.Empty;
        var summaryLine = string.IsNullOrWhiteSpace(item.SourceSummary) ? string.Empty : $"{item.SourceSummary}\n\n";
        var pollLines = string.Join("\n", poll.Select((opt, idx) => $"{idx + 1}. {opt}"));
        var ctaBlock = !string.IsNullOrWhiteSpace(primaryUrl)
            ? (isHindi ? $"🔗 पूरा विवरण व टूल्स यहाँ देखें: {primaryUrl}" : $"🔗 Explore full details here: {primaryUrl}")
            : string.Empty;

        var communityBody = $"""
            📌 {item.Title}

            {summaryLine}🗳️ {(isHindi ? "आपका वोट और विचार साझा करें:" : "Vote in today's Community Poll:")}
            {pollLines}

            {ctaBlock}
            """.Trim();

        var bannerDate = string.IsNullOrWhiteSpace(item.EventDateKey) ? dateKey : item.EventDateKey;
        var bannerText = $"{palette.HeaderBadgeText} • {bannerDate}";

        // Automatically sanitize & enforce all YouTube & AdSense policy rules (title <= 100, clean description + CTA,
        // <= 8 hashtags, <= 500-char tags, zero engagement-bait / shorteners, proper MadeForKids declaration).
        var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: item.Title,
            rawDescription: item.Description,
            rawTags: item.Tags,
            rawPinnedComment: item.PinnedComment,
            fallbackTopicTitle: item.SourceTitle,
            primaryDestinationUrl: item.PrimaryDestinationUrl,
            requestedMadeForKids: rule.MadeForKids,
            isShort: rule.VideoFormat == AutomationVideoFormat.Vertical,
            language: rule.Language);

        return item with
        {
            Title = sanitized.Title,
            Description = sanitized.Description,
            Tags = sanitized.Tags,
            PinnedComment = sanitized.PinnedComment,
            CommunityPostText = communityBody,
            CommunityPollOptions = poll,
            HeaderBannerText = bannerText,
            EventColorHex = palette.PrimaryHex
        };
    }

    private static IReadOnlyList<AutomationWebsiteLink> RetargetLinksDate(
        IReadOnlyList<AutomationWebsiteLink> links,
        string fromDateKey,
        string toDateKey)
    {
        if (string.Equals(fromDateKey, toDateKey, StringComparison.Ordinal)) return links;
        var oldStamp = $"_{fromDateKey.Replace("-", string.Empty)}";
        var newStamp = $"_{toDateKey.Replace("-", string.Empty)}";
        return [.. links.Select(l => new AutomationWebsiteLink
        {
            Key = l.Key,
            Label = l.Label,
            BaseUrl = l.BaseUrl,
            TrackedUrl = l.TrackedUrl.Replace(oldStamp, newStamp, StringComparison.Ordinal)
        })];
    }

    private static bool IsGenericOrDefaultLocation(string? location)
    {
        if (string.IsNullOrWhiteSpace(location)) return true;
        var loc = location.Trim();
        return loc.Contains("New Delhi", StringComparison.OrdinalIgnoreCase)
            || loc.Contains("India", StringComparison.OrdinalIgnoreCase) && !loc.Contains(',', StringComparison.Ordinal)
            || loc.Contains("IST", StringComparison.OrdinalIgnoreCase);
    }

    private static string Truncate(string input, int maxLen) =>
        input.Length <= maxLen ? input : input[..(maxLen - 1)].TrimEnd() + "…";
}
