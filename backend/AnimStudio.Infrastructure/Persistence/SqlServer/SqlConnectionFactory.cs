using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlConnectionFactory(IConfiguration configuration) : ISqlConnectionFactory
{
    public string ConnectionString =>
        configuration.GetConnectionString("SqlServer")
        ?? configuration["SqlServer:ConnectionString"]
        ?? "Server=localhost;Database=AnimStudioDb;Trusted_Connection=True;TrustServerCertificate=True;";

    public async Task<SqlConnection> OpenConnectionAsync(CancellationToken ct = default)
    {
        var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(ct).ConfigureAwait(false);
        return connection;
    }
}

