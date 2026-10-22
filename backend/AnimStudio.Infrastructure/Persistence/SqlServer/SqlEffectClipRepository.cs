using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Effects;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>
/// The effects library. The fields it is queried by are real columns, so every query is
/// parameterized and indexed; the full record rides along in <c>DataJson</c>.
/// </summary>
public sealed class SqlEffectClipRepository(ISqlConnectionFactory factory) : IEffectClipRepository
{
    public Task<EffectClip?> GetAsync(string id, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<EffectClip>(factory, "SELECT DataJson FROM EffectClips WHERE Id = @Id",
            p => p.AddWithValue("@Id", id), ct);

    public Task<IReadOnlyList<EffectClip>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<EffectClip>(factory,
            "SELECT TOP (@Limit) DataJson FROM EffectClips WHERE UserId = @UserId ORDER BY CreatedAt DESC",
            p =>
            {
                p.AddWithValue("@Limit", limit);
                p.AddWithValue("@UserId", userId);
            }, ct);

    public Task<EffectClip?> FindBySourceAssetAsync(string userId, string sourceAssetId, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<EffectClip>(factory,
            "SELECT TOP (1) DataJson FROM EffectClips WHERE UserId = @UserId AND SourceAssetId = @SourceAssetId",
            p =>
            {
                p.AddWithValue("@UserId", userId);
                p.AddWithValue("@SourceAssetId", sourceAssetId);
            }, ct);

    public Task UpsertAsync(EffectClip effect, CancellationToken ct) =>
        SqlRows.ExecuteAsync(factory, """
            IF EXISTS (SELECT 1 FROM EffectClips WHERE Id = @Id)
                UPDATE EffectClips
                SET UserId = @UserId, SourceAssetId = @SourceAssetId, CreatedAt = @CreatedAt, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO EffectClips (Id, UserId, SourceAssetId, CreatedAt, DataJson)
                VALUES (@Id, @UserId, @SourceAssetId, @CreatedAt, @DataJson)
            """, p =>
        {
            p.AddWithValue("@Id", effect.Id);
            p.AddWithValue("@UserId", effect.UserId);
            p.AddWithValue("@SourceAssetId", SqlRows.OrNull(effect.SourceAssetId));
            p.AddWithValue("@CreatedAt", effect.CreatedAt);
            p.AddWithValue("@DataJson", SqlJson.Serialize(effect));
        }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(factory, "DELETE FROM EffectClips WHERE Id = @Id", p => p.AddWithValue("@Id", id), ct)
            .ConfigureAwait(false) > 0;
}
