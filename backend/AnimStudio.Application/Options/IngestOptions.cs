namespace AnimStudio.Application.Options;

public sealed class YtDlpOptions
{
    /// <summary>
    /// URL ingest and media downloading via yt-dlp.
    /// </summary>
    public bool Enabled { get; set; } = true;

    public string ExecutablePath { get; set; } = "yt-dlp";
    public int TimeoutSeconds { get; set; } = 120;
    public int MaxOutputBytes { get; set; } = 8 * 1024 * 1024;
}

public sealed class IngestOptions
{
    public const string Section = "Ingest";

    /// <summary>Paste is the default because it always works and needs no third party.</summary>
    public string DefaultSource { get; set; } = "PastedText";

    public bool AllowUrlIngest { get; set; } = true;

    /// <summary>
    /// Operator-level gate on downloading media.
    /// </summary>
    public bool AllowMediaDownload { get; set; } = true;

    /// <summary>Applies to every ingest, including captions-only.</summary>
    public bool RequireRightsAttestation { get; set; } = true;

    public string TermsVersion { get; set; } = "2026-09-01";
    public bool AllowHttpUrls { get; set; }

    public int MaxTranscriptCharacters { get; set; } = 400_000;
    public int MaxCueCount { get; set; } = 20_000;
    public int MaxSubtitleUploadBytes { get; set; } = 2 * 1024 * 1024;

    public List<string> PreferredCaptionLanguages { get; set; } = ["en", "en-US", "en-GB", "hi"];
    public bool RetainRawCaptionArtifact { get; set; } = true;

    public YtDlpOptions YtDlp { get; set; } = new();
}
