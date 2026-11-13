namespace AnimStudio.Domain.Publishing;

/// <summary>
/// The names and links a brand channel puts in the details AI writes for its videos: the
/// credits block, the subscribe lines, the pinned comment and the hashtags. Everything is
/// optional; a blank value is simply left out of what is written.
/// </summary>
public sealed class ChannelBranding
{
    /// <summary>The channel as viewers know it, e.g. "Omkar Shiv Bhakti".</summary>
    public string? ChannelName { get; set; }

    /// <summary>What the channel is about, shown after the name, e.g. "Devotional 3D Animations".</summary>
    public string? Tagline { get; set; }

    /// <summary>The channel's YouTube address (https only).</summary>
    public string? ChannelUrl { get; set; }

    /// <summary>The animation studio the videos are made in (https only).</summary>
    public string? StudioUrl { get; set; }

    /// <summary>The creator's own site or portfolio (https only).</summary>
    public string? CreatorUrl { get; set; }

    /// <summary>Who makes the videos, credited by name, e.g. "Keshav Singh".</summary>
    public string? CreatorName { get; set; }

    /// <summary>The animation tool credited, e.g. "AnimStudio".</summary>
    public string? EngineName { get; set; }

    /// <summary>The visuals credit line, e.g. "Omkar Shiv Bhakti 3D Devotional Animations".</summary>
    public string? VisualsCredit { get; set; }

    /// <summary>Hashtags always offered in a description, without the "#".</summary>
    public List<string> Hashtags { get; set; } = [];

    /// <summary>Search tags always offered with a video, on top of the channel's own tags.</summary>
    public List<string> Tags { get; set; } = [];

    public ChannelBranding Copy() => new()
    {
        ChannelName = ChannelName,
        Tagline = Tagline,
        ChannelUrl = ChannelUrl,
        StudioUrl = StudioUrl,
        CreatorUrl = CreatorUrl,
        CreatorName = CreatorName,
        EngineName = EngineName,
        VisualsCredit = VisualsCredit,
        Hashtags = [.. Hashtags],
        Tags = [.. Tags]
    };
}
