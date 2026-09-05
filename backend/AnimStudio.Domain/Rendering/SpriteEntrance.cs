namespace AnimStudio.Domain.Rendering;

/// <summary>
/// How a character sprite arrives on stage. Slides belong here (and on
/// SceneTransition) rather than on the background: sliding a full-bleed
/// background only slides black bars into frame.
/// </summary>
public enum SpriteEntrance
{
    None = 0,
    FadeIn = 1,
    SlideFromLeft = 2,
    SlideFromRight = 3,
    SlideFromBottom = 4
}

/// <summary>Where a sprite is pinned before its pixel offsets are applied.</summary>
public enum Anchor
{
    BottomLeft = 0,
    BottomCenter = 1,
    BottomRight = 2,
    Center = 3,
    CenterLeft = 4,
    CenterRight = 5
}
