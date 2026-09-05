namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>Thresholds for parsing and normalization. Bound from configuration, never constants.</summary>
public sealed class ParsingOptions
{
    /// <summary>Minimum length given to a cue whose end time is missing or malformed.</summary>
    public int MinCueDurationMs { get; set; } = 300;

    /// <summary>Overlap up to this size is treated as a rounding artefact and clamped away.</summary>
    public int OverlapToleranceMs { get; set; } = 250;

    /// <summary>Pause between words that ends a rebuilt auto-caption cue.</summary>
    public int WordGapBreakMs { get; set; } = 700;

    public int MaxCueChars { get; set; } = 200;
    public int MaxCueCount { get; set; } = 20_000;
    public int MaxTranscriptCharacters { get; set; } = 400_000;

    public bool DropNonSpeechCues { get; set; } = true;

    // Reading-rate model used when a pasted transcript has no timings at all.
    public double PlainTextWordsPerMinute { get; set; } = 150;
    public double PlainTextPerLinePaddingSeconds { get; set; } = 0.4;
    public double PlainTextMinSegmentSeconds { get; set; } = 2.0;
}
