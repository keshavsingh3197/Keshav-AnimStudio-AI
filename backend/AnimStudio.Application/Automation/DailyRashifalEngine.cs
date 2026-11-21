using AnimStudio.Application.Ecosystem;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

public sealed record DailyRashiForecast(
    string Key,
    int Order,
    string HindiName,
    string EnglishName,
    string Symbol,
    string RulerHindi,
    string ElementHindi,
    string MeaningSummary,
    string TodayPredictionHindi,
    string TodayPredictionEnglish,
    string AacharanUpayHindi,
    string AacharanUpayEnglish,
    string LuckyColor,
    int LuckyNumber,
    string Mantra,
    bool IsShubhChandrabalam,
    int GocharHouseFromMoon,
    int FavorabilityScore,
    string StatusBadge);

public sealed record DailyRashifalReport(
    string DateKey,
    string Location,
    string? MoonSign,
    string? SunSign,
    string Tithi,
    string Nakshatra,
    string Vaara,
    string AbhijitMuhurat,
    string RahuKaal,
    bool IsVerifiedPanchang,
    IReadOnlyList<DailyRashiForecast> Rashis);

/// <summary>
/// Generates authentic Vedic Daily Rashifal forecasts for all 12 Rashis (Mesha to Meena) directly from
/// verified Panchang Chandra-Rashi (<see cref="EcosystemPanchangSignal.MoonSign"/>), Nakshatra, Vaara, Tithi,
/// and <see cref="EcosystemPanchangSignal.ChandrabalamGoodRashis"/> — powering fast animated 2D Rashifal Shorts.
/// </summary>
public static class DailyRashifalEngine
{
    private sealed record RashiMeta(
        string Key,
        int Index,
        string HindiName,
        string EnglishName,
        string Symbol,
        string RulerHindi,
        string ElementHindi,
        string NatureHindi,
        string Mantra,
        string DefaultRemedyHi,
        string DefaultRemedyEn,
        string ColorHi,
        int BaseLuckyNumber);

