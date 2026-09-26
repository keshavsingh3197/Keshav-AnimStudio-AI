using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Jobs;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Rendering;

public sealed record RenderSettings(
    int KenBurnsSupersample, int MouthFlapHz, string SubtitleFontName, int SubtitleFontSize,
    TimeSpan LeaseDuration);

/// <summary>
/// Runs one render job from claim to published MP4.
/// </summary>
public sealed class ProjectRenderOrchestrator(
    IProjectRepository projects,
    ISceneRepository scenes,
    ICharacterRepository characters,
    IAssetRepository assets,
    IRenderJobRepository jobs,
    IVideoRenderingService renderer,
    IRenderWorkspaceFactory workspaces,
    ISubtitleWriter subtitles,
    IRenderCapabilities capabilities,
    TimeProvider clock,
    ILogger<ProjectRenderOrchestrator> logger)
{
    public async Task ExecuteAsync(
        RenderJob job, string leaseOwner, RenderSettings settings, CancellationToken ct)
    {
        // Refuse early with a clear reason rather than failing deep inside a render.
        if (!capabilities.IsAvailable)
        {
            await FailAsync(job, RenderErrorCode.RendererUnavailable,
                capabilities.UnavailableReason ?? "Video rendering is not configured on this server.",
                ct).ConfigureAwait(false);
            return;
        }

        var project = await projects.GetAsync(job.ProjectId, ct).ConfigureAwait(false);
        if (project is null)
        {
            await FailAsync(job, RenderErrorCode.NoScenes, "This project no longer exists.", ct)
                .ConfigureAwait(false);
            return;
        }

        var sceneList = await scenes.ListByProjectAsync(job.ProjectId, ct).ConfigureAwait(false);
        if (sceneList.Count == 0)
        {
            await FailAsync(job, RenderErrorCode.NoScenes, "This project has no scenes to render.", ct)
                .ConfigureAwait(false);
            return;
        }

        var canvas = project.Settings.ToCanvas();
        canvas.Validate();

        var lengths = sceneList.Select(s => s.Duration).ToList();
        var transitions = sceneList
            .Take(sceneList.Count - 1)
            .Select(s => s.Transition.IsCut ? FrameCount.Zero : s.Transition.Duration)
            .ToList();

        // Validate the whole timeline before encoding a single frame.
        RenderTimeline.Validate(lengths, transitions);

        var hasMusic = !string.IsNullOrEmpty(project.Settings.BackgroundMusicAssetId);
        var total = RenderTimeline.TotalLength(lengths, transitions);
        var streamCopy = RenderTimeline.CanStreamCopy(transitions, hasMusic);

        var aggregator = new RenderProgressAggregator(lengths, total, streamCopy);

        await using var reporter = new JobProgressReporter(
            jobs, aggregator, job.Id, leaseOwner, settings.LeaseDuration, sceneList.Count,
            clock, logger);

        // Linked so a user cancellation or a lost lease stops the renderer promptly.
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct, reporter.AbortToken);
        var token = linked.Token;

        await using var workspace = await workspaces.CreateAsync(job.Id, token).ConfigureAwait(false);

        try
        {
            var characterMap = (await characters.ListByProjectAsync(job.ProjectId, token)
                .ConfigureAwait(false)).ToDictionary(c => c.Id);

            var assetMap = await LoadAssetsAsync(sceneList, characterMap.Values, project, token)
                .ConfigureAwait(false);

            reporter.Report(new RenderProgress(
                RenderStage.Preparing, 0, sceneList.Count, FrameCount.Zero, total, 0, string.Empty, null));

            var materialized = await MaterializeAsync(workspace, assetMap, token).ConfigureAwait(false);

            // --- render each scene
            var rendered = new List<MergeSceneInput>(sceneList.Count);

            for (var index = 0; index < sceneList.Count; index++)
            {
                token.ThrowIfCancellationRequested();

                var scene = sceneList[index];
                var subtitlePath = await WriteSubtitlesAsync(
                    workspace, scene, canvas, characterMap, settings, index, token).ConfigureAwait(false);

                var plan = RenderPlanFactory.Create(
                    new SceneRenderContext(scene, canvas, characterMap, assetMap, materialized,
                        subtitlePath, settings.KenBurnsSupersample, settings.MouthFlapHz),
                    index,
                    $"scenes/scene_{index + 1:D3}.mp4");

                var result = await renderer
                    .RenderSceneAsync(plan, workspace, reporter, token).ConfigureAwait(false);

                rendered.Add(new MergeSceneInput(result.RelativePath, result.Frames, scene.Transition));
                reporter.SceneCompleted(index + 1);
            }

            // --- optional outro bumper / end-card
            if (project.Settings.DefaultOutro.IsEnabled
                && !string.IsNullOrEmpty(project.Settings.DefaultOutro.AssetId)
                && materialized.TryGetValue(project.Settings.DefaultOutro.AssetId, out var outroSourcePath)
                && assetMap.TryGetValue(project.Settings.DefaultOutro.AssetId, out var outroAsset))
            {
                var isImage = outroAsset.Kind == AssetKind.Image;
                var outroDurationSec = isImage
                    ? project.Settings.DefaultOutro.DurationSeconds
                    : (outroAsset.Probe.DurationSeconds ?? 4.0);
                var outroFrames = new FrameCount((int)Math.Max(1, Math.Round(outroDurationSec * canvas.FrameRate.AsDouble)));

                var outroPlan = new ClipRenderPlan
                {
                    ClipIndex = sceneList.Count,
                    SourceRelativePath = outroSourcePath,
                    Canvas = canvas,
                    OutputRelativePath = "scenes/scene_outro.mp4",
                    ExpectedFrames = outroFrames,
                    Fit = ClipFit.Contain,
                    SourceIsImage = isImage,
                    ImageDurationSeconds = project.Settings.DefaultOutro.DurationSeconds,
                    SourceHasAudio = !isImage && !string.IsNullOrEmpty(outroAsset.Probe.AudioCodec),
                    MuteAudio = false,
                    Watermark = null,
                    Encoder = EncoderProfile.Default,
                    EncoderThreads = 0
                };

                var outroResult = await renderer
                    .RenderClipAsync(outroPlan, workspace, reporter, token).ConfigureAwait(false);

                if (rendered.Count > 0 && project.Settings.DefaultOutro.Transition != SceneTransition.None)
                {
                    var transDuration = new FrameCount(project.Settings.DefaultOutro.TransitionDurationFrames);
                    rendered[^1] = rendered[^1] with
                    {
                        TransitionToNext = new TransitionSettings(project.Settings.DefaultOutro.Transition, transDuration)
                    };
                }

                rendered.Add(new MergeSceneInput(outroResult.RelativePath, outroResult.Frames, TransitionSettings.None));
            }

            // --- merge
            token.ThrowIfCancellationRequested();
            reporter.Report(new RenderProgress(
                RenderStage.Merging, sceneList.Count, sceneList.Count, FrameCount.Zero, total,
                0, string.Empty, null));

            string? musicPath = null;
            if (hasMusic
                && materialized.TryGetValue(project.Settings.BackgroundMusicAssetId!, out var resolved))
            {
                musicPath = resolved;
            }

            var mergePlan = new MergePlan
            {
                Canvas = canvas,
                Scenes = rendered,
                BackgroundMusicRelativePath = musicPath,
                BackgroundMusicVolume = project.Settings.BackgroundMusicVolume,
                OutputRelativePath = "out/final.mp4"
            };

            var merged = await renderer
                .MergeScenesAsync(mergePlan, workspace, reporter, token).ConfigureAwait(false);

            // --- publish
            reporter.Report(new RenderProgress(
                RenderStage.Publishing, sceneList.Count, sceneList.Count, total, total,
                0, string.Empty, null));

            var outputKey = $"renders/{job.ProjectId}/{job.Id}/final.mp4";
            await workspace.PublishAsync(merged.RelativePath, outputKey, "video/mp4", token)
                .ConfigureAwait(false);

            job.Status = RenderJobStatus.Completed;
            job.Progress = 100;
            job.CurrentStage = RenderStage.Completed;
            job.Message = "Completed";
            job.OutputStorageKey = outputKey;
            job.OutputSizeBytes = merged.SizeBytes;
            job.OutputDurationFrames = merged.Frames.Value;
            job.ScenesDone = sceneList.Count;
            job.ScenesTotal = sceneList.Count;

            await jobs.CompleteAsync(job, ct).ConfigureAwait(false);
            logger.LogInformation("Job {JobId} completed: {Frames} frames.", job.Id, merged.Frames.Value);
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
            logger.LogWarning("Job {JobId} abandoned after losing its lease.", job.Id);
        }
        catch (RenderException ex)
        {
            workspace.MarkFailed(ex.Code.ToString());
            await FailAsync(job, ex.Code, ex.UserMessage, CancellationToken.None).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            workspace.MarkFailed("unexpected");
            logger.LogError(ex, "Job {JobId} failed unexpectedly.", job.Id);
            // Deliberately generic: no exception text reaches the user.
            await FailAsync(job, RenderErrorCode.FfmpegError,
                "Rendering failed unexpectedly.", CancellationToken.None).ConfigureAwait(false);
        }
    }

    private async Task<Dictionary<string, Asset>> LoadAssetsAsync(
        IReadOnlyList<Scene> sceneList, IEnumerable<Character> characterList,
        Domain.Projects.Project project, CancellationToken ct)
    {
        var ids = new HashSet<string>(StringComparer.Ordinal);

        foreach (var scene in sceneList)
        {
            if (!string.IsNullOrEmpty(scene.BackgroundAssetId)) ids.Add(scene.BackgroundAssetId);
            if (!string.IsNullOrEmpty(scene.Audio.AssetId)) ids.Add(scene.Audio.AssetId!);
        }

        foreach (var character in characterList)
        {
            if (!string.IsNullOrEmpty(character.Sprites.ClosedMouthAssetId))
                ids.Add(character.Sprites.ClosedMouthAssetId!);
            if (!string.IsNullOrEmpty(character.Sprites.OpenMouthAssetId))
                ids.Add(character.Sprites.OpenMouthAssetId!);
        }

        if (!string.IsNullOrEmpty(project.Settings.BackgroundMusicAssetId))
            ids.Add(project.Settings.BackgroundMusicAssetId!);

        if (project.Settings.DefaultOutro.IsEnabled && !string.IsNullOrEmpty(project.Settings.DefaultOutro.AssetId))
            ids.Add(project.Settings.DefaultOutro.AssetId!);

        var loaded = await assets.GetManyAsync(ids, ct).ConfigureAwait(false);
        return loaded.ToDictionary(a => a.Id);
    }

    /// <summary>
    /// Copies every asset into the workspace once. The workspace de-duplicates by storage
    /// key, so a background reused across scenes is fetched a single time.
    /// </summary>
    private static async Task<Dictionary<string, string>> MaterializeAsync(
        IRenderWorkspace workspace, Dictionary<string, Asset> assetMap, CancellationToken ct)
    {
        var paths = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var (id, asset) in assetMap)
        {
            var extension = Path.GetExtension(asset.StorageKey);
            if (string.IsNullOrEmpty(extension)) extension = ExtensionFor(asset.Kind);

            // Generated name only: a client filename never reaches the filesystem.
            var prefix = asset.Kind switch
            {
                AssetKind.Image => "img",
                AssetKind.Audio => "aud",
                AssetKind.Video => "vid",
                _ => "obj"
            };

            var relative = $"in/{prefix}_{id}{extension}";
            paths[id] = await workspace.MaterializeAsync(asset.StorageKey, relative, ct)
                .ConfigureAwait(false);
        }

        return paths;
    }

    private static string ExtensionFor(AssetKind kind) => kind switch
    {
        AssetKind.Image => ".png",
        AssetKind.Audio => ".wav",
        AssetKind.Video => ".mp4",
        _ => ".bin"
    };

    private async Task<string?> WriteSubtitlesAsync(
        IRenderWorkspace workspace, Scene scene, Canvas canvas,
        Dictionary<string, Character> characterMap, RenderSettings settings, int index,
        CancellationToken ct)
    {
        if (scene.Dialogue.Count == 0) return null;
        if (!capabilities.Supports(RenderFeature.BurnedSubtitles)) return null;

        var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal);
        foreach (var line in scene.Dialogue)
        {
            if (line.SpeakerCharacterId is not { } id) continue;
            if (styles.ContainsKey(id)) continue;
            if (!characterMap.TryGetValue(id, out var character)) continue;

            styles[id] = new SubtitleStyle(character.Name, character.SubtitleColorHex);
        }

        var content = subtitles.Write(new SubtitleRequest(
            canvas, scene.Dialogue, styles, settings.SubtitleFontName, settings.SubtitleFontSize));

        var relative = $"sub/scene_{index + 1:D3}.ass";
        return await workspace.WriteTextAsync(relative, content, ct).ConfigureAwait(false);
    }

    private async Task FailAsync(
        RenderJob job, RenderErrorCode code, string userMessage, CancellationToken ct)
    {
        job.Status = RenderJobStatus.Failed;
        job.ErrorCode = code.ToString();
        job.ErrorMessage = userMessage;
        job.Message = "Failed";

        await jobs.CompleteAsync(job, ct).ConfigureAwait(false);
    }
}
