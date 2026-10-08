-- AnimStudio SQL Server Schema (Local SSMS / SQL Server on localhost)
-- Supports dual-database mode: SqlServer and Mongo with 100% document fidelity

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

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LiveStreamKeys')
BEGIN
    CREATE TABLE LiveStreamKeys (
        Id NVARCHAR(200) NOT NULL PRIMARY KEY,
        DataJson NVARCHAR(MAX) NOT NULL
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'YouTubeConnections')
BEGIN
    CREATE TABLE YouTubeConnections (
        Id NVARCHAR(300) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(200) NOT NULL,
        DataJson NVARCHAR(MAX) NOT NULL
    );
    CREATE INDEX IX_YouTubeConnections_UserId ON YouTubeConnections (UserId);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VoiceProfiles')
BEGIN
    CREATE TABLE VoiceProfiles (
        Id NVARCHAR(64) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(200) NOT NULL,
        DataJson NVARCHAR(MAX) NOT NULL
    );
    CREATE INDEX IX_VoiceProfiles_UserId ON VoiceProfiles (UserId);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WebSettings')
BEGIN
    CREATE TABLE WebSettings (
        Id NVARCHAR(200) NOT NULL PRIMARY KEY,
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
