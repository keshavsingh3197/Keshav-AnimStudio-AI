using System.Data;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;
using Microsoft.Data.SqlClient;
using MongoDB.Bson;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

internal static class SqlJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Options);
    public static T? Deserialize<T>(string json) => JsonSerializer.Deserialize<T>(json, Options);
}

public sealed class SqlProjectRepository(ISqlConnectionFactory factory) : IProjectRepository
{
    public async Task<Project?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Projects WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<Project>(json) : null;
    }

    public async Task<IReadOnlyList<Project>> ListAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Projects WHERE UserId = @UserId ORDER BY UpdatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<Project>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Project>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(Project project, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(project.Id))
            project.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO Projects (Id, UserId, Name, Status, CreatedAt, UpdatedAt, Description, SettingsJson, DataJson)
            VALUES (@Id, @UserId, @Name, @Status, @CreatedAt, @UpdatedAt, @Description, @SettingsJson, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", project.Id);
        cmd.Parameters.AddWithValue("@UserId", project.UserId);
        cmd.Parameters.AddWithValue("@Name", project.Name);
        cmd.Parameters.AddWithValue("@Status", (int)project.Status);
        cmd.Parameters.AddWithValue("@CreatedAt", project.CreatedAt);
        cmd.Parameters.AddWithValue("@UpdatedAt", project.UpdatedAt);
        cmd.Parameters.AddWithValue("@Description", (object?)project.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@SettingsJson", SqlJson.Serialize(project.Settings));
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(project));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(Project project, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE Projects
            SET Name = @Name, Status = @Status, UpdatedAt = @UpdatedAt, Description = @Description,
                SettingsJson = @SettingsJson, DataJson = @DataJson
            WHERE Id = @Id
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", project.Id);
        cmd.Parameters.AddWithValue("@Name", project.Name);
        cmd.Parameters.AddWithValue("@Status", (int)project.Status);
        cmd.Parameters.AddWithValue("@UpdatedAt", project.UpdatedAt);
        cmd.Parameters.AddWithValue("@Description", (object?)project.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@SettingsJson", SqlJson.Serialize(project.Settings));
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(project));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM Projects WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlCharacterRepository(ISqlConnectionFactory factory) : ICharacterRepository
{
    public async Task<Character?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Characters WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<Character>(json) : null;
    }

    public async Task<IReadOnlyList<Character>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Characters WHERE ProjectId = @ProjectId ORDER BY Name ASC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<Character>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Character>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(Character character, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(character.Id))
            character.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO Characters (Id, ProjectId, Name, DataJson)
            VALUES (@Id, @ProjectId, @Name, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", character.Id);
        cmd.Parameters.AddWithValue("@ProjectId", character.ProjectId);
        cmd.Parameters.AddWithValue("@Name", character.Name);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(character));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(Character character, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE Characters
            SET Name = @Name, DataJson = @DataJson
            WHERE Id = @Id
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", character.Id);
        cmd.Parameters.AddWithValue("@Name", character.Name);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(character));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM Characters WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlSceneRepository(ISqlConnectionFactory factory) : ISceneRepository
{
    public async Task<Scene?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Scenes WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<Scene>(json) : null;
    }

    public async Task<IReadOnlyList<Scene>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT DataJson FROM Scenes
            WHERE ProjectId = @ProjectId AND Status = 0
            ORDER BY OrderKey ASC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<Scene>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Scene>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(Scene scene, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(scene.Id))
            scene.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO Scenes (Id, ProjectId, SceneNumber, OrderKey, Status, DataJson)
            VALUES (@Id, @ProjectId, @SceneNumber, @OrderKey, @Status, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", scene.Id);
        cmd.Parameters.AddWithValue("@ProjectId", scene.ProjectId);
        cmd.Parameters.AddWithValue("@SceneNumber", scene.SceneNumber);
        cmd.Parameters.AddWithValue("@OrderKey", scene.OrderKey);
        cmd.Parameters.AddWithValue("@Status", (int)scene.Status);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(scene));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task InsertManyAsync(IEnumerable<Scene> scenes, CancellationToken ct)
    {
        var list = scenes.ToList();
        if (list.Count == 0) return;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var tx = conn.BeginTransaction();

        const string sql = """
            INSERT INTO Scenes (Id, ProjectId, SceneNumber, OrderKey, Status, DataJson)
            VALUES (@Id, @ProjectId, @SceneNumber, @OrderKey, @Status, @DataJson)
            """;

        foreach (var scene in list)
        {
            await using var cmd = new SqlCommand(sql, conn, tx);
            cmd.Parameters.AddWithValue("@Id", scene.Id);
            cmd.Parameters.AddWithValue("@ProjectId", scene.ProjectId);
            cmd.Parameters.AddWithValue("@SceneNumber", scene.SceneNumber);
            cmd.Parameters.AddWithValue("@OrderKey", scene.OrderKey);
            cmd.Parameters.AddWithValue("@Status", (int)scene.Status);
            cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(scene));
            await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }

        await tx.CommitAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(Scene scene, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE Scenes
            SET SceneNumber = @SceneNumber, OrderKey = @OrderKey, Status = @Status, DataJson = @DataJson
            WHERE Id = @Id
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", scene.Id);
        cmd.Parameters.AddWithValue("@SceneNumber", scene.SceneNumber);
        cmd.Parameters.AddWithValue("@OrderKey", scene.OrderKey);
        cmd.Parameters.AddWithValue("@Status", (int)scene.Status);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(scene));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM Scenes WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM Scenes WHERE ProjectId = @ProjectId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlAssetRepository(ISqlConnectionFactory factory) : IAssetRepository
{
    public async Task<Asset?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Assets WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<Asset>(json) : null;
    }

    public async Task<IReadOnlyList<Asset>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Assets WHERE ProjectId = @ProjectId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<Asset>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Asset>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<IReadOnlyList<Asset>> GetManyAsync(IEnumerable<string> ids, CancellationToken ct)
    {
        var idList = ids.Where(i => !string.IsNullOrWhiteSpace(i)).Distinct().ToList();
        if (idList.Count == 0) return [];

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        var paramNames = idList.Select((_, idx) => $"@p{idx}").ToArray();
        var sql = $"SELECT DataJson FROM Assets WHERE Id IN ({string.Join(",", paramNames)})";

        await using var cmd = new SqlCommand(sql, conn);
        for (var i = 0; i < idList.Count; i++)
        {
            cmd.Parameters.AddWithValue(paramNames[i], idList[i]);
        }

        var list = new List<Asset>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Asset>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(Asset asset, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(asset.Id))
            asset.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO Assets (Id, ProjectId, Name, Kind, CreatedAt, DataJson)
            VALUES (@Id, @ProjectId, @Name, @Kind, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", asset.Id);
        cmd.Parameters.AddWithValue("@ProjectId", asset.ProjectId);
        cmd.Parameters.AddWithValue("@Name", asset.Name);
        cmd.Parameters.AddWithValue("@Kind", (int)asset.Kind);
        cmd.Parameters.AddWithValue("@CreatedAt", asset.CreatedAt);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(asset));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(Asset asset, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE Assets
            SET Name = @Name, Kind = @Kind, DataJson = @DataJson
            WHERE Id = @Id
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", asset.Id);
        cmd.Parameters.AddWithValue("@Name", asset.Name);
        cmd.Parameters.AddWithValue("@Kind", (int)asset.Kind);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(asset));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM Assets WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlScriptRepository(ISqlConnectionFactory factory) : IScriptRepository
{
    public async Task<Script?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Scripts WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<Script>(json) : null;
    }

    public async Task<IReadOnlyList<Script>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM Scripts WHERE ProjectId = @ProjectId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<Script>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<Script>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(Script script, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(script.Id))
            script.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO Scripts (Id, ProjectId, CreatedAt, DataJson)
            VALUES (@Id, @ProjectId, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", script.Id);
        cmd.Parameters.AddWithValue("@ProjectId", script.ProjectId);
        cmd.Parameters.AddWithValue("@CreatedAt", script.CreatedAt);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(script));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(Script script, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "UPDATE Scripts SET DataJson = @DataJson WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", script.Id);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(script));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlIngestRepository(ISqlConnectionFactory factory) : IIngestRepository
{
    public async Task<TranscriptIngest?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM TranscriptIngests WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<TranscriptIngest>(json) : null;
    }

    public async Task<IReadOnlyList<TranscriptIngest>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP 50 DataJson FROM TranscriptIngests WHERE ProjectId = @ProjectId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<TranscriptIngest>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<TranscriptIngest>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<TranscriptIngest?> FindByIdempotencyKeyAsync(string projectId, string key, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP 1 DataJson FROM TranscriptIngests WHERE ProjectId = @ProjectId AND IdempotencyKey = @Key";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);
        cmd.Parameters.AddWithValue("@Key", key);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<TranscriptIngest>(json) : null;
    }

    public async Task<TranscriptIngest?> FindBySourceUrlHashAsync(string projectId, string hash, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP 1 DataJson FROM TranscriptIngests WHERE ProjectId = @ProjectId AND SourceUrlHash = @Hash ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);
        cmd.Parameters.AddWithValue("@Hash", hash);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<TranscriptIngest>(json) : null;
    }

    public async Task InsertAsync(TranscriptIngest ingest, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ingest.Id))
            ingest.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO TranscriptIngests (Id, ProjectId, IdempotencyKey, SourceUrlHash, CreatedAt, DataJson)
            VALUES (@Id, @ProjectId, @IdempotencyKey, @SourceUrlHash, @CreatedAt, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", ingest.Id);
        cmd.Parameters.AddWithValue("@ProjectId", ingest.ProjectId);
        cmd.Parameters.AddWithValue("@IdempotencyKey", (object?)ingest.IdempotencyKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@SourceUrlHash", (object?)ingest.SourceUrlHash ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CreatedAt", ingest.CreatedAt);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(ingest));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task ReplaceAsync(TranscriptIngest ingest, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "UPDATE TranscriptIngests SET DataJson = @DataJson WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", ingest.Id);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(ingest));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlRenderJobRepository(ISqlConnectionFactory factory, TimeProvider clock) : IRenderJobRepository
{
    public async Task<RenderJob?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM RenderJobs WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return result is string json ? SqlJson.Deserialize<RenderJob>(json) : null;
    }

    public async Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP 50 DataJson FROM RenderJobs WHERE ProjectId = @ProjectId ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProjectId", projectId);

        var list = new List<RenderJob>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<RenderJob>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(RenderJob job, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(job.Id))
            job.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
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
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", job.Id);
        cmd.Parameters.AddWithValue("@ProjectId", job.ProjectId);
        cmd.Parameters.AddWithValue("@Status", (int)job.Status);
        cmd.Parameters.AddWithValue("@LeaseOwner", (object?)job.LeaseOwner ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@LeaseExpiresAt", (object?)job.LeaseExpiresAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@HeartbeatAt", (object?)job.HeartbeatAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@StartedAt", (object?)job.StartedAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CreatedAt", job.CreatedAt);
        cmd.Parameters.AddWithValue("@Attempts", job.Attempts);
        cmd.Parameters.AddWithValue("@CurrentStage", (int)job.CurrentStage);
        cmd.Parameters.AddWithValue("@Progress", job.Progress);
        cmd.Parameters.AddWithValue("@Message", (object?)job.Message ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ScenesDone", job.ScenesDone);
        cmd.Parameters.AddWithValue("@ScenesTotal", job.ScenesTotal);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<RenderJob?> ClaimNextAsync(
        string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var expiresAt = now + leaseDuration;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var tx = conn.BeginTransaction(IsolationLevel.RepeatableRead);

        const string findSql = """
            SELECT TOP 1 Id, DataJson
            FROM RenderJobs WITH (UPDLOCK, READPAST)
            WHERE Attempts < @MaxAttempts
              AND (Status = 0 OR (Status = 1 AND LeaseExpiresAt < @Now))
            ORDER BY CreatedAt ASC
            """;

        string? jobId = null;
        RenderJob? job = null;

        await using (var findCmd = new SqlCommand(findSql, conn, tx))
        {
            findCmd.Parameters.AddWithValue("@MaxAttempts", maxAttempts);
            findCmd.Parameters.AddWithValue("@Now", now);

            await using var reader = await findCmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
            if (await reader.ReadAsync(ct).ConfigureAwait(false))
            {
                jobId = reader.GetString(0);
                var json = reader.GetString(1);
                job = SqlJson.Deserialize<RenderJob>(json);
            }
        }

        if (jobId == null || job == null)
        {
            await tx.RollbackAsync(ct).ConfigureAwait(false);
            return null;
        }

        job.Status = RenderJobStatus.Processing;
        job.LeaseOwner = leaseOwner;
        job.LeaseExpiresAt = expiresAt;
        job.HeartbeatAt = now;
        job.StartedAt = now;
        job.CurrentStage = RenderStage.Preparing;
        job.Attempts++;

        const string updateSql = """
            UPDATE RenderJobs
            SET Status = 1, LeaseOwner = @LeaseOwner, LeaseExpiresAt = @LeaseExpiresAt,
                HeartbeatAt = @HeartbeatAt, StartedAt = @StartedAt, CurrentStage = @CurrentStage,
                Attempts = Attempts + 1, DataJson = @DataJson
            WHERE Id = @Id
            """;

        await using (var updateCmd = new SqlCommand(updateSql, conn, tx))
        {
            updateCmd.Parameters.AddWithValue("@Id", jobId);
            updateCmd.Parameters.AddWithValue("@LeaseOwner", leaseOwner);
            updateCmd.Parameters.AddWithValue("@LeaseExpiresAt", expiresAt);
            updateCmd.Parameters.AddWithValue("@HeartbeatAt", now);
            updateCmd.Parameters.AddWithValue("@StartedAt", now);
            updateCmd.Parameters.AddWithValue("@CurrentStage", (int)RenderStage.Preparing);
            updateCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));

            await updateCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }

        await tx.CommitAsync(ct).ConfigureAwait(false);
        return job;
    }

    public async Task<JobHeartbeatResult> ReportProgressAsync(
        string jobId, string leaseOwner, int progress, string? message, RenderStage stage,
        int scenesDone, TimeSpan leaseDuration, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var expiresAt = now + leaseDuration;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        await using var tx = conn.BeginTransaction();

        const string getSql = """
            SELECT DataJson FROM RenderJobs WITH (UPDLOCK)
            WHERE Id = @Id AND LeaseOwner = @LeaseOwner
            """;

        RenderJob? job = null;
        await using (var getCmd = new SqlCommand(getSql, conn, tx))
        {
            getCmd.Parameters.AddWithValue("@Id", jobId);
            getCmd.Parameters.AddWithValue("@LeaseOwner", leaseOwner);

            var res = await getCmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
            if (res is string json)
            {
                job = SqlJson.Deserialize<RenderJob>(json);
            }
        }

        if (job == null)
        {
            await tx.RollbackAsync(ct).ConfigureAwait(false);
            return new JobHeartbeatResult(false, CancelRequested: false);
        }

        job.Progress = progress;
        job.Message = message;
        job.CurrentStage = stage;
        job.ScenesDone = scenesDone;
        job.HeartbeatAt = now;
        job.LeaseExpiresAt = expiresAt;

        const string updateSql = """
            UPDATE RenderJobs
            SET Progress = @Progress, Message = @Message, CurrentStage = @CurrentStage,
                ScenesDone = @ScenesDone, HeartbeatAt = @HeartbeatAt, LeaseExpiresAt = @LeaseExpiresAt,
                DataJson = @DataJson
            WHERE Id = @Id
            """;

        await using (var updateCmd = new SqlCommand(updateSql, conn, tx))
        {
            updateCmd.Parameters.AddWithValue("@Id", jobId);
            updateCmd.Parameters.AddWithValue("@Progress", progress);
            updateCmd.Parameters.AddWithValue("@Message", (object?)message ?? DBNull.Value);
            updateCmd.Parameters.AddWithValue("@CurrentStage", (int)stage);
            updateCmd.Parameters.AddWithValue("@ScenesDone", scenesDone);
            updateCmd.Parameters.AddWithValue("@HeartbeatAt", now);
            updateCmd.Parameters.AddWithValue("@LeaseExpiresAt", expiresAt);
            updateCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));

            await updateCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        }

        await tx.CommitAsync(ct).ConfigureAwait(false);
        return new JobHeartbeatResult(true, job.CancelRequested);
    }

    public async Task CompleteAsync(RenderJob job, CancellationToken ct)
    {
        job.CompletedAt = clock.GetUtcNow().UtcDateTime;
        job.LeaseOwner = null;
        job.LeaseExpiresAt = null;

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            UPDATE RenderJobs
            SET Status = @Status, Progress = @Progress, CurrentStage = @CurrentStage,
                ScenesDone = @ScenesDone, ScenesTotal = @ScenesTotal,
                LeaseOwner = NULL, LeaseExpiresAt = NULL, DataJson = @DataJson
            WHERE Id = @Id
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", job.Id);
        cmd.Parameters.AddWithValue("@Status", (int)job.Status);
        cmd.Parameters.AddWithValue("@Progress", job.Progress);
        cmd.Parameters.AddWithValue("@CurrentStage", (int)job.CurrentStage);
        cmd.Parameters.AddWithValue("@ScenesDone", job.ScenesDone);
        cmd.Parameters.AddWithValue("@ScenesTotal", job.ScenesTotal);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task RequestCancelAsync(string jobId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string getSql = "SELECT DataJson FROM RenderJobs WHERE Id = @Id";
        await using var getCmd = new SqlCommand(getSql, conn);
        getCmd.Parameters.AddWithValue("@Id", jobId);

        var res = await getCmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        if (res is string json)
        {
            var job = SqlJson.Deserialize<RenderJob>(json);
            if (job != null)
            {
                job.CancelRequested = true;
                const string updateSql = "UPDATE RenderJobs SET DataJson = @DataJson WHERE Id = @Id";
                await using var updateCmd = new SqlCommand(updateSql, conn);
                updateCmd.Parameters.AddWithValue("@Id", jobId);
                updateCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));
                await updateCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
            }
        }
    }

    public async Task<IReadOnlyList<RenderJob>> ListActiveAsync(int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM RenderJobs WHERE Status IN (0, 1) ORDER BY CreatedAt ASC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);

        var list = new List<RenderJob>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<RenderJob>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT Id FROM RenderJobs WHERE Status IN (0, 1)";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            list.Add(reader.GetString(0));
        }
        return list;
    }

    public async Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT TOP (@Limit) DataJson FROM RenderJobs ORDER BY CreatedAt DESC";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);

        var list = new List<RenderJob>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<RenderJob>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task<bool> RequeueAsync(string jobId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string getSql = "SELECT DataJson FROM RenderJobs WHERE Id = @Id AND Status IN (3, 4)";
        await using var getCmd = new SqlCommand(getSql, conn);
        getCmd.Parameters.AddWithValue("@Id", jobId);

        var res = await getCmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        if (res is not string json) return false;

        var job = SqlJson.Deserialize<RenderJob>(json);
        if (job == null) return false;

        job.Status = RenderJobStatus.Pending;
        job.Progress = 0;
        job.ScenesDone = 0;
        job.Attempts = 0;
        job.CurrentStage = RenderStage.None;
        job.Message = "Queued again";
        job.CancelRequested = false;
        job.LeaseOwner = null;
        job.LeaseExpiresAt = null;
        job.StartedAt = null;
        job.CompletedAt = null;
        job.ErrorCode = null;
        job.ErrorMessage = null;
        job.Warnings = [];

        const string updateSql = """
            UPDATE RenderJobs
            SET Status = 0, Progress = 0, ScenesDone = 0, Attempts = 0,
                CurrentStage = 0, Message = 'Queued again', LeaseOwner = NULL,
                LeaseExpiresAt = NULL, StartedAt = NULL, CompletedAt = NULL,
                DataJson = @DataJson
            WHERE Id = @Id AND Status IN (3, 4)
            """;
        await using var updateCmd = new SqlCommand(updateSql, conn);
        updateCmd.Parameters.AddWithValue("@Id", jobId);
        updateCmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(job));

        var count = await updateCmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        return count > 0;
    }
}

