using System.Globalization;
using System.Text;
using AnimStudio.Application.Rendering.Models;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Cuts a line into runs that each draw in one face. drawtext takes one font file and has
/// no fallback, so an emoji or symbol the line's face lacks would otherwise be drawn as an
/// empty box - while the studio preview, drawn by the browser, falls back and shows it.
/// <para>
/// Each user-perceived character (a grapheme, so a skin-toned or ZWJ emoji stays whole)
/// goes to the first face that has its base character - the line's own face, then
/// <see cref="ScriptFonts.Fallbacks"/> - except that one asking for emoji presentation goes
/// to an emoji-capable fallback first. A character no face on the machine has is left out
/// rather than drawn as a box.
/// </para>
/// </summary>
internal static class FontRunSplitter
{
    private const int EmojiPresentation = 0xFE0F;
    private const int TextPresentation = 0xFE0E;
    private const int Keycap = 0x20E3;

    /// <summary>
    /// The runs of <paramref name="line"/>, or null when the whole line draws in
    /// <paramref name="primaryFont"/> as it is - the common case, which keeps its single drawtext.
    /// </summary>
    public static FontRunLine? Split(string line, string primaryFont)
    {
        if (string.IsNullOrEmpty(line) || IsPlain(line)) return null;

        var primary = FontFileMetrics.Load(primaryFont);
        if (primary is null) return null;

        var faces = new List<(string Path, FontFileMetrics Metrics)> { (primaryFont, primary) };
        foreach (var path in ScriptFonts.Fallbacks)
        {
            if (string.Equals(path, primaryFont, StringComparison.OrdinalIgnoreCase)) continue;
            if (FontFileMetrics.Load(path) is { } m) faces.Add((path, m));
        }

        var runs = new List<FontRun>();
        var text = new StringBuilder();
        var advance = 0.0;
        int? current = null;
        var dropped = false;

        void Flush()
        {
            if (current is { } face && text.Length > 0)
                runs.Add(new FontRun(text.ToString(), faces[face].Path, advance));
            text.Clear();
            advance = 0;
        }

        var graphemes = StringInfo.GetTextElementEnumerator(line);
        while (graphemes.MoveNext())
        {
            var g = graphemes.GetTextElement();
            var codePoints = CodePoints(g);
            var first = codePoints[0];

            int? face;
            if (char.IsWhiteSpace(g, 0) && current is { } open && faces[open].Metrics.Has(first))
            {
                // Spaces stay with the run they are in, so a sentence is not cut at every word.
                face = open;
            }
            else
            {
                face = Choose(faces, codePoints);
            }

            if (face is null)
            {
                dropped = true;
                continue;
            }

            if (face != current)
            {
                Flush();
                current = face;
            }

            text.Append(g);
            advance += Width(faces[face.Value].Metrics, codePoints, emoji: face != 0 && WantsEmoji(codePoints));
        }
        Flush();

        if (runs.Count == 0) return null;
        if (!dropped && runs.Count == 1 && runs[0].FontFilePath == primaryFont) return null;

        return new FontRunLine(runs, primary.Ascent, primary.Descent);
    }

    /// <summary>Text no face can be missing: Latin, digits and punctuation below U+0250, nothing combined.</summary>
    private static bool IsPlain(string line)
    {
        foreach (var c in line)
        {
            if (c >= 0x0250) return false;
        }
        return true;
    }

    private static int? Choose(List<(string Path, FontFileMetrics Metrics)> faces, int[] codePoints)
    {
        var first = codePoints[0];

        if (WantsEmoji(codePoints))
        {
            // The emoji face's glyph, not the text face's monochrome dingbat of the same character.
            for (var i = 1; i < faces.Count; i++)
            {
                if (faces[i].Metrics.Has(first) && IsEmojiFace(faces[i].Path)) return i;
            }
        }

        for (var i = 0; i < faces.Count; i++)
        {
            if (faces[i].Metrics.Has(first)) return i;
        }
        return null;
    }

    private static bool IsEmojiFace(string path) =>
        path.Contains("emj", StringComparison.OrdinalIgnoreCase) || path.Contains("Emoji", StringComparison.OrdinalIgnoreCase);

    /// <summary>Whether a grapheme reads as an emoji: a pictograph, or a character asking for emoji style.</summary>
    private static bool WantsEmoji(int[] codePoints)
    {
        var first = codePoints[0];
        if (Array.IndexOf(codePoints, TextPresentation) >= 0) return false;
        if (Array.IndexOf(codePoints, EmojiPresentation) >= 0 || Array.IndexOf(codePoints, Keycap) >= 0) return true;
        return first is >= 0x1F000 and <= 0x1FAFF;
    }

    /// <summary>
    /// The grapheme's advance. An emoji sequence (skin tone, ZWJ family, flag) is one glyph
    /// in an emoji face, so only its first character counts; anything else sums its parts,
    /// combining marks having no advance of their own.
    /// </summary>
    private static double Width(FontFileMetrics metrics, int[] codePoints, bool emoji)
    {
        if (emoji) return metrics.Advance(codePoints[0]);

        var sum = 0.0;
        foreach (var cp in codePoints) sum += metrics.Advance(cp);
        return sum;
    }

    /// <summary>A lone surrogate reads as U+FFFD rather than throwing.</summary>
    private static int[] CodePoints(string grapheme) => [.. grapheme.EnumerateRunes().Select(r => r.Value)];
}
