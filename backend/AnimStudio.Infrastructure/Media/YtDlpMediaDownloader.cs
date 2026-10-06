using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Media;
using AnimStudio.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;

namespace AnimStudio.Infrastructure.Media;

public sealed record DownloadedMediaFile(
    string FilePath,
    string FileName,
    string MimeType,
    long FileSizeBytes,
    double DurationSeconds,
    bool IsAudioOnly,
    string Title);

/// <summary>
/// Probes and downloads media from any <see cref="MediaSourceValidator.Platforms"/> entry via
/// yt-dlp. Callers pass a URL that <see cref="MediaSourceValidator"/> has already rebuilt; every
/// failure surfaces as a <see cref="MediaDownloadException"/> carrying a user-facing reason.
/// </summary>
public sealed class YtDlpMediaDownloader(
    IOptions<IngestOptions> options,
    IFfmpegRunner runner,
    AppDataPaths dataPaths,
    ILogger<YtDlpMediaDownloader> logger)
{
    private readonly IngestOptions _options = options.Value;
    private (string? Version, DateTime At)? _versionCache;

    public bool CookiesConfigured => _options.YtDlp.EffectiveCookiesBrowser is not null;

    public async Task<MediaProbeResponse> ProbeAsync(Uri canonicalUrl, MediaPlatform platform, CancellationToken ct)
    {
        var tempDir = Path.Combine(dataPaths.Temp, "probe-media", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempDir);

        try
        {
            var arguments = new List<string>
            {
                "--dump-json",
                "--no-playlist",
                "--skip-download",
                "--no-warnings",
                "--geo-bypass",
                // TLS certificates are always verified: no --no-check-certificates.
                "--extractor-args", "youtube:player_client=ios,android,web",
            };
            AddCookies(arguments);
            arguments.AddRange(["--", canonicalUrl.AbsoluteUri]);

            var (exitCode, stdout, stderr) = await RunAsync(arguments, tempDir, platform, ct).ConfigureAwait(false);

            // A multi-video post prints one JSON object per line; the first is the one shown.
            var firstJson = stdout
                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault(l => l.StartsWith('{'));

            if (exitCode != 0 || firstJson is null)
            {
                logger.LogWarning("yt-dlp probe failed for {Platform} (Exit: {ExitCode}): {Error}", platform.Id, exitCode, stderr);
                throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify(
                    string.IsNullOrWhiteSpace(stderr) ? "no video formats found" : stderr, platform.Name));
            }

            using var doc = JsonDocument.Parse(firstJson);
            var root = doc.RootElement;

            var id = GetString(root, "id") ?? "";
            var title = GetString(root, "title") ?? GetString(root, "description") ?? "Untitled video";
            var channel = GetString(root, "uploader") ?? GetString(root, "channel") ?? GetString(root, "creator")
                          ?? GetString(root, "uploader_id") ?? platform.Name;

            // LinkedIn and X report many of these as JSON null, not absent.
            double duration = GetDouble(root, "duration") ?? 0;

            var thumb = GetString(root, "thumbnail") ?? "";

            int? width = GetInt(root, "width");
            int? height = GetInt(root, "height");

            double? aspectRatio = GetDouble(root, "aspect_ratio");

            // Heights the source really offers, so the UI never lists a resolution that
            // silently falls back to something else.
            var heights = new HashSet<int>();
            if (root.TryGetProperty("formats", out var formats) && formats.ValueKind == JsonValueKind.Array)
            {
                foreach (var f in formats.EnumerateArray())
                {
                    if (GetString(f, "vcodec") == "none") continue;
                    if (GetInt(f, "height") is not { } hv || hv <= 0) continue;

                    heights.Add(hv);
                    if (width is null && GetInt(f, "width") is { } wv && wv > 0)
                    {
                        width = wv;
                        height = hv;
                    }
                }
            }

            var path = canonicalUrl.AbsolutePath;
            var aspectKnown = (height.HasValue && width.HasValue) || aspectRatio.HasValue;
            bool isShort = (height.HasValue && width.HasValue && height.Value > width.Value)
                           || (aspectRatio.HasValue && aspectRatio.Value < 0.8)
                           || path.Contains("/shorts/", StringComparison.OrdinalIgnoreCase)
                           || path.Contains("/reel", StringComparison.OrdinalIgnoreCase)
                           || (!aspectKnown && platform.VerticalByDefault);

            string aspectLabel = aspectKnown || isShort
                ? (isShort ? "9:16 (Shorts / Reel)" : "16:9 (Landscape)")
                : "Aspect detected on download";

            var durationFormatted = duration > 0
                ? TimeSpan.FromSeconds(Math.Round(duration)).ToString(duration >= 3600 ? @"hh\:mm\:ss" : @"mm\:ss")
                : "";

            // With no format heights (LinkedIn, some X posts) "Best" is the only honest option.
            var resolutions = new List<string> { "Best" };
            foreach (var target in new[] { 1080, 720, 480, 360 })
            {
                if (heights.Any(hv => hv >= target * 0.9)) resolutions.Add($"{target}p");
            }

            return new MediaProbeResponse(
                VideoId: id,
                CanonicalUrl: canonicalUrl.AbsoluteUri,
                Title: title.Length > 300 ? title[..300] + "…" : title,
                Channel: channel,
                DurationSeconds: duration,
                DurationFormatted: durationFormatted,
                ThumbnailUrl: thumb,
                Width: width,
                Height: height,
                IsShort: isShort,
                AspectLabel: aspectLabel,
                AvailableResolutions: resolutions,
                AvailableAudioFormats: ["mp3", "wav", "m4a", "aac", "flac", "opus"],
                PlatformId: platform.Id,
                PlatformName: platform.Name,
                AspectKnown: aspectKnown);
        }
        finally
        {
            try { Directory.Delete(tempDir, recursive: true); } catch { /* best effort */ }
        }
    }

    /// <summary>
    /// The installed yt-dlp version, or null when it cannot be started. Cached for a few
    /// minutes so the sources panel can show it on every page load without spawning a process.
    /// </summary>
    public async Task<string?> GetVersionAsync(CancellationToken ct)
    {
        if (_versionCache is { } cached && DateTime.UtcNow - cached.At < TimeSpan.FromMinutes(5))
            return cached.Version;

        string? version = null;
        try
        {
            var (exitCode, stdout, _) = await RunAsync(
                ["--version"], Path.GetTempPath(), MediaSourceValidator.YouTube, ct).ConfigureAwait(false);
            if (exitCode == 0) version = stdout.Trim();
        }
        catch (MediaDownloadException ex)
        {
            logger.LogWarning("yt-dlp version check failed: {Code}", ex.Failure.Code);
        }

        _versionCache = (version, DateTime.UtcNow);
        return version;
    }

    public async Task<DownloadedMediaFile> DownloadAsync(
        MediaDownloadRequest request,
        Uri canonicalUrl,
        MediaPlatform platform,
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

        AddCookies(arguments);
        arguments.AddRange([
            "--no-playlist",
            "--no-warnings",
            "--restrict-filenames",
            "--geo-bypass",
            "--extractor-args", "youtube:player_client=ios,android,web",
            "-o", Path.Combine(targetDirectory, stem + ".%(ext)s"),
            "--print-to-file", "%(title)s\t%(duration)s", Path.Combine(targetDirectory, "meta.txt"),
            "--",
            canonicalUrl.AbsoluteUri
        ]);

        var (exitCode, _, stderr) = await RunAsync(arguments, targetDirectory, platform, ct).ConfigureAwait(false);

        if (exitCode != 0)
        {
            logger.LogWarning("yt-dlp download from {Platform} failed with {ExitCode}: {StdErr}", platform.Id, exitCode, stderr);
            throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify(stderr, platform.Name));
        }

        var downloadedFile = Directory.EnumerateFiles(targetDirectory)
            .FirstOrDefault(f => Path.GetFileName(f).StartsWith(stem, StringComparison.OrdinalIgnoreCase) && !f.EndsWith(".txt", StringComparison.OrdinalIgnoreCase));

        if (downloadedFile is null)
        {
            logger.LogWarning("yt-dlp exited cleanly for {Platform} but wrote no media file", platform.Id);
            throw new MediaDownloadException(MediaDownloadFailureClassifier.Classify("no video formats found", platform.Name));
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

        // LinkedIn and X "titles" are often the whole post text.
        var fileStem = title.Length > 120 ? title[..120] : title;

        return new DownloadedMediaFile(
            FilePath: downloadedFile,
            FileName: $"{SanitizeFileName(fileStem)}.{format}",
            MimeType: mimeType,
            FileSizeBytes: fileInfo.Length,
            DurationSeconds: duration,
            IsAudioOnly: isAudio,
            Title: title);
    }

    private void AddCookies(List<string> arguments)
    {
        if (_options.YtDlp.EffectiveCookiesBrowser is { } browser)
        {
            arguments.Add("--cookies-from-browser");
            arguments.Add(browser);
        }
    }

    private static double? GetDouble(JsonElement element, string name) =>
        element.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.Number
        && prop.TryGetDouble(out var value) ? value : null;

    private static int? GetInt(JsonElement element, string name) =>
        GetDouble(element, name) is { } value && value is >= 0 and <= int.MaxValue ? (int)Math.Round(value) : null;

    private static string? GetString(JsonElement element, string name) =>
        element.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
        && prop.GetString() is { Length: > 0 } value ? value : null;

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sb = new StringBuilder();
        foreach (var ch in name)
        {
            if (!invalid.Contains(ch) && ch != '\'' && ch != '\"' && !char.IsControl(ch)) sb.Append(ch);
            else sb.Append('_');
        }
        var clean = sb.ToString().Trim();
        return string.IsNullOrWhiteSpace(clean) ? "media" : clean;
    }

    private static (string? title, double duration) ReadMetadata(string directory)
    {
        var path = Path.Combine(directory, "meta.txt");
        if (!File.Exists(path)) return (null, 0);

        var line = File.ReadLines(path, Encoding.UTF8).FirstOrDefault();
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
        IReadOnlyList<string> arguments, string workingDirectory, MediaPlatform platform, CancellationToken ct)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _options.YtDlp.ExecutablePath,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            // Titles from LinkedIn/Instagram are full of emoji and non-Latin text; without
            // this Windows decodes them through the console code page and mangles them.
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
        };
        startInfo.Environment["PYTHONIOENCODING"] = "utf-8";

        foreach (var argument in arguments) startInfo.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            process.Start();
        }
        catch (System.ComponentModel.Win32Exception ex)
        {
            logger.LogError(ex, "yt-dlp could not be started from {Path}", _options.YtDlp.ExecutablePath);
            throw new MediaDownloadException(MediaDownloadFailureClassifier.DownloaderMissing(), ex);
        }
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
            throw new MediaDownloadException(MediaDownloadFailureClassifier.TimedOut(platform.Name));
        }

        return (process.ExitCode,
            await stdoutTask.ConfigureAwait(false),
            await stderrTask.ConfigureAwait(false));
    }
}
