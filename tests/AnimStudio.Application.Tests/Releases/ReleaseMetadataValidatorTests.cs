using AnimStudio.Application.Releases;

namespace AnimStudio.Application.Tests.Releases;

/// <summary>All names and codes here are synthetic.</summary>
public class ReleaseMetadataValidatorTests
{
    private static readonly DateOnly Today = new(2026, 10, 4);

    private static ReleaseMetadata Valid() => new()
    {
        Title = "Monsoon Lights",
        PrimaryArtist = "Test Artist",
        Songwriters = ["Sample Writer"],
        Genre = "Pop",
        Language = "hi",
        ReleaseDate = Today.AddDays(30),
        Isrc = "INA1B2600001",
        RightsConfirmed = true
    };

    [Fact]
    public void Accepts_complete_metadata_without_warnings()
    {
        var result = ReleaseMetadataValidator.Validate(Valid(), Today);

        Assert.True(result.IsValid);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public void Refuses_to_build_without_a_rights_confirmation()
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { RightsConfirmed = false }, Today);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Code == "rights-not-confirmed");
    }

    [Fact]
    public void Requires_title_artist_and_genre()
    {
        var result = ReleaseMetadataValidator.Validate(
            Valid() with { Title = "  ", PrimaryArtist = "", Genre = "" }, Today);

        Assert.Equal(["title", "primaryArtist", "genre"], result.Errors.Select(e => e.Field));
    }

    [Fact]
    public void A_missing_body_is_an_error_not_a_crash()
    {
        var result = ReleaseMetadataValidator.Validate(null, Today);

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData("INA1B2600001", "INA1B2600001")]
    [InlineData("in-a1b-26-00001", "INA1B2600001")]
    [InlineData("IN A1B 26 00001", "INA1B2600001")]
    public void Normalises_isrc_formatting(string input, string expected)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Isrc = input }, Today);

        Assert.True(result.IsValid);
        Assert.Equal(expected, result.Normalized.Isrc);
    }

    [Theory]
    [InlineData("IN1234")]
    [InlineData("1NA1B2600001")]
    [InlineData("INA1B26000O1")]
    [InlineData("INA1B26000011")]
    public void Rejects_malformed_isrc(string isrc)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Isrc = isrc }, Today);

        Assert.Contains(result.Errors, e => e.Code == "isrc-invalid");
    }

    [Theory]
    [InlineData("036000291452")]   // UPC-A
    [InlineData("4006381333931")]  // EAN-13
    [InlineData("0-36000-29145-2")]
    public void Accepts_barcodes_with_a_correct_check_digit(string upc)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Upc = upc }, Today);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("036000291453")]
    [InlineData("4006381333932")]
    [InlineData("12345")]
    [InlineData("03600029145A")]
    public void Rejects_barcodes_with_a_wrong_check_digit_or_shape(string upc)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Upc = upc }, Today);

        Assert.Contains(result.Errors, e => e.Code == "upc-invalid");
    }

    [Fact]
    public void An_instrumental_is_language_zxx_and_cannot_carry_lyrics()
    {
        var ok = ReleaseMetadataValidator.Validate(Valid() with { Instrumental = true, Language = "" }, Today);
        Assert.True(ok.IsValid);
        Assert.Equal("zxx", ok.Normalized.Language);

        var withLyrics = ReleaseMetadataValidator.Validate(
            Valid() with { Instrumental = true, Lyrics = "la la la" }, Today);
        Assert.Contains(withLyrics.Errors, e => e.Code == "lyrics-on-instrumental");
    }

    [Theory]
    [InlineData("english")]
    [InlineData("e")]
    [InlineData("")]
    public void Rejects_a_language_that_is_not_a_two_letter_code(string language)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Language = language }, Today);

        Assert.Contains(result.Errors, e => e.Code == "language-invalid");
    }

    [Fact]
    public void Rejects_control_characters_in_names()
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { PrimaryArtist = "Bad\u0000Name" }, Today);

        Assert.Contains(result.Errors, e => e.Field == "primaryArtist");
    }

    [Fact]
    public void Lyrics_keep_line_breaks_but_not_other_control_characters()
    {
        var ok = ReleaseMetadataValidator.Validate(Valid() with { Lyrics = "line one\r\nline two" }, Today);
        Assert.Equal("line one\nline two", ok.Normalized.Lyrics);

        var bad = ReleaseMetadataValidator.Validate(Valid() with { Lyrics = "line\u0007" }, Today);
        Assert.Contains(bad.Errors, e => e.Code == "lyrics-invalid");
    }

    [Theory]
    [InlineData("Monsoon Lights (feat. Someone)")]
    [InlineData("Monsoon Lights ft. Someone")]
    [InlineData("Monsoon Lights [prod. Someone]")]
    public void Warns_when_credits_are_written_into_the_title(string title)
    {
        var result = ReleaseMetadataValidator.Validate(Valid() with { Title = title }, Today);

        Assert.True(result.IsValid);
        Assert.Contains(result.Warnings, w => w.Code == "title-has-credits");
    }

    [Fact]
    public void Duplicate_and_blank_names_are_dropped()
    {
        var result = ReleaseMetadataValidator.Validate(
            Valid() with { FeaturedArtists = ["Guest One", " guest one ", "", "Guest Two"] }, Today);

        Assert.Equal(["Guest One", "Guest Two"], result.Normalized.FeaturedArtists);
    }

    [Fact]
    public void A_release_date_far_in_the_future_is_rejected_and_a_past_one_warned()
    {
        var future = ReleaseMetadataValidator.Validate(Valid() with { ReleaseDate = Today.AddYears(3) }, Today);
        Assert.Contains(future.Errors, e => e.Code == "release-date-invalid");

        var past = ReleaseMetadataValidator.Validate(Valid() with { ReleaseDate = Today.AddDays(-1) }, Today);
        Assert.True(past.IsValid);
        Assert.Contains(past.Warnings, w => w.Code == "release-date-past");
    }
}
