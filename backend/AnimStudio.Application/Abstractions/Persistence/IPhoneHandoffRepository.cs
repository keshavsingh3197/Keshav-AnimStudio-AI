using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Videos sent to Drive for a phone upload, and the details waiting to be applied to it.</summary>
public interface IPhoneHandoffRepository
{
    Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct);

    /// <summary>The user's handoffs, newest first; <paramref name="jobId"/> only narrows.</summary>
    Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct);

    /// <summary>Every user's handoffs in one state, oldest first - for the background matcher.</summary>
    Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="PhoneHandoff.Id"/>.</summary>
    Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct);
}
