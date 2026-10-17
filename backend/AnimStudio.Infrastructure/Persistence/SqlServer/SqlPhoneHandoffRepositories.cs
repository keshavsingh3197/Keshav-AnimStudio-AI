using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlGoogleDriveConnectionRepository(ISqlConnectionFactory factory) : IGoogleDriveConnectionRepository
{
    public async Task<GoogleDriveConnection?> GetAsync(string userId, string? channelId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM GoogleDriveConnections WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", GoogleDriveConnection.KeyFor(userId, channelId));

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        var found = res is string json ? SqlJson.Deserialize<GoogleDriveConnection>(json) : null;
        // The key is built from the owner, but the stored owner is what decides.
        return found is not null && string.Equals(found.UserId, userId, StringComparison.Ordinal) ? found : null;
    }

    public async Task<IReadOnlyList<GoogleDriveConnection>> ListByUserAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        // A prefix compare rather than LIKE, so nothing in the id is read as a wildcard.
        const string sql = """
            SELECT DataJson FROM GoogleDriveConnections
            WHERE Id = @UserId OR LEFT(Id, LEN(@Prefix)) = @Prefix
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Prefix", userId + ":");

        var list = new List<GoogleDriveConnection>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            if (SqlJson.Deserialize<GoogleDriveConnection>(reader.GetString(0)) is { } item
                && string.Equals(item.UserId, userId, StringComparison.Ordinal))
                list.Add(item);
        }
        return list;
    }

    public async Task UpsertAsync(GoogleDriveConnection connection, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM GoogleDriveConnections WHERE Id = @Id)
                UPDATE GoogleDriveConnections SET DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO GoogleDriveConnections (Id, DataJson) VALUES (@Id, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", connection.Id);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(connection));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string userId, string? channelId, CancellationToken ct)
    {
        if (await GetAsync(userId, channelId, ct).ConfigureAwait(false) is null) return false;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM GoogleDriveConnections WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", GoogleDriveConnection.KeyFor(userId, channelId));

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}

/// <summary>Owner, job, state and creation time are real columns so every query is parameterized and indexed.</summary>
public sealed class SqlPhoneHandoffRepository(ISqlConnectionFactory factory) : IPhoneHandoffRepository
{
    public async Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM PhoneHandoffs WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<PhoneHandoff>(json) : null;
    }

    public async Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT TOP (@Limit) DataJson FROM PhoneHandoffs
            WHERE UserId = @UserId AND (@JobId IS NULL OR JobId = @JobId)
            ORDER BY CreatedAt DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@JobId", (object?)jobId ?? DBNull.Value);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM PhoneHandoffs WHERE State = @State ORDER BY CreatedAt ASC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@State", (int)state);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM PhoneHandoffs WHERE Id = @Id)
                UPDATE PhoneHandoffs
                SET UserId = @UserId, JobId = @JobId, State = @State, CreatedAt = @CreatedAt, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO PhoneHandoffs (Id, UserId, JobId, State, CreatedAt, DataJson)
                VALUES (@Id, @UserId, @JobId, @State, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", handoff.Id);
        cmd.Parameters.AddWithValue("@UserId", handoff.UserId);
        cmd.Parameters.AddWithValue("@JobId", handoff.JobId);
        cmd.Parameters.AddWithValue("@State", (int)handoff.State);
        cmd.Parameters.AddWithValue("@CreatedAt", handoff.CreatedAt);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(handoff));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    private static async Task<IReadOnlyList<PhoneHandoff>> ReadAllAsync(SqlCommand cmd, CancellationToken ct)
    {
        var list = new List<PhoneHandoff>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<PhoneHandoff>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }
}
