using System.Collections.Concurrent;
using System.Threading.Channels;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Runs Story Agent runs in the background: a couple at a time, each in its own scope, each by the executor that saves it
/// as it goes. On start it picks up every run a previous process was in the middle of.
/// </summary>
/// <remarks>
/// <para>
/// A run is only ever worked on by one pass at a time. If a run is asked for again while it is still being worked on
/// (the person pressed Build the instant the last pass finished writing), the new request waits for the old pass to let
/// go and then reads the run afresh. And a run that is stopped, or deleted, is only touched by anyone else once the worker
/// has let go of it - which is why <see cref="CancelAsync"/> waits.
/// </para>
/// <para>This is also the <see cref="IStoryRunQueue"/> the rest of the app talks to.</para>
/// </remarks>
public sealed class StoryRunWorker(
    IServiceScopeFactory scopes,
    IOptionsMonitor<StoryAgentOptions> options,
    ILogger<StoryRunWorker> logger) : BackgroundService, IStoryRunQueue
{
    /// <summary>A narration conversion or a render keeps a CPU busy for minutes; more at once only makes each slower.</summary>
    private const int Concurrency = 2;

    private const int ResumeAttempts = 5;

    private readonly Channel<string> _queue = Channel.CreateUnbounded<string>();
    private readonly ConcurrentDictionary<string, byte> _waiting = new(StringComparer.Ordinal);
    private readonly Dictionary<string, ActivePass> _active = new(StringComparer.Ordinal);
    private readonly object _gate = new();

    private sealed class ActivePass
    {
        public CancellationTokenSource Cancel { get; } = new();
        public TaskCompletionSource Done { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    }

    public void Enqueue(string runId)
    {
        if (string.IsNullOrEmpty(runId) || !options.CurrentValue.Enabled) return;
        if (_waiting.TryAdd(runId, 0)) _queue.Writer.TryWrite(runId);
    }

    public async Task<StoryCancelResult> CancelAsync(string runId, TimeSpan wait, CancellationToken ct)
    {
        // Off the queue first, so a pass that has not started never will.
        _waiting.TryRemove(runId, out _);

        ActivePass? pass;
        lock (_gate) _active.TryGetValue(runId, out pass);
        if (pass is null) return StoryCancelResult.NotRunning;

        try
        {
            pass.Cancel.Cancel();
        }
        catch (ObjectDisposedException)
        {
            // The pass finished between looking it up and stopping it.
            return StoryCancelResult.Stopped;
        }

        try
        {
            await pass.Done.Task.WaitAsync(wait, ct).ConfigureAwait(false);
            return StoryCancelResult.Stopped;
        }
        catch (TimeoutException)
        {
            return StoryCancelResult.StillStopping;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.CurrentValue.Enabled)
        {
            logger.LogInformation("The Story Agent is switched off (StoryAgent:Enabled).");
            return;
        }

        var consumers = Enumerable.Range(0, Concurrency).Select(_ => Task.Run(() => ConsumeAsync(stoppingToken), CancellationToken.None)).ToList();
        await ResumeAsync(stoppingToken).ConfigureAwait(false);

        try
        {
            await Task.WhenAll(consumers).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Shutting down.
        }
    }

    /// <summary>Runs a previous process was in the middle of. The database may still be starting, so this tries a few times.</summary>
    private async Task ResumeAsync(CancellationToken stop)
    {
        for (var attempt = 1; attempt <= ResumeAttempts && !stop.IsCancellationRequested; attempt++)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var runs = await scope.ServiceProvider.GetRequiredService<IStoryRunRepository>().ListWorkingAsync(stop).ConfigureAwait(false);
                foreach (var run in runs) Enqueue(run.Id);
                if (runs.Count > 0) logger.LogInformation("Resuming {Count} Story Agent run(s) from before the restart.", runs.Count);
                return;
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning("Could not look for Story Agent runs to resume (attempt {Attempt}): {ErrorType}", attempt, ex.GetType().Name);
                try { await Task.Delay(TimeSpan.FromSeconds(5), stop).ConfigureAwait(false); }
                catch (OperationCanceledException) { return; }
            }
        }
    }

    private async Task ConsumeAsync(CancellationToken stop)
    {
        try
        {
            await foreach (var runId in _queue.Reader.ReadAllAsync(stop).ConfigureAwait(false))
            {
                // Taken off the queue by a cancel while it waited.
                if (!_waiting.TryRemove(runId, out _)) continue;

                var pass = await BeginAsync(runId, stop).ConfigureAwait(false);
                try
                {
                    using var scope = scopes.CreateScope();
                    await scope.ServiceProvider.GetRequiredService<StoryRunExecutor>()
                        .ExecuteAsync(runId, pass.Cancel.Token, stop).ConfigureAwait(false);
                    await ContinueSeriesAsync(scope.ServiceProvider, runId, stop).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    // Stopped, or the server is going down; the executor has saved what it should.
                }
                catch (Exception ex)
                {
                    // The run stays as it was last saved, and is resumed by the next start.
                    logger.LogError(ex, "Story run {RunId} could not be worked on.", runId);
                }
                finally
                {
                    lock (_gate) _active.Remove(runId);
                    pass.Done.TrySetResult();
                    pass.Cancel.Dispose();
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Shutting down.
        }
    }

    /// <summary>
    /// A finished part of a series set to go on by itself starts the next one. Never fails the pass: the part is finished
    /// whatever happens here, and the service notes on it why the next did not start.
    /// </summary>
    private async Task ContinueSeriesAsync(IServiceProvider services, string runId, CancellationToken stop)
    {
        try
        {
            await services.GetRequiredService<StorySeriesService>().ContinueIfDueAsync(runId, stop).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Story run {RunId}: the next part of its series could not be started.", runId);
        }
    }

    /// <summary>Claims the run for this pass, first waiting for any earlier pass over it to finish.</summary>
    private async Task<ActivePass> BeginAsync(string runId, CancellationToken stop)
    {
        while (true)
        {
            ActivePass? previous = null;
            ActivePass? mine = null;
            lock (_gate)
            {
                if (_active.TryGetValue(runId, out previous)) { /* wait below */ }
                else _active[runId] = mine = new ActivePass();
            }

            if (mine is not null) return mine;
            await previous!.Done.Task.WaitAsync(stop).ConfigureAwait(false);
        }
    }
}
