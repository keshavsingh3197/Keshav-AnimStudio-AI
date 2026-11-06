using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Scenes;

/// <summary>One subtitle on the finished video, in seconds from its start.</summary>
public sealed record SceneTimelineCaption(string Text, string? Speaker, double StartSeconds, double EndSeconds);

/// <summary>
/// A scene's narration on the finished video: the file, the stretch of it the scene plays, and where that starts.
/// </summary>
/// <param name="TrimStartSeconds">Where in the file the scene's sound starts; 0 for a file of its own.</param>
/// <param name="Seconds">How much of it plays: the scene's own stretch, ending where the next scene takes over.</param>
public sealed record SceneTimelineAudio(string AssetId, double StartSeconds, double TrimStartSeconds, double Seconds);

/// <summary>One scene on the finished video.</summary>
/// <param name="StartSeconds">Where the scene starts, the transitions before it taken out - where the render puts it.</param>
/// <param name="Seconds">How long it holds the screen before the next scene starts: its length less the transition out.</param>
public sealed record SceneTimelineScene(
    string SceneId,
    int Number,
    string? Title,
    double StartSeconds,
    double Seconds,
    string? BackgroundAssetId,
    BackgroundEffect Effect,
    double EffectIntensity,
    SceneTransition Transition,
    double TransitionSeconds,
    SceneTimelineAudio? Audio,
    IReadOnlyList<SceneTimelineCaption> Captions);

public sealed record SceneTimeline(IReadOnlyList<SceneTimelineScene> Scenes, double TotalSeconds);

/// <summary>
/// A scene-based project - a Story Agent story, a spreadsheet import - laid end to end as the render plays it, so the
/// Video editor can put the same pictures, narration and subtitles on its own lanes.
/// </summary>
/// <remarks>
/// <para>
/// The render crossfades each scene into the next, so scene <c>k+1</c> starts its transition before scene <c>k</c> ends.
/// The editor plays pictures one after another instead, so each scene is given the time up to where the next one starts
/// - the same offsets <see cref="Rendering.RenderTimeline.XfadeOffsets"/> computes - and the whole runs exactly as long
/// as the render.
/// </para>
/// <para>
/// A scene's narration is cut to that same stretch. The Story Agent carries a picture's narration on through the
/// crossfade into the next picture, whose own narration starts with those same words; played back to back, a cut at the
/// next scene's start keeps the voice continuous instead of saying them twice.
/// </para>
/// </remarks>
public static class SceneTimelineLayout
{
    public static SceneTimeline Build(IReadOnlyList<Scene> scenes, FrameRate rate)
    {
        ArgumentNullException.ThrowIfNull(scenes);

        var laid = new List<SceneTimelineScene>(scenes.Count);
        var startFrame = 0;
        for (var i = 0; i < scenes.Count; i++)
        {
            var scene = scenes[i];
            var last = i == scenes.Count - 1;
            var length = Math.Max(1, scene.DurationFrames);
            // The last scene has nothing to cross into, and a transition can never eat a whole scene.
            var overlap = last || scene.TransitionToNext == SceneTransition.None
                ? 0
                : Math.Clamp(scene.TransitionDurationFrames, 0, length - 1);
            var held = length - overlap;

            var start = Seconds(startFrame, rate);
            var seconds = Seconds(held, rate);
            var end = start + seconds;

            laid.Add(new SceneTimelineScene(
                scene.Id,
                scene.SceneNumber,
                scene.Title,
                Round(start),
                Round(seconds),
                scene.BackgroundAssetId,
                scene.Animation.Background,
                scene.Animation.Intensity,
                overlap == 0 ? SceneTransition.None : scene.TransitionToNext,
                Round(Seconds(overlap, rate)),
                Audio(scene, start, seconds),
                Captions(scene, start, end, rate)));

            startFrame += held;
        }

        return new SceneTimeline(laid, Round(Seconds(startFrame, rate)));
    }

    private static SceneTimelineAudio? Audio(Scene scene, double start, double seconds)
    {
        if (string.IsNullOrWhiteSpace(scene.Audio.AssetId)) return null;

        var from = Math.Max(0, scene.Audio.SliceStartSeconds ?? 0);
        // A slice of a longer recording plays no further than its own end.
        var available = scene.Audio.SliceEndSeconds is { } to && to > from ? to - from : double.PositiveInfinity;
        var plays = Math.Min(seconds, available);
        return plays <= 0 ? null : new SceneTimelineAudio(scene.Audio.AssetId, Round(start), Round(from), Round(plays));
    }

    private static List<SceneTimelineCaption> Captions(Scene scene, double start, double end, FrameRate rate)
    {
        var captions = new List<SceneTimelineCaption>(scene.Dialogue.Count);
        foreach (var line in scene.Dialogue.OrderBy(l => l.RelativeStartFrame))
        {
            var text = line.Text.Trim();
            if (text.Length == 0) continue;

            // A line still showing when the next scene takes over ends there, so two scenes' lines never stack.
            var from = start + Seconds(line.RelativeStartFrame, rate);
            var to = Math.Min(end, start + Seconds(line.RelativeEndFrame, rate));
            if (to - from < 0.05) continue;
            captions.Add(new SceneTimelineCaption(text, line.SpeakerLabel, Round(from), Round(to)));
        }
        return captions;
    }

    private static double Seconds(int frames, FrameRate rate) => new FrameCount(frames).ToSeconds(rate);

    private static double Round(double seconds) => Math.Round(seconds, 3);
}
