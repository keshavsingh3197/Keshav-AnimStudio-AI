using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.Workbooks;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Workbooks;

/// <summary>
/// Keeps an uploaded bundle between the preview and the apply.
/// </summary>
/// <remarks>
/// <para>
/// The bytes go to the object store, which is where every other uploaded file already lives;
/// the token index is held in memory. That split is deliberate. The bytes can be large and
/// must not sit in process memory, while the index is a handful of small records that only
/// matter for the next few minutes.
/// </para>
/// <para>
/// <b>The index is per-instance and does not survive a restart.</b> That is an accepted
/// limitation rather than an oversight: the worst case is a preview whose Apply button no
/// longer works, and the fix - upload again - is the same thing the user would do about an
/// expired token. Persisting it would mean a collection, an index and a sweeper to make a
/// two-minute handle durable.
/// </para>
/// <para>
/// A token is single-use. Consuming it on apply is what stops the same bundle being applied
/// twice by a double-clicked button, which would double every scene in the project.
/// </para>
/// </remarks>
public sealed class WorkbookImportStaging(
    IObjectStore store,
    TimeProvider clock,
    ILogger<WorkbookImportStaging> logger) : IWorkbookImportStaging
{
    /// <summary>
    /// Long enough to read a diff of sixty scenes, short enough that an abandoned upload
    /// is not left addressable all day.
    /// </summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(30);

    private readonly ConcurrentDictionary<string, StagedImport> _staged = new(StringComparer.Ordinal);

    public async Task<StagedImport> StageAsync(
        string projectId, Stream content, string contentHash, CancellationToken ct)
    {
        Sweep();

        // Server-generated and unguessable. It is not the authorization check - the project
        // in the route is - but it must not be enumerable either.
        var token = Guid.NewGuid().ToString("n");
        var storageKey = $"projects/{projectId}/imports/{token}.zip";

        await store.SaveAsync(storageKey, content, "application/zip", ct);

        var staged = new StagedImport(
            token, projectId, storageKey, contentHash,
            clock.GetUtcNow().UtcDateTime.Add(Lifetime));

        _staged[token] = staged;
        return staged;
    }

    public async Task<Stream?> OpenAsync(string projectId, string token, CancellationToken ct)
    {
        if (!_staged.TryGetValue(token, out var staged)) return null;

        // Checked even though the route is already authorized, so a token can never be
        // redeemed against a project other than the one it was staged for.
        if (!string.Equals(staged.ProjectId, projectId, StringComparison.Ordinal))
        {
            logger.LogWarning(
                "An import token staged for another project was presented to project {ProjectId}.",
                projectId);

            return null;
        }

        if (staged.ExpiresAtUtc <= clock.GetUtcNow().UtcDateTime)
        {
            await RemoveAsync(staged, ct).ConfigureAwait(false);
            return null;
        }

        return await store.OpenAsync(staged.StorageKey, ct).ConfigureAwait(false);
    }

    public async Task ConsumeAsync(string token, CancellationToken ct)
    {
        if (_staged.TryRemove(token, out var staged))
            await RemoveAsync(staged, ct).ConfigureAwait(false);
    }

    private async Task RemoveAsync(StagedImport staged, CancellationToken ct)
    {
        _staged.TryRemove(staged.Token, out _);

        try
        {
            await store.DeleteAsync(staged.StorageKey, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A leaked staged upload is a janitor's problem, not a reason to fail the
            // import the user is waiting on.
            logger.LogWarning(ex, "Could not delete a staged bundle import.");
        }
    }

    /// <summary>
    /// Drops expired entries on the way past. There is no timer: staging is only ever
    /// touched by a request, so a request is the only moment the index can have grown.
    /// </summary>
    private void Sweep()
    {
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var (token, staged) in _staged)
        {
            if (staged.ExpiresAtUtc > now) continue;

            if (_staged.TryRemove(token, out _))
            {
                // Fire and forget: the caller is mid-upload and this is housekeeping.
                _ = store.DeleteAsync(staged.StorageKey, CancellationToken.None);
            }
        }
    }
}
