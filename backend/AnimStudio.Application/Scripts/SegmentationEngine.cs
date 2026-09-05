using AnimStudio.Application.Casting;
using AnimStudio.Domain.Scripts;
using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Scripts;

public interface ISegmentationEngine
{
    IReadOnlyList<ScriptSegment> Segment(IReadOnlyList<TranscriptCue> cues, SegmentationOptions options);
}

/// <summary>
/// Groups cues into scene-sized segments.
/// <para>
/// Pure and deterministic: the same cues and options always produce a byte-identical
/// result, which is what makes re-ingest idempotent and lets the whole break-rule surface
/// be unit-tested with no database or renderer.
/// </para>
/// </summary>
public sealed class SegmentationEngine : ISegmentationEngine
{
    public IReadOnlyList<ScriptSegment> Segment(
        IReadOnlyList<TranscriptCue> cues, SegmentationOptions options)
    {
        ArgumentNullException.ThrowIfNull(cues);
        ArgumentNullException.ThrowIfNull(options);
        if (cues.Count == 0) return [];

        var groups = BuildGroups(cues, options);
        var segments = Accumulate(groups, options);
        segments = PostProcess(segments, options);
        ApplyGapPolicy(segments, options);
        AssignKeysAndOrder(segments);
        return segments;
    }

    /// <summary>Pre-merge step: consecutive same-speaker cues with only a small gap.</summary>
    private static List<CueGroup> BuildGroups(IReadOnlyList<TranscriptCue> cues, SegmentationOptions options)
    {
        var mergeGap = TimeSpan.FromSeconds(options.MergeSameSpeakerGapSeconds);
        var maximum = TimeSpan.FromSeconds(options.MaxSegmentSeconds);
        var groups = new List<CueGroup>();

        foreach (var cue in cues)
        {
            var key = SpeakerKey.Normalize(cue.SpeakerLabel);
            var current = groups.Count > 0 ? groups[^1] : null;

            // A group is atomic to the accumulator, so it must not itself outgrow the
            // duration cap - otherwise no later rule can bring the segment back under it.
            // (A single cue longer than the cap is still atomic and legitimately exceeds it.)
            var canMerge = current is not null
                && current.SpeakerKey == key
                && cue.Start - current.End <= mergeGap
                && current.Text.Length + cue.Text.Length + 1 <= options.MaxCharsPerSegment
                && cue.End - current.Start <= maximum;

            if (canMerge)
            {
                current!.Cues.Add(cue);
            }
            else
            {
                var group = new CueGroup { SpeakerKey = key, SpeakerLabel = cue.SpeakerLabel };
                group.Cues.Add(cue);
                groups.Add(group);
            }
        }

        return groups;
    }

    /// <summary>
    /// Greedy accumulation. Break rules are evaluated in strict priority order and the
    /// first match wins; the reason is recorded so thresholds can be tuned from real data.
    /// </summary>
    private static List<ScriptSegment> Accumulate(List<CueGroup> groups, SegmentationOptions options)
    {
        var minimum = TimeSpan.FromSeconds(options.MinSegmentSeconds);
        var target = TimeSpan.FromSeconds(options.TargetSegmentSeconds);
        var maximum = TimeSpan.FromSeconds(options.MaxSegmentSeconds);
        var hardPause = TimeSpan.FromSeconds(options.HardPauseBreakSeconds);
        var softPause = TimeSpan.FromSeconds(options.PauseBreakSeconds);

        var segments = new List<ScriptSegment>();
        var pending = new List<CueGroup>();

        for (var i = 0; i < groups.Count; i++)
        {
            pending.Add(groups[i]);

            var isLast = i == groups.Count - 1;
            var duration = pending[^1].End - pending[0].Start;
            var next = isLast ? null : groups[i + 1];
            var gapToNext = next is null ? TimeSpan.Zero : next.Start - pending[^1].End;

            var reason = ChooseBreak(pending, next, duration, gapToNext, isLast, options,
                minimum, target, maximum, hardPause, softPause);

            if (reason is null) continue;

            segments.Add(Build(pending, reason.Value));
            pending = [];
        }

        if (pending.Count > 0) segments.Add(Build(pending, SegmentBreakReason.EndOfTranscript));
        return segments;
    }

