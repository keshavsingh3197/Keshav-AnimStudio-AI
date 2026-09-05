using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Ingest;

/// <summary>What the caller asked for. Validated before anything external is touched.</summary>
public sealed record CreateIngestCommand
{
    public required string ProjectId { get; init; }
    public required string UserId { get; init; }
    public TranscriptSourceKind Source { get; init; } = TranscriptSourceKind.PastedText;

    public string? Url { get; init; }
    public string? Text { get; init; }
    public string? SubtitleObjectKey { get; init; }
    public string? MediaAssetId { get; init; }

    public bool IncludeMedia { get; init; }
    public string? IdempotencyKey { get; init; }

    public RightsAttestationCommand? RightsAttestation { get; init; }
}

public sealed record RightsAttestationCommand
{
    public bool IsOwnerOrLicensed { get; init; }

    /// <summary>Must be one of RightsBasis's values - a closed set, not free text.</summary>
    public string BasisCode { get; init; } = string.Empty;

    public string? BasisNotes { get; init; }
    public string? AttestedByName { get; init; }
    public string AcceptedTermsVersion { get; init; } = string.Empty;
}

public sealed record IngestResult(
    string IngestId, string? ScriptId, int CueCount, int SegmentCount,
    TimingSource TimingSource, bool HasSourceTimings, IReadOnlyList<string> Warnings);
