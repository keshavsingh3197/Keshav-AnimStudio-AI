using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryReviewGateTests
{
    private static (StoryRunExecutor Executor, InMemoryStoryRuns Runs, Dictionary<string, ScriptedStage> Stages) Make(
        Action<Dictionary<string, ScriptedStage>>? configure = null)
    {
        var runs = new InMemoryStoryRuns();
        var stages = StoryStageIds.All.ToDictionary(id => id, id => new ScriptedStage(id), StringComparer.Ordinal);
        configure?.Invoke(stages);
        var executor = new StoryRunExecutor(runs, stages.Values, new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<StoryRunExecutor>.Instance);
        return (executor, runs, stages);
    }

    [Fact]
    public async Task A_build_stops_after_each_reviewed_step_until_the_person_approves_it()
    {
        var (executor, runs, stages) = Make();
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await executor.ExecuteAsync(run.Id, default, default);
        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.AwaitingReview, saved.Status);
        Assert.Equal(StoryStageIds.Narration, saved.Review);
        Assert.Equal(0, stages[StoryStageIds.Music].Calls);

        foreach (var (approve, next) in new[]
        {
            (StoryStageIds.Narration, StoryStageIds.Music),
            (StoryStageIds.Music, StoryStageIds.Render)
        })
        {
            saved.SetApproval(approve, StorySamples.Now);
            saved.Status = StoryRunStatus.Building;
            runs.Seed(saved);
            await executor.ExecuteAsync(run.Id, default, default);
            saved = runs.Read(run.Id)!;
            Assert.Equal(StoryRunStatus.AwaitingReview, saved.Status);
            Assert.Equal(next, saved.Review);
        }

        // The video is watched before the YouTube details are made.
        Assert.Equal(0, stages[StoryStageIds.Kit].Calls);
        saved.SetApproval(StoryStageIds.Render, StorySamples.Now);
        saved.Status = StoryRunStatus.Building;
        runs.Seed(saved);
        await executor.ExecuteAsync(run.Id, default, default);

        Assert.Equal(StoryRunStatus.Completed, runs.Read(run.Id)!.Status);
        Assert.All(StoryStageIds.Building, id => Assert.Equal(1, stages[id].Calls));
    }

    [Fact]
    public async Task Auto_approve_builds_straight_through_without_stopping()
    {
        var (executor, runs, _) = Make();
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Options.AutoApprove = true;
        runs.Seed(run);

        await executor.ExecuteAsync(run.Id, default, default);

        Assert.Equal(StoryRunStatus.Completed, runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_step_switched_off_is_not_asked_about_but_music_that_could_not_be_made_is()
    {
        var (executor, runs, _) = Make(s =>
        {
            s[StoryStageIds.Narration] = new ScriptedStage(StoryStageIds.Narration,
                (_, _) => Task.FromResult(StoryStageOutcome.Skipped("narration-off", "Off.")));
            s[StoryStageIds.Music] = new ScriptedStage(StoryStageIds.Music,
                (_, _) => Task.FromResult(StoryStageOutcome.Skipped("music-not-configured", "No search key.")));
        });
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await executor.ExecuteAsync(run.Id, default, default);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.AwaitingReview, saved.Status);
        // The person can add their own track here; with music simply off, nothing would be asked.
        Assert.Equal(StoryStageIds.Music, saved.Review);
    }

    [Fact]
    public async Task Music_turned_off_is_not_waited_for()
    {
        var (executor, runs, _) = Make(s => s[StoryStageIds.Music] = new ScriptedStage(StoryStageIds.Music,
            (_, _) => Task.FromResult(StoryStageOutcome.Skipped("music-off", "Off."))));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.SetApproval(StoryStageIds.Narration, StorySamples.Now);
        runs.Seed(run);

        await executor.ExecuteAsync(run.Id, default, default);

        Assert.Equal(StoryStageIds.Render, runs.Read(run.Id)!.Review);
    }
}

public sealed class StoryLookTests
{
    private static List<StoryScene> Scenes(params string?[] moods) =>
        [.. moods.Select((mood, i) => new StoryScene { Number = i + 1, Mood = mood, Narration = "x" })];