public sealed class SqlAiUsageRepository(ISqlConnectionFactory factory) : IAiUsageRepository
{
    public async Task RecordAsync(AiUsageRecord record, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(record.Id))
            record.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO AiUsage (Id, ProviderId, DayBucket, Capability, Outcome, RequestCount, Units, AtUtc, DataJson)
            VALUES (@Id, @ProviderId, @DayBucket, @Capability, @Outcome, @RequestCount, @Units, @AtUtc, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", record.Id);
        cmd.Parameters.AddWithValue("@ProviderId", record.ProviderId);
        cmd.Parameters.AddWithValue("@DayBucket", record.DayBucket);
        cmd.Parameters.AddWithValue("@Capability", (int)record.Capability);
        cmd.Parameters.AddWithValue("@Outcome", (int)record.Outcome);
        cmd.Parameters.AddWithValue("@RequestCount", record.RequestCount);
        cmd.Parameters.AddWithValue("@Units", record.Units);
        cmd.Parameters.AddWithValue("@AtUtc", record.CreatedAt);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(record));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<long> CountBillableRequestsAsync(
        string providerId, string fromDayBucket, string toDayBucket, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT COUNT(1) FROM AiUsage
            WHERE ProviderId = @ProviderId
              AND DayBucket >= @From AND DayBucket <= @To
              AND Outcome IN (0, 3)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProviderId", providerId);
        cmd.Parameters.AddWithValue("@From", fromDayBucket);
        cmd.Parameters.AddWithValue("@To", toDayBucket);

        var result = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return Convert.ToInt64(result);
    }

