using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>
/// The measured facts of one join, as the render knew them at the moment of joining.
/// </summary>
/// <param name="Lengths">Each conformed clip's measured length, freeze-frame padding included.</param>
/// <param name="Transitions">The clamped transition after each clip but the last.</param>
/// <param name="TransitionKinds">The transition style at each junction, parallel to <paramref name="Transitions"/>.</param>
/// <param name="LeadIns">Seconds of frozen first frame each clip opens with, before its own content.</param>
public sealed record ExportTimelineFacts(
    IReadOnlyList<FrameCount> Lengths,
    IReadOnlyList<FrameCount> Transitions,
    IReadOnlyList<SceneTransition> TransitionKinds,
    IReadOnlyList<double> LeadIns,
    FrameRate Rate,
    FrameCount Total);

/// <summary>
/// Builds the <see cref="ExportTimeline"/> for a finished clip export. A pure function of
/// the spec, the assets and the measured lengths, so what it reports is checked by unit
/// tests rather than by eye against a video.
/// </summary>
public static class ExportTimelineBuilder
{
    public static ExportTimeline Build(
        ClipMergeSpec spec, Func<string, Asset?> resolveAsset, ExportTimelineFacts facts)
    {
        ArgumentNullException.ThrowIfNull(spec);
        ArgumentNullException.ThrowIfNull(resolveAsset);
        ArgumentNullException.ThrowIfNull(facts);

        var rate = facts.Rate;
        var total = facts.Total.ToSeconds(rate);
        var entries = new List<ExportTimelineEntry>();

        var offsets = facts.Lengths.Count < 2
            ? []
            : RenderTimeline.XfadeOffsets(facts.Lengths, facts.Transitions);

        var v1Items = spec.TimelineItems.Where(it => it.TrackId is "V1" or "video").ToList();
        var perClipAudio = spec.ClipAudio.Count == spec.AssetIds.Count;

        for (var i = 0; i < facts.Lengths.Count && i < spec.AssetIds.Count; i++)
        {
            var start = i == 0 ? 0 : offsets[i - 1].ToSeconds(rate);
            var end = start + facts.Lengths[i].ToSeconds(rate);
            var asset = resolveAsset(spec.AssetIds[i]);
            var item = v1Items.ElementAtOrDefault(i);

            entries.Add(WithCredit(new ExportTimelineEntry
            {
                Kind = asset?.Kind == AssetKind.Image ? ExportTimelineKinds.Image : ExportTimelineKinds.Clip,
                Track = "V1",
                ClipNumber = i + 1,
                AssetId = asset?.Id ?? spec.AssetIds[i],
                Label = LabelFor(item?.Name, asset, $"Clip {i + 1}"),
                StartSeconds = start,
                EndSeconds = end,
                SourceInSeconds = item?.TrimStartSeconds,
                SourceOutSeconds = item?.TrimEndSeconds
            }, asset));

            if (i < facts.Transitions.Count && facts.Transitions[i].Value > 0)
            {
                var blendStart = offsets[i].ToSeconds(rate);
                var kind = i < facts.TransitionKinds.Count ? facts.TransitionKinds[i] : SceneTransition.Fade;
                entries.Add(new ExportTimelineEntry
                {
                    Kind = ExportTimelineKinds.Transition,
                    Track = "V1",
                    ClipNumber = i + 1,
                    Label = i + 1 < spec.AssetIds.Count ? $"{kind} into clip {i + 2}" : $"{kind} into end card",
                    Transition = kind.ToString(),
                    StartSeconds = blendStart,
                    EndSeconds = blendStart + facts.Transitions[i].ToSeconds(rate)
                });
            }

            // A clip's added sound starts with its own content, after any frozen lead-in -
            // the same delay the conform pass applies to it.
            if (perClipAudio && spec.ClipAudio[i].AudioAssetId is { Length: > 0 } soundId
                && resolveAsset(soundId) is { } sound)
            {
                var audio = spec.ClipAudio[i];
                var soundStart = start + (i < facts.LeadIns.Count ? facts.LeadIns[i] : 0);
                var used = UsedLength(audio.TrimStartSeconds, audio.TrimEndSeconds, sound);

                entries.Add(WithCredit(new ExportTimelineEntry
                {
                    Kind = ExportTimelineKinds.ClipSound,
                    Track = "V1",
                    ClipNumber = i + 1,
                    AssetId = sound.Id,
                    Label = LabelFor(null, sound, "Clip sound"),
                    StartSeconds = soundStart,
                    EndSeconds = Math.Min(end, used is { } u ? soundStart + u : end),
                    SourceInSeconds = audio.TrimStartSeconds,
                    SourceOutSeconds = audio.TrimEndSeconds
                }, sound));
            }
        }

        // The outro is the one join input that is not a listed clip: it always comes last.
        if (facts.Lengths.Count == spec.AssetIds.Count + 1)
        {
            var last = facts.Lengths.Count - 1;
            var start = last == 0 ? 0 : offsets[last - 1].ToSeconds(rate);
            entries.Add(new ExportTimelineEntry
            {
                Kind = ExportTimelineKinds.EndCard,
                Track = "V1",
                AssetId = spec.Outro.Kind == OutroKind.Card ? spec.Outro.QrAssetId : spec.Outro.AssetId,
                Label = spec.Outro.Kind == OutroKind.Card && !string.IsNullOrWhiteSpace(spec.Outro.Headline)
                    ? spec.Outro.Headline!
                    : "End card",
                StartSeconds = start,
                EndSeconds = start + facts.Lengths[last].ToSeconds(rate)
            });
        }

        if (spec.BackgroundMusicAssetId is { Length: > 0 } bedId && resolveAsset(bedId) is { } bed)
        {
            // Looped under the whole video, so it spans it regardless of its own length.
            entries.Add(WithCredit(new ExportTimelineEntry
            {
                Kind = ExportTimelineKinds.MusicBed,
                Track = "BED",
                AssetId = bed.Id,
                Label = LabelFor(null, bed, "Background music"),
                StartSeconds = 0,
                EndSeconds = total
            }, bed));
        }

        foreach (var track in spec.MusicTracks)
        {
            if (resolveAsset(track.AssetId) is not { } music || track.StartSeconds >= total) continue;

            var used = UsedLength(track.TrimStartSeconds, track.TrimEndSeconds, music);
            entries.Add(WithCredit(new ExportTimelineEntry
            {
                Kind = ExportTimelineKinds.Music,
                Track = "MUSIC",
                AssetId = music.Id,
                Label = LabelFor(null, music, "Music"),
                StartSeconds = Math.Max(0, track.StartSeconds),
                EndSeconds = Math.Min(total, used is { } u ? track.StartSeconds + u : total),
                SourceInSeconds = track.TrimStartSeconds,
                SourceOutSeconds = track.TrimEndSeconds
            }, music));
        }

        foreach (var item in spec.TimelineItems)
        {
            var isAudio = item.TrackId is "A1" or "A2" && item.Type == "audio";
            var isOverlay = ClipMergeOrchestrator.IsOverlayTrack(item.TrackId);
            if ((!isAudio && !isOverlay) || item.StartTime >= total) continue;

            var isText = item.Type == "text";
            var asset = isText ? null : resolveAsset(item.Src);

            // An overlay whose asset is gone was skipped by the render, so it is not reported.
            if (!isText && asset is null) continue;
            if (isText && string.IsNullOrWhiteSpace(item.Src)) continue;

            entries.Add(WithCredit(new ExportTimelineEntry
            {
                Kind = isAudio ? ExportTimelineKinds.Audio
                    : isText ? ExportTimelineKinds.Text
                    : ExportTimelineKinds.Overlay,
                Track = item.TrackId,
                AssetId = asset?.Id,
                // A text item's Src IS its text, which is the most useful label it has.
                Label = isText ? item.Src.Trim() : LabelFor(item.Name, asset, item.Type),
                StartSeconds = Math.Max(0, item.StartTime),
                EndSeconds = Math.Min(total, item.StartTime + Math.Max(0, item.Duration)),
                SourceInSeconds = item.TrimStartSeconds,
                SourceOutSeconds = item.TrimEndSeconds
            }, asset));
        }

        return new ExportTimeline
        {
            FrameRate = rate.AsDouble,
            DurationSeconds = Round(total),
            Entries = [.. entries
                .Select(e => { e.StartSeconds = Round(e.StartSeconds); e.EndSeconds = Round(e.EndSeconds); return e; })
                .OrderBy(e => e.StartSeconds)
                .ThenBy(e => e.ClipNumber ?? int.MaxValue)]
        };
    }

