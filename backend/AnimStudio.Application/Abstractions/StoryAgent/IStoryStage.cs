using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Abstractions.StoryAgent;

/// <summary>How a stage ended, when it ended without a failure (a failure is a <see cref="StoryStageException"/>).</summary>
public enum StoryStageResult
{
    /// <summary>The stage did its work; the next one starts.</summary>
    Completed = 0,

    /// <summary>The stage had nothing to do, or could not do it without stopping the run (no music key, no speech engine).</summary>
    Skipped = 1,

    /// <summary>The run waits for a person; <see cref="StoryStageOutcome.NextStatus"/> says for what.</summary>
    Paused = 2
}

public sealed record StoryStageOutcome(
    StoryStageResult Result,
    string? Message = null,
    string? Code = null,
    StoryRunStatus? NextStatus = null)
{
    public static StoryStageOutcome Completed(string? message = null) => new(StoryStageResult.Completed, message);

    public static StoryStageOutcome Skipped(string code, string message) => new(StoryStageResult.Skipped, message, code);

    public static StoryStageOutcome Paused(StoryRunStatus next, string message) => new(StoryStageResult.Paused, message, null, next);
}

/// <summary>What a stage is handed: the run to read and change, and the two ways to say where it has got to.</summary>
public sealed class StoryStageContext
{
    public required StoryRun Run { get; init; }

    /// <summary>
    /// Cancelled when the server is stopping, and only then. A stage that is cancelled while this is not has been stopped by the
    /// person, and should stop anything it started elsewhere (a render, say); one cancelled while it is should leave that running.
    /// </summary>
    public CancellationToken Shutdown { get; init; }

    /// <summary>
    /// Says how far the stage is (0-100) and what it is doing, in a sentence for the person watching. Saved
    /// at most a couple of times a second, so a stage can call it as often as it likes.
    /// </summary>
    public required Func<int, string?, Task> Report { get; init; }

    /// <summary>
    /// Saves the run now. A stage calls it after each piece of finished work (one scene's picture, one
    /// scene's narration) so a restart or a retry picks up from there and not from the start.
    /// </summary>
    public required Func<Task> Save { get; init; }
}

/// <summary>
/// One step in turning a title into a video. A stage must be safe to run again: when a run is retried or
/// resumed after a restart, a stage that already made some of its output finds it and carries on.
/// </summary>
public interface IStoryStage
{
    /// <summary>One of <see cref="StoryStageIds"/>.</summary>
    string Id { get; }

    /// <exception cref="StoryStageException">The stage cannot finish; the run fails with this code and message.</exception>
    Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct);
}

/// <summary>Why a stage stopped the run. The message is written for the person using the app.</summary>
public sealed class StoryStageException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>What happened to a run when it was asked to stop.</summary>
public enum StoryCancelResult
{
    /// <summary>No worker here has the run (it was waiting in the queue, or a previous process was running it); the caller records the cancellation.</summary>
    NotRunning = 0,

    /// <summary>A worker had the run and it has stopped; the worker saved its state.</summary>
    Stopped = 1,

    /// <summary>A worker has the run and is still stopping (an external program is finishing). Nothing should be written to the run yet.</summary>
    StillStopping = 2
}

/// <summary>
/// How the rest of the app asks the background worker to do something. Implemented by the worker itself.
/// </summary>
public interface IStoryRunQueue
{
    /// <summary>Wakes the worker for a run that has work to do. Asking twice for the same run is harmless.</summary>
    void Enqueue(string runId);

    /// <summary>
    /// Takes a run off the queue, or stops it if a worker has it, and waits up to <paramref name="wait"/> for the
    /// worker to let go. Only a run no worker holds may be written to by anyone else, which is why this waits.
    /// </summary>
    Task<StoryCancelResult> CancelAsync(string runId, TimeSpan wait, CancellationToken ct);
}
