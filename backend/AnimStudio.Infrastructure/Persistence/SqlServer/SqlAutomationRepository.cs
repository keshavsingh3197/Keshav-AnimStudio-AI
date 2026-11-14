using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Automation;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlAutomationRepository(ISqlConnectionFactory factory) : IAutomationRepository
{
    private const int InvalidObjectName = 208;

    public async Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct)
    {
        try
        {
            return await SqlRows.ListJsonAsync<AutomationRule>(
                factory,
                "SELECT TOP (200) DataJson FROM AutomationRules WHERE UserId = @UserId ORDER BY SortOrder ASC, Name ASC",
                p => p.AddWithValue("@UserId", userId),
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return [];
        }
    }

    public async Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct)
    {
        try
        {
            return await SqlRows.ListJsonAsync<AutomationRule>(
                factory,
                "SELECT TOP (@Limit) DataJson FROM AutomationRules WHERE Enabled = 1 ORDER BY SortOrder ASC, UpdatedAtUtc ASC",
                p => p.AddWithValue("@Limit", Math.Clamp(limit, 1, 2000)),
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return [];
        }
    }

    public async Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct)
    {
        try
        {
            return await SqlRows.ScalarJsonAsync<AutomationRule>(
                factory,
                "SELECT DataJson FROM AutomationRules WHERE Id = @Id",
                p => p.AddWithValue("@Id", id),
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return null;
        }
    }

    public Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct) =>
        SqlRows.ExecuteAsync(
            factory,
            """
            IF EXISTS (SELECT 1 FROM AutomationRules WHERE Id = @Id)
                UPDATE AutomationRules SET
                    UserId = @UserId,
                    Name = @Name,
                    Enabled = @Enabled,
                    SortOrder = @SortOrder,
                    UpdatedAtUtc = @UpdatedAtUtc,
                    DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO AutomationRules (Id, UserId, Name, Enabled, SortOrder, UpdatedAtUtc, DataJson)
                VALUES (@Id, @UserId, @Name, @Enabled, @SortOrder, @UpdatedAtUtc, @DataJson)
            """,
            p =>
            {
                p.AddWithValue("@Id", rule.Id);
                p.AddWithValue("@UserId", rule.UserId);
                p.AddWithValue("@Name", rule.Name);
                p.AddWithValue("@Enabled", rule.Enabled);
                p.AddWithValue("@SortOrder", rule.SortOrder);
                p.AddWithValue("@UpdatedAtUtc", rule.UpdatedAtUtc);
                p.AddWithValue("@DataJson", SqlJson.Serialize(rule));
            },
            ct);

    public async Task<bool> DeleteRuleAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(
            factory,
            "DELETE FROM AutomationRules WHERE Id = @Id",
            p => p.AddWithValue("@Id", id),
            ct).ConfigureAwait(false) > 0;

    public async Task<IReadOnlyList<AutomationPost>> ListPostsAsync(
        string userId,
        string? fromDateKey,
        string? toDateKey,
        AutomationPostStatus? status,
        int limit,
        CancellationToken ct)
    {
        try
        {
            return await SqlRows.ListJsonAsync<AutomationPost>(
                factory,
                """
                SELECT TOP (@Limit) DataJson
                FROM AutomationPosts
                WHERE UserId = @UserId
                  AND (@FromDate IS NULL OR DateKey >= @FromDate)
                  AND (@ToDate IS NULL OR DateKey <= @ToDate)
                  AND (@Status IS NULL OR Status = @Status)
                ORDER BY DateKey DESC, CreatedAtUtc DESC
                """,
                p =>
                {
                    p.AddWithValue("@Limit", Math.Clamp(limit, 1, 1000));
                    p.AddWithValue("@UserId", userId);
                    p.AddWithValue("@FromDate", SqlRows.OrNull(string.IsNullOrWhiteSpace(fromDateKey) ? null : fromDateKey));
                    p.AddWithValue("@ToDate", SqlRows.OrNull(string.IsNullOrWhiteSpace(toDateKey) ? null : toDateKey));
                    p.AddWithValue("@Status", status.HasValue ? (int)status.Value : DBNull.Value);
                },
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return [];
        }
    }

    public async Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(
        IReadOnlyList<AutomationPostStatus> statuses,
        int limit,
        CancellationToken ct)
    {
        if (statuses.Count == 0) return [];
        try
        {
            var statusSet = string.Join(",", statuses.Select(s => ((int)s).ToString()));
            return await SqlRows.ListJsonAsync<AutomationPost>(
                factory,
                $"SELECT TOP (@Limit) DataJson FROM AutomationPosts WHERE Status IN ({statusSet}) ORDER BY UpdatedAtUtc ASC",
                p => p.AddWithValue("@Limit", Math.Clamp(limit, 1, 1000)),
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return [];
        }
    }

    public async Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct)
    {
        try
        {
            return await SqlRows.ScalarJsonAsync<AutomationPost>(
                factory,
                "SELECT DataJson FROM AutomationPosts WHERE Id = @Id",
                p => p.AddWithValue("@Id", id),
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return null;
        }
    }

    public async Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct)
    {
        try
        {
            return await SqlRows.ScalarJsonAsync<AutomationPost>(
                factory,
                "SELECT DataJson FROM AutomationPosts WHERE UserId = @UserId AND Fingerprint = @Fingerprint",
                p =>
                {
                    p.AddWithValue("@UserId", userId);
                    p.AddWithValue("@Fingerprint", fingerprint);
                },
                ct).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == InvalidObjectName)
        {
            return null;
        }
    }

    public Task UpsertPostAsync(AutomationPost post, CancellationToken ct) =>
        SqlRows.ExecuteAsync(
            factory,
            """
            IF EXISTS (SELECT 1 FROM AutomationPosts WHERE Id = @Id)
                UPDATE AutomationPosts SET
                    UserId = @UserId,
                    DateKey = @DateKey,
                    Fingerprint = @Fingerprint,
                    Status = @Status,
                    UpdatedAtUtc = @UpdatedAtUtc,
                    CreatedAtUtc = @CreatedAtUtc,
                    DataJson = @DataJson
                WHERE Id = @Id
            ELSE
                INSERT INTO AutomationPosts (Id, UserId, DateKey, Fingerprint, Status, CreatedAtUtc, UpdatedAtUtc, DataJson)
                VALUES (@Id, @UserId, @DateKey, @Fingerprint, @Status, @CreatedAtUtc, @UpdatedAtUtc, @DataJson)
            """,
            p =>
            {
                p.AddWithValue("@Id", post.Id);
                p.AddWithValue("@UserId", post.UserId);
                p.AddWithValue("@DateKey", post.DateKey);
                p.AddWithValue("@Fingerprint", post.Fingerprint);
                p.AddWithValue("@Status", (int)post.Status);
                p.AddWithValue("@CreatedAtUtc", post.CreatedAtUtc);
                p.AddWithValue("@UpdatedAtUtc", post.UpdatedAtUtc);
                p.AddWithValue("@DataJson", SqlJson.Serialize(post));
            },
            ct);

    public async Task<bool> DeletePostAsync(string id, CancellationToken ct) =>
        await SqlRows.ExecuteAsync(
            factory,
            "DELETE FROM AutomationPosts WHERE Id = @Id",
            p => p.AddWithValue("@Id", id),
            ct).ConfigureAwait(false) > 0;
}
