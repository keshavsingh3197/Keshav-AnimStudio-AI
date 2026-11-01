using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Publishing;
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
    YouTubeConnectionStore connections,
    ICurrentUser currentUser,
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

        // One YouTube channel feeds one brand channel; two brands sharing it would fight over its name.
        if (normalized.YouTubeChannelId is { } wanted && LinkedElsewhere(stored, wanted, target?.Id) is { } owner)
        {
            var message = $"That YouTube channel already publishes for the brand channel \"{owner}\". Unlink it there first.";
            return Conflict(ApiResponse<EmptyPayload>.Fail(message, new ApiError("youtube-channel-in-use", message, Field: "youTubeChannelId")));
        }

        // Who the YouTube channel is comes from YouTube (the admin's own connection), not from
        // the request; a channel connected only by someone else keeps what was known before.
        YouTubeChannelIdentity? identity = null;
        if (normalized.YouTubeChannelId is { } youTubeId)
        {
            if (await connections.GetAsync(currentUser.UserId, youTubeId, ct) is { } connection)
                identity = new(connection.ChannelId, connection.ChannelTitle, connection.ChannelHandle, connection.ThumbnailUrl);
            else if (before?.YouTubeChannelId == youTubeId && before.YouTubeChannelTitle is { } knownTitle)
                identity = new(youTubeId, knownTitle, before.YouTubeChannelHandle, before.YouTubeThumbnailUrl);
        }
        if (identity is not null) BrandChannelYouTubeSync.Stamp(normalized, identity);

        if (target is null) stored.DefaultPublishing = normalized; else target.Publishing = normalized;

        // The brand's name follows the YouTube channel it now publishes to.
        var sync = identity is null
            ? null
            : BrandChannelYouTubeSync.Apply(stored, [identity], createMissing: false, () => string.Empty);
        await settingsRepo.SaveAsync(stored, ct);

        foreach (var renamed in sync?.Renamed ?? [])
        {
            await audit.RecordAsync("branding.channel-renamed",
                BrandChannel.IsDefault(renamed.BrandChannelId) ? "global-branding" : $"global-branding:{renamed.BrandChannelId}",
                renamed.Before, $"{renamed.After} (from YouTube)", HttpContext.Connection.RemoteIpAddress?.ToString(), ct);
        }

        await audit.RecordAsync(
            "branding.publishing-updated",
            BrandChannel.IsDefault(channel) ? "global-branding" : $"global-branding:{channel}",
            before?.YouTubeChannelId ?? "none",
            $"YouTube: {normalized.YouTubeChannelId ?? "none"}, {normalized.Privacy}, category {normalized.CategoryId}",
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            ct);

        return Ok(ApiResponse<ChannelPublishSettings>.Ok(normalized));
    }

    /// <summary>
    /// The studio-wide AI branding every channel inherits (studio and creator links, credits,
    /// tagline, hashtags, tags). An empty object when none is set, so the form always has a shape.
    /// </summary>
    [HttpGet("studio-defaults")]
    public async Task<ActionResult<ApiResponse<ChannelBranding>>> GetStudioDefaults(CancellationToken ct)
    {
        var stored = await settingsRepo.GetAsync(ct);
        return Ok(ApiResponse<ChannelBranding>.Ok(stored?.StudioBranding?.Copy() ?? new ChannelBranding()));
    }

    /// <summary>
    /// Replaces the studio-wide AI branding. Checked with the same rules as a channel's own
    /// (https-only links, short plain text, allowlisted hashtag characters); the channel name and
    /// YouTube link are dropped, since those are per channel. An all-blank body clears the defaults.
    /// </summary>
    [HttpPut("studio-defaults")]
    public async Task<ActionResult<ApiResponse<ChannelBranding>>> UpdateStudioDefaults(
        [FromBody] ChannelBranding? request, CancellationToken ct)
    {
        if (request is null)
        {
            const string message = "Send the studio branding to save.";
            return BadRequest(ApiResponse<ChannelBranding>.Fail(message, new ApiError("branding-missing", message)));
        }

        var (normalized, errors) = YouTubeBrandKit.NormalizeStudio(request);
        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<ChannelBranding>.Fail(errors[0].Message,
                [.. errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        var stored = await settingsRepo.GetAsync(ct) ?? new AiSettings();
        var before = stored.StudioBranding;
        stored.StudioBranding = normalized;
        await settingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.studio-defaults-updated",
            "global-branding",
            Describe(before),
            Describe(normalized),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            ct);

        return Ok(ApiResponse<ChannelBranding>.Ok(normalized?.Copy() ?? new ChannelBranding()));

        // Which fields are set, not their values: enough to see what changed without copying text into the log.
        static string Describe(ChannelBranding? b)
        {
            if (b is null || !YouTubeBrandKit.HasAny(b)) return "none";
            var set = new List<string>();
            if (!string.IsNullOrWhiteSpace(b.Tagline)) set.Add("tagline");
            if (!string.IsNullOrWhiteSpace(b.StudioUrl)) set.Add("studio link");
            if (!string.IsNullOrWhiteSpace(b.CreatorUrl)) set.Add("creator link");
            if (!string.IsNullOrWhiteSpace(b.EngineName)) set.Add("tool");
            if (!string.IsNullOrWhiteSpace(b.VisualsCredit)) set.Add("visuals");
            if (b.Hashtags.Count > 0) set.Add($"{b.Hashtags.Count} hashtags");
            if (b.Tags.Count > 0) set.Add($"{b.Tags.Count} tags");
            return string.Join(", ", set);
        }
    }

    private static bool TryChannel(AiSettings settings, string? channelId, out BrandChannel? channel)
    {
        channel = settings.FindChannel(channelId);
        return BrandChannel.IsDefault(channelId) || channel is not null;
    }

    /// <summary>The name of another brand channel already linked to this YouTube channel, if any.</summary>
    private static string? LinkedElsewhere(AiSettings settings, string youTubeChannelId, string? exceptBrandId)
    {
        bool Linked(ChannelPublishSettings? p) => string.Equals(p?.YouTubeChannelId, youTubeChannelId, StringComparison.Ordinal);
        if (exceptBrandId is not null && Linked(settings.DefaultPublishing)) return settings.DefaultChannelName;
        return settings.Channels.FirstOrDefault(c => c.Id != exceptBrandId && Linked(c.Publishing))?.Name;
    }

    private NotFoundObjectResult ChannelNotFound()
    {
        const string message = "That brand channel does not exist (it may have been deleted).";
        return NotFound(ApiResponse<EmptyPayload>.Fail(message, new ApiError("channel-not-found", message)));
    }
}
