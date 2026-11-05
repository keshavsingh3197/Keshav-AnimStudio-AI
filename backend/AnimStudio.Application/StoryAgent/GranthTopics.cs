using System.Text;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>A pointer into a text: which one, where, and what is there.</summary>
public sealed record GranthSourceRef(string TextId, string Ref, string Note, StorySourceConfidence Confidence);

/// <summary>
/// A subject a title can be about - a festival, a deity, an episode - with the places in the
/// Granths that tell it. These are where the search starts, not where it ends.
/// </summary>
public sealed record GranthTopic(
    string Id,
    string Name,
    string Hindi,
    IReadOnlyList<string> Keywords,
    string Summary,
    IReadOnlyList<GranthSourceRef> Sources,
    string MusicQuery);

/// <summary>
/// The curated starting points. Each reference was chosen for being where the tradition itself
/// points; <see cref="StorySourceConfidence.Medium"/> and <see cref="StorySourceConfidence.Low"/>
/// mark the ones whose exact chapter should be checked against the reader's own edition.
/// </summary>
public static class GranthTopics
{
    private const StorySourceConfidence H = StorySourceConfidence.High;
    private const StorySourceConfidence M = StorySourceConfidence.Medium;
    private const StorySourceConfidence L = StorySourceConfidence.Low;

    /// <summary>Extra score for the topic that owns the earliest mention in a title.</summary>
    private const int LeadBonus = 4;

    private static GranthSourceRef S(string textId, string reference, string note, StorySourceConfidence confidence) =>
        new(textId, reference, note, confidence);

