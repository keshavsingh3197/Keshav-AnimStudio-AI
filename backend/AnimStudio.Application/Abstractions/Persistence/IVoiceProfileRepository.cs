using AnimStudio.Domain.Voices;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Voices users have added from their own consented samples, one list per user.</summary>
public interface IVoiceProfileRepository
{
    Task<VoiceProfile?> GetAsync(string id, CancellationToken ct);
    Task<IReadOnlyList<VoiceProfile>> ListByUserAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="VoiceProfile.Id"/>.</summary>
    Task UpsertAsync(VoiceProfile profile, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
