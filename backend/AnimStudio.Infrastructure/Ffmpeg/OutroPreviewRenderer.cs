using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Jobs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Renders the studio outro alone, through the same plan factory and clip pass an export
/// uses. Runs inline in the request: a still card is a few seconds of encode at most, and
/// an unchanged card is served from the conform cache without encoding at all.
/// </summary>
public sealed class OutroPreviewRenderer(
    IVideoRenderingService renderer,
    IRenderWorkspaceFactory workspaces,
    IAssetRepository assets,
    IRenderCapabilities capabilities,
    WatermarkFontResolver fonts,
    IOptions<RenderOptions> options,
    ILogger<OutroPreviewRenderer> logger) : IOutroPreviewRenderer
{
    public async Task<byte[]?> RenderAsync(OutroSettings outro, Canvas canvas, string? projectId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(outro);
        if (!outro.IsEnabled) return null;

        await using var workspace = await workspaces
            .CreateAsync($"outro-preview-{Guid.NewGuid():N}", ct).ConfigureAwait(false);

        var asset = OutroPlanFactory.AssetIdFor(outro) is { } id
            ? await assets.GetAsync(id, ct).ConfigureAwait(false)
            : null;

        // Studio-wide files, plus the one project the caller was checked to own: this must
        // not become a way to pull a file out of somebody else's project.
        if (asset is not null
            && asset.ProjectId is not ("global" or "system")
            && !(projectId is not null && string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal)))
        {
            asset = null;
        }

        string? path = null;
        if (asset is not null)
        {
            var extension = Path.GetExtension(asset.StorageKey);
            path = await workspace
                .MaterializeAsync(asset.StorageKey, $"in/outro_{asset.Id}{extension}", ct)
                .ConfigureAwait(false);
        }

        var warnings = new List<string>();
        var plan = await OutroPlanFactory.CreateAsync(
            outro, asset, path, canvas,
            capabilities.Supports(RenderFeature.DrawText) ? fonts.FontFor : null,
            RenderJobWorker.DeliveryProfile(options.Value, logger),
            workspace, 0, warnings, ct).ConfigureAwait(false);

        if (plan is null) return null;

        var result = await renderer.RenderClipAsync(plan, workspace, null, ct).ConfigureAwait(false);

        if (warnings.Count > 0)
            logger.LogInformation("Outro preview rendered with warnings: {Warnings}.", string.Join(", ", warnings));

        return await File.ReadAllBytesAsync(workspace.Resolve(result.RelativePath), ct).ConfigureAwait(false);
    }
}
