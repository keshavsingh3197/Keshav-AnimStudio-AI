using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlDatabaseInitializer(
    ISqlConnectionFactory factory,
    ILogger<SqlDatabaseInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await EnsureDatabaseAndTablesAsync(cancellationToken).ConfigureAwait(false);
            logger.LogInformation("SQL Server database and tables verified successfully.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not initialize SQL Server tables on startup. Check that local SQL Server (SSMS/localhost) is running.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task EnsureDatabaseAndTablesAsync(CancellationToken ct)
    {
        var builder = new SqlConnectionStringBuilder(factory.ConnectionString);
        var targetDb = builder.InitialCatalog;

        if (!string.IsNullOrWhiteSpace(targetDb) && !string.Equals(targetDb, "master", StringComparison.OrdinalIgnoreCase))
        {
            // Connect to master to ensure the target database exists
            builder.InitialCatalog = "master";
            try
            {
                await using var masterConn = new SqlConnection(builder.ConnectionString);
                await masterConn.OpenAsync(ct).ConfigureAwait(false);

                // The name comes from configuration, but it is still parameterized and
                // QUOTENAME'd rather than spliced into the statement.
                const string checkDbSql = """
                    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = @Db)
                    BEGIN
                        DECLARE @Create NVARCHAR(400) = N'CREATE DATABASE ' + QUOTENAME(@Db);
                        EXEC (@Create);
                    END;
                    """;
                await using var createCmd = new SqlCommand(checkDbSql, masterConn);
                createCmd.Parameters.AddWithValue("@Db", targetDb);
                await createCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);

                await EnableReadCommittedSnapshotAsync(masterConn, targetDb, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Could not verify/create database via master connection; trying direct connection.");
            }
        }

        // Now connect to the database and run table schemas
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        var schemaPath = Path.Combine(AppContext.BaseDirectory, "Persistence", "SqlServer", "schema_sqlserver.sql");
        string sql;
        if (File.Exists(schemaPath))
        {
            sql = await File.ReadAllTextAsync(schemaPath, ct).ConfigureAwait(false);
        }
        else
        {
            // Fallback to embedded schema definitions
            sql = GetEmbeddedSchemaSql();
        }

        var statements = sql.Split(new[] { "GO\r\n", "GO\n", "GO" }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var stmt in statements)
        {
            var trimmed = stmt.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;

            await using var cmd = new SqlCommand(trimmed, conn);
            await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }

        // Schema column migrations
        const string migrationSql = """
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RenderJobs')
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('RenderJobs') AND name = 'Message')
                BEGIN
                    ALTER TABLE RenderJobs ADD Message NVARCHAR(500) NULL;
                END
            END;
            """;
        try
        {
            await using var migrationCmd = new SqlCommand(migrationSql, conn);
            await migrationCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Schema migration check completed with notice.");
        }

        // Folders were not persisted on SQL Server before AssetFolders existed, so assets can
        // point at folder ids that were never saved. Rendered exports (storage key under
        // renders/) are re-homed into a real "Exports" folder; anything else goes to the root.
        const string orphanFolderRepairSql = """
            ;WITH Orphans AS (
                SELECT a.ProjectId, JSON_VALUE(a.DataJson, '$.storageKey') AS StorageKey
                FROM Assets a
                WHERE JSON_VALUE(a.DataJson, '$.folderId') IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM AssetFolders f WHERE f.Id = JSON_VALUE(a.DataJson, '$.folderId'))
            )
            INSERT INTO AssetFolders (Id, ProjectId, Name, ParentId, CreatedAt)
            SELECT LOWER(REPLACE(CONVERT(NVARCHAR(36), NEWID()), '-', '')), p.ProjectId, N'Exports', NULL, SYSUTCDATETIME()
            FROM (SELECT DISTINCT ProjectId FROM Orphans WHERE StorageKey LIKE 'renders/%') p
            WHERE NOT EXISTS (SELECT 1 FROM AssetFolders f WHERE f.ProjectId = p.ProjectId AND f.Name = N'Exports');

            UPDATE a
            SET DataJson = JSON_MODIFY(a.DataJson, '$.folderId',
                (SELECT TOP 1 f.Id FROM AssetFolders f
                 WHERE f.ProjectId = a.ProjectId AND f.Name = N'Exports'
                   AND JSON_VALUE(a.DataJson, '$.storageKey') LIKE 'renders/%'
                 ORDER BY f.CreatedAt))
            FROM Assets a
            WHERE JSON_VALUE(a.DataJson, '$.folderId') IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM AssetFolders f WHERE f.Id = JSON_VALUE(a.DataJson, '$.folderId'));
            """;
        try
        {
            await using var repairCmd = new SqlCommand(orphanFolderRepairSql, conn);
            var repaired = await repairCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            if (repaired > 0)
                logger.LogInformation("Re-homed assets that referenced missing folders ({Rows} row(s) changed).", repaired);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not repair assets that reference missing folders.");
        }

        // Self-healing cleanup for any corrupted blank IDs inserted from previous runs
        const string cleanupSql = """
            DELETE FROM Projects WHERE Id = '' OR Id IS NULL;
            DELETE FROM Characters WHERE Id = '' OR Id IS NULL;
            DELETE FROM Scenes WHERE Id = '' OR Id IS NULL;
            DELETE FROM Assets WHERE Id = '' OR Id IS NULL;
            DELETE FROM Scripts WHERE Id = '' OR Id IS NULL;
            DELETE FROM TranscriptIngests WHERE Id = '' OR Id IS NULL;
            DELETE FROM RenderJobs WHERE Id = '' OR Id IS NULL;
            """;
        try
        {
            await using var cleanupCmd = new SqlCommand(cleanupSql, conn);
            await cleanupCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Database cleanup check completed with notice.");
        }
    }

    /// <summary>
    /// Turns on READ_COMMITTED_SNAPSHOT so reads see the last committed row version instead
    /// of waiting on writers. Without it, every API read of RenderJobs/Projects queued
    /// behind the worker's heartbeat and claim locks and timed out under load.
    /// <para>
    /// NO_WAIT: the switch needs the database to itself, and this must never kill someone
    /// else's session (an open SSMS window, say). If it cannot get exclusive access it
    /// fails fast and is retried on the next start.
    /// </para>
    /// </summary>
    private async Task EnableReadCommittedSnapshotAsync(SqlConnection masterConn, string targetDb, CancellationToken ct)
    {
        // NO_WAIT alone does not stop the ALTER queueing for the exclusive database lock, so
        // without LOCK_TIMEOUT it hangs until the command timeout whenever SSMS is connected.
        const string sql = """
            SET LOCK_TIMEOUT 5000;
            IF EXISTS (SELECT 1 FROM sys.databases WHERE name = @Db AND is_read_committed_snapshot_on = 0)
            BEGIN
                DECLARE @Alter NVARCHAR(400) = N'ALTER DATABASE ' + QUOTENAME(@Db) + N' SET READ_COMMITTED_SNAPSHOT ON WITH NO_WAIT';
                EXEC (@Alter);
                SELECT 1;
            END
            ELSE
                SELECT 0;
            """;
        // Idle connections in this process's own pool count as "other users" too; dropping
        // them is safe (they reopen on demand) and leaves only foreign sessions to block us.
        SqlConnection.ClearAllPools();

        try
        {
            await using var cmd = new SqlCommand(sql, masterConn) { CommandTimeout = 15 };
            cmd.Parameters.AddWithValue("@Db", targetDb);
            var changed = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
            if (changed is 1)
                logger.LogInformation("Enabled READ_COMMITTED_SNAPSHOT on {Database}.", targetDb);
        }
        catch (SqlException ex) when (IsBlockedByOtherSessions(ex))
        {
            // Expected while SSMS or another app instance has the database open - no stack trace needed.
            var holders = await DescribeOtherSessionsAsync(masterConn, targetDb, ct).ConfigureAwait(false);
            logger.LogWarning(
                "READ_COMMITTED_SNAPSHOT is not yet enabled on {Database}: other sessions have it open ({Holders}). " +
                "Reads may block behind render-job writes; close those connections and restart to enable it.",
                targetDb, holders);
        }
        catch (SqlException ex)
        {
            logger.LogWarning(ex, "Could not enable READ_COMMITTED_SNAPSHOT on {Database}.", targetDb);
        }
    }

    /// <summary>
    /// The ways SQL Server reports "someone else has the database": 5070 (other users), 5061 and
    /// 1222 (lock not granted / lock timeout), and -2 (client command timeout while waiting).
    /// </summary>
    private static bool IsBlockedByOtherSessions(SqlException ex) =>
        ex.Number is 5070 or 5061 or 1222 or -2;

    /// <summary>Names the programs holding the database open, so the warning says what to close.</summary>
    private async Task<string> DescribeOtherSessionsAsync(SqlConnection masterConn, string targetDb, CancellationToken ct)
    {
        const string sql = """
            SELECT COALESCE(NULLIF(program_name, ''), 'unknown program') + ' on ' + COALESCE(host_name, '?')
                   + ' (' + CAST(COUNT(*) AS NVARCHAR(10)) + ')'
            FROM sys.dm_exec_sessions
            WHERE database_id = DB_ID(@Db) AND session_id <> @@SPID
            GROUP BY program_name, host_name
            """;
        try
        {
            await using var cmd = new SqlCommand(sql, masterConn);
            cmd.Parameters.AddWithValue("@Db", targetDb);
            var names = new List<string>();
            await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
            while (await reader.ReadAsync(ct).ConfigureAwait(false))
                names.Add(reader.GetString(0));
            return names.Count > 0 ? string.Join("; ", names) : "none visible";
        }
        catch (SqlException ex)
        {
            // Listing sessions needs VIEW SERVER STATE; without it the warning is still useful.
            logger.LogDebug(ex, "Could not list sessions holding {Database}.", targetDb);
            return "session list needs VIEW SERVER STATE";
        }
    }

    private static string GetEmbeddedSchemaSql() =>
        """
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
        BEGIN
            CREATE TABLE Projects (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                UserId NVARCHAR(100) NOT NULL,
                Name NVARCHAR(200) NOT NULL,
                Status INT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL,
                UpdatedAt DATETIME2 NOT NULL,
                Description NVARCHAR(MAX) NULL,
                SettingsJson NVARCHAR(MAX) NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Projects_UserId ON Projects (UserId, UpdatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Characters')
        BEGIN
            CREATE TABLE Characters (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                Name NVARCHAR(200) NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Characters_ProjectId ON Characters (ProjectId, Name ASC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Scenes')
        BEGIN
            CREATE TABLE Scenes (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                SceneNumber INT NOT NULL,
                OrderKey NVARCHAR(100) NOT NULL,
                Status INT NOT NULL DEFAULT 0,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Scenes_ProjectId_Status ON Scenes (ProjectId, Status, OrderKey ASC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assets')
        BEGIN
            CREATE TABLE Assets (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                Name NVARCHAR(300) NOT NULL,
                Kind INT NOT NULL,
                CreatedAt DATETIME2 NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Assets_ProjectId ON Assets (ProjectId, CreatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AssetFolders')
        BEGIN
            CREATE TABLE AssetFolders (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                Name NVARCHAR(100) NOT NULL,
                ParentId NVARCHAR(64) NULL,
                CreatedAt DATETIME2 NOT NULL
            );
            CREATE INDEX IX_AssetFolders_ProjectId ON AssetFolders (ProjectId, CreatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectEdits')
        BEGIN
            CREATE TABLE ProjectEdits (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                UserId NVARCHAR(100) NOT NULL,
                UpdatedAt DATETIME2 NOT NULL,
                MetaJson NVARCHAR(MAX) NOT NULL,
                DraftJson NVARCHAR(MAX) NULL
            );
            CREATE INDEX IX_ProjectEdits_ProjectId ON ProjectEdits (ProjectId, UpdatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Scripts')
        BEGIN
            CREATE TABLE Scripts (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                CreatedAt DATETIME2 NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Scripts_ProjectId ON Scripts (ProjectId, CreatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TranscriptIngests')
        BEGIN
            CREATE TABLE TranscriptIngests (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                IdempotencyKey NVARCHAR(100) NULL,
                SourceUrlHash NVARCHAR(100) NULL,
                CreatedAt DATETIME2 NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_Ingests_ProjectId ON TranscriptIngests (ProjectId, CreatedAt DESC);
            CREATE INDEX IX_Ingests_ProjectId_Idempotency ON TranscriptIngests (ProjectId, IdempotencyKey);
            CREATE INDEX IX_Ingests_ProjectId_SourceUrlHash ON TranscriptIngests (ProjectId, SourceUrlHash, CreatedAt DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RenderJobs')
        BEGIN
            CREATE TABLE RenderJobs (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProjectId NVARCHAR(64) NOT NULL,
                Status INT NOT NULL DEFAULT 0,
                LeaseOwner NVARCHAR(100) NULL,
                LeaseExpiresAt DATETIME2 NULL,
                HeartbeatAt DATETIME2 NULL,
                StartedAt DATETIME2 NULL,
                CreatedAt DATETIME2 NOT NULL,
                Attempts INT NOT NULL DEFAULT 0,
                CurrentStage INT NOT NULL DEFAULT 0,
                Progress INT NOT NULL DEFAULT 0,
                Message NVARCHAR(500) NULL,
                ScenesDone INT NOT NULL DEFAULT 0,
                ScenesTotal INT NOT NULL DEFAULT 0,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_RenderJobs_ProjectId ON RenderJobs (ProjectId, CreatedAt DESC);
            CREATE INDEX IX_RenderJobs_Queue ON RenderJobs (Attempts, Status, LeaseExpiresAt, CreatedAt ASC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AiUsage')
        BEGIN
            CREATE TABLE AiUsage (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                ProviderId NVARCHAR(100) NOT NULL,
                DayBucket NVARCHAR(20) NOT NULL,
                Capability INT NOT NULL,
                Outcome INT NOT NULL,
                RequestCount INT NOT NULL DEFAULT 1,
                Units BIGINT NOT NULL DEFAULT 0,
                AtUtc DATETIME2 NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_AiUsage_DayBucket ON AiUsage (DayBucket, ProviderId, Capability, Outcome);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AiCredentials')
        BEGIN
            CREATE TABLE AiCredentials (
                ProviderId NVARCHAR(100) NOT NULL PRIMARY KEY,
                DataJson NVARCHAR(MAX) NOT NULL
            );
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PromptTemplates')
        BEGIN
            CREATE TABLE PromptTemplates (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                TemplateKey NVARCHAR(100) NOT NULL,
                Version INT NOT NULL DEFAULT 1,
                Enabled BIT NOT NULL DEFAULT 1,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_PromptTemplates_Key_Version ON PromptTemplates (TemplateKey, Version DESC);
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AiSettings')
        BEGIN
            CREATE TABLE AiSettings (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                DataJson NVARCHAR(MAX) NOT NULL
            );
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminAudit')
        BEGIN
            CREATE TABLE AdminAudit (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                AtUtc DATETIME2 NOT NULL,
                DataJson NVARCHAR(MAX) NOT NULL
            );
            CREATE INDEX IX_AdminAudit_AtUtc ON AdminAudit (AtUtc DESC);
        END;
        """;
}

