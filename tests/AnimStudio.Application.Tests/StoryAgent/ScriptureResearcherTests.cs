using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class ScriptureResearcherTests
{
    private static readonly string[] OnTheSite = ["bhagavata-purana", "vishnu-purana", "bhagavad-gita"];

    private static ScripturePassage Passage(string textId, int division, int unit, bool direct = true) => new()
    {
        TextId = textId,
        TextName = GranthCatalog.Get(textId)?.English ?? textId,
        Ref = textId == "bhagavad-gita" ? $"{division}" : $"{division}.{unit}",
        Title = $"{textId}/{division}/{unit}",
        Language = "sa",
        Url = $"https://example.org/{textId}/{division}/{unit}",
        Excerpt = $"पाठः {textId} {division} {unit}",
        Direct = direct,
        License = "test"
    };

    private sealed class FakeSource : IScriptureSource
    {
        public string Id => "fake";
        public IReadOnlyCollection<string> Holds { get; init; } = OnTheSite;
        public List<(string TextId, int Division, int Unit)> Read { get; } = [];
        public List<string> Searched { get; } = [];
        public Func<string, int, int, Exception?>? FailWith { get; set; }
        public Action<int>? OnRead { get; set; }
        public Func<string, IReadOnlyList<ScripturePassage>>? Hits { get; set; }

        public Task<ScripturePassage?> FetchChapterAsync(string textId, int division, int unit, CancellationToken ct)
        {
            Read.Add((textId, division, unit));
            OnRead?.Invoke(Read.Count);
            if (FailWith?.Invoke(textId, division, unit) is { } error) throw error;
            return Task.FromResult(Holds.Contains(textId) ? Passage(textId, division, unit) : null);
        }

        public Task<IReadOnlyList<ScripturePassage>> SearchAsync(string query, int max, CancellationToken ct)
        {
            Searched.Add(query);
            if (FailWith?.Invoke("search", 0, 0) is { } error) throw error;
            return Task.FromResult<IReadOnlyList<ScripturePassage>>([.. (Hits?.Invoke(query) ?? []).Take(max)]);
        }
    }

    private static ScriptureResearcher Make(FakeSource source) =>
        new(source, TimeProvider.System, NullLogger<ScriptureResearcher>.Instance);

    private static StoryBrief Brief(string title, string? notes = null) => new() { Title = title, Notes = notes };

    [Fact]
    public async Task A_festival_title_finds_its_topic_and_reads_the_surest_chapters_first()
    {
        var source = new FakeSource();

        var research = await Make(source).ResearchAsync(Brief("Diwali: why we light lamps"));

        Assert.Equal("diwali", research.Topics[0].TopicId);

        // The catalogue's High pointers, in its order, each range cut to two chapters, until six are read.
        Assert.Equal(
            [("bhagavata-purana", 8, 8), ("bhagavata-purana", 10, 59), ("bhagavata-purana", 9, 10), ("bhagavata-purana", 9, 11),
             ("bhagavata-purana", 10, 24), ("bhagavata-purana", 10, 25)],
            source.Read);

        Assert.Equal(ScriptureResearcher.MaxChapters, research.Passages.Count);
        Assert.All(research.Passages, p => Assert.True(p.Direct));
        Assert.Equal(["8.8", "10.59", "9.10", "9.11", "10.24", "10.25"], research.Passages.Select(p => p.Ref));
        Assert.Empty(research.Warnings);
        Assert.NotEqual(default, research.RetrievedAtUtc);
    }

    [Fact]
    public async Task A_pointer_that_was_read_is_marked_and_linked_and_one_that_was_not_is_left_alone()
    {
        var research = await Make(new FakeSource()).ResearchAsync(Brief("Diwali"));

        var sources = research.Topics[0].Sources;
        var churning = sources.Single(s => s is { TextId: "bhagavata-purana", Ref: "8.8" });
        Assert.True(churning.Grounded);
        Assert.Equal("https://example.org/bhagavata-purana/8/8", churning.Url);
        Assert.Equal(CitationStatus.Verified, churning.Check);
        Assert.Equal("Bhagavata Purana", churning.TextName);

        var ramayana = sources.First(s => s.TextId == "valmiki-ramayana");
        Assert.False(ramayana.Grounded);
        Assert.Null(ramayana.Url);
    }

    [Fact]
    public async Task A_range_is_read_chapter_by_chapter_but_never_past_the_cap()
    {
        var source = new FakeSource();

        await Make(source).ResearchAsync(Brief("Dhanteras"));

        // 8.8 first (it is listed first), then 8.6-9 which would be four chapters but is cut to two.
        Assert.Equal([("bhagavata-purana", 8, 8), ("bhagavata-purana", 8, 6), ("bhagavata-purana", 8, 7)], source.Read);
    }

    [Fact]
    public async Task A_chapter_two_topics_both_point_to_is_read_once_and_both_pointers_are_marked()
    {
        var source = new FakeSource();

        var research = await Make(source).ResearchAsync(Brief("Dhanteras and Lakshmi puja"));

        Assert.Equal(1, source.Read.Count(r => r is ("bhagavata-purana", 8, 8)));
        Assert.Equal(1, research.Passages.Count(p => p.Ref == "8.8"));

        var marked = research.Topics.SelectMany(t => t.Sources).Where(s => s is { TextId: "bhagavata-purana", Ref: "8.8" }).ToList();
        Assert.True(marked.Count >= 2);
        Assert.All(marked, s => Assert.True(s.Grounded));
    }

    [Fact]
    public async Task A_bare_gita_chapter_or_a_verse_in_it_reads_the_chapter()
    {
        var source = new FakeSource();

        var research = await Make(source).ResearchAsync(Brief("The Bhagavad Gita for a young mind"));

        Assert.Equal("gita", research.Topics[0].TopicId);
        Assert.Contains(source.Read, r => r.TextId == "bhagavad-gita");
        Assert.All(research.Passages.Where(p => p.TextId == "bhagavad-gita"), p => Assert.Matches(@"^\d+$", p.Ref));
    }

    [Fact]
    public async Task Pointers_the_source_has_no_page_for_leave_the_run_with_the_pointers_and_a_note()
    {
        var source = new FakeSource { Holds = [] };

        var research = await Make(source).ResearchAsync(Brief("Diwali"));

        Assert.NotEmpty(research.Topics);
        Assert.Empty(research.Passages);
        Assert.Contains(research.Warnings, w => w.Contains("None of the pointers could be read", StringComparison.Ordinal));

        // Each place is asked for once, even when several pointers lead to it.
        Assert.Equal(source.Read.Count, source.Read.Distinct().Count());
    }

    [Fact]
    public async Task A_source_that_fails_is_noted_and_not_asked_again_and_the_run_carries_on()
    {
        var source = new FakeSource
        {
            FailWith = (_, _, _) => new ScriptureSourceException("scripture-rate-limited", "slow down")
        };

        var research = await Make(source).ResearchAsync(Brief("Diwali", "दीपावली लक्ष्मीपूजन"));

        Assert.Single(source.Read);
        Assert.Empty(source.Searched);
        Assert.NotEmpty(research.Topics);
        Assert.Empty(research.Passages);
        var warning = Assert.Single(research.Warnings);
        Assert.Contains("could not be reached", warning);
    }

    [Fact]
    public async Task An_unexpected_error_is_treated_like_an_unreachable_source()
    {
        var source = new FakeSource { FailWith = (_, _, _) => new InvalidOperationException("boom") };

        var research = await Make(source).ResearchAsync(Brief("Diwali"));

        Assert.Single(source.Read);
        Assert.Contains(research.Warnings, w => w.Contains("could not be reached", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_title_no_topic_matches_says_so_and_reads_nothing()
    {
        var source = new FakeSource();

        var research = await Make(source).ResearchAsync(Brief("A quiet evening by the river"));

        Assert.Empty(research.Topics);
        Assert.Empty(source.Read);
        Assert.Contains(research.Warnings, w => w.Contains("No curated pointers matched", StringComparison.Ordinal));
        Assert.DoesNotContain(research.Warnings, w => w.Contains("None of the pointers", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Hindi_words_in_the_title_or_notes_are_searched_longest_first_and_the_hits_are_added()
    {
        var source = new FakeSource
        {
            Hits = query => [Passage("bhagavata-purana", 4, query.Length, direct: true), Passage("bhagavata-purana", 7, query.Length)]
        };

        var research = await Make(source).ResearchAsync(Brief("नचिकेता और ध्रुव"));

        Assert.Equal(["नचिकेता", "ध्रुव"], source.Searched);
        Assert.Equal(4, research.Passages.Count);
        Assert.All(research.Passages, p => Assert.False(p.Direct));
        Assert.Contains("search: नचिकेता", research.Queries);
        Assert.Contains("No curated pointers matched", research.Warnings[0]);
    }

    [Fact]
    public async Task Latin_only_titles_are_not_searched()
    {
        var source = new FakeSource();

        await Make(source).ResearchAsync(Brief("Story of Dhruva and Narasimha"));

        Assert.Empty(source.Searched);
    }

    [Fact]
    public async Task Search_hits_are_not_repeated_and_everything_together_is_capped()
    {
        var source = new FakeSource
        {
            Hits = query => [.. Enumerable.Range(1, 5).Select(i => Passage("bhagavata-purana", 3, i, direct: false))]
        };

        var research = await Make(source).ResearchAsync(Brief("नचिकेता", "ध्रुव प्रह्लाद"));

        Assert.True(research.Passages.Count <= ScriptureResearcher.MaxPassages);
        Assert.Equal(research.Passages.Count, research.Passages.Select(p => p.Url).Distinct().Count());
        Assert.True(source.Searched.Count <= ScriptureResearcher.MaxSearchQueries);
    }

    [Fact]
    public async Task A_failed_search_is_noted_and_what_was_read_is_kept()
    {
        var source = new FakeSource
        {
            FailWith = (textId, _, _) => textId == "search" ? new ScriptureSourceException("scripture-unavailable", "no") : null
        };

        var research = await Make(source).ResearchAsync(Brief("Dhanteras", "धनतेरस"));

        Assert.NotEmpty(research.Passages);
        Assert.Contains(research.Warnings, w => w.Contains("Searching the texts", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Cancelling_stops_the_reading_between_chapters()
    {
        using var cancel = new CancellationTokenSource();
        var source = new FakeSource { OnRead = count => { if (count == 2) cancel.Cancel(); } };

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => Make(source).ResearchAsync(Brief("Diwali"), null, cancel.Token));

        Assert.Equal(2, source.Read.Count);
    }

    [Fact]
    public async Task Progress_names_each_chapter_and_each_search()
    {
        var reports = new List<string>();
        var source = new FakeSource { Hits = _ => [Passage("bhagavata-purana", 4, 8, direct: false)] };

        await Make(source).ResearchAsync(Brief("Dhanteras", "धन्वंतरि"), message =>
        {
            reports.Add(message);
            return Task.CompletedTask;
        });

        Assert.Equal("Reading Bhagavata Purana 8.8", reports[0]);
        Assert.Contains(reports, r => r.StartsWith("Reading Bhagavata Purana 8.6", StringComparison.Ordinal));
        Assert.Contains(reports, r => r.StartsWith("Searching the texts for", StringComparison.Ordinal) && r.Contains("धन्वंतरि"));
    }

    [Fact]
    public void Search_words_are_the_specific_Devanagari_ones_longest_first()
    {
        Assert.Equal(["लक्ष्मीपूजन", "दीपावली"], ScriptureResearcher.SearchWords("Diwali दीपावली की कथा में लक्ष्मीपूजन क्यों"));
        Assert.Empty(ScriptureResearcher.SearchWords("only latin words here"));
        Assert.Empty(ScriptureResearcher.SearchWords(null));
        Assert.Equal(["दीपावली"], ScriptureResearcher.SearchWords("दीपावली, दीपावली!"));
    }

    [Fact]
    public async Task The_notes_count_when_matching_topics()
    {
        var research = await Make(new FakeSource()).ResearchAsync(Brief("A festival story", "about Govardhan and the hill"));

        Assert.Contains(research.Topics, t => t.TopicId == "govardhan");
    }
}
