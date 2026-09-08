using System.Diagnostics;
using AnimStudio.Infrastructure.Ffmpeg;

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

/// <summary>
/// A renderer fact that additionally needs a real font file on the host - drawing text is
/// the one thing the pipeline cannot do without one, since <c>drawtext</c> is given a
/// <c>fontfile=</c> and never a family name. Resolved through the same lookup the server
/// uses, so a host the server would refuse to watermark on skips instead of failing.
/// </summary>
public sealed class FfmpegFontFactAttribute : FactAttribute
{
    public FfmpegFontFactAttribute()
    {
        if (!FfmpegLocator.IsAvailable)
            Skip = $"ffmpeg not found (looked for '{FfmpegLocator.FfmpegPath}').";
        else if (WatermarkFontResolver.FindSystemFont() is null)
            Skip = "no .ttf/.otf font file found on this host.";
    }
}

public static class FfmpegLocator
{
    public static string FfmpegPath { get; } = Resolve("ffmpeg");
    public static string FfprobePath { get; } = Resolve("ffprobe");

    public static bool IsAvailable { get; } = Probe();

    /// <summary>
    /// The INSTALLED build's major version, not an assumed one.
    /// <para>
    /// This matters because some of what the renderer does is gated on the version rather
    /// than on a filter being present - option spellings get removed between majors, and
    /// <c>-filter_complex_script</c> going away in ffmpeg 8 broke every render with an
    /// "Unrecognized option" and exit code nobody could read. A fixture that hard-codes a
    /// version cannot catch that; one that reads the real thing can.
    /// </para>
    /// </summary>
    public static int MajorVersion { get; } = ReadMajorVersion();

    private static int ReadMajorVersion()
    {
        if (!IsAvailable) return 0;

        try
        {
            using var process = Process.Start(new ProcessStartInfo(FfmpegPath, "-hide_banner -version")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            })!;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(10_000);

            var match = System.Text.RegularExpressions.Regex.Match(
                output, @"ffmpeg version n?(\d+)\.",
                System.Text.RegularExpressions.RegexOptions.CultureInvariant,
                TimeSpan.FromSeconds(1));

            return match.Success ? int.Parse(match.Groups[1].Value) : 0;
        }
        catch
        {
            return 0;
        }
    }

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
