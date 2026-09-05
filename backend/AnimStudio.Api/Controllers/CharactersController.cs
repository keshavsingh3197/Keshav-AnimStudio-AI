using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Characters;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class CharactersController(
    ICharacterRepository characters,
    IProjectRepository projects,
    CharacterEditingService editing,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("api/projects/{projectId}/characters")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CharacterResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await characters.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<CharacterResponse>>.Ok(
            [.. list.Select(c => c.ToResponse())]));
    }

    [HttpGet("api/characters/{id}")]
    public async Task<ActionResult<ApiResponse<CharacterResponse>>> Get(
        string id, CancellationToken ct)
    {
        var character = await editing.GetAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<CharacterResponse>.Ok(character.ToResponse()));
    }

    [HttpPost("api/projects/{projectId}/characters")]
    public async Task<ActionResult<ApiResponse<CharacterResponse>>> Create(
        string projectId, [FromBody] CreateCharacterRequest request, CancellationToken ct)
    {
        var character = await editing.UpsertAsync(ToCommand(projectId, null, request), ct);
        return Ok(ApiResponse<CharacterResponse>.Ok(character.ToResponse()));
    }

    [HttpPut("api/characters/{id}")]
    public async Task<ActionResult<ApiResponse<CharacterResponse>>> Update(
        string id, [FromBody] CreateCharacterRequest request, CancellationToken ct)
    {
        var existing = await characters.GetAsync(id, ct) ?? throw new KeyNotFoundException();

        var character = await editing.UpsertAsync(ToCommand(existing.ProjectId, id, request), ct);
        return Ok(ApiResponse<CharacterResponse>.Ok(character.ToResponse()));
    }

    /// <summary>
    /// Deletes a character. The scenes that used it keep their dialogue - the lines pass to
    /// the narrator - so removing a character costs a sprite, never a script.
    /// </summary>
    [HttpDelete("api/characters/{id}")]
    public async Task<ActionResult<ApiResponse<int>>> Delete(string id, CancellationToken ct)
    {
        var scenesTouched = await editing.DeleteAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<int>.Ok(scenesTouched));
    }

    private UpsertCharacterCommand ToCommand(
        string projectId, string? characterId, CreateCharacterRequest request) => new()
        {
            CharacterId = characterId,
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Name = request.Name,
            Description = request.Description,
            Aliases = request.Aliases,
            ClosedMouthAssetId = request.ClosedMouthAssetId,
            OpenMouthAssetId = request.OpenMouthAssetId,
            SubtitleColorHex = request.SubtitleColorHex,
            Appearance = request.Appearance is null ? null : new CharacterAppearanceCommand
            {
                Age = request.Appearance.Age,
                Gender = request.Appearance.Gender,
                Hair = request.Appearance.Hair,
                Clothes = request.Appearance.Clothes,
                AdditionalDetails = request.Appearance.AdditionalDetails
            }
        };

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }
}
