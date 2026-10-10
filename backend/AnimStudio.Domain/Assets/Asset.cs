namespace AnimStudio.Domain.Assets;

public enum AssetKind { Unknown = 0, Image = 1, Audio = 2, Video = 3, Subtitle = 4 }

public enum AssetReviewStatus { NotRequired = 0, PendingReview = 1, Approved = 2, Rejected = 3 }

public enum AssetUsageScope { None = 0, SceneUse = 1, ReferenceOnly = 2 }

/// <summary>
/// What a licence permits. Derived from provider metadata, about the FILE only -
/// see <see cref="IpRisk"/> for what the file depicts.
/// </summary>
public enum LicenseClass
{
    Unknown = 0,
    PublicDomain = 1,
    AttributionOnly = 2,
    ShareAlike = 3,
    NonCommercial = 4,
    NoDerivatives = 5
}

public enum IpRiskLevel { Info = 0, Caution = 1, High = 2 }

/// <summary>
/// Where an asset came from, written once at import and never edited. A licence
/// dispute years later has to be answerable from this record alone.
/// </summary>
public sealed class AssetProvenance
{
    public string? SourceProvider { get; set; }
    public string? ExternalId { get; set; }
    public string? SourceUrl { get; set; }
    public string? LicenseCode { get; set; }
    public string? LicenseVersion { get; set; }
    public string? LicenseUrl { get; set; }
    public LicenseClass LicenseClass { get; set; } = LicenseClass.Unknown;
    public string? AttributionText { get; set; }
    public string? CreatorName { get; set; }
    public string? CreatorUrl { get; set; }
    public DateTime? FetchedAtUtc { get; set; }
    public string? FetchedByUserId { get; set; }
}

/// <summary>
/// Risk in what the image DEPICTS, as opposed to the licence on the file. Not
/// machine-decidable: a CC-BY photo of a figurine of a copyrighted character is
/// licence-clean as a photograph and still infringing as a depiction. Advisory only,
/// and recorded so it is provable that a human was told.
/// </summary>
public sealed class IpRisk
{
    public IpRiskLevel Level { get; set; } = IpRiskLevel.Info;
    public string? Code { get; set; }
    public List<string> Signals { get; set; } = [];
    public string? AdvisoryText { get; set; }
    public bool Acknowledged { get; set; }
    public string? AcknowledgedByUserId { get; set; }
    public DateTime? AcknowledgedAtUtc { get; set; }
}

/// <summary>Technical facts probed from the file at upload time, not at render time.</summary>
public sealed class MediaProbe
{
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? PixelFormat { get; set; }
    public bool HasAlpha { get; set; }
    public double? DurationSeconds { get; set; }
    public int? AudioChannels { get; set; }
    public int? SampleRate { get; set; }
    public string? VideoCodec { get; set; }
    public string? AudioCodec { get; set; }
}

public sealed class Asset
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string? FolderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    /// <summary>The original client filename, kept for display only and never used on disk.</summary>
    public string? DisplayFileName { get; set; }

    /// <summary>Server-composed object-store key. Never contains client input.</summary>
    public string StorageKey { get; set; } = string.Empty;

    public AssetKind Kind { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public MediaProbe Probe { get; set; } = new();

    public AssetReviewStatus ReviewStatus { get; set; } = AssetReviewStatus.NotRequired;
    public AssetUsageScope UsageScope { get; set; } = AssetUsageScope.SceneUse;
    public AssetProvenance? Provenance { get; set; }
    public IpRisk? IpRisk { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The asset in another project this one was copied from, so copying the same file into
    /// the same project twice reuses the first copy instead of storing the bytes again.
    /// </summary>
    public string? CopiedFromAssetId { get; set; }

    /// <summary>
    /// An uploaded asset needs no review; anything fetched from an online search must be
    /// approved before a render may reference it.
    /// </summary>
    public bool IsUsableInScene =>
        UsageScope == AssetUsageScope.SceneUse &&
        ReviewStatus is AssetReviewStatus.NotRequired or AssetReviewStatus.Approved;
}
