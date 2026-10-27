using AnimStudio.Application.Assets;
using AnimStudio.Application.Projects;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using Xunit;

namespace AnimStudio.Application.Tests.Editing;

public sealed class SubProjectAndSharedAssetsTests
{
    [Fact]
    public async Task Root_project_sees_own_and_subproject_assets()
    {
        var world = new EditingWorld();
        var parent = world.Project; // "project-1"

        var sub1 = new Project
        {
            Id = "sub-1",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings { UseSharedAssets = true }
        };
        world.Projects.Items.Add(sub1);

        world.Assets.Items.Add(new Asset { Id = "parent-asset", ProjectId = parent.Id, Name = "P.mp4" });
        world.Assets.Items.Add(new Asset { Id = "sub-asset", ProjectId = sub1.Id, Name = "S.mp4" });

        var visibleToParent = await world.AssetScope.GetVisibleProjectIdsAsync(parent.Id, default);
        Assert.Contains(parent.Id, visibleToParent);
        Assert.Contains(sub1.Id, visibleToParent);

        var list = await world.AssetScope.ListVisibleAssetsAsync(parent.Id, default);
        Assert.Equal(2, list.Count);
    }

    [Fact]
    public async Task Subproject_with_shared_assets_sees_parent_and_sibling_assets()
    {
        var world = new EditingWorld();
        var parent = world.Project; // "project-1"

        var sub1 = new Project
        {
            Id = "sub-1",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings { UseSharedAssets = true }
        };
        var sub2 = new Project
        {
            Id = "sub-2",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings { UseSharedAssets = true }
        };
        world.Projects.Items.Add(sub1);
        world.Projects.Items.Add(sub2);

        world.Assets.Items.Add(new Asset { Id = "p-asset", ProjectId = parent.Id, Name = "P.mp4" });
        world.Assets.Items.Add(new Asset { Id = "s2-asset", ProjectId = sub2.Id, Name = "S2.mp4" });

        var visibleToSub1 = await world.AssetScope.GetVisibleProjectIdsAsync(sub1.Id, default);
        Assert.Contains(sub1.Id, visibleToSub1);
        Assert.Contains(parent.Id, visibleToSub1);
        Assert.Contains(sub2.Id, visibleToSub1);

        Assert.True(await world.AssetScope.CanUseAssetAsync("p-asset", sub1.Id, default));
        Assert.True(await world.AssetScope.CanUseAssetAsync("s2-asset", sub1.Id, default));
    }

    [Fact]
    public async Task Subproject_with_shared_assets_disabled_sees_only_own_assets()
    {
        var world = new EditingWorld();
        var parent = world.Project; // "project-1"

        var subPrivate = new Project
        {
            Id = "sub-private",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings { UseSharedAssets = false }
        };
        world.Projects.Items.Add(subPrivate);

        world.Assets.Items.Add(new Asset { Id = "parent-asset", ProjectId = parent.Id, Name = "P.mp4" });
        world.Assets.Items.Add(new Asset { Id = "private-asset", ProjectId = subPrivate.Id, Name = "Private.mp4" });

        var visible = await world.AssetScope.GetVisibleProjectIdsAsync(subPrivate.Id, default);
        Assert.Single(visible);
        Assert.Contains(subPrivate.Id, visible);

        Assert.False(await world.AssetScope.CanUseAssetAsync("parent-asset", subPrivate.Id, default));
        Assert.True(await world.AssetScope.CanUseAssetAsync("private-asset", subPrivate.Id, default));

        // But parent can still see private subproject's asset (per requirement: family pool)
        var visibleToParent = await world.AssetScope.GetVisibleProjectIdsAsync(parent.Id, default);
        Assert.Contains(subPrivate.Id, visibleToParent);
        Assert.True(await world.AssetScope.CanUseAssetAsync("private-asset", parent.Id, default));
    }

    [Fact]
    public async Task Deleting_parent_project_with_subprojects_throws_exception()
    {
        var world = new EditingWorld();
        var parent = world.Project;

        var sub = new Project
        {
            Id = "sub-1",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings()
        };
        world.Projects.Items.Add(sub);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            world.ProjectEditing.DeleteAsync(parent.Id, EditingWorld.UserId, default));
    }

    [Fact]
    public async Task Deleting_subproject_rehomes_assets_to_parent_project()
    {
        var world = new EditingWorld();
        var parent = world.Project;

        var sub = new Project
        {
            Id = "sub-1",
            UserId = EditingWorld.UserId,
            ParentProjectId = parent.Id,
            Settings = new ProjectSettings()
        };
        world.Projects.Items.Add(sub);

        var subAsset = new Asset
        {
            Id = "asset-sub",
            ProjectId = sub.Id,
            FolderId = "some-sub-folder",
            Name = "SubAsset.mp4"
        };
        world.Assets.Items.Add(subAsset);

        await world.ProjectEditing.DeleteAsync(sub.Id, EditingWorld.UserId, default);

        // Subproject is removed
        Assert.Null(await world.Projects.GetAsync(sub.Id, default));

        // Subproject asset was rehomed to parent project and folder unassigned
        var assetAfter = await world.Assets.GetAsync(subAsset.Id, default);
        Assert.NotNull(assetAfter);
        Assert.Equal(parent.Id, assetAfter.ProjectId);
        Assert.Null(assetAfter.FolderId);
    }
}
