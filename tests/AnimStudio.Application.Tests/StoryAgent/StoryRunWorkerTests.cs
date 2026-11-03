using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.StoryAgent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryRunWorkerTests : IAsyncLifetime
{
    private readonly InMemoryStoryRuns _runs = new();
    private readonly Dictionary<string, ScriptedStage> _stages = StoryStageIds.All.ToDictionary(id => id, id => new ScriptedStage(id), StringComparer.Ordinal);
    private readonly StoryAgentOptions _options = new();
    private ServiceProvider? _provider;
    private StoryRunWorker? _worker;

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (_worker is not null) await _worker.StopAsync(CancellationToken.None);
        if (_provider is not null) await _provider.DisposeAsync();
    }

    private StoryRunWorker Start(Action<Dictionary<string, ScriptedStage>>? configure = null)
    {
        configure?.Invoke(_stages);

        var services = new ServiceCollection();
        services.AddSingleton<IStoryRunRepository>(_runs);
        services.AddSingleton<TimeProvider>(TimeProvider.System);
        services.AddLogging();
        foreach (var stage in _stages.Values) services.AddSingleton<IStoryStage>(stage);
        services.AddScoped<StoryRunExecutor>();
        _provider = services.BuildServiceProvider();

        _worker = new StoryRunWorker(_provider.GetRequiredService<IServiceScopeFactory>(),
            new StaticOptionsMonitor<StoryAgentOptions>(_options), NullLogger<StoryRunWorker>.Instance);
        return _worker;
    }

    private static async Task Eventually(Func<bool> condition, string because)
    {
        var until = DateTime.UtcNow.AddSeconds(10);
        while (!condition())
        {
            if (DateTime.UtcNow > until) Assert.Fail($"Timed out waiting for: {because}");
            await Task.Delay(20);
        }
    }

    [Fact]
    public async Task An_enqueued_run_is_worked_on_until_it_waits_for_the_person()
    {
        var worker = Start();
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);

        worker.Enqueue(run.Id);

        await Eventually(() => _runs.Read(run.Id)!.Status == StoryRunStatus.ScriptReady, "the run to reach ScriptReady");
        Assert.Equal(1, _stages[StoryStageIds.Research].Calls);
        Assert.Equal(1, _stages[StoryStageIds.Script].Calls);
    }

    [Fact]
    public async Task Asking_for_the_same_run_twice_works_on_it_once()
    {
        var worker = Start();
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);

        worker.Enqueue(run.Id);
        worker.Enqueue(run.Id);
        worker.Enqueue(run.Id);

        await Eventually(() => _runs.Read(run.Id)!.Status == StoryRunStatus.ScriptReady, "the run to reach ScriptReady");
        await Task.Delay(150);
        Assert.Equal(1, _stages[StoryStageIds.Research].Calls);
    }

    [Fact]
    public async Task Runs_a_previous_process_was_in_the_middle_of_are_picked_up_at_start()
    {
        var worker = Start();
        var interrupted = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        interrupted.Stage(StoryStageIds.Visuals).Status = StoryStageStatus.Running;
        var waiting = StoryTestData.Run(StoryRunStatus.ScriptReady, withScript: true);
        _runs.Seed(interrupted);
        _runs.Seed(waiting);

        await worker.StartAsync(CancellationToken.None);

        await Eventually(() => _runs.Read(interrupted.Id)!.Status == StoryRunStatus.Completed, "the interrupted run to complete");
        Assert.Equal(StoryRunStatus.ScriptReady, _runs.Read(waiting.Id)!.Status);
        Assert.Equal(1, _stages[StoryStageIds.Visuals].Calls);
    }

    [Fact]
    public async Task Stopping_a_run_that_is_working_stops_it_waits_for_it_and_the_run_is_saved_as_cancelled()
    {
        var started = new TaskCompletionSource();
        var worker = Start(stages => stages[StoryStageIds.Research] = new ScriptedStage(StoryStageIds.Research, async (_, ct) =>
        {
            started.TrySetResult();
            await Task.Delay(Timeout.Infinite, ct);
            return StoryStageOutcome.Completed();
        }));
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);
        worker.Enqueue(run.Id);
        await started.Task.WaitAsync(TimeSpan.FromSeconds(10));

        var result = await worker.CancelAsync(run.Id, TimeSpan.FromSeconds(10), CancellationToken.None);

        Assert.Equal(StoryCancelResult.Stopped, result);
        Assert.Equal(StoryRunStatus.Cancelled, _runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_stage_that_will_not_stop_in_time_is_reported_as_still_stopping_and_the_run_is_left_alone()
    {
        var started = new TaskCompletionSource();
        var release = new TaskCompletionSource();
        var worker = Start(stages => stages[StoryStageIds.Research] = new ScriptedStage(StoryStageIds.Research, async (_, _) =>
        {
            started.TrySetResult();
            await release.Task;
            return StoryStageOutcome.Completed();
        }));
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);
        worker.Enqueue(run.Id);
        await started.Task.WaitAsync(TimeSpan.FromSeconds(10));

        var result = await worker.CancelAsync(run.Id, TimeSpan.FromMilliseconds(150), CancellationToken.None);

        Assert.Equal(StoryCancelResult.StillStopping, result);
        Assert.Equal(StoryRunStatus.Researching, _runs.Read(run.Id)!.Status);
        release.SetResult();
        await Eventually(() => _runs.Read(run.Id)!.Status != StoryRunStatus.Researching, "the stubborn stage to finish");
    }

    [Fact]
    public async Task A_run_nobody_has_is_not_running_and_one_still_waiting_in_the_queue_is_taken_off_it()
    {
        var worker = Start();

        // Not started yet, so nothing consumes the queue: the run is waiting.
        var run = StoryTestData.Run();
        _runs.Seed(run);
        worker.Enqueue(run.Id);

        var result = await worker.CancelAsync(run.Id, TimeSpan.FromSeconds(1), CancellationToken.None);
        var stranger = await worker.CancelAsync("sr_unknown", TimeSpan.FromSeconds(1), CancellationToken.None);

        // What the service does next when no worker held the run: it records the cancellation itself.
        run.Status = StoryRunStatus.Cancelled;
        _runs.Seed(run);
        await worker.StartAsync(CancellationToken.None);
        await Task.Delay(200);

        Assert.Equal(StoryCancelResult.NotRunning, result);
        Assert.Equal(StoryCancelResult.NotRunning, stranger);
        Assert.Equal(0, _stages[StoryStageIds.Research].Calls);
        Assert.Equal(StoryRunStatus.Cancelled, _runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_run_asked_for_again_while_its_last_pass_is_finishing_is_worked_on_afterwards_from_its_new_state()
    {
        var passes = 0;
        var firstPassInside = new TaskCompletionSource();
        var releaseFirstPass = new TaskCompletionSource();
        var worker = Start(stages => stages[StoryStageIds.Script] = new ScriptedStage(StoryStageIds.Script, async (_, _) =>
        {
            if (Interlocked.Increment(ref passes) == 1)
            {
                firstPassInside.TrySetResult();
                await releaseFirstPass.Task;
            }

            return StoryStageOutcome.Completed();
        }));
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);
        worker.Enqueue(run.Id);
        await firstPassInside.Task.WaitAsync(TimeSpan.FromSeconds(10));

        // The person's next step arrives (here: the run is told to go on building) while the first pass is still on it.
        worker.Enqueue(run.Id);
        releaseFirstPass.SetResult();

        await Eventually(() => _runs.Read(run.Id)!.Status == StoryRunStatus.ScriptReady, "the first pass to finish");
        var saved = _runs.Read(run.Id)!;
        saved.Status = StoryRunStatus.Building;
        _runs.Seed(saved);
        worker.Enqueue(run.Id);

        await Eventually(() => _runs.Read(run.Id)!.Status == StoryRunStatus.Completed, "the second pass to complete the run");
        Assert.Equal(1, _stages[StoryStageIds.Research].Calls);
    }

    [Fact]
    public async Task A_switched_off_agent_runs_nothing_and_ignores_the_queue()
    {
        _options.Enabled = false;
        var worker = Start();
        await worker.StartAsync(CancellationToken.None);
        var run = StoryTestData.Run();
        _runs.Seed(run);

        worker.Enqueue(run.Id);
        await Task.Delay(200);

        Assert.Equal(StoryRunStatus.Researching, _runs.Read(run.Id)!.Status);
        Assert.Equal(0, _stages[StoryStageIds.Research].Calls);
    }

    [Fact]
    public async Task Two_runs_are_worked_on_at_once_and_a_failing_run_does_not_stop_the_others()
    {
        var bothInside = new CountdownEvent(2);
        var worker = Start(stages => stages[StoryStageIds.Research] = new ScriptedStage(StoryStageIds.Research, async (context, _) =>
        {
            if (context.Run.Title == "boom") throw new InvalidOperationException("boom");
            bothInside.Signal();
            await Task.Run(() => bothInside.Wait(TimeSpan.FromSeconds(10)));
            return StoryStageOutcome.Completed();
        }));
        await worker.StartAsync(CancellationToken.None);
        var a = StoryTestData.Run();
        var b = StoryTestData.Run();
        var bad = StoryTestData.Run();
        bad.Title = "boom";
        _runs.Seed(a);
        _runs.Seed(b);
        _runs.Seed(bad);

        worker.Enqueue(bad.Id);
        worker.Enqueue(a.Id);
        worker.Enqueue(b.Id);

        await Eventually(() => _runs.Read(a.Id)!.Status == StoryRunStatus.ScriptReady && _runs.Read(b.Id)!.Status == StoryRunStatus.ScriptReady, "both good runs to finish");
        Assert.Equal(StoryRunStatus.Failed, _runs.Read(bad.Id)!.Status);
    }
}
