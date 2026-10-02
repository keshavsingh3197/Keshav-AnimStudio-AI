using AnimStudio.Application.Abstractions.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Storage;

/// <summary>
/// Measures the local object store by walking its folder.
/// <para>
/// A walk over a media library is tens of thousands of files, so the answer is kept for
/// <see cref="CacheFor"/> and only one walk runs at a time: the hub opening on several
/// tabs must not turn into several simultaneous scans of the same disk.
/// </para>
/// </summary>
public sealed class LocalStorageUsageService : IStorageUsageService, IDisposable
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(1);

    private readonly string _provider;
    private readonly string? _root;
    private readonly TimeProvider _clock;
    private readonly ILogger<LocalStorageUsageService> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private StorageUsage? _last;

    public LocalStorageUsageService(
        IConfiguration configuration, IHostEnvironment environment,
        TimeProvider clock, ILogger<LocalStorageUsageService> logger)
    {
        _clock = clock;
        _logger = logger;
        _provider = configuration["Storage:Provider"] is { Length: > 0 } p ? p : "Local";

        var configured = configuration["Storage:LocalRoot"];
        if (string.Equals(_provider, "Local", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(configured))
        {
            _root = Path.GetFullPath(Path.IsPathRooted(configured)
                ? configured
                : Path.Combine(environment.ContentRootPath, configured));
        }
    }

    public async Task<StorageUsage> GetAsync(bool refresh, CancellationToken ct)
    {
        if (!refresh && Fresh(_last) is { } cached) return cached;

        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            // Another caller may have measured while this one waited.
            if (!refresh && Fresh(_last) is { } measured) return measured;

            _last = _root is null
                ? new StorageUsage(_provider, false, 0, 0, null, null, [], _clock.GetUtcNow())
                : await Task.Run(() => Measure(_root, ct), ct).ConfigureAwait(false);
            return _last;
        }
        finally
        {
            _gate.Release();
        }
    }

    private StorageUsage? Fresh(StorageUsage? usage) =>
        usage is not null && _clock.GetUtcNow() - usage.MeasuredAt < CacheFor ? usage : null;

    private StorageUsage Measure(string root, CancellationToken ct)
    {
        var folders = new List<StorageFolderUsage>();
        long rootBytes = 0, rootFiles = 0;

        if (Directory.Exists(root))
        {
            var options = new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true,
                // A junction pointing back up the tree would otherwise be walked forever,
                // and one pointing elsewhere would count bytes this store does not own.
                AttributesToSkip = FileAttributes.ReparsePoint
            };

            foreach (var dir in new DirectoryInfo(root).EnumerateDirectories("*", new EnumerationOptions
                     { IgnoreInaccessible = true, AttributesToSkip = FileAttributes.ReparsePoint }))
            {
                ct.ThrowIfCancellationRequested();
                long bytes = 0, files = 0;
                foreach (var file in dir.EnumerateFiles("*", options))
                {
                    bytes += file.Length;
                    files++;
                }
                folders.Add(new StorageFolderUsage(dir.Name, bytes, files));
            }

            foreach (var file in new DirectoryInfo(root).EnumerateFiles())
            {
                rootBytes += file.Length;
                rootFiles++;
            }
        }

        if (rootFiles > 0) folders.Add(new StorageFolderUsage("(top level)", rootBytes, rootFiles));
        folders.Sort((a, b) => b.Bytes.CompareTo(a.Bytes));

        long? total = null, free = null;
        try
        {
            var drive = new DriveInfo(Path.GetPathRoot(root)!);
            if (drive.IsReady)
            {
                total = drive.TotalSize;
                free = drive.AvailableFreeSpace;
            }
        }
        catch (Exception ex) when (ex is IOException or ArgumentException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Could not read the size of the drive holding the object store.");
        }

        return new StorageUsage(
            _provider, true,
            folders.Sum(f => f.Bytes), folders.Sum(f => f.Files),
            total, free, folders, _clock.GetUtcNow());
    }

    public void Dispose() => _gate.Dispose();
}
