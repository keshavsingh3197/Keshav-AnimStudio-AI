using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

/// <summary>
/// Prevents repeating the same Katha or historical incident that is already uploaded, scheduled,
/// or prepared on the target YouTube channel by matching core story subjects across Hindi and English titles.
/// </summary>
public static class ChannelContentDeduplicator
{
    private static readonly (string Key, string[] Aliases)[] StorySubjectAliases =
    [
        ("vaikuntha", ["वैकुंठ चतुर्दशी", "vaikuntha chaturdashi", "vaikunth chaturdashi", "हरिहर", "harihar", "कमलनयन", "kamalnayan", "चक्रदान", "chakradana"]),
        ("devdeepawali", ["देव दीपावली", "dev deepawali", "त्रिपुरासुर", "tripurasura", "कार्तिक पूर्णिमा", "kartik purnima"]),
        ("markandeya", ["मार्कण्डेय", "markandeya", "महामृत्युंजय", "mrityunjay", "maha mrityunjaya", "pradosh katha", "प्रदोष व्रत कथा"]),
        ("harishchandra", ["हरिश्चंद्र", "harishchandra", "सत्य की विजय"]),
        ("dhruva", ["ध्रुव", "dhruva", "dhruv"]),
        ("prahlad", ["प्रह्लाद", "prahlad", "नरसिंह", "narasimha", "narsingh"]),
        ("savitri", ["सावित्री", "savitri", "सत्यवान", "satyavan"]),
        ("neelkanth", ["नीलकंठ", "neelkanth", "समुद्र मंथन", "samudra manthan", "halahal", "हलाहल"]),
        ("nachiketa", ["नचिकेता", "nachiketa", "कठोपनिषद", "kathopanishad"]),
        ("shabari", ["शबरी", "shabari", "बेर"]),
        ("sudama", ["सुदामा", "sudama"]),
        ("kurukshetra", ["गीता", "gita", "कुरुक्षेत्र", "kurukshetra", "अर्जुन", "arjun"]),
        ("tulsi", ["तुलसी विवाह", "tulsi vivah", "shaligram", "शालिग्राम"]),
        ("narad", ["नारद", "narad"])
    ];

    private sealed record CuratedKathaOption(
        string Key,
        EcosystemDailyKathaSignal Signal,
        string[] FestivalHints);

