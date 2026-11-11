using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Scenes;

public enum SceneOrigin { Generated = 0, Manual = 1 }

public enum SceneStatus { Active = 0, Orphaned = 1 }

/// <summary>One character staged in one scene, with the window it is on screen for.</summary>
public sealed class CharacterPlacement
{
    public string CharacterId { get; set; } = string.Empty;

    /// <summary>Frame window the sprite is visible. Empty means the whole scene.</summary>
    public int PresenceStartFrame { get; set; }
    public int PresenceEndFrame { get; set; }

    public Anchor Anchor { get; set; } = Anchor.BottomCenter;
    public double HeightFraction { get; set; } = 0.70;
    public double OffsetXFraction { get; set; }
    public double OffsetYFraction { get; set; }
    public bool FlipHorizontal { get; set; }
    public int ZOrder { get; set; }

    public SpriteEntrance Entrance { get; set; } = SpriteEntrance.None;
    public int EntranceDurationFrames { get; set; }

    public FrameRange Presence => new(new FrameCount(PresenceStartFrame), new FrameCount(PresenceEndFrame));
}

/// <summary>
/// One spoken line. Carries BOTH clocks: Relative* positions it inside the rendered
/// scene (subtitles, mouth flap), while Source* records where it sat on the original
/// media timeline so audio can be sliced from exactly the right place.
/// </summary>
public sealed class DialogueLine
{
    public int Index { get; set; }
    public string? SpeakerLabel { get; set; }
    public string? SpeakerCharacterId { get; set; }
    public string Text { get; set; } = string.Empty;

    public int RelativeStartFrame { get; set; }
    public int RelativeEndFrame { get; set; }

    public double SourceStartSeconds { get; set; }
    public double SourceEndSeconds { get; set; }

    public FrameRange Timing => new(new FrameCount(RelativeStartFrame), new FrameCount(RelativeEndFrame));
}

/// <summary>
/// A mouth drawn into the scene's background picture, and when it talks. The renderer stretches the jaw below it in
/// time with those windows, so a character painted into a still looks like it is speaking without any sprite.
/// </summary>
/// <remarks>Positions are fractions of the picture, not the canvas, so they hold however the picture is fitted.</remarks>
public sealed class SceneMouth
{
    /// <summary>Who it is, for the person reading the project; the renderer does not use it.</summary>
    public string? Name { get; set; }

    /// <summary>The middle of the mouth, from the picture's left edge (0) to its right (1).</summary>
    public double X { get; set; }

    /// <summary>The middle of the mouth, from the picture's top (0) to its bottom (1).</summary>
    public double Y { get; set; }

    /// <summary>How wide the face is, as a fraction of the picture's width. Sizes the patch that moves.</summary>
    public double FaceWidth { get; set; }

    public List<MouthWindow> Windows { get; set; } = [];
}

/// <summary>A stretch of a scene, in frames from its start, in which a mouth talks.</summary>
public sealed class MouthWindow
{
    public int StartFrame { get; set; }
    public int EndFrame { get; set; }

    public FrameRange Range => new(new FrameCount(StartFrame), new FrameCount(EndFrame));
}

/// <summary>
/// The slice of source media that provides this scene's audio. Positions are on the
/// ORIGINAL clock and are never recomputed from scene durations - that is what keeps
/// audio from drifting as transitions shorten the output timeline.
/// </summary>
public sealed class SceneAudio
{
    public string? AssetId { get; set; }
    public double? SliceStartSeconds { get; set; }
    public double? SliceEndSeconds { get; set; }

    public bool IsSlice => AssetId is not null && SliceStartSeconds.HasValue && SliceEndSeconds.HasValue;
}

public sealed class Scene
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;

    /// <summary>Contiguous display number, recomputed on reorder.</summary>
    public int SceneNumber { get; set; }

    /// <summary>Sparse sort key, so a manually inserted scene keeps its slot across re-ingest.</summary>
    public double OrderKey { get; set; }

    public string? Title { get; set; }
    public string? Description { get; set; }

    /// <summary>Scene length in frames. The project's frame rate turns this into seconds.</summary>
    public int DurationFrames { get; set; }

    public string? BackgroundAssetId { get; set; }
    /// <summary>Mix the video background's sound with the scene audio.</summary>
    public bool BackgroundAudio { get; set; }
    public List<CharacterPlacement> Characters { get; set; } = [];
    public List<DialogueLine> Dialogue { get; set; } = [];

    /// <summary>Mouths drawn into a still background that talk while their windows play. Ignored over a clip.</summary>
    public List<SceneMouth> Mouths { get; set; } = [];

    public SceneAudio Audio { get; set; } = new();

    public AnimationSettings Animation { get; set; } = AnimationSettings.None;
    public SceneTransition TransitionToNext { get; set; } = SceneTransition.None;
    public int TransitionDurationFrames { get; set; }

    // --- provenance, so re-ingest is a diff instead of a destructive replace ---
    public SceneOrigin Origin { get; set; } = SceneOrigin.Generated;
    public SceneStatus Status { get; set; } = SceneStatus.Active;
    public string? SourceScriptLineageId { get; set; }
    public string? SourceSegmentKey { get; set; }

    /// <summary>Which fields a human changed. Re-ingest refreshes everything except these.</summary>
    public List<string> UserEditedFields { get; set; } = [];
    public List<string> LockedFields { get; set; } = [];
    public bool IsUserEdited => UserEditedFields.Count > 0;

    /// <summary>Optimistic-concurrency token, so a reconcile cannot clobber a concurrent edit.</summary>
    public string RevisionToken { get; set; } = Guid.NewGuid().ToString("n");

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public FrameCount Duration => new(DurationFrames);
    public TransitionSettings Transition =>
        new(TransitionToNext, new FrameCount(TransitionDurationFrames));
}
