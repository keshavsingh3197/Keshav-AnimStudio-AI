namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>A cue as it appeared in the file, before normalization.</summary>
public sealed record RawCue(int SourceIndex, TimeSpan Start, TimeSpan End, string RawText)
{
    public string? Speaker { get; init; }
}
