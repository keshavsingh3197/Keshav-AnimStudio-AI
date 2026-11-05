using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Jobs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Renders a still through the same clip pass an image clip takes in the editor, so the page and an export move a
/// picture identically. Runs inline in the request, like <see cref="OutroPreviewRenderer"/>: a clip of at most
/// <see cref="ImageAnimation.MaxSeconds"/> is seconds of encode, and the workspace is gone when it returns.
/// </summary>
public sealed class ImageAnimationRenderer(
    IVideoRenderingService renderer,
    IRenderWorkspaceFactory workspaces,
    IOptions<RenderOptions> options,
    ILogger<ImageAnimationRenderer> logger) : IImageAnimationRenderer
{
    public async Task<byte[]> RenderAsync(
        byte[] image, string extension, CinematicImageSettings settings, Canvas canvas, double seconds,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(image);
        ArgumentNullException.ThrowIfNull(settings);
        canvas.Validate();

        await using var workspace = await workspaces
            .CreateAsync($"animate-image-{Guid.NewGuid():N}", ct).ConfigureAwait(false);

        // The name is ours, never the upload's.
        var source = $"still{extension}";
        await File.WriteAllBytesAsync(workspace.Resolve(source), image, ct).ConfigureAwait(false);

        var duration = ImageAnimation.ClampSeconds(seconds);
        var plan = new ClipRenderPlan
        {
            ClipIndex = 0,
            SourceRelativePath = source,
            Canvas = canvas,
            OutputRelativePath = "animated.mp4",
            ExpectedFrames = FrameCount.FromSeconds(duration, canvas.FrameRate),
            // Cover, so a move never uncovers the bars a contained picture would have.
            Fit = ClipFit.Cover,
            SourceIsImage = true,
            SourceHasAudio = false,
            ImageDurationSeconds = duration,
            Cinematic = settings,
            MotionSupersample = Math.Clamp(options.Value.KenBurnsSupersample, 1, 4),
            Encoder = RenderJobWorker.DeliveryProfile(options.Value, logger),
        };

        var result = await renderer.RenderClipAsync(plan, workspace, null, ct).ConfigureAwait(false);
        return await File.ReadAllBytesAsync(workspace.Resolve(result.RelativePath), ct).ConfigureAwait(false);
    }
}
