using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>Stories told over several videos, and the pace the narration is brought to.</summary>
public sealed class StorySeriesTests
{
    private const string User = "user-1";

    private sealed class World
    {
        public InMemoryStoryRuns Runs { get; } = new();
        public FakeQueue Queue { get; } = new();
        public FakeAi Ai { get; } = new();
        public FakePrompts Prompts { get; } = new();
        public StoryAgentOptions Options { get; } = new();
        public StoryClock Clock { get; } = new(new DateTimeOffset(StorySamples.Now));
        public StoryRunService Stories { get; }
        public StorySeriesService Series { get; }

        public World()
        {
            Stories = new StoryRunService(Runs, Queue, Prompts, new InMemoryObjectStore(), new InMemoryVoices(),
                new StubRegistry(text: 1, image: 0, speech: 1), new FakeMusic(), new FakeCapabilities(), new FakeFinisher(),
                new StaticOptionsMonitor<StoryAgentOptions>(Options), Clock, NullLogger<StoryRunService>.Instance);
            Series = new StorySeriesService(Runs, Stories, Ai, Prompts, Clock, NullLogger<StorySeriesService>.Instance);
        }

        public StoryRun Finished(string userId = User)
        {
            var run = StoryTestData.Run(StoryRunStatus.Completed, userId, withScript: true);
            run.Options.SpeechRate = 1.1;
            run.Options.VoiceId = "hf_alpha";
            Runs.Seed(run);
            return run;
        }
    }

    private const string IdeasJson =
        """
        {"ideas": [
          {"title": "दीपावली - भाग 2: लक्ष्मी पूजा", "notes": "The family prepares for the evening puja.", "hook": "Why is Lakshmi worshipped at night?"},
          {"title": "x", "notes": "too short a title is dropped"},
          {"title": "The return to Ayodhya", "notes": "Rama comes home."}
        ]}
        """;

    // ------------------------------------------------------------------------------------------------ continuing

    [Fact]
    public async Task Continuing_a_story_starts_part_two_with_the_story_so_far_and_the_same_choices()
    {
        var world = new World();
        var first = world.Finished();

        var second = await world.Series.ContinueAsync(User, first.Id, new StoryContinuation(), CancellationToken.None);

        Assert.NotNull(second.Series);
        Assert.Equal(2, second.Series!.Part);
        Assert.Equal(first.Id, second.Series.PreviousRunId);
        Assert.Equal(first.Title, second.Series.Name);
        Assert.Contains("Part 1", second.Series.StorySoFar);
        Assert.False(string.IsNullOrWhiteSpace(second.Series.LastScene));
        Assert.EndsWith("भाग 2", second.Title);
        Assert.Equal(first.Brief.Language, second.Brief.Language);
        Assert.Equal(1.1, second.Options.SpeechRate);
        Assert.Equal("hf_alpha", second.Options.VoiceId);
        Assert.NotSame(first.Options, second.Options);
        Assert.Contains(second.Id, world.Queue.Enqueued);

        // The first part now belongs to the same series, and knows what came after it.
        var saved = world.Runs.Read(first.Id)!;
        Assert.Equal(second.Series.Id, saved.Series!.Id);
        Assert.Equal(1, saved.Series.Part);
        Assert.Equal(second.Id, saved.NextRunId);
    }

    [Fact]
    public async Task A_story_is_not_continued_twice_unless_another_take_is_asked_for()
    {
        var world = new World();
        var first = world.Finished();
        await world.Series.ContinueAsync(User, first.Id, new StoryContinuation(), CancellationToken.None);

        var refused = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Series.ContinueAsync(User, first.Id, new StoryContinuation(), CancellationToken.None));
        Assert.Equal("already-continued", refused.Code);

