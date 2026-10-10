using System.Net;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Voices;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Voices;

public class MyVoiceTuningTests
{
    private const string ProfileId = "vp_0123456789abcdef0123456789abcdef";
    private const string TunedName = "af_vp0123456789abcdef0123456789abcdef";

    private sealed class World
    {
        public required MyVoiceTuning Tuning { get; init; }
        public required FakeTuner Tuner { get; init; }
        public required InMemoryVoiceProfiles Voices { get; init; }
        public required FakeRenderer Renderer { get; init; }
    }

    private static World Build(bool local = true)
    {
        var tuner = new FakeTuner(local);
        var options = new AiOptions
        {
            Chains = { ["Speech"] = ["kokoro"] },
            Providers = { ["kokoro"] = new AiProviderOptions { Enabled = true, BaseUrl = "http://localhost:8880/v1", IsLocal = true } }
        };
        var clock = new ManualTimeProvider(new DateTimeOffset(2026, 10, 9, 12, 0, 0, TimeSpan.Zero));
        var registry = new AiProviderRegistry([tuner], new StaticOptionsMonitor<AiOptions>(options), clock,
            NullLogger<AiProviderRegistry>.Instance);
        var voices = new InMemoryVoiceProfiles();
        voices.Items[ProfileId] = new VoiceProfile
        {
            Id = ProfileId, UserId = "user-1", Name = "Me", BaseVoiceId = "af_heart",
            StorageKey = $"voice-profiles/{ProfileId}/sample.webm"
        };
        var renderer = new FakeRenderer();

        return new World
        {
            Tuning = new MyVoiceTuning(registry, [tuner], renderer, voices, clock, NullLogger<MyVoiceTuning>.Instance),
            Tuner = tuner,
            Voices = voices,
            Renderer = renderer
        };
    }

