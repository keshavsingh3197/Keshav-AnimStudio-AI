using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(
    IProjectRepository projects,
    ProjectEditingService editing,
    IAiSettingsRepository aiSettingsRepo,
    ICurrentUser currentUser,
    TimeProvider clock) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProjectResponse>>>> List(
        CancellationToken ct)
    {
        var list = await projects.ListAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<ProjectResponse>>.Ok([.. list.Select(p => p.ToResponse())]));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Get(string id, CancellationToken ct)
    {
        var project = await LoadOwnedAsync(id, ct);
        return Ok(ApiResponse<ProjectResponse>.Ok(project.ToResponse()));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProjectResponse>>> Create(
        [FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        var globalSettings = await aiSettingsRepo.GetAsync(ct);
        if (UnknownChannel(globalSettings, request.BrandChannelId) is { } unknown) return unknown;
        var channelId = BrandChannel.IsDefault(request.BrandChannelId) ? null : request.BrandChannelId;

        // The new project starts with its channel's watermark, copied so it can be tuned per project.
        WatermarkSettings? defaultWatermark = null;
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
                DefaultWatermark = defaultWatermark ?? new WatermarkSettings(),
                BrandChannelId = channelId
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
            BrandChannelId = request.BrandChannelId
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

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(string id, CancellationToken ct)
    {
        await editing.DeleteAsync(id, currentUser.UserId, ct);
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

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }
}
