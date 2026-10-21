namespace AnimStudio.Domain.Planning;

public enum ContentLinkOrigin
{
    /// <summary>Added by hand.</summary>
    Manual = 0,

    /// <summary>Captured when the link was downloaded in Media Studio.</summary>
    Download = 1
}

/// <summary>
/// A link the owner downloaded from or saved for later, kept per topic so the same source can
/// be found again from the phone (to remix it, credit it, or check it was used).
/// One record per owner per canonical URL; downloading it again bumps the count.
/// </summary>
public sealed class ContentSourceLink
{
    /// <summary>App-assigned GUID, "N" format.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>The canonical form the validator produced; never the raw pasted text.</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>SHA-256 of <see cref="Url"/>, hex; what the per-owner de-duplication looks up.</summary>
    public string UrlHash { get; set; } = string.Empty;

    /// <summary>Validator platform id, e.g. "youtube", "instagram"; null for a link no downloader platform matched.</summary>
    public string? PlatformId { get; set; }
    public string PlatformName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Note { get; set; }

    public string? TopicId { get; set; }
    public string? PlanItemId { get; set; }

    /// <summary>The project and asset the download was imported into, if any.</summary>
    public string? ProjectId { get; set; }
    public string? AssetId { get; set; }

    public ContentLinkOrigin Origin { get; set; }
    public int DownloadCount { get; set; }

    /// <summary>The owner ticked it off as used in a post.</summary>
    public bool Used { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime LastCapturedAt { get; set; }
}
