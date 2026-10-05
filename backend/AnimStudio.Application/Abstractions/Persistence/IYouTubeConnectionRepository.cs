using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Connected YouTube channels, one per user per channel. Refresh tokens are only ever ciphertext.</summary>
public interface IYouTubeConnectionRepository
{
    Task<YouTubeChannelConnection?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<YouTubeChannelConnection>> ListByUserAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="YouTubeChannelConnection.Id"/>.</summary>
    Task UpsertAsync(YouTubeChannelConnection connection, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
