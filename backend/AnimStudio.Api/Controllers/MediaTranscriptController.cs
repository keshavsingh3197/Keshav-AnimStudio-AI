using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Security;
using AnimStudio.Application.Transcripts;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// What is being said in an audio or video file in the library - in Hindi, English or any
/// other language the recognizer knows - as timed lines. Nothing is kept unless the caller
/// asks for the transcript to be saved as a subtitle asset.
/// </summary>
[ApiController]
public sealed class MediaTranscriptController(
    MediaTranscriptionService transcription,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("api/projects/{projectId}/assets/{assetId}/transcript")]
    public async Task<ActionResult<ApiResponse<MediaTranscriptResponse>>> Transcribe(
        string projectId, string assetId, [FromBody] MediaTranscriptRequest? body, CancellationToken ct)
    {
        MediaTranscription result;
        try
        {
            result = await transcription.TranscribeAsync(
                new MediaTranscriptionCommand(projectId, assetId, currentUser.UserId,
                    body?.Language?.Trim().ToLowerInvariant(), body?.Save ?? false),
                ct);
        }
        catch (MediaTranscriptionException ex)
        {
            var status = ex.Code switch
            {
                "project-not-found" or "asset-not-found" => StatusCodes.Status404NotFound,
                "forbidden" => StatusCodes.Status403Forbidden,
                "not-audible" or "transcript-too-large" => StatusCodes.Status400BadRequest,
                "no-audio" or "no-speech" or "audio-unreadable" => StatusCodes.Status422UnprocessableEntity,
                "transcription-busy" => StatusCodes.Status429TooManyRequests,
                "ffmpeg-unavailable" or "transcription-unavailable" => StatusCodes.Status503ServiceUnavailable,
                _ => StatusCodes.Status502BadGateway
            };
            return StatusCode(status, ApiResponse<object>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
        }

        var lines = result.Lines
            .Select(l => new MediaTranscriptLineResponse(l.Start.TotalSeconds, l.End.TotalSeconds, l.Text))
            .ToList();

        return Ok(ApiResponse<MediaTranscriptResponse>.Ok(new MediaTranscriptResponse(
            lines,
            string.Join('\n', result.Lines.Select(l => l.Text)),
            result.SubRip,
            result.Language,
            result.ProviderId,
            result.Truncated,
            result.SavedSubtitle?.ToResponse())));
    }
}
