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

    public static void MakeSilence(string path, double seconds) =>
        Run($"-y -f lavfi -i \"anullsrc=r=48000:cl=stereo\" -t {seconds.ToString(System.Globalization.CultureInfo.InvariantCulture)} \"{path}\"");

    /// <summary>A moving test pattern, with a tone unless <paramref name="withAudio"/> is false.</summary>
    public static void MakeVideo(string path, double seconds, int width = 640, int height = 360, bool withAudio = true)
    {
        var duration = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        Run($"-y -f lavfi -i testsrc2=s={width}x{height}:r=30:d={duration} "
          + (withAudio ? $"-f lavfi -i \"sine=frequency=440:duration={duration}\" -c:a aac " : "")
          + $"-c:v libx264 -preset ultrafast -pix_fmt yuv420p -shortest \"{path}\"");
    }

    /// <summary>What a browser's MediaRecorder produces: VP8 video and Opus audio in WebM.</summary>
    public static void MakeCameraRecording(string path, double seconds)
    {
        var duration = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        Run($"-y -f lavfi -i testsrc2=s=640x480:r=30:d={duration} "
          + $"-f lavfi -i \"sine=frequency=330:duration={duration}:sample_rate=48000\" "
          + $"-c:v libvpx -deadline realtime -b:v 1M -c:a libopus -shortest -f webm \"{path}\"");
    }

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
