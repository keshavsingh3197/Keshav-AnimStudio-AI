using System.Text.RegularExpressions;

namespace AnimStudio.Application.Rendering;

/// <summary>Painted 3D environments the procedural stage can place a scene in.</summary>
public enum SceneSetting
{
    Auto = 0,
    Temple = 1,
    ForestAshram = 2,
    RiverGhat = 3,
    Himalaya = 4,
    PalaceCourt = 5,
    Cosmos = 6,
    Village = 7,
    Battlefield = 8,
    Archive = 9,
    ModernCity = 10,
    ChaiStall = 11,
    ComedyStage = 12
}

/// <summary>Light of a scene: shifts sky colours, sun position and particle kind.</summary>
public enum SceneTimeOfDay
{
    Auto = 0,
    Dawn = 1,
    Day = 2,
    Sunset = 3,
    Night = 4
}

/// <summary>One <c>[SCENE]</c> directive: where and when the following lines take place, plus an image prompt.</summary>
public sealed record SceneDirective(SceneSetting Setting, SceneTimeOfDay TimeOfDay, string? Mood, string? ImagePrompt);

/// <summary>One <c>[CAST]</c> directive: a named character with an archetype and an outfit colour.</summary>
public sealed record CastDirective(string Name, CharacterVisualRole Role, string? RobeHex, string? Look);

/// <summary>One <c>[MEME]</c> directive: a reaction meme overlay or freeze-frame punchline dropped after a comic line.</summary>
public sealed record MemeDirective(string Name, string? Caption, double Seconds = 1.6);

/// <summary>
/// Parses the stage directions a 3D script may carry next to its dialogue lines:
/// <c>[SCENE]: forest ashram | dawn | calm | IMAGE: ...</c>, <c>[CAST]: Dhruv | child | saffron dhoti, gold crown</c>,
/// and <c>[MEME]: shocked_face | अरे बावले!</c>.
/// Directions are never spoken. Every value is matched against fixed allowlists, so pasted text only ever selects
/// one of the built-in settings, roles and colours.
/// </summary>
public static partial class SceneDirectives
{
    public static readonly string[] SceneTags = ["scene", "दृश्य", "setting", "location", "स्थान"];
    public static readonly string[] CastTags = ["cast", "पात्र", "character", "characters"];
    public static readonly string[] MemeTags = ["meme", "मीम", "reaction", "रिएक्शन"];

    private static readonly (SceneSetting Setting, string[] Tokens)[] SettingTokens =
    [
        (SceneSetting.ForestAshram, ["forest", "ashram", "jungle", "woods", "tapovan", "वन", "जंगल", "आश्रम", "तपोवन", "कुटिया"]),
        (SceneSetting.RiverGhat, ["river", "ghat", "ganga", "yamuna", "lake", "pond", "sea", "ocean", "shore", "नदी", "घाट", "गंगा", "यमुना", "सरोवर", "समुद्र", "तट"]),
        (SceneSetting.Himalaya, ["himalaya", "mountain", "kailash", "snow", "peak", "hill", "हिमालय", "पर्वत", "कैलाश", "पहाड़", "शिखर"]),
        (SceneSetting.PalaceCourt, ["palace", "court", "darbar", "throne", "fort", "kingdom", "महल", "दरबार", "राजमहल", "सिंहासन", "किला", "राज्य"]),
        (SceneSetting.Cosmos, ["cosmos", "space", "heaven", "swarga", "vaikuntha", "stars", "sky", "galaxy", "brahmand", "स्वर्ग", "वैकुंठ", "ब्रह्मांड", "आकाश", "तारे", "अंतरिक्ष"]),
        (SceneSetting.Village, ["village", "home", "house", "hut", "farm", "field", "courtyard", "गाँव", "गांव", "घर", "खेत", "आँगन", "आंगन"]),
        (SceneSetting.Battlefield, ["battlefield", "battle", "war", "kurukshetra", "army", "rebellion", "revolt", "fight", "युद्ध", "रणभूमि", "कुरुक्षेत्र", "सेना", "विद्रोह", "संग्राम"]),
        (SceneSetting.Archive, ["archive", "library", "museum", "classroom", "school", "study", "manuscript", "scroll", "पुस्तकालय", "संग्रहालय", "कक्षा", "विद्यालय", "पांडुलिपि"]),
        (SceneSetting.ChaiStall, ["chai", "tapri", "tea stall", "nukkad", "dhaba", "mohalla", "gali", "टपरी", "चाय", "नुक्कड़", "मोहल्ला", "ढाबा"]),
        (SceneSetting.ComedyStage, ["comedy", "funny", "meme", "standup", "stage", "roast", "sketch", "prank", "laugh", "joker", "joke", "कॉमेडी", "हंसी", "मज़ाक", "चुटकुला"]),
        (SceneSetting.ModernCity, ["city", "office", "street", "modern", "tech", "lab", "studio", "शहर", "दफ्तर", "सड़क", "आधुनिक"]),
        (SceneSetting.Temple, ["temple", "mandir", "shrine", "sanctum", "garbhagriha", "aarti", "puja", "मंदिर", "देवालय", "गर्भगृह", "आरती", "पूजा"])
    ];

