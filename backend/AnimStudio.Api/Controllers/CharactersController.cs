using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
public sealed class CharactersController(
    ICharacterRepository characters,
    IProjectRepository projects,
    ISceneRepository scenes,
    ICurrentUser currentUser,
    TimeProvider clock) : ControllerBase
{
    [HttpGet("api/projects/{projectId}/characters")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CharacterResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await characters.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<CharacterResponse>>.Ok([.. list.Select(Map)]));
    }

    [HttpPost("api/projects/{projectId}/characters")]
    public async Task<ActionResult<ApiResponse<CharacterResponse>>> Create(
        string projectId, [FromBody] CreateCharacterRequest request, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var now = clock.GetUtcNow().UtcDateTime;

        var character = new Character
        {
            ProjectId = projectId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Aliases = [.. request.Aliases.Select(a => a.Trim()).Where(a => a.Length > 0)],
            Sprites = new CharacterSprites
            {
                ClosedMouthAssetId = request.ClosedMouthAssetId,
                OpenMouthAssetId = request.OpenMouthAssetId
            },
            SubtitleColorHex = request.SubtitleColorHex,
            CreatedAt = now,
            UpdatedAt = now
        };

        await characters.InsertAsync(character, ct);

        return Ok(ApiResponse<CharacterResponse>.Ok(Map(character)));
    }

    [HttpPut("api/characters/{id}")]
    public async Task<ActionResult<ApiResponse<CharacterResponse>>> Update(
        string id, [FromBody] CreateCharacterRequest request, CancellationToken ct)
    {
        var character = await characters.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        await EnsureOwnedAsync(character.ProjectId, ct);

        character.Name = request.Name.Trim();
        character.Description = request.Description?.Trim();
        character.Aliases = [.. request.Aliases.Select(a => a.Trim()).Where(a => a.Length > 0)];
        character.Sprites.ClosedMouthAssetId = request.ClosedMouthAssetId;
        character.Sprites.OpenMouthAssetId = request.OpenMouthAssetId;
        character.SubtitleColorHex = request.SubtitleColorHex;
        character.UpdatedAt = clock.GetUtcNow().UtcDateTime;

        await characters.ReplaceAsync(character, ct);

        return Ok(ApiResponse<CharacterResponse>.Ok(Map(character)));
    }

    [HttpGet("api/projects/{projectId}/scenes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SceneResponse>>>> ListScenes(
        string projectId, CancellationToken ct)
    {
        var project = await EnsureOwnedAsync(projectId, ct);
        var rate = project.Settings.ToCanvas().FrameRate;

        var list = await scenes.ListByProjectAsync(projectId, ct);

        return Ok(ApiResponse<IReadOnlyList<SceneResponse>>.Ok(
            [.. list.Select(s => MapScene(s, rate))]));
    }

    /// <summary>
    /// Sets a scene's background. Generated scenes have no image until one is chosen,
    /// which is the last thing needed before a render can run.
    /// </summary>
    [HttpPut("api/scenes/{sceneId}/background")]
    public async Task<ActionResult<ApiResponse<SceneResponse>>> SetBackground(
        string sceneId, [FromBody] AssignSceneBackgroundRequest request, CancellationToken ct)
    {
        var scene = await scenes.GetAsync(sceneId, ct) ?? throw new KeyNotFoundException();
        var project = await EnsureOwnedAsync(scene.ProjectId, ct);

        scene.BackgroundAssetId = request.AssetId;

        // Recorded so a later regeneration refreshes everything except what a human chose.
        if (!scene.UserEditedFields.Contains(nameof(Scene.BackgroundAssetId)))
            scene.UserEditedFields.Add(nameof(Scene.BackgroundAssetId));

        scene.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await scenes.ReplaceAsync(scene, ct);

        return Ok(ApiResponse<SceneResponse>.Ok(
            MapScene(scene, project.Settings.ToCanvas().FrameRate)));
    }

    /// <summary>Applies one background to every scene - the fast path for a first render.</summary>
    [HttpPut("api/projects/{projectId}/scenes/background")]
    public async Task<ActionResult<ApiResponse<int>>> SetAllBackgrounds(
        string projectId, [FromBody] AssignSceneBackgroundRequest request, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await scenes.ListByProjectAsync(projectId, ct);
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var scene in list)
        {
            scene.BackgroundAssetId = request.AssetId;
            scene.UpdatedAt = now;
            await scenes.ReplaceAsync(scene, ct);
        }

        return Ok(ApiResponse<int>.Ok(list.Count));
    }

    private async Task<Domain.Projects.Project> EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }

    private static CharacterResponse Map(Character c) => new(
        c.Id, c.Name, c.Description, c.Aliases,
        c.Sprites.ClosedMouthAssetId, c.Sprites.OpenMouthAssetId, c.IsNarrator, c.SubtitleColorHex);

    private static SceneResponse MapScene(Scene s, FrameRate rate) => new(
        s.Id, s.SceneNumber, s.Title, s.DurationFrames, s.Duration.ToSeconds(rate),
        s.BackgroundAssetId, s.Dialogue.Count,
        s.TransitionToNext.ToString(), s.Animation.Background.ToString());
}
