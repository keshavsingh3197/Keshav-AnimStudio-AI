using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Mongo.NoSql;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public enum SyncDirection
{
    MongoToSql,
    SqlToMongo,
    Both
}

public sealed record DriveSyncResult(string Name, int Copied, int Updated, int Skipped);

public sealed record DriveSyncReport(bool Success, string Message, IReadOnlyList<DriveSyncResult> Details);

/// <summary>
/// Two-way sync of the drive/topic/library bookkeeping (asset folders, topics, plan items and
/// Drive copy records) between MongoDB and SQL Server. Missing records are copied; topics and
/// plan items that exist on both sides keep whichever was updated last.
/// </summary>
public sealed class DriveDataSyncService(
    MongoDbService mongo,
    ISqlConnectionFactory sqlFactory,
    ICurrentUser user,
    ILogger<DriveDataSyncService> logger)
{
    private const int PageLimit = 100_000;

    public async Task<DriveSyncReport> SyncAsync(SyncDirection direction, CancellationToken ct = default)
    {
        var results = new List<DriveSyncResult>();
        try
        {
            var sql = new Side(
                new SqlProjectRepository(sqlFactory),
                new SqlAssetFolderRepository(sqlFactory),
                new SqlContentTopicRepository(sqlFactory),
                new SqlContentPlanItemRepository(sqlFactory),
                new SqlPhoneHandoffRepository(sqlFactory));
            var mg = new Side(
                new MongoProjectRepository(mongo),
                new MongoAssetFolderRepository(mongo),
                new MongoContentTopicRepository(mongo),
                new MongoContentPlanItemRepository(mongo),
                new MongoPhoneHandoffRepository(mongo));

            if (direction is SyncDirection.MongoToSql or SyncDirection.Both)
                await CopyAsync("Mongo→SQL", mg, sql, results, ct).ConfigureAwait(false);
            if (direction is SyncDirection.SqlToMongo or SyncDirection.Both)
                await CopyAsync("SQL→Mongo", sql, mg, results, ct).ConfigureAwait(false);

            var total = results.Sum(r => r.Copied + r.Updated);
            return new DriveSyncReport(true, $"Sync complete. {total} records copied or updated.", results);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            logger.LogError(ex, "Drive data sync failed.");
            return new DriveSyncReport(false, $"Sync failed: {ex.Message}", results);
        }
    }

    private async Task CopyAsync(string label, Side from, Side to, List<DriveSyncResult> results, CancellationToken ct)
    {
        var userId = user.UserId;

        // Projects first: folders are listed per project, and are copied only for projects both sides have.
        var fromProjects = await from.Projects.ListAsync(userId, ct).ConfigureAwait(false);
        var toProjectIds = (await to.Projects.ListAsync(userId, ct).ConfigureAwait(false)).Select(p => p.Id).ToHashSet();

        int copied = 0, skipped = 0;
        foreach (var project in fromProjects)
        {
            if (!toProjectIds.Contains(project.Id)) { skipped++; continue; }
            var existing = (await to.Folders.ListByProjectAsync(project.Id, ct).ConfigureAwait(false)).Select(f => f.Id).ToHashSet();
            // Parents before children, so a parent-linked folder never lands first.
            var folders = await from.Folders.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);
            foreach (var folder in folders.OrderBy(f => f.ParentId is null ? 0 : 1).ThenBy(f => f.CreatedAt))
            {
                if (existing.Contains(folder.Id)) { skipped++; continue; }
                await to.Folders.InsertAsync(folder, ct).ConfigureAwait(false);
                copied++;
            }
        }
        results.Add(new DriveSyncResult($"{label} folders", copied, 0, skipped));

        copied = 0; int updated = 0; skipped = 0;
        var topics = await from.Topics.ListByUserAsync(userId, ct).ConfigureAwait(false);
        foreach (var topic in topics)
        {
            var other = await to.Topics.GetAsync(topic.Id, ct).ConfigureAwait(false);
            if (other is null) copied++;
            else if (topic.UpdatedAt > other.UpdatedAt) updated++;
            else { skipped++; continue; }
            await to.Topics.UpsertAsync(topic, ct).ConfigureAwait(false);
        }
        results.Add(new DriveSyncResult($"{label} topics", copied, updated, skipped));

        copied = 0; updated = 0; skipped = 0;
        foreach (var topic in topics)
        {
            var items = await from.PlanItems.ListByTopicAsync(topic.Id, PageLimit, ct).ConfigureAwait(false);
            foreach (var item in items)
            {
                var other = await to.PlanItems.GetAsync(item.Id, ct).ConfigureAwait(false);
                if (other is null) copied++;
                else if (item.UpdatedAt > other.UpdatedAt) updated++;
                else { skipped++; continue; }
                await to.PlanItems.UpsertAsync(item, ct).ConfigureAwait(false);
            }
        }
        results.Add(new DriveSyncResult($"{label} plan items", copied, updated, skipped));

        copied = 0; updated = 0; skipped = 0;
        var handoffs = await from.Handoffs.ListByUserAsync(userId, null, PageLimit, ct).ConfigureAwait(false);
        foreach (var handoff in handoffs)
        {
            var other = await to.Handoffs.GetAsync(handoff.Id, ct).ConfigureAwait(false);
            if (other is null) copied++;
            else if (IsAhead(handoff, other)) updated++;
            else { skipped++; continue; }
            await to.Handoffs.UpsertAsync(handoff, ct).ConfigureAwait(false);
        }
        results.Add(new DriveSyncResult($"{label} drive copies", copied, updated, skipped));
    }

    /// <summary>
    /// Copy records have no update time, so the one that got further wins: a copy that reached
    /// Drive (has a file id) beats one that didn't - otherwise a record whose send failed on
    /// one server would hide the Drive file the other server uploaded - and a deletion, once
    /// either side made it, sticks. A record with a Drive file is never replaced by one without.
    /// </summary>
    private static bool IsAhead(PhoneHandoff source, PhoneHandoff target)
    {
        if (target.DriveFileId is not null && source.DriveFileId is null) return false;
        if (source.DriveFileId is not null && target.DriveFileId is null) return true;
        if (source.State == PhoneHandoffState.Cancelled && target.State != PhoneHandoffState.Cancelled) return true;
        if (target.State == PhoneHandoffState.Cancelled) return false;
        return LastActivity(source) > LastActivity(target);
    }

    private static DateTime LastActivity(PhoneHandoff h) =>
        new DateTime?[] { h.CreatedAt, h.SentAt, h.LastCheckedAt, h.UsedAt, h.AppliedAt }.Max(d => d ?? DateTime.MinValue);

    private sealed record Side(
        IProjectRepository Projects,
        IAssetFolderRepository Folders,
        IContentTopicRepository Topics,
        IContentPlanItemRepository PlanItems,
        IPhoneHandoffRepository Handoffs);
}
