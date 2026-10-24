using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Effects;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Effects;

/// <summary>
/// A 320px JPEG from a little way into a stored video, for the effects library's cards.
/// Staged through a temp directory like the probe, because ffmpeg needs a real path and the
/// store may not be a local disk. A failure only means the card shows a placeholder.
/// </summary>
public sealed class FfmpegEffectThumbnailer(
    IFfmpegRunner runner,
    IObjectStore store,
    IOptions<FfmpegOptions> options,
    ILogger<FfmpegEffectThumbnailer> logger) : IEffectThumbnailer
{
    public async Task<bool> CreateAsync(string videoKey, string thumbnailKey, CancellationToken ct)
    {
        var directory = Path.Combine(Path.GetTempPath(), "animstudio-effect-thumb", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(directory);

        // Both names are fixed here; only the (server-composed) key's extension is reused.
        var input = "in" + Path.GetExtension(videoKey);
        const string output = "thumb.jpg";

        try
        {
            await using (var source = await store.OpenAsync(videoKey, ct).ConfigureAwait(false))
            {
                if (source is null) return false;
                await using var file = new FileStream(Path.Combine(directory, input), FileMode.Create, FileAccess.Write,
                    FileShare.None, 1 << 20, useAsync: true);
                await source.CopyToAsync(file, 1 << 20, ct).ConfigureAwait(false);
            }

            // Half a second in: a stinger's first frame is usually blank or fully transparent.
            var result = await runner.RunAsync(new FfmpegInvocation
            {
                Tool = FfmpegTool.Ffmpeg,
                WorkingDirectory = directory,
                Arguments = ["-y", "-ss", "0.5", "-i", input, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "4", output],
                Timeout = TimeSpan.FromSeconds(Math.Max(15, options.Value.ProbeTimeoutSeconds)),
                FailureExpected = true
            }, progress: null, ct).ConfigureAwait(false);

            var path = Path.Combine(directory, output);
            if (result.ExitCode != 0 || !File.Exists(path))
            {
                // A clip shorter than half a second has no frame there; take the first one.
                result = await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = directory,
                    Arguments = ["-y", "-i", input, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "4", output],
                    Timeout = TimeSpan.FromSeconds(Math.Max(15, options.Value.ProbeTimeoutSeconds)),
                    FailureExpected = true
                }, progress: null, ct).ConfigureAwait(false);
            }

            if (result.ExitCode != 0 || !File.Exists(path)) return false;

            await using (var thumb = File.OpenRead(path))
            {
                await store.SaveAsync(thumbnailKey, thumb, "image/jpeg", ct).ConfigureAwait(false);
            }
            return true;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not make an effect thumbnail.");
            return false;
        }
        finally
        {
            try { Directory.Delete(directory, recursive: true); } catch (IOException) { /* best effort */ } catch (UnauthorizedAccessException) { /* best effort */ }
        }
    }
}