    private static readonly (SceneTimeOfDay Time, string[] Tokens)[] TimeTokens =
    [
        (SceneTimeOfDay.Dawn, ["dawn", "sunrise", "morning", "brahma muhurta", "सुबह", "प्रातः", "भोर", "सूर्योदय", "ब्रह्म मुहूर्त"]),
        (SceneTimeOfDay.Sunset, ["sunset", "dusk", "evening", "twilight", "शाम", "संध्या", "सूर्यास्त", "गोधूलि"]),
        (SceneTimeOfDay.Night, ["night", "midnight", "moon", "dark", "रात", "रात्रि", "चाँद", "चांद", "अंधेरा"]),
        (SceneTimeOfDay.Day, ["day", "noon", "afternoon", "daylight", "दिन", "दोपहर"])
    ];

    private static readonly (CharacterVisualRole Role, string[] Tokens)[] RoleTokens =
    [
        (CharacterVisualRole.ChildDevotee, ["child", "boy", "girl", "kid", "young devotee", "student", "बालक", "बालिका", "बच्चा", "बच्ची", "शिष्य"]),
        (CharacterVisualRole.NobleWoman, ["queen", "mother", "woman", "lady", "princess", "rani", "mata", "रानी", "माता", "माँ", "स्त्री", "राजकुमारी", "देवी"]),
        (CharacterVisualRole.Warrior, ["warrior", "soldier", "general", "fighter", "guard", "revolutionary", "योद्धा", "सैनिक", "सेनापति", "वीर", "क्रांतिकारी"]),
        (CharacterVisualRole.KingCrown, ["king", "emperor", "raja", "prince", "ruler", "राजा", "सम्राट", "राजकुमार", "महाराज"]),
        (CharacterVisualRole.SageRishi, ["sage", "rishi", "guru", "saint", "muni", "monk", "teacher", "elder", "ऋषि", "मुनि", "गुरु", "संत", "आचार्य", "महर्षि"]),
        (CharacterVisualRole.Divine, ["god", "deity", "divine", "lord", "bhagwan", "avatar", "भगवान", "प्रभु", "अवतार", "ईश्वर"]),
        (CharacterVisualRole.Scholar, ["scholar", "historian", "narrator", "commoner", "villager", "merchant", "farmer", "इतिहासकार", "विद्वान", "किसान", "व्यापारी", "ग्रामीण"])
    ];

    private static readonly (string Hex, string[] Tokens)[] ColourTokens =
    [
        ("#D9661A", ["saffron", "orange", "bhagwa", "भगवा", "केसरिया", "नारंगी"]),
        ("#E8E4DA", ["white", "ivory", "सफेद", "श्वेत"]),
        ("#2F5FC9", ["blue", "indigo", "नीला", "नीले"]),
        ("#A3243A", ["red", "maroon", "crimson", "लाल", "मैरून"]),
        ("#2F8A57", ["green", "emerald", "हरा", "हरे"]),
        ("#D9A62B", ["gold", "golden", "yellow", "pitambar", "सुनहरा", "पीला", "पीताम्बर"]),
        ("#6B3FA0", ["purple", "violet", "बैंगनी"]),
        ("#7A5230", ["brown", "earthy", "भूरा"]),
        ("#3A3A44", ["black", "dark", "काला"])
    ];

    /// <summary>True when the bracket tag names a stage direction rather than a speaker.</summary>
    public static bool IsDirectiveTag(string tag) => IsSceneTag(tag) || IsCastTag(tag);

    public static bool IsMemeTag(string? tag) =>
        !string.IsNullOrWhiteSpace(tag) && MemeTags.Any(t => string.Equals(tag.Trim(), t, StringComparison.OrdinalIgnoreCase));

