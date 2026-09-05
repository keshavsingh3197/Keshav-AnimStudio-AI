using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

/// <summary>
/// One character's sprites, already resolved to workspace-relative file names and to
/// pixel geometry. The graph builder receives this rather than asset ids, so it needs no
/// storage access and stays a pure function.
/// </summary>
public sealed record SpritePlan
{
    public required string CharacterId { get; init; }
    public required string ClosedMouthRelativePath { get; init; }

    /// <summary>Null when the character has only one sprite; it then renders without a flap.</summary>
    public string? OpenMouthRelativePath { get; init; }

    public required int HeightPixels { get; init; }
    public required string XExpression { get; init; }
    public required string YExpression { get; init; }

    public required FrameRange Presence { get; init; }

    /// <summary>Windows, relative to the scene, in which this character is speaking.</summary>
    public IReadOnlyList<FrameRange> SpeakingWindows { get; init; } = [];

    public SpriteEntrance Entrance { get; init; } = SpriteEntrance.None;
    public FrameCount EntranceDuration { get; init; }
    public bool FlipHorizontal { get; init; }
    public int ZOrder { get; init; }
}

public sealed record SceneRenderPlan
{
    public required int SceneIndex { get; init; }
    public required string SceneId { get; init; }
    public required Canvas Canvas { get; init; }
    public required FrameCount Duration { get; init; }

    public required string BackgroundRelativePath { get; init; }
    public AnimationSettings BackgroundAnimation { get; init; } = AnimationSettings.None;

    public IReadOnlyList<SpritePlan> Sprites { get; init; } = [];

    /// <summary>Null when the scene has no audio; the builder then supplies silence.</summary>
    public string? AudioRelativePath { get; init; }
    public double? AudioSliceStartSeconds { get; init; }
    public double? AudioSliceEndSeconds { get; init; }

    public string? SubtitleRelativePath { get; init; }
    public string? FontsDirRelativePath { get; init; }

    /// <summary>
    /// Background supersampling factor. zoompan quantizes its crop rectangle to whole
    /// source pixels, so a slow move on a 1:1 image visibly steps; rendering the motion
    /// at 2x and downscaling makes the step sub-pixel.
    /// </summary>
    public int KenBurnsSupersample { get; init; } = 2;

    /// <summary>Mouth-flap square wave rate in Hz (8 gives four visible flaps a second).</summary>
    public int MouthFlapHz { get; init; } = 8;

    public required string OutputRelativePath { get; init; }
    public EncoderProfile Encoder { get; init; } = EncoderProfile.Default;
}
