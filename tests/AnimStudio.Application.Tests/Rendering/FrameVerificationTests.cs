using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// How a finished render's length is checked.
/// <para>
/// This is guarding a failure that was as bad as failures get: the render SUCCEEDED, and
/// then the check on it threw the result away and reported "Rendering took too long and was
/// stopped". Verification is allowed to be inconclusive. It is not allowed to be the reason
/// a good video is lost.
/// </para>
/// </summary>
public class FrameVerificationTests : IDisposable
{
    private readonly string _root = Path.Combine(
        Path.GetTempPath(), "animstudio-verify", Guid.NewGuid().ToString("n"));

    /// <summary>Records what was asked of ffprobe and answers from a script.</summary>
    private sealed class ScriptedRunner : IFfmpegRunner
    {
        private readonly Queue<Func<FfmpegInvocation, FfmpegResult>> _answers = new();

        public List<FfmpegInvocation> Calls { get; } = [];

        public ScriptedRunner Then(Func<FfmpegInvocation, FfmpegResult> answer)
        {
            _answers.Enqueue(answer);
            return this;
        }

        public Task<FfmpegResult> RunAsync(
            FfmpegInvocation invocation, IProgress<FfmpegProgress>? progress, CancellationToken ct)
        {
            Calls.Add(invocation);

            var answer = _answers.Count > 0
                ? _answers.Dequeue()
                : _ => new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero);

            return Task.FromResult(answer(invocation));
        }
    }

    private static bool CountsFrames(FfmpegInvocation invocation) =>
        invocation.Arguments.Contains("-count_frames");

    private FfmpegVideoRenderingService Service(IFfmpegRunner runner, int probeTimeoutSeconds = 30)
    {
        var options = Microsoft.Extensions.Options.Options.Create(new FfmpegOptions
        {
            ProbeTimeoutSeconds = probeTimeoutSeconds,
            MaxMergeInputs = 64
        });

        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true, HasXfade = true, HasAcrossfade = true,
            HasLibx264 = true, HasAac = true, Major = 7
        };

        return new FfmpegVideoRenderingService(
            runner,
            new FfmpegFilterGraphBuilder(capabilities),
            capabilities,
            options,
            Microsoft.Extensions.Options.Options.Create(new RenderOptions()),
            NullLogger<FfmpegVideoRenderingService>.Instance);
    }

    private IRenderWorkspace Workspace() =>
        new LocalRenderWorkspace(
            "verify-job", _root, new NullStore(),
            NullLogger<LocalRenderWorkspace>.Instance, keepOnFailure: false);

    /// <summary>Two 300-frame clips joined by a 15-frame crossfade: 585 frames out.</summary>
    private static MergePlan Plan() => new()
    {
        Canvas = Canvas.Hd1080p30,
        Scenes =
        [
            new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300),
                new TransitionSettings(SceneTransition.Fade, new FrameCount(15))),
            new MergeSceneInput("clips/clip_002.mp4", new FrameCount(300), TransitionSettings.None)
        ],
        OutputRelativePath = "out/final.mp4"
    };

    [Fact]
    public async Task Reads_the_length_from_the_container_instead_of_decoding_the_whole_video()
    {
        // -count_frames decodes every frame of the finished film. Measured on 60s of
        // 1080p30 that is 7804ms against 95ms to read nb_frames - the same answer, 82x
        // slower - so on a four-minute stitch it walked straight into the 30s probe budget.
        var runner = new ScriptedRunner()
            .Then(_ => new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero))  // the merge
            .Then(_ => new FfmpegResult(0, "585\n", string.Empty, TimeSpan.Zero));      // nb_frames

        await using var workspace = Workspace();
        File.WriteAllText(workspace.Resolve("out/final.mp4"), "x");

        var result = await Service(runner).MergeScenesAsync(Plan(), workspace, null, default);

        Assert.Equal(585, result.Frames.Value);
        Assert.DoesNotContain(runner.Calls, CountsFrames);
    }

    [Fact]
    public async Task Falls_back_to_counting_only_when_the_container_does_not_say()
    {
        // Some containers genuinely leave nb_frames as N/A, and then decoding is the only
        // way to know. The fallback has to stay.
        var runner = new ScriptedRunner()
            .Then(_ => new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero))
            .Then(_ => new FfmpegResult(0, "N/A\n", string.Empty, TimeSpan.Zero))
            .Then(_ => new FfmpegResult(0, "585\n", string.Empty, TimeSpan.Zero));

        await using var workspace = Workspace();
        File.WriteAllText(workspace.Resolve("out/final.mp4"), "x");

        var result = await Service(runner).MergeScenesAsync(Plan(), workspace, null, default);

        Assert.Equal(585, result.Frames.Value);
        Assert.Contains(runner.Calls, CountsFrames);
    }

    [Fact]
    public async Task Sizes_the_counting_budget_by_the_length_of_the_video()
    {
        // A flat budget is right for a ten-second clip and unmeetable for a four-minute
        // stitch, because the work counting does is proportional to the video.
        var runner = new ScriptedRunner()
            .Then(_ => new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero))
            .Then(_ => new FfmpegResult(0, "N/A\n", string.Empty, TimeSpan.Zero))
            .Then(_ => new FfmpegResult(0, "585\n", string.Empty, TimeSpan.Zero));

        await using var workspace = Workspace();
        File.WriteAllText(workspace.Resolve("out/final.mp4"), "x");

        await Service(runner, probeTimeoutSeconds: 30).MergeScenesAsync(Plan(), workspace, null, default);

        // 585 frames at 30fps is 19.5s of video, so the budget must exceed the flat 30s.
        var counting = runner.Calls.Single(CountsFrames);
        Assert.True(counting.Timeout > TimeSpan.FromSeconds(30),
            $"budget was {counting.Timeout}, which does not scale with a 19.5s output.");
    }

    [Fact]
    public async Task A_timed_out_count_trusts_the_plan_rather_than_failing_a_good_render()
    {
        // The exact bug. The policy - "a probe that cannot read the file is not itself a
        // failure; trust the plan" - was already there for a probe that returned an error,
        // but a probe that ran out of time THREW past it, so a finished video was discarded
        // and the job reported Timeout.
        var runner = new ScriptedRunner()
            .Then(_ => new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero))
            .Then(_ => new FfmpegResult(0, "N/A\n", string.Empty, TimeSpan.Zero))
            .Then(_ => throw new RenderException(
                RenderErrorCode.Timeout, "Rendering took too long and was stopped."));

        await using var workspace = Workspace();
        File.WriteAllText(workspace.Resolve("out/final.mp4"), "x");

        var result = await Service(runner).MergeScenesAsync(Plan(), workspace, null, default);

        Assert.Equal(585, result.Frames.Value);
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
        }
        catch (IOException)
        {
            // A leftover temp directory is not worth failing a test over.
        }
    }

    private sealed class NullStore : IObjectStore
    {
        public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default) =>
            Task.CompletedTask;

        public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
            Task.FromResult<Stream?>(null);

        public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    }
}
