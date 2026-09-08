using AnimStudio.Application.Clips;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// The running-order matcher.
/// <para>
/// Worth this much coverage because its failure mode is silent. A mis-matched line does
/// not throw and does not warn - it produces a finished video with two clips swapped,
/// which is only discovered by watching the whole thing.
/// </para>
/// </summary>
public class ClipOrderResolverTests
{
    private static IReadOnlyList<ClipCandidate> Clips(params string[] names) =>
        [.. names.Select((name, index) => new ClipCandidate($"id{index}", name))];

    private static string[] Names(ClipOrderResult result, IReadOnlyList<ClipCandidate> clips) =>
        [.. result.AssetIds.Select(id => clips.First(c => c.AssetId == id).Name)];

    // --- natural order ------------------------------------------------------

    [Fact]
    public void Filename_order_counts_rather_than_spells()
    {
        // The whole reason NaturalNameComparer exists: an ordinal sort puts clip10
        // between clip1 and clip2, so "just use filename order" would scramble the video.
        var clips = Clips("clip10.mp4", "clip2.mp4", "clip1.mp4");

        var ordered = ClipOrderResolver.NaturalOrder(clips)
            .Select(id => clips.First(c => c.AssetId == id).Name);

        Assert.Equal(["clip1.mp4", "clip2.mp4", "clip10.mp4"], ordered);
    }

    [Fact]
    public void Zero_padding_does_not_change_the_order()
    {
        var clips = Clips("007-end.mp4", "7-end-alt.mp4", "2-mid.mp4");

        var ordered = ClipOrderResolver.NaturalOrder(clips)
            .Select(id => clips.First(c => c.AssetId == id).Name);

        Assert.Equal("2-mid.mp4", ordered.First());
    }

    // --- matching -----------------------------------------------------------

    [Fact]
    public void Matches_bare_filenames_in_the_order_given()
    {
        var clips = Clips("intro.mp4", "body.mp4", "outro.mp4");

        var result = ClipOrderResolver.FromText(clips, "outro.mp4\nintro.mp4\nbody.mp4");

        Assert.Equal(["outro.mp4", "intro.mp4", "body.mp4"], Names(result, clips));
        Assert.True(result.IsExact);
    }

    [Theory]
    [InlineData("1. outro\n2. intro\n3. body")]
    [InlineData("1) outro\n2) intro\n3) body")]
    [InlineData("- outro\n- intro\n- body")]
    [InlineData("outro, intro, body")]
    [InlineData("outro | intro | body")]
    [InlineData("  OUTRO  \n  Intro  \n  BODY  ")]
    public void Reads_a_list_however_it_was_written(string text)
    {
        var clips = Clips("intro.mp4", "body.mp4", "outro.mp4");

        var result = ClipOrderResolver.FromText(clips, text);

        Assert.Equal(["outro.mp4", "intro.mp4", "body.mp4"], Names(result, clips));
    }

    [Fact]
    public void Ignores_punctuation_spacing_and_case_differences()
    {
        var clips = Clips("Part 2.mp4", "PART_1.MP4");

        var result = ClipOrderResolver.FromText(clips, "part-2\npart 1");

        Assert.Equal(["Part 2.mp4", "PART_1.MP4"], Names(result, clips));
        Assert.True(result.IsExact);
    }

    [Fact]
    public void A_filename_beats_a_position_when_the_line_could_be_either()
    {
        // "03" is both a valid position and this clip's actual name. The name must win, or
        // a set of clips named by number would be reordered into the sequence it was
        // already in - a bug that looks like the feature doing nothing.
        var clips = Clips("01-titles.mp4", "02-interview.mp4", "03-credits.mp4");

        var result = ClipOrderResolver.FromText(clips, "03\n01\n02");

        Assert.Equal(["03-credits.mp4", "01-titles.mp4", "02-interview.mp4"], Names(result, clips));
    }

    [Fact]
    public void Falls_back_to_reading_a_number_as_a_position()
    {
        // Nothing here is named after a number, so "2" can only mean "the second one".
        var clips = Clips("alpha.mp4", "beta.mp4", "gamma.mp4");

        var result = ClipOrderResolver.FromText(clips, "3\n1\n2");

        Assert.Equal(["gamma.mp4", "alpha.mp4", "beta.mp4"], Names(result, clips));
    }

