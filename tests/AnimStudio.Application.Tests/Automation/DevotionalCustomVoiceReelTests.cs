using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Voices;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AnimStudio.Application.Tests.Automation;

public sealed class DevotionalCustomVoiceReelTests
{
    private static StudioEcosystemConfig TestConfig() => new(
        "AnimStudio",
        "Test",
        "Creator",
        "https://studio.example.com",
        "2026-11-22",
        "",
        "https://admin.example.com",
        "https://id.example.com",
        "https://studio.example.com",
        "ch1",
        "Bhakti",
        "@Deenabhakti_Spiritual",
        new ChannelBranding(),
        [new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily", "https://panchang.example.com", null, null, null, null, true, 1)],
        [],
        [],
        [],
        [],
        true,
        DateTimeOffset.UtcNow);

    [Theory]
    [InlineData("shiv", "Lord Shiv")]
    [InlineData("krishna", "Shri Krishna")]
    [InlineData("ram", "Prabhu Shri Ram")]
    [InlineData("ram-krishna", "Shri Ram & Shri Krishna")]
    public void Devotional_Prarthana_composes_single_voice_prayer_reels_per_deity(string deityFocus, string expectedSubject)
    {
        var rule = new AutomationRule
        {
            Id = "ar_bhakti",
            Name = $"Daily {deityFocus}",
            SourceType = AutomationSourceType.DevotionalPrarthana,
            VisualEngine = AutomationVisualEngine.DevotionalImageReel,
            DeityFocus = deityFocus,
            EnableCharacterDialogue = false,
            Language = "hi",
            FunnelWebsiteKeys = ["panchang"]
        };
        var signals = new EcosystemSignalsSnapshot("2026-11-23", "India", null, [], null, [], [], [], [], DateTimeOffset.UtcNow);
        var items = AutomationContentComposer.ComposeForRule(rule, signals, TestConfig());

        var item = Assert.Single(items);
        Assert.Contains(expectedSubject, item.SourceTitle, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("[पप्पू", item.Script);
        Assert.DoesNotContain("[Narrator]:", item.Script);
        Assert.Contains("deep dark", item.AiVideoPrompt, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Auto_deity_rotation_picks_Shiv_on_Monday_Krishna_on_Wednesday_and_Ram_on_Sunday()
    {
        Assert.Equal("shiv", DevotionalPrarthanaCatalog.SelectForDate("auto", "2026-11-23").DeityKey);       // Monday
        Assert.Equal("krishna", DevotionalPrarthanaCatalog.SelectForDate("auto", "2026-11-25").DeityKey);    // Wednesday
        Assert.Equal("ram-krishna", DevotionalPrarthanaCatalog.SelectForDate("auto", "2026-11-26").DeityKey);// Thursday
        Assert.Equal("ram", DevotionalPrarthanaCatalog.SelectForDate("auto", "2026-11-22").DeityKey);        // Sunday
    }

    [Fact]
    public void Stage_normalization_and_layout_preserve_custom_voice_motion_and_reel_presentation()
    {
        var stage = AutomationStageScript.Normalize(new AutomationStageSettings
        {
            VoiceProfileId = "vp_0123456789abcdef0123456789abcdef",
            PresentationMode = AutomationStagePresentation.DevotionalImageReel,
            BackgroundMotion = AutomationBackdropMotion.OrbitRound,
            BgmVolumePercent = 180
        });

        Assert.Equal("vp_0123456789abcdef0123456789abcdef", stage.VoiceProfileId);
        Assert.Equal(AutomationStagePresentation.DevotionalImageReel, stage.PresentationMode);
        Assert.Equal(AutomationBackdropMotion.OrbitRound, stage.BackgroundMotion);
        Assert.Equal(100, stage.BgmVolumePercent);

        var layout = AutomationStageScript.ToLayout(stage, usingTemplate: true, AutomationVisualEngine.DevotionalImageReel);
        Assert.NotNull(layout);
        Assert.True(layout!.DevotionalReelFrame);
        Assert.Equal(TemplateBackdropMotion.OrbitRound, layout.TemplateMotion);
    }

    [Theory]
    [InlineData(TemplateBackdropMotion.OrbitRound)]
    [InlineData(TemplateBackdropMotion.GentleRotate)]
    [InlineData(TemplateBackdropMotion.ZoomOut)]
    [InlineData(TemplateBackdropMotion.AutoSmooth)]
    public void Smooth_non_shaking_camera_moves_animate_devotional_reel_inside_dark_canvas(TemplateBackdropMotion motion)
    {
        const int w = 180, h = 320;
        var backdrop = new byte[w * h * 4];
        for (var y = 0; y < h; y++)
        for (var x = 0; x < w; x++)
        {
            var o = (y * w + x) * 4;
            backdrop[o] = (byte)(80 + (x * 160 / w));
            backdrop[o + 1] = (byte)(60 + (y * 160 / h));
            backdrop[o + 2] = 140;
            backdrop[o + 3] = 255;
        }

        var raster = new ProceduralSceneRasterizer(
            w, h, ProceduralSceneTheme.VedicTempleSunrise3D, seed: 108,
            palette: null,
            dialoguePlan: null,
            backdropFrames: [backdrop],
            stageLayout: new ProceduralStageLayout(null, null, TemplateBackdrop: true, motion, DevotionalReelFrame: true));

        var frame0 = raster.RenderFrame(0.0, 20.0).ToArray();
        var frame6 = raster.RenderFrame(6.2, 20.0).ToArray();

        // Top header margin above card stays cleanly dark so top captions stay readable.
        var topPixelIdx = (int)(h * 0.08) * w * 4 + (w / 2) * 4;
        Assert.True(frame0[topPixelIdx] <= 24 && frame0[topPixelIdx + 1] <= 24,
            $"Top margin should be dark canvas, got RGB=({frame0[topPixelIdx]},{frame0[topPixelIdx + 1]},{frame0[topPixelIdx + 2]}).");

        // Center image renders the bright artwork inside the rounded frame and smoothly moves over time.
        var centerIdx = (int)(h * 0.49) * w * 4 + (w / 2) * 4;
        Assert.True(frame0[centerIdx + 2] >= 100, "Center devotional frame should show backdrop artwork.");
        Assert.False(frame0.AsSpan().SequenceEqual(frame6), $"Motion {motion} should smoothly animate across frames.");
    }

    [Fact]
    public void Devotional_reel_subtitles_render_top_aligned_captions_and_channel_handle_without_bulky_banner()
    {
        var script = "हे नाथ यदि आप हमारे अवगुण देखोगे तो हम कहाँ जाएँगे। हर हर महादेव!";
        var plan = DialogueScriptParser.ParsePlan("शिव प्रार्थना", script, prompt: null, 16, enableDialogue: false, eventType: "DevotionalPrarthana");
        var palette = ProceduralEventPalette.Resolve("DevotionalPrarthana", ProceduralSceneTheme.VedicTempleSunrise3D);
        var request = new ProceduralVideoRequest
        {
            Title = "शिव प्रार्थना",
            EventType = "DevotionalPrarthana",
            Language = "hi",
            DurationSeconds = 16,
            ShowWatermark = true,
            FooterLabel = "@Deenabhakti_Spiritual",
            StageLayout = new ProceduralStageLayout(null, null, TemplateBackdrop: true, TemplateBackdropMotion.OrbitRound, DevotionalReelFrame: true)
        };

        var ass = ProceduralVideoGeneratorService.BuildAssSubtitlesWithWriter(
            new AssSubtitleWriter(),
            request.Title,
            request,
            palette,
            plan,
            width: 720,
            height: 1280,
            fps: 24,
            durationSeconds: 16);

        Assert.DoesNotContain(",TopCategory,", ass);
        Assert.DoesNotContain(",HeaderTitle,", ass);
        Assert.Contains("Style: BeatBody", ass);
        // Alignment=8 (top-center) on BeatBody style and handle watermark on FooterTag.
        Assert.Contains(",8,", ass);
        Assert.Contains("@Deenabhakti_Spiritual", ass);
        Assert.Contains("अवगुण", ass);
    }

    [Fact]
    public void BuildFfmpegArguments_respects_custom_quiet_bgm_gain()
    {
        var args = ProceduralVideoGeneratorService.BuildFfmpegArguments(
            720, 1280, 24, 15, hasSpeech: true, hasBgm: true, hasSubtitles: true, bgmGain: 0.18);
        var joined = string.Join(" ", args);

        Assert.Contains("volume=0.18", joined);
        Assert.DoesNotContain("volume=0.45", joined);
    }

    [Fact]
    public void CinematicImageFilters_supports_smooth_orbit_round_and_gentle_rotate_motions()
    {
        Assert.Equal(ImageMotion.OrbitRound, CinematicImageSettings.ParseMotion("orbit-round"));
        Assert.Equal(ImageMotion.GentleRotate, CinematicImageSettings.ParseMotion("gentle-rotate"));

        var plan = ImageAnimation.FromWords("Smooth orbital rounding motion 6 seconds", "vertical");
        Assert.Equal("orbit-round", plan.Motion);

        var orbitFilter = CinematicImageFilters.Motion(
            CinematicImageSettings.From("orbit-round", 0.15, 50, 50, "ease-in-out", "none", false, false, false)!,
            Canvas.Vertical1080x1920,
            180);
        Assert.Contains("cos", orbitFilter);
        Assert.Contains("sin", orbitFilter);

        var rotateFilter = CinematicImageFilters.Motion(
            CinematicImageSettings.From("gentle-rotate", 0.15, 50, 50, "ease-in-out", "none", false, false, false)!,
            Canvas.Vertical1080x1920,
            180);
        Assert.Contains("rotate=", rotateFilter);
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_uses_Google_replicated_custom_voice_and_prioritizes_gemini()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-custom-voice-test-");
        try
        {
            var wavPath = Path.Combine(tempDir.FullName, "sample.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, ProceduralSceneTheme.VedicTempleSunrise3D, 2, CancellationToken.None);
            var wavBytes = await File.ReadAllBytesAsync(wavPath);

            var gtts = new StubSpeechProvider(KnownAiProviders.GoogleTts);
            var gemini = new StubSpeechProvider(KnownAiProviders.GeminiTts);
            var registry = new StubRegistry([gtts, gemini]);
            var ai = new RecordingSpeechExecutor(wavBytes);

            var profile = new VoiceProfile
            {
                Id = "vp_0123456789abcdef0123456789abcdef",
                UserId = "user-1",
                Name = "Keshav Bhakti Voice",
                BaseVoiceId = "Orus",
                GoogleVoiceId = "voice_google_abc123",
                GoogleVoiceProviderId = KnownAiProviders.GeminiTts
            };

            var plan = DialogueScriptParser.ParsePlan(
                "शिव प्रार्थना",
                "हे नाथ यदि आप हमारे अवगुण देखोगे तो हम कहाँ जाएँगे।",
                prompt: null, 10, enableDialogue: false, eventType: "DevotionalPrarthana");

            var request = new ProceduralVideoRequest
            {
                Title = "शिव प्रार्थना",
                VoiceProfileId = profile.Id,
                Language = "hi",
                DurationSeconds = 8,
                IncludeSpeech = true
            };

            var result = await ProceduralSpeechSynthesizer.TrySynthesizeAsync(
                request, plan, Path.Combine(tempDir.FullName, "in"), "user-1", 8,
                ai, registry, new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                customVoiceProfile: profile);

            Assert.NotNull(result);
            Assert.Equal(KnownAiProviders.GeminiTts, result!.ProviderId);
            Assert.Contains("Keshav Bhakti Voice (Google)", result.VoicesUsed);
            Assert.NotEmpty(ai.Requests);
            Assert.All(ai.Requests, r => Assert.Equal("voice_google_abc123", r.ReplicatedVoiceId));
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_converts_via_IStudioVoiceRenderer_when_Google_replication_is_absent()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-local-revoice-test-");
        try
        {
            var wavPath = Path.Combine(tempDir.FullName, "sample.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, ProceduralSceneTheme.VedicTempleSunrise3D, 2, CancellationToken.None);
            var wavBytes = await File.ReadAllBytesAsync(wavPath);

            var gtts = new StubSpeechProvider(KnownAiProviders.GoogleTts);
            var gemini = new StubSpeechProvider(KnownAiProviders.GeminiTts);
            var registry = new StubRegistry([gemini, gtts]);
            var ai = new RecordingSpeechExecutor(wavBytes);
            var renderer = new StubStudioVoiceRenderer(wavBytes);

            var profile = new VoiceProfile
            {
                Id = "vp_abcdef0123456789abcdef0123456789",
                UserId = "user-1",
                Name = "Local Bhakti Voice",
                BaseVoiceId = "hi",
                StorageKey = "voices/vp_local/sample.wav"
            };

            var plan = DialogueScriptParser.ParsePlan(
                "कृष्ण भक्ति",
                "सब कुछ श्रीकृष्ण पर छोड़ दो।",
                prompt: null, 10, enableDialogue: false, eventType: "DevotionalPrarthana");

            var request = new ProceduralVideoRequest
            {
                Title = "कृष्ण भक्ति",
                VoiceProfileId = profile.Id,
                Language = "hi",
                DurationSeconds = 8,
                IncludeSpeech = true
            };

            var result = await ProceduralSpeechSynthesizer.TrySynthesizeAsync(
                request, plan, Path.Combine(tempDir.FullName, "in"), "user-1", 8,
                ai, registry, new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                customVoiceProfile: profile, studioVoiceRenderer: renderer);

            Assert.NotNull(result);
            Assert.Equal(KnownAiProviders.GoogleTts, result!.ProviderId);
            Assert.True(renderer.Calls > 0);
            Assert.Contains("Local Bhakti Voice (Converted)", result.VoicesUsed);
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_preserves_synthesized_turns_and_switches_to_gtts_on_gemini_429()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-fallback-speech-test-");
        try
        {
            var wavPath = Path.Combine(tempDir.FullName, "clip.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, ProceduralSceneTheme.VedicTempleSunrise3D, 2, CancellationToken.None);
            var wavBytes = await File.ReadAllBytesAsync(wavPath);

            const string markandeyaScript = """
                [CAST]: बालक मार्कण्डेय | child | simple white cotton dhoti
                [CAST]: भगवान शिव | divine/god | tiger skin wrap
                [CAST]: ऋषि मृकण्डु | sage | saffron cotton dhoti
                [CAST]: माता मरुद्मती | queen/mother | simple ochre saree
                [SCENE]: forest ashram | dawn | serene | IMAGE: ancient thatched hermitage
                [ऋषि मृकण्डु]: हे प्रिये मरुद्मती, विधि के इस कठिन लेख से हमारा हृदय काँप उठता है।
                [माता मरुद्मती]: स्वामी, भगवान शिव की महामृत्युंजय साधना असंभव को भी संभव कर सकती है।
                [बालक मार्कण्डेय]: पिताश्री, मुझे मृत्यु का भय नहीं है; मेरे रोम-रोम में शिव बसे हैं।
                [भगवान शिव]: वत्स मार्कण्डेय, तुम्हारी अटल भक्ति से काल भी पराजित हो गया है।
                """;
            var plan = DialogueScriptParser.ParsePlan(
                "मार्कण्डेय ऋषि और भगवान शिव की अमर कथा",
                markandeyaScript,
                prompt: null,
                durationSeconds: 40,
                enableDialogue: true,
                eventType: "DailyKatha");
            var request = new ProceduralVideoRequest
            {
                Title = "मार्कण्डेय ऋषि और भगवान शिव की अमर कथा",
                Script = markandeyaScript,
                EventType = "DailyKatha",
                Language = "hi",
                DurationSeconds = 40,
                IncludeSpeech = true
            };

            var expectedTurns = plan.Turns.Count(t => !t.IsTitleHook);
            var executor = new FailOnSecondTurnGeminiExecutor(wavBytes);
            var registry = new StubRegistry(
                [new StubSpeechProvider(KnownAiProviders.GeminiTts), new StubSpeechProvider(KnownAiProviders.GoogleTts)]);

            var outcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                request,
                plan,
                Path.Combine(tempDir.FullName, "in"),
                "user-1",
                baseDurationSeconds: 40,
                executor,
                registry,
                new FfmpegOptions(),
                NullLogger.Instance,
                CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);

            Assert.NotNull(outcome.Result);
            Assert.Null(outcome.FailureReason);
            Assert.True(File.Exists(outcome.Result!.SpeechWavPath));
            Assert.Equal("gemini-tts+gtts", outcome.Result.ProviderId);

            // Turn 0 succeeded on gemini-tts; Turn 1 failed 429 on gemini-tts then permanently switched to gtts for remaining turns
            Assert.Equal(2, executor.GeminiCalls);
            Assert.Equal(expectedTurns - 1, executor.GttsCalls);
            Assert.Equal(expectedTurns, outcome.Result.UpdatedPlan.Turns.Count(t => !t.IsTitleHook));
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    [Fact]
    public async Task ProceduralSpeechSynthesizer_reports_clear_failure_diagnostics_when_providers_disabled_or_rate_limited()
    {
        var tempDir = Directory.CreateTempSubdirectory("animstudio-speech-diag-test-");
        try
        {
            var wavPath = Path.Combine(tempDir.FullName, "clip.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, ProceduralSceneTheme.VedicTempleSunrise3D, 2, CancellationToken.None);
            var wavBytes = await File.ReadAllBytesAsync(wavPath);

            const string script = """
                [ऋषि मृकण्डु]: पहला संवाद सत्य और भक्ति का मार्ग बताता है।
                [माता मरुद्मती]: दूसरा संवाद प्रदोष व्रत का महत्व दर्शाता है।
                [बालक मार्कण्डेय]: तीसरा संवाद महामृत्युंजय मंत्र की महिमा गाता है।
                [भगवान शिव]: चौथा संवाद अमरत्व का आशीर्वाद प्रदान करता है।
                """;
            var plan = DialogueScriptParser.ParsePlan(
                "मार्कण्डेय कथा", script, null, 20, enableDialogue: true, eventType: "DailyKatha");
            var request = new ProceduralVideoRequest
            {
                Title = "मार्कण्डेय कथा",
                Script = script,
                EventType = "DailyKatha",
                Language = "hi",
                DurationSeconds = 20,
                IncludeSpeech = true
            };

            // 1. All Speech providers disabled -> clear diagnostic message
            var noProviderOutcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                request, plan, Path.Combine(tempDir.FullName, "in-empty"), "user-1", 20,
                new FailOnSecondTurnGeminiExecutor(wavBytes), new StubRegistry([]), new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);
            Assert.Null(noProviderOutcome.Result);
            Assert.Contains("No Speech AI provider", noProviderOutcome.FailureReason, StringComparison.OrdinalIgnoreCase);

            // 2. Only gemini-tts enabled and Turn 1+ hit 429 rate-limit -> aborts incomplete audio and explains why
            var executor = new FailOnSecondTurnGeminiExecutor(wavBytes);
            var onlyGeminiOutcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                request, plan, Path.Combine(tempDir.FullName, "in-429"), "user-1", 20,
                executor, new StubRegistry([new StubSpeechProvider(KnownAiProviders.GeminiTts)]), new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                rateLimitCooldown: TimeSpan.Zero);
            Assert.Null(onlyGeminiOutcome.Result);
            Assert.Contains("gemini-tts", onlyGeminiOutcome.FailureReason, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("rate-limited", onlyGeminiOutcome.FailureReason, StringComparison.OrdinalIgnoreCase);
            // Stops early after 3 consecutive provider-wide failures rather than hanging through long scripts
            Assert.Equal(4, executor.GeminiCalls);

            // 3. When only gemini-tts is enabled and Turn 1 hits a transient RPM 429 that clears after cooldown, full narration succeeds
            var transientExecutor = new TransientOnceGeminiExecutor(wavBytes);
            var recoveredOutcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
                request, plan, Path.Combine(tempDir.FullName, "in-recover"), "user-1", 20,
                transientExecutor, new StubRegistry([new StubSpeechProvider(KnownAiProviders.GeminiTts)]), new FfmpegOptions(), NullLogger.Instance, CancellationToken.None,
                rateLimitCooldown: TimeSpan.FromMilliseconds(5));
            Assert.NotNull(recoveredOutcome.Result);
            Assert.Null(recoveredOutcome.FailureReason);
            Assert.Equal(KnownAiProviders.GeminiTts, recoveredOutcome.Result!.ProviderId);
            Assert.Equal(5, transientExecutor.Calls); // 4 turns + 1 retried Turn 1 after cooldown
        }
        finally
        {
            tempDir.Delete(recursive: true);
        }
    }

    private sealed class TransientOnceGeminiExecutor(byte[] wavBytes) : IAiExecutor
    {
        public int Calls { get; private set; }
        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTextResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiImageResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTranscriptionResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct)
        {
            Calls++;
            if (Calls == 2)
                return Task.FromResult(AiOutcome<AiSpeechResult>.Failed("rate-limited", "'gemini-tts' returned 429 (RESOURCE_EXHAUSTED)."));
            return Task.FromResult(AiOutcome<AiSpeechResult>.Success(
                new AiSpeechResult(wavBytes, "audio/wav", 2.0, new AiProvenance { ProviderId = KnownAiProviders.GeminiTts, Capability = AiCapability.Speech })));
        }
    }

    private sealed class FailOnSecondTurnGeminiExecutor(byte[] wavBytes) : IAiExecutor
    {
        public int GeminiCalls { get; private set; }
        public int GttsCalls { get; private set; }

        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTextResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiImageResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTranscriptionResult>.Unavailable(AiUnavailableReason.NotConfigured));

        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct)
        {
            if (string.Equals(request.ProviderId, KnownAiProviders.GeminiTts, StringComparison.OrdinalIgnoreCase))
            {
                GeminiCalls++;
                if (GeminiCalls > 1)
                    return Task.FromResult(AiOutcome<AiSpeechResult>.Failed("rate-limited", "'gemini-tts' returned 429 (RESOURCE_EXHAUSTED)."));

                return Task.FromResult(AiOutcome<AiSpeechResult>.Success(
                    new AiSpeechResult(wavBytes, "audio/wav", 2.0, new AiProvenance { ProviderId = KnownAiProviders.GeminiTts, Capability = AiCapability.Speech })));
            }

            GttsCalls++;
            return Task.FromResult(AiOutcome<AiSpeechResult>.Success(
                new AiSpeechResult(wavBytes, "audio/wav", 2.0, new AiProvenance { ProviderId = KnownAiProviders.GoogleTts, Capability = AiCapability.Speech })));
        }
    }

    private sealed class StubSpeechProvider(string id) : ISpeechAiProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiVoice>>(
                string.Equals(Id.Value, KnownAiProviders.GoogleTts, StringComparison.OrdinalIgnoreCase)
                    ? [new("gtts-hi", "Google Hindi", "hi", "Female")]
                    : [new("Orus", "Orus", "hi", "Male")]);
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class StubRegistry(IReadOnlyList<ISpeechAiProvider> providers) : IAiProviderRegistry
    {
        public IReadOnlyList<ITextAiProvider> TextChain() => [];
        public IReadOnlyList<ITextAiProvider> UsableTextProviders() => [];
        public IReadOnlyList<IImageAiProvider> ImageChain() => [];
        public IReadOnlyList<ISpeechAiProvider> SpeechChain() => providers;
        public IReadOnlyList<ITranscriptionProvider> TranscriptionChain() => [];
        public AiCapabilityStatus Describe(AiCapability capability) =>
            new(capability, providers.Count > 0 ? providers[0].Id.Value : null, null, providers.Count > 0,
                providers.Count > 0 ? AiUnavailableReason.None : AiUnavailableReason.NotConfigured,
                [.. providers.Select(p => p.Id.Value)]);
        public IReadOnlyList<AiCapabilityStatus> DescribeAll() => [Describe(AiCapability.Speech)];
        public void ReportOutcome(AiProviderId providerId, bool success) { }
    }

    private sealed class RecordingSpeechExecutor(byte[] wavBytes) : IAiExecutor
    {
        public List<AiSpeechRequest> Requests { get; } = [];
        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTextResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiImageResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTranscriptionResult>.Unavailable(AiUnavailableReason.NotConfigured));
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(AiOutcome<AiSpeechResult>.Success(
                new AiSpeechResult(wavBytes, "audio/wav", 2.0, new AiProvenance { ProviderId = request.ProviderId ?? "gemini-tts", Capability = AiCapability.Speech })));
        }
    }

    private sealed class StubStudioVoiceRenderer(byte[] convertedWav) : IStudioVoiceRenderer
    {
        public int Calls { get; private set; }
        public bool IsAvailable => true;
        public bool CanReVoice => true;
        public bool CanPrepareReference => true;
        public Task<StudioVoiceOutput> RenderAsync(Stream recording, StudioVoiceContainer container, IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<string, string> samples, CancellationToken ct) =>
            throw new NotSupportedException();
        public Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult(convertedWav);
        }
        public Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct) =>
            Task.FromResult(convertedWav);
    }
}