    private static readonly RashiMeta[] AllRashis =
    [
        new("mesha", 0, "मेष", "Aries", "♈", "मंगल (Mars)", "अग्नि", "साहस, पहल, नेतृत्व व त्वरित ऊर्जा की प्रथम राशि", "ॐ अं अंगारकाय नमः", "हनुमान चालीसा पाठ करें और क्रोध पर संयम रखें; लाल फल या मसूर दान करें", "Recite Hanuman Chalisa, practice calm restraint, and offer red fruit.", "केसरिया / लाल", 9),
        new("vrishabha", 1, "वृषभ", "Taurus", "♉", "शुक्र (Venus)", "पृथ्वी", "स्थिरता, मधुर वाणी, कला, धन संचय व धैर्य की राशि", "ॐ शुं शुक्राय नमः", "गाय को हरा चारा या सफेद मिष्ठान खिलाएँ; मधुर वाणी का आचरण रखें", "Feed green fodder or sweets to a cow and speak with warmth.", "क्रीम / सफेद", 6),
        new("mithuna", 2, "मिथुन", "Gemini", "♊", "बुध (Mercury)", "वायु", "बुद्धि, संवाद, व्यापार कौशल व बहुमुखी प्रतिभा की राशि", "ॐ बुं बुधाय नमः", "गणेश जी को दूर्वा अर्पित करें और किसी छात्र की पढ़ाई में मदद करें", "Offer durva grass to Lord Ganesha and mentor or help a student.", "हरा", 5),
        new("karka", 3, "कर्क", "Cancer", "♋", "चन्द्रमा (Moon)", "जल", "संवेदनशीलता, मातृत्व स्नेह, पोषण व अंतर्ज्ञान की राशि", "ॐ सों सोमाय नमः", "माता या बड़े-बुजुर्ग का आशीर्वाद लें; शिवलिंग पर जल अर्पित करें", "Seek blessings from elders and offer pure water on a Shivling.", "मोती सफेद", 2),
        new("simha", 4, "सिंह", "Leo", "♌", "सूर्य (Sun)", "अग्नि", "आत्मबल, तेज, सम्मान, उदारता व राजसी नेतृत्व की राशि", "ॐ घृणि सूर्याय नमः", "सूर्य को तांबे के लोटे से जल दें और अहंकार से दूर रहकर विनम्र आचरण करें", "Offer morning Surya Arghya and lead with humility.", "सुनहरा / नारंगी", 1),
        new("kanya", 5, "कन्या", "Virgo", "♍", "बुध (Mercury)", "पृथ्वी", "विश्लेषण, सेवा भाव, स्वास्थ्य सजगता व सटीकता की राशि", "ॐ नमो भगवते वासुदेवाय", "तुलसी के पास घी का दीपक जलाएँ और पेंडिंग कार्य अनुशासन से पूरा करें", "Light a diya near Tulsi and complete pending duties systematically.", "हल्का हरा", 5),
        new("tula", 6, "तुला", "Libra", "♎", "शुक्र (Venus)", "वायु", "संतुलन, न्याय, साझेदारी, सौंदर्य व कूटनीति की राशि", "ॐ महालक्ष्म्यै नमः", "सबके प्रति निष्पक्ष व्यवहार रखें; सफेद पुष्प मंदिर में अर्पित करें", "Maintain fairness in relationships and offer white flowers at a temple.", "सफेद / आसमानी", 6),
        new("vrishchika", 7, "वृश्चिक", "Scorpio", "♏", "मंगल (Mars)", "जल", "गहनता, शोध, दृढ़ संकल्प व आत्म-परिवर्तन की राशि", "ॐ नमोः शिवाय", "गोपनीय बातें किसी से साझा न करें; जरूरतमंद को गुड़-चना दान करें", "Keep confidential plans private and share jaggery-gram in charity.", "मैरून / लाल", 8),
        new("dhanu", 8, "धनु", "Sagittarius", "♐", "गुरु (Jupiter)", "अग्नि", "धर्म, उच्च ज्ञान, आदर्श, भाग्य व दूरदृष्टि की राशि", "ॐ बृं बृहस्पतये नमः", "माथे पर केसर या हल्दी तिलक लगाएँ; गुरु व पुस्तकों का सम्मान करें", "Apply a saffron/turmeric tilak and honour teachers and wisdom.", "पीला", 3),
        new("makara", 9, "मकर", "Capricorn", "♑", "शनि (Saturn)", "पृथ्वी", "कर्मठता, अनुशासन, धैर्य व दीर्घकालीन सफलता की राशि", "ॐ शं शनैश्चराय नमः", "मेहनतकश लोगों का सम्मान करें और पीपल के वृक्ष के नीचे दीप जलाएँ", "Respect workers, practice patience, and light a lamp under a Peepal tree.", "नीला / स्लेटी", 8),
        new("kumbha", 10, "कुंभ", "Aquarius", "♒", "शनि (Saturn)", "वायु", "नवाचार, समाज कल्याण, मित्रता व स्वतंत्र चिंतन की राशि", "ॐ त्र्यम्बकं यजामहे", "प्यासे को जल या पक्षियों को दाना दें; नकारात्मक संगति से दूर रहें", "Offer water or birdseed and stay focused on constructive community work.", "बैंगनी / नीला", 4),
        new("meena", 11, "मीन", "Pisces", "♓", "गुरु (Jupiter)", "जल", "करुणा, आध्यात्मिकता, रचनात्मकता व शांति की अंतिम राशि", "ॐ नमो नारायणाय", "प्रातः ध्यान व प्राणायाम करें; श्रीहरि का स्मरण कर पीला फल अर्पित करें", "Practice morning meditation and offer yellow fruit with gratitude.", "हल्का पीला", 7),
    ];

