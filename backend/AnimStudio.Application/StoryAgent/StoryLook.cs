using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>How one scene moves and how it leads into the next.</summary>
public sealed record StorySceneLook(BackgroundEffect Effect, double Intensity, SceneTransition Transition, double TransitionSeconds);

/// <summary>
/// Picks each scene's motion and the cut into the next from what the scene is about - its mood, where it falls in the
/// story - in the feel the person chose. A new take picks differently where there is more than one good choice.
/// </summary>
/// <remarks>
/// <para>
/// Restraint is the rule: these are narrated stories, and a viewer should notice the words, not the editing. Calm scenes
/// get slow pushes and soft crossfades; a turn into drama gets a quicker move and a shorter cut; wonder gets a reveal.
/// The first scene pushes in to open the story and the last pulls back to close it.
/// </para>
/// <para>
/// A scene the person set by hand (<see cref="StoryScene.LookPinned"/>) keeps what they set. A scene with a moving clip
/// does not move its picture: the clip already moves.
/// </para>
/// </remarks>
public static class StoryLook
{
    public const double DefaultTransitionSeconds = 0.5;
    public const double MinIntensity = 0.04;
    public const double MaxIntensity = 0.25;
    public const double MaxTransitionSeconds = 1.5;

    private enum Feel { Calm, Intense, Joyful, Somber, Wonder }

    private static readonly (Feel Feel, string[] Words)[] Moods =
    [
        (Feel.Intense, ["dramatic", "tense", "intense", "fierce", "angry", "anger", "urgent", "ominous", "dark", "fear", "epic", "powerful", "battle", "war", "conflict", "rage", "danger", "storm"]),
        (Feel.Joyful, ["joy", "happy", "festive", "celebrat", "playful", "triumph", "cheer", "uplift", "victor", "delight", "excite"]),
        (Feel.Somber, ["sad", "sorrow", "somber", "sombre", "melanchol", "grief", "longing", "reflect", "nostalg", "lonely", "loss", "regret"]),
        (Feel.Wonder, ["awe", "wonder", "divine", "myster", "mystic", "majest", "sacred", "revelat", "miracle", "cosmic", "heaven", "blessing"])
    ];

    /// <summary>A look for every scene, in order. <paramref name="durations"/> are the scenes' lengths in seconds.</summary>
    public static IReadOnlyList<StorySceneLook> Plan(
        IReadOnlyList<StoryScene> scenes, IReadOnlyList<double> durations, StoryFormat format, StoryLookStyle style, int take,
        Func<StoryScene, bool>? playsClip = null)
    {
        playsClip ??= s => !string.IsNullOrEmpty(s.VideoKey);
        var looks = new List<StorySceneLook>(scenes.Count);
        var previous = BackgroundEffect.None;

        for (var i = 0; i < scenes.Count; i++)
        {
            var scene = scenes[i];
            var last = i == scenes.Count - 1;
            var feel = FeelOf(scene);

            var pinned = Pinned(scene);
            var effect = pinned?.Effect ?? PickEffect(i, scenes.Count, feel, style, format, take, previous);
            var intensity = pinned?.Intensity ?? Intensity(feel, style);
            // A moving clip carries its own motion; a camera move on top of it would fight it.
            if (playsClip(scene)) effect = BackgroundEffect.None;

            SceneTransition transition;
            double seconds;
            if (last)
            {
                (transition, seconds) = (SceneTransition.None, 0);
            }
            else if (pinned is not null)
            {
                (transition, seconds) = (pinned.Transition, pinned.TransitionSeconds);
            }
            else
            {
                (transition, seconds) = PickTransition(i, feel, FeelOf(scenes[i + 1]), style, format, take);
            }

            // A cut never eats more than a third of either scene it joins, or the words under it get lost in the blend.
            if (!last && transition != SceneTransition.None)
            {
                var room = Math.Min(Duration(durations, i), Duration(durations, i + 1)) / 3;
                seconds = Math.Round(Math.Clamp(seconds, 0.2, Math.Max(0.2, Math.Min(room, MaxTransitionSeconds))), 2);
            }

            looks.Add(new StorySceneLook(effect, Math.Round(Math.Clamp(intensity, MinIntensity, MaxIntensity), 3), transition, seconds));
            previous = effect;
        }

        return looks;
    }

