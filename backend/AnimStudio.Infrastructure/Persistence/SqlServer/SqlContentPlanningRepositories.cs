using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Planning;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

/// <summary>
/// The content calendar tables. As elsewhere, the filterable fields are real columns so every
/// query is parameterized and indexed; the full record rides along in <c>DataJson</c>.
/// </summary>
internal static class SqlRows
{
    public static async Task<T?> ScalarJsonAsync<T>(ISqlConnectionFactory factory, string sql, Action<SqlParameterCollection> bind, CancellationToken ct)
        where T : class
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn);
        bind(cmd.Parameters);
        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<T>(json) : null;
    }

    public static async Task<IReadOnlyList<T>> ListJsonAsync<T>(ISqlConnectionFactory factory, string sql, Action<SqlParameterCollection> bind, CancellationToken ct)
        where T : class
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn);
        bind(cmd.Parameters);
        var list = new List<T>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            if (SqlJson.Deserialize<T>(reader.GetString(0)) is { } item) list.Add(item);
        }
        return list;
    }

    public static async Task<int> ExecuteAsync(ISqlConnectionFactory factory, string sql, Action<SqlParameterCollection> bind, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn);
        bind(cmd.Parameters);
        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public static object OrNull(object? value) => value ?? DBNull.Value;
}

