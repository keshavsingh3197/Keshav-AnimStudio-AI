using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>One row per stream: the whole entry as JSON, with the owner and creation time beside it.</summary>
public sealed class SqlLiveStreamHistoryRepository(ISqlConnectionFactory factory) : ILiveStreamHistoryRepository
{
    public async Task<IReadOnlyList<LiveStreamHistoryEntry>> ListAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamHistory WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<LiveStreamHistoryEntry>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<LiveStreamHistoryEntry>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<LiveStreamHistoryEntry?> GetAsync(string userId, string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamHistory WHERE Id = @Id AND UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<LiveStreamHistoryEntry>(json) : null;
    }

    public async Task UpsertAsync(LiveStreamHistoryEntry entry, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM LiveStreamHistory WHERE Id = @Id)
                UPDATE LiveStreamHistory SET UserId = @UserId, CreatedAt = @CreatedAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO LiveStreamHistory (Id, UserId, CreatedAt, DataJson) VALUES (@Id, @UserId, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", entry.Id);
        cmd.Parameters.AddWithValue("@UserId", entry.UserId);
        cmd.Parameters.AddWithValue("@CreatedAt", entry.CreatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(entry));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM LiveStreamHistory WHERE Id = @Id AND UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }

    public async Task<int> DeleteAllAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM LiveStreamHistory WHERE UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
