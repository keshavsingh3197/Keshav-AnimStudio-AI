namespace AnimStudio.Domain.Publishing;

/// <summary>
/// YouTube details a text model wrote for one of a person's videos, kept so the same or a very similar video gets them
/// back from the database instead of another model call, and so earlier titles can be offered for new videos.
/// </summary>
/// <remarks>
/// The details are stored as the model wrote them, before the chapters, credits, links and footer are added: those belong
/// to the video being published and are composed afresh each time the details are used.
/// </remarks>
public sealed class YouTubeSavedSuggestion
{
    /// <summary><c>yss_{guid}</c>.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>A hash of everything the details were written from; the same video asked again has the same one.</summary>
    public string Fingerprint { get; set; } = string.Empty;

    /// <summary>The words the video is about, lower-cased and de-duplicated, for finding a similar video later.</summary>
    public List<string> Keywords { get; set; } = [];

    public string Language { get; set; } = "hi";
    public string? Tone { get; set; }

    /// <summary>The first line of what the details were written from, so a person can tell which video it was.</summary>
    public string Subject { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public List<string> TitleOptions { get; set; } = [];
    public List<string> DescriptionOptions { get; set; } = [];
    public List<string> TagIdeas { get; set; } = [];
    public string? PinnedComment { get; set; }
    public string? EngagementComment { get; set; }

    /// <summary>What was sung or said in the video, when the details were written from it.</summary>
    public string? TranscriptText { get; set; }

    /// <summary>The engine that wrote them.</summary>
    public string ProviderId { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    /// <summary>When they were last given back instead of asking a model; null until then.</summary>
    public DateTime? LastUsedAtUtc { get; set; }

    /// <summary>How many model calls they have saved.</summary>
    public int Uses { get; set; }
}
