using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Scenes;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Transcripts;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class IngestController(
    TranscriptIngestService ingestService,
    SceneGenerationService sceneGeneration,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Imports a transcript and produces a script.
    /// <para>
    /// Synchronous on purpose for the paste and file paths: parsing and segmentation are
    /// pure CPU work measured in milliseconds, and making them a polled job would add
    /// latency to an interaction that should feel instant. The URL path does shell out to
    /// yt-dlp, which is slower, but is still awaited so the caller gets one clear answer.
    /// </para>
    /// </summary>
    [HttpPost("api/projects/{projectId}/ingests")]
    public async Task<ActionResult<ApiResponse<IngestResponse>>> Create(
        string projectId, [FromBody] CreateIngestRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<TranscriptSourceKind>(request.Source, ignoreCase: true, out var kind))
        {
            return BadRequest(ApiResponse<IngestResponse>.Fail(
                "That transcript source is not supported.",
                new ApiError("source-not-supported", "That transcript source is not supported.",
                    nameof(request.Source))));
        }

        var command = new CreateIngestCommand
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Source = kind,
            Url = request.Url,
            Text = request.Text,
            SubtitleObjectKey = request.SubtitleObjectKey,
            MediaAssetId = request.MediaAssetId,
            IncludeMedia = request.IncludeMedia,
            IdempotencyKey = request.IdempotencyKey,
            RightsAttestation = request.RightsAttestation is null ? null : new RightsAttestationCommand
            {
                IsOwnerOrLicensed = request.RightsAttestation.IsOwnerOrLicensed,
                BasisCode = request.RightsAttestation.BasisCode,
                BasisNotes = request.RightsAttestation.BasisNotes,
                AttestedByName = request.RightsAttestation.AttestedByName,
                AcceptedTermsVersion = request.RightsAttestation.AcceptedTermsVersion ?? string.Empty
            }
        };

        var result = await ingestService.CreateAsync(command, ct);

        return Ok(ApiResponse<IngestResponse>.Ok(new IngestResponse(
            result.IngestId, result.ScriptId, result.CueCount, result.SegmentCount,
            result.TimingSource.ToString(), result.HasSourceTimings, result.Warnings)));
    }

    /// <summary>Turns a script into scenes, casting the project's own characters.</summary>
    [HttpPost("api/scripts/{scriptId}/generate-scenes")]
    public async Task<ActionResult<ApiResponse<SceneGenerationResponse>>> GenerateScenes(
        string scriptId, CancellationToken ct)
    {
        var result = await sceneGeneration.GenerateAsync(scriptId, currentUser.UserId, ct);

        return Ok(ApiResponse<SceneGenerationResponse>.Ok(new SceneGenerationResponse(
            result.ScenesCreated, result.ScenesPreserved,
            result.UnresolvedSpeakers, result.Warnings)));
    }
}
