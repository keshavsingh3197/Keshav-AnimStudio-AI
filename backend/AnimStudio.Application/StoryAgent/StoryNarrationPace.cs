using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// How fast a story's narration came out, and the video speed that brings it to a comfortable pace. Speech engines read at
/// their own pace - one voice drags, another rushes - so the narration is measured once it exists instead of guessed at.
/// </summary>
/// <remarks>
/// The fix is the video's speed (<see cref="StoryVideoSpeed"/>): the voice, the music and the pictures are sped up or slowed
/// together with the pitch kept, so nothing is spoken again and no engine is asked twice.
/// </remarks>
public static class StoryNarrationPace
{
    /// <summary>A storyteller's pace in Hindi, words a minute: unhurried, every word clear.</summary>
    public const double HindiTarget = 140;

    public const double EnglishTarget = 150;

    /// <summary>Slower for children, who follow a story at a gentler pace.</summary>
    public const double KidsTarget = 125;

    /// <summary>Within this share of the target the pace is left as it is: a few percent either way is not heard.</summary>
    public const double Tolerance = 0.07;

    /// <summary>The furthest the pace is moved automatically; beyond this the voice should be changed, not stretched.</summary>
    public const double MinSpeed = 0.85;

    public const double MaxSpeed = 1.3;

    /// <summary>Too little speech to judge a pace from.</summary>
    private const double MinSpeechSeconds = 8;

    public static double TargetFor(string? language, bool forKids) =>
        forKids ? KidsTarget : string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? EnglishTarget : HindiTarget;

    /// <summary>
    /// The pace of the narration made for <paramref name="script"/>, or null when too few scenes have audio to say.
    /// The breath added before and after each scene is not speech and is left out.
    /// </summary>
    public static StoryPace? Measure(StoryScript script, string? language, bool forKids, DateTime now)
    {
        var words = 0;
        var seconds = 0.0;
        foreach (var scene in script.Scenes)
        {
            if (scene.AudioSeconds is not > 0) continue;
            words += CountWords(scene.Narration);
            seconds += Math.Max(0.1, scene.AudioSeconds.Value - StoryPacing.LeadSeconds - StoryPacing.TailSeconds);
        }

        if (words == 0 || seconds < MinSpeechSeconds) return null;

        var wpm = words / seconds * 60;
        var target = TargetFor(language, forKids);
        var ratio = wpm / target;
        var verdict = ratio < 1 - Tolerance ? "slow" : ratio > 1 + Tolerance ? "fast" : "good";

        return new StoryPace
        {
            WordsPerMinute = Math.Round(wpm, 1),
            TargetWordsPerMinute = target,
            SuggestedSpeed = verdict == "good" ? 1.0 : SpeedFor(target / wpm),
            Verdict = verdict,
            MeasuredAtUtc = now
        };
    }

    /// <summary>A speed as the video stores it, kept within the range that still sounds natural.</summary>
    public static double SpeedFor(double ratio) =>
        StoryVideoSpeed.Normalize(Math.Clamp(double.IsFinite(ratio) ? ratio : 1.0, MinSpeed, MaxSpeed));

    /// <summary>Words as a listener hears them: runs of text with at least one letter or digit, in any script.</summary>
    public static int CountWords(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;

        var count = 0;
        foreach (var token in text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            if (token.Any(char.IsLetterOrDigit)) count++;
        return count;
    }
}
