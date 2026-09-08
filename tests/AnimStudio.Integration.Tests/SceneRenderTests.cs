using System.Globalization;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Exercises the real renderer against generated graphs. These assert with ffprobe rather
/// than by eyeballing output, because a missing font or a bypassed filter produces exit
/// code 0 and a silently wrong video.
/// </summary>
public sealed class SceneRenderTests : IAsyncLifetime
{
    private string _root = string.Empty;
    private IRenderWorkspace _workspace = null!;
    private FfmpegVideoRenderingService _service = null!;
    private static readonly Canvas TestCanvas = new(640, 360, FrameRate.Fps30);

    /// <summary>Bounded so a hung renderer fails the test instead of the whole run.</summary>
    private static readonly CancellationToken Ct = new CancellationTokenSource(
        TimeSpan.FromMinutes(5)).Token;

    public Task InitializeAsync()
    {
        _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", Guid.NewGuid().ToString("n"));

        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath,
            SceneTimeoutMinutes = 5,
            MergeTimeoutMinutes = 5
        });

        var runner = new FfmpegRunner(ffmpegOptions, NullLogger<FfmpegRunner>.Instance);

        // Everything the installed build actually has, at the version it actually is; the
        // unit suite covers the degraded paths.
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true, HasLibass = true, HasZoompan = true, HasXfade = true,
            HasAcrossfade = true, HasAlimiter = true, HasLibx264 = true, HasAac = true,
            HasDrawtext = true, Major = FfmpegLocator.MajorVersion
        };

        _service = new FfmpegVideoRenderingService(
            runner,
            new FfmpegFilterGraphBuilder(capabilities),
            capabilities,
            ffmpegOptions,
            Options.Create(new RenderOptions()),
            NullLogger<FfmpegVideoRenderingService>.Instance);

        _workspace = new LocalRenderWorkspace(
            "test-job", _root, new NullObjectStore(), NullLogger<LocalRenderWorkspace>.Instance,
            keepOnFailure: false);

        return Task.CompletedTask;
    }

    public async Task DisposeAsync() => await _workspace.DisposeAsync();

    private string Path_(string relative) => System.IO.Path.Combine(_root, relative);

    private SceneRenderPlan BuildPlan(
        int index, int durationFrames, bool withSprite, bool withAudio, bool withSubtitles)
    {
        RenderFixtures.MakeBackground(Path_("in/bg.jpg"), "navy", 640, 360);
        if (withSprite)
        {
            RenderFixtures.MakeSprite(Path_("in/rahul_closed.png"), "red");
            RenderFixtures.MakeSprite(Path_("in/rahul_open.png"), "yellow");
        }

        var seconds = durationFrames / 30.0;
        if (withAudio) RenderFixtures.MakeTone(Path_("in/voice.wav"), seconds);

        if (withSubtitles)
        {
            var ass = new AnimStudio.Infrastructure.Subtitles.AssSubtitleWriter().Write(
                new SubtitleRequest(
                    TestCanvas,
                    [new AnimStudio.Domain.Scenes.DialogueLine
                    {
                        Text = "Hello from AnimStudio.",
                        RelativeStartFrame = 0,
                        RelativeEndFrame = durationFrames,
                        SpeakerLabel = "Rahul"
                    }],
                    new Dictionary<string, SubtitleStyle>()));

            Directory.CreateDirectory(Path_("sub"));
            File.WriteAllText(Path_($"sub/scene_{index + 1:D3}.ass"), ass);
        }

        return new SceneRenderPlan
        {
            SceneIndex = index,
            SceneId = $"scene-{index}",
            Canvas = TestCanvas,
            Duration = new FrameCount(durationFrames),
            BackgroundRelativePath = "in/bg.jpg",
            BackgroundAnimation = new AnimationSettings(BackgroundEffect.ZoomIn, 0.15),
            Sprites = withSprite
                ?
                [
                    new SpritePlan
                    {
                        CharacterId = "rahul",
                        ClosedMouthRelativePath = "in/rahul_closed.png",
                        OpenMouthRelativePath = "in/rahul_open.png",
                        HeightPixels = 200,
                        XExpression = "80",
                        YExpression = "H-h-20",
                        Presence = new FrameRange(FrameCount.Zero, new FrameCount(durationFrames)),
                        SpeakingWindows = [new FrameRange(FrameCount.Zero, new FrameCount(durationFrames / 2))]
                    }
                ]
                : [],
            AudioRelativePath = withAudio ? "in/voice.wav" : null,
            SubtitleRelativePath = withSubtitles ? $"sub/scene_{index + 1:D3}.ass" : null,
            OutputRelativePath = $"scenes/scene_{index + 1:D3}.mp4",
            KenBurnsSupersample = 2
        };
    }

    [FfmpegFact]
    public async Task Renders_a_scene_with_background_sprite_audio_and_subtitles()
    {
        var plan = BuildPlan(0, durationFrames: 60, withSprite: true, withAudio: true, withSubtitles: true);

        var result = await _service.RenderSceneAsync(plan, _workspace, null, Ct);

        var output = _workspace.Resolve(result.RelativePath);
        Assert.True(File.Exists(output), "the renderer produced no output file");
        Assert.Equal(60, result.Frames.Value);

        // Assert against the real file rather than trusting the exit code.
        var probed = FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -count_frames "
            + $"-show_entries stream=width,height,pix_fmt,nb_read_frames "
            + $"-of default=noprint_wrappers=1 \"{output}\"");

        Assert.Contains("width=640", probed);
        Assert.Contains("height=360", probed);
        Assert.Contains("pix_fmt=yuv420p", probed);
        Assert.Contains("nb_read_frames=60", probed);
    }

    [FfmpegFact]
    public async Task Every_scene_has_exactly_one_video_and_one_audio_stream()
    {
        // concat and acrossfade both misbehave if a scene is missing its audio track.
        var plan = BuildPlan(0, 30, withSprite: false, withAudio: false, withSubtitles: false);

        var result = await _service.RenderSceneAsync(plan, _workspace, null, Ct);
        var output = _workspace.Resolve(result.RelativePath);

        var streams = FfmpegLocator.Probe(
            $"-v error -show_entries stream=codec_type -of default=nokey=1:noprint_wrappers=1 \"{output}\"")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .ToList();

        Assert.Equal(1, streams.Count(s => s == "video"));
        Assert.Equal(1, streams.Count(s => s == "audio"));
    }

    [FfmpegFact]
    public async Task Pads_audio_that_is_shorter_than_its_scene()
    {
        // A 1s tone in a 2s scene must come out 2s long, or the merge desyncs.
        var plan = BuildPlan(0, durationFrames: 60, withSprite: false, withAudio: false, withSubtitles: false);
        RenderFixtures.MakeTone(Path_("in/short.wav"), 1.0);
        plan = plan with { AudioRelativePath = "in/short.wav" };

        var result = await _service.RenderSceneAsync(plan, _workspace, null, Ct);
        var output = _workspace.Resolve(result.RelativePath);

        var audioDuration = double.Parse(
            FfmpegLocator.Probe(
                $"-v error -select_streams a:0 -show_entries stream=duration "
                + $"-of default=nokey=1:noprint_wrappers=1 \"{output}\""),
            CultureInfo.InvariantCulture);

        Assert.True(Math.Abs(audioDuration - 2.0) < 0.1,
            $"expected ~2.0s of audio after padding, got {audioDuration:F3}s");
    }

    [FfmpegFact]
    public async Task Merging_with_a_transition_keeps_audio_and_video_the_same_length()
    {
        // The trap this guards: using concat for audio alongside xfade video leaves audio
        // long by the sum of every transition, drifting further with each scene.
        var ct = Ct;

        var first = BuildPlan(0, 60, withSprite: false, withAudio: true, withSubtitles: false);
        await _service.RenderSceneAsync(first, _workspace, null, ct);

        RenderFixtures.MakeTone(Path_("in/voice2.wav"), 2.0, frequency: 660);
        var second = BuildPlan(1, 60, withSprite: false, withAudio: false, withSubtitles: false)
            with { AudioRelativePath = "in/voice2.wav" };
        await _service.RenderSceneAsync(second, _workspace, null, ct);

        var mergePlan = new MergePlan
        {
            Canvas = TestCanvas,
            Scenes =
            [
                new MergeSceneInput("scenes/scene_001.mp4", new FrameCount(60),
                    new TransitionSettings(SceneTransition.Fade, new FrameCount(15))),
                new MergeSceneInput("scenes/scene_002.mp4", new FrameCount(60), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        var merged = await _service.MergeScenesAsync(mergePlan, _workspace, null, ct);
        var output = _workspace.Resolve(merged.RelativePath);

        // 60 + 60 - 15 = 105 frames = 3.5s
        Assert.Equal(105, merged.Frames.Value);

        var video = ProbeDuration(output, "v:0");
        var audio = ProbeDuration(output, "a:0");

        Assert.True(Math.Abs(video - 3.5) < 0.1, $"expected a 3.5s video, got {video:F3}s");
        Assert.True(Math.Abs(video - audio) < 0.05,
            $"audio and video drifted apart: video {video:F3}s vs audio {audio:F3}s");
    }

    [FfmpegFact]
    public async Task Merging_pure_cuts_uses_a_stream_copy_and_sums_the_lengths()
    {
        var ct = Ct;

        await _service.RenderSceneAsync(
            BuildPlan(0, 30, withSprite: false, withAudio: true, withSubtitles: false), _workspace, null, ct);
        await _service.RenderSceneAsync(
            BuildPlan(1, 30, withSprite: false, withAudio: true, withSubtitles: false), _workspace, null, ct);

        var mergePlan = new MergePlan
        {
            Canvas = TestCanvas,
            Scenes =
            [
                new MergeSceneInput("scenes/scene_001.mp4", new FrameCount(30), TransitionSettings.None),
                new MergeSceneInput("scenes/scene_002.mp4", new FrameCount(30), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        var merged = await _service.MergeScenesAsync(mergePlan, _workspace, null, ct);

        Assert.Equal(60, merged.Frames.Value);
        var duration = ProbeDuration(_workspace.Resolve(merged.RelativePath), "v:0");
        Assert.True(Math.Abs(duration - 2.0) < 0.1, $"expected 2.0s, got {duration:F3}s");
    }

    [FfmpegFact]
    public async Task Reports_progress_while_rendering()
    {
        var reports = new List<RenderProgress>();
        var progress = new Progress<RenderProgress>(reports.Add);

        var plan = BuildPlan(0, 60, withSprite: true, withAudio: true, withSubtitles: false);
        await _service.RenderSceneAsync(plan, _workspace, progress, Ct);

        // Progress arrives via the -progress stream; allow the async handler to drain.
        await Task.Delay(200, Ct);

        Assert.NotEmpty(reports);
        Assert.All(reports, r => Assert.Equal(RenderStage.RenderingScene, r.Stage));
        Assert.Contains(reports, r => r.StageFramesDone.Value > 0);
    }

    private static double ProbeDuration(string path, string stream) =>
        double.Parse(
            FfmpegLocator.Probe(
                $"-v error -select_streams {stream} -show_entries stream=duration "
                + $"-of default=nokey=1:noprint_wrappers=1 \"{path}\""),
            CultureInfo.InvariantCulture);

    /// <summary>The workspace is exercised directly here, so no object store is needed.</summary>
    private sealed class NullObjectStore : IObjectStore
    {
        public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default) =>
            Task.CompletedTask;
        public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
            Task.FromResult<Stream?>(null);
        public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    }
}
