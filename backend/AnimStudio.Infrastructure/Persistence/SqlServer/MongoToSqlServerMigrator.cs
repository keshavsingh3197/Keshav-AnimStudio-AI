using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;
using KeshavSingh.Mongo.NoSql;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed record MigrationCollectionResult(string CollectionName, int MigratedCount, int SkippedCount);

public sealed record MigrationReport(
    bool Success,
    string Message,
    IReadOnlyList<MigrationCollectionResult> Details);

public sealed class MongoToSqlServerMigrator(
    MongoDbService mongo,
    ISqlConnectionFactory sqlFactory,
    ILogger<MongoToSqlServerMigrator> logger)
{
    public async Task<MigrationReport> MigrateAllAsync(CancellationToken ct = default)
    {
        var results = new List<MigrationCollectionResult>();

        try
        {
            await using var conn = await sqlFactory.OpenConnectionAsync(ct).ConfigureAwait(false);

            // 1. Projects
            results.Add(await MigrateProjectsAsync(conn, ct).ConfigureAwait(false));

            // 2. Characters
            results.Add(await MigrateCharactersAsync(conn, ct).ConfigureAwait(false));

            // 3. Scenes
            results.Add(await MigrateScenesAsync(conn, ct).ConfigureAwait(false));

            // 4. Assets
            results.Add(await MigrateAssetsAsync(conn, ct).ConfigureAwait(false));

            // 5. Scripts
            results.Add(await MigrateScriptsAsync(conn, ct).ConfigureAwait(false));

            // 6. TranscriptIngests
            results.Add(await MigrateIngestsAsync(conn, ct).ConfigureAwait(false));

            // 7. RenderJobs
            results.Add(await MigrateRenderJobsAsync(conn, ct).ConfigureAwait(false));

            // 8. AiUsage
            results.Add(await MigrateAiUsageAsync(conn, ct).ConfigureAwait(false));

            // 9. AiCredentials
            results.Add(await MigrateAiCredentialsAsync(conn, ct).ConfigureAwait(false));

            // 10. PromptTemplates
            results.Add(await MigratePromptTemplatesAsync(conn, ct).ConfigureAwait(false));

            // 11. AiSettings
            results.Add(await MigrateAiSettingsAsync(conn, ct).ConfigureAwait(false));

            // 12. AdminAudit
            results.Add(await MigrateAdminAuditAsync(conn, ct).ConfigureAwait(false));

            var totalMigrated = results.Sum(r => r.MigratedCount);
            return new MigrationReport(
                Success: true,
                Message: $"Migration completed successfully. Migrated {totalMigrated} records across {results.Count} collections.",
                Details: results);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to migrate data from MongoDB to SQL Server.");
            return new MigrationReport(
                Success: false,
                Message: $"Migration failed: {ex.Message}",
                Details: results);
        }
    }

    private async Task<MigrationCollectionResult> MigrateProjectsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<Project>(MongoCollections.Projects);
        var items = await collection.Find(FilterDefinition<Project>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM Projects WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO Projects (Id, UserId, Name, Status, CreatedAt, UpdatedAt, Description, SettingsJson, DataJson)
                VALUES (@Id, @UserId, @Name, @Status, @CreatedAt, @UpdatedAt, @Description, @SettingsJson, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@UserId", item.UserId);
            insertCmd.Parameters.AddWithValue("@Name", item.Name);
            insertCmd.Parameters.AddWithValue("@Status", (int)item.Status);
            insertCmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@UpdatedAt", item.UpdatedAt);
            insertCmd.Parameters.AddWithValue("@Description", (object?)item.Description ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@SettingsJson", SqlJson.Serialize(item.Settings));
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Projects, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateCharactersAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<Character>(MongoCollections.Characters);
        var items = await collection.Find(FilterDefinition<Character>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM Characters WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = "INSERT INTO Characters (Id, ProjectId, Name, DataJson) VALUES (@Id, @ProjectId, @Name, @DataJson)";
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@Name", item.Name);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Characters, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateScenesAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<Scene>(MongoCollections.Scenes);
        var items = await collection.Find(FilterDefinition<Scene>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM Scenes WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO Scenes (Id, ProjectId, SceneNumber, OrderKey, Status, DataJson)
                VALUES (@Id, @ProjectId, @SceneNumber, @OrderKey, @Status, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@SceneNumber", item.SceneNumber);
            insertCmd.Parameters.AddWithValue("@OrderKey", item.OrderKey);
            insertCmd.Parameters.AddWithValue("@Status", (int)item.Status);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Scenes, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateAssetsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<Asset>(MongoCollections.Assets);
        var items = await collection.Find(FilterDefinition<Asset>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM Assets WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO Assets (Id, ProjectId, Name, Kind, CreatedAt, DataJson)
                VALUES (@Id, @ProjectId, @Name, @Kind, @CreatedAt, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@Name", item.Name);
            insertCmd.Parameters.AddWithValue("@Kind", (int)item.Kind);
            insertCmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Assets, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateScriptsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<Script>(MongoCollections.Scripts);
        var items = await collection.Find(FilterDefinition<Script>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM Scripts WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = "INSERT INTO Scripts (Id, ProjectId, CreatedAt, DataJson) VALUES (@Id, @ProjectId, @CreatedAt, @DataJson)";
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Scripts, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateIngestsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<TranscriptIngest>(MongoCollections.Ingests);
        var items = await collection.Find(FilterDefinition<TranscriptIngest>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM TranscriptIngests WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO TranscriptIngests (Id, ProjectId, IdempotencyKey, SourceUrlHash, CreatedAt, DataJson)
                VALUES (@Id, @ProjectId, @IdempotencyKey, @SourceUrlHash, @CreatedAt, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@IdempotencyKey", (object?)item.IdempotencyKey ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@SourceUrlHash", (object?)item.SourceUrlHash ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.Ingests, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateRenderJobsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<RenderJob>(MongoCollections.RenderJobs);
        var items = await collection.Find(FilterDefinition<RenderJob>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM RenderJobs WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO RenderJobs (
                    Id, ProjectId, Status, LeaseOwner, LeaseExpiresAt, HeartbeatAt, StartedAt,
                    CreatedAt, Attempts, CurrentStage, Progress, ScenesDone, ScenesTotal, DataJson
                    CreatedAt, Attempts, CurrentStage, Progress, Message, ScenesDone, ScenesTotal, DataJson
                ) VALUES (
                    @Id, @ProjectId, @Status, @LeaseOwner, @LeaseExpiresAt, @HeartbeatAt, @StartedAt,
                    @CreatedAt, @Attempts, @CurrentStage, @Progress, @ScenesDone, @ScenesTotal, @DataJson
                    @CreatedAt, @Attempts, @CurrentStage, @Progress, @Message, @ScenesDone, @ScenesTotal, @DataJson
                )
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProjectId", item.ProjectId);
            insertCmd.Parameters.AddWithValue("@Status", (int)item.Status);
            insertCmd.Parameters.AddWithValue("@LeaseOwner", (object?)item.LeaseOwner ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@LeaseExpiresAt", (object?)item.LeaseExpiresAt ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@HeartbeatAt", (object?)item.HeartbeatAt ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@StartedAt", (object?)item.StartedAt ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@CreatedAt", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@Attempts", item.Attempts);
            insertCmd.Parameters.AddWithValue("@CurrentStage", (int)item.CurrentStage);
            insertCmd.Parameters.AddWithValue("@Progress", item.Progress);
            insertCmd.Parameters.AddWithValue("@Message", (object?)item.Message ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@ScenesDone", item.ScenesDone);
            insertCmd.Parameters.AddWithValue("@ScenesTotal", item.ScenesTotal);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.RenderJobs, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateAiUsageAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<AiUsageRecord>(MongoCollections.AiUsage);
        var items = await collection.Find(FilterDefinition<AiUsageRecord>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM AiUsage WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO AiUsage (Id, ProviderId, DayBucket, Capability, Outcome, RequestCount, Units, AtUtc, DataJson)
                VALUES (@Id, @ProviderId, @DayBucket, @Capability, @Outcome, @RequestCount, @Units, @AtUtc, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@ProviderId", item.ProviderId);
            insertCmd.Parameters.AddWithValue("@DayBucket", item.DayBucket);
            insertCmd.Parameters.AddWithValue("@Capability", (int)item.Capability);
            insertCmd.Parameters.AddWithValue("@Outcome", (int)item.Outcome);
            insertCmd.Parameters.AddWithValue("@RequestCount", item.RequestCount);
            insertCmd.Parameters.AddWithValue("@Units", item.Units);
            insertCmd.Parameters.AddWithValue("@AtUtc", item.CreatedAt);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.AiUsage, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateAiCredentialsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<AiCredential>(MongoCollections.AiCredentials);
        var items = await collection.Find(FilterDefinition<AiCredential>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string sql = """
                IF NOT EXISTS (SELECT 1 FROM AiCredentials WHERE ProviderId = @ProviderId)
                    INSERT INTO AiCredentials (ProviderId, DataJson) VALUES (@ProviderId, @DataJson)
                """;
            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProviderId", item.ProviderId);
            cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            var affected = await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            if (affected > 0) migrated++; else skipped++;
        }

        return new MigrationCollectionResult(MongoCollections.AiCredentials, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigratePromptTemplatesAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<PromptTemplate>(MongoCollections.PromptTemplates);
        var items = await collection.Find(FilterDefinition<PromptTemplate>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM PromptTemplates WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = """
                INSERT INTO PromptTemplates (Id, TemplateKey, Version, Enabled, DataJson)
                VALUES (@Id, @TemplateKey, @Version, @Enabled, @DataJson)
                """;
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@TemplateKey", item.TemplateKey);
            insertCmd.Parameters.AddWithValue("@Version", item.Version);
            insertCmd.Parameters.AddWithValue("@Enabled", item.Enabled);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.PromptTemplates, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateAiSettingsAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<AiSettings>(MongoCollections.AiSettings);
        var items = await collection.Find(FilterDefinition<AiSettings>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string sql = """
                IF NOT EXISTS (SELECT 1 FROM AiSettings WHERE Id = @Id)
                    INSERT INTO AiSettings (Id, DataJson) VALUES (@Id, @DataJson)
                """;
            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id", item.Id);
            cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            var affected = await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            if (affected > 0) migrated++; else skipped++;
        }

        return new MigrationCollectionResult(MongoCollections.AiSettings, migrated, skipped);
    }

    private async Task<MigrationCollectionResult> MigrateAdminAuditAsync(SqlConnection conn, CancellationToken ct)
    {
        var collection = mongo.GetCollection<AdminAuditEntry>(MongoCollections.AdminAudit);
        var items = await collection.Find(FilterDefinition<AdminAuditEntry>.Empty).ToListAsync(ct).ConfigureAwait(false);
        int migrated = 0, skipped = 0;

        foreach (var item in items)
        {
            const string checkSql = "SELECT COUNT(1) FROM AdminAudit WHERE Id = @Id";
            await using var checkCmd = new SqlCommand(checkSql, conn);
            checkCmd.Parameters.AddWithValue("@Id", item.Id);
            if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync(ct).ConfigureAwait(false)) > 0)
            {
                skipped++;
                continue;
            }

            const string insertSql = "INSERT INTO AdminAudit (Id, AtUtc, DataJson) VALUES (@Id, @AtUtc, @DataJson)";
            await using var insertCmd = new SqlCommand(insertSql, conn);
            insertCmd.Parameters.AddWithValue("@Id", item.Id);
            insertCmd.Parameters.AddWithValue("@AtUtc", item.AtUtc);
            insertCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(item));
            await insertCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            migrated++;
        }

        return new MigrationCollectionResult(MongoCollections.AdminAudit, migrated, skipped);
    }
}
