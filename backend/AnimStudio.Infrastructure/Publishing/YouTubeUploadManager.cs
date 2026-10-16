using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Publishing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

public enum YouTubeUploadState
{
    Queued,
    Uploading,
    Completed,
    Failed,
    Cancelled
}

public sealed record YouTubeUploadStatus(
    string UploadId,
    string JobId,
    string ChannelId,
    string ChannelTitle,
    string Title,
    string Privacy,
    YouTubeUploadState State,
    long BytesSent,
    long TotalBytes,
    int Percent,
    string? VideoId,
    string? VideoUrl,
    string? StudioUrl,
    string? ErrorCode,
    string? Error,
    DateTime StartedAt,
    DateTime? CompletedAt,
    /// <summary>The saved record of the finished upload, once it exists.</summary>
    string? PublicationId = null,
    /// <summary>Something the user should know about a finished upload, e.g. the link wasn't saved.</summary>
    string? Warning = null,
    /// <summary>The first comment's thread id, once it is posted.</summary>
    string? CommentId = null,
    /// <summary>The same video on music.youtube.com, for an upload in the Music category.</summary>
    string? MusicUrl = null,
    /// <summary>A custom thumbnail was sent with this upload and YouTube accepted it.</summary>
    bool ThumbnailSet = false);

/// <summary>What the controller has already checked and resolved before an upload is queued.</summary>
public sealed record YouTubeUploadRequest(
    string UserId,
    string JobId,
    string StorageKey,
    long SizeBytes,
    string ChannelId,
    string ChannelTitle,
    NormalizedYouTubeMetadata Metadata,
    string ProjectId = "",
    IReadOnlyList<string>? RelatedVideoIds = null,
    /// <summary>Already normalized by <see cref="YouTubeCommentRules"/>; null posts nothing.</summary>
    string? FirstComment = null,
    /// <summary>
    /// A server-resolved file on local disk (a release kit's visualizer) to send instead of
    /// <see cref="StorageKey"/>. Never a path from the client.
    /// </summary>
    string? LocalFilePath = null,
    /// <summary>
    /// The custom thumbnail, already re-encoded by <see cref="YouTubeThumbnailService"/>; null
    /// lets YouTube pick one of its own frames.
    /// </summary>
    byte[]? ThumbnailJpeg = null);

/// <summary>
/// Runs uploads in the background so the publish button returns at once and the dialog can
/// show progress, and so closing the tab doesn't stop a half-sent video. Uploads live in
/// memory: a server restart ends any in flight (YouTube discards the unfinished session),
/// and finished ones drop off the list after <see cref="YouTubePublishOptions.KeepFinishedHours"/>.
/// </summary>
public sealed class YouTubeUploadManager : IHostedService, IDisposable
{
    private readonly IServiceScopeFactory _scopes;
    private readonly YouTubeVideoUploader _uploader;
    private readonly YouTubeCommentClient _comments;
    private readonly IOptionsMonitor<YouTubePublishOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<YouTubeUploadManager> _logger;
    private readonly ConcurrentDictionary<string, Entry> _uploads = new(StringComparer.Ordinal);
    private readonly CancellationTokenSource _stopping = new();
    private readonly SemaphoreSlim _slots;
    private readonly Lock _gate = new();

    public YouTubeUploadManager(
        IServiceScopeFactory scopes,
        YouTubeVideoUploader uploader,
        YouTubeCommentClient comments,
        IOptionsMonitor<YouTubePublishOptions> options,
        TimeProvider clock,
        ILogger<YouTubeUploadManager> logger)
    {
        _scopes = scopes;
        _uploader = uploader;
        _comments = comments;
        _options = options;
        _clock = clock;
        _logger = logger;
        _slots = new SemaphoreSlim(Math.Clamp(options.CurrentValue.MaxConcurrentUploads, 1, 8));
    }

    public YouTubeUploadStatus Start(YouTubeUploadRequest request)
    {
        Prune();

        Entry entry;
        lock (_gate)
        {
            // A second click on Publish, or the same video to the same channel while it is still going, is the same upload.
            var running = _uploads.Values.FirstOrDefault(e =>
                e.Request.UserId == request.UserId && e.Request.JobId == request.JobId
                && e.Request.ChannelId == request.ChannelId && !e.IsFinished);
            if (running is not null) return running.Snapshot();

            var active = _uploads.Values.Count(e => e.Request.UserId == request.UserId && !e.IsFinished);
            if (active >= Math.Max(1, _options.CurrentValue.MaxUploadsPerUser))
                throw new YouTubePublishException("youtube-too-many-uploads", "Wait for one of your uploads to finish before starting another.");

            // The picture is held by the entry only until it is sent, not for as long as the entry is listed.
            entry = new Entry(Guid.NewGuid().ToString("N"), request with { ThumbnailJpeg = null }, _clock.GetUtcNow().UtcDateTime,
                CancellationTokenSource.CreateLinkedTokenSource(_stopping.Token))
            {
                Thumbnail = request.ThumbnailJpeg
            };
            _uploads[entry.Id] = entry;
        }

        _ = Task.Run(() => RunAsync(entry));
        return entry.Snapshot();
    }

