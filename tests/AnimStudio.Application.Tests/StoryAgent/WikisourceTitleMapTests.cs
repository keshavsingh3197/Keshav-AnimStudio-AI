using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.StoryAgent;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class WikisourceTitleMapTests
{
    // Each of these pages was seen on sa.wikisource.org.
    [Theory]
    [InlineData("bhagavata-purana", 8, 8, "श्रीमद्भागवतपुराणम्/स्कन्धः ८/अध्यायः ८")]
    [InlineData("bhagavata-purana", 9, 10, "श्रीमद्भागवतपुराणम्/स्कन्धः ९/अध्यायः १०")]
    [InlineData("bhagavata-purana", 12, 13, "श्रीमद्भागवतपुराणम्/स्कन्धः १२/अध्यायः १३")]
    [InlineData("bhagavata-purana", 10, 24, "श्रीमद्भागवतपुराणम्/स्कन्धः १०/पूर्वार्धः/अध्यायः २४")]
    [InlineData("bhagavata-purana", 10, 49, "श्रीमद्भागवतपुराणम्/स्कन्धः १०/पूर्वार्धः/अध्यायः ४९")]
    [InlineData("bhagavata-purana", 10, 50, "श्रीमद्भागवतपुराणम्/स्कन्धः १०/उत्तरार्धः/अध्यायः ५०")]
    [InlineData("bhagavata-purana", 10, 59, "श्रीमद्भागवतपुराणम्/स्कन्धः १०/उत्तरार्धः/अध्यायः ५९")]
    [InlineData("vishnu-purana", 1, 9, "विष्णुपुराणम्/प्रथमांशः/अध्यायः ९")]
    [InlineData("vishnu-purana", 5, 29, "विष्णुपुराणम्/पञ्चमांशः/अध्यायः २९")]
    [InlineData("bhagavad-gita", 3, 0, "भगवद्गीता/कर्मयोगः")]
    [InlineData("bhagavad-gita", 2, 47, "भगवद्गीता/साङ्ख्ययोगः")]
    [InlineData("bhagavad-gita", 18, 66, "भगवद्गीता/मोक्षसंन्यासयोगः")]
    public void A_chapter_maps_to_the_page_that_holds_it(string textId, int division, int unit, string expected) =>
        Assert.Equal(expected, WikisourceTitleMap.TitleFor(textId, division, unit));

    [Theory]
    [InlineData("bhagavata-purana", 13, 1)]
    [InlineData("bhagavata-purana", 0, 1)]
    [InlineData("bhagavata-purana", 8, 0)]
    [InlineData("vishnu-purana", 6, 1)]
    [InlineData("bhagavad-gita", 19, 1)]
    [InlineData("bhagavad-gita", 0, 1)]
    [InlineData("valmiki-ramayana", 1, 1)]
    [InlineData("mahabharata", 1, 1)]
    [InlineData("", 1, 1)]
    [InlineData(null, 1, 1)]
    public void A_place_the_site_does_not_hold_by_name_has_no_page(string? textId, int division, int unit) =>
        Assert.Null(WikisourceTitleMap.TitleFor(textId, division, unit));

    [Fact]
    public void Every_mapped_page_describes_itself_as_the_chapter_it_was_made_from()
    {
        foreach (var (textId, divisions, units) in new[] { ("bhagavata-purana", 12, 90), ("vishnu-purana", 5, 40) })
        {
            for (var division = 1; division <= divisions; division++)
            {
                foreach (var unit in new[] { 1, 9, 10, 24, 49, 50, 59, units })
                {
                    var title = WikisourceTitleMap.TitleFor(textId, division, unit);
                    Assert.NotNull(title);
                    Assert.Equal((textId, $"{division}.{unit}"), WikisourceTitleMap.Describe(title));
                }
            }
        }

        for (var chapter = 1; chapter <= 18; chapter++)
        {
            var title = WikisourceTitleMap.TitleFor("bhagavad-gita", chapter, 1);
            Assert.Equal(("bhagavad-gita", chapter.ToString()), WikisourceTitleMap.Describe(title));
        }
    }

    [Fact]
    public void Every_mapped_reference_is_one_the_catalogue_accepts()
    {
        var bhagavata = WikisourceTitleMap.Describe(WikisourceTitleMap.TitleFor("bhagavata-purana", 10, 59));
        Assert.Equal(CitationStatus.Verified, CitationValidator.Check(bhagavata!.Value.TextId, bhagavata.Value.Ref).Status);

        var gita = WikisourceTitleMap.Describe(WikisourceTitleMap.TitleFor("bhagavad-gita", 11, 0));
        Assert.Equal(CitationStatus.Verified, CitationValidator.Check(gita!.Value.TextId, gita.Value.Ref).Status);
    }

    [Fact]
    public void The_two_spellings_the_site_redirects_are_read_as_the_same_chapter()
    {
        Assert.Equal(("bhagavad-gita", "2"), WikisourceTitleMap.Describe("भगवद्गीता/सांख्ययोगः"));
        Assert.Equal(("bhagavad-gita", "16"), WikisourceTitleMap.Describe("भगवद्गीता/दैवासुरसंपद्विभागयोगः"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("मुख्यपृष्ठम्")]
    [InlineData("श्रीमद्भागवतपुराणम्")]
    [InlineData("श्रीमद्भागवतपुराणम्/स्कन्धः ८")]
    [InlineData("श्रीमद्भागवतपुराणम्/स्कन्धः ८/अध्यायः x")]
    [InlineData("श्रीमद्भागवतपुराणम्/स्कन्धः १०/मध्यार्धः/अध्यायः ५")]
    [InlineData("श्रीमद्भागवतपुराणम्/स्कन्धः ८/अध्यायः ८/extra/more")]
    [InlineData("विष्णुपुराणम्/षष्ठांशः/अध्यायः १")]
    [InlineData("भगवद्गीता")]
    [InlineData("भगवद्गीता/अज्ञातयोगः")]
    [InlineData("भगवद्गीताभाष्यम् -श्रीशङ्करकृतम्")]
    public void A_page_that_is_not_a_known_chapter_is_not_described(string title) =>
        Assert.Null(WikisourceTitleMap.Describe(title));

    [Fact]
    public void Ascii_digits_in_a_title_are_read_too()
    {
        Assert.Equal(("bhagavata-purana", "8.8"), WikisourceTitleMap.Describe("श्रीमद्भागवतपुराणम्/स्कन्धः 8/अध्यायः 8"));
    }
}
