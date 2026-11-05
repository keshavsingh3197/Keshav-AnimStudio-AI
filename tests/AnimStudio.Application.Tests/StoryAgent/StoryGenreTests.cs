using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public class StoryGenreRulesTests
{
    [Fact]
    public void Every_built_in_genre_passes_its_own_rules()
    {
        foreach (var genre in StoryGenres.All())
        {
            var (clean, problems) = StoryGenreRules.Normalize(genre);
            Assert.True(problems.Count == 0, $"{genre.Id}: {string.Join(" ", problems.Select(p => p.Message))}");
            Assert.Equal(genre.Topics.Count, clean!.Topics.Count);
        }
    }

    [Fact]
    public void The_built_in_genres_have_unique_ids_and_devotional_carries_every_curated_topic()
    {
        var all = StoryGenres.All();
        Assert.Equal(all.Count, all.Select(g => g.Id).Distinct().Count());

        var devotional = StoryGenres.Find(StoryGenres.DefaultId)!;
        Assert.Equal(StoryGenreMode.Scripture, devotional.Mode);
        Assert.Equal(GranthTopics.All.Count, devotional.Topics.Count);
        Assert.Equal(
            GranthTopics.All.SelectMany(t => t.Sources).Count(),
            devotional.Topics.SelectMany(t => t.Sources).Count());
    }

    [Fact]
    public void Each_call_gives_fresh_objects()
    {
        StoryGenres.Find("funny")!.Tags.Clear();
        Assert.NotEmpty(StoryGenres.Find("funny")!.Tags);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("ftp://example.com/x")]
    [InlineData("example.com")]
    [InlineData("https://example.com/a b")]
    public void A_link_must_be_a_full_web_address(string url)
    {
        var genre = StoryGenres.Funny();
        genre.Links = [new StoryGenreLink { Label = "Playlist", Url = url }];

        var (clean, problems) = StoryGenreRules.Normalize(genre);

        Assert.Null(clean);
        Assert.Contains(problems, p => p.Code == "genre-link-invalid");
    }

    [Fact]
    public void A_scripture_topic_may_only_point_at_a_text_the_catalogue_knows()
    {
        var genre = StoryGenres.Devotional();
        genre.Topics[0].Sources.Add(new StoryGenreSource { TextId = "made-up-purana", Ref = "1.1" });

        var (_, problems) = StoryGenreRules.Normalize(genre);

        Assert.Contains(problems, p => p.Code == "genre-source-invalid");
    }

    [Fact]
    public void A_creative_genre_drops_scripture_sources_and_needs_a_style_guide()
    {
        var genre = StoryGenres.Funny();
        genre.Topics[0].Sources.Add(new StoryGenreSource { TextId = "bhagavata-purana", Ref = "10.59" });
        Assert.Empty(StoryGenreRules.Normalize(genre).Genre!.Topics[0].Sources);

        genre.StyleGuide = "funny";
        Assert.Contains(StoryGenreRules.Normalize(genre).Problems, p => p.Code == "genre-style-required");
    }

    [Theory]
    [InlineData("Devotional")]
    [InlineData("a")]
    [InlineData("-funny")]
    [InlineData("funny stories")]
    public void An_id_is_a_lower_case_slug(string id)
    {
        var genre = StoryGenres.Funny();
        genre.Id = id;
        var (clean, problems) = StoryGenreRules.Normalize(genre);

        // Upper case is folded rather than refused; anything else that is not a slug is refused.
        if (id == "Devotional") Assert.Equal("devotional", clean!.Id);
        else Assert.Contains(problems, p => p.Code == "genre-id-invalid");
    }

    [Fact]
    public void Hashtags_lose_their_hash_and_anything_that_is_not_a_letter_or_digit()
    {
        var genre = StoryGenres.Funny();
        genre.Hashtags = ["#Funny Stories", "##LOL!", "#"];

        Assert.Equal(["FunnyStories", "LOL"], StoryGenreRules.Normalize(genre).Genre!.Hashtags);
    }
}

public class StoryGenrePromptTests
{
    private static StoryRun CreativeRun(StoryGenre genre) => new()
    {
        Brief = new StoryBrief { Title = "The dog who ate the homework", Language = "en", TargetSeconds = 60, GenreId = genre.Id, Mode = genre.Mode },
        Genre = genre,
        Research = new StoryResearch()
    };

