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
    TimeSpan LeaseDuration);

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

        var hasMusic = !string.IsNullOrEmpty(spec.BackgroundMusicAssetId) || spec.MusicTracks.Count > 0;
        var hasTransitions = spec.TransitionFrames > 0
            || spec.Junctions.Any(j => j.Transition != SceneTransition.None && j.TransitionFrames > 0);
        var willStreamCopy = !hasTransitions && !hasMusic && spec.TimelineItems.All(it => it.TrackId is "V1" or "video");

        // Per-clip sound costs the join nothing: it is mixed in pass one, so every
        // conformed clip still comes out with the same single audio stream and the join
        // can still be a stream copy.
        var perClipAudio = spec.ClipAudio.Count == spec.AssetIds.Count;

        // When the join is a stream copy, pass one's output IS the delivered video, so it
        // gets the delivery preset. When the join re-encodes - any transition, or a music
        // bed - pass one is writing a file whose only reader is ffmpeg, one step later, and
        // spending the slow preset on it buys nothing. The CRF is the same either way, so
        // this changes how long the intermediate takes to write and how big it is, not how
        // the finished video looks.
        var clipEncoder = willStreamCopy
            ? settings.Delivery
            : settings.Delivery.ForIntermediate(settings.IntermediatePreset);

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

            // --- pass one: conform every clip to the canvas and burn in the mark.
            //
            // Run several at once. Normalizing a clip is almost entirely encoder work and
            // each one writes to its own output file, so nothing here is shared but the
            // workspace directory and the progress reporter - which is already lock-guarded.
            // The degree is capped, and each clip's own encoder threads are divided down to
            // match, so a run of these does not turn into every process fighting the others
            // for every core; on a multi-core machine it still finishes the whole batch
            // sooner than encoding one clip at a time ever could.
            var concurrency = Math.Clamp(Environment.ProcessorCount, 2, 8);
            var perClipThreads = concurrency > 1
                ? Math.Max(1, Environment.ProcessorCount / concurrency)
                : 0;

            var prepared = new SceneRenderResult[spec.AssetIds.Count];
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

                    if (!isImage && requestedTailOut > 0)
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
                    };



                    var result = await renderer
                        .RenderClipAsync(plan, workspace, reporter, token).ConfigureAwait(false);

                    prepared[index] = result;
                    reporter.SceneCompleted(Interlocked.Increment(ref completedCount));
                }
                finally
                {
                    throttle.Release();
                }
            });

            await Task.WhenAll(clipTasks).ConfigureAwait(false);

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

            var total = RenderTimeline.TotalLength(lengths, transitions);

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
                    t.TrimStartSeconds, t.TrimEndSeconds))
                .ToList();

            var overlays = new List<MergeOverlayItem>();
            foreach (var item in spec.TimelineItems)
            {
                if (item.TrackId is "IMG1" or "IMG" or "IMAGE" or "V2" or "V3" or "TXT1")
                {
                    string? relPath = null;
                    if (item.Type is "image" or "video")
                    {
                        materialized.TryGetValue(item.Src, out relPath);
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
                        item.Src,
                        txt?.FontSize ?? 36.0,
                        txt?.Color ?? "#ffffff",
                        txt?.BackgroundColor ?? "rgba(0,0,0,0.6)",
                        txt?.Position ?? "bottom",
                        tr?.TransitionIn ?? txt?.TransitionIn ?? "fade",
                        tr?.TransitionInDuration ?? txt?.TransitionInDuration ?? 0.5,
                        tr?.TransitionOut ?? txt?.TransitionOut ?? "fade",
                        tr?.TransitionOutDuration ?? txt?.TransitionOutDuration ?? 0.5));
                }
                else if (item.TrackId is "A1" or "A2" && item.Type == "audio")
                {
                    if (materialized.TryGetValue(item.Src, out var audioPath))
                    {
                        timedTracks.Add(new MergeMusicTrack(
                            audioPath, item.StartTime, item.Volume ?? 1.0,
                            item.TrimStartSeconds, item.TrimEndSeconds));
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
                MusicDuckWindows = spec.MusicDuckWindows
                    .Select(w => new MergeDuckWindow(w.StartSeconds, w.EndSeconds, w.Level))
                    .ToList(),
                Overlays = overlays,
                OutputRelativePath = "out/final.mp4",
                // Always the delivery profile: whether this re-encodes or stream-copies,
                // its output is what the viewer downloads.
                Encoder = settings.Delivery
            };

            var merged = await renderer
                .MergeScenesAsync(mergePlan, workspace, reporter, token).ConfigureAwait(false);

            // --- publish
            reporter.Report(new RenderProgress(
                RenderStage.Publishing, prepared.Length, prepared.Length, total, total,
                0, string.Empty, null));

            var outputKey = $"renders/{job.ProjectId}/{job.Id}/final.mp4";
            await workspace.PublishAsync(merged.RelativePath, outputKey, "video/mp4", token)
                .ConfigureAwait(false);

            job.Status = warnings.Count > 0
                ? RenderJobStatus.CompletedWithWarnings
                : RenderJobStatus.Completed;
            job.Progress = 100;
            job.CurrentStage = RenderStage.Completed;
            job.Message = "Completed";
            job.OutputStorageKey = outputKey;
            job.OutputSizeBytes = merged.SizeBytes;
            job.OutputDurationFrames = merged.Frames.Value;
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
    /// </summary>
    private static async Task<Dictionary<string, string>> MaterializeAsync(
        IRenderWorkspace workspace, Dictionary<string, Asset> assetMap, CancellationToken ct)
    {
        var paths = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var (id, asset) in assetMap)
        {
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
                .MaterializeAsync(asset.StorageKey, $"in/{prefix}_{id}{extension}", ct)
                .ConfigureAwait(false);
        }

        return paths;
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
        var fontFile = settings.WatermarkFontFile is { Length: > 0 } candidate
                       && File.Exists(candidate)
            ? candidate
            : null;

        if (textPath is not null && fontFile is null) warnings.Add("WATERMARK_UNAVAILABLE");

        return ClipPlanFactory.CreateWatermark(
            spec.Watermark, canvas, logoPath, textPath, fontFile);
    }

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
