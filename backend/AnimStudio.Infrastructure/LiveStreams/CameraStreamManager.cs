using System.Collections.Concurrent;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.Errors;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.LiveStreams;

/// <summary>Saved-key bookkeeping the camera streams share with playlist streams.</summary>
public interface ILiveStreamKeyLookup
{
    Task<(string? Key, string? Fingerprint, LiveStreamKeyState State)> GetKeyAsync(string channelId, string destinationId, CancellationToken ct);
    Task MarkUsedAsync(string channelId, string destinationId, string fingerprint);
    Task MarkRejectedAsync(string channelId, string destinationId, string fingerprint);
}

/// <summary>Reads saved keys through a fresh scope, because the store is scoped and the manager is not.</summary>
public sealed class ScopedLiveStreamKeyLookup(IServiceScopeFactory scopes, ILogger<ScopedLiveStreamKeyLookup> logger) : ILiveStreamKeyLookup
{
    public async Task<(string? Key, string? Fingerprint, LiveStreamKeyState State)> GetKeyAsync(string channelId, string destinationId, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<LiveStreamKeyStore>().GetKeyAsync(channelId, destinationId, ct).ConfigureAwait(false);
    }

    public Task MarkUsedAsync(string channelId, string destinationId, string fingerprint) =>
        QuietlyAsync(store => store.MarkUsedAsync(channelId, destinationId, fingerprint, CancellationToken.None));

    public Task MarkRejectedAsync(string channelId, string destinationId, string fingerprint) =>
        QuietlyAsync(store => store.MarkRejectedAsync(channelId, destinationId, fingerprint, CancellationToken.None));

    private async Task QuietlyAsync(Func<LiveStreamKeyStore, Task> action)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            await action(scope.ServiceProvider.GetRequiredService<LiveStreamKeyStore>()).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Bookkeeping only; a stream's outcome never hinges on it.
            logger.LogWarning("Could not update a saved stream key's status: {ErrorType}", ex.GetType().Name);
        }
    }
}

public enum CameraStartOutcome { Started, Disabled, UnknownDestination, AlreadyStreaming, Busy, KeyProblem, FfmpegMissing }

public sealed record CameraStartResult(CameraStartOutcome Outcome, CameraStreamStatus? Status = null, string? Message = null);

public sealed record CameraChunkResult(CameraChunkOutcome Outcome, CameraStreamStatus? Status);

