using AnimStudio.Application.Abstractions.Storage;

namespace AnimStudio.Infrastructure.Storage;

/// <summary>
/// Bridges the Application layer's <see cref="IObjectStore"/> port to the
/// <c>KeshavSingh.Storage</c> package. The indirection is what keeps the Application layer
/// free of a package reference and unit-testable with a fake.
/// </summary>
public sealed class KeshavObjectStoreAdapter(KeshavSingh.Storage.IObjectStore inner) : IObjectStore
{
    public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default) =>
        inner.SaveAsync(key, content, contentType, ct);

    public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
        inner.OpenAsync(key, ct);

    public Task DeleteAsync(string key, CancellationToken ct = default) =>
        inner.DeleteAsync(key, ct);
}
