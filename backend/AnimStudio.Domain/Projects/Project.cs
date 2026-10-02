using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Projects;

public enum ProjectStatus { Draft = 0, Ready = 1, Rendering = 2, Rendered = 3, Archived = 4 }

public enum DistributionIntent { Personal = 0, Public = 1, Monetized = 2 }

public sealed class ProjectSettings
{
    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public int FrameRateNum { get; set; } = 30;
    public int FrameRateDen { get; set; } = 1;

    public DistributionIntent DistributionIntent { get; set; } = DistributionIntent.Personal;

    public bool AcceptShareAlikeObligation { get; set; }

    public string? BackgroundMusicAssetId { get; set; }
    public double BackgroundMusicVolume { get; set; } = 0.18;

    public WatermarkSettings DefaultWatermark { get; set; } = new();
    public OutroSettings DefaultOutro { get; set; } = new();

    /// <summary>
    /// The brand channel (YouTube channel) this project publishes under: its end card is
    /// used when the project has no outro of its own. Null means the default channel.
    /// </summary>
    public string? BrandChannelId { get; set; }

    public List<string> ClipOrderAssetIds { get; set; } = [];

    public Canvas ToCanvas() => new(Width, Height, new FrameRate(FrameRateNum, FrameRateDen));
}

public sealed class Project
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    public ProjectSettings Settings { get; set; } = new();
    
    // New dynamic fields
    public bool IsPinned { get; set; }
    public string? CustomThumbnail { get; set; }
    public string? StudioDraftJson { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
