using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Jobs;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Publish to YouTube: connect one or more channels once with Google sign-in, then send a
/// finished render to the chosen channel in one click - title, description, tags, category,
/// visibility and audience checked against YouTube's limits first, the file uploaded in
/// the background with resumable chunks.
/// <para>
/// Google's redirect lands on the app's own <c>/youtube/callback</c> page, which posts the
/// code here as an ordinary authenticated call. So there is no anonymous endpoint: the
/// <c>state</c> must also belong to the user completing the sign-in.
/// </para>
/// </summary>
[ApiController]
[Route("api/youtube")]
public sealed partial class YouTubePublishController(
    YouTubeConnectionStore connections,
    YouTubeUploadManager uploads,
    YouTubeOAuthClient oauth,
    IRenderJobRepository jobs,
    IProjectRepository projects,
    IAiSettingsRepository settingsRepo,
    ICurrentUser currentUser,
    AdminAuditService audit,
    ILogger<YouTubePublishController> logger) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<YouTubePublishStatusResponse>>> Status(CancellationToken ct)
    {
        var connected = await connections.ListAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<YouTubePublishStatusResponse>.Ok(new YouTubePublishStatusResponse(
            oauth.IsConfigured,
            connected,
            [.. YouTubePublishValidator.Categories.Select(c => new YouTubeCategoryResponse(c.Key, c.Value))],
            new YouTubeLimitsResponse(
                YouTubePublishValidator.MaxTitleLength,
                YouTubePublishValidator.MaxDescriptionBytes,
                YouTubePublishValidator.MaxTagsLength))));
    }

    [HttpPost("oauth/start")]
    public ActionResult<ApiResponse<YouTubeConnectStartResponse>> StartConnect([FromBody] YouTubeConnectStartRequest? request)
    {
        try
        {
            var url = connections.BeginConnect(currentUser.UserId, request?.ReturnPath);
            return Ok(ApiResponse<YouTubeConnectStartResponse>.Ok(new YouTubeConnectStartResponse(url)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeConnectStartResponse>(ex);
        }
    }

    [HttpPost("oauth/complete")]
    public async Task<ActionResult<ApiResponse<YouTubeConnectCompleteResponse>>> CompleteConnect(
        [FromBody] YouTubeConnectCompleteRequest? request, CancellationToken ct)
    {
        try
        {
            var (connection, returnPath) = await connections.CompleteConnectAsync(
                currentUser.UserId, request?.Code, request?.State, ct);

            await audit.RecordAsync("youtube.channel.connect", connection.ChannelId, null, connection.ChannelTitle, RemoteAddress(), ct);
            return Ok(ApiResponse<YouTubeConnectCompleteResponse>.Ok(new YouTubeConnectCompleteResponse(connection, returnPath)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("YouTube connect failed for user {UserId} from {RemoteAddress}: {Code}",
                currentUser.UserId, RemoteAddress(), ex.Code);
            return Failure<YouTubeConnectCompleteResponse>(ex);
        }
    }

    [HttpDelete("channels/{channelId}")]
    public async Task<IActionResult> Disconnect(string channelId, CancellationToken ct)
    {
        if (!IsChannelId(channelId) || !await connections.DisconnectAsync(currentUser.UserId, channelId, ct))
            return NotFound(ApiResponse<string>.Fail("That channel isn't connected.", new ApiError("not-found", "That channel isn't connected.")));

        await audit.RecordAsync("youtube.channel.disconnect", channelId, "connected", "none", RemoteAddress(), ct);
        return NoContent();
    }

    /// <summary>Pre-filled details and the file's own checks, for the dialog to open with.</summary>
    [HttpGet("render-jobs/{jobId}/draft")]
    public async Task<ActionResult<ApiResponse<YouTubeDraftResponse>>> Draft(string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);
        var project = await projects.GetAsync(job.ProjectId, ct);

        var title = (project?.Name ?? string.Empty).Trim();
        if (title.Length > YouTubePublishValidator.MaxTitleLength) title = title[..YouTubePublishValidator.MaxTitleLength].TrimEnd();

        // A clip export knows its chapters and credits; a project render only has the project's description.
        var description = job.Timeline is { } timeline
            ? ExportTimelineFormatter.ToYouTubeDescription(timeline, null)
            : project?.Description ?? string.Empty;

        var facts = Facts(job);
        var errors = YouTubePublishValidator.CheckVideo(facts, out var warnings);

        // The project's brand channel decides where it goes and what every upload starts with.
        var brandChannelId = project?.Settings.BrandChannelId;
        var brandSettings = await settingsRepo.GetAsync(ct);
        var defaults = brandSettings?.PublishingFor(brandChannelId);
        var brandName = brandSettings?.FindChannel(brandChannelId)?.Name ?? brandSettings?.DefaultChannelName ?? "Default";

        return Ok(ApiResponse<YouTubeDraftResponse>.Ok(new YouTubeDraftResponse(
            title,
            YouTubePublishValidator.WithFooter(description.Trim(), defaults?.DescriptionFooter),
            defaults?.Tags ?? [],
            defaults?.CategoryId ?? "1",
            defaults?.Privacy ?? "public",
            defaults?.MadeForKids ?? false,
            defaults?.NotifySubscribers ?? true,
            defaults?.YouTubeChannelId,
            brandName,
            new YouTubeVideoFactsResponse(facts.DurationSeconds, facts.SizeBytes, facts.Width, facts.Height, facts.IsVertical),
            errors,
            warnings)));
    }

    /// <summary>Checks everything, then queues the upload. Returns at once with an upload to poll.</summary>
    [HttpPost("render-jobs/{jobId}/publish")]
    public async Task<ActionResult<ApiResponse<YouTubeUploadStatus>>> Publish(
        string jobId, [FromBody] YouTubePublishRequest? request, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        if (request is null || !IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Choose a channel to publish to.",
                new ApiError("channel-missing", "Choose a channel to publish to.", Field: "channelId")));

        var connection = await connections.GetAsync(currentUser.UserId, request.ChannelId!, ct);
        if (connection is null)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("That channel isn't connected.",
                new ApiError("youtube-channel-not-connected", "That channel isn't connected. Connect it first.", Field: "channelId")));
        if (connection.RevokedAt is not null)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Reconnect this channel.",
                new ApiError("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.", Field: "channelId")));

        var validation = YouTubePublishValidator.Validate(request.Metadata, Facts(job));
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail(first.Message,
                [.. validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        try
        {
            var status = uploads.Start(new YouTubeUploadRequest(
                currentUser.UserId,
                job.Id,
                job.OutputStorageKey!,
                job.OutputSizeBytes ?? 0,
                connection.ChannelId,
                connection.ChannelTitle,
                validation.Normalized!));

            logger.LogInformation("User {UserId} queued render {JobId} for YouTube channel {ChannelId} ({Privacy})",
                currentUser.UserId, job.Id, connection.ChannelId, validation.Normalized!.Privacy);
            return Accepted(ApiResponse<YouTubeUploadStatus>.Ok(status));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeUploadStatus>(ex);
        }
    }

    [HttpGet("uploads")]
    public ActionResult<ApiResponse<IReadOnlyList<YouTubeUploadStatus>>> ListUploads([FromQuery] string? jobId) =>
        Ok(ApiResponse<IReadOnlyList<YouTubeUploadStatus>>.Ok(
            uploads.List(currentUser.UserId, string.IsNullOrWhiteSpace(jobId) ? null : jobId)));

    [HttpGet("uploads/{uploadId}")]
    public ActionResult<ApiResponse<YouTubeUploadStatus>> GetUpload(string uploadId) =>
        IsUploadId(uploadId) && uploads.Get(currentUser.UserId, uploadId) is { } status
            ? Ok(ApiResponse<YouTubeUploadStatus>.Ok(status))
            : throw new KeyNotFoundException();

    [HttpPost("uploads/{uploadId}/cancel")]
    public IActionResult CancelUpload(string uploadId) =>
        IsUploadId(uploadId) && uploads.Cancel(currentUser.UserId, uploadId)
            ? NoContent()
            : throw new KeyNotFoundException();

    private async Task<RenderJob> LoadOwnedJobAsync(string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct) ?? throw new KeyNotFoundException();

        // Ownership is re-verified on the job itself, not inferred from possessing its id.
        if (!string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return job;
    }

    private static YouTubeVideoFacts Facts(RenderJob job) => new(
        job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings,
        job.OutputStorageKey is not null,
        job.OutputSizeBytes,
        job.Diagnostics?.OutputDurationSeconds,
        job.Width,
        job.Height);

    private ActionResult<ApiResponse<T>> Failure<T>(YouTubePublishException ex)
    {
        var body = ApiResponse<T>.Fail(ex.Message, new ApiError(ex.Code, ex.Message));
        return ex.Code switch
        {
            "youtube-not-configured" or "encryption-not-configured" => StatusCode(StatusCodes.Status503ServiceUnavailable, body),
            "youtube-unreachable" => StatusCode(StatusCodes.Status502BadGateway, body),
            "youtube-busy" or "youtube-too-many-uploads" => StatusCode(StatusCodes.Status429TooManyRequests, body),
            _ => BadRequest(body)
        };
    }

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private static bool IsChannelId(string? value) => value is not null && ChannelIdPattern().IsMatch(value);
    private static bool IsUploadId(string value) => UploadIdPattern().IsMatch(value);

    [GeneratedRegex("^UC[A-Za-z0-9_-]{22}$")]
    private static partial Regex ChannelIdPattern();

    [GeneratedRegex("^[0-9a-f]{32}$")]
    private static partial Regex UploadIdPattern();
}

