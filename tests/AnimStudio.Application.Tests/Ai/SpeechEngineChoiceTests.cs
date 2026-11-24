using System.Net;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Rendering;
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

    [Fact]
    public void Saved_speech_chain_never_silently_appends_gtts_or_enables_free_fallback()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Speech, KnownAiProviders.GeminiTts, KnownAiProviders.GoogleTts);
        var settings = new AiSettings
        {
            Chains = new Dictionary<string, List<string>>
            {
                ["Speech"] = [KnownAiProviders.GeminiTts, KnownAiProviders.Kokoro]
            },
            Providers =
            [
                new AiProviderSettings { ProviderId = KnownAiProviders.GeminiTts, Enabled = true, Model = "gemini-2.5-pro-preview-tts" },
                new AiProviderSettings { ProviderId = KnownAiProviders.GoogleTts, Enabled = false }
            ]
        };

        AiSettingsOverlay.Apply(options, settings);

        Assert.Equal([KnownAiProviders.GeminiTts, KnownAiProviders.Kokoro], options.Chains["Speech"]);
        Assert.DoesNotContain(KnownAiProviders.GoogleTts, options.Chains["Speech"]);
        Assert.False(options.Providers[KnownAiProviders.GoogleTts].Enabled);

        var geminiCatalog = KnownAiProviders.Find(KnownAiProviders.GeminiTts);
        Assert.NotNull(geminiCatalog?.Models);
        var proModel = Assert.Single(geminiCatalog!.Models!, m => m.Id == "gemini-2.5-pro-preview-tts");
        Assert.Equal("best", proModel.Tier);
    }

    [Fact]
    public async Task Single_provider_rate_limit_preserves_chain_without_tripping_circuit_breaker()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Speech, KnownAiProviders.GeminiTts);
        options.Providers[KnownAiProviders.GeminiTts].Model = "gemini-2.5-pro-preview-tts";

        var rateLimitedGemini = new ThrowingSpeechProvider(
            KnownAiProviders.GeminiTts,
            () => new AiProviderException("rate-limited", "429 Too Many Requests"));

        var monitor = new StaticOptionsMonitor<AiOptions>(options);
        var clock = new ManualTimeProvider(new DateTimeOffset(2026, 11, 22, 12, 0, 0, TimeSpan.Zero));
        var registry = new AiProviderRegistry([rateLimitedGemini], monitor, clock, NullLogger<AiProviderRegistry>.Instance);
        var cache = new AiResultCache(new InMemoryObjectStore(), monitor, clock, NullLogger<AiResultCache>.Instance);
        var executor = new AiExecutor(registry, cache, new StubQuotaGuard(), new InMemoryAiUsageRepository(), monitor, clock, NullLogger<AiExecutor>.Instance);

        var outcome = await executor.SpeechAsync(Line(KnownAiProviders.GeminiTts), AiCallContext.None, CancellationToken.None);

        Assert.Equal(AiOutcomeKind.Failed, outcome.Kind);
        Assert.Equal("rate-limited", outcome.ErrorCode);
        // Single configured provider must remain in SpeechChain (never circuit-tripped to empty or dropped to free fallback).
        Assert.Single(registry.SpeechChain());
        Assert.Equal(KnownAiProviders.GeminiTts, registry.SpeechChain()[0].Id.Value);
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_never_silently_downgrades_pro_model_to_flash()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-strict-pro-tts-");
        try
        {
            var options = AiOptionsBuilder.WithChain(AiCapability.Speech, KnownAiProviders.GeminiTts);
            options.Providers[KnownAiProviders.GeminiTts].Model = "gemini-2.5-pro-preview-tts";

            var missingModelGemini = new ThrowingSpeechProvider(
                KnownAiProviders.GeminiTts,
                () => new AiProviderException("endpoint-or-model-not-found", "404 Not Found"));

            var monitor = new StaticOptionsMonitor<AiOptions>(options);
            var clock = new ManualTimeProvider(new DateTimeOffset(2026, 11, 22, 12, 0, 0, TimeSpan.Zero));
            var registry = new AiProviderRegistry([missingModelGemini], monitor, clock, NullLogger<AiProviderRegistry>.Instance);
            var cache = new AiResultCache(new InMemoryObjectStore(), monitor, clock, NullLogger<AiResultCache>.Instance);
            var executor = new AiExecutor(registry, cache, new StubQuotaGuard(), new InMemoryAiUsageRepository(), monitor, clock, NullLogger<AiExecutor>.Instance);

            var plan = DialogueScriptParser.ParsePlan(
                "Bhakt Prahlad", "[भगवान नरसिंह]: अधर्म का अंत निश्चित है!", null, 12, enableDialogue: true);
            var req = new ProceduralVideoRequest
            {
                Title = "Bhakt Prahlad",
                SpeechProviderId = KnownAiProviders.GeminiTts
            };

            var outcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                req, plan, Path.Combine(tempDir.FullName, "in"), "user-1", 12,
                executor, registry, new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);

            Assert.Null(outcome.Result);
            Assert.NotEmpty(missingModelGemini.Requests);
            Assert.DoesNotContain(missingModelGemini.Requests, r =>
                string.Equals(r.Model, "gemini-2.5-flash-preview-tts", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_bypasses_and_heals_corrupt_cached_audio_on_unusable_format()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-heal-speech-cache-");
        try
        {
            var options = AiOptionsBuilder.WithChain(AiCapability.Speech, KnownAiProviders.GeminiTts);
            options.Providers[KnownAiProviders.GeminiTts].Model = "gemini-2.5-pro-preview-tts";

            // Valid 48kHz stereo 16-bit PCM WAV (~0.4s) for the uncached healing retry.
            var goodWav = new byte[44 + 48_000 * 4 / 2];
            System.Text.Encoding.ASCII.GetBytes("RIFF").CopyTo(goodWav, 0);
            System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(goodWav.AsSpan(4, 4), goodWav.Length - 8);
            System.Text.Encoding.ASCII.GetBytes("WAVEfmt ").CopyTo(goodWav, 8);
            System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(goodWav.AsSpan(16, 4), 16);
            System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(goodWav.AsSpan(20, 2), 1);
            System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(goodWav.AsSpan(22, 2), 2);
            System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(goodWav.AsSpan(24, 4), 48_000);
            System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(goodWav.AsSpan(28, 4), 192_000);
            System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(goodWav.AsSpan(32, 2), 4);
            System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(goodWav.AsSpan(34, 2), 16);
            System.Text.Encoding.ASCII.GetBytes("data").CopyTo(goodWav, 36);
            System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(goodWav.AsSpan(40, 4), goodWav.Length - 44);

            // Corrupt MP3-sniffed payload (0xFF 0xFF raw bytes) simulating poisoned prior cache.
            var corruptBytes = new byte[4_800];
            Array.Fill<byte>(corruptBytes, 0xFF);

            var callCount = 0;
            var healingGemini = new SequenceSpeechProvider(KnownAiProviders.GeminiTts, req =>
            {
                callCount++;
                if (!req.BypassCache && callCount == 1)
                    return new AiSpeechResult(corruptBytes, AiAudioValidator.Mp3, 1.0, new AiProvenance { ProviderId = KnownAiProviders.GeminiTts, Capability = AiCapability.Speech });
                return new AiSpeechResult(goodWav, AiAudioValidator.Wav, 0.5, new AiProvenance { ProviderId = KnownAiProviders.GeminiTts, Capability = AiCapability.Speech });
            });

            var monitor = new StaticOptionsMonitor<AiOptions>(options);
            var clock = new ManualTimeProvider(new DateTimeOffset(2026, 11, 22, 12, 0, 0, TimeSpan.Zero));
            var registry = new AiProviderRegistry([healingGemini], monitor, clock, NullLogger<AiProviderRegistry>.Instance);
            var cache = new AiResultCache(new InMemoryObjectStore(), monitor, clock, NullLogger<AiResultCache>.Instance);
            var executor = new AiExecutor(registry, cache, new StubQuotaGuard(), new InMemoryAiUsageRepository(), monitor, clock, NullLogger<AiExecutor>.Instance);

            var plan = DialogueScriptParser.ParsePlan(
                "Corrupt Cache Recovery", "[पप्पू भैया]: हाय करंट लग गया वो?!", null, 10, enableDialogue: true);
            var req = new ProceduralVideoRequest
            {
                Title = "Corrupt Cache Recovery",
                SpeechProviderId = KnownAiProviders.GeminiTts
            };

            var outcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                req, plan, Path.Combine(tempDir.FullName, "in"), "user-1", 10,
                executor, registry, new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);

            Assert.NotNull(outcome.Result);
            Assert.Equal(2, healingGemini.Requests.Count);
            Assert.False(healingGemini.Requests[0].BypassCache);
            Assert.True(healingGemini.Requests[1].BypassCache);
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_batches_two_speaker_Gemini_turns_and_splits_at_silence_valleys()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-gemini-batch-split-");
        try
        {
            var options = AiOptionsBuilder.WithChain(AiCapability.Speech, KnownAiProviders.GeminiTts);
            options.Providers[KnownAiProviders.GeminiTts].Model = "gemini-2.5-pro-preview-tts";

            // Build a 48kHz stereo PCM WAV with 4 speech bursts separated by 180ms silence gaps (~4.8s total).
            static byte[] BuildSegmentedWav(int segments, double speechSec = 1.0, double silenceSec = 0.18)
            {
                const int sr = 48_000;
                var spFrames = (int)(sr * speechSec);
                var siFrames = (int)(sr * silenceSec);
                var totalFrames = segments * spFrames + Math.Max(0, segments - 1) * siFrames;
                var wav = new byte[44 + totalFrames * 4];
                System.Text.Encoding.ASCII.GetBytes("RIFF").CopyTo(wav, 0);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(4, 4), wav.Length - 8);
                System.Text.Encoding.ASCII.GetBytes("WAVEfmt ").CopyTo(wav, 8);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(16, 4), 16);
                System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(20, 2), 1);
                System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(22, 2), 2);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(24, 4), sr);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(28, 4), sr * 4);
                System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(32, 2), 4);
                System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(34, 2), 16);
                System.Text.Encoding.ASCII.GetBytes("data").CopyTo(wav, 36);
                System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(40, 4), totalFrames * 4);

                var cursor = 0;
                for (var s = 0; s < segments; s++)
                {
                    for (var f = 0; f < spFrames; f++)
                    {
                        var amp = (short)(8000 * Math.Sin(2 * Math.PI * 220 * f / sr));
                        var off = 44 + (cursor + f) * 4;
                        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(off, 2), amp);
                        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(off + 2, 2), amp);
                    }
                    cursor += spFrames + siFrames;
                }
                return wav;
            }

            var batchedGemini = new SequenceSpeechProvider(KnownAiProviders.GeminiTts, req =>
            {
                var turnsInReq = req.Text.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length;
                var wav = BuildSegmentedWav(Math.Max(1, turnsInReq));
                return new AiSpeechResult(wav, AiAudioValidator.Wav, turnsInReq * 1.15, new AiProvenance { ProviderId = KnownAiProviders.GeminiTts, Capability = AiCapability.Speech });
            });

            var monitor = new StaticOptionsMonitor<AiOptions>(options);
            var clock = new ManualTimeProvider(new DateTimeOffset(2026, 11, 24, 6, 0, 0, TimeSpan.Zero));
            var registry = new AiProviderRegistry([batchedGemini], monitor, clock, NullLogger<AiProviderRegistry>.Instance);
            var cache = new AiResultCache(new InMemoryObjectStore(), monitor, clock, NullLogger<AiResultCache>.Instance);
            var executor = new AiExecutor(registry, cache, new StubQuotaGuard(), new InMemoryAiUsageRepository(), monitor, clock, NullLogger<AiExecutor>.Instance);

            var script = """
                [देवर्षि नारद मुनि]: नारायण नारायण! हे श्रीहरि, आज काशी क्यों पधार रहे हैं?
                [भगवान श्रीहरि विष्णु]: हे देवर्षि! आज मैं काशी में सहस्र कमल अर्पित करूँगा।
                [देवर्षि नारद मुनि]: धन्य हैं प्रभु! इस पावन लीला के दर्शन कर त्रिलोकी कृतार्थ होगी।
                [भगवान श्रीहरि विष्णु]: अवश्य देवर्षि! आइए गंगा तट पर स्नान कर पूजन प्रारंभ करें।
                [देवर्षि नारद मुनि]: देखिए काशी का यह दिव्य अलौकिक प्रभात दृश्य और आरती की ज्योति।
                [भगवान श्रीहरि विष्णु]: अब हम एक सहस्र स्वर्ण कमल महादेव को अर्पित करते हैं।
                [देवर्षि नारद मुनि]: हे प्रभु! एक कमल कम हो जाने पर आप अपना नेत्र क्यों अर्पित कर रहे हैं?
                [भगवान श्रीहरि विष्णु]: संसार मुझे कमलनयन कहता है, अतः मैं अपना नेत्र शिवलिंग पर चढ़ाऊँगा।
                [देवर्षि नारद मुनि]: आपकी यह अनुपम शिव-भक्ति समस्त सृष्टि के लिए आदर्श है।
                [भगवान श्रीहरि विष्णु]: शिव और हरि एक ही हैं, इनमें भेद करने वाले कभी शांति नहीं पाते।
                [देवर्षि नारद मुनि]: धन्य हुआ यह कार्तिक शुक्ल चतुर्दशी का पावन हरिहर मिलन पर्व!
                [भगवान श्रीहरि विष्णु]: जो भक्त आज दीपदान करेंगे, उन पर हरि और हर दोनों की कृपा बरसेगी।
                """;

            var plan = DialogueScriptParser.ParsePlan(
                "Harihar Milan", script, null, 120, enableDialogue: true);
            var req = new ProceduralVideoRequest
            {
                Title = "Harihar Milan",
                EventType = "DailyKatha",
                SpeechProviderId = KnownAiProviders.GeminiTts
            };

            var logMessages = new List<string>();
            var testLogger = new CaptureLogger(logMessages);
            var outcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                req, plan, Path.Combine(tempDir.FullName, "in"), "user-1", 120,
                executor, registry, new FfmpegOptions(), testLogger, CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);

            Assert.NotNull(outcome.Result);
            // 12 alternating two-speaker Full-Story turns compressed into 3 batched Gemini calls (instead of 12!).
            Assert.Equal(3, batchedGemini.Requests.Count);
            Assert.All(batchedGemini.Requests, r => Assert.Equal(2, r.Speakers?.Count ?? 0));
            Assert.Equal(12, outcome.Result!.UpdatedPlan.Turns.Count(t => !t.IsTitleHook));
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    private sealed class SequenceSpeechProvider(string id, Func<AiSpeechRequest, AiSpeechResult> responder) : ISpeechAiProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public List<AiSpeechRequest> Requests { get; } = [];

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiVoice>>([]);

        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(responder(request));
        }
    }

    private sealed class CaptureLogger(List<string> lines) : Microsoft.Extensions.Logging.ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => true;
        public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            lines.Add(formatter(state, exception));
    }

    private sealed class ThrowingSpeechProvider(string id, Func<Exception> exceptionFactory) : ISpeechAiProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public List<AiSpeechRequest> Requests { get; } = [];

        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiVoice>>([]);

        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
        {
            Requests.Add(request);
            throw exceptionFactory();
        }
    }
}
