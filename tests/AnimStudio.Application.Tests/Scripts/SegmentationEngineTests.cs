using AnimStudio.Application.Scripts;
using AnimStudio.Domain.Scripts;
using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Tests.Scripts;

public class SegmentationEngineTests
{
    private static TranscriptCue Cue(int index, double start, double end, string text, string? speaker = null) =>
        new()
        {
            Index = index,
            Start = TimeSpan.FromSeconds(start),
            End = TimeSpan.FromSeconds(end),
            Text = text,
            SpeakerLabel = speaker,
            RawStart = TimeSpan.FromSeconds(start),
            RawEnd = TimeSpan.FromSeconds(end),
            SourceIndex = index
        };

    private static readonly SegmentationEngine Engine = new();

    [Fact]
    public void Merges_short_adjacent_cues_from_one_speaker_into_a_single_segment()
    {
        // Two-second caption fragments must not become two separate scenes.
        var cues = new[]
        {
            Cue(0, 0.0, 1.2, "We are going", "Rahul"),
            Cue(1, 1.3, 2.4, "to the park today.", "Rahul")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        Assert.Single(segments);
        Assert.Equal(2, segments[0].Lines.Count);
    }

    [Fact]
    public void Breaks_on_speaker_change()
    {
        var cues = new[]
        {
            Cue(0, 0.0, 2.0, "Hello Priya.", "Rahul"),
            Cue(1, 2.1, 4.0, "Hello Rahul.", "Priya")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        Assert.Equal(2, segments.Count);
        Assert.Equal(SegmentBreakReason.SpeakerChange, segments[0].BreakReason);
        Assert.Equal("rahul", segments[0].DominantSpeakerKey);
        Assert.Equal("priya", segments[1].DominantSpeakerKey);
    }

    [Fact]
    public void Breaks_on_a_hard_pause_even_below_the_minimum_length()
    {
        // A long silence is a real scene boundary regardless of segment length.
        var cues = new[]
        {
            Cue(0, 0.0, 0.8, "Wait.", "Rahul"),
            Cue(1, 6.0, 8.0, "Now we can go.", "Rahul")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        Assert.Equal(2, segments.Count);
        Assert.Equal(SegmentBreakReason.HardPause, segments[0].BreakReason);
    }

    [Fact]
    public void Never_exceeds_the_maximum_segment_length()
    {
        var options = new SegmentationOptions { MaxSegmentSeconds = 6.0 };
        var cues = Enumerable.Range(0, 20)
            .Select(i => Cue(i, i * 1.0, i * 1.0 + 0.9, $"Line {i} continues on.", "Rahul"))
            .ToArray();

        var segments = Engine.Segment(cues, options);

        Assert.All(segments, s =>
            Assert.True(s.SourceDuration <= TimeSpan.FromSeconds(6.0),
                $"segment ran {s.SourceDuration.TotalSeconds:F2}s, over the 6s cap"));
    }

    [Fact]
    public void Keeps_a_single_long_cue_as_one_segment_rather_than_splitting_mid_cue()
    {
        var options = new SegmentationOptions { MaxSegmentSeconds = 6.0 };
        var cues = new[] { Cue(0, 0.0, 20.0, "One very long uninterrupted monologue.", "Rahul") };

        var segments = Engine.Segment(cues, options);

        Assert.Single(segments);
        Assert.Equal(TimeSpan.FromSeconds(20), segments[0].SourceDuration);
    }

    [Fact]
    public void Preserves_source_timings_exactly_while_making_the_timeline_contiguous()
    {
        // The two-clock invariant: gap policy changes the OUTPUT timeline, but the source
        // positions that audio is sliced from must survive untouched.
        var cues = new[]
        {
            Cue(0, 10.0, 12.0, "First line.", "Rahul"),
            Cue(1, 20.0, 22.0, "Second line.", "Priya")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        Assert.Equal(2, segments.Count);
        Assert.Equal(TimeSpan.FromSeconds(10), segments[0].SourceStart);
        Assert.Equal(TimeSpan.FromSeconds(20), segments[1].SourceStart);
        Assert.Equal(TimeSpan.FromSeconds(22), segments[1].SourceEnd);

        // Timeline is rebased to zero and leaves no gap.
        Assert.Equal(TimeSpan.Zero, segments[0].TimelineStart);
        Assert.Equal(segments[0].TimelineEnd, segments[1].TimelineStart);
    }

    [Fact]
    public void Line_relative_offsets_are_measured_from_their_own_segment_start()
    {
        var cues = new[]
        {
            Cue(0, 10.0, 12.0, "First.", "Rahul"),
            Cue(1, 12.2, 14.0, "Still me.", "Rahul")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        var segment = Assert.Single(segments);
        Assert.Equal(TimeSpan.Zero, segment.Lines[0].RelativeStart);
        Assert.True((segment.Lines[1].RelativeStart - TimeSpan.FromSeconds(2.2)).Duration()
                   < TimeSpan.FromMilliseconds(1),
            $"expected ~2.2s, got {segment.Lines[1].RelativeStart.TotalSeconds:F3}s");
    }

    [Fact]
    public void Is_deterministic_so_re_ingest_can_diff_instead_of_replace()
    {
        var cues = new[]
        {
            Cue(0, 0.0, 2.0, "Hello.", "Rahul"),
            Cue(1, 2.5, 5.0, "Goodbye.", "Priya")
        };
        var options = new SegmentationOptions();

        var first = Engine.Segment(cues, options);
        var second = Engine.Segment(cues, options);

        Assert.Equal(
            first.Select(s => s.SegmentKey),
            second.Select(s => s.SegmentKey));
    }

    [Fact]
    public void Segment_keys_ignore_timing_so_a_caption_reflow_does_not_orphan_scenes()
    {
        // Shifting every cue by 200ms must not change any segment key - otherwise a
        // re-ingest would discard all the user's manual scene edits.
        var options = new SegmentationOptions();
        var original = new[]
        {
            Cue(0, 0.0, 2.0, "Hello.", "Rahul"),
            Cue(1, 2.5, 5.0, "Goodbye.", "Priya")
        };
        var shifted = new[]
        {
            Cue(0, 0.2, 2.2, "Hello.", "Rahul"),
            Cue(1, 2.7, 5.2, "Goodbye.", "Priya")
        };

        Assert.Equal(
            Engine.Segment(original, options).Select(s => s.SegmentKey),
            Engine.Segment(shifted, options).Select(s => s.SegmentKey));
    }

    [Fact]
    public void Distinguishes_a_genuinely_repeated_line_within_one_script()
    {
        var cues = new[]
        {
            Cue(0, 0.0, 2.0, "Here we go.", "Rahul"),
            Cue(1, 5.0, 7.0, "Here we go.", "Rahul")
        };

        var segments = Engine.Segment(cues, new SegmentationOptions());

        Assert.Equal(2, segments.Count);
        Assert.NotEqual(segments[0].SegmentKey, segments[1].SegmentKey);
    }

    [Fact]
    public void Orders_crosstalk_by_when_it_was_spoken()
    {
        var cues = new[]
        {
            Cue(0, 1.0, 6.0, "I was saying that", "Rahul") with { IsOverlapping = true },
            Cue(1, 3.0, 7.0, "Sorry to interrupt", "Priya") with { IsOverlapping = true }
        };

        var segments = Engine.Segment(cues, new SegmentationOptions { SpeakerChangeBreaks = false });

        var lines = segments.SelectMany(s => s.Lines).ToList();
        Assert.Equal(2, lines.Count);
        Assert.True(lines[0].SourceStart <= lines[1].SourceStart);
    }

    [Fact]
    public void Returns_nothing_for_an_empty_transcript() =>
        Assert.Empty(Engine.Segment([], new SegmentationOptions()));
}
