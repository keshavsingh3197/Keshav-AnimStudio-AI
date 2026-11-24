namespace AnimStudio.Application.Automation;

/// <summary>
/// Deterministic Chitrapaksha / Lahiri Vedic festival &amp; vrat enricher used when upstream
/// Panchang feeds omit major Tithi observances (such as Vaikuntha Chaturdashi / Harihar Milan,
/// Naraka Chaturdashi, Chhath Puja, Guru Purnima, Kalabhairava Jayanti, etc.) across today
/// and the 14-day advance preparation window.
/// </summary>
public static class VedicFestivalResolver
{
    private const double Deg2Rad = Math.PI / 180.0;
    private const double Rad2Deg = 180.0 / Math.PI;
    private const double SynodicMonthDays = 29.530588861;

    private static readonly string[] LunarMonths =
    [
        "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
        "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"
    ];

    private enum FestivalMuhuratKind
    {
        SunriseOrKshaya = 0,
        Pradosh = 1,
        Nishita = 2,
        Noon = 3,
        Aparahna = 4
    }

    private sealed record SacredFestivalRule(
        string Id,
        string NameHindi,
        string NameEnglish,
        string TithiDisplay,
        string MonthVedic,
        string Category,
        bool IsMajor,
        string Description,
        string RitualsAndPujaVidhi,
        string FastingRules,
        int MonthIndex,
        int TargetTithi,
        FestivalMuhuratKind Muhurat,
        bool UsePurnimanta);

