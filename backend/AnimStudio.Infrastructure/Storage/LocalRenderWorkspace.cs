using System.Collections.Concurrent;
using System.Text;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Errors;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Storage;

/// <summary>
/// A per-job scratch directory that bridges object storage and ffmpeg.
/// </summary>
public sealed class LocalRenderWorkspace : IRenderWorkspace
{
    private readonly IObjectStore _store;
    private readonly ILogger _logger;
    private readonly bool _keepOnFailure;

    /// <summary>Storage key to the relative name it was materialized as.</summary>
    private readonly ConcurrentDictionary<string, Lazy<Task<string>>> _materialized =
        new(StringComparer.Ordinal);

    /// <summary>
    /// Workspaces still in use in this process. Not every workspace belongs to a render job
    /// (a voice conversion or a studio take has none), so the janitor asks this rather than
    /// the job list before deleting a folder: a CPU conversion can outlast its sweep interval.
    /// </summary>
    private static readonly ConcurrentDictionary<string, byte> Open = new(StringComparer.OrdinalIgnoreCase);

    internal static bool IsOpen(string rootPath) => Open.ContainsKey(Path.GetFullPath(rootPath));

    private bool _failed;
    private string? _failureReason;

    public LocalRenderWorkspace(
        string jobId, string rootPath, IObjectStore store, ILogger logger, bool keepOnFailure)
    {
        JobId = jobId;
        RootPath = rootPath;
        _store = store;
        _logger = logger;
        _keepOnFailure = keepOnFailure;

        Open[Path.GetFullPath(RootPath)] = 0;
        Directory.CreateDirectory(RootPath);
        // "merge" holds the intermediates of a batched join. Created up front like the rest
        // because ffmpeg writes its output itself and will not create a missing parent - it
        // exits -2 (ENOENT) with nothing on stderr that names the directory.
        foreach (var folder in (string[])
                 ["in", "sub", "graph", "scenes", "clips", "wm", "logs", "out", "merge"])
            Directory.CreateDirectory(Path.Combine(RootPath, folder));
    }

    public string JobId { get; }
    public string RootPath { get; }

    /// <summary>
    /// Joins a relative name to the root and asserts the result stays inside it. This is
    /// the path-traversal trust boundary; uploaded filenames never reach the filesystem,
    /// but the check is kept as defence in depth.
    /// </summary>
    public string Resolve(string relativeName)
    {
        if (string.IsNullOrWhiteSpace(relativeName))
            throw new RenderException(RenderErrorCode.WorkspaceError, "A file name is required.");

        if (Path.IsPathRooted(relativeName))
            throw new RenderException(RenderErrorCode.WorkspaceError,
                "Only workspace-relative names are allowed.");

        var full = Path.GetFullPath(Path.Combine(RootPath, relativeName));
        var boundary = Path.GetFullPath(RootPath) + Path.DirectorySeparatorChar;

        if (!full.StartsWith(boundary, StringComparison.Ordinal))
            throw new RenderException(RenderErrorCode.WorkspaceError,
                "Resolved path escapes the render workspace.");

        return full;
    }

    public Task<string> MaterializeAsync(
        string storageKey, string relativeName, CancellationToken ct) =>
        // A background shared by eight scenes should be fetched once, not eight times -
        // and callers fetch in parallel, so two of them asking for the same key at once
        // must share one copy rather than both writing the same file.
        _materialized.GetOrAdd(storageKey,
            _ => new Lazy<Task<string>>(() => CopyInAsync(storageKey, relativeName, ct))).Value;

    private async Task<string> CopyInAsync(
        string storageKey, string relativeName, CancellationToken ct)
    {
        var destination = Resolve(relativeName);
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);

        await using var source = await _store.OpenAsync(storageKey, ct).ConfigureAwait(false)
            ?? throw new RenderException(RenderErrorCode.AssetMissing,
                "A file this project needs is missing.", $"Storage key '{storageKey}' not found.");

        // Streamed in 1MB chunks: a video must never be buffered in memory whole.
        await using var file = new FileStream(destination, FileMode.Create, FileAccess.Write,
            FileShare.None, 1 << 20, useAsync: true);
        await source.CopyToAsync(file, 1 << 20, ct).ConfigureAwait(false);

        return relativeName;
    }

    public async Task<string> WriteTextAsync(string relativeName, string content, CancellationToken ct)
    {
        var destination = Resolve(relativeName);
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);

        // No BOM: ffmpeg's filter script and libass both prefer plain UTF-8.
        await File.WriteAllTextAsync(destination, content, new UTF8Encoding(false), ct)
            .ConfigureAwait(false);

        return relativeName;
    }

    public async Task PublishAsync(
        string relativeName, string storageKey, string contentType, CancellationToken ct)
    {
        var source = Resolve(relativeName);
        if (!File.Exists(source))
            throw new RenderException(RenderErrorCode.WorkspaceError,
                "The render produced no output file.", $"Expected '{relativeName}'.");

        await using var file = new FileStream(source, FileMode.Open, FileAccess.Read,
            FileShare.Read, 1 << 20, useAsync: true);
        await _store.SaveAsync(storageKey, file, contentType, ct).ConfigureAwait(false);
    }

    public void MarkFailed(string reason)
    {
        _failed = true;
        _failureReason = reason;
    }

    /// <summary>
    /// Deletes the whole directory. Runs on success, on exception and on cancellation, and
    /// never throws: a cleanup failure must not turn a completed render into a failed job.
    /// </summary>
    public ValueTask DisposeAsync()
    {
        Open.TryRemove(Path.GetFullPath(RootPath), out _);

        if (_failed && _keepOnFailure)
        {
            _logger.LogInformation(
                "Keeping workspace for failed job {JobId} for diagnosis ({Reason}).",
                JobId, _failureReason);
            try
            {
                File.WriteAllText(Path.Combine(RootPath, ".failed"),
                    $"{DateTimeOffset.UtcNow:O} {_failureReason}");
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not write the failure marker.");
            }

            return ValueTask.CompletedTask;
        }

        // ffmpeg can hold handles for a few milliseconds after exit, so retry briefly.
        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                if (Directory.Exists(RootPath)) Directory.Delete(RootPath, recursive: true);
                return ValueTask.CompletedTask;
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                if (attempt == 2)
                {
                    // The janitor will collect it on a later sweep.
                    _logger.LogWarning(ex,
                        "Could not delete workspace for job {JobId}; leaving it for the janitor.",
                        JobId);
                    return ValueTask.CompletedTask;
                }

                Thread.Sleep(200);
            }
        }

        return ValueTask.CompletedTask;
    }
}
