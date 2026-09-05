using System.Text;

namespace AnimStudio.Infrastructure.Subtitles;

/// <summary>
/// Neutralizes dialogue text before it reaches libass.
/// <para>
/// Braces are the danger: "{...}" opens an ASS override block, so untrusted text could
/// reposition itself with "{\pos(0,0)}" or turn into vector drawing commands with
/// "{\p1}". Because subtitle text is user- and transcript-derived, it is untrusted input
/// and gets encoded for its context rather than passed through.
/// </para>
/// </summary>
internal static class AssTextSanitizer
{
    public const int MaxLength = 400;

    public static string Sanitize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var builder = new StringBuilder(text.Length);

        foreach (var ch in text)
        {
            switch (ch)
            {
                case '{':
                case '}':
                    // Drop entirely: an override block must never be constructible.
                    continue;
                case '\\':
                    // A literal backslash would begin an override tag such as \N or \h.
                    continue;
                case '\r':
                    continue;
                case '\n':
                    builder.Append("\\N");   // the ASS hard line break
                    continue;
            }

            if (char.IsControl(ch)) continue;
            // Bidi overrides can visually reorder text, including a speaker's name.
            if (ch is >= '\u202A' and <= '\u202E') continue;
            if (ch is >= '\u2066' and <= '\u2069') continue;

            builder.Append(ch);
        }

        // ASS trims surrounding whitespace anyway.
        var result = builder.ToString().Trim();

        return result.Length <= MaxLength ? result : result[..MaxLength].TrimEnd() + "…";
    }

    /// <summary>Style names may not contain a comma, which is the field separator.</summary>
    public static string SanitizeStyleName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Default";

        var cleaned = new string([.. name.Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '-')]);
        return cleaned.Length == 0 ? "Default" : cleaned;
    }
}