        var again = await world.Series.ContinueAsync(User, first.Id, new StoryContinuation(Again: true), CancellationToken.None);
        Assert.Equal(2, again.Series!.Part);
    }

    [Fact]
    public async Task Someone_elses_story_cannot_be_continued_and_a_story_being_made_must_finish_first()
    {
        var world = new World();
        var theirs = world.Finished("someone-else");
        var notFound = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Series.ContinueAsync(User, theirs.Id, new StoryContinuation(), CancellationToken.None));
        Assert.Equal(StoryRunErrorKind.NotFound, notFound.Kind);

        var busy = StoryTestData.Run(StoryRunStatus.Building, User, withScript: true);
        world.Runs.Seed(busy);
        var refused = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Series.ContinueAsync(User, busy.Id, new StoryContinuation(), CancellationToken.None));
        Assert.Equal("story-busy", refused.Code);
    }

    [Fact]
    public async Task A_later_part_tells_the_writer_where_the_story_stopped_and_who_is_in_it()
    {
        var world = new World();
        var first = world.Finished();
        first.Script!.Cast.Add(new StoryCastMember { Name = "राम", Gender = "male" });
        world.Runs.Seed(first);

        var second = await world.Series.ContinueAsync(User, first.Id, new StoryContinuation(Notes: "Focus on the lamps."), CancellationToken.None);
        var notes = StoryScriptPrompt.NotesFor(second);

        Assert.Contains("Part 2", notes);
        Assert.Contains("The story so far", notes);
        Assert.Contains("How the last part ended", notes);
        Assert.Contains("राम", notes);
        Assert.Contains("Focus on the lamps.", notes);

        // A story that is not a later part gets its notes as they are.
        Assert.Equal("(none)", StoryScriptPrompt.NotesFor(StoryTestData.Run(StoryRunStatus.Completed, User, withScript: true)));
    }

    [Fact]
    public async Task The_story_so_far_grows_with_each_part_and_stays_within_its_length()
    {
        var world = new World();
        var run = world.Finished();
        for (var part = 2; part <= 12; part++)
        {
            run = await world.Series.ContinueAsync(User, run.Id, new StoryContinuation(), CancellationToken.None);
            Assert.Equal(part, run.Series!.Part);

            // Make the new part "finished" so it can be continued in turn.
            run.Status = StoryRunStatus.Completed;
            run.Script = StoryTestData.Run(StoryRunStatus.Completed, User, withScript: true).Script;
            world.Runs.Seed(run);
        }

        Assert.Contains("Part 11", run.Series!.StorySoFar);
        Assert.True(run.Series.StorySoFar!.Length <= StorySeriesService.MaxStorySoFarChars);

        var all = await world.Series.ListAsync(User, CancellationToken.None);
        var series = Assert.Single(all);
        Assert.Equal(12, series.Parts.Count);
        Assert.Equal(Enumerable.Range(1, 12), series.Parts.Select(p => p.Series!.Part));
    }

    // ------------------------------------------------------------------------------------------------ ideas

    [Fact]
    public async Task Ideas_are_asked_for_once_kept_and_asked_again_only_when_new_ones_are_wanted()
    {
        var world = new World();
        world.Ai.Text = _ => FakeAi.TextOk(IdeasJson);
        var first = world.Finished();

        var run = await world.Series.SuggestAsync(User, first.Id, fresh: false, CancellationToken.None);
        Assert.Equal(2, run.NextParts.Count);
        Assert.Equal("stub-text", run.NextPartsBy);
        Assert.Equal("Why is Lakshmi worshipped at night?", run.NextParts[0].Hook);

        await world.Series.SuggestAsync(User, first.Id, fresh: false, CancellationToken.None);
        Assert.Single(world.Ai.TextCalls);

        await world.Series.SuggestAsync(User, first.Id, fresh: true, CancellationToken.None);
        Assert.Equal(2, world.Ai.TextCalls.Count);
        Assert.True(world.Ai.TextCalls[1].BypassCache);
        Assert.Equal(BuiltInPrompts.StoryNextParts, world.Prompts.Rendered[0].Key);
    }

    [Fact]
    public async Task Without_a_text_model_the_ideas_come_from_the_script_and_the_series_still_goes_on()
    {
        var world = new World();
        var first = world.Finished();

        var run = await world.Series.SuggestAsync(User, first.Id, fresh: false, CancellationToken.None);

        Assert.Equal("built-in", run.NextPartsBy);
        Assert.NotEmpty(run.NextParts);

        var second = await world.Series.ContinueAsync(User, first.Id, new StoryContinuation(IdeaIndex: 0), CancellationToken.None);
        Assert.Equal(run.NextParts[0].Title, second.Title);
        Assert.Contains(run.NextParts[0].Notes, second.Brief.Notes);
    }

    [Fact]
    public void Ideas_that_are_not_usable_are_dropped_and_the_rest_are_cleaned()
    {
        Assert.Empty(StorySeriesService.ParseIdeas("not json"));
        Assert.Empty(StorySeriesService.ParseIdeas("""{"ideas": "none"}"""));

        var ideas = StorySeriesService.ParseIdeas(IdeasJson);
        Assert.Equal(["दीपावली - भाग 2: लक्ष्मी पूजा", "The return to Ayodhya"], ideas.Select(i => i.Title));
    }

    // ------------------------------------------------------------------------------------------------ by itself

    [Fact]
    public async Task A_finished_part_set_to_go_on_starts_the_next_by_itself_up_to_the_part_asked_for()
    {
        var world = new World();
        var first = world.Finished();
        await world.Series.SetAutoContinueAsync(User, first.Id, upTo: 3, CancellationToken.None);

        await world.Series.ContinueIfDueAsync(first.Id, CancellationToken.None);
        var second = world.Runs.Read(world.Runs.Read(first.Id)!.NextRunId!)!;
        Assert.Equal(2, second.Series!.Part);
        Assert.Equal(3, second.Series.AutoContinueTo);

        // Running it again does nothing: the part has its next one.
        await world.Series.ContinueIfDueAsync(first.Id, CancellationToken.None);
        Assert.Equal(2, world.Runs.All().Count);

        // Part 3 is the last one asked for, so it carries no instruction to go on.
        second.Status = StoryRunStatus.Completed;
        second.Script = StoryTestData.Run(StoryRunStatus.Completed, User, withScript: true).Script;
        world.Runs.Seed(second);
        await world.Series.ContinueIfDueAsync(second.Id, CancellationToken.None);
        var third = world.Runs.Read(world.Runs.Read(second.Id)!.NextRunId!)!;
        Assert.Equal(3, third.Series!.Part);
        Assert.Null(third.Series.AutoContinueTo);
    }

    [Fact]
    public async Task A_part_that_did_not_finish_does_not_start_the_next()
    {
        var world = new World();
        var first = world.Finished();
        await world.Series.SetAutoContinueAsync(User, first.Id, upTo: 5, CancellationToken.None);
        var failed = world.Runs.Read(first.Id)!;
        failed.Status = StoryRunStatus.Failed;
        world.Runs.Seed(failed);

        await world.Series.ContinueIfDueAsync(first.Id, CancellationToken.None);

        Assert.Single(world.Runs.All());
    }

    // ------------------------------------------------------------------------------------------------ pace

    private static StoryScript Spoken(int scenes, int wordsPerScene, double secondsPerScene)
    {
        var words = string.Join(' ', Enumerable.Repeat("शब्द", wordsPerScene));
        return new StoryScript
        {
            Scenes = [.. Enumerable.Range(1, scenes).Select(n => new StoryScene
            {
                Number = n,
                Narration = words,
                AudioSeconds = secondsPerScene + StoryPacing.LeadSeconds + StoryPacing.TailSeconds
            })]
        };
    }

    [Fact]
    public void A_slow_voice_is_sped_up_a_fast_one_slowed_and_a_comfortable_one_left_alone()
    {
        // 20 words in 10 seconds is 120 a minute: slow for Hindi's 140.
        var slow = StoryNarrationPace.Measure(Spoken(5, 20, 10), "hi", forKids: false, StorySamples.Now)!;
        Assert.Equal("slow", slow.Verdict);
        Assert.Equal(120, slow.WordsPerMinute, 1);
        Assert.Equal(1.15, slow.SuggestedSpeed, 3);

        // 30 words in 10 seconds is 180 a minute: fast.
        var fast = StoryNarrationPace.Measure(Spoken(5, 30, 10), "hi", forKids: false, StorySamples.Now)!;
        Assert.Equal("fast", fast.Verdict);
        Assert.Equal(0.85, fast.SuggestedSpeed, 3);

        // 23 words in 10 seconds is 138 a minute: within a few percent, left as it is.
        var good = StoryNarrationPace.Measure(Spoken(5, 23, 10), "hi", forKids: false, StorySamples.Now)!;
        Assert.Equal("good", good.Verdict);
        Assert.Equal(1.0, good.SuggestedSpeed);
    }

    [Fact]
    public void A_short_is_told_briskly_unless_the_person_picked_a_pace()
    {
        Assert.Equal(StoryNarrationPace.BriskTarget, StoryNarrationPace.TargetFor("hi", forKids: false, StoryFormat.Vertical));
        Assert.Equal(StoryNarrationPace.HindiTarget, StoryNarrationPace.TargetFor("hi", forKids: false, StoryFormat.Wide));
        Assert.Equal(StoryNarrationPace.KidsTarget, StoryNarrationPace.TargetFor("hi", forKids: true, StoryFormat.Vertical));
        Assert.Equal(StoryNarrationPace.HindiTarget,
            StoryNarrationPace.TargetFor("hi", forKids: false, StoryFormat.Vertical, StoryPaceStyle.Storyteller));
        Assert.True(StoryNarrationPace.TargetFor("en", forKids: false, StoryFormat.Vertical) > StoryNarrationPace.BriskTarget);

        // 23 words in 10 seconds (138 a minute) is fine for a long video, slow for a Short.
        var shortPace = StoryNarrationPace.Measure(Spoken(5, 23, 10), "hi", forKids: false, StorySamples.Now, StoryFormat.Vertical)!;
        Assert.Equal("slow", shortPace.Verdict);
        Assert.Equal(StoryNarrationPace.BriskTarget, shortPace.TargetWordsPerMinute);
        Assert.Equal(1.2, shortPace.SuggestedSpeed, 3);
    }

    [Fact]
    public void Childrens_stories_are_paced_more_gently_and_the_change_is_never_extreme()
    {
        Assert.Equal(StoryNarrationPace.KidsTarget, StoryNarrationPace.TargetFor("hi", forKids: true));
        Assert.Equal(StoryNarrationPace.EnglishTarget, StoryNarrationPace.TargetFor("en", forKids: false));

        // 5 words in 10 seconds is very slow; it is sped up only as far as still sounds natural.
        var crawl = StoryNarrationPace.Measure(Spoken(5, 5, 10), "hi", forKids: false, StorySamples.Now)!;
        Assert.Equal(StoryNarrationPace.MaxSpeed, crawl.SuggestedSpeed, 3);

        // Too little speech to judge.
        Assert.Null(StoryNarrationPace.Measure(Spoken(1, 10, 3), "hi", forKids: false, StorySamples.Now));
    }

    [Theory]
    [InlineData("एक दो तीन।", 3)]
    [InlineData("  one,   two - three  ", 3)]
    [InlineData("", 0)]
    [InlineData("… — …", 0)]
    public void Words_are_counted_as_a_listener_hears_them(string text, int words) =>
        Assert.Equal(words, StoryNarrationPace.CountWords(text));

    [Fact]
    public async Task Choosing_a_speed_by_hand_stops_the_app_choosing_it()
    {
        var world = new World();
        var run = world.Finished();
        run.Options.AutoPace = true;
        run.Options.VideoSpeed = 1.15;
        run.Pace = new StoryPace { SuggestedSpeed = 1.15, Applied = true, Verdict = "slow" };
        run.RenderJobId = "job-1";
        run.Stage(StoryStageIds.Render).Status = StoryStageStatus.Completed;
        world.Runs.Seed(run);

        var changed = await world.Stories.ChangeSpeedAsync(User, run.Id, 1.0, CancellationToken.None);

        Assert.False(changed.Options.AutoPace);
        Assert.False(changed.Pace!.Applied);
        Assert.Equal(1.0, changed.Options.VideoSpeed);
    }
}