    public async Task<IReadOnlyList<AiUsageDailyTotal>> SummarizeAsync(
        string fromDayBucket, string toDayBucket, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT DayBucket, ProviderId, Capability, Outcome,
                   SUM(CAST(RequestCount AS BIGINT)) as TotalRequests,
                   SUM(Units) as TotalUnits
            FROM AiUsage
            WHERE DayBucket >= @From AND DayBucket <= @To
            GROUP BY DayBucket, ProviderId, Capability, Outcome
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@From", fromDayBucket);
        cmd.Parameters.AddWithValue("@To", toDayBucket);

        var intermediate = new List<(string Day, string Provider, AiCapability Cap, AiCallOutcome Out, long Req, long Units)>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var day = reader.GetString(0);
            var prov = reader.GetString(1);
            var cap = (AiCapability)reader.GetInt32(2);
            var outcome = (AiCallOutcome)reader.GetInt32(3);
            var req = reader.GetInt64(4);
            var units = reader.GetInt64(5);
            intermediate.Add((day, prov, cap, outcome, req, units));
        }

        return intermediate
            .GroupBy(x => (x.Day, x.Provider, x.Cap))
            .Select(g => new AiUsageDailyTotal(
                g.Key.Day,
                g.Key.Provider,
                g.Key.Cap,
                g.Sum(x => x.Req),
                g.Sum(x => x.Units),
                g.Where(x => x.Out == AiCallOutcome.CacheHit).Sum(x => x.Req),
                g.Where(x => x.Out == AiCallOutcome.Failed).Sum(x => x.Req)))
            .OrderByDescending(t => t.DayBucket)
            .ThenBy(t => t.ProviderId)
            .ToList();
    }
}