    public static DailyRashifalReport BuildReport(EcosystemSignalsSnapshot signals)
    {
        var p = signals.Panchang;
        var moonSignIndex = ResolveMoonSignIndex(p?.MoonSign, p?.Nakshatra, signals.DateKey);
        var resolvedMoonSign = string.IsNullOrWhiteSpace(p?.MoonSign)
            ? $"{AllRashis[moonSignIndex].HindiName} ({AllRashis[moonSignIndex].EnglishName})"
            : p!.MoonSign!;
        var vaara = p?.Vaara ?? DateOnly.Parse(NormalizeDateKey(signals.DateKey)).DayOfWeek.ToString();
        var tithi = p?.Tithi ?? "शुभ तिथि";
        var nakshatra = p?.Nakshatra ?? "शुभ नक्षत्र";
        var abhijit = p?.AbhijitMuhurat ?? "11:45 AM - 12:30 PM";
        var rahu = p?.RahuKaal ?? "राहुकाल में शुभ आरंभ टालें";

        var goodSet = new HashSet<string>(
            (p?.ChandrabalamGoodRashis ?? []).Select(x => x.Trim().ToLowerInvariant()),
            StringComparer.Ordinal);

        var rashis = new List<DailyRashiForecast>(12);
        foreach (var meta in AllRashis)
        {
            // Gochar house (1..12) from Chandra Rashi inclusive
            var house = ((moonSignIndex - meta.Index + 12) % 12) + 1;
            var isShubhFromHouse = house is 1 or 3 or 6 or 7 or 10 or 11;
            var isExplicitGood = goodSet.Count > 0 && goodSet.Any(g =>
                g.Contains(meta.EnglishName, StringComparison.OrdinalIgnoreCase)
                || g.Contains(meta.HindiName, StringComparison.OrdinalIgnoreCase));
            var isShubh = isExplicitGood || isShubhFromHouse;
            var score = HouseScore(house, isShubh);

            var badge = score >= 80
                ? "उत्तम / Very Auspicious"
                : score >= 65
                    ? "शुभ / Favourable"
                    : house is 4 or 8 or 12
                        ? "सावधानी व शांति / Mindful"
                        : "मध्यम / Balanced";

            var (predHi, predEn) = BuildPrediction(meta, house, vaara, nakshatra, tithi, resolvedMoonSign, abhijit, rahu);
            var luckyNum = ((meta.BaseLuckyNumber + moonSignIndex + house - 1) % 9) + 1;

            rashis.Add(new DailyRashiForecast(
                Key: meta.Key,
                Order: meta.Index + 1,
                HindiName: meta.HindiName,
                EnglishName: meta.EnglishName,
                Symbol: meta.Symbol,
                RulerHindi: meta.RulerHindi,
                ElementHindi: meta.ElementHindi,
                MeaningSummary: $"{meta.HindiName} ({meta.EnglishName}) — स्वामी: {meta.RulerHindi} • तत्व: {meta.ElementHindi} • {meta.NatureHindi}",
                TodayPredictionHindi: predHi,
                TodayPredictionEnglish: predEn,
                AacharanUpayHindi: $"आचरण एवं उपाय: {meta.DefaultRemedyHi}। राहुकाल ({rahu}) में जल्दबाजी व बड़ा निवेश टालें।",
                AacharanUpayEnglish: $"Conduct & Remedy: {meta.DefaultRemedyEn} Avoid hasty major decisions during Rahu Kaal ({rahu}).",
                LuckyColor: meta.ColorHi,
                LuckyNumber: luckyNum,
                Mantra: meta.Mantra,
                IsShubhChandrabalam: isShubh,
                GocharHouseFromMoon: house,
                FavorabilityScore: score,
                StatusBadge: badge));
        }

        return new DailyRashifalReport(
            DateKey: signals.DateKey,
            Location: signals.Location,
            MoonSign: resolvedMoonSign,
            SunSign: p?.SunSign,
            Tithi: tithi,
            Nakshatra: nakshatra,
            Vaara: vaara,
            AbhijitMuhurat: abhijit,
            RahuKaal: rahu,
            IsVerifiedPanchang: p is not null && p.IsVerified,
            Rashis: rashis);
    }

