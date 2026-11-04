using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Gives every scene a picture: the one the person attached, else one from the image engine if one is turned on,
/// else a plain glowing background - because a scene with no picture cannot be rendered at all.
/// </summary>
public sealed class VisualsStage(
    IAiExecutor ai,
    IObjectStore store,
    ILogger<VisualsStage> logger) : IStoryStage
{
    /// <summary>Pictures larger than this are not kept; a generated one this large is a provider misbehaving.</summary>
    public const int MaxImageBytes = 10 * 1024 * 1024;

    public const string DefaultStyle = "classical Indian devotional painting, rich jewel colors, warm golden light, no text, no watermark";

    /// <summary>After this many generated pictures in a row failed, the engine is not asked again for this run.</summary>
    private const int GiveUpAfter = 3;

    public string Id => StoryStageIds.Visuals;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to make pictures for.");
        var vertical = run.Brief.Format == StoryFormat.Vertical;
        var (width, height) = vertical ? (768, 1344) : (1344, 768);

        var useEngine = run.Options.Visuals == StoryVisualMode.Auto;
        var failedInARow = 0;
        int attached = 0, generated = 0, plain = 0, clips = 0;

        for (var i = 0; i < script.Scenes.Count; i++)
        {
            ct.ThrowIfCancellationRequested();
            var scene = script.Scenes[i];
            await context.Report(i * 100 / script.Scenes.Count, $"Picture {i + 1} of {script.Scenes.Count}").ConfigureAwait(false);

            if (await HasPictureAsync(run, scene, ct).ConfigureAwait(false))
            {
                if (scene.ImageSource == "upload") attached++;
                else if (scene.ImageSource == "placeholder") plain++;
                else generated++;
                continue;
            }

            // The person's own clip plays here, so the picture is only a fallback and not worth an image request.
            if (StoryObjectKeys.Owns(run.Id, scene.VideoKey))
            {
                await KeepPlainAsync(run, scene, vertical, ct).ConfigureAwait(false);
                clips++;
                await context.Save().ConfigureAwait(false);
                continue;
            }

            if (useEngine && !string.IsNullOrWhiteSpace(scene.ImagePrompt))
            {
                var made = await GenerateAsync(run, scene, width, height, ct).ConfigureAwait(false);
                switch (made)
                {
                    case Generated.Yes:
                        generated++;
                        failedInARow = 0;
                        await context.Save().ConfigureAwait(false);
                        continue;
                    case Generated.Unavailable:
                        useEngine = false;
                        break;
                    case Generated.Failed when ++failedInARow >= GiveUpAfter:
                        useEngine = false;
                        StoryRunWarnings.Add(run, "The image engine kept failing, so the remaining scenes use plain backgrounds.");
                        break;
                }
            }

            await KeepPlainAsync(run, scene, vertical, ct).ConfigureAwait(false);
            plain++;
            await context.Save().ConfigureAwait(false);
        }

        if (plain > 0)
        {
            StoryRunWarnings.Add(run,
                $"{plain} scene{(plain == 1 ? " has" : "s have")} a plain background instead of a picture. Attach your own in the script review, or turn on an image provider and build again.");
        }

        var parts = new List<string>();
        if (attached > 0) parts.Add($"{attached} of yours");
        if (clips > 0) parts.Add($"{clips} moving clip{(clips == 1 ? string.Empty : "s")}");
        if (generated > 0) parts.Add($"{generated} generated");
        if (plain > 0) parts.Add($"{plain} plain");
        return StoryStageOutcome.Completed($"Pictures ready: {string.Join(", ", parts)}.");
    }

    private enum Generated { Yes, Unavailable, Failed }

    /// <summary>True when the scene's picture is already stored, so a retry keeps what was made.</summary>
    private async Task<bool> HasPictureAsync(StoryRun run, StoryScene scene, CancellationToken ct)
    {
        if (!StoryObjectKeys.Owns(run.Id, scene.ImageKey)) return false;

        await using var existing = await store.OpenAsync(scene.ImageKey!, ct).ConfigureAwait(false);
        if (existing is not null) return true;

        scene.ImageKey = null;
        scene.ImageSource = null;
        return false;
    }

    private async Task<Generated> GenerateAsync(StoryRun run, StoryScene scene, int width, int height, CancellationToken ct)
    {
        var style = string.IsNullOrWhiteSpace(run.Options.ImageStyle) ? DefaultStyle : run.Options.ImageStyle.Trim();
        var outcome = await ai.ImageAsync(new AiImageRequest
        {
            Prompt = $"{scene.ImagePrompt!.TrimEnd('.', ' ')}, {style}",
            Width = width,
            Height = height,
            Seed = Seed(run.Id, scene.Number)
        }, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

        if (outcome.Kind == AiOutcomeKind.Unavailable) return Generated.Unavailable;
        if (!outcome.IsSuccess)
        {
            logger.LogWarning("Story run {RunId}: the image engine failed for scene {Scene}: {Code}", run.Id, scene.Number, outcome.ErrorCode);
            return Generated.Failed;
        }

        var image = outcome.Value!;
        var mime = AiImageValidator.Sniff(image.Content);
        if (mime is null || image.Content.Length > MaxImageBytes)
        {
            logger.LogWarning("Story run {RunId}: the image engine's picture for scene {Scene} was unusable.", run.Id, scene.Number);
            return Generated.Failed;
        }

        var key = StoryObjectKeys.Image(run.Id, scene.Number, StoryBundleBuilder.ImageExtension(mime));
        await using (var content = new MemoryStream(image.Content, writable: false))
            await store.SaveAsync(key, content, mime, ct).ConfigureAwait(false);

        scene.ImageKey = key;
        scene.ImageSource = image.Provenance.ProviderId;
        scene.ImageName = $"Scene {scene.Number}";
        return Generated.Yes;
    }

    private async Task KeepPlainAsync(StoryRun run, StoryScene scene, bool vertical, CancellationToken ct)
    {
        var key = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
        await using (var content = new MemoryStream(StoryPlaceholderImage.Create(scene.Number, vertical), writable: false))
            await store.SaveAsync(key, content, AiImageValidator.Png, ct).ConfigureAwait(false);

        scene.ImageKey = key;
        scene.ImageSource = "placeholder";
        scene.ImageName = $"Scene {scene.Number} (plain background)";
    }

    /// <summary>The same picture for the same scene of the same run, so a retry that has to ask again asks for the same thing.</summary>
    private static long Seed(string runId, int scene)
    {
        unchecked
        {
            var hash = 1469598103934665603UL;
            foreach (var c in runId) hash = (hash ^ c) * 1099511628211UL;
            hash = (hash ^ (ulong)scene) * 1099511628211UL;
            return (long)(hash & 0x7FFFFFFF);
        }
    }
}
