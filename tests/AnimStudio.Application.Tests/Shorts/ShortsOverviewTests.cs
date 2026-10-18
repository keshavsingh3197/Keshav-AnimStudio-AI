using AnimStudio.Application.Shorts;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Tests.Shorts;

/// <summary>
/// The Shorts page's bookkeeping: which files the shorts have used, how much unused stock a
/// project has left, and what the page warns about.
/// </summary>
public class ShortsOverviewTests
{
    private static readonly DateTime Now = new(2026, 10, 17, 12, 0, 0, DateTimeKind.Utc);

    private static RenderJob Short(string id, RenderJobStatus status, string[] assetIds, string? batch = "b1", DateTime? created = null) => new()
    {
        Id = id,
        Status = status,
        Kind = RenderJobKind.ClipMerge,
        CreatedAt = created ?? Now.AddHours(-1),
        CompletedAt = created ?? Now.AddHours(-1),
        OutputStorageKey = status is RenderJobStatus.Completed ? $"renders/{id}.mp4" : null,
        Batch = batch is null ? null : new RenderJobBatch { Id = batch, Name = "Batch" },
        ClipMerge = new ClipMergeSpec
        {
            AssetIds = [.. assetIds],
            TimelineItems = [.. assetIds.Select(a => new TimelineItemSpec { Type = "image", TrackId = "V1", Src = a }),
                new TimelineItemSpec { Type = "text", TrackId = "TXT1", Src = "Wait for it" }],
        },
    };

    private static Asset File(string id, AssetKind kind, string key = "assets/x") => new() { Id = id, Kind = kind, StorageKey = key };

    [Fact]
    public void Uses_count_every_render_except_failed_and_cancelled_ones()
    {
        var uses = ShortsOverview.CountUses(
        [
            Short("j1", RenderJobStatus.Completed, ["a", "b"]),
            Short("j2", RenderJobStatus.Processing, ["b", "c"]),
            Short("j3", RenderJobStatus.Failed, ["d"]),
            Short("j4", RenderJobStatus.Cancelled, ["e"]),
        ]);

        Assert.Equal(1, uses["a"]);
        Assert.Equal(2, uses["b"]);
        Assert.Equal(1, uses["c"]);
        Assert.False(uses.ContainsKey("d"));
        Assert.False(uses.ContainsKey("e"));
        // Words on a text track are not file ids.
        Assert.False(uses.ContainsKey("Wait for it"));
    }

    [Fact]
    public void Pool_counts_unused_footage_and_pictures_and_ignores_exports_and_audio()
    {
        var pool = ShortsOverview.Pool("p1", "Katyayani",
        [
            File("v1", AssetKind.Video), File("v2", AssetKind.Video),
            File("i1", AssetKind.Image), File("i2", AssetKind.Image), File("i3", AssetKind.Image),
            File("song", AssetKind.Audio),
            File("export", AssetKind.Video, "renders/old.mp4"),
        ],
        [Short("j1", RenderJobStatus.Completed, ["v1", "i1"])]);

        Assert.Equal(2, pool.Videos);
        Assert.Equal(3, pool.Images);
        Assert.Equal(1, pool.UnusedVideos);
        Assert.Equal(2, pool.UnusedImages);
        Assert.Equal(1, pool.Batches);
    }

    [Fact]
    public void An_exhausted_pool_warns_and_a_low_one_informs()
    {
        var empty = new ShortsPool("p1", "Empty", 2, 2, 0, 0, Batches: 1, Shorts: 4);
        var low = new ShortsPool("p2", "Low", 5, 5, 1, 1, Batches: 1, Shorts: 4);
        var neverUsed = new ShortsPool("p3", "Never", 5, 5, 0, 0, Batches: 0, Shorts: 0);

        var alerts = ShortsOverview.Alerts([], [empty, low, neverUsed], new ShortsOptions { LowStockThreshold = 5 }, Now);

        Assert.Contains(alerts, a => a.Code == "pool-empty" && a.ProjectId == "p1");
        Assert.Contains(alerts, a => a.Code == "pool-low" && a.ProjectId == "p2" && a.Count == 2);
        Assert.DoesNotContain(alerts, a => a.ProjectId == "p3");
    }

    [Fact]
    public void Weekly_goal_counts_only_shorts_made_this_week_that_did_not_fail()
    {
        ShortState[] shorts =
        [
            new(Short("j1", RenderJobStatus.Completed, ["a"]), false, false, false),
            new(Short("j2", RenderJobStatus.Failed, ["a"]), false, false, false),
            new(Short("j3", RenderJobStatus.Completed, ["a"], created: Now.AddDays(-9)), false, false, false),
        ];

        var behind = ShortsOverview.Alerts(shorts, [], new ShortsOptions { WeeklyGoal = 3 }, Now);
        Assert.Contains(behind, a => a.Code == "weekly-goal" && a.Count == 2);

        var off = ShortsOverview.Alerts(shorts, [], new ShortsOptions { WeeklyGoal = 0 }, Now);
        Assert.DoesNotContain(off, a => a.Code == "weekly-goal");
    }

    [Fact]
    public void Finished_shorts_left_off_youtube_are_reminded_after_the_grace_period()
    {
        ShortState[] shorts =
        [
            new(Short("old", RenderJobStatus.Completed, ["a"], created: Now.AddDays(-5)), false, false, false),
            new(Short("new", RenderJobStatus.Completed, ["a"]), false, false, false),
            new(Short("live", RenderJobStatus.Completed, ["a"], created: Now.AddDays(-5)), true, false, false),
        ];

        var alerts = ShortsOverview.Alerts(shorts, [], new ShortsOptions { UnpublishedReminderDays = 2 }, Now);

        Assert.Contains(alerts, a => a.Code == "not-on-youtube" && a.Count == 1);
    }

    [Fact]
    public void Failures_are_reported_first()
    {
        ShortState[] shorts =
        [
            new(Short("bad", RenderJobStatus.Failed, ["a"]), false, false, false),
            new(Short("copy", RenderJobStatus.Completed, ["a"]), false, false, true),
        ];

        var alerts = ShortsOverview.Alerts(shorts, [], new ShortsOptions { WeeklyGoal = 10 }, Now);

        Assert.Equal(["render-failed", "drive-failed"], alerts.Take(2).Select(a => a.Code));
        Assert.All(alerts.Take(2), a => Assert.Equal("error", a.Severity));
    }
}
