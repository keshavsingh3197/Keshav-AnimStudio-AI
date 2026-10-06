using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlYouTubeConnectionRepository(ISqlConnectionFactory factory) : IYouTubeConnectionRepository
{
    public async Task<YouTubeChannelConnection?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM YouTubeConnections WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<YouTubeChannelConnection>(json) : null;
    }

    public async Task<IReadOnlyList<YouTubeChannelConnection>> ListByUserAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM YouTubeConnections WHERE UserId = @UserId ORDER BY Id ASC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<YouTubeChannelConnection>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<YouTubeChannelConnection>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return [.. list.OrderBy(c => c.ConnectedAt)];
    }

    public async Task UpsertAsync(YouTubeChannelConnection connection, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM YouTubeConnections WHERE Id = @Id)
                UPDATE YouTubeConnections SET UserId = @UserId, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO YouTubeConnections (Id, UserId, DataJson) VALUES (@Id, @UserId, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", connection.Id);
        cmd.Parameters.AddWithValue("@UserId", connection.UserId);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(connection));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM YouTubeConnections WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
