using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Options;
using AnimStudio.Infrastructure.Ingest;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController(
    IRenderCapabilities capabilities,
    TranscriptSourceSelector sources,
    IOptions<IngestOptions> ingestOptions) : ControllerBase
{
    /// <summary>
    /// Lets the UI show why rendering is unavailable instead of letting the user queue a
    /// job that cannot succeed.
    /// </summary>
    [HttpGet("renderer")]
    public ActionResult<ApiResponse<RendererStatusResponse>> Renderer() =>
        Ok(ApiResponse<RendererStatusResponse>.Ok(new RendererStatusResponse(
            capabilities.IsAvailable,
            capabilities.Version,
            capabilities.UnavailableReason,
            capabilities.Supports(RenderFeature.BurnedSubtitles),
            capabilities.Supports(RenderFeature.KenBurns),
            capabilities.Supports(RenderFeature.CrossFadeTransitions))));

    /// <summary>
    /// Which transcript sources this server can actually use, so the UI can disable the
    /// ones that are not configured rather than offering an option that fails on submit.
    /// </summary>
    [HttpGet("/api/ingest/capabilities")]
    public async Task<ActionResult<ApiResponse<IngestCapabilitiesResponse>>> IngestCapabilities(
        CancellationToken ct)
    {
        var statuses = new List<TranscriptSourceStatus>();

        foreach (var source in sources.All)
        {
            var availability = await source.ProbeAsync(ct);
            statuses.Add(new TranscriptSourceStatus(
                source.Kind.ToString(),
                availability.IsAvailable,
                availability.UnavailableReasonCode,
                availability.ToolVersion,
                availability.RequiresAttestation));
        }

        var options = ingestOptions.Value;

        return Ok(ApiResponse<IngestCapabilitiesResponse>.Ok(new IngestCapabilitiesResponse(
            options.DefaultSource,
            options.AllowMediaDownload,
            statuses.OrderBy(s => s.Kind).ToList())));
    }
}
