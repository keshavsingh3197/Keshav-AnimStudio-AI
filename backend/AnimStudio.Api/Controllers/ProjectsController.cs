using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Projects;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(
    IProjectRepository projects,
    ProjectEditingService editing,
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

        var project = new Project
        {
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
                DistributionIntent = request.DistributionIntent
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
            BackgroundMusicVolume = request.BackgroundMusicVolume
        }, ct);

        return Ok(ApiResponse<ProjectResponse>.Ok(project.ToResponse()));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(string id, CancellationToken ct)
    {
        await editing.DeleteAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
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
