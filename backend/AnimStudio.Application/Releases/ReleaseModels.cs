namespace AnimStudio.Application.Releases;

/// <summary>
/// What a distributor's upload form asks for, filled in once so the release sheet can be
/// copied from instead of retyped per store. Field names follow the common distributor
/// vocabulary rather than any one store's.
/// </summary>
public sealed record ReleaseMetadata
{
    public string Title { get; init; } = string.Empty;

    /// <summary>"Acoustic", "Remix", "Slowed" - shown in brackets after the title by stores.</summary>
    public string? VersionTitle { get; init; }

    public string PrimaryArtist { get; init; } = string.Empty;
    public IReadOnlyList<string> FeaturedArtists { get; init; } = [];
    public IReadOnlyList<string> Songwriters { get; init; } = [];
    public IReadOnlyList<string> Producers { get; init; } = [];

    public string Genre { get; init; } = string.Empty;
    public string? SecondaryGenre { get; init; }

    /// <summary>ISO 639-1 language of the lyrics, or "zxx" for an instrumental.</summary>
    public string Language { get; init; } = "en";

    public bool Explicit { get; init; }
    public bool Instrumental { get; init; }

    public DateOnly? ReleaseDate { get; init; }
    public string? RecordLabel { get; init; }

    /// <summary>The (P) line: who owns the sound recording, e.g. "2026 Keshav Records".</summary>
    public string? RecordingCopyright { get; init; }

    /// <summary>The (C) line: who owns the composition and artwork.</summary>
    public string? CompositionCopyright { get; init; }

    /// <summary>Recording code. Optional: most distributors assign one when it is blank.</summary>
    public string? Isrc { get; init; }

    /// <summary>Release barcode (UPC-A or EAN-13). Optional for the same reason.</summary>
    public string? Upc { get; init; }

    public string? Lyrics { get; init; }

    /// <summary>
    /// The uploader states they own or control every right in the recording, composition
    /// and artwork. A kit is never built without it.
    /// </summary>
    public bool RightsConfirmed { get; init; }
}

/// <summary>Technical targets for the master and which promo assets to make.</summary>
public sealed record ReleaseKitOptions
{
    /// <summary>Integrated loudness target. -14 LUFS is what the major streaming services play back at.</summary>
    public double TargetLufs { get; init; } = -14.0;

    /// <summary>True-peak ceiling. -1 dBTP leaves room for the stores' lossy encoders.</summary>
    public double TruePeakDb { get; init; } = -1.0;

    public int SampleRate { get; init; } = 44_100;
    public int BitDepth { get; init; } = 24;

    /// <summary>16:9 cover-art + waveform video, ready to upload to YouTube.</summary>
    public bool MakeVisualizer { get; init; } = true;

    /// <summary>Short 9:16 silent loop for Spotify Canvas, Reels and Shorts backgrounds.</summary>
    public bool MakePromoLoop { get; init; } = true;
}

public sealed record LoudnessMeasurement(
    double IntegratedLufs,
    double TruePeakDb,
    double LoudnessRange);

public sealed record ReleaseKitFile(
    string Name,
    string Label,
    string MimeType,
    long SizeBytes,
    string DownloadUrl);

public sealed record ReleaseKitWarning(string Code, string Message);

public sealed record ReleaseKitResult(
    string JobId,
    string Title,
    string PrimaryArtist,
    double DurationSeconds,
    int SourceSampleRate,
    int SourceChannels,
    string SourceCodec,
    LoudnessMeasurement Before,
    LoudnessMeasurement After,
    IReadOnlyList<ReleaseKitFile> Files,
    IReadOnlyList<ReleaseKitWarning> Warnings,
    string ZipDownloadUrl);
