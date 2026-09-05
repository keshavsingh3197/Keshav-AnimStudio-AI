using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

public class RenderTimelineTests
{
    private static List<FrameCount> Frames(params int[] values) =>
        [.. values.Select(v => new FrameCount(v))];

    [Fact]
    public void Computes_cumulative_offsets_that_account_for_each_transition_shortening_the_timeline()
    {
        // Scenes 12s / 10s / 15s at 30fps, two 0.5s transitions.
        //   O0 = 12.0 - 0.5        = 11.5s = 345f
        //   O1 = 11.5 + 10.0 - 0.5 = 21.0s = 630f
        var offsets = RenderTimeline.XfadeOffsets(Frames(360, 300, 450), Frames(15, 15));

        Assert.Equal([345, 630], offsets.Select(o => o.Value));
    }

    [Fact]
    public void Total_length_is_the_sum_of_scenes_minus_every_transition()
    {
        var total = RenderTimeline.TotalLength(Frames(360, 300, 450), Frames(15, 15));

        Assert.Equal(1080, total.Value);   // 36.0s at 30fps
    }

    [Fact]
    public void A_single_scene_has_no_transitions()
    {
        Assert.Empty(RenderTimeline.XfadeOffsets(Frames(360), []));
        Assert.Equal(360, RenderTimeline.TotalLength(Frames(360), []).Value);
    }

    [Fact]
    public void Hard_cuts_produce_offsets_that_are_simply_cumulative_lengths()
    {
        var offsets = RenderTimeline.XfadeOffsets(Frames(100, 200, 300), Frames(0, 0));

        Assert.Equal([100, 300], offsets.Select(o => o.Value));
    }

    [Fact]
    public void Offsets_are_strictly_increasing_across_many_scenes()
    {
        var lengths = Frames([.. Enumerable.Repeat(120, 40)]);
        var durations = Frames([.. Enumerable.Repeat(10, 39)]);

        var offsets = RenderTimeline.XfadeOffsets(lengths, durations);

        for (var i = 1; i < offsets.Count; i++)
            Assert.True(offsets[i].Value > offsets[i - 1].Value,
                $"offset {i} ({offsets[i].Value}) did not advance past {offsets[i - 1].Value}");

        // 40 scenes x 120f minus 39 x 10f.
        Assert.Equal(40 * 120 - 39 * 10, RenderTimeline.TotalLength(lengths, durations).Value);
    }

    [Fact]
    public void Rejects_a_transition_too_long_for_the_scenes_it_joins()
    {
        // xfade would run out of frames and freeze rather than fail cleanly.
        var ex = Assert.Throws<RenderException>(() =>
            RenderTimeline.Validate(Frames(60, 60), Frames(40)));

        Assert.Equal(RenderErrorCode.TransitionTooLong, ex.Code);
    }

    [Fact]
    public void Accepts_a_transition_up_to_half_the_shorter_neighbour()
    {
        RenderTimeline.Validate(Frames(60, 90), Frames(30));   // must not throw
    }

    [Fact]
    public void Rejects_an_empty_or_zero_length_timeline()
    {
        Assert.Equal(RenderErrorCode.NoScenes,
            Assert.Throws<RenderException>(() => RenderTimeline.Validate([], [])).Code);

        Assert.Equal(RenderErrorCode.InvalidSceneDuration,
            Assert.Throws<RenderException>(() => RenderTimeline.Validate(Frames(0), [])).Code);
    }

    [Fact]
    public void Rejects_a_mismatched_transition_count() =>
        Assert.Throws<ArgumentException>(() =>
            RenderTimeline.XfadeOffsets(Frames(100, 200), Frames(10, 10)));

    [Theory]
    [InlineData(true, false, true)]    // all cuts, no music -> stream copy
    [InlineData(true, true, false)]    // music forces an audio re-encode
    [InlineData(false, false, false)]  // any transition forces a re-encode
    public void Stream_copy_is_only_possible_for_pure_cuts_without_music(
        bool allCuts, bool hasMusic, bool expected)
    {
        var durations = allCuts ? Frames(0, 0) : Frames(15, 0);

        Assert.Equal(expected, RenderTimeline.CanStreamCopy(durations, hasMusic));
    }
}
