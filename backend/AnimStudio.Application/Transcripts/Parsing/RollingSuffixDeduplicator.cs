namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Fallback de-duplication for rolling auto-captions that carry no per-word timestamps.
/// <para>
/// Keeps a running tail of what has already been emitted; for each new cue it finds the
/// longest word-boundary-aligned suffix of that tail which prefixes the cue, and emits only
/// the remainder. Boundary alignment matters: matching on raw characters chops words in half
/// whenever the recognizer re-spells one.
/// </para>
/// </summary>
public static class RollingSuffixDeduplicator
{
    public static List<RawCue> Deduplicate(IReadOnlyList<RawCue> cues)
    {
        var result = new List<RawCue>(cues.Count);
        var emittedWords = new List<string>();

        foreach (var cue in cues)
        {
            var text = InlineTagStripper.Clean(InlineTagStripper.StripTags(cue.RawText));
            if (text.Length == 0) continue;

            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var overlap = LongestOverlap(emittedWords, words);
            var remainder = words.Skip(overlap).ToArray();

            if (remainder.Length == 0) continue;

            result.Add(cue with { RawText = string.Join(' ', remainder) });
            emittedWords.AddRange(remainder);

            // Only the recent tail can overlap; keep the window bounded.
            if (emittedWords.Count > 64) emittedWords.RemoveRange(0, emittedWords.Count - 64);
        }

        // Re-index so downstream sees a dense sequence.
        for (var i = 0; i < result.Count; i++) result[i] = result[i] with { SourceIndex = i };
        return result;
    }

    /// <summary>
    /// Length of the longest prefix of <paramref name="candidate"/> that is also a suffix of
    /// <paramref name="emitted"/>, compared word by word.
    /// </summary>
    private static int LongestOverlap(List<string> emitted, string[] candidate)
    {
        var max = Math.Min(emitted.Count, candidate.Length);
        for (var length = max; length > 0; length--)
        {
            var matches = true;
            for (var i = 0; i < length; i++)
            {
                if (!string.Equals(emitted[emitted.Count - length + i], candidate[i],
                        StringComparison.OrdinalIgnoreCase))
                {
                    matches = false;
                    break;
                }
            }

            if (matches) return length;
        }

        return 0;
    }
}
