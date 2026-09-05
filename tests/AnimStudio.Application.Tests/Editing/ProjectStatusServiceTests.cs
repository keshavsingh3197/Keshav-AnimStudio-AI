using AnimStudio.Application.Scenes;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Tests.Editing;

public class ProjectStatusServiceTests
{
    [Fact]
    public async Task A_project_with_no_scenes_is_a_draft()
    {
        var world = new EditingWorld();

        await world.ProjectStatus.RefreshAsync(world.Project.Id, null, CancellationToken.None);

        Assert.Equal(ProjectStatus.Draft, world.Project.Status);
    }

    [Fact]
    public async Task Giving_every_scene_a_background_makes_the_project_ready()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);
        world.AddAsset("bg", AssetKind.Image);

        await world.SceneEditing.SetAllBackgroundsAsync(
            world.Project.Id, EditingWorld.UserId, "bg", CancellationToken.None);

        Assert.Equal(ProjectStatus.Ready, world.Project.Status);
    }

    [Fact]
    public async Task Adding_a_scene_with_no_background_takes_the_project_back_to_draft()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.AddAsset("bg", AssetKind.Image);
        world.Project.Status = ProjectStatus.Ready;

        await world.SceneEditing.CreateAsync(new CreateSceneCommand
        {
            ProjectId = world.Project.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 3,
        }, CancellationToken.None);

        Assert.Equal(ProjectStatus.Draft, world.Project.Status);
    }

    [Fact]
    public async Task Deleting_the_scene_that_was_missing_a_background_makes_it_ready_again()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.AddScene(2);
        world.AddAsset("bg", AssetKind.Image);

        await world.SceneEditing.DeleteAsync("scene-2", EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(ProjectStatus.Ready, world.Project.Status);
    }

    [Fact]
    public async Task A_render_in_flight_is_not_overridden_by_an_edit()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.AddAsset("bg", AssetKind.Image);

        await world.ProjectStatus.MarkRenderingAsync(world.Project.Id, CancellationToken.None);
        Assert.Equal(ProjectStatus.Rendering, world.Project.Status);

        await world.SceneEditing.CreateAsync(new CreateSceneCommand
        {
            ProjectId = world.Project.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 3,
        }, CancellationToken.None);

        Assert.Equal(ProjectStatus.Rendering, world.Project.Status);
    }

    [Fact]
    public async Task A_finished_render_leaves_the_project_rendered_and_survives_later_edits()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, backgroundAssetId: "bg");
        world.AddAsset("bg", AssetKind.Image);

        await world.ProjectStatus.MarkRenderingAsync(world.Project.Id, CancellationToken.None);
        await world.ProjectStatus.MarkRenderFinishedAsync(
            world.Project.Id, producedOutput: true, CancellationToken.None);

        Assert.Equal(ProjectStatus.Rendered, world.Project.Status);

        // Editing a rendered project does not un-render it: the video still exists.
        await world.SceneEditing.UpdateAsync(new UpdateSceneCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 4,
        }, CancellationToken.None);

        await world.ProjectStatus.RefreshAsync(world.Project.Id, null, CancellationToken.None);
        Assert.Equal(ProjectStatus.Rendered, world.Project.Status);
    }

    [Fact]
    public async Task A_failed_render_hands_the_project_back_to_the_scene_list()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.AddAsset("bg", AssetKind.Image);

        await world.ProjectStatus.MarkRenderingAsync(world.Project.Id, CancellationToken.None);
        await world.ProjectStatus.MarkRenderFinishedAsync(
            world.Project.Id, producedOutput: false, CancellationToken.None);

        Assert.Equal(ProjectStatus.Ready, world.Project.Status);
    }

    [Fact]
    public async Task Losing_a_background_un_renders_even_a_finished_project()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.Project.Status = ProjectStatus.Rendered;

        world.AddScene(2);   // a new scene with no background

        await world.ProjectStatus.RefreshAsync(world.Project.Id, null, CancellationToken.None);

        Assert.Equal(ProjectStatus.Draft, world.Project.Status);
    }

    [Fact]
    public async Task An_archived_project_is_left_alone()
    {
        var world = new EditingWorld();
        world.AddScene(1, backgroundAssetId: "bg");
        world.Project.Status = ProjectStatus.Archived;

        await world.ProjectStatus.RefreshAsync(world.Project.Id, null, CancellationToken.None);
        await world.ProjectStatus.MarkRenderingAsync(world.Project.Id, CancellationToken.None);

        Assert.Equal(ProjectStatus.Archived, world.Project.Status);
    }
}
