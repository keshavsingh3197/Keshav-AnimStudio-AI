using AnimStudio.Domain.LiveStreams;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Saved stream keys, one per brand channel per destination. Only ever ciphertext.</summary>
public interface ILiveStreamKeyRepository
{
    Task<LiveStreamKey?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<LiveStreamKey>> ListAsync(CancellationToken ct);

    /// <summary>Insert or replace by <see cref="LiveStreamKey.Id"/>.</summary>
    Task UpsertAsync(LiveStreamKey key, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
