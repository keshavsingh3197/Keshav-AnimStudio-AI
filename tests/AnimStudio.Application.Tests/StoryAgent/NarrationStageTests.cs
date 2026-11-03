using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class NarrationStageTests
{
    private const string ProfileId = "vp_0123456789abcdef0123456789abcdef";
    private const string TunedVoice = "af_vp0123456789abcdef0123456789abcdef_tuned";

    private sealed class FakeVoiceRenderer : IStudioVoiceRenderer
    {
        public bool IsAvailable => true;
        public bool CanReVoice { get; set; } = true;
        public bool CanPrepareReference => false;
        public List<string> ReVoiced { get; } = [];

        public Task<StudioVoiceOutput> RenderAsync(Stream recording, StudioVoiceContainer container,
            IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<string, string> samples, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct)
        {
            ReVoiced.Add(sampleStorageKey);
            return Task.FromResult(FakeFinisher.Wav(1.5));
        }

        public Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class World
    {
        public required NarrationStage Stage { get; init; }
        public required StoryNarrator Narrator { get; init; }
        public required FakeAi Ai { get; init; }
        public required InMemoryObjectStore Store { get; init; }
        public required FakeFinisher Finisher { get; init; }
        public required InMemoryVoices Voices { get; init; }
        public required FakeVoiceRenderer Renderer { get; init; }
    }

    private static World Build()
    {
        var ai = new FakeAi { Speech = _ => FakeAi.SpeechOk(FakeFinisher.Wav(1.0)) };
        var store = new InMemoryObjectStore();
        var finisher = new FakeFinisher();
        var voices = new InMemoryVoices();
        var renderer = new FakeVoiceRenderer();
        var tuning = new MyVoiceTuning(new StubRegistry(), [], renderer, voices,
            new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<MyVoiceTuning>.Instance);
        var narrator = new StoryNarrator(ai, voices, renderer, tuning, store, finisher, NullLogger<StoryNarrator>.Instance);
        return new World
        {
            Stage = new NarrationStage(narrator, store, NullLogger<NarrationStage>.Instance),
            Narrator = narrator, Ai = ai, Store = store, Finisher = finisher, Voices = voices, Renderer = renderer
        };
    }

    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    private static StoryRun BuildingRun(StoryNarrationMode mode = StoryNarrationMode.Stock)
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Options.Narration = mode;
        run.Options.VoiceId = "hf_alpha";
        return run;
    }

    private static VoiceProfile Profile(string userId = "user-1") => new()
    {
        Id = ProfileId, UserId = userId, Name = "My voice (Hindi)", BaseVoiceId = "hf_alpha",
        StorageKey = $"voice-profiles/{ProfileId}/sample.webm"
    };

    [Fact]
    public async Task Each_scene_is_spoken_in_the_chosen_voice_finished_and_stored_under_a_name_that_says_what_it_sounds_like()
    {
        var world = Build();
        var run = BuildingRun();
        run.Options.SpeechRate = 1.05;
        run.Options.SpeechEngine = "kokoro";
        var scenes = run.Script!.Scenes;

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(scenes.Select(s => s.Narration), world.Ai.SpeechCalls.Select(c => c.Text));
        Assert.All(world.Ai.SpeechCalls, call =>
        {
            Assert.Equal("hf_alpha", call.VoiceId);
            Assert.Equal(1.05, call.Rate);
            Assert.Equal("kokoro", call.ProviderId);
            Assert.Null(call.LanguageCode);
        });
        Assert.All(world.Ai.Contexts, c => Assert.Equal(run.UserId, c.UserId));
        Assert.Equal(scenes.Count, world.Finisher.Calls);
        Assert.Equal(scenes.Count, world.Store.Keys.Count);

        Assert.All(scenes, scene =>
        {
            Assert.True(StoryObjectKeys.Owns(run.Id, scene.AudioKey));
            Assert.EndsWith(".wav", scene.AudioKey);
            Assert.Equal(3.0, scene.AudioSeconds!.Value, 3);
            Assert.Single(scene.Pauses);
            Assert.Equal("voice hf_alpha", scene.AudioSource);
        });
        Assert.Equal("Narration ready in voice hf_alpha.", outcome.Message);
    }

    [Fact]
    public async Task A_second_pass_speaks_nothing_that_has_not_changed()
    {
        var world = Build();
        var run = BuildingRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var spoken = world.Ai.SpeechCalls.Count;

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(spoken, world.Ai.SpeechCalls.Count);
        Assert.Equal(spoken, world.Finisher.Calls);
        Assert.Contains("kept from before", outcome.Message);
    }

    [Fact]
    public async Task Only_the_scene_whose_words_changed_is_spoken_again_and_its_old_file_is_deleted()
    {
        var world = Build();
        var run = BuildingRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var scenes = run.Script!.Scenes;
        var oldKey = scenes[2].AudioKey!;
        var otherKey = scenes[0].AudioKey;
        var spoken = world.Ai.SpeechCalls.Count;

        scenes[2].Narration = "श्रीकृष्ण ने नरकासुर का वध किया।";
        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(spoken + 1, world.Ai.SpeechCalls.Count);
        Assert.Equal("श्रीकृष्ण ने नरकासुर का वध किया।", world.Ai.SpeechCalls[^1].Text);
        Assert.NotEqual(oldKey, scenes[2].AudioKey);
        Assert.Equal(otherKey, scenes[0].AudioKey);
        Assert.DoesNotContain(oldKey, world.Store.Keys);
        Assert.Equal(scenes.Count, world.Store.Keys.Count);
    }

    [Fact]
    public async Task A_different_voice_or_speed_speaks_every_scene_again()
    {
        var world = Build();
        var run = BuildingRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var scenes = run.Script!.Scenes;
        var spoken = world.Ai.SpeechCalls.Count;

        run.Options.SpeechRate = 1.2;
        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(spoken + scenes.Count, world.Ai.SpeechCalls.Count);
        Assert.Equal(scenes.Count, world.Store.Keys.Count);
    }

    [Fact]
    public async Task The_default_voice_follows_the_language_and_a_profile_brings_its_own()
    {
        var world = Build();
        var hindi = BuildingRun();
        hindi.Options.VoiceId = null;
        var english = BuildingRun();
        english.Options.VoiceId = null;
        english.Brief.Language = "en";
        world.Voices.Items[ProfileId] = Profile();
        var mine = BuildingRun(StoryNarrationMode.MyVoice);
        mine.Options.VoiceId = null;
        mine.Options.VoiceProfileId = ProfileId;

        Assert.Equal(StoryNarrator.DefaultHindiVoice, (await world.Narrator.PlanAsync(hindi, CancellationToken.None)).VoiceId);
        Assert.Equal(StoryNarrator.DefaultEnglishVoice, (await world.Narrator.PlanAsync(english, CancellationToken.None)).VoiceId);
        Assert.Equal("hf_alpha", (await world.Narrator.PlanAsync(mine, CancellationToken.None)).VoiceId);
    }

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("a voice with spaces")]
    [InlineData(TunedVoice)]
    public async Task A_voice_that_cannot_be_a_voice_is_refused(string voiceId)
    {
        var world = Build();
        var run = BuildingRun();
        run.Options.VoiceId = voiceId;

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("voice-invalid", error.Code);
        Assert.Empty(world.Ai.SpeechCalls);
    }

    [Fact]
    public async Task The_speed_is_kept_within_what_a_speech_engine_accepts()
    {
        var world = Build();
        var fast = BuildingRun();
        fast.Options.SpeechRate = 9;
        var slow = BuildingRun();
        slow.Options.SpeechRate = 0.01;
        var odd = BuildingRun();
        odd.Options.SpeechRate = double.NaN;

        Assert.Equal(2.0, (await world.Narrator.PlanAsync(fast, CancellationToken.None)).Rate);
        Assert.Equal(0.5, (await world.Narrator.PlanAsync(slow, CancellationToken.None)).Rate);
        Assert.Equal(1.0, (await world.Narrator.PlanAsync(odd, CancellationToken.None)).Rate);
    }

    [Fact]
    public async Task Subtitles_only_skips_the_stage_and_removes_narration_from_an_earlier_choice()
    {
        var world = Build();
        var run = BuildingRun();
        await world.Stage.RunAsync(Context(run), CancellationToken.None);
        var spoken = world.Ai.SpeechCalls.Count;

        run.Options.Narration = StoryNarrationMode.None;
        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Skipped, outcome.Result);
        Assert.Equal("narration-off", outcome.Code);
        Assert.Equal(spoken, world.Ai.SpeechCalls.Count);
        Assert.Empty(world.Store.Keys);
        Assert.All(run.Script!.Scenes, s =>
        {
            Assert.Null(s.AudioKey);
            Assert.Null(s.AudioSeconds);
            Assert.Empty(s.Pauses);
        });
    }

    [Fact]
    public async Task No_speech_engine_fails_the_stage_with_a_way_forward()
    {
        var world = Build();
        world.Ai.Speech = _ => AiOutcome<AiSpeechResult>.Unavailable(AiUnavailableReason.NotConfigured);
        var run = BuildingRun();

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("no-speech-engine", error.Code);
        Assert.Contains("subtitles only", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("transport-failed", "not running")]
    [InlineData("timeout", "took too long")]
    [InlineData("voice-required", "different speech engine")]
    [InlineData("rate-limited", "too many requests")]
    [InlineData("content-blocked", "declined")]
    [InlineData("something-new", "could not speak")]
    public async Task A_speech_engine_that_fails_is_explained_by_its_code(string code, string expected)
    {
        var world = Build();
        world.Ai.Speech = _ => AiOutcome<AiSpeechResult>.Failed(code, "provider text that must not be shown");
        var run = BuildingRun();

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal(code, error.Code);
        Assert.Contains(expected, error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("provider text", error.Message);
    }

    [Fact]
    public async Task Audio_in_a_format_the_studio_cannot_use_is_refused_before_it_is_stored()
    {
        var world = Build();
        world.Ai.Speech = _ => FakeAi.SpeechOk(new byte[300]);
        var run = BuildingRun();

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("speech-format", error.Code);
        Assert.Empty(world.Store.Keys);
    }

    [Fact]
    public async Task Without_ffmpeg_narration_cannot_be_finished_and_the_stage_says_so()
    {
        var world = Build();
        world.Finisher.IsAvailable = false;
        var run = BuildingRun();

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("ffmpeg-missing", error.Code);
        Assert.Empty(world.Ai.SpeechCalls);
    }

    [Fact]
    public async Task A_stopped_run_stops_between_scenes()
    {
        var world = Build();
        var run = BuildingRun();
        using var stop = new CancellationTokenSource();
        await stop.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => world.Stage.RunAsync(Context(run), stop.Token));

        Assert.Empty(world.Ai.SpeechCalls);
    }

    // ---------------------------------------------------------------------------------- the person's own voice

    [Fact]
    public async Task Another_persons_voice_cannot_be_used()
    {
        var world = Build();
        world.Voices.Items[ProfileId] = Profile(userId: "someone-else");
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("my-voice-missing", error.Code);
        Assert.Empty(world.Ai.SpeechCalls);
        Assert.Empty(world.Renderer.ReVoiced);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("vp_ffffffffffffffffffffffffffffffff")]
    public async Task A_voice_that_is_not_chosen_or_no_longer_exists_is_refused(string? id)
    {
        var world = Build();
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = id;

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("my-voice-missing", error.Code);
    }

    [Fact]
    public async Task Without_a_tuned_voice_or_a_converter_the_stage_says_what_to_set_up()
    {
        var world = Build();
        world.Voices.Items[ProfileId] = Profile();
        world.Renderer.CanReVoice = false;
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;

        var error = await Assert.ThrowsAsync<StoryStageException>(() => world.Stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("my-voice-unavailable", error.Code);
        Assert.Contains("setup-voiceover", error.Message);
    }

    [Fact]
    public async Task A_line_in_my_voice_is_spoken_in_the_base_voice_converted_and_the_conversion_kept_under_the_voice()
    {
        var world = Build();
        world.Voices.Items[ProfileId] = Profile();
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;
        var scenes = run.Script!.Scenes;

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.All(world.Ai.SpeechCalls, c => Assert.Equal("hf_alpha", c.VoiceId));
        Assert.All(world.Renderer.ReVoiced, key => Assert.Equal($"voice-profiles/{ProfileId}/sample.webm", key));
        Assert.Equal(scenes.Count, world.Renderer.ReVoiced.Count);

        var profile = world.Voices.Items[ProfileId];
        Assert.Equal(scenes.Count, profile.CachedLineKeys.Count);
        Assert.All(profile.CachedLineKeys, key => Assert.StartsWith($"voice-profiles/{ProfileId}/lines/", key));
        Assert.All(scenes, s => Assert.Equal("My voice (Hindi)", s.AudioSource));
    }

    [Fact]
    public async Task A_line_converted_before_is_found_not_converted_again()
    {
        var world = Build();
        world.Voices.Items[ProfileId] = Profile();
        var first = BuildingRun(StoryNarrationMode.MyVoice);
        first.Options.VoiceProfileId = ProfileId;
        await world.Stage.RunAsync(Context(first), CancellationToken.None);
        var converted = world.Renderer.ReVoiced.Count;

        // A different run with the same words: the converter is not asked again.
        var second = BuildingRun(StoryNarrationMode.MyVoice);
        second.Options.VoiceProfileId = ProfileId;
        await world.Stage.RunAsync(Context(second), CancellationToken.None);

        Assert.Equal(converted, world.Renderer.ReVoiced.Count);
        Assert.Equal(converted, world.Voices.Items[ProfileId].CachedLineKeys.Count);
    }

    [Fact]
    public async Task A_tuned_voice_speaks_the_line_directly_in_the_lines_language()
    {
        var world = Build();
        var profile = Profile();
        profile.TunedVoiceId = TunedVoice;
        world.Voices.Items[ProfileId] = profile;
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;

        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(world.Ai.SpeechCalls, c =>
        {
            Assert.Equal(TunedVoice, c.VoiceId);
            Assert.Equal("h", c.LanguageCode);
        });
        Assert.Empty(world.Renderer.ReVoiced);
    }

    [Fact]
    public async Task Closest_to_my_voice_converts_every_line_even_when_a_tuned_voice_exists()
    {
        var world = Build();
        var profile = Profile();
        profile.TunedVoiceId = TunedVoice;
        world.Voices.Items[ProfileId] = profile;
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;
        run.Options.ClosestToMyVoice = true;

        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(world.Ai.SpeechCalls, c => Assert.Equal("hf_alpha", c.VoiceId));
        Assert.Equal(run.Script!.Scenes.Count, world.Renderer.ReVoiced.Count);
    }

    [Fact]
    public async Task When_the_tuned_voice_cannot_speak_the_line_is_converted_instead()
    {
        var world = Build();
        var profile = Profile();
        profile.TunedVoiceId = TunedVoice;
        world.Voices.Items[ProfileId] = profile;
        world.Ai.Speech = request => request.VoiceId == TunedVoice
            ? AiOutcome<AiSpeechResult>.Failed("transport-failed", "down")
            : FakeAi.SpeechOk(FakeFinisher.Wav(1.0));
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;

        var outcome = await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(run.Script!.Scenes.Count, world.Renderer.ReVoiced.Count);
    }

    [Fact]
    public async Task For_my_voice_no_hosted_engine_is_named_even_if_the_person_chose_one()
    {
        var world = Build();
        world.Voices.Items[ProfileId] = Profile();
        var run = BuildingRun(StoryNarrationMode.MyVoice);
        run.Options.VoiceProfileId = ProfileId;
        run.Options.SpeechEngine = "some-hosted-engine";

        await world.Stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(world.Ai.SpeechCalls, c => Assert.Null(c.ProviderId));
    }

    // ---------------------------------------------------------------------------------- the file's name

    [Fact]
    public async Task The_fingerprint_changes_with_what_the_line_sounds_like_and_only_then()
    {
        var world = Build();
        var run = BuildingRun();
        var plan = await world.Narrator.PlanAsync(run, CancellationToken.None);
        var text = "श्रीकृष्ण ने गोवर्धन उठाया।";

        var baseline = StoryNarrator.Fingerprint(plan, text);

        Assert.Equal(baseline, StoryNarrator.Fingerprint(plan, text));
        Assert.Equal(16, baseline.Length);
        Assert.NotEqual(baseline, StoryNarrator.Fingerprint(plan, text + " "));
        Assert.NotEqual(baseline, StoryNarrator.Fingerprint(plan with { VoiceId = "hm_omega" }, text));
        Assert.NotEqual(baseline, StoryNarrator.Fingerprint(plan with { Rate = 1.1 }, text));
        Assert.NotEqual(baseline, StoryNarrator.Fingerprint(plan with { Engine = "piper-local" }, text));
        Assert.NotEqual(baseline, StoryNarrator.Fingerprint(plan with { ClosestToMyVoice = true }, text));
    }
}