    private static readonly SacredFestivalRule[] MajorRules =
    [
        // Chaitra (0)
        new("dyn-ugadi-navratri", "चैत्र नवरात्रि प्रारंभ & हिंदू नववर्ष", "Chaitra Navratri & Hindu New Year", "Chaitra Shukla Pratipada", "Chaitra", "Major", true,
            "Inaugurates the new Vikram Samvat & Shaka Samvat year along with 9 nights of Devi Shakti worship.",
            "Kalash Sthapana, Akhand Jyoti, Durga Saptashati paath & Neem-Mishri prasad.",
            "Nine-day sattvic Navratri vrat rules.", 0, 0, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-gangaur", "गणगौर एवं मत्स्य जयंती", "Gangaur & Matsya Jayanti", "Chaitra Shukla Tritiya", "Chaitra", "Major", true,
            "Honors Goddess Parvati & Lord Shiva marital harmony alongside Bhagavan Vishnu's Matsya avatar.",
            "Gauri-Shiva puja, floral archana & Matsya Purana remembrance.",
            "Traditional festive sattvic prasad.", 0, 2, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-ramanavami", "श्री राम नवमी", "Shri Rama Navami", "Chaitra Shukla Navami", "Chaitra", "Major", true,
            "Birth anniversary of Maryada Purushottam Bhagavan Shri Rama at noon Abhijit lagna in Ayodhya.",
            "Recite Ramcharitmanas / Sundarakanda, noon Garbhagriha aarti & Panjiri offering.",
            "Falahar fast until midday birth celebration.", 0, 8, FestivalMuhuratKind.Noon, false),
        new("dyn-hanuman-jayanti", "श्री हनुमान जयंती", "Hanuman Jayanti", "Chaitra Purnima", "Chaitra", "Major", true,
            "Celebrates the birth of Sankatmochan Shri Hanuman, embodiment of devotion, strength & wisdom.",
            "Offer vermilion (Sindoor), jasmine oil, boondi laddoo & Hanuman Chalisa / Sundarakanda.",
            "Sattvic vegetarian meal and charity.", 0, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Vaishakha (1)
        new("dyn-akshaya-tritiya", "अक्षय तृतीया & परशुराम जयंती", "Akshaya Tritiya & Parashurama Jayanti", "Vaishakha Shukla Tritiya", "Vaishakha", "Major", true,
            "Swayamsiddha (ever-auspicious) day symbolizing unending merit, dharma & new beginnings.",
            "Vishnu-Lakshmi puja, water-pot/grain Daan & Parashurama Jayanti remembrance.",
            "Charity of cool water, grains & sattvic foods.", 1, 2, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-sita-navami", "जानकी नवमी (सीता नवमी)", "Sita Navami (Janaki Jayanti)", "Vaishakha Shukla Navami", "Vaishakha", "Major", true,
            "Celebrates the sacred manifestation of Mata Sita from Mother Earth in Mithila.",
            "Shri Rama-Janaki katha, yellow flower archana & sweet bhog.",
            "Light daytime Phalahar observance.", 1, 8, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-narasimha-jayanti", "श्री नरसिंह जयंती", "Narasimha Jayanti", "Vaishakha Shukla Chaturdashi", "Vaishakha", "Major", true,
            "Marks the dusk incarnation of Bhagavan Narasimha from a palace pillar to protect Bhakta Prahlada.",
            "Twilight Godhuli Puja of Bhagavan Narasimha & Lakshmi, panaka & sweet offerings.",
            "Daytime Phalahar fast broken next sunrise.", 1, 13, FestivalMuhuratKind.Pradosh, true),
        new("dyn-buddha-purnima", "बुद्ध पूर्णिमा / वैशाख पूर्णिमा", "Buddha Purnima (Vaishakha Purnima)", "Vaishakha Purnima", "Vaishakha", "Major", true,
            "Honors Siddhartha Gautama's birth, Enlightenment & Parinirvana alongside Satyanarayan Vrat.",
            "Morning holy bath, compassion charity, diya lighting & Satyanarayan Katha.",
            "Sattvic observance.", 1, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Jyeshtha (2)
        new("dyn-ganga-dussehra", "गंगा दशहरा", "Ganga Dussehra", "Jyeshtha Shukla Dashami", "Jyeshtha", "Major", true,
            "Commemorates Goddess Ganga's sacred descent from heaven to earth through King Bhagiratha's penance.",
            "River bath, ten-fold charity, Ganga Stotra & evening diya deepdan.",
            "Cooling sattvic meals and water charity.", 2, 9, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-nirjala-ekadashi", "निर्जला एकादशी", "Nirjala Ekadashi", "Jyeshtha Shukla Ekadashi", "Jyeshtha", "Major", true,
            "Foremost of all 24 Ekadashis (Pandava Bhimaseni Ekadashi) dedicated to Lord Vishnu.",
            "Vishnu Puja, water-pitcher charity & Tulsi archana.",
            "Strict grain-free Ekadashi fast broken at Dwadashi Parana.", 2, 10, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-vat-savitri-amavasya", "वट सावित्री व्रत & शनि जयंती", "Vat Savitri Vrat & Shani Jayanti", "Jyeshtha Amavasya", "Jyeshtha", "Major", true,
            "Honors Mata Savitri's devotion reviving Satyavan under the sacred Banyan tree and Bhagavan Shani's birth.",
            "Vat Vriksha parikrama with sacred thread, Savitri-Satyavan katha & sesame oil diya.",
            "Fruits and sattvic observance.", 2, 29, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Ashadha (3)
        new("dyn-rath-yatra", "जगन्नाथ रथ यात्रा", "Jagannath Rath Yatra", "Ashadha Shukla Dwitiya", "Ashadha", "Major", true,
            "Grand chariot festival of Lord Jagannath, Balabhadra & Subhadra journeying to Gundicha Temple.",
            "Chanting Jagannath Ashtakam, Bhajan & prasad distribution.",
            "Sattvic bhog prasad.", 3, 1, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-devshayani-ekadashi", "देवशयनी एकादशी (चातुर्मास प्रारंभ)", "Devshayani Ekadashi (Chaturmas Begins)", "Ashadha Shukla Ekadashi", "Ashadha", "Major", true,
            "Marks Lord Vishnu's four-month Cosmic Yoga-Nidra (Chaturmas).",
            "Vishnu Sahasranama, Tulsi Puja & pious resolution for Chaturmas.",
            "Grain-free Ekadashi fast broken during Dwadashi Parana.", 3, 10, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-guru-purnima", "गुरु पूर्णिमा / व्यास पूर्णिमा", "Guru Purnima (Vyasa Purnima)", "Ashadha Purnima", "Ashadha", "Major", true,
            "Reveres Maharishi Veda Vyasa and expresses gratitude to all Gurus.",
            "Guru Paduka worship, Gita/Veda swadhyaya & Guru Vandana.",
            "Sattvic prasad sharing.", 3, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Shravana (4)
        new("dyn-nag-panchami", "नाग पंचमी", "Nag Panchami", "Shravana Shukla Panchami", "Shravana", "Major", true,
            "Ancient reverence for Nagadevata symbolizing ecological balance.",
            "Offer flowers, turmeric & pure prayers honoring Serpent Guardians of Earth.",
            "Daytime peaceful vrata observance.", 4, 4, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-raksha-bandhan", "रक्षाबंधन & श्रावण पूर्णिमा", "Raksha Bandhan & Shravana Purnima", "Shravana Purnima", "Shravana", "Major", true,
            "Sacred celebration of sibling protection vows and Upakarma Vedic learning renewal.",
            "Morning Gayatri Upakarma, tying sacred Rakhi with tilak and aarti.",
            "Sattvic festive celebration with family.", 4, 14, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-janmashtami", "श्री कृष्ण जन्माष्टमी", "Shri Krishna Janmashtami", "Bhadrapada Krishna Ashtami", "Bhadrapada", "Major", true,
            "Sacred midnight birth celebration of Bhagavan Shri Krishna in Mathura.",
            "Daylong fast, midnight Abhishekam, cradle celebration & makhan-mishri bhog.",
            "Fast until midnight Janma Darshan (Nishita Kaal).", 4, 22, FestivalMuhuratKind.Nishita, false),

        // Bhadrapada (5)
        new("dyn-hartalika-teej", "हरतालिका तीज", "Hartalika Teej", "Bhadrapada Shukla Tritiya", "Bhadrapada", "Major", true,
            "Honors Goddess Parvati's penance winning Lord Shiva's hand on Bhadrapada Shukla Tritiya.",
            "Evening clay Shiva-Parvati murti worship & Hartalika Katha vigil.",
            "Traditional Phalahar/Nirjala observance.", 5, 2, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-ganesh-chaturthi", "श्री गणेश चतुर्थी", "Ganesh Chaturthi", "Bhadrapada Shukla Chaturthi", "Bhadrapada", "Major", true,
            "Celebrates the arrival of Vighnaharta Bhagavan Shri Ganesha.",
            "Prana-Pratishtha of eco-friendly Ganesha murti, Durva grass & 21 Modak offerings.",
            "Sattvic prasad and morning-evening Ganapati Aarti.", 5, 3, FestivalMuhuratKind.Noon, false),
        new("dyn-radha-ashtami", "श्री राधा अष्टमी", "Radha Ashtami", "Bhadrapada Shukla Ashtami", "Bhadrapada", "Major", true,
            "Celebrates the divine appearance of Shri Radha Rani in Barsana.",
            "Madhyahna Radha-Krishna Puja, Bhajan kirtan & 56 bhog offerings.",
            "Daytime Phalahar fast until noon aarti.", 5, 7, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-anant-chaturdashi", "अनंत चतुर्दशी & गणेश विसर्जन", "Anant Chaturdashi & Ganesh Visarjan", "Bhadrapada Shukla Chaturdashi", "Bhadrapada", "Major", true,
            "Worships Bhagavan Ananta (Vishnu) with 14 sacred knots while bidding farewell to Ganpati Bappa.",
            "Tie 14-knot Ananta Sutra, recite Ananta Katha & eco-friendly Ganesh Visarjan.",
            "Sattvic festive meal.", 5, 13, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-sarva-pitru-amavasya", "सर्व पितृ अमावस्या (महालय)", "Sarva Pitru Amavasya (Mahalaya)", "Ashvina Krishna Amavasya (Pitru Paksha End)", "Ashvina", "Major", true,
            "Culmination of Pitru Paksha expressing gratitude to all ancestors and departed elders.",
            "Morning Til-Jal Tarpan & charitable feeding.",
            "Sattvic midday Pitru prasad meal.", 5, 29, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Ashvina (6)
        new("dyn-sharad-navratri", "शारदीय नवरात्रि प्रारंभ", "Sharad Navratri Begins", "Ashvina Shukla Pratipada", "Ashvina", "Major", true,
            "Nine auspicious nights worshipping Nava Durga culminating in Dussehra.",
            "Ghatasthapana, Lalita Sahasranama & Durga Saptashati.",
            "Daily Phalahar or single-meal sattvic discipline.", 6, 0, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-maha-ashtami", "दुर्गा अष्टमी (महाष्टमी)", "Durga Ashtami (Maha Ashtami)", "Ashvina Shukla Ashtami", "Ashvina", "Major", true,
            "Eighth pivotal night of Sharad Navratri honoring Maa Mahagauri and Kanya Pujan.",
            "Sandhi Puja, Ashtami Havan & respectful Kanya-Bhojan worship.",
            "Traditional Ashtami Phalahar & Halwa-Chana prasad.", 6, 7, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-maha-navami", "महानवमी (शारदीय नवरात्रि)", "Maha Navami", "Ashvina Shukla Navami", "Ashvina", "Major", true,
            "Culminates Navratri worship honoring Maa Siddhidatri.",
            "Navami Havan purnahuti, Ayudha/Shastra puja & Kanya Pujan.",
            "Complete Navratri fast during daytime Havan.", 6, 8, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-dussehra", "विजयादशमी (दशहरा)", "Vijayadashami (Dussehra)", "Ashvina Shukla Dashami", "Ashvina", "Major", true,
            "Celebrates victory of Dharma — Lord Rama's triumph over Ravana and Maa Durga's triumph over Mahishasura.",
            "Shami tree worship, Aparajita Puja & Shastra/book reverence.",
            "Festive sattvic feast.", 6, 9, FestivalMuhuratKind.Aparahna, false),
        new("dyn-sharad-purnima", "शरद पूर्णिमा (कोजागरी) & वाल्मीकि जयंती", "Sharad Purnima & Valmiki Jayanti", "Ashvina Purnima", "Ashvina", "Major", true,
            "Luminous full-moon night of Ashvina alongside Adi Kavi Valmiki Jayanti.",
            "Kojagari Lakshmi Puja, moonlight rice kheer offering & Ramayana remembrance.",
            "Share chilled moonlight kheer next dawn.", 6, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Kartika (7) — Purnimanta for Krishna Paksha, Amanta=Purnimanta for Shukla
        new("dyn-karwa-chauth", "करवा चौथ (करक चतुर्थी)", "Karwa Chauth", "Kartika Krishna Chaturthi", "Kartika", "Major", true,
            "Sacred daylong Nirjala fast observed for spouse longevity, peace, and family harmony.",
            "Dawn Sargi, evening Shiva-Parvati-Ganesha Karwa puja & Arghya upon Moonrise.",
            "Strict Nirjala fast broken after sighting the Moon.", 7, 18, FestivalMuhuratKind.Pradosh, true),
        new("dyn-ahoi-ashtami", "अहोई अष्टमी", "Ahoi Ashtami", "Kartika Krishna Ashtami", "Kartika", "Major", true,
            "Motherly observance dedicated to Mata Ahoi Bhagavati praying for children's well-being.",
            "Draw Ahoi Mata mandala, evening star darshan & Karwa water offering.",
            "Daytime fast concluded after sighting evening stars.", 7, 22, FestivalMuhuratKind.SunriseOrKshaya, true),
        new("dyn-dhanteras", "धनतेरस (धनत्रयोदशी)", "Dhanteras & Dhanvantari Jayanti", "Kartika Krishna Trayodashi", "Kartika", "Major", true,
            "Honors Lord Dhanvantari (Ayurveda) and heralds the 5-day Deepawali festival.",
            "Evening Yama Deepam at entrance, Dhanvantari & Kubera worship.",
            "Prepare home lamps and sattvic sweets.", 7, 27, FestivalMuhuratKind.Pradosh, true),
        new("dyn-naraka-chaturdashi", "नरक चतुर्दशी / छोटी दीपावली", "Naraka Chaturdashi (Chhoti Diwali)", "Kartika Krishna Chaturdashi", "Kartika", "Major", true,
            "Celebrates Bhagavan Shri Krishna's victory over Narakasura and pre-dawn Abhyanga Snan purification.",
            "Pre-dawn sesame-oil Abhyanga Snan, 14 earthen diyas & Hanuman Puja.",
            "Sattvic festive observance.", 7, 28, FestivalMuhuratKind.SunriseOrKshaya, true),
        new("dyn-diwali", "दीपावली (लक्ष्मी पूजन)", "Deepawali (Diwali)", "Kartika Amavasya (Pradosh)", "Kartika", "Major", true,
            "Festival of Lights honoring Pradosh Kaal Lakshmi-Ganesha worship and Bhagavan Shri Rama's return to Ayodhya.",
            "Pradosh Kaal Lakshmi-Ganesha Puja, lighting rows of earthen diyas.",
            "Share mithai and light homes after sunset.", 7, 29, FestivalMuhuratKind.Pradosh, true),
        new("dyn-govardhan", "गोवर्धन पूजा & अन्नकूट", "Govardhan Puja & Annakut", "Kartika Shukla Pratipada", "Kartika", "Major", true,
            "Honors Lord Krishna's protection of Vrindavan beneath Mount Govardhan.",
            "Annakut Mountain Bhog offering, Gau Puja & Govardhan Parikrama remembrance.",
            "Traditional Annakut sattvic prasad.", 7, 0, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-bhaidooj", "भाई दूज (यम द्वितीया)", "Bhai Dooj (Yama Dwitiya)", "Kartika Shukla Dwitiya", "Kartika", "Major", true,
            "Honors sacred sibling bonds inspired by Yamuna and Yamaraja.",
            "Tilak, aarti & prayers for sibling longevity and well-being.",
            "Shared family meal.", 7, 1, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-chhath-puja", "छठ पूजा (सूर्य षष्ठी)", "Chhath Puja (Surya Shashthi)", "Kartika Shukla Shashthi", "Kartika", "Major", true,
            "Four-day Vedic sun worship thanking Bhagavan Surya & Chhathi Maiya for life energy and family welfare.",
            "Sandhya Arghya at river/pond offering Thekua & fruits, followed by dawn Usha Arghya.",
            "36-hour pure Nirjala observance by Vrati devotees.", 7, 5, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-gopashtami", "गोपाष्टमी", "Gopashtami", "Kartika Shukla Ashtami", "Kartika", "Major", true,
            "Celebrates the day young Shri Krishna and Balarama graduated to tending cows in Vrindavan.",
            "Gau Mata worship, fresh green fodder, jaggery feeding & Krishna Bhajan.",
            "Sattvic festive celebration.", 7, 7, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-akshaya-navami", "अक्षय नवमी (आंवला नवमी)", "Akshaya Navami (Amla Navami)", "Kartika Shukla Navami", "Kartika", "Major", true,
            "Marks Kartika Vishnu puja beneath the sacred Amla tree symbolizing eternal merit.",
            "Worship & share community sattvic meal beneath an Amla tree.",
            "Pure sattvic vegetarian meal.", 7, 8, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-devutthana", "देवउठनी एकादशी (प्रबोधिनी एकादशी)", "Devutthana Ekadashi", "Kartika Shukla Ekadashi", "Kartika", "Major", true,
            "Marks the sacred awakening of Lord Vishnu after Chaturmas.",
            "Evening Tulsi puja, 11 earthen diyas, sugarcane mandap & Vishnu Sahasranama.",
            "Sattvic Falahar or Nirjala Ekadashi vrat.", 7, 10, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-tulsi-vivah", "तुलसी विवाह", "Tulsi Vivah", "Kartika Shukla Dwadashi", "Kartika", "Major", true,
            "Ceremonial union of Mata Vrinda (Tulsi) and Bhagavan Shaligram after Devutthana Ekadashi.",
            "Decorate Tulsi courtyard with sugarcane, offer turmeric, kumkum & mangalashtak.",
            "Break Ekadashi vrat during Dwadashi Parana.", 7, 11, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-vaikuntha-chaturdashi", "वैकुंठ चतुर्दशी & हरिहर मिलन", "Vaikuntha Chaturdashi & Harihar Milan", "Kartika Shukla Chaturdashi", "Kartika", "Major", true,
            "Sacred Kartika Shukla Chaturdashi celebrating Harihar Milan — Lord Vishnu worshipped Lord Shiva at Kashi with 1,000 golden lotuses (offering his own Kamalnayan eye) and received the Sudarshana Chakra in cosmic unity.",
            "Arunodaya/Manikarnika Snan, Nishita Kaal joint Vishnu-Shiva archana offering Tulsi to Shiva & Belpatra to Vishnu, and lighting 14 earthen diyas.",
            "Daylong Phalahar or single sattvic meal after Nishita Puja and Harihar Aarti.", 7, 13, FestivalMuhuratKind.Nishita, true),
        new("dyn-kartik-purnima", "कार्तिक पूर्णिमा & देव दीपावली", "Kartik Purnima & Dev Deepawali", "Kartika Purnima", "Kartika", "Major", true,
            "Celebrates Lord Shiva's victory over Tripurasura; river ghats glow with countless lamps.",
            "Brahma Muhurat Snan, Deep Daan by sacred water, Satyanarayan Katha & Shiva Puja.",
            "Sattvic single meal after Moonrise arghya.", 7, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Margashirsha (8)
        new("dyn-kalabhairava-jayanti", "कालभैरव जयंती (भैरव अष्टमी)", "Kalabhairava Jayanti", "Margashirsha Krishna Ashtami", "Margashirsha", "Major", true,
            "Celebrates the manifestation of Bhagavan Kalabhairava, guardian of Kashi and master of cosmic time.",
            "Evening Shiva-Kalabhairava aarti, mustard oil lamp & feeding stray dogs with compassion.",
            "Sattvic single meal and Kalabhairava Ashtakam recitation.", 8, 22, FestivalMuhuratKind.Noon, true),
        new("dyn-vivah-panchami", "विवाह पंचमी", "Vivah Panchami", "Margashirsha Shukla Panchami", "Margashirsha", "Major", true,
            "Commemorates the celestial wedding of Bhagavan Shri Rama and Mata Sita in Janakpur.",
            "Ramcharitmanas Balakanda recitation & Rama-Sita kalyanotsava aarti.",
            "Devotional sattvic observance.", 8, 4, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-gita-jayanti", "गीता जयंती & मोक्षदा एकादशी", "Gita Jayanti & Mokshada Ekadashi", "Margashirsha Shukla Ekadashi", "Margashirsha", "Major", true,
            "Honors the sacred day Bhagavan Shri Krishna imparted the Bhagavad Gita to Arjuna at Kurukshetra.",
            "Bhagavad Gita complete parayana, ghee diya & Gita Daan.",
            "Grain-free Ekadashi Falahar fast.", 8, 10, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-dattatreya-jayanti", "श्री दत्तात्रेय जयंती & मार्गशीर्ष पूर्णिमा", "Dattatreya Jayanti & Margashirsha Purnima", "Margashirsha Purnima", "Margashirsha", "Major", true,
            "Birth anniversary of Guru Dattatreya uniting Brahma, Vishnu & Maheshwara.",
            "Pradosh Dattatreya Puja, Guru Charitra paath & Anna Daan.",
            "Sattvic fast broken after Moon darshan.", 8, 14, FestivalMuhuratKind.Pradosh, true),

        // Pausha (9)
        new("dyn-vaikuntha-ekadashi", "वैकुंठ एकादशी / पौष पुत्रदा एकादशी", "Vaikuntha Ekadashi (Pausha Putrada)", "Pausha Shukla Ekadashi", "Pausha", "Major", true,
            "Auspicious Ekadashi when temple Vaikuntha Dwara opens signifying Lord Vishnu's boundless grace.",
            "Early morning Vishnu Darshan, Vaikuntha Dwara passage & Vishnu Sahasranama.",
            "Grain-free Ekadashi vrat broken at Dwadashi Parana.", 9, 10, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-pausha-purnima", "पौष पूर्णिमा (शाकंभरी पूर्णिमा)", "Pausha Purnima (Magha Snan Begins)", "Pausha Purnima", "Pausha", "Major", true,
            "Marks the start of month-long Prayagraj Magh Mela Kalpavas & Shakambhari Devi Jayanti.",
            "Morning holy bath, Surya Arghya & Satyanarayan Katha.",
            "Sattvic single meal after Moon darshan.", 9, 14, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Magha (10)
        new("dyn-vasant-panchami", "वसंत पंचमी (सरस्वती पूजा)", "Vasant Panchami & Saraswati Puja", "Magha Shukla Panchami", "Magha", "Major", true,
            "Celebrates Maa Saraswati (wisdom, music, arts) and welcomes spring.",
            "Wear yellow attire, Vidyarambham & offer yellow flowers.",
            "Kesari sweet rice and sattvic prasad.", 10, 4, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-ratha-saptami", "रथ सप्तमी (सूर्य जयंती)", "Ratha Saptami (Surya Jayanti)", "Magha Shukla Saptami", "Magha", "Major", true,
            "Marks Lord Surya turning His seven-horse golden chariot northward.",
            "Arunodaya bath with Arka leaves, Aditya Hridaya Stotra & sweet Kheer bhog.",
            "Sattvic single meal after Surya Arghya.", 10, 6, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-magha-purnima", "माघ पूर्णिमा & संत रविदास जयंती", "Magha Purnima & Sant Ravidas Jayanti", "Magha Purnima", "Magha", "Major", true,
            "Finale of Prayagraj Kalpavas and birth anniversary of Saint-Poet Guru Ravidas.",
            "Holy river Snan, til-vastra Daan & Satyanarayan puja.",
            "Light daytime fast concluded after evening arghya.", 10, 14, FestivalMuhuratKind.SunriseOrKshaya, false),
        new("dyn-mauni-amavasya", "मौनी अमावस्या (माघी अमावस्या)", "Mauni Amavasya", "Magha Amavasya", "Magha", "Major", true,
            "Sacred day of mindful silence (Mauna Vrat) and holy bathing during Magha Maas.",
            "Silent morning meditation, sesame-ghee charity & Pitru Tarpan.",
            "Daytime quiet sattvic observance.", 10, 29, FestivalMuhuratKind.SunriseOrKshaya, false),

        // Phalguna (11)
        new("dyn-mahashivaratri", "महाशिवरात्रि", "Maha Shivaratri", "Phalguna Krishna Chaturdashi", "Phalguna", "Major", true,
            "Great night of Lord Shiva symbolizing awareness over darkness and cosmic Shiva-Shakti union.",
            "Chatur-Prahara Abhishekam with milk, bilva leaves & Om Namah Shivaya jagaran.",
            "Daylong Phalahar or Nirjala fast concluded next morning.", 11, 28, FestivalMuhuratKind.Nishita, true),
        new("dyn-holi", "होलिका दहन / फाल्गुन पूर्णिमा", "Holika Dahan & Phalguna Purnima", "Phalguna Purnima", "Phalguna", "Major", true,
            "Symbolizes Prahlada's unwavering devotion and the triumph of truth over arrogance.",
            "Evening Holika Puja with wheat ears, kumkum, coconut and Pradakshina.",
            "Next morning celebrates Rangwali Holi in harmony.", 11, 14, FestivalMuhuratKind.Pradosh, false)
    ];

    /// <summary>
    /// Enriches upstream festival feeds with any astronomically accurate Vedic festivals / vrats
    /// (such as Vaikuntha Chaturdashi &amp; Harihar Milan on Kartika Shukla Chaturdashi) over
    /// [<paramref name="centerDateKey"/> - 1 day .. <paramref name="centerDateKey"/> + <paramref name="windowDays"/>].
    /// Existing upstream records for the same date &amp; festival are preserved without duplication.
    /// </summary>
    public static IReadOnlyList<EcosystemFestivalSignal> EnrichFestivals(
        IReadOnlyList<EcosystemFestivalSignal> upstream,
        string centerDateKey,
        int windowDays = 14,
        EcosystemPanchangSignal? todayPanchang = null)
    {
        if (!DateOnly.TryParse(centerDateKey, out var centerDate))
            return upstream;

        var startDate = centerDate.AddDays(-1).ToDateTime(TimeOnly.MinValue);
        var computed = ComputeFestivalsForWindow(startDate, Math.Clamp(windowDays, 1, 60) + 1);
        var merged = new List<EcosystemFestivalSignal>(upstream.Count + computed.Count);
        merged.AddRange(upstream);

        foreach (var cand in computed)
        {
            if (ContainsSameFestival(merged, cand))
                continue;
            merged.Add(cand);
        }

        // Extra guard: if live todayPanchang reports Kartika + Shukla Chaturdashi and computed timezone
        // edge didn't emit it (or upstream omitted it), guarantee Vaikuntha Chaturdashi & Harihar Milan today!
        if (todayPanchang is not null
            && string.Equals(todayPanchang.DateKey, centerDateKey, StringComparison.Ordinal)
            && !string.IsNullOrWhiteSpace(todayPanchang.Tithi))
        {
            var matched = MatchFromLiveTithiBanner(todayPanchang, centerDateKey);
            foreach (var f in matched)
            {
                if (!ContainsSameFestival(merged, f))
                    merged.Add(f);
            }
        }

        return [.. merged.OrderBy(f => f.DateKey, StringComparer.Ordinal).ThenByDescending(f => f.IsMajorFestival)];
    }

    public static IReadOnlyList<EcosystemFestivalSignal> ComputeFestivalsForWindow(DateTime startDate, int daysCount)
    {
        var list = new List<EcosystemFestivalSignal>();
        const double istTz = 5.5;
        var prevSunRashi = -1;

        for (var offset = 0; offset <= daysCount; offset++)
        {
            var d = startDate.Date.AddDays(offset);
            var dateKey = d.ToString("yyyy-MM-dd");
            var jdDay = ToJulianDay(d);
            // Approximate Delhi Sunrise (6:00-7:05) / Sunset (17:20-19:20) within seasonal solar declination curve
            var dayOfYear = d.DayOfYear;
            var seasonalHalfHours = Math.Sin((dayOfYear - 80) * 2.0 * Math.PI / 365.25) * 45.0;
            var sunriseMins = 368.0 - seasonalHalfHours;
            var sunsetMins = 1094.0 + seasonalHalfHours;
            var jdSunrise = jdDay + ((sunriseMins / 60.0 - istTz) / 24.0);
            var jdNextSunrise = jdDay + 1.0 + ((sunriseMins / 60.0 - istTz) / 24.0);
            var jdNoon = jdDay + (12.0 - istTz) / 24.0;
            var jdAparahna = jdDay + (((sunriseMins + (sunsetMins - sunriseMins) * 0.72) / 60.0 - istTz) / 24.0);
            var jdPradosh = jdDay + (((sunsetMins + 36.0) / 60.0 - istTz) / 24.0);
            var jdNishita = jdDay + ((23.75 - istTz) / 24.0);

            var riseSnap = SnapshotAt(jdSunrise);
            var riseElong = NormalizeDeg(riseSnap.MoonNirayana - riseSnap.SunNirayana);
            var riseTithi = (int)Math.Floor(riseElong / 12.0) % 30;
            var riseMonth = DetermineLunarMonth(jdSunrise, riseElong, riseTithi);

            var nextSnap = SnapshotAt(jdNextSunrise);
            var nextElong = NormalizeDeg(nextSnap.MoonNirayana - nextSnap.SunNirayana);
            var nextRiseTithi = (int)Math.Floor(nextElong / 12.0) % 30;
            int? kshayaTithi = ((nextRiseTithi - riseTithi + 30) % 30) >= 2 ? (riseTithi + 1) % 30 : null;

            var noonState = SnapshotTithiMonth(jdNoon);
            var aparState = SnapshotTithiMonth(jdAparahna);
            var pradoshState = SnapshotTithiMonth(jdPradosh);
            var nishitaState = SnapshotTithiMonth(jdNishita);

            var curSunRashi = (int)Math.Floor(riseSnap.SunNirayana / 30.0) % 12;
            if (prevSunRashi != -1 && curSunRashi != prevSunRashi)
            {
                if (curSunRashi == 9)
                {
                    AddOnce(list, dateKey, "dyn-makara-sankranti", "मकर संक्रांति / उत्तरायण", "Makara Sankranti",
                        "Solar Sankranti (Makara)", "Makara", "Sankranti", true,
                        "Marks the Sun's sacred entry into Makara (Capricorn) and northward Uttarayana journey.",
                        "Morning holy dip (Snan), Til-Gud offerings, charity (Daan) & Surya Arghya.",
                        "Sattvic sesame and jaggery meal after morning prayers.");
                }
                else if (curSunRashi == 0)
                {
                    AddOnce(list, dateKey, "dyn-mesha-sankranti", "मेष संक्रांति / बैसाखी", "Mesha Sankranti (Baisakhi / Vishu)",
                        "Solar Sankranti (Mesha)", "Chaitra / Mesha", "Sankranti", true,
                        "Marks the Sun's entry into Mesha (Aries), celebrated as solar New Year across India.",
                        "Morning river bath, Surya worship, offering grains & seasonal fruits.",
                        "Traditional festive sattvic prasad.");
                }
            }
            prevSunRashi = curSunRashi;

            if (!riseMonth.IsAdhika)
            {
                foreach (var rule in MajorRules)
                {
                    var hit = rule.Muhurat switch
                    {
                        FestivalMuhuratKind.SunriseOrKshaya => MatchRiseOrKshaya(riseMonth, riseTithi, pradoshState.Month, kshayaTithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta),
                        FestivalMuhuratKind.Pradosh => MatchExactState(pradoshState.Month, pradoshState.Tithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta),
                        FestivalMuhuratKind.Nishita => MatchExactState(nishitaState.Month, nishitaState.Tithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta)
                            || (rule.TargetTithi == 13 && riseTithi == 13 && MatchExactState(pradoshState.Month, pradoshState.Tithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta)),
                        FestivalMuhuratKind.Noon => MatchExactState(noonState.Month, noonState.Tithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta),
                        FestivalMuhuratKind.Aparahna => MatchExactState(aparState.Month, aparState.Tithi, rule.MonthIndex, rule.TargetTithi, rule.UsePurnimanta),
                        _ => false
                    };
                    if (hit)
                    {
                        AddOnce(list, dateKey, rule.Id, rule.NameHindi, rule.NameEnglish, rule.TithiDisplay,
                            rule.MonthVedic, rule.Category, rule.IsMajor, rule.Description, rule.RitualsAndPujaVidhi, rule.FastingRules);
                    }
                }
            }

            // Recurring Pradosh / Ekadashi / Purnima / Amavasya if no major festival already claims the day
            if (!pradoshState.Month.IsAdhika && pradoshState.Tithi is 12 or 27 && !list.Any(x => x.DateKey == dateKey))
            {
                var pPaksha = pradoshState.Tithi == 12 ? "Shukla" : "Krishna";
                var prMonth = LunarMonths[pradoshState.Month.PurnimantaIdx];
                AddOnce(list, dateKey, $"dyn-pradosh-{dateKey.Replace("-", string.Empty)}", $"{prMonth} {pPaksha} प्रदोष व्रत", $"{prMonth} {pPaksha} Pradosh Vrat",
                    $"{prMonth} {pPaksha} Trayodashi", prMonth, "Pradosh", false,
                    "Twilight observance dedicated to Lord Shiva and Goddess Parvati during auspicious Pradosh Kaal.",
                    "Pradosh twilight Shiva Linga Abhishekam with bilva leaves and Shiva Chalisa recitation.",
                    "Light Sattvic fast broken after twilight Shiva Puja.");
            }
            if (!riseMonth.IsAdhika && (riseTithi is 10 or 25 || kshayaTithi is 10 or 25) && !list.Any(x => x.DateKey == dateKey))
            {
                var ekTithi = riseTithi is 10 or 25 ? riseTithi : kshayaTithi!.Value;
                var ekPaksha = ekTithi == 10 ? "Shukla" : "Krishna";
                var ekMonth = LunarMonths[riseMonth.PurnimantaIdx];
                AddOnce(list, dateKey, $"dyn-ekadashi-{dateKey.Replace("-", string.Empty)}", $"{ekMonth} {ekPaksha} एकादशी", $"{ekMonth} {ekPaksha} Ekadashi",
                    $"{ekMonth} {ekPaksha} Ekadashi", ekMonth, "Ekadashi", false,
                    $"Sacred {ekMonth} {ekPaksha} Ekadashi dedicated to Bhagavan Vishnu and inner clarity.",
                    "Morning snan, Tulsi leaves offering & Vishnu Sahasranama chant.",
                    "No grains, rice or beans; Falahar fast broken during Dwadashi Parana.");
            }
        }

        return list;
    }

    private static IReadOnlyList<EcosystemFestivalSignal> MatchFromLiveTithiBanner(EcosystemPanchangSignal p, string dateKey)
    {
        var month = (p.MonthPurnimanta ?? string.Empty).Trim();
        var tithi = $"{p.Paksha} {p.Tithi}".Trim();
        var results = new List<EcosystemFestivalSignal>();
        foreach (var rule in MajorRules)
        {
            if (!string.Equals(rule.MonthVedic, month, StringComparison.OrdinalIgnoreCase))
                continue;
            if (!tithi.Contains(rule.TithiDisplay.Replace($"{rule.MonthVedic} ", string.Empty, StringComparison.OrdinalIgnoreCase).Replace(" (Pradosh)", string.Empty), StringComparison.OrdinalIgnoreCase)
                && !(rule.TargetTithi == 13 && tithi.Contains("Shukla", StringComparison.OrdinalIgnoreCase) && tithi.Contains("Chaturdashi", StringComparison.OrdinalIgnoreCase)))
                continue;

            results.Add(new EcosystemFestivalSignal(
                Id: $"{rule.Id}-{dateKey[..4]}",
                NameHindi: rule.NameHindi,
                NameEnglish: rule.NameEnglish,
                DateKey: dateKey,
                Tithi: rule.TithiDisplay,
                MonthVedic: rule.MonthVedic,
                Description: rule.Description,
                RitualsAndPujaVidhi: rule.RitualsAndPujaVidhi,
                FastingRules: rule.FastingRules,
                IsMajorFestival: rule.IsMajor,
                Category: rule.Category,
                IsVerified: true,
                VerificationSource: "Lahiri Chitrapaksha Tithi Engine",
                VerificationUrl: "https://www.drikpanchang.com/"));
        }
        return results;
    }

    private static bool ContainsSameFestival(IReadOnlyList<EcosystemFestivalSignal> existing, EcosystemFestivalSignal candidate)
    {
        foreach (var ex in existing)
        {
            if (!string.Equals(ex.DateKey, candidate.DateKey, StringComparison.Ordinal))
                continue;
            if (string.Equals(ex.Id, candidate.Id, StringComparison.OrdinalIgnoreCase)
                || string.Equals(ex.NameEnglish, candidate.NameEnglish, StringComparison.OrdinalIgnoreCase))
                return true;
            var coreEx = CoreTokens(ex.NameEnglish);
            var coreCand = CoreTokens(candidate.NameEnglish);
            if (coreEx.Count > 0 && coreEx.Overlaps(coreCand))
                return true;
        }
        return false;
    }

    private static HashSet<string> CoreTokens(string title) =>
        (title ?? string.Empty).ToLowerInvariant()
            .Split([' ', '&', '/', '(', ')', '-', ','], StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= 4 && w is not ("puja" or "vrat" or "jayanti" or "festival" or "major" or "kartik" or "kartika" or "shukla" or "krishna"))
            .ToHashSet(StringComparer.Ordinal);

    private static void AddOnce(
        List<EcosystemFestivalSignal> target,
        string dateKey,
        string id,
        string hindi,
        string english,
        string tithi,
        string monthVedic,
        string category,
        bool isMajor,
        string desc,
        string vidhi,
        string fasting)
    {
        if (target.Any(f => string.Equals(f.NameEnglish, english, StringComparison.OrdinalIgnoreCase)
            && DateOnly.TryParse(f.DateKey, out var d1) && DateOnly.TryParse(dateKey, out var d2)
            && Math.Abs(d1.DayNumber - d2.DayNumber) < 15))
            return;

        target.Add(new EcosystemFestivalSignal(
            Id: $"{id}-{dateKey[..4]}",
            NameHindi: hindi,
            NameEnglish: english,
            DateKey: dateKey,
            Tithi: tithi,
            MonthVedic: monthVedic,
            Description: desc,
            RitualsAndPujaVidhi: vidhi,
            FastingRules: fasting,
            IsMajorFestival: isMajor,
            Category: category,
            IsVerified: true,
            VerificationSource: "Lahiri Chitrapaksha Tithi Engine",
            VerificationUrl: "https://www.drikpanchang.com/"));
    }

    private sealed record LunarMonthState(int AmantaIdx, int PurnimantaIdx, bool IsAdhika);

    private static bool MatchExactState(LunarMonthState m, int tithi, int monthReq, int tithiReq, bool usePurnimanta) =>
        !m.IsAdhika && (usePurnimanta ? m.PurnimantaIdx == monthReq : m.AmantaIdx == monthReq) && tithi == tithiReq;

    private static bool MatchRiseOrKshaya(
        LunarMonthState riseMonth,
        int riseTithi,
        LunarMonthState pradoshMonth,
        int? kshayaTithi,
        int monthReq,
        int tithiReq,
        bool usePurnimanta)
    {
        if (!riseMonth.IsAdhika && (usePurnimanta ? riseMonth.PurnimantaIdx == monthReq : riseMonth.AmantaIdx == monthReq) && riseTithi == tithiReq)
            return true;
        if (kshayaTithi == tithiReq && !pradoshMonth.IsAdhika && (usePurnimanta ? pradoshMonth.PurnimantaIdx == monthReq : pradoshMonth.AmantaIdx == monthReq))
            return true;
        return false;
    }

    private static (LunarMonthState Month, int Tithi) SnapshotTithiMonth(double jd)
    {
        var snap = SnapshotAt(jd);
        var elong = NormalizeDeg(snap.MoonNirayana - snap.SunNirayana);
        var tithi = (int)Math.Floor(elong / 12.0) % 30;
        return (DetermineLunarMonth(jd, elong, tithi), tithi);
    }

    private static LunarMonthState DetermineLunarMonth(double jdSunrise, double elongation, int tithiIdx)
    {
        var jdPrev = RefineAmavasya(jdSunrise - (elongation / 12.190749));
        if (jdPrev > jdSunrise)
            jdPrev = RefineAmavasya(jdPrev - SynodicMonthDays);
        var jdNext = RefineAmavasya(jdPrev + SynodicMonthDays);
        if (jdNext <= jdSunrise)
        {
            jdPrev = jdNext;
            jdNext = RefineAmavasya(jdPrev + SynodicMonthDays);
        }

        var prevRashi = (int)Math.Floor(SnapshotAt(jdPrev).SunNirayana / 30.0) % 12;
        var nextRashi = (int)Math.Floor(SnapshotAt(jdNext).SunNirayana / 30.0) % 12;
        var isAdhika = prevRashi == nextRashi;
        var amantaIdx = isAdhika ? (nextRashi + 1) % 12 : nextRashi % 12;
        var purnimantaIdx = (!isAdhika && tithiIdx >= 15) ? (amantaIdx + 1) % 12 : amantaIdx;
        return new LunarMonthState(amantaIdx, purnimantaIdx, isAdhika);
    }

    private static double RefineAmavasya(double jdGuess)
    {
        var jd = jdGuess;
        for (var i = 0; i < 6; i++)
        {
            var snap = SnapshotAt(jd);
            var diff = NormalizeDeg(snap.MoonNirayana - snap.SunNirayana);
            if (diff > 180.0) diff -= 360.0;
            if (Math.Abs(diff) < 1e-4) break;
            jd -= diff / 12.190749;
        }
        return jd;
    }

    private static (double SunNirayana, double MoonNirayana) SnapshotAt(double jd)
    {
        var t = (jd - 2451545.0) / 36525.0;
        var t2 = t * t;
        var t3 = t2 * t;

        var sunMean = 280.46646 + 36000.76983 * t + 0.0003032 * t2;
        var sunAnom = NormalizeDeg(357.52911 + 35999.05029 * t - 0.0001537 * t2) * Deg2Rad;
        var sunEq = (1.914602 - 0.004817 * t - 0.000014 * t2) * Math.Sin(sunAnom)
            + (0.019993 - 0.000101 * t) * Math.Sin(2.0 * sunAnom)
            + 0.000289 * Math.Sin(3.0 * sunAnom);
        var omega = (125.04 - 1934.136 * t) * Deg2Rad;
        var nut = -0.00478 * Math.Sin(omega);
        var sunTrop = NormalizeDeg(sunMean + sunEq - 0.00569 + nut);

        var lp = 218.3164477 + 481267.88123421 * t - 0.0015786 * t2 + t3 / 538841.0;
        var d = NormalizeDeg(297.8501921 + 445267.1114034 * t - 0.0018819 * t2) * Deg2Rad;
        var ms = NormalizeDeg(357.5291092 + 35999.0502909 * t) * Deg2Rad;
        var mm = NormalizeDeg(134.9633964 + 477198.8675055 * t + 0.0087414 * t2) * Deg2Rad;
        var f = NormalizeDeg(93.2720950 + 483202.0175233 * t - 0.0036539 * t2) * Deg2Rad;
        var ecc = 1.0 - 0.002516 * t - 0.0000074 * t2;

        var sigmaL =
            6.288774 * Math.Sin(mm)
            + 1.274027 * Math.Sin(2.0 * d - mm)
            + 0.658314 * Math.Sin(2.0 * d)
            + 0.213618 * Math.Sin(2.0 * mm)
            - 0.185116 * ecc * Math.Sin(ms)
            - 0.114332 * Math.Sin(2.0 * f)
            + 0.058793 * Math.Sin(2.0 * d - 2.0 * mm)
            + 0.057066 * ecc * Math.Sin(2.0 * d - ms - mm)
            + 0.053322 * Math.Sin(2.0 * d + mm)
            + 0.045758 * ecc * Math.Sin(2.0 * d - ms)
            - 0.040923 * ecc * Math.Sin(ms - mm)
            - 0.034720 * Math.Sin(d)
            - 0.030383 * ecc * Math.Sin(ms + mm)
            + 0.015327 * Math.Sin(2.0 * d - 2.0 * f)
            - 0.012528 * Math.Sin(mm + 2.0 * f)
            + 0.010980 * Math.Sin(mm - 2.0 * f)
            + 0.010675 * Math.Sin(4.0 * d - mm)
            + 0.010034 * Math.Sin(3.0 * mm);

        var moonTrop = NormalizeDeg(lp + sigmaL + nut);
        var ayanamsa = 23.857092 + ((5029.0966 * t + 1.11161 * t2) / 3600.0) + nut;
        return (NormalizeDeg(sunTrop - ayanamsa), NormalizeDeg(moonTrop - ayanamsa));
    }

    private static double ToJulianDay(DateTime date)
    {
        var y = date.Year;
        var m = date.Month;
        if (m <= 2) { y--; m += 12; }
        var a = y / 100;
        var b = 2 - a + (a / 4);
        return Math.Floor(365.25 * (y + 4716)) + Math.Floor(30.6001 * (m + 1)) + date.Day + b - 1524.5;
    }

    private static double NormalizeDeg(double deg)
    {
        var res = deg % 360.0;
        return res < 0 ? res + 360.0 : res;
    }
}
