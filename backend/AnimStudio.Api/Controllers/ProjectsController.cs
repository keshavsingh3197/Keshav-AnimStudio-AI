using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Options;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(
    IProjectRepository projects,
    ProjectEditingService editing,
    IAiSettingsRepository aiSettingsRepo,
    ICurrentUser currentUser,
    IOptionsMonitor<AdminOptions> adminOptions,
    TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectResponse>>>> List(
        CancellationToken ct)
    {
        var list = currentUser.IsAdmin
            ? await projects.ListAllAsync(ct)
            : await projects.ListAsync(currentUser.UserId, ct);
        var subProjectCounts = list.Where(p => !string.IsNullOrEmpty(p.ParentProjectId))
            .GroupBy(p => p.ParentProjectId!)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.Ordinal);

        return Ok(ApiResponse<IReadOnlyList<ProjectResponse>>.Ok(
            [.. list.Select(p => p.ToResponse(subProjectCounts.GetValueOrDefault(p.Id, 0)))]));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Get(string id, CancellationToken ct)
    {
        var project = await LoadOwnedAsync(id, ct);
        var subProjects = await projects.ListSubProjectsAsync(id, ct);
        return Ok(ApiResponse<ProjectResponse>.Ok(project.ToResponse(subProjects.Count)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Create(
        [FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        var policy = adminOptions.CurrentValue.AnonymousPolicy;
        if (!currentUser.IsAuthenticated)
        {
            if (!policy.AllowGuestProjectCreation)
            {
                const string msg = "Guest project creation is disabled by platform policy. Please sign in to create projects.";
                return StatusCode(403, ApiResponse<ProjectResponse>.Fail(msg, new ApiError("guest-forbidden", msg)));
            }

            var ownedList = await projects.ListAsync(currentUser.UserId, ct);
            if (ownedList.Count >= policy.MaxGuestProjects)
            {
                var msg = $"Guest project limit reached: anonymous visitors can create up to {policy.MaxGuestProjects} project(s). Please sign in for unlimited projects.";
                return BadRequest(ApiResponse<ProjectResponse>.Fail(msg, new ApiError("guest-limit-reached", msg)));
            }
        }
        var now = clock.GetUtcNow().UtcDateTime;

        if (!currentUser.IsAdmin && !string.IsNullOrWhiteSpace(request.BrandChannelId) && !BrandChannel.IsDefault(request.BrandChannelId))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<ProjectResponse>.Fail("Non-administrator users cannot attach projects to internal studio brand channels."));
        }

        var globalSettings = await aiSettingsRepo.GetAsync(ct);
        if (UnknownChannel(globalSettings, request.BrandChannelId) is { } unknown) return unknown;
        var channelId = BrandChannel.IsDefault(request.BrandChannelId) ? null : request.BrandChannelId;

        // The new project starts with its channel's watermark, copied so it can be tuned per project.
        WatermarkSettings? defaultWatermark = null;
        if (currentUser.IsAdmin)
        {
            var channelWatermark = globalSettings?.WatermarkFor(channelId);
            if (channelWatermark is not null && channelWatermark.Kind != WatermarkKind.None)
            {
                defaultWatermark = new WatermarkSettings
                {
                    Kind = channelWatermark.Kind,
                    Text = channelWatermark.Text,
                    LogoAssetId = channelWatermark.LogoAssetId,
                    Position = channelWatermark.Position,
                    Opacity = channelWatermark.Opacity,
                    HeightFraction = channelWatermark.HeightFraction,
                    MarginFraction = channelWatermark.MarginFraction,
                    ColorHex = channelWatermark.ColorHex,
                    BackplateOpacity = channelWatermark.BackplateOpacity
                };
            }
        }

        var project = new Project
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            UserId = currentUser.UserId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = ProjectStatus.Draft,
            Settings = new ProjectSettings
            {
                // Even dimensions are required by yuv420p; round rather than reject.
                Width = request.Width % 2 == 0 ? request.Width : request.Width + 1,
                Height = request.Height % 2 == 0 ? request.Height : request.Height + 1,
                FrameRateNum = request.Fps,
                FrameRateDen = 1,
                DistributionIntent = request.DistributionIntent,
                ContentType = ProjectContentTypes.Parse(request.ContentType),
                DefaultWatermark = defaultWatermark ?? new WatermarkSettings(),
                BrandChannelId = channelId,
                // Follows the channel live; the copy above is the starting point if it goes custom.
                FollowChannelWatermark = true
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(project, ct);

        return CreatedAtAction(nameof(Get), new { id = project.Id },
            ApiResponse<ProjectResponse>.Ok(project.ToResponse()));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Update(
        string id, [FromBody] UpdateProjectRequest request, CancellationToken ct)
    {
        if (!currentUser.IsAdmin && !string.IsNullOrWhiteSpace(request.BrandChannelId) && !BrandChannel.IsDefault(request.BrandChannelId))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<ProjectResponse>.Fail("Non-administrator users cannot attach projects to internal studio brand channels."));
        }

        if (request.BrandChannelId is not null
            && UnknownChannel(await aiSettingsRepo.GetAsync(ct), request.BrandChannelId) is { } unknown)
        {
            return unknown;
        }

        var project = await editing.UpdateAsync(new UpdateProjectCommand
        {
            ProjectId = id,
            UserId = currentUser.UserId,
            Name = request.Name,
            Description = request.Description,
            Width = request.Width,
            Height = request.Height,
            Fps = request.Fps,
            DistributionIntent = request.DistributionIntent,
            AcceptShareAlikeObligation = request.AcceptShareAlikeObligation,
            BackgroundMusicAssetId = request.BackgroundMusicAssetId,
            BackgroundMusicVolume = request.BackgroundMusicVolume,
            IsPinned = request.IsPinned,
            CustomThumbnail = request.CustomThumbnail,
            DefaultWatermark = request.DefaultWatermark?.ToSettings(),
            DefaultOutro = request.DefaultOutro?.ToSettings(),
            BrandChannelId = request.BrandChannelId,
            FollowChannelWatermark = request.FollowChannelWatermark,
            DefaultImageDurationSeconds = request.DefaultImageDurationSeconds,
            ContentType = request.ContentType is null ? null : ProjectContentTypes.Parse(request.ContentType),
            UseSharedAssets = request.UseSharedAssets
        }, ct);

        return Ok(ApiResponse<ProjectResponse>.Ok(project.ToResponse()));
    }

    /// <summary>A 400 when the id names no channel; null when it is the default or exists.</summary>
    private static BadRequestObjectResult? UnknownChannel(Domain.Ai.AiSettings? settings, string? channelId)
    {
        if (BrandChannel.IsDefault(channelId) || settings?.FindChannel(channelId) is not null) return null;
        const string message = "That brand channel no longer exists. Pick another in project settings.";
        return new BadRequestObjectResult(ApiResponse<EmptyPayload>.Fail(message, new ApiError("unknown-channel", message)));
    }

    [HttpPost("{id}/subprojects")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> CreateSubProject(
        string id, [FromBody] CreateSubProjectRequest request, CancellationToken ct)
    {
        var parent = await LoadOwnedAsync(id, ct);
        if (parent.IsSubProject)
        {
            const string msg = "Sub-projects cannot contain sub-projects.";
            return BadRequest(ApiResponse<ProjectResponse>.Fail(msg, new ApiError("nesting-not-allowed", msg)));
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var subProject = new Project
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            UserId = currentUser.UserId,
            ParentProjectId = parent.Id,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = ProjectStatus.Draft,
            Settings = new ProjectSettings
            {
                Width = parent.Settings.Width,
                Height = parent.Settings.Height,
                FrameRateNum = parent.Settings.FrameRateNum,
                FrameRateDen = parent.Settings.FrameRateDen,
                DistributionIntent = parent.Settings.DistributionIntent,
                ContentType = parent.Settings.ContentType,
                BrandChannelId = parent.Settings.BrandChannelId,
                FollowChannelWatermark = parent.Settings.FollowChannelWatermark,
                DefaultWatermark = parent.Settings.DefaultWatermark,
                DefaultOutro = parent.Settings.DefaultOutro,
                DefaultImageDurationSeconds = parent.Settings.DefaultImageDurationSeconds,
                UseSharedAssets = request.UseSharedAssets
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(subProject, ct);

        return CreatedAtAction(nameof(Get), new { id = subProject.Id },
            ApiResponse<ProjectResponse>.Ok(subProject.ToResponse(0)));
    }

    [HttpPost("{id}/duplicate")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Duplicate(
        string id,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] DuplicateProjectRequest? request,
        CancellationToken ct)
    {
        var copy = await editing.DuplicateAsync(id, currentUser.UserId, request?.Name, ct);
        return CreatedAtAction(nameof(Get), new { id = copy.Id },
            ApiResponse<ProjectResponse>.Ok(copy.ToResponse()));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(
        string id, [FromServices] IProjectEditRepository edits, CancellationToken ct)
    {
        var subProjects = await projects.ListSubProjectsAsync(id, ct);
        if (subProjects.Count > 0)
        {
            const string msg = "Delete or move this project's sub-projects first.";
            return StatusCode(StatusCodes.Status409Conflict,
                ApiResponse<EmptyPayload>.Fail(msg, new ApiError("has-subprojects", msg)));
        }

        await editing.DeleteAsync(id, currentUser.UserId, ct);

        // Only reached once the delete above confirmed ownership.
        foreach (var edit in await edits.ListByProjectAsync(id, ct))
            await edits.DeleteAsync(edit.Id, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    /// <summary>
    /// Renders the end card this project's export would finish with - its own outro when it
    /// has one enabled, else its brand channel's - so it can be seen before a 20-minute export.
    /// A body previews unsaved project settings; without one the saved settings are used.
    /// </summary>
    /// <param name="format">landscape, vertical or square; omitted means the project's own canvas.</param>
    [HttpPost("{id}/outro/preview")]
    public async Task<IActionResult> PreviewOutro(
        string id,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] OutroRequest? request,
        [FromQuery] string? format,
        [FromServices] AnimStudio.Application.Abstractions.Rendering.IOutroPreviewRenderer previews,
        CancellationToken ct)
    {
        var project = await LoadOwnedAsync(id, ct);

        Canvas? canvas = format?.ToLowerInvariant() switch
        {
            null or "" => project.Settings.ToCanvas(),
            "landscape" => Canvas.Hd1080p30,
            "vertical" => Canvas.Vertical1080x1920,
            "square" => Canvas.Square1080,
            _ => null
        };
        if (canvas is null)
        {
            const string message = "format must be landscape, vertical or square.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("invalid-format", message)));
        }

        var own = request?.ToSettings() ?? project.Settings.DefaultOutro;
        own?.Clamp();
        var outro = own is { IsEnabled: true }
            ? own
            : (await aiSettingsRepo.GetAsync(ct))?.OutroFor(project.Settings.BrandChannelId);

        var bytes = outro is { IsEnabled: true }
            ? await previews.RenderAsync(outro, canvas, project.Id, ct)
            : null;
        if (bytes is null)
        {
            const string message = "This project has no end card: set one here or in global branding.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("outro-empty", message)));
        }

        return File(bytes, "video/mp4", "end-card-preview.mp4");
    }

    /// <summary>
    /// Loads a project and verifies ownership. Every project-scoped endpoint goes through
    /// this: an id being hard to guess is not an access control.
    /// </summary>
    private async Task<Project> LoadOwnedAsync(string id, CancellationToken ct)
    {
        var project = await projects.GetAsync(id, ct)
            ?? throw new KeyNotFoundException();

        if (currentUser.IsAdmin || string.IsNullOrEmpty(project.UserId) || string.IsNullOrEmpty(currentUser.UserId))
            return project;

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }
}
