using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Writes the YouTube title, description, tags, chapters and comments for the finished video. It only describes: nothing is
/// published, and the person decides when and where the video goes.
/// </summary>
public sealed class KitStage(IAiSettingsRepository settings) : IStoryStage
{
    public string Id => StoryStageIds.Kit;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to describe.");

        var branding = YouTubeBrandKit.Effective(await settings.GetAsync(ct).ConfigureAwait(false), null);

        // The timeline the project was built with; an estimate only if a run somehow arrives here without one.
        var starts = run.SceneStarts.Count == script.Scenes.Count ? run.SceneStarts : Estimate(script);
        var total = run.TotalSeconds > 0 ? run.TotalSeconds : script.Scenes.Sum(Seconds);

        // Pictures made by an AI tool - the app's, or the person's own (Google Flow, say) when they said so - need YouTube's disclosure.
        var aiPictures = script.Scenes.Any(s => s.ImageSource is not (null or "placeholder" or "upload"))
            || (run.Options.UploadsAreAiMade && script.Scenes.Any(s => s.ImageSource == "upload"));

        run.Kit = StoryKitBuilder.Build(script, run.Brief, run.Research,
            new StoryKitFacts(starts, total, aiPictures, run.Options.Narration, run.Music, branding), StoryGenres.Of(run));
        if (run.Series is { Part: > 1 } series) StoryKitBuilder.AddSeries(run.Kit, series, run.Brief.Language);

        return StoryStageOutcome.Completed("The YouTube title, description, tags, chapters and comments are ready.");
    }

    private static double Seconds(StoryScene scene) => scene.AudioSeconds is > 0 ? scene.AudioSeconds.Value : scene.EstimatedSeconds;

    private static List<double> Estimate(StoryScript script)
    {
        var starts = new List<double>(script.Scenes.Count);
        var at = 0.0;
        foreach (var scene in script.Scenes)
        {
            starts.Add(Math.Round(at, 2));
            at += Seconds(scene) - StoryBundleBuilder.TransitionSeconds;
        }
        return starts;
    }
}
