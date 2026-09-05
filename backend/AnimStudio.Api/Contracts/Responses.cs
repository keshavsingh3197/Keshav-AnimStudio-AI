namespace AnimStudio.Api.Contracts;

public sealed record ProjectResponse(
    string Id, string Name, string? Description, string Status,
    int Width, int Height, int Fps, string DistributionIntent,
    DateTime CreatedAt, DateTime UpdatedAt);

public sealed record CharacterResponse(
    string Id, string Name, string? Description, IReadOnlyList<string> Aliases,
    string? ClosedMouthAssetId, string? OpenMouthAssetId, bool IsNarrator, string? SubtitleColorHex);

public sealed record AssetResponse(
    string Id, string Name, string Kind, string MimeType, long FileSizeBytes,
    int? Width, int? Height, bool HasAlpha, double? DurationSeconds, string ReviewStatus);

public sealed record IngestResponse(
    string IngestId, string? ScriptId, int CueCount, int SegmentCount,
    string TimingSource, bool HasSourceTimings, IReadOnlyList<string> Warnings);

public sealed record SceneGenerationResponse(
    int ScenesCreated, int ScenesPreserved,
    IReadOnlyList<string> UnresolvedSpeakers, IReadOnlyList<string> Warnings);

public sealed record SceneResponse(
    string Id, int SceneNumber, string? Title, int DurationFrames, double DurationSeconds,
    string? BackgroundAssetId, int DialogueLines, string Transition, string BackgroundEffect);

/// <summary>
/// Shaped so a future push-based transport can deliver exactly this payload without the
/// client changing.
/// </summary>
public sealed record RenderJobResponse(
    string JobId, string ProjectId, string Status, int Progress, string? Message,
    string CurrentStage, int ScenesTotal, int ScenesDone,
    string? ErrorCode, string? ErrorMessage, IReadOnlyList<string> Warnings,
    bool HasOutput, double? OutputDurationSeconds,
    DateTime CreatedAt, DateTime? CompletedAt);

public sealed record RendererStatusResponse(
    bool Available, string? Version, string? UnavailableReason,
    bool BurnedSubtitles, bool KenBurns, bool Transitions);

public sealed record TranscriptSourceStatus(
    string Kind, bool Available, string? UnavailableReason, string? ToolVersion,
    bool RequiresAttestation);

public sealed record IngestCapabilitiesResponse(
    string DefaultSource, bool MediaDownloadAllowed,
    IReadOnlyList<TranscriptSourceStatus> Sources);
