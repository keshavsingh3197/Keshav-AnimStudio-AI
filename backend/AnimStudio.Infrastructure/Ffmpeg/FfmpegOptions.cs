namespace AnimStudio.Infrastructure.Ffmpeg;

public sealed class FfmpegOptions
{
    public const string Section = "Ffmpeg";

    /// <summary>
    /// Absolute path is strongly preferred: the service process's PATH is not the
    /// interactive shell's, so relying on bare "ffmpeg" resolution is fragile.
    /// </summary>
    public string FfmpegPath { get; set; } = "ffmpeg";
    public string FfprobePath { get; set; } = "ffprobe";

    public int SceneTimeoutMinutes { get; set; } = 20;
    public int MergeTimeoutMinutes { get; set; } = 60;
    public int ProbeTimeoutSeconds { get; set; } = 30;

    /// <summary>0 lets ffmpeg choose based on the host.</summary>
    public int Threads { get; set; }

    /// <summary>xfade, -fps_mode and reliable filter_complex_script all need 6.0+.</summary>
    public string MinimumVersion { get; set; } = "6.0";

    public int StderrTailBytes { get; set; } = 64 * 1024;
}

public sealed class RenderOptions
{
    public const string Section = "Render";

    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public int Fps { get; set; } = 30;
    public int Crf { get; set; } = 18;
    public string Preset { get; set; } = "medium";

    public string ScratchRoot { get; set; } = "storage/temp";

    /// <summary>Rendering is CPU-bound; more than one concurrent job just thrashes.</summary>
    public int MaxConcurrentJobs { get; set; } = 1;

    public int LeaseSeconds { get; set; } = 120;
    public int MaxAttempts { get; set; } = 3;

    /// <summary>Retaining a failed job's workspace makes the failure diagnosable.</summary>
    public bool KeepWorkspaceOnFailure { get; set; }

    public int WorkspaceRetentionHours { get; set; } = 24;
    public int KenBurnsSupersample { get; set; } = 2;
    public int MouthFlapHz { get; set; } = 8;

    public string SubtitleFontName { get; set; } = "DejaVu Sans";
    public int SubtitleFontSize { get; set; } = 54;
}
