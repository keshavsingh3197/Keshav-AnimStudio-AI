using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Turns raw cues into a clean, ordered, non-overlapping sequence. Raw timings are
/// preserved on every cue so that a normalization bug stays diagnosable afterwards and
/// audio slicing can always fall back to exactly what the file said.
/// </summary>
public static class CueNormalizer
{
    public static List<TranscriptCue> Normalize(
        IReadOnlyList<RawCue> raw, ParsingOptions options, List<string> warnings)
    {
        var minDuration = TimeSpan.FromMilliseconds(options.MinCueDurationMs);
        var tolerance = TimeSpan.FromMilliseconds(options.OverlapToleranceMs);

        var ordered = raw
            .OrderBy(c => c.Start)
            .ThenBy(c => c.SourceIndex)
            .ToList();

        var result = new List<TranscriptCue>(ordered.Count);
        var droppedEmpty = 0;
        var clamped = 0;
        var overlapping = 0;

        foreach (var cue in ordered)
        {
            // A voice tag is structural evidence and outranks an inferred "Name:" prefix.
            var voiceTagSpeaker = InlineTagStripper.ExtractVoiceSpeaker(cue.RawText);
            var speaker = voiceTagSpeaker ?? cue.Speaker;
            var tier = voiceTagSpeaker is not null
                ? SpeakerDetectionTier.VoiceTag
                : cue.Speaker is not null ? SpeakerDetectionTier.Prefix : SpeakerDetectionTier.None;
            var text = InlineTagStripper.Clean(InlineTagStripper.StripTags(cue.RawText));

            if (text.Length == 0)
            {
                droppedEmpty++;
                continue;
            }

            var isNonSpeech = NonSpeechClassifier.IsNonSpeech(text);
            if (isNonSpeech && options.DropNonSpeechCues) continue;

            var start = cue.Start;
            var end = cue.End;
            if (end <= start)
            {
                end = start + minDuration;
                clamped++;
            }

            // Consecutive identical text with touching times is a duplicated cue, not a repeat.
            if (result.Count > 0)
            {
                var previous = result[^1];
                if (string.Equals(previous.Text, text, StringComparison.Ordinal)
                    && (start - previous.End).Duration() <= tolerance)
                {
                    continue;
                }
            }

            var isOverlapping = false;
            if (result.Count > 0)
            {
                var previous = result[^1];
                var overlap = previous.End - start;
                if (overlap > TimeSpan.Zero)
                {
                    var differentSpeaker = previous.SpeakerLabel is not null
                        && speaker is not null
                        && !string.Equals(previous.SpeakerLabel, speaker, StringComparison.OrdinalIgnoreCase);

                    if (overlap <= tolerance || !differentSpeaker)
                    {
                        // Rounding artefact, or the same speaker: tidy the timeline.
                        result[^1] = previous with { End = start > previous.Start ? start : previous.End };
                    }
                    else
                    {
                        // Genuine crosstalk. Never drop a speaker's line to make the timeline neat.
                        isOverlapping = true;
                        overlapping++;
                    }
                }
            }

            result.Add(new TranscriptCue
            {
                Index = 0, // assigned densely below
                Start = start,
                End = end,
                Text = text.Length > options.MaxCueChars ? text[..options.MaxCueChars] : text,
                SpeakerLabel = speaker,
                SourceIndex = cue.SourceIndex,
                RawStart = cue.Start,
                RawEnd = cue.End,
                IsNonSpeech = isNonSpeech,
                IsOverlapping = isOverlapping,
                SpeakerTier = tier
            });
        }

        for (var i = 0; i < result.Count; i++) result[i] = result[i] with { Index = i };

        if (droppedEmpty > 0) warnings.Add($"Ignored {droppedEmpty} empty cue(s).");
        if (clamped > 0) warnings.Add($"Repaired {clamped} cue(s) with a missing or invalid end time.");
        if (overlapping > 0) warnings.Add($"Kept {overlapping} overlapping cue(s) from different speakers.");

        return result;
    }
}