    public static ComposedAutomationContent ComposeSingleRashiPackage(
        DailyRashifalReport report,
        DailyRashiForecast rashi,
        AutomationRule rule,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        bool isHindi)
    {
        var link = primaryLink ?? links.FirstOrDefault()?.TrackedUrl ?? string.Empty;
        var title = isHindi
            ? $"{rashi.Symbol} {rashi.HindiName} राशिफल {report.DateKey} | आज क्या होगा, अर्थ व अचूक उपाय"
            : $"{rashi.Symbol} {rashi.EnglishName} Horoscope {report.DateKey} | Prediction, Meaning & Remedy";

        var script = isHindi
            ? $"""
              [सूत्रधार]: आइए जानते हैं {report.DateKey} का प्रमाणित {rashi.HindiName} राशिफल। आज चन्द्रमा {report.MoonSign}, नक्षत्र {report.Nakshatra} और तिथि {report.Tithi} में हैं।
              [{rule.SpeakerAName ?? "आचार्य वेद"}]: {rashi.MeaningSummary}। आज आपके लिए चन्द्र गोचर {rashi.GocharHouseFromMoon}वें भाव में {rashi.StatusBadge} संकेत दे रहा है।
              [{rule.SpeakerBName ?? "जिज्ञासु शिष्य"}]: गुरुदेव, आज {rashi.HindiName} राशि वालों के जीवन में क्या विशेष होगा और शुभ आचरण क्या रखें?
              [{rule.SpeakerAName ?? "आचार्य वेद"}]: {rashi.TodayPredictionHindi}
              [{rule.SpeakerAName ?? "आचार्य वेद"}]: {rashi.AacharanUpayHindi} आज का शुभ रंग {rashi.LuckyColor}, शुभ अंक {rashi.LuckyNumber} और मंत्र '{rashi.Mantra}' है।
              [सूत्रधार]: संपूर्ण पंचांग, चंद्रबल व सभी 12 राशियों का फल देखने के लिए लिंक पर जाएं: {link}
              """
            : $"""
              [Narrator]: Welcome to {report.DateKey} Vedic {rashi.EnglishName} ({rashi.HindiName}) Rashifal, powered by today's {report.MoonSign} Moon, {report.Nakshatra} Nakshatra and {report.Tithi}.
              [{rule.SpeakerAName ?? "Acharya Veda"}]: {rashi.EnglishName} sits in lunar house {rashi.GocharHouseFromMoon} today ({rashi.StatusBadge}). {rashi.TodayPredictionEnglish}
              [{rule.SpeakerBName ?? "Seeker"}]: What conduct and simple remedy brings peace today?
              [{rule.SpeakerAName ?? "Acharya Veda"}]: {rashi.AacharanUpayEnglish} Lucky color {rashi.LuckyColor}, number {rashi.LuckyNumber}, and mantra {rashi.Mantra}.
              [Narrator]: View full daily Panchang timings and all 12 Rashi forecasts at {link}
              """;

        var tags = isHindi
            ? new[] { $"{rashi.HindiName} राशिफल", "Aaj Ka Rashifal", rashi.EnglishName, report.DateKey, "Vedic Astrology", "Panchang", "Rashifal Shorts", "Upay", "Shorts" }
            : new[] { $"{rashi.EnglishName} Horoscope", "Daily Rashifal", "Vedic Astrology", report.DateKey, "Hindu Panchang", "Shorts" };

        var bodySummary = isHindi
            ? $"{rashi.HindiName} ({rashi.EnglishName}) दैनिक राशिफल ({report.DateKey}): {rashi.TodayPredictionHindi}\n\n{rashi.MeaningSummary}\n{rashi.AacharanUpayHindi}\nशुभ रंग: {rashi.LuckyColor} | शुभ अंक: {rashi.LuckyNumber} | मंत्र: {rashi.Mantra}\nपंचांग आधार: तिथि {report.Tithi}, नक्षत्र {report.Nakshatra}, चन्द्र राशि {report.MoonSign}।"
            : $"{rashi.EnglishName} ({rashi.HindiName}) Daily Rashifal ({report.DateKey}): {rashi.TodayPredictionEnglish}\n\n{rashi.AacharanUpayEnglish}\nLucky Color: {rashi.LuckyColor} | Number: {rashi.LuckyNumber} | Mantra: {rashi.Mantra}\nPanchang Basis: {report.Tithi}, {report.Nakshatra}, Moon in {report.MoonSign}.";

        var linkLines = links.Count > 0
            ? "\n\n" + string.Join("\n", links.Select(l => $"👉 {l.Label}: {l.TrackedUrl}"))
            : string.Empty;

        var desc = $"{bodySummary}{linkLines}\n\n#Rashifal #{rashi.EnglishName} #AajKaRashifal #HinduPanchang #Shorts";
        var poll = isHindi
            ? new[] { $"मेरी राशि {rashi.HindiName} है 🙏", "उपाय और मंत्र बहुत उपयोगी लगे ✨", "सभी 12 राशियों के वीडियो देखें 🔔" }
            : new[] { $"My Rashi is {rashi.EnglishName} 🙏", "Helpful daily guidance & remedy ✨", "Subscribe for all 12 Rashis 🔔" };

        var communityText = $"📌 {title}\n\n{rashi.TodayPredictionHindi}\n🧘 {rashi.AacharanUpayHindi}\n🎨 शुभ रंग: {rashi.LuckyColor} • 🔢 अंक: {rashi.LuckyNumber}"
            + (string.IsNullOrWhiteSpace(link) ? string.Empty : $"\n🔗 {link}");

        return new ComposedAutomationContent(
            SourceItemKey: $"rashi-{rashi.Key}",
            SourceTitle: $"{rashi.HindiName} ({rashi.EnglishName}) राशिफल — {report.DateKey}",
            SourceSummary: rashi.TodayPredictionHindi,
            Title: title,
            Script: script.Trim(),
            AiVideoPrompt: $"Vertical 9:16 Vedic cosmic zodiac mandala animation for {rashi.EnglishName} ({rashi.HindiName}), glowing constellation, saffron and violet starlight, peaceful sunrise temple ambiance",
            AiThumbnailPrompt: $"Sacred glowing zodiac emblem of {rashi.EnglishName} with golden Vedic mandala, deep indigo sky, sunrise rays, ultra clean high contrast, zero text",
            Description: desc,
            PinnedComment: string.IsNullOrWhiteSpace(link) ? null : $"{rashi.HindiName} राशि उपाय व संपूर्ण पंचांग देखें: {link}",
            Tags: tags,
            PrimaryDestinationUrl: primaryLink,
            TrackedLinks: links,
            CommunityPostText: communityText,
            CommunityPollOptions: poll,
            HeaderBannerText: $"AAJ KA RASHIFAL • {rashi.HindiName.ToUpperInvariant()} • {report.DateKey}",
            EventColorHex: "#8B5CF6",
            EventDateKey: report.DateKey);
    }

