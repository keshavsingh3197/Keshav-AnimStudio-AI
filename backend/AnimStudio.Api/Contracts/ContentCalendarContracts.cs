using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.Planning;
using AnimStudio.Domain.Planning;
using AnimStudio.Infrastructure.Planning;

namespace AnimStudio.Api.Contracts;

// ---------------------------------------------------------------- requests

public sealed record ContentTopicRequest
{
    [Required, MaxLength(80)] public string Name { get; init; } = string.Empty;
    [MaxLength(500)] public string? Description { get; init; }
    [MaxLength(7)] public string? Color { get; init; }
    [MaxLength(64)] public string? ChannelId { get; init; }
    [MaxLength(200)] public string? ChannelTitle { get; init; }
    [MaxLength(7)] public List<DayOfWeek>? Days { get; init; }
    [MaxLength(5)] public string? PublishTime { get; init; }
    [MaxLength(64)] public string? TimeZone { get; init; }
    [Range(0, ContentPlanRules.MaxLeadDays)] public int LeadDays { get; init; } = 3;
    [Range(1, ContentPlanRules.MaxPlanAheadDays)] public int PlanAheadDays { get; init; } = 21;
    public bool AutoSchedule { get; init; } = true;
    public bool AutoLinkUploads { get; init; } = true;
    [MaxLength(30)] public List<string>? Tags { get; init; }
    [MaxLength(30)] public List<string>? Checklist { get; init; }
    public bool Archived { get; init; }

    public ContentTopicCommand ToCommand() => new(Name, Description, Color, ChannelId, ChannelTitle, Days, PublishTime,
        TimeZone, LeadDays, PlanAheadDays, AutoSchedule, AutoLinkUploads, Tags, Checklist, Archived);
}

public sealed record ContentChecklistItemDto
{
    [MaxLength(200)] public string Text { get; init; } = string.Empty;
    public bool Done { get; init; }
}

public sealed record ContentPlanItemRequest
{
    [Required, MaxLength(64)] public string TopicId { get; init; } = string.Empty;
    [Required, MaxLength(200)] public string Title { get; init; } = string.Empty;
    [MaxLength(4000)] public string? Notes { get; init; }
    [Required] public DateTime PublishAt { get; init; }
    public ContentPlanStatus Status { get; init; } = ContentPlanStatus.Idea;
    [MaxLength(30)] public List<ContentChecklistItemDto>? Checklist { get; init; }
    [MaxLength(64)] public string? ProjectId { get; init; }
    [MaxLength(2048)] public string? FileLink { get; init; }

    public ContentPlanItemCommand ToCommand() => new(TopicId, Title, Notes, PublishAt, Status,
        Checklist?.Select(c => new ContentChecklistItem { Text = c.Text, Done = c.Done }).ToList(), ProjectId, FileLink);
}

public sealed record ContentStatusRequest
{
    [Required] public ContentPlanStatus Status { get; init; }
}

public sealed record ContentLinkVideoRequest
{
    /// <summary>A YouTube or YouTube Studio link, or the bare 11-character id.</summary>
    [Required, MaxLength(2048)] public string Video { get; init; } = string.Empty;
}

public sealed record ContentSourceLinkRequest
{
    [MaxLength(2048)] public string? Url { get; init; }
    [MaxLength(300)] public string? Title { get; init; }
    [MaxLength(1000)] public string? Note { get; init; }
    [MaxLength(64)] public string? TopicId { get; init; }
    [MaxLength(64)] public string? PlanItemId { get; init; }
    public bool Used { get; init; }

    public ContentLinkCommand ToCommand() => new(Url, Title, Note, TopicId, PlanItemId, Used);
}

// ---------------------------------------------------------------- responses

