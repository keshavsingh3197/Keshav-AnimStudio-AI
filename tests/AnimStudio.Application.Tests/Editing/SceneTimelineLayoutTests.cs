using AnimStudio.Application.Scenes;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Editing;

/// <summary>
/// A scene-based project laid out for the Video editor: every scene where the render puts it, its narration cut where
/// the next scene takes over, and its subtitles on the finished video's clock.
/// </summary>
public sealed class SceneTimelineLayoutTests
{
    private static readonly FrameRate Thirty = new(30, 1);

    private static Scene SceneOf(int number, int frames, SceneTransition transition = SceneTransition.Fade, int transitionFrames = 15,
        string? audio = null, params DialogueLine[] lines) => new()
    {
        Id = $"scene-{number}",
        SceneNumber = number,
        DurationFrames = frames,
        BackgroundAssetId = $"img-{number}",
        TransitionToNext = transition,
        TransitionDurationFrames = transitionFrames,
        Animation = new AnimationSettings(BackgroundEffect.ZoomIn, 0.12),
        Audio = new SceneAudio { AssetId = audio },
        Dialogue = [.. lines]
    };

    private static DialogueLine Line(string text, int from, int to) => new() { Text = text, RelativeStartFrame = from, RelativeEndFrame = to };

    [Fact]
    public void Each_scene_starts_where_the_render_starts_it_and_the_whole_runs_as_long()
    {
        var laid = SceneTimelineLayout.Build([SceneOf(1, 90), SceneOf(2, 120), SceneOf(3, 60)], Thirty);

        Assert.Equal([0, 2.5, 6.0], laid.Scenes.Select(s => s.StartSeconds));
        Assert.Equal([2.5, 3.5, 2.0], laid.Scenes.Select(s => s.Seconds));
        // 90 + 120 + 60 frames, less two half-second fades: what the render makes.
        Assert.Equal(8.0, laid.TotalSeconds);
    }

    [Fact]
    public void The_last_scene_and_a_cut_take_nothing_off()
    {
        var laid = SceneTimelineLayout.Build([SceneOf(1, 90, SceneTransition.None), SceneOf(2, 60)], Thirty);

        Assert.Equal([3.0, 2.0], laid.Scenes.Select(s => s.Seconds));
        Assert.All(laid.Scenes, s => Assert.Equal(SceneTransition.None, s.Transition));
        Assert.Equal(5.0, laid.TotalSeconds);
    }

    [Fact]
    public void Narration_plays_until_the_next_scene_takes_over()
    {
        var laid = SceneTimelineLayout.Build([SceneOf(1, 90, audio: "vo-1"), SceneOf(2, 60, audio: "vo-2"), SceneOf(3, 30)], Thirty);

        var first = laid.Scenes[0].Audio!;
        Assert.Equal(("vo-1", 0, 0, 2.5), (first.AssetId, first.StartSeconds, first.TrimStartSeconds, first.Seconds));
        var second = laid.Scenes[1].Audio!;
        Assert.Equal((2.5, 1.5), (second.StartSeconds, second.Seconds));
        Assert.Null(laid.Scenes[2].Audio);
    }

    [Fact]
    public void A_slice_of_a_longer_recording_plays_from_its_own_start_and_no_further_than_its_end()
    {
        var scene = SceneOf(1, 150, SceneTransition.None);
        scene.Audio = new SceneAudio { AssetId = "long", SliceStartSeconds = 40, SliceEndSeconds = 43 };

        var audio = SceneTimelineLayout.Build([scene], Thirty).Scenes[0].Audio!;

        Assert.Equal((40, 3), (audio.TrimStartSeconds, audio.Seconds));
    }

    [Fact]
    public void Subtitles_are_on_the_videos_clock_and_end_where_their_scene_hands_over()
    {
        var laid = SceneTimelineLayout.Build(
        [
            SceneOf(1, 90, lines: [Line("First", 0, 45), Line("Runs into the fade", 60, 90)]),
            SceneOf(2, 60, lines: [Line("  ", 0, 30), Line("Second", 6, 54)])
        ], Thirty);

        var first = laid.Scenes[0].Captions;
        Assert.Equal(["First", "Runs into the fade"], first.Select(c => c.Text));
        Assert.Equal((2.0, 2.5), (first[1].StartSeconds, first[1].EndSeconds));
        var second = Assert.Single(laid.Scenes[1].Captions);
        Assert.Equal((2.7, 4.3), (second.StartSeconds, second.EndSeconds));
    }
}
