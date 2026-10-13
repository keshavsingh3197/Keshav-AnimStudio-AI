using AnimStudio.Application.Assets;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Tests.Editing;

public class AssetSearchServiceTests
{
    private static Project AddProject(EditingWorld world, string id, string? channel, string userId = EditingWorld.UserId)
    {
        var project = new Project
        {
            Id = id,
            UserId = userId,
            Name = id,
            Settings = new ProjectSettings { BrandChannelId = channel }
        };
        world.Projects.Items.Add(project);
        return project;
    }

    private static Asset AddAsset(EditingWorld world, string id, string projectId, string name,
        AssetKind kind = AssetKind.Video, int ageDays = 0)
    {
        var asset = world.AddAsset(id, kind, projectId);
        asset.Name = name;
        asset.CreatedAt = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc).AddDays(-ageDays);
        return asset;
    }

    private static Task<AssetSearchResult> Search(EditingWorld world, string? text = null,
        AssetSearchScope scope = AssetSearchScope.Channel, AssetKind? kind = null, int limit = 40) =>
        new AssetSearchService(world.Assets, world.Projects).SearchAsync(new AssetSearchQuery
        {
            TargetProjectId = world.Project.Id,
            UserId = EditingWorld.UserId,
            Text = text,
            Scope = scope,
            Kind = kind,
            Limit = limit
        }, CancellationToken.None);

    [Fact]
    public async Task By_default_only_projects_on_the_same_channel_are_searched()
    {
        var world = new EditingWorld();
        world.Project.Settings.BrandChannelId = "kids";
        AddProject(world, "same", "kids");
        AddProject(world, "other", "news");
        AddAsset(world, "intro-kids", "same", "Intro");
        AddAsset(world, "intro-news", "other", "Intro");

        var result = await Search(world, "intro");

        var hit = Assert.Single(result.Hits);
        Assert.Equal("intro-kids", hit.Asset.Id);
        Assert.True(hit.SameChannel);
        Assert.Equal(1, result.ProjectsSearched);
    }

    [Fact]
    public async Task Searching_everywhere_still_ranks_the_same_channel_first()
    {
        var world = new EditingWorld();
        world.Project.Settings.BrandChannelId = "kids";
        AddProject(world, "same", "kids");
        AddProject(world, "other", "news");
        // The other channel's file is a better name match and newer; channel still wins.
        AddAsset(world, "intro-news", "other", "Intro");
        AddAsset(world, "intro-kids", "same", "Old intro v2", ageDays: 30);

        var result = await Search(world, "intro", AssetSearchScope.All);

        Assert.Equal(["intro-kids", "intro-news"], result.Hits.Select(h => h.Asset.Id));
        Assert.False(result.Hits[1].SameChannel);
        Assert.Equal("news", result.Hits[1].ChannelId);
    }

    [Fact]
    public async Task No_channel_and_the_default_channel_are_the_same_channel()
    {
        var world = new EditingWorld();
        world.Project.Settings.BrandChannelId = null;
        AddProject(world, "legacy", "default");
        AddAsset(world, "logo", "legacy", "Logo", AssetKind.Image);

        var result = await Search(world);

        Assert.Single(result.Hits);
    }

    [Fact]
    public async Task Better_name_matches_come_before_weaker_ones()
    {
        var world = new EditingWorld();
        AddProject(world, "p2", null);
        AddAsset(world, "contains", "p2", "Big intro music");
        AddAsset(world, "prefix", "p2", "Intro music long");
        AddAsset(world, "exact", "p2", "Intro music");

        var result = await Search(world, "intro music");

        Assert.Equal(["exact", "prefix", "contains"], result.Hits.Select(h => h.Asset.Id));
    }

    [Fact]
    public async Task Every_word_must_match_the_file_or_its_project()
    {
        var world = new EditingWorld();
        var project = AddProject(world, "p2", null);
        project.Name = "Diwali special";
        AddAsset(world, "a", "p2", "Fireworks");
        AddAsset(world, "b", "p2", "Thumbnail");

        var result = await Search(world, "diwali fireworks");

        Assert.Equal("a", Assert.Single(result.Hits).Asset.Id);
    }

    [Fact]
    public async Task The_target_projects_own_files_and_other_users_projects_are_never_returned()
    {
        var world = new EditingWorld();
        AddProject(world, "theirs", null, EditingWorld.OtherUserId);
        AddAsset(world, "mine-here", world.Project.Id, "Intro");
        AddAsset(world, "their-intro", "theirs", "Intro");

        var result = await Search(world, "intro", AssetSearchScope.All);

        Assert.Empty(result.Hits);
    }

    [Fact]
    public async Task A_file_already_copied_here_is_marked_as_added()
    {
        var world = new EditingWorld();
        AddProject(world, "p2", null);
        AddAsset(world, "intro", "p2", "Intro");
        var copy = AddAsset(world, "intro-copy", world.Project.Id, "Intro");
        copy.CopiedFromAssetId = "intro";

        var result = await Search(world, "intro");

        Assert.True(Assert.Single(result.Hits).AlreadyAdded);
    }

    [Fact]
    public async Task Kind_filter_and_limit_are_applied()
    {
        var world = new EditingWorld();
        AddProject(world, "p2", null);
        AddAsset(world, "v1", "p2", "Clip 1");
        AddAsset(world, "v2", "p2", "Clip 2", ageDays: 1);
        AddAsset(world, "i1", "p2", "Clip cover", AssetKind.Image);

        var result = await Search(world, "clip", kind: AssetKind.Video, limit: 1);

        Assert.Equal("v1", Assert.Single(result.Hits).Asset.Id);
        Assert.True(result.Truncated);
    }

    [Fact]
    public async Task Searching_from_someone_elses_project_is_refused()
    {
        var world = new EditingWorld();
        world.Project.UserId = EditingWorld.OtherUserId;

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => Search(world));
    }

    [Fact]
    public async Task An_overlong_query_is_rejected()
    {
        var world = new EditingWorld();

        await Assert.ThrowsAsync<EditingException>(() => Search(world, new string('a', AssetSearchService.MaxQueryLength + 1)));
    }
}
