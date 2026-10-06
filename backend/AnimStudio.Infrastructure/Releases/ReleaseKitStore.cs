using System.Collections.Concurrent;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Releases;

public sealed record ReleaseKitTicket(string OwnerUserId, string WorkDirectory, IReadOnlySet<string> Files, DateTime CreatedAt);

/// <summary>
/// Finished release kits, by id, for 24 hours. In memory on purpose: a kit is scratch output
/// to download, and after a restart its folder is swept like any other expired one.
/// Shared so another feature (Go Live) can use a kit's files without the browser uploading
/// them again - always through <see cref="TryGetOwned"/>, which only returns the caller's own kit.
/// </summary>
public sealed class ReleaseKitStore(AppDataPaths dataPaths, TimeProvider clock, ILogger<ReleaseKitStore> logger)
{
    public static readonly TimeSpan KitLifetime = TimeSpan.FromHours(24);

    private readonly ConcurrentDictionary<string, ReleaseKitTicket> _kits = new(StringComparer.Ordinal);

    public void Add(string jobId, ReleaseKitTicket ticket) => _kits[jobId] = ticket;

    /// <summary>The kit if it exists and belongs to <paramref name="userId"/>; someone else's kit reads as missing.</summary>
    public ReleaseKitTicket? TryGetOwned(string jobId, string userId)
    {
        if (!_kits.TryGetValue(jobId, out var kit)) return null;
        if (string.Equals(kit.OwnerUserId, userId, StringComparison.Ordinal)) return kit;

        logger.LogWarning("User {UserId} was refused release kit {JobId} owned by another user", userId, jobId);
        return null;
    }

    /// <summary>The full path of one kit file, only if the kit lists it and it is a known kit file name.</summary>
    public static string? FilePath(ReleaseKitTicket kit, string name)
    {
        if (!kit.Files.Contains(name) || !FfmpegReleaseKitBuilder.KitFiles.ContainsKey(name)) return null;
        var path = Path.Combine(kit.WorkDirectory, name);
        return File.Exists(path) ? path : null;
    }

    /// <summary>Kits are scratch output: anything older than a day is removed, listed or not.</summary>
    public void PurgeExpired()
    {
        var cutoff = clock.GetUtcNow().UtcDateTime - KitLifetime;

        foreach (var (id, kit) in _kits)
        {
            if (kit.CreatedAt < cutoff && _kits.TryRemove(id, out _))
                TryDelete(kit.WorkDirectory);
        }

        // Kits from before a restart are no longer in the table but are still on disk.
        if (!Directory.Exists(dataPaths.Releases)) return;
        foreach (var directory in Directory.EnumerateDirectories(dataPaths.Releases))
        {
            if (Directory.GetLastWriteTimeUtc(directory) < cutoff && !_kits.ContainsKey(Path.GetFileName(directory)))
                TryDelete(directory);
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
            logger.LogWarning(ex, "Could not remove release kit folder {Folder}", Path.GetFileName(directory));
        }
    }
}
