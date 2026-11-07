using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Publishing;

public sealed class YouTubeSuggestionLibraryTests
{
    private const string User = "user-1";

    private static YouTubeSuggestionSource Source(string summary, string language = "hi") =>
        new(summary, "animated", language, null, string.Empty, null);

    private static YouTubeMetadataSuggestion Written(string title) =>
        new(title, "A description.", ["shiv", "bhajan"]) { TitleOptions = [title + " (2)"] };

    private static (YouTubeSuggestionLibrary Library, InMemoryRepository Repository) Create()
    {
        var repository = new InMemoryRepository();
        return (new YouTubeSuggestionLibrary(repository, TimeProvider.System, NullLogger<YouTubeSuggestionLibrary>.Instance), repository);
    }

    [Fact]
    public async Task The_same_video_asked_again_gets_the_saved_details_without_a_model()
    {
        var (library, repository) = Create();
        var source = Source("Project name: Har Har Mahadev bhajan\nShiv Shankar Bholenath Kailash Damru");
        await library.SaveAsync(User, source, Written("Har Har Mahadev"), "gemini", CancellationToken.None);

        var found = await library.LookAsync(User, source, allowReuse: true, CancellationToken.None);

        Assert.NotNull(found.Reused);
        Assert.Equal("Har Har Mahadev", found.Reused!.Title);
        Assert.Equal(1.0, found.Similarity);
        Assert.Equal(1, repository.Items.Single().Uses);
    }

    [Fact]
    public async Task A_video_of_the_same_kind_reuses_them_and_a_different_one_only_gets_title_ideas()
    {
        var (library, _) = Create();
        await library.SaveAsync(User, Source("Shiv Shankar Bholenath Kailash Damru Mahadev Trishul Nandi Ganga bhajan aarti"),
            Written("Bholenath Aarti"), "gemini", CancellationToken.None);

        var alike = await library.LookAsync(User,
            Source("Shiv Shankar Bholenath Kailash Damru Mahadev Trishul Nandi Ganga bhajan"), allowReuse: true, CancellationToken.None);
        Assert.Equal("Bholenath Aarti", alike.Reused?.Title);

        var related = await library.LookAsync(User,
            Source("Shiv Mahadev Kailash Bholenath Damru Ram Sita Hanuman katha"), allowReuse: true, CancellationToken.None);
        Assert.Null(related.Reused);
        Assert.Contains("Bholenath Aarti", related.Titles);

        var other = await library.LookAsync(User, Source("Krishna Radha Vrindavan Holi Gopi Murli"), allowReuse: true, CancellationToken.None);
        Assert.Null(other.Reused);
        Assert.Empty(other.Titles);
    }

    [Fact]
    public async Task A_new_take_never_reuses_and_another_language_or_person_is_not_looked_at()
    {
        var (library, _) = Create();
        var source = Source("Shiv Shankar Bholenath Kailash Damru");
        await library.SaveAsync(User, source, Written("Bholenath"), "gemini", CancellationToken.None);

        Assert.Null((await library.LookAsync(User, source, allowReuse: false, CancellationToken.None)).Reused);
        Assert.Null((await library.LookAsync("someone-else", source, allowReuse: true, CancellationToken.None)).Reused);
        Assert.Null((await library.LookAsync(User, Source("Shiv Shankar Bholenath Kailash Damru", "en"), allowReuse: true,
            CancellationToken.None)).Reused);
    }

    [Fact]
    public async Task A_new_take_replaces_what_was_saved_for_the_same_video()
    {
        var (library, repository) = Create();
        var source = Source("Shiv Shankar Bholenath Kailash Damru");
        await library.SaveAsync(User, source, Written("First"), "gemini", CancellationToken.None);
        await library.SaveAsync(User, source, Written("Second"), "gemini", CancellationToken.None);

        Assert.Equal("Second", repository.Items.Single().Title);
    }

    [Fact]
    public async Task A_database_that_cannot_be_read_costs_a_model_call_not_the_request()
    {
        var library = new YouTubeSuggestionLibrary(new BrokenRepository(), TimeProvider.System, NullLogger<YouTubeSuggestionLibrary>.Instance);

        var found = await library.LookAsync(User, Source("Shiv"), allowReuse: true, CancellationToken.None);
        await library.SaveAsync(User, Source("Shiv"), Written("Shiv"), "gemini", CancellationToken.None);

        Assert.Same(YouTubeLibraryLookup.Empty, found);
    }

    [Fact]
    public void Hindi_words_are_kept_whole_and_common_words_left_out()
    {
        var words = YouTubeSuggestionLibrary.KeywordsOf("Project name: शिव की आराधना और भक्ति");

        Assert.Contains("शिव", words);
        Assert.Contains("आराधना", words);
        Assert.Contains("भक्ति", words);
        Assert.DoesNotContain("की", words);
        Assert.DoesNotContain("project", words);
    }

    private sealed class InMemoryRepository : IYouTubeSavedSuggestionRepository
    {
        public List<YouTubeSavedSuggestion> Items { get; } = [];

        public Task<YouTubeSavedSuggestion?> FindAsync(string userId, string fingerprint, CancellationToken ct) =>
            Task.FromResult(Items.FirstOrDefault(s => s.UserId == userId && s.Fingerprint == fingerprint));

        public Task<IReadOnlyList<YouTubeSavedSuggestion>> ListRecentAsync(string userId, string language, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<YouTubeSavedSuggestion>>(
                [.. Items.Where(s => s.UserId == userId && s.Language == language).OrderByDescending(s => s.CreatedAtUtc).Take(limit)]);

        public Task UpsertAsync(YouTubeSavedSuggestion suggestion, CancellationToken ct)
        {
            Items.RemoveAll(s => s.Id == suggestion.Id);
            Items.Add(suggestion);
            return Task.CompletedTask;
        }
    }

    private sealed class BrokenRepository : IYouTubeSavedSuggestionRepository
    {
        public Task<YouTubeSavedSuggestion?> FindAsync(string userId, string fingerprint, CancellationToken ct) =>
            throw new InvalidOperationException("down");

        public Task<IReadOnlyList<YouTubeSavedSuggestion>> ListRecentAsync(string userId, string language, int limit, CancellationToken ct) =>
            throw new InvalidOperationException("down");

        public Task UpsertAsync(YouTubeSavedSuggestion suggestion, CancellationToken ct) =>
            throw new InvalidOperationException("down");
    }
}
