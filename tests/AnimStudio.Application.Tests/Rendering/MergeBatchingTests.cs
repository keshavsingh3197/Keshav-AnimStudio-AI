using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Splitting a crossfade join into bounded passes.
/// <para>
/// The arithmetic here is the whole risk of the feature. Every batch boundary is a place
/// where a transition can be applied twice, dropped, or counted against the wrong pair of
/// clips - and none of those show up as an error, only as a finished video that is a few
/// frames wrong at every seam.
/// </para>
/// </summary>
public class MergeBatchingTests
{
    private static TransitionSettings Fade(int frames) =>
        new(SceneTransition.Fade, new FrameCount(frames));

    /// <summary>n clips of 100 frames each, joined by 10-frame fades.</summary>
    private static List<MergeSceneInput> Scenes(int n, int transition = 10) =>
        [.. Enumerable.Range(0, n).Select(i => new MergeSceneInput(
            $"clips/clip_{i + 1:D3}.mp4",
            new FrameCount(100),
            i == n - 1 ? TransitionSettings.None : Fade(transition)))];

    [Fact]
    public void A_short_stitch_is_left_alone()
    {
        // The single-pass graph is the one that has been exercised the longest, and for a
        // handful of clips its memory cost is unremarkable. Batching it would buy nothing
        // and cost an encode generation.
        Assert.False(MergeBatching.NeedsBatching(8, isStreamCopy: false, 8));
        Assert.True(MergeBatching.NeedsBatching(9, isStreamCopy: false, 8));
    }

    [Fact]
    public void A_stream_copy_is_never_batched_however_many_clips()
    {
        // The concat demuxer reads one input at a time, so the problem batching solves -
        // memory that grows with the input count - does not exist there. Splitting it would
        // turn a lossless, seconds-long copy into a re-encode.
        Assert.False(MergeBatching.NeedsBatching(500, isStreamCopy: true, 8));
    }

    [Fact]
    public void Batches_are_consecutive_and_in_order()
    {
        // These are consecutive pieces of one timeline. Any regrouping that does not
        // preserve order silently reorders the video.
        var split = MergeBatching.Split(Scenes(10), 4);

        Assert.Equal([4, 4, 2], split.Batches.Select(b => b.Scenes.Count));
        Assert.Equal(
            ["clips/clip_001.mp4", "clips/clip_005.mp4", "clips/clip_009.mp4"],
            split.Batches.Select(b => b.Scenes[0].RelativePath));
    }

    [Fact]
    public void The_transition_at_a_boundary_moves_up_a_level_instead_of_being_applied_twice()
    {
        // Clip 4's fade joins it to clip 5, which is in the NEXT batch - so this pass must
        // not consume it, and the pass above must. Applying it in both is how you lose ten
        // frames per seam; applying it in neither is how a crossfade becomes a hard cut.
        var split = MergeBatching.Split(Scenes(8), 4);

        var first = split.Batches[0];

        Assert.Equal(Fade(10), first.TransitionToNext);
        Assert.Equal(TransitionSettings.None, first.Scenes[^1].TransitionToNext);

        // The three transitions strictly inside the batch are still there.
        Assert.Equal([Fade(10), Fade(10), Fade(10), TransitionSettings.None],
            first.Scenes.Select(s => s.TransitionToNext));
    }

    [Fact]
    public void The_last_batch_carries_no_transition_out()
    {
        var split = MergeBatching.Split(Scenes(9), 4);

        Assert.Equal(TransitionSettings.None, split.Batches[^1].TransitionToNext);
    }

    [Fact]
    public void A_batch_output_length_counts_only_the_transitions_inside_it()
    {
        // 4 clips of 100 with 3 internal 10-frame fades: 400 - 30 = 370. The boundary fade
        // is deliberately NOT subtracted here - it is subtracted by the pass that applies
        // it, one level up.
        var split = MergeBatching.Split(Scenes(8), 4);

        Assert.Equal(370, split.Batches[0].OutputLength.Value);
    }

    [Fact]
    public void The_cascade_preserves_the_total_length_exactly()
    {
        // The property that matters, stated end to end: however the clips are grouped, the
        // finished video is the same length as a single-pass join of the same timeline.
        var scenes = Scenes(24);

        var expected = RenderTimeline.TotalLength(
            [.. scenes.Select(s => s.Length)],
            [.. scenes.Take(scenes.Count - 1).Select(s => s.TransitionToNext.Duration)]);

        var current = (IReadOnlyList<MergeSceneInput>)scenes;

        while (MergeBatching.NeedsBatching(current.Count, false, 8))
        {
            var split = MergeBatching.Split(current, 8);

            current = [.. split.Batches.Select(b => b.IsPassThrough
                ? b.Scenes[0] with { TransitionToNext = b.TransitionToNext }
                : new MergeSceneInput("x", b.OutputLength, b.TransitionToNext))];
        }

        var actual = RenderTimeline.TotalLength(
            [.. current.Select(s => s.Length)],
            [.. current.Take(current.Count - 1).Select(s => s.TransitionToNext.Duration)]);

        Assert.Equal(expected.Value, actual.Value);
    }

    [Fact]
    public void A_leftover_single_clip_is_passed_through_rather_than_re_encoded()
    {
        // 9 clips at 8 per pass leaves a batch of one. Re-encoding a file to itself spends a
        // whole generation of quality to change nothing.
        var split = MergeBatching.Split(Scenes(9), 8);

        Assert.True(split.Batches[1].IsPassThrough);
        Assert.Equal(100, split.Batches[1].OutputLength.Value);
    }

    [Fact]
    public void A_batch_size_below_two_is_refused_rather_than_looping_forever()
    {
        // A size of one would reduce nothing each pass, so the cascade would never
        // terminate. Clamping beats hanging on a configuration typo.
        var split = MergeBatching.Split(Scenes(4), 1);

        Assert.All(split.Batches, b => Assert.Equal(2, b.Scenes.Count));
    }

    [Fact]
    public void Cuts_between_clips_are_not_counted_as_transitions()
    {
        // A hard cut has a duration on the record but consumes nothing, so a batch of cut
        // clips is exactly as long as its parts.
        var scenes = (IReadOnlyList<MergeSceneInput>)[.. Enumerable.Range(0, 4)
            .Select(i => new MergeSceneInput($"c{i}", new FrameCount(100), TransitionSettings.None))];

        Assert.Equal(400, MergeBatching.Split(scenes, 4).Batches[0].OutputLength.Value);
    }
}