    public static readonly IReadOnlyList<GranthTopic> All =
    [
        new("diwali", "Diwali (Deepavali)", "दीपावली",
            ["diwali", "deepavali", "deepawali", "dipavali", "dipawali", "festival of lights", "दिवाली", "दीपावली", "दीवाली", "दीपोत्सव", "दीपमालिका"],
            "The festival of lights and its many Puranic stories: the churning of the ocean (Dhanvantari and Lakshmi), the slaying of Narakasura, Sri Rama's return to Ayodhya, Govardhan Puja and Bhai Dooj, and the Kartika custom of offering lamps.",
            [
                S("bhagavata-purana", "8.8", "Dhanvantari and Mata Lakshmi emerge from the churning of the ocean", H),
                S("bhagavata-purana", "10.59", "Sri Krishna slays Narakasura and frees the captive princesses", H),
                S("bhagavata-purana", "9.10-11", "Sri Rama's deeds, his return and his rule", H),
                S("bhagavata-purana", "10.24-25", "Govardhan Puja: Sri Krishna lifts the hill", H),
                S("valmiki-ramayana", "6.124-128", "The return to Ayodhya: Hanuman brings the news to Bharata, the welcome, the coronation", M),
                S("skanda-purana", "Vaishnava Khanda: Kartika Mahatmya", "The offering of lamps (deepdan) in the month of Kartika", M),
                S("padma-purana", "Uttara Khanda: Kartika Mahatmya", "Lamp-offering and the observances of Kartika", M),
                S("vishnu-purana", "5.29", "Krishna's war on Naraka", M)
            ],
            "sitar tanpura devotional"),

        new("dhanteras", "Dhanteras and Dhanvantari", "धनतेरस और धन्वंतरि",
            ["dhanteras", "dhantrayodashi", "dhan teras", "dhanatrayodashi", "dhanvantari", "dhanwantari", "धनतेरस", "धनत्रयोदशी", "धन्वंतरि", "धन्वन्तरि"],
            "Lord Dhanvantari rises from the ocean with the pot of nectar, the origin of the day of health and wealth.",
            [
                S("bhagavata-purana", "8.8", "Dhanvantari appears with the pot of nectar; Lakshmi appears", H),
                S("bhagavata-purana", "8.6-9", "The churning of the ocean from the truce to Mohini", H)
            ],
            "flute ambient indian"),

        new("lakshmi", "Mata Lakshmi and Lakshmi Puja", "माता लक्ष्मी और लक्ष्मी पूजन",
            ["lakshmi", "laxmi", "mahalakshmi", "lakshmi puja", "laxmi puja", "sri sukta", "shri sukta", "लक्ष्मी", "महालक्ष्मी", "लक्ष्मी पूजा", "श्री सूक्त", "श्रीसूक्त"],
            "Lakshmi's birth from the ocean, her choice of Vishnu, and why she is welcomed on the new-moon night of Kartika.",
            [
                S("bhagavata-purana", "8.8", "Lakshmi emerges from the churning and chooses Vishnu", H),
                S("vishnu-purana", "1.9", "The churning of the ocean and Indra's hymn to Sri", H)
            ],
            "sitar devotional calm"),

        new("narak-chaturdashi", "Naraka Chaturdashi (Narakasura)", "नरक चतुर्दशी",
            ["narakasura", "naraka chaturdashi", "narak chaturdashi", "choti diwali", "chhoti diwali", "bhaumasura", "roop chaudas", "नरकासुर", "नरक चतुर्दशी", "छोटी दिवाली", "रूप चौदस", "भौमासुर"],
            "Sri Krishna and Satyabhama defeat Narakasura of Pragjyotishpura and free the captive maidens.",
            [
                S("bhagavata-purana", "10.59", "The slaying of Narakasura and the freeing of the sixteen thousand", H),
                S("vishnu-purana", "5.29", "Krishna's war on Naraka", M)
            ],
            "epic indian drums"),

        new("govardhan", "Govardhan Puja (Annakut)", "गोवर्धन पूजा",
            ["govardhan", "govardhana", "annakut", "annakoot", "girdhari", "giriraj", "गोवर्धन", "अन्नकूट", "गिरिधारी", "गिरिराज"],
            "Sri Krishna ends the worship of Indra, the rains come, and he lifts Govardhan Hill on his little finger.",
            [
                S("bhagavata-purana", "10.24-25", "Krishna turns the worship to the hill; he lifts Govardhan", H),
                S("vishnu-purana", "5.10-11", "Indra's wrath and the lifting of Govardhan", M)
            ],
            "flute indian folk"),

        new("bhai-dooj", "Bhai Dooj (Yama Dwitiya)", "भाई दूज (यम द्वितीया)",
            ["bhai dooj", "bhaiya dooj", "bhai duj", "yama dwitiya", "yam dwitiya", "yamadvitiya", "भाई दूज", "भैया दूज", "यम द्वितीया", "यमद्वितीया"],
            "Yamaraja visits his sister Yamuna, who welcomes him with a tilak, and grants a boon to brothers.",
            [
                S("skanda-purana", "Vaishnava Khanda: Kartika Mahatmya", "Yama Dwitiya in the Kartika observances (traditional pointer)", L),
                S("padma-purana", "Uttara Khanda: Kartika Mahatmya", "Yama Dwitiya (traditional pointer)", L)
            ],
            "sitar gentle"),

        new("rama-navami", "Rama Navami (the birth of Sri Rama)", "राम नवमी",
            ["ram navami", "rama navami", "ramnavami", "rama janma", "ram janm", "श्रीराम जन्म", "राम नवमी", "रामनवमी", "राम जन्म"],
            "The sacrifice of Dasharatha, the Lord's decision to be born, and the birth of Rama and his brothers in Ayodhya.",
            [
                S("valmiki-ramayana", "1.15-18", "The putrakameshti sacrifice; the birth of Rama and his brothers", M),
                S("ramcharitmanas", "Bala", "The birth of Rama in the Bala Kanda", M),
                S("bhagavata-purana", "9.10", "The story of Rama in brief", M)
            ],
            "bhajan flute devotional"),

        new("dussehra", "Dussehra (Vijayadashami, Ravana's fall)", "दशहरा (विजयादशमी)",
            ["dussehra", "dasara", "dashahara", "dussera", "vijayadashami", "vijaya dashami", "ravana vadh", "ravan dahan", "दशहरा", "विजयादशमी", "रावण वध", "रावण दहन"],
            "Sri Rama's victory over Ravana: the Aditya Hridayam, the last battle, and the return of Sita.",
            [
                S("valmiki-ramayana", "6.107-108", "Aditya Hridayam and the slaying of Ravana", M),
                S("ramcharitmanas", "Lanka", "The war in Lanka and the fall of Ravana", M)
            ],
            "epic indian drums"),

        new("navratri", "Navratri and Maa Durga", "नवरात्रि और माँ दुर्गा",
            ["navratri", "navaratri", "durga", "mahishasura", "mahishasuramardini", "durga puja", "maa durga", "chandi", "saptashati", "नवरात्रि", "नवरात्र", "दुर्गा", "महिषासुर", "महिषासुरमर्दिनी", "दुर्गा सप्तशती", "चंडी"],
            "The Devi Mahatmya: Madhu and Kaitabha, the slaying of Mahishasura, and the fall of Shumbha and Nishumbha.",
            [
                S("devi-mahatmya", "1", "Madhu and Kaitabha", H),
                S("devi-mahatmya", "2-4", "The slaying of Mahishasura and the hymn of the gods", H),
                S("devi-mahatmya", "5-10", "Shumbha and Nishumbha, Chanda and Munda, Raktabija", H),
                S("devi-mahatmya", "11", "The hymn to Narayani", H),
                S("markandeya-purana", "81-93", "Where the Devi Mahatmya stands within the Markandeya Purana", M),
                S("devi-bhagavata", "5", "Mahishasura in the Devi Bhagavata", M)
            ],
            "shakti devotional drums"),

        new("holi", "Holi and Prahlada", "होली और भक्त प्रह्लाद",
            ["holi", "holika", "holika dahan", "prahlad", "prahlada", "narasimha", "narsingh", "hiranyakashipu", "hiranyakashyap", "होली", "होलिका", "होलिका दहन", "प्रह्लाद", "नृसिंह", "नरसिंह", "हिरण्यकशिपु", "हिरण्यकश्यप"],
            "Prahlada's unshaken devotion, Hiranyakashipu's anger, and Lord Narasimha.",
            [
                S("bhagavata-purana", "7.5-10", "Prahlada, Hiranyakashipu and Narasimha", H),
                S("vishnu-purana", "1.17-20", "Prahlada's trials in the Vishnu Purana", M)
            ],
            "bhajan upbeat indian"),

        new("janmashtami", "Janmashtami (the birth of Sri Krishna)", "जन्माष्टमी",
            ["janmashtami", "krishna janmashtami", "krishna janma", "gokulashtami", "जन्माष्टमी", "कृष्ण जन्म", "कृष्ण जन्माष्टमी"],
            "Devaki and Vasudeva in Kamsa's prison, the Lord's appearance, and the crossing of the Yamuna to Gokul.",
            [
                S("bhagavata-purana", "10.1-4", "The birth of Sri Krishna", H),
                S("vishnu-purana", "5.1-3", "The birth of Krishna in the Vishnu Purana", H),
                S("harivamsha", "Vishnu", "Krishna's birth in the Harivamsha", M)
            ],
            "flute bhajan devotional"),

        new("hanuman", "Hanuman and Hanuman Jayanti", "हनुमान जी",
            ["hanuman", "hanuman jayanti", "bajrangbali", "bajrang bali", "sankat mochan", "mahavir", "anjaneya", "हनुमान", "बजरंगबली", "बजरंग बली", "संकटमोचन", "अंजनेय", "हनुमान जयंती", "हनुमान चालीसा"],
            "Hanuman's birth and childhood, his leap across the ocean, the finding of Sita, and his devotion to Rama.",
            [
                S("valmiki-ramayana", "Sundara", "The Sundara Kanda: the leap, Lanka, Sita, the burning of Lanka", H),
                S("valmiki-ramayana", "4.66", "Jambavan recalls Hanuman's birth and strength", M),
                S("valmiki-ramayana", "7.35-36", "Hanuman's childhood and the boons", M),
                S("ramcharitmanas", "Sundara", "The Sundara Kanda of the Ramcharitmanas", H),
                S("hanuman-chalisa", "1-40", "The forty chaupais of the Hanuman Chalisa", H)
            ],
            "epic devotional drums"),

        new("shivratri", "Maha Shivratri and Lord Shiva", "महाशिवरात्रि और महादेव",
            ["shivratri", "mahashivratri", "maha shivratri", "shiva", "shiv", "mahadev", "bholenath", "shankar", "neelkanth", "jyotirlinga", "शिवरात्रि", "महाशिवरात्रि", "शिव", "महादेव", "भोलेनाथ", "शंकर", "नीलकंठ", "ज्योतिर्लिंग"],
            "Shiva drinks the Halahala poison, the pillar of light, and the vow of Shivaratri.",
            [
                S("bhagavata-purana", "8.7", "Shiva drinks the poison that rose from the ocean", H),
                S("shiva-purana", "Koti Rudra Samhita: Shivaratri Vrata", "The vow of Shivaratri", M),
                S("shiva-purana", "Vidyeshvara Samhita: the Linga", "The origin and worship of the Linga", M),
                S("linga-purana", "Linga-udbhava", "The pillar of fire (traditional pointer)", L)
            ],
            "tanpura meditation drone"),

        new("ganesh", "Ganesh Chaturthi and Lord Ganesha", "गणेश चतुर्थी और गणपति",
            ["ganesh", "ganesha", "ganapati", "vinayaka", "vighnaharta", "ganesh chaturthi", "गणेश", "गणपति", "विनायक", "विघ्नहर्ता", "गणेश चतुर्थी"],
            "The birth of Ganesha, the elephant head, and his place as the remover of obstacles.",
            [
                S("shiva-purana", "Rudra Samhita: Kumara Khanda", "The birth of Ganesha", M),
                S("brahma-vaivarta-purana", "Ganapati", "The Ganapati Khanda", H),
                S("ganesha-purana", "Upasana Khanda", "The Ganesha Purana (traditional pointer)", L)
            ],
            "dhol upbeat indian"),

        new("sankranti", "Makar Sankranti and Uttarayana", "मकर संक्रांति और उत्तरायण",
            ["makar sankranti", "sankranti", "uttarayan", "uttarayana", "pongal", "मकर संक्रांति", "संक्रांति", "उत्तरायण", "पोंगल"],
            "The sun's northward path, and Bhishma waiting for Uttarayana.",
            [
                S("bhagavad-gita", "8.24-25", "The paths of light and of darkness (Uttarayana and Dakshinayana)", H),
                S("mahabharata", "13.167", "Bhishma's departure on Uttarayana (Anushasana Parva)", M)
            ],
            "sitar morning calm"),

        new("dev-deepawali", "Dev Deepawali and Kartik Purnima", "देव दीपावली और कार्तिक पूर्णिमा",
            ["dev deepawali", "dev diwali", "dev deepavali", "kartik purnima", "kartika purnima", "tripurari purnima", "tripurasura", "tulsi vivah", "dev uthani", "prabodhini ekadashi",
             "देव दीपावली", "देव दिवाली", "कार्तिक पूर्णिमा", "त्रिपुरारी", "त्रिपुरासुर", "तुलसी विवाह", "देवउठनी", "प्रबोधिनी एकादशी"],
            "The destruction of Tripura by Shiva, the Matsya avatar, the Kartika observances, and Tulsi Vivah.",
            [
                S("shiva-purana", "Rudra Samhita: Yuddha Khanda (Tripura)", "The destruction of the three cities", M),
                S("bhagavata-purana", "8.24", "The Matsya avatar", H),
                S("skanda-purana", "Vaishnava Khanda: Kartika Mahatmya", "The glory of the month of Kartika", M),
                S("padma-purana", "Uttara Khanda: Kartika Mahatmya", "Kartika observances and Tulasi Vivaha", M),
                S("brahma-vaivarta-purana", "Prakriti", "The story of Tulasi in the Prakriti Khanda", M)
            ],
            "sitar flute devotional"),

        new("guru-purnima", "Guru Purnima and Vyasa", "गुरु पूर्णिमा और वेदव्यास",
            ["guru purnima", "vyasa purnima", "vyasa", "ved vyas", "veda vyasa", "गुरु पूर्णिमा", "व्यास पूर्णिमा", "वेदव्यास", "व्यास"],
            "Vyasa divides the Veda and composes the Puranas and the Mahabharata.",
            [
                S("vishnu-purana", "3.4", "Vyasa arranges the Veda", H),
                S("bhagavata-purana", "1.4", "Vyasa's work and his dissatisfaction", M)
            ],
            "tanpura flute meditation"),

        new("gita", "The Bhagavad Gita", "श्रीमद्भगवद्गीता",
            ["bhagavad gita", "bhagavadgita", "gita", "geeta", "gita jayanti", "kurukshetra", "गीता", "भगवद्गीता", "श्रीमद्भगवद्गीता", "गीता जयंती", "कुरुक्षेत्र"],
            "Krishna's teaching to Arjuna on the field of Kurukshetra.",
            [
                S("bhagavad-gita", "1-18", "The eighteen chapters", H),
                S("mahabharata", "6.25-42", "The Gita within the Bhishma Parva", M)
            ],
            "sitar meditation epic"),

        new("chhath", "Chhath Puja and Surya", "छठ पूजा और सूर्य देव",
            ["chhath", "chhath puja", "surya", "surya dev", "aditya hridaya", "sun god", "छठ", "छठ पूजा", "सूर्य", "आदित्य हृदय", "सूर्य देव"],
            "The worship of the Sun, the Aditya Hridayam, and Shashthi Devi.",
            [
                S("valmiki-ramayana", "6.107", "The Aditya Hridayam", M),
                S("brahma-vaivarta-purana", "Prakriti", "Shashthi Devi in the Prakriti Khanda", M),
                S("mahabharata", "3.3", "Surya gives Yudhishthira the Akshaya Patra (Vana Parva)", M)
            ],
            "flute sunrise ambient"),

        new("ganga", "Ganga Avataran and Bhagiratha", "गंगा अवतरण और भगीरथ",
            ["ganga", "ganges", "bhagiratha", "bhagirath", "ganga dussehra", "ganga avataran", "गंगा", "गङ्गा", "भगीरथ", "गंगा दशहरा", "गंगा अवतरण"],
            "Bhagiratha's penance, Shiva receiving the Ganga in his locks, and her descent to the earth.",
            [
                S("valmiki-ramayana", "1.35-44", "The story of Ganga and Bhagiratha in the Bala Kanda", M),
                S("bhagavata-purana", "9.9", "Bhagiratha brings the Ganga", H)
            ],
            "flute river ambient"),

        new("dashavatar", "The Dashavatar (the avatars of Vishnu)", "दशावतार",
            ["dashavatar", "dashavatara", "avatars of vishnu", "matsya", "kurma", "varaha", "vamana", "parashurama", "दशावतार", "अवतार", "मत्स्य अवतार", "कूर्म अवतार", "वराह अवतार", "वामन अवतार", "परशुराम"],
            "The incarnations of Vishnu and the stories in which each appears.",
            [
                S("bhagavata-purana", "1.3", "The list of the Lord's avatars", H),
                S("bhagavata-purana", "2.7", "The avatars and their purposes", H),
                S("bhagavata-purana", "8.24", "Matsya", H),
                S("bhagavata-purana", "3.13", "Varaha", H),
                S("bhagavata-purana", "8.18-22", "Vamana and Bali", H),
                S("bhagavata-purana", "9.15-16", "Parashurama", H)
            ],
            "epic indian cinematic"),

        new("krishna-leela", "The leelas of Sri Krishna", "श्रीकृष्ण लीला",
            ["krishna", "kanha", "kanhaiya", "gopal", "radha krishna", "raas leela", "kaliya", "makhan chor", "कृष्ण", "कान्हा", "कन्हैया", "गोपाल", "राधा कृष्ण", "रास लीला", "कालिया", "माखन चोर"],
            "Sri Krishna's life in Vrindavan, Mathura and Dwaraka.",
            [
                S("bhagavata-purana", "10", "The tenth skandha, the life of Krishna", H),
                S("vishnu-purana", "5", "The fifth amsha, the life of Krishna", H),
                S("harivamsha", "Vishnu", "The Vishnu Parva of the Harivamsha", M)
            ],
            "flute bhajan devotional"),

        new("ramayana", "The Ramayana", "रामायण",
            ["ramayana", "ramayan", "valmiki", "sita", "ram", "rama", "sri ram", "shri ram", "lanka", "रामायण", "वाल्मीकि", "राम", "श्रीराम", "सीता", "लंका"],
            "The story of Sri Rama from his birth in Ayodhya to the coronation.",
            [
                S("valmiki-ramayana", "Bala", "Birth, Vishvamitra, Sita's swayamvara", H),
                S("valmiki-ramayana", "Ayodhya", "The exile", H),
                S("valmiki-ramayana", "Aranya", "The forest and Sita's abduction", H),
                S("valmiki-ramayana", "Sundara", "Hanuman in Lanka", H),
                S("valmiki-ramayana", "Yuddha", "The war and the return", H),
                S("ramcharitmanas", "Bala", "Tulsidas's telling", M)
            ],
            "sitar epic devotional"),

        new("mahabharata", "The Mahabharata", "महाभारत",
            ["mahabharata", "mahabharat", "pandava", "pandavas", "kaurava", "draupadi", "arjuna", "bhishma", "karna", "महाभारत", "पांडव", "कौरव", "द्रौपदी", "अर्जुन", "भीष्म", "कर्ण"],
            "The Pandavas and the Kauravas, and the war of Kurukshetra.",
            [
                S("mahabharata", "Adi", "Origins and the Pandavas", H),
                S("mahabharata", "Udyoga", "The attempts at peace", H),
                S("mahabharata", "Bhishma", "The war begins; the Gita", H),
                S("mahabharata", "Shanti", "Bhishma's teaching", H)
            ],
            "epic cinematic drums")
    ];

