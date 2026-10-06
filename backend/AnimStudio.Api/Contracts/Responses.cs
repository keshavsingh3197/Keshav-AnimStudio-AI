namespace AnimStudio.Api.Contracts;

public sealed record WatermarkResponse(
    string Kind,
    string? Text,
    string? LogoAssetId,
    string Position,
    double Opacity,
    double HeightFraction,
    double MarginFraction,
    string ColorHex,
    double BackplateOpacity);

public sealed record OutroResponse(
    string Kind,
    string? AssetId,
    double DurationSeconds,
    string Transition,
    int TransitionDurationFrames,
    string? QrAssetId = null,
    string? Headline = null,
    string? Subtext = null,
    string BackgroundHex = "#101828",
    string TextHex = "#FFFFFF",
    string? HeadlineSecondary = null,
    string? SubtextSecondary = null);

public sealed record ProjectResponse(
    string Id, string Name, string? Description, string Status,
    int Width, int Height, int Fps, string DistributionIntent,
    bool AcceptShareAlikeObligation,
    string? BackgroundMusicAssetId, double BackgroundMusicVolume,
    DateTime CreatedAt, DateTime UpdatedAt,
    bool IsPinned = false,
    string? CustomThumbnail = null,
    WatermarkResponse? DefaultWatermark = null,
    OutroResponse? DefaultOutro = null,
    string? BrandChannelId = null,
    bool FollowChannelWatermark = true);

/// <summary>A brand channel and its look. The built-in default comes first, with IsDefault set.</summary>
public sealed record BrandChannelResponse(
    string Id, string Name, bool IsDefault, WatermarkResponse? Watermark, OutroResponse? Outro,
    // The YouTube channel this brand publishes to (Settings → YouTube publishing): an id, not a secret.
    string? YouTubeChannelId = null, string? YouTubeChannelTitle = null);

public sealed record CharacterResponse(
    string Id, string Name, string? Description, IReadOnlyList<string> Aliases,
    string? ClosedMouthAssetId, string? OpenMouthAssetId, bool IsNarrator, string? SubtitleColorHex,
    CharacterAppearanceResponse Appearance);

public sealed record CharacterAppearanceResponse(
    int? Age, string? Gender, string? Hair, string? Clothes, string? AdditionalDetails);

public sealed record AssetResponse(
    string Id, string Name, string Kind, string MimeType, long FileSizeBytes,
    int? Width, int? Height, bool HasAlpha, double? DurationSeconds, string ReviewStatus, string? FolderId = null);

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
public sealed record RenderDiagnosticsResponse(
    double TotalSeconds,
    double PreparingSeconds,
    double EncodingSeconds,
    double MergingSeconds,
    double PublishingSeconds,
    int ItemsCount,
    double? OutputDurationSeconds,
    string? SpeedFactor,
    DateTime? CompletedAt,
    string? HardwareEncoder = null);


public sealed record RenderJobResponse(
    string JobId, string ProjectId, string Kind, string Status, int Progress, string? Message,
    string CurrentStage, int ScenesTotal, int ScenesDone,
    string? ErrorCode, string? ErrorMessage, IReadOnlyList<string> Warnings,
    bool HasOutput, double? OutputDurationSeconds,
    DateTime CreatedAt, DateTime? CompletedAt,
    int? Width = null, int? Height = null, string? TargetFormat = null,
    RenderDiagnosticsResponse? Diagnostics = null,
    bool HasTimeline = false);

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

/// <summary>
/// What one AI capability can do right now. Deliberately says WHY it is unavailable, so
/// the UI can grey a button out with an explanation instead of letting a user click
/// something that will fail. Carries no key material, and no base URL - a base URL is
/// operator configuration, not something a project screen needs.
/// </summary>
public sealed record AiCapabilityResponse(
    string Capability,
    string? ProviderId,
    string? Model,
    bool Available,
    string Reason,
    // Null when the provider has no configured ceiling, which is not the same as zero.
    long? DailyRemaining,
    IReadOnlyList<string> Chain);

public sealed record AiCapabilitiesResponse(IReadOnlyList<AiCapabilityResponse> Capabilities)
{
    /// <summary>True when nothing at all is configured - the app's supported default state.</summary>
    public bool AnyAvailable => Capabilities.Any(c => c.Available);
}

/// <summary>
/// One video clip in the library, with just enough measured detail to lay out a running
/// order without playing every file: how long it is, what shape it is, and whether it has
/// any sound.
/// </summary>
public sealed record ClipResponse(
    string Id, string Name, long FileSizeBytes,
    double? DurationSeconds, int? Width, int? Height, bool HasAudio, bool IsExport);

public sealed record ClipOrderLineResponse(int Number, string Text, string? AssetId, string Match);

/// <summary>
/// A resolved running order. <c>AssetIds</c> is always a COMPLETE ordering of everything
/// that was sent, so it can be applied straight to the list; the diagnostics are there to
/// explain what was guessed, not to gate applying it.
/// </summary>
public sealed record ClipOrderResponse(
    IReadOnlyList<string> AssetIds,
    IReadOnlyList<ClipOrderLineResponse> Lines,
    IReadOnlyList<string> AppendedAssetIds,
    bool IsExact);

/// <summary>
/// Everything the clip screen needs in one request: the clips, the server's defaults, and
/// what this machine's renderer can actually do.
/// <para>
/// The capability flags exist so an option that would fail is greyed out with a reason
/// rather than offered and then quietly ignored - the same contract
/// <see cref="RendererStatusResponse"/> has for the project renderer.
/// </para>
/// </summary>
public sealed record ClipStudioResponse(
    IReadOnlyList<ClipResponse> Clips,
    IReadOnlyList<AssetResponse> LogoCandidates,
    IReadOnlyList<AssetResponse> MusicCandidates,
    string? DefaultWatermarkText,
    int MaxClips,
    int MaxMusicTracks,
    long MaxClipUploadBytes,
    long MaxImageOrAudioUploadBytes,
    bool RendererAvailable,
    string? UnavailableReason,
    bool TextWatermarkAvailable,
    bool LogoWatermarkAvailable,
    bool TransitionsAvailable,
    bool BlurredBackdropAvailable,
    string? StudioDraftJson = null);

/// <summary>
/// What the storage bar fills against. <c>CapacitySource</c> is "quota" when an
/// administrator set one, "disk" when the bar falls back to the drive's size, and "none"
/// when neither is known. No paths: this one is shown to every user.
/// </summary>
public sealed record StorageSummaryResponse(
    string Provider,
    bool IsMeasurable,
    long UsedBytes,
    long? CapacityBytes,
    string CapacitySource,
    DateTimeOffset MeasuredAt);

public sealed record StorageFolderResponse(string Name, long Bytes, long Files);

/// <summary>The settings page's view: the summary plus where the space went.</summary>
public sealed record StorageDetailResponse(
    StorageSummaryResponse Summary,
    double? QuotaGb,
    long FileCount,
    long? DiskTotalBytes,
    long? DiskFreeBytes,
    IReadOnlyList<StorageFolderResponse> Folders);
