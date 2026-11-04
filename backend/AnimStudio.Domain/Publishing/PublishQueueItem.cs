namespace AnimStudio.Domain.Publishing;

/// <summary>Where a queued video is on its way to YouTube.</summary>
public enum PublishQueueState
{
    /// <summary>Has a time; the scheduler starts the upload at <see cref="PublishQueueItem.DueAt"/>.</summary>
    Waiting = 0,

    /// <summary>On the board but paused, or not given a time yet. Never pushed until resumed.</summary>
    Held = 1,

    /// <summary>Handed to the upload manager; <see cref="PublishQueueItem.UploadId"/> tracks it.</summary>
    Uploading = 2,

    /// <summary>On YouTube. <see cref="PublishQueueItem.VideoId"/> is set.</summary>
    Published = 3,

    /// <summary>Gave up after the retries, or hit a problem only the owner can fix.</summary>
    Failed = 4,

    /// <summary>Stopped by the owner. Nothing more happens to it.</summary>
    Cancelled = 5
}

/// <summary>How the scheduled time is honoured.</summary>
public enum PublishQueueMode
{
    /// <summary>
    /// Upload ahead of time as private with YouTube's own publishAt, so the video is processed
    /// and YouTube makes it public exactly on time. Only for a public video.
    /// </summary>
    ReleaseOnYouTube = 0,

    /// <summary>Start the upload at the scheduled time with the chosen visibility.</summary>
    UploadAtTime = 1
}

/// <summary>
/// A finished render waiting on the publishing board to go to YouTube at a set time. The
/// details are kept as the user wrote them and checked again when the upload starts, since a
/// channel can be disconnected or a render deleted while the item waits.
/// <para>
/// <see cref="Version"/> is bumped on every save; a save from a stale copy is refused, so the
/// scheduler claiming an item and its owner editing it can never overwrite each other.
/// </para>
/// </summary>
public sealed class PublishQueueItem
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public int Version { get; set; }

    // --- the video ---
    public string JobId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string? ProjectName { get; set; }
    public double? DurationSeconds { get; set; }
    public bool IsVertical { get; set; }

    // --- where and how it goes ---
    public string ChannelId { get; set; } = string.Empty;
    public string ChannelTitle { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string CategoryId { get; set; } = "1";

    /// <summary>The visibility once it is out: public, unlisted or private.</summary>
    public string Privacy { get; set; } = "public";

    public bool MadeForKids { get; set; }
    public bool NotifySubscribers { get; set; } = true;
    public string? FirstComment { get; set; }
    public List<string> RelatedVideoIds { get; set; } = [];

    /// <summary>A calendar post of the owner's to link the finished video to.</summary>
    public string? PlanItemId { get; set; }

    /// <summary>A frame of the video to use as the thumbnail, grabbed when the upload starts.</summary>
    public double? ThumbnailFrameAt { get; set; }

    /// <summary>Server-composed object-store key of an uploaded thumbnail, already re-encoded.</summary>
    public string? ThumbnailKey { get; set; }

    /// <summary>The owner's own note for the board. Never sent to YouTube.</summary>
    public string? Notes { get; set; }

    // --- when ---
    /// <summary>When the video should be out on YouTube (UTC). Null while held without a time.</summary>
    public DateTime? ScheduledAt { get; set; }

    public PublishQueueMode Mode { get; set; } = PublishQueueMode.ReleaseOnYouTube;

    /// <summary>When the scheduler starts the upload (UTC): the scheduled time, or earlier for <see cref="PublishQueueMode.ReleaseOnYouTube"/>.</summary>
    public DateTime? DueAt { get; set; }

    // --- progress ---
    public PublishQueueState State { get; set; } = PublishQueueState.Waiting;

    /// <summary>Upload attempts started; transient failures are retried until the limit.</summary>
    public int Attempts { get; set; }

    public string? ErrorCode { get; set; }

    /// <summary>User-safe explanation of the last failure. Never raw API output.</summary>
    public string? Error { get; set; }

    public string? Warning { get; set; }
    public string? UploadId { get; set; }
    public string? VideoId { get; set; }
    public string? PublicationId { get; set; }

    /// <summary>Set when YouTube was told to make the video public at <see cref="ScheduledAt"/>.</summary>
    public DateTime? YouTubePublishAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}