    /// <summary>The topic with this id, or null.</summary>
    public static GranthTopic? Get(string? id) =>
        All.FirstOrDefault(t => string.Equals(t.Id, id, StringComparison.Ordinal));

    /// <summary>
    /// The topics a title and its notes are about, best match first. Latin keywords must match whole
    /// words ("ram" is not "program"); Devanagari keywords of four or more letters match inside a word,
    /// because Hindi attaches endings ("दीपावली" in "दीपावलीपर").
    /// </summary>
    public static IReadOnlyList<GranthTopic> Match(string? text, int max = 3) => Match(text, All, max);

    /// <summary>As <see cref="Match(string?, int)"/>, over a genre's own topics.</summary>
    public static IReadOnlyList<GranthTopic> Match(string? text, IReadOnlyList<GranthTopic> topics, int max = 3)
    {
        var folded = Fold(text);
        if (folded.Length == 0) return [];

        var padded = $" {folded} ";
        var scored = new List<(GranthTopic Topic, int Score, int FirstAt)>();
        foreach (var topic in topics)
        {
            // One weight per place in the text: "lakshmi" inside "lakshmi puja" is the same mention.
            var hits = new Dictionary<int, int>();
            foreach (var keyword in topic.Keywords)
            {
                var k = Fold(keyword);
                if (k.Length == 0) continue;

                var isDevanagari = k.Any(c => c is >= '\u0900' and <= '\u097F');

                // Where the keyword starts in the folded text, or -1. In " k " form the space sits one
                // place before the word, which is exactly the word's index in the unpadded text.
                var at = isDevanagari && k.Length >= 4
                    ? folded.IndexOf(k, StringComparison.Ordinal)
                    : padded.IndexOf($" {k} ", StringComparison.Ordinal);
                if (at < 0) continue;

                var weight = k.Contains(' ') ? 3 : 2;
                hits[at] = hits.TryGetValue(at, out var seen) ? Math.Max(seen, weight) : weight;
            }

            if (hits.Count > 0) scored.Add((topic, hits.Values.Sum(), hits.Keys.Min()));
        }

        if (scored.Count == 0) return [];

        // What a title opens with is what it is about: "Diwali: Dhanteras, Lakshmi puja ..." is Diwali.
        var lead = scored.Min(s => s.FirstAt);
        return [.. scored
            .Select(s => (s.Topic, Score: s.Score + (s.FirstAt == lead ? LeadBonus : 0)))
            .OrderByDescending(s => s.Score)
            .ThenBy(s => s.Topic.Id, StringComparer.Ordinal)
            .Take(max)
            .Select(s => s.Topic)];
    }

    /// <summary>Lower-cased words separated by single spaces, with Latin diacritics gone and Devanagari kept whole.</summary>
    public static string Fold(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var decomposed = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        var lastWasSpace = true;

        foreach (var c in decomposed)
        {
            var devanagari = c is >= '\u0900' and <= '\u097F';
            var category = char.GetUnicodeCategory(c);
            var isMark = category is System.Globalization.UnicodeCategory.NonSpacingMark
                or System.Globalization.UnicodeCategory.SpacingCombiningMark;

            bool keep;
            if (devanagari) keep = char.IsLetterOrDigit(c) || (isMark && c != '\u093C');
            else if (isMark) continue;
            else keep = char.IsLetterOrDigit(c);

            if (keep)
            {
                builder.Append(devanagari ? c : char.ToLowerInvariant(c));
                lastWasSpace = false;
            }
            else if (!lastWasSpace)
            {
                builder.Append(' ');
                lastWasSpace = true;
            }
        }

        return builder.ToString().Trim().Normalize(NormalizationForm.FormC);
    }
}
