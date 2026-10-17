using System.Text;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Releases;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>All artists, songs and labels here are synthetic.</summary>
public class YouTubeMusicMetadataTests
{
    private static ReleaseMetadata Song() => new()
    {
        Title = "Test Monsoon",
        PrimaryArtist = "Sample Artist",
        FeaturedArtists = ["Guest One"],
        Songwriters = ["Writer A", "Writer B"],
        Producers = ["Producer C"],
        Genre = "Pop",
        SecondaryGenre = "Indie",
        ReleaseDate = new DateOnly(2026, 11, 1),
        RecordLabel = "Example Records",
        RecordingCopyright = "2026 Example Records",
        CompositionCopyright = "2026 Writer A",
        Isrc = "QZ-ABC-26-00001",
        Lyrics = "Line one\nLine two",
        RightsConfirmed = true
    };

    private static YouTubeVideoFacts Visualizer => new(true, true, 80_000_000, 200, 1920, 1080);

    [Fact]
    public void Composes_details_that_pass_the_publish_validator_as_music()
    {
        var draft = YouTubeMusicMetadata.Compose(Song());

        var result = YouTubePublishValidator.Validate(new YouTubeVideoMetadata
        {
            Title = draft.Title,
            Description = draft.Description,
            Tags = draft.Tags,
            CategoryId = YouTubeMusicMetadata.MusicCategoryId,
            Privacy = "public",
            MadeForKids = false
        }, Visualizer);

        Assert.True(result.IsValid);
        Assert.Equal("10", result.Normalized!.CategoryId);
        Assert.Equal("Music", YouTubePublishValidator.Categories[result.Normalized.CategoryId]);
    }

    [Fact]
    public void Title_follows_artist_dash_song_with_featured_version_and_label()
    {
        var title = YouTubeMusicMetadata.Title(Song() with { VersionTitle = "Acoustic" });

        Assert.Equal("Sample Artist - Test Monsoon (feat. Guest One) [Acoustic] (Official Visualizer)", title);
    }

    [Fact]
    public void Long_title_drops_suffixes_before_cutting_the_song_name()
    {
        var song = Song() with { Title = new string('a', 80), FeaturedArtists = ["Guest With A Long Name"] };

        var title = YouTubeMusicMetadata.Title(song);

        Assert.True(title.Length <= YouTubePublishValidator.MaxTitleLength);
        Assert.Equal($"Sample Artist - {new string('a', 80)}", title);
    }

    [Fact]
    public void Description_carries_credits_copyright_lines_and_lyrics()
    {
        var description = YouTubeMusicMetadata.Description(Song());

        Assert.StartsWith("\"Test Monsoon\" by Sample Artist feat. Guest One", description);
        Assert.Contains("Released 1 November 2026", description);
        Assert.Contains("Written by: Writer A, Writer B", description);
        Assert.Contains("Produced by: Producer C", description);
        Assert.Contains("Genre: Pop / Indie", description);
        Assert.Contains("℗ 2026 Example Records", description);
        Assert.Contains("© 2026 Writer A", description);
        Assert.Contains("ISRC: QZ-ABC-26-00001", description);
        Assert.EndsWith("Lyrics\nLine one\nLine two", description);
    }

    [Fact]
    public void Lyrics_that_would_overflow_the_description_are_left_out()
    {
        var description = YouTubeMusicMetadata.Description(Song() with { Lyrics = new string('ह', 3000) });

        Assert.DoesNotContain("Lyrics", description);
        Assert.True(Encoding.UTF8.GetByteCount(description) <= YouTubePublishValidator.MaxDescriptionBytes);
    }

    [Fact]
    public void Instrumental_has_no_lyrics_section()
    {
        var description = YouTubeMusicMetadata.Description(Song() with { Instrumental = true });

        Assert.DoesNotContain("Lyrics", description);
    }

    [Fact]
    public void Angle_brackets_commas_and_quotes_never_reach_youtube()
    {
        var draft = YouTubeMusicMetadata.Compose(Song() with { PrimaryArtist = "A<b>, \"C\"", Lyrics = "<script>" });

        Assert.DoesNotContain('<', draft.Title + draft.Description + string.Join("", draft.Tags));
        Assert.DoesNotContain('>', draft.Title + draft.Description + string.Join("", draft.Tags));
        Assert.All(draft.Tags, t => Assert.False(t.Contains(',') || t.Contains('"')));
    }

    [Fact]
    public void Tags_stay_within_youtubes_budget_and_are_unique()
    {
        var many = Enumerable.Range(1, 20).Select(i => $"Featured Artist Number {i}").ToList();
        var tags = YouTubeMusicMetadata.Tags(Song() with { FeaturedArtists = many });

        Assert.True(YouTubePublishValidator.TagsLength(tags) <= YouTubePublishValidator.MaxTagsLength);
        Assert.Equal(tags.Count, tags.Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(["Sample Artist", "Test Monsoon", "Sample Artist Test Monsoon", "Pop", "Indie"], tags.Take(5));
    }
}
