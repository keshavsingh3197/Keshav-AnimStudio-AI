using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/folders")]
public class AssetFoldersController(
    IAssetFolderRepository folders,
    IAssetRepository assets,
    IProjectRepository projects,
    ICurrentUser currentUser) : ControllerBase
{
    public sealed record CreateFolderRequest
    {
        [Required, MaxLength(100)] public string Name { get; init; } = string.Empty;
        public string? ParentId { get; init; }
    }

    public sealed record UpdateFolderRequest
    {
        [Required, MaxLength(100)] public string Name { get; init; } = string.Empty;
        public string? ParentId { get; init; }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssetFolder>>>> ListFolders(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await folders.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<AssetFolder>>.Ok(list));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AssetFolder>>> CreateFolder(
        string projectId,
        [FromBody] CreateFolderRequest req,
        CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (!await IsFolderOfProjectAsync(req.ParentId, projectId, ct)) return NotFound();

        var folder = new AssetFolder
        {
            Id = Guid.NewGuid().ToString("N"),
            ProjectId = projectId,
            Name = req.Name,
            ParentId = req.ParentId,
            CreatedAt = DateTime.UtcNow
        };

        await folders.InsertAsync(folder, ct);
        return Ok(ApiResponse<AssetFolder>.Ok(folder));
    }

    [HttpPut("{folderId}")]
    public async Task<ActionResult<ApiResponse<AssetFolder>>> UpdateFolder(
        string projectId,
        string folderId,
        [FromBody] UpdateFolderRequest req,
        CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var existing = await folders.GetAsync(folderId, ct);
        if (existing == null || existing.ProjectId != projectId) return NotFound();

        // A parent from another project would hang this folder off a tree this project
        // never lists; a folder as its own parent would hide it from every tree.
        if (string.Equals(req.ParentId, folderId, StringComparison.Ordinal)
            || !await IsFolderOfProjectAsync(req.ParentId, projectId, ct))
        {
            return NotFound();
        }

        existing.Name = req.Name;
        existing.ParentId = req.ParentId;

        await folders.ReplaceAsync(existing, ct);
        return Ok(ApiResponse<AssetFolder>.Ok(existing));
    }

    [HttpDelete("{folderId}")]
    public async Task<ActionResult> DeleteFolder(
        string projectId,
        string folderId,
        CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var existing = await folders.GetAsync(folderId, ct);
        if (existing == null || existing.ProjectId != projectId) return NotFound();

        // Matches the UI promise: the folder's assets move back to the library root.
        foreach (var asset in await assets.ListByProjectAsync(projectId, ct))
        {
            if (asset.FolderId != folderId) continue;
            asset.FolderId = null;
            await assets.ReplaceAsync(asset, ct);
        }

        await folders.DeleteAsync(folderId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    /// <summary>True for "no parent", or for a folder that belongs to this project.</summary>
    private async Task<bool> IsFolderOfProjectAsync(string? folderId, string projectId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(folderId)) return true;

        var folder = await folders.GetAsync(folderId, ct);
        return folder is not null && string.Equals(folder.ProjectId, projectId, StringComparison.Ordinal);
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }
}
