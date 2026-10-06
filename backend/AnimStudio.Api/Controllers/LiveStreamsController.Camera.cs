using AnimStudio.Api.Common;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.LiveStreams;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Camera and screen streams. The browser draws the picture - identity masks, overlays,
/// scenes - and records it; these endpoints start an encoder, take the recording in
/// numbered chunks, and stop it. The unmasked camera picture never reaches the server.
/// </summary>
public sealed partial class LiveStreamsController
{
    /// <summary>A hard ceiling for one chunk request; the configured limit is checked as it is read.</summary>
    private const long MaxChunkRequestBytes = 64L * 1024 * 1024;

    [HttpGet("camera")]
    public ActionResult<ApiResponse<IReadOnlyList<CameraStreamStatus>>> ListCamera() =>
        Ok(ApiResponse<IReadOnlyList<CameraStreamStatus>>.Ok(cameras.List(currentUser.UserId)));

    [HttpGet("camera/{id}")]
    public ActionResult<ApiResponse<CameraStreamStatus>> GetCamera(string id) =>
        cameras.Get(id, currentUser.UserId) is { } status
            ? Ok(ApiResponse<CameraStreamStatus>.Ok(status))
            : CameraNotFound();

    /// <summary>Starts the encoder with a channel's saved key or a pasted one. The page then sends chunks.</summary>
    [HttpPost("camera")]
    public async Task<ActionResult<ApiResponse<CameraStreamStatus>>> StartCamera(
        [FromBody] CameraStreamStartRequest? request, CancellationToken ct)
    {
        if (!cameras.Enabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<CameraStreamStatus>.Fail(
                "Camera streaming is switched off on this server.", new ApiError("camera-disabled", "Camera streaming is off.")));
        }

        var settings = request?.Settings;
        if (CameraStreamValidator.ValidateSettings(settings, streams.Destinations.Keys.ToList()) is { } settingsError)
            return Invalid("settings-invalid", settingsError, "settings");

        var (target, error) = await ResolveKeyTargetAsync(request!.GoLive, settings!.Destination, ct);
        if (error is not null) return error;

        if (await RtmpsProblemAsync(ct) is { } rtmps) return rtmps;