/// <summary>
/// Runs live streams from the browser's camera or screen. The page draws the picture -
/// identity masks, overlays, scenes - records it with MediaRecorder and sends the
/// recording here in numbered chunks; the server encodes it for the ingest as it arrives.
/// <para>
/// The privacy work happens in the browser on purpose: the unmasked camera picture never
/// leaves the presenter's machine, so nothing on this server could leak it.
/// </para>
/// <para>
/// A recording can't be resumed half-way (its header is only in the first chunk), so when
/// the connection to the ingest drops the encoder is restarted under a new
/// <i>generation</i> and the page is asked to start a fresh recording. Chunks are written
/// strictly in order; a retried chunk is acknowledged without being written twice.
/// </para>
/// <para>
/// Like playlist streams, camera streams live in memory only. The stream key is held only
/// while its stream runs, and is never logged or returned.
/// </para>
/// </summary>
public sealed class CameraStreamManager(
    IFfmpegPipeFactory pipes,
    ILiveStreamKeyLookup keys,
    IOptions<LiveStreamOptions> options,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<CameraStreamManager> logger) : IHostedService, IDisposable
{
    private static readonly TimeSpan[] ReconnectDelays =
        [TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(20)];

    /// <summary>How long a chunk for a restarting encoder waits for it before the page is told to try again.</summary>
    private static readonly TimeSpan PipeWait = TimeSpan.FromSeconds(30);

    private readonly LiveStreamOptions _options = options.Value;
    private readonly CameraStreamOptions _camera = options.Value.Camera;
    private readonly ConcurrentDictionary<string, Session> _sessions = new(StringComparer.Ordinal);
    private readonly object _gate = new();
    private readonly CancellationTokenSource _shutdown = new();
    private ITimer? _watchdog;

    public bool Enabled => _camera.Enabled;
    public int MaxConcurrent => Math.Max(1, _camera.MaxConcurrent);
    public int MaxChunkBytes => Math.Clamp(_camera.MaxChunkBytes, 64 * 1024, 64 * 1024 * 1024);
    public TimeSpan IdleTimeout => TimeSpan.FromSeconds(Math.Clamp(_camera.IdleTimeoutSeconds, 5, 300));

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _watchdog = clock.CreateTimer(_ => Sweep(), null, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await _shutdown.CancelAsync().ConfigureAwait(false);
        var running = _sessions.Values.Where(s => s.IsActive).ToList();
        foreach (var session in running) session.RequestEnd(CameraStreamState.Stopped, "Stopped because the server is shutting down.");

        try
        {
            await Task.WhenAll(running.Select(s => s.Monitor ?? Task.CompletedTask))
                .WaitAsync(TimeSpan.FromSeconds(10), cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is TimeoutException or OperationCanceledException)
        {
            logger.LogWarning("Camera streams did not all stop within the shutdown window");
        }
    }

    public void Dispose()
    {
        _watchdog?.Dispose();
        _shutdown.Dispose();
    }

    /// <summary>
    /// Starts the encoder and returns at once; the stream goes live when the first chunks
    /// reach the ingest. The destination must already be checked against the configured list.
    /// </summary>
    public async Task<CameraStartResult> StartStreamAsync(
        string ownerUserId, CameraStreamSettings settings, LiveStreamDestinationOptions destination,
        LiveStreamKeyTarget target, CancellationToken ct)
    {
        if (!Enabled) return new CameraStartResult(CameraStartOutcome.Disabled);

        lock (_gate)
        {
            Purge();
            if (_sessions.Values.Any(s => s.IsActive && Owns(s, ownerUserId)))
                return new CameraStartResult(CameraStartOutcome.AlreadyStreaming);
            if (_sessions.Values.Count(s => s.IsActive) >= MaxConcurrent)
                return new CameraStartResult(CameraStartOutcome.Busy);
        }

        var (key, fingerprint, problem) = await ResolveKeyAsync(target, settings.Destination, ct).ConfigureAwait(false);
        if (key is null) return new CameraStartResult(CameraStartOutcome.KeyProblem, Message: problem);

        Session session;
        lock (_gate)
        {
            // Checked again: another start may have taken the last slot while the key was read.
            if (_sessions.Values.Any(s => s.IsActive && Owns(s, ownerUserId)))
                return new CameraStartResult(CameraStartOutcome.AlreadyStreaming);
            if (_sessions.Values.Count(s => s.IsActive) >= MaxConcurrent)
                return new CameraStartResult(CameraStartOutcome.Busy);

            session = new Session(Guid.NewGuid().ToString("n"), ownerUserId, settings, destination, target, key, fingerprint, clock);
            _sessions[session.Id] = session;
        }

        try
        {
            Launch(session);
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            _sessions.TryRemove(session.Id, out _);
            session.ForgetKey();
            return new CameraStartResult(CameraStartOutcome.FfmpegMissing, Message: ex.UserMessage);
        }

        logger.LogInformation(
            "Camera stream {StreamId} started for user {UserId} to {Destination} ({Quality}, {Orientation}, {Container})",
            session.Id, ownerUserId, settings.Destination, settings.Quality, settings.Orientation, settings.Container);

        session.Monitor = Task.Run(() => MonitorAsync(session));
        return new CameraStartResult(CameraStartOutcome.Started, session.Snapshot());
    }

    public CameraStreamStatus? Get(string id, string userId) => Owned(id, userId)?.Snapshot();

    public IReadOnlyList<CameraStreamStatus> List(string userId)
    {
        lock (_gate) Purge();
        return _sessions.Values.Where(s => Owns(s, userId)).OrderByDescending(s => s.CreatedAt).Select(s => s.Snapshot()).ToList();
    }

    /// <summary>Ends the stream after what was already sent has gone out.</summary>
    public CameraStreamStatus? Stop(string id, string userId)
    {
        var session = Owned(id, userId);
        if (session is null) return null;

        if (session.IsActive)
        {
            session.RequestEnd(CameraStreamState.Stopped, "Stopped. End the stream in YouTube Studio if it hasn't ended on its own.");
            logger.LogInformation("Camera stream {StreamId} stop requested by user {UserId}", id, userId);
        }

        return session.Snapshot();
    }

    /// <summary>
    /// Writes one chunk of the recording to the encoder. Chunks must arrive in order within
    /// their generation; the first chunk of each generation must start like its container.
    /// </summary>
    public async Task<CameraChunkResult> AppendAsync(
        string id, string userId, int generation, long sequence, ReadOnlyMemory<byte> chunk, CancellationToken ct)
    {
        var session = Owned(id, userId);
        if (session is null) return new CameraChunkResult(CameraChunkOutcome.NotFound, null);
        if (chunk.Length > MaxChunkBytes) return new CameraChunkResult(CameraChunkOutcome.TooLarge, session.Snapshot());

        await session.WriteGate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (!session.IsActive || session.EndRequested)
                return new CameraChunkResult(CameraChunkOutcome.Ended, session.Snapshot());

            if (generation != session.Generation)
                return new CameraChunkResult(CameraChunkOutcome.RestartRecording, session.Snapshot());

            if (sequence < session.NextSequence)
                return new CameraChunkResult(CameraChunkOutcome.Duplicate, session.Snapshot());
            if (sequence > session.NextSequence)
                return new CameraChunkResult(CameraChunkOutcome.OutOfOrder, session.Snapshot());

            if (sequence == 0 && !CameraStreamValidator.StartsLike(session.Settings.Container, chunk.Span))
            {
                logger.LogWarning("Camera stream {StreamId} refused a recording that isn't {Container}", session.Id, session.Settings.Container);
                return new CameraChunkResult(CameraChunkOutcome.NotMedia, session.Snapshot());
            }

            var pipe = await session.WaitForPipeAsync(generation, PipeWait, ct).ConfigureAwait(false);
            if (pipe is null)
            {
                return new CameraChunkResult(
                    session.IsActive ? CameraChunkOutcome.RestartRecording : CameraChunkOutcome.Ended, session.Snapshot());
            }

            try
            {
                await pipe.Input.WriteAsync(chunk, ct).ConfigureAwait(false);
                await pipe.Input.FlushAsync(ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is IOException or ObjectDisposedException)
            {
                // The encoder exited under this chunk. The monitor decides whether it restarts.
                logger.LogDebug("Camera stream {StreamId} encoder closed while a chunk was written", session.Id);
                return new CameraChunkResult(
                    session.IsActive && session.Settings.AutoReconnect ? CameraChunkOutcome.RestartRecording : CameraChunkOutcome.Ended,
                    session.Snapshot());
            }

            session.Accept(chunk.Length);
            return new CameraChunkResult(CameraChunkOutcome.Accepted, session.Snapshot());
        }
        finally
        {
            session.WriteGate.Release();
        }
    }

    // ------------------------------------------------------------------ encoder

    private void Launch(Session session)
    {
        var url = LiveStreamArguments.OutputUrl(session.Destination.IngestUrl, session.Key!);
        var offset = session.StreamedSeconds;
        var progress = new Progress<FfmpegProgress>(p => session.Report(offset + p.OutTime.TotalSeconds, p.OutTime.TotalSeconds, p.Speed));

        var pipe = pipes.Start(
            dataPaths.Temp,
            LiveStreamArguments.CameraPush(session.Settings.Container, session.Settings, _camera.Preset, url),
            progress);
        session.Attach(pipe);
    }

    private async Task MonitorAsync(Session session)
    {
        var deadline = clock.GetUtcNow() + TimeSpan.FromHours(Math.Max(1, _options.MaxHours));
        var markedUsed = false;
        IFfmpegPipe? pipe = null;

        try
        {
            while (true)
            {
                pipe = session.Pipe!;
                int exitCode;
                using (var stop = CancellationTokenSource.CreateLinkedTokenSource(_shutdown.Token))
                {
                    var timeLeft = deadline - clock.GetUtcNow();
                    if (timeLeft <= TimeSpan.Zero) session.RequestEnd(CameraStreamState.Ended, $"Reached this server's {_options.MaxHours}-hour limit for one stream.");
                    else stop.CancelAfter(timeLeft);

                    try
                    {
                        exitCode = await pipe.Exited.WaitAsync(stop.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        if (!session.EndRequested)
                        {
                            session.RequestEnd(_shutdown.IsCancellationRequested ? CameraStreamState.Stopped : CameraStreamState.Ended,
                                _shutdown.IsCancellationRequested
                                    ? "Stopped because the server is shutting down."
                                    : $"Reached this server's {_options.MaxHours}-hour limit for one stream.");
                        }
                        exitCode = await WaitOrKillAsync(pipe).ConfigureAwait(false);
                    }
                }

                var stderr = LiveStreamValidator.Redact(pipe.StderrTail, session.Key ?? string.Empty);
                await pipe.DisposeAsync().ConfigureAwait(false);
                pipe = null;

                if (session.WentLive && !markedUsed && session.Target.ChannelId is { } channelId && session.Fingerprint is { } fp)
                {
                    markedUsed = true;
                    await keys.MarkUsedAsync(channelId, session.Settings.Destination, fp).ConfigureAwait(false);
                }

                if (session.EndRequested)
                {
                    session.Finish();
                    logger.LogInformation("Camera stream {StreamId} ended ({State}) after {Seconds:F0}s", session.Id, session.State, session.StreamedSeconds);
                    return;
                }

                if (exitCode == 0)
                {
                    session.RequestEnd(CameraStreamState.Ended, "The stream ended.");
                    session.Finish();
                    return;
                }

                logger.LogWarning("Camera stream {StreamId} encoder exited with code {ExitCode}: {Stderr}",
                    session.Id, exitCode, LogSanitizer.Sanitize(stderr, 1500));

                if (!session.WentLive && LiveStreamManager.LooksLikeRefusal(stderr))
                {
                    if (session.Target.ChannelId is { } refusedChannel && session.Fingerprint is { } refused)
                    {
                        await keys.MarkRejectedAsync(refusedChannel, session.Settings.Destination, refused).ConfigureAwait(false);
                        session.Fail("YouTube refused this channel's saved stream key. It was probably reset in YouTube Studio - set it again under Settings → Channels.",
                            keyNeedsAttention: true);
                    }
                    else
                    {
                        session.Fail(LiveStreamManager.Explain(stderr, wentLive: false));
                    }
                    return;
                }

                if (IsInputFailure(stderr))
                {
                    // ffmpeg gave up on what it was fed, not on the ingest: reconnecting wouldn't help.
                    session.Fail("The server couldn't read this browser's recording. Try another browser.");
                    return;
                }

                if (!session.Settings.AutoReconnect || !session.WentLive || session.Reconnects >= Math.Max(0, _options.ReconnectAttempts))
                {
                    session.Fail(LiveStreamManager.Explain(stderr, session.WentLive));
                    return;
                }

                var delay = ReconnectDelays[Math.Min(session.Reconnects, ReconnectDelays.Length - 1)];
                session.BeginReconnect($"Connection dropped. Reconnecting in {delay.TotalSeconds:F0}s (try {session.Reconnects + 1} of {_options.ReconnectAttempts})…");
                logger.LogInformation("Camera stream {StreamId} reconnecting in {Delay}s", session.Id, delay.TotalSeconds);

                await Task.Delay(delay, clock, _shutdown.Token).ConfigureAwait(false);
                if (session.EndRequested)
                {
                    session.Finish();
                    return;
                }

                Launch(session);
            }
        }
        catch (OperationCanceledException)
        {
            session.RequestEnd(CameraStreamState.Stopped, "Stopped because the server is shutting down.");
            session.Finish();
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            session.Fail("FFmpeg isn't available on the API machine.");
        }
        catch (Exception ex)
        {
            // The exception text could quote a command line, so only its type is logged.
            logger.LogError("Camera stream {StreamId} failed unexpectedly: {ErrorType}", session.Id, ex.GetType().Name);
            session.Fail("Streaming failed. Check the Logs page for details.");
        }
        finally
        {
            if (pipe is not null) await pipe.DisposeAsync().ConfigureAwait(false);
            session.ForgetKey();
        }
    }

    /// <summary>ffmpeg names its input (<c>pipe:0</c>) when the recording itself can't be demuxed.</summary>
    public static bool IsInputFailure(string stderr) =>
        stderr.Contains("pipe:0", StringComparison.Ordinal)
        && (stderr.Contains("Invalid data", StringComparison.OrdinalIgnoreCase)
            || stderr.Contains("Error opening input", StringComparison.OrdinalIgnoreCase)
            || stderr.Contains("could not find codec", StringComparison.OrdinalIgnoreCase));

    /// <summary>Lets ffmpeg flush what it has after stdin closes, and kills it if it won't exit.</summary>
    private static async Task<int> WaitOrKillAsync(IFfmpegPipe pipe)
    {
        await pipe.CloseInputAsync().ConfigureAwait(false);
        try
        {
            return await pipe.Exited.WaitAsync(TimeSpan.FromSeconds(10)).ConfigureAwait(false);
        }
        catch (TimeoutException)
        {
            pipe.Kill();
            return await pipe.Exited.ConfigureAwait(false);
        }
    }

    private async Task<(string? Key, string? Fingerprint, string? Problem)> ResolveKeyAsync(
        LiveStreamKeyTarget target, string destinationId, CancellationToken ct)
    {
        if (target.PastedKey is { Length: > 0 } pasted) return (pasted, null, null);
        if (target.ChannelId is null) return (null, null, "No stream key was given.");

        var (key, fingerprint, state) = await keys.GetKeyAsync(target.ChannelId, destinationId, ct).ConfigureAwait(false);
        if (key is not null) return (key, fingerprint, null);

        return (null, null, state switch
        {
            LiveStreamKeyState.Rejected => "This channel's saved stream key was refused last time. Set it again under Settings → Channels, or paste a key.",
            LiveStreamKeyState.Unreadable => "This channel's saved stream key can't be decrypted on this server. Set it again under Settings → Channels.",
            _ => "This channel has no saved stream key. Save one under Settings → Channels, or paste a key."
        });
    }

    /// <summary>Ends streams whose page stopped sending, so a closed tab doesn't hold an encoder.</summary>
    public void Sweep()
    {
        var now = clock.GetUtcNow().UtcDateTime;
        foreach (var session in _sessions.Values)
        {
            if (session.IsActive && !session.EndRequested && now - session.LastChunkAt > IdleTimeout)
            {
                logger.LogInformation("Camera stream {StreamId} ended: no media for {Seconds:F0}s", session.Id, IdleTimeout.TotalSeconds);
                session.RequestEnd(CameraStreamState.Ended, "The camera page stopped sending, so the stream was ended.");
            }
        }

        lock (_gate) Purge();
    }

    private void Purge()
    {
        var cutoff = clock.GetUtcNow().UtcDateTime - TimeSpan.FromMinutes(Math.Max(1, _camera.KeepFinishedMinutes));
        foreach (var (id, session) in _sessions)
        {
            if (!session.IsActive && (session.EndedAt ?? session.CreatedAt) < cutoff) _sessions.TryRemove(id, out _);
        }
    }

    private static bool Owns(Session session, string userId) =>
        string.Equals(session.OwnerUserId, userId, StringComparison.Ordinal);

    private Session? Owned(string id, string userId)
    {
        if (!_sessions.TryGetValue(id, out var session)) return null;
        if (Owns(session, userId)) return session;

        logger.LogWarning("User {UserId} was refused camera stream {StreamId} owned by another user", userId, id);
        return null;
    }

    // ------------------------------------------------------------------ state

    private sealed class Session(
        string id, string ownerUserId, CameraStreamSettings settings, LiveStreamDestinationOptions destination,
        LiveStreamKeyTarget target, string key, string? fingerprint, TimeProvider clock)
    {
        private readonly object _gate = new();
        private TaskCompletionSource<IFfmpegPipe?> _pipeReady = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private CameraStreamState? _endState;
        private string? _endMessage;

        public string Id { get; } = id;
        public string OwnerUserId { get; } = ownerUserId;
        public CameraStreamSettings Settings { get; } = settings;
        public LiveStreamDestinationOptions Destination { get; } = destination;
        public LiveStreamKeyTarget Target { get; } = target with { PastedKey = null };
        public string? Fingerprint { get; } = fingerprint;
        public DateTime CreatedAt { get; } = clock.GetUtcNow().UtcDateTime;
        public SemaphoreSlim WriteGate { get; } = new(1, 1);
        public Task? Monitor { get; set; }

        /// <summary>Held only while the stream runs; see <see cref="ForgetKey"/>.</summary>
        public string? Key { get; private set; } = key;

        public IFfmpegPipe? Pipe { get; private set; }
        public CameraStreamState State { get; private set; } = CameraStreamState.Connecting;
        public int Generation { get; private set; }
        public long NextSequence { get; private set; }
        public long ReceivedBytes { get; private set; }
        public DateTime LastChunkAt { get; private set; } = clock.GetUtcNow().UtcDateTime;
        public DateTime? LiveSince { get; private set; }
        public DateTime? EndedAt { get; private set; }
        public double StreamedSeconds { get; private set; }
        public double? Speed { get; private set; }
        public int Reconnects { get; private set; }
        public string? Message { get; private set; }
        public bool KeyNeedsAttention { get; private set; }
        public bool WentLive => LiveSince is not null;

        public bool IsActive
        {
            get { lock (_gate) return State is CameraStreamState.Connecting or CameraStreamState.Live or CameraStreamState.Reconnecting; }
        }

        public bool EndRequested
        {
            get { lock (_gate) return _endState is not null; }
        }

        public void Attach(IFfmpegPipe pipe)
        {
            lock (_gate)
            {
                Pipe = pipe;
                _pipeReady.TrySetResult(pipe);
            }
        }

        public async Task<IFfmpegPipe?> WaitForPipeAsync(int generation, TimeSpan wait, CancellationToken ct)
        {
            Task<IFfmpegPipe?> ready;
            lock (_gate)
            {
                if (generation != Generation) return null;
                ready = _pipeReady.Task;
            }

            try
            {
                return await ready.WaitAsync(wait, ct).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                return null;
            }
        }

        public void Accept(int bytes)
        {
            lock (_gate)
            {
                NextSequence++;
                ReceivedBytes += bytes;
                LastChunkAt = clock.GetUtcNow().UtcDateTime;
            }
        }

        public void Report(double streamed, double sentThisConnection, double? speed)
        {
            lock (_gate)
            {
                if (State is not (CameraStreamState.Connecting or CameraStreamState.Reconnecting or CameraStreamState.Live)) return;
                StreamedSeconds = streamed;
                Speed = speed;
                if (State != CameraStreamState.Live && sentThisConnection > 0)
                {
                    State = CameraStreamState.Live;
                    LiveSince ??= clock.GetUtcNow().UtcDateTime;
                    Message = null;
                }
            }
        }

        /// <summary>Asks the page for a fresh recording under the next generation, and holds its chunks until the new encoder runs.</summary>
        public void BeginReconnect(string message)
        {
            lock (_gate)
            {
                Reconnects++;
                Generation++;
                NextSequence = 0;
                State = CameraStreamState.Reconnecting;
                Message = message;
                Pipe = null;
                _pipeReady.TrySetResult(null);
                _pipeReady = new TaskCompletionSource<IFfmpegPipe?>(TaskCreationOptions.RunContinuationsAsynchronously);
                // The page needs time to notice and restart; that isn't the page going quiet.
                LastChunkAt = clock.GetUtcNow().UtcDateTime;
            }
        }

        /// <summary>Asks the encoder to finish: stdin is closed, so what was sent goes out and ffmpeg exits.</summary>
        public void RequestEnd(CameraStreamState state, string message)
        {
            IFfmpegPipe? pipe;
            lock (_gate)
            {
                if (_endState is not null || State is not (CameraStreamState.Connecting or CameraStreamState.Live or CameraStreamState.Reconnecting)) return;
                _endState = state;
                _endMessage = message;
                pipe = Pipe;
                _pipeReady.TrySetResult(null);
            }

            if (pipe is not null) _ = pipe.CloseInputAsync();
        }

        public void Finish()
        {
            lock (_gate)
            {
                State = _endState ?? CameraStreamState.Ended;
                Message = _endMessage ?? Message;
                EndedAt = clock.GetUtcNow().UtcDateTime;
                Speed = null;
                _pipeReady.TrySetResult(null);
            }
        }

        public void Fail(string message, bool keyNeedsAttention = false)
        {
            lock (_gate)
            {
                State = CameraStreamState.Failed;
                Message = message;
                KeyNeedsAttention = keyNeedsAttention;
                EndedAt = clock.GetUtcNow().UtcDateTime;
                Speed = null;
                _pipeReady.TrySetResult(null);
            }
        }

        public void ForgetKey()
        {
            lock (_gate) Key = null;
        }

        public CameraStreamStatus Snapshot()
        {
            lock (_gate)
            {
                return new CameraStreamStatus(
                    Id,
                    string.IsNullOrWhiteSpace(Settings.Label) ? "Camera stream" : Settings.Label.Trim(),
                    Settings.Destination,
                    Destination.Name,
                    Settings.Orientation,
                    Settings.Quality,
                    Settings.Container,
                    State,
                    Target.ChannelId,
                    CreatedAt,
                    LiveSince,
                    EndedAt,
                    Generation,
                    NextSequence,
                    ReceivedBytes,
                    StreamedSeconds,
                    Speed,
                    Reconnects,
                    Message,
                    KeyNeedsAttention);
            }
        }
    }
}
