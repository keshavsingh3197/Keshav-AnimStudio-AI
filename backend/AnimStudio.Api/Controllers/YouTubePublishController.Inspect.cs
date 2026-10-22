using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Video details from IDs: any YouTube video - the caller's own or anyone's - read in full
/// (captions, the music it uses, chapters from the caption timing) with a fresh title,
/// description, tags and pinned comment written for it. One video per call, so the page can
/// show each one's progress. Plus the two edits the checkup lacked: scheduling a private video
/// to go public, and posting a comment.
/// <para>
/// Everything read from YouTube is someone else's text: it is cleaned before it goes into a
/// prompt, and what comes back is checked like any suggestion. A channel named in a request
/// must be one of the caller's own connections, and a video is only treated as the caller's
/// after YouTube confirms it is on that channel.
/// </para>
/// </summary>
public sealed partial class YouTubePublishController
{
    /// <summary>A whole watch page plus captions per call; a few at once keeps YouTube from rate-limiting the server.</summary>
    private static readonly SemaphoreSlim InspectSlots = new(3, 3);

    /// <summary>The longest link accepted; real ones are far shorter.</summary>
    private const int MaxVideoReferenceChars = 2048;

    /// <summary>The caption text returned to the page; a feature-length video's words are well under this.</summary>
    private const int MaxCaptionTextChars = 100_000;

    /// <summary>YouTube wants a scheduled time comfortably ahead; the page asks for ten minutes and a minute of travel is forgiven.</summary>
    private static readonly TimeSpan MinScheduleLead = TimeSpan.FromMinutes(9);
    private static readonly TimeSpan MaxScheduleLead = TimeSpan.FromDays(366);

