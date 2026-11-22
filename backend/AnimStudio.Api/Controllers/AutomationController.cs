using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Rendering;
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

public sealed record GenerateAutomationAiVideoRequest(
    AutomationVisualEngine? VisualEngine = null,
    AutomationNarrativeMode? NarrativeMode = null,
    int? TargetSeconds = null,
    List<string>? AttachedAssetIds = null,
    bool UseTemplateScript = false,
    string? VoiceProfileId = null);

public sealed record SubmitAutomationScriptTemplateRequest(
    AutomationVisualEngine Engine = AutomationVisualEngine.AiRealisticStory,
    string? Reply = null,
    [System.ComponentModel.DataAnnotations.Range(0, 3600)] int? TargetSeconds = null,
    [System.ComponentModel.DataAnnotations.StringLength(32)] string? SubtitlePreset = null);

public sealed record GenerateAnimatedAutomationVideoRequest(
    ProceduralSceneTheme Theme = ProceduralSceneTheme.Auto,
    int DurationSeconds = 0,
    string? Resolution = null,
    string? Format = null,
    bool? EnableCharacterDialogue = null,
    string? SubtitlePreset = null,
    string? SpeakerAName = null,
    string? SpeakerBName = null,
    AutomationNarrativeMode? NarrativeMode = null,
    List<string>? AttachedAssetIds = null,
    AutomationVisualEngine? VisualEngine = null,
    string? VoiceProfileId = null);

/// <summary>Body for removing a card's video from YouTube; <c>TargetChannelId</c> retargets the card (optional).</summary>
public sealed record RemoveAutomationPostFromYouTubeRequest(
    bool DeleteOnYouTube,
    string? TargetChannelId,
    bool RepublishNow);

public sealed record AutomationTemplateProject(string ProjectId);

public sealed record PublishAutomationPostRequest(
    bool PublishNow = true,
    DateTime? ScheduledAtUtc = null,
    bool ScheduleOnYouTube = false);

public sealed record SetAutomationThumbnailRequest(
    string? ImageBase64 = null,
    double? FrameAtSeconds = null,
    string? StorageAssetId = null);

public sealed record GenerateAutomationThumbnailRequest(string? Prompt = null);

