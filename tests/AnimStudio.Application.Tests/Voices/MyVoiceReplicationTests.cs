using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Voices;

public class MyVoiceReplicationTests
{
    private const string ProfileId = "vp_0123456789abcdef0123456789abcdef";
    private const string SampleKey = $"voice-profiles/{ProfileId}/sample.webm";
    private const string ConsentKey = $"voice-profiles/{ProfileId}/google-consent.webm";

    private sealed record World(MyVoiceReplication Replication, FakeReplicator Replicator, Profiles Voices, FakeRenderer Renderer);

    private static World Build(bool geminiOn = true)
    {
        var replicator = new FakeReplicator();
        var options = new AiOptions
        {
            Chains = { ["Speech"] = geminiOn ? ["gemini-tts"] : [] },
            Providers =
            {
                ["gemini-tts"] = new AiProviderOptions
                {
                    Enabled = geminiOn, BaseUrl = "https://generativelanguage.googleapis.com/v1beta"
                }
            }
        };
        var clock = new ManualTimeProvider(new DateTimeOffset(2026, 10, 9, 12, 0, 0, TimeSpan.Zero));
        var registry = new AiProviderRegistry([replicator], new StaticOptionsMonitor<AiOptions>(options), clock,
            NullLogger<AiProviderRegistry>.Instance);
        var voices = new Profiles();
        voices.Items[ProfileId] = new VoiceProfile
        {
            Id = ProfileId, UserId = "user-1", Name = "Me", BaseVoiceId = "hm_omega", StorageKey = SampleKey
        };
        var renderer = new FakeRenderer();

        return new World(
            new MyVoiceReplication(registry, [replicator], renderer, voices, clock, NullLogger<MyVoiceReplication>.Instance),
            replicator, voices, renderer);
    }

    [Fact]
    public async Task Replicating_sends_the_prepared_sample_and_consent_and_records_the_voice_on_the_profile()
    {
        var world = Build();

        var updated = await world.Replication.ReplicateAsync(world.Voices.Items[ProfileId], ConsentKey, "user-1", CancellationToken.None);

        Assert.Equal([SampleKey, ConsentKey], world.Renderer.Prepared);
        Assert.Equal("voice_made1", updated.GoogleVoiceId);
        var stored = world.Voices.Items[ProfileId];
        Assert.Equal("voice_made1", stored.GoogleVoiceId);
        Assert.Equal("gemini-tts", stored.GoogleVoiceProviderId);
        Assert.Equal(new DateTime(2026, 10, 9, 12, 0, 0, DateTimeKind.Utc), stored.GoogleConsentAtUtc);
    }

    [Fact]
    public async Task Replicating_again_deletes_the_voice_made_before()
    {
        var world = Build();
        var profile = world.Voices.Items[ProfileId];

        await world.Replication.ReplicateAsync(profile, ConsentKey, "user-1", CancellationToken.None);
        await world.Replication.ReplicateAsync(world.Voices.Items[ProfileId], ConsentKey, "user-1", CancellationToken.None);

        Assert.Equal("voice_made2", world.Voices.Items[ProfileId].GoogleVoiceId);
        Assert.Equal(["voice_made1"], world.Replicator.Deleted);
    }

    [Fact]
    public async Task A_voice_deleted_while_google_made_it_is_deleted_there_too()
    {
        var world = Build();
        var profile = world.Voices.Items[ProfileId];
        world.Replicator.OnReplicate = () => world.Voices.Items.Remove(ProfileId);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            world.Replication.ReplicateAsync(profile, ConsentKey, "user-1", CancellationToken.None));

        Assert.Equal(["voice_made1"], world.Replicator.Deleted);
    }

    [Fact]
    public async Task Without_gemini_switched_on_nothing_can_replicate()
    {
        var world = Build(geminiOn: false);

        Assert.Null(world.Replication.Replicator());
        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            world.Replication.ReplicateAsync(world.Voices.Items[ProfileId], ConsentKey, "user-1", CancellationToken.None));
        Assert.Equal("not-configured", ex.Code);
        Assert.Empty(world.Replicator.Made);
    }

    [Fact]
    public async Task Forgetting_deletes_the_voice_where_it_is_kept_and_a_failure_does_not_throw()
    {
        var world = Build();
        var profile = world.Voices.Items[ProfileId];
        profile.GoogleVoiceId = "voice_old";
        profile.GoogleVoiceProviderId = "gemini-tts";
        world.Replicator.DeleteFailure = new AiProviderException("provider-error", "down");

        await world.Replication.ForgetAsync(profile, CancellationToken.None);

        Assert.Equal(["voice_old"], world.Replicator.Deleted);
    }

    [Theory]
    [InlineData("gemini-tts", "voice_x")]
    [InlineData("GEMINI-TTS", "voice_x")]
    [InlineData("kokoro", null)]
    [InlineData(null, null)]
    public void A_line_uses_the_replicated_voice_only_on_the_engine_that_keeps_it(string? engine, string? expected)
    {
        var profile = new VoiceProfile { GoogleVoiceId = "voice_x", GoogleVoiceProviderId = "gemini-tts" };

        Assert.Equal(expected, MyVoiceReplication.VoiceFor(profile, engine));
        Assert.Null(MyVoiceReplication.VoiceFor(new VoiceProfile(), "gemini-tts"));
    }

    private sealed class FakeReplicator : IVoiceReplicatingSpeechProvider
    {
        public List<string> Made { get; } = [];
        public List<string> Deleted { get; } = [];
        public Action? OnReplicate { get; set; }
        public AiProviderException? DeleteFailure { get; set; }

        public AiProviderId Id { get; } = AiProviderId.Parse("gemini-tts");
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) => throw new NotSupportedException();

        public Task<string> ReplicateVoiceAsync(byte[] sampleWav, byte[] consentWav, string displayName, CancellationToken ct)
        {
            Assert.Equal(AiAudioValidator.Wav, AiAudioValidator.Sniff(sampleWav));
            Assert.Equal(AiAudioValidator.Wav, AiAudioValidator.Sniff(consentWav));
            var id = $"voice_made{Made.Count + 1}";
            Made.Add(id);
            OnReplicate?.Invoke();
            return Task.FromResult(id);
        }

        public Task DeleteReplicatedVoiceAsync(string voiceId, CancellationToken ct)
        {
            Deleted.Add(voiceId);
            return DeleteFailure is null ? Task.CompletedTask : Task.FromException(DeleteFailure);
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

    private sealed class Profiles : IVoiceProfileRepository
    {
        public Dictionary<string, VoiceProfile> Items { get; } = [];

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
            GoogleVoiceId = v.GoogleVoiceId, GoogleVoiceProviderId = v.GoogleVoiceProviderId,
            GoogleConsentAtUtc = v.GoogleConsentAtUtc
        };
    }
}
