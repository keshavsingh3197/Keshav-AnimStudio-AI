using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Jobs;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading;

namespace AnimStudio.Application.Clips;

/// <summary>
/// Server settings a clip stitch needs. Passed in from the worker rather than read here,
/// so this class carries no dependency on the configuration layer - the same reason
/// <see cref="RenderSettings"/> exists for a project render.
/// </summary>
/// <param name="WatermarkFontFile">
/// Absolute path to the .ttf/.otf a text watermark is drawn with, already resolved and
/// verified by the worker. Null when the host has no font file, in which case the mark is
/// skipped - there is no family-name fallback, because that path resolves through
/// fontconfig and crashes ffmpeg builds that have no fontconfig configuration.
/// </param>
/// <param name="Delivery">
/// How the video the viewer downloads is encoded.
/// </param>
/// <param name="IntermediatePreset">
/// The x264 preset for pass-one clips when the join is going to re-encode them anyway.
/// See <see cref="EncoderProfile.ForIntermediate"/> for why this is not a quality trade.
/// </param>
public sealed record ClipRenderSettings(
    string? WatermarkFontFile, EncoderProfile Delivery, string IntermediatePreset,
    TimeSpan LeaseDuration,
    /// <summary>
    /// Name of the GPU encoder to prefer for clip conformance (e.g. "h264_nvenc", "h264_qsv"),
    /// or null to fall back to the CPU libx264 path with ultrafast preset.
    /// </summary>
    string? HardwareEncoder = null,
    /// <summary>
    /// A font that can draw the given text - per script, so Hindi gets a Devanagari face -
    /// or null when the host has none. Absent, <c>WatermarkFontFile</c> is used for all text.
    /// </summary>
    Func<string, string?>? FontForText = null)
{
    /// <summary>The font for <paramref name="text"/>, honouring the fallback.</summary>
    public string? FontFor(string text) => FontForText is not null ? FontForText(text) : WatermarkFontFile;
}


