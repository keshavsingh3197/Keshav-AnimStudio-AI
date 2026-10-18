using System.Globalization;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Errors;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Makes the JPEG a custom YouTube thumbnail is sent as: a frame grabbed from the video, or a
/// picture the user uploaded, re-encoded. Every thumbnail goes through ffmpeg, so what reaches
/// YouTube is always a freshly encoded JPEG no wider than 1280 and under YouTube's 2 MB limit,
/// never the client's bytes as they came.
/// </summary>
public sealed class YouTubeThumbnailService(IFfmpegRunner runner, ILogger<YouTubeThumbnailService> logger)
{
    /// <summary>Frame grabs are quick, but the dialog asks for several at once; a few at a time is plenty.</summary>
    private static readonly SemaphoreSlim Slots = new(3, 3);

    /// <summary>Quality steps (ffmpeg's <c>-q:v</c>, lower is better) tried until the file fits.</summary>
    private static readonly int[] Qualities = [2, 4, 7, 11];

    /// <summary>One frame of <paramref name="videoPath"/> at <paramref name="atSeconds"/>, as a JPEG.</summary>
    /// <param name="maxWidth">Smaller for the dialog's picker; <see cref="YouTubeThumbnailRules.TargetWidth"/> for the upload.</param>
    public Task<byte[]> FrameAsync(string videoPath, double atSeconds, int maxWidth, CancellationToken ct) =>
        EncodeAsync(
            work => ["-ss", atSeconds.ToString("0.###", CultureInfo.InvariantCulture), "-i", videoPath, "-frames:v", "1"],
            maxWidth, "thumbnail-frame-missing", "No picture could be taken from the video at that time. Pick another frame.", ct);

    /// <summary>An uploaded JPEG or PNG, already checked by <see cref="YouTubeThumbnailRules"/>, re-encoded for YouTube.</summary>
    public async Task<byte[]> NormalizeAsync(byte[] image, CancellationToken ct)
    {
        return await EncodeAsync(
            work =>
            {
                var input = Path.Combine(work, YouTubeThumbnailRules.IsPng(image) ? "in.png" : "in.jpg");
                File.WriteAllBytes(input, image);
                return ["-i", Path.GetFileName(input), "-frames:v", "1"];
            },
            YouTubeThumbnailRules.TargetWidth, "thumbnail-unreadable", "The thumbnail picture couldn't be read. Choose another.", ct)
            .ConfigureAwait(false);
    }

    private async Task<byte[]> EncodeAsync(
        Func<string, IReadOnlyList<string>> input, int maxWidth, string failCode, string failMessage, CancellationToken ct)
    {
        var width = Math.Clamp(maxWidth, 160, YouTubeThumbnailRules.TargetWidth);
        var work = Path.Combine(Path.GetTempPath(), "animstudio-thumbnails", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(work);

        await Slots.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var source = input(work);
            foreach (var quality in Qualities)
            {
                const string output = "out.jpg";
                var result = await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = work,
                    Arguments =
                    [
                        "-hide_banner", "-loglevel", "error", "-y",
                        .. source,
                        // Never upscale; keep the shape; even sides; full-range colour for a still.
                        "-vf", $"scale='min({width},iw)':-2:flags=lanczos,format=yuvj420p",
                        "-q:v", quality.ToString(CultureInfo.InvariantCulture),
                        "-f", "image2", "-c:v", "mjpeg", output
                    ],
                    Timeout = TimeSpan.FromSeconds(45),
                    FailureExpected = true
                }, progress: null, ct).ConfigureAwait(false);

                var path = Path.Combine(work, output);
                if (result.ExitCode != 0 || !File.Exists(path) || new FileInfo(path).Length == 0)
                {
                    logger.LogInformation("Thumbnail encode found no picture (exit {ExitCode})", result.ExitCode);
                    throw new YouTubePublishException(failCode, failMessage);
                }

                var bytes = await File.ReadAllBytesAsync(path, ct).ConfigureAwait(false);
                if (bytes.Length <= YouTubeThumbnailRules.MaxYouTubeBytes) return bytes;
            }

            throw new YouTubePublishException("thumbnail-too-large", "The thumbnail couldn't be made small enough for YouTube. Use a simpler picture.");
        }
        catch (RenderException ex)
        {
            // ffmpeg missing or timed out: the detail is for the log, not the user.
            logger.LogWarning("Thumbnail encode failed: {Code}", ex.Code);
            throw new YouTubePublishException("thumbnail-unavailable", "Thumbnails can't be made on this server right now. Publish without one, or try again.");
        }
        finally
        {
            Slots.Release();
            try
            {
                Directory.Delete(work, recursive: true);
            }
            catch (IOException ex)
            {
                logger.LogDebug(ex, "Thumbnail work folder {Folder} was not removed", work);
            }
            catch (UnauthorizedAccessException ex)
            {
                logger.LogDebug(ex, "Thumbnail work folder {Folder} was not removed", work);
            }
        }
    }
}
