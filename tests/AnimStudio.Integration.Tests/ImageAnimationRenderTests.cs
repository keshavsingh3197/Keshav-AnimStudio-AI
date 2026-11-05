using System.Globalization;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// The Animate Image page's render, against the real ffmpeg: a still in, an MP4 of the asked length and shape out.
/// </summary>
public sealed class ImageAnimationRenderTests : IAsyncLifetime
{
    private static readonly Canvas Small = new(640, 360, FrameRate.Fps30);
    private static readonly Canvas SmallVertical = new(360, 640, FrameRate.Fps30);

    private string _root = string.Empty;

    public Task InitializeAsync()
    {
        _root = Path.Combine(Path.GetTempPath(), "animstudio-tests", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(_root);
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
        return Task.CompletedTask;
    }

    [FfmpegFact]
    public async Task A_still_becomes_a_clip_of_the_asked_length_and_shape()
    {
        var bytes = await StillAsync();
        var settings = ImageAnimation.Settings(ImageAnimation.FromWords("slow push in on the face, warm, film grain", null));

        var video = await Renderer().RenderAsync(bytes, ".png", settings, Small, 3, CancellationToken.None);

        var path = Path.Combine(_root, "out.mp4");
        await File.WriteAllBytesAsync(path, video);
        Assert.Equal("640,360", FfmpegLocator.Probe(
            $"-v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 \"{path}\""));
        var seconds = double.Parse(FfmpegLocator.Probe(
            $"-v error -show_entries format=duration -of csv=p=0 \"{path}\""), CultureInfo.InvariantCulture);
        Assert.InRange(seconds, 2.9, 3.2);
    }

    [FfmpegFact]
    public async Task Every_move_renders_vertical()
    {
        var bytes = await StillAsync();
        foreach (var motion in ImageAnimation.Motions)
        {
            var plan = ImageAnimation.FromWords("x", null) with { Motion = motion, CinemaBars = true, Vignette = true };
            var video = await Renderer().RenderAsync(
                bytes, ".png", ImageAnimation.Settings(plan), SmallVertical, 2, CancellationToken.None);

            Assert.True(video.Length > 1000, $"{motion} produced no video.");
        }
    }

    private async Task<byte[]> StillAsync()
    {
        var png = Path.Combine(_root, "still.png");
        RenderFixtures.MakeBackground(png, "orange", 800, 600);
        return await File.ReadAllBytesAsync(png);
    }

    private ImageAnimationRenderer Renderer()
    {
        var ffmpegOptions = Options.Create(new FfmpegOptions
        {
            FfmpegPath = FfmpegLocator.FfmpegPath,
            FfprobePath = FfmpegLocator.FfprobePath,
            SceneTimeoutMinutes = 5
        });
        var capabilities = new FfmpegCapabilities
        {
            IsAvailable = true, HasLibass = true, HasZoompan = true, HasXfade = true,
            HasAcrossfade = true, HasAlimiter = true, HasLibx264 = true, HasAac = true,
            HasDrawtext = true, HasGblur = true, Major = FfmpegLocator.MajorVersion
        };
        var renderOptions = Options.Create(new RenderOptions());
        var service = new FfmpegVideoRenderingService(
            new FfmpegRunner(ffmpegOptions, NullLogger<FfmpegRunner>.Instance),
            new FfmpegFilterGraphBuilder(capabilities),
            capabilities,
            ffmpegOptions,
            renderOptions,
            NullLogger<FfmpegVideoRenderingService>.Instance,
            null);

        return new ImageAnimationRenderer(
            service, new Workspaces(_root), renderOptions, NullLogger<ImageAnimationRenderer>.Instance);
    }

    private sealed class Workspaces(string root) : IRenderWorkspaceFactory
    {
        public Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct) =>
            Task.FromResult<IRenderWorkspace>(new LocalRenderWorkspace(
                jobId, Path.Combine(root, jobId), new NullObjectStore(),
                NullLogger<LocalRenderWorkspace>.Instance, keepOnFailure: false));
    }

    /// <summary>The picture is written straight into the workspace, so no object store is needed.</summary>
    private sealed class NullObjectStore : IObjectStore
    {
        public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default) =>
            Task.CompletedTask;
        public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
            Task.FromResult<Stream?>(null);
        public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    }
}
