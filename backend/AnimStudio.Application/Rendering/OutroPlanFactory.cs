using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// The clip plan for an outro of any kind - bumper video, end-card image, or composed QR
/// card. One factory for the export and the standalone preview, so the card a person
/// downloads to attach to an old upload is the very one new exports end with.
/// </summary>
public static class OutroPlanFactory
{
    public const string OutputRelativePath = "clips/clip_outro.mp4";

    /// <summary>The one asset an enabled outro needs: the bumper itself, or a card's QR code.</summary>
    public static string? AssetIdFor(OutroSettings? outro) =>
        outro is not { IsEnabled: true } ? null
        : outro.Kind == OutroKind.Card ? (string.IsNullOrWhiteSpace(outro.QrAssetId) ? null : outro.QrAssetId)
        : outro.AssetId;

    /// <summary>
    /// Whether the outro joins with a real transition. A card never does - it fades up
    /// inside itself instead - so that an end card alone never costs a full re-encode.
    /// </summary>
    public static bool Crossfades(OutroSettings? outro) =>
        outro is { IsEnabled: true } && outro.Kind != OutroKind.Card
        && outro.Transition != SceneTransition.None && outro.TransitionDurationFrames > 0;

    /// <param name="asset">The outro's asset (the bumper, or a card's QR code), or null when it has none or it is gone.</param>
    /// <param name="assetRelativePath">That asset, already in the workspace.</param>
    /// <returns>Null when there is nothing to show: a bumper whose file is gone, or a card with neither code nor text.</returns>
    public static async Task<ClipRenderPlan?> CreateAsync(
        OutroSettings outro, Asset? asset, string? assetRelativePath, Canvas canvas,
        Func<string, string?>? fontForText, EncoderProfile encoder, IRenderWorkspace workspace,
        int clipIndex, ICollection<string> warnings, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(outro);
        if (!outro.IsEnabled) return null;

        if (outro.Kind == OutroKind.Card)
        {
            var qrPath = asset is not null ? assetRelativePath : null;
            if (!string.IsNullOrWhiteSpace(outro.QrAssetId) && qrPath is null) warnings.Add("OUTRO_UNAVAILABLE");

            if (qrPath is null && string.IsNullOrWhiteSpace(outro.Headline)
                && string.IsNullOrWhiteSpace(outro.HeadlineSecondary)) return null;

            return await EndCardFactory.PrepareAsync(
                workspace, outro, canvas, qrPath, fontForText, encoder,
                clipIndex, OutputRelativePath, warnings, ct).ConfigureAwait(false);
        }

        if (asset is null || assetRelativePath is null)
        {
            warnings.Add("OUTRO_UNAVAILABLE");
            return null;
        }

        var isImage = asset.Kind == AssetKind.Image;
        var seconds = isImage ? outro.DurationSeconds : asset.Probe.DurationSeconds ?? 4.0;

        return new ClipRenderPlan
        {
            ClipIndex = clipIndex,
            SourceRelativePath = assetRelativePath,
            Canvas = canvas,
            OutputRelativePath = OutputRelativePath,
            ExpectedFrames = new FrameCount((int)Math.Max(1, Math.Round(seconds * canvas.FrameRate.AsDouble))),
            Fit = ClipFit.Contain,
            SourceIsImage = isImage,
            ImageDurationSeconds = outro.DurationSeconds,
            SourceHasAudio = !isImage && !string.IsNullOrEmpty(asset.Probe.AudioCodec),
            Encoder = encoder
        };
    }
}
