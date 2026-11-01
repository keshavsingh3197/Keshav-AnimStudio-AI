namespace AnimStudio.Domain.Publishing;

/// <summary>
/// How a brand channel's videos go to YouTube: which connected YouTube channel they upload
/// to, and the details every upload starts with. The publish dialog pre-fills from these for
/// a project on this brand channel, so publishing is one click once a channel is set up.
/// </summary>
public sealed class ChannelPublishSettings
{
    /// <summary>The YouTube channel (<c>UC…</c>) uploads go to; it must be connected by whoever publishes.</summary>
    public string? YouTubeChannelId { get; set; }

    /// <summary>Shown in the console so the link is readable even when the publisher hasn't connected it.</summary>
    public string? YouTubeChannelTitle { get; set; }

    /// <summary>The channel's <c>@handle</c>, as YouTube last reported it.</summary>
    public string? YouTubeChannelHandle { get; set; }

    /// <summary>The channel's profile picture on YouTube (https only), as YouTube last reported it.</summary>
    public string? YouTubeThumbnailUrl { get; set; }

    public string Privacy { get; set; } = "public";
    public string CategoryId { get; set; } = "1";
    public bool MadeForKids { get; set; }
    public bool NotifySubscribers { get; set; } = true;

    /// <summary>Added to every video's own tags.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>Appended below every description: links, credits, the support message.</summary>
    public string? DescriptionFooter { get; set; }

    /// <summary>Posted as a comment on every upload once it is on YouTube; the dialog can change it per video.</summary>
    public string? FirstComment { get; set; }

    /// <summary>
    /// This channel's overrides for the names and links the AI-written details carry (credits,
    /// subscribe lines, hashtags). A blank field - or null for all of them - inherits the studio-wide
    /// <c>AiSettings.StudioBranding</c>, and the channel name and YouTube link fall back to this
    /// channel's YouTube identity. Read it through <c>YouTubeBrandKit.Effective</c>, never directly.
    /// </summary>
    public ChannelBranding? Branding { get; set; }

    /// <summary>A copy for a duplicated channel - minus the YouTube link, which belongs to the original.</summary>
    public ChannelPublishSettings CopyDefaults() => new()
    {
        Privacy = Privacy,
        CategoryId = CategoryId,
        MadeForKids = MadeForKids,
        NotifySubscribers = NotifySubscribers,
        Tags = [.. Tags],
        DescriptionFooter = DescriptionFooter,
        FirstComment = FirstComment,
        Branding = Branding?.Copy()
    };
}
