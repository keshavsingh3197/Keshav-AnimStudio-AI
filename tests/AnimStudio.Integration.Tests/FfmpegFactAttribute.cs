using System.Diagnostics;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// A fact that SKIPS rather than fails when no renderer is installed, so the suite stays
/// green on a machine (or CI job) that has no ffmpeg.
/// </summary>
public sealed class FfmpegFactAttribute : FactAttribute
{
    public FfmpegFactAttribute()
    {
        if (!FfmpegLocator.IsAvailable)
            Skip = $"ffmpeg not found (looked for '{FfmpegLocator.FfmpegPath}').";
    }
}

public static class FfmpegLocator
{
    public static string FfmpegPath { get; } = Resolve("ffmpeg");
    public static string FfprobePath { get; } = Resolve("ffprobe");

    public static bool IsAvailable { get; } = Probe();

    private static string Resolve(string tool)
    {
        // An explicit override wins, then the user-local install, then PATH.
        var configured = Environment.GetEnvironmentVariable($"ANIMSTUDIO_{tool.ToUpperInvariant()}");
        if (!string.IsNullOrWhiteSpace(configured)) return configured;

        var local = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "bin", tool);
        return File.Exists(local) ? local : tool;
    }

    private static bool Probe()
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo(FfmpegPath, "-version")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            });

            if (process is null) return false;
            process.WaitForExit(10_000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>Runs ffprobe and returns trimmed stdout, for assertions about real output.</summary>
    public static string Probe(string arguments)
    {
        using var process = Process.Start(new ProcessStartInfo(FfprobePath)
        {
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        })!;

        var output = process.StandardOutput.ReadToEnd();
        process.WaitForExit(30_000);
        return output.Trim();
    }
}