/// <summary>
/// Manages ecosystem-driven automated daily content generation (Hindu Panchang, Hindu Festivals,
/// Daily Vedic Katha, Aaj Ka Itihaas, Pratiyogita/Ecosystem Spotlights), preview queues,
/// video attachments (Drive Library, Studio Renders, AI Story Agent), and automated YouTube publishing.
/// </summary>
[ApiController]
[Authorize]
[StoryRunErrors] // template paste goes through the Story Agent, whose refusals carry a person-facing message
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

    [HttpGet("palettes")]
    public ActionResult<ApiResponse<IReadOnlyList<ProceduralEventPalette>>> GetPalettes()
    {
        if (RequireAuthenticatedUser<IReadOnlyList<ProceduralEventPalette>>() is { } denied) return denied;
        return Ok(ApiResponse<IReadOnlyList<ProceduralEventPalette>>.Ok(ProceduralEventPalette.All));
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

    [HttpPost("rules/rebalance-channels")]
    public async Task<ActionResult<ApiResponse<AutomationRebalanceResult>>> RebalanceChannels(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationRebalanceResult>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationRebalanceResult>.Ok(await automation.RebalanceStarterChannelsAsync(currentUser.UserId, ct)));
    }

    [HttpPost("prepare-publish-pack")]
    public async Task<ActionResult<ApiResponse<PreparePublishPackResult>>> PreparePublishPack(
        [FromBody] PreparePublishPackRequest? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<PreparePublishPackResult>() is { } denied) return denied;
        return Ok(ApiResponse<PreparePublishPackResult>.Ok(
            await automation.PreparePublishPackAsync(currentUser.UserId, request ?? new PreparePublishPackRequest(), ct)));
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

    [HttpGet("storage-images")]
    public async Task<ActionResult<ApiResponse<AutomationStorageCatalog>>> StorageImages(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationStorageCatalog>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationStorageCatalog>.Ok(
            await automation.GetStorageMediaCatalogAsync(currentUser.UserId, ct)));
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
        [FromBody] GenerateAutomationAiVideoRequest? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.GenerateAiVideoAsync(
            currentUser.UserId,
            id,
            ct,
            request?.VisualEngine,
            request?.NarrativeMode,
            request?.TargetSeconds,
            request?.AttachedAssetIds,
            request?.UseTemplateScript ?? false,
            request?.VoiceProfileId)));
    }

    /// <summary>Starts the post's failed story run again from the step it stopped at, keeping what was already made.</summary>
    [HttpPost("queue/{id}/retry-video")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> RetryVideo(string id, CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.RetryAiVideoAsync(currentUser.UserId, id, ct)));
    }

    /// <summary>The copy-and-paste script template for an outside AI tool (story JSON or 3D dialogue).</summary>
    [HttpGet("queue/{id}/script-template")]
    public async Task<ActionResult<ApiResponse<AutomationScriptTemplate>>> ScriptTemplate(
        string id,
        [FromQuery] AutomationVisualEngine engine = AutomationVisualEngine.AiRealisticStory,
        [FromQuery, System.ComponentModel.DataAnnotations.Range(0, 3600)] int? targetSeconds = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationScriptTemplate>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationScriptTemplate>.Ok(
            await automation.GetScriptTemplateAsync(currentUser.UserId, id, engine, targetSeconds, ct)));
    }

    /// <summary>Takes the outside AI's reply to the template and continues the video from it.</summary>
    [HttpPost("queue/{id}/script-template")]
    [RequestSizeLimit(128 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> SubmitScriptTemplate(
        string id,
        [FromBody] SubmitAutomationScriptTemplateRequest request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(
            await automation.SubmitScriptTemplateAsync(currentUser.UserId, id, request.Engine, request.Reply, ct,
                request.TargetSeconds, request.SubtitlePreset)));
    }

    [HttpPost("queue/{id}/generate-animated-video")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> GenerateAnimatedVideo(
        string id,
        [FromBody] GenerateAnimatedAutomationVideoRequest? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.GenerateAnimatedVideoAsync(
            currentUser.UserId,
            id,
            request?.Theme ?? ProceduralSceneTheme.Auto,
            request?.DurationSeconds ?? 0,
            request?.Resolution,
            ct,
            request?.Format,
            request?.EnableCharacterDialogue,
            request?.SubtitlePreset,
            request?.SpeakerAName,
            request?.SpeakerBName,
            request?.NarrativeMode,
            request?.AttachedAssetIds,
            request?.VisualEngine,
            request?.VoiceProfileId)));
    }

    /// <summary>Saves the Enhanced 3D stage choices (background template, character spots, location, music, pacing).</summary>
    [HttpPut("queue/{id}/stage")]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> SaveStage(
        string id,
        [FromBody] AutomationStageSettings? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(
            await automation.SaveStageSettingsAsync(currentUser.UserId, id, request, ct)));
    }

    /// <summary>
    /// The project that uploaded background templates go into (created on first use). The picture itself is uploaded
    /// through the regular, validated asset upload of that project.
    /// </summary>
    [HttpPost("background-templates/project")]
    public async Task<ActionResult<ApiResponse<AutomationTemplateProject>>> BackgroundTemplateProject(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationTemplateProject>() is { } denied) return denied;
        var projectId = await automation.EnsureBackgroundTemplateProjectAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<AutomationTemplateProject>.Ok(new AutomationTemplateProject(projectId)));
    }

    /// <summary>
    /// A ready image prompt for this post's background picture (place, light, frame shape, open ground where the
    /// characters stand), built from the wizard's unsaved stage choices. Nothing is generated or saved.
    /// </summary>
    [HttpPost("queue/{id}/background-picture/prompt")]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationBackgroundPrompt>>> BackgroundPicturePrompt(
        string id,
        [FromBody] AutomationBackgroundPictureRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationBackgroundPrompt>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationBackgroundPrompt>.Ok(
            await automation.GetBackgroundPromptAsync(currentUser.UserId, id, request?.Stage, ct)));
    }

    /// <summary>
    /// Makes this post's background picture with the configured image engine and saves it to the user's Background
    /// Templates project. Returns the new asset id; the wizard selects it and saves the stage as usual.
    /// </summary>
    [HttpPost("queue/{id}/background-picture/generate")]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationGeneratedBackground>>> GenerateBackgroundPicture(
        string id,
        [FromBody] AutomationBackgroundPictureRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationGeneratedBackground>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationGeneratedBackground>.Ok(
            await automation.GenerateBackgroundPictureAsync(currentUser.UserId, id, request, ct)));
    }

    /// <summary>
    /// The pictures a script needs, one per directed scene and in render order, with a numbered prompt to make them all
    /// in an outside image tool. Uses the pasted reply when given, else the post's script. Nothing is saved.
    /// </summary>
    [HttpPost("queue/{id}/scene-pictures/plan")]
    [RequestSizeLimit(128 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationScenePicturePlan>>> ScenePicturePlan(
        string id,
        [FromBody] AutomationScenePicturePlanRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationScenePicturePlan>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationScenePicturePlan>.Ok(
            await automation.GetScenePicturePlanAsync(currentUser.UserId, id, request, ct)));
    }

    [HttpPost("queue/{id}/community-card")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> GenerateCommunityCard(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.GenerateCommunityCardAsync(currentUser.UserId, id, ct)));
    }

    [AllowMediaTicket]
    [HttpGet("queue/{id}/community-card")]
    [HttpHead("queue/{id}/community-card")]
    public async Task<IActionResult> DownloadCommunityCard(
        string id,
        CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated) return Forbid();
        var bytes = await automation.GetCommunityCardBytesAsync(currentUser.UserId, id, ct);
        if (bytes is null) return NotFound();
        return File(bytes, "image/png", $"promo-card-{id}.png");
    }

    [AllowMediaTicket]
    [HttpGet("queue/{id}/thumbnail")]
    [HttpHead("queue/{id}/thumbnail")]
    public async Task<IActionResult> GetThumbnail(
        string id,
        CancellationToken ct = default)
    {
        if (!currentUser.IsAuthenticated) return Forbid();
        var result = await automation.GetPostThumbnailBytesAsync(currentUser.UserId, id, ct);
        if (result is null) return NotFound();
        Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
        var ext = result.Value.ContentType == "image/png" ? "png" : "jpg";
        return File(result.Value.Bytes, result.Value.ContentType, $"thumbnail-{id}.{ext}");
    }

    [HttpPost("queue/{id}/thumbnail")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> SetThumbnail(
        string id,
        [FromBody] SetAutomationThumbnailRequest request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.SetPostThumbnailAsync(
            currentUser.UserId,
            id,
            request.ImageBase64,
            request.FrameAtSeconds,
            request.StorageAssetId,
            ct)));
    }

    [HttpPost("queue/{id}/thumbnail/generate")]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> GenerateThumbnail(
        string id,
        [FromBody] GenerateAutomationThumbnailRequest? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.GenerateAiPostThumbnailAsync(
            currentUser.UserId,
            id,
            request?.Prompt,
            ct)));
    }

    [HttpDelete("queue/{id}/thumbnail")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> DeleteThumbnail(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.DeletePostThumbnailAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/autofill-details")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> AutoFillDetails(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.AutoFillMissingDetailsAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/mark-community-posted")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> MarkCommunityPosted(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.MarkCommunityPostPublishedAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/sync-panchang")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> SyncToPanchang(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.SyncPostToEcosystemAsync(currentUser.UserId, id, ResolveCallerBearer(), ct)));
    }

    /// <summary>Takes the post's video off the Panchang Video Hub; it stays on YouTube.</summary>
    [HttpDelete("queue/{id}/sync-panchang")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> RemoveFromPanchang(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.RemovePostFromEcosystemAsync(currentUser.UserId, id, ResolveCallerBearer(), ct)));
    }

    /// <summary>The caller's own SSO token, forwarded so HinduPanchang can authorize the Admin role.</summary>
    private string? ResolveCallerBearer()
    {
        var rawAuth = Request.Headers.Authorization.FirstOrDefault();
        if (rawAuth is not null && rawAuth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return rawAuth["Bearer ".Length..].Trim();
        return Request.Cookies.TryGetValue("ks_sso", out var cookieToken) && !string.IsNullOrWhiteSpace(cookieToken)
            ? cookieToken.Trim()
            : null;
    }

    [HttpPost("queue/{id}/verify")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> VerifyPost(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.VerifyPostAsync(currentUser.UserId, id, ct)));
    }

    [HttpPost("queue/{id}/reverify-fix")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> ReverifyAndFixPost(
        string id,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(await automation.ReverifyAndFixPostAsync(currentUser.UserId, id, ct)));
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
            ct,
            scheduleOnYouTube: request?.ScheduleOnYouTube ?? false);
        return Ok(ApiResponse<AutomationPost>.Ok(post));
    }

    [HttpPost("queue/{id}/thumbnail/template")]
    [RequestSizeLimit(32 * 1024)]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> RenderTemplateThumbnail(
        string id,
        [FromBody] RenderTemplateThumbnailDto? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        var updated = await automation.RenderFixedTemplateThumbnailAsync(
            currentUser.UserId,
            id,
            request ?? new RenderTemplateThumbnailDto(),
            ct);
        return Ok(ApiResponse<AutomationPost>.Ok(updated));
    }

    [HttpGet("publish-advice")]
    public async Task<ActionResult<ApiResponse<AutomationPublishAdvice>>> GetPublishAdvice(
        [FromQuery] AutomationSourceType sourceType = AutomationSourceType.FunnyComedy,
        [FromQuery] AutomationVideoFormat format = AutomationVideoFormat.Vertical,
        [FromQuery] string? channelId = null,
        [FromQuery] string? timeZone = null,
        [FromQuery] string? dateKey = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPublishAdvice>() is { } denied) return denied;
        var advice = await automation.GetPublishAdviceAsync(currentUser.UserId, sourceType, format, channelId, timeZone, ct, dateKey);
        return Ok(ApiResponse<AutomationPublishAdvice>.Ok(advice));
    }

    [HttpGet("rashifal")]
    public async Task<ActionResult<ApiResponse<DailyRashifalReport>>> GetDailyRashifal(
        [FromQuery] string? date = null,
        [FromQuery] string? location = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<DailyRashifalReport>() is { } denied) return denied;
        var report = await automation.GetDailyRashifalAsync(date, location, ct);
        return Ok(ApiResponse<DailyRashifalReport>.Ok(report));
    }

    [HttpPost("rashifal/generate")]
    public async Task<ActionResult<ApiResponse<GenerateRashifalShortsResult>>> GenerateRashifalShorts(
        [FromBody] GenerateRashifalShortsDto? request = null,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<GenerateRashifalShortsResult>() is { } denied) return denied;
        var result = await automation.GenerateRashifalShortsBatchAsync(
            currentUser.UserId,
            request ?? new GenerateRashifalShortsDto(),
            ct);
        return Ok(ApiResponse<GenerateRashifalShortsResult>.Ok(result));
    }

    /// <summary>
    /// Deletes the card's video from YouTube (or records that it is already gone), keeps the rendered video, and
    /// optionally moves the card to another connected channel and uploads it there right away.
    /// </summary>
    [HttpPost("queue/{id}/youtube-removal")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> RemoveFromYouTube(
        string id,
        [FromBody] RemoveAutomationPostFromYouTubeRequest? request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        var target = request?.TargetChannelId?.Trim();
        if (target is { Length: > 64 })
            return BadRequest(ApiResponse<AutomationPost>.Fail("That channel id is not valid.",
                new ApiError("channel-invalid", "That channel id is not valid.", Field: "targetChannelId")));
        var post = await automation.RemoveFromYouTubeAsync(
            currentUser.UserId,
            id,
            new AutomationYouTubeRemovalRequest(request?.DeleteOnYouTube ?? false, string.IsNullOrEmpty(target) ? null : target, request?.RepublishNow ?? false),
            ct);
        return Ok(ApiResponse<AutomationPost>.Ok(post));
    }

    [HttpPost("compile-comedy")]
    public async Task<ActionResult<ApiResponse<ComedyCompilationResult>>> CompileComedy(
        [FromBody] CompileComedyRequest request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<ComedyCompilationResult>() is { } denied) return denied;
        var result = await automation.BuildComedyCompilationAsync(
            currentUser.UserId,
            new CompileComedyRequestDto(request.PostIds, request.Title, request.MaxSeconds, request.TargetChannelId),
            ct);
        return Ok(ApiResponse<ComedyCompilationResult>.Ok(result));
    }

    [HttpPost("comedy/bootstrap-dual")]
    public async Task<ActionResult<ApiResponse<DualComedyBootstrapResult>>> BootstrapDualComedy(CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<DualComedyBootstrapResult>() is { } denied) return denied;
        return Ok(ApiResponse<DualComedyBootstrapResult>.Ok(
            await automation.BootstrapDualComedyPipelinesAsync(currentUser.UserId, ct)));
    }

    [HttpPost("comedy/create-post")]
    public async Task<ActionResult<ApiResponse<AutomationPost>>> CreateComedyPost(
        [FromBody] CreateComedyStudioPostDto request,
        CancellationToken ct = default)
    {
        if (RequireAuthenticatedUser<AutomationPost>() is { } denied) return denied;
        return Ok(ApiResponse<AutomationPost>.Ok(
            await automation.CreateComedyStudioPostAsync(currentUser.UserId, request, ct)));
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

public sealed record CompileComedyRequest(
    IReadOnlyList<string> PostIds,
    string? Title = null,
    int MaxSeconds = 180,
    string? TargetChannelId = null);
