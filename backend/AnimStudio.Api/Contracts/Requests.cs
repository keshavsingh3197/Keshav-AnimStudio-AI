using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Application.Clips;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Api.Contracts;

public sealed class TolerantDistributionIntentConverter : JsonConverter<DistributionIntent>
{
    public override DistributionIntent Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString();
            if (string.IsNullOrWhiteSpace(str)) return DistributionIntent.Personal;
            if (Enum.TryParse<DistributionIntent>(str, ignoreCase: true, out var result))
                return result;
            if (str.Contains("Social", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("Public", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("Web", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("YouTube", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("TikTok", StringComparison.OrdinalIgnoreCase))
                return DistributionIntent.Public;
            if (str.Contains("Monetiz", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("Commercial", StringComparison.OrdinalIgnoreCase) ||
                str.Contains("Business", StringComparison.OrdinalIgnoreCase))
                return DistributionIntent.Monetized;
            return DistributionIntent.Personal;
        }
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var num))
        {
            return Enum.IsDefined(typeof(DistributionIntent), num) ? (DistributionIntent)num : DistributionIntent.Personal;
        }
        return DistributionIntent.Personal;
    }

    public override void Write(Utf8JsonWriter writer, DistributionIntent value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

public sealed record CreateProjectRequest
{
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Range(320, 3840)] public int Width { get; init; } = 1920;
    [Range(240, 2160)] public int Height { get; init; } = 1080;
    [Range(1, 60)] public int Fps { get; init; } = 30;

    [JsonConverter(typeof(TolerantDistributionIntentConverter))]
    public DistributionIntent DistributionIntent { get; init; } = DistributionIntent.Personal;
}

public sealed record RightsAttestationRequest
{
    public bool IsOwnerOrLicensed { get; init; }

    /// <summary>One of RightsBasis's values; validated server-side against that closed set.</summary>
    [Required, StringLength(40)]
    public string BasisCode { get; init; } = string.Empty;

    [StringLength(1000)] public string? BasisNotes { get; init; }
    [StringLength(200)] public string? AttestedByName { get; init; }
    [StringLength(40)] public string? AcceptedTermsVersion { get; init; }
}

public sealed record CreateIngestRequest
{
    /// <summary>PastedText, SubtitleFile or YouTubeCaptions.</summary>
    [Required, StringLength(30)]
    public string Source { get; init; } = "PastedText";

    [StringLength(2048)] public string? Url { get; init; }
    [StringLength(400_000)] public string? Text { get; init; }
    /// <summary>An uploaded subtitle asset in this project, for the SubtitleFile source.</summary>
    [StringLength(64)] public string? SubtitleAssetId { get; init; }
    [StringLength(64)] public string? MediaAssetId { get; init; }

    /// <summary>Honoured only if the server also allows media download.</summary>
    public bool IncludeMedia { get; init; }

    [StringLength(80)] public string? IdempotencyKey { get; init; }

    public RightsAttestationRequest? RightsAttestation { get; init; }
}

/// <summary>
/// What the character looks like. Not used by the renderer - the sprites are - but it is
/// the description an image generator would be given later, and it is where a user records
/// the design they drew the sprites from.
/// </summary>
public sealed record CharacterAppearanceRequest
{
    [Range(0, 200)] public int? Age { get; init; }
    [StringLength(60)] public string? Gender { get; init; }
    [StringLength(120)] public string? Hair { get; init; }
    [StringLength(200)] public string? Clothes { get; init; }
    [StringLength(1000)] public string? AdditionalDetails { get; init; }
}

public sealed record CreateCharacterRequest
{
    [Required, StringLength(80, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(1000)] public string? Description { get; init; }
    public List<string> Aliases { get; init; } = [];

    [StringLength(64)] public string? ClosedMouthAssetId { get; init; }
    [StringLength(64)] public string? OpenMouthAssetId { get; init; }

    /// <summary>Hex colour used for this character's subtitles, e.g. "#FFE164".</summary>
    [StringLength(9)] public string? SubtitleColorHex { get; init; }

    public CharacterAppearanceRequest? Appearance { get; init; }
}

public sealed record AssignSceneBackgroundRequest
{
    [Required, StringLength(64)] public string AssetId { get; init; } = string.Empty;
}

public sealed record UpdateProjectRequest
{
    public bool? IsPinned { get; init; }
    [StringLength(3_000_000)] public string? CustomThumbnail { get; init; }
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Range(320, 3840)] public int Width { get; init; } = 1920;
    [Range(240, 2160)] public int Height { get; init; } = 1080;
    [Range(1, 60)] public int Fps { get; init; } = 30;

    [JsonConverter(typeof(TolerantDistributionIntentConverter))]
    public DistributionIntent DistributionIntent { get; init; } = DistributionIntent.Personal;
    public bool AcceptShareAlikeObligation { get; init; }

    /// <summary>Null clears the music bed.</summary>
    [StringLength(64)] public string? BackgroundMusicAssetId { get; init; }

    [Range(0, 2)] public double BackgroundMusicVolume { get; init; } = 0.18;

    public WatermarkRequest? DefaultWatermark { get; init; }
    public OutroRequest? DefaultOutro { get; init; }
}

public sealed record CreateSceneRequest
{
    [StringLength(200)] public string? Title { get; init; }
    [StringLength(2000)] public string? Description { get; init; }

    [Range(0.04, 3600)] public double DurationSeconds { get; init; } = 5;

    [StringLength(64)] public string? BackgroundAssetId { get; init; }

    /// <summary>Insert directly after this scene. Null appends to the end.</summary>
    [StringLength(64)] public string? AfterSceneId { get; init; }
}

/// <summary>
/// A full replacement of the scene's own shape. Dialogue, staging, background and audio
/// are edited through their own endpoints, so a save from the scene form cannot wipe them.
/// </summary>
public sealed record UpdateSceneRequest
{
    [StringLength(200)] public string? Title { get; init; }
    [StringLength(2000)] public string? Description { get; init; }

    [Range(0.04, 3600)] public double DurationSeconds { get; init; } = 5;

    public BackgroundEffect BackgroundEffect { get; init; } = BackgroundEffect.None;
    [Range(0, 1)] public double Intensity { get; init; } = 0.12;
    public Easing Easing { get; init; } = Easing.Linear;

    [Range(0, 60)] public double FadeInSeconds { get; init; }
    [Range(0, 60)] public double FadeOutSeconds { get; init; }

    public SceneTransition Transition { get; init; } = SceneTransition.None;
    [Range(0, 60)] public double TransitionDurationSeconds { get; init; }
}

public sealed record ReorderScenesRequest
{
    /// <summary>Every scene in the project, in the order they should play.</summary>
    [Required, MinLength(1)]
    public List<string> SceneIds { get; init; } = [];
}

public sealed record UpsertDialogueRequest
{
    [StringLength(64)] public string? SpeakerCharacterId { get; init; }

    [Required, StringLength(1000, MinimumLength = 1)]
    public string Text { get; init; } = string.Empty;

    [Range(0, 3600)] public double StartSeconds { get; init; }
    [Range(0, 3600)] public double EndSeconds { get; init; }
}

public sealed record UpsertPlacementRequest
{
    [Required, StringLength(64)]
    public string CharacterId { get; init; } = string.Empty;

    public Anchor Anchor { get; init; } = Anchor.BottomCenter;

    [Range(0.05, 2)] public double HeightFraction { get; init; } = 0.70;
    [Range(-1, 1)] public double OffsetXFraction { get; init; }
    [Range(-1, 1)] public double OffsetYFraction { get; init; }

    public bool FlipHorizontal { get; init; }
    [Range(-100, 100)] public int ZOrder { get; init; }

    public SpriteEntrance Entrance { get; init; } = SpriteEntrance.None;
    [Range(0, 60)] public double EntranceDurationSeconds { get; init; }

    /// <summary>Null for both means "on screen for the whole scene".</summary>
    [Range(0, 3600)] public double? PresenceStartSeconds { get; init; }
    [Range(0, 3600)] public double? PresenceEndSeconds { get; init; }
}

public sealed record SetSceneAudioRequest
{
    /// <summary>Null clears this scene's audio.</summary>
    [StringLength(64)] public string? AssetId { get; init; }

    /// <summary>Window on the SOURCE media clock. Null keeps what the import recorded.</summary>
    [Range(0, 86400)] public double? SliceStartSeconds { get; init; }
    [Range(0, 86400)] public double? SliceEndSeconds { get; init; }
}

public sealed record AssignAssetRequest
{
    [Required, StringLength(64)] public string AssetId { get; init; } = string.Empty;
}

/// <summary>
/// A watermark, as the client describes it.
/// <para>
/// Deliberately carries no <c>[Range]</c> attributes. The domain clamps every one of these
/// numbers into a range that still produces a legible mark, and clamping is the kinder
/// answer: a slider that stops at its limit is better than a submit that is refused with a
/// message about a fraction the user never typed.
/// </para>
/// </summary>
public sealed record WatermarkRequest
{
    public WatermarkKind Kind { get; init; } = WatermarkKind.None;

    /// <summary>Reduced to a single printable line server-side before it is stored.</summary>
    [StringLength(200)] public string? Text { get; init; }

    [StringLength(64)] public string? LogoAssetId { get; init; }

    public WatermarkPosition Position { get; init; } = WatermarkPosition.TopRight;

    public double Opacity { get; init; } = 0.8;
    public double HeightFraction { get; init; } = WatermarkSettings.DefaultHeightFraction;
    public double MarginFraction { get; init; } = WatermarkSettings.DefaultMarginFraction;

    [StringLength(7)] public string? ColorHex { get; init; }

    public double BackplateOpacity { get; init; } = 0.3;

    public WatermarkSettings ToSettings() => new()
    {
        Kind = Kind,
        Text = Text,
        LogoAssetId = LogoAssetId,
        Position = Position,
        Opacity = Opacity,
        HeightFraction = HeightFraction,
        MarginFraction = MarginFraction,
        ColorHex = ColorHex ?? "#FFFFFF",
        BackplateOpacity = BackplateOpacity
    };
}

public sealed record OutroRequest
{
    public OutroKind Kind { get; init; } = OutroKind.None;

    [StringLength(64)]
    public string? AssetId { get; init; }

    [Range(1.0, 30.0)]
    public double DurationSeconds { get; init; } = 4.0;

    public SceneTransition Transition { get; init; } = SceneTransition.Fade;

    [Range(0, 120)]
    public int TransitionDurationFrames { get; init; } = 15;

    public OutroSettings ToSettings() => new()
    {
        Kind = Kind,
        AssetId = AssetId,
        DurationSeconds = DurationSeconds,
        Transition = Transition,
        TransitionDurationFrames = TransitionDurationFrames
    };
}

/// <summary>
/// A running order to check. <c>AssetIds</c> is the current selection, in its current
/// order; <c>Text</c> is what the user pasted. Sending the selection matters: the point is
/// to order the clips that were CHOSEN, not to search the whole library.
/// </summary>
public sealed record ClipOrderRequest
{
    [MaxLength(ClipMergeSpec.MaxClips)]
    public List<string> AssetIds { get; init; } = [];

    [StringLength(ClipOrderLimits.MaxTextLength)]
    public string? Text { get; init; }
}

/// <summary>Every video clip in its saved Video editor order.</summary>
public sealed record SaveClipOrderRequest
{
    [Required, MaxLength(ClipMergeSpec.MaxClips)]
    public List<string> AssetIds { get; init; } = [];
}

/// <summary>Full timeline, overlays, audio cues and state from Clip Studio.</summary>
public sealed record SaveStudioDraftRequest
{
    [Required]
    public string DraftJson { get; init; } = string.Empty;
}

/// <summary>Just a set of clips, for an action that needs no other parameters.</summary>
public sealed record ClipIdsRequest
{
    [Required, MinLength(1), MaxLength(ClipMergeSpec.MaxClips)]
    public List<string> AssetIds { get; init; } = [];
}

/// <summary>One junction's transition, in seconds. Position in the list IS the gap it names.</summary>
public sealed record ClipJunctionRequest
{
    public SceneTransition Transition { get; init; } = SceneTransition.None;

    [Range(0, 3)] public double TransitionSeconds { get; init; }

    [Range(0, 3)] public double LeadInSeconds { get; init; }
    [Range(0, 3)] public double TailOutSeconds { get; init; }
    public bool FreezeHead { get; init; }
    public bool FreezeTail { get; init; }
}


/// <summary>One music (or other audio) clip placed at its own point on the timeline.</summary>
public sealed record TimedMusicClipRequest
{
    [Required, StringLength(64)] public string AssetId { get; init; } = string.Empty;

    [Range(0, 86400)] public double StartSeconds { get; init; }
    [Range(0, 1)] public double Volume { get; init; } = 0.5;
    [Range(0, 86400)] public double? TrimStartSeconds { get; init; }
    [Range(0, 86400)] public double? TrimEndSeconds { get; init; }
}

/// <summary>
/// One clip's sound. Position in the list IS the clip it names, so a list either covers
/// every clip in the running order or is left out entirely.
/// </summary>
public sealed record ClipAudioRequest
{
    /// <summary>The clip's OWN audio. 1 as recorded, 0 silent, above 1 a boost.</summary>
    [Range(0, ClipAudioSpec.MaxGain)] public double Volume { get; init; } = 1.0;

    /// <summary>A sound for this clip alone - a voice-over, a sting, a music change.</summary>
    [StringLength(64)] public string? AudioAssetId { get; init; }

    [Range(0, ClipAudioSpec.MaxGain)] public double AudioVolume { get; init; } = 1.0;

    /// <summary>Optional window on the SOURCE file. Null on either end plays from/to the end.</summary>
    [Range(0, 86400)] public double? TrimStartSeconds { get; init; }
    [Range(0, 86400)] public double? TrimEndSeconds { get; init; }

    /// <summary>Plays that sound OVER the clip's own audio rather than instead of it.</summary>
    public bool KeepOriginalAudio { get; init; }
}

/// <summary>
/// One stretch of the finished timeline over which the music plays at a reduced level.
/// <para>
/// Ducking the MUSIC cannot be folded into a clip's own volume the way ducking the clip can,
/// so the client sends the windows its overlap rules resolved to and the graph builds a gain
/// envelope from them. Windows arrive already merged and in timeline order.
/// </para>
/// </summary>
public sealed record MusicDuckWindowRequest
{
    [Range(0, 86400)] public double StartSeconds { get; init; }
    [Range(0, 86400)] public double EndSeconds { get; init; }

    /// <summary>Multiplier applied to the music across the window. 1 is no duck, 0 silence.</summary>
    [Range(0, 1)] public double Level { get; init; } = 1.0;
}

/// <summary>
/// One video built from several clips. The order of <c>AssetIds</c> IS the running order -
/// there is no separate sequence field that could disagree with it.
/// </summary>
public sealed record ClipMergeRequest
{
    public string? ExportName { get; init; }
    [Required, MinLength(1)]
    public List<string> AssetIds { get; init; } = [];

    public ClipFit Fit { get; init; } = ClipFit.Contain;

    [Range(360, 3840)] public int? OutputWidth { get; init; }
    [Range(360, 3840)] public int? OutputHeight { get; init; }

    public SceneTransition Transition { get; init; } = SceneTransition.None;

    [Range(0, 3)] public double TransitionSeconds { get; init; }

    /// <summary>
    /// One entry per gap between consecutive clips, overriding the transition above for
    /// that gap only. Null means every gap uses the uniform pair above.
    /// </summary>
    public List<ClipJunctionRequest>? Junctions { get; init; }

    /// <summary>Drops the clips' own sound. Only sensible with a music bed underneath.</summary>
    public bool MuteClipAudio { get; init; }

    [StringLength(64)] public string? BackgroundMusicAssetId { get; init; }

    [Range(0, 1)] public double BackgroundMusicVolume { get; init; } = 0.18;

    /// <summary>Extra music clips, each starting at its own point on the finished timeline.</summary>
    [MaxLength(ClipMergeSpec.MaxMusicTracks)]
    public List<TimedMusicClipRequest> MusicTracks { get; init; } = [];

    /// <summary>
    /// Where the music steps back under the clips above it. Empty means the music holds one
    /// level throughout.
    /// </summary>
    [MaxLength(ClipMergeSpec.MaxDuckWindows)]
    public List<MusicDuckWindowRequest> MusicDuckWindows { get; init; } = [];

    /// <summary>
    /// One entry per clip, setting how loud each clip's own sound is and giving any of
    /// them a sound of its own. Null means every clip plays as recorded.
    /// </summary>
    [MaxLength(ClipMergeSpec.MaxClips)]
    public List<ClipAudioRequest>? ClipAudio { get; init; }

    public WatermarkRequest Watermark { get; init; } = new();
    public OutroRequest Outro { get; init; } = new();

    public List<TimelineItemRequest>? TimelineItems { get; init; }
}

public sealed record TimelineItemTextStyleRequest
{
    public double FontSize { get; init; } = 36;
    [StringLength(32)] public string Color { get; init; } = "#ffffff";
    [StringLength(32)] public string BackgroundColor { get; init; } = "rgba(0,0,0,0.6)";
    [StringLength(16)] public string Position { get; init; } = "bottom";
    [StringLength(32)] public string? TransitionIn { get; init; } = "fade";
    public double TransitionInDuration { get; init; } = 0.5;
    [StringLength(32)] public string? TransitionOut { get; init; } = "fade";
    public double TransitionOutDuration { get; init; } = 0.5;
}

public sealed record TimelineItemTransformRequest
{
    public double Scale { get; init; } = 1.0;

    /// <summary>Normalized percentage offset [-50, 50] from canvas centre on X axis.</summary>
    public double X { get; init; }

    /// <summary>Normalized percentage offset [-50, 50] from canvas centre on Y axis.</summary>
    public double Y { get; init; }

    public double Opacity { get; init; } = 1.0;

    /// <summary>Clockwise rotation in degrees.</summary>
    public double Rotation { get; init; }

    /// <summary>Crop percentages [0–99] from each edge.</summary>
    public double CropLeft { get; init; }
    public double CropRight { get; init; }
    public double CropTop { get; init; }
    public double CropBottom { get; init; }

    /// <summary>Request video stabilization for this clip.</summary>
    public bool Stabilization { get; init; }

    [StringLength(32)] public string? TransitionIn { get; init; } = "fade";
    public double TransitionInDuration { get; init; } = 0.5;
    [StringLength(32)] public string? TransitionOut { get; init; } = "fade";
    public double TransitionOutDuration { get; init; } = 0.5;
}

public sealed record TimelineItemRequest
{
    public string Id { get; init; } = string.Empty;
    public string Type { get; init; } = "video";
    public string TrackId { get; init; } = "V1";
    public double StartTime { get; init; }
    public double Duration { get; init; }
    public string Src { get; init; } = string.Empty;
    public string? Name { get; init; }
    public TimelineItemTransformRequest? Transform { get; init; }
    public TimelineItemTextStyleRequest? TextStyle { get; init; }
    public double? Volume { get; init; }
    public double? TrimStartSeconds { get; init; }
    public double? TrimEndSeconds { get; init; }
}