    private static readonly CuratedKathaOption[] CuratedKathaPool =
    [
        new(
            "vaikuntha",
            new EcosystemDailyKathaSignal(
                Id: "katha-vaikuntha",
                Title: "वैकुंठ चतुर्दशी और हरिहर मिलन की अमर कथा (१००० कमल, कमलनयन नेत्र व सुदर्शन चक्र)",
                DeityOrSage: "भगवान श्रीहरि विष्णु एवं भगवान शिव",
                StorySummary: "कार्तिक शुक्ल चतुर्दशी (वैकुंठ चतुर्दशी) को भगवान विष्णु काशी विश्वनाथ में १,००० स्वर्ण कमलों से महादेव की सहस्रनाम आराधना करने पहुँचे। परीक्षा लेने हेतु महादेव ने अंतिम कमल छिपा दिया, तो कमलनयन श्रीहरि ने अपना नेत्र ही कमल मानकर अर्पित करने का संकल्प लिया। प्रसन्न होकर साक्षात् भगवान शिव प्रकट हुए, उन्हें सुदर्शन चक्र प्रदान किया और तुलसी-बेलपत्र के आदान-प्रदान संग दिव्य हरिहर मिलन रचा।",
                MoralTeaching: "हरि (विष्णु) और हर (शिव) एक ही परमात्मा के दो स्वरूप हैं; निष्काम भक्ति भेदभाव मिटाकर वैकुंठ के द्वार खोलती है।",
                SanskritMantra: "ॐ नमो भगवते वासुदेवाय नमः शिवाय च",
                IsVerified: true,
                SourceName: "Shiva Purana (Kotirudra Samhita) & Padma Purana"),
            ["vaikunth", "वैकुंठ", "harihar", "हरिहर", "chaturdashi", "चतुर्दशी"]),
        new(
            "devdeepawali",
            new EcosystemDailyKathaSignal(
                Id: "katha-dev-deepawali",
                Title: "कार्तिक पूर्णिमा और देव दीपावली की अमर कथा (भगवान शिव त्रिपुरारी एवं काशी दीपदान)",
                DeityOrSage: "भगवान शिव एवं देवतागण",
                StorySummary: "कार्तिक पूर्णिमा के दिन ही देवाधिदेव महादेव ने त्रिपुरासुर के तीन अभेद्य पुरों का संहार कर तीनों लोकों को भयमुक्त किया था। उस विजय के उत्सव में समस्त देवता काशी के गंगा घाटों पर उतरे और लाखों दीप प्रज्वलित कर देव दीपावली मनाई।",
                MoralTeaching: "अधर्म कितना भी प्रबल क्यों न हो, सत्य और लोककल्याण की एकता अंततः अंधकार का नाश करती है।",
                SanskritMantra: "ॐ नमः शिवाय शुभं कुरु",
                IsVerified: true,
                SourceName: "Shiva Purana & Matsya Purana"),
            ["kartik purnima", "कार्तिक पूर्णिमा", "dev deepawali", "देव दीपावली"]),
        new(
            "markandeya",
            new EcosystemDailyKathaSignal(
                Id: "katha-markandeya",
                Title: "मार्कण्डेय ऋषि और भगवान शिव की अमर कथा (महामृत्युंजय व प्रदोष महिमा)",
                DeityOrSage: "ऋषि मार्कण्डेय एवं भगवान शिव",
                StorySummary: "सोलह वर्ष की अल्पायु का शाप पाने वाले बालक मार्कण्डेय ने प्रदोष वेला में महादेव के शिवलिंग का आलिंगन कर महामृत्युंजय मंत्र का जाप किया। काल स्वयं यमराज के रूप में आया, किंतु भक्त की पुकार पर भगवान शिव त्रिशूल लेकर प्रकट हुए और उन्हें अजर-अमर चिरंजीवी होने का वरदान दिया।",
                MoralTeaching: "अटल भक्ति, गुरु मंत्र और निश्छल समर्पण मृत्यु जैसे महासंकट को भी टाल देते हैं।",
                SanskritMantra: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्",
                IsVerified: true,
                SourceName: "Shiva Purana & Markandeya Purana"),
            ["pradosh", "प्रदोष", "shiv", "शिव", "trayodashi", "त्रयोदशी"]),
        new(
            "neelkanth",
            new EcosystemDailyKathaSignal(
                Id: "katha-neelkanth",
                Title: "समुद्र मंथन और भगवान शिव के नीलकंठ अवतार की कथा",
                DeityOrSage: "भगवान शिव नीलकंठ एवं देवगण",
                StorySummary: "देवताओं और असुरों के समुद्र मंथन से जब पहले सृष्टि को भस्म करने वाला हलाहल विष निकला, तब संपूर्ण ब्रह्मांड की रक्षा के लिए भगवान शिव ने उस विष को अपने कंठ में धारण कर लिया और नीलकंठ कहलाए।",
                MoralTeaching: "सच्चा नेतृत्व दूसरों के संकट को स्वयं स्वीकार कर जगत के कल्याण की रक्षा करना है।",
                SanskritMantra: "ॐ नमः शिवाय",
                IsVerified: true,
                SourceName: "Srimad Bhagavatam & Shiva Purana"),
            ["shiv", "शिव", "sawan", "somvar", "pradosh"]),
        new(
            "prahlad",
            new EcosystemDailyKathaSignal(
                Id: "katha-prahlad",
                Title: "भक्त प्रह्लाद की अटूट भक्ति और नरसिंह अवतार की कथा",
                DeityOrSage: "भक्त प्रह्लाद एवं भगवान नरसिंह",
                StorySummary: "असुर सम्राट हिरण्यकशिपु के घोर अत्याचार, अग्नि और विष परीक्षा के बीच भी बालक प्रह्लाद का हरि नाम पर विश्वास अडिग रहा। अंततः खंभे से भगवान विष्णु नरसिंह रूप में प्रकट हुए और धर्म की रक्षा की।",
                MoralTeaching: "ईश्वर पर अटल विश्वास रखने वाला भक्त कभी अकेला नहीं होता।",
                SanskritMantra: "ॐ नमो भगवते वासुदेवाय",
                IsVerified: true,
                SourceName: "Vishnu Purana & Bhagavata Purana"),
            ["ekadashi", "एकादशी", "narasimha", "vishnu"]),
        new(
            "savitri",
            new EcosystemDailyKathaSignal(
                Id: "katha-savitri",
                Title: "माता सावित्री का अडिग धर्म और सत्यवान के पुनर्जीवन की कथा",
                DeityOrSage: "देवी सावित्री एवं यमराज",
                StorySummary: "सत्यवान की अल्पायु जानते हुए भी राजकुमारी सावित्री ने धर्म का साथ नहीं छोड़ा। जब यमराज सत्यवान के प्राण हर कर चले, तब सावित्री अपने तपोबल, संयम और धर्म संवाद से यमराज से अपने कुल, पिता और पति के प्राण पुनः जीत लाईं।",
                MoralTeaching: "ज्ञान, संयम और धर्मनिष्ठा से विपरीत परिस्थितियों को भी अनुकूल बनाया जा सकता है।",
                SanskritMantra: "सत्यं वद धर्मं चर",
                IsVerified: true,
                SourceName: "Mahabharata Vana Parva"),
            ["vat", "savitri", "purnima", "vrat"]),
        new(
            "nachiketa",
            new EcosystemDailyKathaSignal(
                Id: "katha-nachiketa",
                Title: "बालक नचिकेता और यमराज का अद्भुत आत्मज्ञान संवाद",
                DeityOrSage: "नचिकेता एवं धर्मराज यम",
                StorySummary: "पिता वाजश्रवा के वचन का मान रखने के लिए बालक नचिकेता स्वयं यमलोक पहुँचे। तीन दिन के अडिग धैर्य के बाद यमराज ने उन्हें धन-संपदा के बदले आत्मा के अमर रहस्य का ब्रह्मज्ञान प्रदान किया।",
                MoralTeaching: "सत्य की जिज्ञासा और निर्भय संकल्प मनुष्य को क्षणिक प्रलोभनों से ऊपर उठाता है।",
                SanskritMantra: "उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत",
                IsVerified: true,
                SourceName: "Kathopanishad"),
            []),
        new(
            "dhruva",
            new EcosystemDailyKathaSignal(
                Id: "katha-dhruva",
                Title: "भक्त ध्रुव और देवर्षि नारद मुनि की अटल तपस्या कथा",
                DeityOrSage: "भक्त ध्रुव एवं देवर्षि नारद मुनि",
                StorySummary: "नन्हे बालक ध्रुव ने माता सुनीति की प्रेरणा और देवर्षि नारद मुनि के मंत्र मार्गदर्शन से मधुवन में कठोर तपस्या कर आकाश में अमर ध्रुव तारे का अटल पद प्राप्त किया।",
                MoralTeaching: "निश्छल संकल्प और गुरु कृपा से आयु या बाधा कभी लक्ष्य के आड़े नहीं आती।",
                SanskritMantra: "ॐ नमो भगवते वासुदेवाय",
                IsVerified: true,
                SourceName: "Srimad Bhagavatam Canto 4"),
            [])
    ];

