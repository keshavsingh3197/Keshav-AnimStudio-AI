using AnimStudio.Application.StoryAgent;
using AnimStudio.Infrastructure.StoryAgent;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// A fact that talks to the real sa.wikisource.org, so it runs only when asked
/// (<c>ANIMSTUDIO_LIVE_WIKISOURCE=1</c>). It makes a handful of requests, paced like a normal
/// run, to confirm the page names in <see cref="WikisourceTitleMap"/> still match the site.
/// </summary>
public sealed class WikisourceFactAttribute : FactAttribute
{
    public WikisourceFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("ANIMSTUDIO_LIVE_WIKISOURCE") != "1")
            Skip = "Set ANIMSTUDIO_LIVE_WIKISOURCE=1 to read from the live Wikisource.";
    }

    public static WikisourceScriptureSource Source() => new(
        new StaticOptions(new StoryAgentOptions()),
        TimeProvider.System,
        NullLogger<WikisourceScriptureSource>.Instance);

    private sealed class StaticOptions(StoryAgentOptions value) : IOptionsMonitor<StoryAgentOptions>
    {
        public StoryAgentOptions CurrentValue => value;
        public StoryAgentOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<StoryAgentOptions, string?> listener) => null;
    }
}

public sealed class WikisourceLiveTests
{
    [WikisourceFact]
    public async Task The_mapped_pages_exist_and_read_as_verses()
    {
        using var source = WikisourceFactAttribute.Source();

        // The churning of the ocean, the slaying of Naraka (skandha 10 is split in two on the site),
        // a Gita chapter (its page carries every commentary), and a Vishnu Purana chapter.
        var churning = await source.FetchChapterAsync("bhagavata-purana", 8, 8, CancellationToken.None);
        var naraka = await source.FetchChapterAsync("bhagavata-purana", 10, 59, CancellationToken.None);
        var gita = await source.FetchChapterAsync("bhagavad-gita", 3, 0, CancellationToken.None);
        var vishnu = await source.FetchChapterAsync("vishnu-purana", 1, 9, CancellationToken.None);

        foreach (var passage in new[] { churning, naraka, gita, vishnu })
        {
            Assert.NotNull(passage);
            Assert.True(passage.Excerpt.Length > 500, $"{passage.Title} read as only {passage.Excerpt.Length} characters");
            Assert.DoesNotContain("<", passage.Excerpt);
            Assert.StartsWith("https://sa.wikisource.org/wiki/", passage.Url);
        }

        Assert.Contains("ममन्थुस्तरसा सिन्धुं", churning!.Excerpt);

        // 440 KB of HTML with the commentaries folded in; the verses alone are a few KB.
        Assert.True(gita!.Excerpt.Length < 12_100, $"{gita.Excerpt.Length}");
        Assert.Contains("ज्यायसी चेत्कर्मणस्ते", gita.Excerpt);
    }
}
