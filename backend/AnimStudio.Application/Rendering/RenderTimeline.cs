using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// Frame-exact timeline arithmetic for merging scenes.
/// <para>
/// The key fact: an xfade of duration D consumes D frames from the end of the accumulated
/// stream AND D from the start of the next scene, so every transition SHORTENS the
/// timeline. Offsets are therefore cumulative-length-minus-cumulative-duration, not just
/// cumulative length. Because acrossfade consumes audio by exactly the same arithmetic,
/// driving both chains from these offsets keeps audio and video locked with no extra
/// bookkeeping.
/// </para>
/// </summary>
public static class RenderTimeline
{
    /// <summary>
    /// xfade offsets, one per transition. Offset k is where the (k+1)th scene begins
    /// blending into the accumulated stream.
    /// </summary>
    public static IReadOnlyList<FrameCount> XfadeOffsets(
        IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> durations)
    {
        ArgumentNullException.ThrowIfNull(lengths);
        ArgumentNullException.ThrowIfNull(durations);
        if (durations.Count != Math.Max(lengths.Count - 1, 0))
            throw new ArgumentException("Expected one transition between each pair of scenes.",
                nameof(durations));

        var offsets = new List<FrameCount>(durations.Count);
        var accumulated = 0;

        for (var k = 0; k < durations.Count; k++)
        {
            accumulated += k == 0
                ? lengths[0].Value - durations[0].Value
                : lengths[k].Value - durations[k].Value;
            offsets.Add(new FrameCount(accumulated));
        }

        return offsets;
    }

    /// <summary>Total output length: the sum of scene lengths minus every transition.</summary>
    public static FrameCount TotalLength(
        IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> durations) =>
        new(lengths.Sum(l => l.Value) - durations.Sum(d => d.Value));

    /// <summary>
    /// Rejects a timeline ffmpeg would refuse or silently freeze on. Runs BEFORE any
    /// encoding starts, so a bad plan costs a validation error rather than ten minutes.
    /// </summary>
    public static void Validate(IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> durations)
    {
        if (lengths.Count == 0)
            throw new RenderException(RenderErrorCode.NoScenes, "This project has no scenes to render.");

        for (var i = 0; i < lengths.Count; i++)
        {
            if (lengths[i].Value <= 0)
                throw new RenderException(RenderErrorCode.InvalidSceneDuration,
                    $"Scene {i + 1} has no duration.");
        }

        for (var k = 0; k < durations.Count; k++)
        {
            if (durations[k].Value < 0)
                throw new RenderException(RenderErrorCode.TransitionTooLong,
                    $"Transition {k + 1} has a negative duration.");

            // A transition longer than half of either neighbour leaves xfade without
            // enough frames, which surfaces as a freeze rather than a clean error.
            var budget = Math.Min(lengths[k].Value, lengths[k + 1].Value) / 2;
            if (durations[k].Value > budget)
                throw new RenderException(RenderErrorCode.TransitionTooLong,
                    $"The transition after scene {k + 1} is too long for the scenes it joins.");
        }
    }

    /// <summary>True when the merge can be a stream-copy concat instead of a re-encode.</summary>
    public static bool CanStreamCopy(IReadOnlyList<FrameCount> durations, bool hasBackgroundMusic) =>
        !hasBackgroundMusic && durations.All(d => d.Value == 0);
}
