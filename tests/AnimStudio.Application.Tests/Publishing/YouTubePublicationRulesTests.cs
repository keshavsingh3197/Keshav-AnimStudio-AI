using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Video ids and titles here are synthetic.</summary>
public class YouTubePublicationRulesTests
{
    [Theory]
    [InlineData("dQw4w9WgXcQ", true)]
    [InlineData("abc-_123XYZ", true)]
    [InlineData("short", false)]
    [InlineData("toolongvideoid", false)]
    [InlineData("bad/chars!!", false)]
    [InlineData(null, false)]
    public void Video_ids_are_eleven_url_safe_characters(string? id, bool valid) =>
        Assert.Equal(valid, YouTubeRelatedVideos.IsVideoId(id));

    [Fact]
    public void Related_block_is_appended_after_the_description()
    {
        var result = YouTubeRelatedVideos.AppendToDescription("About the badger.\n",
            [new("AAAAAAAAAAA", "Badger part 1"), new("BBBBBBBBBBB", "Badger part 2")]);

        Assert.Equal(
            "About the badger.\n\nRelated videos:\n▶ Badger part 1: https://youtu.be/AAAAAAAAAAA\n▶ Badger part 2: https://youtu.be/BBBBBBBBBBB",
            result);
    }

    [Fact]
    public void A_music_upload_also_links_to_the_same_video_on_YouTube_Music()
    {
        Assert.Equal("https://music.youtube.com/watch?v=AAAAAAAAAAA",
            YouTubeRelatedVideos.MusicUrlFor("AAAAAAAAAAA", YouTubeMusicMetadata.MusicCategoryId));
        Assert.Equal("https://youtu.be/AAAAAAAAAAA", YouTubeRelatedVideos.WatchUrl("AAAAAAAAAAA"));
    }

    [Theory]
    [InlineData("1")]
    [InlineData("24")]
    [InlineData(null)]
    public void Other_categories_get_no_YouTube_Music_link(string? categoryId) =>
        Assert.Null(YouTubeRelatedVideos.MusicUrlFor("AAAAAAAAAAA", categoryId));

    [Fact]
    public void No_related_videos_leaves_the_description_unchanged()
    {
        Assert.Equal("Just this.", YouTubeRelatedVideos.AppendToDescription("Just this.  ", []));
    }

    [Fact]
    public void Related_titles_cannot_break_the_line_or_add_angle_brackets()
    {
        var result = YouTubeRelatedVideos.AppendToDescription("", [new("AAAAAAAAAAA", "Line one\nLine <two>")]);

        Assert.Equal("Related videos:\n▶ Line one Line two: https://youtu.be/AAAAAAAAAAA", result);
    }

    [Fact]
    public void Missing_video_is_removed()
    {
        var verdict = YouTubeVideoHealthEvaluator.Evaluate(false, null, null, null, null);
        Assert.Equal(YouTubeVideoHealth.Removed, verdict.Health);
    }

    [Theory]
    [InlineData("processed", null, YouTubeVideoHealth.Ok)]
    [InlineData("uploaded", null, YouTubeVideoHealth.Processing)]
    [InlineData("uploaded", "processing", YouTubeVideoHealth.Processing)]
    [InlineData("deleted", null, YouTubeVideoHealth.Removed)]
    [InlineData("processed", "failed", YouTubeVideoHealth.Issue)]
    [InlineData(null, null, YouTubeVideoHealth.Unknown)]
    public void Upload_and_processing_status_map_to_health(string? upload, string? processing, YouTubeVideoHealth expected) =>
        Assert.Equal(expected, YouTubeVideoHealthEvaluator.Evaluate(true, upload, null, null, processing).Health);

    [Fact]
    public void Known_rejection_reason_gets_its_own_message()
    {
        var verdict = YouTubeVideoHealthEvaluator.Evaluate(true, "rejected", null, "copyright", null);

        Assert.Equal(YouTubeVideoHealth.Issue, verdict.Health);
        Assert.Equal("rejected-copyright", verdict.IssueCode);
        Assert.Contains("copyright", verdict.IssueMessage);
    }

    [Fact]
    public void Unknown_reasons_are_not_echoed_into_the_code()
    {
        var rejected = YouTubeVideoHealthEvaluator.Evaluate(true, "rejected", null, "somethingNew", null);
        var failed = YouTubeVideoHealthEvaluator.Evaluate(true, "failed", "somethingNew", null, null);

        Assert.Equal("rejected", rejected.IssueCode);
        Assert.Equal("failed", failed.IssueCode);
        Assert.Equal(YouTubeVideoHealth.Issue, failed.Health);
    }
}
