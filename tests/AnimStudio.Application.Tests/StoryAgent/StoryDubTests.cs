using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>The story told again in its other language - Hindi for India, English for the world - as a second audio track.</summary>
public sealed class StoryDubTests
{
    private sealed class NoVoiceRenderer : IStudioVoiceRenderer
    {
        public bool IsAvailable => false;
        public bool CanReVoice => false;
        public bool CanPrepareReference => false;

        public Task<StudioVoiceOutput> RenderAsync(Stream recording, StudioVoiceContainer container,
            IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<string, string> samples, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct) => throw new NotSupportedException();

        public Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed record World(NarrationStage Stage, FakeAi Ai, InMemoryObjectStore Store, FakePrompts Prompts);

    private static World Build(bool translator = true)
    {
        var ai = new FakeAi { Speech = _ => FakeAi.SpeechOk(FakeFinisher.Wav(1.0)) };
        var store = new InMemoryObjectStore();
        var voices = new InMemoryVoices();
        var renderer = new NoVoiceRenderer();
        var tuning = new MyVoiceTuning(new StubRegistry(), [], renderer, voices,
            new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<MyVoiceTuning>.Instance);
        var narrator = new StoryNarrator(ai, voices, renderer, tuning, store, new FakeFinisher(), NullLogger<StoryNarrator>.Instance);
        var prompts = new FakePrompts();
        var dubTranslator = translator
            ? new StoryDubTranslator(ai, prompts, new StubRegistry(text: 1), NullLogger<StoryDubTranslator>.Instance)
            : null;
        return new World(new NarrationStage(narrator, store, NullLogger<NarrationStage>.Instance, null, dubTranslator), ai, store, prompts);
    }

    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    private static StoryRun DubbedRun(string language = "hi")
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Brief.Language = language;
        run.Options.Narration = StoryNarrationMode.Stock;
        run.Options.Dub = true;
        return run;
    }

    // ----------------------------------------------------------------------------------------------- narration

    [Fact]
    public async Task A_hindi_story_is_dubbed_in_english_from_each_scenes_english_meaning()
    {
        var world = Build();
        var run = DubbedRun();
        var scenes = run.Script!.Scenes;

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Contains("English dub is spoken", outcome.Message);
        // The story's own voice first, then the dub's: the English meaning in the English default voice.
        var dubCalls = world.Ai.SpeechCalls.Skip(scenes.Count).ToList();
        Assert.Equal(scenes.Select(s => s.English), dubCalls.Select(c => c.Text));
        Assert.All(dubCalls, c => Assert.Equal(StoryNarrator.DefaultEnglishVoice, c.VoiceId));
        Assert.All(scenes, s =>
        {
            Assert.True(StoryObjectKeys.Owns(run.Id, s.DubAudioKey));
            Assert.Contains("/dub/", s.DubAudioKey);
            Assert.True(s.DubAudioSeconds > 0);
            Assert.NotEqual(s.AudioKey, s.DubAudioKey);
        });
        Assert.True(StoryDub.IsSpoken(run));
        Assert.Empty(world.Ai.TextCalls);
        // Every dub file is the run's, so deleting the run takes it with it.
        Assert.All(scenes, s => Assert.Contains(s.DubAudioKey!, StoryObjectKeys.All(run)));
    }

    [Fact]
    public async Task Narrating_again_keeps_the_dub_whose_words_did_not_change()
    {
        var world = Build();
        var run = DubbedRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var calls = world.Ai.SpeechCalls.Count;

        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(calls, world.Ai.SpeechCalls.Count);
    }

    [Fact]
    public async Task Turning_the_dub_off_deletes_its_voice()
    {
        var world = Build();
        var run = DubbedRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var keys = run.Script!.Scenes.Select(s => s.DubAudioKey!).ToList();

        run.Options.Dub = false;
        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(run.Script.Scenes, s => Assert.Null(s.DubAudioKey));
        Assert.All(keys, k => Assert.DoesNotContain(k, world.Store.Keys));
        Assert.False(StoryDub.IsSpoken(run));
    }

