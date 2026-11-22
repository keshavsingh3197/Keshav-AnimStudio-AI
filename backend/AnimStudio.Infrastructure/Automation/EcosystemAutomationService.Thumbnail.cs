using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Pre-schedule readiness helpers, custom/AI/frame thumbnail management, auto-fill of missing YouTube
/// metadata, and live synchronization into queued <see cref="PublishQueueItem"/> records.
/// </summary>
public sealed record RenderTemplateThumbnailDto(
    string? DateText = null,
    string? TitleText = null,
    string? SubtitleText = null,
    string? BackgroundAssetId = null,
    bool? ShowWatermark = null,
    string? WatermarkText = null,
    bool SaveAsDefaultBackground = false);

public sealed partial class EcosystemAutomationService
{
    private static readonly TimeSpan AiThumbnailBudget = TimeSpan.FromSeconds(150);

    public async Task<AutomationPost> RenderFixedTemplateThumbnailAsync(
        string userId,
        string postId,
        RenderTemplateThumbnailDto request,
        CancellationToken ct)
    {
        if (fixedThumbnailGenerator is null)
            throw EditingException.Conflict("thumbnail-generator-unavailable", "Fixed thumbnail generator is not available.");

        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);

        var bgAssetId = !string.IsNullOrWhiteSpace(request.BackgroundAssetId)
            ? request.BackgroundAssetId.Trim()
            : post.Stage?.BackgroundTemplateAssetId ?? settings.PanchangDefaultBackgroundAssetId;

        byte[]? bgBytes = null;
        if (!string.IsNullOrWhiteSpace(bgAssetId) && assets is not null && await IsOwnedImageAsync(userId, bgAssetId, ct).ConfigureAwait(false))
        {
            var found = await assets.GetManyAsync([bgAssetId], ct).ConfigureAwait(false);
            if (found.FirstOrDefault() is { StorageKey.Length: > 0 } asset)
            {
                await using var stream = await objectStore.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
                if (stream is not null)
                {
                    using var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
                    bgBytes = ms.ToArray();
                }
            }
        }

        if (request.SaveAsDefaultBackground && !string.IsNullOrWhiteSpace(bgAssetId))
        {
            settings.PanchangDefaultBackgroundAssetId = bgAssetId;
            await SaveWorkspaceConfigAsync(settings, userId, ct).ConfigureAwait(false);
        }

        var dateText = !string.IsNullOrWhiteSpace(request.DateText) ? request.DateText.Trim() : post.DateKey;
        var titleText = !string.IsNullOrWhiteSpace(request.TitleText)
            ? request.TitleText.Trim()
            : !string.IsNullOrWhiteSpace(settings.PanchangThumbnailTitleTemplate) && post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal
                ? settings.PanchangThumbnailTitleTemplate.Trim()
                : post.Title;
        var subtitleText = !string.IsNullOrWhiteSpace(request.SubtitleText)
            ? request.SubtitleText.Trim()
            : !string.IsNullOrWhiteSpace(settings.PanchangThumbnailSubtitleTemplate) && post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal
                ? settings.PanchangThumbnailSubtitleTemplate.Trim()
                : post.SourceSummary;

        var showWatermark = request.ShowWatermark
            ?? post.ShowWatermark
            ?? (post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal
                ? settings.PanchangShowWatermark
                : true);
        var watermarkText = showWatermark
            ? (!string.IsNullOrWhiteSpace(request.WatermarkText) ? request.WatermarkText.Trim() : post.TrackedFunnelUrls.FirstOrDefault()?.Label)
            : null;

        var isPortrait = post.Format == AutomationVideoFormat.Vertical;
        var (imgBytes, _) = await fixedThumbnailGenerator.RenderAsync(
            new ProceduralFixedThumbnailGenerator.FixedThumbnailSpec(
                DateText: dateText,
                TitleText: titleText,
                SubtitleText: subtitleText,
                EventType: post.SourceType.ToString(),
                BackgroundImageBytes: bgBytes,
                ShowWatermark: showWatermark,
                WatermarkText: watermarkText,
                Width: isPortrait ? 720 : post.Format == AutomationVideoFormat.CommunityPost ? 1080 : 1280,
                Height: isPortrait ? 1280 : post.Format == AutomationVideoFormat.CommunityPost ? 1080 : 720),
            ct).ConfigureAwait(false);

        var sourceLabel = showWatermark ? "Fixed Template" : "Fixed Template (No Watermark)";
        await SaveCustomThumbnailBytesAsync(post, imgBytes, sourceLabel, ct).ConfigureAwait(false);
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<(byte[] Bytes, string ContentType)?> GetPostThumbnailBytesAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (!string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
        {
            await using var stream = await objectStore.OpenAsync(post.ThumbnailStorageKey, ct).ConfigureAwait(false);
            if (stream is not null)
            {
                using var ms = new MemoryStream();
                await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
                var bytes = ms.ToArray();
                var mime = YouTubeThumbnailRules.IsPng(bytes)
                    ? "image/png"
                    : YouTubeThumbnailRules.IsJpeg(bytes)
                        ? "image/jpeg"
                        : AiImageValidator.Sniff(bytes) ?? "image/jpeg";
                return (bytes, mime);
            }
        }

        if (post.ThumbnailFrameAtSeconds is { } frameAt
            && !string.IsNullOrWhiteSpace(post.AttachedRenderJobId)
            && thumbnailService is not null)
        {
            var job = await renderJobs.GetAsync(post.AttachedRenderJobId, ct).ConfigureAwait(false);
            if (job is not null
                && string.Equals(job.UserId, userId, StringComparison.Ordinal)
                && job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings
                && !string.IsNullOrWhiteSpace(job.OutputStorageKey))
            {
                try
                {
                    var localPath = await RenderPreviewFile.EnsureAsync(objectStore, dataPaths, job, ct).ConfigureAwait(false);
                    var clamped = YouTubeThumbnailRules.ClampFrame(frameAt, job.Diagnostics?.OutputDurationSeconds);
                    var frameBytes = await thumbnailService.FrameAsync(localPath, clamped, 640, ct).ConfigureAwait(false);
                    return (frameBytes, "image/jpeg");
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Could not preview frame thumbnail for automation post {PostId}", post.Id);
                }
            }
        }

        return null;
    }

