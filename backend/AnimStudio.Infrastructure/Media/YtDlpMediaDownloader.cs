using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Media;
using AnimStudio.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using AnimStudio.Infrastructure.Ffmpeg;

namespace AnimStudio.Infrastructure.Media;

public sealed record DownloadedMediaFile(
    string FilePath,
    string FileName,
    string MimeType,
    long FileSizeBytes,
    double DurationSeconds,
    bool IsAudioOnly,
    string Title);

public sealed class YtDlpMediaDownloader(
    IOptions<IngestOptions> options,
    IFfmpegRunner runner,
    ILogger<YtDlpMediaDownloader> logger)
{
    private readonly IngestOptions _options = options.Value;

    public async Task<MediaProbeResponse> ProbeAsync(Uri canonicalUrl, CancellationToken ct)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "animstudio-probe-media", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempDir);

        try
        {
            string[] arguments =
            [
                "--dump-json",
                "--no-playlist",
                "--skip-download",
                "--no-warnings",
                "--",
                canonicalUrl.AbsoluteUri
            ];

            var (exitCode, stdout, stderr) = await RunAsync(arguments, tempDir, ct).ConfigureAwait(false);

            if (exitCode != 0 || string.IsNullOrWhiteSpace(stdout))
            {
                logger.LogWarning("yt-dlp probe failed (Exit: {ExitCode}): {Error}", exitCode, stderr);
                throw new InvalidOperationException("Could not retrieve video information from this URL.");
            }

            using var doc = JsonDocument.Parse(stdout.Trim());
            var root = doc.RootElement;

            var id = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var title = root.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "Unknown Title" : "Unknown Title";
            var channel = root.TryGetProperty("uploader", out var upProp) ? upProp.GetString()
                : (root.TryGetProperty("channel", out var chProp) ? chProp.GetString() : "YouTube");
            channel ??= "YouTube";

            double duration = 0;
            if (root.TryGetProperty("duration", out var durProp) && durProp.TryGetDouble(out var dur))
            {
                duration = dur;
            }

            var thumb = root.TryGetProperty("thumbnail", out var thProp) ? thProp.GetString() ?? "" : "";

            int? width = root.TryGetProperty("width", out var wProp) && wProp.TryGetInt32(out var w) ? w : null;
            int? height = root.TryGetProperty("height", out var hProp) && hProp.TryGetInt32(out var h) ? h : null;

            double? aspectRatio = null;
            if (root.TryGetProperty("aspect_ratio", out var arProp) && arProp.TryGetDouble(out var ar))
            {
                aspectRatio = ar;
            }

            bool isShort = (height.HasValue && width.HasValue && height.Value > width.Value)
                           || (aspectRatio.HasValue && aspectRatio.Value < 0.8)
                           || canonicalUrl.AbsoluteUri.Contains("/shorts/", StringComparison.OrdinalIgnoreCase);

            string aspectLabel = isShort ? "9:16 (Shorts / Reel)" : "16:9 (Landscape)";

            var durationFormatted = TimeSpan.FromSeconds(Math.Round(duration)).ToString(duration >= 3600 ? @"hh\:mm\:ss" : @"mm\:ss");

            return new MediaProbeResponse(
                VideoId: id,
                CanonicalUrl: canonicalUrl.AbsoluteUri,
                Title: title,
                Channel: channel,
                DurationSeconds: duration,
                DurationFormatted: durationFormatted,
                ThumbnailUrl: thumb,
                Width: width,
                Height: height,
                IsShort: isShort,
                AspectLabel: aspectLabel,
                AvailableResolutions: ["Best", "1080p", "720p", "480p", "360p"],
                AvailableAudioFormats: ["mp3", "wav", "m4a", "aac", "flac", "opus"]);
        }
        finally
        {
            try { Directory.Delete(tempDir, recursive: true); } catch { /* best effort */ }
        }
    }

    public async Task<DownloadedMediaFile> DownloadAsync(
        MediaDownloadRequest request,
        Uri canonicalUrl,
        string targetDirectory,
        CancellationToken ct)
    {
        Directory.CreateDirectory(targetDirectory);

        var stem = Guid.NewGuid().ToString("n");
        var format = (request.Format ?? "mp4").Trim().ToLowerInvariant();
        bool isAudio = format is "mp3" or "wav" or "m4a" or "aac" or "flac" or "opus";

        var arguments = new List<string>();

        if (isAudio)
        {
            arguments.Add("--extract-audio");
            arguments.Add("--audio-format");
            arguments.Add(format);
            arguments.Add("--audio-quality");
            arguments.Add(request.AudioBitrate switch
            {
                "320k" => "0",
                "192k" => "2",
                "128k" => "5",
                _ => "2"
            });
        }
        else
        {
            var res = (request.Resolution ?? "best").Trim().ToLowerInvariant();
            var formatSelector = res switch
            {
                "1080p" => "bestvideo[height<=?1080]+bestaudio/best[height<=?1080]/best",
                "720p" => "bestvideo[height<=?720]+bestaudio/best[height<=?720]/best",
                "480p" => "bestvideo[height<=?480]+bestaudio/best[height<=?480]/best",
                "360p" => "bestvideo[height<=?360]+bestaudio/best[height<=?360]/best",
                _ => "bestvideo+bestaudio/best"
            };

            arguments.Add("-f");
            arguments.Add(formatSelector);
            arguments.Add("--merge-output-format");
            arguments.Add(format == "mov" ? "mov" : (format == "webm" ? "webm" : "mp4"));
        }

        arguments.AddRange([
            "--no-playlist",
            "--no-warnings",
            "--restrict-filenames",
            "-o", Path.Combine(targetDirectory, stem + ".%(ext)s"),
            "--print-to-file", "%(title)s\t%(duration)s", Path.Combine(targetDirectory, "meta.txt"),
            "--",
            canonicalUrl.AbsoluteUri
        ]);

        var (exitCode, _, stderr) = await RunAsync(arguments.ToArray(), targetDirectory, ct).ConfigureAwait(false);

        if (exitCode != 0)
        {
            logger.LogWarning("yt-dlp download failed with {ExitCode}: {StdErr}", exitCode, stderr);
            throw new InvalidOperationException($"Download failed: {stderr}");
        }

        var downloadedFile = Directory.EnumerateFiles(targetDirectory)
            .FirstOrDefault(f => Path.GetFileName(f).StartsWith(stem, StringComparison.OrdinalIgnoreCase) && !f.EndsWith(".txt", StringComparison.OrdinalIgnoreCase));

        if (downloadedFile is null)
        {
            throw new FileNotFoundException("Download completed but output media file was not found.");
        }

        var (title, duration) = ReadMetadata(targetDirectory);
        title ??= Path.GetFileNameWithoutExtension(downloadedFile);

        if (!isAudio && !string.IsNullOrWhiteSpace(request.CompressionPreset) && !request.CompressionPreset.Equals("original", StringComparison.OrdinalIgnoreCase))
        {
            var compressedPath = Path.Combine(targetDirectory, $"{stem}_compressed.{format}");
            var (crf, preset, scale) = request.CompressionPreset.ToLowerInvariant() switch
            {
                "ultracompact" => ("32", "fast", "scale='min(720,iw)':-2"), // Aggressive reduction (~70-80% smaller)
                "high" => ("28", "veryfast", "scale='min(1080,iw)':-2"),    // High compression (~50-60% smaller)
                "balanced" or _ => ("24", "veryfast", null)                // Balanced compression (~30-40% smaller)
            };

            var ffmpegArgs = new List<string>
            {
                "-y",
                "-i", downloadedFile,
                "-c:v", "libx264",
                "-preset", preset,
                "-crf", crf
            };

            if (scale != null)
            {
                ffmpegArgs.AddRange(["-vf", scale]);
            }

            ffmpegArgs.AddRange([
                "-c:a", "aac",
                "-b:a", "128k",
                compressedPath
            ]);

            try
            {
                var runResult = await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = targetDirectory,
                    Arguments = ffmpegArgs,
                    Timeout = TimeSpan.FromMinutes(10)
                }, progress: null, ct).ConfigureAwait(false);

                if (File.Exists(compressedPath) && new FileInfo(compressedPath).Length > 1024)
                {
                    logger.LogInformation("Compressed downloaded media from {OrigSize} bytes to {CompSize} bytes using preset '{Preset}'",
                        new FileInfo(downloadedFile).Length, new FileInfo(compressedPath).Length, request.CompressionPreset);
                    try { File.Delete(downloadedFile); } catch { }
                    downloadedFile = compressedPath;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "FFmpeg compression pass failed; falling back to uncompressed downloaded media.");
            }
        }

        var fileInfo = new FileInfo(downloadedFile);
        var mimeType = isAudio ? GetAudioMimeType(format) : GetVideoMimeType(format);

        return new DownloadedMediaFile(
            FilePath: downloadedFile,
            FileName: $"{SanitizeFileName(title)}.{format}",
            MimeType: mimeType,
            FileSizeBytes: fileInfo.Length,
            DurationSeconds: duration,
            IsAudioOnly: isAudio,
            Title: title);
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sb = new StringBuilder();
        foreach (var ch in name)
        {
            if (!invalid.Contains(ch) && ch != '\'' && ch != '\"') sb.Append(ch);
            else sb.Append('_');
        }
        var clean = sb.ToString().Trim();
        return string.IsNullOrWhiteSpace(clean) ? "media" : clean;
    }

    private static (string? title, double duration) ReadMetadata(string directory)
    {
        var path = Path.Combine(directory, "meta.txt");
        if (!File.Exists(path)) return (null, 0);

        var line = File.ReadLines(path).FirstOrDefault();
        if (string.IsNullOrWhiteSpace(line)) return (null, 0);

        var parts = line.Split('\t');
        var title = parts.Length > 0 ? parts[0] : null;
        double duration = 0;
        if (parts.Length > 1 && double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var d))
        {
            duration = d;
        }

        return (title, duration);
    }

    private static string GetAudioMimeType(string format) => format switch
    {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "m4a" or "aac" => "audio/mp4",
        "flac" => "audio/flac",
        "opus" => "audio/opus",
        _ => "audio/mpeg"
    };

    private static string GetVideoMimeType(string format) => format switch
    {
        "webm" => "video/webm",
        "mov" => "video/quicktime",
        _ => "video/mp4"
    };

    private async Task<(int ExitCode, string StdOut, string StdErr)> RunAsync(
        string[] arguments, string workingDirectory, CancellationToken ct)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _options.YtDlp.ExecutablePath,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        foreach (var argument in arguments) startInfo.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = startInfo };
        process.Start();
        process.StandardInput.Close();

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(300, _options.YtDlp.TimeoutSeconds)));

        var stdoutTask = process.StandardOutput.ReadToEndAsync(timeout.Token);
        var stderrTask = process.StandardError.ReadToEndAsync(timeout.Token);

        try
        {
            await process.WaitForExitAsync(timeout.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
            if (ct.IsCancellationRequested) throw;
            throw new TimeoutException("Media download process timed out.");
        }

        return (process.ExitCode,
            await stdoutTask.ConfigureAwait(false),
            await stderrTask.ConfigureAwait(false));
    }
}

