using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// The background picture of an Enhanced 3D video: a ready prompt to make it in any image tool, or the picture made
/// here by the configured image engine and saved to the user's Background Templates project.
/// </summary>
public sealed partial class EcosystemAutomationService
{
    private const int MaxBackgroundPictureBytes = 25 * 1024 * 1024;
    private static readonly TimeSpan BackgroundPictureBudget = TimeSpan.FromSeconds(150);

    /// <summary>The picture prompt for a post, using the wizard's unsaved stage when given.</summary>
    public async Task<AutomationBackgroundPrompt> GetBackgroundPromptAsync(
        string userId, string postId, AutomationStageSettings? draftStage, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        return AutomationBackgroundPromptBuilder.Build(post, DraftOrSavedStage(post, draftStage));
    }

    /// <summary>
    /// Makes a background picture with the image engine (the user's edited prompt, else the built one), saves it to the
    /// Background Templates project and returns its asset id. Nothing on the post changes: the wizard selects the
    /// picture and saves the stage as usual.
    /// </summary>
    public async Task<AutomationGeneratedBackground> GenerateBackgroundPictureAsync(
        string userId, string postId, AutomationBackgroundPictureRequest? request, CancellationToken ct)
    {
        if (assets is null)
            throw EditingException.Conflict("storage-unavailable", "Studio Storage is not available, so a picture cannot be saved.");

        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        var built = AutomationBackgroundPromptBuilder.Build(post, DraftOrSavedStage(post, request?.Stage));
        var prompt = AutomationBackgroundPromptBuilder.CleanPrompt(request?.Prompt) ?? built.Prompt;
        var (width, height) = AutomationBackgroundPromptBuilder.EngineSize(post.Format);
        var imageRequest = new AiImageRequest
        {
            Prompt = prompt,
            NegativePrompt = built.NegativePrompt,
            Width = width,
            Height = height,
            // "Generate again" must give a new picture, not the cached one.
            Seed = Random.Shared.NextInt64(1, int.MaxValue),
            BypassCache = true
        };

        using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budget.CancelAfter(BackgroundPictureBudget);
        AiImageResult image;
        try
        {
            image = await MakeBackgroundPictureAsync(userId, imageRequest, budget.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw EditingException.Conflict("image-timeout",
                "The image engine took too long. Try again, or copy the prompt into Gemini or ChatGPT and upload the picture.");
        }

        // The engine's bytes are untrusted: only a real PNG, JPEG or WebP of a sane size is stored.
        var mime = AiImageValidator.Sniff(image.Content);
        if (mime is null || image.Content.Length > MaxBackgroundPictureBytes)
        {
            logger.LogWarning("Background picture for post {PostId} from {Provider} was not a usable image.", post.Id, image.Provenance.ProviderId);
            throw EditingException.Conflict("image-unusable",
                "The image engine returned something that is not a usable picture. Try again.");
        }

        var projectId = await EnsureBackgroundTemplateProjectAsync(userId, ct).ConfigureAwait(false);
        var ext = mime switch
        {
            AiImageValidator.Png => ".png",
            AiImageValidator.Jpeg => ".jpg",
            _ => ".webp"
        };
        var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}{ext}";
        await using (var content = new MemoryStream(image.Content, writable: false))
            await objectStore.SaveAsync(storageKey, content, mime, ct).ConfigureAwait(false);

        var name = $"AI background {post.DateKey} {post.Format}{ext}";
        var asset = new Asset
        {
            ProjectId = projectId,
            Name = name,
            DisplayFileName = name,
            StorageKey = storageKey,
            Kind = AssetKind.Image,
            MimeType = mime,
            FileSizeBytes = image.Content.Length,
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            Provenance = new AssetProvenance
            {
                SourceProvider = image.Provenance.ProviderId,
                AttributionText = "AI-generated background",
                FetchedAtUtc = UtcNow,
                FetchedByUserId = userId
            },
            CreatedAt = UtcNow
        };
        try
        {
            await assets.InsertAsync(asset, ct).ConfigureAwait(false);
        }
        catch
        {
            // No asset row points at the file, so it would never be cleaned up otherwise.
            try { await objectStore.DeleteAsync(storageKey, CancellationToken.None).ConfigureAwait(false); }
            catch (Exception cleanupEx) { logger.LogWarning(cleanupEx, "Could not remove orphaned background picture {Key}.", storageKey); }
            throw;
        }

        logger.LogInformation("Generated background picture {AssetId} for automation post {PostId} with {Provider}.",
            asset.Id, post.Id, image.Provenance.ProviderId);
        return new AutomationGeneratedBackground(asset.Id, image.Provenance.ProviderId, prompt);
    }

