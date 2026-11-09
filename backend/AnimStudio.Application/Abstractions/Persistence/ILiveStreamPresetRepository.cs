using AnimStudio.Domain.LiveStreams;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>A person's saved Go Live setups. Every lookup is by owner, so one person never reaches another's.</summary>
public interface ILiveStreamPresetRepository
{
    /// <summary>The owner's presets, most recently used (or changed) first.</summary>
    Task<IReadOnlyList<LiveStreamPreset>> ListAsync(string userId, CancellationToken ct);

    Task<LiveStreamPreset?> GetAsync(string userId, string id, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="LiveStreamPreset.Id"/>.</summary>
    Task UpsertAsync(LiveStreamPreset preset, CancellationToken ct);

    Task<bool> DeleteAsync(string userId, string id, CancellationToken ct);
}
