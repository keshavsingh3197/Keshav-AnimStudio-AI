using AnimStudio.Application.Transcripts.Parsing;

namespace AnimStudio.Application.Tests.Transcripts;

public class TimecodeParserTests
{
    [Theory]
    [InlineData("00:00:01.500", 0, 0, 1, 500)]
    [InlineData("01:02:03.004", 1, 2, 3, 4)]
    [InlineData("00:00:01,250", 0, 0, 1, 250)]   // SubRip comma separator
    [InlineData("02:03.100", 0, 2, 3, 100)]      // hours omitted, as real .vtt files do
    [InlineData("100:00:00.000", 100, 0, 0, 0)]  // hours may exceed 99
    [InlineData("00:00:05", 0, 0, 5, 0)]         // no fractional part
    public void Parses_supported_shapes(string input, int h, int m, int s, int ms)
    {
        Assert.True(TimecodeParser.TryParse(input, out var actual));
        Assert.Equal(new TimeSpan(0, h, m, s, ms), actual);
    }

    [Theory]
    [InlineData("00:00:01.5", 500)]    // one digit  -> 500ms, NOT 5ms
    [InlineData("00:00:01.05", 50)]    // two digits -> 50ms
    [InlineData("00:00:01.005", 5)]
    public void Right_pads_fractional_seconds(string input, int expectedMs)
    {
        Assert.True(TimecodeParser.TryParse(input, out var actual));
        Assert.Equal(expectedMs, actual.Milliseconds);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not a time")]
    [InlineData("00:99:00.000")]   // minutes out of range
    [InlineData("00:00:99.000")]   // seconds out of range
    public void Rejects_malformed_input(string input) =>
        Assert.False(TimecodeParser.TryParse(input, out _));

    [Fact]
    public void Ignores_webvtt_cue_settings_after_the_end_time()
    {
        // Auto-generated captions always append these; the end time is only the first token.
        Assert.True(TimecodeParser.TryParseCueLine(
            "00:00:01.000 --> 00:00:04.000 align:start position:0%", out var start, out var end));
        Assert.Equal(TimeSpan.FromSeconds(1), start);
        Assert.Equal(TimeSpan.FromSeconds(4), end);
    }
}
