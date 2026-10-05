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
    DateTime? CompletedAt);

/// <summary>What the controller has already checked and resolved before an upload is queued.</summary>
public sealed record YouTubeUploadRequest(
    string UserId,
    string JobId,
    string StorageKey,
    long SizeBytes,
    string ChannelId,
    string ChannelTitle,
    NormalizedYouTubeMetadata Metadata);

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
        IOptionsMonitor<YouTubePublishOptions> options,
        TimeProvider clock,
        ILogger<YouTubeUploadManager> logger)
    {
        _scopes = scopes;
        _uploader = uploader;
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

            entry = new Entry(Guid.NewGuid().ToString("N"), request, _clock.GetUtcNow().UtcDateTime,
                CancellationTokenSource.CreateLinkedTokenSource(_stopping.Token));
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

            await using var content = await store.OpenAsync(request.StorageKey, ct).ConfigureAwait(false)
                ?? throw new YouTubePublishException("video-missing", "The rendered file is no longer on the server. Render it again.");

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
            entry.State = YouTubeUploadState.Completed;

            await connections.MarkUploadedAsync(request.UserId, request.ChannelId, CancellationToken.None).ConfigureAwait(false);
            _logger.LogInformation("Render {JobId} uploaded to YouTube channel {ChannelId} as video {VideoId}",
                request.JobId, request.ChannelId, video.VideoId);
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
            entry.Cancellation.Dispose();
        }
    }

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
                ErrorCode, Error, StartedAt, CompletedAt);
        }
    }
}
