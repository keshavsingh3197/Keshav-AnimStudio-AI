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
    FamilyClean = 4
}

/// <summary>
/// Identifies comedy/funny channels by handle, name, or category cues without touching devotional or scripture channels.
/// </summary>
public static class ComedyChannelMatcher
{
    private static readonly string[] ComedyTokens =
    [
        "keshav-anim-ff", "funny", "comedy", "meme", "memes", "roast",
        "hasya", "chutkule", "tapri", "humor", "humour", "skit", "parody"
    ];

    private static readonly string[] SeriousExclusions =
    [
        "panchang", "bhakti", "sanatan", "katha", "purana", "gita", "mantra", "aarti", "mandir"
    ];

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