    [HttpPost("details/inspect")]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<ApiResponse<YouTubeVideoInspection>>> InspectVideo(
        [FromBody] YouTubeInspectRequest? request,
        [FromServices] YouTubeChannelVideosClient channelVideos,
        [FromServices] IYouTubePublicationRepository publicationRecords,
        CancellationToken ct)
    {
        if (request?.Video is not { Length: > 0 and <= MaxVideoReferenceChars } reference
            || !ContentPlanRules.TryParseVideoReference(reference, out var videoId))
            return InspectFailure(StatusCodes.Status400BadRequest, "video-invalid",
                "Paste a YouTube video ID or link (watch, Shorts, youtu.be or Studio).", "video");
        if (request.Brief is { Length: > YouTubeMetadataSuggester.MaxBriefChars * 4 }
            || request.Tone is { } tone && !YouTubeMetadataSuggester.Tones.ContainsKey(tone)
            || request.ProviderId is { Length: > 100 }
            || request.Language is { } lang && !YouTubeMetadataSuggester.Languages.Contains(lang))
            return InspectFailure(StatusCodes.Status400BadRequest, "suggest-input-invalid",
                $"Keep the notes under {YouTubeMetadataSuggester.MaxBriefChars} characters and pick a tone and language from the list.", null);
        if (request.ChannelId is not null && !IsChannelId(request.ChannelId))
            return InspectFailure(StatusCodes.Status400BadRequest, "channel-invalid", "Pick one of your connected channels.", "channelId");

        // A channel named by the client must be the caller's own; anyone else's is simply not found.
        YouTubeChannelConnection? chosen = null;
        if (request.ChannelId is { } chosenId)
            chosen = await connections.GetAsync(currentUser.UserId, chosenId, ct) ?? throw new KeyNotFoundException();

        if (!await InspectSlots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return InspectFailure(StatusCodes.Status429TooManyRequests, "youtube-busy",
                "Other videos are being read right now. Try again in a minute.", null);
        YouTubeFetchedVideoData fetched;
        YouTubeWatchPageInfo page;
        try
        {
            var fetching = transcriptFetcher.FetchAsync(videoId, ct);
            var reading = transcriptFetcher.FetchWatchPageInfoAsync(videoId, ct);
            fetched = await fetching;
            page = await reading;
        }
        finally
        {
            InspectSlots.Release();
        }

        // The caller's own video: the chosen channel, or the one YouTube's player says it is on if that is connected too.
        var warnings = new List<string>();
        YouTubeVideoFullDetails? own = null;
        YouTubeChannelConnection? owner = null;
        var candidate = chosen;
        if (candidate is null && fetched.ChannelId is { } publicChannelId)
            candidate = await connections.GetAsync(currentUser.UserId, publicChannelId, ct);
        if (candidate is not null)
        {
            if (candidate.RevokedAt is not null)
            {
                warnings.Add($"YouTube access for {candidate.ChannelTitle} has expired, so its private details weren't read. Reconnect it on the YouTube page.");
            }
            else
            {
                try
                {
                    var token = await connections.GetAccessTokenAsync(currentUser.UserId, candidate.ChannelId, ct);
                    var video = await channelVideos.GetVideoAsync(token, videoId, ct);
                    if (video is not null && string.Equals(video.ChannelId, candidate.ChannelId, StringComparison.Ordinal))
                    {
                        own = video;
                        owner = candidate;
                    }
                    else if (chosen is not null)
                    {
                        warnings.Add($"This video isn't on {chosen.ChannelTitle}, so only its public details are shown.");
                    }
                }
                catch (YouTubePublishException ex)
                {
                    warnings.Add("The channel's own details for this video couldn't be read: " + ex.Message);
                }
            }
        }

        if (own is null && string.IsNullOrWhiteSpace(fetched.Title) && !fetched.HasTranscript)
            return InspectFailure(StatusCodes.Status404NotFound, "video-unreadable",
                "That video couldn't be read. It may be private, deleted, age-restricted or not available here.", "video");

        var title = own?.Title ?? (string.IsNullOrWhiteSpace(fetched.Title) ? videoId : fetched.Title);
        var description = own?.Description ?? fetched.Description;
        var tags = own?.Tags ?? fetched.Keywords;
        var duration = own?.DurationSeconds ?? fetched.DurationSeconds;
        var isShort = duration is > 0 and <= ShortMaxSeconds || reference.Contains("/shorts/", StringComparison.OrdinalIgnoreCase);
        var channelTitle = owner?.ChannelTitle ?? page.ChannelTitle ?? fetched.Author;

        var songs = YouTubeMusicDetector.Merge(page.Songs, YouTubeMusicDetector.FromDescription(description));
        var segments = fetched.Segments.Count > 0 ? fetched.Segments : YouTubeChapterBuilder.ParseTimestamped(fetched.TranscriptText);
        var chapters = YouTubeChapterBuilder.FromSegments(segments, duration);
        var extras = new YouTubeSeoExtras(songs, chapters);
        if (!fetched.HasTranscript) warnings.Add("No captions could be read for this video, so the details are written from its title and description.");

        // A video AnimStudio published still has its project - its name and script say the most.
        string? projectId = null;
        var projectSummary = string.Empty;
        var record = (await publicationRecords.ListByVideoIdsAsync(currentUser.UserId, [videoId], ct)).FirstOrDefault();
        if (record is not null && await projects.GetAsync(record.ProjectId, ct) is { } project
            && string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            projectId = project.Id;
            projectSummary = YouTubeMetadataSuggester.BuildSummary(project.Name, project.Description,
                await scenes.ListByProjectAsync(project.Id, ct), null);
        }

        var transcriptSnippet = fetched.HasTranscript ? PromptText(fetched.TranscriptText, 3500) : null;
        var summary = string.Join('\n', new[]
        {
            projectSummary,
            "Channel: " + (PromptLine(channelTitle, 120) ?? "(unknown)"),
            "Current title: " + PromptLine(title, 200),
            description.Length > 0 ? "Current description: " + PromptText(description, 1500) : "Current description: (none)",
            tags.Count > 0 ? "Current tags: " + PromptLine(string.Join(", ", tags.Take(25)), 600) : "Current tags: (none)",
            !string.IsNullOrWhiteSpace(transcriptSnippet)
                ? "Spoken transcript / lyrics:\n" + transcriptSnippet
                : "Spoken transcript / lyrics: (No caption track found on this video; generate from title and description.)",
            YouTubeVideoInsights.PromptLines(extras),
        }.Where(s => s.Length > 0));

        var style = isShort
            ? "a YouTube Short (9:16 vertical) - end the description with #shorts and topic hashtags"
            : "a YouTube video - include topic hashtags in the description";

        var settings = await settingsRepo.GetAsync(ct);
        var footerChannel = owner?.ChannelId ?? chosen?.ChannelId;
        var footer = footerChannel is null ? null : BrandFor(settings, footerChannel).Publishing?.DescriptionFooter;

        var suggestRequest = new YouTubeSuggestRequest(request.Language ?? "en", Fresh: true, Tone: request.Tone ?? "auto",
            Brief: request.Brief, ProviderId: request.ProviderId);
        var suggestion = await SuggestWithFallbackAsync(summary, style, suggestRequest, projectId,
            d => YouTubePublishValidator.WithFooter(d.Trim(), footer), "inspect " + videoId, transcriptSnippet, extras, ct);

        logger.LogInformation("User {UserId} inspected YouTube video {VideoId} (own: {Own}, songs: {Songs}, chapters: {Chapters})",
            currentUser.UserId, videoId, owner is not null, songs.Count, chapters.Count);

        return Ok(ApiResponse<YouTubeVideoInspection>.Ok(new YouTubeVideoInspection(
            videoId,
            isShort ? $"https://youtube.com/shorts/{videoId}" : $"https://www.youtube.com/watch?v={videoId}",
            title,
            channelTitle,
            own?.ThumbnailUrl ?? $"https://i.ytimg.com/vi/{videoId}/mqdefault.jpg",
            duration,
            isShort,
            own?.PublishedAt,
            page.PublishedText,
            owner is null ? null : own!.PrivacyStatus,
            own?.PrivacyStatus == "private" ? own.ScheduledAt : null,
            owner?.ChannelId,
            owner is null ? null : $"https://studio.youtube.com/video/{videoId}/edit",
            own?.CategoryId,
            own?.MadeForKids,
            own?.LicensedContent,
            description,
            tags,
            new YouTubeInspectCaptions(fetched.HasTranscript, fetched.Language, fetched.CaptionsAreAuto, segments.Count,
                CaptionText(segments, fetched.TranscriptText)),
            songs,
            [.. chapters.Select(c => new YouTubeInspectChapter(c.StartSeconds, c.Stamp, c.Title))],
            Hashtags(suggestion.Description),
            suggestion,
            warnings)));
    }

    /// <summary>
    /// Has a private video go public by itself at <see cref="YouTubeScheduleRequest.PublishAt"/>,
    /// or - with no time - takes the schedule off and leaves it private. YouTube refuses a video
    /// that is already public.
    /// </summary>
    [HttpPut("channels/{channelId}/videos/{videoId}/schedule")]
    public async Task<ActionResult<ApiResponse<YouTubeScheduleSaved>>> ScheduleVideo(
        string channelId, string videoId, [FromBody] YouTubeScheduleRequest? request,
        [FromServices] YouTubeChannelVideosClient channelVideos, CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeScheduleSaved>(channelId, ct);
        if (refusal is not null) return refusal;
        if (!YouTubeChannelVideosClient.IsVideoId(videoId)) throw new KeyNotFoundException();

        DateTime? publishAt = null;
        if (request?.PublishAt is { } raw)
        {
            var at = raw.Kind switch
            {
                DateTimeKind.Utc => raw,
                DateTimeKind.Local => raw.ToUniversalTime(),
                _ => DateTime.SpecifyKind(raw, DateTimeKind.Utc)
            };
            var now = DateTime.UtcNow;
            if (at < now + MinScheduleLead)
                return BadRequest(ApiResponse<YouTubeScheduleSaved>.Fail("Pick a time at least 10 minutes from now.",
                    new ApiError("schedule-too-soon", "Pick a time at least 10 minutes from now.", Field: "publishAt")));
            if (at > now + MaxScheduleLead)
                return BadRequest(ApiResponse<YouTubeScheduleSaved>.Fail("Pick a time within the next year.",
                    new ApiError("schedule-too-far", "Pick a time within the next year.", Field: "publishAt")));
            publishAt = at;
        }

        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection!.ChannelId, ct);
            if (publishAt is { } when)
                await channelVideos.SetScheduleAsync(token, videoId, when, ct, expectedChannelId: connection.ChannelId);
            else
                await channelVideos.ClearScheduleAsync(token, videoId, ct, expectedChannelId: connection.ChannelId);

            await audit.RecordAsync("youtube.video.schedule", videoId, null, connection.ChannelId, RemoteAddress(), ct);
            logger.LogInformation("User {UserId} {Change} the publish time of YouTube video {VideoId} on channel {ChannelId}",
                currentUser.UserId, publishAt is null ? "cleared" : "set", videoId, connection.ChannelId);

            var fresh = await channelVideos.GetVideoAsync(token, videoId, ct);
            return Ok(ApiResponse<YouTubeScheduleSaved>.Ok(new YouTubeScheduleSaved(
                videoId, fresh?.PrivacyStatus ?? "private", fresh is null ? publishAt : fresh.ScheduledAt)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Scheduling YouTube video {VideoId} failed: {Code}", videoId, ex.Code);
            return Failure<YouTubeScheduleSaved>(ex);
        }
    }

    /// <summary>
    /// Posts a top-level comment as the channel on one of its videos - the suggested "pinned"
    /// comment. YouTube's API can't pin it; that is one click in Studio afterwards.
    /// </summary>
    [HttpPost("channels/{channelId}/videos/{videoId}/comment")]
    [RequestSizeLimit(64 * 1024)]
    public async Task<ActionResult<ApiResponse<YouTubeCommentPosted>>> PostVideoComment(
        string channelId, string videoId, [FromBody] YouTubeCommentRequest? request,
        [FromServices] YouTubeChannelVideosClient channelVideos, [FromServices] YouTubeCommentClient comments,
        CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeCommentPosted>(channelId, ct);
        if (refusal is not null) return refusal;
        if (!YouTubeChannelVideosClient.IsVideoId(videoId)) throw new KeyNotFoundException();

        var (text, error) = YouTubeCommentRules.Normalize(request?.Text, "text");
        if (error is not null)
            return BadRequest(ApiResponse<YouTubeCommentPosted>.Fail(error.Message, new ApiError(error.Code, error.Message, Field: error.Field)));
        if (text is null)
            return BadRequest(ApiResponse<YouTubeCommentPosted>.Fail("Write the comment first.",
                new ApiError("comment-empty", "Write the comment first.", Field: "text")));

        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection!.ChannelId, ct);
            var video = await channelVideos.GetVideoAsync(token, videoId, ct);
            if (video is null || !string.Equals(video.ChannelId, connection.ChannelId, StringComparison.Ordinal))
                return NotFound(ApiResponse<YouTubeCommentPosted>.Fail("That video isn't on this channel.",
                    new ApiError("video-not-found", "That video isn't on this channel.")));
            if (video.MadeForKids == true)
                return BadRequest(ApiResponse<YouTubeCommentPosted>.Fail("YouTube turns comments off on videos made for kids.",
                    new ApiError("comment-kids", "YouTube turns comments off on videos made for kids.", Field: "text")));
            if (video.PrivacyStatus == "private")
                return BadRequest(ApiResponse<YouTubeCommentPosted>.Fail("The video is private, so no one could read the comment yet.",
                    new ApiError("comment-private", "The video is private, so no one could read the comment yet. Post it once it is public or unlisted.", Field: "text")));

            var commentId = await comments.PostAsync(videoId, text, token, ct);
            await audit.RecordAsync("youtube.video.comment", videoId, null, connection.ChannelId, RemoteAddress(), ct);
            logger.LogInformation("User {UserId} posted a comment on YouTube video {VideoId} on channel {ChannelId}",
                currentUser.UserId, videoId, connection.ChannelId);
            return Ok(ApiResponse<YouTubeCommentPosted>.Ok(new YouTubeCommentPosted(videoId, commentId,
                $"https://studio.youtube.com/video/{videoId}/comments")));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Posting a comment on YouTube video {VideoId} failed: {Code}", videoId, ex.Code);
            return Failure<YouTubeCommentPosted>(ex);
        }
    }

    private ObjectResult InspectFailure(int status, string code, string message, string? field) =>
        StatusCode(status, ApiResponse<YouTubeVideoInspection>.Fail(message, new ApiError(code, message, Field: field)));

    /// <summary>
    /// Someone else's text made fit to fence into a prompt: control characters other than line
    /// breaks dropped, blank runs collapsed, angle brackets removed, cut to <paramref name="max"/>.
    /// </summary>
    private static string PromptText(string? text, int max)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var sb = new StringBuilder(Math.Min(text.Length, max));
        var newlines = 0;
        foreach (var ch in text.Replace("\r\n", "\n", StringComparison.Ordinal))
        {
            if (sb.Length >= max) break;
            if (ch == '\n')
            {
                if (++newlines <= 2) sb.Append('\n');
                continue;
            }
            if (char.IsControl(ch) || ch is '<' or '>') continue;
            newlines = 0;
            sb.Append(ch);
        }
        return sb.ToString().Trim();
    }

    /// <summary>One line of someone else's text for a prompt; null when nothing is left.</summary>
    private static string? PromptLine(string? text, int max) =>
        YouTubeMetadataSuggester.CleanBrief(PromptText(text, max)) is { Length: > 0 } line ? line : null;

    /// <summary>Every caption line as "[m:ss] text", for the page's caption block.</summary>
    private static string CaptionText(IReadOnlyList<YouTubeCaptionSegment> segments, string fallback)
    {
        if (segments.Count == 0) return fallback.Length > MaxCaptionTextChars ? fallback[..MaxCaptionTextChars] : fallback;
        var sb = new StringBuilder();
        foreach (var s in segments)
        {
            var line = $"[{YouTubeChapterBuilder.Stamp(s.StartSeconds)}] {s.Text}";
            if (sb.Length + line.Length + 1 > MaxCaptionTextChars) break;
            sb.Append(line).Append('\n');
        }
        return sb.ToString().TrimEnd();
    }

    private static IReadOnlyList<string> Hashtags(string description) =>
        [.. HashtagPattern().Matches(description).Select(m => m.Value).Distinct(StringComparer.OrdinalIgnoreCase).Take(15)];

    [GeneratedRegex(@"#[\p{L}\p{M}\p{N}_]{2,50}", RegexOptions.CultureInvariant)]
    private static partial Regex HashtagPattern();
}

