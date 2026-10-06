using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Projects;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>
/// Cuts on SQL Server. The timeline lives in its own column, apart from the rest of the
/// document, so listing a project's cuts never reads a single timeline.
/// </summary>
public sealed class SqlProjectEditRepository(ISqlConnectionFactory factory) : IProjectEditRepository
{
    public async Task<ProjectEdit?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT MetaJson, DraftJson FROM ProjectEdits WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        if (!await reader.ReadAsync(ct).ConfigureAwait(false)) return null;

        var edit = SqlJson.Deserialize<ProjectEdit>(reader.GetString(0));
        if (edit is not null) edit.DraftJson = reader.IsDBNull(1) ? null : reader.GetString(1);
        return edit;
    }

    public async Task<IReadOnlyList<ProjectEdit>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT MetaJson FROM ProjectEdits
            WHERE ProjectId = @ProjectId ORDER BY UpdatedAt DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<ProjectEdit>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            if (SqlJson.Deserialize<ProjectEdit>(reader.GetString(0)) is { } edit) list.Add(edit);
        }
        return list;
    }

    public async Task InsertAsync(ProjectEdit edit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO ProjectEdits (Id, ProjectId, UserId, UpdatedAt, MetaJson, DraftJson)
            VALUES (@Id, @ProjectId, @UserId, @UpdatedAt, @MetaJson, @DraftJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        AddParameters(cmd, edit);
        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(ProjectEdit edit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE ProjectEdits
            SET UpdatedAt = @UpdatedAt, MetaJson = @MetaJson, DraftJson = @DraftJson
            WHERE Id = @Id AND ProjectId = @ProjectId AND UserId = @UserId
            """;
        await using var cmd = new SqlCommand(sql, conn);
        AddParameters(cmd, edit);
        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand("DELETE FROM ProjectEdits WHERE Id = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    private static void AddParameters(SqlCommand cmd, ProjectEdit edit)
    {
        var draft = edit.DraftJson;
        edit.DraftJson = null;
        var meta = SqlJson.Serialize(edit);
        edit.DraftJson = draft;

        cmd.Parameters.AddWithValue("@Id", edit.Id);
        cmd.Parameters.AddWithValue("@ProjectId", edit.ProjectId);
        cmd.Parameters.AddWithValue("@UserId", edit.UserId);
        cmd.Parameters.AddWithValue("@UpdatedAt", edit.UpdatedAt);
        cmd.Parameters.AddWithValue("@MetaJson", meta);
        cmd.Parameters.Add("@DraftJson", System.Data.SqlDbType.NVarChar, -1).Value = (object?)draft ?? DBNull.Value;
    }
}
