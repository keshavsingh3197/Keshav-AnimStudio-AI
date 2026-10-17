using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>
/// The filterable fields (owner, project, video, dates, health) are real columns so every
/// query is parameterized and indexed; the full record rides along in <c>DataJson</c>.
/// </summary>
public sealed class SqlYouTubePublicationRepository(ISqlConnectionFactory factory) : IYouTubePublicationRepository
{
    public async Task<YouTubePublication?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM YouTubePublications WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<YouTubePublication>(json) : null;
    }

    public async Task<IReadOnlyList<YouTubePublication>> ListByUserAsync(string userId, string? projectId, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT TOP (@Limit) DataJson FROM YouTubePublications
            WHERE UserId = @UserId AND (@ProjectId IS NULL OR ProjectId = @ProjectId)
            ORDER BY PublishedAt DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@ProjectId", (object?)projectId ?? DBNull.Value);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<YouTubePublication>> ListByVideoIdsAsync(string userId, IReadOnlyCollection<string> videoIds, CancellationToken ct)
    {
        if (videoIds.Count == 0) return [];

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand { Connection = conn };

        // One parameter per id; the caller caps the count well below SQL Server's limit.
        var names = new List<string>(videoIds.Count);
        var i = 0;
        foreach (var videoId in videoIds)
        {
            var name = $"@V{i++}";
            names.Add(name);
            cmd.Parameters.AddWithValue(name, videoId);
        }
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.CommandText = $"SELECT DataJson FROM YouTubePublications WHERE UserId = @UserId AND VideoId IN ({string.Join(", ", names)})";
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<YouTubePublication>> ListDueForCheckAsync(DateTime publishedAfter, DateTime checkedBefore, int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT TOP (@Limit) DataJson FROM YouTubePublications
            WHERE PublishedAt >= @PublishedAfter AND Health <> @Removed
              AND (LastCheckedAt IS NULL OR LastCheckedAt < @CheckedBefore)
            ORDER BY LastCheckedAt ASC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        cmd.Parameters.AddWithValue("@PublishedAfter", publishedAfter);
        cmd.Parameters.AddWithValue("@CheckedBefore", checkedBefore);
        cmd.Parameters.AddWithValue("@Removed", (int)YouTubeVideoHealth.Removed);
        return await ReadAllAsync(cmd, ct).ConfigureAwait(false);
    }

    public async Task UpsertAsync(YouTubePublication publication, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM YouTubePublications WHERE Id = @Id)
                UPDATE YouTubePublications
                SET UserId = @UserId, ProjectId = @ProjectId, VideoId = @VideoId, PublishedAt = @PublishedAt,
                    LastCheckedAt = @LastCheckedAt, Health = @Health, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO YouTubePublications (Id, UserId, ProjectId, VideoId, PublishedAt, LastCheckedAt, Health, DataJson)
                VALUES (@Id, @UserId, @ProjectId, @VideoId, @PublishedAt, @LastCheckedAt, @Health, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", publication.Id);
        cmd.Parameters.AddWithValue("@UserId", publication.UserId);
        cmd.Parameters.AddWithValue("@ProjectId", publication.ProjectId);
        cmd.Parameters.AddWithValue("@VideoId", publication.VideoId);
        cmd.Parameters.AddWithValue("@PublishedAt", publication.PublishedAt);
        cmd.Parameters.AddWithValue("@LastCheckedAt", (object?)publication.LastCheckedAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Health", (int)publication.Health);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(publication));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM YouTubePublications WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }

    private static async Task<IReadOnlyList<YouTubePublication>> ReadAllAsync(SqlCommand cmd, CancellationToken ct)
    {
        var list = new List<YouTubePublication>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<YouTubePublication>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return list;
    }
}
