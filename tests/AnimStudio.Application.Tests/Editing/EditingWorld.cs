using AnimStudio.Application.Assets;
using AnimStudio.Application.Characters;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Scenes;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Editing;

/// <summary>
/// One owned project with fake repositories behind it, so each test starts from a
/// realistic world in a line rather than ten of setup.
/// </summary>
public sealed class EditingWorld
{
    public const string UserId = "local-user";
    public const string OtherUserId = "someone-else";

    public FakeProjectRepository Projects { get; } = new();
    public FakeSceneRepository Scenes { get; } = new();
    public FakeCharacterRepository Characters { get; } = new();
    public FakeAssetRepository Assets { get; } = new();
    public FakeObjectStore Store { get; } = new();

    public Project Project { get; }

    public EditingWorld(int fps = 30)
    {
        Project = new Project
        {
            Id = "project-1",
            UserId = UserId,
            Name = "Test project",
            Settings = new ProjectSettings { FrameRateNum = fps, FrameRateDen = 1 }
        };

        Projects.Items.Add(Project);
    }

    public FrameRate Rate => Project.Settings.ToCanvas().FrameRate;

    public ProjectStatusService ProjectStatus => new(Projects, Scenes);

    public SceneEditingService SceneEditing =>
        new(Scenes, Projects, Characters, Assets, ProjectStatus, TimeProvider.System);

    public ProjectEditingService ProjectEditing =>
        new(Projects, Scenes, Characters, Assets, Store, TimeProvider.System);

    public CharacterEditingService CharacterEditing =>
        new(Characters, Projects, Scenes, Assets, TimeProvider.System);

    public AssetLibraryService AssetLibrary =>
        new(Assets, Projects, Scenes, Characters, Store);

    public Scene AddScene(int number, double seconds = 5, string? backgroundAssetId = null)
    {
        var scene = new Scene
        {
            Id = $"scene-{number}",
            ProjectId = Project.Id,
            SceneNumber = number,
            OrderKey = number * 1000,
            Title = $"Scene {number}",
            DurationFrames = FrameCount.FromSeconds(seconds, Rate).Value,
            BackgroundAssetId = backgroundAssetId
        };

        Scenes.Items.Add(scene);
        return scene;
    }

    public Character AddCharacter(string id, string name, bool isNarrator = false)
    {
        var character = new Character
        {
            Id = id,
            ProjectId = Project.Id,
            Name = name,
            IsNarrator = isNarrator
        };

        Characters.Items.Add(character);
        return character;
    }

    public Asset AddAsset(string id, AssetKind kind, string? projectId = null, double? duration = null)
    {
        var asset = new Asset
        {
            Id = id,
            ProjectId = projectId ?? Project.Id,
            Name = id,
            StorageKey = $"projects/{projectId ?? Project.Id}/assets/{id}",
            Kind = kind,
            MimeType = kind == AssetKind.Image ? "image/png" : "audio/mpeg",
            Probe = new MediaProbe { DurationSeconds = duration }
        };

        Assets.Items.Add(asset);
        return asset;
    }

    public int Frames(double seconds) => FrameCount.FromSeconds(seconds, Rate).Value;
}
