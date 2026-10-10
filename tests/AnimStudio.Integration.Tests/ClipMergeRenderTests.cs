using System.Diagnostics;
using System.Globalization;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Runs the real clip pipeline against deliberately mismatched clips.
/// <para>
/// This is the test that matters for a stitch, because the failure it guards against is
/// silent. Clips arrive from phones, screen recorders and other editors agreeing on
/// nothing - resolution, frame rate, pixel aspect, sample rate, whether there is any audio
/// at all - and every one of those mismatches produces exit code 0 and a video that plays
/// the first clip and then stalls, or drifts out of sync by the end. So the fixtures here
/// are as inconsistent as real footage on purpose, and every assertion is made with
/// ffprobe rather than by trusting the exit code.
/// </para>
/// </summary>
public sealed class ClipMergeRenderTests : IAsyncLifetime
{
    private string _root = string.Empty;
    private IRenderWorkspace _workspace = null!;
    private FfmpegVideoRenderingService _service = null!;

    private static readonly Canvas TestCanvas = new(640, 360, FrameRate.Fps30);

    private static readonly CancellationToken Ct = new CancellationTokenSource(
        TimeSpan.FromMinutes(5)).Token;

    public Task InitializeAsync()
    {
        _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", Guid.NewGuid().ToString("n"));

        _service = BuildService();

        _workspace = new LocalRenderWorkspace(
            "clip-job", _root, new NullObjectStore(),
            NullLogger<LocalRenderWorkspace>.Instance, keepOnFailure: false);

        return Task.CompletedTask;
    }

