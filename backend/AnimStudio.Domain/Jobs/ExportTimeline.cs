namespace AnimStudio.Domain.Jobs;

/// <summary>
/// Where everything in a finished export actually sits: each clip, transition, sound,
/// music track and overlay, timed against the delivered file.
/// <para>
/// Recorded by the render from MEASURED clip lengths, not the editor's requested ones -
/// a trim, a freeze-frame lead-in or a shortened transition all move what comes after,
/// and chapters copied into a YouTube description are only worth anything if they land
/// on the frame the viewer sees.
/// </para>
/// </summary>
public sealed class ExportTimeline
{
    public double FrameRate { get; set; }
    public double DurationSeconds { get; set; }
    public List<ExportTimelineEntry> Entries { get; set; } = [];
}

/// <summary>One item on the finished timeline. Times are seconds into the delivered file.</summary>
public sealed class ExportTimelineEntry
{
    /// <summary>One of the <see cref="ExportTimelineKinds"/> values.</summary>
    public string Kind { get; set; } = ExportTimelineKinds.Clip;

    /// <summary>The editor track it came from: V1, A1, IMG1, TXT1, or BED for the music bed.</summary>
    public string Track { get; set; } = "V1";

    /// <summary>1-based running order for clips, and for the transition that follows clip N.</summary>
    public int? ClipNumber { get; set; }

    public string? AssetId { get; set; }
    public string Label { get; set; } = string.Empty;

    public double StartSeconds { get; set; }
    public double EndSeconds { get; set; }

    /// <summary>Where in the source file this item's used portion begins and ends, when trimmed.</summary>
    public double? SourceInSeconds { get; set; }
    public double? SourceOutSeconds { get; set; }

    /// <summary>The transition's name, for <see cref="ExportTimelineKinds.Transition"/> entries.</summary>
    public string? Transition { get; set; }

    /// <summary>Attribution from the asset's provenance - what a licence typically asks you to credit.</summary>
    public string? Credit { get; set; }
    public string? SourceUrl { get; set; }
}

public static class ExportTimelineKinds
{
    public const string Clip = "clip";
    public const string Image = "image";
    public const string Transition = "transition";
    public const string ClipSound = "clip-sound";
    public const string MusicBed = "music-bed";
    public const string Music = "music";
    public const string Audio = "audio";
    public const string Overlay = "overlay";
    public const string Text = "text";
    public const string EndCard = "end-card";
}
