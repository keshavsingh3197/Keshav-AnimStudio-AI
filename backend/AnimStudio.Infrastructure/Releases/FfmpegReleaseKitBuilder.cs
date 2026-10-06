using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Application.Releases;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Releases;

public sealed record ReleaseKitBuildRequest(
    string JobId,
    string WorkDirectory,
    string AudioFileName,
    bool AudioLossless,
    string? CoverFileName,
    ReleaseMetadata Metadata,
    ReleaseKitOptions Options,
    IReadOnlyList<ReleaseKitWarning> MetadataWarnings);

/// <summary>
/// Turns a finished mix and its cover into what a distributor's upload form asks for: a
/// loudness-normalised WAV master, 3000x3000 artwork, the metadata as a copy-paste sheet,
/// and promo videos. Every ffmpeg call runs inside the job's work directory with plain
/// relative file names, as <see cref="FfmpegInvocation"/> requires.
/// </summary>
public sealed class FfmpegReleaseKitBuilder(
    IFfmpegRunner runner,
    ILogger<FfmpegReleaseKitBuilder> logger)
{
    public const string MasterFile = "master.wav";
    public const string CoverFile = "cover_3000x3000.jpg";
    public const string VisualizerFile = "visualizer_1920x1080.mp4";
    public const string PromoLoopFile = "promo_loop_1080x1920.mp4";
    public const string MetadataFile = "metadata.json";
    public const string SheetFile = "release_sheet.txt";
    public const string LyricsFile = "lyrics.txt";
    public const string ZipFile = "release_kit.zip";

    private const string VisualizerBackground = "visualizer_bg.png";
    private const int CoverSize = 3000;
    private const double PromoLoopSeconds = 8;

    /// <summary>The files a kit can contain, with a label and type each - the download allowlist.</summary>
    public static readonly IReadOnlyDictionary<string, (string Label, string Mime)> KitFiles =
        new Dictionary<string, (string, string)>(StringComparer.Ordinal)
        {
            [MasterFile] = ("Master (WAV)", "audio/wav"),
            [CoverFile] = ("Cover art 3000×3000", "image/jpeg"),
            [VisualizerFile] = ("YouTube visualizer 16:9", "video/mp4"),
            [PromoLoopFile] = ("Promo loop 9:16 (Canvas / Reels)", "video/mp4"),
            [MetadataFile] = ("Metadata (JSON)", "application/json"),
            [SheetFile] = ("Release sheet", "text/plain"),
            [LyricsFile] = ("Lyrics", "text/plain"),
            [ZipFile] = ("Everything (ZIP)", "application/zip"),
        };

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ReleaseKitResult> BuildAsync(ReleaseKitBuildRequest request, CancellationToken ct)
    {
        var options = request.Options;
        var metadata = request.Metadata;
        var warnings = new List<ReleaseKitWarning>(request.MetadataWarnings);
        var produced = new List<string>();

        var source = await ProbeAudioAsync(request, ct).ConfigureAwait(false);
        AddSourceWarnings(source, request.AudioLossless, options, warnings);

        // Pass 1 measures; pass 2 applies a single linear gain computed from that
        // measurement, which is what keeps the mix's dynamics intact.
        var before = await MeasureAsync(request.WorkDirectory, request.AudioFileName, options, ct).ConfigureAwait(false);
        if (double.IsNegativeInfinity(before.InputIntegrated) || before.InputIntegrated < -70)
            throw new ReleaseKitException("audio-silent", "The audio is silent, so there is nothing to master.");

        await RenderMasterAsync(request, before, ct).ConfigureAwait(false);
        produced.Add(MasterFile);

        var after = await MeasureAsync(request.WorkDirectory, MasterFile, options, ct).ConfigureAwait(false);
        if (after.InputTruePeak > options.TruePeakDb + 0.5 || Math.Abs(after.InputIntegrated - options.TargetLufs) > 1.0)
        {
            warnings.Add(new("loudness-target-missed",
                $"The master measures {after.InputIntegrated:0.0} LUFS / {after.InputTruePeak:0.0} dBTP. "
                + "Reaching the target would have clipped, so the gain was limited to stay under the peak ceiling."));
        }

        if (request.CoverFileName is not null)
        {
            await RenderCoverAsync(request, warnings, ct).ConfigureAwait(false);
            produced.Add(CoverFile);

            if (options.MakeVisualizer)
            {
                await RenderVisualizerAsync(request.WorkDirectory, source.DurationSeconds, ct).ConfigureAwait(false);
                produced.Add(VisualizerFile);
            }

            if (options.MakePromoLoop)
            {
                await RenderPromoLoopAsync(request.WorkDirectory, ct).ConfigureAwait(false);
                produced.Add(PromoLoopFile);
            }
        }
        else
        {
            warnings.Add(new("no-cover", "No cover art was given. Every store requires it, and the promo videos need it too."));
        }

        var beforeMeasure = new LoudnessMeasurement(before.InputIntegrated, before.InputTruePeak, before.InputLoudnessRange);
        var afterMeasure = new LoudnessMeasurement(after.InputIntegrated, after.InputTruePeak, after.InputLoudnessRange);

        await WriteTextFilesAsync(request, source, afterMeasure, produced, ct).ConfigureAwait(false);
        WriteZip(request.WorkDirectory, produced, ArchiveFolderName(metadata));

        var files = produced.Append(ZipFile)
            .Select(name => new ReleaseKitFile(
                name,
                KitFiles[name].Label,
                KitFiles[name].Mime,
                new FileInfo(Path.Combine(request.WorkDirectory, name)).Length,
                FileUrl(request.JobId, name)))
            .ToList();

        return new ReleaseKitResult(
            JobId: request.JobId,
            Title: metadata.Title,
            PrimaryArtist: metadata.PrimaryArtist,
            DurationSeconds: source.DurationSeconds,
            SourceSampleRate: source.SampleRate,
            SourceChannels: source.Channels,
            SourceCodec: source.Codec,
            Before: beforeMeasure,
            After: afterMeasure,
            Files: files,
            Warnings: warnings,
            ZipDownloadUrl: FileUrl(request.JobId, ZipFile));
    }

    public static string FileUrl(string jobId, string name) => $"/api/releases/kits/{jobId}/files/{name}";

    private sealed record AudioSource(double DurationSeconds, int SampleRate, int Channels, string Codec);

    private async Task<AudioSource> ProbeAudioAsync(ReleaseKitBuildRequest request, CancellationToken ct)
    {
        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffprobe,
            WorkingDirectory = request.WorkDirectory,
            Arguments =
            [
                "-v", "error", "-select_streams", "a:0",
                "-show_entries", "stream=codec_name,sample_rate,channels:format=duration",
                "-of", "json", request.AudioFileName
            ],
            Timeout = TimeSpan.FromMinutes(2)
        }, progress: null, ct).ConfigureAwait(false);

        try
        {
            using var document = JsonDocument.Parse(result.StdOut);
            var root = document.RootElement;
            var stream = root.GetProperty("streams")[0];
            var duration = double.Parse(root.GetProperty("format").GetProperty("duration").GetString()!, CultureInfo.InvariantCulture);
            var sampleRate = int.Parse(stream.GetProperty("sample_rate").GetString()!, CultureInfo.InvariantCulture);

            return new AudioSource(
                duration,
                sampleRate,
                stream.GetProperty("channels").GetInt32(),
                stream.GetProperty("codec_name").GetString() ?? "unknown");
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or IndexOutOfRangeException
                                       or InvalidOperationException or FormatException or ArgumentNullException)
        {
            logger.LogWarning("Release kit {JobId}: audio probe returned no usable stream (exit {ExitCode})",
                request.JobId, result.ExitCode);
            throw new ReleaseKitException("audio-unreadable", "That audio file has no playable audio in it.");
        }
    }

    private static void AddSourceWarnings(AudioSource source, bool lossless, ReleaseKitOptions options, List<ReleaseKitWarning> warnings)
    {
        if (!lossless)
        {
            warnings.Add(new("lossy-source",
                "The source is MP3/M4A. The master is a WAV, but it can't restore what the lossy encoding removed. Export a WAV or FLAC from your project if you can."));
        }

        if (source.SampleRate < options.SampleRate)
        {
            warnings.Add(new("upsampled",
                $"The source is {source.SampleRate} Hz and was upsampled to {options.SampleRate} Hz. That adds no detail."));
        }

        if (source.Channels == 1)
            warnings.Add(new("mono-source", "The source is mono. The master is stereo with the same signal on both channels."));

        if (source.DurationSeconds < 30)
            warnings.Add(new("short-track", "Tracks under 30 seconds don't earn streaming royalties on most services."));
    }

    private async Task<LoudnormReport> MeasureAsync(string workDirectory, string input, ReleaseKitOptions options, CancellationToken ct)
    {
        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workDirectory,
            Arguments =
            [
                "-hide_banner", "-nostats", "-i", input, "-vn",
                "-af", $"loudnorm=I={F(options.TargetLufs)}:TP={F(options.TruePeakDb)}:LRA=11:print_format=json",
                "-f", "null", "-"
            ],
            Timeout = TimeSpan.FromMinutes(10)
        }, progress: null, ct).ConfigureAwait(false);

        return result.ExitCode == 0 && LoudnormReport.Parse(result.StderrTail) is { } report
            ? report
            : throw Failed("measure", result, logStderr: false);
    }

    private async Task RenderMasterAsync(ReleaseKitBuildRequest request, LoudnormReport measured, CancellationToken ct)
    {
        var options = request.Options;
        var metadata = request.Metadata;

        // A loudness-range target below the mix's own range forces loudnorm into its dynamic
        // mode, which compresses the song. Matching it keeps the gain linear.
        var lra = Math.Clamp(Math.Ceiling(measured.InputLoudnessRange), 11, 20);

        var normalize = string.Join(':',
            $"loudnorm=I={F(options.TargetLufs)}",
            $"TP={F(options.TruePeakDb)}",
            $"LRA={F(lra)}",
            $"measured_I={F(measured.InputIntegrated)}",
            $"measured_TP={F(measured.InputTruePeak)}",
            $"measured_LRA={F(measured.InputLoudnessRange)}",
            $"measured_thresh={F(measured.InputThreshold)}",
            $"offset={F(measured.TargetOffset)}",
            "linear=true");

        // loudnorm works at 192 kHz internally, so the resample back is always needed; 16-bit
        // output gets triangular dither on the way down.
        var (sampleFormat, codec) = options.BitDepth == 16 ? ("s16", "pcm_s16le") : ("s32", "pcm_s24le");
        var chain = $"{normalize},aresample={options.SampleRate}:dither_method=triangular,"
                    + $"aformat=sample_fmts={sampleFormat}:channel_layouts=stereo";

        var arguments = new List<string>
        {
            "-y", "-hide_banner", "-loglevel", "error", "-i", request.AudioFileName,
            "-vn", "-map_metadata", "-1", "-fflags", "+bitexact",
            "-af", chain,
            "-c:a", codec,
            "-metadata", $"title={metadata.Title}",
            "-metadata", $"artist={metadata.PrimaryArtist}",
            "-metadata", $"genre={metadata.Genre}"
        };

        if (metadata.ReleaseDate is { } date)
            arguments.AddRange(["-metadata", $"date={date.Year}"]);
        if (metadata.RecordingCopyright is { } copyright)
            arguments.AddRange(["-metadata", $"copyright=℗ {copyright}"]);

        arguments.Add(MasterFile);

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = request.WorkDirectory,
            Arguments = arguments,
            Timeout = TimeSpan.FromMinutes(15)
        }, progress: null, ct).ConfigureAwait(false);

        EnsureOutput(request.WorkDirectory, MasterFile, "master", result);
    }

    private async Task RenderCoverAsync(ReleaseKitBuildRequest request, List<ReleaseKitWarning> warnings, CancellationToken ct)
    {
        var probe = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffprobe,
            WorkingDirectory = request.WorkDirectory,
            Arguments = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", request.CoverFileName!],
            Timeout = TimeSpan.FromMinutes(1)
        }, progress: null, ct).ConfigureAwait(false);

        var size = probe.StdOut.Trim().Split('x');
        if (size.Length != 2
            || !int.TryParse(size[0], CultureInfo.InvariantCulture, out var width)
            || !int.TryParse(size[1], CultureInfo.InvariantCulture, out var height)
            || width <= 0 || height <= 0)
        {
            throw new ReleaseKitException("cover-unreadable", "The cover image could not be read.");
        }

        if (Math.Min(width, height) < CoverSize)
        {
            warnings.Add(new("cover-upscaled",
                $"The cover is {width}×{height} and was enlarged to {CoverSize}×{CoverSize}. It may look soft; start from a larger image if you have one."));
        }

        if (width != height)
            warnings.Add(new("cover-cropped", $"The cover is {width}×{height}, so it was centre-cropped to a square."));

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = request.WorkDirectory,
            Arguments =
            [
                "-y", "-hide_banner", "-loglevel", "error", "-i", request.CoverFileName!,
                "-map_metadata", "-1",
                "-vf", $"scale={CoverSize}:{CoverSize}:force_original_aspect_ratio=increase:flags=lanczos,crop={CoverSize}:{CoverSize},setsar=1,format=yuvj444p",
                "-frames:v", "1", "-q:v", "2", "-update", "1", CoverFile
            ],
            Timeout = TimeSpan.FromMinutes(2)
        }, progress: null, ct).ConfigureAwait(false);

        EnsureOutput(request.WorkDirectory, CoverFile, "cover", result);
    }

    private async Task RenderVisualizerAsync(string workDirectory, double durationSeconds, CancellationToken ct)
    {
        // The still part of the frame - blurred cover behind a sharp one - is drawn once, so
        // the per-frame work for a whole song is only the waveform and the encode.
        var background = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workDirectory,
            Arguments =
            [
                "-y", "-hide_banner", "-loglevel", "error", "-i", CoverFile,
                "-filter_complex",
                "[0:v]split=2[a][b];"
                + "[a]scale=1920:1920,crop=1920:1080,boxblur=40:2,eq=brightness=-0.2[bg];"
                + "[b]scale=700:700:flags=lanczos[art];"
                + "[bg][art]overlay=(W-w)/2:90",
                "-frames:v", "1", "-update", "1", VisualizerBackground
            ],
            Timeout = TimeSpan.FromMinutes(2)
        }, progress: null, ct).ConfigureAwait(false);
        EnsureOutput(workDirectory, VisualizerBackground, "visualizer background", background);

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workDirectory,
            Arguments =
            [
                "-y", "-hide_banner", "-loglevel", "error",
                "-loop", "1", "-framerate", "30", "-i", VisualizerBackground,
                "-i", MasterFile,
                "-filter_complex",
                // draw=full: the default "scale" draws dense passages nearly transparent.
                "[1:a]aformat=channel_layouts=mono,showwaves=s=1600x180:mode=cline:draw=full:rate=30:colors=white,format=rgba,colorchannelmixer=aa=0.85[wave];"
                + "[0:v][wave]overlay=(W-w)/2:H-h-50:shortest=1,format=yuv420p[v]",
                "-map", "[v]", "-map", "1:a",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                "-c:a", "aac", "-b:a", "320k",
                "-shortest", "-movflags", "+faststart",
                VisualizerFile
            ],
            // Roughly real-time on a slow machine; never less than ten minutes.
            Timeout = TimeSpan.FromSeconds(Math.Max(600, durationSeconds * 3))
        }, progress: null, ct).ConfigureAwait(false);

        EnsureOutput(workDirectory, VisualizerFile, "visualizer", result);
        File.Delete(Path.Combine(workDirectory, VisualizerBackground));
    }

    private async Task RenderPromoLoopAsync(string workDirectory, CancellationToken ct)
    {
        var frames = (int)(PromoLoopSeconds * 30);

        // A slow push-in on the artwork. It is silent because Spotify Canvas rejects audio,
        // and Reels/Shorts get the song added in-app. Scaled up before zoompan so the
        // per-frame crop has sub-pixel room and doesn't jitter.
        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workDirectory,
            Arguments =
            [
                "-y", "-hide_banner", "-loglevel", "error",
                "-loop", "1", "-framerate", "30", "-i", CoverFile,
                "-vf",
                "scale=3840:3840,crop=2160:3840,"
                + $"zoompan=z='1+0.08*on/{frames - 1}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
                + "format=yuv420p",
                "-frames:v", frames.ToString(CultureInfo.InvariantCulture),
                "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-movflags", "+faststart",
                PromoLoopFile
            ],
            Timeout = TimeSpan.FromMinutes(5)
        }, progress: null, ct).ConfigureAwait(false);

        EnsureOutput(workDirectory, PromoLoopFile, "promo loop", result);
    }

    private static async Task WriteTextFilesAsync(
        ReleaseKitBuildRequest request, AudioSource source, LoudnessMeasurement after,
        List<string> produced, CancellationToken ct)
    {
        var metadata = request.Metadata;
        var options = request.Options;

        var document = new
        {
            schema = "animstudio.release-kit/1",
            release = metadata with { RightsConfirmed = true },
            master = new
            {
                file = MasterFile,
                format = "WAV",
                sampleRate = options.SampleRate,
                bitDepth = options.BitDepth,
                channels = 2,
                durationSeconds = Math.Round(source.DurationSeconds, 3),
                integratedLufs = Math.Round(after.IntegratedLufs, 1),
                truePeakDb = Math.Round(after.TruePeakDb, 1),
                loudnessRange = Math.Round(after.LoudnessRange, 1)
            },
            artwork = produced.Contains(CoverFile) ? new { file = CoverFile, width = CoverSize, height = CoverSize } : null
        };

        await File.WriteAllTextAsync(Path.Combine(request.WorkDirectory, MetadataFile),
            JsonSerializer.Serialize(document, Json), new UTF8Encoding(false), ct).ConfigureAwait(false);
        produced.Add(MetadataFile);

        await File.WriteAllTextAsync(Path.Combine(request.WorkDirectory, SheetFile),
            ReleaseSheet(metadata, options, source.DurationSeconds, after), new UTF8Encoding(false), ct).ConfigureAwait(false);
        produced.Add(SheetFile);

        if (metadata.Lyrics is { } lyrics)
        {
            await File.WriteAllTextAsync(Path.Combine(request.WorkDirectory, LyricsFile),
                lyrics + "\n", new UTF8Encoding(false), ct).ConfigureAwait(false);
            produced.Add(LyricsFile);
        }
    }

    /// <summary>The fields in the order distributor forms ask for them, for copy and paste.</summary>
    public static string ReleaseSheet(ReleaseMetadata m, ReleaseKitOptions options, double durationSeconds, LoudnessMeasurement after)
    {
        var sheet = new StringBuilder();
        void Line(string label, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value)) sheet.Append(label.PadRight(24)).AppendLine(value);
        }

        sheet.AppendLine("RELEASE SHEET").AppendLine(new string('=', 60));
        Line("Title", m.Title);
        Line("Version", m.VersionTitle);
        Line("Primary artist", m.PrimaryArtist);
        Line("Featured artists", string.Join(", ", m.FeaturedArtists));
        Line("Songwriters", string.Join(", ", m.Songwriters));
        Line("Producers", string.Join(", ", m.Producers));
        Line("Genre", m.SecondaryGenre is null ? m.Genre : $"{m.Genre} / {m.SecondaryGenre}");
        Line("Language", m.Instrumental ? "Instrumental" : m.Language);
        Line("Explicit", m.Explicit ? "Yes" : "No");
        Line("Release date", m.ReleaseDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        Line("Record label", m.RecordLabel);
        Line("℗ line", m.RecordingCopyright);
        Line("© line", m.CompositionCopyright);
        Line("ISRC", m.Isrc ?? "(assigned by distributor)");
        Line("UPC", m.Upc ?? "(assigned by distributor)");

        sheet.AppendLine().AppendLine("MASTER").AppendLine(new string('=', 60));
        Line("File", MasterFile);
        Line("Format", $"WAV {options.BitDepth}-bit / {options.SampleRate} Hz stereo");
        Line("Duration", TimeSpan.FromSeconds(Math.Round(durationSeconds)).ToString(durationSeconds >= 3600 ? @"h\:mm\:ss" : @"m\:ss", CultureInfo.InvariantCulture));
        Line("Loudness", $"{after.IntegratedLufs.ToString("0.0", CultureInfo.InvariantCulture)} LUFS integrated, "
                         + $"{after.TruePeakDb.ToString("0.0", CultureInfo.InvariantCulture)} dBTP true peak");

        if (m.Lyrics is not null) sheet.AppendLine().AppendLine($"Lyrics are in {LyricsFile}.");

        return sheet.ToString();
    }

    private static void WriteZip(string workDirectory, IEnumerable<string> files, string folder)
    {
        var zipPath = Path.Combine(workDirectory, ZipFile);
        if (File.Exists(zipPath)) File.Delete(zipPath);

        using var archive = System.IO.Compression.ZipFile.Open(zipPath, ZipArchiveMode.Create);
        foreach (var name in files)
        {
            // WAV and the text files compress; the encoded media don't, so they aren't tried.
            var level = name.EndsWith(".mp4", StringComparison.Ordinal) || name.EndsWith(".jpg", StringComparison.Ordinal)
                ? CompressionLevel.NoCompression
                : CompressionLevel.Fastest;
            archive.CreateEntryFromFile(Path.Combine(workDirectory, name), $"{folder}/{name}", level);
        }
    }

    /// <summary>"Artist - Title" with anything a file system would object to removed.</summary>
    public static string ArchiveFolderName(ReleaseMetadata metadata)
    {
        var raw = $"{metadata.PrimaryArtist} - {metadata.Title}";
        var invalid = Path.GetInvalidFileNameChars().Concat(['/', '\\', ':', '*', '?', '"', '<', '>', '|']).ToHashSet();
        var safe = new string(raw.Select(c => invalid.Contains(c) || char.IsControl(c) ? '_' : c).ToArray()).Trim(' ', '.');
        if (safe.Length > 80) safe = safe[..80].TrimEnd(' ', '.');
        return safe.Length == 0 ? "release" : safe;
    }

    private void EnsureOutput(string workDirectory, string file, string step, FfmpegResult result)
    {
        var info = new FileInfo(Path.Combine(workDirectory, file));
        if (result.ExitCode == 0 && info.Exists && info.Length > 0) return;
        throw Failed(step, result);
    }

    /// <remarks>
    /// The render steps run at <c>-loglevel error</c>, so their stderr holds only the error -
    /// never the song's tags, which name people. The measuring pass has to run at info level
    /// for loudnorm's report, so its stderr (which echoes the source's tags) is not logged.
    /// Either way stderr never reaches the user: it can hold server paths.
    /// </remarks>
    private ReleaseKitException Failed(string step, FfmpegResult result, bool logStderr = true)
    {
        if (logStderr)
        {
            logger.LogWarning("Release kit step '{Step}' failed with exit code {ExitCode}: {Stderr}",
                step, result.ExitCode, LogSanitizer.Sanitize(result.StderrTail));
        }
        else
        {
            logger.LogWarning("Release kit step '{Step}' failed with exit code {ExitCode}", step, result.ExitCode);
        }

        return new ReleaseKitException("processing-failed", $"Building the {step} failed. Check the Logs page for details.");
    }

    private static string F(double value) => value.ToString("0.0##", CultureInfo.InvariantCulture);
}