    [Fact]
    public async Task An_english_line_tunes_the_voice_once_and_keeps_it()
    {
        var world = Build();

        var first = await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None);
        var second = await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "bm_george", CancellationToken.None);

        Assert.Equal(TunedName + "_tuned", first);
        Assert.Equal(first, second);
        Assert.Equal([TunedName], world.Tuner.Tuned);
        Assert.Equal([$"voice-profiles/{ProfileId}/sample.webm"], world.Renderer.Prepared);
        Assert.Equal("kokoro", world.Voices.Items[ProfileId].TunedVoiceProviderId);
    }

    [Fact]
    public async Task A_hindi_line_is_spoken_in_the_same_tuned_voice()
    {
        var world = Build();

        var english = await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None);
        var hindi = await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "hf_alpha", CancellationToken.None);

        Assert.Equal(TunedName + "_tuned", hindi);
        Assert.Equal(english, hindi);
        Assert.Equal([TunedName], world.Tuner.Tuned);
    }

    [Fact]
    public async Task A_hindi_base_voice_is_tuned_under_an_english_name_of_its_gender()
    {
        var world = Build();
        world.Voices.Items[ProfileId].BaseVoiceId = "hm_omega";

        var voice = await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "hm_omega", CancellationToken.None);

        Assert.Equal("am_vp0123456789abcdef0123456789abcdef_tuned", voice);
    }

    [Fact]
    public async Task A_line_in_a_voice_that_is_not_kokoros_is_left_to_the_converter()
    {
        var world = Build();

        Assert.Null(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "alloy", CancellationToken.None));
        Assert.Empty(world.Tuner.Tuned);
    }

    [Theory]
    [InlineData("hm_omega", "h")]
    [InlineData("bf_emma", "b")]
    [InlineData("af_bella+af_sky", "a")]
    [InlineData("alloy", null)]
    [InlineData("xm_me", null)]
    public void The_language_is_the_line_voices_first_letter(string voiceId, string? language) =>
        Assert.Equal(language, MyVoiceTuning.LanguageOf(voiceId));

    [Fact]
    public async Task A_refused_sample_is_not_offered_again()
    {
        var world = Build();
        world.Tuner.Failure = new AiProviderException("bad-request", "refused");

        Assert.Null(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None));
        world.Tuner.Failure = null;
        Assert.Null(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None));

        Assert.NotNull(world.Voices.Items[ProfileId].TuneRefusedAtUtc);
        Assert.Equal(1, world.Tuner.Attempts);
    }

    [Fact]
    public async Task An_engine_that_is_down_is_asked_again_on_a_later_line()
    {
        var world = Build();
        world.Tuner.Failure = new AiProviderException("transport-failed", "down");

        Assert.Null(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None));
        world.Tuner.Failure = null;

        Assert.NotNull(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None));
        Assert.Null(world.Voices.Items[ProfileId].TuneRefusedAtUtc);
    }

    [Fact]
    public async Task A_hosted_engine_is_never_sent_a_sample()
    {
        var world = Build(local: false);

        Assert.False(world.Tuning.CanTune);
        Assert.Null(await world.Tuning.VoiceForAsync(world.Voices.Items[ProfileId], "af_bella", CancellationToken.None));
        Assert.Empty(world.Renderer.Prepared);
    }

    [Fact]
    public async Task Deleting_the_profile_deletes_its_tuned_voice()
    {
        var world = Build();
        var profile = world.Voices.Items[ProfileId];
        await world.Tuning.VoiceForAsync(profile, "af_bella", CancellationToken.None);

        await world.Tuning.ForgetAsync(world.Voices.Items[ProfileId], CancellationToken.None);

        Assert.Equal([TunedName + "_tuned"], world.Tuner.Deleted);
    }

    [Theory]
    [InlineData("af_vp0123456789abcdef0123456789abcdef_tuned", true)]
    [InlineData("af_bella+am_vp0123456789abcdef0123456789abcdef_tuned", true)]
    [InlineData("af_bella", false)]
    [InlineData("am_price_inno", false)]
    [InlineData("am_me_tuned", false)]
    public void Tuned_voices_are_recognised_anywhere_in_a_voice_id(string voiceId, bool tuned) =>
        Assert.Equal(tuned, MyVoiceTuning.IsTunedVoice(voiceId));

    private sealed class FakeTuner(bool local) : IVoiceTuningSpeechProvider
    {
        public List<string> Tuned { get; } = [];
        public List<string> Deleted { get; } = [];
        public int Attempts { get; private set; }
        public AiProviderException? Failure { get; set; }

        public AiProviderId Id { get; } = AiProviderId.Parse("kokoro");
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public bool CanTuneVoices => local;

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) => throw new NotSupportedException();

        public Task<string> TuneVoiceAsync(byte[] referenceWav, string name, CancellationToken ct)
        {
            Attempts++;
            if (Failure is not null) throw Failure;
            Tuned.Add(name);
            return Task.FromResult(name + "_tuned");
        }

        public Task DeleteTunedVoiceAsync(string voiceId, CancellationToken ct)
        {
            Deleted.Add(voiceId);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeRenderer : IStudioVoiceRenderer
    {
        public List<string> Prepared { get; } = [];

        public bool IsAvailable => true;
        public bool CanReVoice => false;
        public bool CanPrepareReference => true;

        public Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct)
        {
            Prepared.Add(sampleStorageKey);
            return Task.FromResult(AudioBytes.Wav(5));
        }

        public Task<StudioVoiceOutput> RenderAsync(Stream recording, StudioVoiceContainer container,
            IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<string, string> samples, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class InMemoryVoiceProfiles : IVoiceProfileRepository
    {
        public Dictionary<string, VoiceProfile> Items { get; } = [];

        // Copies, as a database would hand back, so a test sees only what was saved.
        public Task<VoiceProfile?> GetAsync(string id, CancellationToken ct) =>
            Task.FromResult(Items.TryGetValue(id, out var v) ? Copy(v) : null);

        public Task<IReadOnlyList<VoiceProfile>> ListByUserAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<VoiceProfile>>([.. Items.Values.Where(v => v.UserId == userId).Select(Copy)]);

        public Task UpsertAsync(VoiceProfile profile, CancellationToken ct)
        {
            Items[profile.Id] = Copy(profile);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(Items.Remove(id));

        private static VoiceProfile Copy(VoiceProfile v) => new()
        {
            Id = v.Id, UserId = v.UserId, Name = v.Name, BaseVoiceId = v.BaseVoiceId, StorageKey = v.StorageKey,
            TunedVoiceId = v.TunedVoiceId, TunedVoiceProviderId = v.TunedVoiceProviderId, TuneRefusedAtUtc = v.TuneRefusedAtUtc,
            CachedLineKeys = [.. v.CachedLineKeys]
        };
    }
}

public class OpenAiCompatibleTtsProviderTuningTests
{
    private const string BaseUrl = "http://localhost:8880/v1/";

    private static (OpenAiCompatibleTtsProvider Provider, StubHandler Handler) Build(bool isLocal = true)
    {
        var options = new AiOptions
        {
            Providers = { ["kokoro"] = new AiProviderOptions { BaseUrl = BaseUrl, Model = "kokoro", IsLocal = isLocal } }
        };
        var handler = new StubHandler();
        return (new OpenAiCompatibleTtsProvider(
            AiProviderId.Parse("kokoro"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver(isLocal ? null : "tts-key-value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<OpenAiCompatibleTtsProvider>.Instance), handler);
    }

    [Fact]
    public async Task It_saves_the_tuned_voice_beside_v1_and_returns_its_id()
    {
        var (provider, handler) = Build();
        handler.RespondJson(@"{""voice"":""af_vpabc_tuned""}");

        var voice = await provider.TuneVoiceAsync(AudioBytes.Wav(5), "af_vpabc", CancellationToken.None);

        Assert.Equal("af_vpabc_tuned", voice);
        Assert.Equal(HttpMethod.Post, handler.Requests[0].Method);
        Assert.Equal("http://localhost:8880/dev/tune", handler.Requests[0].RequestUri!.ToString());
        Assert.Contains("name=save_voice", handler.Bodies[0]);
        Assert.Contains("af_vpabc", handler.Bodies[0]);
    }

    [Fact]
    public async Task A_voice_already_kept_under_the_name_is_the_one_wanted()
    {
        var (provider, handler) = Build();
        handler.Respond(HttpStatusCode.Conflict, @"{""detail"":{""error"":""conflict""}}");

        Assert.Equal("af_vpabc_tuned", await provider.TuneVoiceAsync(AudioBytes.Wav(5), "af_vpabc", CancellationToken.None));
    }

    [Fact]
    public async Task A_hosted_endpoint_is_never_sent_a_recording()
    {
        var (provider, handler) = Build(isLocal: false);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.TuneVoiceAsync(AudioBytes.Wav(5), "af_vpabc", CancellationToken.None));

        Assert.Equal("tuning-unavailable", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task Deleting_a_voice_that_is_already_gone_is_not_an_error()
    {
        var (provider, handler) = Build();
        handler.Respond(HttpStatusCode.NotFound, "{}");

        await provider.DeleteTunedVoiceAsync("af_vpabc_tuned", CancellationToken.None);

        Assert.Equal(HttpMethod.Delete, handler.Requests[0].Method);
        Assert.Equal("http://localhost:8880/dev/tune/af_vpabc_tuned", handler.Requests[0].RequestUri!.ToString());
    }

    [Theory]
    [InlineData("h", "h")]
    [InlineData(null, null)]
    [InlineData("hi", null)]
    public async Task Only_a_kokoro_language_code_is_sent(string? languageCode, string? sent)
    {
        var (provider, handler) = Build();
        handler.RespondBytes(AudioBytes.Wav(1), "audio/wav");

        await provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "नमस्ते", VoiceId = "am_vpabc_tuned", LanguageCode = languageCode }, CancellationToken.None);

        var body = handler.Sent();
        Assert.Equal(sent, body.TryGetProperty("lang_code", out var value) ? value.GetString() : null);
    }

    [Theory]
    [InlineData("af_heart")]
    [InlineData("../af_x_tuned")]
    public async Task Only_tuned_voices_can_be_deleted(string voiceId)
    {
        var (provider, handler) = Build();

        await Assert.ThrowsAsync<ArgumentException>(() => provider.DeleteTunedVoiceAsync(voiceId, CancellationToken.None));
        Assert.Empty(handler.Requests);
    }
}
