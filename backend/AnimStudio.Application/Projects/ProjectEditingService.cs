using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Projects;

public sealed record UpdateProjectCommand
{
    public required string ProjectId { get; init; }
    public required string UserId { get; init; }

    public required string Name { get; init; }
    public string? Description { get; init; }

    public required int Width { get; init; }
    public required int Height { get; init; }
    public required int Fps { get; init; }

    public DistributionIntent DistributionIntent { get; init; } = DistributionIntent.Personal;
    public bool AcceptShareAlikeObligation { get; init; }

    /// <summary>Null clears the music bed.</summary>
    public string? BackgroundMusicAssetId { get; init; }
    public double BackgroundMusicVolume { get; init; } = 0.18;

    public WatermarkSettings? DefaultWatermark { get; init; }
}

/// <summary>
/// Edits to a project's own settings, including the two that reach into every scene:
/// the frame rate and the music bed.
/// </summary>
public sealed class ProjectEditingService(
    IProjectRepository projects,
    ISceneRepository scenes,
    ICharacterRepository characters,
    IAssetRepository assets,
    IObjectStore store,
    TimeProvider clock)
{
    /// <summary>Above 1 the bed is amplified; past 2 it simply clips.</summary>
    private const double MaxMusicVolume = 2;

    public async Task<Project> UpdateAsync(UpdateProjectCommand command, CancellationToken ct)
    {
        var project = await projects.GetAsync(command.ProjectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, command.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var name = command.Name?.Trim();
        if (string.IsNullOrEmpty(name))
            throw EditingException.Invalid("name-required", "A project needs a name.");

        if (command.Fps is < 1 or > 60)
            throw EditingException.Invalid("fps-out-of-range", "Frame rate must be between 1 and 60.");

        if (command.Width is < 320 or > 3840 || command.Height is < 240 or > 2160)
            throw EditingException.Invalid("canvas-out-of-range", "That canvas size is not supported.");

        if (command.BackgroundMusicVolume is < 0 or > MaxMusicVolume)
            throw EditingException.Invalid("volume-out-of-range", "Music volume must be between 0 and 2.");

        if (command.BackgroundMusicAssetId is { Length: > 0 } musicId)
        {
            var asset = await assets.GetAsync(musicId, ct).ConfigureAwait(false);

            if (asset is null || !string.Equals(asset.ProjectId, project.Id, StringComparison.Ordinal))
                throw EditingException.Invalid("asset-not-found", "That file is not in this project.");

            if (asset.Kind != AssetKind.Audio)
            {
                throw EditingException.Invalid("asset-wrong-kind",
                    $"'{asset.Name}' is not an audio file.");
            }
        }

        var previousRate = project.Settings.ToCanvas().FrameRate;

        project.Name = name;
        project.Description = string.IsNullOrWhiteSpace(command.Description)
            ? null
            : command.Description.Trim();

        // Even dimensions are required by yuv420p; round rather than reject, matching create.
        project.Settings.Width = command.Width % 2 == 0 ? command.Width : command.Width + 1;
        project.Settings.Height = command.Height % 2 == 0 ? command.Height : command.Height + 1;
        project.Settings.FrameRateNum = command.Fps;
        project.Settings.FrameRateDen = 1;
        project.Settings.DistributionIntent = command.DistributionIntent;
        project.Settings.AcceptShareAlikeObligation = command.AcceptShareAlikeObligation;
        project.Settings.BackgroundMusicAssetId =
            string.IsNullOrWhiteSpace(command.BackgroundMusicAssetId)
                ? null
                : command.BackgroundMusicAssetId;
        project.Settings.BackgroundMusicVolume = command.BackgroundMusicVolume;
        if (command.DefaultWatermark is not null)
        {
            command.DefaultWatermark.Clamp();
            project.Settings.DefaultWatermark = command.DefaultWatermark;
        }

        project.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await projects.ReplaceAsync(project, ct).ConfigureAwait(false);

        var newRate = project.Settings.ToCanvas().FrameRate;
        if (newRate.AsDouble != previousRate.AsDouble)
            await RescaleScenesAsync(project.Id, previousRate, newRate, ct).ConfigureAwait(false);

        return project;
    }

    /// <summary>
    /// Deletes a project and everything that belongs to it.
    /// <para>
    /// The cascade is the point: scenes, characters and assets are all keyed by project id
    /// with nothing to reach them once the project is gone, and the uploaded files would sit
    /// on disk forever. Render jobs are left alone deliberately - their outputs are cleaned
    /// up on their own schedule, and a job row is the audit trail of work that really ran.
    /// </para>
    /// </summary>
    public async Task DeleteAsync(string projectId, string userId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var files = await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        foreach (var asset in files)
        {
            await assets.DeleteAsync(asset.Id, ct).ConfigureAwait(false);
            await store.DeleteAsync(asset.StorageKey, ct).ConfigureAwait(false);
        }

        var cast = await characters.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        foreach (var character in cast)
            await characters.DeleteAsync(character.Id, ct).ConfigureAwait(false);

        await scenes.DeleteByProjectAsync(projectId, ct).ConfigureAwait(false);
        await projects.DeleteAsync(projectId, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Every duration in a scene is a frame count, so changing the project's frame rate
    /// would otherwise silently change how long everything actually lasts - a 30fps scene
    /// of 150 frames is 5s, and 2.5s once the project is switched to 60fps. Rescaling keeps
    /// wall-clock timing intact across the change.
    /// </summary>
    private async Task RescaleScenesAsync(
        string projectId, FrameRate from, FrameRate to, CancellationToken ct)
    {
        var list = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var scene in list)
        {
            scene.DurationFrames = Convert(scene.DurationFrames, from, to);

            foreach (var line in scene.Dialogue)
            {
                line.RelativeStartFrame = Convert(line.RelativeStartFrame, from, to);
                line.RelativeEndFrame = Convert(line.RelativeEndFrame, from, to);
            }

            foreach (var placement in scene.Characters)
            {
                placement.PresenceStartFrame = Convert(placement.PresenceStartFrame, from, to);
                placement.PresenceEndFrame = Convert(placement.PresenceEndFrame, from, to);
                placement.EntranceDurationFrames = Convert(placement.EntranceDurationFrames, from, to);
            }

            scene.Animation = scene.Animation with
            {
                FadeIn = new FrameCount(Convert(scene.Animation.FadeIn.Value, from, to)),
                FadeOut = new FrameCount(Convert(scene.Animation.FadeOut.Value, from, to))
            };

            scene.TransitionDurationFrames = Convert(scene.TransitionDurationFrames, from, to);

            scene.UpdatedAt = now;
            scene.RevisionToken = Guid.NewGuid().ToString("n");

            await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        }
    }

    private static int Convert(int frames, FrameRate from, FrameRate to) =>
        FrameCount.FromSeconds(new FrameCount(frames).ToSeconds(from), to).Value;
}
