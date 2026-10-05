using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Per brand channel: which YouTube channel its videos are published to, and the details
/// every upload starts with (visibility, category, audience, tags, description footer).
/// Lives beside the channel's watermark and end card on the settings document.
/// </summary>
[ApiController]
[Authorize(Policy = AdminAccess.Policy)]
[Route("api/admin/branding/publishing")]
public sealed class AdminChannelPublishingController(
    IAiSettingsRepository settingsRepo,
    AdminAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<ChannelPublishSettings>>> Get([FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await settingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out _)) return ChannelNotFound();

        return Ok(ApiResponse<ChannelPublishSettings>.Ok(stored.PublishingFor(channel) ?? new ChannelPublishSettings()));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<ChannelPublishSettings>>> Update(
        [FromBody] ChannelPublishSettings? request, [FromQuery] string? channel, CancellationToken ct)
    {
        var (normalized, errors) = YouTubePublishValidator.NormalizeChannelDefaults(request);
        if (normalized is null)
        {
            return BadRequest(ApiResponse<ChannelPublishSettings>.Fail(errors[0].Message,
                [.. errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        var stored = await settingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();

        var before = stored.PublishingFor(channel);
        if (target is null) stored.DefaultPublishing = normalized; else target.Publishing = normalized;
        await settingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.publishing-updated",
            BrandChannel.IsDefault(channel) ? "global-branding" : $"global-branding:{channel}",
            before?.YouTubeChannelId ?? "none",
            $"YouTube: {normalized.YouTubeChannelId ?? "none"}, {normalized.Privacy}, category {normalized.CategoryId}",
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            ct);

        return Ok(ApiResponse<ChannelPublishSettings>.Ok(normalized));
    }

    private static bool TryChannel(AiSettings settings, string? channelId, out BrandChannel? channel)
    {
        channel = settings.FindChannel(channelId);
        return BrandChannel.IsDefault(channelId) || channel is not null;
    }

    private NotFoundObjectResult ChannelNotFound()
    {
        const string message = "That brand channel does not exist (it may have been deleted).";
        return NotFound(ApiResponse<EmptyPayload>.Fail(message, new ApiError("channel-not-found", message)));
    }
}
