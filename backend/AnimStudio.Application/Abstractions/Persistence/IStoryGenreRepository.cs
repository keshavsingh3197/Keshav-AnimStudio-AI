using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The Story Agent's genres, one document each, keyed by <see cref="StoryGenre.Id"/>.</summary>
public interface IStoryGenreRepository
{
    Task<IReadOnlyList<StoryGenre>> ListAsync(CancellationToken ct);

    Task<StoryGenre?> GetAsync(string id, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="StoryGenre.Id"/>.</summary>
    Task UpsertAsync(StoryGenre genre, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
