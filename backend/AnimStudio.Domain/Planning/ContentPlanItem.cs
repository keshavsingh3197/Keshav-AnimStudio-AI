namespace AnimStudio.Domain.Planning;

/// <summary>
/// Where a planned post is. The first three are set by the owner; <see cref="Scheduled"/>
/// and <see cref="Published"/> come from YouTube once a video is linked. SQL stores the
/// number, so new states are appended.
/// </summary>
public enum ContentPlanStatus
{
    Idea = 0,
    InProgress = 1,
    Ready = 2,

    /// <summary>On YouTube as private with a scheduled publish time.</summary>
    Scheduled = 3,

    /// <summary>Public on YouTube.</summary>
    Published = 4,

    /// <summary>Not going out; kept so the slot isn't planned again.</summary>
    Skipped = 5
}

public sealed class ContentChecklistItem
{
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; }
}

/// <summary>What YouTube last said about the linked video.</summary>
public sealed class ContentYouTubeState
{
    public string Title { get; set; } = string.Empty;

    /// <summary>public, unlisted or private.</summary>
    public string? Privacy { get; set; }

    /// <summary>The scheduled go-live time on YouTube (private videos only).</summary>
    public DateTime? ScheduledAt { get; set; }

    /// <summary>When YouTube says it was uploaded / went public.</summary>
    public DateTime? PublishedAt { get; set; }

    public string? ThumbnailUrl { get; set; }

    /// <summary>False once YouTube no longer shows the video.</summary>
    public bool Exists { get; set; } = true;

    public DateTime CheckedAt { get; set; }
}

/// <summary>One post on the calendar: what goes out, when, and how far along it is.</summary>
public sealed class ContentPlanItem
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string TopicId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }

    /// <summary>When it should go live on YouTube, UTC.</summary>
    public DateTime PublishAt { get; set; }

    public ContentPlanStatus Status { get; set; } = ContentPlanStatus.Idea;

    /// <summary>"{topicId}:{yyyy-MM-dd}" for posts the planner created from the topic's cadence; null for hand-made ones.</summary>
    public string? SlotKey { get; set; }

    public List<ContentChecklistItem> Checklist { get; set; } = [];

    // --- where the work lives
    public string? ProjectId { get; set; }

    /// <summary>A Drive (or any https) link to the finished file, for uploading from the phone.</summary>
    public string? FileLink { get; set; }

    // --- the YouTube video it became
    public string? ChannelId { get; set; }
    public string? VideoId { get; set; }

    /// <summary>True when the planner linked the video by itself, so the owner can double-check.</summary>
    public bool VideoAutoLinked { get; set; }

    public ContentYouTubeState? YouTube { get; set; }

    /// <summary>The last scheduling problem the sync hit (user-safe text), cleared when it goes away.</summary>
    public string? SyncMessage { get; set; }

    public DateTime? ReadyAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