    /// <summary>
    /// A renderer wired to the real ffmpeg on this host.
    /// <para>
    /// <paramref name="maxMergeInputs"/> defaults high enough that every existing test takes
    /// the single-pass join, so batching is exercised only where a test asks for it.
    /// </para>
    /// </summary>
    private static FfmpegVideoRenderingService BuildService(
        int maxMergeInputs = 64, ClipConformCache? cache = null, IFfmpegRunner? runner = null)
    {
        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath,
            SceneTimeoutMinutes = 5,
            MergeTimeoutMinutes = 5,
            MaxMergeInputs = maxMergeInputs
        });

        runner ??= new FfmpegRunner(ffmpegOptions, NullLogger<FfmpegRunner>.Instance);

        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true, HasLibass = true, HasZoompan = true, HasXfade = true,
            HasAcrossfade = true, HasAlimiter = true, HasLibx264 = true, HasAac = true,
            HasDrawtext = true, HasGblur = true, Major = FfmpegLocator.MajorVersion
        };

        return new FfmpegVideoRenderingService(
            runner,
            new FfmpegFilterGraphBuilder(capabilities),
            capabilities,
            ffmpegOptions,
            Options.Create(new RenderOptions()),
            NullLogger<FfmpegVideoRenderingService>.Instance,
            cache);
    }

    private static FfmpegOptions RealFfmpeg() => new()
    {
        FfmpegPath = FfmpegLocator.FfmpegPath,
        FfprobePath = FfmpegLocator.FfprobePath,
        SceneTimeoutMinutes = 5
    };

    private sealed class CountingRunner(IFfmpegRunner inner) : IFfmpegRunner
    {
        public int Encodes;

        public Task<FfmpegResult> RunAsync(
            FfmpegInvocation invocation, IProgress<FfmpegProgress>? progress, CancellationToken ct)
        {
            if (invocation.Tool == FfmpegTool.Ffmpeg) Interlocked.Increment(ref Encodes);
            return inner.RunAsync(invocation, progress, ct);
        }
    }

    private sealed class TestHost(string root) : Microsoft.Extensions.Hosting.IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Test";
        public string ApplicationName { get; set; } = "AnimStudio.Tests";
        public string ContentRootPath { get; set; } = root;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } =
            new Microsoft.Extensions.FileProviders.NullFileProvider();
    }

    // --- clip cache ---------------------------------------------------------

    [FfmpegFact]
    public async Task A_second_export_of_an_unchanged_clip_is_restored_without_encoding()
    {
        var cacheRoot = _root + "-cache";
        try
        {
            var cache = new ClipConformCache(
                Options.Create(new RenderOptions { ClipCacheRoot = cacheRoot }),
                new TestHost(_root), NullLogger<ClipConformCache>.Instance);
            var runner = new CountingRunner(
                new FfmpegRunner(Options.Create(RealFfmpeg()), NullLogger<FfmpegRunner>.Instance));
            var service = BuildService(cache: cache, runner: runner);

            MakeClip("in/a.mp4", 2.0, 640, 360, 30, withAudio: true);
            var first = await service.RenderClipAsync(Plan(0, "in/a.mp4"), _workspace, null, Ct);
            var encodesAfterFirst = runner.Encodes;

            // A new export is a new workspace holding a fresh copy of the same source.
            await using var second = new LocalRenderWorkspace(
                "clip-job-2", _root + "-2", new NullObjectStore(),
                NullLogger<LocalRenderWorkspace>.Instance, keepOnFailure: false);
            File.Copy(Path_("in/a.mp4"), second.Resolve("in/a.mp4"));

            var restored = await service.RenderClipAsync(Plan(0, "in/a.mp4"), second, null, Ct);

            Assert.Equal(encodesAfterFirst, runner.Encodes);
            Assert.Equal(first.Frames, restored.Frames);
            Assert.Equal(first.SizeBytes, new FileInfo(second.Resolve(restored.RelativePath)).Length);

            // The same path holding different footage is a different clip.
            MakeClip("in/a.mp4", 1.0, 640, 360, 30, withAudio: true);
            File.Copy(Path_("in/a.mp4"), second.Resolve("in/a.mp4"), overwrite: true);

            var changed = await service.RenderClipAsync(Plan(0, "in/a.mp4"), second, null, Ct);

            Assert.True(runner.Encodes > encodesAfterFirst, "a changed source must be encoded");
            Assert.InRange(changed.Frames.Value, 29, 31);

            // Re-encoding over a restored (hard-linked) output must not have written
            // through the link into the cached clip or the first export's copy of it.
            Assert.Equal(first.SizeBytes, new FileInfo(_workspace.Resolve(first.RelativePath)).Length);
        }
        finally
        {
            if (Directory.Exists(cacheRoot)) Directory.Delete(cacheRoot, recursive: true);
        }
    }

    public async Task DisposeAsync() => await _workspace.DisposeAsync();

    private string Path_(string relative) => System.IO.Path.Combine(_root, relative);

    // --- fixtures -----------------------------------------------------------

    /// <summary>
    /// A clip that agrees with nothing. Every parameter here is a real mismatch seen in
    /// practice, and each one on its own is enough to break a naive concat.
    /// </summary>
    private void MakeClip(
        string relative, double seconds, int width, int height, int fps,
        bool withAudio, int sampleRate = 44100, int channels = 1, string sar = "1/1")
    {
        Directory.CreateDirectory(Path_("in"));

        var video =
            $"-f lavfi -i testsrc=size={width}x{height}:rate={fps}:duration="
            + seconds.ToString(CultureInfo.InvariantCulture);

        var audio = withAudio
            ? $" -f lavfi -i sine=frequency=440:duration={seconds.ToString(CultureInfo.InvariantCulture)}"
              + $":sample_rate={sampleRate}"
            : string.Empty;

        var maps = withAudio
            ? $"-map 0:v -map 1:a -c:a aac -ar {sampleRate} -ac {channels}"
            : "-map 0:v -an";

        Run($"-y {video}{audio} {maps} -vf setsar={sar} -c:v libx264 -pix_fmt yuv420p "
          + $"-r {fps} \"{Path_(relative)}\"");
    }

    private ClipRenderPlan Plan(
        int index, string source, ClipFit fit = ClipFit.Contain,
        WatermarkPlan? watermark = null, bool hasAudio = true) =>
        new()
        {
            ClipIndex = index,
            SourceRelativePath = source,
            Canvas = TestCanvas,
            OutputRelativePath = $"clips/clip_{index + 1:D3}.mp4",
            // Deliberately WRONG, to prove the pipeline measures rather than trusts it.
            ExpectedFrames = new FrameCount(1),
            Fit = fit,
            SourceHasAudio = hasAudio,
            Watermark = watermark
        };

    // --- conforming ---------------------------------------------------------

    [FfmpegFact]
    public async Task Conforms_a_mismatched_clip_to_the_canvas()
    {
        // 480x270 at 24fps with an anamorphic SAR and mono 44.1kHz audio: nothing about
        // this clip matches the project.
        MakeClip("in/odd.mp4", 2.0, 480, 270, 24, withAudio: true, sar: "4/3");

        var result = await _service.RenderClipAsync(Plan(0, "in/odd.mp4"), _workspace, null, Ct);

        var path = _workspace.Resolve(result.RelativePath);

        Assert.Equal("640", ProbeStream(path, "v:0", "width"));
        Assert.Equal("360", ProbeStream(path, "v:0", "height"));
        Assert.Equal("1:1", ProbeStream(path, "v:0", "sample_aspect_ratio"));
        Assert.Equal("30/1", ProbeStream(path, "v:0", "r_frame_rate"));
        Assert.Equal("48000", ProbeStream(path, "a:0", "sample_rate"));
        Assert.Equal("2", ProbeStream(path, "a:0", "channels"));
    }

    [FfmpegFact]
    public async Task Measures_a_clips_real_length_instead_of_trusting_the_plan()
    {
        // The plan claims one frame. If that were imposed on the output, the clip would be
        // truncated to a single frame - which is exactly what a container lying about its
        // duration would cause on real footage.
        MakeClip("in/two-seconds.mp4", 2.0, 640, 360, 30, withAudio: true);

        var result = await _service.RenderClipAsync(
            Plan(0, "in/two-seconds.mp4"), _workspace, null, Ct);

        Assert.InRange(result.Frames.Value, 59, 61);
    }

    [FfmpegFact]
    public async Task Gives_a_silent_clip_an_audio_track_of_its_own_length()
    {
        // A silent clip with no audio stream is the normal way a concat breaks: the joined
        // file plays up to it and stops. Generated silence has to be there, and has to be
        // the same length as the picture.
        MakeClip("in/silent.mp4", 2.0, 640, 360, 30, withAudio: false);

        var result = await _service.RenderClipAsync(
            Plan(0, "in/silent.mp4", hasAudio: false), _workspace, null, Ct);

        var path = _workspace.Resolve(result.RelativePath);

        Assert.Equal("aac", ProbeStream(path, "a:0", "codec_name"));

        var video = ProbeDuration(path, "v:0");
        var audio = ProbeDuration(path, "a:0");

        Assert.InRange(video, 1.9, 2.1);
        Assert.True(Math.Abs(video - audio) < 0.15,
            $"audio {audio:F3}s and video {video:F3}s must match; a gap here is drift at every join.");
    }

    [Theory]
    [InlineData(ClipFit.Contain)]
    [InlineData(ClipFit.Cover)]
    [InlineData(ClipFit.BlurredBackdrop)]
    public async Task Every_fit_mode_fills_the_canvas_exactly(ClipFit fit)
    {
        if (!FfmpegLocator.IsAvailable) return;

        // A vertical clip in a wide canvas: the case every fit mode exists to handle.
        MakeClip("in/vertical.mp4", 1.0, 270, 480, 30, withAudio: true);

        var result = await _service.RenderClipAsync(
            Plan(0, "in/vertical.mp4", fit), _workspace, null, Ct);

        var path = _workspace.Resolve(result.RelativePath);

        Assert.Equal("640", ProbeStream(path, "v:0", "width"));
        Assert.Equal("360", ProbeStream(path, "v:0", "height"));
    }

    // --- watermark ----------------------------------------------------------

    [FfmpegFontFact]
    public async Task Burns_in_a_text_watermark_read_from_a_file()
    {
        // The URL is the point: every character that makes it a URL is syntax to
        // drawtext's option parser, so if the textfile indirection were wrong this is the
        // input that would fail.
        await _workspace.WriteTextAsync("wm/watermark.txt", "https://animstudio.example/x?a=1", Ct);

        // Resolved exactly the way the server resolves it, so this test exercises the real
        // font lookup rather than a second list that can drift from it. FfmpegFontFact has
        // already skipped the test if the host has none.
        var fontFile = WatermarkFontResolver.FindSystemFont();

        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings { Kind = WatermarkKind.Text, Text = "https://animstudio.example/x?a=1" },
            TestCanvas, null, "wm/watermark.txt", fontFile)!;

        MakeClip("in/plain.mp4", 1.0, 640, 360, 30, withAudio: true);

        var result = await _service.RenderClipAsync(
            Plan(0, "in/plain.mp4", watermark: mark), _workspace, null, Ct);

        // A watermark that failed to draw still exits 0, so the proof is that the top of
        // the frame changed while the bottom did not.
        var top = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=640:60:0:0");
        var bottom = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=640:60:0:300");

        Assert.True(Math.Abs(top - bottom) > 1.0,
            $"expected the mark to change the top band (top {top:F2} vs bottom {bottom:F2}).");
    }

    // --- frame layout: bar colour and text overlays --------------------------

    [FfmpegFontFact]
    public async Task A_short_gets_coloured_bars_and_a_headline_drawn_on_them()
    {
        // A wide clip in a 9:16 Short leaves a bar above and below it. The layout this
        // feature exists for: fill the bars with a colour, put a headline strip on the top
        // one, a caption on the bottom one. Every check is on pixels, because a drawtext or
        // pad that silently did nothing still exits 0.
        var shortCanvas = new Canvas(360, 640, FrameRate.Fps30);
        MakeClip("in/wide.mp4", 1.5, 640, 360, 30, withAudio: true);

        var clip = await _service.RenderClipAsync(
            Plan(0, "in/wide.mp4") with { Canvas = shortCanvas, PadColorRgb = "ffffff" },
            _workspace, null, Ct);

        // The clip is 202px tall in the middle of 640, so the top 200px are bar.
        var bar = MeanLuma(_workspace.Resolve(clip.RelativePath), "crop=360:60:0:0");
        Assert.True(bar > 200, $"expected white bars, top band luma was {bar:F1}.");

        // Every character drawtext's parser would choke on, inline: colon, quote, comma,
        // percent with an expansion, backslash.
        const string headline = "Don't miss: 100% %{pts}, C:\\clips";
        var fontFile = WatermarkFontResolver.FindSystemFont()!;
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Position = "custom", Y = 8, FontSize = 18,
            BoxStyle = "band", BoxColor = "#000000", BoxOpacity = 1
        });
        var lines = TextOverlayLayout.Wrap(headline, look.FontSize, shortCanvas.Width, shortCanvas.Height);
        var paths = new List<string?>();
        for (var i = 0; i < lines.Count; i++)
            paths.Add(await _workspace.WriteTextAsync($"txt/overlay_000_{i}.txt", lines[i], Ct));

        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = shortCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    new MergeOverlayItem("text", null, 0, 10, 1, 0, 0, 1, "none", 0.5, "none", 0.5)
                    {
                        Text = new MergeTextOverlay(paths, fontFile, look)
                    }
                ],
                OutputRelativePath = "out/short.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        Assert.Equal("360", ProbeStream(path, "v:0", "width"));
        Assert.Equal("640", ProbeStream(path, "v:0", "height"));

        // The strip is black over the white bar, with white text on it: far darker than
        // the bar around it, but not empty - the text drew.
        var strip = MeanLuma(path, "crop=360:20:0:" + (int)(640 * 0.08 - 10));
        var below = MeanLuma(path, "crop=360:40:0:140");
        Assert.True(below > 200, $"the strip spilled over the rest of the bar ({below:F1}).");
        Assert.True(strip < 120, $"expected a dark strip, luma was {strip:F1}.");
        Assert.True(strip > 17, $"the strip is solid black - the headline did not draw ({strip:F1}).");
    }

    [FfmpegFontFact]
    public async Task A_headline_strip_slides_and_fades_in_with_its_text()
    {
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=white:size=640x360:rate=30:duration=2 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/white.mp4")}\"");
        var clip = await _service.RenderClipAsync(Plan(0, "in/white.mp4", hasAudio: false), _workspace, null, Ct);

        var fontFile = WatermarkFontResolver.FindSystemFont()!;
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Position = "custom", Y = 50, FontSize = 24,
            BoxStyle = "band", BoxColor = "#000000", BoxOpacity = 1
        });
        var line = await _workspace.WriteTextAsync("txt/overlay_000_0.txt", "BREAKING", Ct);

        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    new MergeOverlayItem("text", null, 0.5, 1.5, 1, 0, 0, 1, "slide-right", 0.5, "fade", 0.3)
                    {
                        Text = new MergeTextOverlay([line], fontFile, look)
                    }
                ],
                OutputRelativePath = "out/band.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        // The strip is centred: about y 160-200. Settled it is dark; half-way in it is a
        // faded strip still short of the right edge; before its start it is not there.
        var before = MeanLuma(path, "crop=640:10:0:175", at: 0.3);
        var settled = MeanLuma(path, "crop=40:10:20:175", at: 1.4);
        var arriving = MeanLuma(path, "crop=40:10:590:175", at: 0.6);

        Assert.True(before > 200, $"the strip showed before its start ({before:F1}).");
        Assert.True(settled < 60, $"the strip did not settle in place ({settled:F1}).");
        Assert.True(arriving > settled + 40, $"the strip did not move or fade in ({arriving:F1} vs {settled:F1}).");
    }

    [FfmpegFontFact]
    public async Task A_typed_line_appears_left_to_right_and_then_stays_whole()
    {
        // Black text typed onto white over one second: none of it before the start, part of
        // it half-way, all of it afterwards - measured as ink across the whole line, since
        // where each glyph lands depends on the host's font.
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=white:size=640x360:rate=30:duration=2 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/white-typed.mp4")}\"");
        var clip = await _service.RenderClipAsync(Plan(0, "in/white-typed.mp4", hasAudio: false), _workspace, null, Ct);

        var fontFile = WatermarkFontResolver.FindSystemFont()!;
        var look = TextOverlayLayout.Resolve(new TimelineItemTextStyleSpec
        {
            Position = "custom", Y = 50, FontSize = 40, Color = "#000000", BoxStyle = "none"
        });
        const string text = "HELLO THERE";
        var line = await _workspace.WriteTextAsync("txt/overlay_000_0.txt", text, Ct);

        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    new MergeOverlayItem("text", null, 0.2, 1.7, 1, 0, 0, 1, "typewriter", 1.0, "none", 0.3)
                    {
                        Text = new MergeTextOverlay([line], fontFile, look, [text.Length])
                    }
                ],
                OutputRelativePath = "out/typed.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        const string strip = "crop=600:50:20:155";
        // Ink against the frame before the text starts, which is the untouched picture.
        var blank = MeanLuma(path, strip, at: 0.1);
        double Ink(double at) => blank - MeanLuma(path, strip, at: at);
        var mid = Ink(0.7);
        var end = Ink(1.5);

        Assert.True(end > 8, $"once typed the whole line should show ({end:F2}).");
        Assert.InRange(mid / end, 0.2, 0.8);
    }

    [FfmpegFact]
    public async Task A_sticker_is_sized_to_the_canvas_and_shown_only_in_its_window()
    {
        // A still with a fade: before the still was looped, its one frame was faded to
        // alpha 0 and held there, so a sticker with the default fade never appeared at all.
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=black:size=640x360:rate=30:duration=3 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/black.mp4")}\"");
        Run($"-y -f lavfi -i color=c=white:size=100x50 -frames:v 1 \"{Path_("in/sticker.png")}\"");

        var clip = await _service.RenderClipAsync(Plan(0, "in/black.mp4", hasAudio: false), _workspace, null, Ct);

        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    // A quarter of the width (160x80), centred at 75% across, from 0.5s to 2.5s.
                    new MergeOverlayItem("image", "in/sticker.png", 0.5, 2, 1, 25, 0, 1, "fade", 0.5, "fade", 0.5)
                    {
                        WidthPercent = 25
                    }
                ],
                OutputRelativePath = "out/sticker.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        var onSticker = MeanLuma(path, "crop=100:40:430:160", at: 1.5);
        var besideIt = MeanLuma(path, "crop=20:20:570:170", at: 1.5);
        var beforeIt = MeanLuma(path, "crop=100:40:430:160", at: 0.2);
        var afterIt = MeanLuma(path, "crop=100:40:430:160", at: 2.8);

        Assert.True(onSticker > 200, $"the sticker did not draw at 1.5s ({onSticker:F1}).");
        Assert.True(besideIt < 40, $"the sticker is wider than a quarter of the frame ({besideIt:F1}).");
        Assert.True(beforeIt < 40, $"the sticker showed before its start ({beforeIt:F1}).");
        Assert.True(afterIt < 40, $"the sticker stayed after its end ({afterIt:F1}).");
    }

    [FfmpegFact]
    public async Task A_circle_sticker_is_cut_round_with_a_coloured_ring()
    {
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=black:size=640x360:rate=30:duration=2 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/black.mp4")}\"");
        Run($"-y -f lavfi -i color=c=white:size=300x200 -frames:v 1 \"{Path_("in/photo.png")}\"");

        var clip = await _service.RenderClipAsync(Plan(0, "in/black.mp4", hasAudio: false), _workspace, null, Ct);

        // Cropped square (a sixth off each side of 300x200), 160px wide, centred, from 0.2s
        // to 1.8s, with a 6px red ring (6 reference px on a 360-high canvas).
        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    new MergeOverlayItem("image", "in/photo.png", 0.2, 1.6, 1, 0, 0, 1, "pop", 0.4, "fade", 0.3)
                    {
                        WidthPercent = 25,
                        Media = new MergeMediaOverlay(16.6667, 0, 16.6667, 0, OverlayShape.Circle, 6, "FF0000", 1)
                    }
                ],
                OutputRelativePath = "out/circle.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        // Square: x 240-400, y 100-260.
        var centre = MeanLuma(path, "crop=40:40:300:160", at: 1.0);
        var corner = MeanLuma(path, "crop=12:12:242:102", at: 1.0);
        var ring = MeanLuma(path, "crop=8:2:316:103", at: 1.0);

        Assert.True(centre > 200, $"the picture did not draw inside the circle ({centre:F1}).");
        Assert.True(corner < 30, $"the square's corner was not cut away ({corner:F1}).");
        Assert.True(ring is > 45 and < 120, $"expected a red ring at the top edge, luma {ring:F1}.");
    }

    [FfmpegFact]
    public async Task A_circle_video_plays_inside_its_stencil_from_its_trim_point()
    {
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=black:size=640x360:rate=30:duration=2 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/black.mp4")}\"");
        Run($"-y -f lavfi -i color=c=white:size=320x320:rate=30:duration=4 -c:v libx264 -pix_fmt yuv420p -an \"{Path_("in/pip.mp4")}\"");

        var clip = await _service.RenderClipAsync(Plan(0, "in/black.mp4", hasAudio: false), _workspace, null, Ct);

        var merged = await BuildService().MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = [new MergeSceneInput(clip.RelativePath, clip.Frames, TransitionSettings.None)],
                Overlays =
                [
                    new MergeOverlayItem("video", "in/pip.mp4", 0.5, 1.2, 1, 0, 0, 1, "slide-up", 0.3, "none", 0.3)
                    {
                        WidthPercent = 25,
                        Media = new MergeMediaOverlay(0, 0, 0, 0, OverlayShape.Circle, 0, "FFFFFF", 1, 1.5)
                    }
                ],
                OutputRelativePath = "out/pip.mp4"
            },
            _workspace, null, Ct);

        var path = _workspace.Resolve(merged.RelativePath);
        var duration = ProbeDuration(path, "v:0");
        Assert.True(Math.Abs(duration - 2.0) < 0.1, $"the picture-in-picture changed the length ({duration:F3}s).");

        var centre = MeanLuma(path, "crop=40:40:300:160", at: 1.2);
        var corner = MeanLuma(path, "crop=12:12:242:102", at: 1.2);
        var before = MeanLuma(path, "crop=40:40:300:160", at: 0.2);

        Assert.True(centre > 200, $"the video did not play inside the circle ({centre:F1}).");
        Assert.True(corner < 30, $"the square's corner was not masked away ({corner:F1}).");
        Assert.True(before < 30, $"the video showed before its start ({before:F1}).");
    }

    // --- erasing an existing mark ------------------------------------------

    /// <summary>A black clip with a white "foreign logo" in its top-right corner.</summary>
    private void MakeMarkedClip(string relative, int width, int height, string pixelFormat = "yuv420p")
    {
        Directory.CreateDirectory(Path_("in"));
        Run($"-y -f lavfi -i color=c=black:size={width}x{height}:rate=30:duration=1 "
          + $"-vf drawbox=x=iw-iw/8:y=0:w=iw/8:h=ih/8:color=white:t=fill "
          + $"-c:v libx264 -pix_fmt {pixelFormat} -an \"{Path_(relative)}\"");
    }

    [FfmpegFact]
    public async Task Fills_over_a_mark_in_the_corner_of_the_source_frame()
    {
        // The corner is the case that matters: watermarks sit against the edges, and the
        // obvious filter for this (delogo) refuses any box that touches one.
        MakeMarkedClip("in/marked.mp4", 640, 360);

        var plan = Plan(0, "in/marked.mp4", hasAudio: false) with
        {
            EraseRegions = [new EraseRegionSpec { X = 85, Y = 0, Width = 15, Height = 15, Style = EraseStyle.Fill }]
        };

        var before = MeanLuma(Path_("in/marked.mp4"), "crop=60:30:575:5");
        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var after = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=60:30:575:5");

        Assert.True(before > 200, $"fixture mark should be white, read {before:F1}");
        Assert.True(after < 30, $"expected the mark gone, read {after:F1}");
    }

    [FfmpegFact]
    public async Task Blurs_regions_on_the_edge_of_an_odd_sized_frame_without_failing()
    {
        // Odd dimensions, a 1% box in the very corner and one running off two edges: each
        // has, at some point, made one of these filters reject its parameters.
        // 4:4:4, because 4:2:0 cannot be odd-sized at all.
        MakeMarkedClip("in/odd-marked.mp4", 481, 271, "yuv444p");

        var plan = Plan(0, "in/odd-marked.mp4", hasAudio: false) with
        {
            EraseRegions =
            [
                new EraseRegionSpec { X = 99, Y = 99, Width = 1, Height = 1 },
                new EraseRegionSpec { X = 80, Y = 0, Width = 20, Height = 20 }
            ]
        };

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var path = _workspace.Resolve(result.RelativePath);

        Assert.Equal("640", ProbeStream(path, "v:0", "width"));
        Assert.Equal("360", ProbeStream(path, "v:0", "height"));
    }

    [FfmpegFact]
    public async Task Patches_over_a_corner_mark_with_the_footage_beside_it()
    {
        // The fixture is black apart from the white mark, so a patch copied from the
        // area below it must read as black - a blur would still leave it grey.
        MakeMarkedClip("in/marked-patch.mp4", 640, 360);

        var plan = Plan(0, "in/marked-patch.mp4", hasAudio: false) with
        {
            EraseRegions = [new EraseRegionSpec { X = 85, Y = 0, Width = 15, Height = 15, Style = EraseStyle.Patch }]
        };

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var after = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=60:30:575:5");

        Assert.True(after < 30, $"expected the mark patched away, read {after:F1}");
    }

    [FfmpegFact]
    public async Task Cleans_a_corner_mark_from_the_edges_that_are_left()
    {
        // Against the top and right edges there is nothing to read there, so the box is
        // rebuilt from the black below and left of it - clean black, not a grey smear.
        MakeMarkedClip("in/marked-clean.mp4", 640, 360);

        var plan = Plan(0, "in/marked-clean.mp4", hasAudio: false) with
        {
            EraseRegions = [new EraseRegionSpec { X = 85, Y = 0, Width = 15, Height = 15, Style = EraseStyle.Clean }]
        };

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var after = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=60:30:575:5");

        Assert.True(after < 30, $"expected the mark cleaned away, read {after:F1}");
    }

    [FfmpegFact]
    public async Task Cleans_text_off_a_plain_band_to_the_bands_own_colour()
    {
        // A white title in the middle of a mid-grey picture: rebuilt from all four sides it
        // must come out the grey around it. Odd-sized 4:4:4, to keep the even-start rounding honest.
        Run("-y -f lavfi -i color=c=0x808080:size=481x271:rate=30:duration=1 "
          + "-vf drawbox=x=iw*0.4:y=ih*0.4:w=iw*0.2:h=ih*0.2:color=white:t=fill "
          + $"-c:v libx264 -pix_fmt yuv444p -an \"{Path_("in/band.mp4")}\"");

        var plan = Plan(0, "in/band.mp4", hasAudio: false) with
        {
            EraseRegions = [new EraseRegionSpec { X = 37, Y = 37, Width = 26, Height = 26, Style = EraseStyle.Clean }]
        };

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var after = MeanLuma(_workspace.Resolve(result.RelativePath), "crop=100:60:270:150");

        Assert.InRange(after, 110, 140);
    }

    [FfmpegFact]
    public async Task Replaces_a_mark_with_our_logo_for_the_whole_clip()
    {
        // The logo is a single frame scaled against a crop of the clip; the clip must
        // still come out full length, with the logo still there at the end.
        MakeMarkedClip("in/marked-brand.mp4", 481, 271, "yuv444p");
        RenderFixtures.MakeSprite(Path_("in/brand.png"), "red", 64);

        var plan = Plan(0, "in/marked-brand.mp4", hasAudio: false) with
        {
            EraseRegions = [new EraseRegionSpec { X = 80, Y = 0, Width = 20, Height = 20, Style = EraseStyle.Brand }],
            Watermark = new WatermarkPlan
            {
                Kind = WatermarkKind.Logo,
                Position = WatermarkPosition.TopRight,
                LogoRelativePath = "in/brand.png",
                HeightPixels = 20, MarginPixels = 10, MaxWidthPixels = 100,
                Opacity = 1, ColorRgb = "FFFFFF", BackplateOpacity = 0
            }
        };

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var path = _workspace.Resolve(result.RelativePath);

        Assert.Equal("640", ProbeStream(path, "v:0", "width"));
        Assert.True(int.Parse(ProbeStream(path, "v:0", "nb_frames")) >= 29);
    }

    private static OutroSettings SupportCard(double seconds = 2.0) => new()
    {
        Kind = OutroKind.Card,
        QrAssetId = "qr",
        Headline = "Support us",
        Subtext = "Scan the code",
        DurationSeconds = seconds,
        Transition = SceneTransition.None,
        // The layout tests read the first frame, before an animated card has arrived.
        Animation = EndCardAnimation.None
    };

    [FfmpegFontFact]
    public async Task An_animated_end_card_arrives_piece_by_piece_and_then_holds()
    {
        RenderFixtures.MakeSprite(Path_("in/qr.png"), "black", 64);
        var card = SupportCard();
        card.Animation = EndCardAnimation.Rise;

        var plan = await AnimStudio.Application.Rendering.EndCardFactory.PrepareAsync(
            _workspace, card, TestCanvas, "in/qr.png", _ => WatermarkFontResolver.FindSystemFont(),
            EncoderProfile.Default, 0, "clips/clip_outro.mp4", new List<string>(), Ct);
        Assert.True(plan.EndCard!.Animate);

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var path = _workspace.Resolve(result.RelativePath);
        Assert.Equal(60, result.Frames.Value);

        // Same layout as the static card: the white square at x=237, y=101, 166px wide.
        var early = MeanLuma(path, "crop=166:8:237:103");
        var settled = MeanLuma(path, "crop=166:8:237:103", at: 1.5);

        Assert.True(early < 60, $"the code was already there on the first frame ({early:F1}).");
        Assert.True(settled > 200, $"the code never settled into place ({settled:F1}).");
    }

    [FfmpegFontFact]
    public async Task Draws_an_end_card_with_its_qr_quiet_zone_and_headline_for_the_whole_duration()
    {
        // At 640x360 the layout puts the headline at y=61 and the white square at
        // x=237,y=101, 166px wide - asserted against the pixels, since a drawtext or
        // drawbox that did nothing still exits 0.
        RenderFixtures.MakeSprite(Path_("in/qr.png"), "black", 64);
        var warnings = new List<string>();

        var plan = await AnimStudio.Application.Rendering.EndCardFactory.PrepareAsync(
            _workspace, SupportCard(), TestCanvas, "in/qr.png", _ => WatermarkFontResolver.FindSystemFont(),
            EncoderProfile.Default, 0, "clips/clip_outro.mp4", warnings, Ct);

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var path = _workspace.Resolve(result.RelativePath);

        Assert.Empty(warnings);
        Assert.Equal(60, result.Frames.Value);

        var quietZone = MeanLuma(path, "crop=166:8:237:103");
        var headline = MeanLuma(path, "crop=640:24:0:61");
        var background = MeanLuma(path, "crop=640:20:0:10");

        Assert.True(quietZone > 200, $"expected a white quiet zone, got luma {quietZone:F1}.");
        Assert.True(headline - background > 1.0,
            $"expected the headline to brighten its band (headline {headline:F2} vs background {background:F2}).");
    }

    [FfmpegFontFact]
    public async Task Draws_hindi_lines_in_a_face_that_has_devanagari()
    {
        // The bug this guards: the Latin watermark face has no Devanagari, and drawtext
        // draws every missing glyph as a box. The resolver must hand Hindi lines a face
        // that covers them - and the line must actually draw, not be dropped.
        var fonts = new WatermarkFontResolver(Options.Create(new RenderOptions()), NullLogger<WatermarkFontResolver>.Instance);
        var hindiFont = fonts.FontFor("हिन्दी");
        if (hindiFont is null) return; // no Devanagari face on this host to test against

        Assert.NotEqual(fonts.FontFilePath, hindiFont);

        var card = SupportCard();
        card.Headline = null;
        card.Subtext = null;
        card.HeadlineSecondary = "इस तरह के और वीडियो के लिए हमारा समर्थन करें";
        RenderFixtures.MakeSprite(Path_("in/qr.png"), "black", 64);
        var warnings = new List<string>();

        var plan = await AnimStudio.Application.Rendering.EndCardFactory.PrepareAsync(
            _workspace, card, TestCanvas, "in/qr.png", fonts.FontFor,
            EncoderProfile.Default, 0, "clips/clip_outro.mp4", warnings, Ct);

        Assert.Empty(warnings);
        var line = Assert.Single(plan.EndCard!.Lines);
        Assert.Equal(hindiFont, line.FontFilePath);

        var result = await _service.RenderClipAsync(plan, _workspace, null, Ct);
        var path = _workspace.Resolve(result.RelativePath);

        var band = MeanLuma(path, $"crop=640:{line.FontPixels}:0:{line.Y}");
        var background = MeanLuma(path, "crop=640:20:0:10");
        Assert.True(band - background > 1.0, $"expected the Hindi line to draw (band {band:F2} vs background {background:F2}).");
    }

    [FfmpegFact]
    public async Task An_end_card_joins_a_clip_by_stream_copy_with_its_fade_inside_it()
    {
        // The card's "transition" is a fade up inside the card, so the join is a cut: the
        // timeline is the plain sum, 1s + 2s, and nothing is re-encoded to get there.
        MakeClip("in/a.mp4", 1.0, 640, 360, 30, withAudio: true);
        RenderFixtures.MakeSprite(Path_("in/qr.png"), "black", 64);

        var card = SupportCard();
        card.Transition = SceneTransition.Fade;

        var plan = await AnimStudio.Application.Rendering.EndCardFactory.PrepareAsync(
            _workspace, card, TestCanvas, "in/qr.png", null,
            EncoderProfile.Default, 1, "clips/clip_outro.mp4", new List<string>(), Ct);
        Assert.True(plan.EndCard!.FadeInSeconds > 0);

        var prepared = new List<SceneRenderResult>
        {
            await _service.RenderClipAsync(Plan(0, "in/a.mp4"), _workspace, null, Ct),
            await _service.RenderClipAsync(plan, _workspace, null, Ct)
        };

        var merged = await Merge(prepared, FrameCount.Zero);

        var duration = ProbeDuration(_workspace.Resolve(merged.RelativePath), "v:0");
        Assert.True(Math.Abs(duration - 3.0) < 0.1, $"expected 3.0s, got {duration:F3}s");
        Assert.Equal(90, merged.Frames.Value);
    }

    [FfmpegFact]
    public async Task An_end_card_survives_a_re_encoded_join_with_a_hard_cut_into_it()
    {
        // An overlay forces the join to re-encode. A hard cut there must not be a
        // zero-length xfade: that drops the second input whole, so the export ended
        // without its card - and a zero-length acrossfade loses audio at the join.
        MakeClip("in/a.mp4", 1.0, 640, 360, 30, withAudio: true);
        RenderFixtures.MakeSprite(Path_("in/qr.png"), "black", 64);
        RenderFixtures.MakeSprite(Path_("in/sticker.png"), "red", 64);

        var plan = await AnimStudio.Application.Rendering.EndCardFactory.PrepareAsync(
            _workspace, SupportCard(), TestCanvas, "in/qr.png", null,
            EncoderProfile.Default, 1, "clips/clip_outro.mp4", new List<string>(), Ct);

        var prepared = new List<SceneRenderResult>
        {
            await _service.RenderClipAsync(Plan(0, "in/a.mp4"), _workspace, null, Ct),
            await _service.RenderClipAsync(plan, _workspace, null, Ct)
        };

        var merged = await Merge(prepared, FrameCount.Zero,
            overlays: [new MergeOverlayItem("image", "in/sticker.png", 0, 0.5, 1, 0, 0, 1)]);

        var path = _workspace.Resolve(merged.RelativePath);
        var video = ProbeDuration(path, "v:0");
        Assert.True(Math.Abs(video - 3.0) < 0.1, $"expected 3.0s with the card, got {video:F3}s");
        var audio = ProbeDuration(path, "a:0");
        Assert.True(Math.Abs(video - audio) < 0.15, $"audio {audio:F3}s drifted from video {video:F3}s");
    }

    [FfmpegFact]
    public async Task Keeps_a_logo_watermark_on_screen_for_the_whole_clip()
    {
        // Without eof_action=repeat on the overlay, the single-frame logo ends the output
        // after one frame - a two-second clip becomes a 33ms one.
        RenderFixtures.MakeSprite(Path_("in/logo.png"), "red", 64);

        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings { Kind = WatermarkKind.Logo, LogoAssetId = "logo" },
            TestCanvas, "in/logo.png", null, null)!;

        MakeClip("in/plain.mp4", 2.0, 640, 360, 30, withAudio: true);

        var result = await _service.RenderClipAsync(
            Plan(0, "in/plain.mp4", watermark: mark), _workspace, null, Ct);

        Assert.InRange(result.Frames.Value, 59, 61);
    }

    // --- joining ------------------------------------------------------------

    [FfmpegFact]
    public async Task Joins_mismatched_clips_into_one_continuous_file()
    {
        // Three clips that agree on nothing, joined as hard cuts - which is the stream-copy
        // path, and therefore the one that is only legal because the conform pass made
        // every output identical.
        MakeClip("in/a.mp4", 1.0, 480, 270, 24, withAudio: true, sampleRate: 44100, channels: 1);
        MakeClip("in/b.mp4", 1.0, 1280, 720, 60, withAudio: false);
        MakeClip("in/c.mp4", 1.0, 640, 360, 30, withAudio: true, sampleRate: 22050, channels: 2);

        var prepared = new List<SceneRenderResult>
        {
            await _service.RenderClipAsync(Plan(0, "in/a.mp4"), _workspace, null, Ct),
            await _service.RenderClipAsync(Plan(1, "in/b.mp4", hasAudio: false), _workspace, null, Ct),
            await _service.RenderClipAsync(Plan(2, "in/c.mp4"), _workspace, null, Ct),
        };

        var merged = await Merge(prepared, FrameCount.Zero);

        var path = _workspace.Resolve(merged.RelativePath);

        // The real test of a copy concat: the whole timeline is present, not just the
        // first clip. Audio has to be there too, or the third clip plays silent.
        var video = ProbeDuration(path, "v:0");
        Assert.InRange(video, 2.8, 3.2);
        Assert.Equal("aac", ProbeStream(path, "a:0", "codec_name"));

        var audio = ProbeDuration(path, "a:0");
        Assert.True(Math.Abs(video - audio) < 0.25,
            $"audio {audio:F3}s and video {video:F3}s drifted apart across the joins.");
    }

    [FfmpegFact]
    public async Task Crossfading_shortens_the_timeline_by_each_transition()
    {
        // The arithmetic that is easy to get wrong: an xfade consumes its duration from
        // BOTH sides, so two 1s clips with a 0.5s crossfade make 1.5s, not 2s.
        MakeClip("in/a.mp4", 1.0, 640, 360, 30, withAudio: true);
        MakeClip("in/b.mp4", 1.0, 640, 360, 30, withAudio: true);

        var prepared = new List<SceneRenderResult>
        {
            await _service.RenderClipAsync(Plan(0, "in/a.mp4"), _workspace, null, Ct),
            await _service.RenderClipAsync(Plan(1, "in/b.mp4"), _workspace, null, Ct),
        };

        var merged = await Merge(prepared, new FrameCount(15));

        var duration = ProbeDuration(_workspace.Resolve(merged.RelativePath), "v:0");
        Assert.True(Math.Abs(duration - 1.5) < 0.12, $"expected 1.5s, got {duration:F3}s");
    }

    [FfmpegFact]
    public async Task A_batched_crossfade_join_lands_on_the_same_timeline_as_a_single_pass()
    {
        // The reason batching exists is memory: an xfade chain opens every clip at once,
        // ~96 MB each at 1080p, so a long stitch pages and its runtime becomes a lottery.
        // The reason it is dangerous is arithmetic: every batch boundary is somewhere a
        // transition can be applied twice or not at all, and neither shows up as an error -
        // only as a video a few frames wrong at each seam.
        //
        // Five 1s clips with 0.5s crossfades: 5 - 4*0.5 = 3.0s, whether that is done in one
        // pass or in three. Forcing two inputs per pass makes the cascade three levels deep
        // over the same five clips, which is the deepest arrangement these fixtures can
        // produce.
        for (var i = 0; i < 5; i++)
            MakeClip($"in/n{i}.mp4", 1.0, 640, 360, 30, withAudio: true);

        var prepared = new List<SceneRenderResult>();
        for (var i = 0; i < 5; i++)
        {
            prepared.Add(await _service.RenderClipAsync(
                Plan(i, $"in/n{i}.mp4"), _workspace, null, Ct));
        }

        var single = await Merge(prepared, new FrameCount(15), maxMergeInputs: 64);
        var batched = await Merge(
            prepared, new FrameCount(15), maxMergeInputs: 2, output: "out/batched.mp4");

        Assert.Equal(single.Frames.Value, batched.Frames.Value);

        var path = _workspace.Resolve(batched.RelativePath);

        var video = ProbeDuration(path, "v:0");
        Assert.True(Math.Abs(video - 3.0) < 0.12, $"expected 3.0s, got {video:F3}s");

        // Audio is crossfaded by a parallel chain, so a boundary bug shows up as drift
        // rather than as a wrong duration.
        var audio = ProbeDuration(path, "a:0");
        Assert.True(Math.Abs(video - audio) < 0.25,
            $"audio {audio:F3}s and video {video:F3}s drifted apart across the batch seams.");
    }

    [FfmpegFact]
    public async Task Batching_leaves_a_hard_cut_join_as_a_stream_copy()
    {
        // The concat demuxer reads one input at a time, so its memory does not grow with the
        // list and there is nothing for batching to fix. Splitting it anyway would turn a
        // lossless copy that takes seconds into a re-encode.
        for (var i = 0; i < 5; i++)
            MakeClip($"in/c{i}.mp4", 1.0, 640, 360, 30, withAudio: true);

        var prepared = new List<SceneRenderResult>();
        for (var i = 0; i < 5; i++)
        {
            prepared.Add(await _service.RenderClipAsync(
                Plan(i, $"in/c{i}.mp4"), _workspace, null, Ct));
        }

        var merged = await Merge(prepared, FrameCount.Zero, maxMergeInputs: 2);

        var duration = ProbeDuration(_workspace.Resolve(merged.RelativePath), "v:0");
        Assert.True(Math.Abs(duration - 5.0) < 0.2, $"expected 5.0s, got {duration:F3}s");

        // A copy leaves no intermediate behind; a cascade would have written one.
        Assert.Empty(Directory.GetFiles(Path_("merge")));
    }

    /// <summary>
    /// Joins prepared clips exactly the way the orchestrator does - measured lengths,
    /// clamped transitions - so the two cannot disagree about the arithmetic.
    /// </summary>
    private Task<MergeRenderResult> Merge(
        List<SceneRenderResult> prepared, FrameCount requestedTransition,
        int maxMergeInputs = 64, string output = "out/final.mp4",
        IReadOnlyList<MergeOverlayItem>? overlays = null)
    {
        var lengths = prepared.Select(p => p.Frames).ToList();
        var transitions = ClipPlanFactory.ClampTransitions(lengths, requestedTransition);

        var joined = prepared.Select((clip, index) => new MergeSceneInput(
            clip.RelativePath,
            lengths[index],
            index < transitions.Count && transitions[index].Value > 0
                ? new TransitionSettings(SceneTransition.Fade, transitions[index])
                : TransitionSettings.None)).ToList();

        return BuildService(maxMergeInputs).MergeScenesAsync(
            new MergePlan
            {
                Canvas = TestCanvas,
                Scenes = joined,
                Overlays = overlays ?? [],
                OutputRelativePath = output
            },
            _workspace, null, Ct);
    }

    // --- probing ------------------------------------------------------------

    private static string ProbeStream(string path, string stream, string entry) =>
        FfmpegLocator.Probe(
            $"-v error -select_streams {stream} -show_entries stream={entry} "
            + $"-of default=nokey=1:noprint_wrappers=1 \"{path}\"");

    private static double ProbeDuration(string path, string stream)
    {
        var text = ProbeStream(path, stream, "duration");

        // A stream-copy concat can leave the per-stream duration unset, in which case the
        // container's is the answer.
        if (!double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds))
        {
            text = FfmpegLocator.Probe(
                $"-v error -show_entries format=duration "
                + $"-of default=nokey=1:noprint_wrappers=1 \"{path}\"");
            seconds = double.Parse(text, CultureInfo.InvariantCulture);
        }

        return seconds;
    }

    /// <summary>
    /// Average brightness of a region of the first frame. Used to prove a watermark really
    /// drew, since a drawtext that silently did nothing still exits 0.
    /// </summary>
    private static double MeanLuma(string path, string cropFilter, double? at = null)
    {
        var seek = at is { } seconds ? $"-ss {seconds.ToString(CultureInfo.InvariantCulture)} " : string.Empty;
        using var process = Process.Start(new ProcessStartInfo(FfmpegLocator.FfmpegPath)
        {
            Arguments = $"-hide_banner -v info {seek}-i \"{path}\" -vf {cropFilter},signalstats,"
                      + "metadata=print:key=lavfi.signalstats.YAVG -frames:v 1 -f null -",
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false
        })!;

        var output = process.StandardError.ReadToEnd() + process.StandardOutput.ReadToEnd();
        process.WaitForExit(60_000);

        var marker = "lavfi.signalstats.YAVG=";
        var index = output.IndexOf(marker, StringComparison.Ordinal);
        Assert.True(index >= 0, "signalstats produced no YAVG reading.");

        var value = output[(index + marker.Length)..].Split('\n')[0].Trim();
        return double.Parse(value, CultureInfo.InvariantCulture);
    }

    private static void Run(string arguments)
    {
        using var process = Process.Start(new ProcessStartInfo(FfmpegLocator.FfmpegPath)
        {
            Arguments = "-hide_banner -loglevel error " + arguments,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false
        })!;

        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(120_000);

        if (process.ExitCode != 0)
            throw new InvalidOperationException($"Fixture generation failed: {stderr}");
    }


    private sealed class NullObjectStore : IObjectStore
    {
        public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default) =>
            Task.CompletedTask;
        public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
            Task.FromResult<Stream?>(null);
        public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    }
}