    /// <summary>
    /// The motion of a scene's further picture (<paramref name="shot"/> counts from 1): a move that answers the one before
    /// it rather than repeating it, up and down on a tall frame.
    /// </summary>
    public static BackgroundEffect ShotEffect(BackgroundEffect previous, int shot, StoryFormat format)
    {
        BackgroundEffect[] cycle = format == StoryFormat.Vertical
            ? [BackgroundEffect.ZoomOut, BackgroundEffect.PanUp, BackgroundEffect.ZoomIn, BackgroundEffect.PanDown]
            : [BackgroundEffect.ZoomOut, BackgroundEffect.PanRight, BackgroundEffect.ZoomIn, BackgroundEffect.PanLeft];
        for (var step = 0; step < cycle.Length; step++)
        {
            var pick = cycle[(shot + step) % cycle.Length];
            if (pick != previous) return pick;
        }

        return cycle[0];
    }

    /// <summary>
    /// The cut from one picture of a scene to the next (<paramref name="shot"/> counts from 1). The words carry on across
    /// it, so it is softer than a cut between scenes: a dissolve, except in the quicker feels.
    /// </summary>
    public static (SceneTransition Kind, double Seconds) ShotTransition(StoryLookStyle style, StoryFormat format, int shot)
    {
        var slide = format == StoryFormat.Vertical
            ? (shot % 2 == 1 ? SceneTransition.SlideUp : SceneTransition.SlideDown)
            : (shot % 2 == 1 ? SceneTransition.SlideLeft : SceneTransition.SlideRight);

        return style switch
        {
            StoryLookStyle.Gentle => (SceneTransition.Fade, 0.6),
            StoryLookStyle.Cinematic => (SceneTransition.Fade, 0.7),
            StoryLookStyle.Lively => (slide, 0.35),
            StoryLookStyle.MusicVideo => (shot % 3) switch
            {
                1 => (SceneTransition.ZoomIn, 0.35),
                2 => (SceneTransition.Blur, 0.4),
                _ => (SceneTransition.DiagonalWipe, 0.45)
            },
            _ => (SceneTransition.Fade, 0.45)
        };
    }

    /// <summary>A pinned scene's own choices, read back from the names saved with it; null when it has none that parse.</summary>
    private static StorySceneLook? Pinned(StoryScene scene)
    {
        if (!scene.LookPinned || !Enum.TryParse<BackgroundEffect>(scene.Effect, out var effect)) return null;

        var transition = Enum.TryParse<SceneTransition>(scene.Transition, out var parsed) ? parsed : SceneTransition.Fade;
        return new StorySceneLook(effect, scene.EffectIntensity ?? 0.1, transition, scene.TransitionSeconds ?? DefaultTransitionSeconds);
    }

    private static Feel FeelOf(StoryScene scene)
    {
        var mood = scene.Mood?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(mood)) return Feel.Calm;

        foreach (var (feel, words) in Moods)
        {
            if (words.Any(w => mood.Contains(w, StringComparison.Ordinal))) return feel;
        }

