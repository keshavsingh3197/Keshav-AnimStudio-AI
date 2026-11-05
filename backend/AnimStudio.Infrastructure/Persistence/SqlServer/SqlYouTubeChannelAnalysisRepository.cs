using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>One row per person and channel: the whole document as JSON, with the columns a query needs beside it.</summary>
public sealed class SqlYouTubeChannelAnalysisRepository(ISqlConnectionFactory factory) : IYouTubeChannelAnalysisRepository
{
    public async Task<YouTubeChannelAnalysis?> GetAsync(string userId, string channelId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (1) DataJson FROM YouTubeChannelAnalyses WHERE UserId = @UserId AND ChannelId = @ChannelId ORDER BY UpdatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@ChannelId", channelId);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<YouTubeChannelAnalysis>(json) : null;
    }

    public async Task<IReadOnlyList<YouTubeChannelAnalysis>> ListByUserAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (100) DataJson FROM YouTubeChannelAnalyses WHERE UserId = @UserId ORDER BY UpdatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<YouTubeChannelAnalysis>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<YouTubeChannelAnalysis>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task UpsertAsync(YouTubeChannelAnalysis analysis, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM YouTubeChannelAnalyses WHERE Id = @Id)
                UPDATE YouTubeChannelAnalyses SET UserId = @UserId, ChannelId = @ChannelId, UpdatedAt = @UpdatedAt, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO YouTubeChannelAnalyses (Id, UserId, ChannelId, UpdatedAt, DataJson) VALUES (@Id, @UserId, @ChannelId, @UpdatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", analysis.Id);
        cmd.Parameters.AddWithValue("@UserId", analysis.UserId);
        cmd.Parameters.AddWithValue("@ChannelId", analysis.ChannelId);
        cmd.Parameters.AddWithValue("@UpdatedAt", analysis.UpdatedAtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(analysis));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}
