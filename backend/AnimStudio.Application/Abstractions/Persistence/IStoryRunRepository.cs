using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Story Agent runs, one document each, listed per person.</summary>
public interface IStoryRunRepository
{
    Task<StoryRun?> GetAsync(string id, CancellationToken ct);

    /// <summary>One person's runs, most recently touched first, at most <paramref name="limit"/>.</summary>
    Task<IReadOnlyList<StoryRun>> ListByUserAsync(string userId, int limit, CancellationToken ct);

    /// <summary>
    /// Every run (anyone's) in a <see cref="StoryRun.WorkingStatuses">working</see> status. At start-up these are the
    /// runs a previous process was in the middle of, and the worker picks them up where they stopped.
    /// </summary>
    Task<IReadOnlyList<StoryRun>> ListWorkingAsync(CancellationToken ct);

    /// <summary>How many of one person's runs are working now.</summary>
    Task<int> CountWorkingByUserAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="StoryRun.Id"/>.</summary>
    Task UpsertAsync(StoryRun run, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
