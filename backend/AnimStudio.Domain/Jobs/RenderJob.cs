using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Jobs;

public enum RenderJobStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4,
    CompletedWithWarnings = 5
}

/// <summary>
/// A render request, claimed by a background worker. The lease fields are what make
/// this safe AND live: an atomic claim stops two workers taking the same job, and lease
/// EXPIRY is what lets a crashed worker's job be picked up again instead of sitting in
/// Processing forever.
/// </summary>
public sealed class RenderJob
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    public RenderJobStatus Status { get; set; } = RenderJobStatus.Pending;
    public int Progress { get; set; }
    public string? Message { get; set; }
    public RenderStage CurrentStage { get; set; } = RenderStage.None;

    public int ScenesTotal { get; set; }
    public int ScenesDone { get; set; }

    // --- lease / heartbeat ---
    public string? LeaseOwner { get; set; }
    public DateTime? LeaseExpiresAt { get; set; }
    public DateTime? HeartbeatAt { get; set; }
    public int Attempts { get; set; }

    /// <summary>Set by the cancel endpoint and read back by the throttled progress flush.</summary>
    public bool CancelRequested { get; set; }

    /// <summary>Object-store key, not a filesystem path.</summary>
    public string? OutputStorageKey { get; set; }
    public string? LogStorageKey { get; set; }
    public long? OutputSizeBytes { get; set; }
    public int? OutputDurationFrames { get; set; }

    public string? ErrorCode { get; set; }

    /// <summary>User-safe message only. ffmpeg stderr goes to the log artifact, never here.</summary>
    public string? ErrorMessage { get; set; }
    public List<string> Warnings { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public bool IsTerminal => Status is RenderJobStatus.Completed
        or RenderJobStatus.Failed
        or RenderJobStatus.Cancelled
        or RenderJobStatus.CompletedWithWarnings;
}
