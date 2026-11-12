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

/// <summary>A mouth in the background still, as fractions of the picture, and when it talks.</summary>
public sealed record MouthPlan
{
    public required double X { get; init; }
    public required double Y { get; init; }
    public required double FaceWidth { get; init; }
    public IReadOnlyList<FrameRange> SpeakingWindows { get; init; } = [];

    /// <summary>
    /// Where the same mouth is in the open-mouth picture, as fractions of that picture; null means the same place as
    /// in the background.
    /// </summary>
    public double? OpenX { get; init; }
    public double? OpenY { get; init; }
    public double? OpenFaceWidth { get; init; }
}

/// <summary>
/// The background still with its mouths open: the size in pixels of the still it is laid over, and its own size. Each
/// mouth is cut from where it is in this picture and scaled to that face's size in the still, so an image model that
/// redrew it at another size or framing still lines up mouth by mouth.
/// </summary>
public sealed record TalkingBackgroundPlan(string RelativePath, int Width, int Height, int OpenWidth, int OpenHeight);

public sealed record SceneRenderPlan
{
    public required int SceneIndex { get; init; }
    public required string SceneId { get; init; }
    public required Canvas Canvas { get; init; }
    public required FrameCount Duration { get; init; }

    public required string BackgroundRelativePath { get; init; }
    /// <summary>The background is a moving clip (looped to the scene), not a still.</summary>
    public bool BackgroundIsVideo { get; init; }
    public bool BackgroundHasAudio { get; init; }
    public AnimationSettings BackgroundAnimation { get; init; } = AnimationSettings.None;

    public IReadOnlyList<SpritePlan> Sprites { get; init; } = [];

    /// <summary>Mouths drawn into the background still that talk; always empty over a clip, which moves already.</summary>
    public IReadOnlyList<MouthPlan> Mouths { get; init; } = [];

    /// <summary>
    /// The still with the <see cref="Mouths"/> open, blended in around each mouth while it talks; null keeps the faces
    /// still, which is what a still with no open-mouth version must do.
    /// </summary>
    public TalkingBackgroundPlan? TalkingBackground { get; init; }

    /// <summary>
    /// The scene has an open-mouth picture that could not be used (not approved, of unknown size, or framed differently
    /// with its mouths not found in it), so its faces stay still; said in the render's warnings rather than silently.
    /// </summary>
    public bool TalkingBackgroundUnusable { get; init; }

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
