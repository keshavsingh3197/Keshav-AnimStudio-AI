using AnimStudio.Application.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>All titles, tags and channels here are synthetic.</summary>
public class YouTubePublishValidatorTests
{
    private static readonly YouTubeVideoFacts Landscape = new(true, true, 50_000_000, 125, 1920, 1080);

    private static YouTubeVideoMetadata Valid() => new()
    {
        Title = "Test Badger: From Cradle to Chaos",
        Description = "A synthetic description.\nSecond line.",
        Tags = ["Wildlife", "#AnimalFacts", "nature comedy"],
        CategoryId = "15",
        Privacy = "Public",
        MadeForKids = false
    };

    [Fact]
    public void Accepts_complete_metadata_and_normalizes_it()
    {
        var result = YouTubePublishValidator.Validate(Valid(), Landscape);

        Assert.True(result.IsValid);
        Assert.Empty(result.Warnings);
        Assert.Equal("public", result.Normalized!.Privacy);
        Assert.Equal(["Wildlife", "AnimalFacts", "nature comedy"], result.Normalized.Tags);
        Assert.Contains('\n', result.Normalized.Description);
    }

    [Fact]
    public void Refuses_a_title_over_100_characters()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Title = new string('a', 101) }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "title-too-long" && e.Field == "title");
    }

    [Fact]
    public void Refuses_a_missing_title()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Title = "   " }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "title-missing");
    }

    [Theory]
    [InlineData("<script>")]
    [InlineData("a > b")]
    public void Refuses_angle_brackets_in_the_title(string title)
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Title = title }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "title-invalid-character");
    }

    [Fact]
    public void Counts_the_description_in_bytes_not_characters()
    {
        // 2,000 Devanagari letters are 6,000 UTF-8 bytes: within 5,000 characters, over 5,000 bytes.
        var result = YouTubePublishValidator.Validate(Valid() with { Description = new string('क', 2000) }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "description-too-long");
    }

    [Fact]
    public void Counts_tags_the_way_youtube_does()
    {
        // 3 + (5 + 2 quotes) + 1 comma
        Assert.Equal(11,YouTubePublishValidator.TagsLength(["abc", "de fg"]));
    }

    [Fact]
    public void Refuses_tags_over_500_characters_in_total()
    {
        var tags = Enumerable.Range(0, 30).Select(i => $"tag{i:D2}-{new string('x', 14)}").ToList();
        var result = YouTubePublishValidator.Validate(Valid() with { Tags = tags }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "tags-too-long");
    }

    [Fact]
    public void Drops_duplicate_and_empty_tags()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Tags = ["Nature", "nature", " ", "#Nature"] }, Landscape);

        Assert.Equal(["Nature"], result.Normalized!.Tags);
    }

    [Fact]
    public void Refuses_a_comma_inside_a_tag()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Tags = ["a,b"] }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "tag-invalid-character");
    }

    [Theory]
    [InlineData("99")]
    [InlineData("")]
    [InlineData("1; DROP")]
    public void Refuses_a_category_that_is_not_assignable(string categoryId)
    {
        var result = YouTubePublishValidator.Validate(Valid() with { CategoryId = categoryId }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "category-invalid");
    }

    [Fact]
    public void Refuses_an_unknown_visibility()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { Privacy = "friends" }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "privacy-invalid");
    }

    [Fact]
    public void Requires_an_answer_on_made_for_kids()
    {
        var result = YouTubePublishValidator.Validate(Valid() with { MadeForKids = null }, Landscape);

        Assert.Contains(result.Errors, e => e.Code == "audience-missing");
    }

    [Fact]
    public void Refuses_a_render_that_has_not_finished()
    {
        var result = YouTubePublishValidator.Validate(Valid(), Landscape with { IsCompleted = false });

        Assert.Contains(result.Errors, e => e.Code == "video-not-ready");
    }

    [Fact]
    public void Refuses_a_video_over_12_hours()
    {
        var result = YouTubePublishValidator.Validate(Valid(), Landscape with { DurationSeconds = 12 * 3600 + 1 });

        Assert.Contains(result.Errors, e => e.Code == "video-too-long");
    }

    [Fact]
    public void Warns_when_a_video_needs_a_verified_channel()
    {
        var result = YouTubePublishValidator.Validate(Valid(), Landscape with { DurationSeconds = 16 * 60 });

        Assert.True(result.IsValid);
        Assert.Contains(result.Warnings, w => w.Code == "video-needs-verified-account");
    }

    [Fact]
    public void Warns_when_a_vertical_video_is_too_long_to_be_a_short()
    {
        var vertical = new YouTubeVideoFacts(true, true, 10_000_000, 200, 1080, 1920);
        var result = YouTubePublishValidator.Validate(Valid(), vertical);

        Assert.True(result.IsValid);
        Assert.Contains(result.Warnings, w => w.Code == "short-too-long");
    }

    [Fact]
    public void A_short_vertical_video_has_no_warnings()
    {
        var vertical = new YouTubeVideoFacts(true, true, 10_000_000, 45, 1080, 1920);

        Assert.Empty(YouTubePublishValidator.Validate(Valid(), vertical).Warnings);
    }
}
