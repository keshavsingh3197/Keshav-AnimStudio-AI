namespace AnimStudio.Application.Media;

public sealed record MediaProbeRequest(string Url);

public sealed record MediaProbeResponse(
    string VideoId,
    string CanonicalUrl,
    string Title,
    string Channel,
    double DurationSeconds,
    string DurationFormatted,
    string ThumbnailUrl,
    int? Width,
    int? Height,
    bool IsShort,
    string AspectLabel,
    IReadOnlyList<string> AvailableResolutions,
    IReadOnlyList<string> AvailableAudioFormats);

public sealed record MediaDownloadRequest(
    string Url,
    string Format = "mp4",
    string Resolution = "best",
    string AudioBitrate = "192k",
    string? ProjectId = null,
    bool ImportAsAsset = false,
    string? AssetName = null,
    string CompressionPreset = "original"); // "original", "balanced", "high", "ultracompact"

public sealed record MediaDownloadResult(
    string Ticket,
    string FileName,
    string MimeType,
    long FileSizeBytes,
    double DurationSeconds,
    bool IsAudioOnly,
    string? AssetId,
    string StreamUrl);

public sealed record VideoChunkRequest(
    string? AssetId = null,
    string? Url = null,
    double ChunkDurationSeconds = 10.0,
    bool AccurateCut = false,
    string? ProjectId = null,
    bool ImportAsClips = false,
    bool ConvertTo916 = false,
    string CompressionPreset = "original"); // "original", "balanced", "high", "ultracompact"

public sealed record ChunkItemResponse(
    int Index,
    string FileName,
    double StartSeconds,
    double EndSeconds,
    double DurationSeconds,
    string StartFormatted,
    string EndFormatted,
    long FileSizeBytes,
    string StreamUrl,
    string? AssetId = null,
    string? ClipId = null);

public sealed record VideoChunkResult(
    string JobId,
    string SourceTitle,
    double TotalDurationSeconds,
    double ChunkDurationSeconds,
    int TotalChunks,
    IReadOnlyList<ChunkItemResponse> Chunks,
    string ZipDownloadUrl);