    private static SegmentBreakReason? ChooseBreak(
        List<CueGroup> pending, CueGroup? next, TimeSpan duration, TimeSpan gapToNext, bool isLast,
        SegmentationOptions options, TimeSpan minimum, TimeSpan target, TimeSpan maximum,
        TimeSpan hardPause, TimeSpan softPause)
    {
        if (isLast) return SegmentBreakReason.EndOfTranscript;

        // R1 - a long silence is a real scene boundary, even below the minimum length.
        if (gapToNext > hardPause) return SegmentBreakReason.HardPause;

        // R2 - adding the next group would exceed the cap.
        if (next is not null && duration + gapToNext + next.Duration > maximum)
        {
            // Below the minimum we still force-include, so a single long monologue cue
            // becomes one long segment rather than an invalid short one.
            return duration >= minimum ? SegmentBreakReason.DurationCap : null;
        }

        // R3 - speaker change.
        if (options.SpeakerChangeBreaks && next is not null && duration >= minimum)
        {
            var dominant = DominantSpeakerKey(pending);
            if (!string.Equals(next.SpeakerKey, dominant, StringComparison.Ordinal))
                return SegmentBreakReason.SpeakerChange;
        }

        // R4 - a softer pause, once the segment is long enough to stand alone.
        if (gapToNext > softPause && duration >= minimum) return SegmentBreakReason.SoftPause;

        // R5 - past the target length, prefer to end on a sentence boundary.
        if (duration >= target)
        {
            if (!options.SentenceBoundaryPreferred) return SegmentBreakReason.SentenceBoundary;
            if (SentenceBoundaryDetector.EndsSentence(pending[^1].Text))
                return SegmentBreakReason.SentenceBoundary;
        }

        // R6 - hard content caps.
        var totalChars = pending.Sum(g => g.Text.Length);
        if (totalChars >= options.MaxCharsPerSegment) return SegmentBreakReason.CharacterCap;

        var totalLines = pending.Sum(g => g.Cues.Count);
        if (totalLines >= options.MaxDialogueLinesPerSegment) return SegmentBreakReason.LineCap;

        return null;
    }

    private static string DominantSpeakerKey(List<CueGroup> groups)
    {
        // Longest total speaking time wins, so a brief interjection does not steal the scene.
        return groups
            .GroupBy(g => g.SpeakerKey, StringComparer.Ordinal)
            .OrderByDescending(g => g.Sum(x => x.Duration.Ticks))
            .ThenBy(g => g.Key, StringComparer.Ordinal)
            .First().Key;
    }

    private static ScriptSegment Build(List<CueGroup> groups, SegmentBreakReason reason)
    {
        var sourceStart = groups[0].Start;
        var sourceEnd = groups[^1].End;
        var dominantKey = DominantSpeakerKey(groups);
        var dominantLabel = groups.FirstOrDefault(g => g.SpeakerKey == dominantKey)?.SpeakerLabel;

        var segment = new ScriptSegment
        {
            SegmentId = Guid.NewGuid().ToString("n"),
            SourceStart = sourceStart,
            SourceEnd = sourceEnd,
            TimelineStart = sourceStart,
            TimelineEnd = sourceEnd,
            DominantSpeakerKey = dominantKey,
            DominantSpeakerLabel = dominantLabel,
            BreakReason = reason
        };

        foreach (var group in groups)
        {
            foreach (var cue in group.Cues)
            {
                segment.Lines.Add(new ScriptLine
                {
                    LineId = Guid.NewGuid().ToString("n"),
                    SpeakerLabel = cue.SpeakerLabel,
                    SpeakerKey = SpeakerKey.Normalize(cue.SpeakerLabel),
                    Text = cue.Text,
                    SourceStart = cue.Start,
                    SourceEnd = cue.End,
                    RelativeStart = cue.Start - sourceStart,
                    RelativeEnd = cue.End - sourceStart,
                    CueIndexes = [cue.Index],
                    IsOverlapping = cue.IsOverlapping
                });
                segment.SourceCueIndexes.Add(cue.Index);
            }
        }

        // Order by start so crosstalk reads in the order it was spoken.
        segment.Lines.Sort((a, b) => a.SourceStart.CompareTo(b.SourceStart));

        var firstLine = segment.Lines.FirstOrDefault()?.Text ?? string.Empty;
        segment.SuggestedTitle = firstLine.Length <= 48 ? firstLine : firstLine[..48].TrimEnd() + "…";

        return segment;
    }

