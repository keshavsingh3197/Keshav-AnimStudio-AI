using System.Globalization;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Assets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Reads technical metadata from a stored media file with ffprobe.
/// <para>
/// Called at UPLOAD time, not render time. A sprite with no alpha channel or an unreadable
/// audio file should fail the upload with a clear message, rather than surfacing ten
/// minutes into a render as a mysterious failure or an opaque rectangle in the output.
/// </para>
/// </summary>
public sealed class FfprobeMediaProbeService(
    IFfmpegRunner runner,
    IObjectStore store,
    IOptions<FfmpegOptions> options,
    ILogger<FfprobeMediaProbeService> logger) : IMediaProbeService
{
    private readonly FfmpegOptions _options = options.Value;

    /// <summary>
    /// Pixel formats that carry an alpha channel. There is no "has_alpha" field in
    /// ffprobe's output, so the format name is the only signal.
    /// </summary>
    private static readonly string[] AlphaFormats =
    [
        "rgba", "bgra", "argb", "abgr", "rgba64be", "rgba64le", "ya8", "ya16be", "ya16le",
        "yuva420p", "yuva422p", "yuva444p", "gbrap", "yuva444p16le", "pal8"
    ];

    public async Task<MediaProbe> ProbeAsync(string storageKey, CancellationToken ct)
    {
        // ffprobe needs a real path, so the object is staged to a temp file first.
        var directory = Path.Combine(Path.GetTempPath(), "animstudio-probe",
            Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(directory);

        var fileName = "probe" + (Path.GetExtension(storageKey) is { Length: > 0 } ext ? ext : ".bin");
        var path = Path.Combine(directory, fileName);

        try
        {
            await using (var source = await store.OpenAsync(storageKey, ct).ConfigureAwait(false))
            {
                if (source is null) return new MediaProbe();

                await using var file = new FileStream(path, FileMode.Create, FileAccess.Write,
                    FileShare.None, 1 << 20, useAsync: true);
                await source.CopyToAsync(file, 1 << 20, ct).ConfigureAwait(false);
            }

            var result = await runner.RunAsync(new FfmpegInvocation
            {
                Tool = FfmpegTool.Ffprobe,
                WorkingDirectory = directory,
                Arguments =
                [
                    "-v", "error",
                    "-show_entries",
                    "stream=codec_type,codec_name,width,height,pix_fmt,channels,sample_rate,duration",
                    "-show_entries", "format=duration",
                    "-of", "json",
                    fileName
                ],
                Timeout = TimeSpan.FromSeconds(_options.ProbeTimeoutSeconds)
            }, progress: null, ct).ConfigureAwait(false);

            return result.ExitCode == 0 ? Parse(result.StdOut) : new MediaProbe();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not probe stored object.");
            return new MediaProbe();
        }
        finally
        {
            try { Directory.Delete(directory, recursive: true); } catch { /* best effort */ }
        }
    }

    private static MediaProbe Parse(string json)
    {
        var probe = new MediaProbe();

        using var document = JsonDocument.Parse(json);

        if (document.RootElement.TryGetProperty("format", out var format)
            && format.TryGetProperty("duration", out var formatDuration)
            && double.TryParse(formatDuration.GetString(), NumberStyles.Float,
                CultureInfo.InvariantCulture, out var seconds))
        {
            probe.DurationSeconds = seconds;
        }

        if (!document.RootElement.TryGetProperty("streams", out var streams)) return probe;

        foreach (var stream in streams.EnumerateArray())
        {
            var type = stream.TryGetProperty("codec_type", out var t) ? t.GetString() : null;

            if (string.Equals(type, "video", StringComparison.Ordinal))
            {
                probe.Width = stream.TryGetProperty("width", out var w) ? w.GetInt32() : null;
                probe.Height = stream.TryGetProperty("height", out var h) ? h.GetInt32() : null;
                probe.VideoCodec = stream.TryGetProperty("codec_name", out var c) ? c.GetString() : null;
                probe.PixelFormat = stream.TryGetProperty("pix_fmt", out var p) ? p.GetString() : null;
                probe.HasAlpha = probe.PixelFormat is not null
                                 && Array.Exists(AlphaFormats, f =>
                                     string.Equals(f, probe.PixelFormat, StringComparison.Ordinal));
            }
            else if (string.Equals(type, "audio", StringComparison.Ordinal))
            {
                probe.AudioCodec = stream.TryGetProperty("codec_name", out var c) ? c.GetString() : null;
                probe.AudioChannels = stream.TryGetProperty("channels", out var ch) ? ch.GetInt32() : null;
                probe.SampleRate =
                    stream.TryGetProperty("sample_rate", out var sr)
                    && int.TryParse(sr.GetString(), out var rate) ? rate : null;
            }
        }

        return probe;
    }
}
