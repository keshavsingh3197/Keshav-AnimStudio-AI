namespace AnimStudio.Domain.Transcripts;

public enum TranscriptSourceKind
{
    PastedText = 1,
    SubtitleFile = 2,
    YouTubeCaptions = 3,
    MediaFile = 4
}

/// <summary>
/// Whether cue timings came from the source or were estimated from a reading rate.
/// Synthesized timings cannot be used to slice audio - they do not correspond to
/// anything real - so this flag gates audio slicing for the whole script.
/// </summary>
public enum TimingSource { Real = 0, Synthesized = 1 }

public enum SpeakerDetectionTier
{
    None = 0,
    VoiceTag = 1,
    Prefix = 2,
    ProperNoun = 3,
    Unlabeled = 4
}

/// <summary>One caption cue, normalized. Raw* preserve exactly what the file said.</summary>
public sealed record TranscriptCue
{
    public required int Index { get; init; }
    public required TimeSpan Start { get; init; }
    public required TimeSpan End { get; init; }
    public required string Text { get; init; }
    public string? SpeakerLabel { get; init; }

    /// <summary>Position in the original file, retained for audit after normalization reorders.</summary>
    public int SourceIndex { get; init; }
    public TimeSpan RawStart { get; init; }
    public TimeSpan RawEnd { get; init; }

    public bool IsNonSpeech { get; init; }
    public bool IsOverlapping { get; init; }
    public SpeakerDetectionTier SpeakerTier { get; init; }

    public TimeSpan Duration => End - Start;
}
