using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.Clips;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Api.Contracts;

public sealed record CreateProjectRequest
{
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Range(320, 3840)] public int Width { get; init; } = 1920;
    [Range(240, 2160)] public int Height { get; init; } = 1080;
    [Range(1, 60)] public int Fps { get; init; } = 30;

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
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Range(320, 3840)] public int Width { get; init; } = 1920;
    [Range(240, 2160)] public int Height { get; init; } = 1080;
    [Range(1, 60)] public int Fps { get; init; } = 30;

    public DistributionIntent DistributionIntent { get; init; } = DistributionIntent.Personal;
    public bool AcceptShareAlikeObligation { get; init; }

    /// <summary>Null clears the music bed.</summary>
    [StringLength(64)] public string? BackgroundMusicAssetId { get; init; }

    [Range(0, 2)] public double BackgroundMusicVolume { get; init; } = 0.18;
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

    /// <summary>Plays that sound OVER the clip's own audio rather than instead of it.</summary>
    public bool KeepOriginalAudio { get; init; }
}

/// <summary>
/// One video built from several clips. The order of <c>AssetIds</c> IS the running order -
/// there is no separate sequence field that could disagree with it.
/// </summary>
public sealed record ClipMergeRequest
{
    [Required, MinLength(1)]
    public List<string> AssetIds { get; init; } = [];

    public ClipFit Fit { get; init; } = ClipFit.Contain;

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
    /// One entry per clip, setting how loud each clip's own sound is and giving any of
    /// them a sound of its own. Null means every clip plays as recorded.
    /// </summary>
    [MaxLength(ClipMergeSpec.MaxClips)]
    public List<ClipAudioRequest>? ClipAudio { get; init; }

    public WatermarkRequest Watermark { get; init; } = new();
}
