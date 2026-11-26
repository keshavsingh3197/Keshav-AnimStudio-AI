using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Recordings;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>Runs <see cref="SystemAudioRecording.Filter"/> over one recorded take in its own scratch workspace.</summary>
public sealed class FfmpegSystemAudioEncoder(
    IFfmpegRunner runner,
    IRenderWorkspaceFactory workspaces,
    IRenderCapabilities capabilities,
    ILogger<FfmpegSystemAudioEncoder> logger) : ISystemAudioEncoder
{
    /// <summary>Half an hour of audio encodes in well under a minute; this only stops a hung process.</summary>
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(5);

    public bool IsAvailable => capabilities is FfmpegCapabilities { IsAvailable: true };

    public async Task<byte[]> EncodeAsync(byte[] recording, SystemAudioContainer container, CancellationToken ct)
    {
        if (!IsAvailable)
            throw new SystemAudioEncodingException("ffmpeg isn't available on this server, so recordings can't be saved.");

        var input = container == SystemAudioContainer.Mp4 ? "in/take.mp4" : "in/take.webm";

        await using var workspace = await workspaces.CreateAsync($"system-audio-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        await File.WriteAllBytesAsync(workspace.Resolve(input), recording, ct).ConfigureAwait(false);

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-hide_banner", "-nostdin", "-y",
                "-i", input,
                "-vn", "-af", SystemAudioRecording.Filter,
                "-ac", "2", "-ar", $"{SystemAudioRecording.SampleRate}",
                "-c:a", "libmp3lame", "-b:a", SystemAudioRecording.Bitrate,
                "out/recording.mp3"
            ],
            Timeout = Timeout
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            logger.LogWarning("Encoding a system-audio take failed (exit {ExitCode}): {Stderr}",
                result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new SystemAudioEncodingException("That recording couldn't be saved. Try recording it again.");
        }

        return await File.ReadAllBytesAsync(workspace.Resolve("out/recording.mp3"), ct).ConfigureAwait(false);
    }
}
