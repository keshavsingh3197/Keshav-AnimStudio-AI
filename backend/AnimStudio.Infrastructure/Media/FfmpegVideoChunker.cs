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
        string chunkStyle = "original",
        string? hookText = null,
        bool showPartBadge = false,
        bool subtleZoom = false,
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

            var normalizedStyle = (chunkStyle ?? "original").Trim().ToLowerInvariant();
            var use916Layout = convertTo916 || normalizedStyle is "blur_916" or "direct_response" or "viral_pop" or "split_header" or "cosmic_card";
            var hasOverlayText = !string.IsNullOrWhiteSpace(hookText) || showPartBadge;

            if (use916Layout || hasOverlayText || subtleZoom)
            {
                var (w, h) = isCompressed && compressionPreset == "ultracompact" ? (720, 1280) : (1080, 1920);
                var fgScaleW = subtleZoom ? (int)Math.Round(w * 1.06) : w;
                var fgScaleH = subtleZoom ? (int)Math.Round(h * 1.06) : h;
                var fgChain = subtleZoom
                    ? $"scale={fgScaleW}:{fgScaleH}:force_original_aspect_ratio=decrease,crop='min(iw,{w})':'min(ih,{h})'"
                    : $"scale={w}:{h}:force_original_aspect_ratio=decrease";

                string filterGraph;
                if (normalizedStyle is "direct_response" or "cosmic_card")
                {
                    var cardW = w - 80;
                    var cardH = h - 340;
                    filterGraph =
                        $"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=28:5,eq=brightness=-0.28:saturation=1.25[bg];" +
                        $"[0:v]scale={cardW}:{cardH}:force_original_aspect_ratio=decrease,pad=iw+8:ih+8:4:4:color=0x38bdf8@0.9[fg];" +
                        $"[bg][fg]overlay=(W-w)/2:(H-h)/2[v0]";
                }
                else if (normalizedStyle == "split_header")
                {
                    var cardH = (int)Math.Round(h * 0.72);
                    filterGraph =
                        $"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=24:5,eq=brightness=-0.22[bg0];" +
                        $"[bg0]drawbox=x=0:y=0:w={w}:h={(int)Math.Round(h * 0.18)}:color=0x0f172a@0.88:t=fill[bg];" +
                        $"[0:v]scale={w}:{cardH}:force_original_aspect_ratio=decrease[fg];" +
                        $"[bg][fg]overlay=(W-w)/2:(H-h)*0.62[v0]";
                }
                else if (use916Layout)
                {
                    filterGraph =
                        $"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:5[bg];" +
                        $"[0:v]{fgChain}[fg];" +
                        $"[bg][fg]overlay=(W-w)/2:(H-h)/2[v0]";
                }
                else
                {
                    filterGraph = subtleZoom
                        ? $"[0:v]scale=iw*1.06:ih*1.06,crop=iw/1.06:ih/1.06[v0]"
                        : "[0:v]null[v0]";
                }

                var currentLabel = "v0";
                var fontFile = WatermarkFontResolver.FindSystemFont();
                if (fontFile is not null && hasOverlayText)
                {
                    var escapedFont = fontFile.Replace("\\", "/").Replace(":", "\\:");
                    if (!string.IsNullOrWhiteSpace(hookText))
                    {
                        var hookRel = $"hook_{chunkIndex:D3}.txt";
                        await File.WriteAllTextAsync(Path.Combine(workDirectory, hookRel), hookText.Trim(), ct).ConfigureAwait(false);
                        var boxColor = normalizedStyle == "viral_pop" ? "0xfacc15@0.95" : "0x0f172a@0.85";
                        var fontColor = normalizedStyle == "viral_pop" ? "0x0f172a" : "0xffffff";
                        var fontSize = w >= 1080 ? 48 : 32;
                        filterGraph += $";[{currentLabel}]drawtext=textfile='{hookRel}':fontfile='{escapedFont}':reload=0:expansion=none:fontsize={fontSize}:fontcolor={fontColor}:box=1:boxcolor={boxColor}:boxborderw=16:x=(w-text_w)/2:y=96[v1]";
                        currentLabel = "v1";
                    }

                    if (showPartBadge)
                    {
                        var partRel = $"part_{chunkIndex:D3}.txt";
                        await File.WriteAllTextAsync(Path.Combine(workDirectory, partRel), $"PART {chunkIndex} OF {totalChunks}", ct).ConfigureAwait(false);
                        var fontSize = w >= 1080 ? 36 : 24;
                        var yPos = !string.IsNullOrWhiteSpace(hookText) ? "h-150" : "96";
                        filterGraph += $";[{currentLabel}]drawtext=textfile='{partRel}':fontfile='{escapedFont}':reload=0:expansion=none:fontsize={fontSize}:fontcolor=0xfacc15:box=1:boxcolor=0x090d16@0.85:boxborderw=12:x=(w-text_w)/2:y={yPos}[v2]";
                        currentLabel = "v2";
                    }
                }

                filterGraph += $";[{currentLabel}]null[v]";

                arguments.AddRange([
                    "-filter_complex", filterGraph,
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

