namespace AnimStudio.Application.Abstractions.Storage;

/// <summary>
/// How much of the durable media store is in use - the number the project hub's storage
/// bar and the settings page show.
/// <para>
/// A port, not a property of <see cref="IObjectStore"/>: measuring means walking a disk,
/// which a bucket cannot do cheaply, so a provider that cannot answer says so
/// (<see cref="StorageUsage.IsMeasurable"/>) rather than reporting zero.
/// </para>
/// </summary>
public interface IStorageUsageService
{
    /// <param name="refresh">Measure now instead of returning the last measurement.</param>
    Task<StorageUsage> GetAsync(bool refresh, CancellationToken ct);
}

/// <param name="Provider">The configured storage provider, e.g. "Local".</param>
/// <param name="IsMeasurable">False for a provider whose usage cannot be read here.</param>
/// <param name="DiskTotalBytes">Size of the drive holding the store, when it is a local disk.</param>
/// <param name="DiskFreeBytes">Space left on that drive.</param>
/// <param name="Folders">Top-level folders of the store, largest first.</param>
public sealed record StorageUsage(
    string Provider,
    bool IsMeasurable,
    long UsedBytes,
    long FileCount,
    long? DiskTotalBytes,
    long? DiskFreeBytes,
    IReadOnlyList<StorageFolderUsage> Folders,
    DateTimeOffset MeasuredAt);

public sealed record StorageFolderUsage(string Name, long Bytes, long Files);