    [Fact]
    public async Task An_english_story_is_translated_into_hindi_and_dubbed()
    {
        var world = Build();
        var run = DubbedRun("en");
        var numbers = run.Script!.Scenes.Select(s => s.Number).ToList();
        world.Ai.Text = _ => FakeAi.TextOk(
            "{\"scenes\": [" + string.Join(",", numbers.Select(n => $"{{\"number\": {n}, \"text\": \"दृश्य {n}\"}}")) + "]}");

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(BuiltInPrompts.StoryDubTranslate, world.Prompts.Rendered.Single().Key);
        Assert.Equal("Hindi", world.Prompts.Rendered[0].Variables["language"]);
        Assert.All(run.Script.Scenes, s => Assert.Equal($"दृश्य {s.Number}", s.Hindi));
        var dubCalls = world.Ai.SpeechCalls.Skip(numbers.Count).ToList();
        Assert.All(dubCalls, c => Assert.Equal(StoryNarrator.DefaultHindiVoice, c.VoiceId));
        Assert.True(StoryDub.IsSpoken(run));
    }

    [Fact]
    public async Task Without_a_translation_the_dub_is_left_out_and_the_story_still_stands()
    {
        var world = Build(translator: false);
        var run = DubbedRun("en");

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.All(run.Script!.Scenes, s => Assert.True(s.AudioSeconds > 0));
        Assert.All(run.Script.Scenes, s => Assert.Null(s.DubAudioKey));
        Assert.Contains(run.Warnings, w => w.Contains("Hindi dub was not made", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_dub_the_speech_engine_refuses_is_a_warning_not_a_failed_story()
    {
        var world = Build();
        var run = DubbedRun();
        var spoken = 0;
        var scenes = run.Script!.Scenes.Count;
        world.Ai.Speech = _ => ++spoken <= scenes
            ? FakeAi.SpeechOk(FakeFinisher.Wav(1.0))
            : AiOutcome<AiSpeechResult>.Failed("content-blocked", "refused");

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.False(StoryDub.IsSpoken(run));
        Assert.Contains(run.Warnings, w => w.StartsWith("The English dub was not finished", StringComparison.Ordinal));
    }

    // ----------------------------------------------------------------------------------------------- voices and timing

    [Fact]
    public void The_dub_keeps_a_gemini_narrator_but_takes_the_languages_own_voice_elsewhere()
    {
        var gemini = new NarrationPlan(StoryNarrationMode.Stock, "Puck", KnownAiProviders.GeminiTts, 1.1, null, false, "model-x", "warm");
        var dub = StoryNarrator.PlanDub(gemini, "en");
        Assert.Equal("Puck", dub.VoiceId);
        Assert.Equal(KnownAiProviders.GeminiTts, dub.Engine);
        Assert.Equal(1.1, dub.Rate);
        Assert.Equal("warm", dub.Style);
        Assert.Null(dub.Cast);

        var kokoro = new NarrationPlan(StoryNarrationMode.Stock, "hf_alpha", "kokoro", 1.0, null, false);
        Assert.Equal(StoryNarrator.DefaultEnglishVoice, StoryNarrator.PlanDub(kokoro, "en").VoiceId);
        Assert.Equal(StoryNarrator.DefaultHindiVoice, StoryNarrator.PlanDub(kokoro with { VoiceId = "am_adam" }, "hi").VoiceId);
    }

    [Fact]
    public void The_persons_own_voice_made_on_this_machine_is_never_used_for_the_dub()
    {
        var profile = new VoiceProfile { Id = "vp_1", UserId = "user-1", Name = "Mine", BaseVoiceId = "hf_alpha", StorageKey = "k" };
        var mine = new NarrationPlan(StoryNarrationMode.MyVoice, "hf_alpha", null, 1.0, profile, false);

        var dub = StoryNarrator.PlanDub(mine, "en");

        Assert.Equal(StoryNarrationMode.Stock, dub.Mode);
        Assert.Null(dub.Profile);
        Assert.Null(dub.Engine);
        Assert.Equal(StoryNarrator.DefaultEnglishVoice, dub.VoiceId);
    }

    [Fact]
    public void Each_scene_runs_as_long_as_the_longer_of_its_two_voices()
    {
        Assert.Equal(7.5, StoryDub.LongerVoice(6.0, 7.5));
        Assert.Equal(6.0, StoryDub.LongerVoice(6.0, 4.0));
        Assert.Equal(6.0, StoryDub.LongerVoice(6.0, null));
        Assert.Null(StoryDub.LongerVoice(null, 5.0));
        Assert.Equal(7.5, AssembleStage.SceneDuration(9.0, StoryDub.LongerVoice(6.0, 7.5), null));
    }

    [Fact]
    public void The_dubs_script_says_the_dubs_words_with_the_dubs_voice_and_no_character_lines()
    {
        var run = DubbedRun();
        foreach (var scene in run.Script!.Scenes)
        {
            scene.DubAudioKey = $"story-runs/{run.Id}/dub/s{scene.Number:00}-en-x.wav";
            scene.DubAudioSeconds = 4.2;
            scene.DubPauses = [new StoryPause { Start = 1, End = 1.4 }];
            scene.Lines = [new StoryLine { Speaker = "Krishna", Text = "..." }];
        }

        var dub = StoryDub.ScriptFor(run.Script, "en");

        Assert.Equal("en", dub.Language);
        Assert.Equal(run.Script.TitleEnglish, dub.Title);
        Assert.Equal(run.Script.Scenes.Select(s => s.English), dub.Scenes.Select(s => s.Narration));
        Assert.All(dub.Scenes, s =>
        {
            Assert.Empty(s.Lines);
            Assert.Equal(4.2, s.AudioSeconds);
            Assert.Single(s.Pauses);
        });
        // The story's own script is untouched.
        Assert.All(run.Script.Scenes, s => Assert.Single(s.Lines));
    }

    // ----------------------------------------------------------------------------------------------- the translator's answer

    [Fact]
    public void Only_the_scenes_asked_for_are_taken_from_the_models_answer()
    {
        var answers = StoryDubTranslator.Parse(
            """{"scenes": [{"number": 1, "text": "एक"}, {"number": "2", "text": "दो"}, {"number": 9, "text": "नौ"}, {"number": 3}]}""",
            new HashSet<int> { 1, 2, 3 });

        Assert.Equal(new Dictionary<int, string> { [1] = "एक" }, answers);
        Assert.Empty(StoryDubTranslator.Parse("not json", new HashSet<int> { 1 }));
    }

    // ----------------------------------------------------------------------------------------------- subtitles

    [Fact]
    public void An_english_story_with_its_hindi_offers_hindi_subtitles_timed_to_the_dub()
    {
        var run = DubbedRun("en");
        run.SceneStarts = [.. run.Script!.Scenes.Select((_, i) => i * 10.0)];
        run.TotalSeconds = run.Script.Scenes.Count * 10.0;
        foreach (var scene in run.Script.Scenes)
        {
            scene.AudioKey = $"story-runs/{run.Id}/narration/s{scene.Number:00}-a.wav";
            scene.AudioSeconds = 6.0;
            scene.Hindi = "पहला वाक्य। दूसरा वाक्य।";
            scene.DubAudioKey = $"story-runs/{run.Id}/dub/s{scene.Number:00}-hi-b.wav";
            scene.DubAudioSeconds = 9.0;
        }

        var tracks = StoryCaptions.Tracks(run);
        Assert.Equal(["en", "hi"], tracks.Select(t => t.Language));
        Assert.Equal(StoryCaptions.Translation, tracks[1].Source);

        // The Hindi follows the dub's nine seconds, not the English voice's six.
        var first = StoryCaptions.Build(run, "hi").Where(c => c.Start < 10).ToList();
        Assert.True(first[^1].End > 6.0);
    }

    // ----------------------------------------------------------------------------------------------- the upload

    [Fact]
    public void The_upload_says_which_language_the_video_is_in_and_only_hindi_or_english()
    {
        static YouTubeVideoMetadata Details(string? language) => new()
        {
            Title = "Diwali", Description = "d", Tags = ["a"], CategoryId = "22", Privacy = "public", MadeForKids = false, Language = language
        };

        Assert.Equal("hi", YouTubePublishValidator.ValidateDetails(Details(" HI ")).Normalized!.Language);
        Assert.Null(YouTubePublishValidator.ValidateDetails(Details(null)).Normalized!.Language);
        Assert.Contains(YouTubePublishValidator.ValidateDetails(Details("fr")).Errors, e => e.Code == "language-invalid");
    }
}
