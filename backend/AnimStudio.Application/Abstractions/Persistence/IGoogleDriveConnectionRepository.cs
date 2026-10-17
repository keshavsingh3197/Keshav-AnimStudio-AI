using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Connected Google Drives, one per user. Refresh tokens are only ever ciphertext.</summary>
public interface IGoogleDriveConnectionRepository
{
    Task<GoogleDriveConnection?> GetAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="GoogleDriveConnection.Id"/>.</summary>
    Task UpsertAsync(GoogleDriveConnection connection, CancellationToken ct);

    Task<bool> DeleteAsync(string userId, CancellationToken ct);
}
