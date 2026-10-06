using AnimStudio.Application.Clips;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// The "support us" end card: its layout, its settings hygiene, and how it joins an export.
/// </summary>
public class EndCardTests
{
    private static OutroSettings Card() => new()
    {
        Kind = OutroKind.Card,
        QrAssetId = "qr",
        Headline = "Support us for more videos like this",
        Subtext = "Scan the QR code"
    };

    private static EndCardFactory.LineInput Line(string text, bool above, bool secondary = false) =>
        new(text, $"wm/{text.GetHashCode():x}.txt", "font.ttf", above, secondary);

    private static readonly EndCardFactory.LineInput[] EnglishLines =
    [
        Line("Support us for more videos like this", above: true),
        Line("Scan the QR code", above: false)
    ];

    [Fact]
    public void Centres_headline_code_and_subtext_as_one_block()
    {
        var plan = EndCardFactory.Layout(Card(), Canvas.Hd1080p30, "in/qr.png", EnglishLines);
        var (headline, subtext) = (plan.Lines[0], plan.Lines[1]);

        Assert.Equal(496, plan.BoxSize);                       // 46% of the short side, even
        Assert.Equal((1920 - 496) / 2, plan.BoxX);
        Assert.True(plan.QrSize < plan.BoxSize);              // the quiet zone stays white
        Assert.True(headline.Y < plan.BoxY && plan.BoxY + plan.BoxSize < subtext.Y);

        var bottom = 1080 - (subtext.Y + subtext.FontPixels);
        Assert.InRange(headline.Y - bottom, -1, 1);
    }

    [Fact]
    public void A_second_language_line_sits_tight_under_its_partner_smaller_and_softer()
    {
        var plan = EndCardFactory.Layout(Card(), Canvas.Hd1080p30, "in/qr.png",
        [
            Line("Support us for more videos like this", above: true),
            Line("इस तरह के और वीडियो के लिए हमारा समर्थन करें", above: true, secondary: true),
            Line("Scan the QR code", above: false),
            Line("QR कोड स्कैन करें", above: false, secondary: true)
        ]);

        var (en, hi, enSub, hiSub) = (plan.Lines[0], plan.Lines[1], plan.Lines[2], plan.Lines[3]);

        Assert.True(hi.FontPixels < en.FontPixels && hiSub.FontPixels < enSub.FontPixels);
        Assert.Equal(0.85, hi.Opacity);
        Assert.Equal(1.0, en.Opacity);

        // The pair gap is far tighter than the gap between the pair and the code.
        Assert.True(hi.Y - (en.Y + en.FontPixels) < plan.BoxY - (hi.Y + hi.FontPixels));
        Assert.True(hi.Y + hi.FontPixels < plan.BoxY && plan.BoxY + plan.BoxSize < enSub.Y && enSub.Y < hiSub.Y);
    }

    [Fact]
    public void A_portrait_card_gives_the_code_more_of_the_width()
    {
        var landscape = EndCardFactory.Layout(Card(), Canvas.Hd1080p30, "in/qr.png", []);
        var portrait = EndCardFactory.Layout(Card(), Canvas.Vertical1080x1920, "in/qr.png", []);

        Assert.True(portrait.BoxSize > landscape.BoxSize);
        Assert.True(portrait.BoxSize < 1080);
    }

    [Fact]
    public void Shrinks_a_long_line_until_it_fits_the_width()
    {
        var plan = EndCardFactory.Layout(Card(), Canvas.Vertical1080x1920, "in/qr.png",
            [Line(new string('W', 80), above: true)]);

        Assert.True(plan.Lines[0].FontPixels * 0.55 * 80 <= 1080 * 0.9 + 1);
    }

    [Fact]
    public void Text_only_card_has_no_white_square()
    {
        var plan = EndCardFactory.Layout(Card(), Canvas.Hd1080p30, null, EnglishLines);

        Assert.Equal(0, plan.BoxSize);
        Assert.Null(plan.QrRelativePath);
    }

    [Fact]
    public void Clamp_keeps_card_text_to_one_printable_line_and_colours_to_hex()
    {
        var card = Card();
        card.Headline = "Support\nus\t now" + new string('!', 200);
        card.BackgroundHex = "red; drawtext";
        card.TextHex = "#abcdef";

        card.Clamp();

        Assert.StartsWith("Support us now", card.Headline);
        Assert.Equal(OutroSettings.MaxHeadlineLength, card.Headline!.Length);
        Assert.Equal("#101828", card.BackgroundHex);
        Assert.Equal("#ABCDEF", card.TextHex);
    }

    [Fact]
    public void A_card_never_turns_a_stream_copy_export_into_a_re_encode()
    {
        var card = Card();
        card.Transition = SceneTransition.Fade;
        var bumper = new OutroSettings { Kind = OutroKind.Video, AssetId = "v", Transition = SceneTransition.Fade };

        Assert.False(OutroPlanFactory.Crossfades(card));
        Assert.True(OutroPlanFactory.Crossfades(bumper));
        Assert.Equal("qr", OutroPlanFactory.AssetIdFor(card));
        Assert.Equal("v", OutroPlanFactory.AssetIdFor(bumper));
    }

    [Fact]
    public void Draws_a_card_from_a_colour_source_with_a_silent_track()
    {
        var plan = new AnimStudio.Application.Rendering.Models.ClipRenderPlan
        {
            ClipIndex = 3,
            SourceRelativePath = "in/qr.png",
            Canvas = Canvas.Hd1080p30,
            OutputRelativePath = "clips/clip_outro.mp4",
            ExpectedFrames = new FrameCount(150),
            SourceIsImage = true,
            ImageDurationSeconds = 5,
            SourceHasAudio = false,
            EndCard = EndCardFactory.Layout(Card(), Canvas.Hd1080p30, "in/qr.png", EnglishLines)
                with { FadeInSeconds = 0.5 }
        };

        var built = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildClip(plan);

        Assert.StartsWith("color=c=0x101828:s=1920x1080", built.Inputs[0].RelativePath);
        Assert.Contains("flags=neighbor", built.FilterComplex);
        Assert.Contains("drawbox=", built.FilterComplex);
        Assert.Contains("fade=t=in:st=0:d=0.5", built.FilterComplex);
        Assert.Contains(built.Inputs, i => i.RelativePath.StartsWith("anullsrc"));
        Assert.Contains("-shortest", built.OutputArguments);
    }

    [Fact]
    public void The_export_timeline_lists_the_end_card_after_the_last_clip()
    {
        var spec = new ClipMergeSpec { AssetIds = ["a"], Outro = Card() };

        var timeline = ExportTimelineBuilder.Build(spec, _ => null, new ExportTimelineFacts(
            [new FrameCount(300), new FrameCount(150)], [FrameCount.Zero], [SceneTransition.None],
            [0], FrameRate.Fps30, new FrameCount(450)));

        var card = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.EndCard);
        Assert.Equal((10.0, 15.0), (card.StartSeconds, card.EndSeconds));
        Assert.Equal("Support us for more videos like this", card.Label);
    }
}
