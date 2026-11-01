using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Send to phone: for a Short that should carry a song from YouTube's own Shorts library -
/// licensed only when it is added in the YouTube app - the render goes to the user's Google
/// Drive, they upload it from the app and add the sound, and the title, description, tags and
/// settings prepared here are put on that upload once it appears on the channel.
/// <para>
/// The details are checked against the same rules as a direct upload before anything is
/// sent. Every handoff is the caller's own: ids from the client are only ever looked up
/// together with the current user.
/// </para>
/// </summary>
public sealed partial class YouTubePublishController
{
    private const int MaxHandoffsListed = 50;

    /// <summary>The Drive a channel's videos go to (its own, or the personal one); no channel is the personal Drive.</summary>
    [HttpGet("drive")]
    public async Task<ActionResult<ApiResponse<GoogleDriveStatus>>> DriveStatus(
        [FromQuery] string? channelId, [FromServices] GoogleDriveConnectionStore drive, CancellationToken ct)
    {
        if (!IsOptionalChannelId(channelId)) return DriveBadRequest<GoogleDriveStatus>("channel-invalid", "Unknown channel.", "channelId");
        try
        {
            return Ok(ApiResponse<GoogleDriveStatus>.Ok(await drive.GetStatusAsync(currentUser.UserId, channelId, ct)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<GoogleDriveStatus>(ex);
        }
    }

    /// <summary>The personal Drive, then what every connected channel uses.</summary>
    [HttpGet("drive/connections")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GoogleDriveStatus>>>> DriveConnections(
        [FromServices] GoogleDriveConnectionStore drive, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<GoogleDriveStatus>>.Ok(await drive.ListAsync(currentUser.UserId, ct)));

    [HttpPost("drive/oauth/start")]
    public async Task<ActionResult<ApiResponse<YouTubeConnectStartResponse>>> StartDriveConnect(
        [FromServices] GoogleDriveConnectionStore drive, [FromBody] DriveConnectStartRequest? request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Connecting Google Drive is sensitive and requires an authenticated member account. Anonymous visitors cannot connect Google Drive.";
            return StatusCode(403, ApiResponse<YouTubeConnectStartResponse>.Fail(msg, new ApiError("auth-required", msg)));
        }

        if (!IsOptionalChannelId(request?.ChannelId))
            return DriveBadRequest<YouTubeConnectStartResponse>("channel-invalid", "Unknown channel.", "channelId");
        try
        {
            return Ok(ApiResponse<YouTubeConnectStartResponse>.Ok(
                new YouTubeConnectStartResponse(await drive.BeginConnectAsync(currentUser.UserId, request?.ChannelId, request?.ReturnPath, ct))));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeConnectStartResponse>(ex);
        }
    }

    [HttpPost("drive/oauth/complete")]
    public async Task<ActionResult<ApiResponse<DriveConnectCompleteResponse>>> CompleteDriveConnect(
        [FromServices] GoogleDriveConnectionStore drive, [FromBody] YouTubeConnectCompleteRequest? request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Connecting Google Drive requires an authenticated member account.";
            return StatusCode(403, ApiResponse<DriveConnectCompleteResponse>.Fail(msg, new ApiError("auth-required", msg)));
        }

        try
        {
            var (status, returnPath) = await drive.CompleteConnectAsync(currentUser.UserId, request?.Code, request?.State, ct);
            await audit.RecordAsync("google.drive.connect", currentUser.UserId, null, status.ChannelId ?? "personal", RemoteAddress(), ct);
            return Ok(ApiResponse<DriveConnectCompleteResponse>.Ok(new DriveConnectCompleteResponse(status, returnPath)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Google Drive connect failed for user {UserId} from {RemoteAddress}: {Code}",
                currentUser.UserId, RemoteAddress(), ex.Code);
            return Failure<DriveConnectCompleteResponse>(ex);
        }
    }

    [HttpPut("drive/folder")]
    public async Task<ActionResult<ApiResponse<GoogleDriveStatus>>> SetDriveFolder(
        [FromServices] GoogleDriveConnectionStore drive, [FromBody] DriveFolderRequest? request, CancellationToken ct)
    {
        if (!IsOptionalChannelId(request?.ChannelId)) return DriveBadRequest<GoogleDriveStatus>("channel-invalid", "Unknown channel.", "channelId");
        try
        {
            return Ok(ApiResponse<GoogleDriveStatus>.Ok(await drive.SetFolderAsync(currentUser.UserId, request?.ChannelId, request?.FolderName, ct)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<GoogleDriveStatus>(ex);
        }
    }

    /// <summary>Folders to pick from on the Drive a channel uses - the ones AnimStudio made there.</summary>
    [HttpGet("drive/folders")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<string>>>> DriveFolders(
        [FromQuery] string? channelId, [FromServices] GoogleDriveConnectionStore drive, CancellationToken ct)
    {
        if (!IsOptionalChannelId(channelId)) return DriveBadRequest<IReadOnlyList<string>>("channel-invalid", "Unknown channel.", "channelId");
        try
        {
            return Ok(ApiResponse<IReadOnlyList<string>>.Ok(await drive.ListFoldersAsync(currentUser.UserId, channelId, ct)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<IReadOnlyList<string>>(ex);
        }
    }

    [HttpDelete("drive")]
    public async Task<IActionResult> DisconnectDrive(
        [FromQuery] string? channelId, [FromServices] GoogleDriveConnectionStore drive, CancellationToken ct)
    {
        if (!IsOptionalChannelId(channelId)) return DriveBadRequest<string>("channel-invalid", "Unknown channel.", "channelId");
        try
        {
            if (!await drive.DisconnectAsync(currentUser.UserId, channelId, ct))
                return NotFound(ApiResponse<string>.Fail("Google Drive isn't connected.", new ApiError("not-found", "Google Drive isn't connected.")));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<string>(ex).Result!;
        }

        await audit.RecordAsync("google.drive.disconnect", currentUser.UserId, channelId ?? "personal", "none", RemoteAddress(), ct);
        return NoContent();
    }

    /// <summary>
    /// Copies a finished render to Google Drive - the channel's own Drive if it has one, else
    /// the personal Drive in the channel's folder. Nothing is put on YouTube. Returns at once
    /// with a handoff to poll.
    /// </summary>
    [HttpPost("render-jobs/{jobId}/save-to-drive")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> SaveToDrive(
        string jobId, [FromBody] SaveToDriveRequest? request,
        [FromServices] GoogleDriveConnectionStore drive, [FromServices] PhoneHandoffManager handoffs,
        [FromServices] IPhoneHandoffRepository repository, [FromServices] IContentTopicRepository topics, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Saving renders to Google Drive requires an authenticated member account. Anonymous visitors cannot save to cloud storage.";
            return StatusCode(403, ApiResponse<PhoneHandoffStatus>.Fail(msg, new ApiError("auth-required", msg)));
        }

        var job = await LoadOwnedJobAsync(jobId, ct);
        if (!IsOptionalChannelId(request?.ChannelId)) return HandoffBadRequest("channel-invalid", "Unknown channel.", "channelId");
        if (job.Status is not (RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings) || job.OutputStorageKey is null)
            return HandoffBadRequest("render-not-ready", "This render hasn't finished yet. Save it to Drive once it's done.", "jobId");

        DriveTarget target;
        ContentTopic? topic;
        try
        {
            target = await drive.ResolveAsync(currentUser.UserId, request?.ChannelId, request?.FolderName, ct);
            topic = await DriveCopies.ResolveTopicAsync(topics, currentUser.UserId, request?.TopicId ?? job.TopicId, ct);
        }
        catch (YouTubePublishException ex)
        {
            return HandoffBadRequest(ex.Code, ex.Message, ex.Code switch { "drive-folder-invalid" => "folderName", "topic-invalid" => "topicId", _ => "drive" });
        }

        var project = await projects.GetAsync(job.ProjectId, ct);
        var title = DriveLayout.TitleFor(job, project?.Name);
        var handoff = DriveCopies.SaveOnly(currentUser.UserId, job, project?.Name, request?.ChannelId, title, target, PhoneHandoffState.Sending, topic);
        handoff.TotalBytes = job.OutputSizeBytes ?? 0;
        await repository.UpsertAsync(handoff, ct);
        handoffs.StartSending(handoff, job.OutputStorageKey!, job.OutputSizeBytes ?? 0);

        logger.LogInformation("User {UserId} saved render {JobId} to Google Drive", currentUser.UserId, job.Id);
        return Accepted(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(handoff)));
    }

    private static bool IsOptionalChannelId(string? channelId) => channelId is null || IsChannelId(channelId);

    private BadRequestObjectResult DriveBadRequest<T>(string code, string message, string field) =>
        BadRequest(ApiResponse<T>.Fail(message, new ApiError(code, message, Field: field)));

    /// <summary>Checks the details like a direct upload would, then starts the copy to Drive. Returns at once with a handoff to poll.</summary>
    [HttpPost("render-jobs/{jobId}/send-to-phone")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> SendToPhone(
        string jobId, [FromBody] SendToPhoneRequest? request,
        [FromServices] GoogleDriveConnectionStore drive, [FromServices] PhoneHandoffManager handoffs,
        [FromServices] IPhoneHandoffRepository repository, [FromServices] IContentTopicRepository topics, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Phone handoff via Google Drive requires an authenticated member account. Anonymous visitors cannot export to cloud storage.";
            return StatusCode(403, ApiResponse<PhoneHandoffStatus>.Fail(msg, new ApiError("auth-required", msg)));
        }

        var job = await LoadOwnedJobAsync(jobId, ct);
        var facts = Facts(job);

        if (request is null || !IsChannelId(request.ChannelId))
            return HandoffBadRequest("channel-missing", "Choose the channel you'll upload to from the phone.", "channelId");

        var connection = await connections.GetAsync(currentUser.UserId, request.ChannelId!, ct);
        if (connection is null)
            return HandoffBadRequest("youtube-channel-not-connected", "That channel isn't connected. Connect it first.", "channelId");
        if (connection.RevokedAt is not null)
            return HandoffBadRequest("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.", "channelId");
        // Editing a video's details needs the same permission comments do.
        if (!YouTubeOAuthClient.AllowsComments(connection.Scopes))
            return HandoffBadRequest("youtube-edit-scope",
                "This channel was connected before AnimStudio could edit videos. Reconnect it, then send again.", "channelId");

        var relatedIds = (request.RelatedVideoIds ?? []).Distinct(StringComparer.Ordinal).ToList();
        if (relatedIds.Count > YouTubeRelatedVideos.MaxRelated || relatedIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            return HandoffBadRequest("related-invalid", $"Choose up to {YouTubeRelatedVideos.MaxRelated} related videos from the list.", "relatedVideoIds");
        var related = await publications.ResolveRelatedAsync(currentUser.UserId, relatedIds, ct);
        if (related.Count != relatedIds.Count)
            return HandoffBadRequest("related-not-found", "A related video is no longer in your list. Pick again.", "relatedVideoIds");
        // The phone uploads the file itself and only the details are applied afterwards, so a
        // publish time can't be honoured; refused rather than silently dropped.
        if (request.Metadata?.PublishAt is not null)
            return HandoffBadRequest("schedule-not-on-phone", "Scheduling isn't available when uploading from the phone. Pick another visibility.", "publishAt");

        var metadata = request.Metadata is null || related.Count == 0
            ? request.Metadata
            : request.Metadata with { Description = YouTubeRelatedVideos.AppendToDescription(request.Metadata.Description ?? string.Empty, related) };
        var validation = YouTubePublishValidator.Validate(metadata, facts);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return BadRequest(ApiResponse<PhoneHandoffStatus>.Fail(first.Message,
                [.. validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        var (firstComment, commentError) = YouTubeCommentRules.Normalize(request.FirstComment);
        if (commentError is not null)
            return HandoffBadRequest(commentError.Code, commentError.Message, commentError.Field);

        // The channel's own Drive if it has one, else the personal Drive in the channel's folder.
        DriveTarget target;
        ContentTopic? topic;
        try
        {
            target = await drive.ResolveAsync(currentUser.UserId, connection.ChannelId, request.FolderName, ct);
            topic = await DriveCopies.ResolveTopicAsync(topics, currentUser.UserId, request.TopicId ?? job.TopicId, ct);
        }
        catch (YouTubePublishException ex)
        {
            return HandoffBadRequest(ex.Code, ex.Message, ex.Code switch { "drive-folder-invalid" => "folderName", "topic-invalid" => "topicId", _ => "drive" });
        }

        var details = validation.Normalized!;
        var project = await projects.GetAsync(job.ProjectId, ct);
        var topicFolder = topic is null ? null : DriveCopies.TopicFolderName(topic);
        var handoff = new PhoneHandoff
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = currentUser.UserId,
            ProjectId = job.ProjectId,
            JobId = job.Id,
            ChannelId = connection.ChannelId,
            ChannelTitle = connection.ChannelTitle,
            Title = details.Title,
            Description = details.Description,
            Tags = [.. details.Tags],
            CategoryId = details.CategoryId,
            Privacy = details.Privacy,
            MadeForKids = details.MadeForKids,
            FirstComment = firstComment,
            RelatedVideoIds = [.. related.Select(r => r.VideoId)],
            DurationSeconds = facts.DurationSeconds,
            Muted = request.MuteAudio,
            DriveChannelId = target.DriveChannelId,
            DriveFolderName = target.FolderName,
            TopicId = topic?.Id,
            Topic = topicFolder,
            DriveSubfolders = topicFolder is null ? [.. DriveLayout.FoldersFor(project?.Name, job)] : [.. DriveCopies.TopicPath(topicFolder)],
            DriveFileName = PhoneHandoffManager.FileNameFor(details.Title),
            TotalBytes = job.OutputSizeBytes ?? 0,
            State = PhoneHandoffState.Sending,
            CreatedAt = DateTime.UtcNow
        };
        await repository.UpsertAsync(handoff, ct);
        handoffs.StartSending(handoff, job.OutputStorageKey!, job.OutputSizeBytes ?? 0);

        logger.LogInformation("User {UserId} sent render {JobId} to Google Drive for a phone upload to channel {ChannelId}",
            currentUser.UserId, job.Id, connection.ChannelId);
        return Accepted(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(handoff)));
    }

    /// <summary>The caller's phone handoffs, newest first; <paramref name="jobId"/> only narrows.</summary>
    [HttpGet("phone-handoffs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PhoneHandoffStatus>>>> ListHandoffs(
        [FromQuery] string? jobId, [FromServices] PhoneHandoffManager handoffs, [FromServices] IPhoneHandoffRepository repository, CancellationToken ct)
    {
        if (jobId is not null && !IsEntityId(jobId))
            return BadRequest(ApiResponse<IReadOnlyList<PhoneHandoffStatus>>.Fail("Unknown render.", new ApiError("job-invalid", "Unknown render.", Field: "jobId")));

        var list = await repository.ListByUserAsync(currentUser.UserId, jobId, MaxHandoffsListed, ct);
        return Ok(ApiResponse<IReadOnlyList<PhoneHandoffStatus>>.Ok([.. list.Select(handoffs.Describe)]));
    }

    [HttpGet("phone-handoffs/{id}")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> GetHandoff(
        string id, [FromServices] PhoneHandoffManager handoffs, [FromServices] IPhoneHandoffRepository repository, CancellationToken ct) =>
        Ok(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(await LoadOwnedHandoffAsync(repository, id, ct))));

    /// <summary>Stops a copy still going, or stops waiting for the phone upload. Nothing on Drive or YouTube is deleted.</summary>
    [HttpPost("phone-handoffs/{id}/cancel")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> CancelHandoff(
        string id, [FromServices] PhoneHandoffManager handoffs, [FromServices] IPhoneHandoffRepository repository, CancellationToken ct)
    {
        var handoff = await LoadOwnedHandoffAsync(repository, id, ct);
        if (handoff.State == PhoneHandoffState.Sending && handoffs.CancelSending(handoff.Id))
            return Ok(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(handoff)));

        if (handoff.State is PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Expired or PhoneHandoffState.WaitingForRender)
        {
            handoff.State = PhoneHandoffState.Cancelled;
            await repository.UpsertAsync(handoff, ct);
        }
        return Ok(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(handoff)));
    }

    /// <summary>
    /// Looks for the phone upload now instead of at the next background check, applies the
    /// details if exactly one video fits, and lists the channel's new videos to pick from otherwise.
    /// </summary>
    [HttpPost("phone-handoffs/{id}/check")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffCheckResponse>>> CheckHandoff(
        string id, [FromServices] PhoneHandoffManager handoffs, [FromServices] IPhoneHandoffRepository repository, CancellationToken ct)
    {
        var handoff = await LoadOwnedHandoffAsync(repository, id, ct);
        if (handoff.State is not (PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Expired))
            return Ok(ApiResponse<PhoneHandoffCheckResponse>.Ok(new PhoneHandoffCheckResponse(handoffs.Describe(handoff), [])));

        if (!await RefreshSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<PhoneHandoffCheckResponse>.Fail(
                "Other checks are running. Try again in a minute.", new ApiError("youtube-busy", "Other checks are running. Try again in a minute.")));
        try
        {
            var services = HttpContext.RequestServices;
            handoff = await handoffs.CheckNowAsync(services, handoff, ct);
            var candidates = handoff.State is PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Expired
                ? await handoffs.FindCandidatesAsync(services, handoff, ct)
                : [];
            return Ok(ApiResponse<PhoneHandoffCheckResponse>.Ok(new PhoneHandoffCheckResponse(
                handoffs.Describe(handoff),
                [.. candidates.Select(c => new PhoneUploadCandidateResponse(c.Video.VideoId, c.Video.Title, c.Video.PublishedAt,
                    c.Video.DurationSeconds, c.Video.PrivacyStatus, c.Video.ThumbnailUrl, c.Likely))])));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<PhoneHandoffCheckResponse>(ex);
        }
        finally
        {
            RefreshSlots.Release();
        }
    }

    /// <summary>Puts the details on the video the user picked from the channel's new uploads.</summary>
    [HttpPost("phone-handoffs/{id}/apply")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> ApplyHandoff(
        string id, [FromBody] ApplyHandoffRequest? request,
        [FromServices] PhoneHandoffManager handoffs, [FromServices] IPhoneHandoffRepository repository, CancellationToken ct)
    {
        var handoff = await LoadOwnedHandoffAsync(repository, id, ct);
        if (!YouTubeChannelVideosClient.IsVideoId(request?.VideoId))
            return HandoffBadRequest("handoff-video-invalid", "Pick one of the videos in the list.", "videoId");
        try
        {
            handoff = await handoffs.ApplyAsync(HttpContext.RequestServices, handoff.Id, request!.VideoId!, ct);
            await audit.RecordAsync("youtube.handoff.apply", handoff.Id, "waiting", handoff.VideoId, RemoteAddress(), ct);
            return Ok(ApiResponse<PhoneHandoffStatus>.Ok(handoffs.Describe(handoff)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<PhoneHandoffStatus>(ex);
        }
    }

    private async Task<PhoneHandoff> LoadOwnedHandoffAsync(IPhoneHandoffRepository repository, string id, CancellationToken ct)
    {
        if (!IsUploadId(id)) throw new KeyNotFoundException();
        var handoff = await repository.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        // Ownership is checked on the record itself, not inferred from knowing its id.
        if (!string.Equals(handoff.UserId, currentUser.UserId, StringComparison.Ordinal)) throw new KeyNotFoundException();
        return handoff;
    }

    private BadRequestObjectResult HandoffBadRequest(string code, string message, string? field) =>
        BadRequest(ApiResponse<PhoneHandoffStatus>.Fail(message, new ApiError(code, message, Field: field)));
}

public sealed record DriveConnectCompleteResponse(GoogleDriveStatus Drive, string ReturnPath);
/// <param name="ChannelId">The channel whose Drive (or folder on the personal Drive) to set; null for the personal Drive's own.</param>
public sealed record DriveFolderRequest(string? FolderName, string? ChannelId = null);

/// <param name="ChannelId">Connect a Drive for this channel; null for the personal Drive.</param>
public sealed record DriveConnectStartRequest(string? ReturnPath, string? ChannelId = null);

/// <param name="ChannelId">Whose Drive and folder to use; null for the personal Drive's default folder.</param>
/// <param name="FolderName">A folder for this one copy; empty uses the default.</param>
public sealed record SaveToDriveRequest(string? ChannelId = null, string? FolderName = null, string? TopicId = null);

/// <summary>Plain copies to Drive - a saved render, or one of an auto-shorts batch.</summary>
public static class DriveCopies
{
    /// <summary>The Drive folder topics live under.</summary>
    public const string TopicsFolder = "Topics";

    /// <summary>The Drive folder used copies are moved to.</summary>
    public const string ArchiveFolder = "Archive";

    /// <summary>The folders a copy of a topic sits in, below the Drive's own folder.</summary>
    public static string[] TopicPath(string topicFolder) => [TopicsFolder, topicFolder];

    /// <summary>The topic's name as a Drive folder name.</summary>
    public static string TopicFolderName(ContentTopic topic) => DriveLayout.CleanFolderName(topic.Name, "Topic");

    /// <summary>
    /// A plain copy, filed under the topic when there is one, else under the project and the
    /// day's batch (see <see cref="DriveLayout"/>) so a channel folder never turns into one
    /// long list of look-alike files.
    /// </summary>
    public static PhoneHandoff SaveOnly(
        string userId, RenderJob job, string? projectName, string? channelId, string title, DriveTarget target, PhoneHandoffState state,
        ContentTopic? topic = null) => new()
    {
        Id = Guid.NewGuid().ToString("N"),
        UserId = userId,
        ProjectId = job.ProjectId,
        JobId = job.Id,
        ChannelId = channelId ?? string.Empty,
        Title = title,
        SaveOnly = true,
        DriveChannelId = target.DriveChannelId,
        DriveFolderName = target.FolderName,
        TopicId = topic?.Id,
        Topic = topic is null ? null : TopicFolderName(topic),
        DriveSubfolders = topic is null ? [.. DriveLayout.FoldersFor(projectName, job)] : [.. TopicPath(TopicFolderName(topic))],
        DriveFileName = PhoneHandoffManager.FileNameFor(DriveLayout.FileTitleFor(title, job)),
        State = state,
        CreatedAt = DateTime.UtcNow
    };

    /// <summary>
    /// The caller's own topic with this id; null when none is asked for. A topic that isn't the
    /// caller's (or is gone) is refused with <c>topic-invalid</c>, never revealed.
    /// </summary>
    public static async Task<ContentTopic?> ResolveTopicAsync(
        IContentTopicRepository topics, string userId, string? topicId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(topicId)) return null;
        var topic = await topics.GetAsync(topicId, ct);
        if (topic is null || !string.Equals(topic.UserId, userId, StringComparison.Ordinal))
            throw new YouTubePublishException("topic-invalid", "Pick one of your topics.");
        return topic;
    }
}

public sealed record SendToPhoneRequest(
    string? ChannelId,
    YouTubeVideoMetadata? Metadata,
    IReadOnlyList<string>? RelatedVideoIds = null,
    string? FirstComment = null,
    /// <summary>A folder on the Drive for this one send; empty uses the Drive's default folder.</summary>
    string? FolderName = null,
    /// <summary>Take the video's own sound out, for a Shorts sound to replace it.</summary>
    bool MuteAudio = false,
    [property: System.ComponentModel.DataAnnotations.RegularExpression("^[A-Za-z0-9_-]{1,64}$")] string? TopicId = null);

public sealed record ApplyHandoffRequest(string? VideoId);

public sealed record PhoneUploadCandidateResponse(
    string VideoId, string Title, DateTime? PublishedAt, double? DurationSeconds, string? PrivacyStatus, string? ThumbnailUrl, bool Likely);

public sealed record PhoneHandoffCheckResponse(PhoneHandoffStatus Handoff, IReadOnlyList<PhoneUploadCandidateResponse> Candidates);
