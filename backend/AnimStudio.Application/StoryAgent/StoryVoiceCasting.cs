using System.Text.RegularExpressions;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Gives each character of a story a voice of their own from the speech engine's voices: in the story's language, by
/// gender, then by age, never the narrator's, and no two alike while there are voices to go round. The same cast always
/// gets the same voices.
/// </summary>
/// <remarks>
/// <para>
/// Gemini's 30 classic voices speak every language, so the same casting serves a Hindi and an English story. Kokoro's
/// voices each speak one language, named by the first letter of the voice (<c>h</c> Hindi, <c>a</c>/<c>b</c> American
/// and British English...), and the second letter is the gender; a character only gets a voice that speaks the story's
/// language. OpenAI's voices speak any language.
/// </para>
/// <para>
/// Each list is ordered from the voice that suits that kind of character best. An engine whose voices this does not know
/// (a Piper model, a designed voice) gets no cast, and the narrator reads every line.
/// </para>
/// </remarks>
public static partial class StoryVoiceCasting
{
    private sealed record Pools(
        string[] MaleAdult, string[] MaleYoung, string[] MaleElder,
        string[] FemaleAdult, string[] FemaleYoung, string[] FemaleElder)
    {
        public string[] Male => [.. MaleAdult.Concat(MaleYoung).Concat(MaleElder).Distinct()];
        public string[] Female => [.. FemaleAdult.Concat(FemaleYoung).Concat(FemaleElder).Distinct()];
        public bool IsEmpty => Male.Length == 0 && Female.Length == 0;
    }

    private static readonly Pools Gemini = new(
        MaleAdult: ["Orus", "Iapetus", "Alnilam", "Schedar", "Rasalgethi", "Umbriel", "Achird", "Algieba", "Charon"],
        MaleYoung: ["Puck", "Achird", "Sadachbia", "Fenrir", "Zubenelgenubi", "Enceladus"],
        MaleElder: ["Sadaltager", "Algenib", "Rasalgethi", "Schedar", "Iapetus"],
        FemaleAdult: ["Kore", "Despina", "Sulafat", "Erinome", "Vindemiatrix", "Callirrhoe"],
        FemaleYoung: ["Leda", "Zephyr", "Autonoe", "Laomedeia", "Aoede", "Pulcherrima"],
        FemaleElder: ["Gacrux", "Achernar", "Vindemiatrix", "Sulafat"]);

    private static readonly Pools OpenAi = new(
        MaleAdult: ["onyx", "ash", "echo", "verse", "ballad"],
        MaleYoung: ["echo", "verse", "ash"],
        MaleElder: ["onyx", "fable", "ballad"],
        FemaleAdult: ["nova", "coral", "sage", "shimmer"],
        FemaleYoung: ["shimmer", "coral", "nova"],
        FemaleElder: ["sage", "alloy"]);

    /// <summary>Kokoro v1's voices, best first within each language and gender.</summary>
    private static readonly string[] Kokoro =
    [
        "hf_alpha", "hf_beta", "hm_omega", "hm_psi",
        "af_heart", "af_bella", "af_nicole", "af_sarah", "af_aoede", "af_kore", "af_jessica", "af_sky", "af_nova", "af_river", "af_alloy",
        "am_michael", "am_adam", "am_eric", "am_liam", "am_fenrir", "am_puck", "am_echo", "am_onyx", "am_santa",
        "bf_emma", "bf_isabella", "bf_alice", "bf_lily", "bm_george", "bm_daniel", "bm_lewis", "bm_fable",
        "ef_dora", "em_alex", "em_santa", "ff_siwis", "if_sara", "im_nicola",
        "jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo",
        "pf_dora", "pm_alex", "pm_santa",
        "zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi", "zm_yunjian", "zm_yunxi", "zm_yunxia", "zm_yunyang"
    ];

    private static readonly HashSet<string> KokoroYoung = new(StringComparer.Ordinal)
        { "af_sky", "af_nova", "af_jessica", "af_river", "am_puck", "am_liam", "am_echo", "bf_lily", "bf_alice", "hf_beta", "hm_psi" };

    private static readonly HashSet<string> KokoroElder = new(StringComparer.Ordinal)
        { "am_santa", "am_onyx", "bm_george", "bm_fable", "bf_isabella", "em_santa", "pm_santa", "hm_omega" };

