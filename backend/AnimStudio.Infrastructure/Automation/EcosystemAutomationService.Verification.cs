using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>
/// Continuous date/fact verification, wrong-date publish guardrails, and 1-click re-verify &amp; fix
/// workflow so misinformation (e.g., Nov 19 events on Nov 18) can never slip onto websites or YouTube.
/// </summary>
public sealed partial class EcosystemAutomationService
{
    public async Task<AutomationPost> VerifyPostAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);

        // If this post records a YouTube upload, verify live presence via YouTube videos.list right now so
        // videos deleted in YouTube Studio immediately re-enable scheduling & upload buttons (keeping the MP4).
        if (!string.IsNullOrWhiteSpace(post.PublishedVideoId)
            && AnimStudio.Application.Publishing.YouTubeRelatedVideos.IsVideoId(post.PublishedVideoId))
        {
            var channelId = post.PublishedChannelId ?? post.TargetChannelId;
            if (!string.IsNullOrWhiteSpace(channelId))
            {
                try
                {
                    var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
                    var found = await videoClient.GetAsync([post.PublishedVideoId!], token, ct).ConfigureAwait(false);
                    post.YouTubeCheckedAtUtc = UtcNow;

                    if (!found.ContainsKey(post.PublishedVideoId!))
                    {
                        var deletedVideoId = post.PublishedVideoId!;
                        var channelTitle = post.PublishedChannelTitle ?? post.TargetChannelTitle;
                        await MarkPublicationRemovedAsync(userId, deletedVideoId, deletedByApp: false, ct).ConfigureAwait(false);
                        await TryUnlistFromPanchangAsync(post, ct).ConfigureAwait(false);
                        if (catalogWriter is not null)
                            await catalogWriter.MarkRemovedAsync(deletedVideoId, ct).ConfigureAwait(false);
                        ResetAfterYouTubeRemoval(
                            post,
                            channelId,
                            channelTitle,
                            deletedByApp: false,
                            $"YouTube check confirmed video {deletedVideoId} is no longer on YouTube ({channelTitle ?? channelId}). Re-upload enabled.");
                        post.LastError = "Video was deleted from YouTube. Re-upload or switch channels anytime below.";
                    }
                    else if (!string.IsNullOrWhiteSpace(post.LastError)
                        && post.LastError.Contains("removed from YouTube", StringComparison.OrdinalIgnoreCase))
                    {
                        post.LastError = null;
                    }
                }
                catch (AnimStudio.Infrastructure.Publishing.YouTubePublishException ex)
                {
                    logger.LogWarning("Live YouTube check for post {PostId} skipped: {Code}", post.Id, ex.Code);
                }
            }
        }

        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var signals = await FetchSignalsForPostAsync(post, rule, settings, ct).ConfigureAwait(false);

        ApplyPostVerification(post, signals);
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> ReverifyAndFixPostAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        EnsurePostEditable(post);

        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false)
            ?? BuildSyntheticRuleForPost(post, settings);
        var effectiveDate = AutomationFactVerifier.ExtractIsoDateKey(post.DateKey) ?? post.DateKey;

        var ecosystemTask = ecosystemProvider.GetAsync(forceRefresh: true, ct);
        var signalsTask = FetchSignalsForPostAsync(post, rule, settings, ct);
        await Task.WhenAll(ecosystemTask, signalsTask).ConfigureAwait(false);

        var ecosystem = ecosystemTask.Result;
        var signals = signalsTask.Result;
        var dateChanged = false;
        if (post.SourceType == AutomationSourceType.HinduFestival && signals.UpcomingFestivals.Count > 0)
        {
            var matchedFest = MatchFestivalForPost(post, signals.UpcomingFestivals);
            if (matchedFest is not null
                && AutomationFactVerifier.ExtractIsoDateKey(matchedFest.DateKey) is { } canonicalFestDate
                && !string.Equals(canonicalFestDate, effectiveDate, StringComparison.Ordinal))
            {
                effectiveDate = canonicalFestDate;
                dateChanged = true;
                signals = await signalsClient.FetchAsync(
                    effectiveDate,
                    !string.IsNullOrWhiteSpace(rule.Location) ? rule.Location : settings.DefaultLocation,
                    settings.PanchangApiBaseUrl,
                    settings.SocialApiBaseUrl,
                    settings.PratiyogitaApiBaseUrl,
                    ct).ConfigureAwait(false);
            }
        }

        var ruleForDate = CloneRuleForDateSignals(rule, effectiveDate);
        var composedItems = AutomationContentComposer.ComposeForRule(ruleForDate, signals, ecosystem);
        if (composedItems.Count == 0)
        {
            throw EditingException.Invalid(
                "verified-data-unavailable",
                $"No verified {post.SourceType} data is currently available for {effectiveDate}. Wrong-date fallback events are blocked.");
        }

        var hadOldTopic = post.SourceTitle;
        var fresh = SelectMatchingComposedItem(post, composedItems);
        var resolvedDate = AutomationFactVerifier.ExtractIsoDateKey(fresh.EventDateKey) ?? effectiveDate;

        post.DateKey = resolvedDate;
        if (dateChanged || post.ScheduledAtUtc is null)
            post.ScheduledAtUtc = ComputeScheduledUtc(resolvedDate, rule.PreferredPublishTime, rule.TimeZoneId, rule.PublishDaysBefore);
        post.SourceItemKey = fresh.SourceItemKey;
        post.Fingerprint = $"{resolvedDate}:{post.RuleId}:{fresh.SourceItemKey}".ToLowerInvariant();
        post.SourceTitle = fresh.SourceTitle;
        post.SourceSummary = fresh.SourceSummary;
        post.Title = fresh.Title;
        post.Script = fresh.Script;
        post.AiVideoPrompt = fresh.AiVideoPrompt;
        post.AiThumbnailPrompt = fresh.AiThumbnailPrompt;
        post.Description = fresh.Description;
        post.PinnedComment = fresh.PinnedComment;
        post.Tags = [.. fresh.Tags];
        post.PrimaryDestinationUrl = fresh.PrimaryDestinationUrl;
        post.TrackedFunnelUrls = [.. fresh.TrackedLinks];
        post.CommunityPostText = fresh.CommunityPostText;
        post.CommunityPollOptions = fresh.CommunityPollOptions is { Count: > 0 } ? [.. fresh.CommunityPollOptions] : [];
        post.HeaderBannerText = fresh.HeaderBannerText;
        post.EventColorHex = fresh.EventColorHex;
        post.GeneratedByAi = false;

        if (!string.IsNullOrWhiteSpace(post.LastError)
            && (post.LastError.Contains("mismatch", StringComparison.OrdinalIgnoreCase)
                || post.LastError.Contains("verification", StringComparison.OrdinalIgnoreCase)))
        {
            post.LastError = null;
        }

        if ((!string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId))
            && !string.Equals(hadOldTopic, fresh.SourceTitle, StringComparison.OrdinalIgnoreCase))
        {
            post.Notes = $"Re-verified to {effectiveDate} facts ('{fresh.SourceTitle}'). Re-render the video before publishing if the attached clip spoke the previous topic.";
        }

        ApplyPostVerification(post, signals);
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
        return post;
    }

    private async Task<EcosystemSignalsSnapshot> FetchSignalsForPostAsync(
        AutomationPost post,
        AutomationRule? rule,
        AutomationWorkspaceConfig settings,
        CancellationToken ct)
    {
        var effectiveDate = AutomationFactVerifier.ExtractIsoDateKey(post.DateKey) ?? post.DateKey;
        var location = !string.IsNullOrWhiteSpace(rule?.Location) ? rule!.Location : settings.DefaultLocation;
        return await signalsClient.FetchAsync(
            effectiveDate,
            location,
            settings.PanchangApiBaseUrl,
            settings.SocialApiBaseUrl,
            settings.PratiyogitaApiBaseUrl,
            ct).ConfigureAwait(false);
    }

    private async Task EnsurePostFactVerifiedForPublishAsync(
        AutomationPost post,
        CancellationToken ct)
    {
        if (post.SourceType is not (AutomationSourceType.AajKaItihaas
            or AutomationSourceType.HinduPanchang
            or AutomationSourceType.HinduFestival))
        {
            ApplyPostVerification(post, liveSignals: null);
            return;
        }

        EcosystemSignalsSnapshot? signals = null;
        try
        {
            var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
            var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
            signals = await FetchSignalsForPostAsync(post, rule, settings, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Live signal fetch during publish verification failed for post {PostId}; running offline claim verifier", post.Id);
        }

        ApplyPostVerification(post, signals);

        if (string.Equals(post.VerificationStatus, AutomationFactVerifier.StatusMismatch, StringComparison.OrdinalIgnoreCase))
        {
            if (post.Status == AutomationPostStatus.Approved)
            {
                var hasVideo = !string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId);
                post.Status = hasVideo ? AutomationPostStatus.VideoReadyForReview : AutomationPostStatus.PreparedPreview;
            }
            post.LastError = $"Upload blocked due to date/fact mismatch: {post.VerificationSummary}";
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            throw EditingException.Conflict(
                "fact-verification-mismatch",
                $"{post.LastError} Click 'Fix with Verified Data' before publishing.");
        }
    }

    private async Task RefreshOverviewVerificationAsync(
        IReadOnlyList<AutomationPost> posts,
        EcosystemSignalsSnapshot overviewSignals,
        CancellationToken ct)
    {
        if (posts.Count == 0) return;

        var changedPosts = new List<AutomationPost>();
        var signalDate = AutomationFactVerifier.ExtractIsoDateKey(overviewSignals.DateKey) ?? overviewSignals.DateKey;
        foreach (var post in posts)
        {
            var postDate = AutomationFactVerifier.ExtractIsoDateKey(post.DateKey);
            var matchingSignals = string.Equals(postDate, signalDate, StringComparison.Ordinal)
                || (post.SourceType == AutomationSourceType.HinduFestival && overviewSignals.UpcomingFestivals.Count > 0)
                ? overviewSignals
                : null;

            // Only pass live signals when the post matches overviewSignals' DateKey so posts from
            // other days still get deterministic KnownMilestones checks without false cross-day errors.
            if (ApplyPostVerification(post, matchingSignals))
                changedPosts.Add(post);
        }

        if (changedPosts.Count == 0) return;

        await Task.WhenAll(changedPosts.Select(async post =>
        {
            try
            {
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Could not persist refreshed verification state for post {PostId}", post.Id);
            }
        })).ConfigureAwait(false);
    }

    private bool ApplyPostVerification(AutomationPost post, EcosystemSignalsSnapshot? liveSignals)
    {
        var result = AutomationFactVerifier.VerifyPost(post, liveSignals);
        var changed = !string.Equals(post.VerificationStatus, result.Status, StringComparison.Ordinal)
            || !string.Equals(post.VerificationSummary, result.Summary, StringComparison.Ordinal)
            || !string.Equals(post.VerificationSourceName, result.SourceName, StringComparison.Ordinal)
            || !string.Equals(post.VerificationSourceUrl, result.SourceUrl, StringComparison.Ordinal)
            || !post.VerificationIssues.SequenceEqual(result.Issues, StringComparer.Ordinal)
            || post.VerifiedAtUtc is null;

        post.VerificationStatus = result.Status;
        post.VerificationSummary = result.Summary;
        post.VerificationSourceName = result.SourceName;
        post.VerificationSourceUrl = result.SourceUrl;
        post.VerificationIssues = [.. result.Issues];
        post.VerifiedAtUtc = UtcNow;
        return changed;
    }

    private static ComposedAutomationContent SelectMatchingComposedItem(
        AutomationPost post,
        IReadOnlyList<ComposedAutomationContent> composedItems)
    {
        if (composedItems.Count == 1) return composedItems[0];

        var byKey = composedItems.FirstOrDefault(c =>
            string.Equals(c.SourceItemKey, post.SourceItemKey, StringComparison.OrdinalIgnoreCase));
        if (byKey is not null) return byKey;

        var byTitle = composedItems.FirstOrDefault(c =>
            !string.IsNullOrWhiteSpace(post.SourceTitle)
            && c.SourceTitle.Contains(post.SourceTitle, StringComparison.OrdinalIgnoreCase));
        return byTitle ?? composedItems[0];
    }

    private static AutomationRule BuildSyntheticRuleForPost(AutomationPost post, AutomationWorkspaceConfig settings) => new()
    {
        Id = post.RuleId,
        UserId = post.UserId,
        Name = post.RuleName,
        SourceType = post.SourceType,
        VideoFormat = post.Format,
        Language = post.Language,
        TargetChannelId = post.TargetChannelId,
        TargetChannelTitle = post.TargetChannelTitle,
        TargetChannelHandle = post.TargetChannelHandle,
        TopicId = post.TopicId,
        TopicName = post.TopicName,
        CategoryId = post.CategoryId,
        Privacy = post.Privacy,
        MadeForKids = post.MadeForKids,
        Location = settings.DefaultLocation,
        TimeZoneId = settings.DefaultTimeZone,
        EnableCharacterDialogue = post.EnableCharacterDialogue,
        SpeakerAName = post.SpeakerAName,
        SpeakerBName = post.SpeakerBName,
        SubtitlePreset = post.SubtitlePreset,
        VisualEngine = post.VisualEngine,
        NarrativeMode = post.NarrativeMode,
        TargetSeconds = post.TargetSeconds ?? 55,
        AttachedAssetIds = [.. post.AttachedAssetIds],
        ComedyStyle = post.ComedyStyle,
        AutoInsertMemes = post.AutoInsertMemes,
        FunnelWebsiteKeys = [.. post.TrackedFunnelUrls.Select(l => l.Key).Where(k => !string.IsNullOrWhiteSpace(k))],
    };

    private static EcosystemFestivalSignal? MatchFestivalForPost(
        AutomationPost post,
        IReadOnlyList<EcosystemFestivalSignal> upcoming)
    {
        var keyParts = (post.SourceItemKey ?? string.Empty).Split(':');
        var keyId = keyParts.Length >= 3 ? string.Join(':', keyParts.Skip(2)) : null;

        return (!string.IsNullOrWhiteSpace(keyId)
                ? upcoming.FirstOrDefault(f => string.Equals(f.Id, keyId, StringComparison.OrdinalIgnoreCase))
                : null)
            ?? upcoming.FirstOrDefault(f =>
                (!string.IsNullOrWhiteSpace(f.NameEnglish)
                    && ((post.SourceTitle?.Contains(f.NameEnglish, StringComparison.OrdinalIgnoreCase) == true)
                        || post.Title.Contains(f.NameEnglish, StringComparison.OrdinalIgnoreCase)))
                || (!string.IsNullOrWhiteSpace(f.NameHindi)
                    && ((post.SourceTitle?.Contains(f.NameHindi, StringComparison.OrdinalIgnoreCase) == true)
                        || post.Title.Contains(f.NameHindi, StringComparison.OrdinalIgnoreCase))));
    }

    private static AutomationRule CloneRuleForDateSignals(AutomationRule rule, string effectiveDate)
    {
        // Strict single-day verification: when re-fixing a HinduFestival card for `effectiveDate`,
        // enforce FestivalLeadDays = 0 so tomorrow's festivals can never masquerade as `effectiveDate`.
        if (rule.SourceType != AutomationSourceType.HinduFestival) return rule;
        return new AutomationRule
        {
            Id = rule.Id,
            UserId = rule.UserId,
            Name = rule.Name,
            Description = rule.Description,
            Enabled = rule.Enabled,
            SourceType = rule.SourceType,
            Mode = rule.Mode,
            VideoStrategy = rule.VideoStrategy,
            VideoFormat = rule.VideoFormat,
            TargetChannelId = rule.TargetChannelId,
            TargetChannelHandle = rule.TargetChannelHandle,
            TargetChannelTitle = rule.TargetChannelTitle,
            BrandChannelId = rule.BrandChannelId,
            TopicId = rule.TopicId,
            TopicName = rule.TopicName,
            Language = rule.Language,
            TargetSeconds = rule.TargetSeconds,
            Location = rule.Location,
            PreferredPublishTime = rule.PreferredPublishTime,
            TimeZoneId = rule.TimeZoneId,
            DaysOfWeek = [.. rule.DaysOfWeek],
            FestivalLeadDays = 0,
            FunnelWebsiteKeys = [.. rule.FunnelWebsiteKeys],
            SocialFunnelSlug = rule.SocialFunnelSlug,
            Privacy = rule.Privacy,
            CategoryId = rule.CategoryId,
            MadeForKids = rule.MadeForKids,
            IncludePinnedComment = rule.IncludePinnedComment,
            PromptTemplateOverride = rule.PromptTemplateOverride,
            DescriptionFooterOverride = rule.DescriptionFooterOverride,
            CustomTopicPrompt = rule.CustomTopicPrompt,
            SubtitlePreset = rule.SubtitlePreset,
            EnableCharacterDialogue = rule.EnableCharacterDialogue,
            SpeakerAName = rule.SpeakerAName,
            SpeakerBName = rule.SpeakerBName,
            VisualEngine = rule.VisualEngine,
            NarrativeMode = rule.NarrativeMode,
            AttachedAssetIds = [.. rule.AttachedAssetIds],
            ComedyStyle = rule.ComedyStyle,
            AutoInsertMemes = rule.AutoInsertMemes,
            SortOrder = rule.SortOrder,
            LastPreparedDateKey = effectiveDate,
        };
    }
}
