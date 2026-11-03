namespace AnimStudio.Application.StoryAgent;

public enum GranthKind { Itihasa, Purana, Gita, Upanishad, Veda, Stotra, Other }

/// <summary>
/// A top-level division of a text - a skandha, kanda, amsha or parva - and, where editions
/// agree, how many numbered units (chapters or sargas) it holds.
/// </summary>
/// <param name="Units">
/// The highest unit number; null when editions disagree too much for a number to be useful.
/// Where recensions differ the largest common count is used, so a citation is only refused
/// when it is outside every edition.
/// </param>
public sealed record GranthDivision(int Number, string Name, int? Units = null, params string[] Aliases);

/// <summary>A text the catalogue knows: its names, and the shape of it a citation is checked against.</summary>
public sealed record GranthText(
    string Id,
    string English,
    string Hindi,
    GranthKind Kind,
    string DivisionLabel,
    string UnitLabel,
    IReadOnlyList<GranthDivision> Divisions,
    IReadOnlyList<string> Aliases)
{
    /// <summary>False for a text cited by free-form pointers rather than numbers (a stotra, an Upanishad).</summary>
    public bool IsStructured => Divisions.Count > 0;

    /// <summary>True when the text has one division, so a bare number in a reference is a unit, not a division.</summary>
    public bool IsSingleDivision => Divisions.Count == 1;

    public GranthDivision? Division(int number) => Divisions.FirstOrDefault(d => d.Number == number);
}

/// <summary>
/// The Granths a script may cite. The structure here - which kandas and skandhas exist and how
/// long they are - is what lets a citation be checked by the machine: "Bhagavata Purana 10.59"
/// is a real place, "Bhagavata Purana 13.2" is not, whatever a text model says.
/// </summary>
/// <remarks>
/// This is a reference, not a corpus. It says where things are, not what they say; the words
/// come from the passages the research step fetches. Chapter counts follow the common printed
/// recensions and are deliberately generous where editions differ.
/// </remarks>
public static class GranthCatalog
{
    private static IReadOnlyList<GranthDivision> Numbered(int count, string label, int? units = null) =>
        [.. Enumerable.Range(1, count).Select(i => new GranthDivision(i, $"{label} {i}", units))];

    private static IReadOnlyList<GranthDivision> WithUnits(string label, params int[] units) =>
        [.. units.Select((u, i) => new GranthDivision(i + 1, $"{label} {i + 1}", u))];

