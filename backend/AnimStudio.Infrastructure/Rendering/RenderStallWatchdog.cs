namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Cancels a render only when it stops making progress, never because it is merely slow. Every frame handed to FFmpeg
/// and every line FFmpeg prints counts as progress; if none arrives for <see cref="Limit"/>, <see cref="Token"/> is
/// cancelled and <see cref="Stalled"/> becomes true. A long video on a slow machine therefore always finishes, while a
/// hung FFmpeg or a stuck frame is still stopped instead of holding the job forever.
/// </summary>
internal sealed class RenderStallWatchdog : IDisposable
{
    private readonly TimeProvider _time;
    private readonly CancellationTokenSource _cts;
    private readonly ITimer _timer;
    private long _lastProgress;
    private int _stalled;

    public RenderStallWatchdog(TimeSpan limit, CancellationToken outer, TimeProvider? time = null)
    {
        if (limit <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(limit), "The stall limit must be positive.");
        Limit = limit;
        _time = time ?? TimeProvider.System;
        _cts = CancellationTokenSource.CreateLinkedTokenSource(outer);
        _lastProgress = _time.GetTimestamp();

        // Check a few times per limit so a stall is caught within about a quarter of the limit.
        var period = TimeSpan.FromTicks(Math.Clamp(limit.Ticks / 4, TimeSpan.TicksPerMillisecond * 10, TimeSpan.TicksPerSecond * 5));
        _timer = _time.CreateTimer(_ => Check(), null, period, period);
    }

    public TimeSpan Limit { get; }

    /// <summary>Cancelled when the caller cancels or when progress stops for <see cref="Limit"/>.</summary>
    public CancellationToken Token => _cts.Token;

    /// <summary>True once the watchdog itself (not the caller) cancelled the render.</summary>
    public bool Stalled => Volatile.Read(ref _stalled) == 1;

    /// <summary>Records progress; thread-safe and cheap enough to call per frame.</summary>
    public void Touch() => Interlocked.Exchange(ref _lastProgress, _time.GetTimestamp());

    private void Check()
    {
        if (_cts.IsCancellationRequested) return;
        if (_time.GetElapsedTime(Interlocked.Read(ref _lastProgress)) < Limit) return;

        Volatile.Write(ref _stalled, 1);
        try
        {
            _cts.Cancel();
        }
        catch (ObjectDisposedException)
        {
            // The render finished between the check and the cancel; nothing left to stop.
        }
    }

    public void Dispose()
    {
        _timer.Dispose();
        _cts.Dispose();
    }
}
