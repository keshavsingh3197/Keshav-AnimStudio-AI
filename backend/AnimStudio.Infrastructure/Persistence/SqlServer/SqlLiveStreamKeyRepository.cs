using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.LiveStreams;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlLiveStreamKeyRepository(ISqlConnectionFactory factory) : ILiveStreamKeyRepository
{
    public async Task<LiveStreamKey?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamKeys WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<LiveStreamKey>(json) : null;
    }

    public async Task<IReadOnlyList<LiveStreamKey>> ListAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM LiveStreamKeys ORDER BY Id ASC";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<LiveStreamKey>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<LiveStreamKey>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task UpsertAsync(LiveStreamKey key, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM LiveStreamKeys WHERE Id = @Id)
                UPDATE LiveStreamKeys SET DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO LiveStreamKeys (Id, DataJson) VALUES (@Id, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", key.Id);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(key));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM LiveStreamKeys WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
