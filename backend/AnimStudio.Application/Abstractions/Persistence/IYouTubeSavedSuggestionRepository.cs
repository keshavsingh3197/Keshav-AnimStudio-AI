using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The YouTube details a person's videos were given, kept to be used again for the same or a similar video.</summary>
public interface IYouTubeSavedSuggestionRepository
{
    /// <summary>The details written from exactly this input, newest first; null when there are none.</summary>
    Task<YouTubeSavedSuggestion?> FindAsync(string userId, string fingerprint, CancellationToken ct);

    /// <summary>The person's most recent details in <paramref name="language"/>, newest first, up to <paramref name="limit"/>.</summary>
    Task<IReadOnlyList<YouTubeSavedSuggestion>> ListRecentAsync(string userId, string language, int limit, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="YouTubeSavedSuggestion.Id"/>.</summary>
    Task UpsertAsync(YouTubeSavedSuggestion suggestion, CancellationToken ct);
}
