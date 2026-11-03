using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryRunExecutorTests
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

    private static Task Run(StoryRunExecutor executor, string id, CancellationToken userCancel = default, CancellationToken shutdown = default) =>
        executor.ExecuteAsync(id, userCancel, shutdown);

    [Fact]
    public async Task A_new_run_researches_writes_and_then_waits_for_the_person_to_read_the_script()
    {
        var (executor, runs, stages) = Make();
        var run = StoryTestData.Run();
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.ScriptReady, saved.Status);
        Assert.Equal(StoryStageStatus.Completed, saved.Stage(StoryStageIds.Research).Status);
        Assert.Equal(StoryStageStatus.Completed, saved.Stage(StoryStageIds.Script).Status);
        Assert.All(StoryStageIds.Building, id =>
        {
            Assert.Equal(StoryStageStatus.Pending, saved.Stage(id).Status);
            Assert.Equal(0, stages[id].Calls);
        });
    }

    [Fact]
    public async Task With_auto_approve_the_run_goes_straight_on_to_building_and_completes()
    {
        var (executor, runs, stages) = Make();
        var run = StoryTestData.Run();
        run.Options.AutoApprove = true;
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Completed, saved.Status);
        Assert.All(StoryStageIds.All, id =>
        {
            Assert.Equal(StoryStageStatus.Completed, saved.Stage(id).Status);
            Assert.Equal(100, saved.Stage(id).Progress);
            Assert.NotNull(saved.Stage(id).CompletedAtUtc);
            Assert.Equal(1, stages[id].Calls);
        });
    }

    [Fact]
    public async Task A_building_run_works_through_the_building_stages_only_and_in_order()
    {
        var order = new List<string>();
        var (executor, runs, _) = Make(stages =>
        {
            foreach (var id in StoryStageIds.All)
            {
                var captured = id;
                stages[id] = new ScriptedStage(id, (_, _) =>
                {
                    order.Add(captured);
                    return Task.FromResult(StoryStageOutcome.Completed());
                });
            }
        });
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        Assert.Equal(StoryStageIds.Building, order);
        Assert.Equal(StoryRunStatus.Completed, runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_stage_that_needs_the_person_pauses_the_run_and_stays_pending()
    {
        var (executor, runs, stages) = Make(s => s[StoryStageIds.Script] = new ScriptedStage(StoryStageIds.Script,
            (_, _) => Task.FromResult(StoryStageOutcome.Paused(StoryRunStatus.AwaitingScript, "Paste the reply."))));
        var run = StoryTestData.Run();
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.AwaitingScript, saved.Status);
        var script = saved.Stage(StoryStageIds.Script);
        Assert.Equal(StoryStageStatus.Pending, script.Status);
        Assert.Equal("Paste the reply.", script.Message);
        Assert.Equal(StoryStageStatus.Completed, saved.Stage(StoryStageIds.Research).Status);
        Assert.Equal(0, stages[StoryStageIds.Visuals].Calls);
    }

    [Fact]
    public async Task A_stage_that_cannot_finish_fails_the_run_with_its_code_and_message_and_later_stages_never_start()
    {
        var (executor, runs, stages) = Make(s => s[StoryStageIds.Narration] = new ScriptedStage(StoryStageIds.Narration,
            (_, _) => throw new StoryStageException("no-speech-engine", "No speech engine is available.")));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Failed, saved.Status);
        Assert.Equal("no-speech-engine", saved.ErrorCode);
        Assert.Equal("No speech engine is available.", saved.ErrorMessage);
        var failed = saved.Stage(StoryStageIds.Narration);
        Assert.Equal(StoryStageStatus.Failed, failed.Status);
        Assert.Equal("no-speech-engine", failed.Code);
        Assert.Equal(StoryStageStatus.Completed, saved.Stage(StoryStageIds.Visuals).Status);
        Assert.Equal(0, stages[StoryStageIds.Music].Calls);
    }

    [Fact]
    public async Task An_unexpected_error_fails_the_run_with_a_plain_message_and_leaks_nothing()
    {
        var (executor, runs, _) = Make(s => s[StoryStageIds.Visuals] = new ScriptedStage(StoryStageIds.Visuals,
            (_, _) => throw new InvalidOperationException("connection string Server=secret;Password=hunter2")));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Failed, saved.Status);
        Assert.Equal("internal-error", saved.ErrorCode);
        Assert.DoesNotContain("secret", saved.ErrorMessage);
        Assert.DoesNotContain("hunter2", saved.Stage(StoryStageIds.Visuals).Message);
    }

    [Fact]
    public async Task A_stage_that_had_nothing_to_do_is_marked_skipped_with_its_reason_and_the_run_goes_on()
    {
        var (executor, runs, _) = Make(s => s[StoryStageIds.Music] = new ScriptedStage(StoryStageIds.Music,
            (_, _) => Task.FromResult(StoryStageOutcome.Skipped("music-off", "Background music is off."))));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Completed, saved.Status);
        var music = saved.Stage(StoryStageIds.Music);
        Assert.Equal(StoryStageStatus.Skipped, music.Status);
        Assert.Equal("music-off", music.Code);
        Assert.Equal("Background music is off.", music.Message);
    }

    [Fact]
    public async Task Stages_that_finished_are_not_run_again_but_one_that_was_running_when_the_process_died_is()
    {
        var (executor, runs, stages) = Make();
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Stage(StoryStageIds.Visuals).Status = StoryStageStatus.Completed;
        run.Stage(StoryStageIds.Narration).Status = StoryStageStatus.Completed;
        run.Stage(StoryStageIds.Music).Status = StoryStageStatus.Skipped;
        run.Stage(StoryStageIds.Assemble).Status = StoryStageStatus.Running;
        runs.Seed(run);

        await Run(executor, run.Id);

        Assert.Equal(0, stages[StoryStageIds.Visuals].Calls);
        Assert.Equal(0, stages[StoryStageIds.Narration].Calls);
        Assert.Equal(0, stages[StoryStageIds.Music].Calls);
        Assert.Equal(1, stages[StoryStageIds.Assemble].Calls);
        Assert.Equal(1, stages[StoryStageIds.Render].Calls);
        Assert.Equal(StoryRunStatus.Completed, runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_run_that_is_not_working_or_does_not_exist_is_left_alone()
    {
        var (executor, runs, stages) = Make();
        var waiting = StoryTestData.Run(StoryRunStatus.ScriptReady, withScript: true);
        runs.Seed(waiting);

        await Run(executor, waiting.Id);
        await Run(executor, "sr_missing");

        Assert.Equal(StoryRunStatus.ScriptReady, runs.Read(waiting.Id)!.Status);
        Assert.All(stages.Values, s => Assert.Equal(0, s.Calls));
        Assert.Equal(0, runs.Saves);
    }

    [Fact]
    public async Task Stopping_a_run_mid_stage_saves_it_as_cancelled_with_the_stage_pending()
    {
        using var stop = new CancellationTokenSource();
        var (executor, runs, _) = Make(s => s[StoryStageIds.Narration] = new ScriptedStage(StoryStageIds.Narration, async (_, ct) =>
        {
            await stop.CancelAsync();
            await Task.Delay(Timeout.Infinite, ct);
            return StoryStageOutcome.Completed();
        }));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id, userCancel: stop.Token);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Cancelled, saved.Status);
        Assert.True(saved.CancelRequested);
        var narration = saved.Stage(StoryStageIds.Narration);
        Assert.Equal(StoryStageStatus.Pending, narration.Status);
        Assert.Equal("Stopped.", narration.Message);
    }

    [Fact]
    public async Task A_server_shutdown_leaves_the_run_exactly_as_it_was_so_the_next_start_resumes_it()
    {
        using var shutdown = new CancellationTokenSource();
        var (executor, runs, _) = Make(s => s[StoryStageIds.Narration] = new ScriptedStage(StoryStageIds.Narration, async (_, ct) =>
        {
            await shutdown.CancelAsync();
            await Task.Delay(Timeout.Infinite, ct);
            return StoryStageOutcome.Completed();
        }));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id, shutdown: shutdown.Token);

        var saved = runs.Read(run.Id)!;
        Assert.Equal(StoryRunStatus.Building, saved.Status);
        Assert.False(saved.CancelRequested);
        Assert.Equal(StoryStageStatus.Running, saved.Stage(StoryStageIds.Narration).Status);
        Assert.True(saved.IsWorking);
    }

    [Fact]
    public async Task Progress_and_messages_a_stage_reports_are_saved_for_the_page_to_poll()
    {
        StoryRun? seenMidway = null;
        InMemoryStoryRuns? store = null;
        var (executor, runs, _) = Make(s => s[StoryStageIds.Visuals] = new ScriptedStage(StoryStageIds.Visuals, async (context, _) =>
        {
            await context.Report(40, "Picture 4 of 10");
            await context.Save();
            seenMidway = store!.Read(context.Run.Id);
            return StoryStageOutcome.Completed("Pictures ready.");
        }));
        store = runs;
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        Assert.NotNull(seenMidway);
        var visuals = seenMidway.Stage(StoryStageIds.Visuals);
        Assert.Equal(StoryStageStatus.Running, visuals.Status);
        Assert.Equal(40, visuals.Progress);
        Assert.Equal("Picture 4 of 10", visuals.Message);
        Assert.Equal("Pictures ready.", runs.Read(run.Id)!.Stage(StoryStageIds.Visuals).Message);
    }

    [Fact]
    public async Task A_stage_can_change_the_run_and_the_change_is_saved()
    {
        var (executor, runs, _) = Make(s => s[StoryStageIds.Assemble] = new ScriptedStage(StoryStageIds.Assemble, (context, _) =>
        {
            context.Run.ProjectId = "6a6ae3f1d0797d6459bdc65f";
            context.Run.SceneStarts = [0, 5.5, 11.2];
            return Task.FromResult(StoryStageOutcome.Completed());
        }));
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Equal("6a6ae3f1d0797d6459bdc65f", saved.ProjectId);
        Assert.Equal([0, 5.5, 11.2], saved.SceneStarts);
    }

    [Fact]
    public async Task A_retried_run_clears_the_earlier_error_when_its_stage_starts_again()
    {
        var (executor, runs, _) = Make();
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.ErrorCode = "no-speech-engine";
        run.ErrorMessage = "No speech engine is available.";
        runs.Seed(run);

        await Run(executor, run.Id);

        var saved = runs.Read(run.Id)!;
        Assert.Null(saved.ErrorCode);
        Assert.Null(saved.ErrorMessage);
        Assert.Equal(StoryRunStatus.Completed, saved.Status);
    }
}
