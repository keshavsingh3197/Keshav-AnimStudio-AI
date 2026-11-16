namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Spaces requests to one model so they never start closer together than a set interval.
/// </summary>
/// <remarks>
/// Google's preview models carry a requests-per-minute limit far below their daily one (Gemini TTS:
/// 10 a minute, 100 a day). A story speaks its scenes back to back, so without spacing the eleventh
/// line inside a minute gets a 429. The retry handler's sub-second backoff cannot outwait a
/// per-minute window, so the call fails and the narration stage stops. Spacing the calls is
/// cheaper than failing them: every failed call still counts toward this app's daily limit.
/// </remarks>
internal sealed class AiRequestPacer(TimeSpan spacing, TimeProvider? clock = null)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly TimeProvider _clock = clock ?? TimeProvider.System;
    private DateTimeOffset _nextStart = DateTimeOffset.MinValue;

    /// <summary>Waits until this caller may start its request, then reserves the next slot.</summary>
    public async Task WaitTurnAsync(CancellationToken ct)
    {
        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var wait = _nextStart - _clock.GetUtcNow();
            if (wait > TimeSpan.Zero)
                await Task.Delay(wait, _clock, ct).ConfigureAwait(false);

            _nextStart = _clock.GetUtcNow() + spacing;
        }
        finally
        {
            _gate.Release();
        }
    }
}
