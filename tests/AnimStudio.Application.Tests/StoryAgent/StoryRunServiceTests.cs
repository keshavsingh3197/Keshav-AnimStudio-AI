using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryRunServiceTests
{
    private const string User = "user-1";
    private const string ProfileId = "vp_0123456789abcdef0123456789abcdef";

    private sealed class World
    {
        public StoryRunService Service { get; }
        public InMemoryStoryRuns Runs { get; } = new();
        public FakeQueue Queue { get; } = new();
        public InMemoryObjectStore Store { get; } = new();
        public InMemoryVoices Voices { get; } = new();
        public FakePrompts Prompts { get; } = new();
        public FakeMusic Music { get; } = new();
        public FakeFinisher Finisher { get; } = new();
        public StoryAgentOptions Options { get; } = new();
        public StoryClock Clock { get; } = new(new DateTimeOffset(StorySamples.Now));

        public World(int text = 1, int image = 0, int speech = 1, bool renderer = true)
        {
            Service = new StoryRunService(Runs, Queue, Prompts, Store, Voices, new StubRegistry(text, image, speech), Music,
                renderer ? new FakeCapabilities() : new FakeCapabilities(RenderFeature.Renderer), Finisher,
                new StaticOptionsMonitor<StoryAgentOptions>(Options), Clock, NullLogger<StoryRunService>.Instance);
        }

        public async Task<StoryRun> Seed(StoryRunStatus status, bool withScript = true, string userId = User)
        {
            var run = StoryTestData.Run(status, userId, withScript);
            Runs.Seed(run);
            await Task.CompletedTask;
            return run;
        }

        /// <summary>Gives every scene a stored picture and narration, and returns the keys.</summary>
        public async Task<List<string>> Stock(StoryRun run)
        {
            var keys = new List<string>();
            foreach (var scene in run.Script!.Scenes)
            {
                scene.ImageKey = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
                scene.ImageSource = "upload";
                scene.AudioKey = StoryObjectKeys.Narration(run.Id, scene.Number, "abc123");
                await Store.SaveAsync(scene.ImageKey, new MemoryStream(StoryTestData.Png(scene.Number)), "image/png");
                await Store.SaveAsync(scene.AudioKey, new MemoryStream(FakeFinisher.Wav(0.5)), "audio/wav");
                keys.Add(scene.ImageKey);
                keys.Add(scene.AudioKey);
            }

            Runs.Seed(run);
            return keys;
        }
    }

    private static StoryBrief Brief(string title = "Why we light diyas", Action<StoryBrief>? tweak = null)
    {
        var brief = new StoryBrief { Title = title };
        tweak?.Invoke(brief);
        return brief;
    }

    // ----------------------------------------------------------------------------------------------- creating

    [Fact]
    public async Task A_title_alone_starts_a_run_that_researches_first_and_is_handed_to_the_worker()
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User, Brief(), null, CancellationToken.None);

        Assert.StartsWith("sr_", run.Id);
        Assert.Equal(User, run.UserId);
        Assert.Equal("Why we light diyas", run.Title);
        Assert.Equal(StoryRunStatus.Researching, run.Status);
        Assert.Equal(StoryStageIds.All, run.Stages.Select(s => s.Id));
        Assert.All(run.Stages, s => Assert.Equal(StoryStageStatus.Pending, s.Status));
        Assert.Equal("hi", run.Brief.Language);
        Assert.Equal(150, run.Brief.TargetSeconds);
        Assert.Equal(StoryWriterMode.Auto, run.Brief.Writer);
        Assert.Equal(StorySamples.Now, run.CreatedAtUtc);
        Assert.Equal([run.Id], world.Queue.Enqueued);

        var saved = world.Runs.Read(run.Id)!;
        Assert.Equal(run.Title, saved.Title);
        Assert.Equal(StoryRunStatus.Researching, saved.Status);
        Assert.Equal(StoryGenres.DefaultId, saved.Brief.GenreId);
        Assert.Equal(StoryGenreMode.Scripture, saved.Brief.Mode);
    }

    [Fact]
    public async Task A_genre_is_copied_onto_the_run_and_fills_in_what_the_person_left_at_its_default()
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User, Brief(tweak: b => { b.GenreId = "funny"; b.Language = ""; }),
            new StoryBuildOptions { ImageStyle = "my own style" }, CancellationToken.None);

        Assert.Equal("funny", run.Brief.GenreId);
        Assert.Equal(StoryGenreMode.Creative, run.Brief.Mode);
        Assert.Equal("funny", run.Genre!.Id);
        Assert.Equal(StoryGenres.Funny().DefaultLanguage, run.Brief.Language);
        Assert.Equal("my own style", run.Options.ImageStyle);
        Assert.Equal(StoryLookStyle.Lively, run.Options.LookStyle);
    }

    [Fact]
    public async Task An_unknown_genre_or_a_pack_from_another_genre_is_refused()
    {
        var world = new World();

        var unknown = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.CreateAsync(User, Brief(tweak: b => b.GenreId = "no-such-genre"), null, CancellationToken.None));
        Assert.Equal("genre-invalid", unknown.Code);

        var pack = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(tweak: b =>
        {
            b.GenreId = "funny";
            b.Writer = StoryWriterMode.BuiltIn;
            b.PackId = StoryPacks.All[0].Id;
        }), null, CancellationToken.None));
        Assert.Equal("pack-invalid", pack.Code);
    }

    [Fact]
    public async Task The_title_is_cleaned_to_one_line_and_bounded()
    {
        var world = new World();

        var cleaned = await world.Service.CreateAsync(User, Brief("  दीपावली\r\n\t क्यों   मनाते  हैं  "), null, CancellationToken.None);
        var longer = await world.Service.CreateAsync(User, Brief(new string('क', 400)), null, CancellationToken.None);

        Assert.Equal("दीपावली क्यों मनाते हैं", cleaned.Title);
        Assert.Equal(StoryRunService.MaxTitleChars, longer.Title.Length);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ab")]
    [InlineData("\r\n\t")]
    public async Task A_title_with_nothing_in_it_is_refused(string title)
    {
        var world = new World();

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(title), null, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Invalid, error.Kind);
        Assert.Equal("title-required", error.Code);
        Assert.Equal("title", error.Field);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task Notes_keep_their_line_breaks_and_are_bounded()
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User, Brief(tweak: b => b.Notes = "Cover Dhanteras.\nThen Lakshmi puja.\u0000"), null, CancellationToken.None);
        var big = await world.Service.CreateAsync(User, Brief(tweak: b => b.Notes = new string('x', 5_000)), null, CancellationToken.None);

        Assert.Contains("\n", run.Brief.Notes);
        Assert.False(run.Brief.Notes!.Contains('\u0000'));
        Assert.Equal(StoryRunService.MaxNotesChars, big.Brief.Notes!.Length);
    }

    [Theory]
    [InlineData("EN", 150, "en", 150)]
    [InlineData("fr", 150, "hi", 150)]
    [InlineData(null, 10, "hi", 45)]
    [InlineData("hi", 5_000, "hi", 600)]
    [InlineData("hi", 0, "hi", 150)]
    [InlineData("hi", -20, "hi", 150)]
    public async Task Language_and_length_are_brought_into_range(string? language, int seconds, string expectedLanguage, int expectedSeconds)
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User, Brief(tweak: b => { b.Language = language!; b.TargetSeconds = seconds; }), null, CancellationToken.None);

        Assert.Equal(expectedLanguage, run.Brief.Language);
        Assert.Equal(expectedSeconds, run.Brief.TargetSeconds);
    }

    [Fact]
    public async Task A_built_in_story_takes_its_language_length_and_title_from_the_pack()
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User,
            new StoryBrief { Title = "", Writer = StoryWriterMode.BuiltIn, PackId = "DIWALI", Language = "en", TargetSeconds = 60 }, null, CancellationToken.None);

        var pack = StoryPacks.Find("diwali")!;
        Assert.Equal(pack.Title, run.Title);
        Assert.Equal("diwali", run.Brief.PackId);
        Assert.Equal(pack.Language, run.Brief.Language);
        Assert.Equal(pack.TargetSeconds, run.Brief.TargetSeconds);
    }

    [Fact]
    public async Task An_unknown_built_in_story_or_writer_is_refused()
    {
        var world = new World();

        var pack = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User,
            new StoryBrief { Title = "x story", Writer = StoryWriterMode.BuiltIn, PackId = "nope" }, null, CancellationToken.None));
        var writer = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User,
            Brief(tweak: b => b.Writer = (StoryWriterMode)9), null, CancellationToken.None));

        Assert.Equal("pack-invalid", pack.Code);
        Assert.Equal("brief-invalid", writer.Code);
    }

    [Fact]
    public async Task Build_choices_are_checked_and_brought_into_range()
    {
        var world = new World();
        world.Voices.Items[ProfileId] = new VoiceProfile { Id = ProfileId, UserId = User, Name = "Me", BaseVoiceId = "hf_alpha", StorageKey = "k" };

        var run = await world.Service.CreateAsync(User, Brief(), new StoryBuildOptions
        {
            Narration = StoryNarrationMode.MyVoice,
            VoiceProfileId = ProfileId,
            VoiceId = " hf_alpha ",
            SpeechEngine = " kokoro ",
            SpeechRate = 9,
            ClosestToMyVoice = true,
            MusicVolume = 5,
            ImageStyle = "  watercolour \r\n soft  ",
            MusicQuery = "  veena  "
        }, CancellationToken.None);

        var o = run.Options;
        Assert.Equal(StoryNarrationMode.MyVoice, o.Narration);
        Assert.Equal(ProfileId, o.VoiceProfileId);
        Assert.Equal("hf_alpha", o.VoiceId);
        Assert.Equal("kokoro", o.SpeechEngine);
        Assert.Equal(2.0, o.SpeechRate);
        Assert.True(o.ClosestToMyVoice);
        Assert.Equal(1.0, o.MusicVolume);
        Assert.Equal("watercolour soft", o.ImageStyle);
        Assert.Equal("veena", o.MusicQuery);
    }

    [Fact]
    public async Task Closest_to_my_voice_means_nothing_without_my_voice_and_nan_settings_fall_back()
    {
        var world = new World();

        var run = await world.Service.CreateAsync(User, Brief(), new StoryBuildOptions
        {
            Narration = StoryNarrationMode.Stock, ClosestToMyVoice = true, SpeechRate = double.NaN, MusicVolume = double.NaN
        }, CancellationToken.None);

        Assert.False(run.Options.ClosestToMyVoice);
        Assert.Equal(1.0, run.Options.SpeechRate);
        Assert.Equal(0.2, run.Options.MusicVolume);
    }

    [Theory]
    [InlineData("../x", null, "voice-invalid")]
    [InlineData("a b", null, "voice-invalid")]
    [InlineData("af_vp0123456789abcdef0123456789abcdef_tuned", null, "voice-invalid")]
    [InlineData(null, "kokoro; drop", "engine-invalid")]
    public async Task A_voice_or_engine_that_cannot_be_one_is_refused(string? voice, string? engine, string code)
    {
        var world = new World();

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(),
            new StoryBuildOptions { VoiceId = voice, SpeechEngine = engine }, CancellationToken.None));

        Assert.Equal(code, error.Code);
        Assert.Equal(StoryRunErrorKind.Invalid, error.Kind);
    }

    [Theory]
    [InlineData(null, "gemini-3.8-flash-tts")]
    [InlineData("gemini-tts", "../../files")]
    [InlineData("gemini-tts", "gemini-3.8-flash")]
    public async Task A_speech_model_the_engine_does_not_offer_is_refused(string? engine, string model)
    {
        var world = new World();

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(),
            new StoryBuildOptions { SpeechEngine = engine, SpeechModel = model }, CancellationToken.None));

        Assert.Equal("model-invalid", error.Code);
    }

    [Fact]
    public async Task A_gemini_model_and_style_are_kept_and_a_style_for_another_engine_is_dropped()
    {
        var world = new World();

        var gemini = await world.Service.CreateAsync(User, Brief(), new StoryBuildOptions
        {
            SpeechEngine = "gemini-tts", SpeechModel = " gemini-3.8-flash-lite-tts ", SpeechStyle = "  Calm \r\n and warm  "
        }, CancellationToken.None);
        var kokoro = await world.Service.CreateAsync(User, Brief(), new StoryBuildOptions
        {
            SpeechEngine = "kokoro", SpeechStyle = "Calm"
        }, CancellationToken.None);

        Assert.Equal("gemini-3.8-flash-lite-tts", gemini.Options.SpeechModel);
        Assert.Equal("Calm and warm", gemini.Options.SpeechStyle);
        Assert.Null(kokoro.Options.SpeechStyle);
    }

    [Fact]
    public async Task My_voice_keeps_a_gemini_style_only_when_the_voice_was_sent_to_gemini()
    {
        var world = new World();
        world.Voices.Items[ProfileId] = new VoiceProfile
        {
            Id = ProfileId, UserId = User, Name = "Mine", BaseVoiceId = "hm_omega", StorageKey = "k",
            GoogleVoiceId = "voice_r3pl1ca", GoogleVoiceProviderId = "gemini-tts"
        };
        var options = new StoryBuildOptions
        {
            Narration = StoryNarrationMode.MyVoice, VoiceProfileId = ProfileId,
            SpeechEngine = "gemini-tts", SpeechModel = "gemini-3.8-flash-tts", SpeechStyle = "Calm"
        };

        var onGoogle = await world.Service.CreateAsync(User, Brief(), options, CancellationToken.None);
        world.Voices.Items[ProfileId].GoogleVoiceId = null;
        var local = await world.Service.CreateAsync(User, Brief("Another"), options, CancellationToken.None);

        Assert.Equal("Calm", onGoogle.Options.SpeechStyle);
        Assert.Equal("gemini-3.8-flash-tts", onGoogle.Options.SpeechModel);
        Assert.Null(local.Options.SpeechStyle);
        Assert.Null(local.Options.SpeechModel);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("vp_nope")]
    [InlineData(ProfileId)]
    public async Task My_voice_needs_one_of_the_persons_own_voices_and_the_refusal_does_not_say_whose(string? id)
    {
        var world = new World();
        if (id == ProfileId)
            world.Voices.Items[ProfileId] = new VoiceProfile { Id = ProfileId, UserId = "someone-else", Name = "Theirs", BaseVoiceId = "hf_alpha", StorageKey = "k" };

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(),
            new StoryBuildOptions { Narration = StoryNarrationMode.MyVoice, VoiceProfileId = id }, CancellationToken.None));

        Assert.Equal("my-voice-invalid", error.Code);
        Assert.Equal("Pick one of your voices.", error.Message);
    }

    [Fact]
    public async Task A_person_with_the_limit_of_stories_already_being_made_must_wait_but_others_and_finished_stories_do_not_count()
    {
        var world = new World();
        world.Options.MaxActiveRunsPerUser = 2;
        await world.Seed(StoryRunStatus.Building);
        await world.Seed(StoryRunStatus.Completed);
        await world.Seed(StoryRunStatus.Researching, userId: "other");
        await world.Seed(StoryRunStatus.ScriptReady);

        var second = await world.Service.CreateAsync(User, Brief("A second story"), null, CancellationToken.None);
        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief("A third story"), null, CancellationToken.None));
        var other = await world.Service.CreateAsync("other", Brief("Another person"), null, CancellationToken.None);

        Assert.NotNull(second);
        Assert.NotNull(other);
        Assert.Equal(StoryRunErrorKind.Limit, error.Kind);
        Assert.Equal("too-many-runs", error.Code);
        Assert.Equal(2, world.Queue.Enqueued.Count);
    }

    [Fact]
    public async Task A_switched_off_agent_does_not_exist()
    {
        var world = new World();
        world.Options.Enabled = false;

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CreateAsync(User, Brief(), null, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.NotFound, error.Kind);
        Assert.Equal("story-agent-off", error.Code);
    }

    [Fact]
    public async Task The_oldest_failed_or_stopped_runs_past_the_limit_are_deleted_with_their_files_and_finished_or_working_ones_never_are()
    {
        var world = new World();
        world.Options.MaxSavedRunsPerUser = 1;
        world.Options.MaxActiveRunsPerUser = 9;

        var finished = await world.Seed(StoryRunStatus.Completed);
        finished.UpdatedAtUtc = StorySamples.Now.AddDays(-50);
        var finishedKeys = await world.Stock(finished);
        var failed = await world.Seed(StoryRunStatus.Failed);
        failed.UpdatedAtUtc = StorySamples.Now.AddDays(-30);
        var failedKeys = await world.Stock(failed);
        var stopped = await world.Seed(StoryRunStatus.Cancelled);
        stopped.UpdatedAtUtc = StorySamples.Now.AddDays(-20);
        world.Runs.Seed(stopped);
        var working = await world.Seed(StoryRunStatus.Building);
        working.UpdatedAtUtc = StorySamples.Now.AddDays(-40);
        world.Runs.Seed(working);

        var fresh = await world.Service.CreateAsync(User, Brief(), null, CancellationToken.None);

        Assert.Null(world.Runs.Read(failed.Id));
        Assert.Null(world.Runs.Read(stopped.Id));
        Assert.All(failedKeys, key => Assert.DoesNotContain(key, world.Store.Keys));
        // A finished story has a video and may be on YouTube: it stays, with its files, however old.
        Assert.NotNull(world.Runs.Read(finished.Id));
        Assert.All(finishedKeys, key => Assert.Contains(key, world.Store.Keys));
        Assert.NotNull(world.Runs.Read(working.Id));
        Assert.NotNull(world.Runs.Read(fresh.Id));
    }

    // ----------------------------------------------------------------------------------------------- reading

    [Fact]
    public async Task Someone_elses_run_is_not_found_whatever_is_asked_and_is_not_touched()
    {
        var world = new World();
        var theirs = await world.Seed(StoryRunStatus.ScriptReady, userId: "someone-else");
        await world.Stock(theirs);
        var before = world.Store.Keys.Count;
        var id = theirs.Id;
        var token = CancellationToken.None;
        var edit = new StoryScriptEdit("t", null, null, null, [new StorySceneEdit(1, "h", "text here", null, null, null, null, null, null)]);

        Func<Task>[] asks =
        [
            () => world.Service.GetAsync(User, id, token),
            () => world.Service.ManualPromptAsync(User, id, token),
            () => world.Service.SubmitScriptAsync(User, id, StorySamples.ReplyJson, token),
            () => world.Service.UpdateScriptAsync(User, id, edit, token),
            () => world.Service.ApproveScriptAsync(User, id, token),
            () => world.Service.RecordCaptionsAsync(User, id, [new StoryCaptionUpload { VideoId = "abcdefghijk", Language = "hi" }], token),
            () => world.Service.AttachImageAsync(User, id, 1, StoryTestData.Png(), "x.png", token),
            () => world.Service.RemoveImageAsync(User, id, 1, token),
            () => world.Service.RewriteAsync(User, id, null, token),
            () => world.Service.BuildAsync(User, id, null, token),
            () => world.Service.RetryAsync(User, id, token),
            () => world.Service.CancelAsync(User, id, token),
            () => world.Service.DeleteAsync(User, id, token),
        ];

        foreach (var ask in asks)
        {
            var error = await Assert.ThrowsAsync<StoryRunException>(ask);
            Assert.Equal(StoryRunErrorKind.NotFound, error.Kind);
            Assert.Equal("story-not-found", error.Code);
        }

        Assert.Equal(StoryRunStatus.ScriptReady, world.Runs.Read(id)!.Status);
        Assert.Equal(before, world.Store.Keys.Count);
        Assert.Empty(world.Queue.Enqueued);
        Assert.Empty(world.Queue.CancelAsked);
    }

    [Fact]
    public async Task A_missing_or_blank_id_is_not_found_too()
    {
        var world = new World();

        foreach (var id in new[] { "sr_missing", "", "  " })
        {
            var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.GetAsync(User, id, CancellationToken.None));
            Assert.Equal("story-not-found", error.Code);
        }
    }

    [Fact]
    public async Task The_list_is_the_persons_own_newest_first_and_limited()
    {
        var world = new World();
        world.Options.MaxListedRuns = 2;
        var a = await world.Seed(StoryRunStatus.Completed);
        a.UpdatedAtUtc = StorySamples.Now.AddDays(-3);
        world.Runs.Seed(a);
        var b = await world.Seed(StoryRunStatus.Completed);
        b.UpdatedAtUtc = StorySamples.Now.AddDays(-1);
        world.Runs.Seed(b);
        var c = await world.Seed(StoryRunStatus.Completed);
        c.UpdatedAtUtc = StorySamples.Now.AddDays(-2);
        world.Runs.Seed(c);
        await world.Seed(StoryRunStatus.Completed, userId: "other");

        var list = await world.Service.ListAsync(User, CancellationToken.None);

        Assert.Equal([b.Id, c.Id], list.Select(r => r.Id));
    }

    [Fact]
    public async Task The_capabilities_say_what_this_server_can_do_for_this_person()
    {
        var world = new World(text: 1, image: 0, speech: 1, renderer: false);
        world.Music.IsConfigured = false;
        world.Voices.Items[ProfileId] = new VoiceProfile { Id = ProfileId, UserId = User, Name = "Me", BaseVoiceId = "hf_alpha", StorageKey = "k" };
        world.Voices.Items["vp_other"] = new VoiceProfile { Id = "vp_other", UserId = "someone-else", Name = "Theirs", BaseVoiceId = "hf_alpha", StorageKey = "k" };
        world.Options.MaxActiveRunsPerUser = 3;

        var caps = await world.Service.DescribeAsync(User, CancellationToken.None);

        Assert.True(caps.Enabled);
        Assert.True(caps.TextModel);
        Assert.True(caps.SpeechEngine);
        Assert.False(caps.ImageEngine);
        Assert.False(caps.Music);
        Assert.False(caps.Renderer);
        Assert.True(caps.AudioFinishing);
        Assert.Contains(caps.Packs, p => p.Id == "diwali");
        Assert.Equal([ProfileId], caps.MyVoices.Select(v => v.Id));
        Assert.Equal(3, caps.MaxActiveRuns);
    }

    // ----------------------------------------------------------------------------------------------- the prompt and the paste

    [Fact]
    public async Task The_manual_prompt_is_the_instructions_what_the_research_found_and_the_shape_of_the_answer()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        world.Runs.Seed(run);

        var prompt = await world.Service.ManualPromptAsync(User, run.Id, CancellationToken.None);

        Assert.Contains("SYSTEM RULES", prompt);
        Assert.Contains("WRITE:", prompt);
        Assert.Contains("Reply with ONE JSON object", prompt);
        Assert.Equal(BuiltInPrompts.StoryScript, world.Prompts.Rendered.Single().Key);
    }

    [Fact]
    public async Task The_prompt_waits_for_the_search_to_finish()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Researching, withScript: false);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.ManualPromptAsync(User, run.Id, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, error.Kind);
        Assert.Equal("research-not-ready", error.Code);
    }

    [Fact]
    public async Task A_prompt_template_that_cannot_render_is_reported_without_its_details()
    {
        var world = new World();
        world.Prompts.Throws = new PromptTemplateException("template-invalid", "slot {{secret}} undefined");
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        world.Runs.Seed(run);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.ManualPromptAsync(User, run.Id, CancellationToken.None));

        Assert.Equal("script-prompt-invalid", error.Code);
        Assert.DoesNotContain("secret", error.Message);
    }

    [Fact]
    public async Task A_pasted_reply_becomes_the_script_even_when_wrapped_in_a_chat_and_waits_for_approval()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        world.Runs.Seed(run);
        var reply = $"Here is your story!\n```json\n{StorySamples.ReplyJson}\n```\nHope that helps.";

        var result = await world.Service.SubmitScriptAsync(User, run.Id, reply, CancellationToken.None);

        Assert.Equal(StoryRunStatus.ScriptReady, result.Status);
        Assert.NotNull(result.Script);
        Assert.Equal("pasted reply", result.Script.WrittenBy);
        Assert.Equal(StoryStageStatus.Completed, result.Stage(StoryStageIds.Script).Status);
        Assert.Equal(100, result.Stage(StoryStageIds.Script).Progress);
        Assert.NotEmpty(result.ScriptWarnings);
        Assert.Equal(StoryRunStatus.ScriptReady, world.Runs.Read(run.Id)!.Status);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task With_auto_approve_a_pasted_script_goes_straight_on_to_building()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        run.Options.AutoApprove = true;
        run.Options.Narration = StoryNarrationMode.None;
        run.Options.RenderWhenReady = false;
        world.Runs.Seed(run);

        var result = await world.Service.SubmitScriptAsync(User, run.Id, StorySamples.ReplyJson, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, result.Status);
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Theory]
    [InlineData("", "script-empty")]
    [InlineData("I could not write that.", "script-not-json")]
    [InlineData("[1, 2, 3]", "script-not-object")]
    [InlineData("""{"title": "x"}""", "script-no-scenes")]
    public async Task A_reply_that_is_not_a_script_is_refused_with_the_parsers_reason_and_the_run_is_unchanged(string reply, string code)
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.SubmitScriptAsync(User, run.Id, reply, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Invalid, error.Kind);
        Assert.Equal(code, error.Code);
        Assert.Equal("reply", error.Field);
        Assert.Equal(StoryRunStatus.AwaitingScript, world.Runs.Read(run.Id)!.Status);
        Assert.Null(world.Runs.Read(run.Id)!.Script);
    }

    [Fact]
    public async Task A_script_is_only_accepted_from_a_run_that_is_waiting_for_one_and_an_enormous_reply_is_refused_early()
    {
        var world = new World();
        var building = await world.Seed(StoryRunStatus.Building);
        var waiting = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);

        var busy = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.SubmitScriptAsync(User, building.Id, StorySamples.ReplyJson, CancellationToken.None));
        var huge = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.SubmitScriptAsync(User, waiting.Id, new string('x', StoryRunService.MaxScriptReplyChars + 1), CancellationToken.None));

        Assert.Equal("script-not-accepted", busy.Code);
        Assert.Equal(StoryRunErrorKind.Conflict, busy.Kind);
        Assert.Equal("script-too-long", huge.Code);
    }

    [Fact]
    public async Task A_pasted_script_replaces_the_old_one_and_deletes_what_was_made_for_it()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        var keys = await world.Stock(run);

        var result = await world.Service.SubmitScriptAsync(User, run.Id, StorySamples.ReplyJson, CancellationToken.None);

        Assert.Equal(StoryRunStatus.ScriptReady, result.Status);
        Assert.All(keys, key => Assert.DoesNotContain(key, world.Store.Keys));
        Assert.All(result.Script!.Scenes, s => Assert.Null(s.ImageKey));
    }

    // ----------------------------------------------------------------------------------------------- editing

    private static StorySceneEdit Edit(StoryScene scene, Func<StorySceneEdit, StorySceneEdit>? change = null)
    {
        var edit = new StorySceneEdit(scene.Number, scene.Headline, scene.Narration, scene.English, scene.Basis.ToString().ToLowerInvariant(),
            [.. scene.Sources.Select(s => new StorySourceEdit(s.TextId, s.Ref, s.Note))], scene.ImagePrompt, scene.ImageKeywords, scene.Mood);
        return change is null ? edit : change(edit);
    }

    private static StoryScriptEdit Script(StoryRun run, params StorySceneEdit[] scenes) =>
        new(run.Script!.Title, run.Script.TitleEnglish, run.Script.Summary, run.Script.MusicQuery, scenes);

    [Fact]
    public async Task Edits_are_kept_the_script_is_checked_again_and_what_was_made_for_a_scene_stays_with_it()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Stock(run);
        var scenes = run.Script!.Scenes;
        var picture = scenes[1].ImageKey;
        var audio = scenes[1].AudioKey;

        var result = await world.Service.UpdateScriptAsync(User, run.Id, Script(run,
            [.. scenes.Select((s, i) => Edit(s, e => i == 1 ? e with { Headline = "नया शीर्षक", Narration = "एक बिल्कुल नई पंक्ति।" } : e))]),
            CancellationToken.None);

        var edited = result.Script!.Scenes[1];
        Assert.Equal("नया शीर्षक", edited.Headline);
        Assert.Equal("एक बिल्कुल नई पंक्ति।", edited.Narration);
        Assert.Equal(picture, edited.ImageKey);
        Assert.Equal(audio, edited.AudioKey);
        Assert.Equal(Enumerable.Range(1, scenes.Count), result.Script.Scenes.Select(s => s.Number));
        Assert.EndsWith("(edited)", result.Script.WrittenBy);
        Assert.Equal(StoryPacing.EstimateSeconds("एक बिल्कुल नई पंक्ति।"), edited.EstimatedSeconds);
        Assert.Equal("एक बिल्कुल नई पंक्ति।", world.Runs.Read(run.Id)!.Script!.Scenes[1].Narration);
    }

    [Fact]
    public async Task Editing_twice_does_not_stack_the_edited_label()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);

        var once = await world.Service.UpdateScriptAsync(User, run.Id, Script(run, [.. run.Script!.Scenes.Select(s => Edit(s))]), CancellationToken.None);
        var twice = await world.Service.UpdateScriptAsync(User, run.Id, Script(once, [.. once.Script!.Scenes.Select(s => Edit(s))]), CancellationToken.None);

        Assert.Equal("test (edited)", twice.Script!.WrittenBy);
    }

    [Fact]
    public async Task A_scene_taken_out_loses_its_files_and_one_added_has_none_and_the_numbers_close_up()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Stock(run);
        var scenes = run.Script!.Scenes;
        var removed = scenes[2];
        var removedKeys = new[] { removed.ImageKey!, removed.AudioKey! };

        var result = await world.Service.UpdateScriptAsync(User, run.Id, Script(run,
            [.. scenes.Where(s => s.Number != removed.Number).Select(s => Edit(s)),
             new StorySceneEdit(0, "नया दृश्य", "यह एक नया दृश्य है।", null, "reflection", null, "a lamp", null, null)]),
            CancellationToken.None);

        Assert.Equal(scenes.Count, result.Script!.Scenes.Count);
        Assert.Equal(Enumerable.Range(1, scenes.Count), result.Script.Scenes.Select(s => s.Number));
        Assert.All(removedKeys, key => Assert.DoesNotContain(key, world.Store.Keys));
        var added = result.Script.Scenes[^1];
        Assert.Equal("नया दृश्य", added.Headline);
        Assert.Null(added.ImageKey);
        Assert.Null(added.AudioKey);
        Assert.Equal(StoryBasis.Reflection, added.Basis);
        Assert.All(result.Script.Scenes.Take(scenes.Count - 1), s => Assert.NotNull(s.ImageKey));
    }

    [Fact]
    public async Task A_scene_number_the_script_never_had_or_one_used_twice_inherits_nothing_it_should_not()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Stock(run);
        var first = run.Script!.Scenes[0];
        var firstImage = first.ImageKey;

        var result = await world.Service.UpdateScriptAsync(User, run.Id, Script(run,
            Edit(first),
            Edit(first, e => e with { Narration = "यह उसी क्रमांक की दूसरी प्रति है।" }),
            Edit(first, e => e with { Number = 99, Narration = "यह ऐसा क्रमांक है जो था ही नहीं।" })),
            CancellationToken.None);

        Assert.Equal(firstImage, result.Script!.Scenes[0].ImageKey);
        Assert.Null(result.Script.Scenes[1].ImageKey);
        Assert.Null(result.Script.Scenes[2].ImageKey);
    }

    [Fact]
    public async Task Basis_sources_and_text_in_an_edit_are_cleaned_and_bounded()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        var scene = run.Script!.Scenes[0];
        var sources = Enumerable.Range(1, 12).Select(i => new StorySourceEdit(i == 3 ? "  " : "bhagavata-purana", "8.8", "note")).ToArray();

        var result = await world.Service.UpdateScriptAsync(User, run.Id, Script(run,
            Edit(scene, e => e with { Basis = "TRADITION", Sources = sources, Mood = "  GLOWING ", Headline = new string('अ', 500) }),
            Edit(run.Script.Scenes[1], e => e with { Basis = "something odd" })),
            CancellationToken.None);

        var first = result.Script!.Scenes[0];
        Assert.Equal(StoryBasis.Tradition, first.Basis);
        Assert.Equal(7, first.Sources.Count);
        Assert.All(first.Sources, s => Assert.NotEqual(string.Empty, s.TextId));
        Assert.Equal("glowing", first.Mood);
        Assert.Equal(160, first.Headline.Length);
        Assert.Equal(StoryBasis.Text, result.Script.Scenes[1].Basis);
    }

    [Fact]
    public async Task An_edit_that_leaves_no_script_is_refused_and_changes_nothing()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Stock(run);
        var before = world.Store.Keys.Count;

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.UpdateScriptAsync(User, run.Id,
            Script(run, new StorySceneEdit(1, "h", "   ", null, null, null, null, null, null)), CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Invalid, error.Kind);
        Assert.Equal("script-too-short", error.Code);
        Assert.Equal(before, world.Store.Keys.Count);
        Assert.Equal(run.Script!.Scenes.Count, world.Runs.Read(run.Id)!.Script!.Scenes.Count);
    }

    [Theory]
    [InlineData(StoryRunStatus.Building)]
    [InlineData(StoryRunStatus.Researching)]
    [InlineData(StoryRunStatus.WritingScript)]
    public async Task The_script_cannot_be_edited_while_it_is_being_worked_on(StoryRunStatus status)
    {
        var world = new World();
        var run = await world.Seed(status);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.UpdateScriptAsync(User, run.Id,
            Script(run, [.. run.Script!.Scenes.Select(s => Edit(s))]), CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, error.Kind);
        Assert.Equal("script-locked", error.Code);
    }

    [Fact]
    public async Task There_is_nothing_to_edit_before_a_script_exists()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.AttachImageAsync(User, run.Id, 1, StoryTestData.Png(), "a.png", CancellationToken.None));

        Assert.Equal("script-locked", error.Code);
    }

    // ----------------------------------------------------------------------------------------------- pictures

    [Fact]
    public async Task A_picture_is_kept_under_the_run_replaces_the_old_one_and_is_named_after_the_file_without_its_path()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        var keys = await world.Stock(run);
        var oldImage = run.Script!.Scenes[1].ImageKey!;

        var result = await world.Service.AttachImageAsync(User, run.Id, 2, StoryTestData.Png(7), @"C:\Users\me\Pictures\diya lamp.png", CancellationToken.None);

        var scene = result.Script!.Scenes[1];
        Assert.NotEqual(oldImage, scene.ImageKey);
        Assert.True(StoryObjectKeys.Owns(run.Id, scene.ImageKey));
        Assert.EndsWith(".png", scene.ImageKey);
        Assert.Equal("upload", scene.ImageSource);
        Assert.Equal("diya lamp.png", scene.ImageName);
        Assert.DoesNotContain(oldImage, world.Store.Keys);
        Assert.Contains(scene.ImageKey!, world.Store.Keys);
        Assert.Equal(keys.Count, world.Store.Keys.Count);
    }

    [Fact]
    public async Task A_picture_is_checked_by_its_bytes_and_its_size()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);

        var notImage = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.AttachImageAsync(User, run.Id, 1, "<html>not an image</html>"u8.ToArray().Concat(new byte[200]).ToArray(), "x.png", CancellationToken.None));
        var tooBig = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.AttachImageAsync(User, run.Id, 1, new byte[VisualsStage.MaxImageBytes + 1], "x.png", CancellationToken.None));
        var noScene = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.AttachImageAsync(User, run.Id, 99, StoryTestData.Png(), "x.png", CancellationToken.None));

        Assert.Equal("image-invalid", notImage.Code);
        Assert.Equal("image-too-large", tooBig.Code);
        Assert.Equal(StoryRunErrorKind.NotFound, noScene.Kind);
        Assert.Equal("scene-not-found", noScene.Code);
        Assert.Empty(world.Store.Keys);
    }

    [Fact]
    public async Task Removing_a_picture_deletes_its_file_and_clears_the_scene()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Stock(run);
        var image = run.Script!.Scenes[0].ImageKey!;

        var result = await world.Service.RemoveImageAsync(User, run.Id, 1, CancellationToken.None);

        Assert.Null(result.Script!.Scenes[0].ImageKey);
        Assert.Null(result.Script.Scenes[0].ImageSource);
        Assert.DoesNotContain(image, world.Store.Keys);
        Assert.NotNull(result.Script.Scenes[1].ImageKey);
    }

    // ----------------------------------------------------------------------------------------------- approving

    [Fact]
    public async Task Approving_marks_the_script_and_saves_it_without_starting_anything()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);

        var result = await world.Service.ApproveScriptAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StorySamples.Now, result.ScriptApprovedAtUtc);
        Assert.Equal(StoryRunStatus.ScriptReady, result.Status);
        Assert.Equal(StorySamples.Now, world.Runs.Read(run.Id)!.ScriptApprovedAtUtc);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task Changing_the_words_takes_the_approval_back_and_a_picture_does_not()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        await world.Service.ApproveScriptAsync(User, run.Id, CancellationToken.None);

        var pictured = await world.Service.AttachImageAsync(User, run.Id, 1, StoryTestData.Png(), "1.png", CancellationToken.None);
        Assert.NotNull(pictured.ScriptApprovedAtUtc);

        var edited = await world.Service.UpdateScriptAsync(User, run.Id, Script(pictured, [.. pictured.Script!.Scenes.Select(s => Edit(s))]), CancellationToken.None);
        Assert.Null(edited.ScriptApprovedAtUtc);
        Assert.Null(world.Runs.Read(run.Id)!.ScriptApprovedAtUtc);
    }

    [Theory]
    [InlineData(StoryRunStatus.AwaitingScript, true)]
    [InlineData(StoryRunStatus.Building, true)]
    [InlineData(StoryRunStatus.Researching, false)]
    public async Task There_is_nothing_to_approve_without_a_script_or_while_it_is_being_made(StoryRunStatus status, bool withScript)
    {
        var world = new World();
        var run = await world.Seed(status, withScript);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.ApproveScriptAsync(User, run.Id, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, error.Kind);
        Assert.Null(world.Runs.Read(run.Id)!.ScriptApprovedAtUtc);
    }

    [Fact]
    public async Task Subtitles_sent_again_to_the_same_video_replace_the_old_note_of_them()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Completed);

        await world.Service.RecordCaptionsAsync(User, run.Id, [new StoryCaptionUpload { VideoId = "abcdefghijk", Language = "hi", CaptionId = "old" }], CancellationToken.None);
        var result = await world.Service.RecordCaptionsAsync(User, run.Id,
            [new StoryCaptionUpload { VideoId = "abcdefghijk", Language = "hi", CaptionId = "new" },
             new StoryCaptionUpload { VideoId = "abcdefghijk", Language = "en", CaptionId = "en1" }], CancellationToken.None);

        Assert.Equal(["new", "en1"], result.CaptionUploads.Select(c => c.CaptionId));
        Assert.Equal(2, world.Runs.Read(run.Id)!.CaptionUploads.Count);
    }

    // ----------------------------------------------------------------------------------------------- building

    [Fact]
    public async Task Building_approves_the_script_resets_the_building_stages_and_hands_the_run_to_the_worker()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);

        var result = await world.Service.BuildAsync(User, run.Id, new StoryBuildOptions { Narration = StoryNarrationMode.Stock, VoiceId = "hf_alpha", Music = false }, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, result.Status);
        Assert.Equal(StorySamples.Now, result.ScriptApprovedAtUtc);
        Assert.Equal("hf_alpha", result.Options.VoiceId);
        Assert.All(StoryStageIds.Building, id => Assert.Equal(StoryStageStatus.Pending, result.Stage(id).Status));
        Assert.All(StoryStageIds.Planning, id => Assert.Equal(StoryStageStatus.Completed, result.Stage(id).Status));
        Assert.Equal([run.Id], world.Queue.Enqueued);
        Assert.Equal(StoryRunStatus.Building, world.Runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task Building_with_no_new_choices_keeps_the_ones_the_run_has()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        run.Options = new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = false, Music = false, ImageStyle = "ink wash" };
        world.Runs.Seed(run);

        var result = await world.Service.BuildAsync(User, run.Id, null, CancellationToken.None);

        Assert.Equal("ink wash", result.Options.ImageStyle);
        Assert.Equal(StoryNarrationMode.None, result.Options.Narration);
    }

    [Fact]
    public async Task A_build_this_server_cannot_do_is_refused_up_front_and_the_run_stays_as_it_was()
    {
        var noSpeech = new World(speech: 0);
        var noFfmpeg = new World();
        noFfmpeg.Finisher.IsAvailable = false;
        var noRenderer = new World(renderer: false);

        var speech = await Assert.ThrowsAsync<StoryRunException>(async () =>
            await noSpeech.Service.BuildAsync(User, (await noSpeech.Seed(StoryRunStatus.ScriptReady)).Id, new StoryBuildOptions { Narration = StoryNarrationMode.Stock, RenderWhenReady = false }, CancellationToken.None));
        var ffmpeg = await Assert.ThrowsAsync<StoryRunException>(async () =>
            await noFfmpeg.Service.BuildAsync(User, (await noFfmpeg.Seed(StoryRunStatus.ScriptReady)).Id, new StoryBuildOptions { Narration = StoryNarrationMode.Stock, RenderWhenReady = false }, CancellationToken.None));
        var renderer = await Assert.ThrowsAsync<StoryRunException>(async () =>
            await noRenderer.Service.BuildAsync(User, (await noRenderer.Seed(StoryRunStatus.ScriptReady)).Id, new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = true }, CancellationToken.None));

        Assert.Equal("no-speech-engine", speech.Code);
        Assert.Equal("ffmpeg-missing", ffmpeg.Code);
        Assert.Equal("renderer-unavailable", renderer.Code);
        Assert.All(new[] { speech, ffmpeg, renderer }, e => Assert.Equal(StoryRunErrorKind.Unavailable, e.Kind));
        Assert.Empty(noSpeech.Queue.Enqueued);
        Assert.All(noSpeech.Runs.All(), r => Assert.Equal(StoryRunStatus.ScriptReady, r.Status));
    }

    [Fact]
    public async Task A_subtitles_only_video_with_the_render_left_to_the_person_needs_nothing_from_the_server()
    {
        var world = new World(speech: 0, renderer: false);
        world.Finisher.IsAvailable = false;
        var run = await world.Seed(StoryRunStatus.ScriptReady);

        var result = await world.Service.BuildAsync(User, run.Id, new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = false }, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, result.Status);
    }

    [Theory]
    [InlineData(StoryRunStatus.Researching, true)]
    [InlineData(StoryRunStatus.WritingScript, true)]
    [InlineData(StoryRunStatus.Building, true)]
    [InlineData(StoryRunStatus.AwaitingScript, false)]
    public async Task A_build_needs_a_script_and_nothing_already_being_made(StoryRunStatus status, bool withScript)
    {
        var world = new World();
        var run = await world.Seed(status, withScript);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.BuildAsync(User, run.Id,
            new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = false }, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, error.Kind);
        Assert.Equal("build-not-allowed", error.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task Building_again_after_a_finished_run_starts_over_and_forgets_the_old_render_and_kit()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Completed);
        foreach (var stage in run.Stages) stage.Status = StoryStageStatus.Completed;
        run.RenderJobId = "job-1";
        run.ProjectId = "6a6ae3f1d0797d6459bdc65f";
        run.Kit = new StoryPublishKit { Description = "old" };
        world.Runs.Seed(run);

        var result = await world.Service.BuildAsync(User, run.Id, new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = false }, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, result.Status);
        Assert.Null(result.RenderJobId);
        Assert.Null(result.Kit);
        Assert.Equal("6a6ae3f1d0797d6459bdc65f", result.ProjectId);
        Assert.All(StoryStageIds.Building, id => Assert.Equal(StoryStageStatus.Pending, result.Stage(id).Status));
    }

    [Fact]
    public async Task Building_respects_the_limit_of_stories_being_made_at_once()
    {
        var world = new World();
        world.Options.MaxActiveRunsPerUser = 1;
        await world.Seed(StoryRunStatus.Building);
        var waiting = await world.Seed(StoryRunStatus.ScriptReady);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.BuildAsync(User, waiting.Id,
            new StoryBuildOptions { Narration = StoryNarrationMode.None, RenderWhenReady = false }, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Limit, error.Kind);
    }

    // ----------------------------------------------------------------------------------------------- stopping, retrying, rewriting, deleting

    [Fact]
    public async Task Stopping_a_run_a_worker_has_asks_the_worker_and_returns_what_it_saved()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Building);
        world.Queue.OnCancel = id =>
        {
            // The worker's last word, as the executor writes it.
            var saved = world.Runs.Read(id)!;
            saved.Status = StoryRunStatus.Cancelled;
            saved.CancelRequested = true;
            saved.UpdatedAtUtc = StorySamples.Now.AddSeconds(1);
            world.Runs.Seed(saved);
            return StoryCancelResult.Stopped;
        };
        var writes = world.Runs.Saves;

        var result = await world.Service.CancelAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Cancelled, result.Status);
        Assert.Equal([run.Id], world.Queue.CancelAsked);
        Assert.Equal(writes, world.Runs.Saves);
    }

    [Fact]
    public async Task Stopping_a_run_nobody_has_cancels_it_directly_and_stops_what_was_showing_as_running()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Building);
        run.Stage(StoryStageIds.Narration).Status = StoryStageStatus.Running;
        world.Runs.Seed(run);

        var result = await world.Service.CancelAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Cancelled, result.Status);
        Assert.True(result.CancelRequested);
        Assert.Equal(StoryStageStatus.Pending, result.Stage(StoryStageIds.Narration).Status);
        Assert.Equal("Stopped.", result.Stage(StoryStageIds.Narration).Message);
        Assert.Equal(StoryRunStatus.Cancelled, world.Runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task A_run_whose_worker_is_still_stopping_is_reported_and_nothing_is_written_to_it()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Building);
        world.Queue.OnCancel = _ => StoryCancelResult.StillStopping;
        var writes = world.Runs.Saves;

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.CancelAsync(User, run.Id, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, error.Kind);
        Assert.Equal("still-stopping", error.Code);
        Assert.Equal(StoryRunStatus.Building, world.Runs.Read(run.Id)!.Status);
        Assert.Equal(writes, world.Runs.Saves);
    }

    [Theory]
    [InlineData(StoryRunStatus.Completed)]
    [InlineData(StoryRunStatus.Failed)]
    [InlineData(StoryRunStatus.Cancelled)]
    public async Task Stopping_a_finished_run_changes_nothing_and_does_not_disturb_the_worker(StoryRunStatus status)
    {
        var world = new World();
        var run = await world.Seed(status);

        var result = await world.Service.CancelAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(status, result.Status);
        Assert.Empty(world.Queue.CancelAsked);
    }

    [Fact]
    public async Task A_run_that_failed_while_building_carries_on_building_from_the_step_that_failed()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Failed);
        run.Stage(StoryStageIds.Visuals).Status = StoryStageStatus.Completed;
        var narration = run.Stage(StoryStageIds.Narration);
        narration.Status = StoryStageStatus.Failed;
        narration.Code = "no-speech-engine";
        narration.Message = "No speech engine.";
        run.ErrorCode = "no-speech-engine";
        run.ErrorMessage = "No speech engine.";
        world.Runs.Seed(run);

        var result = await world.Service.RetryAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, result.Status);
        Assert.Equal(StoryStageStatus.Pending, result.Stage(StoryStageIds.Narration).Status);
        Assert.Null(result.Stage(StoryStageIds.Narration).Code);
        Assert.Equal(StoryStageStatus.Completed, result.Stage(StoryStageIds.Visuals).Status);
        Assert.Null(result.ErrorCode);
        Assert.Null(result.ErrorMessage);
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_run_that_never_got_a_script_goes_back_to_getting_one_keeping_the_research()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Failed, withScript: false);
        run.Stage(StoryStageIds.Research).Status = StoryStageStatus.Completed;
        run.Stage(StoryStageIds.Script).Status = StoryStageStatus.Failed;
        world.Runs.Seed(run);

        var result = await world.Service.RetryAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Researching, result.Status);
        Assert.Equal(StoryStageStatus.Completed, result.Stage(StoryStageIds.Research).Status);
        Assert.Equal(StoryStageStatus.Pending, result.Stage(StoryStageIds.Script).Status);
    }

    [Fact]
    public async Task A_stopped_run_that_had_not_begun_building_returns_to_planning_and_ends_up_waiting_for_approval_again()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Cancelled);

        var result = await world.Service.RetryAsync(User, run.Id, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Researching, result.Status);
        Assert.False(result.CancelRequested);
    }

    [Theory]
    [InlineData(StoryRunStatus.Researching)]
    [InlineData(StoryRunStatus.Building)]
    [InlineData(StoryRunStatus.ScriptReady)]
    [InlineData(StoryRunStatus.Completed)]
    public async Task Only_a_failed_or_stopped_run_can_be_retried(StoryRunStatus status)
    {
        var world = new World();
        var run = await world.Seed(status);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.RetryAsync(User, run.Id, CancellationToken.None));

        Assert.Equal("retry-not-allowed", error.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_rewrite_asks_again_with_the_same_research_and_throws_away_the_old_script_and_its_files()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.ScriptReady);
        var keys = await world.Stock(run);

        var result = await world.Service.RewriteAsync(User, run.Id, StoryWriterMode.Manual, CancellationToken.None);

        Assert.Equal(StoryRunStatus.WritingScript, result.Status);
        Assert.Null(result.Script);
        Assert.Empty(result.ScriptWarnings);
        Assert.Equal(1, result.ScriptRevision);
        Assert.Equal(StoryWriterMode.Manual, result.Brief.Writer);
        Assert.NotNull(result.Research);
        Assert.Equal(StoryStageStatus.Completed, result.Stage(StoryStageIds.Research).Status);
        Assert.All(StoryStageIds.Building.Append(StoryStageIds.Script), id => Assert.Equal(StoryStageStatus.Pending, result.Stage(id).Status));
        Assert.All(keys, key => Assert.DoesNotContain(key, world.Store.Keys));
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_rewrite_is_refused_while_working_before_the_research_is_done_or_into_a_built_in_story()
    {
        var world = new World();
        var working = await world.Seed(StoryRunStatus.Building);
        var early = await world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        var waiting = await world.Seed(StoryRunStatus.ScriptReady);

        var a = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.RewriteAsync(User, working.Id, null, CancellationToken.None));
        var b = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.RewriteAsync(User, early.Id, null, CancellationToken.None));
        var c = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.RewriteAsync(User, waiting.Id, StoryWriterMode.BuiltIn, CancellationToken.None));

        Assert.Equal("rewrite-not-allowed", a.Code);
        Assert.Equal("rewrite-not-allowed", b.Code);
        Assert.Equal("writer-invalid", c.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task Deleting_asks_the_worker_to_let_go_then_removes_the_run_and_its_files_and_nothing_else()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Completed);
        var keys = await world.Stock(run);
        run.Music = new StoryMusicPick { StorageKey = StoryObjectKeys.Music(run.Id), Title = "t" };
        await world.Store.SaveAsync(run.Music.StorageKey, new MemoryStream(FakeMusic.Mp3Bytes()), "audio/mpeg");
        world.Runs.Seed(run);
        await world.Store.SaveAsync("voice-profiles/vp_x/lines/keep.wav", new MemoryStream(FakeFinisher.Wav(0.5)), "audio/wav");

        await world.Service.DeleteAsync(User, run.Id, CancellationToken.None);

        Assert.Null(world.Runs.Read(run.Id));
        Assert.Equal([run.Id], world.Queue.CancelAsked);
        Assert.All(keys, key => Assert.DoesNotContain(key, world.Store.Keys));
        Assert.Equal(["voice-profiles/vp_x/lines/keep.wav"], world.Store.Keys);
    }

    [Fact]
    public async Task A_worker_still_stopping_blocks_the_delete()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Building);
        await world.Stock(run);
        world.Queue.OnCancel = _ => StoryCancelResult.StillStopping;

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.DeleteAsync(User, run.Id, CancellationToken.None));

        Assert.Equal("still-stopping", error.Code);
        Assert.NotNull(world.Runs.Read(run.Id));
        Assert.NotEmpty(world.Store.Keys);
    }

    [Fact]
    public async Task A_delete_never_reaches_a_file_outside_the_runs_own_folder_whatever_the_document_says()
    {
        var world = new World();
        var run = await world.Seed(StoryRunStatus.Completed);
        var foreign = "story-runs/sr_someoneelse/images/s01-theirs.png";
        var traversal = $"story-runs/{run.Id}/../sr_someoneelse/images/s01-theirs.png";
        await world.Store.SaveAsync(foreign, new MemoryStream(StoryTestData.Png()), "image/png");
        run.Script!.Scenes[0].ImageKey = foreign;
        run.Script.Scenes[1].ImageKey = traversal;
        world.Runs.Seed(run);

        await world.Service.DeleteAsync(User, run.Id, CancellationToken.None);

        Assert.Contains(foreign, world.Store.Keys);
        Assert.Null(world.Runs.Read(run.Id));
    }

    // ------------------------------------------------------------------------------------------------ reviews

    /// <summary>A run that built up to the given step and stopped there for the person to check it.</summary>
    private static async Task<StoryRun> Reviewing(World world, string stageId)
    {
        var run = await world.Seed(StoryRunStatus.AwaitingReview);
        await world.Stock(run);
        foreach (var id in StoryStageIds.Building.TakeWhile(id => id != stageId).Append(stageId))
            run.Stage(id).Status = StoryStageStatus.Completed;
        run.Review = stageId;
        world.Runs.Seed(run);
        return run;
    }

    [Fact]
    public async Task Approving_the_step_being_reviewed_records_it_and_sends_the_build_on()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Narration);

        var approved = await world.Service.ApproveReviewAsync(User, run.Id, StoryStageIds.Narration, CancellationToken.None);

        Assert.Equal(StoryRunStatus.Building, approved.Status);
        Assert.Null(approved.Review);
        Assert.Equal(StorySamples.Now, approved.VoiceApprovedAtUtc);
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_step_that_is_not_waiting_cannot_be_approved()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Narration);

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.ApproveReviewAsync(User, run.Id, StoryStageIds.Music, CancellationToken.None));

        Assert.Equal("review-not-waiting", error.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task Retaking_chosen_scenes_takes_only_those_again_and_rebuilds_from_the_voice()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Narration);

        var redone = await world.Service.RedoNarrationAsync(User, run.Id, new StoryVoiceRedo([2]), CancellationToken.None);

        Assert.Equal([0, 1, 0], redone.Script!.Scenes.Take(3).Select(s => s.AudioTake));
        Assert.Equal(StoryRunStatus.Building, redone.Status);
        Assert.Equal(StoryStageStatus.Pending, redone.Stage(StoryStageIds.Narration).Status);
        Assert.Equal(StoryStageStatus.Completed, redone.Stage(StoryStageIds.Visuals).Status);
        Assert.Null(redone.VoiceApprovedAtUtc);
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_new_delivery_speaks_every_scene_again_without_counting_retakes()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Narration);

        var redone = await world.Service.RedoNarrationAsync(User, run.Id, new StoryVoiceRedo(null, SpeechRate: 0.9), CancellationToken.None);

        Assert.Equal(0.9, redone.Options.SpeechRate);
        Assert.All(redone.Script!.Scenes, s => Assert.Equal(0, s.AudioTake));
    }

    [Fact]
    public async Task Asking_for_new_music_throws_the_old_track_away_and_asks_for_a_different_take()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Music);
        run.Music = new StoryMusicPick { Provider = MusicStage.ComposedProvider, StorageKey = StoryObjectKeys.Music(run.Id) };
        await world.Store.SaveAsync(run.Music.StorageKey, new MemoryStream(FakeMusic.Mp3Bytes()), "audio/mpeg");
        world.Runs.Seed(run);

        var redone = await world.Service.RedoMusicAsync(User, run.Id, new StoryMusicRedo(Prompt: "Soft bansuri over a tanpura drone."), CancellationToken.None);

        Assert.Null(redone.Music);
        Assert.DoesNotContain(StoryObjectKeys.Music(run.Id), world.Store.Keys);
        Assert.Equal(1, redone.MusicTake);
        Assert.Equal("Soft bansuri over a tanpura drone.", redone.Options.MusicPrompt);
        Assert.Equal(StoryStageStatus.Pending, redone.Stage(StoryStageIds.Music).Status);
        Assert.Equal(StoryStageStatus.Completed, redone.Stage(StoryStageIds.Narration).Status);
        Assert.StartsWith("Soft bansuri over a tanpura drone. Take 2:", MusicStage.Brief(redone, redone.Script!).Prompt);
        Assert.Equal("Soft bansuri over a tanpura drone.", MusicStage.Brief(redone, redone.Script!, forComposer: false).Prompt);
    }

    [Fact]
    public async Task A_track_attached_after_the_build_is_kept_and_waits_to_be_approved()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Render);

        var attached = await world.Service.AttachMusicAsync(User, run.Id, FakeMusic.Mp3Bytes(), @"C:\music\my track.mp3", CancellationToken.None);

        Assert.Equal(StoryRunStatus.AwaitingReview, attached.Status);
        Assert.Equal(StoryStageIds.Music, attached.Review);
        Assert.Equal(MusicStage.UploadedProvider, attached.Music!.Provider);
        Assert.Equal("my track.mp3", attached.Music.Title);
        Assert.Equal(StoryStageStatus.Pending, attached.Stage(StoryStageIds.Assemble).Status);
        Assert.Contains(attached.Music.StorageKey, world.Store.Keys);
    }

    [Fact]
    public async Task A_file_that_is_not_audio_is_refused_as_music()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Music);

        var error = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Service.AttachMusicAsync(User, run.Id, StoryTestData.Png(), "cover.mp3", CancellationToken.None));

        Assert.Equal("music-invalid", error.Code);
    }

    [Fact]
    public async Task A_look_set_by_hand_is_pinned_and_rebuilds_from_the_project_keeping_voice_and_music()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Render);

        var redone = await world.Service.RedoLookAsync(User, run.Id, new StoryLookRedo(false, StoryLookStyle.Cinematic, 0.15,
            [new StorySceneLookEdit(2, "PanUp", "CircleOpen", 0.8)]), CancellationToken.None);

        var scene = redone.Script!.Scenes[1];
        Assert.True(scene.LookPinned);
        Assert.Equal("PanUp", scene.Effect);
        Assert.Equal("CircleOpen", scene.Transition);
        Assert.Equal(StoryLookStyle.Cinematic, redone.Options.LookStyle);
        Assert.Equal(0.15, redone.Options.MusicVolume);
        Assert.Equal(StoryStageStatus.Pending, redone.Stage(StoryStageIds.Assemble).Status);
        Assert.Equal(StoryStageStatus.Completed, redone.Stage(StoryStageIds.Music).Status);
        Assert.Null(redone.RenderJobId);
    }

    [Fact]
    public async Task A_look_with_an_unknown_name_is_refused_and_changes_nothing()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Render);

        var error = await Assert.ThrowsAsync<StoryRunException>(() => world.Service.RedoLookAsync(User, run.Id,
            new StoryLookRedo(true, null, null, [new StorySceneLookEdit(1, "ZoomIn", null, null), new StorySceneLookEdit(2, "Spin", null, null)]),
            CancellationToken.None));

        Assert.Equal("look-invalid", error.Code);
        var saved = world.Runs.Read(run.Id)!;
        Assert.False(saved.Script!.Scenes[0].LookPinned);
        Assert.Equal(0, saved.LookTake);
        Assert.Equal(StoryRunStatus.AwaitingReview, saved.Status);
    }

    [Fact]
    public async Task Changing_a_picture_while_a_step_waits_sends_the_story_back_to_the_build()
    {
        var world = new World();
        var run = await Reviewing(world, StoryStageIds.Narration);
        run.VoiceApprovedAtUtc = StorySamples.Now;
        world.Runs.Seed(run);

        var removed = await world.Service.RemoveImageAsync(User, run.Id, 1, CancellationToken.None);

        Assert.Equal(StoryRunStatus.ScriptReady, removed.Status);
        Assert.Null(removed.Review);
        Assert.Null(removed.VoiceApprovedAtUtc);
        Assert.All(StoryStageIds.Building, id => Assert.Equal(StoryStageStatus.Pending, removed.Stage(id).Status));
    }
}
