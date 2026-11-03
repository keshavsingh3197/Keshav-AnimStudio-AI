using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>One subtitle: a piece of a scene's narration and when it is on screen, in seconds from the scene's start.</summary>
public sealed record CaptionSpan(string Text, double Start, double End);

/// <summary>
/// The arithmetic of a narrated scene: how long a line takes to say, how to cut it into
/// subtitles that are comfortable to read, and where those subtitles belong against the voice.
/// </summary>
public static partial class StoryPacing
{
    /// <summary>
    /// Characters of narration spoken per second. Measured from real Hindi narration at 1.05x:
    /// scenes came out between 11 and 13, so a script's length is predicted before any audio exists.
    /// </summary>
    public const double SpeechCharsPerSecond = 11.5;

    /// <summary>The breath before a scene's first word and after its last, so scenes do not run together.</summary>
    public const double LeadSeconds = 0.45;
    public const double TailSeconds = 0.55;

    public const double MinSceneSeconds = 3.5;

    /// <summary>A subtitle wraps to two lines at the project's font size; longer than this it is split.</summary>
    public const int MaxCaptionChars = 95;

    /// <summary>How long a scene's narration takes, with the breath on either side.</summary>
    public static double EstimateSeconds(string? narration, double speechRate = 1.0)
    {
        var length = narration?.Trim().Length ?? 0;
        var rate = double.IsFinite(speechRate) && speechRate > 0 ? Math.Clamp(speechRate, 0.5, 2.0) : 1.0;
        var seconds = length / (SpeechCharsPerSecond * rate) + LeadSeconds + TailSeconds;
        return Math.Round(Math.Max(MinSceneSeconds, seconds), 2);
    }

    /// <summary>
    /// Cuts narration into subtitle-sized pieces at sentence ends, and halves anything still too long
    /// at the comma (or space) nearest its middle.
    /// </summary>
    public static IReadOnlyList<string> SplitCaptions(string? text, int maxChars = MaxCaptionChars)
    {
        var result = new List<string>();
        foreach (var sentence in Sentences(text))
            SplitLong(sentence, Math.Max(20, maxChars), result);
        return result;
    }

    private static IEnumerable<string> Sentences(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) yield break;

