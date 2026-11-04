using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Gives each character of a story a voice of their own from Gemini's voices: by gender, then by age, never the
/// narrator's, and no two alike while there are voices to go round. The same cast always gets the same voices.
/// </summary>
/// <remarks>
/// Gemini's 30 classic voices speak every language, so the same casting serves a Hindi and an English story. Each list
/// is ordered from the voice that suits that kind of character best; "Gravelly" and "Mature" read as older, "Youthful",
/// "Bright" and "Upbeat" as younger.
/// </remarks>
public static class StoryVoiceCasting
{
    private static readonly string[] MaleAdult = ["Orus", "Iapetus", "Alnilam", "Schedar", "Rasalgethi", "Umbriel", "Achird", "Algieba"];
    private static readonly string[] MaleYoung = ["Puck", "Achird", "Sadachbia", "Fenrir", "Zubenelgenubi", "Enceladus"];
    private static readonly string[] MaleElder = ["Sadaltager", "Algenib", "Rasalgethi", "Schedar", "Iapetus"];
    private static readonly string[] FemaleAdult = ["Kore", "Despina", "Sulafat", "Erinome", "Vindemiatrix", "Callirrhoe"];
    private static readonly string[] FemaleYoung = ["Leda", "Zephyr", "Autonoe", "Laomedeia", "Aoede", "Pulcherrima"];
    private static readonly string[] FemaleElder = ["Gacrux", "Achernar", "Vindemiatrix", "Sulafat"];

    private static readonly string[] Male = [.. MaleAdult.Concat(MaleYoung).Concat(MaleElder).Append("Charon").Distinct()];
    private static readonly string[] Female = [.. FemaleAdult.Concat(FemaleYoung).Concat(FemaleElder).Distinct()];

    /// <summary>A voice for each member of the cast, by name.</summary>
    public static IReadOnlyDictionary<string, string> Assign(IEnumerable<StoryCastMember> cast, string narratorVoice)
    {
        var taken = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { narratorVoice };
        var voices = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var member in cast)
        {
            if (voices.ContainsKey(member.Name)) continue;

            var preferred = Preferred(member);
            var voice = preferred.FirstOrDefault(v => !taken.Contains(v))
                // Everyone suitable is taken: the rest of the same gender, then anyone but the narrator.
                ?? (member.Gender == "female" ? Female : Male).FirstOrDefault(v => !taken.Contains(v))
                ?? preferred.First(v => !string.Equals(v, narratorVoice, StringComparison.OrdinalIgnoreCase));

            taken.Add(voice);
            voices[member.Name] = voice;
        }

        return voices;
    }

    private static string[] Preferred(StoryCastMember member) => (member.Gender, member.Age) switch
    {
        ("female", "child" or "young") => FemaleYoung,
        ("female", "elder") => FemaleElder,
        ("female", _) => FemaleAdult,
        (_, "child" or "young") => MaleYoung,
        (_, "elder") => MaleElder,
        _ => MaleAdult
    };
}