    /// <summary>
    /// How much of a source plays: its trimmed span, or what remains of the file after the
    /// trim start. Null when the file's length was never probed - the caller then runs the
    /// item to the end of whatever contains it.
    /// </summary>
    private static double? UsedLength(double? trimStart, double? trimEnd, Asset asset)
    {
        var from = Math.Max(0, trimStart ?? 0);
        if (trimEnd is { } to && to > from) return to - from;

        var duration = asset.Probe?.DurationSeconds;
        return duration is > 0 && duration > from ? duration - from : null;
    }

    private static string LabelFor(string? itemName, Asset? asset, string fallback)
    {
        foreach (var candidate in new[] { itemName, asset?.Name, asset?.DisplayFileName })
        {
            if (!string.IsNullOrWhiteSpace(candidate)) return candidate.Trim();
        }

        return fallback;
    }

    private static ExportTimelineEntry WithCredit(ExportTimelineEntry entry, Asset? asset)
    {
        var provenance = asset?.Provenance;
        if (provenance is null) return entry;

        entry.Credit = !string.IsNullOrWhiteSpace(provenance.AttributionText)
            ? provenance.AttributionText.Trim()
            : string.Join(" · ", new[] { provenance.CreatorName, provenance.LicenseCode }
                .Where(s => !string.IsNullOrWhiteSpace(s))) is { Length: > 0 } joined ? joined : null;
        entry.SourceUrl = provenance.SourceUrl;
        return entry;
    }

    private static double Round(double seconds) => Math.Round(seconds, 3);
}