    public static bool ConflictsWithExisting(string? candidateTitle, IEnumerable<string> existingTitles)
    {
        if (string.IsNullOrWhiteSpace(candidateTitle))
            return false;

        var candSubjects = ExtractSubjects(candidateTitle);
        var candWords = SignificantWords(candidateTitle);

        foreach (var existing in existingTitles)
        {
            if (string.IsNullOrWhiteSpace(existing)) continue;

            var exSubjects = ExtractSubjects(existing);
            if (candSubjects.Count > 0 && exSubjects.Overlaps(candSubjects))
                return true;

            var exWords = SignificantWords(existing);
            if (candWords.Count >= 2 && exWords.Count >= 2)
            {
                var overlap = candWords.Count(w => exWords.Contains(w));
                var threshold = Math.Min(3, Math.Min(candWords.Count, exWords.Count));
                if (overlap >= threshold)
                    return true;
            }
        }

        return false;
    }

    public static EcosystemDailyKathaSignal SelectFreshDailyKatha(
        EcosystemDailyKathaSignal? apiKatha,
        IReadOnlyList<EcosystemFestivalSignal> festivals,
        string dateKey,
        IReadOnlyList<string> existingChannelTitles)
    {
        var activeFestivalText = string.Join(' ', festivals
            .Where(f => string.Equals(f.DateKey, dateKey, StringComparison.Ordinal))
            .Select(f => $"{f.NameHindi} {f.NameEnglish} {f.Tithi}"));

        // 1. Prefer a fresh curated Katha directly tied to today's active Vrat/Festival (e.g. Vaikuntha Chaturdashi -> Harihar Milan).
        //    Do not let Panchang updates or brief Festival Vrat/Muhurat #Shorts block publishing the full festival Pauranik Katha.
        if (!string.IsNullOrWhiteSpace(activeFestivalText))
        {
            var kathaOnlyHistory = existingChannelTitles.Where(t => !IsNonKathaShortOrAlert(t)).ToList();
            var festivalMatch = CuratedKathaPool.FirstOrDefault(opt =>
                opt.FestivalHints.Any(h => activeFestivalText.Contains(h, StringComparison.OrdinalIgnoreCase))
                && !ConflictsWithExisting(opt.Signal.Title, kathaOnlyHistory));
            if (festivalMatch is not null)
                return festivalMatch.Signal;
        }

        // 2. Keep upstream daily-katha ONLY if it does not repeat a story already on the channel!
        if (apiKatha is not null && !ConflictsWithExisting($"{apiKatha.Title} {apiKatha.DeityOrSage}", existingChannelTitles))
            return apiKatha;

        // 3. Otherwise rotate to the first fresh curated Katha not yet covered on the channel.
        var unused = CuratedKathaPool.FirstOrDefault(opt =>
            !ConflictsWithExisting($"{opt.Signal.Title} {opt.Signal.DeityOrSage}", existingChannelTitles));
        return unused?.Signal ?? apiKatha ?? CuratedKathaPool[0].Signal;
    }

