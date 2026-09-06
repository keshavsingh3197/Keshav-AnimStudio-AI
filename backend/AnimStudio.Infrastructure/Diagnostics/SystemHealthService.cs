using System.Diagnostics;
using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.Diagnostics;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Infrastructure.Ffmpeg;
using KeshavSingh.Mongo.NoSql;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace AnimStudio.Infrastructure.Diagnostics;

/// <summary>
/// Answers "what is actually installed on this machine?" for the admin console.
/// </summary>
/// <remarks>
/// <para>
/// Every external tool is probed by running it with a version flag, which is the only
/// answer that is true: a configured path that exists may still be the wrong binary, and a
/// bare name like <c>ffmpeg</c> resolves through the service process's PATH rather than the
/// operator's shell - the single most common reason a render fails on a machine where
/// ffmpeg "is installed".
/// </para>
/// <para>
/// The paths being run come from configuration, never from a request, and every invocation
/// uses <see cref="ProcessStartInfo.ArgumentList"/> so nothing is ever assembled into a
/// command line a shell could reinterpret.
/// </para>
/// <para>
/// What comes back is a version and a verdict. Filesystem paths deliberately do not appear
/// in the report even though this screen is for the operator: a path describes the machine
/// rather than the problem, and it is the sort of detail that ends up copied into a bug
/// report or a screenshot.
/// </para>
/// </remarks>
public sealed class SystemHealthService(
    IRenderCapabilities renderer,
    IOptionsMonitor<FfmpegOptions> ffmpeg,
    IOptionsMonitor<IngestOptions> ingest,
    IOptionsMonitor<AiOptions> ai,
    MongoDbService mongo,
    IObjectStore store,
    TimeProvider clock,
    ILogger<SystemHealthService> logger) : ISystemHealthService
{
    /// <summary>
    /// Long enough for a cold start on a slow disk, short enough that an admin screen never
    /// appears to hang. A tool that cannot print its version in this long is not usable for
    /// a render anyway.
    /// </summary>
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(8);

    private const int MaxDetailLength = 120;

    public async Task<SystemHealthReport> CheckAsync(CancellationToken ct)
    {
        var probes = new List<HealthProbe>
        {
            Renderer(),
            await ProbeExecutableAsync(
                "ffprobe", "Media inspector (ffprobe)", ffmpeg.CurrentValue.FfprobePath,
                ["-version"], required: true,
                advice: "Install ffmpeg - ffprobe ships with it - and set Ffmpeg:FfprobePath to its "
                        + "absolute path.", ct).ConfigureAwait(false),
            await YtDlpAsync(ct).ConfigureAwait(false),
            await LocalAiToolAsync(
                KnownAiProviders.PiperLocal, "Voices (Piper)", ["--version"],
                "VoicesPath", ".onnx", "voice", ct).ConfigureAwait(false),
            await LocalAiToolAsync(
                KnownAiProviders.WhisperCppLocal, "Listening (whisper.cpp)", ["--help"],
                "ModelsPath", ".bin", "model", ct).ConfigureAwait(false),
            await MongoAsync(ct).ConfigureAwait(false),
            await StorageAsync(ct).ConfigureAwait(false)
        };

        return new SystemHealthReport(clock.GetUtcNow().UtcDateTime, probes);
    }

    private HealthProbe Renderer() => renderer.IsAvailable
        ? new HealthProbe("ffmpeg", "Video renderer (ffmpeg)", HealthState.Ok,
            Trim(renderer.Version), Required: true)
        : new HealthProbe("ffmpeg", "Video renderer (ffmpeg)", HealthState.Failed,
            Trim(renderer.UnavailableReason),
            "Nothing can be rendered without this. Install ffmpeg and set Ffmpeg:FfmpegPath to "
            + "its absolute path - a service process does not inherit your shell's PATH.",
            Required: true);

    private async Task<HealthProbe> YtDlpAsync(CancellationToken ct)
    {
        var options = ingest.CurrentValue.YtDlp;

        if (!options.Enabled)
        {
            return new HealthProbe("yt-dlp", "Video links (yt-dlp)", HealthState.Missing,
                "Switched off in configuration.",
                "Only needed for pasting a video URL. Pasting a transcript, uploading subtitles "
                + "and importing a bundle all work without it.");
        }

        return await ProbeExecutableAsync(
            "yt-dlp", "Video links (yt-dlp)", options.ExecutablePath, ["--version"],
            required: false,
            advice: "Ingest:YtDlp:Enabled is true but the tool did not answer. Install yt-dlp, or "
                    + "switch it off to stop the URL option being offered.", ct).ConfigureAwait(false);
    }

    /// <summary>
    /// A local AI tool is two things: the program, and the folder of models it loads. Both
    /// are reported, because a working executable with an empty model folder produces a
    /// failure that reads like a bug in this application.
    /// </summary>
    private async Task<HealthProbe> LocalAiToolAsync(
        string providerId, string displayName, string[] arguments,
        string folderSetting, string extension, string noun, CancellationToken ct)
    {
        var options = ai.CurrentValue.Providers.TryGetValue(providerId, out var found) ? found : null;

        if (options is null || string.IsNullOrWhiteSpace(options.ExecutablePath))
        {
            return new HealthProbe(providerId, displayName, HealthState.Missing,
                "No executable configured.",
                $"Optional. Set Ai:Providers:{providerId}:ExecutablePath and "
                + $"Ai:Providers:{providerId}:{folderSetting} to use it.");
        }

        var probe = await ProbeExecutableAsync(
            providerId, displayName, options.ExecutablePath, arguments, required: false,
            advice: $"Check Ai:Providers:{providerId}:ExecutablePath.", ct).ConfigureAwait(false);

        if (probe.State != HealthState.Ok) return probe;

        var folder = folderSetting == "VoicesPath" ? options.VoicesPath : options.ModelsPath;

        if (string.IsNullOrWhiteSpace(folder) || !Directory.Exists(folder))
        {
            return probe with
            {
                State = HealthState.Degraded,
                Detail = $"Installed, but no {noun} folder is configured.",
                Advice = $"Set Ai:Providers:{providerId}:{folderSetting} to a folder of "
                         + $"{extension} files."
            };
        }

        var count = CountFiles(folder, extension);

        return count == 0
            ? probe with
            {
                State = HealthState.Degraded,
                Detail = $"Installed, but the {noun} folder has no {extension} files in it.",
                Advice = $"Download at least one {noun} into it."
            }
            : probe with { Detail = $"{probe.Detail} - {count} {noun}(s) available." };
    }

    private int CountFiles(string folder, string extension)
    {
        try
        {
            return Directory.EnumerateFiles(folder, "*" + extension, SearchOption.TopDirectoryOnly)
                .Take(1000).Count();
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(ex, "Could not read a configured model folder while probing health.");
            return 0;
        }
    }

    private async Task<HealthProbe> MongoAsync(CancellationToken ct)
    {
        try
        {
            var result = await mongo.Database
                .RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: ct)
                .ConfigureAwait(false);

            return result.GetValue("ok", 0).ToDouble() >= 1
                ? new HealthProbe("mongo", "Database", HealthState.Ok, "Responding.", Required: true)
                : new HealthProbe("mongo", "Database", HealthState.Failed,
                    "The database answered, but not with an acknowledgement.", Required: true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Never the driver's message: it contains the host, the port and sometimes the
            // user from the connection string.
            logger.LogError(ex, "Database health probe failed.");

            return new HealthProbe("mongo", "Database", HealthState.Failed,
                "Could not be reached.",
                "Check Mongo:ConnectionString - it is supplied through user-secrets or the "
                + "Mongo__ConnectionString environment variable, never appsettings.json.",
                Required: true);
        }
    }

    /// <summary>
    /// Written, read back and deleted. Checking that a folder exists proves nothing about
    /// whether the process may write to it, which is the failure that actually happens.
    /// </summary>
    private async Task<HealthProbe> StorageAsync(CancellationToken ct)
    {
        const string key = "system/health-probe.txt";
        var payload = Encoding.UTF8.GetBytes($"animstudio health probe {clock.GetUtcNow():o}");

        try
        {
            using (var content = new MemoryStream(payload))
            {
                await store.SaveAsync(key, content, "text/plain", ct).ConfigureAwait(false);
            }

            await using var read = await store.OpenAsync(key, ct).ConfigureAwait(false);

            if (read is null)
            {
                return new HealthProbe("storage", "File storage", HealthState.Failed,
                    "A file was written and could not be read back.", Required: true);
            }

            await store.DeleteAsync(key, ct).ConfigureAwait(false);

            return new HealthProbe("storage", "File storage", HealthState.Ok,
                "Readable and writable.", Required: true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Storage health probe failed.");

            return new HealthProbe("storage", "File storage", HealthState.Failed,
                "Could not be written to.",
                "Check the Storage section and that the process may write to the configured root.",
                Required: true);
        }
    }

    /// <summary>
    /// Runs a configured tool with a version flag and reports the first line it prints.
    /// </summary>
    private async Task<HealthProbe> ProbeExecutableAsync(
        string key, string displayName, string executable, string[] arguments,
        bool required, string advice, CancellationToken ct)
    {
        var start = new ProcessStartInfo
        {
            FileName = executable,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // ArgumentList rather than a joined string: the runtime quotes each element for the
        // platform, so no value can ever become a second argument.
        foreach (var argument in arguments) start.ArgumentList.Add(argument);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(ProbeTimeout);

        try
        {
            using var process = Process.Start(start);

            if (process is null)
            {
                return new HealthProbe(key, displayName, HealthState.Missing,
                    "Could not be started.", advice, required);
            }

            // Both pipes are drained concurrently. A tool that writes its version to stderr
            // - several do - would otherwise fill a pipe nobody is reading and deadlock.
            var stdout = process.StandardOutput.ReadToEndAsync(timeout.Token);
            var stderr = process.StandardError.ReadToEndAsync(timeout.Token);

            await process.WaitForExitAsync(timeout.Token).ConfigureAwait(false);

            var text = await stdout.ConfigureAwait(false);
            if (string.IsNullOrWhiteSpace(text)) text = await stderr.ConfigureAwait(false);

            var version = Trim(FirstLine(text));

            // Exit code is not the verdict: --help exits non-zero on several of these tools
            // while still proving the binary is there and runnable.
            return string.IsNullOrEmpty(version)
                ? new HealthProbe(key, displayName, HealthState.Degraded,
                    "Ran, but printed no version.", advice, required)
                : new HealthProbe(key, displayName, HealthState.Ok, version, Required: required);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return new HealthProbe(key, displayName, HealthState.Failed,
                "Did not respond in time.", advice, required);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The exception text names the path it tried to run, so it goes to the log and
            // not to the response.
            logger.LogInformation(ex, "Health probe for {Tool} could not start it.", key);

            return new HealthProbe(key, displayName, HealthState.Missing,
                "Not installed, or not on this process's PATH.", advice, required);
        }
    }

    private static string? FirstLine(string? text) =>
        text?.Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();

    /// <summary>Bounded and stripped of control characters before it reaches a screen.</summary>
    private static string? Trim(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var cleaned = new string([.. value.Where(c => !char.IsControl(c))]).Trim();

        return cleaned.Length <= MaxDetailLength ? cleaned : cleaned[..MaxDetailLength] + "...";
    }
}
