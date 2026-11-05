using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The speed a story's video plays at, and moving its timings between speeds. The project is always built and rendered at
/// its own pace; a copy at the chosen speed becomes the story's video (see <see cref="StoryRun.RenderJobId"/>).
/// </summary>
public static class StoryVideoSpeed
{
    public const double Min = 0.5;
    public const double Max = 2.0;

    /// <summary>A speed as stored: within the range, to the nearest 0.05, and 1 for anything that is not a number.</summary>
    public static double Normalize(double speed) =>
        double.IsFinite(speed) ? Math.Round(Math.Clamp(speed, Min, Max) * 20, MidpointRounding.AwayFromZero) / 20 : 1.0;

    /// <summary>True when the two speeds are the same once stored.</summary>
    public static bool Same(double a, double b) => Math.Abs(Normalize(a) - Normalize(b)) < 0.001;

    /// <summary>
    /// Moves the run's scene starts and length to <paramref name="speed"/> from the speed they are at now, so the subtitles
    /// and the YouTube chapters land where the video at that speed has them.
    /// </summary>
    public static void Retime(StoryRun run, double speed)
    {
        var from = run.TimingSpeed > 0 && double.IsFinite(run.TimingSpeed) ? run.TimingSpeed : 1.0;
        var factor = from / speed;
        if (Math.Abs(factor - 1) < 1e-9) return;

        run.SceneStarts = [.. run.SceneStarts.Select(s => Math.Round(s * factor, 3))];
        run.TotalSeconds = Math.Round(run.TotalSeconds * factor, 3);
        run.TimingSpeed = speed;
    }
}
