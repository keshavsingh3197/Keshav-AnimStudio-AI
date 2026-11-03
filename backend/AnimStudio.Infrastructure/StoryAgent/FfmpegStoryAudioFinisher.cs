using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Finishes a spoken line with ffmpeg in its own scratch workspace: cut the rumble, even out the level and bring it to the
/// spoken-word norm (-16 LUFS), put a breath of silence before the first word and after the last, then listen for where the
/// speaker paused so the subtitles can be cut there.
/// </summary>
public sealed class FfmpegStoryAudioFinisher(
    IFfmpegRunner runner,
    IRenderWorkspaceFactory workspaces,
    IRenderCapabilities capabilities,
    ILogger<FfmpegStoryAudioFinisher> logger) : IStoryAudioFinisher
{
    private static readonly TimeSpan MasterTimeout = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ListenTimeout = TimeSpan.FromMinutes(2);

    /// <summary>
    /// Quieter than this for this long is a pause. Measured against real Hindi narration: shorter pauses are the gaps
    /// between words, and longer ones sit at commas and sentence ends, which is where captions should break.
    /// </summary>
    private const string SilenceFloor = "-38dB";
    private const string SilenceLength = "0.18";

    public bool IsAvailable => capabilities is FfmpegCapabilities { IsAvailable: true };

    public async Task<FinishedLine> FinishAsync(byte[] speech, double leadSeconds, double tailSeconds, CancellationToken ct)
    {
        if (!IsAvailable)
            throw new StoryStageException("ffmpeg-missing", "ffmpeg isn't available on this server, so narration can't be finished.");

        await using var workspace = await workspaces.CreateAsync($"story-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        await File.WriteAllBytesAsync(workspace.Resolve("in/line.bin"), speech, ct).ConfigureAwait(false);

        var filter = string.Join(',',
            "highpass=f=70",
            "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
            $"adelay={(int)Math.Round(leadSeconds * 1000)}:all=1",
            $"apad=pad_dur={tailSeconds.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture)}",
            $"aresample={NarrationCleanupRate}");

        var mastered = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-hide_banner", "-nostdin", "-y",
                "-i", "in/line.bin",
                "-vn", "-af", filter,
                "-ac", "1", "-ar", $"{NarrationCleanupRate}", "-c:a", "pcm_s16le",
                "out/line.wav"
            ],
            Timeout = MasterTimeout
        }, progress: null, ct).ConfigureAwait(false);

        if (mastered.ExitCode != 0)
        {
            logger.LogWarning("Finishing a spoken line failed (exit {ExitCode}): {Stderr}",
                mastered.ExitCode, LogSanitizer.Sanitize(mastered.StderrTail, 1000));
            throw new StoryStageException("audio-finish-failed", "A spoken line could not be finished. The speech engine may have returned damaged audio; retry.");
        }

        var wav = await File.ReadAllBytesAsync(workspace.Resolve("out/line.wav"), ct).ConfigureAwait(false);
        var duration = AiAudioValidator.TryGetWavDuration(wav)
            ?? throw new StoryStageException("audio-finish-failed", "A spoken line came out with no length. Retry.");

        var listened = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-hide_banner", "-nostdin",
                "-i", "out/line.wav",
                "-af", $"silencedetect=noise={SilenceFloor}:d={SilenceLength}",
                "-f", "null", "-"
            ],
            Timeout = ListenTimeout
        }, progress: null, ct).ConfigureAwait(false);

        // Captions fall back to being spread by length when nothing was heard; that is a fine outcome, not an error.
        var pauses = listened.ExitCode == 0 ? StoryPacing.ParsePauses(listened.StderrTail, duration) : [];
        return new FinishedLine(wav, Math.Round(duration, 3), pauses);
    }

    private const int NarrationCleanupRate = 48000;
}
