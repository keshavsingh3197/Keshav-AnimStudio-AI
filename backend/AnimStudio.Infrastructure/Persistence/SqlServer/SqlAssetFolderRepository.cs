using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlAssetFolderRepository(ISqlConnectionFactory factory) : IAssetFolderRepository
{
    public async Task<AssetFolder?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT Id, ProjectId, Name, ParentId, CreatedAt FROM AssetFolders WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        return await reader.ReadAsync(ct).ConfigureAwait(false) ? Read(reader) : null;
    }

    public async Task<IReadOnlyList<AssetFolder>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT Id, ProjectId, Name, ParentId, CreatedAt FROM AssetFolders
            WHERE ProjectId = @ProjectId ORDER BY CreatedAt DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<AssetFolder>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            list.Add(Read(reader));
        }
        return list;
    }

    public async Task InsertAsync(AssetFolder folder, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO AssetFolders (Id, ProjectId, Name, ParentId, CreatedAt)
            VALUES (@Id, @ProjectId, @Name, @ParentId, @CreatedAt)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", folder.Id);
        cmd.Parameters.AddWithValue("@ProjectId", folder.ProjectId);
        cmd.Parameters.AddWithValue("@Name", folder.Name);
        cmd.Parameters.AddWithValue("@ParentId", (object?)folder.ParentId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CreatedAt", folder.CreatedAt);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(AssetFolder folder, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "UPDATE AssetFolders SET Name = @Name, ParentId = @ParentId WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", folder.Id);
        cmd.Parameters.AddWithValue("@Name", folder.Name);
        cmd.Parameters.AddWithValue("@ParentId", (object?)folder.ParentId ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM AssetFolders WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    private static AssetFolder Read(SqlDataReader reader) => new()
    {
        Id = reader.GetString(0),
        ProjectId = reader.GetString(1),
        Name = reader.GetString(2),
        ParentId = reader.IsDBNull(3) ? null : reader.GetString(3),
        CreatedAt = reader.GetDateTime(4)
    };
}
