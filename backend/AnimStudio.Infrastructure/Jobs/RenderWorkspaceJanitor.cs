using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Jobs;

/// <summary>
/// Deletes abandoned render workspaces.
/// <para>
/// The orchestrator's <c>await using</c> covers every graceful path, but it cannot run if
/// the process is killed outright - and a single abandoned 1080p render leaves hundreds of
/// megabytes behind. The sweep on startup is therefore the only recovery for a hard kill,
/// and without it a few crashes during development quietly fill the disk, after which
/// every render fails with a confusing ffmpeg error.
/// </para>
/// <para>
/// It also trims the render preview cache, which otherwise keeps a full copy of every
/// render ever previewed, published or thumbnailed.
/// </para>
/// </summary>
public sealed class RenderWorkspaceJanitor(
    IServiceScopeFactory scopeFactory,
    IOptions<RenderOptions> options,
    IHostEnvironment environment,
    AppDataPaths dataPaths,
    ILogger<RenderWorkspaceJanitor> logger) : BackgroundService
{
    private readonly RenderOptions _options = options.Value;
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Startup sweep, slightly delayed so it does not compete with app start.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        using var timer = new PeriodicTimer(SweepInterval);

        do
        {
            try
            {
                await SweepAsync(stoppingToken).ConfigureAwait(false);
                TrimPreviewCache(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Workspace sweep failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        var scratchRoot = Path.IsPathRooted(_options.ScratchRoot)
            ? _options.ScratchRoot
            : Path.Combine(environment.ContentRootPath, _options.ScratchRoot);

        if (!Directory.Exists(scratchRoot)) return;

        using var scope = scopeFactory.CreateScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IRenderJobRepository>();
        var activeIds = (await jobs.ListActiveJobIdsAsync(ct).ConfigureAwait(false))
            .ToHashSet(StringComparer.Ordinal);

        var retention = TimeSpan.FromHours(_options.WorkspaceRetentionHours);
        var now = DateTime.UtcNow;
        var removed = 0;

        foreach (var directory in Directory.EnumerateDirectories(scratchRoot))
        {
            ct.ThrowIfCancellationRequested();

            var jobId = Path.GetFileName(directory);

            // A live job's workspace is in use; never touch it.
            if (activeIds.Contains(jobId)) continue;

            // Nor one this process still has open: voice conversions and studio takes have no job.
            if (LocalRenderWorkspace.IsOpen(directory)) continue;

            // A retained failure diagnosis is kept until it ages out.
            var isRetainedFailure = File.Exists(Path.Combine(directory, ".failed"));
            var lastWrite = Directory.GetLastWriteTimeUtc(directory);
            if (isRetainedFailure && now - lastWrite < retention) continue;

            try
            {
                Directory.Delete(directory, recursive: true);
                removed++;
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Could not delete stale workspace {Directory}.", jobId);
            }
        }

        if (removed > 0) logger.LogInformation("Swept {Count} stale render workspace(s).", removed);
    }

    private void TrimPreviewCache(CancellationToken ct)
    {
        var directory = dataPaths.PreviewCache;
        if (!Directory.Exists(directory)) return;

        var retention = TimeSpan.FromHours(_options.WorkspaceRetentionHours);
        var budget = Math.Max(0, (long)_options.PreviewCacheMaxGigabytes) * 1024 * 1024 * 1024;
        var now = DateTime.UtcNow;
        long total = 0;
        var removed = 0;

        // Newest first: everything past the retention window or the size budget goes.
        // A file still being streamed cannot be deleted on Windows; it is retried next sweep.
        var files = new DirectoryInfo(directory).EnumerateFiles()
            .OrderByDescending(f => f.LastWriteTimeUtc)
            .ToList();

        foreach (var file in files)
        {
            ct.ThrowIfCancellationRequested();

            var stale = now - file.LastWriteTimeUtc > retention;
            // A .partial is a download in progress until it is old enough to be a crash leftover.
            var inProgress = file.Name.EndsWith(".partial", StringComparison.OrdinalIgnoreCase);
            if (!stale && (inProgress || total + file.Length <= budget))
            {
                total += file.Length;
                continue;
            }

            try
            {
                file.Delete();
                removed++;
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                total += file.Length;
                logger.LogDebug(ex, "Could not evict preview {File}.", file.Name);
            }
        }

        if (removed > 0) logger.LogInformation("Evicted {Count} render preview(s).", removed);
    }
}
