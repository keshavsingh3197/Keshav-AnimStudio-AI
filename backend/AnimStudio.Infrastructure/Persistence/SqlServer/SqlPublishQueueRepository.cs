using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>Owner, state, due time and version are real columns so every query is parameterized and indexed.</summary>
public sealed class SqlPublishQueueRepository(ISqlConnectionFactory factory) : IPublishQueueRepository
{
    public async Task<PublishQueueItem?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM PublishQueueItems WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<PublishQueueItem>(json) : null;
    }

    public async Task<IReadOnlyList<PublishQueueItem>> ListByUserAsync(string userId, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM PublishQueueItems WHERE UserId = @UserId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@UserId", userId);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PublishQueueItem>> ListDueAsync(DateTime dueBefore, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT TOP (@Limit) DataJson FROM PublishQueueItems
            WHERE State = @State AND DueAt IS NOT NULL AND DueAt <= @DueBefore
            ORDER BY DueAt ASC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@State", (int)PublishQueueState.Waiting);
        cmd.Parameters.AddWithValue("@DueBefore", dueBefore);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PublishQueueItem>> ListByStateAsync(PublishQueueState state, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM PublishQueueItems WHERE State = @State ORDER BY CreatedAt ASC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@State", (int)state);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task InsertAsync(PublishQueueItem item, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO PublishQueueItems (Id, UserId, State, DueAt, CreatedAt, Version, DataJson)
            VALUES (@Id, @UserId, @State, @DueAt, @CreatedAt, @Version, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        AddColumns(cmd, item);
        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> ReplaceAsync(PublishQueueItem item, CancellationToken ct)
    {
        var expected = item.Version;
        item.Version = expected + 1;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE PublishQueueItems
            SET State = @State, DueAt = @DueAt, Version = @Version, DataJson = @DataJson
            WHERE Id = @Id AND UserId = @UserId AND Version = @Expected
            """;
        await using var cmd = new SqlCommand(sql, conn);
        AddColumns(cmd, item);
        cmd.Parameters.AddWithValue("@Expected", expected);

        if (await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0) return true;
        item.Version = expected;
        return false;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM PublishQueueItems WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }

    private static void AddColumns(SqlCommand cmd, PublishQueueItem item)
    {
        cmd.Parameters.AddWithValue("@Id", item.Id);
        cmd.Parameters.AddWithValue("@UserId", item.UserId);
        cmd.Parameters.AddWithValue("@State", (int)item.State);
        cmd.Parameters.AddWithValue("@DueAt", (object?)item.DueAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
        cmd.Parameters.AddWithValue("@Version", item.Version);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
    }

    private static async Task<IReadOnlyList<PublishQueueItem>> ReadAllAsync(SqlCommand cmd, CancellationToken ct)
    {
        var list = new List<PublishQueueItem>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<PublishQueueItem>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }
}
