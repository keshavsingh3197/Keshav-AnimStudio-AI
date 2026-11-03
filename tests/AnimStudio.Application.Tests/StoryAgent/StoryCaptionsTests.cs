using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>The story's subtitles as SRT files, and sending them to a YouTube video made from the story.</summary>
public sealed class StoryCaptionsTests
{
    private const string User = "user-1";

    /// <summary>A finished Hindi run whose project was built: each scene ten seconds after the one before.</summary>
    private static StoryRun Built(string language = "hi")
    {
        var run = StoryTestData.Run(StoryRunStatus.Completed, User, withScript: true);
        run.Brief.Language = language;
        run.ProjectId = "p1";
        run.RenderJobId = "job-1";
        run.SceneStarts = [.. run.Script!.Scenes.Select((_, i) => i * 10.0)];
        run.TotalSeconds = run.Script.Scenes.Count * 10.0;
        foreach (var scene in run.Script.Scenes) scene.EstimatedSeconds = 10.45;
        return run;
    }

    // ----------------------------------------------------------------------------------------------- the tracks

    [Fact]
    public void There_are_no_subtitles_before_the_project_is_built()
    {
        var run = StoryTestData.Run(StoryRunStatus.ScriptReady, User, withScript: true);

        Assert.Empty(StoryCaptions.Tracks(run));
        Assert.Empty(StoryCaptions.Build(run, "hi"));
    }

    [Fact]
    public void A_hindi_story_offers_its_narration_and_the_english_meaning()
    {
        var tracks = StoryCaptions.Tracks(Built());

        Assert.Equal(["hi", "en"], tracks.Select(t => t.Language));
        Assert.Equal(["Hindi", "English"], tracks.Select(t => t.Label));
        Assert.Equal([StoryCaptions.Narration, StoryCaptions.Translation], tracks.Select(t => t.Source));
        Assert.All(tracks, t => Assert.True(t.Cues >= 6));
    }

    [Fact]
    public void An_english_story_offers_english_only_and_nothing_else_is_made_up()
    {
        var run = Built("en");

        Assert.Equal(["en"], StoryCaptions.Tracks(run).Select(t => t.Language));
        Assert.Equal(StoryCaptions.Narration, StoryCaptions.Tracks(run)[0].Source);
        Assert.Empty(StoryCaptions.Build(run, "hi"));
        Assert.Empty(StoryCaptions.Build(Built(), "fr"));
    }

    [Fact]
    public void Each_scene_speaks_inside_its_own_place_on_the_timeline_and_cues_never_overlap()
    {
        var run = Built();

        foreach (var language in new[] { "hi", "en" })
        {
            var cues = StoryCaptions.Build(run, language);
            for (var i = 1; i < cues.Count; i++) Assert.True(cues[i].Start >= cues[i - 1].End, $"{language} cue {i} overlaps the one before");
            Assert.All(cues, c => Assert.True(c.End > c.Start));
        }

        // Scene 3 (index 2) starts at 20s and is followed by scene 4 at 30s: its words sit between the two.
        var third = run.Script!.Scenes[2];
        var english = StoryCaptions.Build(run, "en").Where(c => third.English!.Contains(c.Text, StringComparison.Ordinal)).ToList();
        Assert.NotEmpty(english);
        Assert.All(english, c => Assert.InRange(c.Start, 20.0, 30.0));
        Assert.All(english, c => Assert.InRange(c.End, 20.0, 30.0));
    }

    [Fact]
    public void The_srt_is_numbered_blocks_with_comma_millisecond_times()
    {
        var srt = StoryCaptions.ToSrt([new StoryCaptionCue(1.5, 4.25, "पहली पंक्ति"), new StoryCaptionCue(3661.004, 3662, "Second")]);

        Assert.Equal("1\n00:00:01,500 --> 00:00:04,250\nपहली पंक्ति\n\n2\n01:01:01,004 --> 01:01:02,000\nSecond\n\n", srt);
    }

    // ----------------------------------------------------------------------------------------------- sending to YouTube

    private sealed class World
    {
        public InMemoryStoryRuns Runs { get; } = new();
        public FakeStoryPublishing Publishing { get; } = new();
        public StoryCaptionPublisher Publisher { get; }

