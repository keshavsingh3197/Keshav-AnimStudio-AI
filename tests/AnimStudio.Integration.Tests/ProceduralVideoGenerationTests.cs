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
