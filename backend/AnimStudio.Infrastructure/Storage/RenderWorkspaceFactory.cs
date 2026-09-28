using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Errors;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Storage;

public sealed class RenderWorkspaceFactory(
    IObjectStore store,
    IOptions<RenderOptions> options,
    IHostEnvironment environment,
    ILogger<LocalRenderWorkspace> logger) : IRenderWorkspaceFactory
{
    private readonly RenderOptions _options = options.Value;

    /// <summary>Refuse to start a render that clearly cannot fit on disk.</summary>
    private const long MinimumFreeBytes = 2L * 1024 * 1024 * 1024;

    public Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct)
    {
        var scratchRoot = Path.IsPathRooted(_options.ScratchRoot)
            ? _options.ScratchRoot
            : Path.Combine(environment.ContentRootPath, _options.ScratchRoot);

        Directory.CreateDirectory(scratchRoot);
        EnsureDiskSpace(scratchRoot);

        var root = Path.Combine(scratchRoot, jobId);

        IRenderWorkspace workspace = new LocalRenderWorkspace(
            jobId, root, store, logger, _options.KeepWorkspaceOnFailure);

        return Task.FromResult(workspace);
    }

    private static void EnsureDiskSpace(string scratchRoot)
    {
        try
        {
            var drive = new DriveInfo(Path.GetPathRoot(Path.GetFullPath(scratchRoot))!);
            if (drive.IsReady && drive.AvailableFreeSpace < MinimumFreeBytes)
            {
                // Failing here beats a confusing ffmpeg "No space left on device" halfway in.
                throw new RenderException(RenderErrorCode.DiskFull,
                    "Not enough disk space to render this project.");
            }
        }
        catch (Exception ex) when (ex is ArgumentException or IOException)
        {
            // Cannot determine free space (unusual mount): proceed and let ffmpeg report.
        }
    }
}
