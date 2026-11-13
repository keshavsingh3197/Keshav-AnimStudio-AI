using AnimStudio.Application.Clips;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// Whole clips stay whole in every layout, and the packaging - bands, title, numbered parts,
/// quiz or poll, call to action, memes and the second language - lands where it should.
/// </summary>
public class AutoShortPackagerTests
{
    /// <summary>Eight-second clips, as a video model makes them, and two pictures.</summary>
    private static readonly AutoShortSource[] Clips8 =
    [
        new("clip_1", AssetKind.Video, 8),
        new("clip_2", AssetKind.Video, 8),
        new("clip_3", AssetKind.Video, 8),
        new("clip_4", AssetKind.Video, 8),
        new("clip_5", AssetKind.Video, 8),
        new("img_a", AssetKind.Image, null),
        new("img_b", AssetKind.Image, null),
    ];

    private static List<TimelineItemSpec> Shots(ClipMergeCommand c) =>
        [.. c.TimelineItems!.Where(i => i.TrackId == "V1").OrderBy(i => i.StartTime)];

    private static AutoShortBatch Batch(AutoShortLayout layout, double seconds = 30, int count = 3) => new()
    {
        Sources = Clips8,
        Layout = layout,
        Count = count,
        TargetSeconds = seconds,
        ExactLength = true,
        KeepClipsWhole = true,
        Seed = 11,
    };

    [Theory]
    [InlineData(AutoShortLayout.FitLength, 30)]
    [InlineData(AutoShortLayout.FitLength, 5)]
    [InlineData(AutoShortLayout.Spread, 30)]
    [InlineData(AutoShortLayout.Spread, 60)]
    [InlineData(AutoShortLayout.AllInEach, 20)]
    public void Whole_clips_play_start_to_finish_and_never_twice_in_a_short(AutoShortLayout layout, double seconds)
    {
        foreach (var style in Enum.GetValues<AutoShortStyle>())
        {
            var plan = AutoShortPlanner.PlanBatch(Batch(layout, seconds) with { Style = style });
            foreach (var s in plan.Shorts)
            {
                var videos = Shots(s).Where(i => i.Type == "video").ToList();
                Assert.All(videos, v =>
                {
                    Assert.Equal(0, v.TrimStartSeconds);
                    Assert.Equal(8, v.TrimEndSeconds);
                    Assert.Equal(8, v.Duration);
                });
                Assert.Equal(videos.Count, videos.Select(v => v.Src).Distinct().Count());
            }
        }
    }

