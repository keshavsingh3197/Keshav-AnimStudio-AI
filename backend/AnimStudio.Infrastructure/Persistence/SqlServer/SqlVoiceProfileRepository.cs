using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Voices;
using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlVoiceProfileRepository(ISqlConnectionFactory factory) : IVoiceProfileRepository
{
    public async Task<VoiceProfile?> GetAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM VoiceProfiles WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        var res = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return res is string json ? SqlJson.Deserialize<VoiceProfile>(json) : null;
    }

    public async Task<IReadOnlyList<VoiceProfile>> ListByUserAsync(string userId, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "SELECT DataJson FROM VoiceProfiles WHERE UserId = @UserId";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        var list = new List<VoiceProfile>();
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var item = SqlJson.Deserialize<VoiceProfile>(reader.GetString(0));
            if (item != null) list.Add(item);
        }
        return [.. list.OrderBy(v => v.CreatedAtUtc)];
    }

    public async Task UpsertAsync(VoiceProfile profile, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = """
            IF EXISTS (SELECT 1 FROM VoiceProfiles WHERE Id = @Id)
                UPDATE VoiceProfiles SET UserId = @UserId, DataJson = @DataJson WHERE Id = @Id
            ELSE
                INSERT INTO VoiceProfiles (Id, UserId, DataJson) VALUES (@Id, @UserId, @DataJson)
            """;
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", profile.Id);
        cmd.Parameters.AddWithValue("@UserId", profile.UserId);
        cmd.Parameters.AddWithValue("@DataJson", SqlJson.Serialize(profile));

        await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        await using var conn = await factory.OpenConnectionAsync(ct).ConfigureAwait(false);
        const string sql = "DELETE FROM VoiceProfiles WHERE Id = @Id";
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        return await cmd.ExecuteNonQueryAsync(ct).ConfigureAwait(false) > 0;
    }
}
