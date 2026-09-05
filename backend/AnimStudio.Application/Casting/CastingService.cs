using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Scripts;

namespace AnimStudio.Application.Casting;

public enum MappingConfidence { High = 0, Medium = 1, Low = 2 }

public sealed record SpeakerSuggestion(
    string SpeakerKey, string DisplayLabel, string? CharacterId, MappingConfidence Confidence,
    int LineCount);

/// <summary>
/// Maps transcript speakers onto the project's own characters.
/// <para>
/// Pure matching logic. Unresolved speakers deliberately fall back to a narrator instead of
/// blocking generation: making the user finish casting before they can see anything would
/// break the paste-a-transcript-and-watch-it-work flow, which is the one that has to feel
/// effortless. The unresolved list is returned so the UI can prompt for the rest.
/// </para>
/// </summary>
public static class CastingService
{
    /// <summary>Labels that mean "no particular character is speaking".</summary>
    private static readonly string[] NarratorLabels =
    [
        "narrator", "voiceover", "voice over", "vo", "v o", "announcer", "speaker",
        "male", "female", "man", "woman"
    ];

    public static IReadOnlyList<SpeakerSuggestion> Suggest(
        Script script, IReadOnlyList<Character> characters)
    {
        var byKey = new Dictionary<string, (string Label, int Lines)>(StringComparer.Ordinal);

        foreach (var segment in script.Segments)
        {
            foreach (var line in segment.Lines)
            {
                var key = line.SpeakerKey;
                if (string.IsNullOrEmpty(key)) continue;

                if (byKey.TryGetValue(key, out var existing))
                    byKey[key] = (existing.Label, existing.Lines + 1);
                else
                    byKey[key] = (line.SpeakerLabel ?? key, 1);
            }
        }

        var suggestions = new List<SpeakerSuggestion>(byKey.Count);

        foreach (var (key, (label, lines)) in byKey.OrderByDescending(p => p.Value.Lines))
        {
            var (characterId, confidence) = Match(key, characters);
            suggestions.Add(new SpeakerSuggestion(key, label, characterId, confidence, lines));
        }

        return suggestions;
    }

    private static (string? CharacterId, MappingConfidence Confidence) Match(
        string speakerKey, IReadOnlyList<Character> characters)
    {
        // 1. Exact name match.
        foreach (var character in characters)
        {
            if (string.Equals(SpeakerKey.Normalize(character.Name), speakerKey, StringComparison.Ordinal))
                return (character.Id, MappingConfidence.High);
        }

        // 2. A declared alias - nicknames, full names, transliterations.
        foreach (var character in characters)
        {
            foreach (var alias in character.Aliases)
            {
                if (string.Equals(SpeakerKey.Normalize(alias), speakerKey, StringComparison.Ordinal))
                    return (character.Id, MappingConfidence.High);
            }
        }

        // 3. A generic narration label maps to the narrator character.
        if (Array.Exists(NarratorLabels, l => string.Equals(l, speakerKey, StringComparison.Ordinal)))
        {
            var narrator = characters.FirstOrDefault(c => c.IsNarrator);
            return narrator is null ? (null, MappingConfidence.High) : (narrator.Id, MappingConfidence.High);
        }

        // 4. Token subset: "Rahul Sharma" contains "Rahul". Needs human confirmation.
        var speakerTokens = speakerKey.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        foreach (var character in characters)
        {
            var nameTokens = SpeakerKey.Normalize(character.Name)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (nameTokens.Length == 0 || speakerTokens.Length == 0) continue;

            var shared = nameTokens.Intersect(speakerTokens, StringComparer.Ordinal).Count();
            if (shared > 0) return (character.Id, MappingConfidence.Medium);
        }

        return (null, MappingConfidence.Low);
    }

    /// <summary>
    /// The narrator every project needs so that a line with no identified speaker still
    /// renders as a subtitle rather than being silently dropped.
    /// </summary>
    public static Character CreateNarrator(string projectId, DateTime now) => new()
    {
        ProjectId = projectId,
        Name = "Narrator",
        IsNarrator = true,
        IsAutoCreated = true,
        CreatedAt = now,
        UpdatedAt = now
    };
}