    public static bool HasFestivalMatchingKatha(
        EcosystemDailyKathaSignal? selectedKatha,
        IReadOnlyList<EcosystemFestivalSignal> festivals,
        string dateKey)
    {
        if (selectedKatha is null) return false;
        var activeFestivalText = string.Join(' ', festivals
            .Where(f => string.Equals(f.DateKey, dateKey, StringComparison.Ordinal))
            .Select(f => $"{f.NameHindi} {f.NameEnglish} {f.Tithi}"));
        if (string.IsNullOrWhiteSpace(activeFestivalText))
            return false;

        var opt = CuratedKathaPool.FirstOrDefault(o =>
            string.Equals(o.Signal.Id, selectedKatha.Id, StringComparison.OrdinalIgnoreCase)
            || (o.FestivalHints.Any(h => activeFestivalText.Contains(h, StringComparison.OrdinalIgnoreCase))
                && ExtractSubjects(o.Signal.Title).Overlaps(ExtractSubjects($"{selectedKatha.Title} {selectedKatha.DeityOrSage}"))));
        return opt is not null && opt.FestivalHints.Any(h => activeFestivalText.Contains(h, StringComparison.OrdinalIgnoreCase));
    }

    public static IReadOnlyList<EcosystemHistoricalSignal> PrioritizeFreshHistorical(
        IReadOnlyList<EcosystemHistoricalSignal> incidents,
        IReadOnlyList<string> existingChannelTitles)
    {
        if (incidents.Count <= 1 || existingChannelTitles.Count == 0)
            return incidents;

        var fresh = incidents.Where(i => !ConflictsWithExisting($"{i.Year} {i.Title}", existingChannelTitles)).ToList();
        if (fresh.Count == 0)
            return incidents;

        var seen = new HashSet<EcosystemHistoricalSignal>(fresh);
        return [.. fresh, .. incidents.Where(i => !seen.Contains(i))];
    }

    private static HashSet<string> ExtractSubjects(string text)
    {
        var lower = text.ToLowerInvariant();
        var matched = new HashSet<string>(StringComparer.Ordinal);
        foreach (var (key, aliases) in StorySubjectAliases)
        {
            if (aliases.Any(a => lower.Contains(a, StringComparison.Ordinal)))
                matched.Add(key);
        }
        return matched;
    }

    private static HashSet<string> SignificantWords(string text) =>
        text.ToLowerInvariant()
            .Split([' ', '|', '•', ':', ',', '.', '-', '(', ')', '!', '?'], StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= 4 && !StopWords.Contains(w))
            .ToHashSet(StringComparer.Ordinal);

    private static bool IsNonKathaShortOrAlert(string title) =>
        title.Contains("पंचांग", StringComparison.Ordinal)
        || title.Contains("panchang", StringComparison.OrdinalIgnoreCase)
        || title.Contains("मुहूर्त व पूजा विधि", StringComparison.Ordinal)
        || title.Contains("व्रत विधि", StringComparison.Ordinal)
        || title.Contains("दीपदान का महत्व", StringComparison.Ordinal)
        || title.Contains("#shorts", StringComparison.OrdinalIgnoreCase);

    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "katha", "story", "video", "short", "shorts", "full", "complete", "daily", "today", "2026",
        "कथा", "कहानी", "वीडियो", "संपूर्ण", "सत्य", "पौराणिक", "दैनिक", "इतिहास", "घटना", "विजय",
        "भगवान", "महादेव", "विष्णु", "मुहूर्त", "पूजा", "विधि"
    };
}