    private static IReadOnlyList<StorySceneLook> Plan(List<StoryScene> scenes, StoryLookStyle style = StoryLookStyle.Auto, int take = 0,
        StoryFormat format = StoryFormat.Wide, double seconds = 10) =>
        StoryLook.Plan(scenes, [.. scenes.Select(_ => seconds)], format, style, take);

    [Fact]
    public void The_story_opens_by_moving_in_closes_by_pulling_back_and_the_last_scene_has_no_cut_after_it()
    {
        var looks = Plan(Scenes("calm", "dramatic", "joyful", "awe", "serene"));

        Assert.Equal(BackgroundEffect.ZoomIn, looks[0].Effect);
        Assert.Equal(BackgroundEffect.ZoomOut, looks[^1].Effect);
        Assert.Equal(SceneTransition.None, looks[^1].Transition);
        Assert.Equal(0, looks[^1].TransitionSeconds);
        Assert.All(looks.Take(looks.Count - 1), l => Assert.NotEqual(SceneTransition.None, l.Transition));
    }

    [Fact]
    public void The_same_move_is_never_used_twice_in_a_row()
    {
        var looks = Plan(Scenes("calm", "calm", "calm", "calm", "calm", "calm", "calm"));

        for (var i = 1; i < looks.Count; i++) Assert.NotEqual(looks[i - 1].Effect, looks[i].Effect);
    }

    [Fact]
    public void A_turn_into_drama_gets_a_quicker_cut_than_two_calm_scenes_and_moves_more()
    {
        var looks = Plan(Scenes("calm", "calm", "dramatic", "calm"));

        Assert.True(looks[1].TransitionSeconds < looks[0].TransitionSeconds);
        Assert.True(looks[2].Intensity > looks[1].Intensity);
    }

    [Fact]
    public void A_cut_never_takes_more_than_a_third_of_a_short_scene()
    {
        var looks = Plan(Scenes("calm", "somber", "calm"), StoryLookStyle.Cinematic, seconds: 1.2);

        Assert.All(looks.Take(2), l => Assert.InRange(l.TransitionSeconds, 0.2, 0.4));
    }

    [Fact]
    public void A_new_take_looks_different_somewhere_but_keeps_the_opening_and_closing()
    {
        var scenes = Scenes("calm", "joyful", "dramatic", "awe", "sad", "calm");

        var first = Plan(scenes, take: 0);
        var second = Plan(scenes, take: 1);

        Assert.NotEqual(first, second);
        Assert.Equal(first[0].Effect, second[0].Effect);
        Assert.Equal(first[^1].Effect, second[^1].Effect);
    }

    [Fact]
    public void Gentle_keeps_to_soft_fades_and_small_moves()
    {
        var looks = Plan(Scenes("dramatic", "fierce", "joyful", "calm"), StoryLookStyle.Gentle);

        Assert.All(looks.Take(3), l => Assert.Equal(SceneTransition.Fade, l.Transition));
        Assert.All(looks, l => Assert.True(l.Intensity <= 0.08));
    }

    [Fact]
    public void A_vertical_video_pans_up_and_down_rather_than_sideways()
    {
        var looks = Plan(Scenes("calm", "joyful", "joyful", "dramatic", "joyful", "calm"), StoryLookStyle.Lively, format: StoryFormat.Vertical);

        Assert.DoesNotContain(looks, l => l.Effect is BackgroundEffect.PanLeft or BackgroundEffect.PanRight);
        Assert.DoesNotContain(looks, l => l.Transition is SceneTransition.SlideLeft or SceneTransition.SlideRight);
    }

    [Fact]
    public void A_scene_the_person_set_keeps_it_and_a_moving_clip_does_not_move_its_picture()
    {
        var scenes = Scenes("calm", "calm", "calm");
        scenes[1].LookPinned = true;
        scenes[1].Effect = nameof(BackgroundEffect.PanDown);
        scenes[1].Transition = nameof(SceneTransition.CircleOpen);
        scenes[1].TransitionSeconds = 0.9;
        scenes[2].VideoKey = "story-runs/sr_x/clips/s03.mp4";

        var looks = Plan(scenes, take: 3);

        Assert.Equal(BackgroundEffect.PanDown, looks[1].Effect);
        Assert.Equal(SceneTransition.CircleOpen, looks[1].Transition);
        Assert.Equal(0.9, looks[1].TransitionSeconds);
        Assert.Equal(BackgroundEffect.None, looks[2].Effect);
    }
}
