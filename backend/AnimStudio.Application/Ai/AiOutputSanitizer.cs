using System.Text;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Cleans model output before it reaches somewhere it could do damage.
/// </summary>
/// <remarks>
/// <para>
/// Model output is untrusted input. It is shaped by a transcript this application did not
/// write, and a transcript can contain instructions. Schema validation
/// (<see cref="JsonShapeValidator"/>) proves the response has the right shape; this proves
/// the values inside it are safe for the specific place they are going.
/// </para>
/// <para>
/// Allowlists, never denylists. A character not known to be safe is removed, so a sink
/// nobody thought about is still protected by default.
/// </para>
/// </remarks>
public static class AiOutputSanitizer
{
    /// <summary>
    /// A value that will become part of a filename, a storage key or a process argument.
    /// Letters, digits, spaces, hyphens and underscores survive; everything else is dropped.
    /// <para>
    /// This is the function that stands between a model writing
    /// <c>"../../../etc/passwd"</c> as a character name and that string reaching a path.
    /// </para>
    /// </summary>
    public static string? ToSafeName(string? value, int maxLength = 64)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var builder = new StringBuilder(Math.Min(value.Length, maxLength));
        var lastWasSpace = false;

        foreach (var c in value)
        {
            if (builder.Length >= maxLength) break;

            // Marks are kept alongside letters because a Devanagari vowel sign is not a
            // letter: without them "राहुल" would be silently mangled into "रहल".
            // Space is deliberately NOT here - it falls through to the collapsing branch.
            var keep = char.IsAsciiLetterOrDigit(c) || c is '-' or '_'
                       || (!char.IsControl(c)
                           && (char.IsLetterOrDigit(c)
                               || char.GetUnicodeCategory(c)
                                   is System.Globalization.UnicodeCategory.NonSpacingMark
                                   or System.Globalization.UnicodeCategory.SpacingCombiningMark
                                   or System.Globalization.UnicodeCategory.EnclosingMark));

            if (keep)
            {
                builder.Append(c);
                lastWasSpace = false;
                continue;
            }

            // Any run of removed characters collapses to a single space, so "a/b" becomes
            // "a b" rather than the far more surprising "ab".
            if (!lastWasSpace && builder.Length > 0)
            {
                builder.Append(' ');
                lastWasSpace = true;
            }
        }

        var result = builder.ToString().Trim();
        return result.Length == 0 ? null : result;
    }

    /// <summary>
    /// Prose that will be shown to a person or stored as a description. Newlines and tabs
    /// survive because they are meaningful in dialogue; every other control character does
    /// not, because they are invisible and are how a value hides what it really says.
    /// </summary>
    public static string? ToSafeText(string? value, int maxLength = 4000)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var builder = new StringBuilder(Math.Min(value.Length, maxLength));

        foreach (var c in value)
        {
            if (builder.Length >= maxLength) break;

            if (c is '\n' or '\t' || !char.IsControl(c))
                builder.Append(c);
        }

        var result = builder.ToString().Trim();
        return result.Length == 0 ? null : result;
    }

    /// <summary>
    /// A single line of dialogue or a title: as <see cref="ToSafeText"/>, but newlines
    /// collapse to spaces because a subtitle line that wraps unexpectedly breaks the render.
    /// </summary>
    public static string? ToSafeLine(string? value, int maxLength = 500)
    {
        var text = ToSafeText(value, maxLength);
        if (text is null) return null;

        var collapsed = string.Join(' ',
            text.Split(['\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

        return collapsed.Length == 0 ? null : collapsed;
    }

    /// <summary>
    /// A subtitle colour. Returned in <c>#RRGGBB</c> form, or null - never passed through,
    /// because this value ends up inside an ASS subtitle header where an arbitrary string
    /// would corrupt the file.
    /// </summary>
    public static string? ToSafeHexColor(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var text = value.Trim().TrimStart('#');
        if (text.Length != 6 && text.Length != 3) return null;

        foreach (var c in text)
        {
            if (!char.IsAsciiHexDigit(c)) return null;
        }

        if (text.Length == 3)
            text = $"{text[0]}{text[0]}{text[1]}{text[1]}{text[2]}{text[2]}";

        return $"#{text.ToUpperInvariant()}";
    }

    /// <summary>
    /// A value used as a lookup key - a location name, a speaker key. Lower-case, single
    /// spaces, letters and digits only, so "The RING!" and "the ring" collide as intended
    /// and the background library actually dedupes.
    /// </summary>
    public static string? ToSafeKey(string? value, int maxLength = 80)
    {
        var name = ToSafeName(value, maxLength);
        if (name is null) return null;

        var lowered = name.ToLowerInvariant();

        var collapsed = string.Join(' ',
            lowered.Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return collapsed.Length == 0 ? null : collapsed;
    }

    /// <summary>
    /// Clamps a model's number into the range the caller can actually use. A model asked
    /// for an intensity between 0 and 1 will occasionally answer 5.
    /// </summary>
    public static double ToRange(double value, double min, double max) =>
        double.IsNaN(value) ? min : Math.Clamp(value, min, max);

    public static int ToRange(int value, int min, int max) => Math.Clamp(value, min, max);
}
