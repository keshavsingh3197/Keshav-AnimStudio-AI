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

                var checkDbSql = $"IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '{targetDb}') CREATE DATABASE [{targetDb}];";
                await using var createCmd = new SqlCommand(checkDbSql, masterConn);
                await createCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
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

        // Self-healing cleanup for any corrupted blank IDs inserted from previous runs
        const string cleanupSql = """
            DELETE FROM Projects WHERE Id = '' OR Id IS NULL;
            DELETE FROM Characters WHERE Id = '' OR Id IS NULL;
            DELETE FROM Scenes WHERE Id = '' OR Id IS NULL;
            DELETE FROM Assets WHERE Id = '' OR Id IS NULL;
            DELETE FROM Scripts WHERE Id = '' OR Id IS NULL;
            DELETE FROM TranscriptIngests WHERE Id = '' OR Id IS NULL;
            DELETE FROM RenderJobs WHERE JobId = '' OR JobId IS NULL;
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

