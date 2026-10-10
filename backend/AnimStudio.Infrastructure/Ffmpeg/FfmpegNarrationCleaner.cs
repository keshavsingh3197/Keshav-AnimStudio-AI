using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Voices;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>Runs <see cref="NarrationCleanup.Filter"/> over one recorded take in its own scratch workspace.</summary>
public sealed class FfmpegNarrationCleaner(
    IFfmpegRunner runner,
    IRenderWorkspaceFactory workspaces,
    IRenderCapabilities capabilities,
    ILogger<FfmpegNarrationCleaner> logger) : INarrationCleaner
{
    /// <summary>A few minutes of speech through these filters takes seconds; this only stops a hung process.</summary>
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(5);

    public bool IsAvailable => capabilities is FfmpegCapabilities { IsAvailable: true };

    public async Task<byte[]> CleanAsync(byte[] recording, CancellationToken ct)
    {
        if (!IsAvailable)
            throw new NarrationCleanupException("ffmpeg isn't available on this server, so recordings can't be cleaned.");

        await using var workspace = await workspaces.CreateAsync($"narration-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        await File.WriteAllBytesAsync(workspace.Resolve("in/take.wav"), recording, ct).ConfigureAwait(false);

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-hide_banner", "-nostdin", "-y",
                "-i", "in/take.wav",
                "-vn", "-af", NarrationCleanup.Filter,
                "-ac", "1", "-ar", $"{NarrationCleanup.SampleRate}", "-c:a", "pcm_s16le",
                "out/narration.wav"
            ],
            Timeout = Timeout
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            logger.LogWarning("Cleaning a narration take failed (exit {ExitCode}): {Stderr}",
                result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new NarrationCleanupException("That recording couldn't be cleaned. Try recording it again.");
        }

        return await File.ReadAllBytesAsync(workspace.Resolve("out/narration.wav"), ct).ConfigureAwait(false);
    }
}