    public YouTubeUploadStatus? Get(string userId, string uploadId) =>
        _uploads.TryGetValue(uploadId, out var entry) && entry.Request.UserId == userId ? entry.Snapshot() : null;

    public IReadOnlyList<YouTubeUploadStatus> List(string userId, string? jobId)
    {
        Prune();
        return [.. _uploads.Values
            .Where(e => e.Request.UserId == userId && (jobId is null || e.Request.JobId == jobId))
            .OrderByDescending(e => e.StartedAt)
            .Select(e => e.Snapshot())];
    }

    public bool Cancel(string userId, string uploadId)
    {
        if (!_uploads.TryGetValue(uploadId, out var entry) || entry.Request.UserId != userId || entry.IsFinished) return false;
        try
        {
            entry.Cancellation.Cancel();
            return true;
        }
        catch (ObjectDisposedException)
        {
            // Finished between the check and the cancel.
            return false;
        }
    }

    private async Task RunAsync(Entry entry)
    {
        var request = entry.Request;
        var ct = entry.Cancellation.Token;
        var slotTaken = false;

        try
        {
            await _slots.WaitAsync(ct).ConfigureAwait(false);
            slotTaken = true;
            entry.State = YouTubeUploadState.Uploading;

            await using var scope = _scopes.CreateAsyncScope();
            var store = scope.ServiceProvider.GetRequiredService<IObjectStore>();
            var connections = scope.ServiceProvider.GetRequiredService<YouTubeConnectionStore>();

            await using var content = await OpenContentAsync(store, request, ct).ConfigureAwait(false)
                ?? throw new YouTubePublishException("video-missing", "The video file is no longer on the server. Render or build it again.");

            var length = content.CanSeek ? content.Length : request.SizeBytes;
            if (length <= 0)
                throw new YouTubePublishException("video-empty", "The rendered file is empty or its size is unknown. Render it again.");
            entry.TotalBytes = length;

            var video = await _uploader.UploadAsync(
                content,
                length,
                request.Metadata,
                (_, token) => connections.GetAccessTokenAsync(request.UserId, request.ChannelId, token),
                new Progress(entry),
                ct).ConfigureAwait(false);

            entry.VideoId = video.VideoId;
            entry.BytesSent = length;
            _logger.LogInformation("Render {JobId} uploaded to YouTube channel {ChannelId} as video {VideoId}",
                request.JobId, request.ChannelId, video.VideoId);

            // Saved before the state flips, so a client that sees Completed finds the link in the list.
            await RecordPublicationAsync(scope.ServiceProvider, entry, video.VideoId).ConfigureAwait(false);
            // Before Completed too, so the dialog's last poll already says whether it went up.
            await PostFirstCommentAsync(connections, entry, video.VideoId).ConfigureAwait(false);
            await SetThumbnailAsync(connections, entry, video.VideoId).ConfigureAwait(false);
            entry.State = YouTubeUploadState.Completed;

            try
            {
                await connections.MarkUploadedAsync(request.UserId, request.ChannelId, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                // Bookkeeping only: the video is uploaded, so this must not turn it into a failure.
                _logger.LogWarning(ex, "Recording the last upload time for channel {ChannelId} failed", request.ChannelId);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            entry.State = YouTubeUploadState.Cancelled;
            entry.Error = _stopping.IsCancellationRequested ? "The server stopped before the upload finished." : "Upload cancelled.";
        }
        catch (YouTubePublishException ex)
        {
            entry.State = YouTubeUploadState.Failed;
            entry.ErrorCode = ex.Code;
            entry.Error = ex.Message;
            _logger.LogWarning("YouTube upload of render {JobId} failed: {Code}", request.JobId, ex.Code);
        }
        catch (Exception ex)
        {
            // Fail closed with a generic message; the detail stays in the server log.
            entry.State = YouTubeUploadState.Failed;
            entry.ErrorCode = "youtube-upload-failed";
            entry.Error = "The upload failed unexpectedly. Check the server log and try again.";
            _logger.LogError(ex, "YouTube upload of render {JobId} failed unexpectedly", request.JobId);
        }
        finally
        {
            entry.CompletedAt = _clock.GetUtcNow().UtcDateTime;
            if (slotTaken) _slots.Release();
            entry.Thumbnail = null;
            entry.Cancellation.Dispose();
        }
    }

    private static async Task<Stream?> OpenContentAsync(IObjectStore store, YouTubeUploadRequest request, CancellationToken ct)
    {
        if (request.LocalFilePath is null)
            return await store.OpenAsync(request.StorageKey, ct).ConfigureAwait(false);

        try
        {
            return new FileStream(request.LocalFilePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous);
        }
        catch (Exception ex) when (ex is FileNotFoundException or DirectoryNotFoundException)
        {
            // The kit expired and was swept between publishing and the upload starting.
            return null;
        }
    }

    /// <summary>
    /// Saves the finished upload's link so the render page can open it on YouTube long after
    /// this in-memory entry is gone. The video is already on YouTube by now, so a failed save
    /// is logged and reported on the entry rather than turning the upload into a failure.
    /// </summary>
    private async Task RecordPublicationAsync(IServiceProvider services, Entry entry, string videoId)
    {
        var request = entry.Request;
        try
        {
            var publications = services.GetRequiredService<YouTubePublicationService>();
            var saved = await publications.RecordAsync(
                request.UserId, request.ProjectId, request.JobId, request.ChannelId, request.ChannelTitle,
                videoId, request.Metadata.Title, request.Metadata.Privacy, request.RelatedVideoIds ?? [],
                CancellationToken.None, request.Metadata.CategoryId).ConfigureAwait(false);
            entry.PublicationId = saved.Id;
        }
        catch (Exception ex)
        {
            entry.Warning = "The video is on YouTube, but its link couldn't be saved in AnimStudio. Copy the link from here.";
            _logger.LogError(ex, "Saving YouTube video {VideoId} for render {JobId} failed", videoId, request.JobId);
        }
    }

    /// <summary>
    /// Waits between tries while YouTube catches up with a video it has only just accepted:
    /// right after the upload, <c>commentThreads.insert</c> can still answer "video not found".
    /// </summary>
    private static readonly TimeSpan[] CommentRetryDelays = [TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(15)];

    /// <summary>
    /// Posts the upload's first comment, best effort: the video is already on YouTube, so a
    /// comment that can't be posted becomes a warning on the entry, never a failed upload.
    /// </summary>
    private async Task PostFirstCommentAsync(YouTubeConnectionStore connections, Entry entry, string videoId)
    {
        var request = entry.Request;
        if (request.FirstComment is not { Length: > 0 } text) return;

        if (YouTubeCommentRules.WhyNotPostable(request.Metadata) is { } reason)
        {
            AddWarning(entry, reason);
            return;
        }

        // Not tied to the upload's cancellation: the upload is done, and Cancel no longer applies.
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(_stopping.Token);
        timeout.CancelAfter(TimeSpan.FromMinutes(1));
        var ct = timeout.Token;

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                var token = await connections.GetAccessTokenAsync(request.UserId, request.ChannelId, ct).ConfigureAwait(false);
                entry.CommentId = await _comments.PostAsync(videoId, text, token, ct).ConfigureAwait(false);
                _logger.LogInformation("Posted the first comment on YouTube video {VideoId} for render {JobId}", videoId, request.JobId);
                return;
            }
            catch (YouTubePublishException ex) when (ex.Code is "youtube-comment-not-ready" or "youtube-unreachable"
                                                     && attempt < CommentRetryDelays.Length)
            {
                try
                {
                    await Task.Delay(CommentRetryDelays[attempt], _clock, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    AddWarning(entry, "The first comment wasn't posted before the server stopped. Add it in YouTube Studio.");
                    return;
                }
            }
            catch (YouTubePublishException ex)
            {
                AddWarning(entry, ex.Message);
                return;
            }
            catch (OperationCanceledException)
            {
                AddWarning(entry, "The first comment took too long to post. Add it in YouTube Studio.");
                return;
            }
            catch (Exception ex)
            {
                AddWarning(entry, "The first comment wasn't posted. Add it in YouTube Studio.");
                _logger.LogError(ex, "Posting the first comment on YouTube video {VideoId} failed unexpectedly", videoId);
                return;
            }
        }
    }

    /// <summary>
    /// Sets the custom thumbnail, best effort like the first comment: the video is already up,
    /// so a refusal (most often an unverified channel) becomes a warning saying how to finish.
    /// </summary>
    private async Task SetThumbnailAsync(YouTubeConnectionStore connections, Entry entry, string videoId)
    {
        if (entry.Thumbnail is not { Length: > 0 } jpeg) return;
        var request = entry.Request;

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(_stopping.Token);
        timeout.CancelAfter(TimeSpan.FromMinutes(1));
        try
        {
            var refused = await _uploader.SetThumbnailAsync(
                videoId, jpeg,
                (_, token) => connections.GetAccessTokenAsync(request.UserId, request.ChannelId, token),
                timeout.Token).ConfigureAwait(false);
            if (refused is null)
            {
                entry.ThumbnailSet = true;
                _logger.LogInformation("Set the custom thumbnail on YouTube video {VideoId} for render {JobId}", videoId, request.JobId);
            }
            else
            {
                AddWarning(entry, YouTubeThumbnailRules.RefusedMessage(refused));
            }
        }
        catch (OperationCanceledException)
        {
            AddWarning(entry, "The custom thumbnail took too long to send. Add it in YouTube Studio.");
        }
        catch (YouTubePublishException ex)
        {
            AddWarning(entry, ex.Message);
        }
        catch (Exception ex)
        {
            AddWarning(entry, YouTubeThumbnailRules.RefusedMessage(null));
            _logger.LogError(ex, "Setting the thumbnail on YouTube video {VideoId} failed unexpectedly", videoId);
        }
    }

    private static void AddWarning(Entry entry, string message) =>
        entry.Warning = entry.Warning is null ? message : $"{entry.Warning} {message}";

    private void Prune()
    {
        var cutoff = _clock.GetUtcNow().UtcDateTime - TimeSpan.FromHours(Math.Clamp(_options.CurrentValue.KeepFinishedHours, 1, 24 * 7));
        foreach (var (id, entry) in _uploads)
        {
            if (entry.IsFinished && entry.CompletedAt < cutoff) _uploads.TryRemove(id, out _);
        }
    }

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _stopping.Cancel();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _stopping.Dispose();
        _slots.Dispose();
    }