    public static MemeDirective? ParseMeme(string? body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;
        var parts = body.Split('|', StringSplitOptions.TrimEntries);
        var rawName = parts.Length > 0 ? parts[0] : string.Empty;
        var caption = parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]) ? parts[1] : null;
        var seconds = 1.6;
        if (parts.Length > 2 && double.TryParse(parts[2], System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            seconds = Math.Clamp(parsed, 0.8, 3.0);

        var name = rawName.Trim();
        if (name.Length == 0 && caption is null) return null;
        if (name.Length > 64) name = name[..64].TrimEnd();
        if (caption is { Length: > 100 }) caption = caption[..100].TrimEnd();
        if (caption is null && name.Contains(' ') && name.Any(c => c is >= '\u0900' and <= '\u097F'))
            caption = name;
        return new MemeDirective(name.Length > 0 ? name : "reaction", caption, seconds);
    }

    public static bool IsSceneTag(string tag) =>
        SceneTags.Contains(tag.Trim(), StringComparer.OrdinalIgnoreCase);

    public static bool IsCastTag(string tag) =>
        CastTags.Contains(tag.Trim(), StringComparer.OrdinalIgnoreCase);

    /// <summary><c>setting | time | mood | IMAGE: prompt</c>; any part may be missing or in any order.</summary>
    public static SceneDirective ParseScene(string body)
    {
        var text = body ?? string.Empty;
        string? imagePrompt = null;
        var imageMatch = ImagePromptRegex().Match(text);
        if (imageMatch.Success)
        {
            imagePrompt = Clip(imageMatch.Groups[1].Value, 400);
            text = text[..imageMatch.Index];
        }

        var parts = text.Split(['|', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var setting = InferSetting(text);
        var time = InferTime(text);
        string? mood = parts
            .Where(p => MatchSetting(p) == SceneSetting.Auto && MatchTime(p) == SceneTimeOfDay.Auto)
            .Select(p => Clip(p, 60))
            .FirstOrDefault(p => p is { Length: > 0 });
        return new SceneDirective(setting, time, mood, imagePrompt);
    }

    /// <summary><c>Name | role | look</c>. Null when there is no usable name.</summary>
    public static CastDirective? ParseCast(string body)
    {
        var parts = (body ?? string.Empty).Split('|', StringSplitOptions.TrimEntries);
        var name = Clip(parts.ElementAtOrDefault(0), 34);
        if (string.IsNullOrWhiteSpace(name) || IsDirectiveTag(name)) return null;

        var roleText = parts.ElementAtOrDefault(1) ?? string.Empty;
        var look = Clip(string.Join(' ', parts.Skip(2)), 160);
        var role = MatchRole(roleText) ?? MatchRole(look) ?? DialogueScriptParser.InferRole(name);
        var robe = MatchColour(look) ?? MatchColour(roleText);
        return new CastDirective(name, role, robe, string.IsNullOrWhiteSpace(look) ? null : look);
    }

    /// <summary>Best-matching painted setting for free text (a scene line, or a spoken line with no scene given).</summary>
    public static SceneSetting InferSetting(string? text) => MatchSetting(text ?? string.Empty);

    public static SceneTimeOfDay InferTime(string? text) => MatchTime(text ?? string.Empty);

    /// <summary>The theme family a setting is painted with (sky, palette, ambient geometry).</summary>
    public static ProceduralSceneTheme ThemeFor(SceneSetting setting, ProceduralSceneTheme fallback) => setting switch
    {
        SceneSetting.Temple => ProceduralSceneTheme.VedicTempleSunrise3D,
        SceneSetting.ForestAshram or SceneSetting.RiverGhat or SceneSetting.Himalaya or SceneSetting.Village => ProceduralSceneTheme.SereneNatureGlow,
        SceneSetting.Cosmos => ProceduralSceneTheme.CosmosSacred3D,
        SceneSetting.PalaceCourt or SceneSetting.Battlefield or SceneSetting.Archive => ProceduralSceneTheme.HistoryChronicle3D,
        SceneSetting.ModernCity => ProceduralSceneTheme.NeonCyberGrid3D,
        SceneSetting.ChaiStall or SceneSetting.ComedyStage => ProceduralSceneTheme.ComedyStage3D,
        _ => fallback
    };

    /// <summary>Encodes a scene as a compact cue carried on each dialogue turn: <c>setting/time</c>.</summary>
    public static string ToCue(SceneSetting setting, SceneTimeOfDay time) => $"{setting}/{time}";

    /// <summary>
    /// The cue of the <paramref name="sceneNumber"/>-th explicit <c>[SCENE]</c> line (1-based): <c>setting/time/n</c>.
    /// Every directed scene gets its own cue, so two scenes in the same place and light still get their own picture
    /// (the story moves on), and picture n always belongs to scene line n.
    /// </summary>
    public static string ToCue(SceneSetting setting, SceneTimeOfDay time, int sceneNumber) => $"{setting}/{time}/{sceneNumber}";

    /// <summary>The 1-based <c>[SCENE]</c> line a cue came from; null for a cue inferred from spoken text.</summary>
    public static int? SceneNumber(string? cue)
    {
        if (string.IsNullOrWhiteSpace(cue)) return null;
        var parts = cue.Split('/');
        return parts.Length > 2 && int.TryParse(parts[2], System.Globalization.NumberStyles.None,
            System.Globalization.CultureInfo.InvariantCulture, out var n) && n > 0 ? n : null;
    }

    public static (SceneSetting Setting, SceneTimeOfDay Time) FromCue(string? cue)
    {
        if (string.IsNullOrWhiteSpace(cue)) return (SceneSetting.Auto, SceneTimeOfDay.Auto);
        var parts = cue.Split('/');
        var setting = Enum.TryParse<SceneSetting>(parts[0], out var s) && Enum.IsDefined(s) ? s : SceneSetting.Auto;
        var time = parts.Length > 1 && Enum.TryParse<SceneTimeOfDay>(parts[1], out var t) && Enum.IsDefined(t) ? t : SceneTimeOfDay.Auto;
        return (setting, time);
    }

    private static SceneSetting MatchSetting(string text)
    {
        var lower = text.ToLowerInvariant();
        var best = SceneSetting.Auto;
        var bestAt = int.MaxValue;
        // The setting named first wins ("temple by the river" is a temple).
        foreach (var (setting, tokens) in SettingTokens)
        {
            foreach (var token in tokens)
            {
                var at = IndexOfWord(lower, token);
                if (at >= 0 && at < bestAt)
                {
                    bestAt = at;
                    best = setting;
                }
            }
        }
        return best;
    }

    private static SceneTimeOfDay MatchTime(string text)
    {
        var lower = text.ToLowerInvariant();
        foreach (var (time, tokens) in TimeTokens)
        {
            if (tokens.Any(t => IndexOfWord(lower, t) >= 0)) return time;
        }
        return SceneTimeOfDay.Auto;
    }

    private static CharacterVisualRole? MatchRole(string text)
    {
        var lower = text.ToLowerInvariant();
        foreach (var (role, tokens) in RoleTokens)
        {
            if (tokens.Any(t => IndexOfWord(lower, t) >= 0)) return role;
        }
        return null;
    }

    private static string? MatchColour(string text)
    {
        var lower = text.ToLowerInvariant();
        var best = (Hex: (string?)null, At: int.MaxValue);
        foreach (var (hex, tokens) in ColourTokens)
        {
            foreach (var token in tokens)
            {
                var at = IndexOfWord(lower, token);
                if (at >= 0 && at < best.At) best = (hex, at);
            }
        }
        return best.Hex;
    }

    /// <summary>
    /// Token must start a word (so "war" doesn't hit "toward", nor "वन" hit "जीवन"). Latin tokens must also end the
    /// word (a plural "s" allowed); Devanagari tokens may take any suffix ("मंदिरों", "वनों").
    /// </summary>
    internal static int IndexOfWord(string haystack, string token)
    {
        var from = 0;
        while (true)
        {
            var at = haystack.IndexOf(token, from, StringComparison.Ordinal);
            if (at < 0) return -1;
            var beforeOk = at == 0 || !IsWordChar(haystack[at - 1]);
            var end = at + token.Length;
            var afterOk = token[0] > 0x7F
                || end >= haystack.Length
                || !IsWordChar(haystack[end])
                || (haystack[end] == 's' && (end + 1 >= haystack.Length || !IsWordChar(haystack[end + 1])));
            if (beforeOk && afterOk) return at;
            from = at + 1;
        }
    }

    private static bool IsWordChar(char c) =>
        char.IsLetterOrDigit(c)
        || char.GetUnicodeCategory(c) is System.Globalization.UnicodeCategory.NonSpacingMark
            or System.Globalization.UnicodeCategory.SpacingCombiningMark;

    private static string Clip(string? value, int max)
    {
        var clean = MultiSpaceRegex().Replace(value ?? string.Empty, " ").Trim();
        clean = new string([.. clean.Where(c => !char.IsControl(c))]);
        return clean.Length <= max ? clean : clean[..max].TrimEnd();
    }

    [GeneratedRegex(@"(?:image|img|picture|चित्र|छवि)\s*[:=]\s*(.+)$", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ImagePromptRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}
