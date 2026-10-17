using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Security;
using AnimStudio.Application.Voices;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Studio voice: a recording made in the browser comes back re-voiced at studio quality,
/// part by part in each character's voice, with its picture untouched. Nothing is stored -
/// the recording and the result live only for the length of the request.
/// </summary>
[ApiController]
[Route("api/voices")]
public sealed class VoicesController(
    IStudioVoiceRenderer renderer,
    IVoiceConverter converter,
    IAssetRepository assets,
    IProjectRepository projects,
    ICharacterRepository characters,
    ICurrentUser currentUser,
    ILogger<VoicesController> logger) : ControllerBase
{
    /// <summary>A ten-minute camera take at the studio's bitrate, with room to spare.</summary>
    private const long MaxRecordingBytes = 768L * 1024 * 1024;
    private const int MaxTimelineChars = 256 * 1024;

    /// <summary>Each render keeps a CPU busy for a while, so only a couple run at once.</summary>
    private static readonly SemaphoreSlim Renders = new(2, 2);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [HttpGet("studio")]
    public ActionResult<ApiResponse<StudioVoiceStatusResponse>> Status() =>
        Ok(ApiResponse<StudioVoiceStatusResponse>.Ok(
            new StudioVoiceStatusResponse(renderer.IsAvailable, renderer.IsAvailable && converter.IsAvailable)));

    /// <summary>
    /// Multipart: <c>file</c> is the browser recording (WebM or MP4, picture optional) and
    /// <c>timeline</c> is JSON - <c>[{ startSeconds, voice }]</c>, starting at 0, where a
    /// null voice is the performer's own. The answer is the re-voiced file itself.
    /// </summary>
    [HttpPost("studio")]
    [RequestSizeLimit(MaxRecordingBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRecordingBytes)]
    public async Task<IActionResult> Render(IFormFile file, [FromForm] string timeline, CancellationToken ct)
    {
        if (!renderer.IsAvailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "studio-voice-unavailable",
                "Studio voice isn't available on this server: its ffmpeg lacks rubberband.");

        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Send the recording to re-voice.");
        if (file.Length > MaxRecordingBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large", "That recording is too large.");

        // The bytes decide what the file is; the declared type and name are never trusted.
        var head = new byte[12];
        await using (var probe = file.OpenReadStream())
            await probe.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, ct);
        StudioVoiceContainer container;
        if (CameraStreamValidator.StartsLike(CameraContainer.WebM, head)) container = StudioVoiceContainer.WebM;
        else if (CameraStreamValidator.StartsLike(CameraContainer.Mp4, head)) container = StudioVoiceContainer.Mp4;
        else return Fail(StatusCodes.Status400BadRequest, "file-unsupported", "Only WebM and MP4 recordings can be re-voiced.");

        if (string.IsNullOrWhiteSpace(timeline) || timeline.Length > MaxTimelineChars)
            return Fail(StatusCodes.Status400BadRequest, "voice-timeline-invalid", "Say which voice the recording uses.");

        List<StudioVoiceSegmentRequest>? requested;
        try
        {
            requested = JsonSerializer.Deserialize<List<StudioVoiceSegmentRequest>>(timeline, Json);
        }
        catch (JsonException)
        {
            return Fail(StatusCodes.Status400BadRequest, "voice-timeline-invalid", "The voice timeline isn't valid.");
        }

        // Checks every voice against the character rules; a bad one is a 400 via EditingException.
        var segments = StudioVoiceValidator.Validate(
            requested?.Select(r => new StudioVoiceSegmentCommand(r.StartSeconds, r.Voice?.ToCommand())).ToList());

        var samples = await ConsentedSamplesAsync(segments, ct);
        if (samples is null)
            return Fail(StatusCodes.Status400BadRequest, "voice-consent-required",
                "An AI voice needs a saved character whose voice sample has consent. Save the character first.");

        if (!await Renders.WaitAsync(TimeSpan.Zero, ct))
            return Fail(StatusCodes.Status429TooManyRequests, "studio-voice-busy",
                "Other studio voices are being made right now. Try again in a minute.");

        try
        {
            await using var recording = file.OpenReadStream();
            var output = await renderer.RenderAsync(recording, container, segments, samples, ct);
            // The file result disposes the stream, which deletes the temporary file.
            return File(output.Content, output.MimeType);
        }
        catch (StudioVoiceException ex)
        {
            logger.LogWarning("Studio voice refused: {Reason}", ex.Message);
            return Fail(StatusCodes.Status422UnprocessableEntity, "studio-voice-failed", ex.Message);
        }
        finally
        {
            Renders.Release();
        }
    }

    /// <summary>
    /// The storage key of every AI voice sample in the timeline - once each is known to be a
    /// file in one of the caller's projects that a character there uses with consent. Null
    /// when a sample has no consenting character; another user's file is a 403.
    /// </summary>
    private async Task<IReadOnlyDictionary<string, string>?> ConsentedSamplesAsync(
        IReadOnlyList<StudioVoiceSegment> segments, CancellationToken ct)
    {
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        var ids = segments.Select(s => s.Voice?.AiSampleAssetId).OfType<string>().Distinct(StringComparer.Ordinal);
        foreach (var id in ids)
        {
            var asset = await assets.GetAsync(id, ct) ?? throw new KeyNotFoundException();
            var project = await projects.GetAsync(asset.ProjectId, ct) ?? throw new KeyNotFoundException();
            if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException();

            var cast = await characters.ListByProjectAsync(project.Id, ct);
            if (!cast.Any(c => c.Voice is { AiSampleConsent: true } v && string.Equals(v.AiSampleAssetId, id, StringComparison.Ordinal)))
                return null;

            result[id] = asset.StorageKey;
        }
        return result;
    }

    private ObjectResult Fail(int status, string code, string message) =>
        StatusCode(status, ApiResponse<object>.Fail(message, new ApiError(code, message)));
}
