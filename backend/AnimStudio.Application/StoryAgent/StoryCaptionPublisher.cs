using System.Text;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>What happened to one language when the subtitles were sent.</summary>
/// <param name="Outcome"><c>added</c>, <c>already</c> (that video has it from before) or <c>failed</c>.</param>
public sealed record StoryCaptionResult(string Language, string Label, string Outcome, string? Message);

/// <summary>
/// Adds a story's subtitle tracks to a YouTube video made from it. The video must be one of the person's own uploads of
/// the story's project, so a story can only put subtitles on its own videos; the files are built here from the run, never
/// taken from the request. A language the video already has from an earlier send is left alone.
/// </summary>
public sealed class StoryCaptionPublisher(
    StoryRunService stories,
    IStoryPublishing publishing,
    TimeProvider clock,
    ILogger<StoryCaptionPublisher> logger)
{
    /// <summary>Each track costs YouTube quota; one story has at most these two.</summary>
    public const int MaxLanguages = 2;

    public async Task<(StoryRun Run, IReadOnlyList<StoryCaptionResult> Results)> SendAsync(
        string userId, string runId, string? videoId, IReadOnlyList<string>? languages, CancellationToken ct)
    {
        var run = await stories.GetAsync(userId, runId, ct).ConfigureAwait(false);
        if (run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "story-busy", "The story is being made again. Add the subtitles once it is done.");

        var tracks = StoryCaptions.Tracks(run);
        if (tracks.Count == 0)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "subtitles-not-ready", "The subtitles are ready once the project has been built.");

        // Only languages this story offers; an empty ask means all of them.
        var asked = (languages ?? []).Select(l => l?.Trim().ToLowerInvariant()).Distinct().ToList();
        if (asked.Count > MaxLanguages || asked.Any(l => tracks.All(t => t.Language != l)))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "language-invalid", "Choose from the subtitle languages this story has.", "languages");
        var chosen = asked.Count == 0 ? tracks : [.. tracks.Where(t => asked.Contains(t.Language))];

        var video = string.IsNullOrEmpty(run.ProjectId) || string.IsNullOrWhiteSpace(videoId)
            ? null
            : (await publishing.ListAsync(userId, run.ProjectId, ct).ConfigureAwait(false))
                .FirstOrDefault(p => string.Equals(p.VideoId, videoId, StringComparison.Ordinal));
        if (video is null)
            throw new StoryRunException(StoryRunErrorKind.NotFound, "video-not-found", "That video is not one published from this story.", "videoId");
        if (!video.CanCaption)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "youtube-caption-scope",
                $"Reconnect the channel {video.ChannelTitle} on the YouTube page to let AnimStudio add subtitles, then try again.");

        var results = new List<StoryCaptionResult>(chosen.Count);
        var added = new List<StoryCaptionUpload>(chosen.Count);
        foreach (var track in chosen)
        {
            if (run.CaptionUploads.Any(u => u.VideoId == video.VideoId && u.Language == track.Language))
            {
                results.Add(new StoryCaptionResult(track.Language, track.Label, "already", "This video already has it."));
                continue;
            }

            var srt = Encoding.UTF8.GetBytes(StoryCaptions.ToSrt(StoryCaptions.Build(run, track.Language)));
            try
            {
                var captionId = await publishing.AddCaptionAsync(
                    userId, video.ChannelId, video.VideoId, track.Language, track.Label, srt, ct).ConfigureAwait(false);
                added.Add(new StoryCaptionUpload
                {
                    VideoId = video.VideoId,
                    Language = track.Language,
                    CaptionId = captionId,
                    UploadedAtUtc = clock.GetUtcNow().UtcDateTime
                });
                results.Add(new StoryCaptionResult(track.Language, track.Label, "added", null));
            }
            catch (StoryPublishingException ex)
            {
                logger.LogWarning("Story run {RunId}: the {Language} subtitles for video {VideoId} were refused: {Code}",
                    run.Id, track.Language, video.VideoId, ex.Code);
                results.Add(new StoryCaptionResult(track.Language, track.Label, "failed", ex.Message));
            }
        }

        if (added.Count > 0)
        {
            run = await stories.RecordCaptionsAsync(userId, run.Id, added, ct).ConfigureAwait(false);
            logger.LogInformation("Story run {RunId}: added {Count} subtitle track(s) to video {VideoId}.", run.Id, added.Count, video.VideoId);
        }

        return (run, results);
    }
}
