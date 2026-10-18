namespace AnimStudio.Domain.Publishing;

/// <summary>What YouTube last said about a video uploaded from the app.</summary>
public enum YouTubeVideoHealth
{
    /// <summary>Not checked yet, or the last check couldn't reach YouTube.</summary>
    Unknown = 0,

    /// <summary>Uploaded; YouTube is still processing it.</summary>
    Processing = 1,

    /// <summary>Processed and playable.</summary>
    Ok = 2,

    /// <summary>Rejected, failed processing, or otherwise needs the owner to look at it.</summary>
    Issue = 3,

    /// <summary>YouTube no longer has the video: deleted on YouTube or removed.</summary>
    Removed = 4
}

/// <summary>
/// A render that was uploaded to YouTube from the app, kept so the link outlives the
/// in-memory upload list and the render page can jump straight to the video.
/// <para>
/// One record per uploaded video. The same render published twice (two channels, or
/// again after an edit) is two records.
/// </para>
/// </summary>
public sealed class YouTubePublication
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;

    public string ChannelId { get; set; } = string.Empty;
    public string ChannelTitle { get; set; } = string.Empty;

    /// <summary>YouTube's 11-character video id.</summary>
    public string VideoId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    /// <summary>The visibility it was uploaded with: public, unlisted or private.</summary>
    public string Privacy { get; set; } = string.Empty;

    /// <summary>YouTube's category id; "10" (Music) lists it on YouTube Music. Null on records from before it was kept.</summary>
    public string? CategoryId { get; set; }

    /// <summary>Other app-published videos linked from this one's description.</summary>
    public List<string> RelatedVideoIds { get; set; } = [];

    public DateTime PublishedAt { get; set; }

    // --- health, refreshed from videos.list ---
    public YouTubeVideoHealth Health { get; set; } = YouTubeVideoHealth.Unknown;
    public string? UploadStatus { get; set; }
    public string? PrivacyStatus { get; set; }

    /// <summary>Short machine code for the problem, e.g. "rejected-copyright".</summary>
    public string? IssueCode { get; set; }

    /// <summary>User-safe explanation of the problem. Never raw API output.</summary>
    public string? IssueMessage { get; set; }

    public string? ThumbnailUrl { get; set; }
    public DateTime? LastCheckedAt { get; set; }
}
