using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Subtitles;

namespace AnimStudio.Application.Tests.Subtitles;

/// <summary>
/// libass looks a face up by family and draws a box for a glyph the face lacks, so text in Hindi, Arabic or Chinese needs
/// a family that has it. The stock Latin face is swapped for one that is installed; a face somebody chose is left alone.
/// </summary>
public sealed class AssSubtitleWriterFontTests
{
    private const string Nirmala = @"C:\Windows\Fonts\Nirmala.ttc";
    private const string Mangal = @"C:\Windows\Fonts\mangal.ttf";
    private const string NotoDevanagari = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf";

    private static DialogueLine Line(string text, int start = 0, int end = 60, string? characterId = null) =>
        new() { Text = text, RelativeStartFrame = start, RelativeEndFrame = end, SpeakerCharacterId = characterId };

    private static SubtitleRequest Request(string fontName, IReadOnlyList<DialogueLine> lines,
        IReadOnlyDictionary<string, SubtitleStyle>? styles = null) =>
        new(Canvas.Hd1080p30, lines, styles ?? new Dictionary<string, SubtitleStyle>(), fontName);

    private static AssSubtitleWriter Writer(params string[] installed) =>
        new(path => installed.Contains(path, StringComparer.OrdinalIgnoreCase));

    private static string StyleFont(string ass, string style = "Default") =>
        ass.Split('\n')
            .First(l => l.StartsWith($"Style: {style},", StringComparison.Ordinal))["Style: ".Length..]
            .Split(',')[1];

    [Fact]
    public void Hindi_subtitles_get_a_face_that_has_devanagari_when_the_stock_face_is_configured()
    {
        var ass = Writer(Nirmala).Write(Request(AssSubtitleWriter.StockFontName, [Line("भागवत पुराण के अनुसार")]));

        Assert.Equal("Nirmala UI", StyleFont(ass));
    }

    [Theory]
    [InlineData(new[] { Mangal }, "Mangal")]
    [InlineData(new[] { NotoDevanagari }, "Noto Sans Devanagari")]
    [InlineData(new[] { Mangal, Nirmala }, "Nirmala UI")]
    public void The_first_family_the_machine_has_wins(string[] installed, string expected)
    {
        var ass = Writer(installed).Write(Request(AssSubtitleWriter.StockFontName, [Line("दीपावली")]));

        Assert.Equal(expected, StyleFont(ass));
    }

    [Fact]
    public void With_no_face_for_the_script_installed_the_stock_face_stays_as_it_was()
    {
        var ass = Writer().Write(Request(AssSubtitleWriter.StockFontName, [Line("दीपावली")]));

        Assert.Equal(AssSubtitleWriter.StockFontName, StyleFont(ass));
    }

    [Fact]
    public void Latin_text_keeps_the_stock_face_even_where_a_devanagari_face_exists()
    {
        var ass = Writer(Nirmala).Write(Request(AssSubtitleWriter.StockFontName, [Line("Diwali is the festival of lights.")]));

        Assert.Equal(AssSubtitleWriter.StockFontName, StyleFont(ass));
    }

    [Theory]
    [InlineData("Comic Sans MS")]
    [InlineData("Nirmala UI")]
    [InlineData("Arial")]
    public void A_face_the_operator_chose_is_never_swapped(string chosen)
    {
        var ass = Writer(Nirmala).Write(Request(chosen, [Line("दीपावली")]));

        Assert.Equal(chosen, StyleFont(ass));
    }

    [Fact]
    public void One_hindi_line_among_english_ones_gives_the_whole_scene_the_face_so_the_look_is_one()
    {
        var ass = Writer(Nirmala).Write(Request(AssSubtitleWriter.StockFontName, [Line("OM Namah Shivaya", 0, 30), Line("दीपावली", 30, 60)]));

        Assert.Equal("Nirmala UI", StyleFont(ass));
    }

    [Fact]
    public void Each_characters_style_uses_the_same_face()
    {
        var styles = new Dictionary<string, SubtitleStyle> { ["rahul"] = new("Rahul", "#FFE164") };

        var ass = Writer(Nirmala).Write(Request(AssSubtitleWriter.StockFontName, [Line("दीपावली", 0, 60, "rahul")], styles));

        Assert.Equal("Nirmala UI", StyleFont(ass));
        Assert.Equal("Nirmala UI", StyleFont(ass, "Rahul"));
    }

    [Theory]
    [InlineData("مرحبا", @"C:\Windows\Fonts\segoeui.ttf", "Segoe UI")]
    [InlineData("สวัสดี", @"C:\Windows\Fonts\LeelawUI.ttf", "Leelawadee UI")]
    [InlineData("你好", @"C:\Windows\Fonts\msyh.ttc", "Microsoft YaHei")]
    [InlineData("வணக்கம்", Nirmala, "Nirmala UI")]
    public void Other_scripts_get_a_face_that_covers_them_too(string text, string installed, string expected)
    {
        var ass = Writer(installed).Write(Request(AssSubtitleWriter.StockFontName, [Line(text)]));

        Assert.Equal(expected, StyleFont(ass));
    }

    [Fact]
    public void The_stock_face_name_is_matched_without_regard_to_case()
    {
        var ass = Writer(Nirmala).Write(Request("dejavu sans", [Line("दीपावली")]));

        Assert.Equal("Nirmala UI", StyleFont(ass));
    }

    [Fact]
    public void A_writer_with_no_probe_asks_the_file_system_and_still_writes_a_valid_file()
    {
        var ass = new AssSubtitleWriter().Write(Request(AssSubtitleWriter.StockFontName, [Line("दीपावली")]));

        Assert.Contains("[V4+ Styles]", ass);
        Assert.Contains("Dialogue: 0,", ass);
        Assert.False(string.IsNullOrWhiteSpace(StyleFont(ass)));
    }
}
