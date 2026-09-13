using System.Diagnostics;
using System.Globalization;
using System.IO.Compression;
using AnimStudio.Application.Media;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Media;

public sealed class FfmpegVideoChunker(
    IFfmpegRunner runner,
    IOptions<FfmpegOptions> options,
    ILogger<FfmpegVideoChunker> logger)
{
    private readonly FfmpegOptions _options = options.Value;

    public async Task<double> ProbeDurationAsync(string videoPath, CancellationToken ct)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _options.FfprobePath,
            Arguments = $"-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{videoPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var proc = Process.Start(startInfo);
        if (proc is null) return 0;

        var stdout = await proc.StandardOutput.ReadToEndAsync(ct).ConfigureAwait(false);
        await proc.WaitForExitAsync(ct).ConfigureAwait(false);

        if (double.TryParse(stdout.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var duration))
        {
            return duration;
        }

        return 0;
    }

    public async Task<VideoChunkResult> ChunkVideoAsync(
        string inputVideoPath,
        string sourceTitle,
        double chunkDurationSeconds,
        bool accurateCut,
        bool convertTo916,
        string jobId,
        string workDirectory,
        string compressionPreset = "original",
        CancellationToken ct = default)
    {
        if (chunkDurationSeconds <= 0) chunkDurationSeconds = 10.0;

        var chunksDirectory = Path.Combine(workDirectory, "chunks");
        Directory.CreateDirectory(chunksDirectory);

        var totalDuration = await ProbeDurationAsync(inputVideoPath, ct).ConfigureAwait(false);
        if (totalDuration <= 0)
        {
            // If probe failed, assume at least chunkDuration
            totalDuration = chunkDurationSeconds;
        }

        var totalChunks = Math.Max(1, (int)Math.Ceiling(totalDuration / chunkDurationSeconds));
        var chunkItems = new List<ChunkItemResponse>();

        bool isCompressed = !string.IsNullOrWhiteSpace(compressionPreset) && !compressionPreset.Equals("original", StringComparison.OrdinalIgnoreCase);
        var (crf, presetSpeed, audioBitrate) = compressionPreset.ToLowerInvariant() switch
        {
            "ultracompact" => ("32", "fast", "96k"),
            "high" => ("28", "veryfast", "128k"),
            "balanced" => ("24", "veryfast", "160k"),
            _ => ("18", "veryfast", "192k")
        };

        for (int i = 0; i < totalChunks; i++)
        {
            var start = i * chunkDurationSeconds;
            var end = Math.Min((i + 1) * chunkDurationSeconds, totalDuration);
            var segDur = end - start;

            if (segDur < 0.2 && i > 0)
            {
                // Skip tiny trailing fragment under 200ms
                continue;
            }

            var chunkIndex = i + 1;
            var chunkFileName = $"chunk_{chunkIndex:D3}.mp4";
            var chunkFilePath = Path.Combine(chunksDirectory, chunkFileName);

            var startStr = start.ToString("F3", CultureInfo.InvariantCulture);
            var durStr = segDur.ToString("F3", CultureInfo.InvariantCulture);

            var arguments = new List<string>
            {
                "-y",
                "-ss", startStr,
                "-i", inputVideoPath,
                "-t", durStr
            };

            if (convertTo916)
            {
                var scaleFilter = isCompressed && compressionPreset == "ultracompact"
                    ? "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:5[bg];[0:v]scale=720:1280:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
                    : "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]";

                arguments.AddRange([
                    "-filter_complex", scaleFilter,
                    "-map", "[v]",
                    "-map", "0:a?",
                    "-c:v", "libx264",
                    "-preset", presetSpeed,
                    "-crf", crf,
                    "-c:a", "aac",
                    "-b:a", audioBitrate
                ]);
            }
            else if (accurateCut || isCompressed)
            {
                arguments.AddRange([
                    "-c:v", "libx264",
                    "-preset", presetSpeed,
                    "-crf", crf,
                    "-c:a", "aac",
                    "-b:a", audioBitrate
                ]);
            }
            else
            {
                // Fast copy mode
                arguments.AddRange([
                    "-c", "copy"
                ]);
            }

            arguments.Add(chunkFilePath);

            var result = await runner.RunAsync(new FfmpegInvocation
            {
                Tool = FfmpegTool.Ffmpeg,
                WorkingDirectory = workDirectory,
                Arguments = arguments,
                Timeout = TimeSpan.FromMinutes(10)
            }, progress: null, ct).ConfigureAwait(false);

            // Fallback: If -c copy produced empty file or errored, re-encode accurately
            if (!File.Exists(chunkFilePath) || new FileInfo(chunkFilePath).Length < 1024)
            {
                logger.LogInformation("Fast copy on chunk {Index} produced small/missing file; re-encoding accurately.", chunkIndex);
                var fallbackArgs = new List<string>
                {
                    "-y",
                    "-ss", startStr,
                    "-i", inputVideoPath,
                    "-t", durStr,
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-crf", "18",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    chunkFilePath
                };

                await runner.RunAsync(new FfmpegInvocation
                {
                    Tool = FfmpegTool.Ffmpeg,
                    WorkingDirectory = workDirectory,
                    Arguments = fallbackArgs,
                    Timeout = TimeSpan.FromMinutes(10)
                }, progress: null, ct).ConfigureAwait(false);
            }

            var chunkInfo = new FileInfo(chunkFilePath);
            var fileSizeBytes = chunkInfo.Exists ? chunkInfo.Length : 0;

            var startFmt = TimeSpan.FromSeconds(Math.Floor(start)).ToString(@"mm\:ss");
            var endFmt = TimeSpan.FromSeconds(Math.Floor(end)).ToString(@"mm\:ss");

            chunkItems.Add(new ChunkItemResponse(
                Index: chunkIndex,
                FileName: chunkFileName,
                StartSeconds: start,
                EndSeconds: end,
                DurationSeconds: segDur,
                StartFormatted: startFmt,
                EndFormatted: endFmt,
                FileSizeBytes: fileSizeBytes,
                StreamUrl: $"/api/media/chunks/{jobId}/{chunkIndex}"));
        }

        // Generate all_chunks.zip bundle
        var zipFilePath = Path.Combine(workDirectory, $"{jobId}_chunks.zip");
        if (File.Exists(zipFilePath)) File.Delete(zipFilePath);

        using (var zipArchive = ZipFile.Open(zipFilePath, ZipArchiveMode.Create))
        {
            foreach (var chunk in chunkItems)
            {
                var fPath = Path.Combine(chunksDirectory, chunk.FileName);
                if (File.Exists(fPath))
                {
                    zipArchive.CreateEntryFromFile(fPath, chunk.FileName, CompressionLevel.Fastest);
                }
            }
        }

        return new VideoChunkResult(
            JobId: jobId,
            SourceTitle: sourceTitle,
            TotalDurationSeconds: totalDuration,
            ChunkDurationSeconds: chunkDurationSeconds,
            TotalChunks: chunkItems.Count,
            Chunks: chunkItems,
            ZipDownloadUrl: $"/api/media/chunks/{jobId}/zip");
    }
}