    public static readonly IReadOnlyList<GranthText> Texts =
    [
        // ---- Itihasa ------------------------------------------------------------------
        new("valmiki-ramayana", "Valmiki Ramayana", "वाल्मीकि रामायण", GranthKind.Itihasa, "Kanda", "Sarga",
            [
                new(1, "Bala", 77, "Balakanda", "बाल"),
                new(2, "Ayodhya", 119, "Ayodhyakanda", "अयोध्या"),
                new(3, "Aranya", 75, "Aranyakanda", "अरण्य"),
                new(4, "Kishkindha", 67, "Kishkindhakanda", "किष्किन्धा", "किष्किंधा"),
                new(5, "Sundara", 68, "Sundarakanda", "सुन्दर", "सुंदर"),
                new(6, "Yuddha", 131, "Yuddhakanda", "Lanka", "युद्ध", "लंका"),
                new(7, "Uttara", 111, "Uttarakanda", "उत्तर")
            ],
            ["Valmiki Ramayan", "Ramayana", "Ramayan", "Srimad Valmiki Ramayana", "वाल्मीकि रामायण", "वाल्मीकिरामायण", "रामायण", "श्रीमद्वाल्मीकि रामायण"]),

        new("ramcharitmanas", "Ramcharitmanas", "रामचरितमानस", GranthKind.Itihasa, "Kanda", "Doha",
            [
                new(1, "Bala", null, "Balakanda", "बाल"),
                new(2, "Ayodhya", null, "Ayodhyakanda", "अयोध्या"),
                new(3, "Aranya", null, "Aranyakanda", "अरण्य"),
                new(4, "Kishkindha", null, "Kishkindhakanda", "किष्किन्धा", "किष्किंधा"),
                new(5, "Sundara", null, "Sundarakanda", "सुन्दर", "सुंदर"),
                new(6, "Lanka", null, "Lankakanda", "Yuddha", "लंका", "लङ्का"),
                new(7, "Uttara", null, "Uttarakanda", "उत्तर")
            ],
            ["Ramcharit Manas", "Ramacharitamanasa", "Tulsi Ramayan", "Tulsidas Ramayana", "Manas", "रामचरितमानस", "रामचरित मानस", "तुलसी रामायण"]),

        new("mahabharata", "Mahabharata", "महाभारत", GranthKind.Itihasa, "Parva", "Adhyaya",
            [
                new(1, "Adi", null, "Adiparva", "आदि"),
                new(2, "Sabha", null, "Sabhaparva", "सभा"),
                new(3, "Vana", null, "Aranyaka", "Aranyakaparva", "वन", "आरण्यक"),
                new(4, "Virata", null, "Viratparva", "विराट"),
                new(5, "Udyoga", null, "Udyogaparva", "उद्योग"),
                new(6, "Bhishma", null, "Bhishmaparva", "भीष्म"),
                new(7, "Drona", null, "Dronaparva", "द्रोण"),
                new(8, "Karna", null, "Karnaparva", "कर्ण"),
                new(9, "Shalya", null, "Shalyaparva", "शल्य"),
                new(10, "Sauptika", null, "Sauptikaparva", "सौप्तिक"),
                new(11, "Stri", null, "Striparva", "स्त्री"),
                new(12, "Shanti", null, "Shantiparva", "शान्ति", "शांति"),
                new(13, "Anushasana", null, "Anushasanaparva", "अनुशासन"),
                new(14, "Ashvamedhika", null, "Ashwamedhika", "Ashvamedhikaparva", "अश्वमेधिक"),
                new(15, "Ashramavasika", null, "Ashramavasikaparva", "आश्रमवासिक"),
                new(16, "Mausala", null, "Mausalaparva", "मौसल"),
                new(17, "Mahaprasthanika", null, "Mahaprasthanikaparva", "महाप्रस्थानिक"),
                new(18, "Svargarohana", null, "Swargarohana", "Svargarohanaparva", "स्वर्गारोहण")
            ],
            ["Mahabharat", "Maha Bharata", "Mahabharatam", "महाभारत"]),

        new("harivamsha", "Harivamsha", "हरिवंश", GranthKind.Itihasa, "Parva", "Adhyaya",
            [
                new(1, "Harivamsha", null, "Harivamsa", "हरिवंश"),
                new(2, "Vishnu", null, "Vishnuparva", "विष्णु"),
                new(3, "Bhavishya", null, "Bhavishyaparva", "भविष्य")
            ],
            ["Harivamsa", "Hari Vamsa", "Harivansh", "हरिवंश पुराण", "हरिवंश"]),

        // ---- Gita and shorter works ---------------------------------------------------
        new("bhagavad-gita", "Bhagavad Gita", "श्रीमद्भगवद्गीता", GranthKind.Gita, "Adhyaya", "Shloka",
            WithUnits("Chapter", 47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78),
            ["Gita", "Geeta", "Bhagavadgita", "Srimad Bhagavad Gita", "Shrimad Bhagavad Gita", "गीता", "भगवद्गीता", "श्रीमद्भगवद्गीता"]),

        // A text with one division is cited by its units alone: "Devi Mahatmya 2-4" means chapters 2 to 4.
        new("devi-mahatmya", "Devi Mahatmya (Durga Saptashati)", "देवी माहात्म्य (दुर्गा सप्तशती)", GranthKind.Stotra, "Part", "Adhyaya",
            [new(1, "Devi Mahatmya", 13)],
            ["Durga Saptashati", "Devi Mahatmyam", "Saptashati", "Chandi Path", "Chandi", "Sri Durga Saptashati", "दुर्गा सप्तशती", "देवी माहात्म्य", "सप्तशती", "चण्डी पाठ", "चंडी पाठ"]),

        new("hanuman-chalisa", "Hanuman Chalisa", "हनुमान चालीसा", GranthKind.Stotra, "Part", "Chaupai",
            [new(1, "Hanuman Chalisa", 40)], ["Hanuman Chalisa", "Chalisa", "हनुमान चालीसा"]),

        // ---- Puranas ------------------------------------------------------------------
        new("bhagavata-purana", "Bhagavata Purana", "श्रीमद्भागवत पुराण", GranthKind.Purana, "Skandha", "Adhyaya",
            WithUnits("Skandha", 19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13),
            ["Srimad Bhagavatam", "Shrimad Bhagavatam", "Srimad Bhagavata", "Shrimad Bhagavat", "Bhagavatam", "Bhagavat Purana", "Bhagwat Puran",
             "Srimad Bhagavata Mahapurana", "Shrimad Bhagavata Mahapurana", "श्रीमद्भागवत", "भागवत पुराण", "भागवत", "श्रीमद्भागवत महापुराण"]),

        new("vishnu-purana", "Vishnu Purana", "विष्णु पुराण", GranthKind.Purana, "Amsha", "Adhyaya",
            [
                new(1, "Amsha 1", 22, "Prathama", "प्रथमांश"),
                new(2, "Amsha 2", 16, "Dvitiya", "द्वितीयांश"),
                new(3, "Amsha 3", 18, "Tritiya", "तृतीयांश"),
                new(4, "Amsha 4", 24, "Chaturtha", "चतुर्थांश"),
                new(5, "Amsha 5", 38, "Panchama", "पञ्चमांश", "पंचमांश"),
                new(6, "Amsha 6", 8, "Shashtha", "षष्ठांश")
            ],
            ["Vishnu Puran", "Vishnupurana", "विष्णु पुराण", "विष्णुपुराण"]),

        new("shiva-purana", "Shiva Purana", "शिव पुराण", GranthKind.Purana, "Samhita", "Adhyaya",
            [
                new(1, "Vidyeshvara", null, "Vidyeshwara", "विद्येश्वर"),
                new(2, "Rudra", null, "Rudrasamhita", "रुद्र"),
                new(3, "Shatarudra", null, "Shatarudrasamhita", "शतरुद्र"),
                new(4, "Koti Rudra", null, "Kotirudra", "कोटिरुद्र", "कोटि रुद्र"),
                new(5, "Uma", null, "Umasamhita", "उमा"),
                new(6, "Kailasa", null, "Kailasasamhita", "कैलास", "कैलाश"),
                new(7, "Vayaviya", null, "Vayaviyasamhita", "वायवीय")
            ],
            ["Shiv Puran", "Shiva Mahapurana", "Shivapurana", "शिव पुराण", "शिवपुराण", "शिव महापुराण"]),

        new("devi-bhagavata", "Devi Bhagavata Purana", "देवी भागवत पुराण", GranthKind.Purana, "Skandha", "Adhyaya",
            Numbered(12, "Skandha"),
            ["Devi Bhagavatam", "Srimad Devi Bhagavatam", "Devi Bhagwat", "Devibhagavata", "देवी भागवत", "श्रीमद्देवीभागवत"]),

        new("markandeya-purana", "Markandeya Purana", "मार्कण्डेय पुराण", GranthKind.Purana, "Part", "Adhyaya",
            [new(1, "Markandeya Purana", 137)],
            ["Markandeya Puran", "Markandeyapurana", "मार्कण्डेय पुराण", "मार्कण्डेयपुराण"]),

        new("skanda-purana", "Skanda Purana", "स्कन्द पुराण", GranthKind.Purana, "Khanda", "Adhyaya",
            [
                new(1, "Maheshvara", null, "Maheshwara", "माहेश्वर"),
                new(2, "Vaishnava", null, "Vaishnavakhanda", "वैष्णव"),
                new(3, "Brahma", null, "Brahmakhanda", "ब्रह्म"),
                new(4, "Kashi", null, "Kashikhanda", "काशी"),
                new(5, "Avanti", null, "Avantikhanda", "अवन्ती"),
                new(6, "Nagara", null, "Nagarakhanda", "नागर"),
                new(7, "Prabhasa", null, "Prabhasakhanda", "प्रभास")
            ],
            ["Skanda Puran", "Skandapurana", "स्कन्द पुराण", "स्कंद पुराण", "स्कन्दपुराण"]),

        new("padma-purana", "Padma Purana", "पद्म पुराण", GranthKind.Purana, "Khanda", "Adhyaya",
            [], ["Padma Puran", "Padmapurana", "पद्म पुराण", "पद्मपुराण"]),

        new("brahma-vaivarta-purana", "Brahma Vaivarta Purana", "ब्रह्मवैवर्त पुराण", GranthKind.Purana, "Khanda", "Adhyaya",
            [
                new(1, "Brahma", null, "Brahmakhanda", "ब्रह्म"),
                new(2, "Prakriti", null, "Prakritikhanda", "प्रकृति"),
                new(3, "Ganapati", null, "Ganapatikhanda", "गणपति"),
                new(4, "Krishna Janma", null, "Krishnajanmakhanda", "Krishna", "कृष्णजन्म")
            ],
            ["Brahmavaivarta Purana", "Brahma Vaivarta Puran", "Brahmavaivarta", "ब्रह्मवैवर्त पुराण", "ब्रह्मवैवर्त"]),

        new("bhavishya-purana", "Bhavishya Purana", "भविष्य पुराण", GranthKind.Purana, "Parva", "Adhyaya",
            [], ["Bhavishya Puran", "Bhavishyapurana", "भविष्य पुराण"]),
        new("linga-purana", "Linga Purana", "लिङ्ग पुराण", GranthKind.Purana, "Part", "Adhyaya",
            [], ["Linga Puran", "Lingapurana", "लिंग पुराण", "लिङ्ग पुराण"]),
        new("matsya-purana", "Matsya Purana", "मत्स्य पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Matsya Puran", "Matsyapurana", "मत्स्य पुराण"]),
        new("agni-purana", "Agni Purana", "अग्नि पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Agni Puran", "Agnipurana", "अग्नि पुराण"]),
        new("garuda-purana", "Garuda Purana", "गरुड़ पुराण", GranthKind.Purana, "Khanda", "Adhyaya",
            [], ["Garuda Puran", "Garudapurana", "गरुड़ पुराण", "गरुड पुराण"]),
        new("varaha-purana", "Varaha Purana", "वराह पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Varaha Puran", "वराह पुराण"]),
        new("vamana-purana", "Vamana Purana", "वामन पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Vamana Puran", "वामन पुराण"]),
        new("kurma-purana", "Kurma Purana", "कूर्म पुराण", GranthKind.Purana, "Part", "Adhyaya",
            [], ["Kurma Puran", "कूर्म पुराण"]),
        new("narada-purana", "Narada Purana", "नारद पुराण", GranthKind.Purana, "Part", "Adhyaya",
            [], ["Narada Puran", "Naradiya Purana", "नारद पुराण"]),
        new("brahma-purana", "Brahma Purana", "ब्रह्म पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Brahma Puran", "ब्रह्म पुराण"]),
        new("brahmanda-purana", "Brahmanda Purana", "ब्रह्माण्ड पुराण", GranthKind.Purana, "Part", "Adhyaya",
            [], ["Brahmanda Puran", "ब्रह्माण्ड पुराण", "ब्रह्मांड पुराण"]),
        new("kalika-purana", "Kalika Purana", "कालिका पुराण", GranthKind.Purana, "Adhyaya", "Shloka",
            [], ["Kalika Puran", "कालिकापुराण", "कालिका पुराण"]),
        new("ganesha-purana", "Ganesha Purana", "गणेश पुराण", GranthKind.Purana, "Khanda", "Adhyaya",
            [], ["Ganesh Purana", "Ganesha Puran", "गणेश पुराण"]),

        // ---- Vedic ----------------------------------------------------------------------
        new("rigveda", "Rigveda", "ऋग्वेद", GranthKind.Veda, "Mandala", "Sukta",
            Numbered(10, "Mandala"), ["Rig Veda", "Rigveda Samhita", "ऋग्वेद"]),
        new("upanishads", "Upanishads", "उपनिषद्", GranthKind.Upanishad, "Upanishad", "Mantra",
            [], ["Upanishad", "Brihadaranyaka Upanishad", "Chandogya Upanishad", "Isha Upanishad", "Katha Upanishad", "Mundaka Upanishad",
                 "Mandukya Upanishad", "Taittiriya Upanishad", "उपनिषद", "उपनिषद्", "बृहदारण्यक उपनिषद्", "छान्दोग्य उपनिषद्"])
    ];

    private static readonly Lazy<IReadOnlyDictionary<string, GranthText>> ById =
        new(() => Texts.ToDictionary(t => t.Id, StringComparer.Ordinal));

    private static readonly Lazy<IReadOnlyDictionary<string, GranthText>> ByAlias = new(() =>
    {
        var map = new Dictionary<string, GranthText>(StringComparer.Ordinal);
        foreach (var text in Texts)
        {
            foreach (var name in new[] { text.Id, text.English, text.Hindi }.Concat(text.Aliases))
                map.TryAdd(NormalizeName(name), text);
        }
        return map;
    });

    /// <summary>The text with this catalogue id, or null.</summary>
    public static GranthText? Get(string? id) =>
        id is not null && ById.Value.TryGetValue(id, out var text) ? text : null;

    /// <summary>
    /// The text a model or a person means by a name: an id, an English or Hindi name, or a common
    /// spelling of one ("Srimad Bhagavatam", "श्रीमद्भागवत"). Null when it is not a text the catalogue knows.
    /// </summary>
    public static GranthText? Find(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        var key = NormalizeName(name);
        if (key.Length == 0) return null;
        if (ByAlias.Value.TryGetValue(key, out var exact)) return exact;

        // "Bhagavata Purana, Skandha 10" and the like: the longest alias the name starts with.
        return ByAlias.Value
            .Where(pair => pair.Key.Length >= 5 && key.StartsWith(pair.Key, StringComparison.Ordinal))
            .OrderByDescending(pair => pair.Key.Length)
            .Select(pair => pair.Value)
            .FirstOrDefault();
    }

    /// <summary>
    /// One spelling for a name, so "Srimad  Bhagavatam", "srimad-bhagavatam" and "Śrīmad Bhāgavatam"
    /// meet. Latin text loses diacritics, case, spaces and punctuation; Devanagari keeps its marks,
    /// because a vowel sign is part of the word.
    /// </summary>
    public static string NormalizeName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var decomposed = value.Normalize(System.Text.NormalizationForm.FormD);
        var builder = new System.Text.StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            var inDevanagari = c is >= '\u0900' and <= '\u097F';
            var category = char.GetUnicodeCategory(c);
            var isMark = category is System.Globalization.UnicodeCategory.NonSpacingMark
                or System.Globalization.UnicodeCategory.SpacingCombiningMark;

            if (inDevanagari)
            {
                // A virama or a vowel sign belongs to the word; only the nukta and danda-like marks are noise.
                if (c is not ('\u093C' or '\u0964' or '\u0965')) builder.Append(c);
                continue;
            }

            if (isMark) continue;
            if (char.IsAsciiLetterOrDigit(c)) builder.Append(char.ToLowerInvariant(c));
        }

        return builder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
