using System.Globalization;

namespace AnimStudio.Application.Clips;

/// <summary>
/// Orders names the way a person reads them: <c>clip2</c> before <c>clip10</c>.
/// <para>
/// This exists because plain string ordering is actively wrong for the one job it is used
/// for. Clips almost always arrive named in a sequence, and under an ordinal sort
/// "clip10" lands between "clip1" and "clip2" - so the single most common case, "just put
/// them in filename order", would silently produce a scrambled video. Digit runs are
/// therefore compared as numbers, and only the text between them is compared as text.
/// </para>
/// </summary>
public sealed class NaturalNameComparer : IComparer<string>
{
    public static readonly NaturalNameComparer Instance = new();

    private NaturalNameComparer() { }

    public int Compare(string? x, string? y)
    {
        if (ReferenceEquals(x, y)) return 0;
        if (x is null) return -1;
        if (y is null) return 1;

        int i = 0, j = 0;

        while (i < x.Length && j < y.Length)
        {
            var xDigit = char.IsAsciiDigit(x[i]);
            var yDigit = char.IsAsciiDigit(y[j]);

            if (xDigit && yDigit)
            {
                var xRun = DigitRun(x, ref i);
                var yRun = DigitRun(y, ref j);

                var compared = CompareNumbers(xRun, yRun);
                if (compared != 0) return compared;
                continue;
            }

            // A digit sorts before a letter, so "2 intro" precedes "intro 2".
            if (xDigit != yDigit) return xDigit ? -1 : 1;

            var xc = char.ToLowerInvariant(x[i]);
            var yc = char.ToLowerInvariant(y[j]);
            if (xc != yc) return xc.CompareTo(yc);

            i++;
            j++;
        }

        // One name is a prefix of the other; the shorter one comes first.
        var remaining = (x.Length - i).CompareTo(y.Length - j);
        return remaining != 0
            ? remaining
            // Same shape, differing only in case: a stable, explicit tiebreak so the order
            // never depends on which name the enumeration happened to reach first.
            : string.CompareOrdinal(x, y);
    }

    private static ReadOnlySpan<char> DigitRun(string value, ref int index)
    {
        var start = index;
        while (index < value.Length && char.IsAsciiDigit(value[index])) index++;
        return value.AsSpan(start, index - start);
    }

    /// <summary>
    /// Compares two digit runs as numbers without parsing them, so a run of any length is
    /// safe - a 40-digit id in a filename would overflow every integer type.
    /// </summary>
    private static int CompareNumbers(ReadOnlySpan<char> a, ReadOnlySpan<char> b)
    {
        var aTrimmed = a.TrimStart('0');
        var bTrimmed = b.TrimStart('0');

        if (aTrimmed.Length != bTrimmed.Length)
            return aTrimmed.Length.CompareTo(bTrimmed.Length);

        var compared = aTrimmed.CompareTo(bTrimmed, StringComparison.Ordinal);
        if (compared != 0) return compared;

        // Equal in value: "007" and "7" only differ in padding, so keep it deterministic.
        return a.Length.CompareTo(b.Length);
    }

    /// <summary>Case-insensitive equality on the whole name, invariant of culture.</summary>
    internal static bool NameEquals(string a, string b) =>
        string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Reduces a name to letters and digits, lowercased. This is what makes
    /// "Part 2.mp4", "part-2" and "PART_2" the same key - the three ways the same clip
    /// gets written down between a folder listing and a note in a chat window.
    /// </summary>
    internal static string Normalize(string value)
    {
        var buffer = new char[value.Length];
        var length = 0;

        foreach (var ch in value)
        {
            if (char.IsLetterOrDigit(ch))
                buffer[length++] = char.ToLowerInvariant(ch);
        }

        return new string(buffer, 0, length);
    }

    /// <summary>Parses a whole-number line, e.g. a running order written as "3".</summary>
    internal static bool TryParseIndex(string value, out int index) =>
        int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out index);
}
