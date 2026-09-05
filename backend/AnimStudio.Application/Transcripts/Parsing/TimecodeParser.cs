using System.Globalization;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Parses SRT and WebVTT timecodes with one expression.
/// <para>
/// Handles both formats' quirks: the hours group is optional because real .vtt files in
/// the wild write "MM:SS.mmm"; the decimal separator may be "." (VTT) or "," (SRT); and
/// hours may exceed 99.
/// </para>
/// </summary>
public static partial class TimecodeParser
{
    [GeneratedRegex(@"^(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$",
        RegexOptions.CultureInvariant)]
    private static partial Regex TimecodePattern();

    public static bool TryParse(string text, out TimeSpan value)
    {
        value = default;
        if (string.IsNullOrWhiteSpace(text)) return false;

        var match = TimecodePattern().Match(text.Trim());
        if (!match.Success) return false;

        var hours = match.Groups[1].Success
            ? int.Parse(match.Groups[1].ValueSpan, CultureInfo.InvariantCulture) : 0;
        var minutes = int.Parse(match.Groups[2].ValueSpan, CultureInfo.InvariantCulture);
        var seconds = int.Parse(match.Groups[3].ValueSpan, CultureInfo.InvariantCulture);

        // Fractional digits are RIGHT-padded, not left-padded: ".5" is 500ms, not 5ms.
        // Getting this backwards is the single most common subtitle parsing bug.
        var milliseconds = 0;
        if (match.Groups[4].Success)
        {
            var fraction = match.Groups[4].Value;
            milliseconds = int.Parse(fraction.PadRight(3, '0').AsSpan(0, 3), CultureInfo.InvariantCulture);
        }

        if (minutes > 59 || seconds > 59) return false;

        value = new TimeSpan(0, hours, minutes, seconds, milliseconds);
        return true;
    }

    /// <summary>Splits a cue timing line on "--&gt;" and parses both sides.</summary>
    public static bool TryParseCueLine(string line, out TimeSpan start, out TimeSpan end)
    {
        start = default;
        end = default;

        var arrow = line.IndexOf("-->", StringComparison.Ordinal);
        if (arrow < 0) return false;

        var left = line[..arrow];
        var right = line[(arrow + 3)..].TrimStart();

        // WebVTT allows cue settings after the end time ("align:start position:0%").
        // Auto-generated captions always emit these, so the end time is only the first token.
        var space = right.IndexOfAny([' ', '\t']);
        if (space >= 0) right = right[..space];

        return TryParse(left, out start) && TryParse(right, out end);
    }
}
