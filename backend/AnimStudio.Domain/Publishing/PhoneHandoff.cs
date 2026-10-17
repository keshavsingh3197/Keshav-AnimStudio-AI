namespace AnimStudio.Domain.Publishing;

public enum PhoneHandoffState
{
    /// <summary>The video is being copied to Drive.</summary>
    Sending,

    /// <summary>In Drive; waiting for the user to upload it from the YouTube app.</summary>
    WaitingForPhone,

    /// <summary>The phone upload was found and the prepared details are on it.</summary>
    Applied,

    Failed,
    Cancelled,

    /// <summary>No matching upload turned up in time; the details can still be applied by hand.</summary>
    Expired
}

/// <summary>
/// A video sent to the user's Drive to be uploaded from the YouTube app - where a Shorts sound
/// can be added under YouTube's own licence - with the title, description and settings
/// prepared in AnimStudio, applied to that upload once it appears on the channel.
/// <para>
/// The details are stored already validated and normalized, exactly as they will be sent to
/// <c>videos.update</c>; nothing from the phone upload is trusted beyond its video id.
/// </para>
/// </summary>
public sealed class PhoneHandoff
{
    /// <summary>App-assigned GUID ("N" format).</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;

    /// <summary>The connected channel the phone upload is expected on.</summary>
    public string ChannelId { get; set; } = string.Empty;
    public string ChannelTitle { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string CategoryId { get; set; } = "1";
    public string Privacy { get; set; } = "public";
    public bool MadeForKids { get; set; }
    public string? FirstComment { get; set; }
    public List<string> RelatedVideoIds { get; set; } = [];

    /// <summary>The render's length, used to tell the phone upload apart from others.</summary>
    public double? DurationSeconds { get; set; }

    /// <summary>The video's own sound was removed before sending, for a Shorts sound to replace it.</summary>
    public bool Muted { get; set; }

    public string DriveFolderName { get; set; } = string.Empty;
    public string? DriveFileId { get; set; }
    public string? DriveFileName { get; set; }
    public long BytesSent { get; set; }
    public long TotalBytes { get; set; }

    public PhoneHandoffState State { get; set; } = PhoneHandoffState.Sending;
    public string? ErrorCode { get; set; }
    public string? Error { get; set; }

    /// <summary>Something the user should know about an applied handoff, e.g. the first comment wasn't posted.</summary>
    public string? Warning { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? LastCheckedAt { get; set; }

    /// <summary>The phone upload the details were applied to.</summary>
    public string? VideoId { get; set; }
    public DateTime? AppliedAt { get; set; }
    public string? CommentId { get; set; }

    public bool IsFinished => State is PhoneHandoffState.Applied or PhoneHandoffState.Failed or PhoneHandoffState.Cancelled;
}