    private sealed class Progress(Entry entry) : IProgress<long>
    {
        public void Report(long value) => entry.BytesSent = value;
    }

    private sealed class Entry(string id, YouTubeUploadRequest request, DateTime startedAt, CancellationTokenSource cancellation)
    {
        private volatile YouTubeUploadState _state = YouTubeUploadState.Queued;
        private long _bytesSent;
        private long _totalBytes = request.SizeBytes;

        public string Id { get; } = id;
        public YouTubeUploadRequest Request { get; } = request;
        public DateTime StartedAt { get; } = startedAt;
        public CancellationTokenSource Cancellation { get; } = cancellation;

        public YouTubeUploadState State { get => _state; set => _state = value; }
        public long BytesSent { get => Interlocked.Read(ref _bytesSent); set => Interlocked.Exchange(ref _bytesSent, value); }
        public long TotalBytes { get => Interlocked.Read(ref _totalBytes); set => Interlocked.Exchange(ref _totalBytes, value); }
        public string? VideoId { get; set; }
        public string? ErrorCode { get; set; }
        public string? Error { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? PublicationId { get; set; }
        public string? Warning { get; set; }
        public string? CommentId { get; set; }
        public byte[]? Thumbnail { get; set; }
        public bool ThumbnailSet { get; set; }

        public bool IsFinished => State is YouTubeUploadState.Completed or YouTubeUploadState.Failed or YouTubeUploadState.Cancelled;

        public YouTubeUploadStatus Snapshot()
        {
            var total = TotalBytes;
            var sent = BytesSent;
            var videoId = VideoId;
            var state = State;
            return new YouTubeUploadStatus(
                Id, Request.JobId, Request.ChannelId, Request.ChannelTitle,
                Request.Metadata.Title, Request.Metadata.Privacy,
                state, sent, total,
                state == YouTubeUploadState.Completed ? 100 : (int)Math.Clamp(sent * 100 / Math.Max(1, total), 0, 99),
                videoId,
                videoId is null ? null : $"https://youtu.be/{videoId}",
                videoId is null ? null : $"https://studio.youtube.com/video/{videoId}/edit",
                ErrorCode, Error, StartedAt, CompletedAt, PublicationId, Warning, CommentId,
                videoId is null ? null : YouTubeRelatedVideos.MusicUrlFor(videoId, Request.Metadata.CategoryId),
                ThumbnailSet);
        }
    }
}