    private static List<ScriptSegment> PostProcess(List<ScriptSegment> segments, SegmentationOptions options)
    {
        if (segments.Count < 2) return segments;

        var minimum = TimeSpan.FromSeconds(options.MinSegmentSeconds);
        var absoluteMax = TimeSpan.FromSeconds(options.MaxSegmentSeconds * 1.25);

        // Fold a too-short trailing segment back into its predecessor when it fits.
        var last = segments[^1];
        if (last.SourceDuration < minimum)
        {
            var previous = segments[^2];
            if (last.SourceEnd - previous.SourceStart <= absoluteMax)
            {
                previous.Lines.AddRange(last.Lines);
                previous.SourceCueIndexes.AddRange(last.SourceCueIndexes);
                previous.SourceEnd = last.SourceEnd;
                previous.TimelineEnd = last.SourceEnd;
                previous.BreakReason = SegmentBreakReason.EndOfTranscript;

                // Relative offsets are measured from the surviving segment's start.
                foreach (var line in previous.Lines)
                {
                    line.RelativeStart = line.SourceStart - previous.SourceStart;
                    line.RelativeEnd = line.SourceEnd - previous.SourceStart;
                }

                segments.RemoveAt(segments.Count - 1);
            }
        }

        return segments;
    }

    /// <summary>
    /// Resolves silence between segments on the TIMELINE clock only. Source timings are
    /// never touched, which is precisely why audio slices cannot drift when this changes.
    /// </summary>
    private static void ApplyGapPolicy(List<ScriptSegment> segments, SegmentationOptions options)
    {
        if (options.GapPolicy == GapPolicy.ExtendPrevious)
        {
            for (var i = 0; i < segments.Count - 1; i++)
                segments[i].TimelineEnd = segments[i + 1].SourceStart;
        }

        // Rebase the timeline to zero and make it contiguous.
        var cursor = TimeSpan.Zero;
        foreach (var segment in segments)
        {
            var length = options.GapPolicy == GapPolicy.Trim
                ? segment.SourceDuration
                : segment.TimelineEnd - segment.SourceStart;

            if (length <= TimeSpan.Zero) length = segment.SourceDuration;

            var minimum = TimeSpan.FromSeconds(options.MinSceneDurationSeconds);
            if (length < minimum) length = minimum;

            segment.TimelineStart = cursor;
            segment.TimelineEnd = cursor + length;
            cursor = segment.TimelineEnd;
        }
    }

    private static void AssignKeysAndOrder(List<ScriptSegment> segments)
    {
        var seen = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < segments.Count; i++)
        {
            var segment = segments[i];
            segment.Order = i + 1;

            var normalized = SegmentKeyFactory.NormalizeText(
                string.Join(' ', segment.Lines.Select(l => l.Text)));
            var speakers = segment.Lines.Select(l => l.SpeakerKey);
            var baseKey = SegmentKeyFactory.Create(normalized, speakers, 0);

            var ordinal = seen.TryGetValue(baseKey, out var count) ? count : 0;
            seen[baseKey] = ordinal + 1;

            segment.SegmentKey = ordinal == 0
                ? baseKey
                : SegmentKeyFactory.Create(normalized, segment.Lines.Select(l => l.SpeakerKey), ordinal);
        }
    }
}