public sealed record YouTubeConnectStartRequest(string? ReturnPath);
public sealed record YouTubeConnectStartResponse(string AuthorizationUrl);
public sealed record YouTubeConnectCompleteRequest(string? Code, string? State);
public sealed record YouTubeConnectCompleteResponse(YouTubeConnectionStatus Connection, string ReturnPath);

public sealed record YouTubePublishRequest(string? ChannelId, YouTubeVideoMetadata? Metadata);

public sealed record YouTubeCategoryResponse(string Id, string Name);
public sealed record YouTubeLimitsResponse(int MaxTitleLength, int MaxDescriptionBytes, int MaxTagsLength);

public sealed record YouTubePublishStatusResponse(
    bool Configured,
    IReadOnlyList<YouTubeConnectionStatus> Channels,
    IReadOnlyList<YouTubeCategoryResponse> Categories,
    YouTubeLimitsResponse Limits);

public sealed record YouTubeVideoFactsResponse(double? DurationSeconds, long? SizeBytes, int? Width, int? Height, bool IsVertical);

public sealed record YouTubeDraftResponse(
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string CategoryId,
    string Privacy,
    bool MadeForKids,
    bool NotifySubscribers,
    /// <summary>The YouTube channel the project's brand channel publishes to, if one is set up.</summary>
    string? ChannelId,
    string BrandChannelName,
    YouTubeVideoFactsResponse Video,
    IReadOnlyList<YouTubeCheck> Errors,
    IReadOnlyList<YouTubeCheck> Warnings);
