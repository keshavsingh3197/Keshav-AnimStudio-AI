using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Detects the renderer's version and filter set at startup.
/// <para>
/// Probing up front means a missing or too-old ffmpeg produces an actionable error when
/// the render is REQUESTED, rather than a job that sits in the queue and fails half a
/// minute later with a stderr dump.
/// </para>
/// </summary>
public sealed partial class FfmpegCapabilityProbe(
    IFfmpegRunner runner,
    IOptions<FfmpegOptions> options,
    ILogger<FfmpegCapabilityProbe> logger)
{
    private readonly FfmpegOptions _options = options.Value;

    [GeneratedRegex(@"ffmpeg version n?(?<major>\d+)\.(?<minor>\d+)",
        RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 1000)]
    private static partial Regex VersionPattern();

    public async Task<FfmpegCapabilities> ProbeAsync(CancellationToken ct)
    {
        try
        {
            var workingDirectory = Path.GetTempPath();

            var version = await RunAsync(workingDirectory, ["-hide_banner", "-version"], ct);
            if (version.ExitCode != 0)
                return FfmpegCapabilities.Unavailable("The renderer did not respond to a version check.");

            var match = VersionPattern().Match(version.StdOut);
            var major = match.Success
                ? int.Parse(match.Groups["major"].ValueSpan, CultureInfo.InvariantCulture) : 0;
            var minor = match.Success
                ? int.Parse(match.Groups["minor"].ValueSpan, CultureInfo.InvariantCulture) : 0;

            var versionText = version.StdOut.Split('\n').FirstOrDefault()?.Trim();

            var filters = await RunAsync(workingDirectory, ["-hide_banner", "-filters"], ct);
            var buildConf = await RunAsync(workingDirectory, ["-hide_banner", "-buildconf"], ct);
            var encoders = await RunAsync(workingDirectory, ["-hide_banner", "-encoders"], ct);

            var minimum = ParseMinimum(_options.MinimumVersion);
            if (major < minimum.Major || (major == minimum.Major && minor < minimum.Minor))
            {
                return FfmpegCapabilities.Unavailable(
                    $"The installed renderer is {major}.{minor}; {_options.MinimumVersion} or newer is required.");
            }

            // --- Hardware encoder detection (run in parallel, each is a short test encode) ---
            var (nvenc, qsv, videotoolbox) = await ProbeHardwareEncodersAsync(
                workingDirectory, encoders.StdOut, ct).ConfigureAwait(false);

            var capabilities = new FfmpegCapabilities
            {
                IsAvailable = true,
                Version = versionText,
                Major = major,
                Minor = minor,
                // Both the filter list and the build flags are checked: a filter can be
                // listed yet unusable, and libass is the one that fails silently.
                HasLibass = HasFilter(filters.StdOut, "subtitles")
                            && buildConf.StdOut.Contains("--enable-libass", StringComparison.Ordinal),
                HasDrawtext = HasFilter(filters.StdOut, "drawtext"),
                HasZoompan = HasFilter(filters.StdOut, "zoompan"),
                HasXfade = HasFilter(filters.StdOut, "xfade"),
                HasAcrossfade = HasFilter(filters.StdOut, "acrossfade"),
                HasAlimiter = HasFilter(filters.StdOut, "alimiter"),
                HasGblur = HasFilter(filters.StdOut, "gblur"),
                HasLibx264 = HasEncoder(encoders.StdOut, "libx264"),
                HasAac = HasEncoder(encoders.StdOut, "aac"),
                HasNvenc = nvenc,
                HasQsv = qsv,
                HasVideoToolbox = videotoolbox
            };

            var hwLabel = capabilities.BestHardwareEncoder is { } hw ? hw : "CPU";
            logger.LogInformation(
                "Renderer ready: {Version} (libass={Libass}, xfade={Xfade}, zoompan={Zoompan}, hw={HwEncoder})",
                capabilities.Version, capabilities.HasLibass, capabilities.HasXfade,
                capabilities.HasZoompan, hwLabel);

            return capabilities;
        }
        catch (Exception ex)
        {
            // A missing renderer must not stop the app from booting: everything except
            // rendering still works, and the reason is surfaced through the API.
            logger.LogWarning(ex, "Renderer capability probe failed; rendering will be unavailable.");
            return FfmpegCapabilities.Unavailable("Video rendering is not configured on this server.");
        }
    }

    /// <summary>
    /// Probes each hardware encoder by attempting a single-frame test encode from a
    /// synthetic lavfi color source to a null sink. This is the most reliable detection
    /// method: an encoder listed in -encoders may be present but non-functional (e.g.,
    /// h264_nvenc listed but no NVIDIA GPU or driver installed). A successful exit code
    /// means the full pipeline initialised and the encoder is genuinely usable.
    /// All three probes run concurrently to minimise startup overhead.
    /// </summary>
    private async Task<(bool Nvenc, bool Qsv, bool VideoToolbox)> ProbeHardwareEncodersAsync(
        string workingDirectory, string encoderList, CancellationToken ct)
    {
        // Only probe if the encoder is listed — avoids spawning processes on machines
        // that clearly have nothing, while still catching the "listed but broken" case.
        var wantNvenc = HasEncoder(encoderList, "h264_nvenc");
        var wantQsv = HasEncoder(encoderList, "h264_qsv");
        var wantVtb = HasEncoder(encoderList, "h264_videotoolbox");

        Task<bool> ProbeEncoder(string codec) => Task.Run(async () =>
        {
            try
            {
                // Single frame, tiny resolution, null output — completes in <200ms.
                string[] args =
                [
                    "-hide_banner", "-loglevel", "error",
                    "-f", "lavfi", "-i", "color=c=black:s=16x16:d=0.1",
                    "-c:v", codec,
                    "-frames:v", "1",
                    "-f", "null", "-"
                ];
                var result = await RunAsync(workingDirectory, args, ct).ConfigureAwait(false);
                return result.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }, ct);

        var nvencTask = wantNvenc ? ProbeEncoder("h264_nvenc") : Task.FromResult(false);
        var qsvTask = wantQsv ? ProbeEncoder("h264_qsv") : Task.FromResult(false);
        var vtbTask = wantVtb ? ProbeEncoder("h264_videotoolbox") : Task.FromResult(false);

        await Task.WhenAll(nvencTask, qsvTask, vtbTask).ConfigureAwait(false);
        return (await nvencTask, await qsvTask, await vtbTask);
    }

    private Task<FfmpegResult> RunAsync(string workingDirectory, string[] arguments, CancellationToken ct) =>
        runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workingDirectory,
            Arguments = arguments,
            Timeout = TimeSpan.FromSeconds(_options.ProbeTimeoutSeconds)
        }, progress: null, ct);

    /// <summary>
    /// Matches the filter name as a whole word. Substring matching would report "ass"
    /// as present merely because "subtitles" mentions it, or match "xfade" inside
    /// "afade".
    /// </summary>
    private static bool HasFilter(string filterList, string name) =>
        filterList.Split('\n').Any(line =>
        {
            // Lines look like: " T.. zoompan  V->V  Apply Zoom & Pan effect."
            var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length >= 2 && string.Equals(parts[1], name, StringComparison.Ordinal);
        });

    private static bool HasEncoder(string encoderList, string name) =>
        encoderList.Split('\n').Any(line =>
        {
            var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length >= 2 && string.Equals(parts[1], name, StringComparison.Ordinal);
        });

    private static (int Major, int Minor) ParseMinimum(string text)
    {
        var parts = text.Split('.');
        var major = parts.Length > 0 && int.TryParse(parts[0], out var a) ? a : 6;
        var minor = parts.Length > 1 && int.TryParse(parts[1], out var b) ? b : 0;
        return (major, minor);
    }
}
