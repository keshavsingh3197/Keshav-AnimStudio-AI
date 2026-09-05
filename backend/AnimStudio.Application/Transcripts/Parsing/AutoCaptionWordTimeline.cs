using System.Text;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Rebuilds clean cues from YouTube auto-captions.
/// <para>
/// Auto-captions are pathological: each cue repeats the previous cue's tail and appends a
/// few new words, so a naive parse yields the transcript two or three times over. When the
/// cues carry inline per-word timestamps we can do better than de-duplicating text - we
/// build one word timeline and re-cut it on punctuation and pauses, which produces BETTER
/// timings than the original cues had.
/// </para>
/// </summary>
public static class AutoCaptionWordTimeline
{
    /// <summary>Words whose end punctuation ends a cue.</summary>
    private static bool EndsSentence(string word) =>
        word.Length > 0 && ".!?।".Contains(word[^1]);

    public static bool IsApplicable(IReadOnlyList<RawCue> cues)
    {
        if (cues.Count == 0) return false;
        var withTimestamps = cues.Count(c => InlineTagStripper.HasWordTimestamps(c.RawText));
        return withTimestamps * 100 / cues.Count > 30;
    }

    /// <summary>
    /// Detects the rolling-duplicate shape even without word timestamps, so the caller can
    /// fall back to suffix de-duplication.
    /// </summary>
    public static bool LooksRolling(IReadOnlyList<RawCue> cues)
    {
        if (cues.Count < 3) return false;

        var rolling = 0;
        var pairs = 0;
        for (var i = 1; i < cues.Count; i++)
        {
            var previous = InlineTagStripper.Clean(InlineTagStripper.StripTags(cues[i - 1].RawText));
            var current = InlineTagStripper.Clean(InlineTagStripper.StripTags(cues[i].RawText));
            if (previous.Length == 0 || current.Length == 0) continue;

            pairs++;
            if (current.StartsWith(previous, StringComparison.OrdinalIgnoreCase)) rolling++;
        }

        return pairs > 0 && rolling * 100 / pairs > 30;
    }

    public static List<RawCue> Rebuild(IReadOnlyList<RawCue> cues, int wordGapBreakMs, int maxCueChars)
    {
        // 1. One flat, de-duplicated word timeline across every cue.
        var timeline = new List<(TimeSpan At, string Word)>();
        foreach (var cue in cues)
        {
            foreach (var (at, word) in InlineTagStripper.ExtractTimedWords(cue.RawText))
            {
                // The same word/time pair repeats across overlapping cues; keep the first.
                if (timeline.Count > 0 && timeline[^1].At == at && timeline[^1].Word == word) continue;
                if (timeline.Count > 0 && at < timeline[^1].At) continue;
                timeline.Add((at, word));
            }
        }

        if (timeline.Count == 0) return [.. cues];

        // 2. Re-cut into cues on sentence punctuation or a pause between words.
        var rebuilt = new List<RawCue>();
        var builder = new StringBuilder();
        var cueStart = timeline[0].At;
        var index = 0;
        var gap = TimeSpan.FromMilliseconds(wordGapBreakMs);

        for (var i = 0; i < timeline.Count; i++)
        {
            var (at, word) = timeline[i];
            if (builder.Length > 0) builder.Append(' ');
            builder.Append(word);

            var isLast = i == timeline.Count - 1;
            var nextGapExceeded = !isLast && timeline[i + 1].At - at >= gap;
            var tooLong = builder.Length >= maxCueChars;

            if (isLast || EndsSentence(word) || nextGapExceeded || tooLong)
            {
                // End the cue at the next word's start when we know it, so cues stay contiguous.
                var end = isLast ? at + TimeSpan.FromMilliseconds(600) : timeline[i + 1].At;
                if (end <= cueStart) end = cueStart + TimeSpan.FromMilliseconds(300);

                rebuilt.Add(new RawCue(index++, cueStart, end, builder.ToString()));
                builder.Clear();
                if (!isLast) cueStart = timeline[i + 1].At;
            }
        }

        return rebuilt;
    }
}
