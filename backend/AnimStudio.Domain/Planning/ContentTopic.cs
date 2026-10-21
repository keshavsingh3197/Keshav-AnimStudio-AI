namespace AnimStudio.Domain.Planning;

/// <summary>
/// A running theme the owner publishes on, e.g. "Monday motivation" every Monday at 18:00.
/// The cadence is what turns a topic into calendar slots: every matching day within
/// <see cref="PlanAheadDays"/> gets a planned post, so the work is visible before it is due.
/// </summary>
public sealed class ContentTopic
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>"#rrggbb", for the calendar chip.</summary>
    public string Color { get; set; } = "#6c8cff";

    /// <summary>The channel this topic goes out on; needed to link and schedule videos on YouTube.</summary>
    public string? ChannelId { get; set; }
    public string? ChannelTitle { get; set; }

    /// <summary>Days a post goes out. Empty means no automatic slots: posts are added by hand.</summary>
    public List<DayOfWeek> Days { get; set; } = [];

    /// <summary>Local time of day the post goes live, "HH:mm" in <see cref="TimeZone"/>.</summary>
    public string PublishTime { get; set; } = "18:00";

    /// <summary>IANA time zone id, e.g. "Asia/Kolkata".</summary>
    public string TimeZone { get; set; } = "UTC";

    /// <summary>How many days before going live a post should be ready, so there is never a same-day rush.</summary>
    public int LeadDays { get; set; } = 3;

    /// <summary>How far ahead slots are created.</summary>
    public int PlanAheadDays { get; set; } = 21;

    /// <summary>
    /// When a linked video sits on YouTube as private with no (or a different) scheduled time,
    /// put the planned time on it automatically. Off means the app only warns.
    /// </summary>
    public bool AutoSchedule { get; set; } = true;

    /// <summary>Look through the channel's new uploads (from the phone, too) and link the one that matches a planned post.</summary>
    public bool AutoLinkUploads { get; set; } = true;

    /// <summary>Hashtags or tags the owner reuses on this topic; shown for copying on mobile.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>Default checklist copied onto every new post of this topic.</summary>
    public List<string> Checklist { get; set; } = [];

    /// <summary>Slot keys of automatic posts the owner deleted, so the planner doesn't bring them back.</summary>
    public List<string> DismissedSlots { get; set; } = [];

    public bool Archived { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
