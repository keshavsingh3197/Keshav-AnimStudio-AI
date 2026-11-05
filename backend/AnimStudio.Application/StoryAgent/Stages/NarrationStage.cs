using System.Globalization;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Speaks every scene. Each finished scene is stored the moment it is made, under a name that says what it sounds like, so
/// a retry (or a restart halfway through a ten-minute conversion) speaks only the scenes that are not done.
/// </summary>
public sealed class NarrationStage(
    StoryNarrator narrator, IObjectStore store, ILogger<NarrationStage> logger, TimeProvider? clock = null) : IStoryStage
{
    public string Id => StoryStageIds.Narration;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to narrate.");

        if (run.Options.Narration == StoryNarrationMode.None)
        {
            foreach (var scene in script.Scenes)
            {
                if (StoryObjectKeys.Owns(run.Id, scene.AudioKey)) await store.DeleteAsync(scene.AudioKey!, ct).ConfigureAwait(false);
                Forget(scene);
            }

            return StoryStageOutcome.Skipped("narration-off", "Narration is off; the video has subtitles only.");
        }

        var plan = await narrator.PlanAsync(run, ct).ConfigureAwait(false);
        var spoken = 0;
        var reused = 0;

        // Who speaks whom, for the person to see; no voice when the narrator reads every line.
        foreach (var member in script.Cast)
            member.VoiceId = plan.Cast is { } cast && cast.TryGetValue(member.Name, out var voice) ? voice : null;

        for (var i = 0; i < script.Scenes.Count; i++)
        {
            ct.ThrowIfCancellationRequested();
            var scene = script.Scenes[i];
            var key = StoryObjectKeys.Narration(run.Id, scene.Number, StoryNarrator.Fingerprint(plan, scene));

            await context.Report(i * 100 / script.Scenes.Count, $"Narrating scene {i + 1} of {script.Scenes.Count} in {plan.Describe()}").ConfigureAwait(false);

            if (scene.AudioKey == key && scene.AudioSeconds is > 0 && await ExistsAsync(key, ct).ConfigureAwait(false))
            {
                reused++;
                continue;
            }

            // The words or the voice changed since an earlier try: the old file is of no use.
            if (StoryObjectKeys.Owns(run.Id, scene.AudioKey) && scene.AudioKey != key)
                await store.DeleteAsync(scene.AudioKey!, ct).ConfigureAwait(false);

            var line = await narrator.SpeakAsync(plan, scene, run.UserId, ct).ConfigureAwait(false);
            await using (var content = new MemoryStream(line.Wav, writable: false))
                await store.SaveAsync(key, content, "audio/wav", ct).ConfigureAwait(false);

            scene.AudioKey = key;
            scene.AudioSeconds = line.DurationSeconds;
            scene.Pauses = [.. line.Pauses];
            scene.AudioName = $"Narration {scene.Number}";
            scene.AudioSource = plan.Describe();
            spoken++;
            await context.Save().ConfigureAwait(false);
            logger.LogInformation("Story run {RunId}: narrated scene {Scene} ({Seconds:0.0}s).", run.Id, scene.Number, line.DurationSeconds);
        }

        var pace = Pace(run, script);
        return StoryStageOutcome.Completed((reused > 0
            ? $"Narration ready: {spoken} scene{(spoken == 1 ? string.Empty : "s")} spoken, {reused} kept from before."
            : $"Narration ready in {plan.Describe()}.") + pace);
    }

    /// <summary>
    /// Measures how fast the voice came out and, when the person let the app choose the pace, makes the speed that brings
    /// it to a comfortable one the video's speed. Returns a few words for the stage's message.
    /// </summary>
    private string Pace(StoryRun run, StoryScript script)
    {
        var measured = StoryNarrationPace.Measure(script, run.Brief.Language, StoryGenres.Of(run).MadeForKids,
            (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime);
        run.Pace = measured;
        if (measured is null) return string.Empty;

        if (run.Options.AutoPace)
        {
            run.Options.VideoSpeed = measured.SuggestedSpeed;
            measured.Applied = true;
            logger.LogInformation("Story run {RunId}: narration at {Wpm:0} words a minute; the video plays at {Speed}x.",
                run.Id, measured.WordsPerMinute, measured.SuggestedSpeed);
        }

        var speed = measured.SuggestedSpeed.ToString("0.##", CultureInfo.InvariantCulture);
        return measured.Verdict switch
        {
            "good" => " The pace is comfortable.",
            _ when measured.Applied => $" The voice was a little {measured.Verdict}, so the video plays at {speed}x.",
            _ => $" The voice is a little {measured.Verdict}; {speed}x would suit it."
        };
    }

    private async Task<bool> ExistsAsync(string key, CancellationToken ct)
    {
        await using var stream = await store.OpenAsync(key, ct).ConfigureAwait(false);
        return stream is not null;
    }

    /// <summary>Subtitles only: no scene keeps audio from an earlier choice.</summary>
    private static void Forget(StoryScene scene)
    {
        scene.AudioKey = null;
        scene.AudioSeconds = null;
        scene.AudioName = null;
        scene.AudioSource = null;
        scene.Pauses = [];
    }
}