    private static AutomationStageSettings? DraftOrSavedStage(AutomationPost post, AutomationStageSettings? draft)
    {
        if (draft is null) return post.Stage;
        try
        {
            return AutomationStageScript.Normalize(draft);
        }
        catch (ArgumentException)
        {
            // Only the location and the character spots are read; a bad asset id in the draft does not matter here.
            return AutomationStageScript.Normalize(new AutomationStageSettings
            {
                LocationPrompt = draft.LocationPrompt,
                LeftCharacter = draft.LeftCharacter,
                RightCharacter = draft.RightCharacter
            });
        }
    }

    /// <summary>
    /// The configured image chain, then (like the story engine) Gemini's image model on the speech key when no image
    /// engine is set up. Throws a user-facing <see cref="EditingException"/> when neither can make the picture.
    /// </summary>
    private async Task<AiImageResult> MakeBackgroundPictureAsync(string userId, AiImageRequest request, CancellationToken ct)
    {
        var outcome = await ai.ImageAsync(request, new AiCallContext(null, userId), ct).ConfigureAwait(false);
        if (outcome.IsSuccess && outcome.Value is { Content.Length: > 0 } made) return made;

        if (outcome.Kind == AiOutcomeKind.Unavailable)
        {
            var gemini = aiRegistry?.SpeechChain().OfType<IGeminiImageGeneratingProvider>().FirstOrDefault(p => p.IsConfigured);
            if (gemini is not null)
            {
                try
                {
                    var image = await gemini.GenerateSceneImageAsync(request, null, ct).ConfigureAwait(false);
                    await RecordGeminiImageUsageAsync(userId, gemini, image.Provenance.Model, AiCallOutcome.Succeeded, null, ct).ConfigureAwait(false);
                    return image;
                }
                catch (AiProviderException ex)
                {
                    await RecordGeminiImageUsageAsync(userId, gemini, null, AiCallOutcome.Failed, ex.Code, ct).ConfigureAwait(false);
                    logger.LogWarning("Background picture: Gemini image fallback failed: {Code}", ex.Code);
                    throw EditingException.Conflict("image-generation-failed",
                        "Gemini could not make the picture right now. Try again later, or copy the prompt into Gemini or ChatGPT and upload the picture.");
                }
            }

            throw EditingException.Conflict("image-engine-unavailable",
                "No image engine is set up (or its daily quota is used up). Copy the prompt into Gemini or ChatGPT, then upload the picture here.");
        }

        logger.LogWarning("Background picture: the image engine failed: {Code}", outcome.ErrorCode);
        throw EditingException.Conflict("image-generation-failed",
            "The image engine could not make the picture right now. Try again, or copy the prompt into Gemini or ChatGPT and upload the picture.");
    }

    private async Task RecordGeminiImageUsageAsync(
        string userId, IGeminiImageGeneratingProvider provider, string? model, AiCallOutcome outcome, string? code, CancellationToken ct)
    {
        if (aiUsage is null) return;
        try
        {
            var now = UtcNow;
            await aiUsage.RecordAsync(new AiUsageRecord
            {
                ProviderId = provider.Id.Value,
                Capability = AiCapability.Image,
                Model = model ?? "gemini-2.5-flash-image",
                UserId = userId,
                DayBucket = AiUsageRecord.BucketFor(now),
                Units = 1,
                Outcome = outcome,
                ErrorCode = code,
                CreatedAt = now
            }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Background picture usage could not be recorded: {ErrorType}", ex.GetType().Name);
        }
    }
}