    [Fact]
    public void Whole_clips_still_land_on_an_exact_length_when_pictures_can_flex()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.FitLength, 30));
        Assert.All(plan.Shorts, s => Assert.Equal(30, Shots(s).Sum(i => i.Duration), 1));
    }

    [Fact]
    public void Without_whole_clips_quick_cuts_still_cut_inside_clips()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.FitLength, 30) with { KeepClipsWhole = false });
        Assert.Contains(plan.Shorts.SelectMany(Shots), i => i.Type == "video" && i.Duration < 8);
    }

    [Fact]
    public void No_packaging_adds_nothing()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.Spread));
        Assert.All(plan.Shorts, s => Assert.DoesNotContain(s.TimelineItems!, i => i.Id.StartsWith("pkg_", StringComparison.Ordinal)));
        Assert.All(plan.Shorts, s => Assert.Null(s.BackgroundColor));
    }

    [Fact]
    public void A_compilation_gets_a_title_a_poll_numbered_parts_and_a_call_to_action()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.Spread, 30, 2) with
        {
            Packaging = new AutoShortPackaging
            {
                Design = "comic",
                Title = "Funniest fails",
                Top = AutoShortTopMode.Poll,
                NumberParts = true,
                CountDown = true,
                CallToAction = true,
                ChannelHandle = "mychannel",
            },
        });

        foreach (var s in plan.Shorts)
        {
            var items = s.TimelineItems!;
            var videos = Shots(s).Where(i => i.Type == "video").ToList();
            Assert.Equal("Funniest fails", items.Single(i => i.Id == "pkg_title").Src);
            Assert.StartsWith("Which one is the funniest?", items.Single(i => i.Id == "pkg_top").Src);

            // Counted down, each badge on its own part's first frame.
            var badges = items.Where(i => i.Id.StartsWith("pkg_part_", StringComparison.Ordinal)).OrderBy(i => i.StartTime).ToList();
            Assert.Equal(videos.Count, badges.Count);
            Assert.Equal($"#{videos.Count}", badges[0].Src);
            Assert.Equal("#1", badges[^1].Src);
            Assert.Equal(videos.Select(v => v.StartTime), badges.Select(b => b.StartTime));

            Assert.Equal("Comment your favourite number!", items.Single(i => i.Id == "pkg_bottom").Src);
            Assert.Equal("Follow @mychannel for more", items.Single(i => i.Id == "pkg_follow").Src);

            // The comic design's yellow bars, so the footage sits inside them.
            Assert.Equal("#fde047", s.BackgroundColor);
            Assert.Equal(ClipFit.Contain, s.Fit);

            var total = Shots(s).Sum(i => i.Duration);
            Assert.All(items.Where(i => i.Id.StartsWith("pkg_", StringComparison.Ordinal)),
                i => Assert.True(i.StartTime >= 0 && i.StartTime + i.Duration <= total + 0.01, i.Id));
        }
    }

    [Fact]
    public void Both_languages_make_each_short_twice_from_the_same_cut()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.Spread, 30, 2) with
        {
            ExportName = "Fun",
            Packaging = new AutoShortPackaging { Top = AutoShortTopMode.Poll, NumberParts = true, PartLabel = AutoShortPartLabel.Level, CallToAction = true, Language = AutoShortLanguage.Both },
        });

        Assert.Equal(4, plan.Shorts.Count);
        Assert.Equal(["Fun #1 · EN", "Fun #1 · HI", "Fun #2 · EN", "Fun #2 · HI"], plan.Shorts.Select(s => s.ExportName));
        Assert.Equal(4, plan.Styles!.Count);
        for (var k = 0; k < plan.Shorts.Count; k += 2)
        {
            var en = plan.Shorts[k];
            var hi = plan.Shorts[k + 1];
            Assert.Equal(Shots(en).Select(i => (i.Src, i.StartTime, i.Duration)), Shots(hi).Select(i => (i.Src, i.StartTime, i.Duration)));
            Assert.StartsWith("Which one", en.TimelineItems!.Single(i => i.Id == "pkg_top").Src);
            Assert.StartsWith("सबसे मज़ेदार", hi.TimelineItems!.Single(i => i.Id == "pkg_top").Src);
            Assert.StartsWith("LEVEL ", en.TimelineItems!.First(i => i.Id.StartsWith("pkg_part_", StringComparison.Ordinal)).Src);
            Assert.StartsWith("लेवल ", hi.TimelineItems!.First(i => i.Id.StartsWith("pkg_part_", StringComparison.Ordinal)).Src);
        }
    }

    [Fact]
    public void A_quiz_asks_first_and_shows_the_answer_at_the_end()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.Spread, 30, 1) with
        {
            Packaging = new AutoShortPackaging { Top = AutoShortTopMode.Quiz, QuizLines = ["Capital of France? | Paris"] },
        });

        var items = plan.Shorts[0].TimelineItems!;
        var question = items.Single(i => i.Id == "pkg_top");
        var answer = items.Single(i => i.Id == "pkg_answer");
        Assert.Equal("Capital of France?", question.Src);
        Assert.Equal("Answer: Paris", answer.Src);
        Assert.Equal(question.StartTime + question.Duration, answer.StartTime, 2);
        Assert.Equal(Shots(plan.Shorts[0]).Sum(i => i.Duration), answer.StartTime + answer.Duration, 1);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(99)]
    public void Made_up_quiz_answers_are_right(int seed)
    {
        var random = new Random(seed);
        for (var n = 0; n < 200; n++)
        {
            var (question, answer) = AutoShortPackager.QuizFor([], random, hindi: false);
            var sum = question[(question.LastIndexOf(':') + 1)..].Replace("Quick!", "").Replace("= ?", "").Trim();
            if (sum.Contains(',')) continue;
            var parts = sum.Split(' ');
            var value = parts.Length == 3
                ? Apply(int.Parse(parts[0]), parts[1], int.Parse(parts[2]))
                : int.Parse(parts[0]) + int.Parse(parts[2]) * int.Parse(parts[4]);
            Assert.Equal(value.ToString(), answer);
        }

        static int Apply(int a, string op, int b) => op switch { "+" => a + b, "-" => a - b, _ => a * b };
    }

    [Fact]
    public void Auto_top_deals_different_bands_and_skips_a_poll_with_one_part()
    {
        var oneClip = new AutoShortSource[] { new("clip_1", AssetKind.Video, 8) };
        var plan = AutoShortPlanner.PlanBatch(new AutoShortBatch
        {
            Sources = oneClip, Layout = AutoShortLayout.AllInEach, Count = 6, TargetSeconds = 10, KeepClipsWhole = true, Seed = 3,
            Packaging = new AutoShortPackaging { Top = AutoShortTopMode.Auto },
        });
        Assert.All(plan.Shorts, s => Assert.Equal("Quiz", s.TimelineItems!.Single(i => i.Id == "pkg_top").Name));
    }

    [Fact]
    public void Memes_pop_up_inside_the_short_on_their_own_tracks()
    {
        var plan = AutoShortPlanner.PlanBatch(Batch(AutoShortLayout.Spread, 60, 2) with
        {
            Packaging = new AutoShortPackaging
            {
                Title = "Wait for it",
                MemesPerShort = 2,
                Memes = [new("meme_pic", AssetKind.Image, null), new("meme_clip", AssetKind.Video, 6)],
            },
        });

        foreach (var s in plan.Shorts)
        {
            var total = Shots(s).Sum(i => i.Duration);
            var memes = s.TimelineItems!.Where(i => i.Name == "Meme").ToList();
            Assert.Equal(2, memes.Count);
            Assert.All(memes, m =>
            {
                Assert.Equal(m.Type == "video" ? "V3" : "IMG1", m.TrackId);
                Assert.True(m.StartTime >= s.TimelineItems!.Single(i => i.Id == "pkg_title").Duration - 0.01);
                Assert.True(m.StartTime + m.Duration <= total - 0.99);
                Assert.InRange(m.Duration, 1.2, 2.5);
            });
        }
    }

    [Theory]
    [InlineData("@my.channel", "@my.channel")]
    [InlineData("my_channel", "@my_channel")]
    [InlineData("  ", null)]
    [InlineData("bad handle!", null)]
    public void Handles_are_cleaned(string raw, string? expected) =>
        Assert.Equal(expected, AutoShortPackager.CleanHandle(raw));

    [Fact]
    public void Unknown_designs_fall_back_to_none()
    {
        Assert.Equal("none", AutoShortPackager.CleanDesignId("nope"));
        Assert.Equal("auto", AutoShortPackager.CleanDesignId("AUTO"));
        Assert.Equal("quiz-show", AutoShortPackager.CleanDesignId("quiz-show"));
    }
}
