using System.Globalization;
using System.IO.Compression;
using AnimStudio.Application.Releases;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Releases;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// Builds a whole release kit with the real ffmpeg and checks each output with ffprobe,
/// because every one of these steps can exit 0 and still produce a file a distributor
/// would reject. Fixtures are synthetic tones and solid-colour images.
/// </summary>
public sealed class ReleaseKitBuildTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", "release-" + Guid.NewGuid().ToString("n"));

    private static readonly CancellationToken Ct = new CancellationTokenSource(TimeSpan.FromMinutes(5)).Token;

    private static readonly ReleaseMetadata Metadata = new()
    {
        Title = "Test Tone",
        PrimaryArtist = "Synthetic Artist",
        Songwriters = ["Sample Writer"],
        Genre = "Electronic",
        Language = "en",
        RecordingCopyright = "2026 Sample Label",
        Lyrics = "line one\nline two",
        RightsConfirmed = true
    };

    public ReleaseKitBuildTests() => Directory.CreateDirectory(_root);

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    private static FfmpegReleaseKitBuilder Builder() => new(
        new FfmpegRunner(Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        }), NullLogger<FfmpegRunner>.Instance),
        NullLogger<FfmpegReleaseKitBuilder>.Instance);

    private ReleaseKitBuildRequest Request(string audio, string? cover, ReleaseKitOptions? options = null) =>
        new("job", _root, audio, AudioLossless: true, cover, Metadata, options ?? new ReleaseKitOptions(), []);

    [FfmpegFact]
    public async Task Builds_a_normalised_master_artwork_videos_and_sheet()
    {
        // A quiet 48 kHz tone: the master has to be raised to -14 LUFS and resampled to 44.1 kHz.
        RenderFixtures.MakeTone(Path.Combine(_root, "source.wav"), seconds: 6);
        RenderFixtures.MakeBackground(Path.Combine(_root, "cover_source.png"), "teal", 1200, 800);

        var result = await Builder().BuildAsync(Request("source.wav", "cover_source.png"), Ct);

        Assert.Equal(
            [
                FfmpegReleaseKitBuilder.MasterFile, FfmpegReleaseKitBuilder.CoverFile,
                FfmpegReleaseKitBuilder.VisualizerFile, FfmpegReleaseKitBuilder.PromoLoopFile,
                FfmpegReleaseKitBuilder.MetadataFile, FfmpegReleaseKitBuilder.SheetFile,
                FfmpegReleaseKitBuilder.LyricsFile, FfmpegReleaseKitBuilder.ZipFile
            ],
            result.Files.Select(f => f.Name));

        Assert.InRange(result.After.IntegratedLufs, -15.0, -13.0);
        Assert.True(result.After.TruePeakDb <= -0.5, $"true peak {result.After.TruePeakDb}");

        Assert.Equal("pcm_s24le,44100,2",
            Probe("-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0", FfmpegReleaseKitBuilder.MasterFile));

        Assert.Equal("3000,3000",
            Probe("-v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0", FfmpegReleaseKitBuilder.CoverFile));

        Assert.Equal("1920,1080",
            Probe("-v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0", FfmpegReleaseKitBuilder.VisualizerFile));
        var visualizerSeconds = double.Parse(
            Probe("-v error -show_entries format=duration -of csv=p=0", FfmpegReleaseKitBuilder.VisualizerFile), CultureInfo.InvariantCulture);
        Assert.InRange(visualizerSeconds, 5.5, 6.5);

        Assert.Equal("1080,1920",
            Probe("-v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0", FfmpegReleaseKitBuilder.PromoLoopFile));
        Assert.Equal(string.Empty,
            Probe("-v error -select_streams a -show_entries stream=index -of csv=p=0", FfmpegReleaseKitBuilder.PromoLoopFile));

        // The 1200x800 cover was both too small and not square; both are worth telling the user.
        Assert.Contains(result.Warnings, w => w.Code == "cover-upscaled");
        Assert.Contains(result.Warnings, w => w.Code == "cover-cropped");

        // Only the kit's outputs are archived - never the uploads.
        using var zip = ZipFile.OpenRead(Path.Combine(_root, FfmpegReleaseKitBuilder.ZipFile));
        Assert.Equal(7, zip.Entries.Count);
        Assert.All(zip.Entries, e => Assert.StartsWith("Synthetic Artist - Test Tone/", e.FullName));
        Assert.DoesNotContain(zip.Entries, e => e.Name.StartsWith("source", StringComparison.Ordinal));

        var sheet = await File.ReadAllTextAsync(Path.Combine(_root, FfmpegReleaseKitBuilder.SheetFile), Ct);
        Assert.Contains("Synthetic Artist", sheet);
        Assert.Contains("WAV 24-bit / 44100 Hz stereo", sheet);
    }

    [FfmpegFact]
    public async Task Sixteen_bit_without_cover_skips_the_videos()
    {
        RenderFixtures.MakeTone(Path.Combine(_root, "source.wav"), seconds: 3);

        var result = await Builder().BuildAsync(
            Request("source.wav", cover: null, new ReleaseKitOptions { BitDepth = 16, SampleRate = 48_000 }), Ct);

        Assert.DoesNotContain(result.Files, f => f.Name.EndsWith(".mp4", StringComparison.Ordinal));
        Assert.Contains(result.Warnings, w => w.Code == "no-cover");
        Assert.Contains(result.Warnings, w => w.Code == "short-track");
        Assert.Equal("pcm_s16le,48000",
            Probe("-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate -of csv=p=0", FfmpegReleaseKitBuilder.MasterFile));
    }

    [FfmpegFact]
    public async Task Silent_audio_is_refused_rather_than_amplified()
    {
        RenderFixtures.MakeSilence(Path.Combine(_root, "source.wav"), seconds: 3);

        var error = await Assert.ThrowsAsync<ReleaseKitException>(() =>
            Builder().BuildAsync(Request("source.wav", cover: null), Ct));

        Assert.Equal("audio-silent", error.Code);
    }

    private string Probe(string arguments, string file) =>
        FfmpegLocator.Probe($"{arguments} \"{Path.Combine(_root, file)}\"");
}
