using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Projects;

public enum ProjectStatus { Draft = 0, Ready = 1, Rendering = 2, Rendered = 3, Archived = 4 }

/// <summary>
/// How the finished video is intended to be used. This is not cosmetic: it drives the
/// licence gate, because an image that is fine for a private test can be unusable in a
/// monetized upload.
/// </summary>
public enum DistributionIntent { Personal = 0, Public = 1, Monetized = 2 }

public sealed class ProjectSettings
{
    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public int FrameRateNum { get; set; } = 30;
    public int FrameRateDen { get; set; } = 1;

    public DistributionIntent DistributionIntent { get; set; } = DistributionIntent.Personal;

    /// <summary>Share-alike propagates to the finished video, so it needs explicit opt-in.</summary>
    public bool AcceptShareAlikeObligation { get; set; }

    public string? BackgroundMusicAssetId { get; set; }
    public double BackgroundMusicVolume { get; set; } = 0.18;

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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