public sealed class SqlAiCredentialRepository(ISqlConnectionFactory factory) : IAiCredentialRepository
{
    public async Task<AiCredential?> GetAsync(string providerId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM AiCredentials WHERE ProviderId = @ProviderId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProviderId", providerId);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<AiCredential>(json) : null;
    }

    public async Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM AiCredentials ORDER BY ProviderId ASC";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<AiCredential>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<AiCredential>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task UpsertAsync(AiCredential credential, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM AiCredentials WHERE ProviderId = @ProviderId)
                UPDATE AiCredentials SET DataJson = @DataJson WHERE ProviderId = @ProviderId
            ELSE
                INSERT INTO AiCredentials (ProviderId, DataJson) VALUES (@ProviderId, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProviderId", credential.ProviderId);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(credential));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string providerId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM AiCredentials WHERE ProviderId = @ProviderId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@ProviderId", providerId);

        var count = await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
        return count > 0;
    }
}

public sealed class SqlPromptTemplateRepository(ISqlConnectionFactory factory) : IPromptTemplateRepository
{
    public async Task<PromptTemplate?> GetLatestAsync(string templateKey, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT TOP 1 DataJson FROM PromptTemplates
            WHERE TemplateKey = @Key AND Enabled = 1
            ORDER BY Version DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Key", templateKey);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<PromptTemplate>(json) : null;
    }

