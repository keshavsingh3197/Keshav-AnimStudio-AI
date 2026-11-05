using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Abstractions.Persistence;

/// <summary>The last analysis of each of a person's channels: one document per person and channel.</summary>
public interface IYouTubeChannelAnalysisRepository
{
    Task<YouTubeChannelAnalysis?> GetAsync(string userId, string channelId, CancellationToken ct);

    Task<IReadOnlyList<YouTubeChannelAnalysis>> ListByUserAsync(string userId, CancellationToken ct);

    /// <summary>Insert or replace by <see cref="YouTubeChannelAnalysis.Id"/>.</summary>
    Task UpsertAsync(YouTubeChannelAnalysis analysis, CancellationToken ct);
}
