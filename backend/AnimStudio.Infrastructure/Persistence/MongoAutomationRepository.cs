using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Automation;
using KeshavSingh.Mongo.NoSql;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence;

public sealed class MongoAutomationRepository(MongoDbService mongo) : IAutomationRepository
{
    private IMongoCollection<AutomationRule> Rules =>
        mongo.GetCollection<AutomationRule>(MongoCollections.AutomationRules);

    private IMongoCollection<AutomationPost> Posts =>
        mongo.GetCollection<AutomationPost>(MongoCollections.AutomationPosts);

    public async Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct) =>
        await Rules.Find(r => r.UserId == userId)
            .SortBy(r => r.SortOrder)
            .ThenBy(r => r.Name)
            .Limit(200)
            .ToListAsync(ct)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct) =>
        await Rules.Find(r => r.Enabled)
            .SortBy(r => r.SortOrder)
            .ThenBy(r => r.UpdatedAtUtc)
            .Limit(Math.Clamp(limit, 1, 2000))
            .ToListAsync(ct)
            .ConfigureAwait(false);

    public async Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct) =>
        await Rules.Find(r => r.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct) =>
        Rules.ReplaceOneAsync(r => r.Id == rule.Id, rule, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> DeleteRuleAsync(string id, CancellationToken ct) =>
        (await Rules.DeleteOneAsync(r => r.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;

    public async Task<IReadOnlyList<AutomationPost>> ListPostsAsync(
        string userId,
        string? fromDateKey,
        string? toDateKey,
        AutomationPostStatus? status,
        int limit,
        CancellationToken ct)
    {
        var f = Builders<AutomationPost>.Filter;
        var filter = f.Eq(p => p.UserId, userId);
        if (!string.IsNullOrWhiteSpace(fromDateKey))
            filter &= f.Gte(p => p.DateKey, fromDateKey);
        if (!string.IsNullOrWhiteSpace(toDateKey))
            filter &= f.Lte(p => p.DateKey, toDateKey);
        if (status.HasValue)
            filter &= f.Eq(p => p.Status, status.Value);

        return await Posts.Find(filter)
            .SortByDescending(p => p.DateKey)
            .ThenByDescending(p => p.CreatedAtUtc)
            .Limit(Math.Clamp(limit, 1, 1000))
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AutomationPost>> ListBufferSlotsAsync(
        string userId,
        string? fromDateKey,
        string? toDateKey,
        int limit,
        CancellationToken ct)
    {
        var f = Builders<AutomationPost>.Filter;
        var filter = f.Eq(p => p.UserId, userId);
        if (!string.IsNullOrWhiteSpace(fromDateKey))
            filter &= f.Gte(p => p.DateKey, fromDateKey);
        if (!string.IsNullOrWhiteSpace(toDateKey))
            filter &= f.Lte(p => p.DateKey, toDateKey);

        var proj = Builders<AutomationPost>.Projection
            .Include(p => p.Id)
            .Include(p => p.UserId)
            .Include(p => p.RuleId)
            .Include(p => p.RuleName)
            .Include(p => p.SourceType)
            .Include(p => p.DateKey)
            .Include(p => p.Fingerprint)
            .Include(p => p.Status)
            .Include(p => p.TargetChannelId)
            .Include(p => p.AttachedRenderJobId)
            .Include(p => p.AttachedHandoffId)
            .Include(p => p.ThumbnailStorageKey)
            .Include(p => p.ThumbnailFrameAtSeconds)
            .Include(p => p.ScheduledAtUtc)
            .Include(p => p.PublishedVideoId)
            .Include(p => p.CreatedAtUtc)
            .Include(p => p.UpdatedAtUtc);

        return await Posts.Find(filter)
            .Project<AutomationPost>(proj)
            .SortByDescending(p => p.DateKey)
            .ThenByDescending(p => p.CreatedAtUtc)
            .Limit(Math.Clamp(limit, 1, 1000))
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(
        IReadOnlyList<AutomationPostStatus> statuses,
        int limit,
        CancellationToken ct)
    {
        if (statuses.Count == 0) return [];
        var filter = Builders<AutomationPost>.Filter.In(p => p.Status, statuses);
        return await Posts.Find(filter)
            .SortBy(p => p.UpdatedAtUtc)
            .Limit(Math.Clamp(limit, 1, 1000))
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct) =>
        await Posts.Find(p => p.Id == id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

    public async Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct)
    {
        var matches = await Posts.Find(p => p.UserId == userId && p.Fingerprint == fingerprint)
            .Limit(20)
            .ToListAsync(ct)
            .ConfigureAwait(false);
        return AutomationPost.SelectPreferred(matches);
    }

    public Task UpsertPostAsync(AutomationPost post, CancellationToken ct) =>
        Posts.ReplaceOneAsync(p => p.Id == post.Id, post, new ReplaceOptions { IsUpsert = true }, ct);

    public async Task<bool> TryReplacePostIfStatusAsync(AutomationPost post, AutomationPostStatus expectedStatus, CancellationToken ct)
    {
        var result = await Posts.ReplaceOneAsync(
            p => p.Id == post.Id && p.Status == expectedStatus,
            post,
            new ReplaceOptions { IsUpsert = false },
            ct).ConfigureAwait(false);
        return result.MatchedCount > 0;
    }

    public async Task<bool> DeletePostAsync(string id, CancellationToken ct) =>
        (await Posts.DeleteOneAsync(p => p.Id == id, ct).ConfigureAwait(false)).DeletedCount > 0;
}
