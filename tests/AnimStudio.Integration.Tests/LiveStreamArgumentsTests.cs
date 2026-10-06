using System.Globalization;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.LiveStreams;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Runs the real live-stream command lines with the installed ffmpeg: prepares segments from
/// different kinds of source, then sends them with the concat-and-copy push to a local FLV
/// file where a stream would go to YouTube. That proves the segments really are
/// interchangeable - the whole point of preparing - without a network or a stream key. The
/// push reads at playback speed (-re), so each case takes as long as the media it sends.
/// </summary>
public sealed class LiveStreamArgumentsTests : IDisposable
{
    private const string Output = "out.flv";

    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", "live-" + Guid.NewGuid().ToString("n"));

    private static readonly CancellationToken Ct = new CancellationTokenSource(TimeSpan.FromMinutes(3)).Token;

    public LiveStreamArgumentsTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    private static FfmpegRunner Runner() => new(
        Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        }),
        NullLogger<FfmpegRunner>.Instance);

    private async Task<FfmpegResult> RunAsync(IReadOnlyList<string> arguments) =>
        await Runner().RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = _root,
            Arguments = arguments,
            CaptureProgress = arguments.Contains("-progress"),
            Timeout = TimeSpan.FromMinutes(2)
        }, progress: null, Ct);

    private async Task ShouldSucceed(IReadOnlyList<string> arguments)
    {
        var result = await RunAsync(arguments);
        Assert.True(result.ExitCode == 0, result.StderrTail);
    }

    private string Probe(string file, string entries) =>
        FfmpegLocator.Probe($"-v error {entries} -of default=nw=1 \"{Path.Combine(_root, file)}\"");

    private double Duration(string file) =>
        double.Parse(Probe(file, "-show_entries format=duration").Replace("duration=", ""), CultureInfo.InvariantCulture);

    [FfmpegFact]
    public async Task Segments_from_different_sources_join_and_send_without_re_encoding()
    {
        var settings = new LiveStreamSettings { Loops = 2 };

        // A 4:3 video with sound, a silent video, and a song with a cover: three very different inputs.
        RenderFixtures.MakeVideo(Path.Combine(_root, "a.mp4"), seconds: 1.5, width: 640, height: 480);
        RenderFixtures.MakeVideo(Path.Combine(_root, "b.mp4"), seconds: 1.0, withAudio: false);
        RenderFixtures.MakeBackground(Path.Combine(_root, "cover.png"), "teal", 900, 600);
        RenderFixtures.MakeTone(Path.Combine(_root, "c.wav"), seconds: 1.5);

        await ShouldSucceed(LiveStreamArguments.ConformVideo("a.mp4", hasAudio: true, settings, LiveStreamArguments.SegmentFile(0)));
        await ShouldSucceed(LiveStreamArguments.ConformVideo("b.mp4", hasAudio: false, settings, LiveStreamArguments.SegmentFile(1)));
        await ShouldSucceed(LiveStreamArguments.Stage("cover.png", settings, LiveStreamArguments.StageFile(2)));
        await ShouldSucceed(LiveStreamArguments.ConformCoverAndAudio("c.wav", LiveStreamArguments.StageFile(2), settings, LiveStreamArguments.SegmentFile(2)));

        // Every segment is a 720p H.264 + AAC file whose audio is as long as its picture.
        for (var i = 0; i < 3; i++)
        {
            var segment = LiveStreamArguments.SegmentFile(i);
            Assert.Contains("width=1280", Probe(segment, "-select_streams v:0 -show_entries stream=width"));
            Assert.Contains("codec_name=aac", Probe(segment, "-select_streams a:0 -show_entries stream=codec_name"));
        }

        var segments = Enumerable.Range(0, 3).Select(LiveStreamArguments.SegmentFile).ToList();
        await File.WriteAllTextAsync(Path.Combine(_root, LiveStreamArguments.PlaylistFile),
            LiveStreamArguments.PlaylistContent(segments, startItem: 0, remainingFullLoops: settings.Loops - 1), Ct);

        await ShouldSucceed(LiveStreamArguments.Push(loopForever: false, Output));

        // Two passes of 1.5 + 1.0 + 1.5 s, sent as FLV with both tracks.
        Assert.Contains("codec_name=h264", Probe(Output, "-select_streams v:0 -show_entries stream=codec_name"));
        Assert.Contains("codec_name=aac", Probe(Output, "-select_streams a:0 -show_entries stream=codec_name"));
        Assert.InRange(Duration(Output), 7.0, 9.0);
    }

    [FfmpegFact]
    public async Task A_song_without_a_cover_streams_in_portrait()
    {
        RenderFixtures.MakeTone(Path.Combine(_root, "song.wav"), seconds: 2);
        var settings = new LiveStreamSettings { Loops = 1, Orientation = LiveStreamOrientation.Portrait };

        await ShouldSucceed(LiveStreamArguments.Stage(null, settings, LiveStreamArguments.StageFile(0)));
        await ShouldSucceed(LiveStreamArguments.ConformCoverAndAudio("song.wav", LiveStreamArguments.StageFile(0), settings, LiveStreamArguments.SegmentFile(0)));

        var segment = LiveStreamArguments.SegmentFile(0);
        Assert.Contains("width=720", Probe(segment, "-select_streams v:0 -show_entries stream=width"));
        Assert.Contains("height=1280", Probe(segment, "-select_streams v:0 -show_entries stream=height"));
        Assert.InRange(Duration(segment), 1.6, 2.6);
    }

    [FfmpegFact]
    public async Task A_reconnect_list_sends_only_what_was_left()
    {
        var settings = new LiveStreamSettings { Loops = 1 };
        for (var i = 0; i < 3; i++)
        {
            RenderFixtures.MakeVideo(Path.Combine(_root, $"v{i}.mp4"), seconds: 1.0);
            await ShouldSucceed(LiveStreamArguments.ConformVideo($"v{i}.mp4", true, settings, LiveStreamArguments.SegmentFile(i)));
        }

        // Dropped during item 1 of the only pass: items 1 and 2 remain.
        var segments = Enumerable.Range(0, 3).Select(LiveStreamArguments.SegmentFile).ToList();
        await File.WriteAllTextAsync(Path.Combine(_root, LiveStreamArguments.PlaylistFile),
            LiveStreamArguments.PlaylistContent(segments, startItem: 1, remainingFullLoops: 0), Ct);

        await ShouldSucceed(LiveStreamArguments.Push(loopForever: false, Output));
        Assert.InRange(Duration(Output), 1.6, 2.6);
    }
}
