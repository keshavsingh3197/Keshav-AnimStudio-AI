using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>One row per saved set of details: the whole document as JSON, with the columns a query needs beside it.</summary>
public sealed class SqlYouTubeSavedSuggestionRepository(ISqlConnectionFactory factory) : IYouTubeSavedSuggestionRepository
{
    public async Task<YouTubeSavedSuggestion?> FindAsync(string userId, string fingerprint, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (1) DataJson FROM YouTubeSavedSuggestions WHERE UserId = @UserId AND Fingerprint = @Fingerprint ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Fingerprint", fingerprint);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<YouTubeSavedSuggestion>(json) : null;
    }

    public async Task<IReadOnlyList<YouTubeSavedSuggestion>> ListRecentAsync(string userId, string language, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM YouTubeSavedSuggestions WHERE UserId = @UserId AND Language = @Language ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", Math.Clamp(limit, 1, 1000));
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Language", language);

        var list = new List<YouTubeSavedSuggestion>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<YouTubeSavedSuggestion>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task UpsertAsync(YouTubeSavedSuggestion suggestion, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM YouTubeSavedSuggestions WHERE Id = @Id)
                UPDATE YouTubeSavedSuggestions SET UserId = @UserId, Fingerprint = @Fingerprint, Language = @Language, CreatedAt = @CreatedAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO YouTubeSavedSuggestions (Id, UserId, Fingerprint, Language, CreatedAt, DataJson) VALUES (@Id, @UserId, @Fingerprint, @Language, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", suggestion.Id);
        cmd.Parameters.AddWithValue("@UserId", suggestion.UserId);
        cmd.Parameters.AddWithValue("@Fingerprint", suggestion.Fingerprint);
        cmd.Parameters.AddWithValue("@Language", suggestion.Language);
        cmd.Parameters.AddWithValue("@CreatedAt", suggestion.CreatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(suggestion));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
