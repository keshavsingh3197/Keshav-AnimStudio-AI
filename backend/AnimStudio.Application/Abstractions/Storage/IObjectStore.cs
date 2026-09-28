namespace AnimStudio.Application.Abstractions.Storage;

/// <summary>
/// Blob storage port. Mirrors KeshavSingh.Storage's IObjectStore so the Application layer
/// depends on its own abstraction rather than the package (Clean Architecture), and so it
/// can be faked in tests.
/// <para>
/// Deliberately stream-in/stream-out with no path accessor: callers must not assume the
/// bytes live on a local disk, because the same code has to work against S3/R2 later.
/// Keys are always server-composed and never derived from a client filename.
/// </para>
/// </summary>
public interface IObjectStore
{
    Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default);
    Task<Stream?> OpenAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
}
