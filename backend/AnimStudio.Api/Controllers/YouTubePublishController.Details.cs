using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The details checkup: every video on a connected channel - uploaded from AnimStudio, from
/// the phone or from Studio - with what its details are missing (description, tags, hashtags,
/// playlist, audience), an AI draft to fill them, and a save that writes them to YouTube.
/// <para>
/// The channel must be one of the caller's own connections, and a video is only read or
/// changed after YouTube confirms it is on that channel. Drafts from the AI are untrusted:
/// they fill fields the user reviews, and saving runs them through the same validator as an
/// upload.
/// </para>
/// </summary>
public sealed partial class YouTubePublishController
{
    /// <summary>Playlists whose contents are read to tell which videos are in one; each costs a call per 50 videos.</summary>
    private const int MaxPlaylistsScanned = 50;

    /// <summary>Playlists one save may add a video to.</summary>
    private const int MaxPlaylistsPerSave = 10;

    /// <summary>A video at most this long is checked as a Short (hashtags matter more).</summary>
    private const double ShortMaxSeconds = 180;

    [HttpGet("channels/{channelId}/checkup")]
    public async Task<ActionResult<ApiResponse<YouTubeCheckupResponse>>> Checkup(
        string channelId, [FromQuery] int? max, [FromServices] YouTubeChannelVideosClient channelVideos,
        [FromServices] IYouTubePublicationRepository publicationRecords, CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeCheckupResponse>(channelId, ct);
        if (refusal is not null) return refusal;

        if (!await RefreshSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<YouTubeCheckupResponse>.Fail(
                "Other checks are running. Try again in a minute.", new ApiError("youtube-busy", "Other checks are running. Try again in a minute.")));
        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection!.ChannelId, ct);
            var videos = await channelVideos.ListUploadsDetailedAsync(token, connection.ChannelId, Math.Clamp(max ?? 100, 1, 500), ct);

            // Playlists are a nice-to-have: without them the rest of the checkup still stands.
            IReadOnlyList<YouTubePlaylist> playlists = [];
            var membership = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            string? playlistError = null;
            try
            {
                playlists = await channelVideos.ListPlaylistsAsync(token, ct);
                foreach (var playlist in playlists.Take(MaxPlaylistsScanned))
                {
                    foreach (var videoId in await channelVideos.ListPlaylistVideoIdsAsync(token, playlist.Id, 500, ct))
                    {
                        if (!membership.TryGetValue(videoId, out var list)) membership[videoId] = list = [];
                        list.Add(playlist.Id);
                    }
                }
            }
            catch (YouTubePublishException ex) when (ex.Code != "youtube-reconnect")
            {
                playlistError = "Playlists couldn't be read, so playlist membership isn't checked: " + ex.Message;
            }
            var playlistsKnown = playlistError is null;

            var linked = (await publicationRecords.ListByVideoIdsAsync(currentUser.UserId, [.. videos.Select(v => v.VideoId)], ct))
                .GroupBy(p => p.VideoId, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().ProjectId, StringComparer.Ordinal);

            var rows = videos.Select(v => ToCheckupRow(v,
                membership.TryGetValue(v.VideoId, out var inLists) ? inLists : [],
                playlistsKnown,
                linked.GetValueOrDefault(v.VideoId))).ToList();

            return Ok(ApiResponse<YouTubeCheckupResponse>.Ok(new YouTubeCheckupResponse(
                connection.ChannelId, connection.ChannelTitle,
                [.. playlists.Select(p => new YouTubeCheckupPlaylist(p.Id, p.Title, p.ItemCount))],
                rows, playlistError, DateTime.UtcNow)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeCheckupResponse>(ex);
        }
        finally
        {
            RefreshSlots.Release();
        }
    }

