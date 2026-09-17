using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Infrastructure.Persistence.SqlServer;

public sealed class SqlAssetFolderRepository : IAssetFolderRepository
{
    public Task<AssetFolder?> GetAsync(string id, CancellationToken ct) => Task.FromResult<AssetFolder?>(null);
    public Task<IReadOnlyList<AssetFolder>> ListByProjectAsync(string projectId, CancellationToken ct) => Task.FromResult<IReadOnlyList<AssetFolder>>([]);
    public Task InsertAsync(AssetFolder folder, CancellationToken ct) => Task.CompletedTask;
    public Task ReplaceAsync(AssetFolder folder, CancellationToken ct) => Task.CompletedTask;
    public Task DeleteAsync(string id, CancellationToken ct) => Task.CompletedTask;
}
