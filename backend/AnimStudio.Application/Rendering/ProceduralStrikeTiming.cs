namespace AnimStudio.Application.Rendering;

/// <summary>
/// When each punch / kick of a fight action lands, on the video clock. The WebGL engine animates strikes from the
/// same numbers (<c>STRIKE_TIMING</c> in tools/webgl-3d-builder/src/types.ts) — keep both in sync so the hit sound,
/// the "POW" flash and the victim's recoil happen on the same frame.
/// </summary>
public static class ProceduralStrikeTiming
{
    public const double PunchRateHz = 2.2;
    public const double PunchImpactPhase = 0.35;
    public const double KickRateHz = 1.6;
    public const double KickImpactPhase = 0.4;

    /// <summary>Impact times (seconds) of <paramref name="action"/> inside a turn, leaving a short lead-in and tail.</summary>
    public static IReadOnlyList<double> ImpactTimes(string? action, double startSeconds, double endSeconds, int max = 6)
    {
        var (rate, phase) = action switch
        {
            "punching" => (PunchRateHz, PunchImpactPhase),
            "kicking" => (KickRateHz, KickImpactPhase),
            _ => (0.0, 0.0)
        };
        if (rate <= 0 || endSeconds <= startSeconds) return [];

        var hits = new List<double>();
        var first = Math.Ceiling((startSeconds + 0.12) * rate - phase);
        for (var n = Math.Max(0, first); hits.Count < max; n++)
        {
            var at = (n + phase) / rate;
            if (at > endSeconds - 0.15) break;
            if (at >= startSeconds + 0.12) hits.Add(at);
        }
        return hits;
    }
}
