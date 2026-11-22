using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

/// <summary>
/// Curated daily devotional prayer / prarthana repository for <see cref="AutomationSourceType.DevotionalPrarthana"/>
/// (Shiv, Krishna, Ram, Ram-Krishna, Hanuman, Devi) designed for custom voice narration, smooth non-shaking
/// camera motion reels, and crisp top-aligned captions.
/// </summary>
public sealed record DevotionalPrarthanaEntry(
    string DeityKey,
    string DeityHindi,
    string DeityEnglish,
    string TitleHindi,
    string TitleEnglish,
    string HookHindi,
    string PrayerHindi,
    string PrayerEnglish,
    string Mantra,
    string VisualSubject,
    string[] Tags);

public static class DevotionalPrarthanaCatalog
{
    public static readonly IReadOnlyList<DevotionalPrarthanaEntry> Entries =
    [
        new(
            DeityKey: "shiv",
            DeityHindi: "भगवान शिव / महादेव",
            DeityEnglish: "Lord Shiv (Mahadev)",
            TitleHindi: "हे नाथ यदि आप हमारे अवगुण देखोगे… | शिव प्रार्थना",
            TitleEnglish: "O Mahadev, Hold Us in Your Grace | Daily Shiv Prayer",
            HookHindi: "हे मेरे महादेव, हे करुणानिधान…",
            PrayerHindi:
                "हे नाथ, यदि आप भी हमारे अवगुण देखने लगें, तो हम अज्ञानी जीव किसके द्वार जाएँगे?\n" +
                "इस स्वार्थी संसार में केवल आपका ही नाम हमारी एकमात्र शरण है। मन भटकता है भोलेनाथ, पर हर सांस में केवल हर हर महादेव बसता है।\n" +
                "हे त्रिनेत्र, हमें क्षमा कर अपनी करुणा की छाया में रखिए। हर हर महादेव!",
            PrayerEnglish:
                "O Lord Mahadev, if even You count our flaws, where can wandering souls find shelter?\n" +
                "In a restless world, Your sacred name is our one steady refuge. With every breath, grant us peace, humility, and Your grace.\n" +
                "Har Har Mahadev!",
            Mantra: "ॐ नमः शिवाय",
            VisualSubject: "serene divine Lord Shiva meditating in warm golden Himalayan Kailash glow with trident, crescent moon and sacred ash, deep dark mystical backdrop",
            Tags: ["Mahadev", "Shiv", "Bholenath", "Shiv Prarthana", "Har Har Mahadev", "Bhakti Shorts", "Daily Prayer"]),

        new(
            DeityKey: "shiv",
            DeityHindi: "भगवान शिव / भोलेनाथ",
            DeityEnglish: "Lord Shiv (Bholenath)",
            TitleHindi: "जब दुनिया मुँह मोड़ ले, तब महादेव थाम लेते हैं 🙏",
            TitleEnglish: "When the World Turns Away, Mahadev Holds You Close",
            HookHindi: "हे कैलाशपति, हे आशुतोष…",
            PrayerHindi:
                "संसार जब भी परीक्षा लेता है और अपने दूर हो जाते हैं, तब केवल डमरूवाले की कृपा ही हमें संभालती है।\n" +
                "हे शिवशंकर, हमें धन-दौलत नहीं, बस अटूट भक्ति, सच्चा विवेक और शांत मन का वरदान दीजिए।\n" +
                "जब आपका हाथ सिर पर हो मेरे भोले, तो कोई भी संकट बड़ा नहीं रहता। जय श्री महाकाल!",
            PrayerEnglish:
                "When worldly support fades, the grace of Bholenath quietly sustains the heart.\n" +
                "Bless us not merely with possessions, O Shankara, but with unshakable devotion and stillness of mind.\n" +
                "Om Namah Shivaya!",
            Mantra: "हर हर महादेव शम्भु",
            VisualSubject: "sacred carved Shivling adorned with bilva leaves, sandalwood tripundra and glowing golden camphor aarti in a quiet ancient sanctum, dramatic dark vignette",
            Tags: ["Bholenath", "Mahakal", "Shiv Bhakti", "Om Namah Shivaya", "Somvar Bhakti", "Shorts"]),

        new(
            DeityKey: "krishna",
            DeityHindi: "श्री कृष्ण / मुरलीधर",
            DeityEnglish: "Shri Krishna (Murlidhar)",
            TitleHindi: "जब कुछ समझ न आए, सब कान्हा पर छोड़ दो 🦚🙏",
            TitleEnglish: "When Nothing Makes Sense, Surrender It to Shri Krishna",
            HookHindi: "हे मुरलीधर, हे बांके बिहारी…",
            PrayerHindi:
                "कहते हैं जब जीवन की राह उलझने लगे और मन अकेला पड़ जाए, तब सब कुछ श्रीकृष्ण के चरणों में सौंप देना चाहिए।\n" +
                "दुनिया के रिश्ते स्वार्थ से चलते हैं माधव, पर आपका साथ निस्वार्थ और अनंत है।\n" +
                "बस इतनी कृपा बनाए रखना कान्हा कि हर चिंता मिटे और हृदय में केवल प्रेम और शांति रहे। राधे राधे!",
            PrayerEnglish:
                "When life feels tangled and the heart feels alone, surrender every worry at the lotus feet of Shri Krishna.\n" +
                "Madhava guides us toward what is truly best, even through quiet storms.\n" +
                "Radhe Radhe!",
            Mantra: "ॐ नमो भगवते वासुदेवाय",
            VisualSubject: "radiant serene Shri Krishna playing golden flute beneath ancient Vrindavan kadamba blossoms with peacock feather and warm golden lamp glow against dark night sky",
            Tags: ["Krishna", "Shri Krishna", "Radhe Radhe", "Banke Bihari", "Krishna Bhakti", "Dwarkadhish", "Bhakti Shorts"]),

        new(
            DeityKey: "krishna",
            DeityHindi: "श्री कृष्ण / द्वारकाधीश",
            DeityEnglish: "Shri Krishna (Dwarkadhish)",
            TitleHindi: "हे माधव, बस इतना साथ निभा देना 🙏✨",
            TitleEnglish: "O Madhava, Walk Beside Me Through Every Test",
            HookHindi: "हे गोविंद, हे गोपाल…",
            PrayerHindi:
                "हे नंदलाल, मैं यह नहीं मांगता कि जीवन में कभी कठिन समय न आए, बस यही प्रार्थना है कि हर मोड़ पर आपका स्मरण बना रहे।\n" +
                "आपकी बांसुरी की एक मधुर तान सारे भय और थकान को हर लेती है।\n" +
                "हे जगदीश्वर, हमारे कर्मों को शुद्ध और जीवन को भक्तिमय बनाए रखना। जय श्री कृष्ण!",
            PrayerEnglish:
                "O Govinda, I do not ask for an effortless road, only for Your constant remembrance on every step.\n" +
                "Keep our hearts pure, fearless, and anchored in devotion.\n" +
                "Jai Shri Krishna!",
            Mantra: "हरे कृष्ण हरे कृष्ण",
            VisualSubject: "gentle close portrait of Lord Krishna with glowing mukut and peacock feather, tranquil temple oil lamp light in dark backdrop",
            Tags: ["Madhav", "Kanha", "Krishna Prarthana", "Bhakti", "Sanatan", "Shorts"]),

        new(
            DeityKey: "ram",
            DeityHindi: "प्रभु श्री राम",
            DeityEnglish: "Prabhu Shri Ram",
            TitleHindi: "राम नाम का सहारा कभी छूटता नहीं 🙏🏹",
            TitleEnglish: "The Shelter of Shri Ram's Name Never Fails",
            HookHindi: "हे सियावर रामचंद्र, हे करुणासागर…",
            PrayerHindi:
                "हे प्रभु श्रीराम, जीवन में चाहे कितने भी उतार-चढ़ाव आएं, बस धैर्य, सत्य और मर्यादा का पथ कभी न छूटे।\n" +
                "जिस हृदय में आपका पावन नाम बसता है, वहाँ कोई भय और कोई संकट टिक नहीं सकता।\n" +
                "हे रघुनंदन, हमारे पूरे परिवार पर अपनी मंगल कृपा सदैव बनाए रखना। जय श्री राम!",
            PrayerEnglish:
                "O Prabhu Shri Ram, whatever trials life brings, keep us firm upon truth, patience, and dharma.\n" +
                "Where Your sacred name dwells, fear loses its power. Bless every home with peace and grace.\n" +
                "Jai Shri Ram!",
            Mantra: "श्री राम जय राम जय जय राम",
            VisualSubject: "noble serene Prabhu Shri Ram in Ayodhya temple sanctum with warm saffron diya glow, golden bow aura and deep peaceful dark background",
            Tags: ["Shri Ram", "Jai Shri Ram", "Siya Ram", "Ram Bhakti", "Ayodhya", "Prarthana", "Shorts"]),

        new(
            DeityKey: "ram-krishna",
            DeityHindi: "श्री राम एवं श्री कृष्ण",
            DeityEnglish: "Shri Ram & Shri Krishna",
            TitleHindi: "राम और कृष्ण — एक ही करुणा के दो पावन रूप 🙏✨",
            TitleEnglish: "Ram & Krishna — Two Eternal Expressions of One Grace",
            HookHindi: "हे राघव, हे माधव…",
            PrayerHindi:
                "कभी मर्यादा बनकर धर्म का मार्ग दिखाते हो प्रभु श्रीराम, तो कभी गीता और प्रेम का अमृत बनकर हृदय संभालते हो श्रीकृष्ण।\n" +
                "रूप अनेक हैं भगवान, पर हर भक्त का एक ही सहारा है — आपका करुणामय नाम।\n" +
                "आज के इस पावन दिन पर मन को शांत, विचार को पवित्र और जीवन को धन्य बना दीजिए। जय श्री हरि!",
            PrayerEnglish:
                "Now guiding us with noble dharma as Shri Ram, now uplifting the heart with love and wisdom as Shri Krishna — one eternal grace watches over every devotee.\n" +
                "Jai Shri Hari!",
            Mantra: "हरे राम हरे कृष्ण",
            VisualSubject: "golden celestial temple painting harmonizing lotus feet, sacred bow and flute emblem under soft incense rays in deep mystical dark frame",
            Tags: ["Ram Krishna", "Shri Ram", "Shri Krishna", "Hari Bhakti", "Daily Prarthana", "Sanatan Dharma"]),

        new(
            DeityKey: "hanuman",
            DeityHindi: "संकट मोचन हनुमान जी",
            DeityEnglish: "Sankat Mochan Hanuman Ji",
            TitleHindi: "संकट चाहे जितना बड़ा हो, बजरंगबली संभाल लेंगे 🙏🔥",
            TitleEnglish: "No Crisis Stands Before Bajrangbali's Grace",
            HookHindi: "हे पवनपुत्र, हे संकट मोचन…",
            PrayerHindi:
                "हे अंजनीनंदन, जब मन डर और निराशा से घिर जाए, तब आपका बल और भक्ति ही हमें फिर से खड़ा करती है।\n" +
                "आपके स्मरण मात्र से सारे विघ्न, रोग और भय शांत हो जाते हैं।\n" +
                "हे बजरंगबली, हमें साहस, सेवा-भाव और अटूट राम भक्ति का आशीर्वाद दीजिए। जय बजरंगबली!",
            PrayerEnglish:
                "O Sankat Mochan Hanuman Ji, when fear and doubt weigh down the heart, remembrance of You restores courage and clarity.\n" +
                "Grant us strength, humility, and unyielding devotion. Jai Bajrangbali!",
            Mantra: "ॐ हं हनुमते नमः",
            VisualSubject: "majestic devotional Veer Hanuman in deep saffron and warm golden temple lamp radiance against a clean dark background",
            Tags: ["Hanuman", "Bajrangbali", "Sankat Mochan", "Hanuman Bhakti", "Mangalvar", "Shorts"]),

        new(
            DeityKey: "devi",
            DeityHindi: "माँ जगदम्बा / आदिशक्ति",
            DeityEnglish: "Maa Durga (Adi Shakti)",
            TitleHindi: "माँ की ममता के आगे कोई संकट टिकता नहीं 🙏🌺",
            TitleEnglish: "Before Maa's Compassion, Every Fear Fades",
            HookHindi: "हे जगजननी, हे करुणामयी माँ…",
            PrayerHindi:
                "हे माँ दुर्गा, संसार में बालक कितना भी अज्ञानी क्यों न हो, माँ कभी उसका हाथ नहीं छोड़ती।\n" +
                "हर अंधकार के बीच आप ही आशा का पहला दीप बनकर राह दिखाती हैं।\n" +
                "हे अम्बे माँ, हमारे घर-आंगन में सुख, स्वास्थ्य और सकारात्मक ऊर्जा का वास कीजिए। जय माता दी!",
            PrayerEnglish:
                "O Compassionate Mother, no matter how uncertain the road, Your gentle grace lights a lamp within the dark.\n" +
                "Fill every family with health, strength, and peace. Jai Mata Di!",
            Mantra: "ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे",
            VisualSubject: "serene radiant Maa Durga idol decorated with red hibiscus garlands and brass oil lamps in deep dark sanctum glow",
            Tags: ["Maa Durga", "Jai Mata Di", "Devi Bhakti", "Shakti", "Bhakti Shorts", "Daily Prayer"])
    ];