        var current = new StringBuilder();
        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];
            current.Append(c);

            var ends = c is '।' or '?' or '!' or '॥'
                       || (c == '.' && (i + 1 >= text.Length || char.IsWhiteSpace(text[i + 1]))
                           && (i == 0 || !char.IsDigit(text[i - 1])));
            if (!ends) continue;

            // "?!" and "..." are one ending.
            while (i + 1 < text.Length && text[i + 1] is '।' or '?' or '!' or '.' or '"' or '”' or '’')
                current.Append(text[++i]);

            var sentence = current.ToString().Trim();
            current.Clear();
            if (sentence.Length > 0) yield return sentence;
        }

        var rest = current.ToString().Trim();
        if (rest.Length > 0) yield return rest;
    }

    private static void SplitLong(string sentence, int maxChars, List<string> into)
    {
        if (sentence.Length <= maxChars)
        {
            into.Add(sentence);
            return;
        }

        var middle = sentence.Length / 2;
        var cut = Nearest(sentence, middle, BreakAfterPunctuation())
                  ?? Nearest(sentence, middle, BreakAtSpace());
        if (cut is null or <= 0 || cut >= sentence.Length)
        {
            into.Add(sentence);
            return;
        }

        SplitLong(sentence[..cut.Value].Trim(), maxChars, into);
        SplitLong(sentence[cut.Value..].Trim(), maxChars, into);
    }

    private static int? Nearest(string text, int target, Regex pattern)
    {
        int? best = null;
        foreach (Match m in pattern.Matches(text))
        {
            var at = m.Index + m.Length;
            if (at <= 8 || at >= text.Length - 8) continue;
            if (best is null || Math.Abs(at - target) < Math.Abs(best.Value - target)) best = at;
        }
        return best;
    }

    /// <summary>
    /// Times each caption against the voice. Captions are cut where the speaker actually paused,
    /// found by <paramref name="pauses"/>; where no pause is near, the cut falls in proportion to
    /// how much text came before it.
    /// </summary>
    /// <param name="chunks">The captions, in order.</param>
    /// <param name="durationSeconds">The length of the scene's audio.</param>
    /// <param name="pauses">Quiet stretches in the audio, from the scene's start. May be empty.</param>
    public static IReadOnlyList<CaptionSpan> Align(
        IReadOnlyList<string> chunks, double durationSeconds, IReadOnlyList<StoryPause>? pauses)
    {
        if (chunks.Count == 0) return [];

        var pz = (pauses ?? []).OrderBy(p => p.Start).ToList();

        // Where the speech begins and ends: after any leading silence, before any trailing one.
        var speechStart = pz.Count > 0 && pz[0].Start < 0.05 ? pz[0].End : 0.0;
        var speechEnd = pz.Count > 0 && Math.Abs(pz[^1].End - durationSeconds) < 0.1 ? pz[^1].Start : durationSeconds;
        if (speechEnd <= speechStart) (speechStart, speechEnd) = (0.0, durationSeconds);

        var first = Math.Max(0.0, speechStart - 0.1);
        var last = Math.Min(durationSeconds, speechEnd + 0.3);

        if (chunks.Count == 1) return [new CaptionSpan(chunks[0], first, last)];

        var inner = pz.Where(p => p.Start > speechStart + 0.15 && p.End < speechEnd - 0.05).ToList();
        var totalChars = Math.Max(1, chunks.Sum(c => c.Length));

        var bounds = new List<double>();
        var used = new HashSet<int>();
        var cumulative = 0;
        for (var n = 0; n < chunks.Count - 1; n++)
        {
            cumulative += chunks[n].Length;
            var expected = speechStart + (double)cumulative / totalChars * (speechEnd - speechStart);

            var best = -1;
            var bestDistance = 1.2;
            for (var i = 0; i < inner.Count; i++)
            {
                if (used.Contains(i)) continue;
                var distance = Math.Abs((inner[i].Start + inner[i].End) / 2 - expected);
                if (distance < bestDistance)
                {
                    best = i;
                    bestDistance = distance;
                }
            }

            if (best >= 0)
            {
                used.Add(best);
                bounds.Add((inner[best].Start + inner[best].End) / 2);
            }
            else
            {
                bounds.Add(expected);
            }
        }

        bounds.Sort();
        var edges = new List<double> { first };
        edges.AddRange(bounds);
        edges.Add(last);

        var spans = new List<CaptionSpan>(chunks.Count);
        for (var i = 0; i < chunks.Count; i++)
            spans.Add(new CaptionSpan(chunks[i], Math.Round(edges[i], 2), Math.Round(Math.Max(edges[i], edges[i + 1]), 2)));
        return spans;
    }

    /// <summary>
    /// Subtitles evenly spread over the scene, for a scene with no audio to time them against:
    /// each caption gets time in proportion to its length, inside the scene's lead and tail.
    /// </summary>
    public static IReadOnlyList<CaptionSpan> Spread(IReadOnlyList<string> chunks, double durationSeconds)
    {
        if (chunks.Count == 0) return [];

        var start = Math.Min(LeadSeconds, durationSeconds / 4);
        var end = Math.Max(start + 0.5, durationSeconds - TailSeconds);
        var total = Math.Max(1, chunks.Sum(c => c.Length));
        var spans = new List<CaptionSpan>(chunks.Count);
        var at = start;
        foreach (var chunk in chunks)
        {
            var next = at + (double)chunk.Length / total * (end - start);
            spans.Add(new CaptionSpan(chunk, Math.Round(at, 2), Math.Round(next, 2)));
            at = next;
        }
        return spans;
    }

    /// <summary>Digits in narration: a speech engine reads "16000" however it likes, so numbers belong in words.</summary>
    public static bool HasDigits(string? text) => !string.IsNullOrEmpty(text) && text.Any(char.IsDigit);

    /// <summary>Latin letters inside Hindi narration, which most Hindi voices pronounce badly.</summary>
    public static bool HasLatinLetters(string? text) => !string.IsNullOrEmpty(text) && text.Any(char.IsAsciiLetter);

    /// <summary>Whether narration says it is passing on a tradition rather than stating a fact: "it is believed", "मान्यता है".</summary>
    public static bool UsesHedge(string? narration) =>
        !string.IsNullOrWhiteSpace(narration) && HedgePattern().IsMatch(narration);

    /// <summary>
    /// The quiet stretches that ffmpeg's <c>silencedetect</c> filter printed, as pauses measured from the start of the
    /// audio. A silence that is still open when the audio ends is closed at <paramref name="durationSeconds"/>.
    /// </summary>
    public static IReadOnlyList<StoryPause> ParsePauses(string? log, double durationSeconds)
    {
        var pauses = new List<StoryPause>();
        if (string.IsNullOrEmpty(log)) return pauses;

        double? open = null;
        foreach (Match line in SilenceLine().Matches(log))
        {
            var value = double.Parse(line.Groups["value"].Value, System.Globalization.CultureInfo.InvariantCulture);
            if (line.Groups["kind"].Value == "start")
            {
                open = Math.Max(0, value);
                continue;
            }

            var start = open ?? 0;
            var end = Math.Min(value, durationSeconds);
            if (end > start) pauses.Add(new StoryPause { Start = Math.Round(start, 3), End = Math.Round(end, 3) });
            open = null;
        }

        if (open is { } dangling && durationSeconds > dangling)
            pauses.Add(new StoryPause { Start = Math.Round(dangling, 3), End = Math.Round(durationSeconds, 3) });
        return pauses;
    }

    [GeneratedRegex(@"silence_(?<kind>start|end):\s*(?<value>-?\d+(?:\.\d+)?)", RegexOptions.CultureInvariant)]
    private static partial Regex SilenceLine();

    [GeneratedRegex(@"मान्यता|माना जाता|मानते हैं|मानी जाती|कहा जाता|कहते हैं|कही जाती|बताया जाता|बताई जाती|परंपरा|परम्परा|लोक\s*कथा|किंवदंती|के\s+अनुसार|कथा\s+(?:है|मिलती|प्रचलित)|प्रचलित|it is believed|is said|are said|tradition|legend|according to", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HedgePattern();

    [GeneratedRegex(@"[,;:،—–]\s+|[,;:،—–](?=\S)", RegexOptions.CultureInvariant)]
    private static partial Regex BreakAfterPunctuation();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex BreakAtSpace();
}
