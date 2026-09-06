using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
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
    IOptions<IngestOptions> ingestOptions,
    IOptionsMonitor<AdminOptions> adminOptions) : ControllerBase
{
    /// <summary>
    /// Whether this caller may administer the server.
    /// <para>
    /// Deliberately not itself behind the admin policy: a UI has to be able to ask "should
    /// I show an admin link?" without provoking a refusal it would then have to interpret.
    /// It discloses nothing a caller cannot already discover by trying, and it answers from
    /// <see cref="AdminAccessRules"/> - the same rule the policy enforces - so the screen
    /// and the server can never disagree about who is admitted.
    /// </para>
    /// </summary>
    [HttpGet("admin-access")]
    public ActionResult<ApiResponse<AdminAccessResponse>> AdminAccess()
    {
        var options = adminOptions.CurrentValue;
        var admitted = AdminAccessRules.IsAdmitted(options, HttpContext, User);

        var explanation = options.Mode switch
        {
            AdminAccessMode.Disabled =>
                "Administration is switched off on this server.",

            AdminAccessMode.LocalOnly when admitted =>
                "You are on the machine this server runs on, so you can change its settings.",

            AdminAccessMode.LocalOnly =>
                "Administration is only available from the machine this server runs on.",

            AdminAccessMode.Jwt when admitted =>
                "Signed in with the Admin role.",

            _ => "Sign in with an account that has the Admin role to change this server's settings."
        };

        return Ok(ApiResponse<AdminAccessResponse>.Ok(
            new AdminAccessResponse(options.Mode.ToString(), admitted, explanation)));
    }

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
