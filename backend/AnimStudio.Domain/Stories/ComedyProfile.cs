using System.Text.Json.Serialization;

namespace AnimStudio.Domain.Stories;

/// <summary>
/// Spoken comedy voice and structure preset for funny channels, story runs, and automation pipelines.
/// Kept strictly scoped to comedy contexts so devotional and informational channels remain reverent.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ComedyToneStyle
{
    /// <summary>YouTube comedy auto: Hindi combines Khadi Bhasha + Tu-Tadak buddy banter; English uses punchy roast/twist.</summary>
    Auto = 0,

    /// <summary>Desi Khadi Bhasha / North Indian street-tapri &amp; Haryana-UP colloquial flavour ("इब के करैगो", "अरे बावले", "टैम").</summary>
    KhadiBhasha = 1,

    /// <summary>Casual unfiltered friend banter ("अबे सुन", "तू रहने दे", "तेरे से ना हो पाएगा") — playful, never abusive or slurs.</summary>
    TuTadak = 2,

    /// <summary>Dry deadpan setup with sharp roast comebacks and a surprise twist ending.</summary>
    RoastAndTwist = 3,

    /// <summary>Warm, clean situational slapstick suitable for kids and family audiences without rough banter.</summary>
    FamilyClean = 4,

    /// <summary>Zero-dialogue / minimal-text international physical slapstick, doorway peek-a-boo loops &amp; cartoon SFX comedy.</summary>
    GlobalSlapstick = 5,

    /// <summary>Expressive 3D cartoon tank battles &amp; cannon recoil gag series (| EP XX) inspired by viral global tank animations.</summary>
    TankSeries = 6,

    /// <summary>MJO / HardToonz style Hindi Khadi-Bhasha dialogue sitcom (| EP XX) with close-up smash cuts &amp; bulging-eye shock hooks.</summary>
    DesiKhadiSitcom = 7,

    /// <summary>International Honey Badger character comedy: fearless, unbothered attitude, emotional reaction beats &amp; viral meme cutaways.</summary>
    HoneyBadgerInternational = 8
}

/// <summary>
/// Identifies comedy/funny channels by handle, name, or category cues without touching devotional or scripture channels.
/// </summary>
public static class ComedyChannelMatcher
{
    private static readonly string[] ComedyTokens =
    [
        "keshav-anim-ff", "ploptoonz", "gigglebot", "kaleshadda", "gappatoonz", "zanyloop", "kookitoonz",
        "funny", "comedy", "meme", "memes", "roast", "slapstick", "toonz",
        "hasya", "chutkule", "tapri", "humor", "humour", "skit", "parody"
    ];

    private static readonly string[] InternationalTokens =
    [
        "keshav-anim-ff", "ploptoonz", "gigglebot", "zanyloop", "kookitoonz", "global", "world", "slapstick", "tank", "toonz"
    ];

    public static bool IsInternationalComedyHint(params string?[] candidates) =>
        candidates.Any(c => !string.IsNullOrWhiteSpace(c)
            && !SeriousExclusions.Any(c.ToLowerInvariant().Contains)
            && InternationalTokens.Any(c.ToLowerInvariant().Contains));

    private static readonly string[] SeriousExclusions =
    [
        "panchang", "bhakti", "sanatan", "katha", "purana", "gita", "mantra", "aarti", "mandir", "devotional", "shiv", "krishna", "ram"
    ];

    public static bool IsDevotionalOrSeriousChannelHint(params string?[] candidates) =>
        candidates.Any(c => !string.IsNullOrWhiteSpace(c)
            && SeriousExclusions.Any(c.Trim().ToLowerInvariant().Contains));

    /// <summary>
    /// Selects the highest-priority channel for Comedy workflows: explicit BrandChannel comedy flag first,
    /// then comedy handle/title matches, then general entertainment/creator channels (never falling back
    /// onto devotional/Panchang channels when a non-devotional channel is available).
    /// </summary>
    public static T? PickBestComedyChannel<T>(
        IEnumerable<T> items,
        Func<T, (string? Handle, string? Title, bool IsExplicitComedy)> selector,
        bool international)
    {
        var list = items.ToList();
        if (list.Count == 0) return default;

        return list
            .Select(item =>
            {
                var (handle, title, isExplicit) = selector(item);
                var isSerious = IsDevotionalOrSeriousChannelHint(handle, title);
                var isIntlHint = IsInternationalComedyHint(handle, title);
                var isComedyHint = IsComedyChannelHint(handle, title);
                var matchesTrack = international ? isIntlHint : isComedyHint && !isIntlHint;
                var score =
                    (isExplicit ? 100 : 0)
                    + (matchesTrack ? 60 : isComedyHint ? 40 : 0)
                    + (!isSerious ? 20 : -50);
                return (Item: item, Score: score);
            })
            .OrderByDescending(x => x.Score)
            .First()
            .Item;
    }

    public static ComedyToneStyle ParseTone(string? raw, ComedyToneStyle fallback = ComedyToneStyle.Auto)
    {
        if (string.IsNullOrWhiteSpace(raw)) return fallback;
        var clean = raw.Trim().Replace("-", string.Empty).Replace("_", string.Empty).Replace(" ", string.Empty);
        return clean.ToLowerInvariant() switch
        {
            "auto" => ComedyToneStyle.Auto,
            "khadibhasha" or "khadiboli" or "khadi" or "desi" => ComedyToneStyle.KhadiBhasha,
            "tutadak" or "tutadaak" or "banter" or "dosti" => ComedyToneStyle.TuTadak,
            "roastandtwist" or "roasttwist" or "roast" or "deadpan" => ComedyToneStyle.RoastAndTwist,
            "familyclean" or "clean" or "family" => ComedyToneStyle.FamilyClean,
            "globalslapstick" or "slapstick" or "brainrot" or "loop" => ComedyToneStyle.GlobalSlapstick,
            "tankseries" or "tanks" or "tank" => ComedyToneStyle.TankSeries,
            "desikhadisitcom" or "sitcom" or "mjo" => ComedyToneStyle.DesiKhadiSitcom,
            _ => fallback
        };
    }

    public static bool IsComedyChannelHint(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (string.IsNullOrWhiteSpace(candidate)) continue;
            var lower = candidate.Trim().ToLowerInvariant();
            if (SeriousExclusions.Any(lower.Contains))
                continue;
            if (ComedyTokens.Any(lower.Contains))
                return true;
        }
        return false;
    }

    public static ComedyToneStyle ResolveEffectiveTone(ComedyToneStyle requested, bool isHindi) =>
        requested switch
        {
            ComedyToneStyle.Auto => isHindi ? ComedyToneStyle.TuTadak : ComedyToneStyle.RoastAndTwist,
            _ => requested
        };
}
