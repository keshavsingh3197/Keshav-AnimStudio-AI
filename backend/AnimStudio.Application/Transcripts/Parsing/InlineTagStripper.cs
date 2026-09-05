using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Cleans cue payload text: pulls out speaker voice tags, removes markup, then decodes
/// entities. The ORDER of those steps is load-bearing and documented on each method.
/// </summary>
public static partial class InlineTagStripper
{
    // Non-backtracking with a timeout: cue text is untrusted input, so the regex must not
    // be a denial-of-service vector.
    [GeneratedRegex(@"<[^>]*>", RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
        matchTimeoutMilliseconds: 1000)]
    private static partial Regex AnyTag();

    [GeneratedRegex(@"^\s*<v(?<classes>(?:\.[^\s.>]+)*)\s+(?<name>[^>]*)>",
        RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 1000)]
    private static partial Regex VoiceTag();

    [GeneratedRegex(@"<(?<ts>\d{1,3}:\d{2}:\d{2}[.,]\d{1,3})>",
        RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 1000)]
    private static partial Regex WordTimestamp();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
        matchTimeoutMilliseconds: 1000)]
    private static partial Regex WhitespaceRun();

    /// <summary>
    /// Extracts a WebVTT "&lt;v Name&gt;" speaker. MUST run BEFORE <see cref="StripTags"/>,
    /// which would otherwise delete the tag and the speaker's name with it.
    /// </summary>
    public static string? ExtractVoiceSpeaker(string text)
    {
        var match = VoiceTag().Match(text);
        if (!match.Success) return null;

        var name = match.Groups["name"].Value.Trim();
        return name.Length == 0 ? null : name;
    }

    public static bool HasWordTimestamps(string text) => WordTimestamp().IsMatch(text);

    public static IEnumerable<(TimeSpan At, string Word)> ExtractTimedWords(string text)
    {
        // YouTube auto-captions interleave "<00:00:01.234>word" pairs. Each timestamp
        // applies to the text that follows it, up to the next timestamp.
        var matches = WordTimestamp().Matches(text);
        for (var i = 0; i < matches.Count; i++)
        {
            var match = matches[i];
            if (!TimecodeParser.TryParse(match.Groups["ts"].Value, out var at)) continue;

            var from = match.Index + match.Length;
            var to = i + 1 < matches.Count ? matches[i + 1].Index : text.Length;
            if (to <= from) continue;

            var word = Clean(StripTags(text[from..to]));
            if (word.Length > 0) yield return (at, word);
        }
    }

    /// <summary>Removes all markup: styling, ruby, karaoke timestamps, ASS overrides.</summary>
    public static string StripTags(string text)
    {
        var stripped = AnyTag().Replace(text, string.Empty);
        // ASS override blocks, in case a .ass file was fed through the SRT/VTT path.
        return stripped.Replace("{\\", "{").Replace("{", string.Empty).Replace("}", string.Empty);
    }

    /// <summary>
    /// Decodes entities and normalizes whitespace. MUST run AFTER <see cref="StripTags"/>:
    /// decoding first would turn "&amp;lt;i&amp;gt;" into a real tag that then gets eaten.
    /// </summary>
    public static string Clean(string text)
    {
        var decoded = WebUtility.HtmlDecode(text);

        var builder = new StringBuilder(decoded.Length);
        foreach (var ch in decoded)
        {
            // Strip C0 controls (keeping nothing - newlines are handled by the caller) and
            // bidi overrides, which can be used to spoof a speaker name in the UI.
            if (char.IsControl(ch) && ch != '\n' && ch != '\t') continue;
            if (ch is >= '\u202A' and <= '\u202E') continue;
            if (ch is >= '\u2066' and <= '\u2069') continue;
            builder.Append(ch);
        }

        var collapsed = WhitespaceRun().Replace(builder.ToString(), " ").Trim();
        return collapsed.Normalize(NormalizationForm.FormC);
    }
}
