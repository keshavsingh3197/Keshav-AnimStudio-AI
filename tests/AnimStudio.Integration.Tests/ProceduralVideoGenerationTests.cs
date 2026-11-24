using System.Collections.Concurrent;
using System.Globalization;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Storage;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

public sealed class ProceduralVideoGenerationTests : IAsyncLifetime
{
    private string _root = string.Empty;

    public Task InitializeAsync()
    {
        _root = Path.Combine(Path.GetTempPath(), "animstudio-proc-tests", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(_root);
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
        return Task.CompletedTask;
    }

    [Fact]
    public async Task Rasterizer_and_AudioSynthesizer_produce_animated_frames_across_all_themes()
    {
        foreach (var theme in new[]
        {
            ProceduralSceneTheme.VedicTempleSunrise3D,
            ProceduralSceneTheme.CosmosSacred3D,
            ProceduralSceneTheme.HistoryChronicle3D,
            ProceduralSceneTheme.NeonCyberGrid3D,
            ProceduralSceneTheme.SereneNatureGlow
        })
        {
            var r = new ProceduralSceneRasterizer(360, 640, theme, seed: 42);
            var f0 = r.RenderFrame(0.0, 10.0).ToArray();
            var f5 = r.RenderFrame(5.0, 10.0).ToArray();

            Assert.Equal(360 * 640 * 4, f0.Length);
            Assert.False(f0.AsSpan().SequenceEqual(f5), $"Theme {theme} should animate between t=0 and t=5s.");

            var wavPath = Path.Combine(_root, $"{theme}.wav");
            await ProceduralAudioSynthesizer.WriteAmbientWavAsync(wavPath, theme, 2, CancellationToken.None);
            var wavBytes = await File.ReadAllBytesAsync(wavPath);
            Assert.True(wavBytes.Length > 44);
            Assert.Equal("RIFF", System.Text.Encoding.ASCII.GetString(wavBytes, 0, 4));
        }
    }

    [FfmpegFact]
    public async Task Generates_playable_h264_aac_vertical_and_landscape_videos_and_saves_render_job()
    {
        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();

        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true,
            HasLibass = true,
            HasLibx264 = true,
            HasAac = true,
            Major = FfmpegLocator.MajorVersion
        };

        var service = new ProceduralVideoGeneratorService(
            ffmpegOptions,
            capabilities,
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        var result = await service.GenerateAsync("user-auto-1", new ProceduralVideoRequest
        {
            Title = "आज का शुभ पंचांग",
            Prompt = "Sacred 3D Cosmos Nakshatra rings and temple sunrise glow",
            Script = "हर हर महादेव! आज का शुभ अभिजीत मुहूर्त। सूर्य उदय के साथ सकारात्मक ऊर्जा।",
            Theme = ProceduralSceneTheme.Auto,
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 5,
            Fps = 24,
            IncludeCaptions = true,
            IncludeAmbientAudio = true,
            FooterLabel = "panchang.keshavsingh.in",
            SaveAsRenderJob = true,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.Equal(ProceduralSceneTheme.CosmosSacred3D, result.ResolvedTheme);
        Assert.Equal(720, result.Width);
        Assert.Equal(1280, result.Height);
        Assert.NotNull(result.RenderJobId);
        Assert.NotNull(result.StorageKey);
        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 5_000);

        var savedJob = await jobsRepo.GetAsync(result.RenderJobId!, CancellationToken.None);
        Assert.NotNull(savedJob);
        Assert.Equal(RenderJobKind.ProceduralAnimated, savedJob!.Kind);
        Assert.Equal(RenderJobStatus.Completed, savedJob.Status);
        Assert.NotNull(await projectsRepo.GetAsync(savedJob.ProjectId, CancellationToken.None));
        Assert.True(store.Contains(result.StorageKey!));

        var mp4Path = Path.Combine(_root, "verified-3d.mp4");
        await File.WriteAllBytesAsync(mp4Path, result.InlineMp4Bytes!);

        var dimensions = FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{mp4Path}\"");
        Assert.Equal("h264,720,1280", dimensions);

        var audioCodec = FfmpegLocator.Probe(
            $"-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 \"{mp4Path}\"");
        Assert.Equal("aac,48000,2", audioCodec);

        var duration = double.Parse(
            FfmpegLocator.Probe($"-v error -show_entries format=duration -of csv=p=0 \"{mp4Path}\""),
            CultureInfo.InvariantCulture);
        Assert.InRange(duration, 4.7, 5.4);

        // Also test 16:9 widescreen History Chronicle 3D direct inline mode (no DB RenderJob persistence)
        var wideResult = await service.GenerateAsync(string.Empty, new ProceduralVideoRequest
        {
            Title = "Aaj Ka Itihaas — 1969",
            Prompt = "Historical globe chronicle",
            Script = "On this day in history, a milestone in science was achieved.",
            Theme = ProceduralSceneTheme.Auto,
            Format = "landscape",
            Resolution = "720p",
            DurationSeconds = 5,
            Fps = 24,
            IncludeCaptions = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.Null(wideResult.RenderJobId);
        Assert.Equal(ProceduralSceneTheme.HistoryChronicle3D, wideResult.ResolvedTheme);
        Assert.Equal(1280, wideResult.Width);
        Assert.Equal(720, wideResult.Height);
        var widePath = Path.Combine(_root, "verified-wide.mp4");
        await File.WriteAllBytesAsync(widePath, wideResult.InlineMp4Bytes!);
        Assert.Equal("h264,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{widePath}\""));

        // Test 2-character dialogue + karaoke subtitles + fixed DailyKatha palette AND 1:1 PNG Promo Card generation
        var dialogueVideo = await service.GenerateAsync("user-auto-2", new ProceduralVideoRequest
        {
            Title = "Raja Harishchandra & Maharishi Vishwamitra",
            EventType = "DailyKatha",
            TopCategoryLabel = "PAURANIK KATHA & DIALOGUE",
            Prompt = "Sacred royal sabha dialogue",
            Script = "[Raja Harishchandra]: Truth and dharma never bend.\n[Maharishi Vishwamitra]: Your vow shines across the ages.",
            Theme = ProceduralSceneTheme.Auto,
            SubtitlePreset = "karaoke-pulse",
            EnableCharacterDialogue = true,
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 5,
            Fps = 24,
            IncludeCaptions = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.Equal(ProceduralSceneTheme.VedicTempleSunrise3D, dialogueVideo.ResolvedTheme);
        Assert.NotNull(dialogueVideo.InlineMp4Bytes);
        Assert.True(dialogueVideo.SizeBytes > 5_000);

        var cardGenerator = new ProceduralCommunityCardGenerator(
            ffmpegOptions,
            capabilities,
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            NullLogger<ProceduralCommunityCardGenerator>.Instance);
        var (cardKey, cardBytes) = await cardGenerator.GenerateAndStoreAsync(
            postId: "post-card-1",
            title: "Raja Harishchandra & Maharishi Vishwamitra",
            subtitle: "Truthfulness endures beyond every trial.",
            eventType: "DailyKatha",
            footerUrl: "panchang.keshavsingh.in",
            enableCharacterDialogue: true,
            speakerAName: "Raja Harishchandra",
            speakerBName: "Maharishi Vishwamitra",
            CancellationToken.None);

        Assert.True(cardBytes > 5_000);
        Assert.True(store.Contains(cardKey));
        await using var cardStream = await store.OpenAsync(cardKey, CancellationToken.None);
        Assert.NotNull(cardStream);
        var header = new byte[8];
        Assert.Equal(8, await cardStream!.ReadAsync(header));
        Assert.Equal([137, 80, 78, 71, 13, 10, 26, 10], header);

        // Verify Hindi DailyKatha portrait (>= 10s) renders with H.264 + AAC spoken voice track & safe margins
        var hindiKathaVideo = await service.GenerateAsync("user-auto-hi", new ProceduralVideoRequest
        {
            Title = "भक्त ध्रुव और देवर्षि नारद मुनि की संपूर्ण कथा",
            EventType = "DailyKatha",
            TopCategoryLabel = "पौराणिक कथा संवाद",
            Language = "hi",
            Prompt = "Sacred forest tapasya dialogue leading to Dhruva Tara",
            Script = "[भक्त ध्रुव]: देवर्षि नारद मुनि, कृपया मुझे भक्ति का अटल मार्ग बताइए।\n[देवर्षि नारद मुनि]: बालक ध्रुव, एकाग्र मन से पावन मंत्र ॐ नमो भगवते वासुदेवाय का जप करो।",
            Theme = ProceduralSceneTheme.Auto,
            SubtitlePreset = "event-glow",
            EnableCharacterDialogue = true,
            SpeakerAName = "भक्त ध्रुव",
            SpeakerBName = "देवर्षि नारद मुनि",
            FooterLabel = "panchang.keshavsingh.in",
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 10,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.Equal(ProceduralSceneTheme.VedicTempleSunrise3D, hindiKathaVideo.ResolvedTheme);
        Assert.NotNull(hindiKathaVideo.InlineMp4Bytes);
        Assert.True(hindiKathaVideo.SizeBytes > 5_000);
        if (OperatingSystem.IsWindows())
        {
            Assert.Contains("voice=", hindiKathaVideo.Summary);
        }
        var hindiPath = Path.Combine(_root, "verified-hindi-katha.mp4");
        await File.WriteAllBytesAsync(hindiPath, hindiKathaVideo.InlineMp4Bytes!);
        Assert.Equal("h264,720,1280", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{hindiPath}\""));
        Assert.Equal("aac,48000,2", FfmpegLocator.Probe(
            $"-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 \"{hindiPath}\""));
    }

    [FfmpegFact]
    public async Task Comedy_WebGl3D_renders_rabdi_skit_with_synced_speech_bedroom_and_kitchen()
    {
        if (!WebGlVideoFrameRenderer.IsAvailable())
            return;

        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();
        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true,
            HasLibass = true,
            HasLibx264 = true,
            HasAac = true,
            Major = FfmpegLocator.MajorVersion
        };

        var service = new ProceduralVideoGeneratorService(
            ffmpegOptions,
            capabilities,
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string rabdiScript = """
            [SCENE]: bedroom | night | playful
            [पप्पू भैया]: ख्र्र्र... बस पाँच मिनट... रसोई से गरम रबड़ी की खुशबू आ रही है...
            [बबलू यार]: अरे पप्पू! आधी रात को ये रसोई में कड़ाही कौन खड़का रहा है?!
            [SCENE]: kitchen | night | mischievous
            [पप्पू भैया]: आहाहा! आज मलाईदार रबड़ी अकेले साफ कर दूँगा...
            [बबलू यार]: पकड़ लिया बे! सारी रबड़ी अकेले चट कर गया नालायक?!
            """;

        var result = await service.GenerateAsync("user-comedy-verify", new ProceduralVideoRequest
        {
            Title = "आधी रात का रबड़ी कांड 😂 | EP 01",
            EventType = "FunnyComedy",
            TopCategoryLabel = "KESHAV-ANIM-FF • COMEDY SHORT",
            Language = "hi",
            Script = rabdiScript,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            RenderEngine = ProceduralRenderEngine.Auto,
            SubtitlePreset = "karaoke-pulse",
            EnableCharacterDialogue = true,
            EnableComedySfx = true,
            FollowScriptExactly = true,
            SpeakerAName = "पप्पू भैया",
            SpeakerBName = "बबलू यार",
            FooterLabel = "Keshav Hub",
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 18,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 50_000);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var outPath = Path.Combine(_root, "rabdi-fixed.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);

        var auditOut = Environment.GetEnvironmentVariable("ANIMSTUDIO_COMEDY_AUDIT_MP4");
        if (!string.IsNullOrWhiteSpace(auditOut))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(auditOut)!);
            await File.WriteAllBytesAsync(auditOut, result.InlineMp4Bytes!);
        }

        Assert.Equal("h264,720,1280", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outPath}\""));
        Assert.Equal("aac,48000,2", FfmpegLocator.Probe(
            $"-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 \"{outPath}\""));
    }

    [FfmpegFact]
    public async Task Narasimha_Janga_WebGl3D_renders_lion_avatar_split_pillar_and_threshold_climax()
    {
        if (!WebGlVideoFrameRenderer.IsAvailable())
            return;

        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();
        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true,
            HasLibass = true,
            HasLibx264 = true,
            HasAac = true,
            Major = FfmpegLocator.MajorVersion
        };

        var service = new ProceduralVideoGeneratorService(
            ffmpegOptions,
            capabilities,
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string narasimhaScript = """
            [SCENE]: himalaya | day | perilous
            [हिरण्यकशिपु]: इसे पर्वत शिखर से नीचे गहरी खाई में फेंक दो!
            [SCENE]: palace court | night | dark
            [हिरण्यकशिपु]: इसे विषैले सर्पों के बीच बंद करके डसवा दो!
            [भक्त प्रह्लाद]: विषैले साँप भी प्रभु की कृपा से हार गए!
            [हिरण्यकशिपु]: अब मतवाले गजराज हाथी के पैरों तले कुचलवा दो!
            [SCENE]: temple | night | fiery
            [होलिका]: मैं प्रह्लाद को गोद में लेकर धधकती ज्वाला में बैठती हूँ।
            [सूत्रधार]: अग्निकुंड की ज्वाला में होलिका भस्म हो गई और प्रह्लाद सुरक्षित बच गए!
            [SCENE]: palace court | sunset | fierce
            [हिरण्यकशिपु]: गदा के प्रहार से आज मैं इस खंभे को तोड़ता हूँ!
            [सूत्रधार]: गोधूलि वेला में खंभा फटा और भगवान नरसिंह गर्जना के साथ प्रकट हुए।
            [हिरण्यकशिपु]: (surprised) त्राहिमाम्! न नर, न पशु... यह कैसा अलौकिक रूप है?
            [भगवान नरसिंह]: (angry) अब चौखट पर मेरी जंघाओं के ऊपर तेरा अहंकार समाप्त होगा!
            [SCENE]: palace court | sunset | serene
            [भगवान नरसिंह]: वत्स प्रह्लाद, मैं अत्यंत प्रसन्न हूँ।
            [सूत्रधार]: निश्छल भक्ति सदैव विजयी होती है।
            """;

        var result = await service.GenerateAsync("user-narasimha-verify", new ProceduralVideoRequest
        {
            Title = "भक्त प्रह्लाद और नरसिंह अवतार की अमर कथा",
            EventType = "DailyKatha",
            TopCategoryLabel = "PAURANIK KATHA & DIALOGUE",
            Language = "hi",
            Script = narasimhaScript,
            Theme = ProceduralSceneTheme.VedicTempleSunrise3D,
            RenderEngine = ProceduralRenderEngine.WebGl3D,
            EnableCharacterDialogue = true,
            SpeakerAName = "हिरण्यकशिपु",
            SpeakerBName = "भक्त प्रह्लाद",
            Format = "landscape",
            Resolution = "720p",
            DurationSeconds = 24,
            Fps = 12,
            IncludeCaptions = true,
            IncludeSpeech = false,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 30_000);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var outPath = Path.Combine(_root, "narasimha-verify.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);

        var auditOut = Environment.GetEnvironmentVariable("ANIMSTUDIO_NARASIMHA_AUDIT_MP4");
        if (!string.IsNullOrWhiteSpace(auditOut))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(auditOut)!);
            await File.WriteAllBytesAsync(auditOut, result.InlineMp4Bytes!);
        }

        Assert.Equal("h264,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outPath}\""));
    }

    [FfmpegFact]
    public async Task HariharMilan_WebGl3D_renders_Vishnu_Shiva_lotus_and_chakra()
    {
        if (!WebGlVideoFrameRenderer.IsAvailable())
            return;

        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();
        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true,
            HasLibass = true,
            HasLibx264 = true,
            HasAac = true,
            Major = FfmpegLocator.MajorVersion
        };

        var service = new ProceduralVideoGeneratorService(
            ffmpegOptions,
            capabilities,
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string hariharScript = """
            [SCENE]: river ghat | dawn | serene
            [CAST]: भगवान श्रीहरि विष्णु | divine | azure silk dhoti, pitambara, gold crown, sudarshana chakra
            [CAST]: भगवान शिव | divine | vibhuti ash skin, crescent moon jata, vasuki snake, trishul
            [सूत्रधार]: (waving, wide) कार्तिक शुक्ल चतुर्दशी — वैकुंठ चतुर्दशी एवं हरिहर मिलन का महापर्व!
            [SCENE]: temple | night | glowing
            [भगवान श्रीहरि विष्णु]: (praying, lotus, closeUpSpeaker) हे विश्वनाथ महादेव! १,००० स्वर्ण कमलों में अंतिम कमल कम है — मैं अपना कमलनयन नेत्र अर्पित करता हूँ!
            [भगवान शिव]: (proud, trishul, closeUpSpeaker) ठहरो मेरे प्रिय हरि! आपके प्रेम से प्रसन्न होकर मैं आपको सुदर्शन चक्र प्रदान करता हूँ!
            [भगवान श्रीहरि विष्णु]: (proud, chakra, blessing) आज से हरि को बेलपत्र और शिव को तुलसी अर्पित होगी!
            """;

        var result = await service.GenerateAsync("user-harihar-verify", new ProceduralVideoRequest
        {
            Title = "वैकुंठ चतुर्दशी और हरिहर मिलन की अमर कथा",
            EventType = "DailyKatha",
            TopCategoryLabel = "PAURANIK KATHA & DIALOGUE",
            Language = "hi",
            Script = hariharScript,
            Theme = ProceduralSceneTheme.VedicTempleSunrise3D,
            RenderEngine = ProceduralRenderEngine.WebGl3D,
            EnableCharacterDialogue = true,
            SpeakerAName = "भगवान श्रीहरि विष्णु",
            SpeakerBName = "भगवान शिव",
            Format = "landscape",
            Resolution = "720p",
            DurationSeconds = 12,
            Fps = 12,
            IncludeCaptions = true,
            IncludeSpeech = false,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 30_000);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var outPath = Path.Combine(_root, "harihar-milan-verify.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);
        Assert.Equal("h264,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outPath}\""));
    }

    [FfmpegFact]
    public async Task Generates_salon_barbershop_landscape_comedy_video_with_webgl_3d()
    {
        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();

        var service = new ProceduralVideoGeneratorService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            new FfmpegCapabilities
            {
                IsAvailable = true,
                HasLibass = true,
                HasLibx264 = true,
                HasAac = true,
                Major = FfmpegLocator.MajorVersion
            },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string salonScript = """
            [SCENE]: barber | afternoon | comedy
            [CAST]: चुन्नू चाचा | elder | white dhoti
            [CAST]: रिंकू पड़ोसी | comic | green hoodie
            [पप्पू ग्राहक]: अमरेंद्र भाई, आज एकदम शाही बाहुबली कटिंग करना!
            [अमरेंद्र नाई]: (cutting) बेफिक्र बैठ टोपा! चक-चक-चक! ले पहला झटका!
            [पप्पू ग्राहक]: (removing towel, angry) तौलिया तो हटा! अरे बावले ये क्या मैदान साफ़ कर दिया?!
            [अमरेंद्र नाई]: (surprised) ओह तेरी! चश्मा उल्टा पहना था मैंने!
            [चुन्नू चाचा]: (laughing) अरे भैया शीशे में देख ले, पीछे से अंडा लग रहा है!
            """;

        var result = await service.GenerateAsync("user-salon-verify", new ProceduralVideoRequest
        {
            Title = "नाई का शाही कटिंग कांड 😂 | EP 02",
            EventType = "FunnyComedy",
            TopCategoryLabel = "KESHAV-ANIM-FF • COMEDY SHORT",
            Language = "hi",
            Script = salonScript,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            RenderEngine = ProceduralRenderEngine.Auto,
            SubtitlePreset = "karaoke-pulse",
            EnableCharacterDialogue = true,
            EnableComedySfx = true,
            FollowScriptExactly = true,
            SpeakerAName = "पप्पू ग्राहक",
            SpeakerBName = "अमरेंद्र नाई",
            FooterLabel = "Keshav Hub",
            ShowWatermark = true,
            Format = "landscape",
            Resolution = "720p",
            DurationSeconds = 18,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = true,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.RenderJobId);
        Assert.NotNull(result.InlineMp4Bytes);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var auditOut = Environment.GetEnvironmentVariable("ANIMSTUDIO_SALON_AUDIT_MP4");
        if (!string.IsNullOrWhiteSpace(auditOut))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(auditOut)!);
            await File.WriteAllBytesAsync(auditOut, result.InlineMp4Bytes!);
        }

        var outPath = Path.Combine(_root, "salon-verify.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);
        Assert.Equal("h264,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outPath}\""));
        Assert.Equal("aac,48000,2", FfmpegLocator.Probe(
            $"-v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 \"{outPath}\""));

        var savedJob = await jobsRepo.GetAsync(result.RenderJobId!, CancellationToken.None);
        Assert.NotNull(savedJob);
        var thumbSvc = new ProceduralComedyThumbnailService(
            store,
            AppDataPaths.Resolve(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), _root),
            Options.Create(new FfmpegOptions { FfmpegPath = FfmpegLocator.FfmpegPath, FfprobePath = FfmpegLocator.FfprobePath }),
            new FfmpegCapabilities { IsAvailable = true, HasLibass = true, HasLibx264 = true, HasAac = true, Major = FfmpegLocator.MajorVersion },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            NullLogger<ProceduralComedyThumbnailService>.Instance);

        var wideThumbBytes = await thumbSvc.TryGenerateFromRenderAsync(
            savedJob!,
            "कंटाप हेयरकट कांड 😂 | नाई की दुकान का बवाल",
            salonScript,
            "3D COMEDY",
            "FunnyComedy",
            CancellationToken.None);
        Assert.NotNull(wideThumbBytes);
        var wideThumbPath = Path.Combine(_root, "salon-169-thumb.jpg");
        await File.WriteAllBytesAsync(wideThumbPath, wideThumbBytes!);
        Assert.Equal("mjpeg,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{wideThumbPath}\""));

        var auditDir = Environment.GetEnvironmentVariable("ANIMSTUDIO_SALON_PORTRAIT_AUDIT_DIR");
        if (!string.IsNullOrWhiteSpace(auditDir))
        {
            Directory.CreateDirectory(auditDir);
            File.Copy(wideThumbPath, Path.Combine(auditDir, "salon-169-thumb.jpg"), overwrite: true);
        }
    }

