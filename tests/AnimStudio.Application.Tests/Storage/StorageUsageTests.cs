using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Storage;

/// <summary>
/// The storage bar's numbers: measured from the store's folder, cached so the hub opening
/// does not rescan a disk, and never reported as zero for a provider that cannot be read.
/// </summary>
public sealed class StorageUsageTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-storage-" + Guid.NewGuid().ToString("n"));
    private readonly ManualClock _clock = new();

    public StorageUsageTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    private LocalStorageUsageService Service(string provider = "Local") => new(
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Storage:Provider"] = provider,
            ["Storage:LocalRoot"] = _root
        }).Build(),
        new Env(), _clock, NullLogger<LocalStorageUsageService>.Instance);

    private void Write(string relative, int bytes)
    {
        var path = Path.Combine(_root, relative);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllBytes(path, new byte[bytes]);
    }

    [Fact]
    public async Task Adds_up_every_file_and_breaks_it_down_by_top_level_folder_largest_first()
    {
        Write("assets/a.mp4", 3000);
        Write("assets/nested/b.mp4", 2000);
        Write("renders/out.mp4", 1000);
        Write("loose.json", 10);

        var usage = await Service().GetAsync(refresh: false, CancellationToken.None);

        Assert.True(usage.IsMeasurable);
        Assert.Equal(6010, usage.UsedBytes);
        Assert.Equal(4, usage.FileCount);
        Assert.Equal(["assets", "renders", "(top level)"], usage.Folders.Select(f => f.Name));
        Assert.Equal(5000, usage.Folders[0].Bytes);
        Assert.Equal(2, usage.Folders[0].Files);
    }

    [Fact]
    public async Task Reuses_a_recent_measurement_and_remeasures_when_asked_or_once_stale()
    {
        var service = Service();
        Write("assets/a.mp4", 100);
        Assert.Equal(100, (await service.GetAsync(false, CancellationToken.None)).UsedBytes);

        Write("assets/b.mp4", 50);
        Assert.Equal(100, (await service.GetAsync(false, CancellationToken.None)).UsedBytes);
        Assert.Equal(150, (await service.GetAsync(true, CancellationToken.None)).UsedBytes);

        Write("assets/c.mp4", 25);
        _clock.Advance(TimeSpan.FromMinutes(2));
        Assert.Equal(175, (await service.GetAsync(false, CancellationToken.None)).UsedBytes);
    }

    [Fact]
    public async Task Says_a_bucket_cannot_be_measured_rather_than_reporting_it_empty()
    {
        var usage = await Service("S3").GetAsync(false, CancellationToken.None);

        Assert.False(usage.IsMeasurable);
        Assert.Equal(0, usage.UsedBytes);
    }

    [Fact]
    public void Fills_against_the_quota_when_one_is_set_and_the_drive_otherwise()
    {
        var usage = new StorageUsage("Local", true, 1024, 1, DiskTotalBytes: 500L << 30, DiskFreeBytes: 100L << 30,
            [], DateTimeOffset.UnixEpoch);

        var withQuota = usage.ToSummary(quotaGb: 50);
        Assert.Equal("quota", withQuota.CapacitySource);
        Assert.Equal(50L << 30, withQuota.CapacityBytes);

        var noQuota = usage.ToSummary(quotaGb: null);
        Assert.Equal("disk", noQuota.CapacitySource);
        Assert.Equal(500L << 30, noQuota.CapacityBytes);

        var unknown = (usage with { DiskTotalBytes = null }).ToSummary(null);
        Assert.Equal("none", unknown.CapacitySource);
        Assert.Null(unknown.CapacityBytes);
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 10, 2, 12, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => _now;
        public void Advance(TimeSpan by) => _now += by;
    }

    private sealed class Env : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Test";
        public string ApplicationName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
