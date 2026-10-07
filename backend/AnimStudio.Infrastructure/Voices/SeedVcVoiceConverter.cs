using System.Diagnostics;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Voices;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Voices;

public sealed class VoiceConversionOptions
{
    public const string Section = "VoiceConversion";

    /// <summary>Off by default: the converter is a separate install (scripts/setup-voice-ai.ps1).</summary>
    public bool Enabled { get; set; }

    /// <summary>The Python inside Seed-VC's environment. Empty: where the setup script puts it.</summary>
    public string PythonPath { get; set; } = string.Empty;

    /// <summary>The Seed-VC checkout (holds inference.py, and caches the model weights). Empty: the setup script's.</summary>
    public string SeedVcPath { get; set; } = string.Empty;

    /// <summary>Where scripts/setup-voice-ai.ps1 installs by default.</summary>
    public static string DefaultSeedVcPath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AnimStudio", "seed-vc");

    internal string ResolvedSeedVcPath => string.IsNullOrWhiteSpace(SeedVcPath) ? DefaultSeedVcPath : SeedVcPath;

    internal string ResolvedPythonPath => string.IsNullOrWhiteSpace(PythonPath)
        ? OperatingSystem.IsWindows()
            ? Path.Combine(ResolvedSeedVcPath, ".venv", "Scripts", "python.exe")
            : Path.Combine(ResolvedSeedVcPath, ".venv", "bin", "python")
        : PythonPath;

    /// <summary>
    /// Quality against speed. Measured on a 12-core laptop CPU: 10 steps converts at about 12x
    /// the length of the speech, 25 at about 33x. Raise it on a machine with a GPU.
    /// </summary>
    public int DiffusionSteps { get; set; } = 10;

    /// <summary>A long take on a CPU, plus the first run's model download.</summary>
    public int TimeoutMinutes { get; set; } = 90;
}

/// <summary>
/// Runs Seed-VC (zero-shot voice conversion) as its own process, with its own Python. The
/// wrapper script ships inside this assembly and is written next to the job, so there is
/// nothing to keep in step on disk; it loads the models once for every part of a take.
/// </summary>
public sealed class SeedVcVoiceConverter(
    IOptions<VoiceConversionOptions> options,
    ILogger<SeedVcVoiceConverter> logger) : IVoiceConverter
{
    private const string ScriptResource = "AnimStudio.Voices.seedvc_convert.py";
    private const int StderrTailChars = 4000;

    /// <summary>The models take gigabytes of memory and every core: one conversion at a time.</summary>
    private static readonly SemaphoreSlim OneAtATime = new(1, 1);

    private readonly VoiceConversionOptions _options = options.Value;

    public bool IsAvailable =>
        _options.Enabled
        && File.Exists(_options.ResolvedPythonPath)
        && File.Exists(Path.Combine(_options.ResolvedSeedVcPath, "inference.py"));

    public async Task ConvertAsync(IReadOnlyList<VoiceConversionJob> jobs, string workingDirectory, CancellationToken ct)
    {
        if (jobs.Count == 0) return;
        if (!IsAvailable) throw new StudioVoiceException("AI voices aren't set up on this server.");

        var script = Path.Combine(workingDirectory, "seedvc_convert.py");
        await using (var resource = typeof(SeedVcVoiceConverter).Assembly.GetManifestResourceStream(ScriptResource)
                                    ?? throw new InvalidOperationException("The Seed-VC wrapper is missing from the build."))
        await using (var file = File.Create(script))
        {
            await resource.CopyToAsync(file, ct).ConfigureAwait(false);
        }

        var manifest = Path.Combine(workingDirectory, "seedvc.json");
        await File.WriteAllTextAsync(manifest, JsonSerializer.Serialize(new
        {
            diffusionSteps = Math.Clamp(_options.DiffusionSteps, 4, 100),
            jobs = jobs.Select(j => new { source = j.SourcePath, target = j.SamplePath, output = j.OutputPath })
        }), ct).ConfigureAwait(false);

        await OneAtATime.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            await RunAsync(script, manifest, workingDirectory, ct).ConfigureAwait(false);
        }
        finally
        {
            OneAtATime.Release();
        }

        foreach (var job in jobs)
        {
            if (!File.Exists(job.OutputPath))
                throw new StudioVoiceException("The AI voice couldn't be made from that recording.");
        }
    }

    private async Task RunAsync(string script, string manifest, string workingDirectory, CancellationToken ct)
    {
        var start = new ProcessStartInfo(_options.ResolvedPythonPath)
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        // An argument list, never one command string: no path is ever parsed by a shell.
        foreach (var argument in new[] { "-u", script, _options.ResolvedSeedVcPath, manifest })
            start.ArgumentList.Add(argument);
        start.Environment["PYTHONIOENCODING"] = "utf-8";
        start.Environment["HF_HUB_DISABLE_TELEMETRY"] = "1";

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromMinutes(Math.Max(1, _options.TimeoutMinutes)));

        using var process = Process.Start(start) ?? throw new StudioVoiceException("The AI voice converter couldn't start.");
        var stderr = new StringBuilder();
        process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data is null) return;
            lock (stderr)
            {
                stderr.AppendLine(e.Data);
                if (stderr.Length > StderrTailChars * 2) stderr.Remove(0, stderr.Length - StderrTailChars);
            }
        };
        process.OutputDataReceived += (_, e) =>
        {
            if (e.Data is not null) logger.LogDebug("Seed-VC: {Line}", LogSanitizer.Sanitize(e.Data, 300));
        };
        process.BeginErrorReadLine();
        process.BeginOutputReadLine();

        var started = Stopwatch.StartNew();
        try
        {
            await process.WaitForExitAsync(timeout.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch (InvalidOperationException) { }
            if (ct.IsCancellationRequested) throw;
            throw new StudioVoiceException("The AI voice took too long. Try a shorter take.");
        }

        if (process.ExitCode != 0)
        {
            string tail;
            lock (stderr) tail = stderr.ToString();
            logger.LogWarning("Seed-VC failed (exit {ExitCode}): {Stderr}",
                process.ExitCode, LogSanitizer.Sanitize(tail[Math.Max(0, tail.Length - StderrTailChars)..], StderrTailChars));
            throw new StudioVoiceException("The AI voice couldn't be made from that recording.");
        }

        logger.LogInformation("Seed-VC converted in {Elapsed}.", started.Elapsed);
    }
}
