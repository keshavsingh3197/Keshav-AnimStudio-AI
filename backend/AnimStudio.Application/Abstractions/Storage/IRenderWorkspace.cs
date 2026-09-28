namespace AnimStudio.Application.Abstractions.Storage;

/// <summary>
/// A per-job scratch directory on real local disk.
/// <para>
/// This exists to resolve a hard tension: <see cref="IObjectStore"/> is stream-only by
/// design, but ffmpeg needs real file paths it can seek within and re-open. Streaming is
/// not enough, so inputs are materialized into a scratch directory, ffmpeg runs with that
/// directory as its working directory, and outputs are streamed back into the store.
/// </para>
/// <para>
/// Because ffmpeg's working directory IS this root, every path handed to ffmpeg is a plain
/// relative name. That removes the need to escape absolute paths inside filter arguments -
/// the single nastiest class of ffmpeg bug, and one that behaves differently on Windows
/// and Linux.
/// </para>
/// </summary>
public interface IRenderWorkspace : IAsyncDisposable
{
    string JobId { get; }

    /// <summary>Absolute host-native root. Used only as ffmpeg's working directory.</summary>
    string RootPath { get; }

    /// <summary>Joins a relative name to the root, refusing anything that escapes it.</summary>
    string Resolve(string relativeName);

    /// <summary>
    /// Copies an object out of storage into the workspace and returns its relative name.
    /// Repeated calls for the same key reuse the first copy, so a background shared by
    /// eight scenes is fetched once.
    /// </summary>
    Task<string> MaterializeAsync(string storageKey, string relativeName, CancellationToken ct);

    Task<string> WriteTextAsync(string relativeName, string content, CancellationToken ct);

    Task PublishAsync(string relativeName, string storageKey, string contentType, CancellationToken ct);

    /// <summary>Marks the job failed so diagnostics can be retained instead of swept.</summary>
    void MarkFailed(string reason);
}

public interface IRenderWorkspaceFactory
{
    Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct);
}
