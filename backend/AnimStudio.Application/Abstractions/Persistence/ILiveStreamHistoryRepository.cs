using AnimStudio.Domain.LiveStreams;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The owner's past and current Go Live streams. Every lookup is by owner.</summary>
public interface ILiveStreamHistoryRepository
{
    /// <summary>The owner's entries, newest first.</summary>
    Task<IReadOnlyList<LiveStreamHistoryEntry>> ListAsync(string userId, CancellationToken ct);

    Task<LiveStreamHistoryEntry?> GetAsync(string userId, string id, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="LiveStreamHistoryEntry.Id"/>.</summary>
    Task UpsertAsync(LiveStreamHistoryEntry entry, CancellationToken ct);

    Task<bool> DeleteAsync(string userId, string id, CancellationToken ct);

    /// <summary>Removes every entry of the owner; returns how many were removed.</summary>
    Task<int> DeleteAllAsync(string userId, CancellationToken ct);
}