    [Fact]
    public void Finds_a_clip_from_part_of_its_name()
    {
        var clips = Clips("01_intro_final_v3.mp4", "02_body_final_v3.mp4");

        var result = ClipOrderResolver.FromText(clips, "body\nintro");

        Assert.Equal(["02_body_final_v3.mp4", "01_intro_final_v3.mp4"], Names(result, clips));
    }

    // --- the awkward cases --------------------------------------------------

    [Fact]
    public void Clips_the_text_never_mentioned_are_kept_at_the_end_and_reported()
    {
        // Dropping them would silently shorten the video, which is far worse than an
        // ordering that is merely incomplete.
        var clips = Clips("intro.mp4", "body.mp4", "outro.mp4");

        var result = ClipOrderResolver.FromText(clips, "outro.mp4");

        Assert.Equal(["outro.mp4", "body.mp4", "intro.mp4"], Names(result, clips));
        Assert.Equal(2, result.AppendedAssetIds.Count);
        Assert.False(result.IsExact);
    }

    [Fact]
    public void Never_loses_or_duplicates_a_clip_however_bad_the_text_is()
    {
        var clips = Clips("a.mp4", "b.mp4", "c.mp4");

        var result = ClipOrderResolver.FromText(clips, "b.mp4\nb.mp4\nnonsense\n\n99");

        Assert.Equal(3, result.AssetIds.Count);
        Assert.Equal(3, result.AssetIds.Distinct().Count());
        Assert.Equal(["a.mp4", "b.mp4", "c.mp4"], Names(result, clips).Order());
    }

    [Fact]
    public void Reports_a_repeated_line_as_a_duplicate_rather_than_a_mystery()
    {
        var clips = Clips("intro.mp4", "body.mp4");

        var result = ClipOrderResolver.FromText(clips, "intro\nintro\nbody");

        Assert.Equal(ClipOrderMatch.Matched, result.Lines[0].Match);
        Assert.Equal(ClipOrderMatch.Duplicate, result.Lines[1].Match);
        Assert.Equal(ClipOrderMatch.Matched, result.Lines[2].Match);
    }

    [Fact]
    public void Reports_a_line_nothing_resembles_as_unmatched()
    {
        var clips = Clips("intro.mp4");

        var result = ClipOrderResolver.FromText(clips, "something else entirely");

        Assert.Equal(ClipOrderMatch.Unmatched, Assert.Single(result.Lines).Match);
    }

    [Fact]
    public void Leaves_an_ambiguous_line_alone_instead_of_guessing()
    {
        // "final" describes both. Picking one at random would put a clip in a place the
        // user did not ask for and had no way to see.
        var clips = Clips("intro-final.mp4", "outro-final.mp4");

        var result = ClipOrderResolver.FromText(clips, "final");

        Assert.Equal(ClipOrderMatch.Ambiguous, Assert.Single(result.Lines).Match);
        Assert.Equal(2, result.AppendedAssetIds.Count);
    }

    [Fact]
    public void A_multi_line_list_is_not_split_on_commas_inside_a_filename()
    {
        var clips = Clips("hello, world.mp4", "second.mp4");

        var result = ClipOrderResolver.FromText(clips, "second.mp4\nhello, world.mp4");

        Assert.Equal(["second.mp4", "hello, world.mp4"], Names(result, clips));
        Assert.True(result.IsExact);
    }

    [Fact]
    public void Empty_text_leaves_the_selection_in_filename_order()
    {
        var clips = Clips("b.mp4", "a.mp4");

        var result = ClipOrderResolver.FromText(clips, "   ");

        Assert.Equal(["a.mp4", "b.mp4"], Names(result, clips));
        Assert.Empty(result.Lines);
        Assert.False(result.IsExact);
    }

    [Fact]
    public void Caps_how_many_lines_one_paste_can_cost()
    {
        var clips = Clips("a.mp4");
        var text = string.Join('\n', Enumerable.Range(0, ClipOrderLimits.MaxLines + 50)
            .Select(i => $"line {i}"));

        var result = ClipOrderResolver.FromText(clips, text);

        Assert.Equal(ClipOrderLimits.MaxLines, result.Lines.Count);
    }
}
