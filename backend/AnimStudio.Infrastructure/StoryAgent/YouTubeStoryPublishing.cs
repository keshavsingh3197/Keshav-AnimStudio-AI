using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.Publishing;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// The Story Agent's view of YouTube publishing: the app's record of uploads, and the caption endpoint, through the same
/// connections the publish dialog uses. A channel's token is asked for only for the person's own connection.
/// </summary>
public sealed class YouTubeStoryPublishing(
    YouTubePublicationService publications,
    YouTubeConnectionStore connections,
    YouTubeCaptionClient captions) : IStoryPublishing
{
    public async Task<IReadOnlyList<StoryPublication>> ListAsync(string userId, string? projectId, CancellationToken ct)
    {
        var uploads = await publications.ListAsync(userId, projectId, ct).ConfigureAwait(false);
        if (uploads.Count == 0) return [];

        // Whether each channel may take subtitles, asked once per channel.
        var canCaption = new Dictionary<string, bool>(StringComparer.Ordinal);
        foreach (var channelId in uploads.Select(u => u.ChannelId).Distinct(StringComparer.Ordinal))
        {
            var connection = await connections.GetAsync(userId, channelId, ct).ConfigureAwait(false);
            canCaption[channelId] = connection is { RevokedAt: null } && YouTubeOAuthClient.AllowsComments(connection.Scopes);
        }

        return [.. uploads.Select(u => new StoryPublication(
            u.VideoId, u.ProjectId, u.JobId, u.ChannelId, u.ChannelTitle, u.Title, u.Privacy, u.PrivacyStatus,
            u.PublishedAt, u.PublishAt, u.Health, u.IssueMessage, u.VideoUrl, u.StudioUrl, u.ThumbnailUrl,
            canCaption[u.ChannelId]))];
    }

    public async Task<string> AddCaptionAsync(
        string userId, string channelId, string videoId, string language, string name, byte[] srt, CancellationToken ct)
    {
        try
        {
            var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
            return await captions.InsertAsync(videoId, language, name, srt, token, ct).ConfigureAwait(false);
        }
        catch (YouTubePublishException ex)
        {
            throw new StoryPublishingException(ex.Code, ex.Message);
        }
    }
}
