using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Stories;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlStoryGenreRepository(ISqlConnectionFactory factory) : IStoryGenreRepository
{
    public async Task<IReadOnlyList<StoryGenre>> ListAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM StoryGenres ORDER BY SortOrder ASC, Id ASC";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<StoryGenre>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<StoryGenre>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<StoryGenre?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM StoryGenres WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var json = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false) as string;
        return json is null ? null : SqlJson.Deserialize<StoryGenre>(json);
    }

    public async Task UpsertAsync(StoryGenre genre, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM StoryGenres WHERE Id = @Id)
                UPDATE StoryGenres SET SortOrder = @SortOrder, Enabled = @Enabled, UpdatedAt = @UpdatedAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO StoryGenres (Id, SortOrder, Enabled, UpdatedAt, DataJson) VALUES (@Id, @SortOrder, @Enabled, @UpdatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", genre.Id);
        cmd.Parameters.AddWithValue("@SortOrder", genre.Order);
        cmd.Parameters.AddWithValue("@Enabled", genre.Enabled);
        cmd.Parameters.AddWithValue("@UpdatedAt", genre.UpdatedAtUtc == default ? DateTime.UtcNow : genre.UpdatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(genre));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM StoryGenres WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
