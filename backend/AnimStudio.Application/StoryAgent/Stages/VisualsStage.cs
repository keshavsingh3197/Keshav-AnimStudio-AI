using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Gives every scene a picture: the one the person attached, else one from the image engine if one is turned on,
/// else a plain glowing background - because a scene with no picture cannot be rendered at all. Then the scenes' further
/// pictures and the thumbnail, the same way, except that one that cannot be had is simply left out.
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

            // The person's own clip plays here, so the picture is only a fallback and not worth an image request. A clip the
            // build animated is different: it was made from the picture, and is made again from the new one.
            if (scene.HasAttachedClip && StoryObjectKeys.Owns(run.Id, scene.VideoKey))
            {
                await KeepPlainAsync(run, scene, vertical, ct).ConfigureAwait(false);
                clips++;
                await context.Save().ConfigureAwait(false);
                continue;
            }

            if (useEngine && !string.IsNullOrWhiteSpace(scene.ImagePrompt))
            {
                var made = await GenerateAsync(run, scene.ImagePrompt, StoryObjectKeys.Image(run.Id, scene.Number, ".png"),
                    width, height, Seed(run.Id, scene.Number), ct).ConfigureAwait(false);
                if (made.Key is not null)
                {
                    scene.ImageKey = made.Key;
                    scene.ImageSource = made.Provider;
                    scene.ImageName = $"Scene {scene.Number}";
                }
                if (Settle(made.Result))
                {
                    generated++;
                    await context.Save().ConfigureAwait(false);
                    continue;
                }
            }

            await KeepPlainAsync(run, scene, vertical, ct).ConfigureAwait(false);
            plain++;
            await context.Save().ConfigureAwait(false);
        }

        // The scenes' further pictures. One that cannot be had is left out: the scene shows fewer, never a plain one.
        await context.Report(90, "The scenes' further pictures").ConfigureAwait(false);
        var shots = 0;
        foreach (var scene in script.Scenes)
        {
            if (scene.HasAttachedClip && StoryObjectKeys.Owns(run.Id, scene.VideoKey)) continue;
            for (var s = 0; s < scene.Shots.Count; s++)
            {
                ct.ThrowIfCancellationRequested();
                var shot = scene.Shots[s];
                if (await ExistsAsync(run, shot.ImageKey, ct).ConfigureAwait(false)) { shots++; continue; }

                shot.ImageKey = null;
                shot.ImageSource = null;
                if (!useEngine || string.IsNullOrWhiteSpace(shot.ImagePrompt)) continue;

                var made = await GenerateAsync(run, shot.ImagePrompt, StoryObjectKeys.ShotImage(run.Id, scene.Number, s + 2, ".png"),
                    width, height, Seed(run.Id, (s + 2) * 1000 + scene.Number), ct).ConfigureAwait(false);
                if (made.Key is not null)
                {
                    shot.ImageKey = made.Key;
                    shot.ImageSource = made.Provider;
                    shot.ImageName = $"Scene {scene.Number}, picture {s + 2}";
                    shots++;
                    await context.Save().ConfigureAwait(false);
                }
                Settle(made.Result);
            }
        }

        // The thumbnail is always wide: it is what YouTube shows in its lists, whatever the video's shape.
        var thumbnail = await ExistsAsync(run, script.ThumbnailKey, ct).ConfigureAwait(false);
        if (!thumbnail && useEngine && !string.IsNullOrWhiteSpace(script.ThumbnailPrompt))
        {
            var made = await GenerateAsync(run, script.ThumbnailPrompt, StoryObjectKeys.Thumbnail(run.Id, ".png"),
                1344, 768, Seed(run.Id, 0), ct).ConfigureAwait(false);
            if (made.Key is not null)
            {
                script.ThumbnailKey = made.Key;
                script.ThumbnailSource = made.Provider;
                script.ThumbnailName = "Thumbnail";
                thumbnail = true;
                await context.Save().ConfigureAwait(false);
            }
            Settle(made.Result);
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
        if (shots > 0) parts.Add($"{shots} more within scenes");
        if (thumbnail) parts.Add("a thumbnail");
        return StoryStageOutcome.Completed($"Pictures ready: {string.Join(", ", parts)}.");

        // Whether the picture was made; an engine that is off, or keeps failing, is not asked again for this run.
        bool Settle(Generated result)
        {
            switch (result)
            {
                case Generated.Yes:
                    failedInARow = 0;
                    return true;
                case Generated.Unavailable:
                    useEngine = false;
                    break;
                case Generated.Failed when ++failedInARow >= GiveUpAfter:
                    useEngine = false;
                    StoryRunWarnings.Add(run, "The image engine kept failing, so the remaining pictures were not drawn.");
                    break;
            }
            return false;
        }
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

    /// <summary>True when <paramref name="key"/> is one of the run's files and is still stored.</summary>
    private async Task<bool> ExistsAsync(StoryRun run, string? key, CancellationToken ct)
    {
        if (!StoryObjectKeys.Owns(run.Id, key)) return false;
        await using var existing = await store.OpenAsync(key!, ct).ConfigureAwait(false);
        return existing is not null;
    }

    /// <summary>
    /// Asks the image engine for a picture and stores it under <paramref name="key"/>, its extension changed to the kind
    /// of picture that came back. The stored key and the engine are returned when it worked.
    /// </summary>
    private async Task<(Generated Result, string? Key, string? Provider)> GenerateAsync(
        StoryRun run, string prompt, string key, int width, int height, long seed, CancellationToken ct)
    {
        var style = StoryAnimation.PictureStyle(run, DefaultStyle);
        var outcome = await ai.ImageAsync(new AiImageRequest
        {
            Prompt = $"{prompt.TrimEnd('.', ' ')}, {style}",
            Width = width,
            Height = height,
            Seed = seed
        }, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

        if (outcome.Kind == AiOutcomeKind.Unavailable) return (Generated.Unavailable, null, null);
        if (!outcome.IsSuccess)
        {
            logger.LogWarning("Story run {RunId}: the image engine failed: {Code}", run.Id, outcome.ErrorCode);
            return (Generated.Failed, null, null);
        }

        var image = outcome.Value!;
        var mime = AiImageValidator.Sniff(image.Content);
        if (mime is null || image.Content.Length > MaxImageBytes)
        {
            logger.LogWarning("Story run {RunId}: the image engine's picture was unusable.", run.Id);
            return (Generated.Failed, null, null);
        }

        key = Path.ChangeExtension(key, StoryBundleBuilder.ImageExtension(mime));
        await using (var content = new MemoryStream(image.Content, writable: false))
            await store.SaveAsync(key, content, mime, ct).ConfigureAwait(false);

        return (Generated.Yes, key, image.Provenance.ProviderId);
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