    public static ComposedAutomationContent ComposeCombinedOverviewPackage(
        DailyRashifalReport report,
        AutomationRule rule,
        IReadOnlyList<AutomationWebsiteLink> links,
        string? primaryLink,
        bool isHindi)
    {
        var shubhList = string.Join(", ", report.Rashis.Where(r => r.IsShubhChandrabalam).Take(6).Select(r => r.HindiName));
        var featured = report.Rashis.Where(r => r.IsShubhChandrabalam).Take(4).ToList();
        var focusNames = string.Join(" • ", featured.Select(r => r.HindiName));
        var title = isHindi
            ? $"आज का राशिफल {report.DateKey} | सभी 12 राशियों का हाल व उपाय ({focusNames})"
            : $"Daily Rashifal {report.DateKey} | All 12 Zodiac Signs & Vedic Remedies ({report.MoonSign})";

        var rashiLinesHi = string.Join("\n", report.Rashis.Take(6).Select(r =>
            $"[{rule.SpeakerAName ?? "आचार्य वेद"}]: {r.HindiName} ({r.EnglishName}) — {r.TodayPredictionHindi} उपाय: {r.Mantra}।"));
        var script = isHindi
            ? $"""
              [सूत्रधार]: नमस्कार! आज {report.DateKey} को चन्द्रमा {report.MoonSign} व नक्षत्र {report.Nakshatra} में हैं। आइए जानें आज किन राशियों पर विशेष कृपा रहेगी।
              [{rule.SpeakerAName ?? "आचार्य वेद"}]: आज चंद्रबल से {shubhList} राशियों के लिए विशेष शुभ योग हैं। अभिजीत मुहूर्त {report.AbhijitMuhurat} है।
              {rashiLinesHi}
              [सूत्रधार]: अपनी पूरी 12 राशियों का अर्थ, आज का आचरण व शुभ समय जानने के लिए लिंक देखें: {primaryLink ?? string.Empty}
              """
            : string.Join("\n", report.Rashis.Take(6).Select(r =>
                $"[Narrator]: {r.EnglishName} ({r.HindiName}): {r.TodayPredictionEnglish}"));

        var summary = $"चन्द्र राशि: {report.MoonSign} | नक्षत्र: {report.Nakshatra} | शुभ चंद्रबल: {shubhList}";
        var desc = $"{summary}\n\n" + string.Join("\n", report.Rashis.Select(r =>
            $"{r.Symbol} {r.HindiName} ({r.EnglishName}): {r.StatusBadge} • शुभ रंग: {r.LuckyColor} • अंक: {r.LuckyNumber}"));

        return new ComposedAutomationContent(
            SourceItemKey: "rashifal-daily",
            SourceTitle: title,
            SourceSummary: summary,
            Title: title,
            Script: script.Trim(),
            AiVideoPrompt: $"Cosmic glowing 12 zodiac chakra wheel spinning slowly in deep indigo starlight with golden sacred rays for {report.DateKey}",
            AiThumbnailPrompt: $"Sacred Vedic zodiac wheel of 12 rashis with golden temple glow and rising sun, crisp high contrast, zero text",
            Description: desc,
            PinnedComment: string.IsNullOrWhiteSpace(primaryLink) ? null : $"सभी 12 राशियों का पूरा राशिफल और पंचांग देखें: {primaryLink}",
            Tags: ["Aaj Ka Rashifal", "Daily Rashifal", "12 Rashi", "Hindu Panchang", report.Nakshatra, "Horoscope Hindi", "Shorts"],
            PrimaryDestinationUrl: primaryLink,
            TrackedLinks: links,
            EventDateKey: report.DateKey);
    }

