namespace AnimStudio.Application.Abstractions.StoryAgent;

/// <summary>A video uploaded to YouTube from a story's project, as the story pages show it.</summary>
/// <param name="Privacy">The visibility it was uploaded with: public, unlisted or private.</param>
/// <param name="PrivacyStatus">What YouTube last said it is; a scheduled video turns public on its own.</param>
/// <param name="PublishAtUtc">When a scheduled upload goes public; null when it was not scheduled.</param>
/// <param name="Health">What YouTube last said about it: Unknown, Processing, Ok, Issue or Removed.</param>
/// <param name="CanCaption">The channel's connection allows adding subtitle tracks.</param>
public sealed record StoryPublication(
    string VideoId,
    string ProjectId,
    string JobId,
    string ChannelId,
    string ChannelTitle,
    string Title,
    string Privacy,
    string? PrivacyStatus,
    DateTime PublishedAtUtc,
    DateTime? PublishAtUtc,
    string Health,
    string? IssueMessage,
    string VideoUrl,
    string StudioUrl,
    string? ThumbnailUrl,
    bool CanCaption);

/// <summary>
/// What the Story Agent needs from YouTube publishing: the videos made from a story's project, and adding a subtitle
/// track to one of them. Uploading the video itself goes through the ordinary publish dialog, so a story is published
/// exactly the way any other render is.
/// </summary>
public interface IStoryPublishing
{
    /// <summary>The person's uploads, newest first; only those of one project when <paramref name="projectId"/> is set.</summary>
    Task<IReadOnlyList<StoryPublication>> ListAsync(string userId, string? projectId, CancellationToken ct);

    /// <summary>Adds an SRT track to a video on a channel the person has connected.</summary>
    /// <returns>YouTube's id for the new caption track.</returns>
    /// <exception cref="StoryPublishingException">YouTube refused it, or the channel must be reconnected first.</exception>
    Task<string> AddCaptionAsync(
        string userId, string channelId, string videoId, string language, string name, byte[] srt, CancellationToken ct);
}

/// <summary>A caption that could not be added, with a code for the page and a sentence for the person.</summary>
public sealed class StoryPublishingException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
