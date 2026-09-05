using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Projects;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Scenes;

/// <summary>
/// Every edit a user can make to a scene after it has been generated.
/// <para>
/// This lives in the Application layer rather than the controller for two reasons: the
/// rules are the interesting part (a shortened scene has to drag its dialogue, staging,
/// fades and both neighbouring transitions back with it, or the project stops rendering),
/// and those rules are worth unit testing without an HTTP pipeline.
/// </para>
/// </summary>
public sealed class SceneEditingService(
    ISceneRepository scenes,
    IProjectRepository projects,
    ICharacterRepository characters,
    IAssetRepository assets,
    ProjectStatusService status,
    TimeProvider clock)
{
    /// <summary>An hour. Long enough for any single shot, short enough to catch a stray unit.</summary>
    private const double MaxSceneSeconds = 3600;

    /// <summary>Sparse spacing, so an insert between two scenes rarely needs a rebalance.</summary>
    private const double OrderKeyStep = 1000;

    public async Task<SceneWithProject> GetAsync(string sceneId, string userId, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(sceneId, userId, ct).ConfigureAwait(false);
        return new SceneWithProject(scene, project);
    }

    public async Task<IReadOnlyList<Scene>> ListAsync(
        string projectId, string userId, CancellationToken ct)
    {
        await LoadProjectAsync(projectId, userId, ct).ConfigureAwait(false);
        return await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
    }

    public async Task<Scene> CreateAsync(CreateSceneCommand command, CancellationToken ct)
    {
        var project = await LoadProjectAsync(command.ProjectId, command.UserId, ct)
            .ConfigureAwait(false);

        var rate = project.Settings.ToCanvas().FrameRate;
        var duration = ToFrames(command.DurationSeconds, rate, nameof(command.DurationSeconds));

        if (command.BackgroundAssetId is { Length: > 0 } backgroundId)
        {
            await EnsureUsableAssetAsync(backgroundId, project.Id, AssetKind.Image, ct)
                .ConfigureAwait(false);
        }

        var existing = await scenes.ListByProjectAsync(command.ProjectId, ct).ConfigureAwait(false);
        var orderKey = await NextOrderKeyAsync(existing, command.AfterSceneId, ct).ConfigureAwait(false);

        var now = clock.GetUtcNow().UtcDateTime;

        var scene = new Scene
        {
            ProjectId = command.ProjectId,
            OrderKey = orderKey,
            SceneNumber = existing.Count + 1,
            Title = Trim(command.Title),
            Description = Trim(command.Description),
            DurationFrames = duration.Value,
            BackgroundAssetId = Trim(command.BackgroundAssetId),
            // A hand-made scene is never replaced by a re-ingest, so it is Manual from birth.
            Origin = SceneOrigin.Manual,
            CreatedAt = now,
            UpdatedAt = now
        };

        await scenes.InsertAsync(scene, ct).ConfigureAwait(false);
        await RenumberAsync(command.ProjectId, ct).ConfigureAwait(false);

        // A new scene without a background makes the project un-renderable again.
        await status.RefreshAsync(command.ProjectId, null, ct).ConfigureAwait(false);

        return scene;
    }

    public async Task<Scene> UpdateAsync(UpdateSceneCommand command, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(command.SceneId, command.UserId, ct)
            .ConfigureAwait(false);

        var rate = project.Settings.ToCanvas().FrameRate;
        var duration = ToFrames(command.DurationSeconds, rate, nameof(command.DurationSeconds));

        if (command.Intensity is < 0 or > 1)
        {
            throw EditingException.Invalid("intensity-out-of-range",
                "Animation intensity must be between 0 and 1.");
        }

        var fadeIn = ToFrames(command.FadeInSeconds, rate, nameof(command.FadeInSeconds), allowZero: true);
        var fadeOut = ToFrames(command.FadeOutSeconds, rate, nameof(command.FadeOutSeconds), allowZero: true);

        if (fadeIn.Value + fadeOut.Value > duration.Value)
        {
            throw EditingException.Invalid("fades-exceed-duration",
                "The fade in and fade out together are longer than the scene.");
        }

        var transitionFrames = ToFrames(
            command.TransitionDurationSeconds, rate, nameof(command.TransitionDurationSeconds),
            allowZero: true);

        if (command.Transition == SceneTransition.None) transitionFrames = FrameCount.Zero;

        scene.Title = Trim(command.Title);
        scene.Description = Trim(command.Description);
        scene.DurationFrames = duration.Value;
        scene.Animation = new AnimationSettings(
            command.BackgroundEffect, command.Intensity, command.Easing, fadeIn, fadeOut);
        scene.TransitionToNext = command.Transition;
        scene.TransitionDurationFrames = transitionFrames.Value;

        // Everything inside the scene is dragged back to fit the (possibly shorter) length,
        // so an edit here can never leave a line or a sprite hanging past the last frame.
        ClampToDuration(scene);

        MarkEdited(scene,
            nameof(Scene.Title), nameof(Scene.DurationFrames),
            nameof(Scene.Animation), nameof(Scene.TransitionToNext));

        Touch(scene);
        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);

        // A transition can only be as long as half of the SHORTER of the two scenes it
        // joins, so changing this scene's length can invalidate the one before it too.
        await FitNeighbouringTransitionsAsync(scene, ct).ConfigureAwait(false);

        return scene;
    }

    public async Task DeleteAsync(string sceneId, string userId, CancellationToken ct)
    {
        var (scene, _) = await LoadSceneAsync(sceneId, userId, ct).ConfigureAwait(false);

        await scenes.DeleteAsync(sceneId, ct).ConfigureAwait(false);
        await RenumberAsync(scene.ProjectId, ct).ConfigureAwait(false);
        await status.RefreshAsync(scene.ProjectId, null, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Applies a caller-supplied order. The list must name every active scene exactly once -
    /// a partial list would silently leave the omitted scenes wherever they happened to be.
    /// </summary>
    public async Task<IReadOnlyList<Scene>> ReorderAsync(
        string projectId, string userId, IReadOnlyList<string> orderedSceneIds, CancellationToken ct)
    {
        await LoadProjectAsync(projectId, userId, ct).ConfigureAwait(false);

        var existing = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        var byId = existing.ToDictionary(s => s.Id, StringComparer.Ordinal);

        if (orderedSceneIds.Count != existing.Count
            || orderedSceneIds.Distinct(StringComparer.Ordinal).Count() != orderedSceneIds.Count
            || orderedSceneIds.Any(id => !byId.ContainsKey(id)))
        {
            throw EditingException.Invalid("order-mismatch",
                "The new order must list every scene in this project exactly once.");
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var ordered = new List<Scene>(orderedSceneIds.Count);

        for (var i = 0; i < orderedSceneIds.Count; i++)
        {
            var scene = byId[orderedSceneIds[i]];
            scene.OrderKey = (i + 1) * OrderKeyStep;
            scene.SceneNumber = i + 1;
            scene.UpdatedAt = now;
            scene.RevisionToken = Guid.NewGuid().ToString("n");

            await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
            ordered.Add(scene);
        }

        return ordered;
    }

    public async Task<Scene> SetBackgroundAsync(
        string sceneId, string userId, string assetId, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(sceneId, userId, ct).ConfigureAwait(false);

        await EnsureUsableAssetAsync(assetId, project.Id, AssetKind.Image, ct).ConfigureAwait(false);

        scene.BackgroundAssetId = assetId;

        // Recorded so a later regeneration refreshes everything except what a human chose.
        MarkEdited(scene, nameof(Scene.BackgroundAssetId));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        await status.RefreshAsync(scene.ProjectId, null, ct).ConfigureAwait(false);

        return scene;
    }

    /// <summary>
    /// Applies one background to every scene - the fast path to a first render. Deliberately
    /// does NOT mark the scenes as hand edited: a bulk default is not a per-scene decision,
    /// and marking would stop a re-ingest from refreshing them.
    /// </summary>
    public async Task<int> SetAllBackgroundsAsync(
        string projectId, string userId, string assetId, CancellationToken ct)
    {
        await LoadProjectAsync(projectId, userId, ct).ConfigureAwait(false);
        await EnsureUsableAssetAsync(assetId, projectId, AssetKind.Image, ct).ConfigureAwait(false);

        var list = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        foreach (var scene in list)
        {
            scene.BackgroundAssetId = assetId;
            Touch(scene);
            await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        }

        await status.RefreshAsync(projectId, list, ct).ConfigureAwait(false);

        return list.Count;
    }

    public async Task<Scene> SetAudioAsync(SetSceneAudioCommand command, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(command.SceneId, command.UserId, ct)
            .ConfigureAwait(false);

        if (command.AssetId is not { Length: > 0 } assetId)
        {
            scene.Audio = new SceneAudio();
        }
        else
        {
            var asset = await EnsureUsableAssetAsync(assetId, project.Id, AssetKind.Audio, ct,
                alternate: AssetKind.Video).ConfigureAwait(false);

            var start = command.SliceStartSeconds ?? scene.Audio.SliceStartSeconds;
            var end = command.SliceEndSeconds ?? scene.Audio.SliceEndSeconds;

            if (start is not null && end is not null && end <= start)
            {
                throw EditingException.Invalid("audio-slice-inverted",
                    "The audio slice ends before it starts.");
            }

            if (start < 0)
            {
                throw EditingException.Invalid("audio-slice-negative",
                    "The audio slice cannot start before the beginning of the file.");
            }

            // A slice past the end of the file yields silence, which is indistinguishable
            // from a broken render, so it is refused here instead.
            if (asset.Probe.DurationSeconds is { } mediaLength && start >= mediaLength)
            {
                throw EditingException.Invalid("audio-slice-past-end",
                    "The audio slice starts after the end of that file.");
            }

            scene.Audio = new SceneAudio
            {
                AssetId = assetId,
                SliceStartSeconds = start,
                SliceEndSeconds = end
            };
        }

        MarkEdited(scene, nameof(Scene.Audio));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        return scene;
    }

    /// <summary>
    /// Points every scene that already has a slice window at one media file. An import
    /// records where each scene sits on the source clock but has no file to cut from until
    /// the user uploads it, so this is the step that makes an imported project audible.
    /// </summary>
    public async Task<int> SetAllAudioAsync(
        string projectId, string userId, string assetId, CancellationToken ct)
    {
        await LoadProjectAsync(projectId, userId, ct).ConfigureAwait(false);
        await EnsureUsableAssetAsync(assetId, projectId, AssetKind.Audio, ct, alternate: AssetKind.Video)
            .ConfigureAwait(false);

        var list = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        var applied = 0;

        foreach (var scene in list)
        {
            if (scene.Audio.SliceStartSeconds is null || scene.Audio.SliceEndSeconds is null) continue;

            scene.Audio.AssetId = assetId;
            Touch(scene);
            await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
            applied++;
        }

        return applied;
    }

    public async Task<Scene> UpsertDialogueAsync(UpsertDialogueCommand command, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(command.SceneId, command.UserId, ct)
            .ConfigureAwait(false);

        var text = command.Text?.Trim();
        if (string.IsNullOrEmpty(text))
            throw EditingException.Invalid("dialogue-empty", "A line needs some text.");

        var rate = project.Settings.ToCanvas().FrameRate;
        var start = ToFrames(command.StartSeconds, rate, nameof(command.StartSeconds), allowZero: true);
        var end = ToFrames(command.EndSeconds, rate, nameof(command.EndSeconds), allowZero: true);

        if (end <= start)
            throw EditingException.Invalid("dialogue-inverted", "A line must end after it starts.");

        if (end.Value > scene.DurationFrames)
        {
            throw EditingException.Invalid("dialogue-past-end",
                "That line ends after the scene does. Lengthen the scene or shorten the line.");
        }

        if (command.SpeakerCharacterId is { Length: > 0 } speakerId)
            await EnsureCharacterAsync(speakerId, project.Id, ct).ConfigureAwait(false);

        if (command.Index is { } index)
        {
            if (index < 0 || index >= scene.Dialogue.Count)
                throw EditingException.Invalid("dialogue-not-found", "That line no longer exists.");

            var line = scene.Dialogue[index];
            line.Text = text;
            line.SpeakerCharacterId = command.SpeakerCharacterId;
            line.RelativeStartFrame = start.Value;
            line.RelativeEndFrame = end.Value;
        }
        else
        {
            scene.Dialogue.Add(new DialogueLine
            {
                Index = scene.Dialogue.Count,
                SpeakerCharacterId = command.SpeakerCharacterId,
                Text = text,
                RelativeStartFrame = start.Value,
                RelativeEndFrame = end.Value
            });
        }

        ReindexDialogue(scene);
        MarkEdited(scene, nameof(Scene.Dialogue));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        return scene;
    }

    public async Task<Scene> RemoveDialogueAsync(
        string sceneId, string userId, int index, CancellationToken ct)
    {
        var (scene, _) = await LoadSceneAsync(sceneId, userId, ct).ConfigureAwait(false);

        if (index < 0 || index >= scene.Dialogue.Count)
            throw EditingException.Invalid("dialogue-not-found", "That line no longer exists.");

        scene.Dialogue.RemoveAt(index);

        ReindexDialogue(scene);
        MarkEdited(scene, nameof(Scene.Dialogue));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        return scene;
    }

    public async Task<Scene> UpsertPlacementAsync(UpsertPlacementCommand command, CancellationToken ct)
    {
        var (scene, project) = await LoadSceneAsync(command.SceneId, command.UserId, ct)
            .ConfigureAwait(false);

        var character = await EnsureCharacterAsync(command.CharacterId, project.Id, ct)
            .ConfigureAwait(false);

        if (character.IsNarrator)
        {
            throw EditingException.Invalid("narrator-has-no-sprite",
                "The narrator has no sprite to stage. Its lines appear as subtitles.");
        }

        if (command.HeightFraction is < 0.05 or > 2)
        {
            throw EditingException.Invalid("height-out-of-range",
                "Sprite height must be between 5% and 200% of the canvas height.");
        }

        if (Math.Abs(command.OffsetXFraction) > 1 || Math.Abs(command.OffsetYFraction) > 1)
        {
            throw EditingException.Invalid("offset-out-of-range",
                "An offset larger than the canvas would push the sprite out of frame.");
        }

        var rate = project.Settings.ToCanvas().FrameRate;
        var entrance = ToFrames(
            command.EntranceDurationSeconds, rate, nameof(command.EntranceDurationSeconds),
            allowZero: true);

        if (entrance.Value > scene.DurationFrames)
        {
            throw EditingException.Invalid("entrance-too-long",
                "The entrance is longer than the scene.");
        }

        var start = command.PresenceStartSeconds is { } s
            ? ToFrames(s, rate, nameof(command.PresenceStartSeconds), allowZero: true)
            : FrameCount.Zero;

        var end = command.PresenceEndSeconds is { } e
            ? ToFrames(e, rate, nameof(command.PresenceEndSeconds), allowZero: true)
            : new FrameCount(scene.DurationFrames);

        if (end <= start)
        {
            throw EditingException.Invalid("presence-inverted",
                "The character leaves before it arrives.");
        }

        if (end.Value > scene.DurationFrames)
        {
            throw EditingException.Invalid("presence-past-end",
                "That character is on screen after the scene ends.");
        }

        var placement = scene.Characters
            .FirstOrDefault(c => string.Equals(c.CharacterId, command.CharacterId, StringComparison.Ordinal));

        if (placement is null)
        {
            placement = new CharacterPlacement { CharacterId = command.CharacterId };
            scene.Characters.Add(placement);
        }

        placement.Anchor = command.Anchor;
        placement.HeightFraction = command.HeightFraction;
        placement.OffsetXFraction = command.OffsetXFraction;
        placement.OffsetYFraction = command.OffsetYFraction;
        placement.FlipHorizontal = command.FlipHorizontal;
        placement.ZOrder = command.ZOrder;
        placement.Entrance = command.Entrance;
        placement.EntranceDurationFrames = entrance.Value;
        placement.PresenceStartFrame = start.Value;
        placement.PresenceEndFrame = end.Value;

        MarkEdited(scene, nameof(Scene.Characters));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        return scene;
    }

    public async Task<Scene> RemovePlacementAsync(
        string sceneId, string userId, string characterId, CancellationToken ct)
    {
        var (scene, _) = await LoadSceneAsync(sceneId, userId, ct).ConfigureAwait(false);

        var removed = scene.Characters
            .RemoveAll(c => string.Equals(c.CharacterId, characterId, StringComparison.Ordinal));

        if (removed == 0)
            throw EditingException.Invalid("placement-not-found", "That character is not in this scene.");

        MarkEdited(scene, nameof(Scene.Characters));
        Touch(scene);

        await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
        return scene;
    }

    // --- internals ---------------------------------------------------------------

    /// <summary>
    /// Pulls dialogue, staging and fades inside the scene's current length. Called after
    /// any duration change: the alternative is a scene that saves cleanly and then fails
    /// at render time, minutes later, with a message about frames.
    /// </summary>
    private static void ClampToDuration(Scene scene)
    {
        var duration = scene.DurationFrames;

        foreach (var line in scene.Dialogue)
        {
            line.RelativeStartFrame = Math.Clamp(line.RelativeStartFrame, 0, duration);
            line.RelativeEndFrame = Math.Clamp(line.RelativeEndFrame, line.RelativeStartFrame, duration);
        }

        foreach (var placement in scene.Characters)
        {
            placement.PresenceStartFrame = Math.Clamp(placement.PresenceStartFrame, 0, duration);
            placement.PresenceEndFrame =
                Math.Clamp(placement.PresenceEndFrame, placement.PresenceStartFrame, duration);
            placement.EntranceDurationFrames =
                Math.Clamp(placement.EntranceDurationFrames, 0, duration);
        }

        var fadeIn = Math.Clamp(scene.Animation.FadeIn.Value, 0, duration);
        var fadeOut = Math.Clamp(scene.Animation.FadeOut.Value, 0, duration - fadeIn);
        scene.Animation = scene.Animation with
        {
            FadeIn = new FrameCount(fadeIn),
            FadeOut = new FrameCount(fadeOut)
        };

        scene.TransitionDurationFrames = Math.Clamp(scene.TransitionDurationFrames, 0, duration / 2);
    }

    /// <summary>
    /// Shortens this scene's transition and the one leading into it so both still fit.
    /// Clamping beats rejecting: the user changed a length, and refusing the edit because
    /// of a transition they cannot see from here would be a dead end.
    /// </summary>
    private async Task FitNeighbouringTransitionsAsync(Scene scene, CancellationToken ct)
    {
        var list = await scenes.ListByProjectAsync(scene.ProjectId, ct).ConfigureAwait(false);
        var index = IndexOf(list, scene.Id);
        if (index < 0) return;

        if (index + 1 < list.Count)
        {
            var budget = Math.Min(scene.DurationFrames, list[index + 1].DurationFrames) / 2;
            if (scene.TransitionDurationFrames > budget)
            {
                scene.TransitionDurationFrames = budget;
                Touch(scene);
                await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
            }
        }

        if (index > 0)
        {
            var previous = list[index - 1];
            var budget = Math.Min(previous.DurationFrames, scene.DurationFrames) / 2;

            if (previous.TransitionDurationFrames > budget)
            {
                previous.TransitionDurationFrames = budget;
                Touch(previous);
                await scenes.ReplaceAsync(previous, ct).ConfigureAwait(false);
            }
        }
    }

    /// <summary>Keeps display numbers contiguous after an insert or a delete.</summary>
    private async Task RenumberAsync(string projectId, CancellationToken ct)
    {
        var list = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        for (var i = 0; i < list.Count; i++)
        {
            if (list[i].SceneNumber == i + 1) continue;

            list[i].SceneNumber = i + 1;
            list[i].UpdatedAt = clock.GetUtcNow().UtcDateTime;
            await scenes.ReplaceAsync(list[i], ct).ConfigureAwait(false);
        }
    }

    private async Task<double> NextOrderKeyAsync(
        IReadOnlyList<Scene> existing, string? afterSceneId, CancellationToken ct)
    {
        if (existing.Count == 0) return OrderKeyStep;

        if (string.IsNullOrEmpty(afterSceneId))
            return existing.Max(s => s.OrderKey) + OrderKeyStep;

        var index = IndexOf(existing, afterSceneId);

        if (index < 0)
        {
            throw EditingException.Invalid("after-scene-not-found",
                "The scene to insert after is not in this project.");
        }

        if (index == existing.Count - 1) return existing[index].OrderKey + OrderKeyStep;

        var before = existing[index].OrderKey;
        var after = existing[index + 1].OrderKey;
        var midpoint = before + ((after - before) / 2);

        // Doubles run out of room between two keys eventually; respace and try again.
        if (midpoint <= before || midpoint >= after)
        {
            var now = clock.GetUtcNow().UtcDateTime;

            for (var i = 0; i < existing.Count; i++)
            {
                existing[i].OrderKey = (i + 1) * OrderKeyStep;
                existing[i].UpdatedAt = now;
                await scenes.ReplaceAsync(existing[i], ct).ConfigureAwait(false);
            }

            return ((index + 1) * OrderKeyStep) + (OrderKeyStep / 2);
        }

        return midpoint;
    }

    private static int IndexOf(IReadOnlyList<Scene> list, string sceneId)
    {
        for (var i = 0; i < list.Count; i++)
        {
            if (string.Equals(list[i].Id, sceneId, StringComparison.Ordinal)) return i;
        }

        return -1;
    }

    private static void ReindexDialogue(Scene scene)
    {
        // Ordered by start frame so subtitle events are emitted in time order regardless
        // of the order lines were added in.
        var ordered = scene.Dialogue.OrderBy(l => l.RelativeStartFrame).ToList();

        for (var i = 0; i < ordered.Count; i++) ordered[i].Index = i;

        scene.Dialogue = ordered;
    }

    private static void MarkEdited(Scene scene, params string[] fields)
    {
        foreach (var field in fields)
        {
            if (!scene.UserEditedFields.Contains(field)) scene.UserEditedFields.Add(field);
        }
    }

    private void Touch(Scene scene)
    {
        scene.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        scene.RevisionToken = Guid.NewGuid().ToString("n");
    }

    private static string? Trim(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static FrameCount ToFrames(
        double seconds, FrameRate rate, string field, bool allowZero = false)
    {
        if (double.IsNaN(seconds) || double.IsInfinity(seconds) || seconds < 0)
            throw EditingException.Invalid("duration-invalid", $"{field} must be a positive number.");

        if (seconds > MaxSceneSeconds)
            throw EditingException.Invalid("duration-too-long", "That is longer than an hour.");

        var frames = FrameCount.FromSeconds(seconds, rate);

        if (!allowZero && frames.Value <= 0)
            throw EditingException.Invalid("duration-too-short", "That is shorter than a single frame.");

        return frames;
    }

    /// <summary>"an image file" / "a video file" - the article follows the word.</summary>
    private static string Describe(AssetKind kind)
    {
        var noun = kind.ToString().ToLowerInvariant();
        var article = noun[0] is 'a' or 'e' or 'i' or 'o' or 'u' ? "an" : "a";
        return $"{article} {noun} file";
    }

    private async Task<Project> LoadProjectAsync(string projectId, string userId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        // Ownership is checked on every path, not inferred from possessing an id.
        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }

    private async Task<(Scene Scene, Project Project)> LoadSceneAsync(
        string sceneId, string userId, CancellationToken ct)
    {
        var scene = await scenes.GetAsync(sceneId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        var project = await LoadProjectAsync(scene.ProjectId, userId, ct).ConfigureAwait(false);
        return (scene, project);
    }

    private async Task<Character> EnsureCharacterAsync(
        string characterId, string projectId, CancellationToken ct)
    {
        var character = await characters.GetAsync(characterId, ct).ConfigureAwait(false);

        if (character is null
            || !string.Equals(character.ProjectId, projectId, StringComparison.Ordinal))
        {
            throw EditingException.Invalid("character-not-found",
                "That character is not in this project.");
        }

        return character;
    }

    private async Task<Asset> EnsureUsableAssetAsync(
        string assetId, string projectId, AssetKind kind, CancellationToken ct,
        AssetKind? alternate = null)
    {
        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false);

        if (asset is null || !string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal))
            throw EditingException.Invalid("asset-not-found", "That file is not in this project.");

        if (asset.Kind != kind && asset.Kind != alternate)
        {
            throw EditingException.Invalid("asset-wrong-kind",
                $"'{asset.Name}' is {Describe(asset.Kind)}, but this needs {Describe(kind)}.");
        }

        // A searched asset that has not been approved must never reach a render, so it is
        // refused at the point of assignment rather than deep inside a job.
        if (!asset.IsUsableInScene)
        {
            throw EditingException.Conflict("asset-not-usable",
                $"'{asset.Name}' has not been approved for use yet.");
        }

        return asset;
    }
}

/// <summary>A scene plus the project it belongs to, so a caller can map frames to seconds.</summary>
public sealed record SceneWithProject(Scene Scene, Project Project);
