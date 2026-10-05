using System.Globalization;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.LiveStreams;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Feeds a browser-style WebM recording, in chunks as the camera page sends it, through the
/// real piped encoder and the real camera command line - to a local FLV file where a stream
/// would go to YouTube. Proves the recording is read from stdin as it arrives and comes out
/// in YouTube's ingest format.
/// </summary>
public sealed class CameraPushTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", "camera-" + Guid.NewGuid().ToString("n"));

    public CameraPushTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    [FfmpegFact]
    public async Task A_chunked_webm_recording_comes_out_as_youtube_ready_flv()
    {
        var recording = Path.Combine(_root, "recording.webm");
        RenderFixtures.MakeCameraRecording(recording, seconds: 3);

        var factory = new FfmpegPipeFactory(
            Options.Create(new FfmpegOptions { FfmpegPath = FfmpegLocator.FfmpegPath, FfprobePath = FfmpegLocator.FfprobePath }),
            NullLogger<FfmpegPipeFactory>.Instance);
        var settings = new CameraStreamSettings { RightsConfirmed = true };
        var reported = 0.0;

        await using var pipe = factory.Start(
            _root,
            LiveStreamArguments.CameraPush(CameraContainer.WebM, settings, "veryfast", "out.flv"),
            new Progress<FfmpegProgress>(p => reported = Math.Max(reported, p.OutTime.TotalSeconds)));

        // In the page's one-second chunks, roughly: here a fixed size is enough.
        var bytes = await File.ReadAllBytesAsync(recording);
        foreach (var chunk in bytes.Chunk(64 * 1024))
            await pipe.Input.WriteAsync(chunk);
        await pipe.CloseInputAsync();

        var exitCode = await pipe.Exited.WaitAsync(TimeSpan.FromMinutes(2));
        Assert.True(exitCode == 0, pipe.StderrTail);

        var streams = FfmpegLocator.Probe(
            $"-v error -show_entries stream=codec_name,width,height,sample_rate -of default=nw=1 \"{Path.Combine(_root, "out.flv")}\"");
        Assert.Contains("codec_name=h264", streams);
        Assert.Contains("width=1280", streams);
        Assert.Contains("height=720", streams);
        Assert.Contains("codec_name=aac", streams);
        Assert.Contains("sample_rate=44100", streams);

        var duration = double.Parse(
            FfmpegLocator.Probe($"-v error -show_entries format=duration -of default=nw=1:nk=1 \"{Path.Combine(_root, "out.flv")}\"").Trim(),
            CultureInfo.InvariantCulture);
        Assert.InRange(duration, 2.5, 3.6);
        Assert.True(reported > 0, "ffmpeg never reported progress, so the stream would never be marked live.");
    }

    [FfmpegFact]
    public async Task Something_that_isnt_a_recording_fails_as_an_input_problem()
    {
        var factory = new FfmpegPipeFactory(
            Options.Create(new FfmpegOptions { FfmpegPath = FfmpegLocator.FfmpegPath, FfprobePath = FfmpegLocator.FfprobePath }),
            NullLogger<FfmpegPipeFactory>.Instance);

        await using var pipe = factory.Start(
            _root, LiveStreamArguments.CameraPush(CameraContainer.WebM, new CameraStreamSettings(), "veryfast", "out.flv"), null);
        try
        {
            await pipe.Input.WriteAsync(new byte[] { 0x1A, 0x45, 0xDF, 0xA3, 1, 2, 3, 4, 5, 6, 7, 8 });
        }
        catch (IOException)
        {
            // ffmpeg may already have given up and closed its stdin.
        }
        await pipe.CloseInputAsync();

        Assert.NotEqual(0, await pipe.Exited.WaitAsync(TimeSpan.FromMinutes(1)));
        Assert.True(CameraStreamManager.IsInputFailure(pipe.StderrTail), pipe.StderrTail);
    }
}
