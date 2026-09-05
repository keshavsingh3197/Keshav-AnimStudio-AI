namespace AnimStudio.Application.Scripts;

/// <summary>How inter-segment silence is resolved on the output timeline.</summary>
public enum GapPolicy
{
    /// <summary>Stretch each scene to meet the next, so the output stays contiguous.</summary>
    ExtendPrevious = 0,

    /// <summary>Drop the silence; the output is shorter than the source.</summary>
    Trim = 1
}

public sealed class SegmentationOptions
{
    public double MinSegmentSeconds { get; set; } = 1.5;
    public double TargetSegmentSeconds { get; set; } = 6.0;
    public double MaxSegmentSeconds { get; set; } = 12.0;

    /// <summary>A pause this long is a scene boundary even below the minimum length.</summary>
    public double HardPauseBreakSeconds { get; set; } = 2.5;
    public double PauseBreakSeconds { get; set; } = 1.2;

    /// <summary>Consecutive cues from one speaker closer than this are merged first.</summary>
    public double MergeSameSpeakerGapSeconds { get; set; } = 0.35;

    public bool SpeakerChangeBreaks { get; set; } = true;
    public bool SentenceBoundaryPreferred { get; set; } = true;

    public int MaxCharsPerSegment { get; set; } = 260;
    public int MaxDialogueLinesPerSegment { get; set; } = 6;

    public GapPolicy GapPolicy { get; set; } = GapPolicy.ExtendPrevious;

    /// <summary>Padding applied to the audio SLICE only, never written back to source timings.</summary>
    public double AudioSliceHeadPadSeconds { get; set; } = 0.05;
    public double AudioSliceTailPadSeconds { get; set; } = 0.15;

    public double MinSceneDurationSeconds { get; set; } = 0.5;

    /// <summary>Stable hash of these options, so re-segmentation is idempotent.</summary>
    public string ComputeHash()
    {
        var payload = string.Join('|',
            MinSegmentSeconds, TargetSegmentSeconds, MaxSegmentSeconds,
            HardPauseBreakSeconds, PauseBreakSeconds, MergeSameSpeakerGapSeconds,
            SpeakerChangeBreaks, SentenceBoundaryPreferred,
            MaxCharsPerSegment, MaxDialogueLinesPerSegment,
            GapPolicy, AudioSliceHeadPadSeconds, AudioSliceTailPadSeconds,
            MinSceneDurationSeconds);

        var bytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexStringLower(bytes)[..16];
    }
}
