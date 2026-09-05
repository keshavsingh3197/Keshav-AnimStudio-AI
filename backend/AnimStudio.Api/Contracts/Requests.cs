using System.ComponentModel.DataAnnotations;
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
