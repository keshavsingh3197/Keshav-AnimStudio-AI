using System.Text.RegularExpressions;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Synthesizes cue timings for a transcript that has none, using a reading-rate model.
/// <para>
/// These timings are estimates and do not correspond to any real media, so the caller marks
/// the transcript <c>Synthesized</c>, which disables audio slicing for the whole script.
/// Subtitles still work, because they only need relative positions.
/// </para>
/// </summary>
public static partial class PlainTextSegmenter
{
    [GeneratedRegex(@"(?<=[.!?।])\s+", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 1000)]
    private static partial Regex SentenceSplit();

    public static List<RawCue> Synthesize(string text, ParsingOptions options)
    {
        var units = new List<string>();

        // Prefer the author's own line breaks; fall back to sentence splitting.
        foreach (var line in text.Split('\n'))
        {
            var trimmed = InlineTagStripper.Clean(line);
            if (trimmed.Length == 0) continue;

            if (trimmed.Length <= options.MaxCueChars) { units.Add(trimmed); continue; }

            foreach (var sentence in SentenceSplit().Split(trimmed))
            {
                var s = sentence.Trim();
                if (s.Length > 0) units.Add(s);
            }
        }

        var cues = new List<RawCue>(units.Count);
        var cursor = TimeSpan.Zero;
        var perWord = TimeSpan.FromMinutes(1) / Math.Max(options.PlainTextWordsPerMinute, 1);
        var padding = TimeSpan.FromSeconds(options.PlainTextPerLinePaddingSeconds);
        var minimum = TimeSpan.FromSeconds(options.PlainTextMinSegmentSeconds);

        for (var i = 0; i < units.Count; i++)
        {
            var words = units[i].Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            var duration = perWord * words + padding;
            if (duration < minimum) duration = minimum;

            cues.Add(new RawCue(i, cursor, cursor + duration, units[i]));
            cursor += duration;
        }

        return cues;
    }
}
