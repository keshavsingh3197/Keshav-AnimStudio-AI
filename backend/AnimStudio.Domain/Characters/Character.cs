using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Characters;

public sealed class CharacterAppearance
{
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Hair { get; set; }
    public string? Clothes { get; set; }
    public string? AdditionalDetails { get; set; }
}

/// <summary>
/// Sprite set for one character. Two images are enough for the mouth-flap talking
/// effect; a character with only a closed-mouth sprite still renders, just without
/// the flap.
/// </summary>
public sealed class CharacterSprites
{
    public string? ClosedMouthAssetId { get; set; }
    public string? OpenMouthAssetId { get; set; }

    public bool CanFlap => !string.IsNullOrEmpty(ClosedMouthAssetId)
                           && !string.IsNullOrEmpty(OpenMouthAssetId);
}

public sealed class CharacterStaging
{
    public Anchor Anchor { get; set; } = Anchor.BottomCenter;

    /// <summary>Sprite height as a fraction of canvas height, so staging is resolution-independent.</summary>
    public double HeightFraction { get; set; } = 0.70;
    public double OffsetXFraction { get; set; }
    public double OffsetYFraction { get; set; }
    public bool FlipHorizontal { get; set; }
    public int ZOrder { get; set; }
}

public sealed class Character
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>
    /// Alternate names this character answers to when casting transcript speakers
    /// (nicknames, full names, transliterations).
    /// </summary>
    public List<string> Aliases { get; set; } = [];

    public CharacterAppearance Appearance { get; set; } = new();
    public CharacterSprites Sprites { get; set; } = new();
    public CharacterStaging Staging { get; set; } = new();

    /// <summary>A spriteless character used for unattributed lines; renders as subtitles only.</summary>
    public bool IsNarrator { get; set; }
    public bool IsAutoCreated { get; set; }

    public string? SubtitleColorHex { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
