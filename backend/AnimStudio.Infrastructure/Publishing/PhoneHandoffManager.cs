using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A handoff as the client sees it: links built here from stored ids, never taken from input.</summary>
public sealed record PhoneHandoffStatus(
    string Id,
    string JobId,
    string ProjectId,
    string ChannelId,
    string ChannelTitle,
    string Title,
    string State,
    int Percent,
    long BytesSent,
    long TotalBytes,
    string FolderName,
    string? FileName,
    string? DriveUrl,
    bool Muted,
    string? ErrorCode,
    string? Error,
    string? Warning,
    DateTime CreatedAt,
    DateTime? SentAt,
    DateTime? LastCheckedAt,
    DateTime? ExpiresAt,
    string? VideoId,
    string? VideoUrl,
    string? StudioUrl,
    DateTime? AppliedAt,
    bool CommentPosted,
    /// <summary>A plain copy to Drive, with nothing to apply on YouTube.</summary>
    bool SaveOnly = false);

/// <summary>
/// "Send to phone": copies a render to the user's Google Drive in the background, then
/// watches the channel for the upload made from the YouTube app - where a Shorts sound can be
/// added under YouTube's licence - and puts the details prepared in AnimStudio on it.
/// <para>
/// Handoffs are stored, so a restart only loses a copy that was mid-flight (it is marked
/// failed, to send again); the watching carries on. Each channel is listed once per check
/// however many handoffs wait on it, and a handoff's details are applied at most once.
/// </para>
/// </summary>
public sealed partial class PhoneHandoffManager(
    IServiceScopeFactory scopes,
    GoogleDriveClient drive,
    YouTubeChannelVideosClient channelVideos,
    YouTubeCommentClient comments,
    IFfmpegRunner ffmpeg,
    IOptionsMonitor<YouTubePublishOptions> options,
    TimeProvider clock,
    ILogger<PhoneHandoffManager> logger) : BackgroundService
{
    private const int MaxPerSweep = 200;
    private const int RecentToList = 20;

    /// <summary>Bytes copied so far for each handoff being sent; only kept in memory.</summary>
    private readonly ConcurrentDictionary<string, long> _progress = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _sending = new(StringComparer.Ordinal);
    /// <summary>Handoffs being applied right now, so a manual pick and the sweep can't both apply one.</summary>
    private readonly ConcurrentDictionary<string, byte> _applying = new(StringComparer.Ordinal);
    private readonly SemaphoreSlim _sendSlots = new(2, 2);
    private CancellationToken _stopping;

    /// <summary>Starts copying an already saved <see cref="PhoneHandoffState.Sending"/> handoff to Drive.</summary>
    /// <param name="storageKey">The render's file in the object store; never a path from the client.</param>
    public void StartSending(PhoneHandoff handoff, string storageKey, long sizeBytes)
    {
        var cancellation = CancellationTokenSource.CreateLinkedTokenSource(_stopping);
        _sending[handoff.Id] = cancellation;
        _progress[handoff.Id] = 0;
        _ = Task.Run(() => SendAsync(handoff.Id, storageKey, sizeBytes, cancellation));
    }

    /// <summary>Stops a copy in progress. Returns false when none is running for it.</summary>
    public bool CancelSending(string handoffId)
    {
        if (!_sending.TryGetValue(handoffId, out var cancellation)) return false;
        try
        {
            cancellation.Cancel();
            return true;
        }
        catch (ObjectDisposedException)
        {
            return false;
        }
    }

    public PhoneHandoffStatus Describe(PhoneHandoff h)
    {
        var sent = h.State == PhoneHandoffState.Sending && _progress.TryGetValue(h.Id, out var live) ? live : h.BytesSent;
        var percent = h.State switch
        {
            PhoneHandoffState.Sending => (int)Math.Clamp(sent * 100 / Math.Max(1, h.TotalBytes), 0, 99),
            PhoneHandoffState.Failed or PhoneHandoffState.Cancelled or PhoneHandoffState.WaitingForRender => 0,
            _ => 100
        };
        return new PhoneHandoffStatus(
            h.Id, h.JobId, h.ProjectId, h.ChannelId, h.ChannelTitle, h.Title, h.State.ToString(), percent, sent, h.TotalBytes,
            h.DriveFolderName, h.DriveFileName,
            h.DriveFileId is null ? null : $"https://drive.google.com/file/d/{Uri.EscapeDataString(h.DriveFileId)}/view",
            h.Muted, h.ErrorCode, h.Error, h.Warning, h.CreatedAt, h.SentAt, h.LastCheckedAt,
            h.State == PhoneHandoffState.WaitingForPhone && h.SentAt is { } at ? at.AddDays(ExpireDays) : null,
            h.VideoId,
            h.VideoId is null ? null : $"https://youtube.com/shorts/{h.VideoId}",
            h.VideoId is null ? null : $"https://studio.youtube.com/video/{h.VideoId}/edit",
            h.AppliedAt, h.CommentId is not null, h.SaveOnly);
    }

    /// <summary>The channel's new uploads that could be this handoff's, likely ones first.</summary>
    public async Task<IReadOnlyList<PhoneUploadCandidate>> FindCandidatesAsync(IServiceProvider services, PhoneHandoff handoff, CancellationToken ct)
    {
        var connections = services.GetRequiredService<YouTubeConnectionStore>();
        var token = await connections.GetAccessTokenAsync(handoff.UserId, handoff.ChannelId, ct).ConfigureAwait(false);
        var recent = await channelVideos.ListRecentAsync(token, handoff.ChannelId, RecentToList, ct).ConfigureAwait(false);
        var known = await KnownVideoIdsAsync(services, handoff.UserId, recent, ct).ConfigureAwait(false);
        return PhoneHandoffMatcher.Candidates(handoff, recent, known);
    }

    /// <summary>
    /// Puts the handoff's details on <paramref name="videoId"/>, records it with the app's
    /// published videos and posts the first comment. Returns the handoff as saved afterwards.
    /// </summary>
    /// <exception cref="YouTubePublishException">The video can't be edited; the handoff stays waiting.</exception>
    public async Task<PhoneHandoff> ApplyAsync(IServiceProvider services, string handoffId, string videoId, CancellationToken ct)
    {
        if (!YouTubeChannelVideosClient.IsVideoId(videoId))
            throw new YouTubePublishException("handoff-video-invalid", "Pick one of the videos in the list.");
        if (!_applying.TryAdd(handoffId, 0))
            throw new YouTubePublishException("handoff-busy", "The details are already being applied. Wait a moment.");

        try
        {
            var repository = services.GetRequiredService<IPhoneHandoffRepository>();
            // Read again inside the guard: the sweep or another tab may have finished it already.
            var handoff = await repository.GetAsync(handoffId, ct).ConfigureAwait(false)
                ?? throw new YouTubePublishException("handoff-missing", "That phone upload isn't in the list any more.");
            if (handoff.State is not (PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Expired))
                throw new YouTubePublishException("handoff-not-waiting", "The details were already applied, or the send didn't finish.");

            var connections = services.GetRequiredService<YouTubeConnectionStore>();
            var token = await connections.GetAccessTokenAsync(handoff.UserId, handoff.ChannelId, ct).ConfigureAwait(false);

            // Only a video on this channel that the app hasn't already published or claimed.
            var recent = await channelVideos.ListRecentAsync(token, handoff.ChannelId, RecentToList, ct).ConfigureAwait(false);
            var known = await KnownVideoIdsAsync(services, handoff.UserId, recent, ct).ConfigureAwait(false);
            if (!recent.Any(v => v.VideoId == videoId) || known.Contains(videoId))
                throw new YouTubePublishException("handoff-video-invalid",
                    "That video isn't among the channel's newest uploads, or AnimStudio already published it. Pick one from the list.");

            await channelVideos.UpdateDetailsAsync(token, videoId, new YouTubeVideoDetails(
                handoff.Title, handoff.Description, handoff.Tags, handoff.CategoryId, handoff.Privacy, handoff.MadeForKids), ct).ConfigureAwait(false);

            handoff.VideoId = videoId;
            handoff.AppliedAt = clock.GetUtcNow().UtcDateTime;
            handoff.State = PhoneHandoffState.Applied;
            handoff.ErrorCode = null;
            handoff.Error = null;
            await repository.UpsertAsync(handoff, CancellationToken.None).ConfigureAwait(false);
            logger.LogInformation("Applied phone handoff {HandoffId} to YouTube video {VideoId} on channel {ChannelId}",
                handoff.Id, videoId, handoff.ChannelId);

            await RecordPublicationAsync(services, handoff).ConfigureAwait(false);
            await PostFirstCommentAsync(connections, handoff).ConfigureAwait(false);
            await repository.UpsertAsync(handoff, CancellationToken.None).ConfigureAwait(false);
            return handoff;
        }
        finally
        {
            _applying.TryRemove(handoffId, out _);
        }
    }

    /// <summary>Checks one handoff's channel now, rather than at the next sweep, and applies a certain match.</summary>
    public async Task<PhoneHandoff> CheckNowAsync(IServiceProvider services, PhoneHandoff handoff, CancellationToken ct)
    {
        if (handoff.State != PhoneHandoffState.WaitingForPhone) return handoff;
        var repository = services.GetRequiredService<IPhoneHandoffRepository>();
        var waiting = (await repository.ListByUserAsync(handoff.UserId, null, 100, ct).ConfigureAwait(false))
            .Where(h => h.State == PhoneHandoffState.WaitingForPhone && h.ChannelId == handoff.ChannelId)
            .ToList();
        await MatchChannelAsync(services, handoff.UserId, handoff.ChannelId, waiting.Count > 0 ? waiting : [handoff], ct).ConfigureAwait(false);
        return await repository.GetAsync(handoff.Id, ct).ConfigureAwait(false) ?? handoff;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _stopping = stoppingToken;

        // Let startup (index creation, schema) finish first.
        try { await Task.Delay(TimeSpan.FromSeconds(30), clock, stoppingToken).ConfigureAwait(false); }
        catch (OperationCanceledException) { return; }

        await FailInterruptedSendsAsync(stoppingToken).ConfigureAwait(false);

        // Copies waiting on their render are started from their own, quicker loop: the
        // channel sweep below can be minutes apart, and waits on YouTube being configured.
        var renders = WaitForRendersAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var current = options.CurrentValue;
            var interval = TimeSpan.FromSeconds(Math.Clamp(current.PhoneHandoffCheckSeconds, 0, 3600));
            if (interval > TimeSpan.Zero && current.IsConfigured)
            {
                try
                {
                    await SweepAsync(interval, stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    // One bad sweep must not stop the next; the detail stays in the log.
                    logger.LogError(ex, "Phone handoff sweep failed");
                }
            }

            try
            {
                await Task.Delay(interval > TimeSpan.Zero ? interval : TimeSpan.FromMinutes(5), clock, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        await renders.ConfigureAwait(false);
    }

    /// <summary>How often copies queued with a render look for it to have finished.</summary>
    private static readonly TimeSpan RenderPollInterval = TimeSpan.FromSeconds(10);

    private async Task WaitForRendersAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await StartFinishedRendersAsync(ct).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Starting Drive copies for finished renders failed");
            }

            try
            {
                await Task.Delay(RenderPollInterval, clock, ct).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    /// <summary>
    /// Starts the copy of every queued handoff whose render has finished, and fails the ones
    /// whose render didn't. The state is saved as Sending before the copy starts, so a second
    /// pass never starts it twice.
    /// </summary>
    private async Task StartFinishedRendersAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPhoneHandoffRepository>();
        var waiting = await repository.ListByStateAsync(PhoneHandoffState.WaitingForRender, MaxPerSweep, ct).ConfigureAwait(false);
        if (waiting.Count == 0) return;

        var jobs = scope.ServiceProvider.GetRequiredService<IRenderJobRepository>();
        foreach (var handoff in waiting)
        {
            var job = await jobs.GetAsync(handoff.JobId, ct).ConfigureAwait(false);
            // Ids are only ever trusted together with their owner: a job that isn't this
            // handoff's user's is treated as gone.
            if (job is not null && !string.Equals(job.UserId, handoff.UserId, StringComparison.Ordinal)) job = null;
            if (job is null || !job.IsTerminal || job.OutputStorageKey is null)
            {
                if (job is not null && !job.IsTerminal) continue;
                handoff.State = PhoneHandoffState.Failed;
                handoff.ErrorCode = "render-failed";
                handoff.Error = "The render didn't finish, so nothing was saved to Google Drive.";
                await repository.UpsertAsync(handoff, ct).ConfigureAwait(false);
                continue;
            }

            handoff.State = PhoneHandoffState.Sending;
            handoff.TotalBytes = job.OutputSizeBytes ?? 0;
            await repository.UpsertAsync(handoff, ct).ConfigureAwait(false);
            StartSending(handoff, job.OutputStorageKey, job.OutputSizeBytes ?? 0);
        }
    }

    private int ExpireDays => Math.Clamp(options.CurrentValue.PhoneHandoffExpireDays, 1, 30);

    /// <summary>Copies left half-done by a restart can't be resumed: say so, so they can be sent again.</summary>
    private async Task FailInterruptedSendsAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var repository = scope.ServiceProvider.GetRequiredService<IPhoneHandoffRepository>();
            foreach (var h in await repository.ListByStateAsync(PhoneHandoffState.Sending, MaxPerSweep, ct).ConfigureAwait(false))
            {
                if (_sending.ContainsKey(h.Id)) continue;
                h.State = PhoneHandoffState.Failed;
                h.ErrorCode = "drive-interrupted";
                h.Error = "The server restarted before the copy to Google Drive finished. Send it again.";
                await repository.UpsertAsync(h, ct).ConfigureAwait(false);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Marking interrupted phone handoffs failed");
        }
    }

    private async Task SweepAsync(TimeSpan interval, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPhoneHandoffRepository>();
        var waiting = await repository.ListByStateAsync(PhoneHandoffState.WaitingForPhone, MaxPerSweep, ct).ConfigureAwait(false);
        if (waiting.Count == 0) return;

        var now = clock.GetUtcNow().UtcDateTime;
        foreach (var expired in waiting.Where(h => (h.SentAt ?? h.CreatedAt).AddDays(ExpireDays) < now))
        {
            expired.State = PhoneHandoffState.Expired;
            await repository.UpsertAsync(expired, ct).ConfigureAwait(false);
        }

        // A fresh handoff is checked every interval; one waiting over an hour every 15 minutes.
        bool Due(PhoneHandoff h)
        {
            if (h.State != PhoneHandoffState.WaitingForPhone) return false;
            var age = now - (h.SentAt ?? h.CreatedAt);
            var every = age < TimeSpan.FromHours(1) ? interval : TimeSpan.FromMinutes(15);
            return h.LastCheckedAt is null || now - h.LastCheckedAt >= every - TimeSpan.FromSeconds(5);
        }

        foreach (var channel in waiting.Where(h => h.State == PhoneHandoffState.WaitingForPhone)
                     .GroupBy(h => (h.UserId, h.ChannelId)))
        {
            if (!channel.Any(Due)) continue;
            try
            {
                await MatchChannelAsync(scope.ServiceProvider, channel.Key.UserId, channel.Key.ChannelId, [.. channel], ct).ConfigureAwait(false);
            }
            catch (YouTubePublishException ex)
            {
                logger.LogWarning("Checking channel {ChannelId} for phone uploads failed: {Code}", channel.Key.ChannelId, ex.Code);
                foreach (var h in channel)
                {
                    h.LastCheckedAt = now;
                    h.Warning = ex.Code is "youtube-reconnect" or "youtube-channel-not-connected" ? ex.Message : h.Warning;
                    await repository.UpsertAsync(h, ct).ConfigureAwait(false);
                }
            }
        }
    }

    /// <summary>Lists the channel once and applies each waiting handoff's certain match.</summary>
    private async Task MatchChannelAsync(IServiceProvider services, string userId, string channelId,
        IReadOnlyList<PhoneHandoff> waiting, CancellationToken ct)
    {
        var repository = services.GetRequiredService<IPhoneHandoffRepository>();
        var connections = services.GetRequiredService<YouTubeConnectionStore>();
        var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
        var recent = await channelVideos.ListRecentAsync(token, channelId, RecentToList, ct).ConfigureAwait(false);
        var known = await KnownVideoIdsAsync(services, userId, recent, ct).ConfigureAwait(false);
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var handoff in waiting)
        {
            var candidates = PhoneHandoffMatcher.Candidates(handoff, recent, known);
            if (PhoneHandoffMatcher.AutoPick(handoff, candidates, waiting) is { } videoId)
            {
                try
                {
                    await ApplyAsync(services, handoff.Id, videoId, ct).ConfigureAwait(false);
                    known.Add(videoId);
                    continue;
                }
                catch (YouTubePublishException ex) when (ex.Code is not ("youtube-unreachable" or "handoff-busy"))
                {
                    logger.LogWarning("Applying phone handoff {HandoffId} to video {VideoId} failed: {Code}", handoff.Id, videoId, ex.Code);
                    handoff.Warning = ex.Message;
                }
            }

            handoff.LastCheckedAt = now;
            // Read-modify-write of only the check time, so a concurrent apply isn't undone.
            var fresh = await repository.GetAsync(handoff.Id, ct).ConfigureAwait(false);
            if (fresh is { State: PhoneHandoffState.WaitingForPhone })
            {
                fresh.LastCheckedAt = now;
                fresh.Warning = handoff.Warning;
                await repository.UpsertAsync(fresh, ct).ConfigureAwait(false);
            }
        }
    }

    /// <summary>Of <paramref name="recent"/>, the ids already uploaded from the app or claimed by a handoff.</summary>
    private static async Task<HashSet<string>> KnownVideoIdsAsync(
        IServiceProvider services, string userId, IReadOnlyList<YouTubeChannelVideo> recent, CancellationToken ct)
    {
        var ids = recent.Select(v => v.VideoId).ToList();
        var publications = services.GetRequiredService<IYouTubePublicationRepository>();
        var handoffs = services.GetRequiredService<IPhoneHandoffRepository>();

        var known = (await publications.ListByVideoIdsAsync(userId, ids, ct).ConfigureAwait(false))
            .Select(p => p.VideoId).ToHashSet(StringComparer.Ordinal);
        foreach (var h in await handoffs.ListByUserAsync(userId, null, 200, ct).ConfigureAwait(false))
        {
            if (h.VideoId is { } claimed) known.Add(claimed);
        }
        return known;
    }

    private async Task SendAsync(string handoffId, string storageKey, long sizeBytes, CancellationTokenSource cancellation)
    {
        var ct = cancellation.Token;
        var slotTaken = false;
        string? work = null;
        await using var scope = scopes.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IPhoneHandoffRepository>();
        var handoff = await repository.GetAsync(handoffId, CancellationToken.None).ConfigureAwait(false);
        if (handoff is null)
        {
            Forget(handoffId);
            return;
        }

        try
        {
            await _sendSlots.WaitAsync(ct).ConfigureAwait(false);
            slotTaken = true;

            var store = scope.ServiceProvider.GetRequiredService<IObjectStore>();
            var driveConnections = scope.ServiceProvider.GetRequiredService<GoogleDriveConnectionStore>();

            Stream content;
            long length;
            if (handoff.Muted)
            {
                work = Path.Combine(Path.GetTempPath(), "animstudio-handoff", handoff.Id);
                var muted = await MuteAsync(store, storageKey, work, ct).ConfigureAwait(false);
                content = new FileStream(muted, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous);
                length = content.Length;
            }
            else
            {
                content = await store.OpenAsync(storageKey, ct).ConfigureAwait(false)
                    ?? throw new YouTubePublishException("video-missing", "The video file is no longer on the server. Render it again.");
                length = content.CanSeek ? content.Length : sizeBytes;
            }

            await using (content)
            {
                if (length <= 0)
                    throw new YouTubePublishException("video-empty", "The rendered file is empty or its size is unknown. Render it again.");
                handoff.TotalBytes = length;

                var target = new DriveTarget(handoff.UserId, handoff.DriveChannelId, handoff.DriveFolderName);
                var token = await driveConnections.GetAccessTokenAsync(target, ct).ConfigureAwait(false);
                var folderId = await driveConnections.EnsureFolderAsync(target, token, ct).ConfigureAwait(false);

                var fileId = await drive.UploadAsync(content, length, handoff.DriveFileName!, folderId,
                    handoff.SaveOnly
                        ? "Made with AnimStudio: " + handoff.Title
                        : "Upload this from the YouTube app (Create > Short > pick this video > Add sound). AnimStudio then fills in the title, description and settings for: "
                            + handoff.Title,
                    async (fresh, token2) => fresh ? await driveConnections.GetAccessTokenAsync(target, token2).ConfigureAwait(false) : token,
                    new Progress<long>(value => _progress[handoff.Id] = value),
                    ct).ConfigureAwait(false);

                handoff.DriveFileId = fileId;
                handoff.BytesSent = length;
                handoff.SentAt = clock.GetUtcNow().UtcDateTime;
                handoff.State = handoff.SaveOnly ? PhoneHandoffState.Saved : PhoneHandoffState.WaitingForPhone;
                logger.LogInformation("Phone handoff {HandoffId} for render {JobId} is in Google Drive", handoff.Id, handoff.JobId);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            handoff.State = PhoneHandoffState.Cancelled;
            handoff.Error = _stopping.IsCancellationRequested ? "The server stopped before the copy finished. Send it again." : "Cancelled.";
        }
        catch (YouTubePublishException ex)
        {
            handoff.State = PhoneHandoffState.Failed;
            handoff.ErrorCode = ex.Code;
            handoff.Error = ex.Message;
            logger.LogWarning("Sending render {JobId} to Google Drive failed: {Code}", handoff.JobId, ex.Code);
        }
        catch (Exception ex)
        {
            // Fail closed with a generic message; the detail stays in the server log.
            handoff.State = PhoneHandoffState.Failed;
            handoff.ErrorCode = "drive-failed";
            handoff.Error = "The copy to Google Drive failed unexpectedly. Check the server log and try again.";
            logger.LogError(ex, "Sending render {JobId} to Google Drive failed unexpectedly", handoff.JobId);
        }
        finally
        {
            if (slotTaken) _sendSlots.Release();
            if (_progress.TryGetValue(handoff.Id, out var last) && handoff.State is not (PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Saved))
                handoff.BytesSent = last;
            try
            {
                await repository.UpsertAsync(handoff, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Saving phone handoff {HandoffId} failed", handoff.Id);
            }
            Forget(handoff.Id);
            if (work is not null) TryDelete(work);
        }
    }

    /// <summary>
    /// The render with its sound taken out (picture copied, not re-encoded), for a Shorts sound
    /// to replace. Written to a work folder only this handoff uses.
    /// </summary>
    private async Task<string> MuteAsync(IObjectStore store, string storageKey, string work, CancellationToken ct)
    {
        Directory.CreateDirectory(work);
        const string input = "in.mp4";
        const string output = "out.mp4";
        await using (var source = await store.OpenAsync(storageKey, ct).ConfigureAwait(false)
                                  ?? throw new YouTubePublishException("video-missing", "The video file is no longer on the server. Render it again."))
        await using (var file = new FileStream(Path.Combine(work, input), FileMode.Create, FileAccess.Write, FileShare.None, 1 << 20, useAsync: true))
        {
            await source.CopyToAsync(file, 1 << 20, ct).ConfigureAwait(false);
        }

        try
        {
            var result = await ffmpeg.RunAsync(new FfmpegInvocation
            {
                Tool = FfmpegTool.Ffmpeg,
                WorkingDirectory = work,
                Arguments = ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-map", "0:v:0", "-c", "copy", "-an", "-movflags", "+faststart", output],
                Timeout = TimeSpan.FromMinutes(5),
                FailureExpected = true
            }, progress: null, ct).ConfigureAwait(false);

            var path = Path.Combine(work, output);
            if (result.ExitCode != 0 || !File.Exists(path) || new FileInfo(path).Length == 0)
                throw new YouTubePublishException("handoff-mute-failed", "The sound couldn't be taken out of the video. Send it with its sound instead.");
            return path;
        }
        catch (RenderException ex)
        {
            logger.LogWarning("Removing the sound for a phone handoff failed: {Code}", ex.Code);
            throw new YouTubePublishException("handoff-mute-failed", "The sound couldn't be taken out of the video on this server. Send it with its sound instead.");
        }
    }

    private async Task RecordPublicationAsync(IServiceProvider services, PhoneHandoff handoff)
    {
        try
        {
            var publications = services.GetRequiredService<YouTubePublicationService>();
            await publications.RecordAsync(handoff.UserId, handoff.ProjectId, handoff.JobId, handoff.ChannelId, handoff.ChannelTitle,
                handoff.VideoId!, handoff.Title, handoff.Privacy, handoff.RelatedVideoIds, CancellationToken.None, handoff.CategoryId)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            AddWarning(handoff, "The details are on YouTube, but the video couldn't be added to AnimStudio's list.");
            logger.LogError(ex, "Recording phone handoff {HandoffId} as published failed", handoff.Id);
        }
    }

    /// <summary>Best effort, like an ordinary upload's: the details are already on, so a comment that can't be posted is a warning.</summary>
    private async Task PostFirstCommentAsync(YouTubeConnectionStore connections, PhoneHandoff handoff)
    {
        if (handoff.FirstComment is not { Length: > 0 } text) return;
        var metadata = new NormalizedYouTubeMetadata(handoff.Title, handoff.Description, handoff.Tags, handoff.CategoryId,
            handoff.Privacy, handoff.MadeForKids, false);
        if (YouTubeCommentRules.WhyNotPostable(metadata) is { } reason)
        {
            AddWarning(handoff, reason);
            return;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(_stopping);
        timeout.CancelAfter(TimeSpan.FromMinutes(1));
        try
        {
            var token = await connections.GetAccessTokenAsync(handoff.UserId, handoff.ChannelId, timeout.Token).ConfigureAwait(false);
            handoff.CommentId = await comments.PostAsync(handoff.VideoId!, text, token, timeout.Token).ConfigureAwait(false);
        }
        catch (YouTubePublishException ex)
        {
            AddWarning(handoff, ex.Message);
        }
        catch (OperationCanceledException)
        {
            AddWarning(handoff, "The first comment took too long to post. Add it in YouTube Studio.");
        }
        catch (Exception ex)
        {
            AddWarning(handoff, "The first comment wasn't posted. Add it in YouTube Studio.");
            logger.LogError(ex, "Posting the first comment for phone handoff {HandoffId} failed unexpectedly", handoff.Id);
        }
    }

    private static void AddWarning(PhoneHandoff handoff, string message) =>
        handoff.Warning = handoff.Warning is null ? message : $"{handoff.Warning} {message}";

    private void Forget(string handoffId)
    {
        _progress.TryRemove(handoffId, out _);
        if (_sending.TryRemove(handoffId, out var cancellation)) cancellation.Dispose();
    }

    private void TryDelete(string folder)
    {
        try
        {
            Directory.Delete(folder, recursive: true);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogDebug(ex, "Handoff work folder {Folder} was not removed", folder);
        }
    }

    /// <summary>A Drive file name from the title: no path or reserved characters, at most 80 characters, always .mp4.</summary>
    public static string FileNameFor(string title)
    {
        var cleaned = UnsafeFileCharacters().Replace(title, " ");
        cleaned = Whitespace().Replace(cleaned, " ").Trim().Trim('.', ' ');
        if (cleaned.Length > 80) cleaned = cleaned[..80].TrimEnd();
        return (cleaned.Length == 0 ? "AnimStudio video" : cleaned) + ".mp4";
    }

    public override void Dispose()
    {
        _sendSlots.Dispose();
        base.Dispose();
    }

    [GeneratedRegex(@"[\\/:*?""<>|\p{C}]")]
    private static partial Regex UnsafeFileCharacters();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