    private static (string Hindi, string English) BuildPrediction(
        RashiMeta rashi,
        int house,
        string vaara,
        string nakshatra,
        string tithi,
        string moonSign,
        string abhijit,
        string rahu)
    {
        return house switch
        {
            1 or 11 => (
                $"आज {vaara} व {nakshatra} नक्षत्र में आत्मविश्वास और कार्य-सिद्धि का प्रबल योग है। {moonSign} के चंद्र गोचर से रुके कार्य बनेंगे और आर्थिक लाभ व मित्रों का सहयोग मिलेगा। अभिजीत मुहूर्त ({abhijit}) में जरूरी पहल करें।",
                $"Strong lunar transit on {vaara} ({nakshatra}) boosts confidence, financial momentum, and friend support. Initiate key work near Abhijit Muhurat ({abhijit})."),
            3 or 6 => (
                $"आज पराक्रम व परिश्रम का पूरा फल मिलेगा। कार्यक्षेत्र में प्रतिस्पर्धा पर विजय और परिवार में सकारात्मक संवाद संभव है; आलस्य त्यागकर प्राथमिकता वाले काम पूरे करें।",
                $"Effort and courage bring tangible progress today. Overcome workplace hurdles with clear communication and disciplined focus."),
            7 or 10 => (
                $"करियर, साझेदारी व सामाजिक मान-सम्मान के लिए दिन अनुकूल है। टीमवर्क और विनम्र व्यवहार से नई जिम्मेदारी या लाभ का मार्ग खुलेगा; {tithi} तिथि में बड़ों की सलाह लाभकारी रहेगी।",
                $"Career collaboration, leadership visibility, and partnerships flourish today. Listening to mentors strengthens your outcomes."),
            2 or 5 or 9 => (
                $"आज शिक्षा, वाणी, संतान व भाग्योदय से जुड़े विषयों में संतुलित प्रगति होगी। वाणी में मिठास रखें और अनावश्यक खर्च पर नियंत्रण रखें; संध्या समय मन प्रसन्न रहेगा।",
                $"Measured growth arrives in learning, creative plans, and family talks. Guard unnecessary expenses and choose calm, kind speech."),
            _ => (
                $"आज का दिन धैर्य, आत्मचिंतन और सेहत के प्रति सजग रहने का संकेत देता है ({moonSign} गोचर, भाव {house})। जल्दबाजी में विवाद या नया कर्ज न लें; शांतिपूर्ण दिनचर्या से शाम तक स्थिति सहज होगी।",
                $"Today asks for patience, restful pacing, and calm judgment (lunar house {house} from {moonSign}). Avoid impulsive disputes or major risks; gentle discipline restores balance.")
        };
    }

    private static int HouseScore(int house, bool isShubh) => house switch
    {
        11 => 92,
        10 => 88,
        1 => 85,
        7 => 82,
        3 or 6 => 78,
        9 or 5 => 74,
        2 => 68,
        4 => 60,
        12 or 8 => 55,
        _ => isShubh ? 76 : 64
    };

    private static int ResolveMoonSignIndex(string? moonSign, string? nakshatra, string dateKey)
    {
        if (!string.IsNullOrWhiteSpace(moonSign))
        {
            foreach (var r in AllRashis)
            {
                if (moonSign.Contains(r.EnglishName, StringComparison.OrdinalIgnoreCase)
                    || moonSign.Contains(r.HindiName, StringComparison.OrdinalIgnoreCase)
                    || moonSign.Contains(r.Key, StringComparison.OrdinalIgnoreCase))
                    return r.Index;
            }
        }

        // Deterministic lunar sidereal fallback (approximate ~2.25 days per sign) if signal lacked MoonSign
        if (DateOnly.TryParse(NormalizeDateKey(dateKey), out var d))
        {
            var dayNum = d.DayNumber + (string.IsNullOrWhiteSpace(nakshatra) ? 0 : Math.Abs(nakshatra.GetHashCode(StringComparison.OrdinalIgnoreCase)) % 12);
            return Math.Abs((dayNum / 2) % 12);
        }
        return 8;
    }

    private static string NormalizeDateKey(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw) && AutomationFactVerifier.ExtractIsoDateKey(raw) is { } k) return k;
        return DateTime.UtcNow.ToString("yyyy-MM-dd");
    }
}
