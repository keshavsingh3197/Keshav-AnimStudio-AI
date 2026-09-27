using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// The music duck envelope, asserted as filtergraph text with no ffmpeg installed.
/// <para>
/// The point of these is that a duck the editor hears in the preview reaches the render.
/// Before the overlap rules were unified, "duck the music under this clip" existed only in
/// the browser: the export path folded every rule into the clip's own volume, which cannot
/// express lowering a DIFFERENT source, so the music came back at full level in the file.
/// </para>
/// </summary>
public class MusicDuckGraphTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    private static MergePlan Plan(params MergeDuckWindow[] windows) =>
        new()
        {
            Canvas = Canvas.Hd1080p30,
            // Two scenes with a crossfade: the concat path is a stream copy and never
            // reaches the audio graph at all.
            Scenes =
            [
                new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300),
                    new TransitionSettings(SceneTransition.Fade, new FrameCount(15))),
                new MergeSceneInput("clips/clip_002.mp4", new FrameCount(300), TransitionSettings.None)
            ],
            BackgroundMusicRelativePath = "music/bed.mp3",
            BackgroundMusicVolume = 0.4,
            MusicDuckWindows = windows,
            OutputRelativePath = "out/final.mp4"
        };

    [Fact]
    public void A_duck_window_lowers_the_music_bed_rather_than_the_clips()
    {
        var built = NewBuilder().BuildMerge(Plan(new MergeDuckWindow(2.0, 6.0, 0.25)));

        // The envelope rides on the music chain, between the bed filter and its output pad.
        Assert.Contains("eval=frame", built.FilterComplex);
        Assert.Contains("0.25", built.FilterComplex);
        Assert.Contains("[music]", built.FilterComplex);
    }

    [Fact]
    public void Ramps_instead_of_stepping_so_the_duck_does_not_click()
    {
        var built = NewBuilder().BuildMerge(Plan(new MergeDuckWindow(2.0, 6.0, 0.25)));

        // min(attack, release) is what makes the gain slope in and out; a bare "if(between"
        // would be the hard step this deliberately avoids.
        Assert.Contains("min(", built.FilterComplex);
        Assert.DoesNotContain("if(between", built.FilterComplex);
    }

    [Fact]
    public void Overlapping_windows_multiply_rather_than_first_match_winning()
    {
        var built = NewBuilder().BuildMerge(Plan(
            new MergeDuckWindow(0.0, 5.0, 0.5),
            new MergeDuckWindow(4.0, 9.0, 0.5)));

        // Two terms joined by '*', inside one volume expression - not two volume filters.
        var volumeFilters = built.FilterComplex.Split("volume=").Length - 1;
        Assert.Contains("*(1+", built.FilterComplex);
        // One for the bed's own level, one for the envelope.
        Assert.Equal(2, volumeFilters);
    }

    [Fact]
    public void No_windows_leaves_the_music_graph_exactly_as_it_was()
    {
        var withoutDuck = NewBuilder().BuildMerge(Plan());
        var withNoOpDuck = NewBuilder().BuildMerge(Plan(new MergeDuckWindow(2.0, 6.0, 1.0)));

        // A window at full level is not a duck, so it must not add an expression - an
        // unducked render should produce byte-identical filtergraph text.
        Assert.DoesNotContain("eval=frame", withoutDuck.FilterComplex);
        Assert.Equal(withoutDuck.FilterComplex, withNoOpDuck.FilterComplex);
    }

    [Fact]
    public void An_inverted_window_is_ignored_rather_than_producing_a_bad_graph()
    {
        var built = NewBuilder().BuildMerge(Plan(new MergeDuckWindow(6.0, 2.0, 0.25)));

        // End before start would make the ramp divisor negative and the gain nonsense.
        Assert.DoesNotContain("eval=frame", built.FilterComplex);
    }

    [Fact]
    public void The_expression_escapes_its_commas_so_the_filter_chain_survives()
    {
        var built = NewBuilder().BuildMerge(Plan(new MergeDuckWindow(2.0, 6.0, 0.25)));

        // An unescaped comma inside min(a,b) would end the volume filter early and leave
        // the rest of the expression parsed as its own filter - a graph that fails loudly
        // at best and silently drops the duck at worst.
        Assert.Contains("\\,", built.FilterComplex);
    }
}
