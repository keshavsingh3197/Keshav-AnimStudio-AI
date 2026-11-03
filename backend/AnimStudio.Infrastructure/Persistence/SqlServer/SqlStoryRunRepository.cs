using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Stories;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>
/// One row per run: the whole document as JSON, with the columns a query needs beside it.
/// <c>Status</c> and <c>UpdatedAt</c> are written from the document on every save, in this one
/// place, so they cannot drift from it.
/// </summary>
public sealed class SqlStoryRunRepository(ISqlConnectionFactory factory) : IStoryRunRepository
{
    private static readonly string WorkingList =
        string.Join(", ", StoryRun.WorkingStatuses.Select(s => $"'{s}'"));

    public async Task<StoryRun?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM StoryRuns WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<StoryRun>(json) : null;
    }

    public async Task<IReadOnlyList<StoryRun>> ListByUserAsync(string userId, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM StoryRuns WHERE UserId = @UserId ORDER BY UpdatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Limit", Math.Clamp(limit, 1, 500));

        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<StoryRun>> ListWorkingAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        var sql = $"SELECT DataJson FROM StoryRuns WHERE Status IN ({WorkingList}) ORDER BY UpdatedAt";
        await using var cmd = new SqlCommand(sql, conn);

        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<int> CountWorkingByUserAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        var sql = $"SELECT COUNT(*) FROM StoryRuns WHERE UserId = @UserId AND Status IN ({WorkingList})";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        return Convert.ToInt32(await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false));
    }

    public async Task UpsertAsync(StoryRun run, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM StoryRuns WHERE Id = @Id)
                UPDATE StoryRuns SET UserId = @UserId, Status = @Status, UpdatedAt = @UpdatedAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO StoryRuns (Id, UserId, Status, UpdatedAt, DataJson) VALUES (@Id, @UserId, @Status, @UpdatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", run.Id);
        cmd.Parameters.AddWithValue("@UserId", run.UserId);
        cmd.Parameters.AddWithValue("@Status", run.Status.ToString());
        cmd.Parameters.AddWithValue("@UpdatedAt", run.UpdatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(run));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM StoryRuns WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }

    private static async Task<IReadOnlyList<StoryRun>> ReadAllAsync(SqlCommand cmd, CancellationToken ct)
    {
        var list = new List<StoryRun>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<StoryRun>(reader.GetString(0));
            if (item != null) list.Add(item);
        }

        return list;
    }
}