        var result = await cameras.StartStreamAsync(currentUser.UserId, settings, streams.Destinations[settings.Destination], target!, ct);
        return result.Outcome switch
        {
            CameraStartOutcome.Started => Ok(ApiResponse<CameraStreamStatus>.Ok(result.Status!)),
            CameraStartOutcome.AlreadyStreaming => Conflict(ApiResponse<CameraStreamStatus>.Fail(
                "You're already streaming from a camera. Stop that stream first.",
                new ApiError("camera-already-live", "A camera stream is already running."))),
            CameraStartOutcome.Busy => StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<CameraStreamStatus>.Fail(
                $"This server is already encoding {cameras.MaxConcurrent} camera streams. Try again when one ends.",
                new ApiError("busy", "The camera encoder is busy."))),
            CameraStartOutcome.KeyProblem => Conflict(ApiResponse<CameraStreamStatus>.Fail(
                result.Message!, new ApiError("stream-key-missing", result.Message!, Field: "channelId", Hint: "Settings → Channels → 🔑 Stream key"))),
            CameraStartOutcome.FfmpegMissing => StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<CameraStreamStatus>.Fail(
                "FFmpeg isn't available on the API machine.",
                new ApiError("ffmpeg-missing", result.Message ?? "FFmpeg isn't available.", Hint: "Install FFmpeg or set Ffmpeg:FfmpegPath, then restart the API."))),
            _ => StatusCode(StatusCodes.Status403Forbidden, ApiResponse<CameraStreamStatus>.Fail(
                "Camera streaming is switched off on this server.", new ApiError("camera-disabled", "Camera streaming is off.")))
        };
    }

    /// <summary>
    /// One chunk of the recording, as raw bytes. Chunks are numbered from 0 within a
    /// generation; a chunk that was already received is acknowledged without being written
    /// again, so the page can safely retry.
    /// </summary>
    [HttpPost("camera/{id}/chunks")]
    [RequestSizeLimit(MaxChunkRequestBytes)]
    public async Task<ActionResult<ApiResponse<CameraStreamStatus>>> AppendCamera(
        string id, [FromQuery] int generation, [FromQuery] long sequence, CancellationToken ct)
    {
        if (generation < 0 || sequence < 0)
            return Invalid("chunk-invalid", "The chunk number is invalid.", "sequence");

        var limit = cameras.MaxChunkBytes;
        if (Request.ContentLength is { } declared && declared > limit)
            return ChunkTooLarge(limit);

        var chunk = await ReadBoundedAsync(Request.Body, limit, ct);
        if (chunk is null) return ChunkTooLarge(limit);
        if (chunk.Length == 0) return Invalid("chunk-empty", "The chunk was empty.", "body");

        var result = await cameras.AppendAsync(id, currentUser.UserId, generation, sequence, chunk, ct);
        return result.Outcome switch
        {
            CameraChunkOutcome.Accepted or CameraChunkOutcome.Duplicate => Ok(ApiResponse<CameraStreamStatus>.Ok(result.Status!)),
            CameraChunkOutcome.OutOfOrder => Conflict(ApiResponse<CameraStreamStatus>.Fail(
                "A chunk was skipped.", new ApiError("chunk-out-of-order", "Resend from the expected chunk.")) with { Data = result.Status }),
            CameraChunkOutcome.RestartRecording => Conflict(ApiResponse<CameraStreamStatus>.Fail(
                "The encoder restarted. Start a new recording.", new ApiError("restart-recording", "Start a new recording.")) with { Data = result.Status }),
            CameraChunkOutcome.NotMedia => Invalid("chunk-not-media", "That isn't the recording format this stream was started with.", "body"),
            CameraChunkOutcome.TooLarge => ChunkTooLarge(limit),
            CameraChunkOutcome.Ended => Conflict(ApiResponse<CameraStreamStatus>.Fail(
                result.Status?.Message ?? "This stream has ended.", new ApiError("camera-ended", "The stream has ended.")) with { Data = result.Status }),
            _ => CameraNotFound()
        };
    }

    [HttpPost("camera/{id}/stop")]
    public ActionResult<ApiResponse<CameraStreamStatus>> StopCamera(string id) =>
        cameras.Stop(id, currentUser.UserId) is { } status
            ? Ok(ApiResponse<CameraStreamStatus>.Ok(status))
            : CameraNotFound();

    /// <summary>
    /// Public audience numbers for overlays: a channel's subscribers (by UC… id or @handle)
    /// and, optionally, a live broadcast's concurrent viewers (by video id).
    /// </summary>
    [HttpGet("audience")]
    public async Task<ActionResult<ApiResponse<YouTubeAudienceStats>>> Audience(
        [FromQuery] string? channel, [FromQuery] string? video, CancellationToken ct)
    {
        channel = string.IsNullOrWhiteSpace(channel) ? null : channel.Trim();
        video = string.IsNullOrWhiteSpace(video) ? null : video.Trim();

        if (channel is null && video is null)
            return Invalid("audience-invalid", "Give a channel or a live video.", "channel");
        if (channel is not null && !CameraStreamValidator.IsChannelId(channel) && !CameraStreamValidator.IsHandle(channel))
            return Invalid("channel-invalid", "Use a channel id (UC…) or an @handle.", "channel");
        if (video is not null && !CameraStreamValidator.IsVideoId(video))
            return Invalid("video-invalid", "That isn't a YouTube video id.", "video");

        try
        {
            return Ok(ApiResponse<YouTubeAudienceStats>.Ok(await audience.GetAsync(channel, video, ct)));
        }
        catch (YouTubeAudienceException ex)
        {
            var status = ex.Code == "youtube-not-configured" ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status502BadGateway;
            return StatusCode(status, ApiResponse<YouTubeAudienceStats>.Fail(ex.Message, new ApiError(ex.Code, ex.Message,
                Hint: ex.Code == "youtube-not-configured" ? "Set YouTube:ApiKey on the API (user-secrets, environment or Key Vault)." : null)));
        }
    }

    /// <summary>The request body, or null when it is larger than <paramref name="limit"/>. Reading stops at the limit.</summary>
    private static async Task<byte[]?> ReadBoundedAsync(Stream body, int limit, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        var block = new byte[81920];
        int read;
        while ((read = await body.ReadAsync(block, ct)) > 0)
        {
            if (buffer.Length + read > limit) return null;
            buffer.Write(block, 0, read);
        }
        return buffer.ToArray();
    }

    private ObjectResult ChunkTooLarge(int limit) =>
        StatusCode(StatusCodes.Status413PayloadTooLarge, ApiResponse<CameraStreamStatus>.Fail(
            $"A chunk can be at most {limit / (1024 * 1024)} MB.", new ApiError("chunk-too-large", "Chunk too large.")));

    private NotFoundObjectResult CameraNotFound() =>
        NotFound(ApiResponse<CameraStreamStatus>.Fail("That camera stream has ended or doesn't exist.",
            new ApiError("not-found", "Camera stream not found.")));
}
