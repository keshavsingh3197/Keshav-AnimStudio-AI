using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
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

    [HttpGet("drive")]
    public async Task<ActionResult<ApiResponse<GoogleDriveStatus>>> DriveStatus(
        [FromServices] GoogleDriveConnectionStore drive, CancellationToken ct) =>
        Ok(ApiResponse<GoogleDriveStatus>.Ok(await drive.GetStatusAsync(currentUser.UserId, ct)));

    [HttpPost("drive/oauth/start")]
    public ActionResult<ApiResponse<YouTubeConnectStartResponse>> StartDriveConnect(
        [FromServices] GoogleDriveConnectionStore drive, [FromBody] YouTubeConnectStartRequest? request)
    {
        try
        {
            return Ok(ApiResponse<YouTubeConnectStartResponse>.Ok(
                new YouTubeConnectStartResponse(drive.BeginConnect(currentUser.UserId, request?.ReturnPath))));
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
        try
        {
            var (status, returnPath) = await drive.CompleteConnectAsync(currentUser.UserId, request?.Code, request?.State, ct);
            await audit.RecordAsync("google.drive.connect", currentUser.UserId, null, "connected", RemoteAddress(), ct);
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
        try
        {
            return Ok(ApiResponse<GoogleDriveStatus>.Ok(await drive.SetFolderAsync(currentUser.UserId, request?.FolderName, ct)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<GoogleDriveStatus>(ex);
        }
    }

    [HttpDelete("drive")]
    public async Task<IActionResult> DisconnectDrive([FromServices] GoogleDriveConnectionStore drive, CancellationToken ct)
    {
        if (!await drive.DisconnectAsync(currentUser.UserId, ct))
            return NotFound(ApiResponse<string>.Fail("Google Drive isn't connected.", new ApiError("not-found", "Google Drive isn't connected.")));

        await audit.RecordAsync("google.drive.disconnect", currentUser.UserId, "connected", "none", RemoteAddress(), ct);
        return NoContent();
    }

    /// <summary>Checks the details like a direct upload would, then starts the copy to Drive. Returns at once with a handoff to poll.</summary>
    [HttpPost("render-jobs/{jobId}/send-to-phone")]
    public async Task<ActionResult<ApiResponse<PhoneHandoffStatus>>> SendToPhone(
        string jobId, [FromBody] SendToPhoneRequest? request,
        [FromServices] GoogleDriveConnectionStore drive, [FromServices] PhoneHandoffManager handoffs,
        [FromServices] IPhoneHandoffRepository repository, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);
        var facts = Facts(job);

        if (request is null || !IsChannelId(request.ChannelId))
            return HandoffBadRequest("channel-missing", "Choose the channel you'll upload to from the phone.", "channelId");

        var driveStatus = await drive.GetStatusAsync(currentUser.UserId, ct);
        if (!driveStatus.Connected)
            return HandoffBadRequest("drive-not-connected", "Connect Google Drive first.", "drive");
        if (driveStatus.NeedsReconnect)
            return HandoffBadRequest("drive-reconnect", "Google Drive access has expired or was removed. Connect Drive again.", "drive");

        var folder = string.IsNullOrWhiteSpace(request.FolderName) ? driveStatus.FolderName : request.FolderName.Trim();
        if (!GoogleDriveClient.IsValidFolderName(folder))
            return HandoffBadRequest("drive-folder-invalid", GoogleDriveClient.FolderNameRule, "folderName");

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

        var details = validation.Normalized!;
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
            DriveFolderName = folder,
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

        if (handoff.State is PhoneHandoffState.WaitingForPhone or PhoneHandoffState.Expired)
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
public sealed record DriveFolderRequest(string? FolderName);

public sealed record SendToPhoneRequest(
    string? ChannelId,
    YouTubeVideoMetadata? Metadata,
    IReadOnlyList<string>? RelatedVideoIds = null,
    string? FirstComment = null,
    /// <summary>A folder on the Drive for this one send; empty uses the Drive's default folder.</summary>
    string? FolderName = null,
    /// <summary>Take the video's own sound out, for a Shorts sound to replace it.</summary>
    bool MuteAudio = false);

public sealed record ApplyHandoffRequest(string? VideoId);

public sealed record PhoneUploadCandidateResponse(
    string VideoId, string Title, DateTime? PublishedAt, double? DurationSeconds, string? PrivacyStatus, string? ThumbnailUrl, bool Likely);

public sealed record PhoneHandoffCheckResponse(PhoneHandoffStatus Handoff, IReadOnlyList<PhoneUploadCandidateResponse> Candidates);
