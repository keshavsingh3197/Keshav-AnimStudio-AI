namespace AnimStudio.Application.Rendering;

/// <summary>Which narration lines to keep, and how much to speed them up, so the speech fits a time cap.</summary>
/// <param name="KeptIndices">Indices into the measured clips, in script order.</param>
/// <param name="Tempo">Playback speed for the joined track: 1.0 means unchanged.</param>
public sealed record SpeechFit(IReadOnlyList<int> KeptIndices, double Tempo);

/// <summary>
/// Fits a measured narration into a maximum video length. It first speeds the voices up (up to
/// <c>maxTempo</c>); when that is not enough it drops lines from the end of the middle, so the opening
/// hook and the closing moral always play.
/// </summary>
public static class SpeechFitPlanner
{
    public static SpeechFit Plan(
        IReadOnlyList<double> clipDurations,
        int? maxSeconds,
        double leadSeconds,
        double pauseSeconds,
        double tailSeconds,
        double maxTempo)
    {
        ArgumentNullException.ThrowIfNull(clipDurations);
        var kept = Enumerable.Range(0, clipDurations.Count).ToList();
        if (maxSeconds is not > 0 || kept.Count == 0)
            return new SpeechFit(kept, 1.0);

        maxTempo = Math.Max(1.0, maxTempo);
        var budget = Math.Max(1.0, maxSeconds.Value - tailSeconds);

        double Length() => leadSeconds
            + kept.Sum(i => Math.Max(0, clipDurations[i]))
            + pauseSeconds * Math.Max(0, kept.Count - 1);

        // Keep the first and the last line; drop the latest middle line until a capped speed-up fits.
        while (kept.Count > 2 && Length() / maxTempo > budget)
            kept.RemoveAt(kept.Count - 2);

        var tempo = Math.Clamp(Length() / budget, 1.0, maxTempo);
        return new SpeechFit(kept, Math.Round(tempo, 3));
    }
}