        return Feel.Calm;
    }

    private static BackgroundEffect PickEffect(int index, int count, Feel feel, StoryLookStyle style, StoryFormat format, int take, BackgroundEffect previous)
    {
        // The story opens by moving in, and closes by pulling back. A new look varies the middle, not the bookends.
        if (index == 0) return BackgroundEffect.ZoomIn;
        if (index == count - 1 && count > 1) return BackgroundEffect.ZoomOut;

        BackgroundEffect[] choices = feel switch
        {
            Feel.Intense => [BackgroundEffect.ZoomIn, BackgroundEffect.PanRight, BackgroundEffect.PanLeft],
            Feel.Joyful => [BackgroundEffect.PanRight, BackgroundEffect.PanLeft, BackgroundEffect.ZoomIn],
            Feel.Somber => [BackgroundEffect.ZoomOut, BackgroundEffect.PanDown, BackgroundEffect.ZoomIn],
            Feel.Wonder => [BackgroundEffect.PanUp, BackgroundEffect.ZoomOut, BackgroundEffect.ZoomIn],
            _ => [BackgroundEffect.ZoomIn, BackgroundEffect.PanUp, BackgroundEffect.ZoomOut]
        };

        // Gentle keeps to slow pushes; a sideways pan on a tall frame shows little, so vertical videos prefer up and down.
        if (style == StoryLookStyle.Gentle) choices = [BackgroundEffect.ZoomIn, BackgroundEffect.ZoomOut, BackgroundEffect.PanUp];
        if (format == StoryFormat.Vertical)
        {
            choices = [.. choices.Select(e => e switch
            {
                BackgroundEffect.PanLeft => BackgroundEffect.PanUp,
                BackgroundEffect.PanRight => BackgroundEffect.PanDown,
                _ => e
            })];
        }

        // Each take starts one further along the list; the same move twice in a row reads as a loop, so it is skipped -
        // including the closing pull-back, which the scene before it must not use.
        var next = index == count - 2 ? BackgroundEffect.ZoomOut : BackgroundEffect.None;
        for (var step = 0; step < choices.Length; step++)
        {
            var pick = choices[(take + index + step) % choices.Length];
            if (pick != previous && pick != next) return pick;
        }

        return choices[0];
    }

    private static double Intensity(Feel feel, StoryLookStyle style)
    {
        var amount = feel switch
        {
            Feel.Intense => 0.16,
            Feel.Joyful or Feel.Wonder => 0.12,
            _ => 0.09
        };

        return style switch
        {
            StoryLookStyle.Gentle => Math.Min(amount, 0.08),
            StoryLookStyle.Cinematic => amount * 1.15,
            StoryLookStyle.Lively => amount * 1.35,
            StoryLookStyle.MusicVideo => amount * 1.4,
            _ => amount
        };
    }

    private static (SceneTransition Kind, double Seconds) PickTransition(
        int index, Feel from, Feel to, StoryLookStyle style, StoryFormat format, int take)
    {
        var slide = format == StoryFormat.Vertical
            ? (index % 2 == 0 ? SceneTransition.SlideUp : SceneTransition.SlideDown)
            : (index % 2 == 0 ? SceneTransition.SlideLeft : SceneTransition.SlideRight);
        var changes = from != to;

        (SceneTransition, double)[] choices = style switch
        {
            StoryLookStyle.Gentle => [(SceneTransition.Fade, 0.7), (SceneTransition.Fade, 0.9)],

            StoryLookStyle.MusicVideo => to switch
            {
                Feel.Somber => [(SceneTransition.FadeBlack, 0.5), (SceneTransition.Blur, 0.45), (SceneTransition.Fade, 0.6)],
                Feel.Wonder => [(SceneTransition.CircleCrop, 0.65), (SceneTransition.CircleOpen, 0.6), (SceneTransition.Blur, 0.45)],
                _ => [(SceneTransition.ZoomIn, 0.35), (SceneTransition.Blur, 0.4), (SceneTransition.DiagonalWipe, 0.45),
                      (SceneTransition.CircleCrop, 0.6), (slide, 0.35)]
            },

            StoryLookStyle.Lively => to switch
            {
                Feel.Intense => [(SceneTransition.ZoomIn, 0.3), (slide, 0.3)],
                Feel.Calm or Feel.Somber => [(SceneTransition.Fade, 0.4), (slide, 0.35)],
                _ => [(slide, 0.35), (SceneTransition.ZoomIn, 0.35), (SceneTransition.CircleOpen, 0.45)]
            },

            StoryLookStyle.Cinematic => to switch
            {
                Feel.Wonder when changes => [(SceneTransition.CircleOpen, 0.8), (SceneTransition.Fade, 1.0)],
                Feel.Intense when changes => [(SceneTransition.ZoomIn, 0.5), (SceneTransition.Fade, 0.4)],
                _ => [(SceneTransition.Fade, 0.8), (SceneTransition.Fade, 1.0)]
            },

            _ => to switch
            {
                _ when !changes => [(SceneTransition.Fade, DefaultTransitionSeconds), (SceneTransition.Fade, 0.6)],
                Feel.Intense => [(SceneTransition.Fade, 0.3), (SceneTransition.ZoomIn, 0.4)],
                Feel.Wonder => [(SceneTransition.CircleOpen, 0.7), (SceneTransition.Fade, 0.8)],
                Feel.Joyful => [(slide, 0.4), (SceneTransition.Fade, 0.5)],
                Feel.Somber => [(SceneTransition.Fade, 0.8), (SceneTransition.Fade, 1.0)],
                _ => [(SceneTransition.Fade, 0.6), (SceneTransition.Fade, 0.5)]
            }
        };

        var choice = style == StoryLookStyle.MusicVideo ? (long)take + index : take;
        return choices[(int)((choice % choices.Length + choices.Length) % choices.Length)];
    }

    private static double Duration(IReadOnlyList<double> durations, int index) =>
        index < durations.Count && durations[index] > 0 ? durations[index] : 3;
}
