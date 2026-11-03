using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

public class GranthCatalogTests
{
    [Theory]
    [InlineData("bhagavata-purana", "bhagavata-purana")]
    [InlineData("Bhagavata Purana", "bhagavata-purana")]
    [InlineData("Srimad Bhagavatam", "bhagavata-purana")]
    [InlineData("Śrīmad Bhāgavatam", "bhagavata-purana")]
    [InlineData("श्रीमद्भागवत", "bhagavata-purana")]
    [InlineData("Valmiki Ramayana", "valmiki-ramayana")]
    [InlineData("रामायण", "valmiki-ramayana")]
    [InlineData("Srimad Bhagavatam, Skandha 10", "bhagavata-purana")]
    [InlineData("Durga Saptashati", "devi-mahatmya")]
    public void Find_recognises_a_text_by_id_name_spelling_or_script(string name, string expected) =>
        Assert.Equal(expected, GranthCatalog.Find(name)?.Id);

    [Theory]
    [InlineData("")]
    [InlineData("The Da Vinci Code")]
    [InlineData("Chandogya")]
    public void Find_does_not_guess_a_text_it_does_not_know(string name) =>
        Assert.Null(GranthCatalog.Find(name));

    [Fact]
    public void Every_text_has_a_unique_id_and_names_that_do_not_collide()
    {
        Assert.Equal(GranthCatalog.Texts.Count, GranthCatalog.Texts.Select(t => t.Id).Distinct().Count());

        var owners = new Dictionary<string, string>();
        foreach (var text in GranthCatalog.Texts)
        {
            foreach (var name in new[] { text.Id, text.English, text.Hindi }.Concat(text.Aliases))
            {
                var key = GranthCatalog.NormalizeName(name);
                if (owners.TryGetValue(key, out var other))
                    Assert.True(other == text.Id, $"'{name}' names both {other} and {text.Id}.");
                owners[key] = text.Id;
            }
        }
    }

    [Fact]
    public void Chapter_counts_of_the_big_texts_match_the_printed_editions()
    {
        // 335 chapters in twelve skandhas; 126 in the six amshas; the Gita's 700 verses are 701 here because
        // some editions count Arjuna's opening line of chapter 13, and the catalogue is generous where they differ.
        Assert.Equal(335, GranthCatalog.Get("bhagavata-purana")!.Divisions.Sum(d => d.Units));
        Assert.InRange(GranthCatalog.Get("bhagavad-gita")!.Divisions.Sum(d => d.Units)!.Value, 700, 701);
        Assert.Equal(126, GranthCatalog.Get("vishnu-purana")!.Divisions.Sum(d => d.Units));
        Assert.Equal(90, GranthCatalog.Get("bhagavata-purana")!.Division(10)!.Units);
        Assert.Equal(13, GranthCatalog.Get("devi-mahatmya")!.Divisions.Single().Units);
    }
}

public class CitationValidatorTests
{
    [Theory]
    [InlineData("bhagavata-purana", "10.59", "10.59")]
    [InlineData("Bhagavata Purana", "10.24-25", "10.24-25")]
    [InlineData("Bhagavata Purana", "10.24–25", "10.24-25")]
    [InlineData("Bhagavata Purana", "Skandha 10, Adhyaya 59", "10.59")]
    [InlineData("Bhagavata Purana", "१०.५९", "10.59")]
    [InlineData("Bhagavata Purana", "8", "8")]
    [InlineData("valmiki-ramayana", "6.124-128", "6.124-128")]
    [InlineData("valmiki-ramayana", "Yuddha Kanda 128", "6.128")]
    [InlineData("valmiki-ramayana", "Sundara", "5")]
    [InlineData("valmiki-ramayana", "Lanka 1", "6.1")]
    [InlineData("shiva-purana", "Koti Rudra Samhita: Shivaratri Vrata", "4")]
    [InlineData("bhagavad-gita", "2.47", "2.47")]
    [InlineData("bhagavad-gita", "1-18", "1-18")]
    [InlineData("devi-mahatmya", "2-4", "1.2-4")]
    [InlineData("devi-mahatmya", "Adhyaya 11", "1.11")]
    [InlineData("hanuman-chalisa", "1-40", "1.1-40")]
    public void A_place_inside_the_text_is_verified_and_written_the_standard_way(string text, string reference, string normalized)
    {
        var check = CitationValidator.Check(text, reference);

        Assert.Equal(CitationStatus.Verified, check.Status);
        Assert.Equal(normalized, check.Normalized);
        Assert.True(check.IsAcceptable);
    }

