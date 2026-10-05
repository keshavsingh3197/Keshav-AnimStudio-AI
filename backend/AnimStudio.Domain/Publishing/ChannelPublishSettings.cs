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

    public string Privacy { get; set; } = "public";
    public string CategoryId { get; set; } = "1";
    public bool MadeForKids { get; set; }
    public bool NotifySubscribers { get; set; } = true;

    /// <summary>Added to every video's own tags.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>Appended below every description: links, credits, the support message.</summary>
    public string? DescriptionFooter { get; set; }

    /// <summary>A copy for a duplicated channel - minus the YouTube link, which belongs to the original.</summary>
    public ChannelPublishSettings CopyDefaults() => new()
    {
        Privacy = Privacy,
        CategoryId = CategoryId,
        MadeForKids = MadeForKids,
        NotifySubscribers = NotifySubscribers,
        Tags = [.. Tags],
        DescriptionFooter = DescriptionFooter
    };
}
