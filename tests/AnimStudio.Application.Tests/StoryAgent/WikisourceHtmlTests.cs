using AnimStudio.Infrastructure.StoryAgent;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class WikisourceHtmlTests
{
    [Fact]
    public void Verses_stay_on_their_own_lines()
    {
        const string html = """
            <div class="mw-content-ltr mw-parser-output" lang="sa" dir="ltr">
            <div class="poem">
            <p>अथाष्टमोऽध्यायः<br />
            श्रीशुक उवाच।<br />
            पीते गरे वृषाङ्केण प्रीतास्तेऽमरदानवाः।<br />
            ममन्थुस्तरसा सिन्धुं हविर्धानी ततोऽभवत् १।<br />
            </p>
            </div></div>
            """;

        var lines = WikisourceHtml.ToText(html).Split('\n');

        Assert.Equal(
            new[] { "अथाष्टमोऽध्यायः", "श्रीशुक उवाच।", "पीते गरे वृषाङ्केण प्रीतास्तेऽमरदानवाः।", "ममन्थुस्तरसा सिन्धुं हविर्धानी ततोऽभवत् १।" },
            lines);
    }

    [Fact]
    public void Collapsed_commentary_and_navigation_boxes_are_left_out_with_everything_inside_them()
    {
        const string html = """
            <div class="mw-content-ltr mw-parser-output">
            <table class="toccolours" style="float: right;"><tbody><tr><th>भगवद्गीतायाः अध्यायाः</th></tr>
            <tr><td><ol><li><a href="/wiki/x" title="a>b">अर्जुनविषादयोगः</a></li></ol></td></tr></tbody></table>
            <div class="poem"><p>अर्जुन उवाच<br />
            ज्यायसी चेत्कर्मणस्ते मता बुद्धिर्जनार्दन ।<br /></p></div>
            <div class="nocolours mw-collapsible mw-collapsed"><div class="mw-collapsible-content">
            <div class="poem"><p>भाष्यम् जगद्धितार्थम्</p></div><div><div>deeper</div></div></div></div>
            <div class="poem"><p>ॐ तत्सदिति श्रीमद्भगवद्गीतासूपनिषत्सु</p></div></div>
            """;

        var text = WikisourceHtml.ToText(html);

        Assert.Contains("ज्यायसी चेत्कर्मणस्ते मता बुद्धिर्जनार्दन ।", text);
        Assert.Contains("ॐ तत्सदिति", text);
        Assert.DoesNotContain("भगवद्गीतायाः अध्यायाः", text);
        Assert.DoesNotContain("अर्जुनविषादयोगः", text);
        Assert.DoesNotContain("भाष्यम्", text);
        Assert.DoesNotContain("deeper", text);
    }

    [Fact]
    public void Pictures_footnote_marks_scripts_and_comments_are_left_out()
    {
        const string html = """
            <div><figure><a href="x"><img src="y.jpg" /></a><figcaption>श्वेत-कृष्ण अश्वाभ्यां</figcaption></figure>
            <!-- NewPP limit report <b>hidden</b> -->
            <script>var secret = 1 < 2;</script><style>.x { color: red }</style>
            <p>तत्र सत्यं<sup class="reference"><a href="#n1">[1]</a></sup> वदति</p></div>
            """;

        var text = WikisourceHtml.ToText(html);

        Assert.Equal("तत्र सत्यं वदति", text);
    }

    [Fact]
    public void Entities_are_decoded_and_runs_of_whitespace_become_one_space()
    {
        var text = WikisourceHtml.ToText("<p>राम&nbsp;&nbsp;  कृष्ण &amp; हरि\n\t सीता</p>");

        Assert.Equal("राम कृष्ण & हरि सीता", text);
    }

    [Fact]
    public void A_stray_less_than_and_a_misnested_tag_do_not_swallow_or_break_the_page()
    {
        var text = WikisourceHtml.ToText("<div><p>one < two</p><b><i>kept</b> also kept</i></div><p>last");

        Assert.Contains("one < two", text);
        Assert.Contains("kept", text);
        Assert.Contains("also kept", text);
        Assert.EndsWith("last", text);
    }

    [Fact]
    public void A_class_has_to_match_a_whole_word_to_be_skipped()
    {
        var text = WikisourceHtml.ToText(
            "<div class='not-mw-collapsible'>kept one</div><div class='x mw-collapsible y'>dropped</div><div class=\"mw-collapsible-content\">kept two</div>");

        Assert.Contains("kept one", text);
        Assert.Contains("kept two", text);
        Assert.DoesNotContain("dropped", text);
    }

    [Fact]
    public void Blank_runs_collapse_and_empty_input_is_empty()
    {
        Assert.Equal("a\n\nb", WikisourceHtml.ToText("<p>a</p><p></p><p></p><p></p><p>b</p>"));
        Assert.Equal(string.Empty, WikisourceHtml.ToText(null));
        Assert.Equal(string.Empty, WikisourceHtml.ToText("   "));
    }

    [Fact]
    public void Truncate_cuts_at_the_end_of_a_line_and_marks_the_cut()
    {
        var text = string.Join('\n', Enumerable.Range(1, 40).Select(i => $"line {i:00} of the verses"));

        var cut = WikisourceHtml.Truncate(text, 200);

        Assert.True(cut.Length <= 205);
        Assert.EndsWith("\n...", cut);
        Assert.DoesNotContain("line 40", cut);

        var lastWhole = cut[..^4].Split('\n')[^1];
        Assert.Matches(@"^line \d\d of the verses$", lastWhole);

        Assert.Equal("short", WikisourceHtml.Truncate("short", 200));
    }
}
