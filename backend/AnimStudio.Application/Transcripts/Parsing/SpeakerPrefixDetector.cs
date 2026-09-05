using System.Text.RegularExpressions;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Recognizes "NAME: dialogue" speaker prefixes and lifts them out of the cue text.
/// <para>
/// This is the second detection tier, after WebVTT <c>&lt;v&gt;</c> tags. It matters most for
/// pasted transcripts, which carry no markup at all and are the default source - without
/// it, every line in a pasted script has no speaker, so the whole transcript collapses into
/// one segment and no character can be cast.
/// </para>
/// <para>
/// The risk is a false positive turning ordinary text into a speaker ("Note: this is fine").
/// Guarded two ways: the candidate must look like a name, and the transcript as a whole must
/// show the convention - either some name recurs, or most lines carry a prefix - before any
/// prefix is honoured.
/// </para>
/// </summary>
public static partial class SpeakerPrefixDetector
{
    /// <summary>
    /// A leading capitalized name of at most three words, then a colon. Digits and URLs are
    /// excluded so that timestamps and "https:" cannot match.
    /// </summary>
    [GeneratedRegex(@"^\s*(?<name>\p{Lu}[\p{L}.\-']*(?:[ ]\p{L}[\p{L}.\-']*){0,2})\s*:\s+(?<rest>\S.*)$",
        RegexOptions.CultureInvariant | RegexOptions.Singleline, matchTimeoutMilliseconds: 1000)]
    private static partial Regex PrefixPattern();

    /// <summary>
    /// Words that commonly precede a colon in prose or metadata and are never speakers.
    /// An allowlist is not possible here - speaker names are arbitrary - so this denies the
    /// known offenders and the shape check does the rest.
    /// </summary>
    private static readonly string[] NonSpeakerPrefixes =
    [
        "note", "warning", "caution", "transcript", "http", "https", "www", "source",
        "chapter", "part", "section", "example", "summary", "update", "edit", "tip",
        "am", "pm", "subject", "from", "to", "cc", "re", "date", "title", "description"
    ];

    /// <summary>Minimum times one name must recur before the convention is accepted.</summary>
    private const int MinRecurrence = 2;

    /// <summary>Or this share of cues must carry a well-formed prefix.</summary>
    private const double MinPrefixedShare = 0.5;

    /// <summary>
    /// Applies prefix detection across the whole cue list, returning cues whose speaker has
    /// been lifted out of the text. Cues that already have a speaker are left untouched,
    /// because a structural voice tag always outranks an inferred prefix.
    /// </summary>
    public static List<RawCue> Apply(IReadOnlyList<RawCue> cues)
    {
        if (cues.Count == 0) return [.. cues];

        var candidates = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var prefixed = 0;

        foreach (var cue in cues)
        {
            if (cue.Speaker is not null) continue;

            var name = TryReadName(cue.RawText);
            if (name is null) continue;

            prefixed++;
            candidates[name] = candidates.TryGetValue(name, out var count) ? count + 1 : 1;
        }

        if (candidates.Count == 0) return [.. cues];

        // Either a name repeats, or most lines are prefixed. Once the convention is
        // established for the document, a name that appears only once is still a real
        // speaker - which is common in short dialogue.
        var recurs = candidates.Values.Any(count => count >= MinRecurrence);
        var mostlyPrefixed = (double)prefixed / cues.Count >= MinPrefixedShare;

        if (!recurs && !mostlyPrefixed) return [.. cues];

        var result = new List<RawCue>(cues.Count);

        foreach (var cue in cues)
        {
            if (cue.Speaker is not null) { result.Add(cue); continue; }

            var match = PrefixPattern().Match(cue.RawText);
            if (!match.Success || !IsPlausibleName(match.Groups["name"].Value))
            {
                result.Add(cue);
                continue;
            }

            result.Add(cue with
            {
                Speaker = match.Groups["name"].Value.Trim(),
                RawText = match.Groups["rest"].Value
            });
        }

        return result;
    }

    private static string? TryReadName(string text)
    {
        var match = PrefixPattern().Match(text);
        if (!match.Success) return null;

        var name = match.Groups["name"].Value.Trim();
        return IsPlausibleName(name) ? name : null;
    }

    private static bool IsPlausibleName(string name)
    {
        if (name.Length is < 2 or > 32) return false;
        if (name.Any(char.IsDigit)) return false;

        // Compared on the first word too, so "Note to self:" is rejected like "Note:".
        var firstWord = name.Split(' ')[0].TrimEnd('.', '-', '\'');

        return !Array.Exists(NonSpeakerPrefixes, p =>
                   string.Equals(p, name, StringComparison.OrdinalIgnoreCase)
                   || string.Equals(p, firstWord, StringComparison.OrdinalIgnoreCase));
    }
}