    /// <summary>
    /// Drafts a title, description and tags for a video already on the channel, from what it
    /// has now and - when AnimStudio made it - its project. Saves nothing.
    /// </summary>
    [HttpPost("channels/{channelId}/videos/{videoId}/suggest")]
    public async Task<ActionResult<ApiResponse<YouTubeSuggestResponse>>> SuggestForVideo(
        string channelId, string videoId, [FromBody] YouTubeSuggestRequest? request,
        [FromServices] YouTubeChannelVideosClient channelVideos, [FromServices] IYouTubePublicationRepository publicationRecords,
        CancellationToken ct)
    {
        if (request?.Brief is { Length: > YouTubeMetadataSuggester.MaxBriefChars * 4 }
            || request?.Tone is { } tone && !YouTubeMetadataSuggester.Tones.ContainsKey(tone))
            return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-input-invalid",
                $"Keep the notes under {YouTubeMetadataSuggester.MaxBriefChars} characters and pick a tone from the list.");

        var (connection, refusal) = await EditableChannelAsync<YouTubeSuggestResponse>(channelId, ct);
        if (refusal is not null) return refusal;

        YouTubeVideoFullDetails? video;
        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection!.ChannelId, ct);
            video = await channelVideos.GetVideoAsync(token, videoId, ct);
        }
        catch (YouTubePublishException ex)
        {
            return SuggestFailure(StatusCodes.Status502BadGateway, ex.Code, ex.Message);
        }
        if (video is null || !string.Equals(video.ChannelId, connection.ChannelId, StringComparison.Ordinal))
            return SuggestFailure(StatusCodes.Status404NotFound, "video-not-found", "That video isn't on this channel.");

        // A video AnimStudio made still has its project: its name, description and script say the most.
        string? projectId = null;
        var projectSummary = string.Empty;
        var record = (await publicationRecords.ListByVideoIdsAsync(currentUser.UserId, [video.VideoId], ct)).FirstOrDefault();
        if (record is not null && await projects.GetAsync(record.ProjectId, ct) is { } project
            && string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            projectId = project.Id;
            projectSummary = YouTubeMetadataSuggester.BuildSummary(project.Name, project.Description,
                await scenes.ListByProjectAsync(project.Id, ct), null);
        }

        var summary = string.Join('\n', new[]
        {
            projectSummary,
            "Channel: " + connection.ChannelTitle,
            "Current title: " + video.Title,
            video.Description.Length > 0
                ? "Current description: " + (video.Description.Length > 2000 ? video.Description[..2000] : video.Description)
                : "Current description: (none)",
            video.Tags.Count > 0 ? "Current tags: " + string.Join(", ", video.Tags.Take(30)) : "Current tags: (none)",
        }.Where(s => s.Length > 0));

        var style = video.DurationSeconds is <= ShortMaxSeconds
            ? "a YouTube Short - end the description with #shorts and two or three topic hashtags"
            : "a YouTube video - include two or three topic hashtags in the description";

        var settings = await settingsRepo.GetAsync(ct);
        var footer = BrandFor(settings, connection.ChannelId).Publishing?.DescriptionFooter;

        return await WriteSuggestionAsync(summary, style, request, projectId,
            d => YouTubePublishValidator.WithFooter(d.Trim(), footer), "video " + video.VideoId, ct);
    }

    /// <summary>
    /// Writes reviewed details onto a video on the channel (keeping every field AnimStudio
    /// doesn't own) and adds it to the chosen playlists. Returns the video as YouTube now has it.
    /// </summary>
    [HttpPut("channels/{channelId}/videos/{videoId}")]
    public async Task<ActionResult<ApiResponse<YouTubeCheckupSaveResponse>>> SaveVideoDetails(
        string channelId, string videoId, [FromBody] YouTubeVideoDetailsRequest? request,
        [FromServices] YouTubeChannelVideosClient channelVideos, [FromServices] IYouTubePublicationRepository publicationRecords,
        CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeCheckupSaveResponse>(channelId, ct);
        if (refusal is not null) return refusal;
        if (!YouTubeChannelVideosClient.IsVideoId(videoId)) throw new KeyNotFoundException();

        var validation = YouTubePublishValidator.ValidateDetails(request?.Metadata);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<YouTubeCheckupSaveResponse>.Fail(validation.Errors[0].Message,
                [.. validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));

        var playlistIds = (request!.AddToPlaylistIds ?? []).Distinct(StringComparer.Ordinal).ToList();
        if (playlistIds.Count > MaxPlaylistsPerSave || playlistIds.Any(id => !YouTubeChannelVideosClient.IsPlaylistId(id)))
            return BadRequest(ApiResponse<YouTubeCheckupSaveResponse>.Fail("Pick playlists from the list.",
                new ApiError("playlist-invalid", $"Pick up to {MaxPlaylistsPerSave} playlists from the list.", Field: "addToPlaylistIds")));

        var details = validation.Normalized!;
        var warnings = new List<string>();
        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection!.ChannelId, ct);

            // Only the channel's own playlists - an id from the client is checked against them.
            if (playlistIds.Count > 0)
            {
                var own = (await channelVideos.ListPlaylistsAsync(token, ct)).Select(p => p.Id).ToHashSet(StringComparer.Ordinal);
                if (!playlistIds.All(own.Contains))
                    return BadRequest(ApiResponse<YouTubeCheckupSaveResponse>.Fail("A playlist isn't on this channel any more.",
                        new ApiError("playlist-invalid", "A playlist isn't on this channel any more. Refresh and pick again.", Field: "addToPlaylistIds")));
            }

            await channelVideos.UpdateDetailsAsync(token, videoId,
                new YouTubeVideoDetails(details.Title, details.Description, details.Tags, details.CategoryId, details.Privacy, details.MadeForKids),
                ct, expectedChannelId: connection.ChannelId);

            var added = new List<string>();
            foreach (var playlistId in playlistIds)
            {
                try
                {
                    await channelVideos.AddToPlaylistAsync(token, playlistId, videoId, ct);
                    added.Add(playlistId);
                }
                catch (YouTubePublishException ex)
                {
                    // The details are already saved; a playlist that refused is reported, not fatal.
                    warnings.Add("Not added to a playlist: " + ex.Message);
                }
            }

            await audit.RecordAsync("youtube.video.details", videoId, null, connection.ChannelId, RemoteAddress(), ct);
            logger.LogInformation("User {UserId} updated details of YouTube video {VideoId} on channel {ChannelId}",
                currentUser.UserId, videoId, connection.ChannelId);

            var fresh = await channelVideos.GetVideoAsync(token, videoId, ct)
                ?? throw new YouTubePublishException("handoff-video-missing", "That video isn't on the channel any more.");
            var inLists = (request.CurrentPlaylistIds ?? []).Where(YouTubeChannelVideosClient.IsPlaylistId).Concat(added)
                .Distinct(StringComparer.Ordinal).ToList();
            var projectId = (await publicationRecords.ListByVideoIdsAsync(currentUser.UserId, [videoId], ct)).FirstOrDefault()?.ProjectId;
            return Ok(ApiResponse<YouTubeCheckupSaveResponse>.Ok(new YouTubeCheckupSaveResponse(
                ToCheckupRow(fresh, inLists, request.PlaylistsKnown, projectId), warnings)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Updating details of YouTube video {VideoId} failed: {Code}", videoId, ex.Code);
            return Failure<YouTubeCheckupSaveResponse>(ex);
        }
    }

    /// <summary>
    /// What the edit dialog adds around a video: the brand channel's description footer and
    /// default tags, and - for a video AnimStudio published - its project and the render it
    /// came from, so a frame of it can become the thumbnail. Reads nothing from YouTube.
    /// </summary>
    [HttpGet("channels/{channelId}/videos/{videoId}/context")]
    public async Task<ActionResult<ApiResponse<YouTubeVideoEditContext>>> VideoContext(
        string channelId, string videoId, [FromServices] IYouTubePublicationRepository publicationRecords, CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeVideoEditContext>(channelId, ct);
        if (refusal is not null) return refusal;
        if (!YouTubeChannelVideosClient.IsVideoId(videoId)) throw new KeyNotFoundException();

        var (project, job) = await LinkedRenderAsync(publicationRecords, connection!.ChannelId, videoId, ct);
        var settings = await settingsRepo.GetAsync(ct);
        var (brandName, publishing) = BrandFor(settings, connection.ChannelId);

        // The project's own brand channel is what the video was published with; it wins when it has a setup.
        if (project is not null && settings?.PublishingFor(project.Settings.BrandChannelId) is { } projectPublishing)
        {
            publishing = projectPublishing;
            brandName = settings.FindChannel(project.Settings.BrandChannelId)?.Name ?? settings.DefaultChannelName;
        }

        var facts = job is null ? null : Facts(job);
        return Ok(ApiResponse<YouTubeVideoEditContext>.Ok(new YouTubeVideoEditContext(
            brandName,
            string.IsNullOrWhiteSpace(publishing?.DescriptionFooter) ? null : publishing.DescriptionFooter.Trim(),
            publishing?.Tags ?? [],
            project is null ? null : new YouTubeVideoProjectContext(
                project.Id, project.Name, project.Description ?? string.Empty,
                job?.Id, facts?.DurationSeconds, facts?.IsVertical ?? false))));
    }

    /// <summary>
    /// Sets a new custom thumbnail on a video on the channel: a picture the user uploads, or a
    /// frame of the AnimStudio render it was published from. Every picture is re-encoded on
    /// the server, so YouTube never receives the client's bytes as they came.
    /// </summary>
    [HttpPut("channels/{channelId}/videos/{videoId}/thumbnail")]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<YouTubeThumbnailSaved>>> SetVideoThumbnail(
        string channelId, string videoId, [FromBody] YouTubeThumbnailChoice? request,
        [FromServices] YouTubeChannelVideosClient channelVideos, [FromServices] YouTubeVideoUploader uploader,
        [FromServices] IYouTubePublicationRepository publicationRecords, CancellationToken ct)
    {
        var (connection, refusal) = await EditableChannelAsync<YouTubeThumbnailSaved>(channelId, ct);
        if (refusal is not null) return refusal;
        if (!YouTubeChannelVideosClient.IsVideoId(videoId)) throw new KeyNotFoundException();

        // A frame comes from the render the video was published from - found here, never named by the client.
        var (_, job) = await LinkedRenderAsync(publicationRecords, connection!.ChannelId, videoId, ct);
        var (source, frameAt, image, error) = YouTubeThumbnailRules.Check(request, job is null ? null : Facts(job).DurationSeconds);
        if (error is not null)
            return BadRequest(ApiResponse<YouTubeThumbnailSaved>.Fail(error.Message, new ApiError(error.Code, error.Message, Field: error.Field)));
        if (source == YouTubeThumbnailSource.None)
            return BadRequest(ApiResponse<YouTubeThumbnailSaved>.Fail("Pick a frame or a picture first.",
                new ApiError("thumbnail-missing", "Pick a frame or a picture first.", Field: YouTubeThumbnailRules.Field)));
        if (source == YouTubeThumbnailSource.Frame && job is null)
            return BadRequest(ApiResponse<YouTubeThumbnailSaved>.Fail("Frames are only offered for videos published from AnimStudio.",
                new ApiError("thumbnail-frame-invalid", "Frames are only offered for videos published from AnimStudio. Upload a picture instead.", Field: YouTubeThumbnailRules.Field)));

        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, connection.ChannelId, ct);
            var video = await channelVideos.GetVideoAsync(token, videoId, ct);
            if (video is null || !string.Equals(video.ChannelId, connection.ChannelId, StringComparison.Ordinal))
                return NotFound(ApiResponse<YouTubeThumbnailSaved>.Fail("That video isn't on this channel.",
                    new ApiError("video-not-found", "That video isn't on this channel.")));

            var jpeg = source == YouTubeThumbnailSource.Frame
                ? await thumbnails.FrameAsync(await RenderPreviewFile.EnsureAsync(store, dataPaths, job!, ct), frameAt, YouTubeThumbnailRules.TargetWidth, ct)
                : await thumbnails.NormalizeAsync(image!, ct);

            var refused = await uploader.SetThumbnailAsync(videoId, jpeg,
                (_, token2) => connections.GetAccessTokenAsync(currentUser.UserId, connection.ChannelId, token2), ct);
            if (refused is not null)
            {
                var message = YouTubeThumbnailRules.ChangeRefusedMessage(refused);
                return BadRequest(ApiResponse<YouTubeThumbnailSaved>.Fail(message,
                    new ApiError("thumbnail-refused", message, Field: YouTubeThumbnailRules.Field)));
            }

            await audit.RecordAsync("youtube.video.thumbnail", videoId, null, connection.ChannelId, RemoteAddress(), ct);
            logger.LogInformation("User {UserId} set the thumbnail of YouTube video {VideoId} on channel {ChannelId} from a {Source}",
                currentUser.UserId, videoId, connection.ChannelId, source);
            return Ok(ApiResponse<YouTubeThumbnailSaved>.Ok(new YouTubeThumbnailSaved(videoId, DateTime.UtcNow)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Setting the thumbnail of YouTube video {VideoId} failed: {Code}", videoId, ex.Code);
            return Failure<YouTubeThumbnailSaved>(ex);
        }
    }

    /// <summary>
    /// The caller's own project and finished render a video was published from, when AnimStudio
    /// published it. Either is null when it is gone, isn't the caller's, or has no output any more.
    /// </summary>
    private async Task<(Project? Project, RenderJob? Job)> LinkedRenderAsync(
        IYouTubePublicationRepository publicationRecords, string youTubeChannelId, string videoId, CancellationToken ct)
    {
        var records = await publicationRecords.ListByVideoIdsAsync(currentUser.UserId, [videoId], ct);
        var record = records.FirstOrDefault(r => string.Equals(r.ChannelId, youTubeChannelId, StringComparison.Ordinal))
            ?? records.FirstOrDefault();
        if (record is null) return (null, null);

        var project = await projects.GetAsync(record.ProjectId, ct);
        if (project is not null && !string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal)) project = null;

        var job = string.IsNullOrEmpty(record.JobId) ? null : await jobs.GetAsync(record.JobId, ct);
        if (job is not null && (!string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal) || !Facts(job).HasOutput)) job = null;
        return (project, job);
    }

    /// <summary>The brand channel that publishes to a YouTube channel - its name and setup - or nulls when none does.</summary>
    private static (string? Name, ChannelPublishSettings? Publishing) BrandFor(AiSettings? settings, string youTubeChannelId)
    {
        if (settings is null) return (null, null);
        if (settings.DefaultPublishing?.YouTubeChannelId == youTubeChannelId) return (settings.DefaultChannelName, settings.DefaultPublishing);
        var channel = settings.Channels.FirstOrDefault(c => c.Publishing?.YouTubeChannelId == youTubeChannelId);
        return channel is null ? (null, null) : (channel.Name, channel.Publishing);
    }

    /// <summary>The caller's connection for a channel that can be edited, or the response refusing it.</summary>
    private async Task<(YouTubeChannelConnection? Connection, ActionResult<ApiResponse<T>>? Refusal)> EditableChannelAsync<T>(
        string channelId, CancellationToken ct)
    {
        if (!IsChannelId(channelId)) throw new KeyNotFoundException();
        var connection = await connections.GetAsync(currentUser.UserId, channelId, ct);
        if (connection is null) throw new KeyNotFoundException();
        if (connection.RevokedAt is not null)
            return (null, BadRequest(ApiResponse<T>.Fail("Reconnect this channel.",
                new ApiError("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.", Field: "channelId"))));
        // Editing a video's details needs the same permission comments do.
        if (!YouTubeOAuthClient.AllowsComments(connection.Scopes))
            return (null, BadRequest(ApiResponse<T>.Fail("Reconnect this channel to edit videos.",
                new ApiError("youtube-edit-scope", "This channel was connected before AnimStudio could edit videos. Reconnect it, then try again.", Field: "channelId"))));
        return (connection, null);
    }

    private static YouTubeCheckupVideo ToCheckupRow(YouTubeVideoFullDetails v, IReadOnlyList<string> playlistIds, bool playlistsKnown, string? projectId)
    {
        var isShort = v.DurationSeconds is > 0 and <= ShortMaxSeconds;
        var issues = YouTubeDetailsAudit.Check(new YouTubeDetailsFacts(
            v.Title, v.Description, v.Tags, playlistsKnown ? playlistIds.Count > 0 : null, v.MadeForKids, isShort));
        return new YouTubeCheckupVideo(
            v.VideoId, v.Title, v.Description, v.Tags, v.CategoryId, v.PrivacyStatus, v.MadeForKids, v.PublishedAt,
            v.DurationSeconds, v.ThumbnailUrl, isShort, playlistIds, issues,
            isShort ? $"https://youtube.com/shorts/{v.VideoId}" : $"https://youtu.be/{v.VideoId}",
            $"https://studio.youtube.com/video/{v.VideoId}/edit",
            projectId);
    }
}

