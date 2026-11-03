using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Music;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class MusicStageTests
{
    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    private static (MusicStage Stage, FakeMusic Music, InMemoryObjectStore Store) Make()
    {
        var music = new FakeMusic();
        var store = new InMemoryObjectStore();
        return (new MusicStage(music, store, NullLogger<MusicStage>.Instance), music, store);
    }

    private static StoryRun BuildingRun()
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Options.Music = true;
        foreach (var scene in run.Script!.Scenes) scene.AudioSeconds = 20;
        return run;
    }

    private static MusicSearchPage Page(params MusicTrack[] tracks) => new(tracks, 1, false);

    [Fact]
    public async Task Music_that_is_switched_off_is_skipped_and_any_track_from_an_earlier_try_is_removed()
    {
        var (stage, music, store) = Make();
        var run = BuildingRun();
        run.Options.Music = false;
        var key = StoryObjectKeys.Music(run.Id);
        await store.SaveAsync(key, new MemoryStream(FakeMusic.Mp3Bytes()), "audio/mpeg");
        run.Music = new StoryMusicPick { Title = "Old", StorageKey = key };

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-off", outcome.Code);
        Assert.Null(run.Music);
        Assert.Empty(store.Keys);
        Assert.Empty(music.Searches);
    }

    [Fact]
    public async Task Without_a_catalogue_key_the_video_is_made_without_music_and_it_says_why()
    {
        var (stage, music, _) = Make();
        music.IsConfigured = false;
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-not-configured", outcome.Code);
        Assert.Contains(run.Warnings, w => w.Contains("Jamendo", StringComparison.Ordinal));
        Assert.Empty(music.Searches);
    }

    [Fact]
    public async Task The_first_track_that_may_go_under_a_monetized_video_is_downloaded_credited_and_kept()
    {
        var (stage, music, store) = Make();
        music.Search = _ => Page(
            FakeMusic.Track("1", "https://creativecommons.org/licenses/by-nc/3.0/"),
            FakeMusic.Track("2", downloadable: false),
            FakeMusic.Track("3", "https://creativecommons.org/licenses/by-nd/3.0/"),
            FakeMusic.Track("4", "https://creativecommons.org/licenses/by-sa/3.0/"),
            FakeMusic.Track("5"),
            FakeMusic.Track("6"));
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(["5"], music.Downloads);

        var pick = run.Music!;
        Assert.Equal("jamendo", pick.Provider);
        Assert.Equal("5", pick.TrackId);
        Assert.Equal("Track 5", pick.Title);
        Assert.Equal("An Artist", pick.Artist);
        Assert.Equal("CC BY", pick.LicenseCode);
        Assert.Equal("AttributionOnly", pick.LicenseClass);
        Assert.Contains("Track 5", pick.Attribution);
        Assert.Contains("An Artist", pick.Attribution);
        Assert.Equal(StoryObjectKeys.Music(run.Id), pick.StorageKey);
        Assert.Equal([StoryObjectKeys.Music(run.Id)], store.Keys);
    }

    [Fact]
    public async Task The_search_is_for_instrumental_music_for_a_monetized_video_as_long_as_the_narration_in_the_persons_words_first()
    {
        var (stage, music, _) = Make();
        music.Search = _ => Page(FakeMusic.Track("1"));
        var run = BuildingRun();
        run.Options.MusicQuery = "  veena morning raga  ";
        run.Script!.MusicQuery = "sitar flute devotional";

        await stage.RunAsync(Context(run), CancellationToken.None);

        var search = music.Searches[0];
        Assert.Equal("veena morning raga", search.Text);
        Assert.True(search.InstrumentalOnly);
        Assert.False(search.IncludeNonCommercial);
        Assert.Equal(MusicSort.BestMatch, search.Sort);
        Assert.Equal(1, search.Page);
        Assert.Equal(run.Script.Scenes.Count * 20, search.MinSeconds);
    }

    [Theory]
    [InlineData(null, "script words", "script words")]
    [InlineData(null, null, "sitar tanpura devotional")]
    public async Task With_no_words_from_the_person_the_scripts_suggestion_then_the_topics_is_used(string? option, string? script, string expected)
    {
        var (stage, music, _) = Make();
        var run = BuildingRun();
        run.Options.MusicQuery = option;
        run.Script!.MusicQuery = script;
        run.Research = new StoryResearch { Topics = [new StoryTopicMatch { TopicId = "diwali", Name = "Diwali" }] };

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(expected, music.Searches[0].Text);
    }

    [Fact]
    public async Task Without_any_topic_either_a_plain_devotional_search_is_used()
    {
        var (stage, music, _) = Make();
        var run = BuildingRun();
        run.Script!.MusicQuery = null;
        run.Research = new StoryResearch();

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal("devotional sitar flute", music.Searches[0].Text);
    }

    [Fact]
    public async Task A_search_that_finds_nothing_is_relaxed_first_to_any_length_then_to_the_first_word()
    {
        var (stage, music, _) = Make();
        music.Search = q => q is { Text: "sitar", MinSeconds: null } ? Page(FakeMusic.Track("9")) : Page();
        var run = BuildingRun();
        run.Script!.MusicQuery = "sitar flute devotional";

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(
            new[] { ("sitar flute devotional", true), ("sitar flute devotional", false), ("sitar", true), ("sitar", false) },
            music.Searches.Select(s => (s.Text!, s.MinSeconds is not null)).ToArray());
        Assert.Equal(["9"], music.Downloads);
    }

    [Fact]
    public async Task When_nothing_suitable_exists_the_video_goes_without_music_and_says_so()
    {
        var (stage, music, _) = Make();
        music.Search = _ => Page(FakeMusic.Track("1", "https://creativecommons.org/licenses/by-nc/3.0/"));
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-none", outcome.Code);
        Assert.Null(run.Music);
        Assert.Contains(run.Warnings, w => w.Contains("no background music", StringComparison.OrdinalIgnoreCase));
        Assert.Empty(music.Downloads);
    }

    [Fact]
    public async Task A_track_that_cannot_be_downloaded_never_fails_the_run()
    {
        var (stage, music, store) = Make();
        music.Search = _ => Page(FakeMusic.Track("1"));
        music.Download = _ => throw new MusicCatalogException("music-not-downloadable", "The artist doesn't allow this track to be downloaded.");
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-not-downloadable", outcome.Code);
        Assert.Null(run.Music);
        Assert.Empty(store.Keys);
        Assert.Contains(run.Warnings, w => w.Contains("allow this track", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_catalogue_that_cannot_be_reached_never_fails_the_run()
    {
        var (stage, music, _) = Make();
        music.Search = _ => throw new HttpRequestException("offline");
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-unreachable", outcome.Code);
    }

    [Fact]
    public async Task A_download_that_is_not_an_mp3_is_not_kept()
    {
        var (stage, music, store) = Make();
        music.Search = _ => Page(FakeMusic.Track("1"));
        music.Download = _ => [.. "RIFF"u8.ToArray(), .. new byte[4], .. "WAVE"u8.ToArray(), .. new byte[100]];
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("music-format", outcome.Code);
        Assert.Empty(store.Keys);
    }

    [Fact]
    public async Task A_track_chosen_earlier_is_reused_without_searching_again()
    {
        var (stage, music, store) = Make();
        music.Search = _ => Page(FakeMusic.Track("1"));
        var run = BuildingRun();
        await stage.RunAsync(Context(run), CancellationToken.None);
        var searches = music.Searches.Count;

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(searches, music.Searches.Count);
        Assert.Single(music.Downloads);
        Assert.Contains("Track 1", outcome.Message);
        Assert.Single(store.Keys);
    }

    [Fact]
    public async Task A_track_whose_file_was_lost_is_chosen_again()
    {
        var (stage, music, store) = Make();
        music.Search = _ => Page(FakeMusic.Track("1"));
        var run = BuildingRun();
        await stage.RunAsync(Context(run), CancellationToken.None);
        await store.DeleteAsync(run.Music!.StorageKey);

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(2, music.Downloads.Count);
        Assert.Single(store.Keys);
    }
}
