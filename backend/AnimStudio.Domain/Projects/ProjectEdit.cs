namespace AnimStudio.Domain.Projects;

/// <summary>The shape a cut is made for. Decides the editor's preview and the export size.</summary>
public enum EditFormat
{
    /// <summary>16:9 landscape - a normal YouTube video.</summary>
    Video = 0,

    /// <summary>9:16 vertical - Shorts, Reels, TikTok.</summary>
    Short = 1,

    /// <summary>1:1.</summary>
    Square = 2
}

/// <summary>
/// One cut of a project: a full video, a Short, a teaser. Every cut draws on the same
/// project assets, but each keeps its own timeline - clip order, trims, overlays, audio,
/// framing - so a Short can be carved out of the full video without touching it.
/// <para>
/// The timeline itself is <see cref="DraftJson"/>, the Video editor's own document. The
/// server stores it verbatim and never interprets it; everything else here is what the
/// "Videos &amp; Shorts" page shows without opening that document.
/// </para>
/// </summary>
public sealed class ProjectEdit
{
    public const int MaxNameLength = 120;
    public const int MaxCategoryLength = 40;
    public const int MaxTags = 12;
    public const int MaxTagLength = 30;

    /// <summary>A project may hold this many cuts; enough for every platform and language.</summary>
    public const int MaxPerProject = 100;

    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public EditFormat Format { get; set; } = EditFormat.Video;

    /// <summary>Free text the user groups cuts by: "Full video", "Teaser", "Hindi"...</summary>
    public string? Category { get; set; }

    public List<string> Tags { get; set; } = [];

    /// <summary>The Video editor's timeline document. Null for a cut never opened.</summary>
    public string? DraftJson { get; set; }

    /// <summary>
    /// Set when the cut was carved from part of another one: the editor trims the copied
    /// timeline to this window the first time it is opened, then clears it.
    /// </summary>
    public double? PendingRangeStart { get; set; }
    public double? PendingRangeEnd { get; set; }

    /// <summary>The cut this one was copied from, if any. Informational only.</summary>
    public string? SourceEditId { get; set; }

    // --- reported by the editor on save, so the list needs no draft parsing ----------------
    public double DurationSeconds { get; set; }
    public int ClipCount { get; set; }

    /// <summary>The first clip's asset, used as the card's thumbnail.</summary>
    public string? ThumbnailAssetId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>Trims, dedupes and caps the free-text fields on the way in.</summary>
    public void NormalizeLabels()
    {
        Name = Clip(Name, MaxNameLength) ?? "Untitled";
        Category = Clip(Category, MaxCategoryLength);
        Tags = [.. Tags
            .Select(t => Clip(t, MaxTagLength))
            .OfType<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxTags)];
    }

    private static string? Clip(string? value, int max)
    {
        var t = value?.Trim();
        if (string.IsNullOrEmpty(t)) return null;
        return t.Length <= max ? t : t[..max];
    }
}
