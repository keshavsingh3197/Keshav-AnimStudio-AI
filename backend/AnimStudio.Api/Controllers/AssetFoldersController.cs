using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/folders")]
[Authorize(Policy = "RequireUser")]
public class AssetFoldersController(IAssetFolderRepository folders) : ControllerBase
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
    public async Task<ActionResult<IReadOnlyList<AssetFolder>>> ListFolders(
        string projectId, CancellationToken ct)
    {
        var list = await folders.ListByProjectAsync(projectId, ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<AssetFolder>> CreateFolder(
        string projectId,
        [FromBody] CreateFolderRequest req,
        CancellationToken ct)
    {
        var folder = new AssetFolder
        {
            Id = Guid.NewGuid().ToString("N"),
            ProjectId = projectId,
            Name = req.Name,
            ParentId = req.ParentId,
            CreatedAt = DateTime.UtcNow
        };

        await folders.InsertAsync(folder, ct);
        return Ok(folder);
    }

    [HttpPut("{folderId}")]
    public async Task<ActionResult<AssetFolder>> UpdateFolder(
        string projectId,
        string folderId,
        [FromBody] UpdateFolderRequest req,
        CancellationToken ct)
    {
        var existing = await folders.GetAsync(folderId, ct);
        if (existing == null || existing.ProjectId != projectId) return NotFound();

        existing.Name = req.Name;
        existing.ParentId = req.ParentId;

        await folders.ReplaceAsync(existing, ct);
        return Ok(existing);
    }

    [HttpDelete("{folderId}")]
    public async Task<ActionResult> DeleteFolder(
        string projectId,
        string folderId,
        CancellationToken ct)
    {
        var existing = await folders.GetAsync(folderId, ct);
        if (existing == null || existing.ProjectId != projectId) return NotFound();

        await folders.DeleteAsync(folderId, ct);
        return NoContent();
    }
}