public sealed record ContentTopicResponse(
    string Id,
    string Name,
    string? Description,
    string Color,
    string? ChannelId,
    string? ChannelTitle,
    IReadOnlyList<DayOfWeek> Days,
    string PublishTime,
    string TimeZone,
    int LeadDays,
    int PlanAheadDays,
    bool AutoSchedule,
    bool AutoLinkUploads,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Checklist,
    bool Archived,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ContentAttentionResponse(string Code, ContentAttentionLevel Level, string Message);

public sealed record ContentYouTubeResponse(
    string Title,
    string? Privacy,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    string? ThumbnailUrl,
    bool Exists,
    DateTime CheckedAt);

public sealed record ContentPlanItemResponse(
    string Id,
    string TopicId,
    string Title,
    string? Notes,
    DateTime PublishAt,
    DateTime PrepareBy,
    ContentPlanStatus Status,
    bool AutoPlanned,
    IReadOnlyList<ContentChecklistItemDto> Checklist,
    string? ProjectId,
    string? FileLink,
    string? ChannelId,
    string? VideoId,
    string? VideoUrl,
    string? StudioUrl,
    bool VideoAutoLinked,
    ContentYouTubeResponse? YouTube,
    string? SyncMessage,
    DateTime? ReadyAt,
    IReadOnlyList<ContentAttentionResponse> Attention,
    DateTime UpdatedAt);

public sealed record ContentSourceLinkResponse(
    string Id,
    string Url,
    string? PlatformId,
    string PlatformName,
    string Title,
    string? Note,
    string? TopicId,
    string? PlanItemId,
    string? ProjectId,
    string? AssetId,
    ContentLinkOrigin Origin,
    int DownloadCount,
    bool Used,
    DateTime CreatedAt,
    DateTime LastCapturedAt);

public sealed record ContentUploadCandidateResponse(
    string VideoId,
    string Title,
    string? Privacy,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    string? ThumbnailUrl,
    bool Suggested);

public static class ContentCalendarMappings
{
    public static ContentTopicResponse ToResponse(this ContentTopic t) => new(
        t.Id, t.Name, t.Description, t.Color, t.ChannelId, t.ChannelTitle, t.Days, t.PublishTime, t.TimeZone,
        t.LeadDays, t.PlanAheadDays, t.AutoSchedule, t.AutoLinkUploads, t.Tags, t.Checklist, t.Archived, t.CreatedAt, t.UpdatedAt);

    public static ContentPlanItemResponse ToResponse(this ContentPlanItemView view)
    {
        var i = view.Item;
        return new ContentPlanItemResponse(
            i.Id, i.TopicId, i.Title, i.Notes, i.PublishAt, view.PrepareBy, i.Status, i.SlotKey is not null,
            [.. i.Checklist.Select(c => new ContentChecklistItemDto { Text = c.Text, Done = c.Done })],
            i.ProjectId, i.FileLink, i.ChannelId, i.VideoId,
            i.VideoId is null ? null : $"https://www.youtube.com/watch?v={i.VideoId}",
            i.VideoId is null ? null : $"https://studio.youtube.com/video/{i.VideoId}/edit",
            i.VideoAutoLinked,
            i.YouTube is { } y ? new ContentYouTubeResponse(y.Title, y.Privacy, y.ScheduledAt, y.PublishedAt, y.ThumbnailUrl, y.Exists, y.CheckedAt) : null,
            i.SyncMessage, i.ReadyAt,
            [.. view.Attention.Select(a => new ContentAttentionResponse(a.Code, a.Level, a.Message))],
            i.UpdatedAt);
    }

    public static ContentSourceLinkResponse ToResponse(this ContentSourceLink l) => new(
        l.Id, l.Url, l.PlatformId, l.PlatformName, l.Title, l.Note, l.TopicId, l.PlanItemId, l.ProjectId, l.AssetId,
        l.Origin, l.DownloadCount, l.Used, l.CreatedAt, l.LastCapturedAt);

    public static ContentUploadCandidateResponse ToResponse(this ContentUploadCandidate c) => new(
        c.Video.VideoId, c.Video.Title, c.Video.Privacy, c.Video.ScheduledAt, c.Video.PublishedAt, c.Video.ThumbnailUrl, c.Suggested);
}
