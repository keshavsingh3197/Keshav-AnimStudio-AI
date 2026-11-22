using AnimStudio.Application.Automation;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

public sealed record GenerateRashifalShortsDto(
    string? DateKey = null,
    string? Location = null,
    string Language = "hi",
    IReadOnlyList<string>? RashiKeys = null,
    bool RenderVideosNow = true,
    bool? ShowWatermark = null,
    string? BackgroundAssetId = null,
    string? TargetChannelId = null,
    bool AutoSchedulePeakSlots = true);

public sealed record GenerateRashifalShortsResult(
    string DateKey,
    string Location,
    int CreatedCount,
    int RenderedCount,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<AutomationPost> Posts);

public sealed partial class EcosystemAutomationService
{
    private async Task ApplyDefaultAssetThumbnailBestEffortAsync(
        string userId,
        AutomationPost post,
        string assetId,
        CancellationToken ct)
    {
        try
        {
            if (assets is null || !await IsOwnedImageAsync(userId, assetId, ct).ConfigureAwait(false))
                return;
            var found = await assets.GetManyAsync([assetId], ct).ConfigureAwait(false);
            var asset = found.FirstOrDefault(a => string.Equals(a.Id, assetId, StringComparison.Ordinal));
            if (asset is null || string.IsNullOrWhiteSpace(asset.StorageKey)) return;

            await using var stream = await objectStore.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
            if (stream is null) return;
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
            await SaveCustomThumbnailBytesAsync(post, ms.ToArray(), $"Default Panchang Thumbnail ({asset.Name})", ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not apply default Panchang thumbnail asset {AssetId} to post {PostId}.", assetId, post.Id);
        }
    }

    public async Task<AutomationPublishAdvice> GetPublishAdviceAsync(
        string userId,
        AutomationSourceType sourceType,
        AutomationVideoFormat format,
        string? channelId,
        string? timeZoneId,
        CancellationToken ct,
        string? targetDateKey = null)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var tz = PublishSlotSuggester.ResolveTimeZone(!string.IsNullOrWhiteSpace(timeZoneId) ? timeZoneId : settings.DefaultTimeZone);
        var now = UtcNow;

        var existingPosts = await repository.ListPostsAsync(
            userId,
            now.AddDays(-1).ToString("yyyy-MM-dd"),
            now.AddDays(14).ToString("yyyy-MM-dd"),
            null,
            300,
            ct).ConfigureAwait(false);

        var takenUtc = existingPosts
            .Where(p => p.Status is AutomationPostStatus.Approved or AutomationPostStatus.Publishing or AutomationPostStatus.VideoReadyForReview or AutomationPostStatus.Published
                && (string.IsNullOrWhiteSpace(channelId)
                    || string.Equals(p.TargetChannelId, channelId, StringComparison.Ordinal)
                    || string.Equals(p.PublishedChannelId, channelId, StringComparison.Ordinal)))
            .Select(p => p.ScheduledAtUtc ?? (p.Status == AutomationPostStatus.Published ? p.PublishedAtUtc : null))
            .Where(d => d.HasValue && d.Value >= now.AddDays(-1))
            .Select(d => d!.Value)
            .ToList();

        var recentPubs = await publications.ListByUserAsync(userId, null, 120, ct).ConfigureAwait(false);
        AnimStudio.Domain.Publishing.YouTubeChannelAnalysis? analysis = null;
        if (!string.IsNullOrWhiteSpace(channelId) && channelAnalyses is not null)
        {
            try
            {
                analysis = await channelAnalyses.GetAsync(userId, channelId, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Could not load cached channel analysis for {ChannelId}; continuing with base advice.", channelId);
            }
        }

        var historyUtc = recentPubs
            .Where(p => p.Health != AnimStudio.Domain.Publishing.YouTubeVideoHealth.Removed
                && (string.IsNullOrWhiteSpace(channelId) || string.Equals(p.ChannelId, channelId, StringComparison.Ordinal)))
            .Select(p => p.PublishAt ?? p.PublishedAt)
            .Concat(analysis?.Videos
                .Where(v => v.PublishedAtUtc is { } pat && pat <= now)
                .Select(v => v.PublishedAtUtc!.Value) ?? [])
            .Where(d => d != default)
            .Distinct()
            .ToList();

        var baseAdvice = AutomationPublishAdvisor.BuildAdvice(sourceType, format, tz, now, takenUtc, historyUtc, count: 4);
        return ChannelAudiencePeakAnalyzer.EnrichAdvice(
            baseAdvice, sourceType, format, analysis, tz, now, takenUtc, count: 4, targetDateKey: targetDateKey);
    }

    public async Task<DailyRashifalReport> GetDailyRashifalAsync(
        string? dateKey,
        string? location,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var effectiveDate = ResolveDateKey(dateKey, settings.DefaultTimeZone);
        var effectiveLocation = string.IsNullOrWhiteSpace(location) ? settings.DefaultLocation : location.Trim();
        var signals = await signalsClient.FetchAsync(
            effectiveDate,
            effectiveLocation,
            settings.PanchangApiBaseUrl,
            settings.SocialApiBaseUrl,
            settings.PratiyogitaApiBaseUrl,
            ct).ConfigureAwait(false);

        return DailyRashifalEngine.BuildReport(signals);
    }

    public async Task<GenerateRashifalShortsResult> GenerateRashifalShortsBatchAsync(
        string userId,
        GenerateRashifalShortsDto request,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var effectiveDate = ResolveDateKey(request.DateKey, settings.DefaultTimeZone);
        var effectiveLocation = string.IsNullOrWhiteSpace(request.Location) ? settings.DefaultLocation : request.Location.Trim();
        var lang = string.Equals(request.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi";
        var isHindi = lang == "hi";

        var ecosystemTask = ecosystemProvider.GetAsync(forceRefresh: false, ct);
        var signalsTask = signalsClient.FetchAsync(
            effectiveDate, effectiveLocation, settings.PanchangApiBaseUrl, settings.SocialApiBaseUrl, settings.PratiyogitaApiBaseUrl, ct);
        var rulesTask = repository.ListRulesAsync(userId, ct);
        var channelsTask = connections.ListAsync(userId, ct);
        await Task.WhenAll(ecosystemTask, signalsTask, rulesTask, channelsTask).ConfigureAwait(false);

        var ecosystem = ecosystemTask.Result;
        var signals = signalsTask.Result;
        var report = DailyRashifalEngine.BuildReport(signals);

        var connected = channelsTask.Result;
        var existingRule = rulesTask.Result.FirstOrDefault(r => r.SourceType == AutomationSourceType.DailyRashifal);
        var devotionalChannel = MatchConnectedChannel(connected, ecosystem, ["bhakti", "shiv", "hindu", "panchang", "devotional", "sanatan", "katha", "omkar"]);

        var chosenChannel = !string.IsNullOrWhiteSpace(request.TargetChannelId)
            ? connected.FirstOrDefault(c => string.Equals(c.ChannelId, request.TargetChannelId.Trim(), StringComparison.Ordinal))
            : !string.IsNullOrWhiteSpace(existingRule?.TargetChannelId)
                ? connected.FirstOrDefault(c => string.Equals(c.ChannelId, existingRule.TargetChannelId, StringComparison.Ordinal))
                : connected.FirstOrDefault(c => devotionalChannel is not null && string.Equals(c.ChannelId, devotionalChannel.Value.ChannelId, StringComparison.Ordinal));
        chosenChannel ??= connected.FirstOrDefault();

        var channelTuple = chosenChannel is null
            ? devotionalChannel
            : (chosenChannel.ChannelId, chosenChannel.ChannelTitle, chosenChannel.ChannelHandle);

        AutomationRule synthRule;
        if (existingRule is not null)
        {
            synthRule = existingRule;
        }
        else
        {
            synthRule = BuildStarterRule(
                userId,
                7,
                "Daily Rashifal (All 12 Rashis Fast 2D)",
                "Fast 2D animated Vedic Rashifal Shorts powered by verified daily Panchang data.",
                AutomationSourceType.DailyRashifal,
                channelTuple,
                null,
                "06:00",
                settings,
                ["panchang", "studio"],
                "22",
                UtcNow);
            synthRule.PreferFast2DAnimation = true;
            synthRule.ShowWatermark = settings.PanchangShowWatermark;
            synthRule.TargetSeconds = 28;
            await repository.UpsertRuleAsync(synthRule, ct).ConfigureAwait(false);
        }
        synthRule.Language = lang;
        synthRule.VideoFormat = AutomationVideoFormat.Vertical;
        synthRule.TargetSeconds = 28;
        synthRule.EnableCharacterDialogue = true;
        synthRule.SpeakerAName ??= "आचार्य वेद";
        synthRule.SpeakerBName ??= "जिज्ञासु शिष्य";
        synthRule.PreferFast2DAnimation = true;
        synthRule.ShowWatermark = request.ShowWatermark ?? settings.PanchangShowWatermark;

        var wantedKeys = request.RashiKeys is { Count: > 0 }
            ? new HashSet<string>(request.RashiKeys.Where(k => !string.IsNullOrWhiteSpace(k)).Select(k => k.Trim()), StringComparer.OrdinalIgnoreCase)
            : null;
        var targetRashis = report.Rashis
            .Where(r => wantedKeys is null || wantedKeys.Contains(r.Key) || wantedKeys.Contains(r.EnglishName))
            .ToList();

        var existingPosts = (await repository.ListPostsAsync(userId, effectiveDate, effectiveDate, null, 400, ct).ConfigureAwait(false)).ToList();
        var links = BuildTrackedLinksForRule(synthRule, signals, ecosystem, effectiveDate);
        var primaryLink = links.FirstOrDefault()?.TrackedUrl ?? ecosystem.StudioUrl;
        var palette = ProceduralEventPalette.Resolve(AutomationSourceType.DailyRashifal.ToString(), ProceduralSceneTheme.Auto);

        var bgAssetId = !string.IsNullOrWhiteSpace(request.BackgroundAssetId)
            ? request.BackgroundAssetId.Trim()
            : settings.PanchangDefaultBackgroundAssetId;

        var advice = request.AutoSchedulePeakSlots
            ? await GetPublishAdviceAsync(userId, AutomationSourceType.DailyRashifal, AutomationVideoFormat.Vertical, chosenChannel?.ChannelId, settings.DefaultTimeZone, ct).ConfigureAwait(false)
            : null;

        var created = 0;
        var rendered = 0;
        var warnings = new List<string>();
        var outputPosts = new List<AutomationPost>(targetRashis.Count);
        var baseSlotUtc = advice?.RecommendedAtUtc ?? UtcNow.AddMinutes(30);

        for (var idx = 0; idx < targetRashis.Count; idx++)
        {
            var rashi = targetRashis[idx];
            var rawPkg = DailyRashifalEngine.ComposeSingleRashiPackage(report, rashi, synthRule, links, primaryLink, isHindi);
            var sanitized = YouTubePolicyComplianceSanitizer.Sanitize(
                rawPkg.Title,
                rawPkg.Description,
                rawPkg.Tags,
                rawPkg.PinnedComment,
                rawPkg.SourceTitle,
                rawPkg.PrimaryDestinationUrl,
                requestedMadeForKids: false,
                isShort: true,
                language: lang);

            var fingerprint = $"{effectiveDate}:{synthRule.Id}:{rawPkg.SourceItemKey}".ToLowerInvariant();
            var existing = AutomationPost.SelectPreferred(
                existingPosts.Where(p => string.Equals(p.Fingerprint, fingerprint, StringComparison.OrdinalIgnoreCase)));
            existing ??= await repository.FindPostByFingerprintAsync(userId, fingerprint, ct).ConfigureAwait(false);

            if (existing is { Status: AutomationPostStatus.Published or AutomationPostStatus.Publishing })
            {
                outputPosts.Add(existing);
                continue;
            }

            var post = existing ?? new AutomationPost
            {
                Id = $"ap_rsh_{Guid.NewGuid():n}"[..24],
                UserId = userId,
                RuleId = synthRule.Id,
                CreatedAtUtc = UtcNow
            };
            if (existing is null) created++;

            post.RuleName = synthRule.Name;
            post.SourceType = AutomationSourceType.DailyRashifal;
            post.DateKey = effectiveDate;
            post.Fingerprint = fingerprint;
            post.SourceItemKey = rawPkg.SourceItemKey;
            post.SourceTitle = rawPkg.SourceTitle;
            post.SourceSummary = rawPkg.SourceSummary;
            post.TargetChannelId = chosenChannel?.ChannelId ?? synthRule.TargetChannelId;
            post.TargetChannelHandle = chosenChannel?.ChannelHandle ?? synthRule.TargetChannelHandle;
            post.TargetChannelTitle = chosenChannel?.ChannelTitle ?? synthRule.TargetChannelTitle;
            post.Title = sanitized.Title;
            post.Script = rawPkg.Script;
            post.AiVideoPrompt = rawPkg.AiVideoPrompt;
            post.AiThumbnailPrompt = rawPkg.AiThumbnailPrompt;
            post.Description = sanitized.Description;
            post.PinnedComment = sanitized.PinnedComment;
            post.Tags = [.. sanitized.Tags];
            post.CategoryId = "22";
            post.Privacy = "public";
            post.MadeForKids = false;
            post.Format = AutomationVideoFormat.Vertical;
            post.Language = lang;
            post.PrimaryDestinationUrl = rawPkg.PrimaryDestinationUrl;
            post.TrackedFunnelUrls = [.. rawPkg.TrackedLinks];
            post.CommunityPostText = rawPkg.CommunityPostText;
            post.CommunityPollOptions = [.. (rawPkg.CommunityPollOptions ?? [])];
            post.HeaderBannerText = rawPkg.HeaderBannerText ?? $"{palette.HeaderBadgeText} • {effectiveDate}";
            post.EventColorHex = palette.PrimaryHex;
            post.EnableCharacterDialogue = synthRule.EnableCharacterDialogue;
            post.SpeakerAName = synthRule.SpeakerAName;
            post.SpeakerBName = synthRule.SpeakerBName;
            post.SubtitlePreset = "karaoke-pulse";
            post.VisualEngine = AutomationVisualEngine.Procedural3D;
            post.NarrativeMode = AutomationNarrativeMode.ShortReel;
            post.TargetSeconds = 26;
            post.ShowWatermark = request.ShowWatermark ?? settings.PanchangShowWatermark;
            post.PreferFast2DAnimation = true;
            if (!string.IsNullOrWhiteSpace(bgAssetId))
            {
                post.Stage ??= new AutomationStageSettings();
                post.Stage.BackgroundTemplateAssetId = bgAssetId;
            }
            if (request.AutoSchedulePeakSlots && post.ScheduledAtUtc is null)
            {
                // Stagger each Rashi Short by 15 minutes so subscribers aren't spammed simultaneously
                post.ScheduledAtUtc = baseSlotUtc.AddMinutes(idx * 15);
            }
            ApplyPostVerification(post, signals);
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(settings.PanchangDefaultThumbnailAssetId)
                && string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
            {
                await ApplyDefaultAssetThumbnailBestEffortAsync(userId, post, settings.PanchangDefaultThumbnailAssetId, ct).ConfigureAwait(false);
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            }

            if (request.RenderVideosNow && string.IsNullOrWhiteSpace(post.AttachedRenderJobId))
            {
                try
                {
                    await AttachProceduralAnimatedVideoAsync(
                        userId,
                        post,
                        synthRule,
                        ProceduralSceneTheme.CosmosSacred3D,
                        26,
                        "720p",
                        ct,
                        trackProgress: false).ConfigureAwait(false);
                    rendered++;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    warnings.Add($"{rashi.HindiName}: video render deferred ({ex.Message})");
                }
            }

            outputPosts.Add(post);
        }

        return new GenerateRashifalShortsResult(
            DateKey: effectiveDate,
            Location: effectiveLocation,
            CreatedCount: created,
            RenderedCount: rendered,
            Warnings: warnings,
            Posts: outputPosts);
    }

    private static IReadOnlyList<AutomationWebsiteLink> BuildTrackedLinksForRule(
        AutomationRule rule,
        EcosystemSignalsSnapshot signals,
        AnimStudio.Application.Ecosystem.StudioEcosystemConfig ecosystem,
        string dateKey)
    {
        var list = AutomationContentComposer.ComposeForRule(
            new AutomationRule
            {
                Id = rule.Id,
                SourceType = AutomationSourceType.HinduPanchang,
                FunnelWebsiteKeys = rule.FunnelWebsiteKeys.Count > 0 ? rule.FunnelWebsiteKeys : ["panchang", "studio"],
                Language = rule.Language,
                VideoFormat = rule.VideoFormat
            },
            signals,
            ecosystem);
        return list.FirstOrDefault()?.TrackedLinks ?? [];
    }
}
