using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiExecutorTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);

    private sealed class World
    {
        public required AiExecutor Executor { get; init; }
        public required AiProviderRegistry Registry { get; init; }
        public required InMemoryAiUsageRepository Usage { get; init; }
        public required InMemoryObjectStore Store { get; init; }
        public required StubQuotaGuard Quota { get; init; }
        public required ManualTimeProvider Clock { get; init; }
    }

    private static World Build(AiOptions options, params IAiProvider[] providers)
    {
        var monitor = new StaticOptionsMonitor<AiOptions>(options);
        var clock = new ManualTimeProvider(Now);

        var registry = new AiProviderRegistry(
            providers, monitor, clock, NullLogger<AiProviderRegistry>.Instance);

        var store = new InMemoryObjectStore();
        var cache = new AiResultCache(store, monitor, clock, NullLogger<AiResultCache>.Instance);
        var usage = new InMemoryAiUsageRepository();
        var quota = new StubQuotaGuard();

        return new World
        {
            Executor = new AiExecutor(
                registry, cache, quota, usage, monitor, clock, NullLogger<AiExecutor>.Instance),
            Registry = registry,
            Usage = usage,
            Store = store,
            Quota = quota,
            Clock = clock
        };
    }

    private static AiTextRequest Ask(string prompt = "who is speaking?") => new() { Prompt = prompt };

    [Fact]
    public async Task With_nothing_configured_the_caller_is_told_to_degrade_rather_than_handed_an_exception()
    {
        // The blueprint requires every feature to work with no AI, so "unavailable" is a
        // normal answer and must not arrive as an exception.
        var world = Build(new AiOptions());

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.False(outcome.IsSuccess);
        Assert.Equal(AiOutcomeKind.Unavailable, outcome.Kind);
        Assert.Equal(AiUnavailableReason.NotConfigured, outcome.Reason);
    }

    [Fact]
    public async Task A_successful_call_returns_the_result_with_provenance()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        options.Providers["groq"].Model = "llama-3.3-70b";

        var provider = new ScriptedTextProvider("groq", r => $"answer to {r.Prompt}");
        var world = Build(options, provider);

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.True(outcome.IsSuccess);
        Assert.Equal("answer to who is speaking?", outcome.Value!.Text);
        Assert.Equal("groq", outcome.Value.Provenance.ProviderId);
        Assert.Equal("llama-3.3-70b", outcome.Value.Provenance.Model);
        Assert.False(outcome.Value.Provenance.FromCache);
        Assert.NotNull(outcome.Value.Provenance.PromptHash);
        Assert.Equal(Now.UtcDateTime, outcome.Value.Provenance.GeneratedAtUtc);
    }

    [Fact]
    public async Task The_prompt_itself_is_never_stored_in_provenance_only_its_hash()
    {
        // A prompt carries the user's transcript. The hash is enough to tell whether two
        // generations should match, and safe to keep on an asset forever.
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var world = Build(options, new ScriptedTextProvider("groq", _ => "ok"));

        var outcome = await world.Executor.TextAsync(
            Ask("my private transcript"), AiCallContext.None, CancellationToken.None);

        var hash = outcome.Value!.Provenance.PromptHash!;
        Assert.DoesNotContain("private", hash, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(64, hash.Length);
    }

    [Fact]
    public async Task An_identical_second_request_is_served_from_cache_without_calling_the_provider()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var provider = new ScriptedTextProvider("groq", _ => "generated once");
        var world = Build(options, provider);

        var first = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);
        var second = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal(1, provider.CallCount);
        Assert.Equal(first.Value!.Text, second.Value!.Text);
        Assert.False(first.Value.Provenance.FromCache);
        Assert.True(second.Value.Provenance.FromCache);
    }

    [Fact]
    public async Task A_different_prompt_is_a_different_cache_entry()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var provider = new ScriptedTextProvider("groq", r => r.Prompt.ToUpperInvariant());
        var world = Build(options, provider);

        await world.Executor.TextAsync(Ask("one"), AiCallContext.None, CancellationToken.None);
        var second = await world.Executor.TextAsync(Ask("two"), AiCallContext.None, CancellationToken.None);

        Assert.Equal(2, provider.CallCount);
        Assert.Equal("TWO", second.Value!.Text);
    }

    [Fact]
    public async Task Bypassing_the_cache_regenerates_and_refreshes_the_entry()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var provider = new ScriptedTextProvider("groq", _ => "fresh");
        var world = Build(options, provider);

        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        var regenerated = await world.Executor.TextAsync(
            new AiTextRequest { Prompt = "who is speaking?", BypassCache = true },
            AiCallContext.None, CancellationToken.None);

        Assert.Equal(2, provider.CallCount);
        Assert.False(regenerated.Value!.Provenance.FromCache);
    }

    [Fact]
    public async Task A_cache_hit_is_served_even_when_the_provider_is_out_of_quota()
    {
        // The result is already paid for. Refusing to hand it back would be perverse.
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var provider = new ScriptedTextProvider("groq", _ => "cached");
        var world = Build(options, provider);

        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);
        world.Quota.Block("groq");

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.True(outcome.IsSuccess);
        Assert.True(outcome.Value!.Provenance.FromCache);
    }

    [Fact]
    public async Task An_exhausted_provider_is_skipped_and_the_next_one_answers()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq", "ollama");
        var exhausted = new ScriptedTextProvider("groq", _ => "should not be called");
        var backup = new ScriptedTextProvider("ollama", _ => "from the local model");

        var world = Build(options, exhausted, backup);
        world.Quota.Block("groq");

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal(0, exhausted.CallCount);
        Assert.Equal("from the local model", outcome.Value!.Text);
        Assert.Contains(world.Usage.Records,
            r => r.ProviderId == "groq" && r.Outcome == AiCallOutcome.RefusedByQuota);
    }

    [Fact]
    public async Task A_failing_provider_falls_through_to_the_next_one()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq", "ollama");
        var broken = new ScriptedTextProvider("groq", _ => "never")
        {
            Throws = new AiProviderException("rate-limited", "429")
        };
        var backup = new ScriptedTextProvider("ollama", _ => "rescued");

        var world = Build(options, broken, backup);

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.True(outcome.IsSuccess);
        Assert.Equal("rescued", outcome.Value!.Text);
        Assert.Contains(world.Usage.Records,
            r => r.ProviderId == "groq" && r.Outcome == AiCallOutcome.Failed
                 && r.ErrorCode == "rate-limited");
    }

    [Fact]
    public async Task A_failure_is_reported_to_the_circuit_breaker()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq", "ollama");
        options.Circuit.FailureThreshold = 1;

        var broken = new ScriptedTextProvider("groq", _ => "never")
        {
            Throws = new AiProviderException("boom", "failed")
        };
        var backup = new ScriptedTextProvider("ollama", _ => "ok");

        var world = Build(options, broken, backup);

        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        // The next render must not rediscover that this provider is down.
        Assert.Equal(["ollama"], world.Registry.TextChain().Select(p => p.Id.Value));
    }

    [Fact]
    public async Task When_every_provider_fails_the_outcome_carries_the_last_error_code()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var broken = new ScriptedTextProvider("groq", _ => "never")
        {
            Throws = new AiProviderException("upstream-500", "failed")
        };

        var world = Build(options, broken);

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal(AiOutcomeKind.Failed, outcome.Kind);
        Assert.Equal("upstream-500", outcome.ErrorCode);
    }

    [Fact]
    public async Task When_every_provider_is_out_of_quota_that_is_reported_as_the_reason()
    {
        // "Out of quota until tomorrow" is a different answer from "it broke", and the UI
        // should be able to say which.
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq", "ollama");
        var world = Build(options,
            new ScriptedTextProvider("groq", _ => "x"), new ScriptedTextProvider("ollama", _ => "y"));

        world.Quota.DefaultAllowed = false;

        var outcome = await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal(AiOutcomeKind.Unavailable, outcome.Kind);
        Assert.Equal(AiUnavailableReason.QuotaExhausted, outcome.Reason);
    }

    [Fact]
    public async Task Usage_is_recorded_against_the_calling_project_and_user()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var world = Build(options, new ScriptedTextProvider("groq", _ => "ok"));

        await world.Executor.TextAsync(
            Ask(), new AiCallContext("project-1", "user-1"), CancellationToken.None);

        var record = Assert.Single(world.Usage.Records);
        Assert.Equal("project-1", record.ProjectId);
        Assert.Equal("user-1", record.UserId);
        Assert.Equal(AiCallOutcome.Succeeded, record.Outcome);
        Assert.Equal("2026-09-05", record.DayBucket);
    }

    [Fact]
    public async Task A_cache_hit_is_recorded_too_so_the_hit_rate_is_measurable()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var world = Build(options, new ScriptedTextProvider("groq", _ => "ok"));

        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);
        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal(2, world.Usage.Records.Count);
        Assert.Contains(world.Usage.Records, r => r.Outcome == AiCallOutcome.CacheHit);
    }

    [Fact]
    public async Task Images_round_trip_through_the_cache_with_their_bytes_and_mime_type_intact()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Image, "pollinations");
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D];

        var provider = new ScriptedImageProvider("pollinations", png);
        var world = Build(options, provider);

        var request = new AiImageRequest { Prompt = "a wrestling ring", Seed = 42 };

        var first = await world.Executor.ImageAsync(request, AiCallContext.None, CancellationToken.None);
        var second = await world.Executor.ImageAsync(request, AiCallContext.None, CancellationToken.None);

        Assert.Equal(1, provider.CallCount);
        Assert.Equal(png, second.Value!.Content);
        Assert.Equal("image/png", second.Value.MimeType);
        Assert.True(second.Value.Provenance.FromCache);
        Assert.Equal(42, second.Value.Provenance.Seed);
    }

    [Fact]
    public async Task The_same_prompt_with_a_different_seed_is_generated_again()
    {
        // Seed is what keeps a character's face stable, so it has to be part of the key.
        var options = AiOptionsBuilder.WithChain(AiCapability.Image, "pollinations");
        var provider = new ScriptedImageProvider("pollinations", [1]);
        var world = Build(options, provider);

        await world.Executor.ImageAsync(
            new AiImageRequest { Prompt = "hero", Seed = 1 }, AiCallContext.None, CancellationToken.None);
        await world.Executor.ImageAsync(
            new AiImageRequest { Prompt = "hero", Seed = 2 }, AiCallContext.None, CancellationToken.None);

        Assert.Equal(2, provider.CallCount);
    }

    [Fact]
    public async Task Two_providers_do_not_share_a_cache_entry()
    {
        // Caching by prompt alone would serve one provider's output as another's, and the
        // provenance on the asset would then be a lie.
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        var groq = new ScriptedTextProvider("groq", _ => "from groq");
        var world = Build(options, groq);

        await world.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        var switched = AiOptionsBuilder.WithChain(AiCapability.Text, "ollama");
        var ollama = new ScriptedTextProvider("ollama", _ => "from ollama");
        var second = Build(switched, ollama);

        var outcome = await second.Executor.TextAsync(Ask(), AiCallContext.None, CancellationToken.None);

        Assert.Equal("from ollama", outcome.Value!.Text);
        Assert.Equal(1, ollama.CallCount);
    }

    [Fact]
    public async Task Cancellation_propagates_instead_of_being_treated_as_a_provider_fault()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        options.Circuit.FailureThreshold = 1;

        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        var provider = new ScriptedTextProvider("groq", _ => "never");
        var world = Build(options, provider);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            world.Executor.TextAsync(Ask(), AiCallContext.None, cts.Token));

        // The caller gave up; the provider did nothing wrong and must not be penalised.
        Assert.Single(world.Registry.TextChain());
    }

    [Fact]
    public async Task Transcription_without_an_audio_digest_is_not_cached()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Transcription, "whispercpp-local");
        var provider = new CountingTranscriptionProvider("whispercpp-local");
        var world = Build(options, provider);

        var request = new AiTranscriptionRequest { AudioPath = "/tmp/a.wav" };

        await world.Executor.TranscribeAsync(request, AiCallContext.None, CancellationToken.None);
        await world.Executor.TranscribeAsync(request, AiCallContext.None, CancellationToken.None);

        // Two identical paths are not evidence of identical audio, so the executor must not
        // assume they are.
        Assert.Equal(2, provider.CallCount);
        Assert.Empty(world.Store.Keys);
    }

    [Fact]
    public async Task Transcription_with_an_audio_digest_is_cached()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Transcription, "whispercpp-local");
        var provider = new CountingTranscriptionProvider("whispercpp-local");
        var world = Build(options, provider);

        var request = new AiTranscriptionRequest
        {
            AudioPath = "/tmp/a.wav",
            CacheFingerprint = "sha256-of-the-audio"
        };

        await world.Executor.TranscribeAsync(request, AiCallContext.None, CancellationToken.None);
        var second = await world.Executor.TranscribeAsync(
            request, AiCallContext.None, CancellationToken.None);

        Assert.Equal(1, provider.CallCount);
        Assert.Equal("srt", second.Value!.Format);
        Assert.True(second.Value.Provenance.FromCache);
    }

    private sealed class CountingTranscriptionProvider(string id) : ITranscriptionProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Transcription;
        public bool IsConfigured => true;
        public int CallCount { get; private set; }

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) =>
            Task.FromResult(AiProviderHealth.Healthy);

        public Task<AiTranscriptionResult> TranscribeAsync(
            AiTranscriptionRequest request, CancellationToken ct)
        {
            CallCount++;
            return Task.FromResult(new AiTranscriptionResult(
                "1\n00:00:00,000 --> 00:00:02,000\nhello\n",
                "srt",
                new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Transcription },
                "en"));
        }
    }
}
