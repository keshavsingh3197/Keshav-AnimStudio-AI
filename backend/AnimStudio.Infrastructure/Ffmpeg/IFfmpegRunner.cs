namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Runs ffmpeg/ffprobe. Kept internal to Infrastructure: the Application layer talks to
/// IVideoRenderingService and never learns that a subprocess is involved.
/// </summary>
public interface IFfmpegRunner
{
    Task<FfmpegResult> RunAsync(FfmpegInvocation invocation,
        IProgress<FfmpegProgress>? progress, CancellationToken ct);
}
