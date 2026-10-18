using AnimStudio.Application.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public class YouTubeDetailsAuditTests
{
    private static YouTubeDetailsFacts Complete() => new(
        "Jay ho Kathu Shyam ji Maharaj",
        "Morning darshan of Khatu Shyam ji with bhajan. Watch till the end for the aarti. #khatushyam #bhajan #shorts",
        ["khatu shyam", "bhajan"],
        InPlaylist: true,
        MadeForKids: false,
        IsShort: true);

    private static IEnumerable<string> Codes(YouTubeDetailsFacts facts) => YouTubeDetailsAudit.Check(facts).Select(i => i.Code);

    [Fact]
    public void A_complete_video_has_nothing_to_fix() => Assert.Empty(YouTubeDetailsAudit.Check(Complete()));

    [Fact]
    public void An_empty_description_also_means_no_hashtags()
    {
        var codes = Codes(Complete() with { Description = "  " });
        Assert.Contains("description-missing", codes);
        Assert.Contains("hashtags-missing", codes);
    }

    [Fact]
    public void A_one_line_description_is_flagged_as_short() =>
        Assert.Contains("description-short", Codes(Complete() with { Description = "Jai Shri Shyam #shorts" }));

    [Fact]
    public void Missing_tags_playlist_and_audience_are_each_reported()
    {
        var codes = Codes(Complete() with { Tags = [], InPlaylist = false, MadeForKids = null });
        Assert.Contains("tags-missing", codes);
        Assert.Contains("playlist-missing", codes);
        Assert.Contains("audience-unset", codes);
    }

    [Fact]
    public void Unknown_playlist_membership_gives_no_verdict() =>
        Assert.DoesNotContain("playlist-missing", Codes(Complete() with { InPlaylist = null }));

    [Fact]
    public void A_hashtag_in_the_title_counts() =>
        Assert.DoesNotContain("hashtags-missing", Codes(Complete() with { Title = "Jay ho #omkr", Description = new string('x', 100) }));

    [Theory]
    [InlineData("AnimStudio video")]
    [InlineData("KATHU SHYAM short 1.mp4")]
    [InlineData("VID_20261017_123456")]
    [InlineData("Short 1")]
    [InlineData("")]
    public void A_file_name_title_is_flagged(string title) => Assert.True(YouTubeDetailsAudit.LooksLikeFileName(title));

    [Theory]
    [InlineData("jay ho kathu syam ji Maharaj #omkr")]
    [InlineData("Short story of Shyam baba")]
    public void A_real_title_is_not_flagged(string title) => Assert.False(YouTubeDetailsAudit.LooksLikeFileName(title));
}
