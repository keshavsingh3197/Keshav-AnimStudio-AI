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

    /// <summary>
    /// What the render is called on screen and in its download filename. Set from the
    /// configurable template when queued and renamed by the user once it has finished.
    /// Null on renders from before names existed.
    /// </summary>
    public string? Name { get; set; }

    public RenderJobKind Kind { get; set; } = RenderJobKind.Project;

    /// <summary>
    /// Set only on a <see cref="RenderJobKind.ClipMerge"/> job. The running order is stored
    /// ON the job rather than read back from the project when a worker picks it up, so a
    /// stitch renders the order that was submitted even if the clip list is edited while
    /// the job sits in the queue.
    /// </summary>
    public ClipMergeSpec? ClipMerge { get; set; }

    /// <summary>
    /// The batch a render was queued in - every short of one Auto Shorts run shares it - so
    /// the batch can be found again after the dialog that started it is gone. Null on
    /// renders queued one at a time.
    /// </summary>
    public RenderJobBatch? Batch { get; set; }

    public RenderJobStatus Status { get; set; } = RenderJobStatus.Pending;
    public int Progress { get; set; }
    public string? Message { get; set; }
    public RenderStage CurrentStage { get; set; } = RenderStage.None;

    /// <summary>Renderable items: scenes on a project render, clips on a stitch.</summary>
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
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? TargetFormat { get; set; }

    public string? ErrorCode { get; set; }

    /// <summary>User-safe message only. ffmpeg stderr goes to the log artifact, never here.</summary>
    public string? ErrorMessage { get; set; }
    public List<string> Warnings { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    /// <summary>Detailed pipeline performance diagnostics captured upon render completion.</summary>
    public RenderDiagnostics? Diagnostics { get; set; }

    /// <summary>
    /// Where each clip, sound and overlay landed in the delivered file. Set by a completed
    /// clip export; null on project renders and on exports from before it was recorded.
    /// </summary>
    public ExportTimeline? Timeline { get; set; }

    public bool IsTerminal => Status is RenderJobStatus.Completed
        or RenderJobStatus.Failed
        or RenderJobStatus.Cancelled
        or RenderJobStatus.CompletedWithWarnings;
}

/// <summary>Where a render sits in the batch it was queued with.</summary>
public sealed class RenderJobBatch
{
    /// <summary>App-assigned GUID ("N" format), shared by every render of the batch.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>What the batch is called on screen; the shorts' own names number from it.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>0-based position of this render in the batch.</summary>
    public int Index { get; set; }

    /// <summary>How many renders the batch queued.</summary>
    public int Count { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>How the picks were shared out ("Spread", "AllInEach", "FitLength").</summary>
    public string? Layout { get; set; }

    /// <summary>The style this short was cut in ("Viral", "Cinematic", ...). Null on renders from before styles were recorded.</summary>
    public string? Style { get; set; }

    /// <summary>The library files the batch was cut from, so "used" can be told from "picked but left over".</summary>
    public List<string> SourceAssetIds { get; set; } = [];
}

public sealed class RenderDiagnostics
{
    public double TotalSeconds { get; set; }
    public double PreparingSeconds { get; set; }
    public double EncodingSeconds { get; set; }
    public double MergingSeconds { get; set; }
    public double PublishingSeconds { get; set; }
    public int ItemsCount { get; set; }
    public double? OutputDurationSeconds { get; set; }
    public string? SpeedFactor { get; set; }
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// The GPU or CPU encoder used for clip conformance: "h264_nvenc", "h264_qsv",
    /// "h264_videotoolbox", or "CPU" for libx264. Displayed in the diagnostics UI.
    /// </summary>
    public string? HardwareEncoder { get; set; }
}

