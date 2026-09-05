using System.Diagnostics;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Builds tiny synthetic media fixtures with ffmpeg itself, so no binary assets need to be
/// committed and the fixtures are guaranteed readable by the installed renderer. All
/// synthetic - no production or personal data.
/// </summary>
public static class RenderFixtures
{
    public static void MakeBackground(string path, string color = "navy", int width = 640, int height = 360) =>
        Run($"-y -f lavfi -i color=c={color}:s={width}x{height} -frames:v 1 \"{path}\"");

    /// <summary>An RGBA sprite: a solid disc on a transparent background.</summary>
    public static void MakeSprite(string path, string color, int size = 120) =>
        Run($"-y -f lavfi -i color=c={color}@1.0:s={size}x{size},format=rgba "
          + $"-vf \"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt((X-{size / 2})*(X-{size / 2})+(Y-{size / 2})*(Y-{size / 2}),{size / 2 * (size / 2)}),255,0)'\" "
          + $"-frames:v 1 \"{path}\"");

    public static void MakeTone(string path, double seconds, int frequency = 440) =>
        Run($"-y -f lavfi -i \"sine=frequency={frequency}:duration={seconds}\" "
          + $"-ar 48000 -ac 2 \"{path}\"");

    private static void Run(string arguments)
    {
        using var process = Process.Start(new ProcessStartInfo(FfmpegLocator.FfmpegPath)
        {
            Arguments = "-hide_banner -loglevel error " + arguments,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false
        })!;

        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(60_000);

        if (process.ExitCode != 0)
            throw new InvalidOperationException($"Fixture generation failed: {stderr}");
    }
}
