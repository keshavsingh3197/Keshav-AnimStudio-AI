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
    public async Task Pages_follow_on_without_repeating_and_report_the_total()
    {
        var world = new EditingWorld();
        AddProject(world, "p2", null);
        for (var i = 0; i < 5; i++) AddAsset(world, $"a{i}", "p2", $"Clip {i}", ageDays: i);

        var search = new AssetSearchService(world.Assets, world.Projects);
        AssetSearchQuery Page(int offset) => new()
        {
            TargetProjectId = world.Project.Id, UserId = EditingWorld.UserId, Offset = offset, Limit = 2
        };

        var first = await search.SearchAsync(Page(0), CancellationToken.None);
        var last = await search.SearchAsync(Page(4), CancellationToken.None);

        Assert.Equal(["a0", "a1"], first.Hits.Select(h => h.Asset.Id));
        Assert.True(first.Truncated);
        Assert.Equal(5, first.Total);
        Assert.Equal("a4", Assert.Single(last.Hits).Asset.Id);
        Assert.False(last.Truncated);
    }

    [Fact]
    public async Task A_named_channel_and_project_narrow_the_search_and_facets_ignore_their_own_filter()
    {
        var world = new EditingWorld();
        world.Project.Settings.BrandChannelId = "kids";
        AddProject(world, "k1", "kids");
        AddProject(world, "n1", "news");
        AddProject(world, "n2", "news");
        AddAsset(world, "n1-video", "n1", "Intro");
        AddAsset(world, "n1-image", "n1", "Logo", AssetKind.Image);
        AddAsset(world, "n2-video", "n2", "Outro");
        AddAsset(world, "k1-video", "k1", "Kids intro");

        var search = new AssetSearchService(world.Assets, world.Projects);
        var result = await search.SearchAsync(new AssetSearchQuery
        {
            TargetProjectId = world.Project.Id, UserId = EditingWorld.UserId,
            ChannelId = "news", SourceProjectId = "n1", Kind = AssetKind.Video
        }, CancellationToken.None);

        Assert.Equal("n1-video", Assert.Single(result.Hits).Asset.Id);
        Assert.Equal(2, result.ProjectsSearched);
        // Projects ignore the project filter but keep the type filter: n1 and n2 each have one video.
        Assert.Equal(["n1", "n2"], result.Projects.Select(p => p.ProjectId).Order());
        Assert.All(result.Projects, p => Assert.Equal(1, p.Matches));
        // Types ignore the type filter but keep the project filter: n1 has a video and an image.
        Assert.Equal(1, result.KindCounts[AssetKind.Video]);
        Assert.Equal(1, result.KindCounts[AssetKind.Image]);
    }

    [Fact]
    public async Task Sort_by_name_and_by_size()
    {
        var world = new EditingWorld();
        AddProject(world, "p2", null);
        AddAsset(world, "b", "p2", "beta").FileSizeBytes = 10;
        AddAsset(world, "a", "p2", "Alpha").FileSizeBytes = 5;
        AddAsset(world, "c", "p2", "charlie").FileSizeBytes = 50;

        var search = new AssetSearchService(world.Assets, world.Projects);
        Task<AssetSearchResult> Sorted(AssetSearchSort sort) => search.SearchAsync(new AssetSearchQuery
        {
            TargetProjectId = world.Project.Id, UserId = EditingWorld.UserId, Sort = sort
        }, CancellationToken.None);

        Assert.Equal(["a", "b", "c"], (await Sorted(AssetSearchSort.Name)).Hits.Select(h => h.Asset.Id));
        Assert.Equal(["c", "b", "a"], (await Sorted(AssetSearchSort.Largest)).Hits.Select(h => h.Asset.Id));
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