    /// <summary>Kokoro's language letter for a story language; English has two.</summary>
    private static readonly Dictionary<string, string> KokoroLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        ["hi"] = "h", ["en"] = "ab", ["es"] = "e", ["fr"] = "f", ["it"] = "i", ["ja"] = "j", ["pt"] = "p", ["zh"] = "z"
    };

    [GeneratedRegex("^([abefhijpz])([fm])_[a-z0-9]+$", RegexOptions.CultureInvariant)]
    private static partial Regex KokoroVoice();

    /// <summary>A voice for each member of the cast, by name, from Gemini's voices.</summary>
    public static IReadOnlyDictionary<string, string> Assign(IEnumerable<StoryCastMember> cast, string narratorVoice) =>
        Assign(cast, narratorVoice, KnownAiProviders.GeminiTts, null) ?? new Dictionary<string, string>();

    /// <summary>
    /// A voice for each member of the cast, by name, from <paramref name="engine"/>'s voices that speak
    /// <paramref name="language"/>; null when this engine's voices are not known here.
    /// </summary>
    public static IReadOnlyDictionary<string, string>? Assign(
        IEnumerable<StoryCastMember> cast, string narratorVoice, string? engine, string? language)
    {
        if (PoolsFor(narratorVoice, engine, language) is not { IsEmpty: false } pools) return null;

        var taken = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { narratorVoice };
        var voices = new Dictionary<string, string>(StringComparer.Ordinal);
        var all = pools.Male.Concat(pools.Female).ToArray();

        foreach (var member in cast)
        {
            if (voices.ContainsKey(member.Name)) continue;

            var preferred = Preferred(pools, member);
            var sameGender = member.Gender == "female" ? pools.Female : pools.Male;
            if (sameGender.Length == 0) sameGender = all;

            var voice = preferred.FirstOrDefault(v => !taken.Contains(v))
                // Everyone suitable is taken: the rest of the same gender, then share a voice - never the narrator's.
                ?? sameGender.FirstOrDefault(v => !taken.Contains(v))
                ?? Share(sameGender, voices, narratorVoice)
                ?? Share(all, voices, narratorVoice);
            if (voice is null) continue;

            taken.Add(voice);
            voices[member.Name] = voice;
        }

        return voices;
    }

    /// <summary>The voice of the list given to the fewest characters so far, so a small language's voices take turns.</summary>
    private static string? Share(string[] list, Dictionary<string, string> given, string narratorVoice) =>
        list.Where(v => !string.Equals(v, narratorVoice, StringComparison.OrdinalIgnoreCase))
            .OrderBy(v => given.Values.Count(g => string.Equals(g, v, StringComparison.OrdinalIgnoreCase)))
            .FirstOrDefault();

    private static Pools? PoolsFor(string narratorVoice, string? engine, string? language)
    {
        var family = engine is null ? null : KnownAiProviders.Find(engine)?.Family;
        if (family == AiProviderFamily.GeminiSpeech || (engine is null && Gemini.Male.Concat(Gemini.Female).Contains(narratorVoice, StringComparer.OrdinalIgnoreCase)))
            return Gemini;

        if (KokoroVoice().Match(narratorVoice) is { Success: true } narrator)
            return KokoroPools(language is not null && KokoroLanguages.TryGetValue(language, out var letters)
                // English keeps to the narrator's accent first, then the other one.
                ? letters.Contains(narrator.Groups[1].Value, StringComparison.Ordinal)
                    ? narrator.Groups[1].Value + letters.Replace(narrator.Groups[1].Value, string.Empty, StringComparison.Ordinal)
                    : letters
                : narrator.Groups[1].Value);

        if (OpenAi.Male.Concat(OpenAi.Female).Contains(narratorVoice, StringComparer.OrdinalIgnoreCase))
            return OpenAi;

        return null;
    }

    private static Pools KokoroPools(string letters)
    {
        var voices = Kokoro
            .Select(v => (Voice: v, Match: KokoroVoice().Match(v)))
            .Where(t => letters.Contains(t.Match.Groups[1].Value, StringComparison.Ordinal))
            .OrderBy(t => letters.IndexOf(t.Match.Groups[1].Value, StringComparison.Ordinal))
            .ToList();

        string[] Of(string gender, Func<string, bool> age) =>
            [.. voices.Where(t => t.Match.Groups[2].Value == gender && age(t.Voice)).Select(t => t.Voice)];

        var male = Of("m", _ => true);
        var female = Of("f", _ => true);
        return new Pools(
            MaleAdult: Of("m", v => !KokoroYoung.Contains(v) && !KokoroElder.Contains(v)) is { Length: > 0 } ma ? ma : male,
            MaleYoung: Of("m", KokoroYoung.Contains) is { Length: > 0 } my ? my : male,
            MaleElder: Of("m", KokoroElder.Contains) is { Length: > 0 } me ? me : male,
            FemaleAdult: Of("f", v => !KokoroYoung.Contains(v) && !KokoroElder.Contains(v)) is { Length: > 0 } fa ? fa : female,
            FemaleYoung: Of("f", KokoroYoung.Contains) is { Length: > 0 } fy ? fy : female,
            FemaleElder: Of("f", KokoroElder.Contains) is { Length: > 0 } fe ? fe : female);
    }

    private static string[] Preferred(Pools pools, StoryCastMember member) => (member.Gender, member.Age) switch
    {
        ("female", "child" or "young") => pools.FemaleYoung,
        ("female", "elder") => pools.FemaleElder,
        ("female", _) => pools.FemaleAdult,
        (_, "child" or "young") => pools.MaleYoung,
        (_, "elder") => pools.MaleElder,
        _ => pools.MaleAdult
    };
}
