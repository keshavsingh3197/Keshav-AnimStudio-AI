using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.System;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlWebSettingRepository(ISqlConnectionFactory factory) : IWebSettingRepository
{
    /// <summary>SQL Server's "invalid object name": the table isn't created yet on a first start.</summary>
    private const int InvalidObjectName = 208;

    public async Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM WebSettings ORDER BY Id ASC";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<WebSetting>();
        try
        {
            await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
            while (await reader.ReadAsync(ct).ConfigureAwait(false))
            {
                var item = SqlJson.Deserialize<WebSetting>(reader.GetString(0));
                if (item != null) list.Add(item);
            }
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            // Settings are read before SqlDatabaseInitializer has run; no table means no overrides yet.
            return [];
        }
        return list;
    }

    public async Task UpsertAsync(WebSetting setting, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM WebSettings WHERE Id = @Id)
                UPDATE WebSettings SET DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO WebSettings (Id, DataJson) VALUES (@Id, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", setting.Id);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(setting));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM WebSettings WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