    public static string NormalizeDeityFocus(string? focus)
    {
        if (string.IsNullOrWhiteSpace(focus)) return "auto";
        var f = focus.Trim().ToLowerInvariant().Replace("_", "-");
        return f switch
        {
            "shiv" or "shiva" or "mahadev" or "bholenath" => "shiv",
            "krishna" or "kanha" or "madhav" => "krishna",
            "ram" or "rama" or "shriram" => "ram",
            "ram-krishna" or "ramkrishna" or "hari" => "ram-krishna",
            "hanuman" or "bajrangbali" => "hanuman",
            "devi" or "durga" or "maa" => "devi",
            _ => "auto"
        };
    }

    public static DevotionalPrarthanaEntry SelectForDate(string? focus, string dateKey, string? customSeed = null)
    {
        var normalizedFocus = NormalizeDeityFocus(focus);
        if (normalizedFocus == "auto" && !string.IsNullOrWhiteSpace(customSeed))
        {
            var s = customSeed.ToLowerInvariant();
            if (s.Contains("ram") && s.Contains("krishna")) normalizedFocus = "ram-krishna";
            else if (s.Contains("shiv") || s.Contains("mahadev") || s.Contains("bholenath") || s.Contains("शिव") || s.Contains("महादेव")) normalizedFocus = "shiv";
            else if (s.Contains("krishna") || s.Contains("kanha") || s.Contains("कृष्ण") || s.Contains("कान्हा")) normalizedFocus = "krishna";
            else if (s.Contains("ram") || s.Contains("राम")) normalizedFocus = "ram";
            else if (s.Contains("hanuman") || s.Contains("हनुमान")) normalizedFocus = "hanuman";
            else if (s.Contains("devi") || s.Contains("durga") || s.Contains("दुर्गा") || s.Contains("माँ")) normalizedFocus = "devi";
        }

        IReadOnlyList<DevotionalPrarthanaEntry> pool;
        if (normalizedFocus != "auto")
        {
            pool = [.. Entries.Where(e => string.Equals(e.DeityKey, normalizedFocus, StringComparison.OrdinalIgnoreCase))];
        }
        else if (DateOnly.TryParse(dateKey, out var d))
        {
            // Align natural Hindu daily rhythm while covering Shiv, Krishna, Ram, Ram-Krishna across the week.
            var dayKey = d.DayOfWeek switch
            {
                DayOfWeek.Monday => "shiv",
                DayOfWeek.Tuesday => "hanuman",
                DayOfWeek.Wednesday => "krishna",
                DayOfWeek.Thursday => "ram-krishna",
                DayOfWeek.Friday => "devi",
                DayOfWeek.Saturday => "shiv",
                _ => "ram"
            };
            pool = [.. Entries.Where(e => string.Equals(e.DeityKey, dayKey, StringComparison.OrdinalIgnoreCase))];
        }
        else
        {
            pool = Entries;
        }

        if (pool.Count == 0) pool = Entries;
        var dayIndex = DateOnly.TryParse(dateKey, out var parsed) ? parsed.DayOfYear : Math.Abs(dateKey.GetHashCode(StringComparison.Ordinal));
        return pool[Math.Abs(dayIndex) % pool.Count];
    }
}