/// <param name="Video">An 11-character video ID or a watch, Shorts, youtu.be or Studio link.</param>
/// <param name="ChannelId">One of the caller's connected channels, to read its own videos' private details and apply changes.</param>
public sealed record YouTubeInspectRequest(
    string? Video,
    string? ChannelId = null,
    string? Tone = null,
    string? Language = null,
    string? Brief = null,
    string? ProviderId = null);

/// <param name="IsAuto">Whether the captions are YouTube's automatic ones; null when unknown.</param>
/// <param name="Text">Every caption line as "[m:ss] text".</param>
public sealed record YouTubeInspectCaptions(bool Available, string? Language, bool? IsAuto, int LineCount, string Text);

public sealed record YouTubeInspectChapter(double StartSeconds, string Stamp, string Title);

/// <summary>Everything found about one video, and the details written for it.</summary>
/// <param name="Privacy">Only when the video is on one of the caller's channels.</param>
/// <param name="OwnerChannelId">The caller's channel it is on, when it is - the page then offers to apply the details.</param>
/// <param name="LicensedContent">YouTube's own flag that the video has claimed (licensed) content; only for the caller's videos.</param>
public sealed record YouTubeVideoInspection(
    string VideoId,
    string VideoUrl,
    string Title,
    string? ChannelTitle,
    string ThumbnailUrl,
    double? DurationSeconds,
    bool IsShort,
    DateTime? PublishedAt,
    string? PublishedText,
    string? Privacy,
    DateTime? ScheduledAt,
    string? OwnerChannelId,
    string? StudioUrl,
    string? CategoryId,
    bool? MadeForKids,
    bool? LicensedContent,
    string Description,
    IReadOnlyList<string> Tags,
    YouTubeInspectCaptions Captions,
    IReadOnlyList<YouTubeDetectedSong> Songs,
    IReadOnlyList<YouTubeInspectChapter> Chapters,
    IReadOnlyList<string> Hashtags,
    YouTubeSuggestResponse Suggestion,
    IReadOnlyList<string> Warnings);

/// <param name="PublishAt">When it goes public (UTC, or with an offset); null takes the schedule off.</param>
public sealed record YouTubeScheduleRequest(DateTime? PublishAt);

public sealed record YouTubeScheduleSaved(string VideoId, string Privacy, DateTime? ScheduledAt);

public sealed record YouTubeCommentRequest(string? Text);

public sealed record YouTubeCommentPosted(string VideoId, string CommentId, string StudioCommentsUrl);