    [Theory]
    [InlineData("bhagavata-purana", "13.2", "12 skandhas")]
    [InlineData("bhagavata-purana", "10.91", "90 adhyayas")]
    [InlineData("valmiki-ramayana", "8.1", "7 kandas")]
    [InlineData("valmiki-ramayana", "Yuddha 200", "131 sargas")]
    [InlineData("valmiki-ramayana", "128", "7 kandas")]
    [InlineData("bhagavad-gita", "19.1", "18 adhyayas")]
    [InlineData("bhagavad-gita", "2.80", "72 shlokas")]
    [InlineData("bhagavata-purana", "10.60-59", "not valid")]
    [InlineData("devi-mahatmya", "14", "13 adhyayas")]
    public void A_place_outside_the_text_is_invalid_and_says_why(string text, string reference, string reason)
    {
        var check = CitationValidator.Check(text, reference);

        Assert.Equal(CitationStatus.Invalid, check.Status);
        Assert.False(check.IsAcceptable);
        Assert.Contains(reason, check.Message);
    }

    [Fact]
    public void A_text_the_catalogue_does_not_know_is_reported_as_such()
    {
        var check = CitationValidator.Check("The Secret Purana", "4.4");

        Assert.Equal(CitationStatus.UnknownText, check.Status);
        Assert.Null(check.TextId);
        Assert.False(check.IsAcceptable);
    }

    [Theory]
    [InlineData("padma-purana", "Uttara Khanda: Kartika Mahatmya")]
    [InlineData("skanda-purana", "Kartika Mahatmya")]
    [InlineData("upanishads", "Isha 1")]
    [InlineData("bhagavata-purana", "")]
    [InlineData("bhagavata-purana", "the churning chapter")]
    public void A_reference_that_cannot_be_checked_is_accepted_but_unchecked(string text, string reference)
    {
        var check = CitationValidator.Check(text, reference);

        Assert.Equal(CitationStatus.Unchecked, check.Status);
        Assert.True(check.IsAcceptable);
    }

    [Fact]
    public void Overlap_finds_a_chapter_inside_a_range_in_the_same_division()
    {
        var range = CitationValidator.Check("bhagavata-purana", "10.24-25");

        Assert.True(range.Overlaps(10, 25, 25));
        Assert.True(range.Overlaps(10, 20, 24));
        Assert.False(range.Overlaps(10, 26, 30));
        Assert.False(range.Overlaps(9, 24, 25));
    }

    [Fact]
    public void Every_curated_pointer_names_a_real_text_and_a_place_that_exists()
    {
        foreach (var topic in GranthTopics.All)
        {
            Assert.NotEmpty(topic.Sources);
            foreach (var source in topic.Sources)
            {
                var check = CitationValidator.Check(source.TextId, source.Ref);
                Assert.True(check.IsAcceptable,
                    $"{topic.Id}: {source.TextId} {source.Ref} is not acceptable: {check.Status} {check.Message}");
                Assert.NotNull(GranthCatalog.Get(source.TextId));
            }
        }
    }
}

public class GranthTopicsTests
{
    [Theory]
    [InlineData("Why we celebrate Diwali", "diwali")]
    [InlineData("दीपावली क्यों मनाई जाती है?", "diwali")]
    [InlineData("दिवाली की कथा", "diwali")]
    [InlineData("Govardhan Puja story", "govardhan")]
    [InlineData("नरकासुर वध", "narak-chaturdashi")]
    [InlineData("Maa Durga and Mahishasura", "navratri")]
    [InlineData("Hanuman Jayanti katha", "hanuman")]
    [InlineData("होलिका और प्रह्लाद की कथा", "holi")]
    [InlineData("Dev Deepawali kartik purnima", "dev-deepawali")]
    [InlineData("महाशिवरात्रि की कथा", "shivratri")]
    public void The_title_finds_its_topic_first(string title, string topicId) =>
        Assert.Equal(topicId, GranthTopics.Match(title).FirstOrDefault()?.Id);

    [Theory]
    [InlineData("आराम से बैठकर कहानी सुनिए")]
    [InlineData("A program about rampant inflation")]
    [InlineData("")]
    [InlineData("   ")]
    public void A_word_that_only_contains_a_keyword_is_not_a_match(string title) =>
        Assert.DoesNotContain(GranthTopics.Match(title), t => t.Id is "ramayana");

    [Fact]
    public void Matching_returns_at_most_three_topics_best_first()
    {
        var topics = GranthTopics.Match("Diwali: Dhanteras, Lakshmi puja, Govardhan, Bhai Dooj and Krishna");

        Assert.True(topics.Count <= 3);
        Assert.Equal("diwali", topics[0].Id);
    }

    [Fact]
    public void Every_topic_has_a_unique_id_and_keywords_that_fold_to_something()
    {
        Assert.Equal(GranthTopics.All.Count, GranthTopics.All.Select(t => t.Id).Distinct().Count());
        foreach (var topic in GranthTopics.All)
        {
            Assert.NotEmpty(topic.Keywords);
            Assert.All(topic.Keywords, k => Assert.NotEqual(string.Empty, GranthTopics.Fold(k)));
            Assert.False(string.IsNullOrWhiteSpace(topic.MusicQuery));
        }
    }
}
