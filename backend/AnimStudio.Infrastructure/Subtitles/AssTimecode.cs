using System.Globalization;

namespace AnimStudio.Infrastructure.Subtitles;

/// <summary>
/// ASS timecodes are <c>H:MM:SS.cc</c> - single-digit hours and CENTIseconds, not
/// milliseconds. That caps subtitle timing at 10ms granularity, so a cue can sit up to one
/// frame away from its exact position at 30fps. That is an accepted limitation rather than
/// something to fight.
/// </summary>
internal static class AssTimecode
{
    public static string Format(TimeSpan value)
    {
        if (value < TimeSpan.Zero) value = TimeSpan.Zero;

        var centiseconds = (int)Math.Round(value.Milliseconds / 10.0);
        var seconds = value.Seconds;
        var minutes = value.Minutes;
        var hours = (int)value.TotalHours;

        // Rounding up can carry into the next second.
        if (centiseconds >= 100) { centiseconds = 0; seconds++; }
        if (seconds >= 60) { seconds = 0; minutes++; }
        if (minutes >= 60) { minutes = 0; hours++; }

        return string.Create(CultureInfo.InvariantCulture,
            $"{hours}:{minutes:D2}:{seconds:D2}.{centiseconds:D2}");
    }
}
