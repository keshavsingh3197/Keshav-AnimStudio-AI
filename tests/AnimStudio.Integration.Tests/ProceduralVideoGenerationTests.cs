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
            $"-v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 \"{mp4Path}\"");
        Assert.Equal("aac", audioCodec);

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