        public World()
        {
            var clock = new StoryClock(new DateTimeOffset(StorySamples.Now));
            var service = new StoryRunService(Runs, new FakeQueue(), new FakePrompts(), new InMemoryObjectStore(), new InMemoryVoices(),
                new StubRegistry(text: 1), new FakeMusic(), new FakeCapabilities(), new FakeFinisher(),
                new StaticOptionsMonitor<StoryAgentOptions>(new StoryAgentOptions()), clock, NullLogger<StoryRunService>.Instance);
            Publisher = new StoryCaptionPublisher(service, Publishing, clock, NullLogger<StoryCaptionPublisher>.Instance);
        }

        public StoryRun Seed(StoryRun run)
        {
            Runs.Seed(run);
            return run;
        }
    }

    [Fact]
    public async Task Both_languages_go_to_the_video_and_are_remembered_so_a_second_send_skips_them()
    {
        var world = new World();
        var run = world.Seed(Built());
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("p1"));

        var (first, results) = await world.Publisher.SendAsync(User, run.Id, "abcdefghijk", null, CancellationToken.None);

        Assert.Equal(["added", "added"], results.Select(r => r.Outcome));
        Assert.Equal(["hi", "en"], world.Publishing.Captions.Select(c => c.Language));
        Assert.All(world.Publishing.Captions, c => Assert.Equal(("UCchannel", "abcdefghijk"), (c.ChannelId, c.VideoId)));
        Assert.StartsWith("1\n00:00:0", world.Publishing.Captions[0].Srt);
        Assert.Equal(2, first.CaptionUploads.Count);

        var (_, again) = await world.Publisher.SendAsync(User, run.Id, "abcdefghijk", ["hi"], CancellationToken.None);

        Assert.Equal("already", Assert.Single(again).Outcome);
        Assert.Equal(2, world.Publishing.Captions.Count);
    }

    [Fact]
    public async Task One_language_refused_by_youtube_does_not_stop_the_other()
    {
        var world = new World();
        var run = world.Seed(Built());
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("p1"));
        world.Publishing.Refuse["en"] = "youtube-caption-invalid";

        var (after, results) = await world.Publisher.SendAsync(User, run.Id, "abcdefghijk", null, CancellationToken.None);

        Assert.Equal(["added", "failed"], results.Select(r => r.Outcome));
        Assert.Equal("hi", Assert.Single(after.CaptionUploads).Language);
    }

    [Fact]
    public async Task Only_a_video_made_from_this_storys_project_can_be_given_its_subtitles()
    {
        var world = new World();
        var run = world.Seed(Built());
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("another-project", videoId: "zzzzzzzzzzz"));

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Publisher.SendAsync(User, run.Id, "zzzzzzzzzzz", null, CancellationToken.None));

        Assert.Equal("video-not-found", error.Code);
        Assert.Empty(world.Publishing.Captions);
    }

    [Fact]
    public async Task A_channel_without_the_permission_is_asked_to_reconnect_before_anything_is_sent()
    {
        var world = new World();
        var run = world.Seed(Built());
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("p1", canCaption: false));

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Publisher.SendAsync(User, run.Id, "abcdefghijk", null, CancellationToken.None));

        Assert.Equal("youtube-caption-scope", error.Code);
        Assert.Empty(world.Publishing.Captions);
    }

    [Theory]
    [InlineData("fr")]
    [InlineData("hi", "de")]
    public async Task Only_the_languages_the_story_has_can_be_asked_for(params string[] languages)
    {
        var world = new World();
        var run = world.Seed(Built());
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("p1"));

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Publisher.SendAsync(User, run.Id, "abcdefghijk", languages, CancellationToken.None));

        Assert.Equal("language-invalid", error.Code);
    }

    [Fact]
    public async Task Someone_elses_story_is_not_found()
    {
        var world = new World();
        var run = Built();
        run.UserId = "someone-else";
        world.Seed(run);
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("p1"));

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Publisher.SendAsync(User, run.Id, "abcdefghijk", null, CancellationToken.None));

        Assert.Equal("story-not-found", error.Code);
        Assert.Empty(world.Publishing.Captions);
    }
}
