using AnimStudio.Api.Common;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Automation;
using AnimStudio.Infrastructure.Automation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

public sealed record PrepareAutomationRequest(
    string? DateKey = null,
    string? RuleId = null,
    bool ForceRegenerate = false);

public sealed record AttachAutomationVideoRequest(
    string? HandoffId = null,
    string? RenderJobId = null);

public sealed record PublishAutomationPostRequest(
    bool PublishNow = true,
    DateTime? ScheduledAtUtc = null);

/// <summary>
/// Manages ecosystem-driven automated daily content generation (Hindu Panchang, Hindu Festivals,
/// Daily Vedic Katha, Aaj Ka Itihaas, Pratiyogita/Ecosystem Spotlights), preview queues,
/// video attachments (Drive Library, Studio Renders, AI Story Agent), and automated YouTube publishing.
/// </summary>
[ApiController]
[Authorize]
[Route("api/automation")]
public sealed class AutomationController(
    EcosystemAutomationService automation,
    ICurrentUser currentUser) : ControllerBase
{
    private ActionResult<ApiResponse<T>>? RequireAuthenticatedUser<T>()
    {
        if (currentUser.IsAuthenticated) return null;
        const string msg = "Sign in to access ecosystem auto-post pipelines and YouTube publishing.";
        return StatusCode(403, ApiResponse<T>.Fail(msg, new ApiError("auth-required", msg)));
    }

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<AutomationOverview>>> Overview(
        [FromQuery] string? date = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationOverview>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationOverview>.Ok(await automation.GetOverviewAsync(currentUser.UserId, date, ct)));
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<AutomationWorkspaceConfig>>> GetSettings(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationWorkspaceConfig>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationWorkspaceConfig>.Ok(await automation.GetWorkspaceConfigAsync(ct)));
    }

    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse<AutomationWorkspaceConfig>>> SaveSettings(
        [FromBody] AutomationWorkspaceConfig request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationWorkspaceConfig>() is { } denied) return denied;
        var saved = await automation.SaveWorkspaceConfigAsync(request, currentUser.UserId, ct);
        return Ok(ApiResponse<AutomationWorkspaceConfig>.Ok(saved));
    }

    [HttpGet("rules")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AutomationRule>>>> ListRules(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<IReadOnlyList<AutomationRule>>() is { } denied) return denied;
        return Ok(ApiResponse<IReadOnlyList<AutomationRule>>.Ok(await automation.ListRulesAsync(currentUser.UserId, ct)));
    }

    [HttpPost("rules/bootstrap")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AutomationRule>>>> BootstrapRules(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<IReadOnlyList<AutomationRule>>() is { } denied) return denied;
        return Ok(ApiResponse<IReadOnlyList<AutomationRule>>.Ok(await automation.BootstrapDefaultRulesAsync(currentUser.UserId, ct)));
    }

    [HttpPost("rules")]
    public async Task<ActionResult<ApiResponse<AutomationRule>>> CreateRule(
        [FromBody] AutomationRule request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationRule>() is { } denied) return denied;
        var created = await automation.SaveRuleAsync(currentUser.UserId, null, request, ct);
        return Ok(ApiResponse<AutomationRule>.Ok(created));
    }

    [HttpPut("rules/{id}")]
    public async Task<ActionResult<ApiResponse<AutomationRule>>> UpdateRule(
        string id,
        [FromBody] AutomationRule request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationRule>() is { } denied) return denied;
        var updated = await automation.SaveRuleAsync(currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<AutomationRule>.Ok(updated));
    }

    [HttpDelete("rules/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> DeleteRule(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<EmptyPayload>() is { } denied) return denied;
        await automation.DeleteRuleAsync(currentUser.UserId, id, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    [HttpPost("prepare")]
    public async Task<ActionResult<ApiResponse<AutomationPrepareResult>>> Prepare(
        [FromBody] PrepareAutomationRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPrepareResult>() is { } denied) return denied;
        var result = await automation.PrepareForDateAsync(
            currentUser.UserId,
            request?.DateKey,
            request?.RuleId,
            request?.ForceRegenerate ?? false,
            ct);
        return Ok(ApiResponse<AutomationPrepareResult>.Ok(result));
    }

    [HttpGet("queue")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AutomationPost>>>> ListQueue(
        [FromQuery] string? from = null,
        [FromQuery] string? to = null,
        [FromQuery] AutomationPostStatus? status = null,
        [FromQuery] int limit = 100,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<IReadOnlyList<AutomationPost>>() is { } denied) return denied;
        return Ok(ApiResponse<IReadOnlyList<AutomationPost>>.Ok(
            await automation.ListPostsAsync(currentUser.UserId, from, to, status, limit, ct)));
    }

    [HttpPut("queue/{id}")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> UpdateQueuePost(
        string id,
        [FromBody] AutomationPost request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.UpdatePostAsync(currentUser.UserId, id, request, ct)));
    }

    [HttpGet("queue/{id}/video-candidates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AutomationVideoCandidate>>>> VideoCandidates(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<IReadOnlyList<AutomationVideoCandidate>>() is { } denied) return denied;
        return Ok(ApiResponse<IReadOnlyList<AutomationVideoCandidate>>.Ok(
            await automation.ListVideoCandidatesAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/attach-video")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> AttachVideo(
        string id,
        [FromBody] AttachAutomationVideoRequest request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(
            await automation.AttachVideoAsync(currentUser.UserId, id, request.HandoffId, request.RenderJobId, ct)));
    }

    [HttpPost("queue/{id}/generate-video")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> GenerateVideo(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.GenerateAiVideoAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/publish")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> PublishPost(
        string id,
        [FromBody] PublishAutomationPostRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        var post = await automation.ApproveAndPublishAsync(
            currentUser.UserId,
            id,
            request?.PublishNow ?? true,
            request?.ScheduledAtUtc,
            ct);
        return Ok(ApiResponse<AutomationPost>.Ok(post));
    }

    [HttpDelete("queue/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> DeletePost(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<EmptyPayload>() is { } denied) return denied;
        await automation.DeletePostAsync(currentUser.UserId, id, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }
}
