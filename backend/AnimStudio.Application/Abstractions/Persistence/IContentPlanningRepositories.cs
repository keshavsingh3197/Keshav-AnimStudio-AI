using AnimStudio.Domain.Planning;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Content calendar topics. Every read is scoped to one owner except the planner sweep.</summary>
public interface IContentTopicRepository
{
    Task<ContentTopic?> GetAsync(string id, CancellationToken ct);

    /// <summary>The owner's topics, by name.</summary>
    Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct);

    /// <summary>Every topic not archived, across all users: only the background planner calls this.</summary>
    Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="ContentTopic.Id"/>.</summary>
    Task UpsertAsync(ContentTopic topic, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}

/// <summary>Planned posts on the content calendar.</summary>
public interface IContentPlanItemRepository
{
    Task<ContentPlanItem?> GetAsync(string id, CancellationToken ct);

    /// <summary>
    /// The owner's posts going live in [<paramref name="fromUtc"/>, <paramref name="toUtc"/>),
    /// earliest first. <paramref name="topicId"/> narrows to one topic.
    /// </summary>
    Task<IReadOnlyList<ContentPlanItem>> ListByUserAsync(string userId, DateTime fromUtc, DateTime toUtc, string? topicId, int limit, CancellationToken ct);

    /// <summary>Every post of one topic, any date (the planner checks slot keys against these).</summary>
    Task<IReadOnlyList<ContentPlanItem>> ListByTopicAsync(string topicId, int limit, CancellationToken ct);

    /// <summary>
    /// Posts going live in the window across all users, for the background YouTube sync.
    /// </summary>
    Task<IReadOnlyList<ContentPlanItem>> ListInWindowAsync(DateTime fromUtc, DateTime toUtc, int limit, CancellationToken ct);

    /// <summary>The owner's post linked to this video, if any.</summary>
    Task<ContentPlanItem?> FindByVideoIdAsync(string userId, string videoId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="ContentPlanItem.Id"/>.</summary>
    Task UpsertAsync(ContentPlanItem item, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);

    Task<int> DeleteByTopicAsync(string topicId, CancellationToken ct);
}

/// <summary>Saved and downloaded source links.</summary>
public interface IContentSourceLinkRepository
{
    Task<ContentSourceLink?> GetAsync(string id, CancellationToken ct);

    Task<ContentSourceLink?> FindByUrlHashAsync(string userId, string urlHash, CancellationToken ct);

    /// <summary>
    /// The owner's links, most recently captured first. <paramref name="topicId"/> and
    /// <paramref name="planItemId"/> narrow the list when given.
    /// </summary>
    Task<IReadOnlyList<ContentSourceLink>> ListByUserAsync(string userId, string? topicId, string? planItemId, int limit, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="ContentSourceLink.Id"/>.</summary>
    Task UpsertAsync(ContentSourceLink link, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
