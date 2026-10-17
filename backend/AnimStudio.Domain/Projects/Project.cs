using AnimStudio.Domain.Rendering;

namespace AnimStudio.Domain.Projects;

public enum ProjectStatus { Draft = 0, Ready = 1, Rendering = 2, Rendered = 3, Archived = 4 }

public enum DistributionIntent { Personal = 0, Public = 1, Monetized = 2 }

/// <summary>
/// What the project makes. A music project's renders publish to YouTube Music by default:
/// the Music category, a song-style title, and a music.youtube.com link once it is up.
/// </summary>
public enum ProjectContentType { Video = 0, Music = 1 }

/// <summary>Bounds for how long an image added to the timeline plays.</summary>
public static class ImageDurationLimits
{
    public const double Default = 5.0;
    public const double Min = 0.5;
    public const double Max = 120.0;

    public static bool IsValid(double seconds) => double.IsFinite(seconds) && seconds is >= Min and <= Max;
}

public sealed class ProjectSettings
{
    public int Width { get; set; } = 1920;
    public int Height { get; set; } = 1080;
    public int FrameRateNum { get; set; } = 30;
    public int FrameRateDen { get; set; } = 1;

    public DistributionIntent DistributionIntent { get; set; } = DistributionIntent.Personal;

    public ProjectContentType ContentType { get; set; } = ProjectContentType.Video;

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

    /// <summary>
    /// True: the watermark is the brand channel's, live - change the channel's logo and every
    /// project on it follows. False: <see cref="DefaultWatermark"/> is this project's own.
    /// Null (projects from before this existed): follow unless a watermark was set up here.
    /// </summary>
    public bool? FollowChannelWatermark { get; set; }

    public bool FollowsChannelWatermark => FollowChannelWatermark ?? DefaultWatermark.Kind == WatermarkKind.None;

    public List<string> ClipOrderAssetIds { get; set; } = [];

    /// <summary>
    /// How long an image plays when it is added to the timeline. Null: the studio-wide
    /// default (<see cref="Ai.AiSettings.DefaultImageDurationSeconds"/>).
    /// </summary>
    public double? DefaultImageDurationSeconds { get; set; }

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
