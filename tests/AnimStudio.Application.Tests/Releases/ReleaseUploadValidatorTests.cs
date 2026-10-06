using System.Text;
using AnimStudio.Application.Releases;
using AnimStudio.Infrastructure.Releases;

namespace AnimStudio.Application.Tests.Releases;

public class ReleaseUploadValidatorTests
{
    private static Task<ReleaseUploadValidator.AudioCheck> Check(string fileName, byte[] bytes) =>
        ReleaseUploadValidator.ValidateAudioAsync(fileName, bytes.Length, new MemoryStream(bytes), CancellationToken.None);

    private static byte[] Header(string ascii, int length = 32)
    {
        var bytes = new byte[length];
        Encoding.ASCII.GetBytes(ascii).CopyTo(bytes, 0);
        return bytes;
    }

    private static readonly byte[] Wav = Header("RIFF\0\0\0\0WAVEfmt ");
    private static readonly byte[] Flac = Header("fLaC\0\0\0\"");
    private static readonly byte[] Aiff = Header("FORM\0\0\0\0AIFFCOMM");
    private static readonly byte[] Mp3 = Header("ID3\u0004\0\0\0\0");
    private static readonly byte[] M4a = Header("\0\0\0 ftypM4A ");

    [Theory]
    [InlineData("song.wav", true)]
    [InlineData("song.flac", true)]
    [InlineData("song.aiff", true)]
    [InlineData("song.mp3", false)]
    [InlineData("song.m4a", false)]
    public async Task Accepts_the_formats_masters_come_in(string fileName, bool lossless)
    {
        var bytes = Path.GetExtension(fileName) switch
        {
            ".wav" => Wav, ".flac" => Flac, ".aiff" => Aiff, ".mp3" => Mp3, _ => M4a
        };

        var result = await Check(fileName, bytes);

        Assert.True(result.IsValid, result.Message);
        Assert.Equal(lossless, result.Lossless);
    }

    [Fact]
    public async Task A_renamed_file_is_refused()
    {
        var result = await Check("song.wav", Flac);

        Assert.False(result.IsValid);
        Assert.Equal("audio-content-mismatch", result.Code);
    }

    [Fact]
    public async Task A_webp_is_not_a_wav_despite_sharing_riff()
    {
        var result = await Check("song.wav", Header("RIFF\0\0\0\0WEBPVP8 "));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData("song.exe")]
    [InlineData("song")]
    [InlineData("song.ogg")]
    public async Task Other_extensions_are_refused(string fileName)
    {
        var result = await Check(fileName, Wav);

        Assert.Equal("audio-type-not-allowed", result.Code);
    }

    [Theory]
    [InlineData(-14.0, -1.0, 44100, 24, true)]
    [InlineData(-9.0, -0.5, 48000, 16, true)]
    [InlineData(-30.0, -1.0, 44100, 24, false)]
    [InlineData(-14.0, 1.0, 44100, 24, false)]
    [InlineData(-14.0, -1.0, 22050, 24, false)]
    [InlineData(-14.0, -1.0, 44100, 32, false)]
    public void Options_outside_distributor_specs_are_refused(double lufs, double peak, int rate, int depth, bool ok)
    {
        var error = ReleaseUploadValidator.ValidateOptions(new ReleaseKitOptions
        {
            TargetLufs = lufs, TruePeakDb = peak, SampleRate = rate, BitDepth = depth
        });

        Assert.Equal(ok, error is null);
    }

    [Fact]
    public void Parses_the_loudnorm_report_out_of_ffmpeg_stderr()
    {
        const string stderr = """
            size=N/A time=00:03:12.00 bitrate=N/A speed= 210x
            [Parsed_loudnorm_0 @ 000001]
            {
            	"input_i" : "-19.42",
            	"input_tp" : "-0.31",
            	"input_lra" : "7.80",
            	"input_thresh" : "-29.61",
            	"output_i" : "-14.02",
            	"output_tp" : "-1.00",
            	"output_lra" : "6.90",
            	"output_thresh" : "-24.20",
            	"normalization_type" : "linear",
            	"target_offset" : "0.02"
            }
            """;

        var report = LoudnormReport.Parse(stderr);

        Assert.NotNull(report);
        Assert.Equal(-19.42, report.InputIntegrated, 2);
        Assert.Equal(-0.31, report.InputTruePeak, 2);
        Assert.Equal(7.8, report.InputLoudnessRange, 2);
        Assert.Equal("linear", report.NormalizationType);
    }

    [Fact]
    public void Silence_parses_as_negative_infinity_and_garbage_as_null()
    {
        var silent = LoudnormReport.Parse("{ \"input_i\" : \"-inf\", \"input_tp\" : \"-inf\" }");
        Assert.True(double.IsNegativeInfinity(silent!.InputIntegrated));

        Assert.Null(LoudnormReport.Parse("no report here"));
    }

    [Theory]
    [InlineData("Test Artist", "Song", "Test Artist - Song")]
    [InlineData("AC/DC", "What?", "AC_DC - What_")]
    [InlineData("..", "..", "-")]
    public void Archive_folder_names_are_safe_on_every_file_system(string artist, string title, string expected)
    {
        var name = FfmpegReleaseKitBuilder.ArchiveFolderName(new ReleaseMetadata { PrimaryArtist = artist, Title = title });

        Assert.Equal(expected, name);
    }
}
