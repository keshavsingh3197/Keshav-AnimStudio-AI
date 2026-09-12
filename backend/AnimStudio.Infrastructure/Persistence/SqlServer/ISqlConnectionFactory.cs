using Microsoft.Data.SqlClient;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public interface ISqlConnectionFactory
{
    string ConnectionString { get; }
    Task<SqlConnection> OpenConnectionAsync(CancellationToken ct = default);
}

