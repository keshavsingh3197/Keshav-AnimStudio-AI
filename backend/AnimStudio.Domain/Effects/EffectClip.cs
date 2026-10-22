using AnimStudio.Domain.Assets;

namespace AnimStudio.Domain.Effects;

/// <summary>What an effect is for; drives the library's chips and where the editor places it.</summary>
public enum EffectCategory
{
    Other = 0,

    /// <summary>Subscribe / like / bell button animations.</summary>
    Subscribe = 1,

    /// <summary>Stingers and transitions played over a cut.</summary>
    Transition = 2,

    /// <summary>Played at the very end of a video.</summary>
    EndScreen = 3,

    /// <summary>Name and title bars across the lower part of the frame.</summary>
    LowerThird = 4,

    Intro = 5,

    /// <summary>Whooshes, dings, pops - audio only.</summary>
    SoundEffect = 6,

    /// <summary>Light leaks, dust, frames and other full-frame looks.</summary>
    Overlay = 7,

    /// <summary>Footage shot on a green (or blue) screen, keyed out over the video.</summary>
    GreenScreen = 8,

    LogoReveal = 9
}

/// <summary>
/// A short clip, still or sound in the user's own effects library: uploaded once and dropped
/// into any project. It belongs to the user, not to a project, so it survives every project
/// it was used in; using it copies the bytes into that project as an ordinary asset, which
/// keeps renders reading only their own project's files.
/// </summary>
public sealed class EffectClip
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public EffectCategory Category { get; set; }

    /// <summary>Image, Audio or Video - from the file's bytes, never the client's claim.</summary>
    public AssetKind Kind { get; set; }

    /// <summary>Lower-case labels the owner filters by.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>Server-composed object-store key. Never contains client input.</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>A small JPEG for video effects; null for stills (the file is its own thumbnail) and sounds.</summary>
    public string? ThumbnailKey { get; set; }

    /// <summary>The sniffed type.</summary>
    public string ContentType { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    /// <summary>Width, height, length and alpha, read from the file when it was added.</summary>
    public MediaProbe Probe { get; set; } = new();

    /// <summary>The owner says it is shot on a green screen, so it is keyed out when placed.</summary>
    public bool IsGreenScreen { get; set; }

    public bool Favorite { get; set; }

    /// <summary>How many times it has been added to a project; the library sorts by it.</summary>
    public int UseCount { get; set; }

    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// The project asset this effect was saved from, when it was promoted from a project
    /// rather than uploaded - so saving the same file twice finds the first copy.
    /// </summary>
    public string? SourceAssetId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
