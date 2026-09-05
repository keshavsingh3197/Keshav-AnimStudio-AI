using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Domain.Scripts;

public enum ScriptStatus { Draft = 0, Confirmed = 1, Superseded = 2 }

/// <summary>Why the segmenter ended a segment. Invaluable when tuning thresholds.</summary>
public enum SegmentBreakReason
{
    EndOfTranscript = 0,
    HardPause = 1,
    DurationCap = 2,
    SpeakerChange = 3,
    SoftPause = 4,
    SentenceBoundary = 5,
    CharacterCap = 6,
    LineCap = 7
}

public sealed class ScriptLine
{
    public string LineId { get; set; } = string.Empty;
    public string? SpeakerLabel { get; set; }

    /// <summary>Normalized speaker label. Every casting join uses this, never the raw label.</summary>
    public string SpeakerKey { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    // Original media clock.
    public TimeSpan SourceStart { get; set; }
    public TimeSpan SourceEnd { get; set; }

    // Offset within the owning segment.
    public TimeSpan RelativeStart { get; set; }
    public TimeSpan RelativeEnd { get; set; }

    public List<int> CueIndexes { get; set; } = [];
    public bool IsOverlapping { get; set; }
}

public sealed class ScriptSegment
{
    public string SegmentId { get; set; } = string.Empty;

    /// <summary>
    /// Content-derived key, stable across re-ingest. Deliberately excludes timing: a
    /// caption fix that shifts everything by 200ms must not orphan every scene and
    /// discard the user's edits.
    /// </summary>
    public string SegmentKey { get; set; } = string.Empty;

    public int Order { get; set; }

    // --- source clock: where this sat on the original media. Never recomputed. ---
    public TimeSpan SourceStart { get; set; }
    public TimeSpan SourceEnd { get; set; }

    // --- timeline clock: where it sits in the output after gap policy. ---
    public TimeSpan TimelineStart { get; set; }
    public TimeSpan TimelineEnd { get; set; }

    public string? DominantSpeakerLabel { get; set; }
    public string? DominantSpeakerKey { get; set; }
    public string? SuggestedTitle { get; set; }

    public List<ScriptLine> Lines { get; set; } = [];
    public List<int> SourceCueIndexes { get; set; } = [];
    public SegmentBreakReason BreakReason { get; set; }

    public TimeSpan SourceDuration => SourceEnd - SourceStart;
    public TimeSpan TimelineDuration => TimelineEnd - TimelineStart;
}

public sealed class Script
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string IngestId { get; set; } = string.Empty;

    /// <summary>Stable across versions. Scenes bind to the lineage, not to a version.</summary>
    public string ScriptLineageId { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public ScriptStatus Status { get; set; } = ScriptStatus.Draft;

    public TimingSource TimingSource { get; set; }
    public bool HasSourceTimings { get; set; }

    public string SegmentationOptionsHash { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string? CastingProfileId { get; set; }

    public List<ScriptSegment> Segments { get; set; } = [];
    public List<string> Warnings { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
