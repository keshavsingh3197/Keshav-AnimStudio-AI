using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Gives every scene a picture: the one the person attached (or picked from Studio storage), else one from the image
/// engine if one is turned on (processed in batches for multi-scene stories, falling back to a configured Gemini image
/// key when no standalone image chain is active), else a plain glowing background. Then the scenes' further pictures and
/// the thumbnail.
/// </summary>
public sealed class VisualsStage(
    IAiExecutor ai,
    IObjectStore store,
    ILogger<VisualsStage> logger,
    IAiProviderRegistry? registry = null,
    IAssetRepository? assets = null,
    IAiUsageRepository? usage = null,
    TimeProvider? clock = null,
    AnimStudio.Application.Abstractions.Rendering.IProceduralSceneIllustrationRenderer? proceduralRenderer = null) : IStoryStage
{
    /// <summary>Pictures larger than this are not kept; a generated one this large is a provider misbehaving.</summary>
    public const int MaxImageBytes = 10 * 1024 * 1024;

    public const string DefaultStyle = "classical Indian devotional painting, rich jewel colors, warm golden light, no text, no watermark";

    /// <summary>After this many generated pictures in a row failed, the engine is not asked again for this run.</summary>
    private const int GiveUpAfter = 3;

    /// <summary>Scenes processed per visual batch so long multi-scene stories save progress reliably.</summary>
    private const int BatchSize = 3;

    public string Id => StoryStageIds.Visuals;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to make pictures for.");
        var vertical = run.Brief.Format == StoryFormat.Vertical;
        var (width, height) = vertical ? (768, 1344) : (1344, 768);

        var useEngine = run.Options.Visuals == StoryVisualMode.Auto;
        var storagePool = await LoadStoragePoolAsync(run, ct).ConfigureAwait(false);
        var geminiFallbackAvailable = true;
        var failedInARow = 0;
        int attached = 0, generated = 0, plain = 0, clips = 0;
        var storageCursor = 0;

        var totalScenes = script.Scenes.Count;
        var totalBatches = Math.Max(1, (totalScenes + BatchSize - 1) / BatchSize);

        for (var i = 0; i < totalScenes; i++)
        {
            ct.ThrowIfCancellationRequested();
            var scene = script.Scenes[i];
            var batchNumber = (i / BatchSize) + 1;
            await context.Report(
                i * 100 / totalScenes,
                totalBatches > 1
                    ? $"Batch {batchNumber}/{totalBatches}: Picture {i + 1} of {totalScenes}"
                    : $"Picture {i + 1} of {totalScenes}").ConfigureAwait(false);

            if (await HasPictureAsync(run, scene, ct).ConfigureAwait(false))
            {
                if (scene.ImageSource is "upload" or "storage") attached++;
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

            // When specific Studio storage images were chosen:
            // - UploadsOnly strictly cycles them across every scene so all scenes show curated artwork.
            // - Auto consumes each chosen storage image once for the opening scenes, then generates fresh AI scenes for the rest.
            var shouldUsePoolFirst = storagePool.Count > 0 &&
                (run.Options.Visuals == StoryVisualMode.UploadsOnly || storageCursor < storagePool.Count);
            if (shouldUsePoolFirst)
            {
                var pick = storagePool[storageCursor % storagePool.Count];
                storageCursor++;
                if (await CopyStorageToSceneAsync(run, scene, pick, ct).ConfigureAwait(false))
                {
                    attached++;
                    await context.Save().ConfigureAwait(false);
                    continue;
                }
            }

            if (useEngine && !string.IsNullOrWhiteSpace(scene.ImagePrompt))
            {
                var (result, key, provider, fallbackAlive) = await GenerateAsync(
                    run, scene.ImagePrompt, StoryObjectKeys.Image(run.Id, scene.Number, ".png"),
                    width, height, Seed(run.Id, scene.Number), geminiFallbackAvailable, ct).ConfigureAwait(false);
                geminiFallbackAvailable = fallbackAlive;

                if (key is not null)
                {
                    scene.ImageKey = key;
                    scene.ImageSource = provider;
                    scene.ImageName = $"Scene {scene.Number}";
                }
                if (Settle(result))
                {
                    generated++;
                    await context.Save().ConfigureAwait(false);
                    continue;
                }
            }

            if (storagePool.Count > 0)
            {
                var fallbackPick = storagePool[storageCursor % storagePool.Count];
                storageCursor++;
                if (await CopyStorageToSceneAsync(run, scene, fallbackPick, ct).ConfigureAwait(false))
                {
                    attached++;
                    await context.Save().ConfigureAwait(false);
                    continue;
                }
            }

            await KeepPlainAsync(run, scene, vertical, ct).ConfigureAwait(false);
            if (string.Equals(scene.ImageSource, "procedural-3d", StringComparison.Ordinal))
                generated++;
            else
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

                if (run.Options.Visuals == StoryVisualMode.UploadsOnly && storagePool.Count > script.Scenes.Count)
                {
                    var shotPick = storagePool[storageCursor % storagePool.Count];
                    storageCursor++;
                    if (await CopyStorageToShotAsync(run, scene, s, shot, shotPick, ct).ConfigureAwait(false))
                    {
                        shots++;
                        await context.Save().ConfigureAwait(false);
                        continue;
                    }
                }

                if (!useEngine || string.IsNullOrWhiteSpace(shot.ImagePrompt)) continue;

                var (result, key, provider, fallbackAlive) = await GenerateAsync(
                    run, shot.ImagePrompt, StoryObjectKeys.ShotImage(run.Id, scene.Number, s + 2, ".png"),
                    width, height, Seed(run.Id, (s + 2) * 1000 + scene.Number), geminiFallbackAvailable, ct).ConfigureAwait(false);
                geminiFallbackAvailable = fallbackAlive;

                if (key is not null)
                {
                    shot.ImageKey = key;
                    shot.ImageSource = provider;
                    shot.ImageName = $"Scene {scene.Number}, picture {s + 2}";
                    shots++;
                    await context.Save().ConfigureAwait(false);
                }
                Settle(result);
            }
        }

        // The thumbnail is always wide: it is what YouTube shows in its lists, whatever the video's shape.
        var thumbnail = await ExistsAsync(run, script.ThumbnailKey, ct).ConfigureAwait(false);
        if (!thumbnail && useEngine && !string.IsNullOrWhiteSpace(script.ThumbnailPrompt))
        {
            var (result, key, provider, _) = await GenerateAsync(
                run, script.ThumbnailPrompt, StoryObjectKeys.Thumbnail(run.Id, ".png"),
                1344, 768, Seed(run.Id, 0), geminiFallbackAvailable, ct).ConfigureAwait(false);
            if (key is not null)
            {
                script.ThumbnailKey = key;
                script.ThumbnailSource = provider;
                script.ThumbnailName = "Thumbnail";
                thumbnail = true;
                await context.Save().ConfigureAwait(false);
            }
            Settle(result);
        }
        else if (!thumbnail && storagePool.Count > 0)
        {
            if (await CopyStorageToThumbnailAsync(run, script, storagePool[0], ct).ConfigureAwait(false))
            {
                thumbnail = true;
                await context.Save().ConfigureAwait(false);
            }
        }
        if (!thumbnail && proceduralRenderer is not null)
        {
            var thumbBytes = await proceduralRenderer.RenderSceneIllustrationAsync(
                script.ThumbnailPrompt ?? script.Summary,
                script.Title,
                run.Genre?.Name,
                run.Genre?.Category ?? run.Brief.GenreId,
                eventType: run.Brief.GenreId,
                vertical: false,
                width: 1280,
                height: 720,
                seed: (int)Seed(run.Id, 0),
                ct).ConfigureAwait(false);
            if (thumbBytes is { Length: > 0 })
            {
                var thumbKey = StoryObjectKeys.Thumbnail(run.Id, ".png");
                await using (var ms = new MemoryStream(thumbBytes, writable: false))
                    await store.SaveAsync(thumbKey, ms, AiImageValidator.Png, ct).ConfigureAwait(false);
                script.ThumbnailKey = thumbKey;
                script.ThumbnailSource = "procedural-3d";
                script.ThumbnailName = "Thumbnail (3D Illustrated)";
                thumbnail = true;
                await context.Save().ConfigureAwait(false);
            }
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
    /// Asks the image engine for a picture (or falls back to a configured Gemini image-capable key when no standalone
    /// image provider is active) and stores it under <paramref name="key"/>, its extension changed to the kind of
    /// picture that came back.
    /// </summary>
    private async Task<(Generated Result, string? Key, string? Provider, bool FallbackAlive)> GenerateAsync(
        StoryRun run, string prompt, string key, int width, int height, long seed,
        bool geminiFallbackAvailable, CancellationToken ct)
    {
        var style = StoryAnimation.PictureStyle(run, DefaultStyle);
        var request = new AiImageRequest
        {
            Prompt = $"{prompt.TrimEnd('.', ' ')}, {style}",
            Width = width,
            Height = height,
            Seed = seed
        };

        var outcome = await ai.ImageAsync(request, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

        if (outcome.Kind == AiOutcomeKind.Unavailable)
        {
            if (geminiFallbackAvailable)
            {
                var gemini = registry?.SpeechChain().OfType<IGeminiImageGeneratingProvider>().FirstOrDefault(p => p.IsConfigured);
                if (gemini is not null)
                    return await GenerateViaGeminiFallbackAsync(run, gemini, request, key, ct).ConfigureAwait(false);
            }
            return (Generated.Unavailable, null, null, geminiFallbackAvailable);
        }

        if (!outcome.IsSuccess)
        {
            logger.LogWarning("Story run {RunId}: the image engine failed: {Code}", run.Id, outcome.ErrorCode);
            return (Generated.Failed, null, null, geminiFallbackAvailable);
        }

        return await SaveGeneratedImageAsync(run.Id, key, outcome.Value!, geminiFallbackAvailable, ct).ConfigureAwait(false);
    }

    private async Task<(Generated Result, string? Key, string? Provider, bool FallbackAlive)> GenerateViaGeminiFallbackAsync(
        StoryRun run, IGeminiImageGeneratingProvider gemini, AiImageRequest request, string key, CancellationToken ct)
    {
        try
        {
            var image = await gemini.GenerateSceneImageAsync(request, null, ct).ConfigureAwait(false);
            await RecordGeminiUsageAsync(run, gemini, image.Provenance.Model, AiCallOutcome.Succeeded, null, ct).ConfigureAwait(false);
            return await SaveGeneratedImageAsync(run.Id, key, image, fallbackAlive: true, ct).ConfigureAwait(false);
        }
        catch (AiProviderException ex)
        {
            await RecordGeminiUsageAsync(run, gemini, null, AiCallOutcome.Failed, ex.Code, ct).ConfigureAwait(false);
            logger.LogWarning("Story run {RunId}: Gemini scene illustration fallback failed: {Code}", run.Id, ex.Code);
            var hardStop = ex.Code is "rate-limited" or "credential-rejected" or "credential-missing" or "quota-exhausted";
            return (hardStop ? Generated.Unavailable : Generated.Failed, null, null, !hardStop);
        }
    }

    private async Task<(Generated Result, string? Key, string? Provider, bool FallbackAlive)> SaveGeneratedImageAsync(
        string runId, string key, AiImageResult image, bool fallbackAlive, CancellationToken ct)
    {
        var mime = AiImageValidator.Sniff(image.Content);
        if (mime is null || image.Content.Length > MaxImageBytes)
        {
            logger.LogWarning("Story run {RunId}: the image engine's picture was unusable.", runId);
            return (Generated.Failed, null, null, fallbackAlive);
        }

        key = Path.ChangeExtension(key, StoryBundleBuilder.ImageExtension(mime));
        await using (var content = new MemoryStream(image.Content, writable: false))
            await store.SaveAsync(key, content, mime, ct).ConfigureAwait(false);

        return (Generated.Yes, key, image.Provenance.ProviderId, fallbackAlive);
    }

    private async Task RecordGeminiUsageAsync(
        StoryRun run, IGeminiImageGeneratingProvider provider, string? model, AiCallOutcome outcome, string? code, CancellationToken ct)
    {
        if (usage is null) return;
        try
        {
            var now = (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime;
            await usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = provider.Id.Value,
                Capability = AiCapability.Image,
                Model = model ?? "gemini-2.5-flash-image",
                UserId = run.UserId,
                DayBucket = AiUsageRecord.BucketFor(now),
                Units = 1,
                Outcome = outcome,
                ErrorCode = code,
                CreatedAt = now
            }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Story run {RunId}: image fallback usage could not be recorded: {ErrorType}", run.Id, ex.GetType().Name);
        }
    }

    private async Task<List<Asset>> LoadStoragePoolAsync(StoryRun run, CancellationToken ct)
    {
        if (assets is null || run.Options.StorageAssetIds.Count == 0) return [];
        var fetched = await assets.GetManyAsync(run.Options.StorageAssetIds, ct).ConfigureAwait(false);
        if (fetched.Count == 0) return [];

        var byId = fetched.Where(a => a.Kind == AssetKind.Image && !string.IsNullOrWhiteSpace(a.StorageKey))
            .ToDictionary(a => a.Id, StringComparer.Ordinal);
        var ordered = new List<Asset>(run.Options.StorageAssetIds.Count);
        foreach (var id in run.Options.StorageAssetIds)
        {
            if (byId.TryGetValue(id, out var asset)) ordered.Add(asset);
        }
        return ordered;
    }

    private async Task<bool> CopyStorageToSceneAsync(StoryRun run, StoryScene scene, Asset asset, CancellationToken ct)
    {
        var key = await CopyStorageAssetToKeyAsync(asset, StoryObjectKeys.Image(run.Id, scene.Number, ".png"), ct).ConfigureAwait(false);
        if (key is null) return false;
        scene.ImageKey = key;
        scene.ImageSource = "storage";
        scene.ImageName = string.IsNullOrWhiteSpace(asset.Name) ? $"Scene {scene.Number}" : asset.Name;
        return true;
    }

    private async Task<bool> CopyStorageToShotAsync(StoryRun run, StoryScene scene, int shotIndex, StoryShot shot, Asset asset, CancellationToken ct)
    {
        var key = await CopyStorageAssetToKeyAsync(asset, StoryObjectKeys.ShotImage(run.Id, scene.Number, shotIndex + 2, ".png"), ct).ConfigureAwait(false);
        if (key is null) return false;
        shot.ImageKey = key;
        shot.ImageSource = "storage";
        shot.ImageName = string.IsNullOrWhiteSpace(asset.Name) ? $"Scene {scene.Number}, picture {shotIndex + 2}" : asset.Name;
        return true;
    }

    private async Task<bool> CopyStorageToThumbnailAsync(StoryRun run, StoryScript script, Asset asset, CancellationToken ct)
    {
        var key = await CopyStorageAssetToKeyAsync(asset, StoryObjectKeys.Thumbnail(run.Id, ".png"), ct).ConfigureAwait(false);
        if (key is null) return false;
        script.ThumbnailKey = key;
        script.ThumbnailSource = "storage";
        script.ThumbnailName = string.IsNullOrWhiteSpace(asset.Name) ? "Thumbnail" : asset.Name;
        return true;
    }

    private async Task<string?> CopyStorageAssetToKeyAsync(Asset asset, string targetKey, CancellationToken ct)
    {
        await using var stream = await store.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
        if (stream is null) return null;

        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
        var bytes = buffer.ToArray();
        var mime = AiImageValidator.Sniff(bytes);
        if (mime is null || bytes.Length > MaxImageBytes) return null;

        var finalKey = Path.ChangeExtension(targetKey, StoryBundleBuilder.ImageExtension(mime));
        await using var content = new MemoryStream(bytes, writable: false);
        await store.SaveAsync(finalKey, content, mime, ct).ConfigureAwait(false);
        return finalKey;
    }

    private async Task KeepPlainAsync(StoryRun run, StoryScene scene, bool vertical, CancellationToken ct)
    {
        var key = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
        if (proceduralRenderer is not null)
        {
            var (pw, ph) = vertical ? (720, 1280) : (1280, 720);
            var illustrated = await proceduralRenderer.RenderSceneIllustrationAsync(
                scene.ImagePrompt ?? scene.Narration,
                scene.Headline,
                scene.Mood,
                run.Genre?.Category ?? run.Brief.GenreId,
                eventType: run.Brief.GenreId,
                vertical: vertical,
                width: pw,
                height: ph,
                seed: (int)Seed(run.Id, scene.Number),
                ct).ConfigureAwait(false);
            if (illustrated is { Length: > 0 })
            {
                await using (var content = new MemoryStream(illustrated, writable: false))
                    await store.SaveAsync(key, content, AiImageValidator.Png, ct).ConfigureAwait(false);

                scene.ImageKey = key;
                scene.ImageSource = "procedural-3d";
                scene.ImageName = $"Scene {scene.Number} (3D Illustrated)";
                return;
            }
        }

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
