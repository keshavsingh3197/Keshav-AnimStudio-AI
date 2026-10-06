using AnimStudio.Domain.System;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Configuration values set from the admin console, keyed by configuration path.</summary>
public interface IWebSettingRepository
{
    Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct);

    /// <summary>Insert or replace by <see cref="WebSetting.Id"/>.</summary>
    Task UpsertAsync(WebSetting setting, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