    [Fact]
    public void A_creative_run_uses_the_creative_template_and_fills_exactly_its_variables()
    {
        var genre = StoryGenres.Funny();
        var (key, variables) = StoryScriptPrompt.For(CreativeRun(genre));

        Assert.Equal(BuiltInPrompts.StoryScriptCreative, key);
        Assert.Equal(
            BuiltInPrompts.Find(key)!.Variables.OrderBy(v => v, StringComparer.Ordinal),
            variables.Keys.OrderBy(v => v, StringComparer.Ordinal));
        Assert.Contains(genre.StyleGuide, variables["genre"]);
        Assert.Contains("Moods: playful", variables["genre"]);
    }

    [Fact]
    public void A_run_from_before_genres_still_uses_the_granth_template()
    {
        var run = new StoryRun { Brief = StorySamples.Brief(), Research = StorySamples.Research() };
        var (key, variables) = StoryScriptPrompt.For(run);

        Assert.Equal(BuiltInPrompts.StoryScript, key);
        Assert.Equal(
            BuiltInPrompts.Find(key)!.Variables.OrderBy(v => v, StringComparer.Ordinal),
            variables.Keys.OrderBy(v => v, StringComparer.Ordinal));
    }

    [Fact]
    public void Every_script_template_promises_the_same_answer_shape()
    {
        var shape = BuiltInPrompts.Find(BuiltInPrompts.StoryScript)!.OutputJsonSchema;
        Assert.Equal(shape, BuiltInPrompts.Find(BuiltInPrompts.StoryScriptCreative)!.OutputJsonSchema);
        Assert.Equal(shape, BuiltInPrompts.Find(BuiltInPrompts.StoryScriptDialogue)!.OutputJsonSchema);
        Assert.Equal(shape, BuiltInPrompts.Find(BuiltInPrompts.StoryScriptCreativeDialogue)!.OutputJsonSchema);
    }

    [Fact]
    public void A_story_told_only_by_its_characters_uses_the_template_without_a_narrator()
    {
        var granth = new StoryRun { Brief = StorySamples.Brief(), Research = StorySamples.Research() };
        granth.Brief.Voicing = StoryVoicing.CharactersOnly;
        var creative = CreativeRun(StoryGenres.Funny());
        creative.Brief.Voicing = StoryVoicing.CharactersOnly;

        foreach (var (run, expected) in new[] { (granth, BuiltInPrompts.StoryScriptDialogue), (creative, BuiltInPrompts.StoryScriptCreativeDialogue) })
        {
            var (key, variables) = StoryScriptPrompt.For(run);

            Assert.Equal(expected, key);
            Assert.Equal(
                BuiltInPrompts.Find(key)!.Variables.OrderBy(v => v, StringComparer.Ordinal),
                variables.Keys.OrderBy(v => v, StringComparer.Ordinal));
            Assert.Contains("Never use \"narrator\" as a speaker", BuiltInPrompts.Find(key)!.Body, StringComparison.Ordinal);
        }
    }

    [Fact]
    public void A_creative_script_cites_nothing_and_is_not_held_to_the_tradition_rule()
    {
        var brief = StorySamples.Brief();
        brief.Mode = StoryGenreMode.Creative;

        var result = StoryScriptParser.Parse(StorySamples.ReplyJson, brief, null, "x", StorySamples.Now, tolerant: false);

        Assert.All(result.Script.Scenes, s =>
        {
            Assert.Empty(s.Sources);
            Assert.Equal(StoryBasis.Reflection, s.Basis);
        });
        Assert.DoesNotContain(result.Warnings, w => w.Contains("tradition", StringComparison.Ordinal));
    }
}

public class StoryGenreKitTests
{
    private static StoryKitFacts Facts(StoryScript script) =>
        new([.. script.Scenes.Select((_, i) => i * 14.0)], script.Scenes.Count * 14.0, true, StoryNarrationMode.Stock, null, null);

    [Fact]
    public void A_creative_kit_speaks_for_its_genre_not_for_the_granths()
    {
        var genre = StoryGenres.Kids();
        genre.Links = [new StoryGenreLink { Label = "All our stories", Url = "https://example.com/playlist" }];
        var brief = StorySamples.Brief();
        brief.Mode = StoryGenreMode.Creative;
        var script = StoryScriptParser.Parse(StorySamples.ReplyJson, brief, null, "x", StorySamples.Now, false).Script;

        var kit = StoryKitBuilder.Build(script, brief, new StoryResearch(), Facts(script), genre);

        Assert.DoesNotContain(kit.TitleOptions, t => t.Contains("Granth", StringComparison.Ordinal));
        Assert.Contains(kit.TitleOptions, t => t.EndsWith("| Moral Story for Kids", StringComparison.Ordinal));
        Assert.Contains("#MoralStories", kit.Hashtags);
        Assert.DoesNotContain("#HinduMythology", kit.Hashtags);
        Assert.Contains("moral stories", kit.Tags);
        Assert.Contains("• All our stories: https://example.com/playlist", kit.Description);
        Assert.StartsWith(genre.Icon, kit.Description, StringComparison.Ordinal);
        Assert.Contains(kit.Checklist, c => c.Contains("\"Yes, it's made for kids\"", StringComparison.Ordinal));
        Assert.EndsWith(genre.PinnedLine!, kit.PinnedComment, StringComparison.Ordinal);
    }

