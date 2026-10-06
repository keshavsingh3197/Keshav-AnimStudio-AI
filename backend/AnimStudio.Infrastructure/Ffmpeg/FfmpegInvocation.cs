namespace AnimStudio.Infrastructure.Ffmpeg;

public enum FfmpegTool { Ffmpeg = 0, Ffprobe = 1 }

public sealed record FfmpegInvocation
{
    public required FfmpegTool Tool { get; init; }

    /// <summary>
    /// The process working directory - always the render workspace root. Because of this,
    /// every path in every argument is a plain relative name, which removes the need to
    /// escape absolute paths inside filter arguments entirely.
    /// </summary>
    public required string WorkingDirectory { get; init; }

    public required IReadOnlyList<string> Arguments { get; init; }
    public TimeSpan Timeout { get; init; } = TimeSpan.FromMinutes(30);
    public bool CaptureProgress { get; init; }
    public string? StderrLogPath { get; init; }

    /// <summary>
    /// A non-zero exit is an answer, not a fault - e.g. a hardware-encoder probe on a machine
    /// without that hardware. The caller reports it; the runner logs it at Debug only.
    /// </summary>
    public bool FailureExpected { get; init; }
}

public sealed record FfmpegResult(int ExitCode, string StdOut, string StderrTail, TimeSpan Elapsed);
