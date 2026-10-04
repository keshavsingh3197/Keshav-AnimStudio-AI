using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Media;
using AnimStudio.Domain.Errors;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Media;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.LiveStreams;

/// <summary>
/// One playlist item, ready for the manager. <see cref="SourceFile"/> and
/// <see cref="CoverFile"/> are generated names inside the stream's work directory, already
/// written by the caller - except for a link item, which carries its canonical URL instead
/// and is downloaded while the stream is prepared.
/// </summary>
public sealed record LiveStreamItemInput(
    LiveStreamItemSource Source,
    string Title,
    string? SourceFile,
    string? CoverFile,
    string? CanonicalUrl = null,
    bool AudioOnly = false);

/// <summary>Where the key comes from when a stream goes live. Exactly one is set.</summary>
public sealed record LiveStreamKeyTarget(string? ChannelId, string? PastedKey);

public sealed record LiveStreamCreateRequest(
    string OwnerUserId,
    string WorkDirectory,
    LiveStreamSettings Settings,
    IReadOnlyList<LiveStreamItemInput> Items,
    LiveStreamKeyTarget? AutoStart);

public enum LiveStreamCreateOutcome { Created, Busy, UnknownDestination }

public enum LiveStreamGoLiveOutcome { Started, NotFound, NotReady, AlreadyRunning, Busy }