    [Fact]
    public void The_devotional_kit_takes_its_tags_and_hashtags_from_the_genre()
    {
        var script = StorySamples.Script();
        var kit = StoryKitBuilder.Build(script, StorySamples.Brief(), StorySamples.Research(), Facts(script));

        Assert.Contains("#HinduMythology", kit.Hashtags);
        Assert.Contains("hindu scriptures", kit.Tags);
        Assert.Contains("पौराणिक कथाएँ", kit.Tags);
    }

    [Fact]
    public void A_hindi_tag_is_left_off_an_english_video()
    {
        var script = StorySamples.Script();
        var kit = StoryKitBuilder.Build(script, StorySamples.Brief("en"), StorySamples.Research(), Facts(script));

        Assert.DoesNotContain("पौराणिक कथाएँ", kit.Tags);
    }
}

public class StoryGenreServiceTests
{
    private sealed class InMemoryGenres : IStoryGenreRepository
    {
        public Dictionary<string, StoryGenre> Rows { get; } = new(StringComparer.Ordinal);
        public int Writes { get; private set; }

        public Task<IReadOnlyList<StoryGenre>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<StoryGenre>>([.. Rows.Values]);
        public Task<StoryGenre?> GetAsync(string id, CancellationToken ct) => Task.FromResult(Rows.GetValueOrDefault(id));

        public Task UpsertAsync(StoryGenre genre, CancellationToken ct)
        {
            Writes++;
            Rows[genre.Id] = genre;
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(Rows.Remove(id));
    }

    private static StoryGenreService Service(InMemoryGenres repo) =>
        new(repo, new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<StoryGenreService>.Instance);

    [Fact]
    public async Task A_genre_an_administrator_makes_is_saved_listed_and_deleted()
    {
        var repo = new InMemoryGenres();
        var service = Service(repo);
        var genre = StoryGenres.Funny();
        genre.Id = "office-comedy";
        genre.Name = "Office comedy";
        genre.BuiltIn = true;

        var saved = await service.SaveAsync(genre, "admin-1", creating: true, CancellationToken.None);

        Assert.False(saved.BuiltIn);
        Assert.Equal("admin-1", saved.UpdatedBy);
        Assert.Contains(await service.ListAsync(enabledOnly: true, CancellationToken.None), g => g.Id == "office-comedy");

        var again = await Assert.ThrowsAsync<StoryGenreException>(() => service.SaveAsync(genre, "admin-1", creating: true, CancellationToken.None));
        Assert.Equal("genre-exists", again.Code);

        Assert.Null(await service.DeleteOrResetAsync("office-comedy", "admin-1", CancellationToken.None));
        Assert.False(repo.Rows.ContainsKey("office-comedy"));
    }

    [Fact]
    public async Task Deleting_a_built_in_genre_puts_the_shipped_one_back()
    {
        var repo = new InMemoryGenres();
        var service = Service(repo);
        var funny = (await service.GetAsync("funny", CancellationToken.None))!;
        funny.Enabled = false;
        funny.Tags = ["changed"];
        await service.SaveAsync(funny, "admin-1", creating: false, CancellationToken.None);
        Assert.DoesNotContain(await service.ListAsync(enabledOnly: true, CancellationToken.None), g => g.Id == "funny");

        var back = await service.DeleteOrResetAsync("funny", "admin-1", CancellationToken.None);

        Assert.NotNull(back);
        Assert.True(repo.Rows["funny"].Enabled);
        Assert.Equal(StoryGenres.Funny().Tags, repo.Rows["funny"].Tags);
    }

    [Fact]
    public async Task A_genre_that_does_not_exist_cannot_be_updated_or_deleted()
    {
        var service = Service(new InMemoryGenres());
        var genre = StoryGenres.Funny();
        genre.Id = "nobody-made-this";

        Assert.True((await Assert.ThrowsAsync<StoryGenreException>(() =>
            service.SaveAsync(genre, null, creating: false, CancellationToken.None))).NotFound);
        Assert.True((await Assert.ThrowsAsync<StoryGenreException>(() =>
            service.DeleteOrResetAsync("nobody-made-this", null, CancellationToken.None))).NotFound);
    }
}
