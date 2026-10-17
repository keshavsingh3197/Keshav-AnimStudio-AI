using AnimStudio.Application.Clips;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// Batch shorts: each one lands on the asked length, footage is trimmed inside its file,
/// the pool is spread across the batch, and the same seed plans the same batch.
/// </summary>
public class AutoShortPlannerTests
{
    private static readonly AutoShortSource[] Mixed =
    [
        new("vid_a", AssetKind.Video, 40),
        new("vid_b", AssetKind.Video, 12),
        new("vid_c", AssetKind.Video, 2.5),
        new("img_a", AssetKind.Image, null),
        new("img_b", AssetKind.Image, null),
    ];

    private static AutoShortBatch Batch(
        IReadOnlyList<AutoShortSource>? sources = null, int count = 4, double seconds = 30,
        AutoShortTextMode text = AutoShortTextMode.None, IReadOnlyList<string>? lines = null, int seed = 7) =>
        new()
        {
            Sources = sources ?? Mixed,
            Count = count,
            TargetSeconds = seconds,
            TextMode = text,
            Lines = lines ?? [],
            Seed = seed,
        };

    private static double V1Length(ClipMergeCommand c) =>
        c.TimelineItems!.Where(i => i.TrackId == "V1").Sum(i => i.Duration);

    [Theory]
    [InlineData(5)]
    [InlineData(15)]
    [InlineData(30)]
    [InlineData(59)]
    [InlineData(180)]
    public void Every_short_lands_on_the_asked_length(double seconds)
    {
        foreach (var style in Enum.GetValues<AutoShortStyle>())
        {
            var plans = AutoShortPlanner.Plan(Batch(seconds: seconds) with { Style = style });

            Assert.All(plans, p => Assert.InRange(V1Length(p), seconds - 0.1, seconds + 1.0));
        }
    }

    [Fact]
    public void Footage_is_trimmed_inside_its_own_file()
    {
        var lengths = Mixed.ToDictionary(s => s.AssetId, s => s.DurationSeconds);

        foreach (var plan in AutoShortPlanner.Plan(Batch(count: 10, seconds: 60)))
        {
            foreach (var item in plan.TimelineItems!.Where(i => i.Type == "video"))
            {
                Assert.True(item.TrimStartSeconds >= 0);
                Assert.True(item.TrimEndSeconds <= lengths[item.Src]! + 0.01);
                Assert.Equal(item.Duration, item.TrimEndSeconds!.Value - item.TrimStartSeconds!.Value, 2);
            }
        }
    }

    [Fact]
    public void V1_items_follow_the_running_order_one_to_one()
    {
        foreach (var plan in AutoShortPlanner.Plan(Batch()))
        {
            var v1 = plan.TimelineItems!.Where(i => i.TrackId == "V1").ToList();
            Assert.Equal(plan.AssetIds, v1.Select(i => i.Src));
            Assert.Equal(plan.AssetIds.Count - 1, plan.Junctions!.Count);
            Assert.Equal(0, v1[0].StartTime);
            for (var k = 1; k < v1.Count; k++)
                Assert.Equal(v1[k - 1].StartTime + v1[k - 1].Duration, v1[k].StartTime, 1);
        }
    }

    [Fact]
    public void Transitions_never_outlast_half_the_shorter_neighbour()
    {
        foreach (var plan in AutoShortPlanner.Plan(Batch(count: 10)))
        {
            var v1 = plan.TimelineItems!.Where(i => i.TrackId == "V1").ToList();
            for (var k = 0; k < plan.Junctions!.Count; k++)
                Assert.True(plan.Junctions[k].TransitionSeconds <= Math.Min(v1[k].Duration, v1[k + 1].Duration) / 2 + 0.01);
        }
    }

    [Fact]
    public void The_whole_pool_is_used_before_anything_repeats()
    {
        var pool = Enumerable.Range(0, 12).Select(i => new AutoShortSource($"img_{i}", AssetKind.Image, null)).ToList();

        // Calm shots are 4-6.5s, so 3 shorts of 20s take at least 12 shots.
        var plans = AutoShortPlanner.Plan(Batch(pool, count: 3, seconds: 20) with { Style = AutoShortStyle.Calm });
        var firstTwelve = plans.SelectMany(p => p.AssetIds).Take(12);

        Assert.Equal(12, firstTwelve.Distinct().Count());
    }

    [Fact]
    public void The_same_seed_plans_the_same_batch_and_a_new_one_differs()
    {
        static string Shape(IEnumerable<ClipMergeCommand> plans) =>
            string.Join("|", plans.SelectMany(p => p.TimelineItems!).Select(i => $"{i.Src}@{i.StartTime}+{i.Duration}"));

        Assert.Equal(Shape(AutoShortPlanner.Plan(Batch(seed: 1))), Shape(AutoShortPlanner.Plan(Batch(seed: 1))));
        Assert.NotEqual(Shape(AutoShortPlanner.Plan(Batch(seed: 1))), Shape(AutoShortPlanner.Plan(Batch(seed: 2))));
    }

