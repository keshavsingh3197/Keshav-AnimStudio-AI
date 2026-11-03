using System.Diagnostics;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Drives one run through its stages, saving after each, and decides where it goes next: the planning stages
/// (research, script) up to the point the person reads the script, then the building stages up to the finished video.
/// </summary>
/// <remarks>
/// <para>
/// While a run is being worked on, this is the only thing that writes it. Everyone else (the API, the browser's
/// polling) reads, or asks the worker to stop it first, which is what keeps two writers from overwriting each other.
/// </para>
/// <para>
/// A stage that finished is never run again, so a run that was interrupted (a restart, a retry after a failure)
/// carries on from where it stopped. A stage that was <em>running</em> when the process died is run again from its
/// start, which is why every stage is written to find its own earlier output.
/// </para>
/// </remarks>
public sealed class StoryRunExecutor(
    IStoryRunRepository runs,
    IEnumerable<IStoryStage> stages,
    TimeProvider clock,
    ILogger<StoryRunExecutor> logger)
{
    private static readonly TimeSpan SaveInterval = TimeSpan.FromMilliseconds(500);

    /// <param name="runId">The run to work on.</param>
    /// <param name="userCancel">Cancelled when the person stops the run. The run is saved as Cancelled.</param>
    /// <param name="shutdown">Cancelled when the server is stopping. The run is left as it is, to be resumed by the next start.</param>
    public async Task ExecuteAsync(string runId, CancellationToken userCancel, CancellationToken shutdown)
    {
        var run = await runs.GetAsync(runId, shutdown).ConfigureAwait(false);
        if (run is null || !run.IsWorking) return;

        var byId = stages.ToDictionary(s => s.Id, StringComparer.Ordinal);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(userCancel, shutdown);
        var ct = linked.Token;

        StoryStageState? current = null;
        long lastSave = 0;

        async Task SaveAsync(bool force)
        {
            var now = Stopwatch.GetTimestamp();
            if (!force && Stopwatch.GetElapsedTime(lastSave, now) < SaveInterval) return;

            lastSave = now;
            run.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;

            // Not the run's token: the last word about a stopped run still has to be written.
            await runs.UpsertAsync(run, CancellationToken.None).ConfigureAwait(false);
        }

        var context = new StoryStageContext
        {
            Run = run,
            Shutdown = shutdown,
            Report = async (percent, message) =>
            {
                if (current is null) return;
                current.Progress = Math.Clamp(percent, 0, 100);
                if (message is not null) current.Message = message;
                await SaveAsync(false).ConfigureAwait(false);
            },
            Save = () => SaveAsync(true)
        };

        try
        {
            while (true)
            {
                ct.ThrowIfCancellationRequested();

                var sequence = run.Status == StoryRunStatus.Building ? StoryStageIds.Building : StoryStageIds.Planning;
                var nextId = sequence.FirstOrDefault(id => !IsDone(run.Stage(id)));

                if (nextId is null)
                {
                    if (run.Status == StoryRunStatus.Building)
                    {
                        run.Status = StoryRunStatus.Completed;
                        await SaveAsync(true).ConfigureAwait(false);
                        logger.LogInformation("Story run {RunId} finished.", run.Id);
                        return;
                    }

                    // Research and script are done: a script exists. Either the person reads it first, or the run goes on.
                    run.Status = run.Options.AutoApprove ? StoryRunStatus.Building : StoryRunStatus.ScriptReady;
                    await SaveAsync(true).ConfigureAwait(false);
                    if (run.Status == StoryRunStatus.ScriptReady) return;
                    continue;
                }

                var stage = byId.GetValueOrDefault(nextId)
                    ?? throw new InvalidOperationException($"No stage is registered for '{nextId}'.");
                var state = run.Stage(nextId);
                current = state;
                Begin(run, state, nextId);
                await SaveAsync(true).ConfigureAwait(false);

                StoryStageOutcome outcome;
                try
                {
                    outcome = await stage.RunAsync(context, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (StoryStageException ex)
                {
                    Fail(run, state, ex.Code, ex.Message);
                    await SaveAsync(true).ConfigureAwait(false);
                    logger.LogWarning("Story run {RunId} stopped in the {Stage} stage: {Code}", run.Id, nextId, ex.Code);
                    return;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Story run {RunId}: the {Stage} stage failed unexpectedly.", run.Id, nextId);
                    Fail(run, state, "internal-error",
                        "That step stopped unexpectedly. Try again; if it keeps happening, the server log has the details.");
                    await SaveAsync(true).ConfigureAwait(false);
                    return;
                }

                if (outcome.Result == StoryStageResult.Paused)
                {
                    state.Status = StoryStageStatus.Pending;
                    state.Message = outcome.Message;
                    run.Status = outcome.NextStatus ?? StoryRunStatus.AwaitingScript;
                    await SaveAsync(true).ConfigureAwait(false);
                    return;
                }

                state.Status = outcome.Result == StoryStageResult.Skipped ? StoryStageStatus.Skipped : StoryStageStatus.Completed;
                state.Progress = 100;
                state.CompletedAtUtc = clock.GetUtcNow().UtcDateTime;
                state.Message = outcome.Message ?? state.Message;
                state.Code = outcome.Code;
                await SaveAsync(true).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            // A restart: leave the run as it is, so the next start resumes it.
            if (shutdown.IsCancellationRequested) return;

            // The person stopped it.
            if (current is { Status: StoryStageStatus.Running })
            {
                current.Status = StoryStageStatus.Pending;
                current.Message = "Stopped.";
            }

            run.Status = StoryRunStatus.Cancelled;
            run.CancelRequested = true;
            await SaveAsync(true).ConfigureAwait(false);
            logger.LogInformation("Story run {RunId} was cancelled.", run.Id);
        }
    }

    private static bool IsDone(StoryStageState state) =>
        state.Status is StoryStageStatus.Completed or StoryStageStatus.Skipped;

    private void Begin(StoryRun run, StoryStageState state, string id)
    {
        state.Status = StoryStageStatus.Running;
        state.StartedAtUtc = clock.GetUtcNow().UtcDateTime;
        state.CompletedAtUtc = null;
        state.Progress = 0;
        state.Message = null;
        state.Code = null;

        run.ErrorCode = null;
        run.ErrorMessage = null;
        run.Status = id switch
        {
            StoryStageIds.Research => StoryRunStatus.Researching,
            StoryStageIds.Script => StoryRunStatus.WritingScript,
            _ => StoryRunStatus.Building
        };
    }

    private void Fail(StoryRun run, StoryStageState state, string code, string message)
    {
        state.Status = StoryStageStatus.Failed;
        state.Code = code;
        state.Message = message;
        state.CompletedAtUtc = clock.GetUtcNow().UtcDateTime;

        run.Status = StoryRunStatus.Failed;
        run.ErrorCode = code;
        run.ErrorMessage = message;
    }
}