    public async Task<IReadOnlyList<PromptTemplate>> ListLatestAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM PromptTemplates ORDER BY Version DESC";
        await using var cmd = new SqlCommand(sql, conn);

        var all = new List<PromptTemplate>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<PromptTemplate>(json);
            if (item != null) all.Add(item);
        }

        return [.. all
            .GroupBy(t => t.TemplateKey, StringComparer.Ordinal)
            .Select(g => g.MaxBy(t => t.Version)!)
            .OrderBy(t => t.TemplateKey, StringComparer.Ordinal)];
    }

    public async Task<IReadOnlyList<PromptTemplate>> ListVersionsAsync(string templateKey, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            SELECT DataJson FROM PromptTemplates
            WHERE TemplateKey = @Key
            ORDER BY Version DESC
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Key", templateKey);

        var list = new List<PromptTemplate>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<PromptTemplate>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }

    public async Task InsertAsync(PromptTemplate template, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(template.Id))
            template.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO PromptTemplates (Id, TemplateKey, Version, Enabled, DataJson)
            VALUES (@Id, @TemplateKey, @Version, @Enabled, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", template.Id);
        cmd.Parameters.AddWithValue("@TemplateKey", template.TemplateKey);
        cmd.Parameters.AddWithValue("@Version", template.Version);
        cmd.Parameters.AddWithValue("@Enabled", template.Enabled);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(template));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlAiSettingsRepository(ISqlConnectionFactory factory) : IAiSettingsRepository
{
    public async Task<AiSettings?> GetAsync(CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM AiSettings WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", AiSettings.SingletonId);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<AiSettings>(json) : null;
    }

    public async Task SaveAsync(AiSettings settings, CancellationToken ct)
    {
        settings.Id = AiSettings.SingletonId;
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM AiSettings WHERE Id = @Id)
                UPDATE AiSettings SET DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO AiSettings (Id, DataJson) VALUES (@Id, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", AiSettings.SingletonId);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(settings));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
}

public sealed class SqlAdminAuditRepository(ISqlConnectionFactory factory) : IAdminAuditRepository
{
    private const int MaxLimit = 500;

    public async Task AppendAsync(AdminAuditEntry entry, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(entry.Id))
            entry.Id = ObjectId.GenerateNewId().ToString();

        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            INSERT INTO AdminAudit (Id, AtUtc, DataJson)
            VALUES (@Id, @AtUtc, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", entry.Id);
        cmd.Parameters.AddWithValue("@AtUtc", entry.AtUtc);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(entry));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AdminAuditEntry>> ListRecentAsync(int limit, CancellationToken ct)
    {
        var clamped = Math.Clamp(limit, 1, MaxLimit);
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        var sql = $"SELECT TOP ({clamped}) DataJson FROM AdminAudit ORDER BY AtUtc DESC";
        await using var cmd = new SqlCommand(sql, conn);

        var list = new List<AdminAuditEntry>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var json = reader.GetString(0);
            var item = SqlJson.Deserialize<AdminAuditEntry>(json);
            if (item != null) list.Add(item);
        }
        return list;
    }
}
