using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>One row per preset: the whole document as JSON, with the owner and sort time beside it.</summary>
public sealed class SqlLiveStreamPresetRepository(ISqlConnectionFactory factory) : ILiveStreamPresetRepository
{
    public async Task<IReadOnlyList<LiveStreamPreset>> ListAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamPresets WHERE UserId = @UserId ORDER BY SortAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<LiveStreamPreset>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<LiveStreamPreset>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<LiveStreamPreset?> GetAsync(string userId, string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamPresets WHERE Id = @Id AND UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<LiveStreamPreset>(json) : null;
    }

    public async Task UpsertAsync(LiveStreamPreset preset, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM LiveStreamPresets WHERE Id = @Id)
                UPDATE LiveStreamPresets SET UserId = @UserId, SortAt = @SortAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO LiveStreamPresets (Id, UserId, SortAt, DataJson) VALUES (@Id, @UserId, @SortAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", preset.Id);
        cmd.Parameters.AddWithValue("@UserId", preset.UserId);
        cmd.Parameters.AddWithValue("@SortAt", preset.LastUsedAtUtc ?? preset.UpdatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(preset));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM LiveStreamPresets WHERE Id = @Id AND UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
