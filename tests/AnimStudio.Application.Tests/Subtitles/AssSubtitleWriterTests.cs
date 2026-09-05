using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Subtitles;

namespace AnimStudio.Application.Tests.Subtitles;

public class AssSubtitleWriterTests
{
    private static DialogueLine Line(
        string text, int startFrame, int endFrame, string? characterId = null, string? speaker = null) =>
        new()
        {
            Text = text,
            RelativeStartFrame = startFrame,
            RelativeEndFrame = endFrame,
            SpeakerCharacterId = characterId,
            SpeakerLabel = speaker
        };

    private static SubtitleRequest Request(
        IReadOnlyList<DialogueLine> lines,
        IReadOnlyDictionary<string, SubtitleStyle>? styles = null) =>
        new(Canvas.Hd1080p30, lines, styles ?? new Dictionary<string, SubtitleStyle>());

    private static readonly AssSubtitleWriter Writer = new();

    [Fact]
    public void Declares_the_canvas_size_so_libass_does_not_rescale_fonts()
    {
        var ass = Writer.Write(Request([Line("Hello.", 0, 60)]));

        Assert.Contains("PlayResX: 1920", ass);
        Assert.Contains("PlayResY: 1080", ass);
        Assert.Contains("ScaledBorderAndShadow: yes", ass);
    }

    [Fact]
    public void Writes_colours_as_inverted_alpha_bgr()
    {
        // #FFE164 -> &H0064E1FF : bytes reversed, alpha 00 meaning fully opaque.
        var styles = new Dictionary<string, SubtitleStyle>
        {
            ["rahul"] = new("Rahul", "#FFE164")
        };

        var ass = Writer.Write(Request([Line("Hi.", 0, 30, "rahul")], styles));

        Assert.Contains("&H0064E1FF", ass);
    }

    [Fact]
    public void Falls_back_to_white_for_a_missing_or_invalid_colour()
    {
        var styles = new Dictionary<string, SubtitleStyle>
        {
            ["a"] = new("A", null),
            ["b"] = new("B", "not-a-colour")
        };

        var ass = Writer.Write(Request([Line("Hi.", 0, 30, "a")], styles));

        Assert.Contains("Style: A,", ass);
        Assert.Contains("&H00FFFFFF", ass);
    }

    [Theory]
    [InlineData(0, "0:00:00.00")]
    [InlineData(45, "0:00:01.50")]      // 45 frames at 30fps = 1.5s
    [InlineData(108_000, "1:00:00.00")] // one hour
    public void Writes_timecodes_in_centiseconds(int frames, string expected)
    {
        var ass = Writer.Write(Request([Line("X.", frames, frames + 30)]));

        Assert.Contains($"Dialogue: 0,{expected},", ass);
    }

    [Fact]
    public void Neutralizes_override_blocks_in_dialogue_text()
    {
        // "{\p1}" would turn the text into vector drawing commands and "{\pos(0,0)}"
        // would reposition it. Untrusted transcript text must not be able to do either.
        var ass = Writer.Write(Request([Line(@"{\p1}m 0 0 l 100 0 {\pos(0,0)}Hello", 0, 30)]));

        Assert.DoesNotContain("{", ass);
        Assert.DoesNotContain("}", ass);
        Assert.Contains("Hello", ass);
    }

    [Fact]
    public void Converts_newlines_to_the_ass_hard_break()
    {
        var ass = Writer.Write(Request([Line("first\r\nsecond", 0, 30)]));

        Assert.Contains(@"first\Nsecond", ass);
        // A raw newline inside an event would end the record early.
        Assert.DoesNotContain("first\nsecond", ass);
    }

    [Fact]
    public void Keeps_commas_in_dialogue_because_text_is_the_final_field()
    {
        var ass = Writer.Write(Request([Line("Hey Priya, look at this!", 0, 30)]));

        Assert.Contains("Hey Priya, look at this!", ass);
    }

    [Fact]
    public void Emits_one_style_row_per_speaking_character()
    {
        var styles = new Dictionary<string, SubtitleStyle>
        {
            ["rahul"] = new("Rahul", "#FFE164"),
            ["priya"] = new("Priya", "#9EFFB4")
        };

        var ass = Writer.Write(Request(
            [Line("A.", 0, 30, "rahul"), Line("B.", 30, 60, "priya")], styles));

        Assert.Contains("Style: Default,", ass);
        Assert.Contains("Style: Rahul,", ass);
        Assert.Contains("Style: Priya,", ass);
        Assert.Contains(",Rahul,", ass);
        Assert.Contains(",Priya,", ass);
    }

    [Fact]
    public void Uses_the_default_style_for_an_unknown_speaker()
    {
        var ass = Writer.Write(Request([Line("Who said this?", 0, 30, "ghost")]));

        Assert.Contains(",Default,", ass);
    }

    [Fact]
    public void Writes_bold_as_minus_one()
    {
        // ASS uses -1 for on, not 1.
        var styles = new Dictionary<string, SubtitleStyle> { ["a"] = new("A", "#FFFFFF", Bold: true) };

        var ass = Writer.Write(Request([Line("X.", 0, 30, "a")], styles));

        var row = ass.Split('\n').First(l => l.StartsWith("Style: A,"));
        Assert.Contains(",-1,", row);
    }

    [Fact]
    public void Orders_events_by_start_time()
    {
        var ass = Writer.Write(Request(
            [Line("second", 60, 90), Line("first", 0, 30)]));

        Assert.True(ass.IndexOf("first", StringComparison.Ordinal)
                    < ass.IndexOf("second", StringComparison.Ordinal));
    }

    [Fact]
    public void Skips_lines_that_sanitize_to_nothing()
    {
        var ass = Writer.Write(Request([Line("{}", 0, 30), Line("real", 30, 60)]));

        var events = ass.Split('\n').Count(l => l.StartsWith("Dialogue:"));
        Assert.Equal(1, events);
    }

    [Fact]
    public void Truncates_an_absurdly_long_line()
    {
        var ass = Writer.Write(Request([Line(new string('x', 900), 0, 30)]));

        var row = ass.Split('\n').First(l => l.StartsWith("Dialogue:"));
        Assert.True(row.Length < 500, $"line was {row.Length} characters");
        Assert.EndsWith("…", row);
    }
}
