using System.Globalization;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Characters;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Re-voices browser-style recordings with the real ffmpeg. What matters is what a viewer
/// would notice: the picture is the same, the length is the same, and the voice switches land
/// where they were made - a render that drifts by a few frames ruins lip sync.
/// </summary>
public sealed class StudioVoiceRenderTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", "voice-" + Guid.NewGuid().ToString("n"));

    private static readonly CancellationToken Ct = new CancellationTokenSource(TimeSpan.FromMinutes(5)).Token;

    public StudioVoiceRenderTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    [FfmpegFact]
    public async Task A_camera_take_keeps_its_picture_and_length_with_every_effect()
    {
        var renderer = await RendererAsync();
        if (!renderer.IsAvailable) return; // This ffmpeg build has no rubberband: nothing to check.

        var take = Path.Combine(_root, "take.webm");
        RenderFixtures.MakeCameraRecording(take, seconds: 6);

        var output = await RenderAsync(renderer, take, StudioVoiceContainer.WebM,
        [
            new StudioVoiceSegment(0, new CharacterVoice { PitchSemitones = -4, SizeSemitones = -2, BassDecibels = 4, Reverb = 0.5 }),
            new StudioVoiceSegment(2, null),
            new StudioVoiceSegment(4, new CharacterVoice { PitchSemitones = 5, SizeSemitones = 2, Drive = 0.4, Robot = 0.3, Echo = 0.4, Radio = true })
        ]);

        Assert.Equal("vp8,video\nopus,audio", Probe("-v error -show_entries stream=codec_name,codec_type -of csv=p=0", output).Replace("\r", ""));
        Assert.InRange(Duration(output), 5.9, 6.1);
    }

    [FfmpegFact]
    public async Task An_mp4_take_from_chrome_stays_an_mp4_with_its_h264_picture()
    {
        var renderer = await RendererAsync();
        if (!renderer.IsAvailable) return;

        var take = Path.Combine(_root, "take.mp4");
        RenderFixtures.MakeVideo(take, seconds: 4);

        var output = await RenderAsync(renderer, take, StudioVoiceContainer.Mp4,
        [
            new StudioVoiceSegment(0, null),
            new StudioVoiceSegment(1, new CharacterVoice { PitchSemitones = -2, SizeSemitones = -1, Reverb = 0.5 })
        ]);

        Assert.Equal("h264,video\naac,audio", Probe("-v error -show_entries stream=codec_name,codec_type -of csv=p=0", output).Replace("\r", ""));
        Assert.InRange(Duration(output), 3.9, 4.15);
    }

    [FfmpegFact]
    public async Task An_ai_part_is_cut_out_converted_and_put_back_in_place()
    {
        // A stand-in converter that only checks what it is given and passes the part through,
        // so the plumbing around the real model is tested without installing it.
        var converter = new PassThroughConverter();
        var renderer = await RendererAsync(converter);
        if (!renderer.IsAvailable) return;

        var take = Path.Combine(_root, "take.webm");
        RenderFixtures.MakeCameraRecording(take, seconds: 6);
        var sample = Path.Combine(_root, "sample.wav");
        RenderFixtures.MakeTone(sample, seconds: 40, frequency: 180);

        var person = new CharacterVoice { AiSampleAssetId = "sample-asset", AiSampleConsent = true, Reverb = 0.3 };
        var output = await RenderAsync(renderer, take, StudioVoiceContainer.WebM,
            [new StudioVoiceSegment(0, null), new StudioVoiceSegment(2, person), new StudioVoiceSegment(4, null)],
            new Dictionary<string, string> { ["sample-asset"] = sample });

        var job = Assert.Single(converter.Jobs);
        Assert.InRange(converter.SourceSeconds, 1.95, 2.05);
        // Only the first 25 s of a sample is listened to.
        Assert.InRange(converter.SampleSeconds, 24.9, 25.1);
        Assert.EndsWith("voiced-1.wav", job.OutputPath);
        Assert.Equal("vp8,video\nopus,audio", Probe("-v error -show_entries stream=codec_name,codec_type -of csv=p=0", output).Replace("\r", ""));
        Assert.InRange(Duration(output), 5.9, 6.1);
    }

    [SeedVcFact]
    public async Task Seed_vc_turns_a_line_into_the_sampled_voice()
    {
        var converter = SeedVcFactAttribute.Converter();
        var renderer = await RendererAsync(converter);
        if (!renderer.IsAvailable) return;

        // Seed-VC's own example voices: a performance and a different speaker's sample.
        var examples = Path.Combine(SeedVcFactAttribute.SeedVcPath, "examples");
        var line = Path.Combine(_root, "line.webm");
        Run($"-y -i \"{Path.Combine(examples, "source", "source_s1.wav")}\" -t 6 -c:a libopus -f webm \"{line}\"");

        var person = new CharacterVoice { AiSampleAssetId = "sample-asset", AiSampleConsent = true };
        var output = await RenderAsync(renderer, line, StudioVoiceContainer.WebM,
            [new StudioVoiceSegment(0, person)],
            new Dictionary<string, string> { ["sample-asset"] = Path.Combine(examples, "reference", "s1p1.wav") },
            // A first run downloads the models (about 2 GB) before converting anything.
            new CancellationTokenSource(TimeSpan.FromMinutes(30)).Token);

        Assert.Equal("audio", Probe("-v error -show_entries stream=codec_type -of csv=p=0", output));
        Assert.InRange(Duration(output), 5.9, 6.1);
    }

    [SeedVcFact]
    public async Task A_spoken_voiceover_line_comes_back_as_a_wav_in_the_sampled_voice()
    {
        var renderer = await RendererAsync(SeedVcFactAttribute.Converter());
        if (!renderer.CanReVoice) return;

        // What the speech engine hands over: a plain WAV line. The sample is a browser-style WebM.
        var examples = Path.Combine(SeedVcFactAttribute.SeedVcPath, "examples");
        var line = Path.Combine(_root, "line.wav");
        Run($"-y -i \"{Path.Combine(examples, "source", "source_s1.wav")}\" -t 5 -ar 24000 -ac 1 \"{line}\"");
        var sample = Path.Combine(_root, "sample.webm");
        Run($"-y -i \"{Path.Combine(examples, "reference", "s1p1.wav")}\" -c:a libopus -f webm \"{sample}\"");

        var bytes = await renderer.ReVoiceAsync(await File.ReadAllBytesAsync(line, Ct), sample,
            new CancellationTokenSource(TimeSpan.FromMinutes(30)).Token);

        Assert.Equal(AnimStudio.Application.Ai.AiAudioValidator.Wav, AnimStudio.Application.Ai.AiAudioValidator.Sniff(bytes));
        var output = Path.Combine(_root, "revoiced.wav");
        await File.WriteAllBytesAsync(output, bytes, Ct);
        Assert.InRange(Duration(output), 4.8, 5.2);
    }

    [FfmpegFact]
    public async Task A_microphone_only_dub_comes_back_as_audio_only()
    {
        var renderer = await RendererAsync();
        if (!renderer.IsAvailable) return;

        var line = Path.Combine(_root, "line.webm");
        Run($"-y -f lavfi -i \"sine=frequency=220:duration=3:sample_rate=48000\" -c:a libopus -f webm \"{line}\"");

        var output = await RenderAsync(renderer, line, StudioVoiceContainer.WebM,
            [new StudioVoiceSegment(0, new CharacterVoice { PitchSemitones = -7, SizeSemitones = -3 })]);

        Assert.Equal("audio", Probe("-v error -show_entries stream=codec_type -of csv=p=0", output));
        Assert.InRange(Duration(output), 2.9, 3.1);
    }

    [FfmpegFact]
    public async Task Switches_land_where_they_were_made()
    {
        var renderer = await RendererAsync();
        if (!renderer.IsAvailable) return;

        // A short burst at every whole second: each must still start on its second afterwards.
        var clicks = Path.Combine(_root, "clicks.webm");
        Run("-y -f lavfi -i \"aevalsrc='if(lt(mod(t\\,1)\\,0.04)\\,sin(2*PI*220*t)\\,0)':s=48000:d=5\" "
            + $"-c:a libopus -f webm \"{clicks}\"");

        var output = await RenderAsync(renderer, clicks, StudioVoiceContainer.WebM,
        [
            // No hall or echo here: their tails would fill the silences the check listens for.
            new StudioVoiceSegment(0, new CharacterVoice { PitchSemitones = -6, SizeSemitones = -3, BassDecibels = 4 }),
            new StudioVoiceSegment(1.5, new CharacterVoice { PitchSemitones = 4, SizeSemitones = 2, Drive = 0.3 }),
            new StudioVoiceSegment(3.5, null)
        ]);

        var onsets = Onsets(output);
        foreach (var second in new[] { 1.0, 2.0, 3.0, 4.0 })
            Assert.True(onsets.Any(t => Math.Abs(t - second) < 0.02),
                $"Nothing started at {second}s; sound started at {string.Join(", ", onsets)}.");
    }

    private static async Task<FfmpegStudioVoiceRenderer> RendererAsync(IVoiceConverter? converter = null)
    {
        var runner = new FfmpegRunner(Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        }), NullLogger<FfmpegRunner>.Instance);
        var capabilities = await new FfmpegCapabilityProbe(runner, Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        }), NullLogger<FfmpegCapabilityProbe>.Instance).ProbeAsync(Ct);

        return new FfmpegStudioVoiceRenderer(runner, new TempWorkspaces(), capabilities,
            converter ?? new NoConverter(), NullLogger<FfmpegStudioVoiceRenderer>.Instance);
    }

    private async Task<string> RenderAsync(
        FfmpegStudioVoiceRenderer renderer, string input, StudioVoiceContainer container,
        IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<string, string>? samples = null,
        CancellationToken? ct = null)
    {
        await using var recording = File.OpenRead(input);
        await using var output = await renderer.RenderAsync(recording, container, segments, samples ?? new Dictionary<string, string>(), ct ?? Ct);
        var path = Path.Combine(_root, "studio-" + Guid.NewGuid().ToString("n") + (container == StudioVoiceContainer.WebM ? ".webm" : ".mp4"));
        await using (var file = File.Create(path))
            await output.Content.CopyToAsync(file, Ct);
        return path;
    }

    private static double Duration(string file) =>
        double.Parse(Probe("-v error -show_entries format=duration -of csv=p=0", file), CultureInfo.InvariantCulture);

    private static string Probe(string arguments, string file) => FfmpegLocator.Probe($"{arguments} \"{file}\"").Trim();

    /// <summary>Where sound starts after a silence, from ffmpeg's own silence detector.</summary>
    private static List<double> Onsets(string file)
    {
        using var process = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(FfmpegLocator.FfmpegPath)
        {
            Arguments = $"-hide_banner -i \"{file}\" -af silencedetect=n=-30dB:d=0.3 -f null -",
            RedirectStandardError = true,
            UseShellExecute = false
        })!;
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(60_000);
        return [.. System.Text.RegularExpressions.Regex.Matches(stderr, @"silence_end: ([0-9.]+)")
            .Select(m => double.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture))];
    }

    private static void Run(string arguments)
    {
        using var process = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(FfmpegLocator.FfmpegPath)
        {
            Arguments = "-hide_banner -loglevel error " + arguments,
            RedirectStandardError = true,
            UseShellExecute = false
        })!;
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(60_000);
        if (process.ExitCode != 0) throw new InvalidOperationException($"Fixture generation failed: {stderr}");
    }

    /// <summary>
    /// Scratch folders whose "store" is the disk: a sample's storage key is its file path,
    /// so the render can materialise it like it would from the real object store.
    /// </summary>
    private sealed class TempWorkspaces : IRenderWorkspaceFactory
    {
        public Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct) =>
            Task.FromResult<IRenderWorkspace>(new DiskWorkspace(new LocalRenderWorkspace(
                jobId, Path.Combine(Path.GetTempPath(), "animstudio-tests", jobId), null!,
                NullLogger.Instance, keepOnFailure: false)));
    }

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

    private sealed class NoConverter : IVoiceConverter
    {
        public bool IsAvailable => false;
        public Task ConvertAsync(IReadOnlyList<VoiceConversionJob> jobs, string workingDirectory, CancellationToken ct) =>
            throw new InvalidOperationException("No AI voice was expected.");
    }

    private sealed class PassThroughConverter : IVoiceConverter
    {
        public List<VoiceConversionJob> Jobs { get; } = [];
        public double SourceSeconds { get; private set; }
        public double SampleSeconds { get; private set; }
        public bool IsAvailable => true;

        public Task ConvertAsync(IReadOnlyList<VoiceConversionJob> jobs, string workingDirectory, CancellationToken ct)
        {
            foreach (var job in jobs)
            {
                Jobs.Add(job);
                SourceSeconds = Duration(job.SourcePath);
                SampleSeconds = Duration(job.SamplePath);
                File.Copy(job.SourcePath, job.OutputPath);
            }
            return Task.CompletedTask;
        }
    }
}
