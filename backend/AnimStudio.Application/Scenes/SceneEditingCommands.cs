using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Scenes;

/// <summary>
/// Editing commands.
/// <para>
/// Every time here is in SECONDS: frames are the pipeline's unit, but the only clock a
/// caller can sensibly express is wall time, so conversion happens once, inside the
/// service, using the owning project's frame rate.
/// </para>
/// </summary>
public sealed record CreateSceneCommand
{
    public required string ProjectId { get; init; }
    public required string UserId { get; init; }

    public string? Title { get; init; }
    public string? Description { get; init; }
    public double DurationSeconds { get; init; } = 5;
    public string? BackgroundAssetId { get; init; }

    /// <summary>Insert directly after this scene. Null appends to the end.</summary>
    public string? AfterSceneId { get; init; }
}

/// <summary>
/// A full replacement of a scene's own shape - not a patch. Dialogue, staging, background
/// and audio each have their own command, because they are edited from different parts of
/// the UI and merging them into one payload makes a partial save destructive.
/// </summary>
public sealed record UpdateSceneCommand
{
    public required string SceneId { get; init; }
    public required string UserId { get; init; }

    public string? Title { get; init; }
    public string? Description { get; init; }
    public required double DurationSeconds { get; init; }

    public BackgroundEffect BackgroundEffect { get; init; } = BackgroundEffect.None;
    public double Intensity { get; init; } = 0.12;
    public Easing Easing { get; init; } = Easing.Linear;
    public double FadeInSeconds { get; init; }
    public double FadeOutSeconds { get; init; }

    public SceneTransition Transition { get; init; } = SceneTransition.None;
    public double TransitionDurationSeconds { get; init; }
}

public sealed record UpsertDialogueCommand
{
    public required string SceneId { get; init; }
    public required string UserId { get; init; }

    /// <summary>Null adds a new line; otherwise the zero-based index being replaced.</summary>
    public int? Index { get; init; }

    public string? SpeakerCharacterId { get; init; }
    public required string Text { get; init; }
    public double StartSeconds { get; init; }
    public double EndSeconds { get; init; }
}

public sealed record UpsertPlacementCommand
{
    public required string SceneId { get; init; }
    public required string UserId { get; init; }
    public required string CharacterId { get; init; }

    public Anchor Anchor { get; init; } = Anchor.BottomCenter;
    public double HeightFraction { get; init; } = 0.70;
    public double OffsetXFraction { get; init; }
    public double OffsetYFraction { get; init; }
    public bool FlipHorizontal { get; init; }
    public int ZOrder { get; init; }

    public SpriteEntrance Entrance { get; init; } = SpriteEntrance.None;
    public double EntranceDurationSeconds { get; init; }

    /// <summary>Null for both means "on screen for the whole scene".</summary>
    public double? PresenceStartSeconds { get; init; }
    public double? PresenceEndSeconds { get; init; }
}

public sealed record SetSceneAudioCommand
{
    public required string SceneId { get; init; }
    public required string UserId { get; init; }

    /// <summary>Null clears the scene's audio.</summary>
    public string? AssetId { get; init; }

    /// <summary>
    /// Window on the SOURCE media's clock. Null keeps whatever the ingest recorded, which
    /// is what makes "pick the media file" a one-click step after an import.
    /// </summary>
    public double? SliceStartSeconds { get; init; }
    public double? SliceEndSeconds { get; init; }
}
