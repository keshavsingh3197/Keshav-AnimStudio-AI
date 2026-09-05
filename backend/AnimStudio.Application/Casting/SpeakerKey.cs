using System.Globalization;
using System.Text;

namespace AnimStudio.Application.Casting;

/// <summary>
/// Normalizes a speaker label into a join key.
/// <para>
/// Every casting lookup uses this key rather than the raw label, so "RAHUL", "Rahul",
/// "rahul :" and "Ráhul" all resolve to the same character instead of creating four.
/// </para>
/// </summary>
public static class SpeakerKey
{
    public static string Normalize(string? label)
    {
        if (string.IsNullOrWhiteSpace(label)) return string.Empty;

        var text = label.Trim().TrimEnd(':').Trim();

        // Strip diacritics via canonical decomposition.
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsControl(ch)) continue;
            if (ch is >= '\u202A' and <= '\u202E') continue;
            if (ch is >= '\u2066' and <= '\u2069') continue;
            if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch)) builder.Append(ch);
        }

        var collapsed = string.Join(' ',
            builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return collapsed.Normalize(NormalizationForm.FormC).ToLowerInvariant();
    }
}
