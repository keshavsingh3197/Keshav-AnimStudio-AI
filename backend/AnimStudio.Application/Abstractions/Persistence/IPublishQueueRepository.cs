using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The publishing board. Every read is scoped to one owner except the scheduler's.</summary>
public interface IPublishQueueRepository
{
    Task<PublishQueueItem?> GetAsync(string id, CancellationToken ct);

    /// <summary>The owner's items, newest first.</summary>
    Task<IReadOnlyList<PublishQueueItem>> ListByUserAsync(string userId, int limit, CancellationToken ct);

    /// <summary>
    /// Every user's <see cref="PublishQueueState.Waiting"/> items due at or before <paramref name="dueBefore"/>,
    /// earliest first. Only the scheduler calls this.
    /// </summary>
    Task<IReadOnlyList<PublishQueueItem>> ListDueAsync(DateTime dueBefore, int limit, CancellationToken ct);

    /// <summary>Every user's items in one state, oldest first. Only the scheduler calls this.</summary>
    Task<IReadOnlyList<PublishQueueItem>> ListByStateAsync(PublishQueueState state, int limit, CancellationToken ct);

    Task InsertAsync(PublishQueueItem item, CancellationToken ct);

    /// <summary>
    /// Saves <paramref name="item"/> only if the stored copy still has its <see cref="PublishQueueItem.Version"/>,
    /// then bumps the version on <paramref name="item"/>. False when someone else saved first.
    /// </summary>
    Task<bool> ReplaceAsync(PublishQueueItem item, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
