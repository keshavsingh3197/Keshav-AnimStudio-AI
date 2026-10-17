using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

/// <summary>Speaking with an engine and model picked in the voiceover panel, instead of the chain.</summary>
public class SpeechEngineChoiceTests
{
    private sealed class RecordingSpeechProvider(string id) : ISpeechAiProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public List<AiSpeechRequest> Requests { get; } = [];

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);

        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiVoice>>([]);

        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(new AiSpeechResult(AudioBytes.Wav(), "audio/wav", 1.0,
                new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Speech }));
        }
    }

    private static (AiExecutor Executor, InMemoryAiUsageRepository Usage) Build(
        AiOptions options, params IAiProvider[] providers)
    {
        var monitor = new StaticOptionsMonitor<AiOptions>(options);
        var clock = new ManualTimeProvider(new DateTimeOffset(2026, 10, 10, 12, 0, 0, TimeSpan.Zero));
        var registry = new AiProviderRegistry(providers, monitor, clock, NullLogger<AiProviderRegistry>.Instance);
        var cache = new AiResultCache(new InMemoryObjectStore(), monitor, clock, NullLogger<AiResultCache>.Instance);
        var usage = new InMemoryAiUsageRepository();
        return (new AiExecutor(registry, cache, new StubQuotaGuard(), usage, monitor, clock,
            NullLogger<AiExecutor>.Instance), usage);
    }

    private static AiSpeechRequest Line(string? engine = null, string? model = null) => new()
    {
        Text = "Namaste.", VoiceId = "en_US-amy-medium", ProviderId = engine, Model = model
    };

    [Fact]
    public async Task A_chosen_engine_is_used_even_when_it_is_not_first()
    {
        var kokoro = new RecordingSpeechProvider("kokoro");
        var piper = new RecordingSpeechProvider("piper-local");
        var (executor, _) = Build(AiOptionsBuilder.WithChain(AiCapability.Speech, "kokoro", "piper-local"), kokoro, piper);

        var outcome = await executor.SpeechAsync(Line("piper-local"), AiCallContext.None, CancellationToken.None);

        Assert.True(outcome.IsSuccess);
        Assert.Empty(kokoro.Requests);
        Assert.Single(piper.Requests);
    }

    [Fact]
    public async Task A_chosen_engine_that_is_not_on_is_unavailable_rather_than_another_engine()
    {
        // Voice ids belong to one engine: falling back would give a Piper voice to Kokoro and fail anyway.
        var kokoro = new RecordingSpeechProvider("kokoro");
        var (executor, _) = Build(AiOptionsBuilder.WithChain(AiCapability.Speech, "kokoro"), kokoro);

        var outcome = await executor.SpeechAsync(Line("piper-local"), AiCallContext.None, CancellationToken.None);

        Assert.Equal(AiOutcomeKind.Unavailable, outcome.Kind);
        Assert.Empty(kokoro.Requests);
    }

    [Fact]
    public async Task Without_a_choice_the_chain_order_decides_as_before()
    {
        var kokoro = new RecordingSpeechProvider("kokoro");
        var piper = new RecordingSpeechProvider("piper-local");
        var (executor, _) = Build(AiOptionsBuilder.WithChain(AiCapability.Speech, "kokoro", "piper-local"), kokoro, piper);

        await executor.SpeechAsync(Line(), AiCallContext.None, CancellationToken.None);

        Assert.Single(kokoro.Requests);
        Assert.Empty(piper.Requests);
    }

    [Fact]
    public async Task Another_model_is_another_take_not_a_cache_hit_and_is_recorded_by_name()
    {
        var piper = new RecordingSpeechProvider("piper-local");
        var (executor, usage) = Build(AiOptionsBuilder.WithChain(AiCapability.Speech, "piper-local"), piper);

        await executor.SpeechAsync(Line("piper-local", "voice-model-a"), AiCallContext.None, CancellationToken.None);
        await executor.SpeechAsync(Line("piper-local", "voice-model-b"), AiCallContext.None, CancellationToken.None);
        var again = await executor.SpeechAsync(Line("piper-local", "voice-model-b"), AiCallContext.None, CancellationToken.None);

        Assert.Equal(2, piper.Requests.Count);
        Assert.Equal("voice-model-b", piper.Requests[1].Model);
        Assert.True(again.Value!.Provenance.FromCache);
        Assert.Contains(usage.Records, r => r.Model == "voice-model-b" && r.Outcome == AiCallOutcome.Succeeded);
    }

    [Fact]
    public void Only_an_offered_or_configured_model_may_be_asked_for()
    {
        var offering = KnownAiProviders.Find(KnownAiProviders.OpenAiTts)! with
        {
            Models = [new AiModelChoice("tts-1-hd", "HD")]
        };

        Assert.True(offering.Allows("tts-1-hd", configuredModel: null));
        Assert.True(offering.Allows("my-own-tts-model", configuredModel: "my-own-tts-model"));
        Assert.False(offering.Allows("../../v1/files", configuredModel: null));
        Assert.False(KnownAiProviders.Find(KnownAiProviders.Kokoro)!.Allows("anything", configuredModel: "kokoro"));
    }
}
