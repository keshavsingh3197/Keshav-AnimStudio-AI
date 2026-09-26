using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
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
    IOptionsMonitor<AdminOptions> adminOptions,
    IAiSettingsRepository aiSettingsRepo,
    IAssetRepository assets,
    IObjectStore store) : ControllerBase
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

    /// <summary>
    /// Global branding & hallmark watermark configuration.
    /// Publicly readable so any project or client can inspect or inherit default branding.
    /// </summary>
    [HttpGet("branding")]
    public async Task<ActionResult<ApiResponse<WatermarkResponse?>>> GetBranding(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<WatermarkResponse?>.Ok(settings?.DefaultWatermark.ToResponse()));
    }

    /// <summary>
    /// Serves the global branding logo image file.
    /// </summary>
    [HttpGet("branding/logo")]
    public async Task<IActionResult> GetBrandingLogo(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var logoId = settings?.DefaultWatermark?.LogoAssetId;
        if (string.IsNullOrWhiteSpace(logoId))
            return NotFound();

        string storageKey = logoId;
        string mimeType = "image/png";

        var asset = await assets.GetAsync(logoId, ct);
        if (asset is not null)
        {
            storageKey = asset.StorageKey;
            mimeType = asset.MimeType;
        }

        var stream = await store.OpenAsync(storageKey, ct);
        if (stream is null)
            return NotFound();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, mimeType);
    }

    /// <summary>
    /// Global branding &amp; channel outro bumper configuration.
    /// </summary>
    [HttpGet("branding/outro")]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> GetBrandingOutro(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<OutroResponse?>.Ok(settings?.DefaultOutro.ToResponse()));
    }

    /// <summary>
    /// Serves or streams the global outro video or image file.
    /// </summary>
    [HttpGet("branding/outro/media")]
    public async Task<IActionResult> GetBrandingOutroMedia(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var outroAssetId = settings?.DefaultOutro?.AssetId;
        if (string.IsNullOrWhiteSpace(outroAssetId))
            return NotFound();

        string storageKey = outroAssetId;
        string mimeType = "video/mp4";

        var asset = await assets.GetAsync(outroAssetId, ct);
        if (asset is not null)
        {
            storageKey = asset.StorageKey;
            mimeType = asset.MimeType;
        }

        var stream = await store.OpenAsync(storageKey, ct);
        if (stream is null)
            return NotFound();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, mimeType, enableRangeProcessing: true);
    }

    /// <summary>
    /// Returns global media settings such as default chunk duration and availability.
    /// </summary>
    [HttpGet("media-settings")]
    public async Task<ActionResult<ApiResponse<MediaSystemSettingsResponse>>> GetMediaSettings(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var chunkSec = settings?.DefaultChunkDurationSeconds ?? 10.0;
        var allowDownload = ingestOptions.Value.AllowMediaDownload;
        var ffmpegReady = capabilities.IsAvailable;
        return Ok(ApiResponse<MediaSystemSettingsResponse>.Ok(new MediaSystemSettingsResponse(
            chunkSec, allowDownload, true, ffmpegReady)));
    }

    /// <summary>
    /// Updates the global default chunk duration in seconds.
    /// </summary>
    [HttpPut("chunk-duration")]
    public async Task<ActionResult<ApiResponse<double>>> UpdateChunkDuration(
        [FromBody] UpdateChunkDurationRequest request, CancellationToken ct)
    {
        if (request.DefaultChunkDurationSeconds <= 0)
        {
            return BadRequest(ApiResponse<double>.Fail("Chunk duration must be positive.", new ApiError("invalid-duration", "Must be positive.")));
        }

        var settings = await aiSettingsRepo.GetAsync(ct) ?? new AnimStudio.Domain.Ai.AiSettings();
        settings.DefaultChunkDurationSeconds = request.DefaultChunkDurationSeconds;
        settings.UpdatedAt = DateTime.UtcNow;
        await aiSettingsRepo.SaveAsync(settings, ct);

        return Ok(ApiResponse<double>.Ok(settings.DefaultChunkDurationSeconds));
    }
}

public sealed record MediaSystemSettingsResponse(
    double DefaultChunkDurationSeconds,
    bool AllowMediaDownload,
    bool YtDlpAvailable,
    bool FfmpegAvailable);

public sealed record UpdateChunkDurationRequest(double DefaultChunkDurationSeconds);

