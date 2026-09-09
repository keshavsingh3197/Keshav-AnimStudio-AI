using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Scenes;
using AnimStudio.Application.Security;
using AnimStudio.Application.Subtitles;
using AnimStudio.Domain.Rendering;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The scene editor's API. Thin by design: the rules about what a scene may become live in
/// <see cref="SceneEditingService"/>, because they are worth testing without HTTP.
/// </summary>
[ApiController]
public sealed class ScenesController(
    SceneEditingService editing,
    SceneSubtitleExportService subtitleExport,
    IProjectRepository projects,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("api/projects/{projectId}/scenes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SceneResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        var rate = await FrameRateOfAsync(projectId, ct);
        var list = await editing.ListAsync(projectId, currentUser.UserId, ct);

        return Ok(ApiResponse<IReadOnlyList<SceneResponse>>.Ok(
            [.. list.Select(s => s.ToResponse(rate))]));
    }

    /// <summary>
    /// The project's dialogue as one .srt file, timed exactly as it would be burned into a
    /// render - a download for a platform that wants a caption sidecar, or for polishing in
    /// any subtitle editor before pasting it back in as a transcript.
    /// </summary>
    [HttpGet("api/projects/{projectId}/subtitles.srt")]
    public async Task<IActionResult> ExportSubtitles(string projectId, CancellationToken ct)
    {
        var srt = await subtitleExport.ExportAsync(projectId, ct);
        return File(System.Text.Encoding.UTF8.GetBytes(srt), "application/x-subrip", "subtitles.srt");
    }

    [HttpGet("api/scenes/{sceneId}")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> Get(
        string sceneId, CancellationToken ct)
    {
        var (scene, project) = await editing.GetAsync(sceneId, currentUser.UserId, ct);
        return Ok(ApiResponse<SceneDetailResponse>.Ok(
            scene.ToDetail(project.Settings.ToCanvas().FrameRate)));
    }

    [HttpPost("api/projects/{projectId}/scenes")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> Create(
        string projectId, [FromBody] CreateSceneRequest request, CancellationToken ct)
    {
        var scene = await editing.CreateAsync(new CreateSceneCommand
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Title = request.Title,
            Description = request.Description,
            DurationSeconds = request.DurationSeconds,
            BackgroundAssetId = request.BackgroundAssetId,
            AfterSceneId = request.AfterSceneId
        }, ct);

        return await DetailAsync(scene.Id, ct);
    }

    [HttpPut("api/scenes/{sceneId}")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> Update(
        string sceneId, [FromBody] UpdateSceneRequest request, CancellationToken ct)
    {
        await editing.UpdateAsync(new UpdateSceneCommand
        {
            SceneId = sceneId,
            UserId = currentUser.UserId,
            Title = request.Title,
            Description = request.Description,
            DurationSeconds = request.DurationSeconds,
            BackgroundEffect = request.BackgroundEffect,
            Intensity = request.Intensity,
            Easing = request.Easing,
            FadeInSeconds = request.FadeInSeconds,
            FadeOutSeconds = request.FadeOutSeconds,
            Transition = request.Transition,
            TransitionDurationSeconds = request.TransitionDurationSeconds
        }, ct);

        // Re-read rather than returning the in-memory scene: fitting the transitions can
        // shorten what was just saved, and the client must see the value that was stored.
        return await DetailAsync(sceneId, ct);
    }

    [HttpDelete("api/scenes/{sceneId}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(
        string sceneId, CancellationToken ct)
    {
        await editing.DeleteAsync(sceneId, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    [HttpPut("api/projects/{projectId}/scenes/order")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SceneResponse>>>> Reorder(
        string projectId, [FromBody] ReorderScenesRequest request, CancellationToken ct)
    {
        var rate = await FrameRateOfAsync(projectId, ct);
        var ordered = await editing.ReorderAsync(
            projectId, currentUser.UserId, request.SceneIds, ct);

        return Ok(ApiResponse<IReadOnlyList<SceneResponse>>.Ok(
            [.. ordered.Select(s => s.ToResponse(rate))]));
    }

    /// <summary>
    /// Sets a scene's background. A generated scene has no image until one is chosen, which
    /// is the last thing needed before a render can run.
    /// </summary>
    [HttpPut("api/scenes/{sceneId}/background")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> SetBackground(
        string sceneId, [FromBody] AssignSceneBackgroundRequest request, CancellationToken ct)
    {
        await editing.SetBackgroundAsync(sceneId, currentUser.UserId, request.AssetId, ct);
        return await DetailAsync(sceneId, ct);
    }

    /// <summary>Applies one background to every scene - the fast path for a first render.</summary>
    [HttpPut("api/projects/{projectId}/scenes/background")]
    public async Task<ActionResult<ApiResponse<int>>> SetAllBackgrounds(
        string projectId, [FromBody] AssignSceneBackgroundRequest request, CancellationToken ct)
    {
        var count = await editing.SetAllBackgroundsAsync(
            projectId, currentUser.UserId, request.AssetId, ct);

        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPut("api/scenes/{sceneId}/audio")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> SetAudio(
        string sceneId, [FromBody] SetSceneAudioRequest request, CancellationToken ct)
    {
        await editing.SetAudioAsync(new SetSceneAudioCommand
        {
            SceneId = sceneId,
            UserId = currentUser.UserId,
            AssetId = request.AssetId,
            SliceStartSeconds = request.SliceStartSeconds,
            SliceEndSeconds = request.SliceEndSeconds
        }, ct);

        return await DetailAsync(sceneId, ct);
    }

    /// <summary>
    /// Points every scene that already knows its slice window at one media file. An import
    /// records where each scene sits on the source clock but has nothing to cut from, so
    /// this is the step that makes an imported project audible.
    /// </summary>
    [HttpPut("api/projects/{projectId}/scenes/audio")]
    public async Task<ActionResult<ApiResponse<int>>> SetAllAudio(
        string projectId, [FromBody] AssignAssetRequest request, CancellationToken ct)
    {
        var count = await editing.SetAllAudioAsync(
            projectId, currentUser.UserId, request.AssetId, ct);

        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPost("api/scenes/{sceneId}/dialogue")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> AddDialogue(
        string sceneId, [FromBody] UpsertDialogueRequest request, CancellationToken ct)
    {
        await editing.UpsertDialogueAsync(ToDialogueCommand(sceneId, null, request), ct);
        return await DetailAsync(sceneId, ct);
    }

    [HttpPut("api/scenes/{sceneId}/dialogue/{index:int}")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> UpdateDialogue(
        string sceneId, int index, [FromBody] UpsertDialogueRequest request, CancellationToken ct)
    {
        await editing.UpsertDialogueAsync(ToDialogueCommand(sceneId, index, request), ct);
        return await DetailAsync(sceneId, ct);
    }

    [HttpDelete("api/scenes/{sceneId}/dialogue/{index:int}")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> RemoveDialogue(
        string sceneId, int index, CancellationToken ct)
    {
        await editing.RemoveDialogueAsync(sceneId, currentUser.UserId, index, ct);
        return await DetailAsync(sceneId, ct);
    }

    /// <summary>Stages a character in this scene, or restages one already there.</summary>
    [HttpPut("api/scenes/{sceneId}/characters")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> UpsertPlacement(
        string sceneId, [FromBody] UpsertPlacementRequest request, CancellationToken ct)
    {
        await editing.UpsertPlacementAsync(new UpsertPlacementCommand
        {
            SceneId = sceneId,
            UserId = currentUser.UserId,
            CharacterId = request.CharacterId,
            Anchor = request.Anchor,
            HeightFraction = request.HeightFraction,
            OffsetXFraction = request.OffsetXFraction,
            OffsetYFraction = request.OffsetYFraction,
            FlipHorizontal = request.FlipHorizontal,
            ZOrder = request.ZOrder,
            Entrance = request.Entrance,
            EntranceDurationSeconds = request.EntranceDurationSeconds,
            PresenceStartSeconds = request.PresenceStartSeconds,
            PresenceEndSeconds = request.PresenceEndSeconds
        }, ct);

        return await DetailAsync(sceneId, ct);
    }

    [HttpDelete("api/scenes/{sceneId}/characters/{characterId}")]
    public async Task<ActionResult<ApiResponse<SceneDetailResponse>>> RemovePlacement(
        string sceneId, string characterId, CancellationToken ct)
    {
        await editing.RemovePlacementAsync(sceneId, currentUser.UserId, characterId, ct);
        return await DetailAsync(sceneId, ct);
    }

    private UpsertDialogueCommand ToDialogueCommand(
        string sceneId, int? index, UpsertDialogueRequest request) => new()
        {
            SceneId = sceneId,
            UserId = currentUser.UserId,
            Index = index,
            SpeakerCharacterId = request.SpeakerCharacterId,
            Text = request.Text,
            StartSeconds = request.StartSeconds,
            EndSeconds = request.EndSeconds
        };

    private async Task<ActionResult<ApiResponse<SceneDetailResponse>>> DetailAsync(
        string sceneId, CancellationToken ct)
    {
        var (scene, project) = await editing.GetAsync(sceneId, currentUser.UserId, ct);
        return Ok(ApiResponse<SceneDetailResponse>.Ok(
            scene.ToDetail(project.Settings.ToCanvas().FrameRate)));
    }

    private async Task<FrameRate> FrameRateOfAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project.Settings.ToCanvas().FrameRate;
    }
}
