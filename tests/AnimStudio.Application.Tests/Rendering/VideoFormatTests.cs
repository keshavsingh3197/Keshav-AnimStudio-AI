using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// What a canvas's shape says the finished file is for.
/// <para>
/// Worth asserting despite being three comparisons, because this one rule names the
/// project in the list, tags the Video editor and the Render screen, and chooses the
/// downloaded file's name - so "upright means Short" has to mean the same thing in all
/// four places, and the frontend holds its own copy of it.
/// </para>
/// </summary>
public class VideoFormatTests
{
    [Theory]
    // Landscape: the ordinary YouTube shape.
    [InlineData(1920, 1080, VideoFormat.Video)]
    [InlineData(1280, 720, VideoFormat.Video)]
    // Upright: what Shorts, Reels and TikTok expect.
    [InlineData(1080, 1920, VideoFormat.Short)]
    [InlineData(720, 1280, VideoFormat.Short)]
    // Barely upright is still upright. There is no "nearly square" band, because a
    // threshold nobody can see is worse than a rule everybody can predict.
    [InlineData(1080, 1082, VideoFormat.Short)]
    [InlineData(1080, 1080, VideoFormat.Square)]
    public void Reads_the_format_off_the_shape(int width, int height, VideoFormat expected)
    {
        Assert.Equal(expected, Canvas.Describe(width, height));
        Assert.Equal(expected, new Canvas(width, height, FrameRate.Fps30).Format);
    }

    [Fact]
    public void Names_the_shipped_presets_the_way_the_screens_do()
    {
        // The four presets the UI offers, so a relabelled preset cannot quietly start
        // producing a different tag from the one it promises.
        Assert.Equal(VideoFormat.Video, Canvas.Hd1080p30.Format);
        Assert.Equal(VideoFormat.Video, Canvas.Hd720p30.Format);
        Assert.Equal(VideoFormat.Short, Canvas.Vertical1080x1920.Format);
        Assert.Equal(VideoFormat.Square, Canvas.Square1080.Format);
    }

    [Fact]
    public void Swapping_a_canvas_swaps_the_format()
    {
        // The Video editor's "Make it a Short" swaps width and height rather than setting
        // a fixed pair, so a 720p or 4K project keeps its resolution.
        var landscape = new Canvas(3840, 2160, FrameRate.Fps30);
        var upright = new Canvas(landscape.Height, landscape.Width, landscape.FrameRate);

        Assert.Equal(VideoFormat.Video, landscape.Format);
        Assert.Equal(VideoFormat.Short, upright.Format);
        Assert.Equal("2160x3840", upright.Size);
    }
}
