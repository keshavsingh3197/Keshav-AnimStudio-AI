using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// Splits a crossfade merge that has too many clips into a cascade of smaller ones.
/// <para>
/// This exists because of a resource cost that is invisible in the filtergraph: an
/// <c>xfade</c> chain names its inputs one per clip, so ffmpeg opens EVERY clip at once and
/// holds a decoder and frame pool for each. Measured at 1080p30, that is roughly 96 MB per
/// clip and it is linear - eight clips cost 838 MB, twenty-four cost 2.3 GB before the
/// encoder is even attached, and forty would cost four gigabytes. Only two of those inputs
/// are ever being read at a time.
/// </para>
/// <para>
/// The consequence is worse than slow. Once the machine starts paging, throughput collapses
/// non-deterministically: the same twenty-four-clip join, on byte-identical input, was
/// measured at 72s, 99s and 937s on a 16 GB host. A job that usually takes a minute
/// occasionally blows a fixed timeout, which is not a slow render, it is a random failure.
/// </para>
/// <para>
/// Batching bounds it. Clips are joined in groups of at most
/// <see cref="MaxInputsPerPass"/>, and the results are joined the same way, recursively,
/// until one file is left. Peak memory becomes a property of the batch size rather than of
/// the clip count, so a hundred-clip stitch costs exactly what an eight-clip one does.
/// </para>
/// <para>
/// The cost is one extra encode generation for clips that pass through an intermediate
/// level. That is a real trade and it is why the batch size is not smaller: at the default,
/// anything up to <see cref="MaxInputsPerPass"/> clips is untouched and takes the single-pass
/// path exactly as before.
/// </para>
/// </summary>
public static class MergeBatching
{
    /// <summary>
    /// How many clips one join may open at once. Eight keeps peak memory under a gigabyte,
    /// which is affordable on the smallest machine anyone runs this on, while leaving the
    /// common case - a handful of clips - on the single-pass path.
    /// </summary>
    public const int DefaultMaxInputsPerPass = 8;

    /// <summary>One level of the cascade: the batches to run, in order.</summary>
    /// <param name="Batches">
    /// Each entry is a consecutive run of the level's inputs, to be joined into one file.
    /// A batch of one is passed through untouched rather than re-encoded.
    /// </param>
    public sealed record Level(IReadOnlyList<Batch> Batches)
    {
        /// <summary>True when this level produces the single final file.</summary>
        public bool IsFinal => Batches.Count == 1;
    }

    /// <summary>
    /// One join. <paramref name="TransitionToNext"/> is the transition that follows the
    /// batch's LAST clip - it belongs to the next level, not to this join, because it
    /// crosses the boundary into the following batch.
    /// </summary>
    public sealed record Batch(
        IReadOnlyList<MergeSceneInput> Scenes, TransitionSettings TransitionToNext)
    {
        /// <summary>
        /// The length this batch's output will have: the sum of its clips minus the
        /// transitions consumed INSIDE it. The boundary transition is excluded because it
        /// has not been applied yet.
        /// </summary>
        public FrameCount OutputLength => new(
            Scenes.Sum(s => s.Length.Value) - InternalDurations().Sum(d => d.Value));

        private IEnumerable<FrameCount> InternalDurations() =>
            Scenes.Take(Scenes.Count - 1)
                  .Select(s => s.TransitionToNext.IsCut ? FrameCount.Zero : s.TransitionToNext.Duration);

        /// <summary>A batch of one needs no join; its clip is already the answer.</summary>
        public bool IsPassThrough => Scenes.Count == 1;
    }

    /// <summary>
    /// Groups <paramref name="scenes"/> into batches of at most
    /// <paramref name="maxInputsPerPass"/>, preserving order.
    /// <para>
    /// Order is not negotiable: these are consecutive pieces of one timeline, and a
    /// transition is a relationship between neighbours. Regrouping them would silently
    /// reorder the video.
    /// </para>
    /// </summary>
    public static Level Split(IReadOnlyList<MergeSceneInput> scenes, int maxInputsPerPass)
    {
        ArgumentNullException.ThrowIfNull(scenes);
        if (scenes.Count == 0) throw new ArgumentException("Nothing to merge.", nameof(scenes));

        var size = Math.Max(2, maxInputsPerPass);
        var batches = new List<Batch>();

        for (var start = 0; start < scenes.Count; start += size)
        {
            var count = Math.Min(size, scenes.Count - start);
            var slice = new List<MergeSceneInput>(count);

            for (var i = 0; i < count; i++) slice.Add(scenes[start + i]);

            // The last clip's own transition crosses out of this batch, so the batch's
            // output inherits it and the join itself must not consume it.
            var boundary = slice[^1].TransitionToNext;

            // Inside the batch the final clip has nothing after it.
            slice[^1] = slice[^1] with { TransitionToNext = TransitionSettings.None };

            batches.Add(new Batch(slice, boundary));
        }

        return new Level(batches);
    }

    /// <summary>
    /// Whether a merge of this many clips needs to be batched at all.
    /// <para>
    /// A stream copy is exempt however many clips there are: the concat demuxer reads one
    /// input at a time, so its memory does not grow with the list. Only the xfade path
    /// opens everything at once.
    /// </para>
    /// </summary>
    public static bool NeedsBatching(int sceneCount, bool isStreamCopy, int maxInputsPerPass) =>
        !isStreamCopy && sceneCount > Math.Max(2, maxInputsPerPass);
}
