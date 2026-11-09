using System.Text;
using AnimStudio.Application.Subtitles;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>One subtitle track a finished story can offer.</summary>
/// <param name="Language">The language code YouTube and players know it by: <c>hi</c>, <c>en</c>.</param>
/// <param name="Label">The language's name, for the page and for YouTube's track name.</param>
/// <param name="Source"><c>narration</c> for the words the voice says, <c>translation</c> for their meaning in the story's other language.</param>
public sealed record StoryCaptionTrack(string Language, string Label, string Source, int Cues);

/// <summary>One subtitle on the finished video's own timeline, in seconds.</summary>
public sealed record StoryCaptionCue(double Start, double End, string Text);

/// <summary>
/// The story's subtitles as SRT files: the narration in the story's own language, and its meaning in the other one -
/// English for a Hindi story, Hindi for an English story that has it (from its dub) - timed to the same scenes. Both are
/// worked out from the run itself, the way the build placed them in the project, so they line up with the rendered video.
/// When the dub was spoken, the translation follows the dub's voice, so it matches the dub track too.
/// </summary>
/// <remarks>
/// Timings exist only once the project has been built (<see cref="StoryRun.SceneStarts"/>). A script edited after that
/// keeps its old timings until it is built again, so the page says the tracks follow the last build.
/// </remarks>
public static class StoryCaptions
{
    public const string Narration = "narration";
    public const string Translation = "translation";

    /// <summary>The tracks this run can offer now; empty until the project is built.</summary>
    public static IReadOnlyList<StoryCaptionTrack> Tracks(StoryRun run)
    {
        if (!HasTimings(run)) return [];

        var tracks = new List<StoryCaptionTrack>(2);
        var language = LanguageOf(run);
        var spoken = Build(run, language);
        if (spoken.Count > 0) tracks.Add(new StoryCaptionTrack(language, LabelOf(language), Narration, spoken.Count));

        var other = language == "en" ? "hi" : "en";
        var translated = Build(run, other);
        if (translated.Count > 0) tracks.Add(new StoryCaptionTrack(other, LabelOf(other), Translation, translated.Count));

        return tracks;
    }

    /// <summary>
    /// The cues of one track, in order, never overlapping. The story's own language is the narration; the other of Hindi
    /// and English is each scene's meaning in it. Any other language has none.
    /// </summary>
    public static IReadOnlyList<StoryCaptionCue> Build(StoryRun run, string language)
    {
        if (!HasTimings(run)) return [];

        var spoken = LanguageOf(run);
        var translated = language != spoken && language is "en" or "hi";
        if (language != spoken && !translated) return [];
        var dubbed = translated && StoryDub.IsSpoken(run);

        var scenes = run.Script!.Scenes;
        // Narration lengths and pauses are measured at the project's own pace; the scene starts at the video's speed.
        var pace = run.TimingSpeed > 0 && double.IsFinite(run.TimingSpeed) ? run.TimingSpeed : 1.0;
        var cues = new List<StoryCaptionCue>();
        for (var i = 0; i < scenes.Count; i++)
        {
            var scene = scenes[i];
            var start = run.SceneStarts[i];
            var seconds = Math.Max(0.5, dubbed ? scene.DubAudioSeconds!.Value
                : HasAudio(run, scene) ? scene.AudioSeconds!.Value : scene.EstimatedSeconds);
            // The next scene fades in before this one ends; a subtitle stops where the next scene starts.
            var limit = i + 1 < scenes.Count ? run.SceneStarts[i + 1] : Math.Max(run.TotalSeconds, start + seconds / pace);

            var text = translated ? StoryDub.TextOf(scene, language) : scene.Narration;
            var chunks = StoryPacing.SplitCaptions(text);
            var spans = dubbed ? StoryPacing.Align(chunks, seconds, scene.DubPauses)
                : !translated && HasAudio(run, scene) ? StoryPacing.Align(chunks, seconds, scene.Pauses)
                : StoryPacing.Spread(chunks, seconds);

            foreach (var span in spans)
            {
                var from = Math.Round(start + span.Start / pace, 3);
                var to = Math.Round(Math.Min(start + span.End / pace, limit), 3);
                if (to - from < 0.2 || string.IsNullOrWhiteSpace(span.Text)) continue;
                cues.Add(new StoryCaptionCue(from, to, span.Text.Trim()));
            }
        }

        return cues;
    }

    /// <summary>The cues as an SRT file: numbered blocks, <c>HH:MM:SS,mmm</c> times, a blank line between.</summary>
    public static string ToSrt(IReadOnlyList<StoryCaptionCue> cues)
    {
        var srt = new StringBuilder();
        for (var i = 0; i < cues.Count; i++)
        {
            srt.Append(i + 1).Append('\n')
                .Append(SrtTimecode.Format(TimeSpan.FromSeconds(cues[i].Start)))
                .Append(" --> ")
                .Append(SrtTimecode.Format(TimeSpan.FromSeconds(cues[i].End)))
                .Append('\n')
                .Append(cues[i].Text)
                .Append("\n\n");
        }

        return srt.ToString();
    }

    public static string LabelOf(string language) => language switch
    {
        "hi" => "Hindi",
        "en" => "English",
        _ => language
    };

    private static string LanguageOf(StoryRun run) => run.Brief.Language == "en" ? "en" : "hi";

    private static bool HasTimings(StoryRun run) =>
        run.Script is { Scenes.Count: > 0 } script && run.SceneStarts.Count == script.Scenes.Count;

    /// <summary>The same test the build uses: narration that was made and measured, and is still the run's own file.</summary>
    private static bool HasAudio(StoryRun run, StoryScene scene) =>
        StoryObjectKeys.Owns(run.Id, scene.AudioKey) && scene.AudioSeconds is > 0;
}