/// <summary>
/// Runs one clip stitch from claim to published MP4.
/// <para>
/// Two passes, and the split is the whole design. The first conforms every clip to the
/// project canvas and burns in the watermark - which is unavoidable work, because clips
/// arrive agreeing on nothing. The second joins the results, and because they now agree on
/// everything, that join is the SAME code a project render uses to merge scenes, right
/// down to the stream-copy fast path and the crossfade arithmetic. Nothing about merging
/// is written twice.
/// </para>
/// </summary>
public sealed class ClipMergeOrchestrator(
    IProjectRepository projects,
    IAssetRepository assets,
    IAssetFolderRepository folders,
    IRenderJobRepository jobs,
    IVideoRenderingService renderer,
    IRenderWorkspaceFactory workspaces,
    IRenderCapabilities capabilities,
    TimeProvider clock,
    ILogger<ClipMergeOrchestrator> logger)
{
    public async Task ExecuteAsync(
        RenderJob job, string leaseOwner, ClipRenderSettings settings, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(job);

        if (!capabilities.IsAvailable)
        {
            await FailAsync(job, RenderErrorCode.RendererUnavailable,
                capabilities.UnavailableReason ?? "Video rendering is not configured on this server.",
                ct).ConfigureAwait(false);
            return;
        }

        if (job.ClipMerge is not { AssetIds.Count: > 0 } spec)
        {
            await FailAsync(job, RenderErrorCode.NoScenes,
                "This job has no clips to join.", ct).ConfigureAwait(false);
            return;
        }

        var project = await projects.GetAsync(job.ProjectId, ct).ConfigureAwait(false);
        if (project is null)
        {
            await FailAsync(job, RenderErrorCode.NoScenes, "This project no longer exists.", ct)
                .ConfigureAwait(false);
            return;
        }

        var baseCanvas = project.Settings.ToCanvas();
        var canvas = (spec.OutputWidth.HasValue && spec.OutputHeight.HasValue)
            ? new Canvas(spec.OutputWidth.Value, spec.OutputHeight.Value, baseCanvas.FrameRate)
            : baseCanvas;
        canvas.Validate();

        var assetMap = await LoadAssetsAsync(spec, job.ProjectId, ct).ConfigureAwait(false);

        var missing = spec.AssetIds.FirstOrDefault(id => !assetMap.ContainsKey(id) && !assetMap.ContainsKey(ClipMergeService.CleanClipId(id)));
        if (missing is not null)
        {
            await FailAsync(job, RenderErrorCode.AssetMissing,
                "One of the clips in this video has been deleted.", ct).ConfigureAwait(false);
            return;
        }

        // Estimates based on timeline items duration or probe length to weight the progress bar accurately.
        var v1ItemsList = spec.TimelineItems.Where(it => it.TrackId is "V1" or "video").ToList();
        var estimates = spec.AssetIds
            .Select((id, idx) =>
            {
                var a = assetMap.TryGetValue(id, out var found) ? found : assetMap[ClipMergeService.CleanClipId(id)];
                var v1 = v1ItemsList.ElementAtOrDefault(idx)
                    ?? spec.TimelineItems.FirstOrDefault(
                        it => it.TrackId is "V1" or "video" && (it.Src == a.Id || it.Src == id));

                if (a.Kind == AssetKind.Image)
                {
                    var dur = v1?.Duration ?? 5.0;
                    return FrameCount.FromSeconds(dur, canvas.FrameRate);
                }

                if (v1?.Duration is > 0)
                {
                    return FrameCount.FromSeconds(v1.Duration, canvas.FrameRate);
                }

                if (v1?.TrimEndSeconds is > 0 && v1.TrimEndSeconds > (v1.TrimStartSeconds ?? 0))
                {
                    return FrameCount.FromSeconds(v1.TrimEndSeconds.Value - (v1.TrimStartSeconds ?? 0), canvas.FrameRate);
                }

                return ClipPlanFactory.EstimateLength(a.Probe, canvas.FrameRate);
            })
            .ToList();

        // The same test the merge graph applies: hard cuts and nothing composited on top
        // means the join copies the video stream untouched. Music does NOT break that - it
        // is mixed into the audio while the video is still copied - so a music bed must not
        // demote the clips to throwaway intermediates, or the fast-preset file becomes the
        // delivered one at several times the size.
        var hasTransitions = spec.TransitionFrames > 0
            || spec.Junctions.Any(j => j.Transition != SceneTransition.None && j.TransitionFrames > 0)
            || OutroPlanFactory.Crossfades(spec.Outro);
        var willStreamCopy = !hasTransitions && !spec.TimelineItems.Any(it => IsOverlayTrack(it.TrackId));

        // Per-clip sound costs the join nothing: it is mixed in pass one, so every
        // conformed clip still comes out with the same single audio stream and the join
        // can still be a stream copy.
        var perClipAudio = spec.ClipAudio.Count == spec.AssetIds.Count;

        // When the join is a stream copy, pass one's output IS the delivered video, so it
        // gets the delivery preset (no GPU shortcut: we want full quality). When the join
        // re-encodes, pass one is writing a file whose only reader is ffmpeg, so a fast GPU
        // encoder saves most of Step 2 without affecting the final video quality at all.
        // The export's chosen quality decides the delivered encode, whichever pass writes it.
        var delivery = settings.Delivery.ForQuality(spec.Quality);
        var deliveryLabel = $"{spec.Quality} · {delivery.VideoCodec} {delivery.Preset} CRF {delivery.Crf}";

        EncoderProfile clipEncoder;
        string activeEncoder;
        if (willStreamCopy)
        {
            // Delivery quality — output is the file the viewer downloads.
            clipEncoder = delivery;
            activeEncoder = deliveryLabel;
        }
        else if (settings.HardwareEncoder is { Length: > 0 } hwEnc)
        {
            // GPU intermediates: fast encode, same quality target. The join re-encodes
            // with the delivery profile, so intermediate quality is irrelevant.
            clipEncoder = delivery.ForHardwareEncoder(hwEnc);
            activeEncoder = $"{deliveryLabel} (intermediates: {hwEnc})";
        }
        else
        {
            // CPU fallback with ultrafast preset.
            clipEncoder = delivery.ForIntermediate(settings.IntermediatePreset);
            activeEncoder = deliveryLabel;
        }


        var aggregator = new RenderProgressAggregator(
            estimates,
            RenderTimeline.TotalLength(estimates, ZerosFor(estimates)),
            willStreamCopy,
            itemNoun: "clip");

        await using var reporter = new JobProgressReporter(
            jobs, aggregator, job.Id, leaseOwner, settings.LeaseDuration, spec.AssetIds.Count,
            clock, logger);

        using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct, reporter.AbortToken);
        var token = linked.Token;

        await using var workspace = await workspaces.CreateAsync(job.Id, token).ConfigureAwait(false);

        var totalSw = Stopwatch.StartNew();
        var stageSw = Stopwatch.StartNew();

        try
        {
            reporter.Report(new RenderProgress(
                RenderStage.Preparing, 0, spec.AssetIds.Count, FrameCount.Zero,
                FrameCount.Zero, 0, string.Empty, null));

            var materialized = await MaterializeAsync(workspace, assetMap, token)
                .ConfigureAwait(false);

            var warnings = new HashSet<string>(StringComparer.Ordinal);

            var watermark = await BuildWatermarkAsync(
                spec, canvas, materialized, workspace, settings, warnings, token)
                .ConfigureAwait(false);

            var preparingSeconds = stageSw.Elapsed.TotalSeconds;
            stageSw.Restart();

            // --- pass one: conform every clip to the canvas and burn in the mark.
            //
            // Run several at once. Normalizing a clip is almost entirely encoder work and
            // each one writes to its own output file, so nothing here is shared but the
            // workspace directory and the progress reporter - which is already lock-guarded.
            // Concurrency scales with cores, and each clip's encoder threads are budgeted so
            // processes don't thrash cores.
            var concurrency = Math.Clamp(Environment.ProcessorCount / 2, 2, 8);
            var perClipThreads = Math.Max(1, Environment.ProcessorCount / concurrency);

            var prepared = new SceneRenderResult[spec.AssetIds.Count];
            // Frozen first-frame seconds per clip, for the export timeline: a clip's added
            // sound starts after them, with its content.
            var leadIns = new double[spec.AssetIds.Count];
            var completedCount = 0;

            // Per-junction overrides win when the timeline supplied exactly one per gap;
            // otherwise every gap falls back to the single Transition/TransitionFrames
            // pair, which is the entire behaviour this had before junctions existed.
            var hasJunctionOverrides = spec.Junctions.Count > 0 && spec.Junctions.Count == spec.AssetIds.Count - 1;

            using var throttle = new SemaphoreSlim(concurrency);

            var clipTasks = Enumerable.Range(0, spec.AssetIds.Count).Select(async index =>
            {
                await throttle.WaitAsync(token).ConfigureAwait(false);
                try
                {
                    token.ThrowIfCancellationRequested();

                    var asset = assetMap.TryGetValue(spec.AssetIds[index], out var found) ? found : assetMap[ClipMergeService.CleanClipId(spec.AssetIds[index])];

                    // Positional, and only when there is exactly one entry per clip -
                    // the same tolerance junctions have, so a spec written before
                    // per-clip sound existed reads as "every clip as recorded".
                    var audio = perClipAudio ? spec.ClipAudio[index] : null;

                    string? extraAudio = null;
                    if (audio?.AudioAssetId is { Length: > 0 } extraId)
                    {
                        // A sound whose asset was deleted between queueing and running is
                        // dropped rather than failing the render, the same tolerance the
                        // timed music tracks below have.
                        materialized.TryGetValue(extraId, out extraAudio);
                    }

                    var isImage = asset.Kind == AssetKind.Image;

                    // Find the matching V1 timeline item for this asset to get transform/crop.
                    // Positional index matches 1:1 with timeline cut schedule.
                    var v1Item = v1ItemsList.ElementAtOrDefault(index)
                        ?? spec.TimelineItems.FirstOrDefault(
                            it => it.TrackId is "V1" or "video" && (it.Src == asset.Id || it.Src == spec.AssetIds[index]));
                    var v1Transform = v1Item?.Transform;

                    var prevJunction = hasJunctionOverrides && index > 0
                        ? spec.Junctions[index - 1]
                        : null;
                    var nextJunction = hasJunctionOverrides && index < spec.Junctions.Count
                        ? spec.Junctions[index]
                        : null;

                    var uniformJunctionSecs = spec.Transition != SceneTransition.None && spec.TransitionFrames > 0
                        ? spec.TransitionFrames / canvas.FrameRate.AsDouble
                        : 0.0;

                    var requestedLeadIn = prevJunction != null
                        ? prevJunction.LeadInSeconds
                        : (index > 0 ? uniformJunctionSecs / 2.0 : 0.0);
                    var requestedTailOut = nextJunction != null
                        ? nextJunction.TailOutSeconds
                        : (index < spec.AssetIds.Count - 1 ? uniformJunctionSecs / 2.0 : 0.0);

                    // The hold before the end card: the last clip's final frame, frozen.
                    var holdBeforeOutro = index == spec.AssetIds.Count - 1 && spec.Outro is { IsEnabled: true }
                        ? Math.Max(0, spec.OutroHoldSeconds) : 0.0;
                    requestedTailOut += holdBeforeOutro;

                    var origTrimStart = v1Item?.TrimStartSeconds;
                    var origTrimEnd = v1Item?.TrimEndSeconds;
                    var origDuration = v1Item?.Duration;

                    double? finalTrimStart = origTrimStart;
                    double? finalTrimEnd = origTrimEnd;
                    bool freezeHead = requestedLeadIn > 0;
                    bool freezeTail = requestedTailOut > 0;

                    if (!isImage && requestedLeadIn > 0)
                    {
                        // Preferred: borrow from spare media before trimStart if available.
                        if (origTrimStart.HasValue && origTrimStart.Value >= requestedLeadIn)
                        {
                            finalTrimStart = origTrimStart.Value - requestedLeadIn;
                            freezeHead = false;
                        }
                    }

                    // A hold is a still frame by request, never more footage from the file.
                    if (!isImage && requestedTailOut > 0 && holdBeforeOutro == 0)
                    {
                        // Preferred: borrow from spare media after trimEnd if available.
                        var fileDuration = asset.Probe.DurationSeconds;
                        if (fileDuration.HasValue && origTrimEnd.HasValue
                            && (origTrimEnd.Value + requestedTailOut <= fileDuration.Value + 0.001))
                        {
                            finalTrimEnd = origTrimEnd.Value + requestedTailOut;
                            freezeTail = false;
                        }
                    }

                    var clipDurationSec = origDuration
                        ?? (origTrimEnd.HasValue && origTrimStart.HasValue && origTrimEnd > origTrimStart ? origTrimEnd.Value - origTrimStart.Value : (double?)null)
                        ?? (isImage ? 5.0 : asset.Probe.DurationSeconds ?? 5.0);

                    var totalClipDur = clipDurationSec + (requestedLeadIn + requestedTailOut);
                    var imageDur = (origDuration ?? 5.0) + (isImage ? (requestedLeadIn + requestedTailOut) : 0);
                    var expectedFrames = FrameCount.FromSeconds(totalClipDur, canvas.FrameRate);

                    var plan = new ClipRenderPlan
                    {
                        ClipIndex = index,
                        SourceRelativePath = materialized[asset.Id],
                        Canvas = canvas,
                        OutputRelativePath = $"clips/clip_{index + 1:D3}.mp4",
                        ExpectedFrames = expectedFrames,
                        Fit = spec.Fit,
                        PadColorRgb = EraseRegionSpec.IsHexColor(spec.BackgroundColor)
                            ? spec.BackgroundColor![1..].ToLowerInvariant()
                            : "000000",
                        SourceIsImage = isImage,
                        ImageDurationSeconds = imageDur,
                        TrimStartSeconds = finalTrimStart,
                        TrimEndSeconds = finalTrimEnd,
                        DurationSeconds = origDuration,
                        LeadInSeconds = requestedLeadIn,
                        TailOutSeconds = requestedTailOut,
                        FreezeHead = !isImage && freezeHead,
                        FreezeTail = !isImage && freezeTail,
                        // A clip with no audio track needs generated silence, or the join
                        // produces a file that stops at the first silent clip.
                        SourceHasAudio = !isImage && !string.IsNullOrEmpty(asset.Probe.AudioCodec),
                        MuteAudio = spec.MuteClipAudio,
                        AudioVolume = audio?.Volume ?? 1.0,
                        ExtraAudioRelativePath = extraAudio,
                        ExtraAudioTrimStartSeconds = audio?.TrimStartSeconds,
                        ExtraAudioTrimEndSeconds = audio?.TrimEndSeconds,
                        ExtraAudioVolume = audio?.AudioVolume ?? 1.0,
                        KeepOwnAudio = audio?.KeepOriginalAudio ?? false,
                        Watermark = watermark,
                        Encoder = clipEncoder,
                        EncoderThreads = perClipThreads,
                        // Per-clip crop from transform inspector (applied before fit scaling).
                        CropLeft = v1Transform?.CropLeft ?? 0,
                        CropRight = v1Transform?.CropRight ?? 0,
                        CropTop = v1Transform?.CropTop ?? 0,
                        CropBottom = v1Transform?.CropBottom ?? 0,
                        // Normalized again here, not only at the API: the spec is a stored
                        // document, and the renderer must never see an out-of-frame box.
                        EraseRegions = (v1Transform?.EraseRegions ?? [])
                            .Select(r => r.Normalized())
                            .OfType<EraseRegionSpec>()
                            .Take(EraseRegionSpec.MaxPerClip)
                            .ToList(),
                        SourceWidth = asset.Probe?.Width,
                        SourceHeight = asset.Probe?.Height,
                    };



                    var result = await renderer
                        .RenderClipAsync(plan, workspace, reporter, token).ConfigureAwait(false);

                    prepared[index] = result;
                    leadIns[index] = plan.FreezeHead ? plan.LeadInSeconds : 0;
                    reporter.SceneCompleted(Interlocked.Increment(ref completedCount));
                }
                finally
                {
                    throttle.Release();
                }
            });

            await Task.WhenAll(clipTasks).ConfigureAwait(false);

            // --- the outro: conformed with the same encoder as the clips, so it joins them
            // by stream copy. No progress report - the aggregator's slots are the clips.
            var outro = await RenderOutroAsync(
                spec.Outro, assetMap, materialized, canvas, clipEncoder, settings, workspace,
                warnings, spec.AssetIds.Count, token).ConfigureAwait(false);

            var encodingSeconds = stageSw.Elapsed.TotalSeconds;
            stageSw.Restart();

            // --- pass two: join them. Transitions are clamped against the MEASURED
            // lengths, which is the earliest point at which they are known.
            token.ThrowIfCancellationRequested();

            var lengths = prepared.Select(p => p.Frames).ToList();

            // Per-junction overrides win when the timeline supplied exactly one per gap;
            // otherwise every gap falls back to the single Transition/TransitionFrames
            // pair, which is the entire behaviour this had before junctions existed.
            hasJunctionOverrides = spec.Junctions.Count > 0 && spec.Junctions.Count == lengths.Count - 1;

            var requestedFrames = hasJunctionOverrides
                ? spec.Junctions.Select(j => new FrameCount(j.TransitionFrames)).ToList()
                : Enumerable.Repeat(new FrameCount(spec.TransitionFrames), Math.Max(lengths.Count - 1, 0)).ToList();

            var transitions = lengths.Count < 2
                ? []
                : ClipPlanFactory.ClampTransitions(lengths, requestedFrames);

            var requestedByJunction = hasJunctionOverrides
                ? spec.Junctions.Select(j => j.TransitionFrames).ToList()
                : requestedFrames.Select(f => f.Value).ToList();

            if (transitions.Select((t, k) => (t, k))
                    .Any(pair => requestedByJunction[pair.k] > 0 && pair.t.Value < requestedByJunction[pair.k]))
            {
                warnings.Add("TRANSITION_SHORTENED");
            }

            var joined = new List<MergeSceneInput>(prepared.Length);
            for (var index = 0; index < prepared.Length; index++)
            {
                var kind = hasJunctionOverrides && index < spec.Junctions.Count
                    ? spec.Junctions[index].Transition
                    : spec.Transition;

                var toNext = index < transitions.Count && transitions[index].Value > 0
                    ? new TransitionSettings(kind, transitions[index])
                    : TransitionSettings.None;

                joined.Add(new MergeSceneInput(prepared[index].RelativePath, lengths[index], toNext));
            }

            // The outro joins after the last clip, clamped by the same half-the-shorter-
            // neighbour rule as every other junction. Only the outro's own setting decides
            // its transition, never the clips' uniform one.
            if (outro is not null)
            {
                var requested = new FrameCount(OutroPlanFactory.Crossfades(spec.Outro) ? spec.Outro.TransitionDurationFrames : 0);
                var intoOutro = ClipPlanFactory.ClampTransitions([lengths[^1], outro.Frames], requested)[0];

                if (intoOutro.Value > 0)
                {
                    joined[^1] = joined[^1] with
                    {
                        TransitionToNext = new TransitionSettings(spec.Outro.Transition, intoOutro)
                    };
                }

                transitions = [.. transitions, intoOutro];
                lengths.Add(outro.Frames);
                joined.Add(new MergeSceneInput(outro.RelativePath, outro.Frames, TransitionSettings.None));
            }

            var total = RenderTimeline.TotalLength(lengths, transitions);

            var timeline = ExportTimelineBuilder.Build(
                spec,
                id => assetMap.TryGetValue(id, out var a) ? a
                    : assetMap.GetValueOrDefault(ClipMergeService.CleanClipId(id)),
                new ExportTimelineFacts(
                    lengths, transitions,
                    [.. joined.Take(transitions.Count).Select(j => j.TransitionToNext.Kind)],
                    leadIns, canvas.FrameRate, total));

            reporter.Report(new RenderProgress(
                RenderStage.Merging, prepared.Length, prepared.Length, FrameCount.Zero, total,
                0, string.Empty, null));

            string? musicPath = null;
            if (spec.BackgroundMusicAssetId is { Length: > 0 } musicId
                && materialized.TryGetValue(musicId, out var resolvedMusic))
            {
                musicPath = resolvedMusic;
            }

            // Tracks whose asset was deleted between queueing and running are dropped
            // silently, the same tolerance the single bed above has always had.
            var timedTracks = spec.MusicTracks
                .Where(t => materialized.ContainsKey(t.AssetId))
                .Select(t => new MergeMusicTrack(
                    materialized[t.AssetId], t.StartSeconds, t.Volume,
                    t.TrimStartSeconds, t.TrimEndSeconds, t.IsVoiceover))
                .ToList();

            var overlays = new List<MergeOverlayItem>();
            for (var itemIndex = 0; itemIndex < spec.TimelineItems.Count; itemIndex++)
            {
                var item = spec.TimelineItems[itemIndex];
                if (IsOverlayTrack(item.TrackId))
                {
                    string? relPath = null;
                    MergeTextOverlay? text = null;
                    if (item.Type is "image" or "video")
                    {
                        materialized.TryGetValue(item.Src, out relPath);
                    }
                    else if (item.Type == "text")
                    {
                        text = await BuildTextOverlayAsync(
                            item, itemIndex, canvas, workspace, settings, warnings, token).ConfigureAwait(false);
                        if (text is null) continue;
                    }
                    var tr = item.Transform;
                    var txt = item.TextStyle;
                    overlays.Add(new MergeOverlayItem(
                        item.Type,
                        relPath,
                        item.StartTime,
                        item.Duration,
                        tr?.Scale ?? 1.0,
                        tr?.X ?? 0.0,
                        tr?.Y ?? 0.0,
                        tr?.Opacity ?? 1.0,
                        tr?.TransitionIn ?? txt?.TransitionIn ?? "fade",
                        tr?.TransitionInDuration ?? txt?.TransitionInDuration ?? 0.5,
                        tr?.TransitionOut ?? txt?.TransitionOut ?? "fade",
                        tr?.TransitionOutDuration ?? txt?.TransitionOutDuration ?? 0.5)
                    {
                        Text = text
                    });
                }
                else if (item.TrackId is "A1" or "A2" && item.Type == "audio")
                {
                    if (materialized.TryGetValue(item.Src, out var audioPath))
                    {
                        timedTracks.Add(new MergeMusicTrack(
                            audioPath, item.StartTime, item.Volume ?? 1.0,
                            item.TrimStartSeconds, item.TrimEndSeconds, item.TrackId == "A1"));
                    }
                }
            }

            var mergePlan = new MergePlan
            {
                Canvas = canvas,
                Scenes = joined,
                BackgroundMusicRelativePath = musicPath,
                BackgroundMusicVolume = spec.BackgroundMusicVolume,
                MusicTracks = timedTracks,
                YouTubeLoudness = spec.YouTubeLoudness,
                MusicDuckWindows = spec.MusicDuckWindows
                    .Select(w => new MergeDuckWindow(w.StartSeconds, w.EndSeconds, w.Level))
                    .ToList(),
                Overlays = overlays,
                OutputRelativePath = "out/final.mp4",
                // Always the delivery profile: whether this re-encodes or stream-copies,
                // its output is what the viewer downloads.
                Encoder = delivery
            };

            var merged = await renderer
                .MergeScenesAsync(mergePlan, workspace, reporter, token).ConfigureAwait(false);

            var mergingSeconds = stageSw.Elapsed.TotalSeconds;
            stageSw.Restart();

            // --- publish
            reporter.Report(new RenderProgress(
                RenderStage.Publishing, prepared.Length, prepared.Length, total, total,
                0, string.Empty, null));

            var outputKey = $"renders/{job.ProjectId}/{job.Id}/final.mp4";
            await workspace.PublishAsync(merged.RelativePath, outputKey, "video/mp4", token)
                .ConfigureAwait(false);

            var publishingSeconds = stageSw.Elapsed.TotalSeconds;
            var totalSeconds = totalSw.Elapsed.TotalSeconds;
            var outputDurationSeconds = merged.Frames.ToSeconds(canvas.FrameRate);
            var speedFactor = totalSeconds > 0 ? $"{outputDurationSeconds / totalSeconds:0.0}x" : "1.0x";

            job.Diagnostics = new RenderDiagnostics
            {
                TotalSeconds = Math.Round(totalSeconds, 1),
                PreparingSeconds = Math.Round(preparingSeconds, 1),
                EncodingSeconds = Math.Round(encodingSeconds, 1),
                MergingSeconds = Math.Round(mergingSeconds, 1),
                PublishingSeconds = Math.Round(publishingSeconds, 1),
                ItemsCount = prepared.Length,
                OutputDurationSeconds = Math.Round(outputDurationSeconds, 1),
                SpeedFactor = speedFactor,
                CompletedAt = clock.GetUtcNow().UtcDateTime,
                HardwareEncoder = activeEncoder

            };

            job.Status = warnings.Count > 0
                ? RenderJobStatus.CompletedWithWarnings
                : RenderJobStatus.Completed;
            job.Progress = 100;
            job.CurrentStage = RenderStage.Completed;
            job.Message = "Completed";
            job.OutputStorageKey = outputKey;
            job.OutputSizeBytes = merged.SizeBytes;
            job.OutputDurationFrames = merged.Frames.Value;
            job.Timeline = timeline;
            job.ScenesDone = prepared.Length;
            job.ScenesTotal = prepared.Length;
            job.Warnings = [.. warnings];

            // Auto-create "Exports" folder and save the video as an Asset
            var projectFolders = await folders.ListByProjectAsync(job.ProjectId, ct);
            var exportsFolder = projectFolders.FirstOrDefault(f => f.Name == "Exports");
            if (exportsFolder == null)
            {
                exportsFolder = new AssetFolder
                {
                    Id = Guid.NewGuid().ToString("N"),
                    ProjectId = job.ProjectId,
                    Name = "Exports",
                    CreatedAt = clock.GetUtcNow().UtcDateTime
                };
                await folders.InsertAsync(exportsFolder, ct);
            }

            var asset = new Asset
            {
                Id = Guid.NewGuid().ToString("N"),
                ProjectId = job.ProjectId,
                Name = string.IsNullOrWhiteSpace(job.ClipMerge?.ExportName) ? $"Export - {DateTime.UtcNow:yyyy-MM-dd HH:mm}" : job.ClipMerge!.ExportName!,
                DisplayFileName = string.IsNullOrWhiteSpace(job.ClipMerge?.ExportName) ? $"Export - {DateTime.UtcNow:yyyy-MM-dd HH:mm}.mp4" : job.ClipMerge!.ExportName + ".mp4",
                StorageKey = outputKey,
                FolderId = exportsFolder.Id,
                Kind = AssetKind.Video,
                MimeType = "video/mp4",
                FileSizeBytes = merged.SizeBytes,
                ReviewStatus = AssetReviewStatus.NotRequired,
                UsageScope = AssetUsageScope.SceneUse,
                CreatedAt = clock.GetUtcNow().UtcDateTime,
                Probe = new MediaProbe
                {
                    DurationSeconds = merged.Frames.ToSeconds(canvas.FrameRate),
                    Width = job.Width,
                    Height = job.Height,
                    VideoCodec = "h264"
                }
            };
            await assets.InsertAsync(asset, ct);

            await jobs.CompleteAsync(job, ct).ConfigureAwait(false);

            logger.LogInformation(
                "Clip merge {JobId} completed: {Clips} clips, {Frames} frames.",
                job.Id, prepared.Length, merged.Frames.Value);
        }
        catch (OperationCanceledException) when (reporter.CancelRequested)
        {
            workspace.MarkFailed("cancelled");
            job.Status = RenderJobStatus.Cancelled;
            job.Message = "Cancelled";
            await jobs.CompleteAsync(job, CancellationToken.None).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (reporter.LeaseLost)
        {
            // Another worker owns this job now; leave the record alone.
            logger.LogWarning("Clip merge {JobId} abandoned after losing its lease.", job.Id);
        }
        catch (RenderException ex)
        {
            workspace.MarkFailed(ex.Code.ToString());

            // ex.Message is the TECHNICAL detail - which ffmpeg invocation, and what budget
            // it blew. It is deliberately kept out of ex.UserMessage and therefore out of
            // the API response, but dropping it entirely is how a Timeout becomes
            // undiagnosable: the user sees "took too long" and the operator sees nothing at
            // all. It goes to the log, where the paths in it are the server's own.
            logger.LogError(
                "Clip merge {JobId} failed at {Stage} with {Code}: {Detail}",
                job.Id, reporter.LastStage, ex.Code, ex.Message);

            await FailAsync(job, ex.Code, ex.UserMessage, CancellationToken.None, reporter).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            workspace.MarkFailed("unexpected");
            logger.LogError(ex, "Clip merge {JobId} failed unexpectedly.", job.Id);
            // Deliberately generic: no exception text reaches the user.
            await FailAsync(job, RenderErrorCode.FfmpegError,
                "Joining the clips failed unexpectedly.", CancellationToken.None, reporter).ConfigureAwait(false);
        }
    }

    /// <summary>
    /// Loads every asset the spec names, in one round trip, keyed by id.
    /// <para>
    /// The project filter is re-applied here even though the request was already validated
    /// when the job was queued. A job document can outlive the check that created it, and
    /// this is the last point before a file is read off disk and written into someone's
    /// video.
    /// </para>
    /// </summary>
    private async Task<Dictionary<string, Asset>> LoadAssetsAsync(
        ClipMergeSpec spec, string projectId, CancellationToken ct)
    {
        var ids = new HashSet<string>(spec.AssetIds, StringComparer.Ordinal);

        if (spec.BackgroundMusicAssetId is { Length: > 0 } music) ids.Add(music);
        if (spec.Watermark.LogoAssetId is { Length: > 0 } logo) ids.Add(logo);
        if (OutroPlanFactory.AssetIdFor(spec.Outro) is { } outro) ids.Add(outro);
        foreach (var track in spec.MusicTracks) ids.Add(track.AssetId);

        foreach (var clip in spec.ClipAudio)
        {
            if (clip.AudioAssetId is { Length: > 0 } clipAudio) ids.Add(clipAudio);
        }

        foreach (var item in spec.TimelineItems)
        {
            if (item.Type is "image" or "video" or "audio" && !string.IsNullOrWhiteSpace(item.Src))
            {
                ids.Add(item.Src);
            }
        }

        var queryIds = new HashSet<string>(ids, StringComparer.Ordinal);
        foreach (var id in ids)
        {
            queryIds.Add(id);
            var clean = ClipMergeService.CleanClipId(id);
            if (!string.IsNullOrEmpty(clean)) queryIds.Add(clean);
        }

        var loaded = await assets.GetManyAsync(queryIds, ct).ConfigureAwait(false);

        var result = new Dictionary<string, Asset>(StringComparer.Ordinal);
        foreach (var a in loaded)
        {
            if ((string.Equals(a.ProjectId, projectId, StringComparison.Ordinal)
                 || string.Equals(a.ProjectId, "global", StringComparison.OrdinalIgnoreCase)
                 || string.Equals(a.ProjectId, "system", StringComparison.OrdinalIgnoreCase))
                && a.IsUsableInScene)
            {
                result[a.Id] = a;
                foreach (var origId in ids)
                {
                    if (string.Equals(origId, a.Id, StringComparison.Ordinal) || ClipMergeService.CleanClipId(origId) == a.Id)
                    {
                        result[origId] = a;
                    }
                }
            }
        }
        return result;
    }

    /// <summary>
    /// Copies each asset into the workspace once. The workspace de-duplicates by storage
    /// key, so a clip listed twice in the running order is fetched a single time.
    /// <para>
    /// Fetched several at a time: a hundred-clip stitch spent ~20s here copying files one
    /// after another while the disk sat mostly idle between them.
    /// </para>
    /// </summary>
    private static async Task<Dictionary<string, string>> MaterializeAsync(
        IRenderWorkspace workspace, Dictionary<string, Asset> assetMap, CancellationToken ct)
    {
        var paths = new System.Collections.Concurrent.ConcurrentDictionary<string, string>(
            StringComparer.Ordinal);

        var options = new ParallelOptions { MaxDegreeOfParallelism = 8, CancellationToken = ct };
        await Parallel.ForEachAsync(assetMap, options, async (entry, token) =>
        {
            var (id, asset) = entry;
            var extension = Path.GetExtension(asset.StorageKey);
            if (string.IsNullOrEmpty(extension))
            {
                extension = asset.Kind switch
                {
                    AssetKind.Image => ".png",
                    AssetKind.Audio => ".wav",
                    _ => ".mp4"
                };
            }

            var prefix = asset.Kind switch
            {
                AssetKind.Image => "img",
                AssetKind.Audio => "aud",
                _ => "vid"
            };

            // Generated name only: a client filename never reaches the filesystem.
            paths[id] = await workspace
                .MaterializeAsync(asset.StorageKey, $"in/{prefix}_{id}{extension}", token)
                .ConfigureAwait(false);
        }).ConfigureAwait(false);

        return new Dictionary<string, string>(paths, StringComparer.Ordinal);
    }

    /// <summary>
    /// Turns the stored watermark into a render plan, writing the text out to a file first.
    /// <para>
    /// The file exists so drawtext can read the line with <c>textfile=</c> instead of having
    /// it embedded in the filtergraph. A watermark is nearly always a URL, and every
    /// character that makes a URL a URL - the colon, the slashes - is syntax to drawtext's
    /// option parser.
    /// </para>
    /// <para>
    /// A text mark also needs a font FILE, and if the host has none the mark is dropped
    /// here with a warning the user sees on the finished video. The alternative - naming a
    /// family and letting drawtext resolve it through fontconfig - is not a fallback: on
    /// a build with fontconfig but no <c>fonts.conf</c> the failed lookup takes ffmpeg down
    /// with an access violation, so the render dies over a decoration.
    /// </para>
    /// </summary>
    private static async Task<WatermarkPlan?> BuildWatermarkAsync(
        ClipMergeSpec spec, Canvas canvas, Dictionary<string, string> materialized,
        IRenderWorkspace workspace, ClipRenderSettings settings,
        ISet<string> warnings, CancellationToken ct)
    {
        if (!spec.Watermark.IsEnabled) return null;

        string? textPath = null;
        if (spec.Watermark.Kind == WatermarkKind.Text && spec.Watermark.Text is { Length: > 0 } text)
        {
            // No trailing newline: drawtext would render it as a second, empty line and
            // shift the mark half its height off the position it was given.
            textPath = await workspace.WriteTextAsync("wm/watermark.txt", text, ct)
                .ConfigureAwait(false);
        }

        string? logoPath = null;
        if (spec.Watermark.LogoAssetId is { Length: > 0 } logoId)
            materialized.TryGetValue(logoId, out logoPath);

        // Re-checked rather than trusted: the worker resolved this path at startup, and a
        // font file can be removed between then and now. A missing fontfile= is a hard
        // drawtext failure, so it is better found here than in ffmpeg's stderr.
        // Chosen for the text itself, so a Hindi mark gets a face that has Devanagari.
        var fontFile = (spec.Watermark.Text is { Length: > 0 } markText ? settings.FontFor(markText) : settings.WatermarkFontFile) is { Length: > 0 } candidate
                       && File.Exists(candidate)
            ? candidate
            : null;

        if (textPath is not null && fontFile is null) warnings.Add("WATERMARK_UNAVAILABLE");

        return ClipPlanFactory.CreateWatermark(
            spec.Watermark, canvas, logoPath, textPath, fontFile);
    }

    /// <summary>
    /// Wraps a text overlay into the lines the preview showed and writes each to its own
    /// file. Null - with a warning - when there is nothing to draw it with: no drawtext, or
    /// no font file that can draw this script. A caption is not worth the render, and a
    /// drawtext without a font file is the one input that crashes ffmpeg rather than
    /// failing it (see <see cref="BuildWatermarkAsync"/>).
    /// </summary>
    private async Task<MergeTextOverlay?> BuildTextOverlayAsync(
        TimelineItemSpec item, int itemIndex, Canvas canvas, IRenderWorkspace workspace,
        ClipRenderSettings settings, ISet<string> warnings, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(item.Src) || item.Duration <= 0) return null;

        var look = TextOverlayLayout.Resolve(item.TextStyle);
        var source = look.Uppercase ? item.Src.ToUpperInvariant() : item.Src;
        var lines = TextOverlayLayout.Wrap(source, look.FontSize, canvas.Width, canvas.Height);
        if (lines.All(l => l.Length == 0)) return null;

        var fontFile = capabilities.Supports(RenderFeature.DrawText)
                       && settings.FontFor(source) is { Length: > 0 } candidate
                       && File.Exists(candidate)
            ? candidate
            : null;
        if (fontFile is null)
        {
            warnings.Add("TEXT_OVERLAY_UNAVAILABLE");
            return null;
        }

        var paths = new List<string?>(lines.Count);
        for (var i = 0; i < lines.Count; i++)
        {
            // Generated names only: the item id is client-supplied and never reaches the disk.
            paths.Add(lines[i].Length == 0
                ? null
                : await workspace
                    .WriteTextAsync($"txt/overlay_{itemIndex:D3}_{i}.txt", lines[i], ct)
                    .ConfigureAwait(false));
        }

        return new MergeTextOverlay(paths, fontFile, look);
    }

    /// <summary>
    /// Conforms the outro - a bumper video, an end-card image, or a composed QR card - to
    /// the export's canvas and encoder. Null when there is none, or when its asset was
    /// deleted after queueing: a missing outro costs a warning, not the export.
    /// </summary>
    private async Task<SceneRenderResult?> RenderOutroAsync(
        OutroSettings? outro, Dictionary<string, Asset> assetMap, Dictionary<string, string> materialized,
        Canvas canvas, EncoderProfile encoder, ClipRenderSettings settings, IRenderWorkspace workspace,
        HashSet<string> warnings, int clipIndex, CancellationToken ct)
    {
        if (outro is not { IsEnabled: true }) return null;

        var id = OutroPlanFactory.AssetIdFor(outro);
        Asset? asset = null;
        string? path = null;
        if (id is not null && assetMap.TryGetValue(id, out var found) && materialized.TryGetValue(id, out var p))
            (asset, path) = (found, p);

        var plan = await OutroPlanFactory.CreateAsync(
            outro, asset, path, canvas,
            capabilities.Supports(RenderFeature.DrawText) ? settings.FontFor : null,
            encoder, workspace, clipIndex, warnings, ct).ConfigureAwait(false);

        return plan is null
            ? null
            : await renderer.RenderClipAsync(plan, workspace, null, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Tracks composited over the main video in the join. Any item on one forces the join
    /// to re-encode, so this decides both the overlay list and the stream-copy prediction.
    /// </summary>
    internal static bool IsOverlayTrack(string? trackId) =>
        trackId is "IMG1" or "IMG" or "IMAGE" or "V2" or "V3" or "TXT1";

    /// <summary>Zero transitions, for the pre-flight total used to weight progress.</summary>
    private static IReadOnlyList<FrameCount> ZerosFor(IReadOnlyList<FrameCount> lengths) =>
        lengths.Count < 2 ? [] : [.. Enumerable.Repeat(FrameCount.Zero, lengths.Count - 1)];

    /// <summary>
    /// Records a terminal failure.
    /// <para>
    /// <paramref name="reporter"/> is not optional decoration. Completing a job REPLACES
    /// the whole document with this in-memory copy, whose stage and counters are still the
    /// ones it was claimed with - so without this, every failure is filed as "Preparing,
    /// 0 of 24 clips", whatever it was really doing. Null only for the pre-flight checks
    /// that run before a reporter exists, where those claim-time values are the truth.
    /// </para>
    /// </summary>
    private async Task FailAsync(
        RenderJob job, RenderErrorCode code, string userMessage, CancellationToken ct,
        JobProgressReporter? reporter = null)
    {
        job.Status = RenderJobStatus.Failed;
        job.ErrorCode = code.ToString();
        job.ErrorMessage = userMessage;
        job.Message = "Failed";

        if (reporter is not null)
        {
            job.Progress = reporter.LastPercent;
            job.ScenesDone = reporter.ItemsDone;
            if (reporter.LastStage != RenderStage.None) job.CurrentStage = reporter.LastStage;
        }

        await jobs.CompleteAsync(job, ct).ConfigureAwait(false);
    }
}
