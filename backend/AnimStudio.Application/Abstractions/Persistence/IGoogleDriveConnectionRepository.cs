using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>
/// Connected Google Drives: a user's personal one (<c>channelId</c> null) and one per channel.
/// Refresh tokens are only ever ciphertext. Every read is by owner, so one user's id can never
/// reach another's Drive.
/// </summary>
public interface IGoogleDriveConnectionRepository
{
    Task<GoogleDriveConnection?> GetAsync(string userId, string? channelId, CancellationToken ct);

    /// <summary>All of the user's Drives, personal and per channel.</summary>
    Task<IReadOnlyList<GoogleDriveConnection>> ListByUserAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="GoogleDriveConnection.Id"/>.</summary>
    Task UpsertAsync(GoogleDriveConnection connection, CancellationToken ct);

    Task<bool> DeleteAsync(string userId, string? channelId, CancellationToken ct);
}
