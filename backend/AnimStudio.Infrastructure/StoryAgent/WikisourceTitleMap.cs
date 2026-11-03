namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Which page on sa.wikisource.org holds a chapter of a text the catalogue knows, and the other
/// way round for a page a search found.
/// </summary>
/// <remarks>
/// Only texts that are on the site in a regular, chapter-per-page shape are mapped; the page names
/// below were each checked against the live site. A text that is not here (the Valmiki Ramayana is
/// proofread-page based; the Mahabharata is only partly there) is not fetched by name, and a
/// reference to it is still a pointer the person can follow.
/// </remarks>
public static class WikisourceTitleMap
{
    public const string Host = "sa.wikisource.org";

    private const string Bhagavata = "श्रीमद्भागवतपुराणम्";
    private const string VishnuPurana = "विष्णुपुराणम्";
    private const string Gita = "भगवद्गीता";

    /// <summary>The first half of skandha 10 is chapters 1-49; the rest is on pages under the other half.</summary>
    private const int Skandha10FirstHalfEnd = 49;

    private static readonly string[] Amshas =
        ["प्रथमांशः", "द्वितीयांशः", "तृतीयांशः", "चतुर्थांशः", "पञ्चमांशः"];

    private static readonly string[] GitaChapters =
    [
        "अर्जुनविषादयोगः", "साङ्ख्ययोगः", "कर्मयोगः", "ज्ञानकर्मसंन्यासयोगः", "कर्मसंन्यासयोगः", "आत्मसंयमयोगः",
        "ज्ञानविज्ञानयोगः", "अक्षरब्रह्मयोगः", "राजविद्याराजगुह्ययोगः", "विभूतियोगः", "विश्वरूपदर्शनयोगः", "भक्तियोगः",
        "क्षेत्रक्षेत्रज्ञविभागयोगः", "गुणत्रयविभागयोगः", "पुरुषोत्तमयोगः", "दैवासुरसम्पद्विभागयोगः",
        "श्रद्धात्रयविभागयोगः", "मोक्षसंन्यासयोगः"
    ];

    /// <summary>
    /// The page for a chapter, or null when the text is not on the site this way. For the Gita the
    /// division is the chapter and <paramref name="unit"/> is ignored: its page holds every verse.
    /// </summary>
    public static string? TitleFor(string? textId, int division, int unit)
    {
        switch (textId)
        {
            case "bhagavata-purana" when division is >= 1 and <= 12 && unit >= 1:
            {
                var half = division == 10
                    ? unit <= Skandha10FirstHalfEnd ? "/पूर्वार्धः" : "/उत्तरार्धः"
                    : string.Empty;
                return $"{Bhagavata}/स्कन्धः {Devanagari(division)}{half}/अध्यायः {Devanagari(unit)}";
            }

            case "vishnu-purana" when division >= 1 && division <= Amshas.Length && unit >= 1:
                return $"{VishnuPurana}/{Amshas[division - 1]}/अध्यायः {Devanagari(unit)}";

            case "bhagavad-gita" when division is >= 1 and <= 18:
                return $"{Gita}/{GitaChapters[division - 1]}";

            default:
                return null;
        }
    }

    /// <summary>
    /// The catalogue text and place a page title names, in the form a citation is written
    /// (<c>8.8</c>, or <c>2</c> for a whole Gita chapter); null for a page that is not one of these.
    /// </summary>
    public static (string TextId, string Ref)? Describe(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)) return null;

        var parts = title.Split('/');

        if (parts[0] == Bhagavata && parts.Length >= 3 && parts.Length <= 4)
        {
            var skandha = LabelledNumber(parts[1], "स्कन्धः");
            var chapter = LabelledNumber(parts[^1], "अध्यायः");
            var halfOk = parts.Length == 3 || parts[2] is "पूर्वार्धः" or "उत्तरार्धः";
            if (skandha is not null && chapter is not null && halfOk) return ("bhagavata-purana", $"{skandha}.{chapter}");
        }

        if (parts[0] == VishnuPurana && parts.Length == 3)
        {
            var amsha = Array.IndexOf(Amshas, parts[1]);
            var chapter = LabelledNumber(parts[2], "अध्यायः");
            if (amsha >= 0 && chapter is not null) return ("vishnu-purana", $"{amsha + 1}.{chapter}");
        }

        if (parts[0] == Gita && parts.Length == 2)
        {
            var chapter = Array.IndexOf(GitaChapters, NormalizeGitaName(parts[1]));
            if (chapter >= 0) return ("bhagavad-gita", (chapter + 1).ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        return null;
    }

    /// <summary>The site spells two chapter names two ways; the shorter spellings are redirects.</summary>
    private static string NormalizeGitaName(string name) => name switch
    {
        "सांख्ययोगः" => "साङ्ख्ययोगः",
        "दैवासुरसंपद्विभागयोगः" => "दैवासुरसम्पद्विभागयोगः",
        _ => name
    };

    /// <summary>The number in "label 12" (Devanagari or ASCII digits), or null.</summary>
    private static string? LabelledNumber(string part, string label)
    {
        if (!part.StartsWith(label, StringComparison.Ordinal)) return null;

        var number = FromDevanagari(part[label.Length..].Trim());
        return number is > 0 ? number.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : null;
    }

    private static string Devanagari(int number)
    {
        var digits = number.ToString(System.Globalization.CultureInfo.InvariantCulture).ToCharArray();
        for (var i = 0; i < digits.Length; i++) digits[i] = (char)('\u0966' + (digits[i] - '0'));
        return new string(digits);
    }

    private static int? FromDevanagari(string text)
    {
        if (text.Length == 0 || text.Length > 4) return null;

        var value = 0;
        foreach (var c in text)
        {
            int digit;
            if (c is >= '\u0966' and <= '\u096F') digit = c - '\u0966';
            else if (c is >= '0' and <= '9') digit = c - '0';
            else return null;
            value = value * 10 + digit;
        }

        return value;
    }
}
