namespace AnimStudio.Api.Contracts;

public sealed record ProjectResponse(
    string Id, string Name, string? Description, string Status,
    int Width, int Height, int Fps, string DistributionIntent,
    bool AcceptShareAlikeObligation,
    string? BackgroundMusicAssetId, double BackgroundMusicVolume,
    DateTime CreatedAt, DateTime UpdatedAt);

public sealed record CharacterResponse(
    string Id, string Name, string? Description, IReadOnlyList<string> Aliases,
    string? ClosedMouthAssetId, string? OpenMouthAssetId, bool IsNarrator, string? SubtitleColorHex,
    CharacterAppearanceResponse Appearance);

public sealed record CharacterAppearanceResponse(
    int? Age, string? Gender, string? Hair, string? Clothes, string? AdditionalDetails);

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
    string? BackgroundAssetId, int DialogueLines, string Transition, string BackgroundEffect,
    double TransitionDurationSeconds, string? AudioAssetId, bool HasAudioSlice,
    int CharacterCount, string Origin, bool IsUserEdited);

/// <summary>One scene with everything the scene editor needs to draw its form.</summary>
public sealed record SceneDetailResponse(
    string Id, string ProjectId, int SceneNumber, string? Title, string? Description,
    int DurationFrames, double DurationSeconds,
    string? BackgroundAssetId,
    string BackgroundEffect, double Intensity, string Easing,
    double FadeInSeconds, double FadeOutSeconds,
    string Transition, double TransitionDurationSeconds,
    string? AudioAssetId, double? AudioSliceStartSeconds, double? AudioSliceEndSeconds,
    IReadOnlyList<DialogueLineResponse> Dialogue,
    IReadOnlyList<CharacterPlacementResponse> Characters,
    string Origin, bool IsUserEdited, DateTime UpdatedAt);

public sealed record DialogueLineResponse(
    int Index, string? SpeakerCharacterId, string? SpeakerLabel, string Text,
    double StartSeconds, double EndSeconds);

public sealed record CharacterPlacementResponse(
    string CharacterId, string Anchor, double HeightFraction,
    double OffsetXFraction, double OffsetYFraction, bool FlipHorizontal, int ZOrder,
    string Entrance, double EntranceDurationSeconds,
    double PresenceStartSeconds, double PresenceEndSeconds);

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

public sealed record ScriptSummaryResponse(
    string Id, string IngestId, int Version, string Status,
    string TimingSource, bool HasSourceTimings,
    int SegmentCount, int LineCount, double TotalSeconds,
    IReadOnlyList<string> Warnings, DateTime CreatedAt);

/// <summary>
/// A script with its segments, so the import can be reviewed before it becomes scenes -
/// and so a bad cut is visible as a segment rather than as a puzzling scene list.
/// </summary>
public sealed record ScriptDetailResponse(
    string Id, string ProjectId, string IngestId, int Version, string Status,
    string TimingSource, bool HasSourceTimings,
    int SegmentCount, int LineCount, double TotalSeconds,
    IReadOnlyList<ScriptSegmentResponse> Segments, bool SegmentsTruncated,
    IReadOnlyList<string> Warnings, DateTime CreatedAt);

public sealed record ScriptSegmentResponse(
    int Order, string SegmentKey, string? Title, string? DominantSpeakerLabel,
    double SourceStartSeconds, double SourceEndSeconds,
    double TimelineStartSeconds, double TimelineEndSeconds,
    string BreakReason, IReadOnlyList<ScriptLineResponse> Lines);

public sealed record ScriptLineResponse(
    string? SpeakerLabel, string Text, double StartSeconds, double EndSeconds);

/// <summary>
/// One import, for the history list. The attester's name and their free-text notes are
/// deliberately absent: they are personal data, and nothing on this screen needs them.
/// </summary>
public sealed record IngestSummaryResponse(
    string Id, string Source, string Status, string? ScriptId,
    int CueCount, string TimingSource,
    string? SourceTitle, string? CaptionLanguage, bool CaptionIsAutoGenerated,
    bool CaptionsOnly, string? RightsBasisCode,
    string? ToolName, string? ToolVersion,
    IReadOnlyList<string> Warnings, string? ErrorCode,
    DateTime CreatedAt, DateTime? CompletedAt);