public sealed record YouTubeCheckupPlaylist(string Id, string Title, int ItemCount);

public sealed record YouTubeCheckupVideo(
    string VideoId,
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string? CategoryId,
    string? Privacy,
    bool? MadeForKids,
    DateTime? PublishedAt,
    double? DurationSeconds,
    string? ThumbnailUrl,
    bool IsShort,
    IReadOnlyList<string> PlaylistIds,
    IReadOnlyList<YouTubeDetailsIssue> Issues,
    string VideoUrl,
    string StudioUrl,
    /// <summary>The AnimStudio project it was published from, if any.</summary>
    string? ProjectId);

public sealed record YouTubeCheckupResponse(
    string ChannelId,
    string ChannelTitle,
    IReadOnlyList<YouTubeCheckupPlaylist> Playlists,
    IReadOnlyList<YouTubeCheckupVideo> Videos,
    string? PlaylistError,
    DateTime CheckedAt);

/// <param name="AddToPlaylistIds">Playlists to add the video to; it isn't taken out of any.</param>
/// <param name="CurrentPlaylistIds">The playlists the page already knows it's in - only for the returned row.</param>
/// <param name="PlaylistsKnown">Whether the page could read playlists at all - only for the returned row.</param>
public sealed record YouTubeVideoDetailsRequest(
    YouTubeVideoMetadata? Metadata,
    IReadOnlyList<string>? AddToPlaylistIds = null,
    IReadOnlyList<string>? CurrentPlaylistIds = null,
    bool PlaylistsKnown = true);

public sealed record YouTubeCheckupSaveResponse(YouTubeCheckupVideo Video, IReadOnlyList<string> Warnings);

/// <summary>What the edit dialog shows around a video on the channel.</summary>
/// <param name="BrandChannelName">The brand channel whose setup applies, if any publishes here.</param>
/// <param name="DescriptionFooter">That setup's footer - links, credits - to end the description with.</param>
/// <param name="DefaultTags">That setup's tags, offered to add to the video's own.</param>
/// <param name="Project">The AnimStudio project it was published from, if any.</param>
public sealed record YouTubeVideoEditContext(
    string? BrandChannelName,
    string? DescriptionFooter,
    IReadOnlyList<string> DefaultTags,
    YouTubeVideoProjectContext? Project);

/// <param name="RenderJobId">The finished render it was published from, for frames; null when that render is gone.</param>
public sealed record YouTubeVideoProjectContext(
    string Id,
    string Name,
    string Description,
    string? RenderJobId,
    double? DurationSeconds,
    bool IsVertical);

public sealed record YouTubeThumbnailSaved(string VideoId, DateTime SetAt);
