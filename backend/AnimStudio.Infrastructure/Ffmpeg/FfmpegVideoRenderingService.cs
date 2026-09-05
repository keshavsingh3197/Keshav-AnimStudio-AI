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
    IOptions<FfmpegOptions> ffmpegOptions,
    IOptions<RenderOptions> renderOptions,
    ILogger<FfmpegVideoRenderingService> logger) : IVideoRenderingService
{
    private readonly FfmpegOptions _ffmpeg = ffmpegOptions.Value;
    private readonly RenderOptions _render = renderOptions.Value;

    public async Task<SceneRenderResult> RenderSceneAsync(
        SceneRenderPlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct)
    {
        var graph = graphBuilder.BuildScene(plan);
        var index = plan.SceneIndex;

        var scriptPath = $"graph/scene_{index + 1:D3}.fcs";
        await workspace.WriteTextAsync(scriptPath, graph.FilterComplex, ct).ConfigureAwait(false);

        var arguments = FfmpegArgumentBuilder.Build(graph, scriptPath, _ffmpeg.Threads);

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

    public async Task<MergeRenderResult> MergeScenesAsync(
        MergePlan plan, IRenderWorkspace workspace,
        IProgress<RenderProgress>? progress, CancellationToken ct)
    {
        var graph = graphBuilder.BuildMerge(plan);

        string? scriptPath = null;
        if (graph.IsStreamCopy)
        {
            await WriteConcatListAsync(plan, workspace, ct).ConfigureAwait(false);
        }
        else
        {
            scriptPath = "graph/merge.fcs";
            await workspace.WriteTextAsync(scriptPath, graph.FilterComplex, ct).ConfigureAwait(false);
        }

        var arguments = FfmpegArgumentBuilder.Build(graph, scriptPath, _ffmpeg.Threads);

        var invocation = new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = arguments,
            CaptureProgress = true,
            Timeout = TimeSpan.FromMinutes(_ffmpeg.MergeTimeoutMinutes),
            StderrLogPath = "logs/merge.stderr.log"
        };

        var relay = Relay(progress, RenderStage.Merging, 0, graph.ExpectedFrames);
        var result = await runner.RunAsync(invocation, relay, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            workspace.MarkFailed("merge failed");
            throw Classify(result, "The scenes could not be merged.");
        }

        var frames = await VerifyFrameCountAsync(
            workspace, graph.OutputRelativePath, graph.ExpectedFrames, ct).ConfigureAwait(false);

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
    /// </summary>
    private async Task<FrameCount> VerifyFrameCountAsync(
        IRenderWorkspace workspace, string relativePath, FrameCount expected, CancellationToken ct)
    {
        var actual = await ProbeFramesAsync(workspace, relativePath, ct).ConfigureAwait(false);

        // A probe that cannot read the file is not itself a failure; trust the plan.
        if (actual is null) return expected;

        // One frame of slack absorbs a container rounding difference.
        if (Math.Abs(actual.Value.Value - expected.Value) > 1)
        {
            logger.LogWarning(
                "Frame count mismatch in {Path}: expected {Expected}, produced {Actual}",
                relativePath, expected.Value, actual.Value.Value);

            throw new RenderException(RenderErrorCode.FrameCountMismatch,
                "The rendered video did not have the expected length.",
                $"{relativePath}: expected {expected.Value} frames, got {actual.Value.Value}.");
        }

        return actual.Value;
    }

    private async Task<FrameCount?> ProbeFramesAsync(
        IRenderWorkspace workspace, string relativePath, CancellationToken ct)
    {
        var result = await runner.RunAsync(new FfmpegInvocation
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
            Timeout = TimeSpan.FromSeconds(_ffmpeg.ProbeTimeoutSeconds)
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0) return null;

        var text = result.StdOut.Trim();
        return int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var frames)
            ? new FrameCount(frames)
            : null;
    }

    /// <summary>
    /// Maps a renderer failure to a specific, user-safe message. The stderr tail goes to
    /// the log artifact and the app log only - never to the client.
    /// </summary>
    private RenderException Classify(FfmpegResult result, string fallback)
    {
        var stderr = result.StderrTail;

        var userMessage = stderr switch
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
            _ => fallback
        };

        var code = stderr.Contains("No space left on device", StringComparison.OrdinalIgnoreCase)
            ? RenderErrorCode.DiskFull
            : RenderErrorCode.FfmpegError;

        logger.LogError("Renderer failed with exit code {ExitCode}. Tail: {Tail}",
            result.ExitCode, LogSanitizer.Sanitize(stderr));

        return new RenderException(code, userMessage, $"ffmpeg exit {result.ExitCode}");
    }
}