    public async Task<AutomationPost> SetPostThumbnailAsync(
        string userId,
        string postId,
        string? imageBase64,
        double? frameAtSeconds,
        string? storageAssetId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);

        if (!string.IsNullOrWhiteSpace(storageAssetId))
        {
            if (assets is null)
                throw EditingException.Conflict("storage-unavailable", "Studio Storage is not available right now.");

            var trimmedAssetId = storageAssetId.Trim();
            if (!await IsOwnedImageAsync(userId, trimmedAssetId, ct).ConfigureAwait(false))
                throw EditingException.Invalid("thumbnail-asset-not-found", "Selected storage image was not found in your projects.");

            var found = await assets.GetManyAsync([trimmedAssetId], ct).ConfigureAwait(false);
            var asset = found.FirstOrDefault(a => string.Equals(a.Id, trimmedAssetId, StringComparison.Ordinal))
                ?? throw EditingException.Invalid("thumbnail-asset-not-found", "Selected storage image was not found.");

            await using var assetStream = await objectStore.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false)
                ?? throw EditingException.Invalid("thumbnail-asset-missing", "That image file is no longer in Studio Storage.");

            using var ms = new MemoryStream();
            await assetStream.CopyToAsync(ms, ct).ConfigureAwait(false);
            var rawBytes = ms.ToArray();
            await SaveCustomThumbnailBytesAsync(post, rawBytes, $"Storage Image ({asset.Name})", ct).ConfigureAwait(false);
        }
        else if (!string.IsNullOrWhiteSpace(imageBase64))
        {
            var (_, _, image, error) = YouTubeThumbnailRules.Check(new YouTubeThumbnailChoice(null, imageBase64), null);
            if (error is not null || image is null)
                throw EditingException.Invalid(error?.Code ?? "thumbnail-invalid", error?.Message ?? "Thumbnail image is not valid.");

            await SaveCustomThumbnailBytesAsync(post, image, "Uploaded Image", ct).ConfigureAwait(false);
        }
        else if (frameAtSeconds is { } frameAt)
        {
            var job = !string.IsNullOrWhiteSpace(post.AttachedRenderJobId)
                ? await renderJobs.GetAsync(post.AttachedRenderJobId, ct).ConfigureAwait(false)
                : null;
            if (job is null && string.IsNullOrWhiteSpace(post.AttachedHandoffId))
                throw EditingException.Invalid("video-not-attached", "Attach or generate a video before choosing a thumbnail frame.");

            var (_, clamped, _, error) = YouTubeThumbnailRules.Check(
                new YouTubeThumbnailChoice(frameAt, null),
                job?.Diagnostics?.OutputDurationSeconds);
            if (error is not null)
                throw EditingException.Invalid(error.Code, error.Message);

            await DeleteThumbnailObjectAsync(post, ct).ConfigureAwait(false);
            post.ThumbnailFrameAtSeconds = clamped;
            post.ThumbnailSource = $"Video Frame ({clamped:0.#}s)";
        }
        else
        {
            throw EditingException.Invalid("thumbnail-empty", "Upload an image, choose a storage picture, or pick a video frame time.");
        }

        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> GenerateAiPostThumbnailAsync(
        string userId,
        string postId,
        string? customPrompt,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);

        // When no distinct custom prompt override was given and a 3D animated render is attached (especially Comedy),
        // generate a sharp 3D scene composite thumbnail directly from the animation frames first.
        var isDefaultPostPrompt = string.IsNullOrWhiteSpace(customPrompt)
            || string.Equals(customPrompt.Trim(), post.AiThumbnailPrompt?.Trim(), StringComparison.Ordinal);
        if (isDefaultPostPrompt
            && !string.IsNullOrWhiteSpace(post.AttachedRenderJobId)
            && post.SourceType == AutomationSourceType.FunnyComedy
            && await TryGenerateAndSaveSceneThumbnailAsync(post, ct).ConfigureAwait(false))
        {
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
            return post;
        }

        var prompt = !string.IsNullOrWhiteSpace(customPrompt)
            ? customPrompt.Trim()
            : !string.IsNullOrWhiteSpace(post.AiThumbnailPrompt)
                ? post.AiThumbnailPrompt.Trim()
                : BuildDefaultThumbnailPrompt(post);

        if (prompt.Length > 1500)
            prompt = prompt[..1500].TrimEnd();

        post.AiThumbnailPrompt = prompt;
        var (width, height) = AutomationBackgroundPromptBuilder.EngineSize(post.Format);
        var imageRequest = new AiImageRequest
        {
            Prompt = $"{prompt}, eye-catching YouTube video thumbnail composition, vivid high-contrast studio lighting, expressive focal subject, no text, no letters, no watermarks",
            NegativePrompt = "text, watermark, signature, blurry, low contrast, muddy colors, deformed anatomy",
            Width = width,
            Height = height,
            Seed = Random.Shared.NextInt64(1, int.MaxValue),
            BypassCache = true
        };

        using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budget.CancelAfter(AiThumbnailBudget);
        AiImageResult generated;
        try
        {
            generated = await MakeBackgroundPictureAsync(userId, imageRequest, budget.Token).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            if (!string.IsNullOrWhiteSpace(post.AttachedRenderJobId)
                && await TryGenerateAndSaveSceneThumbnailAsync(post, ct).ConfigureAwait(false))
            {
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
                return post;
            }
            if (ex is OperationCanceledException)
            {
                throw EditingException.Conflict("thumbnail-ai-timeout",
                    "Thumbnail generation took too long. Try again, or upload a thumbnail image.");
            }
            throw;
        }

        await SaveCustomThumbnailBytesAsync(post, generated.Content, $"AI Generated ({generated.Provenance.ProviderId})", ct)
            .ConfigureAwait(false);
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> DeletePostThumbnailAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);

        await DeleteThumbnailObjectAsync(post, ct).ConfigureAwait(false);
        post.ThumbnailFrameAtSeconds = null;
        post.ThumbnailSource = null;
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> AutoFillMissingDetailsAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);

        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(post.Title))
        {
            post.Title = !string.IsNullOrWhiteSpace(post.SourceTitle)
                ? post.SourceTitle.Trim()
                : $"{post.RuleName} ({post.DateKey})";
        }
        if (post.Title.Length > YouTubePublishValidator.MaxTitleLength)
        {
            post.Title = TrimToWordBoundary(post.Title, YouTubePublishValidator.MaxTitleLength);
        }

        if (string.IsNullOrWhiteSpace(post.CategoryId)
            || !YouTubePublishValidator.Categories.ContainsKey(post.CategoryId)
            || (post.SourceType == AutomationSourceType.FunnyComedy && post.CategoryId == "22"))
        {
            post.CategoryId = DefaultCategoryFor(post.SourceType, rule?.CategoryId);
        }

        if (string.IsNullOrWhiteSpace(post.Privacy)
            || !YouTubePublishValidator.Privacies.Contains(post.Privacy, StringComparer.OrdinalIgnoreCase))
        {
            post.Privacy = "public";
        }
        else
        {
            post.Privacy = post.Privacy.ToLowerInvariant();
        }

        if (string.IsNullOrWhiteSpace(post.AiThumbnailPrompt))
        {
            post.AiThumbnailPrompt = BuildDefaultThumbnailPrompt(post);
        }

        if (post.Tags.Count < 3)
        {
            post.Tags = BuildAutoFillTags(post);
        }

        if (string.IsNullOrWhiteSpace(post.Description) || post.Description.Trim().Length < 40)
        {
            post.Description = BuildAutoFillDescription(post, rule);
        }

        if (string.IsNullOrWhiteSpace(post.PinnedComment))
        {
            var destUrl = post.PrimaryDestinationUrl ?? post.TrackedFunnelUrls.FirstOrDefault()?.TrackedUrl;
            if (!string.IsNullOrWhiteSpace(destUrl))
            {
                post.PinnedComment = post.Language == "hi"
                    ? $"पूरा विवरण और आज का अपडेट यहाँ देखें: {destUrl}\nआपको यह वीडियो कैसा लगा? कमेंट में बताएं!"
                    : $"Explore more details here: {destUrl}\nWhat did you think of this video? Tell us in the comments!";
            }
        }

        if (string.IsNullOrWhiteSpace(post.TargetChannelId))
        {
            if (!string.IsNullOrWhiteSpace(rule?.TargetChannelId))
            {
                await TryAssignChannelAsync(userId, post, rule.TargetChannelId, ct).ConfigureAwait(false);
            }
            else
            {
                var userChannels = await connections.ListAsync(userId, ct).ConfigureAwait(false);
                if (userChannels.Count == 1)
                    await TryAssignChannelAsync(userId, post, userChannels[0].ChannelId, ct).ConfigureAwait(false);
            }
        }

        if (!AutomationPublishAdvisor.IsDateBound(post.SourceType)
            && !string.IsNullOrWhiteSpace(post.TargetChannelId))
        {
            var tzId = !string.IsNullOrWhiteSpace(rule?.TimeZoneId) ? rule.TimeZoneId : settings.DefaultTimeZone;
            var advice = await GetPublishAdviceAsync(userId, post.SourceType, post.Format, post.TargetChannelId, tzId, ct)
                .ConfigureAwait(false);
            if (advice.RecommendedAtUtc > UtcNow + PublishQueueRules.MinYouTubeReleaseLead
                && (post.ScheduledAtUtc is null || post.ScheduledAtUtc <= UtcNow + PublishQueueRules.MinYouTubeReleaseLead || post.ScheduledAtUtc.Value.Date < advice.RecommendedAtUtc.Date))
            {
                post.ScheduledAtUtc = advice.RecommendedAtUtc;
            }
        }
        else if (post.ScheduledAtUtc is null && rule is not null)
        {
            var tz = !string.IsNullOrWhiteSpace(rule.TimeZoneId) ? rule.TimeZoneId : settings.DefaultTimeZone;
            var timeStr = !string.IsNullOrWhiteSpace(rule.PreferredPublishTime) ? rule.PreferredPublishTime : "07:00";
            post.ScheduledAtUtc = ComputeScheduledUtc(post.DateKey, timeStr, tz);
        }

        if (string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
        {
            var generatedSceneThumb = await TryGenerateAndSaveSceneThumbnailAsync(post, ct).ConfigureAwait(false);
            if (!generatedSceneThumb && post.ThumbnailFrameAtSeconds is null && !string.IsNullOrWhiteSpace(post.AttachedRenderJobId))
            {
                var job = await renderJobs.GetAsync(post.AttachedRenderJobId, ct).ConfigureAwait(false);
                if (job is { Status: RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings }
                    && !string.IsNullOrWhiteSpace(job.OutputStorageKey))
                {
                    var dur = job.Diagnostics?.OutputDurationSeconds;
                    var pickedFrame = Math.Round(Math.Clamp((dur ?? 10.0) * 0.25, 0.8, 5.0), 1);
                    post.ThumbnailFrameAtSeconds = YouTubeThumbnailRules.ClampFrame(pickedFrame, dur);
                    post.ThumbnailSource = $"Auto Video Frame ({post.ThumbnailFrameAtSeconds:0.#}s)";
                }
            }
        }

        // Enforce all YouTube & AdSense policy rules automatically (title <= 100, clean description, <= 8 hashtags, <= 500-char tags)
        var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: post.Title,
            rawDescription: post.Description,
            rawTags: post.Tags,
            rawPinnedComment: post.PinnedComment,
            fallbackTopicTitle: post.SourceTitle,
            primaryDestinationUrl: post.PrimaryDestinationUrl ?? post.TrackedFunnelUrls.FirstOrDefault()?.TrackedUrl,
            requestedMadeForKids: false,
            isShort: post.Format == AutomationVideoFormat.Vertical,
            language: post.Language);
        post.Title = sanitized.Title;
        post.Description = sanitized.Description;
        post.Tags = [.. sanitized.Tags];
        post.PinnedComment = sanitized.PinnedComment;
        post.MadeForKids = sanitized.MadeForKids;

        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: true, ct).ConfigureAwait(false);
        return post;
    }

    private async Task<bool> TryGenerateAndSaveSceneThumbnailAsync(AutomationPost post, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
            return true;

        RenderJob? job = null;
        if (!string.IsNullOrWhiteSpace(post.AttachedRenderJobId))
        {
            job = await renderJobs.GetAsync(post.AttachedRenderJobId, ct).ConfigureAwait(false);
            if (job is not { Status: RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings }
                || string.IsNullOrWhiteSpace(job.OutputStorageKey))
            {
                job = null;
            }
        }

        // Comedy channels get punchy MJO upper-body frame + high-CTR hook pill;
        // Devotional, Panchang, Katha and History channels get crisp thematic poster cards backed by a rendered scene frame.
        if (post.SourceType == AutomationSourceType.FunnyComedy && comedyThumbnailService is not null && job is not null)
        {
            try
            {
                var jpegBytes = await comedyThumbnailService.TryGenerateFromRenderAsync(
                    job,
                    post.Title,
                    post.Script,
                    "3D COMEDY",
                    post.SourceType.ToString(),
                    ct).ConfigureAwait(false);
                if (jpegBytes is { Length: > 0 })
                {
                    await SaveCustomThumbnailBytesAsync(post, jpegBytes, "Auto 3D Scene Thumbnail", ct).ConfigureAwait(false);
                    return true;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Comedy thumbnail composition failed for post {PostId}.", post.Id);
            }
        }

        if (post.SourceType != AutomationSourceType.FunnyComedy && fixedThumbnailGenerator is not null)
        {
            try
            {
                var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
                var (bgBytes, fromAiArt) = await ExtractPosterBackgroundBytesAsync(post, job, settings, ct).ConfigureAwait(false);
                var isPortrait = post.Format == AutomationVideoFormat.Vertical;
                var showWatermark = post.ShowWatermark
                    ?? (post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal
                        ? settings.PanchangShowWatermark
                        : false);
                var titleText = post.Title.Replace('\r', ' ').Replace('\n', ' ').Trim();
                var subtitleText = !string.IsNullOrWhiteSpace(post.SourceSummary)
                    ? post.SourceSummary.Trim()
                    : post.HeaderBannerText;
                if (subtitleText?.Length > 110)
                    subtitleText = subtitleText[..107].TrimEnd() + "…";

                var (imgBytes, _) = await fixedThumbnailGenerator.RenderAsync(
                    new ProceduralFixedThumbnailGenerator.FixedThumbnailSpec(
                        DateText: post.DateKey,
                        TitleText: titleText,
                        SubtitleText: subtitleText,
                        EventType: post.SourceType.ToString(),
                        BackgroundImageBytes: bgBytes,
                        ShowWatermark: showWatermark,
                        WatermarkText: showWatermark ? post.TrackedFunnelUrls.FirstOrDefault()?.Label : null,
                        Width: isPortrait ? 720 : post.Format == AutomationVideoFormat.CommunityPost ? 1080 : 1280,
                        Height: isPortrait ? 1280 : post.Format == AutomationVideoFormat.CommunityPost ? 1080 : 720,
                        MaskBottomRightWatermark: fromAiArt),
                    ct).ConfigureAwait(false);

                if (imgBytes is { Length: > 0 })
                {
                    await SaveCustomThumbnailBytesAsync(post, imgBytes, "Auto Themed Poster Thumbnail", ct).ConfigureAwait(false);
                    return true;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Themed fixed poster thumbnail failed for post {PostId}.", post.Id);
            }
        }

        if (comedyThumbnailService is not null && job is not null)
        {
            try
            {
                var jpegBytes = await comedyThumbnailService.TryGenerateFromRenderAsync(
                    job,
                    post.Title,
                    post.Script,
                    post.HeaderBannerText,
                    post.SourceType.ToString(),
                    ct).ConfigureAwait(false);
                if (jpegBytes is { Length: > 0 })
                {
                    await SaveCustomThumbnailBytesAsync(post, jpegBytes, "Auto 3D Scene Thumbnail", ct).ConfigureAwait(false);
                    return true;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Could not auto-compose 3D scene thumbnail for post {PostId}.", post.Id);
            }
        }

        return false;
    }

    private async Task<(byte[]? Bytes, bool FromAiArt)> ExtractPosterBackgroundBytesAsync(
        AutomationPost post,
        RenderJob? job,
        AutomationWorkspaceConfig settings,
        CancellationToken ct)
    {
        if (job is not null)
        {
            var cleanThumbKey = $"renders/{job.Id}.cleanthumb.png";
            await using (var cleanStream = await objectStore.OpenAsync(cleanThumbKey, ct).ConfigureAwait(false))
            {
                if (cleanStream is not null)
                {
                    using var ms = new MemoryStream();
                    await cleanStream.CopyToAsync(ms, ct).ConfigureAwait(false);
                    if (ms.Length > 256)
                        return (ms.ToArray(), false);
                }
            }
        }

        var hasMultiSceneDirectives = !string.IsNullOrWhiteSpace(post.Script)
            && post.Script.Contains("[SCENE]:", StringComparison.OrdinalIgnoreCase);
        var bgAssetId = !hasMultiSceneDirectives ? post.Stage?.BackgroundTemplateAssetId : null;
        bgAssetId ??= !hasMultiSceneDirectives && post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.DailyRashifal
            ? settings.PanchangDefaultBackgroundAssetId
            : post.AttachedAssetIds.FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(bgAssetId) && assets is not null && await IsOwnedImageAsync(post.UserId, bgAssetId, ct).ConfigureAwait(false))
        {
            var found = await assets.GetManyAsync([bgAssetId], ct).ConfigureAwait(false);
            if (found.FirstOrDefault() is { StorageKey.Length: > 0 } asset)
            {
                await using var stream = await objectStore.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
                if (stream is not null)
                {
                    using var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
                    if (ms.Length > 0) return (ms.ToArray(), false);
                }
            }
        }

        if (job is not null && thumbnailService is not null && !string.IsNullOrWhiteSpace(job.OutputStorageKey))
        {
            var localPath = await RenderPreviewFile.EnsureAsync(objectStore, dataPaths, job, ct).ConfigureAwait(false);
            var dur = job.Diagnostics?.OutputDurationSeconds;
            var frameSec = YouTubeThumbnailRules.ClampFrame(Math.Clamp((dur ?? 12.0) * 0.35, 1.5, 8.0), dur);
            var width = post.Format == AutomationVideoFormat.Vertical ? 720 : 1280;
            var extracted = await thumbnailService.FrameAsync(localPath, frameSec, width, ct).ConfigureAwait(false);
            if (extracted is { Length: > 0 })
                return (extracted, false);
        }

        // When no rendered cleanthumb exists yet, let ProceduralFixedThumbnailGenerator draw our own
        // clean sacred procedural characters & backdrop (never call external Pollinations AI which can hallucinate faces).
        return (null, false);
    }

    private async Task SaveCustomThumbnailBytesAsync(
        AutomationPost post,
        byte[] rawImage,
        string sourceLabel,
        CancellationToken ct)
    {
        var isSupported = rawImage.Length > 0
            && rawImage.Length <= MaxBackgroundPictureBytes
            && (YouTubeThumbnailRules.IsPng(rawImage)
                || YouTubeThumbnailRules.IsJpeg(rawImage)
                || AiImageValidator.Sniff(rawImage) is not null);
        if (!isSupported)
            throw EditingException.Invalid("thumbnail-unreadable", "Thumbnail must be a valid PNG, JPEG, or WebP picture.");

        byte[] storedBytes;
        string contentType;
        string ext;
        if (thumbnailService is not null)
        {
            try
            {
                storedBytes = await thumbnailService.NormalizeAsync(rawImage, ct).ConfigureAwait(false);
                contentType = "image/jpeg";
                ext = ".jpg";
            }
            catch (YouTubePublishException ex)
            {
                throw EditingException.Invalid(ex.Code, ex.Message);
            }
        }
        else
        {
            if (rawImage.Length > YouTubeThumbnailRules.MaxYouTubeBytes
                || (!YouTubeThumbnailRules.IsPng(rawImage) && !YouTubeThumbnailRules.IsJpeg(rawImage)))
            {
                throw EditingException.Invalid("thumbnail-too-large", "Thumbnail must be a PNG or JPEG under 2 MB.");
            }
            storedBytes = rawImage;
            contentType = YouTubeThumbnailRules.IsPng(rawImage) ? "image/png" : "image/jpeg";
            ext = contentType == "image/png" ? ".png" : ".jpg";
        }

        var key = $"automation-thumbnails/{post.Id}{ext}";
        if (!string.IsNullOrWhiteSpace(post.ThumbnailStorageKey)
            && !string.Equals(post.ThumbnailStorageKey, key, StringComparison.Ordinal))
        {
            await DeleteThumbnailObjectAsync(post, ct).ConfigureAwait(false);
        }

        await using (var ms = new MemoryStream(storedBytes, writable: false))
            await objectStore.SaveAsync(key, ms, contentType, ct).ConfigureAwait(false);

        post.ThumbnailStorageKey = key;
        post.ThumbnailFrameAtSeconds = null;
        post.ThumbnailSource = sourceLabel;
    }

    private async Task DeleteThumbnailObjectAsync(AutomationPost post, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.ThumbnailStorageKey)) return;
        var key = post.ThumbnailStorageKey;
        post.ThumbnailStorageKey = null;
        try
        {
            await objectStore.DeleteAsync(key, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not delete old automation thumbnail {Key} for post {PostId}", key, post.Id);
        }
    }

    private async Task<YouTubeThumbnailChoice?> BuildPostThumbnailChoiceAsync(AutomationPost post, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
        {
            try
            {
                await using var stream = await objectStore.OpenAsync(post.ThumbnailStorageKey, ct).ConfigureAwait(false);
                if (stream is not null)
                {
                    using var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
                    var bytes = ms.ToArray();
                    if (bytes.Length > 0)
                        return new YouTubeThumbnailChoice(null, Convert.ToBase64String(bytes));
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Could not read thumbnail object {Key} for automation post {PostId}", post.ThumbnailStorageKey, post.Id);
            }
        }

        if (post.ThumbnailFrameAtSeconds is { } frameAt)
            return new YouTubeThumbnailChoice(frameAt, null);

        return null;
    }

    private async Task<byte[]?> BuildThumbnailJpegForLocalVideoAsync(AutomationPost post, string localVideoPath, CancellationToken ct)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
            {
                await using var stream = await objectStore.OpenAsync(post.ThumbnailStorageKey, ct).ConfigureAwait(false);
                if (stream is not null)
                {
                    using var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
                    var raw = ms.ToArray();
                    if (raw.Length == 0) return null;
                    if (thumbnailService is not null)
                        return await thumbnailService.NormalizeAsync(raw, ct).ConfigureAwait(false);
                    if (raw.Length <= YouTubeThumbnailRules.MaxYouTubeBytes)
                        return raw;
                }
            }

            if (post.ThumbnailFrameAtSeconds is { } frameAt && thumbnailService is not null)
            {
                return await thumbnailService.FrameAsync(localVideoPath, Math.Max(0, frameAt), YouTubeThumbnailRules.TargetWidth, ct)
                    .ConfigureAwait(false);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Thumbnail preparation for automation post {PostId} failed; upload continues without custom thumbnail", post.Id);
        }
        return null;
    }

    private async Task SyncQueuedItemAsync(
        string userId,
        AutomationPost post,
        bool includeSchedule,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.QueueItemId)) return;

        PublishQueueItemView view;
        try
        {
            view = await publishQueue.GetAsync(userId, post.QueueItemId, ct).ConfigureAwait(false);
        }
        catch (KeyNotFoundException)
        {
            post.QueueItemId = null;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return;
        }

        if (view.State == PublishQueueState.Published) return;
        if (!PublishQueueRules.CanEdit(view.State))
            throw EditingException.Conflict("post-locked", "Cannot change details while this video is uploading to YouTube.");

        var targetChannel = !string.IsNullOrWhiteSpace(post.TargetChannelId) ? post.TargetChannelId : view.ChannelId;
        DateTime? scheduleToSync = null;
        if (includeSchedule && post.ScheduledAtUtc is { } sched && sched >= UtcNow - PublishQueueRules.PastTolerance)
        {
            scheduleToSync = sched;
        }

        var thumbnailChoice = await BuildPostThumbnailChoiceAsync(post, ct).ConfigureAwait(false);
        var removeThumb = thumbnailChoice is null && view.HasCustomThumbnail;

        await publishQueue.UpdateAsync(userId, view.Id, new PublishQueueChange(
            ChannelId: targetChannel,
            Title: post.Title,
            Description: post.Description,
            Tags: post.Tags,
            CategoryId: post.CategoryId,
            Privacy: post.Privacy,
            MadeForKids: post.MadeForKids,
            NotifySubscribers: null,
            FirstComment: post.PinnedComment,
            ScheduledAt: scheduleToSync,
            Mode: null,
            Notes: null,
            RemoveThumbnail: removeThumb,
            Thumbnail: thumbnailChoice), ct).ConfigureAwait(false);
    }

    private async Task TryAssignChannelAsync(
        string userId,
        AutomationPost post,
        string channelId,
        CancellationToken ct,
        bool throwIfMissing = false)
    {
        try
        {
            var conn = await connections.GetAsync(userId, channelId, ct).ConfigureAwait(false);
            if (conn is null)
            {
                if (throwIfMissing)
                    throw EditingException.Invalid("channel-not-found", "Selected YouTube channel is not connected.");
                return;
            }
            post.TargetChannelId = conn.ChannelId;
            post.TargetChannelTitle = conn.ChannelTitle;
            post.TargetChannelHandle = conn.ChannelHandle;
        }
        catch (KeyNotFoundException) when (!throwIfMissing)
        {
            // Rule's saved channel may have been disconnected later.
        }
        catch (KeyNotFoundException)
        {
            throw EditingException.Invalid("channel-not-found", "Selected YouTube channel is not connected.");
        }
    }

    private static void EnsurePostEditable(AutomationPost post)
    {
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot edit a post while uploading or after it is published.");
    }

    private static string BuildDefaultThumbnailPrompt(AutomationPost post)
    {
        var lower = $"{post.Title} {post.SourceTitle} {post.SourceSummary}".ToLowerInvariant();
        if (post.SourceType == AutomationSourceType.FunnyComedy)
            return $"Vibrant expressive 3D comic Indian reaction scene illustrating '{post.Title}', dramatic comedy expression, studio rim light, no text, no letters, no watermark";

        if (post.SourceType == AutomationSourceType.HinduPanchang || post.SourceType == AutomationSourceType.DailyRashifal)
            return "Two expressive warm-lit traditional Indian characters in center foreground: a serene white-bearded Vedic Jyotish Acharya holding glowing palm leaf scriptures beside an attentive young disciple with folded hands, framed by a radiant golden Hindu zodiac mandala and sunbeams inside an illuminated saffron temple hall, leaving upper 28% warm dark burgundy sky clear for large headline, strictly zero text, no words, no letters, no watermark";

        if (post.SourceType == AutomationSourceType.HinduFestival)
        {
            if (lower.Contains("pradosh", StringComparison.Ordinal) || lower.Contains("प्रदोष", StringComparison.Ordinal))
                return "Expressive close-up devotional temple scene with two visible characters in lower-mid frame: devout saffron-clad Rishi and respectful young bhakt performing glowing evening deep-aarti beside a radiant carved black stone Shivling adorned with bael leaves and marigold flowers, with majestic glowing Lord Shiva blessing in golden clouds behind them, leaving upper 28% clean dark warm tone for large title, strictly zero text, no letters, no watermark";
            return $"Warm expressive Indian temple festival painting showing devout saffron-clad Rishi and smiling devotee with glowing brass aarti platter, sacred kalash, marigold flowers and divine golden rays illustrating '{post.SourceTitle}', leaving upper 28% dark warm background clear for title, strictly zero text, no letters, no watermark";
        }

        if (post.SourceType == AutomationSourceType.DailyKatha)
        {
            if (lower.Contains("markandeya", StringComparison.Ordinal) || lower.Contains("मार्कण्डेय", StringComparison.Ordinal))
                return "Epic classical Indian mythological painting focused on right 60% of frame: young Markandeya Rishi boy praying beside a radiant Shivling while majestic blue-throated Lord Shiva holding a golden Trishul with crescent moon in hair emerges in divine golden light protecting his devotee, leaving left 40% clean dark charcoal storm clouds for bold yellow title, strictly zero text, no letters, no watermark";
            if (lower.Contains("neelkanth", StringComparison.Ordinal) || lower.Contains("नीलकंठ", StringComparison.Ordinal))
                return "Epic Indian mythological painting focused on right 60% of frame: serene Lord Shiva with crescent moon and glowing blue throat holding the halahala vessel amidst celestial golden radiance and cosmic waves, leaving left 40% dark charcoal storm space for title, strictly zero text, no letters, no watermark";
            if (lower.Contains("prahlad", StringComparison.Ordinal) || lower.Contains("प्रह्लाद", StringComparison.Ordinal))
                return "Epic Indian mythological painting focused on right 60% of frame: young devotee boy Prahlad praying joyfully with folded hands in a glowing golden temple courtyard while divine golden light radiates from a carved pillar, leaving left 40% dark background clear for title typography, strictly zero text, no letters, no watermark";
            return $"Epic classical Indian devotional painting focused on right 60% of frame with prominent expressive Hindu sage and divine deity characters illustrating '{post.SourceTitle}' under warm golden temple light, leaving left 40% dark atmospheric space for bold title typography, strictly zero text, no letters, no watermark";
        }

        if (post.SourceType == AutomationSourceType.AajKaItihaas)
            return $"Dramatic historical museum documentary scene depicting '{post.SourceTitle}' with authentic Indian heritage characters, brass telescope, antique scrolls, bronze globe and warm tungsten contrast, clear upper area for headline, strictly zero text, no numbers, no letters, no watermark";

        return $"High-contrast storytelling visual scene representing '{post.Title}', prominent expressive characters, cinematic lighting, strictly zero text, no letters, no watermark";
    }

    private async Task<byte[]?> TryGenerateAndAttachEventBackgroundAsync(AutomationPost post, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(post.Stage?.BackgroundTemplateAssetId) && assets is not null)
            return null;

        try
        {
            var isPortrait = post.Format == AutomationVideoFormat.Vertical;
            var (width, height) = isPortrait ? (768, 1344) : (1344, 768);
            var prompt = post.SourceType == AutomationSourceType.HinduFestival
                && ($"{post.Title} {post.SourceSummary}".Contains("pradosh", StringComparison.OrdinalIgnoreCase)
                    || $"{post.Title} {post.SourceSummary}".Contains("प्रदोष", StringComparison.Ordinal)
                    || $"{post.Title} {post.SourceSummary}".Contains("shiv", StringComparison.OrdinalIgnoreCase))
                ? "Vibrant warm-lit Indian temple worship painting featuring a smiling saffron-clad priest and young devotee performing evening deep-aarti before a radiant Shiva Linga with marigold garlands and glowing Lord Shiva blessing above in golden saffron mist, upper 28% clean dark warm backdrop for title, zero text, no letters, no watermark"
                : BuildDefaultThumbnailPrompt(post);
            var req = new AiImageRequest
            {
                Prompt = prompt,
                NegativePrompt = "text, watermark, signature, logo, badge, border, frame, pollinations, hindi text, english text, letters, typography, blurry, deformed, empty room, dark silhouette",
                Width = width,
                Height = height,
                Seed = Math.Abs((post.Id + post.DateKey).GetHashCode(StringComparison.Ordinal))
            };
            using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
            budget.CancelAfter(TimeSpan.FromSeconds(45));

            var generated = await TryMakeBackgroundPictureAsync(post.UserId, req, budget.Token).ConfigureAwait(false);
            if (generated is not { Content.Length: > 256 }) return null;

            var mime = AiImageValidator.Sniff(generated.Content);
            if (mime is null) return null;

            if (assets is not null)
            {
                try
                {
                    var projectId = await EnsureBackgroundTemplateProjectAsync(post.UserId, ct).ConfigureAwait(false);
                    var ext = mime == AiImageValidator.Png ? ".png" : ".jpg";
                    var key = $"projects/{projectId}/assets/{Guid.NewGuid():n}{ext}";
                    await using (var ms = new MemoryStream(generated.Content, writable: false))
                        await objectStore.SaveAsync(key, ms, mime, ct).ConfigureAwait(false);
                    var asset = new Domain.Assets.Asset
                    {
                        ProjectId = projectId,
                        Name = $"Event Art {post.SourceType} {post.DateKey}{ext}",
                        DisplayFileName = $"Event Art {post.SourceType} {post.DateKey}{ext}",
                        StorageKey = key,
                        Kind = Domain.Assets.AssetKind.Image,
                        MimeType = mime,
                        FileSizeBytes = generated.Content.Length,
                        ReviewStatus = Domain.Assets.AssetReviewStatus.NotRequired,
                        UsageScope = Domain.Assets.AssetUsageScope.SceneUse,
                        CreatedAt = UtcNow
                    };
                    await assets.InsertAsync(asset, ct).ConfigureAwait(false);
                    post.Stage ??= new AutomationStageSettings();
                    var shouldLockTemplate = post.SourceType == AutomationSourceType.DailyRashifal
                        && (string.IsNullOrWhiteSpace(post.Script) || !post.Script.Contains("[SCENE]:", StringComparison.OrdinalIgnoreCase));
                    if (shouldLockTemplate)
                    {
                        post.Stage.BackgroundTemplateAssetId = asset.Id;
                        post.Stage.BackgroundMotion = AutomationBackdropMotion.GentleZoom;
                    }
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogDebug(ex, "Could not persist event artwork asset for post {PostId}.", post.Id);
                }
            }
            return generated.Content;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Event AI poster art unavailable for post {PostId}; using procedural art.", post.Id);
            return null;
        }
    }

    private static string DefaultCategoryFor(AutomationSourceType sourceType, string? ruleCategoryId)
    {
        if (!string.IsNullOrWhiteSpace(ruleCategoryId)
            && YouTubePublishValidator.Categories.ContainsKey(ruleCategoryId)
            && !(sourceType == AutomationSourceType.FunnyComedy && ruleCategoryId == "22"))
        {
            return ruleCategoryId;
        }
        return sourceType switch
        {
            AutomationSourceType.FunnyComedy => "23",
            AutomationSourceType.HinduPanchang or AutomationSourceType.AajKaItihaas or AutomationSourceType.Pratiyogita => "27",
            _ => "22"
        };
    }

    private static List<string> BuildAutoFillTags(AutomationPost post)
    {
        var list = new List<string>(post.Tags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()));
        var seen = new HashSet<string>(list, StringComparer.OrdinalIgnoreCase);

        void TryAdd(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return;
            var cleaned = Regex.Replace(raw.Trim(), @"\s+", " ").Trim('#', ',');
            if (cleaned.Length < 2 || cleaned.Length > 45 || !seen.Add(cleaned)) return;
            var candidate = new List<string>(list) { cleaned };
            if (candidate.Count <= YouTubePublishValidator.MaxTagCount
                && YouTubePublishValidator.TagsLength(candidate) <= YouTubePublishValidator.MaxTagsLength)
            {
                list.Add(cleaned);
            }
        }

        if (post.Format == AutomationVideoFormat.Vertical) TryAdd("Shorts");
        TryAdd(post.TopicName);
        TryAdd(post.RuleName);

        foreach (var tag in post.SourceType switch
        {
            AutomationSourceType.FunnyComedy => new[] { "Comedy Shorts", "Hindi Comedy", "Funny Video", "Desi Jokes", "Desi Comedy" },
            AutomationSourceType.HinduPanchang => new[] { "Aaj Ka Panchang", "Hindu Panchang", "Shubh Muhurat", "Panchang" },
            AutomationSourceType.HinduFestival => new[] { "Hindu Festival", "Vrat Katha", "Puja Vidhi", "Sanatan Dharma" },
            AutomationSourceType.DailyKatha => new[] { "Pauranik Katha", "Bhakti Story", "Hindu Story", "Spiritual" },
            AutomationSourceType.AajKaItihaas => new[] { "Aaj Ka Itihaas", "Today In History", "Indian History" },
            AutomationSourceType.Pratiyogita => new[] { "Quiz", "Competition", "General Knowledge" },
            _ => new[] { "AnimStudio", "Storytelling", "Hindi" }
        })
        {
            TryAdd(tag);
        }

        foreach (var word in Regex.Split(post.Title ?? string.Empty, @"[\s|:,\-–—]+"))
        {
            if (word.Length >= 4) TryAdd(word);
        }

        return list;
    }

    private static string BuildAutoFillDescription(AutomationPost post, AutomationRule? rule)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(post.Description))
            sb.AppendLine(post.Description.Trim());
        else if (!string.IsNullOrWhiteSpace(post.SourceSummary))
            sb.AppendLine(post.SourceSummary.Trim());
        else
            sb.AppendLine(post.Title.Trim());

        if (!string.IsNullOrWhiteSpace(post.Script))
        {
            var plainScript = Regex.Replace(post.Script, @"\[[^\]]+\]:?", " ").Trim();
            plainScript = Regex.Replace(plainScript, @"\s+", " ");
            if (plainScript.Length > 240) plainScript = TrimToWordBoundary(plainScript, 240) + "...";
            if (plainScript.Length >= 20 && !sb.ToString().Contains(plainScript, StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine();
                sb.AppendLine(plainScript);
            }
        }

        if (post.TrackedFunnelUrls.Count > 0)
        {
            var link = post.TrackedFunnelUrls[0];
            sb.AppendLine();
            sb.AppendLine($"🌐 {link.Label}: {link.TrackedUrl}");
        }

        var result = sb.ToString().Trim();
        result = YouTubePublishValidator.WithFooter(result, rule?.DescriptionFooterOverride);
        if (Encoding.UTF8.GetByteCount(result) > YouTubePublishValidator.MaxDescriptionBytes)
            result = result[..Math.Min(result.Length, 4200)].TrimEnd();
        return result;
    }

    private static string TrimToWordBoundary(string value, int maxLength)
    {
        var clean = value.Trim();
        if (clean.Length <= maxLength) return clean;
        var cut = clean[..maxLength];
        var lastSpace = cut.LastIndexOf(' ');
        return (lastSpace >= maxLength / 2 ? cut[..lastSpace] : cut).TrimEnd(' ', '-', ':', '|', ',');
    }
}