public sealed class SqlContentTopicRepository(ISqlConnectionFactory factory) : IContentTopicRepository
{
    public Task<ContentTopic?> GetAsync(string id, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<ContentTopic>(factory, "SELECT DataJson FROM ContentTopics WHERE Id = @Id",
            p => p.AddWithValue("@Id", id), ct);

    public Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentTopic>(factory,
            "SELECT TOP (200) DataJson FROM ContentTopics WHERE UserId = @UserId ORDER BY Name",
            p => p.AddWithValue("@UserId", userId), ct);

    public Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentTopic>(factory,
            "SELECT TOP (@Limit) DataJson FROM ContentTopics WHERE Archived = 0 ORDER BY UpdatedAt",
            p => p.AddWithValue("@Limit", limit), ct);

    public Task UpsertAsync(ContentTopic topic, CancellationToken ct) =>
        SqlRows.ExecuteAsync(factory, """
            IF EXISTS (SELECT 1 FROM ContentTopics WHERE Id = @Id)
                UPDATE ContentTopics
                SET UserId = @UserId, Name = @Name, Archived = @Archived, UpdatedAt = @UpdatedAt, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO ContentTopics (Id, UserId, Name, Archived, UpdatedAt, DataJson)
                VALUES (@Id, @UserId, @Name, @Archived, @UpdatedAt, @DataJson)
            """, p =>
        {
            p.AddWithValue("@Id", topic.Id);
            p.AddWithValue("@UserId", topic.UserId);
            p.AddWithValue("@Name", topic.Name);
            p.AddWithValue("@Archived", topic.Archived);
            p.AddWithValue("@UpdatedAt", topic.UpdatedAt);
            p.AddWithValue("@DataJson", SqlJson.Serialize(topic));
        }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(factory, "DELETE FROM ContentTopics WHERE Id = @Id", p => p.AddWithValue("@Id", id), ct)
            .ConfigureAwait(false) > 0;
}

public sealed class SqlContentPlanItemRepository(ISqlConnectionFactory factory) : IContentPlanItemRepository
{
    public Task<ContentPlanItem?> GetAsync(string id, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<ContentPlanItem>(factory, "SELECT DataJson FROM ContentPlanItems WHERE Id = @Id",
            p => p.AddWithValue("@Id", id), ct);

    public Task<IReadOnlyList<ContentPlanItem>> ListByUserAsync(
        string userId, DateTime fromUtc, DateTime toUtc, string? topicId, int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentPlanItem>(factory, """
            SELECT TOP (@Limit) DataJson FROM ContentPlanItems
            WHERE UserId = @UserId AND PublishAt >= @From AND PublishAt < @To
              AND (@TopicId IS NULL OR TopicId = @TopicId)
            ORDER BY PublishAt
            """, p =>
        {
            p.AddWithValue("@Limit", limit);
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@From", fromUtc);
            p.AddWithValue("@To", toUtc);
            p.AddWithValue("@TopicId", SqlRows.OrNull(topicId));
        }, ct);

    public Task<IReadOnlyList<ContentPlanItem>> ListByTopicAsync(string topicId, int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentPlanItem>(factory,
            "SELECT TOP (@Limit) DataJson FROM ContentPlanItems WHERE TopicId = @TopicId ORDER BY PublishAt DESC",
            p =>
            {
                p.AddWithValue("@Limit", limit);
                p.AddWithValue("@TopicId", topicId);
            }, ct);

    public Task<IReadOnlyList<ContentPlanItem>> ListInWindowAsync(DateTime fromUtc, DateTime toUtc, int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentPlanItem>(factory,
            "SELECT TOP (@Limit) DataJson FROM ContentPlanItems WHERE PublishAt >= @From AND PublishAt < @To ORDER BY PublishAt",
            p =>
            {
                p.AddWithValue("@Limit", limit);
                p.AddWithValue("@From", fromUtc);
                p.AddWithValue("@To", toUtc);
            }, ct);

    public Task<ContentPlanItem?> FindByVideoIdAsync(string userId, string videoId, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<ContentPlanItem>(factory,
            "SELECT TOP (1) DataJson FROM ContentPlanItems WHERE UserId = @UserId AND VideoId = @VideoId",
            p =>
            {
                p.AddWithValue("@UserId", userId);
                p.AddWithValue("@VideoId", videoId);
            }, ct);

    public Task UpsertAsync(ContentPlanItem item, CancellationToken ct) =>
        SqlRows.ExecuteAsync(factory, """
            IF EXISTS (SELECT 1 FROM ContentPlanItems WHERE Id = @Id)
                UPDATE ContentPlanItems
                SET UserId = @UserId, TopicId = @TopicId, PublishAt = @PublishAt, Status = @Status,
                    VideoId = @VideoId, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO ContentPlanItems (Id, UserId, TopicId, PublishAt, Status, VideoId, DataJson)
                VALUES (@Id, @UserId, @TopicId, @PublishAt, @Status, @VideoId, @DataJson)
            """, p =>
        {
            p.AddWithValue("@Id", item.Id);
            p.AddWithValue("@UserId", item.UserId);
            p.AddWithValue("@TopicId", item.TopicId);
            p.AddWithValue("@PublishAt", item.PublishAt);
            p.AddWithValue("@Status", (int)item.Status);
            p.AddWithValue("@VideoId", SqlRows.OrNull(item.VideoId));
            p.AddWithValue("@DataJson", SqlJson.Serialize(item));
        }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(factory, "DELETE FROM ContentPlanItems WHERE Id = @Id", p => p.AddWithValue("@Id", id), ct)
            .ConfigureAwait(false) > 0;

    public Task<int> DeleteByTopicAsync(string topicId, CancellationToken ct) =>
        SqlRows.ExecuteAsync(factory, "DELETE FROM ContentPlanItems WHERE TopicId = @TopicId", p => p.AddWithValue("@TopicId", topicId), ct);
}

public sealed class SqlContentSourceLinkRepository(ISqlConnectionFactory factory) : IContentSourceLinkRepository
{
    public Task<ContentSourceLink?> GetAsync(string id, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<ContentSourceLink>(factory, "SELECT DataJson FROM ContentSourceLinks WHERE Id = @Id",
            p => p.AddWithValue("@Id", id), ct);

    public Task<ContentSourceLink?> FindByUrlHashAsync(string userId, string urlHash, CancellationToken ct) =>
        SqlRows.ScalarJsonAsync<ContentSourceLink>(factory,
            "SELECT TOP (1) DataJson FROM ContentSourceLinks WHERE UserId = @UserId AND UrlHash = @UrlHash",
            p =>
            {
                p.AddWithValue("@UserId", userId);
                p.AddWithValue("@UrlHash", urlHash);
            }, ct);

    public Task<IReadOnlyList<ContentSourceLink>> ListByUserAsync(
        string userId, string? topicId, string? planItemId, int limit, CancellationToken ct) =>
        SqlRows.ListJsonAsync<ContentSourceLink>(factory, """
            SELECT TOP (@Limit) DataJson FROM ContentSourceLinks
            WHERE UserId = @UserId
              AND (@TopicId IS NULL OR TopicId = @TopicId)
              AND (@PlanItemId IS NULL OR PlanItemId = @PlanItemId)
            ORDER BY LastCapturedAt DESC
            """, p =>
        {
            p.AddWithValue("@Limit", limit);
            p.AddWithValue("@UserId", userId);
            p.AddWithValue("@TopicId", SqlRows.OrNull(topicId));
            p.AddWithValue("@PlanItemId", SqlRows.OrNull(planItemId));
        }, ct);

    public Task UpsertAsync(ContentSourceLink link, CancellationToken ct) =>
        SqlRows.ExecuteAsync(factory, """
            IF EXISTS (SELECT 1 FROM ContentSourceLinks WHERE Id = @Id)
                UPDATE ContentSourceLinks
                SET UserId = @UserId, UrlHash = @UrlHash, TopicId = @TopicId, PlanItemId = @PlanItemId,
                    LastCapturedAt = @LastCapturedAt, DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO ContentSourceLinks (Id, UserId, UrlHash, TopicId, PlanItemId, LastCapturedAt, DataJson)
                VALUES (@Id, @UserId, @UrlHash, @TopicId, @PlanItemId, @LastCapturedAt, @DataJson)
            """, p =>
        {
            p.AddWithValue("@Id", link.Id);
            p.AddWithValue("@UserId", link.UserId);
            p.AddWithValue("@UrlHash", link.UrlHash);
            p.AddWithValue("@TopicId", SqlRows.OrNull(link.TopicId));
            p.AddWithValue("@PlanItemId", SqlRows.OrNull(link.PlanItemId));
            p.AddWithValue("@LastCapturedAt", link.LastCapturedAt);
            p.AddWithValue("@DataJson", SqlJson.Serialize(link));
        }, ct);

    public async Task<bool> DeleteAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(factory, "DELETE FROM ContentSourceLinks WHERE Id = @Id", p => p.AddWithValue("@Id", id), ct)
            .ConfigureAwait(false) > 0;
}
