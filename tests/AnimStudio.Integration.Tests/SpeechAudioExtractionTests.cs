using System.Globalization;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Transcripts;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Reads the speech out of real files with the real ffmpeg. What matters to a transcript is
/// that every part is what a recognizer takes, and that each part's offset is where it really
/// starts - an offset that drifts puts every later line at the wrong moment.
/// </summary>
public sealed class SpeechAudioExtractionTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", "speech-" + Guid.NewGuid().ToString("n"));

    private static readonly CancellationToken Ct = new CancellationTokenSource(TimeSpan.FromMinutes(5)).Token;

    public SpeechAudioExtractionTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    [FfmpegFact]
    public async Task A_video_is_cut_into_16k_mono_parts_whose_offsets_are_their_real_starts()
    {
        var video = Path.Combine(_root, "talk.mp4");
        RenderFixtures.MakeVideo(video, seconds: 25);
        var extractor = await ExtractorAsync();

        await using var workspace = Workspace();
        var parts = await extractor.ExtractAsync(workspace, video, TimeSpan.FromSeconds(10), TimeSpan.FromHours(2), Ct);

        Assert.Equal(3, parts.Count);
        Assert.Equal(TimeSpan.Zero, parts[0].Offset);
        for (var i = 0; i < parts.Count; i++)
        {
            Assert.Equal("16000,1", Probe("-v error -show_entries stream=sample_rate,channels -of csv=p=0", parts[i].AudioPath));
            if (i > 0)
                Assert.Equal(Duration(parts[i - 1].AudioPath), (parts[i].Offset - parts[i - 1].Offset).TotalSeconds, precision: 2);
        }
    }

    [FfmpegFact]
    public async Task Only_the_first_max_length_is_read()
    {
        var tone = Path.Combine(_root, "tone.wav");
        RenderFixtures.MakeTone(tone, seconds: 20);
        var extractor = await ExtractorAsync();

        await using var workspace = Workspace();
        var parts = await extractor.ExtractAsync(workspace, tone, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(12), Ct);

        Assert.InRange(parts.Sum(p => Duration(p.AudioPath)), 11.9, 12.1);
    }

    [FfmpegFact]
    public async Task A_video_without_sound_is_reported_as_having_none()
    {
        var video = Path.Combine(_root, "mute.mp4");
        RenderFixtures.MakeVideo(video, seconds: 3, withAudio: false);
        var extractor = await ExtractorAsync();

        await using var workspace = Workspace();
        var ex = await Assert.ThrowsAsync<SpeechAudioExtractionException>(
            () => extractor.ExtractAsync(workspace, video, TimeSpan.FromSeconds(10), TimeSpan.FromHours(2), Ct));

        Assert.True(ex.NoAudio);
    }

    private static async Task<FfmpegSpeechAudioExtractor> ExtractorAsync()
    {
        var options = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var runner = new FfmpegRunner(options, NullLogger<FfmpegRunner>.Instance);
        var capabilities = await new FfmpegCapabilityProbe(runner, options, NullLogger<FfmpegCapabilityProbe>.Instance).ProbeAsync(Ct);
        return new FfmpegSpeechAudioExtractor(runner, capabilities, NullLogger<FfmpegSpeechAudioExtractor>.Instance);
    }

    private IRenderWorkspace Workspace()
    {
        var id = "speech-" + Guid.NewGuid().ToString("n");
        return new DiskWorkspace(new LocalRenderWorkspace(
            id, Path.Combine(_root, id), null!, NullLogger.Instance, keepOnFailure: false));
    }

    private static double Duration(string path) =>
        double.Parse(Probe("-v error -show_entries format=duration -of csv=p=0", path), CultureInfo.InvariantCulture);

    private static string Probe(string arguments, string path)
    {
        using var process = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(
            FfmpegLocator.FfprobePath, $"{arguments} \"{path}\"")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false
        })!;
        var output = process.StandardOutput.ReadToEnd().Trim();
        process.WaitForExit();
        return output;
    }

    /// <summary>The storage key is a path on disk, so a test needs no object store.</summary>
    private sealed class DiskWorkspace(IRenderWorkspace inner) : IRenderWorkspace
    {
        public string JobId => inner.JobId;
        public string RootPath => inner.RootPath;
        public string Resolve(string relativeName) => inner.Resolve(relativeName);

        public Task<string> MaterializeAsync(string storageKey, string relativeName, CancellationToken ct)
        {
            File.Copy(storageKey, inner.Resolve(relativeName), overwrite: true);
            return Task.FromResult(relativeName);
        }

        public Task<string> WriteTextAsync(string relativeName, string content, CancellationToken ct) =>
            inner.WriteTextAsync(relativeName, content, ct);
        public Task PublishAsync(string relativeName, string storageKey, string contentType, CancellationToken ct) =>
            inner.PublishAsync(relativeName, storageKey, contentType, ct);
        public void MarkFailed(string reason) => inner.MarkFailed(reason);
        public ValueTask DisposeAsync() => inner.DisposeAsync();
    }
}