    [Fact]
    public void Shorts_are_numbered_and_count_is_capped()
    {
        var plans = AutoShortPlanner.Plan(Batch(count: 500) with { ExportName = "Diwali" });

        Assert.Equal(AutoShortPlanner.MaxCount, plans.Count);
        Assert.Equal("Diwali #1", plans[0].ExportName);
        Assert.Equal($"Diwali #{AutoShortPlanner.MaxCount}", plans[^1].ExportName);
    }

    [Fact]
    public void Pictures_move_unless_motion_is_off()
    {
        var pics = new[] { new AutoShortSource("img", AssetKind.Image, null) };

        var moving = AutoShortPlanner.Plan(Batch(pics, count: 1));
        Assert.All(moving[0].TimelineItems!.Where(i => i.Type == "image"), i => Assert.NotEqual("none", i.Transform!.Motion));

        var still = AutoShortPlanner.Plan(Batch(pics, count: 1) with { Motion = false });
        Assert.All(still[0].TimelineItems!.Where(i => i.Type == "image"), i => Assert.Equal("none", i.Transform!.Motion));
    }

    [Fact]
    public void Hook_spans_the_short_and_per_shot_lines_sit_inside_their_shot()
    {
        var plan = AutoShortPlanner.Plan(Batch(count: 1, text: AutoShortTextMode.HookAndPerShot,
            lines: ["Wait for it", "Line two", "Line three"]))[0];

        var text = plan.TimelineItems!.Where(i => i.TrackId == "TXT1").ToList();
        var hook = Assert.Single(text, t => t.Name == "Hook");
        Assert.Equal(V1Length(plan), hook.Duration, 1);

        var shots = plan.TimelineItems!.Where(i => i.TrackId == "V1").ToList();
        foreach (var caption in text.Where(t => t.Name == "Caption"))
        {
            Assert.Contains(shots, s => caption.StartTime >= s.StartTime - 0.01
                                        && caption.StartTime + caption.Duration <= s.StartTime + s.Duration + 0.01);
        }
    }

    [Fact]
    public void Lines_are_cleaned_and_blank_ones_dropped()
    {
        Assert.Equal("Hello world", AutoShortPlanner.CleanLine("  Hello\t\u0007  world \n"));
        Assert.Equal(string.Empty, AutoShortPlanner.CleanLine("   "));
        Assert.Equal(AutoShortPlanner.MaxLineLength, AutoShortPlanner.CleanLine(new string('x', 500)).Length);

        var plan = AutoShortPlanner.Plan(Batch(count: 1, text: AutoShortTextMode.Hook, lines: ["   ", "\t"]))[0];
        Assert.DoesNotContain(plan.TimelineItems!, i => i.TrackId == "TXT1");
    }

    [Fact]
    public void Clips_too_short_to_cut_are_refused_when_nothing_else_is_usable()
    {
        Assert.Throws<ArgumentException>(() =>
            AutoShortPlanner.Plan(Batch([new("tiny", AssetKind.Video, 0.4), new("song", AssetKind.Audio, 90)])));
    }

    [Fact]
    public void Music_rotates_and_clip_audio_is_only_muted_under_music()
    {
        var withMusic = AutoShortPlanner.Plan(Batch(count: 2) with { MusicAssetIds = ["m1", "m2"], KeepClipAudio = false });
        Assert.Equal(["m1", "m2"], withMusic.Select(p => p.BackgroundMusicAssetId).Order());
        Assert.All(withMusic, p => Assert.True(p.MuteClipAudio));

        var silent = AutoShortPlanner.Plan(Batch(count: 1) with { KeepClipAudio = false });
        Assert.False(silent[0].MuteClipAudio);
    }

    [Fact]
    public void Transitions_off_cuts_hard()
    {
        var plan = AutoShortPlanner.Plan(Batch(count: 1) with { Transitions = false })[0];
        Assert.All(plan.Junctions!, j => Assert.Equal(SceneTransition.None, j.Transition));
    }

    [Theory]
    [InlineData(30, 1.6, 3.2)]
    [InlineData(7, 4.0, 6.5)]
    [InlineData(5, 3.0, 5.0)]
    public void Shot_lengths_sum_exactly_and_leave_no_sliver(double target, double min, double max)
    {
        for (var seed = 0; seed < 50; seed++)
        {
            var lengths = AutoShortPlanner.ShotLengths(target, min, max, new Random(seed));
            Assert.Equal(target, lengths.Sum(), 1);
            Assert.All(lengths, l => Assert.True(l >= AutoShortPlanner.MinShotSeconds - 0.001));
        }
    }
}
