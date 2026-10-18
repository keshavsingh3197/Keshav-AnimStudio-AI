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
    public OutroSettings? DefaultOutro { get; init; }

    /// <summary>Null leaves it unchanged; blank or "default" clears it to the default channel.</summary>
    public string? BrandChannelId { get; init; }

    /// <summary>Null leaves it unchanged.</summary>
    public bool? FollowChannelWatermark { get; init; }

    /// <summary>Null leaves it unchanged.</summary>
    public ProjectContentType? ContentType { get; init; }

    /// <summary>Null leaves it unchanged; 0 goes back to the studio-wide default.</summary>
    public double? DefaultImageDurationSeconds { get; init; }
    public bool? IsPinned { get; init; }
    public string? CustomThumbnail { get; init; }
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

        if (command.DefaultImageDurationSeconds is { } imageSeconds
            && imageSeconds != 0 && !ImageDurationLimits.IsValid(imageSeconds))
        {
            throw EditingException.Invalid("image-duration-out-of-range",
                $"Image duration must be between {ImageDurationLimits.Min} and {ImageDurationLimits.Max} seconds.");
        }

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
        
        if (command.IsPinned.HasValue)
            project.IsPinned = command.IsPinned.Value;
            
        if (command.CustomThumbnail is not null)
            project.CustomThumbnail = string.IsNullOrWhiteSpace(command.CustomThumbnail) ? null : command.CustomThumbnail.Trim();
        if (command.DefaultWatermark is not null)
        {
            command.DefaultWatermark.Clamp();
            project.Settings.DefaultWatermark = command.DefaultWatermark;
        }

        if (command.DefaultOutro is not null)
        {
            command.DefaultOutro.Clamp();
            project.Settings.DefaultOutro = command.DefaultOutro;
        }

        if (command.FollowChannelWatermark is { } follow)
            project.Settings.FollowChannelWatermark = follow;

        if (command.ContentType is { } contentType)
            project.Settings.ContentType = contentType;

        if (command.DefaultImageDurationSeconds is { } imageDuration)
            project.Settings.DefaultImageDurationSeconds = imageDuration == 0 ? null : imageDuration;

        if (command.BrandChannelId is not null)
        {
            project.Settings.BrandChannelId =
                BrandChannel.IsDefault(command.BrandChannelId) ? null : command.BrandChannelId;
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
    /// Deep-clones a project, including its settings, assets, characters, and scenes,
    /// remapping all internal asset and character references so the duplicate is completely
    /// independent of the original.
    /// </summary>
    public async Task<Project> DuplicateAsync(
        string sourceProjectId, string userId, string? customName, CancellationToken ct)
    {
        var source = await projects.GetAsync(sourceProjectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(source.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var now = clock.GetUtcNow().UtcDateTime;
        var name = !string.IsNullOrWhiteSpace(customName)
            ? customName.Trim()
            : $"{source.Name} (Copy)";

        var copy = new Project
        {
            UserId = userId,
            Name = name,
            Description = source.Description,
            Status = ProjectStatus.Draft,
            IsPinned = false,
            CustomThumbnail = source.CustomThumbnail,
            StudioDraftJson = source.StudioDraftJson,
            Settings = new ProjectSettings
            {
                Width = source.Settings.Width,
                Height = source.Settings.Height,
                FrameRateNum = source.Settings.FrameRateNum,
                FrameRateDen = source.Settings.FrameRateDen,
                DistributionIntent = source.Settings.DistributionIntent,
                ContentType = source.Settings.ContentType,
                AcceptShareAlikeObligation = source.Settings.AcceptShareAlikeObligation,
                BackgroundMusicAssetId = source.Settings.BackgroundMusicAssetId,
                BackgroundMusicVolume = source.Settings.BackgroundMusicVolume,
                BrandChannelId = source.Settings.BrandChannelId,
                FollowChannelWatermark = source.Settings.FollowChannelWatermark,
                DefaultImageDurationSeconds = source.Settings.DefaultImageDurationSeconds,
                ClipOrderAssetIds = [.. source.Settings.ClipOrderAssetIds],
                DefaultWatermark = new WatermarkSettings
                {
                    Kind = source.Settings.DefaultWatermark.Kind,
                    Text = source.Settings.DefaultWatermark.Text,
                    LogoAssetId = source.Settings.DefaultWatermark.LogoAssetId,
                    Position = source.Settings.DefaultWatermark.Position,
                    Opacity = source.Settings.DefaultWatermark.Opacity,
                    HeightFraction = source.Settings.DefaultWatermark.HeightFraction,
                    MarginFraction = source.Settings.DefaultWatermark.MarginFraction,
                    ColorHex = source.Settings.DefaultWatermark.ColorHex,
                    BackplateOpacity = source.Settings.DefaultWatermark.BackplateOpacity
                },
                DefaultOutro = new OutroSettings
                {
                    Kind = source.Settings.DefaultOutro.Kind,
                    AssetId = source.Settings.DefaultOutro.AssetId,
                    DurationSeconds = source.Settings.DefaultOutro.DurationSeconds,
                    Transition = source.Settings.DefaultOutro.Transition,
                    TransitionDurationFrames = source.Settings.DefaultOutro.TransitionDurationFrames,
                    QrAssetId = source.Settings.DefaultOutro.QrAssetId,
                    Headline = source.Settings.DefaultOutro.Headline,
                    Subtext = source.Settings.DefaultOutro.Subtext,
                    HeadlineSecondary = source.Settings.DefaultOutro.HeadlineSecondary,
                    SubtextSecondary = source.Settings.DefaultOutro.SubtextSecondary,
                    BackgroundHex = source.Settings.DefaultOutro.BackgroundHex,
                    TextHex = source.Settings.DefaultOutro.TextHex,
                    Animation = source.Settings.DefaultOutro.Animation
                }
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(copy, ct).ConfigureAwait(false);

        // 1. Clone project assets and build oldId -> newId map
        var assetMap = new Dictionary<string, string>(StringComparer.Ordinal);
        var sourceAssets = await assets.ListByProjectAsync(source.Id, ct).ConfigureAwait(false);

        foreach (var srcAsset in sourceAssets)
        {
            var ext = Path.GetExtension(srcAsset.StorageKey);
            var newStorageKey = $"projects/{copy.Id}/assets/{Guid.NewGuid():n}{ext}";

            await using (var content = await store.OpenAsync(srcAsset.StorageKey, ct).ConfigureAwait(false))
            {
                if (content is not null)
                {
                    await store.SaveAsync(newStorageKey, content, srcAsset.MimeType, ct).ConfigureAwait(false);
                }
                else
                {
                    newStorageKey = srcAsset.StorageKey;
                }
            }

            var newAsset = new Asset
            {
                ProjectId = copy.Id,
                Name = srcAsset.Name,
                DisplayFileName = srcAsset.DisplayFileName,
                OrderIndex = srcAsset.OrderIndex,
                StorageKey = newStorageKey,
                Kind = srcAsset.Kind,
                MimeType = srcAsset.MimeType,
                FileSizeBytes = srcAsset.FileSizeBytes,
                Probe = srcAsset.Probe,
                ReviewStatus = srcAsset.ReviewStatus,
                UsageScope = srcAsset.UsageScope,
                Provenance = srcAsset.Provenance,
                IpRisk = srcAsset.IpRisk,
                CopiedFromAssetId = srcAsset.Id,
                CreatedAt = now
            };

            await assets.InsertAsync(newAsset, ct).ConfigureAwait(false);
            assetMap[srcAsset.Id] = newAsset.Id;
        }

        string? MapAsset(string? id) =>
            id is not null && assetMap.TryGetValue(id, out var mapped) ? mapped : id;

        // Remap asset references inside project settings & draft JSON
        if (assetMap.Count > 0)
        {
            copy.Settings.BackgroundMusicAssetId = MapAsset(copy.Settings.BackgroundMusicAssetId);
            copy.Settings.DefaultWatermark.LogoAssetId = MapAsset(copy.Settings.DefaultWatermark.LogoAssetId);
            copy.Settings.DefaultOutro.AssetId = MapAsset(copy.Settings.DefaultOutro.AssetId);
            copy.Settings.DefaultOutro.QrAssetId = MapAsset(copy.Settings.DefaultOutro.QrAssetId);
            copy.Settings.ClipOrderAssetIds = [.. copy.Settings.ClipOrderAssetIds.Select(id => MapAsset(id)!)];

            if (!string.IsNullOrEmpty(copy.StudioDraftJson))
            {
                var draft = copy.StudioDraftJson;
                foreach (var (oldId, newId) in assetMap)
                {
                    draft = draft.Replace(oldId, newId, StringComparison.Ordinal);
                }
                copy.StudioDraftJson = draft;
            }

            await projects.ReplaceAsync(copy, ct).ConfigureAwait(false);
        }

        // 2. Clone characters and build oldCharId -> newCharId map
        var charMap = new Dictionary<string, string>(StringComparer.Ordinal);
        var sourceChars = await characters.ListByProjectAsync(source.Id, ct).ConfigureAwait(false);

        foreach (var srcChar in sourceChars)
        {
            var newChar = new AnimStudio.Domain.Characters.Character
            {
                ProjectId = copy.Id,
                Name = srcChar.Name,
                Description = srcChar.Description,
                Aliases = [.. srcChar.Aliases],
                IsNarrator = srcChar.IsNarrator,
                IsAutoCreated = srcChar.IsAutoCreated,
                SubtitleColorHex = srcChar.SubtitleColorHex,
                Appearance = new AnimStudio.Domain.Characters.CharacterAppearance
                {
                    Age = srcChar.Appearance.Age,
                    Gender = srcChar.Appearance.Gender,
                    Hair = srcChar.Appearance.Hair,
                    Clothes = srcChar.Appearance.Clothes,
                    AdditionalDetails = srcChar.Appearance.AdditionalDetails
                },
                Sprites = new AnimStudio.Domain.Characters.CharacterSprites
                {
                    ClosedMouthAssetId = MapAsset(srcChar.Sprites.ClosedMouthAssetId),
                    OpenMouthAssetId = MapAsset(srcChar.Sprites.OpenMouthAssetId)
                },
                Staging = new AnimStudio.Domain.Characters.CharacterStaging
                {
                    Anchor = srcChar.Staging.Anchor,
                    HeightFraction = srcChar.Staging.HeightFraction,
                    OffsetXFraction = srcChar.Staging.OffsetXFraction,
                    OffsetYFraction = srcChar.Staging.OffsetYFraction,
                    FlipHorizontal = srcChar.Staging.FlipHorizontal,
                    ZOrder = srcChar.Staging.ZOrder
                },
                Voice = srcChar.Voice is null ? null : new AnimStudio.Domain.Characters.CharacterVoice
                {
                    Preset = srcChar.Voice.Preset,
                    PitchSemitones = srcChar.Voice.PitchSemitones,
                    SizeSemitones = srcChar.Voice.SizeSemitones,
                    BassDecibels = srcChar.Voice.BassDecibels,
                    TrebleDecibels = srcChar.Voice.TrebleDecibels,
                    Drive = srcChar.Voice.Drive,
                    Robot = srcChar.Voice.Robot,
                    RobotHertz = srcChar.Voice.RobotHertz,
                    Radio = srcChar.Voice.Radio,
                    Echo = srcChar.Voice.Echo,
                    Reverb = srcChar.Voice.Reverb,
                    AiSampleAssetId = MapAsset(srcChar.Voice.AiSampleAssetId),
                    AiSampleConsent = srcChar.Voice.AiSampleConsent
                },
                CreatedAt = now,
                UpdatedAt = now
            };

            await characters.InsertAsync(newChar, ct).ConfigureAwait(false);
            charMap[srcChar.Id] = newChar.Id;
        }

        string? MapChar(string? id) =>
            id is not null && charMap.TryGetValue(id, out var mapped) ? mapped : id;

        // 3. Clone scenes with remapped character & asset IDs
        var sourceScenes = await scenes.ListByProjectAsync(source.Id, ct).ConfigureAwait(false);
        foreach (var srcScene in sourceScenes)
        {
            var newScene = new Scene
            {
                ProjectId = copy.Id,
                SceneNumber = srcScene.SceneNumber,
                OrderKey = srcScene.OrderKey,
                Title = srcScene.Title,
                Description = srcScene.Description,
                DurationFrames = srcScene.DurationFrames,
                BackgroundAssetId = MapAsset(srcScene.BackgroundAssetId),
                Animation = srcScene.Animation,
                TransitionToNext = srcScene.TransitionToNext,
                TransitionDurationFrames = srcScene.TransitionDurationFrames,
                Origin = srcScene.Origin,
                Status = srcScene.Status,
                UserEditedFields = [.. srcScene.UserEditedFields],
                LockedFields = [.. srcScene.LockedFields],
                Audio = new SceneAudio
                {
                    AssetId = MapAsset(srcScene.Audio.AssetId),
                    SliceStartSeconds = srcScene.Audio.SliceStartSeconds,
                    SliceEndSeconds = srcScene.Audio.SliceEndSeconds
                },
                Characters = [.. srcScene.Characters.Select(c => new CharacterPlacement
                {
                    CharacterId = MapChar(c.CharacterId) ?? c.CharacterId,
                    PresenceStartFrame = c.PresenceStartFrame,
                    PresenceEndFrame = c.PresenceEndFrame,
                    Anchor = c.Anchor,
                    HeightFraction = c.HeightFraction,
                    OffsetXFraction = c.OffsetXFraction,
                    OffsetYFraction = c.OffsetYFraction,
                    FlipHorizontal = c.FlipHorizontal,
                    ZOrder = c.ZOrder,
                    Entrance = c.Entrance,
                    EntranceDurationFrames = c.EntranceDurationFrames
                })],
                Dialogue = [.. srcScene.Dialogue.Select(d => new DialogueLine
                {
                    Index = d.Index,
                    SpeakerLabel = d.SpeakerLabel,
                    SpeakerCharacterId = MapChar(d.SpeakerCharacterId),
                    Text = d.Text,
                    RelativeStartFrame = d.RelativeStartFrame,
                    RelativeEndFrame = d.RelativeEndFrame,
                    SourceStartSeconds = d.SourceStartSeconds,
                    SourceEndSeconds = d.SourceEndSeconds
                })],
                RevisionToken = Guid.NewGuid().ToString("n"),
                CreatedAt = now,
                UpdatedAt = now
            };

            await scenes.InsertAsync(newScene, ct).ConfigureAwait(false);
        }

        return copy;
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
