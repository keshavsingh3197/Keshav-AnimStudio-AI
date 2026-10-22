using AnimStudio.Domain.Effects;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The user's effects library. Every read but <see cref="GetAsync"/> is scoped to one owner.</summary>
public interface IEffectClipRepository
{
    Task<EffectClip?> GetAsync(string id, CancellationToken ct);

    /// <summary>The owner's effects, newest first, at most <paramref name="limit"/>.</summary>
    Task<IReadOnlyList<EffectClip>> ListByUserAsync(string userId, int limit, CancellationToken ct);

    /// <summary>The owner's effect saved from this project asset, if any.</summary>
    Task<EffectClip?> FindBySourceAssetAsync(string userId, string sourceAssetId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="EffectClip.Id"/>.</summary>
    Task UpsertAsync(EffectClip effect, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
