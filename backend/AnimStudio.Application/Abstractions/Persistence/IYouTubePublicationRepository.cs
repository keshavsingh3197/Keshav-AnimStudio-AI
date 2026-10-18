using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>Videos uploaded to YouTube from the app. Every read is scoped to one owner except the health sweep.</summary>
public interface IYouTubePublicationRepository
{
    Task<YouTubePublication?> GetAsync(string id, CancellationToken ct);

    /// <summary>Newest first. <paramref name="projectId"/> narrows to one project.</summary>
    Task<IReadOnlyList<YouTubePublication>> ListByUserAsync(string userId, string? projectId, int limit, CancellationToken ct);

    /// <summary>The owner's records for these video ids; unknown or foreign ids are simply absent.</summary>
    Task<IReadOnlyList<YouTubePublication>> ListByVideoIdsAsync(string userId, IReadOnlyCollection<string> videoIds, CancellationToken ct);

    /// <summary>
    /// Records published after <paramref name="publishedAfter"/> that were never checked or
    /// were last checked before <paramref name="checkedBefore"/>, oldest check first. Across
    /// all users: only the background health sweep calls this.
    /// </summary>
    Task<IReadOnlyList<YouTubePublication>> ListDueForCheckAsync(DateTime publishedAfter, DateTime checkedBefore, int limit, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="YouTubePublication.Id"/>.</summary>
    Task UpsertAsync(YouTubePublication publication, CancellationToken ct);

    Task<bool> DeleteAsync(string id, CancellationToken ct);
}
