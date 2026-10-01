using AnimStudio.Application.Rendering;

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

    /// <summary>
    /// Decoder threads allowed to EACH input of a crossfade join, or 0 for ffmpeg's default.
    /// <para>
    /// The cheapest fix for the memory problem described on
    /// <see cref="MaxMergeInputs"/>, and it costs nothing: a 24-clip 1080p join measured
    /// 2068 MB with default threading and 927 MB capped at two, in the same 35 seconds,
    /// because the single output encoder is the bottleneck rather than the decoders.
    /// Dropping to one thread saves a further 100 MB but makes decode the bottleneck and
    /// the join 60% slower, so two is the default. Only decoders are capped; the encoder
    /// still gets the whole machine.
    /// </para>
    /// </summary>
    public int MergeDecoderThreads { get; set; } = 2;

    /// <summary>
    /// How many clips one crossfade join may open at once, before the work is split into a
    /// cascade of smaller joins.
    /// <para>
    /// An <c>xfade</c> chain names one input per clip, so ffmpeg opens them all and keeps a
    /// decoder and frame pool for each. Past the point where that stops fitting in RAM the
    /// host starts paging and the SAME join becomes wildly non-deterministic: on a 16 GB
    /// machine, a 24-clip join was measured at 72s, 99s and 937s on byte-identical input.
    /// A random 13x is not a slow render, it is a job that sometimes blows its timeout.
    /// </para>
    /// <para>
    /// This is the backstop rather than the first line of defence -
    /// <see cref="MergeDecoderThreads"/> already cuts the per-clip cost by more than half
    /// for free, and the default here is set so that a stitch which fits in about a
    /// gigabyte still runs as a single pass. A cascade costs an extra encode generation for
    /// the clips that pass through an intermediate level, so it is worth avoiding until the
    /// alternative is paging.
    /// </para>
    /// </summary>
    public int MaxMergeInputs { get; set; } = 24;
}

public sealed class RenderOptions
{
    public const string Section = "Render";

    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public int Fps { get; set; } = 30;
    public int Crf { get; set; } = 18;

    /// <summary>The x264 preset for the DELIVERED video - the one the viewer downloads.</summary>
    public string Preset { get; set; } = "medium";

    /// <summary>
    /// The x264 preset for pass-one clip intermediates, which exist only to be re-encoded
    /// by the join and are then deleted with the workspace.
    /// <para>
    /// Deliberately much faster than <see cref="Preset"/>: at a fixed CRF the preset buys
    /// compression efficiency rather than quality, so a throwaway file is the wrong place
    /// to spend it. Measured at 1080p30, this halves the conform pass. Set it to the same
    /// value as <see cref="Preset"/> to opt out.
    /// </para>
    /// </summary>
    public string IntermediatePreset { get; set; } = "ultrafast";

    /// <summary>
    /// Encode throwaway stitch intermediates on the GPU encoder the startup probe found.
    /// <para>
    /// Off by default because it was measured to LOSE here: Quick Sync took 1730ms per
    /// 1080p clip against 1250ms for libx264 veryfast, and one iGPU has one media engine,
    /// so the eight clips conformed in parallel queue behind each other while the CPU
    /// idles. Turn it on only for a host with a discrete encoder that benchmarks faster.
    /// </para>
    /// </summary>
    public bool UseHardwareEncoder { get; set; }

    public string ScratchRoot { get; set; } = "storage/temp";

    /// <summary>
    /// Where conformed clips are kept between exports, keyed by everything that decides
    /// their bytes. Empty disables the cache. See <see cref="ClipConformCache"/>.
    /// </summary>
    public string ClipCacheRoot { get; set; } = "storage/clip-cache";

    /// <summary>Size the clip cache is trimmed back to, oldest-used first.</summary>
    public int ClipCacheMaxGigabytes { get; set; } = 20;

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

    /// <summary>
    /// Absolute path to a .ttf/.otf for the text watermark. Empty is normal: the server
    /// then finds a system font itself at startup - see
    /// <see cref="WatermarkFontResolver"/> - and logs which one it chose. Set this only to
    /// pick a different face.
    /// <para>
    /// Note that it is a FILE and never a family name, unlike
    /// <see cref="SubtitleFontName"/>. <c>drawtext</c>'s <c>font=</c> option resolves a
    /// family through fontconfig, and on a build with fontconfig compiled in but no
    /// <c>fonts.conf</c> - every stock Windows ffmpeg - the failed lookup is dereferenced
    /// and the renderer dies with an access violation. libass, which the subtitle font name
    /// feeds, has its own font provider and is unaffected.
    /// </para>
    /// </summary>
    public string WatermarkFontFile { get; set; } = string.Empty;

    /// <summary>
    /// What the watermark box is pre-filled with, so the site address is typed once by
    /// whoever runs the server instead of once per video by whoever makes them.
    /// </summary>
    public string WatermarkText { get; set; } = string.Empty;
}
