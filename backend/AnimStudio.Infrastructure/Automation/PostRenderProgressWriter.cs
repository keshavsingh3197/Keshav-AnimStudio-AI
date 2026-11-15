using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Persists live procedural-render progress onto an <see cref="AutomationPost"/> so the hub's poll can show a stage and
/// percent while the render request is still running. <see cref="Report"/> is called inline from the render thread, so it
/// only records the latest value; one background pump saves it, at most once per <see cref="MinInterval"/>, and always
/// writes the newest value last (a stage that arrives during a wait is never lost, only coalesced).
/// The post is mutated only by the pump until <see cref="StopAsync"/> returns, after which the caller owns it again.
/// </summary>
public sealed class PostRenderProgressWriter(
    AutomationPost post,
    Func<AutomationPost, CancellationToken, Task> save,
    TimeProvider clock,
    ILogger logger,
    CancellationToken ct) : IProgress<ProceduralRenderProgress>
{
    public static readonly TimeSpan MinInterval = TimeSpan.FromMilliseconds(800);

    private readonly object gate = new();
    private ProceduralRenderProgress? pending;
    private Task pump = Task.CompletedTask;
    private bool pumpRunning;
    private bool stopped;
    private int lastPercent = -1;
    private string? lastStage;

    public void Report(ProceduralRenderProgress value)
    {
        ArgumentNullException.ThrowIfNull(value);
        lock (gate)
        {
            if (stopped) return;
            pending = value;
            if (pumpRunning) return;
            pumpRunning = true;
            pump = Task.Run(PumpAsync, CancellationToken.None);
        }
    }

    /// <summary>Saves a progress value right away (caller's thread). Use only while no render is reporting.</summary>
    public async Task SaveNowAsync(int percent, string stage)
    {
        await StopPumpAsync(resume: true).ConfigureAwait(false);
        await WriteAsync(new ProceduralRenderProgress(percent, stage)).ConfigureAwait(false);
    }

    /// <summary>Drops any unsaved value and waits for an in-flight save to finish.</summary>
    public Task StopAsync() => StopPumpAsync(resume: false);

    private async Task StopPumpAsync(bool resume)
    {
        Task running;
        lock (gate)
        {
            stopped = true;
            pending = null;
            running = pump;
        }

        await running.ConfigureAwait(false);

        if (resume)
        {
            lock (gate) stopped = false;
        }
    }

    private async Task PumpAsync()
    {
        while (true)
        {
            ProceduralRenderProgress? next;
            lock (gate)
            {
                next = pending;
                pending = null;
                if (next is null || stopped)
                {
                    pumpRunning = false;
                    return;
                }
            }

            await WriteAsync(next).ConfigureAwait(false);

            try
            {
                await Task.Delay(MinInterval, clock, ct).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                lock (gate)
                {
                    pending = null;
                    pumpRunning = false;
                }
                return;
            }
        }
    }

    private async Task WriteAsync(ProceduralRenderProgress value)
    {
        // Never claim 100% from a progress tick; only the finished render sets that.
        var percent = Math.Clamp(value.Percent, 0, 99);
        if (percent == lastPercent && string.Equals(value.Stage, lastStage, StringComparison.Ordinal))
            return;

        lastPercent = percent;
        lastStage = value.Stage;
        post.StoryProgressPercent = percent;
        post.StoryStageSummary = value.Stage;
        post.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
        try
        {
            await save(post, ct).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // The render itself is being cancelled; its caller handles that.
        }
        catch (Exception ex)
        {
            // Progress is display-only: a failed save must not fail the render, but it is logged.
            logger.LogWarning(ex, "Could not save render progress for automation post {PostId}.", post.Id);
        }
    }
}
