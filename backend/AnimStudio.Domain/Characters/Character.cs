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

/// <summary>
/// How a performer's own voice is transformed to speak as this character. The browser
/// applies it live while recording (pitch shift, tone, grit, ring modulation, space), so
/// every number here is a plain effect amount rather than a provider-specific voice id.
/// </summary>
public sealed class CharacterVoice
{
    public const double MaxPitchSemitones = 12;
    public const double MaxToneDecibels = 12;
    public const double MinRobotHertz = 20;
    public const double MaxRobotHertz = 400;

    /// <summary>The preset it started from, for the picker; "custom" once edited by hand.</summary>
    public string? Preset { get; set; }

    /// <summary>-12 (an octave down) to +12 (an octave up).</summary>
    public double PitchSemitones { get; set; }

    /// <summary>Low-shelf boost or cut, dB.</summary>
    public double BassDecibels { get; set; }

    /// <summary>High-shelf boost or cut, dB.</summary>
    public double TrebleDecibels { get; set; }

    /// <summary>0-1: gravel and growl from soft saturation.</summary>
    public double Drive { get; set; }

    /// <summary>0-1: how much ring modulation (the metallic robot sound).</summary>
    public double Robot { get; set; }

    public double RobotHertz { get; set; } = 60;

    /// <summary>A narrow walkie-talkie band.</summary>
    public bool Radio { get; set; }

    /// <summary>0-1: a slapback echo.</summary>
    public double Echo { get; set; }

    /// <summary>0-1: a large hall, for divine or distant voices.</summary>
    public double Reverb { get; set; }
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

    /// <summary>Null: the performer's own, unchanged voice.</summary>
    public CharacterVoice? Voice { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
