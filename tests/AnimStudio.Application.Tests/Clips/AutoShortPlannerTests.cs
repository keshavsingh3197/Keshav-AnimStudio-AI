using AnimStudio.Application.Clips;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
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
                Assert.Equal(v1[k - 1].StartTime + v1[k - 1].Duration, v1[k].StartTime, 0.02);
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
    public void Spread_auto_plan_respects_the_configured_batch_cap()
    {
        var pictures = Enumerable.Range(0, 25)
            .Select(i => new AutoShortSource($"img_{i}", AssetKind.Image, null))
            .ToArray();

        var plan = AutoShortPlanner.PlanBatch(Batch(pictures, count: 0, seconds: 5) with
        {
            Layout = AutoShortLayout.Spread,
            ImageSeconds = 1,
            MaxShortCount = 2,
        });

        Assert.Equal(2, plan.Shorts.Count);
        Assert.NotEmpty(plan.UnusedAssetIds);
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

    // --- Spread and AllInEach: picks play for their own length ---

    private static readonly AutoShortSource[] Pool12 =
    [
        .. Enumerable.Range(0, 8).Select(k => new AutoShortSource($"img_{k}", AssetKind.Image, null)),
        new("vid_10", AssetKind.Video, 10),
        new("vid_15", AssetKind.Video, 15),
        new("vid_5", AssetKind.Video, 5),
        new("vid_40", AssetKind.Video, 40),
    ];

    private static List<TimelineItemSpec> Shots(ClipMergeCommand c) => [.. c.TimelineItems!.Where(i => i.TrackId == "V1")];

    [Fact]
    public void Spread_uses_each_pick_in_one_short_only()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 3, seconds: 60) with { Layout = AutoShortLayout.Spread });

        var used = plan.Shorts.SelectMany(s => Shots(s).Select(i => i.Src)).ToList();
        Assert.Equal(used.Count, used.Distinct().Count());
        Assert.Empty(plan.UnusedAssetIds);
        Assert.Equal(Pool12.Length, used.Count);
        Assert.Equal(3, plan.Shorts.Count);
    }

    [Fact]
    public void Spread_holds_pictures_for_the_asked_time_and_plays_videos_in_full()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 0, seconds: 90) with { Layout = AutoShortLayout.Spread, ImageSeconds = 7 });

        foreach (var shot in plan.Shorts.SelectMany(Shots))
        {
            var source = Pool12.Single(s => s.AssetId == shot.Src);
            Assert.Equal(source.Kind == AssetKind.Image ? 7 : source.DurationSeconds!.Value, shot.Duration, 2);
            if (shot.Type == "video") Assert.Equal(0, shot.TrimStartSeconds!.Value, 2);
        }
    }

    [Fact]
    public void Spread_never_runs_past_the_cap_and_caps_long_videos()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 0, seconds: 30) with { Layout = AutoShortLayout.Spread, MaxClipSeconds = 8 });

        Assert.All(plan.Shorts, s => Assert.True(V1Length(s) <= 30.01, $"{V1Length(s)}s"));
        Assert.All(plan.Shorts.SelectMany(Shots).Where(i => i.Type == "video"), i => Assert.True(i.Duration <= 8.01));
        // Auto count makes enough shorts for every pick.
        Assert.Empty(plan.UnusedAssetIds);
    }

    [Fact]
    public void Spread_with_too_few_shorts_reports_what_did_not_fit()
    {
        // 8 pictures x 5s + 70s of video into one 20s short: most picks are left for next time.
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 1, seconds: 20) with { Layout = AutoShortLayout.Spread });

        Assert.Single(plan.Shorts);
        Assert.True(V1Length(plan.Shorts[0]) <= 20.01);
        var used = Shots(plan.Shorts[0]).Select(i => i.Src).ToHashSet();
        Assert.Equal(Pool12.Length, used.Count + plan.UnusedAssetIds.Count);
        Assert.DoesNotContain(plan.UnusedAssetIds, used.Contains);
    }

    [Fact]
    public void Spread_balances_the_shorts()
    {
        var pics = Enumerable.Range(0, 12).Select(k => new AutoShortSource($"p{k}", AssetKind.Image, null)).ToArray();
        var plan = AutoShortPlanner.PlanBatch(Batch(pics, count: 4, seconds: 60) with { Layout = AutoShortLayout.Spread });

        Assert.All(plan.Shorts, s => Assert.Equal(3, Shots(s).Count));
    }

    [Fact]
    public void Spread_makes_no_more_shorts_than_picks()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Mixed, count: 10, seconds: 60) with { Layout = AutoShortLayout.Spread });

        Assert.Equal(Mixed.Length, plan.Shorts.Count);
        Assert.All(plan.Shorts, s => Assert.Single(Shots(s)));
    }

    [Fact]
    public void All_in_each_puts_every_pick_in_every_short_in_its_own_order()
    {
        var pics = Enumerable.Range(0, 6).Select(k => new AutoShortSource($"p{k}", AssetKind.Image, null)).ToArray();
        var plan = AutoShortPlanner.PlanBatch(Batch(pics, count: 4, seconds: 60) with { Layout = AutoShortLayout.AllInEach, ImageSeconds = 4 });

        Assert.Equal(4, plan.Shorts.Count);
        Assert.All(plan.Shorts, s => Assert.Equal(pics.Select(p => p.AssetId).Order(), Shots(s).Select(i => i.Src).Order()));
        Assert.All(plan.Shorts, s => Assert.Equal(24, V1Length(s), 2));
        Assert.True(plan.Shorts.Select(s => string.Join(',', Shots(s).Select(i => i.Src))).Distinct().Count() > 1);
    }

    [Fact]
    public void All_in_each_stops_at_the_cap()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 2, seconds: 25) with { Layout = AutoShortLayout.AllInEach });

        Assert.All(plan.Shorts, s => Assert.True(V1Length(s) <= 25.01));
        Assert.All(plan.Shorts, s => Assert.NotEmpty(Shots(s)));
    }

    // --- Exact length, video order and styles ---

    [Theory]
    [InlineData(AutoShortLayout.Spread, 0, 15)]
    [InlineData(AutoShortLayout.Spread, 0, 45)]
    [InlineData(AutoShortLayout.Spread, 3, 60)]
    [InlineData(AutoShortLayout.Spread, 5, 90)]
    [InlineData(AutoShortLayout.AllInEach, 3, 60)]
    [InlineData(AutoShortLayout.AllInEach, 2, 25)]
    [InlineData(AutoShortLayout.Spread, 1, 180)]
    public void Exact_length_lands_every_layout_on_the_asked_length(AutoShortLayout layout, int count, double seconds)
    {
        foreach (var pool in new[] { Pool12, Mixed })
        {
            for (var seed = 0; seed < 20; seed++)
            {
                var plan = AutoShortPlanner.PlanBatch(Batch(pool, count: count, seconds: seconds, seed: seed)
                    with { Layout = layout, ExactLength = true, MaxClipSeconds = seed % 2 == 0 ? null : 8 });

                Assert.All(plan.Shorts, s => Assert.Equal(seconds, V1Length(s), 1));
                Assert.All(plan.Shorts.SelectMany(Shots), i => Assert.True(i.Duration >= AutoShortPlanner.MinShotSeconds - 0.01, $"{i.Duration}s shot"));
                foreach (var v in plan.Shorts.SelectMany(Shots).Where(i => i.Type == "video"))
                {
                    var length = pool.Single(p => p.AssetId == v.Src).DurationSeconds!.Value;
                    Assert.True(v.TrimStartSeconds >= 0 && v.TrimEndSeconds <= length + 0.01);
                    Assert.Equal(v.Duration, v.TrimEndSeconds!.Value - v.TrimStartSeconds!.Value, 2);
                }
            }
        }
    }

    [Fact]
    public void Exact_spread_makes_full_shorts_and_tops_them_up_before_repeating()
    {
        // 8 x 5s pictures + 70s of video = 110s: one exact 60s short, the rest topping it up.
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 0, seconds: 60) with { Layout = AutoShortLayout.Spread, ExactLength = true });

        var only = Assert.Single(plan.Shorts);
        Assert.Equal(60, V1Length(only), 1);
        var used = Shots(only).Select(i => i.Src).ToList();
        Assert.Equal(used.Count, used.Distinct().Count());
    }

    [Fact]
    public void Exact_spread_keeps_videos_to_one_short_each_while_pictures_can_be_reused()
    {
        var pool = new AutoShortSource[]
        {
            new("v1", AssetKind.Video, 10), new("v2", AssetKind.Video, 10), new("v3", AssetKind.Video, 10),
            new("p1", AssetKind.Image, null), new("p2", AssetKind.Image, null),
        };
        var plan = AutoShortPlanner.PlanBatch(Batch(pool, count: 3, seconds: 30)
            with { Layout = AutoShortLayout.Spread, ExactLength = true, Order = AutoShortOrder.VideosFirst });

        Assert.Equal(3, plan.Shorts.Count);
        var videos = plan.Shorts.SelectMany(s => Shots(s).Where(i => i.Type == "video").Select(i => i.Src)).ToList();
        Assert.Equal(videos.Count, videos.Distinct().Count());
        Assert.All(plan.Shorts, s => Assert.Equal(30, V1Length(s), 1));
    }

    [Theory]
    [InlineData(AutoShortLayout.Spread)]
    [InlineData(AutoShortLayout.AllInEach)]
    [InlineData(AutoShortLayout.FitLength)]
    public void Videos_first_opens_every_short_on_footage(AutoShortLayout layout)
    {
        for (var seed = 0; seed < 20; seed++)
        {
            var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 4, seconds: 30, seed: seed)
                with { Layout = layout, ExactLength = true, Order = AutoShortOrder.VideosFirst });

            foreach (var s in plan.Shorts)
            {
                var kinds = Shots(s).Select(i => i.Type).ToList();
                if (!kinds.Contains("video")) continue;
                Assert.Equal("video", kinds[0]);
                // No video after the first picture.
                var firstPicture = kinds.IndexOf("image");
                if (firstPicture >= 0) Assert.DoesNotContain("video", kinds.Skip(firstPicture));
            }
            Assert.Contains(plan.Shorts, s => Shots(s)[0].Type == "video");
        }
    }

    [Fact]
    public void Video_first_only_moves_one_video_to_the_front()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(Pool12, count: 3, seconds: 60) with { Layout = AutoShortLayout.Spread, Order = AutoShortOrder.VideoFirst });

        Assert.All(plan.Shorts.Where(s => Shots(s).Any(i => i.Type == "video")), s => Assert.Equal("video", Shots(s)[0].Type));
    }

    [Fact]
    public void Each_short_reports_its_style_and_mixed_goes_round_them_all()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(count: 7));
        Assert.NotNull(plan.Styles);
        Assert.Equal(7, plan.Styles!.Count);
        Assert.Equal(7, plan.Styles.Distinct().Count());
        Assert.DoesNotContain(AutoShortStyle.Mixed, plan.Styles);
        Assert.DoesNotContain(AutoShortStyle.Auto, plan.Styles);

        var fixedStyle = AutoShortPlanner.PlanBatch(Batch(count: 3) with { Style = AutoShortStyle.Retro });
        Assert.All(fixedStyle.Styles!, s => Assert.Equal(AutoShortStyle.Retro, s));
    }

    [Fact]
    public void Auto_style_picks_quick_styles_for_teasers()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(count: 4, seconds: 15) with { Style = AutoShortStyle.Auto });
        Assert.All(plan.Styles!, s => Assert.Contains(s, new[] { AutoShortStyle.Hype, AutoShortStyle.Energetic }));
    }

    [Fact]
    public void Viral_cuts_fast_with_whips_and_bold_yellow_captions()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(count: 3, seconds: 30, text: AutoShortTextMode.HookAndPerShot,
            lines: ["poora naam", "vibration ka hota", "letter tweak kiya"]) with { Style = AutoShortStyle.Viral });

        Assert.All(plan.Styles!, s => Assert.Equal(AutoShortStyle.Viral, s));
        SceneTransition[] whips = [SceneTransition.SlideUp, SceneTransition.SlideDown, SceneTransition.ZoomIn, SceneTransition.SlideLeft, SceneTransition.None];
        foreach (var s in plan.Shorts)
        {
            Assert.All(s.Junctions!, j => Assert.Contains(j.Transition, whips));
            Assert.All(Shots(s), i => Assert.InRange(i.Duration, 0.9, 2.81 + 2.81));
            var captions = s.TimelineItems!.Where(i => i.Name == "Caption").ToList();
            Assert.NotEmpty(captions);
            Assert.All(captions, c => Assert.Equal("#ffd60a", c.TextStyle!.Color));
            Assert.Equal("#ffffff", s.TimelineItems!.Single(i => i.Name == "Hook").TextStyle!.BoxColor);
        }
    }

    [Fact]
    public void Fit_length_is_still_the_default_layout()
    {
        Assert.Equal(AutoShortLayout.FitLength, new AutoShortBatch { Sources = Mixed }.Layout);
        Assert.All(AutoShortPlanner.Plan(Batch(seconds: 30)), p => Assert.Equal(30, V1Length(p), 1));
    }
}