    [FfmpegFact]
    public async Task Generates_barbershop_portrait_short_with_clean_vertical_mjo_thumbnail()
    {
        var store = new InMemoryObjectStore();
        var jobsRepo = new InMemoryRenderJobRepo();
        var projectsRepo = new InMemoryProjectRepo();
        var workspaces = new Workspaces(_root, store);
        var caps = new FfmpegCapabilities
        {
            IsAvailable = true,
            HasLibass = true,
            HasLibx264 = true,
            HasAac = true,
            Major = FfmpegLocator.MajorVersion
        };
        var ffmpegOpts = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath
        });
        var subtitleWriter = new AssSubtitleWriter();

        var service = new ProceduralVideoGeneratorService(
            ffmpegOpts,
            caps,
            workspaces,
            subtitleWriter,
            store,
            jobsRepo,
            projectsRepo,
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string verticalBarberScript = """
            [CAST]: अमरेंद्र नाई | scholar | red apron, glasses | voice=Fenrir
            [CAST]: पप्पू ग्राहक | scholar | yellow sweater | voice=Puck
            [CAST]: सुखिया चाचा | elder | white dhoti | voice=Algenib
            [CAST]: चिंटू बालक | child | green tee | voice=Sadachbia
            [SCENE]: barber shop | day | angry comedy
            [पप्पू ग्राहक]: (angry) अबे नाई सिर्फ साइड से काटना!
            [अमरेंद्र नाई]: (proud, cutting) चक-चक-चक! अभी हीरो बना दूँगा!
            [सुखिया चाचा]: (surprised) तेरा तो चश्मा उल्टा है बे!
            [पप्पू ग्राहक]: (removing towel, look in mirror, angry) अबे नालायक! तूने मुझे टकला कर दिया?!
            [अमरेंद्र नाई]: (angry) चश्मा उल्टा था मेरा — अब ये कटोरा लुक ही ट्रेंड है!
            """;

        var result = await service.GenerateAsync("user-salon-portrait", new ProceduralVideoRequest
        {
            Title = "अबे टकला कर दिया?! 😱 नाई कांड",
            EventType = "FunnyComedy",
            TopCategoryLabel = "KESHAV-ANIM-FF • MJO SHORT",
            Language = "hi",
            Script = verticalBarberScript,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            RenderEngine = ProceduralRenderEngine.Auto,
            SubtitlePreset = "karaoke-pulse",
            EnableCharacterDialogue = true,
            EnableComedySfx = true,
            FollowScriptExactly = true,
            SpeakerAName = "अमरेंद्र नाई",
            SpeakerBName = "पप्पू ग्राहक",
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 16,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = true,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.RenderJobId);
        Assert.NotNull(result.InlineMp4Bytes);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var vidPath = Path.Combine(_root, "salon-916.mp4");
        await File.WriteAllBytesAsync(vidPath, result.InlineMp4Bytes!);
        Assert.Equal("h264,720,1280", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{vidPath}\""));

        await using var cleanThumbStream = await store.OpenAsync($"renders/{result.RenderJobId}.cleanthumb.png", CancellationToken.None);
        Assert.NotNull(cleanThumbStream);

        var savedJob = await jobsRepo.GetAsync(result.RenderJobId!, CancellationToken.None);
        Assert.NotNull(savedJob);

        var dataPaths = AppDataPaths.Resolve(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), _root);
        var thumbSvc = new ProceduralComedyThumbnailService(
            store,
            dataPaths,
            ffmpegOpts,
            caps,
            workspaces,
            subtitleWriter,
            NullLogger<ProceduralComedyThumbnailService>.Instance);

        var thumbBytes = await thumbSvc.TryGenerateFromRenderAsync(
            savedJob!,
            "अबे टकला कर दिया?! 😱 नाई कांड",
            verticalBarberScript,
            "3D COMEDY",
            "FunnyComedy",
            CancellationToken.None);
        Assert.NotNull(thumbBytes);
        Assert.True(thumbBytes!.Length > 5_000);

        var thumbPath = Path.Combine(_root, "salon-916-thumb.jpg");
        await File.WriteAllBytesAsync(thumbPath, thumbBytes);
        Assert.Equal("mjpeg,720,1280", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{thumbPath}\""));

        var auditDir = Environment.GetEnvironmentVariable("ANIMSTUDIO_SALON_PORTRAIT_AUDIT_DIR");
        if (!string.IsNullOrWhiteSpace(auditDir))
        {
            Directory.CreateDirectory(auditDir);
            File.Copy(vidPath, Path.Combine(auditDir, "salon-916.mp4"), overwrite: true);
            File.Copy(thumbPath, Path.Combine(auditDir, "salon-916-thumb.jpg"), overwrite: true);
        }
    }

    [FfmpegFact]
    public async Task Generates_cpu_fast_fallback_and_webgl_3d_dialogue_videos()
    {
        var store = new InMemoryObjectStore();
        var service = new ProceduralVideoGeneratorService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            new FfmpegCapabilities
            {
                IsAvailable = true,
                HasLibass = true,
                HasLibx264 = true,
                HasAac = true,
                Major = FfmpegLocator.MajorVersion
            },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            new InMemoryRenderJobRepo(),
            new InMemoryProjectRepo(),
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        var cpuResult = await service.GenerateAsync(string.Empty, new ProceduralVideoRequest
        {
            Title = "Chai Comedy Fast",
            Script = "[Pappu]: (laughing) बिना चीनी की चाय!\n[Bablu]: (surprised) वाह!",
            Theme = ProceduralSceneTheme.ComedyStage3D,
            RenderEngine = ProceduralRenderEngine.CpuFast,
            VfxStyle = ProceduralVfxStyle.ComedyBurst,
            EnableCharacterDialogue = true,
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 5,
            Fps = 24,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.Contains("engine=cpu-fast", cpuResult.Summary);
        Assert.NotNull(cpuResult.InlineMp4Bytes);
        Assert.True(cpuResult.SizeBytes > 5_000);

        if (WebGlVideoFrameRenderer.IsAvailable())
        {
            var webGlResult = await service.GenerateAsync(string.Empty, new ProceduralVideoRequest
            {
                Title = "Bhakta Dhruva Real 3D",
                EventType = "DailyKatha",
                Script = "[Bhakta Dhruva]: (happy) ओ देवर्षि नारद!\n[Devarshi Narada]: (proud) शुभ वरदान प्राप्त हो।",
                Theme = ProceduralSceneTheme.VedicTempleSunrise3D,
                RenderEngine = ProceduralRenderEngine.WebGl3D,
                VfxStyle = ProceduralVfxStyle.DivineAura,
                EnableCharacterDialogue = true,
                Format = "vertical",
                Resolution = "720p",
                DurationSeconds = 5,
                Fps = 24,
                SaveAsRenderJob = false,
                ReturnInlineBytes = true
            }, CancellationToken.None);

            Assert.Contains("engine=webgl-3d", webGlResult.Summary);
            Assert.NotNull(webGlResult.InlineMp4Bytes);
            var webGlPath = Path.Combine(_root, "verified-webgl-3d.mp4");
            await File.WriteAllBytesAsync(webGlPath, webGlResult.InlineMp4Bytes!);
            Assert.Equal("h264,720,1280", FfmpegLocator.Probe(
                $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{webGlPath}\""));
        }
    }

    [FfmpegFact]
    public async Task ProceduralBgmCacheService_resamples_existing_192kHz_cached_preset_to_48kHz_without_losing_source()
    {
        var bgmRoot = Path.Combine(_root, "bgm-upgrade-test");
        Directory.CreateDirectory(bgmRoot);
        var paths = AppDataPaths.Resolve(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), bgmRoot);
        var presetsDir = Path.Combine(paths.Root, "bgm-presets");
        Directory.CreateDirectory(presetsDir);

        var wavPath = Path.Combine(presetsDir, "vedic-sunrise.wav");
        var sourcePath = Path.Combine(presetsDir, "vedic-sunrise.source");
        await File.WriteAllTextAsync(sourcePath, "lyria:lyria-3.5");

        // Create a 192kHz cached WAV reproducing what loudnorm previously saved.
        var psi = new System.Diagnostics.ProcessStartInfo
        {
            FileName = FfmpegLocator.FfmpegPath,
            Arguments = $"-y -f lavfi -i \"sine=frequency=432:duration=2\" -ar 192000 -ac 2 -c:a pcm_s16le \"{wavPath}\"",
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using (var proc = System.Diagnostics.Process.Start(psi)!)
        {
            await proc.WaitForExitAsync();
            Assert.Equal(0, proc.ExitCode);
        }

        Assert.False(ProceduralBgmCacheService.IsStereo48kWav(wavPath));

        var cache = new ProceduralBgmCacheService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            paths);

        var (resolvedPath, resolvedSource) = await cache.EnsurePresetWavAsync(
            ProceduralSceneTheme.VedicTempleSunrise3D,
            forceRefresh: false,
            CancellationToken.None);

        Assert.Equal(wavPath, resolvedPath);
        Assert.Equal("lyria:lyria-3.5", resolvedSource);
        Assert.True(ProceduralBgmCacheService.IsStereo48kWav(wavPath));
        Assert.Equal("48000,2", FfmpegLocator.Probe(
            $"-v error -select_streams a:0 -show_entries stream=sample_rate,channels -of csv=p=0 \"{wavPath}\""));
    }

    [FfmpegFact]
    public async Task PalaceCourt_RoyalSufiDance_16x9_renders_grounded_multi_dancer_choreography()
    {
        if (!WebGlVideoFrameRenderer.IsAvailable())
            return;

        var store = new InMemoryObjectStore();
        var service = new ProceduralVideoGeneratorService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            new FfmpegCapabilities
            {
                IsAvailable = true,
                HasLibass = true,
                HasLibx264 = true,
                HasAac = true,
                Major = FfmpegLocator.MajorVersion
            },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            new InMemoryRenderJobRepo(),
            new InMemoryProjectRepo(),
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string danceScript = """
            [SCENE]: palace court | sunset | festive
            [Prince Sartaaj]: (adaab, proud) गुज़ारिश है चाँद और सितारों से, आज दरबार में सुर और नृत्य सजेगा।
            [Rani Meera]: (dancing, happy) हर ताल पर पायल और हाथों की मुद्राएँ महल को जगमगा रही हैं।
            [Dancer Maya]: (sufiSpin, happy) शीश महल के झरोखों में आज सूफी ताल का जादू बरस रहा है!
            [Dancer Kavya]: (dancing, happy) सभी दरबारी नर्तकी एक ही लय में घूम रहे हैं!
            [Chhotu Child]: (dancing, laughing) अरे वाह! राजमहल में सबसे मस्त नाच चल रहा है!
            """;

        var result = await service.GenerateAsync("user-palace-dance", new ProceduralVideoRequest
        {
            Title = "गुज़ारिश • शाही दरबार 3D सूफी नृत्य",
            EventType = "HistoryChronicle",
            TopCategoryLabel = "KESHAV STUDIO • ROYAL SUFI DANCE",
            Language = "hi",
            Script = danceScript,
            Prompt = "Royal palace courtyard Sufi Kathak group dance with brass candelabras",
            Theme = ProceduralSceneTheme.ComedyStage3D,
            SubtitlePreset = "event-glow",
            EnableCharacterDialogue = true,
            SpeakerAName = "Prince Sartaaj",
            SpeakerBName = "Rani Meera",
            FooterLabel = "KESHAV STUDIO",
            Format = "landscape",
            Resolution = "720p",
            DurationSeconds = 9,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = true,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 20_000, $"Expected rich 3D palace dance MP4 >20KB, got {result.SizeBytes}");
        var outMp4 = Path.Combine(_root, "verified-palace-dance-169.mp4");
        await File.WriteAllBytesAsync(outMp4, result.InlineMp4Bytes!);
        Assert.Equal("h264,1280,720", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outMp4}\""));

        // Save rendered showcase MP4 into workspace renders/ and verification frames into scratch/.
        var scratchDir = @"C:\Users\DEV01\.gemini\antigravity\brain\7201c182-54e0-4a04-994f-510015c69cb9\scratch";
        Directory.CreateDirectory(scratchDir);
        File.Copy(outMp4, Path.Combine(scratchDir, "palace_dance_169.mp4"), overwrite: true);
        var repoRendersDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "renders"));
        Directory.CreateDirectory(repoRendersDir);
        File.Copy(outMp4, Path.Combine(repoRendersDir, "guzarish_animstudio_3d_dance.mp4"), overwrite: true);
        foreach (var (ts, name) in new[] { ("1.2", "palace_dance_adaab.png"), ("4.2", "palace_dance_troupe.png"), ("7.2", "palace_dance_spin.png") })
        {
            var pngOut = Path.Combine(scratchDir, name);
            var psi = new System.Diagnostics.ProcessStartInfo(FfmpegLocator.FfmpegPath,
                $"-nostdin -loglevel error -y -ss {ts} -i \"{outMp4}\" -vframes 1 \"{pngOut}\"")
            {
                RedirectStandardError = false,
                RedirectStandardOutput = false,
                UseShellExecute = false
            };
            using var p = System.Diagnostics.Process.Start(psi)!;
            await p.WaitForExitAsync();
            Assert.True(File.Exists(pngOut), $"Expected extracted dance frame {pngOut}");
        }
    }

    [FfmpegFact]
    public async Task DevotionalImageReel_renders_rounded_vignette_top_captions_smooth_orbit_and_quiet_bgm()
    {
        var store = new InMemoryObjectStore();
        var service = new ProceduralVideoGeneratorService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            new FfmpegCapabilities
            {
                IsAvailable = true,
                HasLibass = true,
                HasLibx264 = true,
                HasAac = true,
                Major = FfmpegLocator.MajorVersion
            },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            new InMemoryRenderJobRepo(),
            new InMemoryProjectRepo(),
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        var imgPath = Path.Combine(_root, "shiva-art.png");
        await File.WriteAllBytesAsync(imgPath, Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="));

        var result = await service.GenerateAsync(string.Empty, new ProceduralVideoRequest
        {
            Title = "हे नाथ यदि आप हमारे अवगुण देखोगे | शिव प्रार्थना",
            EventType = "DevotionalPrarthana",
            Script = "हे नाथ यदि आप हमारे अवगुण देखोगे तो हम कहाँ जाएँगे।\nहर हर महादेव!",
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 4,
            Fps = 24,
            IncludeCaptions = true,
            IncludeAmbientAudio = true,
            BgmVolumePercent = 18,
            IncludeSpeech = false,
            ShowWatermark = true,
            FooterLabel = "@Deenabhakti_Spiritual",
            StageLayout = new ProceduralStageLayout(null, null, TemplateBackdrop: true, TemplateBackdropMotion.OrbitRound, DevotionalReelFrame: true),
            BackgroundImagePaths = [imgPath],
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.True(result.SizeBytes > 10_000, $"Expected devotional reel MP4 >10KB, got {result.SizeBytes}");
        var outPath = Path.Combine(_root, "devotional-reel-test.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);
        Assert.Equal("h264,720,1280", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 \"{outPath}\""));
    }

    [FfmpegFact]
    public async Task SabarKaImtihan_Comedy_WebGl3D_renders_shroud_hazards_and_corpse_snap_climax()
    {
        if (!WebGlVideoFrameRenderer.IsAvailable())
            return;

        var store = new InMemoryObjectStore();
        var service = new ProceduralVideoGeneratorService(
            Options.Create(new FfmpegOptions
            {
                FfmpegPath = FfmpegLocator.FfmpegPath,
                FfprobePath = FfmpegLocator.FfprobePath
            }),
            new FfmpegCapabilities
            {
                IsAvailable = true,
                HasLibass = true,
                HasLibx264 = true,
                HasAac = true,
                Major = FfmpegLocator.MajorVersion
            },
            new Workspaces(_root, store),
            new AssSubtitleWriter(),
            store,
            new InMemoryRenderJobRepo(),
            new InMemoryProjectRepo(),
            TimeProvider.System,
            NullLogger<ProceduralVideoGeneratorService>.Instance);

        const string script = """
            [CAST]: बबलू यार | scholar | white kurta, dark shawl | voice=Orus
            [CAST]: पप्पू भैया | scholar | yellow sweater, spiky hair | voice=Puck
            [CAST]: सुखिया चाचा | male | white kurta, comic mustache | voice=Algenib
            [CAST]: भाभी जी | noblewoman | pastel saree | voice=Aoede
            [SCENE]: living room | day | comedy
            [पप्पू भैया]: (surprised) कैसे मर गए भाई साहब?!
            [बबलू यार]: (hazardWire, sad) सामने बिजली का छिला तार पड़ा था!
            [बबलू यार]: (hazardSnake, confused) आगे इतना बड़ा साँप... देखो कितना अच्छा जा रहा है!
            [सुखिया चाचा]: (corpseSnapUp, angry) ओ मार भी दे हुं!! कब से सुन रहा हूँ!!
            """;

        var result = await service.GenerateAsync(string.Empty, new ProceduralVideoRequest
        {
            Title = "सब्र का इम्तिहान 😂 | ओ मार भी दे!!",
            EventType = "FunnyComedy",
            TopCategoryLabel = "KESHAV-ANIM-FF • COMEDY SHORT",
            Language = "hi",
            Script = script,
            Theme = ProceduralSceneTheme.ComedyStage3D,
            RenderEngine = ProceduralRenderEngine.WebGl3D,
            SubtitlePreset = "karaoke-pulse",
            EnableCharacterDialogue = true,
            EnableComedySfx = true,
            FollowScriptExactly = true,
            SpeakerAName = "बबलू यार",
            SpeakerBName = "पप्पू भैया",
            Format = "vertical",
            Resolution = "720p",
            DurationSeconds = 12,
            Fps = 24,
            IncludeCaptions = true,
            IncludeSpeech = false,
            IncludeAmbientAudio = true,
            SaveAsRenderJob = false,
            ReturnInlineBytes = true
        }, CancellationToken.None);

        Assert.NotNull(result.InlineMp4Bytes);
        Assert.Contains("engine=webgl-3d", result.Summary);

        var outPath = Path.Combine(_root, "sabar-smoke-webgl3d.mp4");
        await File.WriteAllBytesAsync(outPath, result.InlineMp4Bytes!);

        var frameAuditDir = Environment.GetEnvironmentVariable("ANIMSTUDIO_COMEDY_AUDIT_DIR");
        if (!string.IsNullOrWhiteSpace(frameAuditDir))
        {
            Directory.CreateDirectory(frameAuditDir);
            await File.WriteAllBytesAsync(Path.Combine(frameAuditDir, "sabar-smoke.mp4"), result.InlineMp4Bytes!);
            foreach (var (name, sec) in new[] { ("1-shroud.png", "1.5"), ("2-wire.png", "4.0"), ("3-snake.png", "7.8"), ("4-snapup.png", "10.3") })
            {
                var png = Path.Combine(frameAuditDir, name);
                var psi = new System.Diagnostics.ProcessStartInfo(FfmpegLocator.FfmpegPath,
                    $"-nostdin -loglevel error -y -ss {sec} -i \"{outPath}\" -frames:v 1 \"{png}\"")
                {
                    RedirectStandardError = false,
                    RedirectStandardOutput = false,
                    UseShellExecute = false
                };
                using var p = System.Diagnostics.Process.Start(psi)!;
                await p.WaitForExitAsync();
                Assert.Equal(0, p.ExitCode);
                Assert.True(File.Exists(png), $"Expected extracted audit frame {png}");
            }
        }
    }

    private sealed class Workspaces(string root, IObjectStore store) : IRenderWorkspaceFactory
    {
        public Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct) =>
            Task.FromResult<IRenderWorkspace>(new LocalRenderWorkspace(
                jobId, Path.Combine(root, jobId), store,
                NullLogger<LocalRenderWorkspace>.Instance, keepOnFailure: false));
    }

    private sealed class InMemoryObjectStore : IObjectStore
    {
        private readonly ConcurrentDictionary<string, byte[]> _objects = new(StringComparer.Ordinal);
        public bool Contains(string key) => _objects.ContainsKey(key);

        public async Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default)
        {
            using var ms = new MemoryStream();
            await content.CopyToAsync(ms, ct);
            _objects[key] = ms.ToArray();
        }

        public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
            Task.FromResult<Stream?>(_objects.TryGetValue(key, out var bytes) ? new MemoryStream(bytes, writable: false) : null);

        public Task DeleteAsync(string key, CancellationToken ct = default)
        {
            _objects.TryRemove(key, out _);
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryProjectRepo : IProjectRepository
    {
        private readonly ConcurrentDictionary<string, Project> _map = new(StringComparer.Ordinal);
        public Task<Project?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_map.GetValueOrDefault(id));
        public Task<IReadOnlyList<Project>> ListAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Project>>([.. _map.Values.Where(p => p.UserId == userId)]);
        public Task<IReadOnlyList<Project>> ListAllAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Project>>([.. _map.Values]);
        public Task<IReadOnlyList<Project>> ListSubProjectsAsync(string parentProjectId, CancellationToken ct) => Task.FromResult<IReadOnlyList<Project>>([]);
        public Task InsertAsync(Project project, CancellationToken ct) { _map[project.Id] = project; return Task.CompletedTask; }
        public Task ReplaceAsync(Project project, CancellationToken ct) { _map[project.Id] = project; return Task.CompletedTask; }
        public Task DeleteAsync(string id, CancellationToken ct) { _map.TryRemove(id, out _); return Task.CompletedTask; }
    }

    private sealed class InMemoryRenderJobRepo : IRenderJobRepository
    {
        private readonly ConcurrentDictionary<string, RenderJob> _map = new(StringComparer.Ordinal);
        public Task<RenderJob?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_map.GetValueOrDefault(id));
        public Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<RenderJob>>([.. _map.Values.Where(j => j.ProjectId == projectId)]);
        public Task InsertAsync(RenderJob job, CancellationToken ct) { _map[job.Id] = job; return Task.CompletedTask; }
        public Task<RenderJob?> ClaimNextAsync(string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct) => Task.FromResult<RenderJob?>(null);
        public Task<JobHeartbeatResult> ReportProgressAsync(string jobId, string leaseOwner, int progress, string? message, RenderStage stage, int scenesDone, TimeSpan leaseDuration, CancellationToken ct) =>
            Task.FromResult(new JobHeartbeatResult(true, false));
        public Task CompleteAsync(RenderJob job, CancellationToken ct) { _map[job.Id] = job; return Task.CompletedTask; }
        public Task RequestCancelAsync(string jobId, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(string jobId, CancellationToken ct) { _map.TryRemove(jobId, out _); return Task.CompletedTask; }
        public Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<string>>([]);
        public Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<RenderJob>>([.. _map.Values]);
        public Task<bool> RequeueAsync(string jobId, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> RenameAsync(string jobId, string name, CancellationToken ct) => Task.FromResult(true);
    }
}