/// <summary>
/// Runs live streams in two stages: <b>prepare</b> (fetch each playlist item and convert it
/// into a stream-ready segment, which the owner can preview) and <b>send</b> (copy the
/// segments to an RTMPS ingest at playback speed, reconnecting if the connection drops).
/// <para>
/// Streams are deliberately not persisted. After a restart there is nothing running to
/// resume, so the table lives in memory and leftover work folders are cleared at startup.
/// A pasted stream key is held only by its stream until it is sent and is gone with it; a
/// channel's saved key is read from <see cref="LiveStreamKeyStore"/> at the moment of
/// connecting. Neither is ever logged or returned.
/// </para>
/// </summary>
public sealed class LiveStreamManager(
    IFfmpegRunner runner,
    YtDlpMediaDownloader downloader,
    IServiceScopeFactory scopes,
    IOptions<LiveStreamOptions> options,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<LiveStreamManager> logger) : IHostedService
{
    private static readonly TimeSpan[] ReconnectDelays =
        [TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(20), TimeSpan.FromSeconds(30)];

    private readonly LiveStreamOptions _options = options.Value;
    private readonly ConcurrentDictionary<string, Session> _sessions = new(StringComparer.Ordinal);
    private readonly object _gate = new();
    private readonly CancellationTokenSource _shutdown = new();
    private readonly SemaphoreSlim _prepareSlots = new(Math.Max(1, options.Value.MaxConcurrentPreparations));
    private IReadOnlyDictionary<string, LiveStreamDestinationOptions>? _destinations;
    private bool? _rtmpsSupported;

    /// <summary>The configured destinations that passed the rtmps:// check.</summary>
    public IReadOnlyDictionary<string, LiveStreamDestinationOptions> Destinations =>
        _destinations ??= LoadDestinations();

    public int MaxConcurrentStreams => Math.Max(1, _options.MaxConcurrentStreams);
    public int MaxStreamsPerUser => Math.Max(1, _options.MaxStreamsPerUser);
    public bool AllowSavedKeysForNonAdmins => _options.AllowSavedKeysForNonAdmins;
    public long MaxFetchBytes => _options.MaxFetchBytes;

    /// <summary>Whether the user may prepare another stream. Checked before uploads are saved.</summary>
    public bool HasRoomFor(string userId)
    {
        PurgeIdle();
        return _sessions.Values.Count(s => Owns(s, userId)) < MaxStreamsPerUser;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _ = Destinations;

        // No stream survives a restart, so whatever is on disk is an orphan.
        if (Directory.Exists(dataPaths.LiveStreams))
        {
            foreach (var directory in Directory.EnumerateDirectories(dataPaths.LiveStreams))
                TryDelete(directory);
        }

        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await _shutdown.CancelAsync().ConfigureAwait(false);

        var running = _sessions.Values.Select(s => s.Work).Where(t => t is not null).Cast<Task>().ToArray();
        if (running.Length == 0) return;

        try
        {
            await Task.WhenAll(running).WaitAsync(TimeSpan.FromSeconds(10), cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is TimeoutException or OperationCanceledException)
        {
            logger.LogWarning("Live streams did not all stop within the shutdown window");
        }
    }

    /// <summary>
    /// Whether this ffmpeg build can speak RTMPS. Checked once, before the first stream,
    /// so a build without TLS fails with a clear message instead of a protocol error.
    /// </summary>
    public async Task<bool> SupportsRtmpsAsync(CancellationToken ct)
    {
        if (_rtmpsSupported is { } known) return known;

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = dataPaths.Temp,
            Arguments = ["-hide_banner", "-protocols"],
            Timeout = TimeSpan.FromSeconds(30)
        }, progress: null, ct).ConfigureAwait(false);

        // The list prints "Input:" then "Output:", one protocol per line.
        var output = result.StdOut;
        var outputSection = output.IndexOf("Output:", StringComparison.Ordinal);
        var supported = result.ExitCode == 0 && outputSection >= 0
            && output[outputSection..].Split('\n').Any(line => line.Trim() == "rtmps");

        _rtmpsSupported = supported;
        return supported;
    }

    /// <summary>Starts preparing a stream. With <see cref="LiveStreamCreateRequest.AutoStart"/> it goes live as soon as it is ready.</summary>
    public LiveStreamCreateOutcome TryCreate(LiveStreamCreateRequest request, out LiveStreamStatus? status)
    {
        status = null;
        if (!Destinations.TryGetValue(request.Settings.Destination, out var destination))
            return LiveStreamCreateOutcome.UnknownDestination;

        var items = request.Items.ToList();
        if (request.Settings.Shuffle)
            Random.Shared.Shuffle(System.Runtime.InteropServices.CollectionsMarshal.AsSpan(items));

        Session session;
        lock (_gate)
        {
            PurgeIdle();
            if (_sessions.Values.Count(s => Owns(s, request.OwnerUserId)) >= MaxStreamsPerUser)
                return LiveStreamCreateOutcome.Busy;

            var id = Guid.NewGuid().ToString("n");
            session = new Session(id, request.OwnerUserId, request.WorkDirectory, request.Settings, destination, items, clock)
            {
                AutoStart = request.AutoStart
            };
            _sessions[id] = session;
        }

        logger.LogInformation(
            "Live stream {StreamId} preparing for user {UserId}: {ItemCount} items to {Destination} ({Quality}, {Orientation}, loops {Loops}, shuffle {Shuffle})",
            session.Id, request.OwnerUserId, items.Count, request.Settings.Destination,
            request.Settings.Quality, request.Settings.Orientation, request.Settings.Loops, request.Settings.Shuffle);

        session.Work = Task.Run(() => PrepareAsync(session));
        status = session.Snapshot();
        return LiveStreamCreateOutcome.Created;
    }

    /// <summary>Sends a prepared stream. Also how an ended, stopped or failed stream is sent again.</summary>
    public LiveStreamGoLiveOutcome TryGoLive(string id, string userId, LiveStreamKeyTarget target, out LiveStreamStatus? status)
    {
        status = null;
        var session = Owned(id, userId);
        if (session is null) return LiveStreamGoLiveOutcome.NotFound;

        lock (_gate)
        {
            if (session.IsBusy) return LiveStreamGoLiveOutcome.AlreadyRunning;
            if (!session.CanGoLive) return LiveStreamGoLiveOutcome.NotReady;
            if (SendingCount() >= MaxConcurrentStreams) return LiveStreamGoLiveOutcome.Busy;

            session.BeginSending(target);
        }

        session.Work = Task.Run(() => SendAsync(session));
        status = session.Snapshot();
        return LiveStreamGoLiveOutcome.Started;
    }

    /// <summary>The caller's own stream, or null - another user's stream is indistinguishable from none.</summary>
    public LiveStreamStatus? Get(string id, string userId) => Owned(id, userId)?.Snapshot();

    public IReadOnlyList<LiveStreamStatus> List(string userId)
    {
        PurgeIdle();
        return _sessions.Values
            .Where(s => Owns(s, userId))
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => s.Snapshot())
            .ToList();
    }

    /// <summary>Stops sending, or stops preparing. The prepared segments are kept so it can be sent again.</summary>
    public bool Stop(string id, string userId)
    {
        var session = Owned(id, userId);
        if (session is null) return false;

        if (session.IsBusy)
        {
            session.RequestStop();
            logger.LogInformation("Live stream {StreamId} stop requested by user {UserId}", id, userId);
        }

        return true;
    }

    /// <summary>Stops the stream if it is running and deletes it with its segments.</summary>
    public async Task<bool> DiscardAsync(string id, string userId)
    {
        var session = Owned(id, userId);
        if (session is null) return false;

        session.RequestStop();
        if (session.Work is { } work)
        {
            try
            {
                await work.WaitAsync(TimeSpan.FromSeconds(15)).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                logger.LogWarning("Live stream {StreamId} did not stop within 15 s of being discarded", id);
            }
        }

        _sessions.TryRemove(id, out _);
        TryDelete(session.WorkDirectory);
        logger.LogInformation("Live stream {StreamId} discarded by user {UserId}", id, userId);
        return true;
    }

    /// <summary>The full path of a prepared segment, for the owner's preview - or null.</summary>
    public string? PreviewPath(string id, string userId, int index)
    {
        var session = Owned(id, userId);
        if (session is null || index < 0 || index >= session.Items.Count) return null;
        if (session.Items[index].State != LiveStreamItemState.Ready) return null;

        var path = Path.Combine(session.WorkDirectory, LiveStreamArguments.SegmentFile(index));
        return File.Exists(path) ? path : null;
    }

    private static bool Owns(Session session, string userId) =>
        string.Equals(session.OwnerUserId, userId, StringComparison.Ordinal);

    private Session? Owned(string id, string userId)
    {
        if (!_sessions.TryGetValue(id, out var session)) return null;
        if (Owns(session, userId)) return session;

        logger.LogWarning("User {UserId} was refused live stream {StreamId} owned by another user", userId, id);
        return null;
    }

    private int SendingCount() => _sessions.Values.Count(s => s.IsSending);

    // ------------------------------------------------------------------ prepare

    private async Task PrepareAsync(Session session)
    {
        var ct = session.NewRunToken(_shutdown.Token);

        try
        {
            for (var i = 0; i < session.Items.Count; i++)
            {
                ct.ThrowIfCancellationRequested();
                await PrepareItemAsync(session, i, ct).ConfigureAwait(false);
            }

            var ready = session.Items.Count(item => item.State == LiveStreamItemState.Ready);
            var failed = session.Items.Count - ready;

            if (ready == 0)
            {
                session.Finish(LiveStreamState.Failed, session.Items.Count == 1
                    ? $"The item couldn't be prepared: {session.Items[0].Message}"
                    : "None of the items could be prepared. Check each one's message.");
                return;
            }

            var skipped = failed == 0 ? null
                : $"{failed} item{(failed == 1 ? "" : "s")} couldn't be prepared and will be skipped.";
            session.MarkReady(skipped);
            logger.LogInformation("Live stream {StreamId} prepared: {Ready} ready, {Failed} failed", session.Id, ready, failed);
        }
        catch (OperationCanceledException)
        {
            session.Finish(LiveStreamState.Stopped, _shutdown.IsCancellationRequested
                ? "Stopped because the server is shutting down."
                : "Preparing was stopped.");
            return;
        }
        catch (Exception ex)
        {
            // The exception text could quote a command line, so only its type is logged.
            logger.LogError("Live stream {StreamId} failed while preparing: {ErrorType}", session.Id, ex.GetType().Name);
            session.Finish(LiveStreamState.Failed, "Preparing failed. Check the Logs page for details.");
            return;
        }
        finally
        {
            session.EndRun();
        }

        // Go Live straight away, when that's what was asked for.
        if (session.AutoStart is { } target)
        {
            session.AutoStart = null;
            var outcome = TryGoLive(session.Id, session.OwnerUserId, target, out _);
            if (outcome != LiveStreamGoLiveOutcome.Started)
            {
                session.SetMessage(outcome == LiveStreamGoLiveOutcome.Busy
                    ? $"Prepared, but this server is already sending {MaxConcurrentStreams} streams. Press Go live when one ends."
                    : "Prepared. Press Go live to start.");
            }
        }
    }

    private async Task PrepareItemAsync(Session session, int index, CancellationToken ct)
    {
        var item = session.Items[index];
        var input = item.Input;
        var workDir = session.WorkDirectory;
        var settings = session.Settings;

        try
        {
            var sourceFile = input.SourceFile;

            if (input.Source == LiveStreamItemSource.Url)
            {
                item.SetState(LiveStreamItemState.Fetching);
                sourceFile = await FetchAsync(session, index, ct).ConfigureAwait(false);
                if (sourceFile is null) return;
            }

            if (sourceFile is null)
            {
                item.Fail("There's nothing to stream for this item.");
                return;
            }

            item.SetState(LiveStreamItemState.Preparing);

            var probe = await ProbeAsync(workDir, sourceFile, ct).ConfigureAwait(false);
            var asVideo = probe.HasVideo && !input.AudioOnly && !IsStillImage(probe);
            if (!asVideo && !probe.HasAudio)
            {
                item.Fail(probe.HasVideo ? "This item has no sound to stream radio-style." : "This file has no video or audio track.");
                return;
            }

            var segment = LiveStreamArguments.SegmentFile(index);
            IReadOnlyList<string> arguments;

            await _prepareSlots.WaitAsync(ct).ConfigureAwait(false);
            try
            {
                if (asVideo)
                {
                    item.Kind = LiveStreamItemKind.Video;
                    arguments = LiveStreamArguments.ConformVideo(sourceFile, probe.HasAudio, settings, segment);
                }
                else
                {
                    item.Kind = LiveStreamItemKind.CoverAndAudio;
                    var stage = LiveStreamArguments.StageFile(index);
                    var drawn = await runner.RunAsync(new FfmpegInvocation
                    {
                        Tool = FfmpegTool.Ffmpeg,
                        WorkingDirectory = workDir,
                        Arguments = LiveStreamArguments.Stage(input.CoverFile, settings, stage),
                        Timeout = TimeSpan.FromMinutes(2),
                        FailureExpected = true
                    }, progress: null, ct).ConfigureAwait(false);

                    if (drawn.ExitCode != 0 || !File.Exists(Path.Combine(workDir, stage)))
                    {
                        logger.LogWarning("Live stream {StreamId} item {Index} could not draw its cover frame: {Stderr}",
                            session.Id, index, LogSanitizer.Sanitize(drawn.StderrTail, 500));
                        item.Fail("The cover image couldn't be read.");
                        return;
                    }

                    arguments = LiveStreamArguments.ConformCoverAndAudio(sourceFile, stage, settings, segment);
                }

                var duration = probe.DurationSeconds;
                var progress = new Progress<FfmpegProgress>(p =>
                    item.Progress = duration > 0 ? Math.Clamp(p.OutTime.TotalSeconds / duration, 0, 1) : 0);

                var result = await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = workDir,
                    Arguments = arguments,
                    CaptureProgress = true,
                    // A converted 12-hour mix is a long encode, but not an unbounded one.
                    Timeout = TimeSpan.FromHours(Math.Max(1, _options.MaxHours)),
                    FailureExpected = true
                }, progress, ct).ConfigureAwait(false);

                if (result.ExitCode != 0)
                {
                    logger.LogWarning("Live stream {StreamId} item {Index} could not be converted: {Stderr}",
                        session.Id, index, LogSanitizer.Sanitize(result.StderrTail, 800));
                    item.Fail("This file couldn't be converted. It may be damaged or in an unusual format.");
                    return;
                }
            }
            finally
            {
                _prepareSlots.Release();
            }

            var prepared = await ProbeAsync(workDir, segment, ct).ConfigureAwait(false);
            if (!prepared.HasVideo || prepared.DurationSeconds <= 0)
            {
                item.Fail("The converted file came out empty.");
                return;
            }

            // The source is no longer needed once its segment exists; only segments are kept.
            DeleteQuietly(Path.Combine(workDir, sourceFile));
            if (input.CoverFile is not null) DeleteQuietly(Path.Combine(workDir, input.CoverFile));
            DeleteQuietly(Path.Combine(workDir, LiveStreamArguments.StageFile(index)));

            item.MarkReady(prepared.DurationSeconds);
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            item.Fail("FFmpeg isn't available on the API machine.");
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.Timeout)
        {
            item.Fail("Converting this item took too long.");
        }
    }

    /// <summary>Downloads a link item into the work directory. Returns the file name, or null after failing the item.</summary>
    private async Task<string?> FetchAsync(Session session, int index, CancellationToken ct)
    {
        var item = session.Items[index];
        var validation = MediaSourceValidator.Validate(item.Input.CanonicalUrl);
        if (!validation.IsValid)
        {
            item.Fail(validation.ErrorMessage ?? "That link can't be used.");
            return null;
        }

        var fetchDir = Path.Combine(session.WorkDirectory, $"fetch{index.ToString("00", CultureInfo.InvariantCulture)}");
        try
        {
            var request = new MediaDownloadRequest(
                validation.CanonicalUrl!,
                Format: item.Input.AudioOnly ? "m4a" : "mp4",
                Resolution: session.Settings.Quality == LiveStreamQuality.Hd1080 ? "1080p" : "720p");

            var downloaded = await downloader.DownloadAsync(
                request, new Uri(validation.CanonicalUrl!), validation.Platform!, fetchDir, ct).ConfigureAwait(false);

            if (downloaded.FileSizeBytes > MaxFetchBytes)
            {
                item.Fail($"That download is larger than {MaxFetchBytes / (1024 * 1024 * 1024)} GB.");
                return null;
            }

            // A generated name in the work directory: the site's file name never decides where a file lands.
            var extension = Path.GetExtension(downloaded.FilePath).ToLowerInvariant();
            if (extension.Length is < 2 or > 6 || !extension[1..].All(char.IsAsciiLetterOrDigit)) extension = ".bin";
            var target = $"source{index.ToString("00", CultureInfo.InvariantCulture)}{extension}";
            File.Move(downloaded.FilePath, Path.Combine(session.WorkDirectory, target));

            if (item.UsesDefaultTitle && !string.IsNullOrWhiteSpace(downloaded.Title))
                item.Title = Truncate(downloaded.Title.Trim(), LiveStreamValidator.MaxTitleLength);

            return target;
        }
        catch (MediaDownloadException ex)
        {
            logger.LogWarning("Live stream {StreamId} item {Index} download from {Platform} failed: {Code}",
                session.Id, index, validation.Platform!.Id, ex.Failure.Code);
            item.Fail($"{ex.Failure.Message} {ex.Failure.Hint}".Trim());
            return null;
        }
        finally
        {
            TryDelete(fetchDir);
        }
    }

    // ------------------------------------------------------------------ send

    private async Task SendAsync(Session session)
    {
        var ct = session.NewRunToken(_shutdown.Token);
        var target = session.KeyTarget!;
        var settings = session.Settings;
        var ready = session.ReadyIndexes();
        var segments = ready.Select(LiveStreamArguments.SegmentFile).ToList();
        var durations = ready.Select(i => session.Items[i].DurationSeconds).ToList();
        var loopForever = settings.Loops <= 0;

        string? key = null;
        string? fingerprint = null;

        try
        {
            (key, fingerprint) = await ResolveKeyAsync(session, target, ct).ConfigureAwait(false);
            if (key is null) return;

            var outputUrl = LiveStreamArguments.OutputUrl(session.Destination.IngestUrl, key);
            var deadline = clock.GetUtcNow() + TimeSpan.FromHours(Math.Max(1, _options.MaxHours));
            var (loop, item) = (0, 0);
            var attempt = 0;
            var markedUsed = false;

            while (true)
            {
                var remainingFullLoops = loopForever ? (int?)null : settings.Loops - loop - 1;
                await File.WriteAllTextAsync(
                    Path.Combine(session.WorkDirectory, LiveStreamArguments.PlaylistFile),
                    LiveStreamArguments.PlaylistContent(segments, item, remainingFullLoops), ct).ConfigureAwait(false);

                var attemptStart = (Loop: loop, Item: item);
                var offset = session.StreamedSeconds;
                session.SetState(attempt == 0 ? LiveStreamState.Connecting : LiveStreamState.Reconnecting);

                var timeLeft = deadline - clock.GetUtcNow();
                if (timeLeft <= TimeSpan.Zero) throw new RenderException(RenderErrorCode.Timeout, "Time limit reached.");

                var progress = new Progress<FfmpegProgress>(p =>
                {
                    var sent = p.OutTime.TotalSeconds;
                    var position = LiveStreamArguments.Position(durations, attemptStart.Loop, attemptStart.Item, sent);
                    session.Report(offset, sent, p.Speed, ready[position.Item]);
                });

                var result = await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = session.WorkDirectory,
                    Arguments = LiveStreamArguments.Push(loopForever, outputUrl),
                    CaptureProgress = true,
                    // Never StderrLogPath: ffmpeg's banner names the output URL, key included.
                    Timeout = timeLeft,
                    FailureExpected = true
                }, progress, ct).ConfigureAwait(false);

                var wentLiveThisAttempt = session.StreamedSeconds > offset;

                if (wentLiveThisAttempt && !markedUsed && target.ChannelId is not null && fingerprint is not null)
                {
                    markedUsed = true;
                    await WithKeyStoreAsync(store => store.MarkUsedAsync(target.ChannelId, settings.Destination, fingerprint, CancellationToken.None))
                        .ConfigureAwait(false);
                }

                if (result.ExitCode == 0)
                {
                    session.Finish(LiveStreamState.Ended, "Every loop was sent. End the stream in YouTube Studio if it hasn't ended on its own.");
                    logger.LogInformation("Live stream {StreamId} ended after {Seconds:F0}s", session.Id, session.StreamedSeconds);
                    return;
                }

                var stderr = LiveStreamValidator.Redact(result.StderrTail, key);
                logger.LogWarning("Live stream {StreamId} push exited with code {ExitCode} (attempt {Attempt}): {Stderr}",
                    session.Id, result.ExitCode, attempt + 1, LogSanitizer.Sanitize(stderr, 1500));

                // Refused before a single second was accepted, on the first try: the key is the likely cause.
                if (!session.WentLive && LooksLikeRefusal(stderr))
                {
                    if (target.ChannelId is not null && fingerprint is not null)
                    {
                        await WithKeyStoreAsync(store => store.MarkRejectedAsync(target.ChannelId, settings.Destination, fingerprint, CancellationToken.None))
                            .ConfigureAwait(false);
                        session.Fail("YouTube refused this channel's saved stream key. It was probably reset in YouTube Studio - set it again under Settings → Channels.",
                            keyNeedsAttention: true);
                    }
                    else
                    {
                        session.Fail(Explain(stderr, wentLive: false));
                    }
                    return;
                }

                if (!settings.AutoReconnect || !session.WentLive || attempt >= Math.Max(0, _options.ReconnectAttempts))
                {
                    session.Fail(Explain(stderr, session.WentLive));
                    return;
                }

                // Pick up where it dropped: the item that was playing, from its start.
                (loop, item) = LiveStreamArguments.Position(durations, attemptStart.Loop, attemptStart.Item, session.StreamedSeconds - offset);
                if (!loopForever && loop >= settings.Loops)
                {
                    session.Finish(LiveStreamState.Ended, "Every loop was sent.");
                    return;
                }

                var delay = ReconnectDelays[Math.Min(attempt, ReconnectDelays.Length - 1)];
                attempt++;
                session.CountReconnect($"Connection dropped. Reconnecting in {delay.TotalSeconds:F0}s (try {attempt} of {_options.ReconnectAttempts})…");
                logger.LogInformation("Live stream {StreamId} reconnecting in {Delay}s (attempt {Attempt})", session.Id, delay.TotalSeconds, attempt);
                await Task.Delay(delay, clock, ct).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (session.StopRequested)
        {
            session.Finish(LiveStreamState.Stopped, "Stopped. End the stream in YouTube Studio if it hasn't ended on its own.");
            logger.LogInformation("Live stream {StreamId} stopped after {Seconds:F0}s", session.Id, session.StreamedSeconds);
        }
        catch (OperationCanceledException)
        {
            session.Finish(LiveStreamState.Stopped, "Stopped because the server is shutting down.");
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.Timeout)
        {
            session.Finish(LiveStreamState.Ended, $"Reached this server's {_options.MaxHours}-hour limit for one stream.");
            logger.LogInformation("Live stream {StreamId} reached the time limit", session.Id);
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            session.Fail("FFmpeg isn't available on the API machine.");
        }
        catch (Exception ex)
        {
            // The exception text could quote a command line, so only its type is logged.
            logger.LogError("Live stream {StreamId} failed unexpectedly: {ErrorType}", session.Id, ex.GetType().Name);
            session.Fail("Streaming failed. Check the Logs page for details.");
        }
        finally
        {
            key = null;
            session.ForgetKey();
            session.EndRun();
        }
    }

    private async Task<(string? Key, string? Fingerprint)> ResolveKeyAsync(Session session, LiveStreamKeyTarget target, CancellationToken ct)
    {
        if (target.PastedKey is { Length: > 0 } pasted) return (pasted, null);

        if (target.ChannelId is null)
        {
            session.Fail("No stream key was given.", keyNeedsAttention: true);
            return (null, null);
        }

        var (key, fingerprint, state) = await WithKeyStoreAsync(
            store => store.GetKeyAsync(target.ChannelId, session.Settings.Destination, ct)).ConfigureAwait(false);

        if (key is not null) return (key, fingerprint);

        session.Fail(state switch
        {
            LiveStreamKeyState.Rejected => "This channel's saved stream key was refused last time. Set it again under Settings → Channels, or paste a key.",
            LiveStreamKeyState.Unreadable => "This channel's saved stream key can't be decrypted on this server. Set it again under Settings → Channels.",
            _ => "This channel has no saved stream key. Save one under Settings → Channels, or paste a key."
        }, keyNeedsAttention: true);
        return (null, null);
    }

    private async Task<T> WithKeyStoreAsync<T>(Func<LiveStreamKeyStore, Task<T>> action)
    {
        await using var scope = scopes.CreateAsyncScope();
        return await action(scope.ServiceProvider.GetRequiredService<LiveStreamKeyStore>()).ConfigureAwait(false);
    }

    private async Task WithKeyStoreAsync(Func<LiveStreamKeyStore, Task> action)
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

    /// <summary>The ingest closing the connection while it opens: almost always a wrong, reset or disabled key.</summary>
    public static bool LooksLikeRefusal(string stderr)
    {
        static bool Has(string text, string token) => text.Contains(token, StringComparison.OrdinalIgnoreCase);

        if (IsNetworkFailure(stderr)) return false;
        return Has(stderr, "I/O error") || Has(stderr, "Input/output error") || Has(stderr, "Broken pipe")
            || Has(stderr, "Connection reset") || Has(stderr, "Server error") || Has(stderr, "Error number");
    }

    private static bool IsNetworkFailure(string stderr)
    {
        static bool Has(string text, string token) => text.Contains(token, StringComparison.OrdinalIgnoreCase);
        return Has(stderr, "Failed to resolve") || Has(stderr, "getaddrinfo") || Has(stderr, "Network is unreachable")
            || Has(stderr, "Connection timed out") || Has(stderr, "Connection refused");
    }

    /// <summary>Turns ffmpeg's error lines into what the user should check.</summary>
    public static string Explain(string stderr, bool wentLive)
    {
        if (IsNetworkFailure(stderr))
            return "Couldn't reach the streaming server. Check this machine's internet connection.";

        if (wentLive)
            return "The connection to the streaming server dropped. Press Go live to send it again.";

        if (LooksLikeRefusal(stderr))
            return "YouTube refused the stream. Check the stream key, and that live streaming is enabled on the channel.";

        return "Streaming stopped with an error. Check the Logs page for details.";
    }

    // ------------------------------------------------------------------ helpers

    private sealed record Probe(bool HasVideo, bool HasAudio, double DurationSeconds, string? VideoCodec);

    /// <summary>A cover image picked up as a video stream (an MP3's embedded art) isn't something to letterbox.</summary>
    private static bool IsStillImage(Probe probe) =>
        probe.VideoCodec is "mjpeg" or "png" or "bmp" or "gif" or "webp" && probe.HasAudio;

    private async Task<Probe> ProbeAsync(string workDirectory, string file, CancellationToken ct)
    {
        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffprobe,
            WorkingDirectory = workDirectory,
            Arguments = ["-v", "error", "-show_entries", "stream=codec_type,codec_name:format=duration", "-of", "json", file],
            Timeout = TimeSpan.FromMinutes(1),
            FailureExpected = true
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0) return new Probe(false, false, 0, null);

        try
        {
            using var document = JsonDocument.Parse(result.StdOut);
            var root = document.RootElement;

            var streams = root.TryGetProperty("streams", out var list)
                ? list.EnumerateArray()
                    .Select(s => (
                        Type: s.TryGetProperty("codec_type", out var t) ? t.GetString() : null,
                        Codec: s.TryGetProperty("codec_name", out var c) ? c.GetString() : null))
                    .ToList()
                : [];

            var duration = root.TryGetProperty("format", out var format)
                && format.TryGetProperty("duration", out var d)
                && double.TryParse(d.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds)
                    ? seconds
                    : 0;

            var video = streams.FirstOrDefault(s => s.Type == "video");
            return new Probe(video.Type is not null, streams.Any(s => s.Type == "audio"), duration, video.Codec);
        }
        catch (JsonException)
        {
            return new Probe(false, false, 0, null);
        }
    }

    private IReadOnlyDictionary<string, LiveStreamDestinationOptions> LoadDestinations()
    {
        var accepted = new Dictionary<string, LiveStreamDestinationOptions>(StringComparer.Ordinal);

        foreach (var (id, destination) in _options.Destinations)
        {
            var secure = Uri.TryCreate(destination.IngestUrl, UriKind.Absolute, out var uri)
                && string.Equals(uri.Scheme, "rtmps", StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrEmpty(uri.UserInfo);

            if (!secure || !LiveStreamValidator.IsValidId(id))
            {
                logger.LogWarning("Live stream destination {Destination} is ignored: its id must be plain and its ingest URL rtmps://", id);
                continue;
            }

            // The help link is shown to users, so only an https link survives.
            if (destination.KeyHelpUrl is not null
                && !(Uri.TryCreate(destination.KeyHelpUrl, UriKind.Absolute, out var help) && help.Scheme == Uri.UriSchemeHttps))
            {
                destination.KeyHelpUrl = null;
            }

            accepted[id] = destination;
        }

        return accepted;
    }

    private void PurgeIdle()
    {
        var cutoff = clock.GetUtcNow().UtcDateTime - TimeSpan.FromMinutes(Math.Max(1, _options.KeepIdleMinutes));
        foreach (var (id, session) in _sessions)
        {
            if (!session.IsBusy && session.LastActivity < cutoff && _sessions.TryRemove(id, out _))
                TryDelete(session.WorkDirectory);
        }
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

    private void DeleteQuietly(string path)
    {
        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogDebug("Could not remove {File}: {ErrorType}", Path.GetFileName(path), ex.GetType().Name);
        }
    }

    private void TryDelete(string directory)
    {
        try
        {
            if (Directory.Exists(directory)) Directory.Delete(directory, recursive: true);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(ex, "Could not remove live stream folder {Folder}", Path.GetFileName(directory));
        }
    }

    // ------------------------------------------------------------------ state

    private sealed class Item(LiveStreamItemInput input, int index)
    {
        private volatile LiveStreamItemState _state = LiveStreamItemState.Waiting;

        public int Index { get; } = index;
        public LiveStreamItemInput Input { get; } = input;
        public string Title { get; set; } = input.Title;
        public bool UsesDefaultTitle { get; } = input.Source == LiveStreamItemSource.Url && input.Title == input.CanonicalUrl;
        public LiveStreamItemKind Kind { get; set; } = LiveStreamItemKind.Video;
        public LiveStreamItemState State => _state;
        public double Progress { get; set; }
        public double DurationSeconds { get; private set; }
        public string? Message { get; private set; }

        public void SetState(LiveStreamItemState state) => _state = state;

        public void MarkReady(double duration)
        {
            DurationSeconds = duration;
            Progress = 1;
            _state = LiveStreamItemState.Ready;
        }

        public void Fail(string message)
        {
            Message = message;
            _state = LiveStreamItemState.Failed;
        }

        public LiveStreamItemStatus Snapshot() =>
            new(Index, Title, Input.Source, Kind, State, Math.Round(Progress, 3), DurationSeconds, Message);
    }

    private sealed class Session
    {
        private readonly object _gate = new();
        private readonly TimeProvider _clock;
        private CancellationTokenSource? _run;
        private bool _running;

        public Session(
            string id, string ownerUserId, string workDirectory, LiveStreamSettings settings,
            LiveStreamDestinationOptions destination, IReadOnlyList<LiveStreamItemInput> items, TimeProvider clock)
        {
            _clock = clock;
            Id = id;
            OwnerUserId = ownerUserId;
            WorkDirectory = workDirectory;
            Settings = settings;
            Destination = destination;
            Items = items.Select((input, i) => new Item(input, i)).ToList();
            CreatedAt = clock.GetUtcNow().UtcDateTime;
            LastActivity = CreatedAt;
            _running = true;
        }

        public string Id { get; }
        public string OwnerUserId { get; }
        public string WorkDirectory { get; }
        public LiveStreamSettings Settings { get; }
        public LiveStreamDestinationOptions Destination { get; }
        public IReadOnlyList<Item> Items { get; }
        public DateTime CreatedAt { get; }
        public DateTime LastActivity { get; private set; }
        public Task? Work { get; set; }

        /// <summary>Holds a pasted key only until the stream it was given for has been sent.</summary>
        public LiveStreamKeyTarget? AutoStart { get; set; }
        public LiveStreamKeyTarget? KeyTarget { get; private set; }

        public volatile bool StopRequested;

        public LiveStreamState State { get; private set; } = LiveStreamState.Preparing;
        public DateTime? LiveSince { get; private set; }
        public DateTime? EndedAt { get; private set; }
        public double StreamedSeconds { get; private set; }
        public int? CurrentItem { get; private set; }
        public int Reconnects { get; private set; }
        public double? Speed { get; private set; }
        public string? Message { get; private set; }
        public bool KeyNeedsAttention { get; private set; }
        public bool WentLive => LiveSince is not null;

        /// <summary>Preparing or sending - a stream that holds a worker.</summary>
        public bool IsBusy
        {
            get { lock (_gate) return _running; }
        }

        public bool IsSending =>
            State is LiveStreamState.Connecting or LiveStreamState.Live or LiveStreamState.Reconnecting;

        public bool CanGoLive
        {
            get
            {
                lock (_gate)
                {
                    return !_running
                        && State is LiveStreamState.Ready or LiveStreamState.Ended or LiveStreamState.Stopped or LiveStreamState.Failed
                        && Items.Any(i => i.State == LiveStreamItemState.Ready)
                        && Items.All(i => i.State is LiveStreamItemState.Ready or LiveStreamItemState.Failed);
                }
            }
        }

        public List<int> ReadyIndexes() =>
            Items.Where(i => i.State == LiveStreamItemState.Ready).Select(i => i.Index).ToList();

        public CancellationToken NewRunToken(CancellationToken shutdown)
        {
            lock (_gate)
            {
                _run?.Dispose();
                _run = CancellationTokenSource.CreateLinkedTokenSource(shutdown);
                if (StopRequested) _run.Cancel();
                return _run.Token;
            }
        }

        public void RequestStop()
        {
            lock (_gate)
            {
                StopRequested = true;
                AutoStart = null;
                try
                {
                    _run?.Cancel();
                }
                catch (ObjectDisposedException)
                {
                    // It finished on its own between the check and the cancel.
                }
            }
        }

        public void EndRun()
        {
            lock (_gate)
            {
                _running = false;
                _run?.Dispose();
                _run = null;
                LastActivity = _clock.GetUtcNow().UtcDateTime;
            }
        }

        public void BeginSending(LiveStreamKeyTarget target)
        {
            lock (_gate)
            {
                _running = true;
                StopRequested = false;
                KeyTarget = target;
                State = LiveStreamState.Connecting;
                LiveSince = null;
                EndedAt = null;
                StreamedSeconds = 0;
                CurrentItem = null;
                Reconnects = 0;
                Speed = null;
                Message = null;
                KeyNeedsAttention = false;
                LastActivity = _clock.GetUtcNow().UtcDateTime;
            }
        }

        public void SetState(LiveStreamState state)
        {
            lock (_gate) State = state;
        }

        public void SetMessage(string message)
        {
            lock (_gate) Message = message;
        }

        public void MarkReady(string? message)
        {
            lock (_gate)
            {
                State = LiveStreamState.Ready;
                Message = message;
            }
        }

        public void CountReconnect(string message)
        {
            lock (_gate)
            {
                Reconnects++;
                State = LiveStreamState.Reconnecting;
                Message = message;
            }
        }

        /// <param name="offset">Seconds sent by earlier connections of this run.</param>
        /// <param name="sent">Seconds sent by the current connection.</param>
        public void Report(double offset, double sent, double? speed, int currentItem)
        {
            lock (_gate)
            {
                if (State is not (LiveStreamState.Connecting or LiveStreamState.Reconnecting or LiveStreamState.Live)) return;
                StreamedSeconds = offset + sent;
                Speed = speed;
                CurrentItem = currentItem;

                // Only media accepted on this connection counts as being live again.
                if (State != LiveStreamState.Live && sent > 0)
                {
                    State = LiveStreamState.Live;
                    LiveSince ??= _clock.GetUtcNow().UtcDateTime;
                    Message = null;
                }
            }
        }

        public void Finish(LiveStreamState state, string message)
        {
            lock (_gate)
            {
                State = state;
                Message = message;
                EndedAt = _clock.GetUtcNow().UtcDateTime;
                Speed = null;
                CurrentItem = null;
            }
        }

        public void Fail(string message, bool keyNeedsAttention = false)
        {
            lock (_gate) KeyNeedsAttention = keyNeedsAttention;
            Finish(LiveStreamState.Failed, message);
        }

        /// <summary>A pasted key is needed only while ffmpeg runs; after that nothing holds it.</summary>
        public void ForgetKey()
        {
            lock (_gate)
            {
                if (KeyTarget is { PastedKey: not null }) KeyTarget = KeyTarget with { PastedKey = null };
            }
        }

        public LiveStreamStatus Snapshot()
        {
            lock (_gate)
            {
                var items = Items.Select(i => i.Snapshot()).ToList();
                return new LiveStreamStatus(
                    Id,
                    string.IsNullOrWhiteSpace(Settings.Label) ? "Live stream" : Settings.Label.Trim(),
                    Settings.Destination,
                    Destination.Name,
                    Settings.Orientation,
                    Settings.Quality,
                    Settings.Loops,
                    Settings.Shuffle,
                    Settings.AutoReconnect,
                    State,
                    CanGoLiveUnlocked(),
                    KeyTarget?.ChannelId ?? AutoStart?.ChannelId,
                    CreatedAt,
                    LiveSince,
                    EndedAt,
                    items.Where(i => i.State == LiveStreamItemState.Ready).Sum(i => i.DurationSeconds),
                    StreamedSeconds,
                    CurrentItem,
                    Reconnects,
                    Speed,
                    Message,
                    KeyNeedsAttention,
                    items);
            }
        }

        private bool CanGoLiveUnlocked() =>
            !_running
            && State is LiveStreamState.Ready or LiveStreamState.Ended or LiveStreamState.Stopped or LiveStreamState.Failed
            && Items.Any(i => i.State == LiveStreamItemState.Ready)
            && Items.All(i => i.State is LiveStreamItemState.Ready or LiveStreamItemState.Failed);
    }
}
