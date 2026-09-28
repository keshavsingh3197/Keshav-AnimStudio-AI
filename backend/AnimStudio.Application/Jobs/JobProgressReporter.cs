using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Jobs;

/// <summary>
/// Buffers render progress and flushes it to the database on a timer.
/// <para>
/// <see cref="Report"/> only stores into a field - it never awaits the database. That
/// matters because it is called from the loop draining ffmpeg's stdout: if it blocked on a
/// slow write, the pipe would fill and the encode would stall. A background timer does the
/// actual flushing, at roughly one write every two seconds instead of one per frame.
/// </para>
/// <para>
/// Each flush also renews the lease and reads back cancellation, so the worker learns that
/// the user cancelled - or that it lost its lease - without any extra query.
/// </para>
/// </summary>
public sealed class JobProgressReporter : IProgress<RenderProgress>, IAsyncDisposable
{
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);

    /// <summary>Forces a write on a slow scene, which keeps the lease alive.</summary>
    private static readonly TimeSpan MaxSilence = TimeSpan.FromSeconds(15);

    private readonly IRenderJobRepository _repository;
    private readonly RenderProgressAggregator _aggregator;
    private readonly string _jobId;
    private readonly string _leaseOwner;
    private readonly TimeSpan _leaseDuration;
    private readonly int _sceneCount;
    private readonly ILogger _logger;
    private readonly TimeProvider _clock;

    private readonly CancellationTokenSource _abort = new();
    private readonly Task _pump;
    private readonly Lock _gate = new();

    private RenderProgress? _latest;
    private int _lastWrittenPercent = -1;
    private RenderStage _lastWrittenStage = RenderStage.None;
    private int _lastWrittenScene = -1;
    private DateTimeOffset _lastWriteAt = DateTimeOffset.MinValue;
    private int _scenesDone;
    private readonly int[] _sceneFrames;

    public JobProgressReporter(
        IRenderJobRepository repository, RenderProgressAggregator aggregator,
        string jobId, string leaseOwner, TimeSpan leaseDuration, int sceneCount,
        TimeProvider clock, ILogger logger)
    {
        _repository = repository;
        _aggregator = aggregator;
        _jobId = jobId;
        _leaseOwner = leaseOwner;
        _leaseDuration = leaseDuration;
        _sceneCount = sceneCount;
        _clock = clock;
        _logger = logger;
        _sceneFrames = new int[sceneCount];

        _pump = PumpAsync();
    }

    /// <summary>Cancelled when the user asks to cancel, or when the lease is lost.</summary>
    public CancellationToken AbortToken => _abort.Token;

    public bool CancelRequested { get; private set; }
    public bool LeaseLost { get; private set; }

    /// <summary>
    /// How far the job actually got, for the failure record.
    /// <para>
    /// These exist because a terminal write REPLACES the job document with the caller's
    /// in-memory copy, and that copy still holds the values the job was claimed with. So a
    /// job that failed while merging clip twenty was recorded as "Preparing, 0 of 24" -
    /// which reads as a failure before anything happened and sends whoever is diagnosing it
    /// to the wrong end of the pipeline. Reading the live values back from here and copying
    /// them onto the job first keeps the record honest.
    /// </para>
    /// </summary>
    public RenderStage LastStage
    {
        get { lock (_gate) return _lastWrittenStage; }
    }

    /// <summary>The last percentage written, or 0 if nothing has been written yet.</summary>
    public int LastPercent
    {
        get { lock (_gate) return Math.Max(_lastWrittenPercent, 0); }
    }

    /// <summary>How many items finished, as last reported by the orchestrator.</summary>
    public int ItemsDone
    {
        get { lock (_gate) return _scenesDone; }
    }

    public void SceneCompleted(int scenesDone)
    {
        lock (_gate) _scenesDone = scenesDone;
    }

    /// <summary>Never blocks: the renderer's output loop must not wait on the database.</summary>
    public void Report(RenderProgress value)
    {
        lock (_gate)
        {
            _latest = value;
            if (value.Stage == RenderStage.RenderingScene && value.SceneIndex >= 0 && value.SceneIndex < _sceneCount)
            {
                _sceneFrames[value.SceneIndex] = Math.Max(_sceneFrames[value.SceneIndex], value.StageFramesDone.Value);
            }
        }
    }

    private async Task PumpAsync()
    {
        using var timer = new PeriodicTimer(FlushInterval, _clock);

        try
        {
            while (await timer.WaitForNextTickAsync(_abort.Token).ConfigureAwait(false))
                await FlushAsync(force: false, _abort.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Shutting down.
        }
    }

    private async Task FlushAsync(bool force, CancellationToken ct)
    {
        RenderProgress? snapshot;
        int scenesDone;
        RenderStage writtenStage;
        int writtenScene;
        int writtenPercent;
        DateTimeOffset writtenAt;
        int totalSceneFrames;
        lock (_gate)
        {
            snapshot = _latest;
            scenesDone = _scenesDone;
            writtenStage = _lastWrittenStage;
            writtenScene = _lastWrittenScene;
            writtenPercent = _lastWrittenPercent;
            writtenAt = _lastWriteAt;
            totalSceneFrames = _sceneFrames.Sum();
        }

        if (snapshot is null) return;

        var computedPercent = _aggregator.Percent(
            snapshot.Stage, snapshot.SceneIndex, snapshot.StageFramesDone, totalSceneFrames);
        // Ensure percent is strictly monotonic non-decreasing so progress bar never fluctuates backwards
        var percent = Math.Max(writtenPercent, computedPercent);
        var now = _clock.GetUtcNow();

        // A stage or scene change is always worth writing immediately; otherwise wait for
        // a whole percentage point, or for the silence window to force a heartbeat.
        var stageChanged = snapshot.Stage != writtenStage || snapshot.SceneIndex != writtenScene;
        var movedEnough = Math.Abs(percent - writtenPercent) >= 1;
        var silentTooLong = now - writtenAt >= MaxSilence;

        if (!force && !stageChanged && !movedEnough && !silentTooLong) return;

        var message = _aggregator.Message(snapshot.Stage, snapshot.SceneIndex, _sceneCount);

        try
        {
            var result = await _repository.ReportProgressAsync(
                _jobId, _leaseOwner, percent, message, snapshot.Stage, scenesDone,
                _leaseDuration, ct).ConfigureAwait(false);

            // Under the gate because the failure path reads these from the orchestrator's
            // thread to write an honest terminal record.
            lock (_gate)
            {
                _lastWrittenPercent = percent;
                _lastWrittenStage = snapshot.Stage;
                _lastWrittenScene = snapshot.SceneIndex;
                _lastWriteAt = now;
            }

            if (!result.LeaseHeld)
            {
                // Another worker took over; stop before two processes write the same output.
                LeaseLost = true;
                _logger.LogWarning("Job {JobId} lost its lease; aborting.", _jobId);
                await _abort.CancelAsync().ConfigureAwait(false);
            }
            else if (result.CancelRequested && !CancelRequested)
            {
                CancelRequested = true;
                _logger.LogInformation("Job {JobId} was cancelled by the user.", _jobId);
                await _abort.CancelAsync().ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            // Expected during shutdown.
        }
        catch (Exception ex)
        {
            // A failed progress write must not fail the render.
            _logger.LogWarning(ex, "Could not write progress for job {JobId}.", _jobId);
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _abort.CancelAsync().ConfigureAwait(false);

        try
        {
            await _pump.ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Expected.
        }

        _abort.Dispose();
    }
}
