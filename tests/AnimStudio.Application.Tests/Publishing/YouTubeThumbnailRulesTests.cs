using AnimStudio.Application.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public class YouTubeThumbnailRulesTests
{
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0];

    [Fact]
    public void No_choice_leaves_YouTube_to_pick()
    {
        Assert.Equal(YouTubeThumbnailSource.None, YouTubeThumbnailRules.Check(null, 10).Source);
        var (source, _, image, error) = YouTubeThumbnailRules.Check(new YouTubeThumbnailChoice(null, "  "), 10);
        Assert.Equal(YouTubeThumbnailSource.None, source);
        Assert.Null(image);
        Assert.Null(error);
    }

    [Fact]
    public void A_frame_past_the_end_is_pulled_inside_the_video()
    {
        var (source, at, _, error) = YouTubeThumbnailRules.Check(new YouTubeThumbnailChoice(99, null), 18);
        Assert.Null(error);
        Assert.Equal(YouTubeThumbnailSource.Frame, source);
        Assert.Equal(17.9, at, 3);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public void A_frame_outside_the_video_is_refused(double at)
    {
        var (_, _, _, error) = YouTubeThumbnailRules.Check(new YouTubeThumbnailChoice(at, null), 18);
        Assert.Equal("thumbnail-frame-invalid", error?.Code);
        Assert.Equal("thumbnail", error?.Field);
    }

    [Fact]
    public void A_frame_and_a_picture_together_are_refused()
    {
        var (_, _, _, error) = YouTubeThumbnailRules.Check(new YouTubeThumbnailChoice(2, Convert.ToBase64String(Jpeg)), 18);
        Assert.Equal("thumbnail-ambiguous", error?.Code);
    }

    [Fact]
    public void A_data_url_from_the_browser_decodes()
    {
        var (source, _, image, error) = YouTubeThumbnailRules.Check(
            new YouTubeThumbnailChoice(null, "data:image/png;base64," + Convert.ToBase64String(Png)), null);
        Assert.Null(error);
        Assert.Equal(YouTubeThumbnailSource.Image, source);
        Assert.Equal(Png, image);
    }

    [Fact]
    public void Plain_base64_jpeg_decodes()
    {
        var (image, error) = YouTubeThumbnailRules.DecodeImage(Convert.ToBase64String(Jpeg));
        Assert.Null(error);
        Assert.Equal(Jpeg, image);
    }

    [Fact]
    public void Only_jpeg_and_png_bytes_are_accepted_whatever_the_declared_type()
    {
        var gif = "GIF89a"u8.ToArray();
        var (_, error) = YouTubeThumbnailRules.DecodeImage("data:image/png;base64," + Convert.ToBase64String(gif));
        Assert.Equal("thumbnail-wrong-type", error?.Code);
    }

    [Theory]
    [InlineData("not base64!!")]
    [InlineData("data:image/png,raw")]
    [InlineData("")]
    public void Unreadable_pictures_are_refused(string input)
    {
        var (image, error) = YouTubeThumbnailRules.DecodeImage(input);
        Assert.Null(image);
        Assert.Equal("thumbnail-unreadable", error?.Code);
    }

    [Fact]
    public void An_oversized_picture_is_refused_before_decoding()
    {
        var huge = new string('A', (YouTubeThumbnailRules.MaxUploadBytes / 3 + 10) * 4);
        var (_, error) = YouTubeThumbnailRules.DecodeImage(huge);
        Assert.Equal("thumbnail-too-large", error?.Code);
    }

    [Fact]
    public void An_unverified_channel_gets_told_how_to_finish()
    {
        Assert.Contains("verified", YouTubeThumbnailRules.RefusedMessage("forbidden"));
        Assert.Contains("YouTube Studio", YouTubeThumbnailRules.RefusedMessage(null));
    }
}
