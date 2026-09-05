using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Scripts;

/// <summary>
/// Consecutive cues from one speaker, merged before segmentation.
/// <para>
/// This pre-merge is what prevents the "one scene per two-second caption fragment"
/// failure mode. Member cues are retained, never discarded - only grouped.
/// </para>
/// </summary>
internal sealed class CueGroup
{
    public required string SpeakerKey { get; init; }
    public string? SpeakerLabel { get; init; }
    public List<TranscriptCue> Cues { get; } = [];

    public TimeSpan Start => Cues[0].Start;
    public TimeSpan End => Cues[^1].End;
    public TimeSpan Duration => End - Start;

    public string Text => string.Join(' ', Cues.Select(c => c.Text));
    public bool IsOverlapping => Cues.Any(c => c.IsOverlapping);
}
