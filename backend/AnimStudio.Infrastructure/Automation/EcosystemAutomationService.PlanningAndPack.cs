using System.Globalization;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

public sealed record AutomationRebalanceResult(
    int RulesUpdated,
    int PostsUpdated,
    int TopicsUpdated,
    IReadOnlyList<AutomationRule> Rules);

public sealed record ChannelWeeklyBufferStatus(
    string ChannelKey,
    string ChannelTitle,
    string? ChannelHandle,
    string AudienceProfile,
    string Language,
    string PrimarySourceLabel,
    int ActiveRulesCount,
    int TargetDaysPerWeek,
    int CurrentWeekPreparedDays,
    int NextWeekPreparedDays,
    int CurrentWeekExpectedPosts,
    int CurrentWeekPreparedPosts,
    int CurrentWeekReadyOrScheduledPosts,
    int NextWeekExpectedPosts,
    int NextWeekPreparedPosts,
    int NextWeekReadyOrScheduledPosts,
    int VideosReadyCount,
    int ThumbnailsReadyCount,
    int ScheduledOrPublishedCount,
    bool IsCurrentWeekComplete,
    bool IsNextWeekComplete,
    string CurrentWeekStatus,
    string NextWeekStatus,
    IReadOnlyList<string> MissingCurrentWeekDates,
    IReadOnlyList<string> MissingNextWeekDates);

public sealed record WeeklyNotificationItem(
    string Id,
    string Severity,
    string Badge,
    string Title,
    string Message,
    string? ActionLabel,
    string? ChannelId);

public sealed record WeeklyBufferSummary(
    string BaseDateKey,
    string CurrentWeekStart,
    string CurrentWeekEnd,
    string NextWeekStart,
    string NextWeekEnd,
    int AdvanceBufferDays,
    int TotalExpectedSlots,
    int TotalPreparedSlots,
    int VideosReadySlots,
    int ScheduledOrPublishedSlots,
    bool IsCurrentWeekComplete,
    bool IsNextWeekComplete,
    IReadOnlyList<ChannelWeeklyBufferStatus> Channels,
    IReadOnlyList<WeeklyNotificationItem> Notifications);

public sealed record PrepareBufferHorizonRequest(
    string? StartDateKey = null,
    int Days = 14,
    string? ChannelId = null,
    bool ForceRegenerate = false,
    bool RebalanceChannels = true);

public sealed record PrepareBufferHorizonResult(
    string StartDateKey,
    int DaysScanned,
    int DaysNewlyPrepared,
    int PostsCreated,
    int PostsUpdated,
    IReadOnlyList<string> Warnings,
    WeeklyBufferSummary Summary);

public sealed record PreparePublishPackRequest(
    string? DateKey = null,
    bool ForceRegenerate = false,
    bool RebalanceChannels = true,
    bool GenerateVideos = true,
    bool SyncToCalendar = true,
    bool ScheduleOnYouTubePrivate = true,
    bool IncludeSpotlight = false);

public sealed record PreparePublishPackItemResult(
    string PostId,
    AutomationSourceType SourceType,
    string Title,
    string? TargetChannelTitle,
    string? TargetChannelId,
    string Status,
    bool HasVideo,
    bool HasThumbnail,
    string? CalendarItemId,
    DateTime? ScheduledAtUtc,
    string? PublishedVideoId,
    string? PublishedVideoUrl,
    string? Note);

public sealed record PreparePublishPackResult(
    string DateKey,
    int RulesRebalanced,
    int PreparedCount,
    int VideosReadyCount,
    int ThumbnailsReadyCount,
    int CalendarSyncedCount,
    int ScheduledPrivateOnYouTubeCount,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<PreparePublishPackItemResult> Items);

internal sealed record StarterChannelMap(
    (string ChannelId, string Title, string? Handle)? Devotional,
    (string ChannelId, string Title, string? Handle)? WorldHistory,
    (string ChannelId, string Title, string? Handle)? AnyFallback);

public sealed partial class EcosystemAutomationService
{
    private const string CalendarMarkerPrefix = "[auto-post:";

    private static bool IsDevotionalSource(AutomationSourceType sourceType) => sourceType is
        AutomationSourceType.HinduPanchang or
        AutomationSourceType.HinduFestival or
        AutomationSourceType.DailyKatha or
        AutomationSourceType.DailyRashifal or
        AutomationSourceType.DevotionalPrarthana;

    private static bool IsWorldHistorySource(AutomationSourceType sourceType) => sourceType is
        AutomationSourceType.AajKaItihaas or
        AutomationSourceType.Pratiyogita or
        AutomationSourceType.EcosystemSpotlight;

    /// <summary>True when a channel represents an international / global English outlet (e.g. @keshavsinghworld).</summary>
    internal static bool IsGlobalEnglishChannelHint(string? handle, string? title)
    {
        if (ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint(handle, title)
            || ComedyChannelMatcher.IsComedyChannelHint(handle, title))
            return false;

        var combined = $"{handle} {title}".ToLowerInvariant();
        return combined.Contains("keshavsinghworld", StringComparison.Ordinal)
            || combined.Contains("keshav singh world", StringComparison.Ordinal)
            || combined.Contains("global", StringComparison.Ordinal)
            || combined.Contains("international", StringComparison.Ordinal)
            || combined.Contains("english", StringComparison.Ordinal);
    }

    private static StarterChannelMap ResolveStarterChannels(
        IReadOnlyList<YouTubeConnectionStatus> connected,
        StudioEcosystemConfig ecosystem)
    {
        var activeConnected = connected.Where(c => !c.NeedsReconnect).ToList();
        var searchPool = activeConnected.Count > 0 ? activeConnected : connected;

        var devotional =
            MatchConnectedChannel(searchPool, ecosystem,
                ["bhakti", "shiv", "hindu", "panchang", "devotional", "sanatan", "katha", "omkar"],
                excludeComedy: true)
            ?? MatchCentralChannel(ecosystem,
                ["bhakti", "shiv", "hindu", "panchang", "devotional", "sanatan"]);

        var worldHistory =
            MatchConnectedChannel(searchPool, ecosystem,
                ["world", "history", "itihaas", "brief", "knowledge", "fact", "education", "tech", "ai", "keshav"],
                excludeDevotional: true,
                excludeComedy: true,
                excludeChannelId: devotional?.ChannelId)
            ?? MatchCentralChannel(ecosystem,
                ["world", "history", "itihaas", "brief", "knowledge", "fact", "education", "tech", "ai"])
            ?? searchPool
                .Where(c => !string.Equals(c.ChannelId, devotional?.ChannelId, StringComparison.OrdinalIgnoreCase)
                    && !ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint(c.ChannelHandle, c.ChannelTitle)
                    && !ComedyChannelMatcher.IsComedyChannelHint(c.ChannelHandle, c.ChannelTitle))
                .Select(c => ((string, string, string?)?)(c.ChannelId, c.ChannelTitle, c.ChannelHandle))
                .FirstOrDefault();

        var anyFallback = worldHistory ?? devotional ?? connected
            .Select(c => ((string, string, string?)?)(c.ChannelId, c.ChannelTitle, c.ChannelHandle))
            .FirstOrDefault();

        return new StarterChannelMap(devotional, worldHistory, anyFallback);
    }

    /// <summary>
    /// Routes Devotional rules/topics (Panchang, Festival, Katha, Rashifal) to the Devotional Bhakti channel
    /// and History/Ecosystem rules/topics (Aaj Ka Itihaas, Pratiyogita, Spotlight) to the World/History channel.
    /// </summary>
    public async Task<AutomationRebalanceResult> RebalanceStarterChannelsAsync(string userId, CancellationToken ct)
    {
        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var channelMap = ResolveStarterChannels(connected, ecosystem);
        var byId = connected.ToDictionary(c => c.ChannelId, StringComparer.OrdinalIgnoreCase);

        var rules = (await repository.ListRulesAsync(userId, ct).ConfigureAwait(false)).ToList();
        var topics = (await topicsRepo.ListByUserAsync(userId, ct).ConfigureAwait(false)).ToList();
        var todayKey = ResolveDateKey(null, (await GetWorkspaceConfigAsync(ct).ConfigureAwait(false)).DefaultTimeZone);
        var upcomingPosts = (await repository.ListPostsAsync(userId, todayKey, null, null, 200, ct).ConfigureAwait(false)).ToList();

        var rulesUpdated = 0;
        var postsUpdated = 0;
        var topicsUpdated = 0;

        foreach (var rule in rules)
        {
            (string ChannelId, string Title, string? Handle)? desired = rule.SourceType switch
            {
                var st when IsDevotionalSource(st) => channelMap.Devotional,
                var st when IsWorldHistorySource(st) => channelMap.WorldHistory,
                _ => null
            };
            if (desired is not { ChannelId.Length: > 0 } target)
                continue;

            var currentConn = !string.IsNullOrWhiteSpace(rule.TargetChannelId)
                ? byId.GetValueOrDefault(rule.TargetChannelId)
                : null;
            var wrongForHistory = IsWorldHistorySource(rule.SourceType)
                && (ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint(rule.TargetChannelHandle, rule.TargetChannelTitle)
                    || ComedyChannelMatcher.IsComedyChannelHint(rule.TargetChannelHandle, rule.TargetChannelTitle)
                    || string.Equals(rule.TargetChannelId, channelMap.Devotional?.ChannelId, StringComparison.OrdinalIgnoreCase));
            var wrongForDevotional = IsDevotionalSource(rule.SourceType)
                && !ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint(rule.TargetChannelHandle, rule.TargetChannelTitle)
                && !string.Equals(rule.TargetChannelId, target.ChannelId, StringComparison.OrdinalIgnoreCase);
            var needsFix = string.IsNullOrWhiteSpace(rule.TargetChannelId)
                || currentConn is null or { NeedsReconnect: true }
                || wrongForHistory
                || wrongForDevotional;

            var needsVideoFormatUpgrade = rule.SourceType == AutomationSourceType.DailyKatha
                && !rule.Name.Contains("Short", StringComparison.OrdinalIgnoreCase)
                && (rule.VideoFormat != AutomationVideoFormat.Wide
                    || rule.NarrativeMode != AutomationNarrativeMode.FullStory
                    || rule.TargetSeconds < 210);
            var targetIsGlobalEnglish = IsWorldHistorySource(rule.SourceType)
                && IsGlobalEnglishChannelHint(target.Handle, target.Title);
            var needsGlobalLanguageUpgrade = targetIsGlobalEnglish
                && (!string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase)
                    || string.IsNullOrWhiteSpace(rule.Location)
                    || rule.Location.Contains("India", StringComparison.OrdinalIgnoreCase));

            if (!needsFix && !needsVideoFormatUpgrade && !needsGlobalLanguageUpgrade) continue;

            var ruleChanged = false;
            if (needsFix && !string.Equals(rule.TargetChannelId, target.ChannelId, StringComparison.OrdinalIgnoreCase))
            {
                rule.TargetChannelId = target.ChannelId;
                rule.TargetChannelTitle = target.Title;
                rule.TargetChannelHandle = target.Handle;
                ruleChanged = true;
            }
            if (needsVideoFormatUpgrade)
            {
                rule.VideoFormat = AutomationVideoFormat.Wide;
                rule.NarrativeMode = AutomationNarrativeMode.FullStory;
                rule.TargetSeconds = Math.Max(rule.TargetSeconds, 220);
                ruleChanged = true;
            }
            if (needsGlobalLanguageUpgrade)
            {
                rule.Language = "en";
                if (string.IsNullOrWhiteSpace(rule.Location) || rule.Location.Contains("India", StringComparison.OrdinalIgnoreCase))
                    rule.Location = "Global (English)";
                ruleChanged = true;
            }
            if (ruleChanged)
            {
                rule.UpdatedAtUtc = UtcNow;
                await repository.UpsertRuleAsync(rule, ct).ConfigureAwait(false);
                rulesUpdated++;
            }

            if (!string.IsNullOrWhiteSpace(rule.TopicId)
                && topics.FirstOrDefault(t => string.Equals(t.Id, rule.TopicId, StringComparison.Ordinal)) is { } topic
                && !string.Equals(topic.ChannelId, target.ChannelId, StringComparison.OrdinalIgnoreCase))
            {
                await UpdateTopicChannelAsync(userId, topic, target, ct).ConfigureAwait(false);
                topicsUpdated++;
            }

            foreach (var post in upcomingPosts.Where(p =>
                string.Equals(p.RuleId, rule.Id, StringComparison.Ordinal)
                && p.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing
                && string.IsNullOrWhiteSpace(p.PublishedVideoId)))
            {
                if (!string.Equals(post.TargetChannelId, target.ChannelId, StringComparison.OrdinalIgnoreCase))
                {
                    post.TargetChannelId = target.ChannelId;
                    post.TargetChannelTitle = target.Title;
                    post.TargetChannelHandle = target.Handle;
                    post.UpdatedAtUtc = UtcNow;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    postsUpdated++;
                }
            }
        }

        // Also update standard ContentTopics whose name corresponds to Devotional/History if mismatched.
        foreach (var topic in topics)
        {
            var isHistoryTopic = topic.Name.Contains("Itihaas", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("History", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("Pratiyogita", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("Ecosystem", StringComparison.OrdinalIgnoreCase);
            var isDevotionalTopic = topic.Name.Contains("Panchang", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("Festival", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("Katha", StringComparison.OrdinalIgnoreCase)
                || topic.Name.Contains("Rashifal", StringComparison.OrdinalIgnoreCase);

            var target = isHistoryTopic
                ? channelMap.WorldHistory
                : isDevotionalTopic
                    ? channelMap.Devotional
                    : null;
            if (target is { ChannelId.Length: > 0 } t
                && !string.Equals(topic.ChannelId, t.ChannelId, StringComparison.OrdinalIgnoreCase))
            {
                await UpdateTopicChannelAsync(userId, topic, t, ct).ConfigureAwait(false);
                topicsUpdated++;
            }
        }

        return new AutomationRebalanceResult(rulesUpdated, postsUpdated, topicsUpdated, rules);
    }

    /// <summary>
    /// One-click orchestrator for a target date (e.g. tomorrow): rebalances channels, prepares verified cards,
    /// picks non-colliding channel-analyzed peak slots, renders 3D/2D videos + themed thumbnails + policy-clean SEO,
    /// mirrors every entry onto the Content Calendar, and optionally uploads Private scheduled to YouTube.
    /// </summary>
    public async Task<PreparePublishPackResult> PreparePublishPackAsync(
        string userId,
        PreparePublishPackRequest request,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var effectiveDate = ResolveDateKey(request.DateKey, settings.DefaultTimeZone);
        var warnings = new List<string>();
        var rulesRebalanced = 0;

        if (request.RebalanceChannels)
        {
            var existingRules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
            if (existingRules.Count == 0)
                await BootstrapDefaultRulesAsync(userId, ct).ConfigureAwait(false);

            var rebalance = await RebalanceStarterChannelsAsync(userId, ct).ConfigureAwait(false);
            rulesRebalanced = rebalance.RulesUpdated;
        }

        await PrepareForDateAsync(userId, effectiveDate, ruleId: null, forceRegenerate: request.ForceRegenerate, ct)
            .ConfigureAwait(false);

        var targetDayPosts = (await repository.ListPostsAsync(userId, effectiveDate, effectiveDate, null, 200, ct).ConfigureAwait(false))
            .Where(p => p.Format != AutomationVideoFormat.CommunityPost
                && (request.IncludeSpotlight || p.SourceType != AutomationSourceType.EcosystemSpotlight)
                && p.SourceType is AutomationSourceType.HinduPanchang
                    or AutomationSourceType.HinduFestival
                    or AutomationSourceType.DailyKatha
                    or AutomationSourceType.AajKaItihaas
                    or AutomationSourceType.Pratiyogita
                    or AutomationSourceType.EcosystemSpotlight)
            .OrderBy(p => p.SourceType)
            .ThenBy(p => p.CreatedAtUtc)
            .ToList();

        var connectedById = (await connections.ListAsync(userId, ct).ConfigureAwait(false))
            .ToDictionary(c => c.ChannelId, StringComparer.OrdinalIgnoreCase);

        var tz = PublishSlotSuggester.ResolveTimeZone(settings.DefaultTimeZone);
        var assignedChannelTimes = new Dictionary<string, List<DateTime>>(StringComparer.OrdinalIgnoreCase);
        var itemResults = new List<PreparePublishPackItemResult>();
        var videosReady = 0;
        var thumbsReady = 0;
        var calendarSynced = 0;
        var scheduledYouTube = 0;

        foreach (var current in targetDayPosts)
        {
            var post = current;
            string? note = null;

            try
            {
                // Ensure facts are verified and auto-recomposed if mismatched.
                if (string.Equals(post.VerificationStatus, AutomationFactVerifier.StatusMismatch, StringComparison.OrdinalIgnoreCase)
                    && post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing)
                {
                    post = await ReverifyAndFixPostAsync(userId, post.Id, ct).ConfigureAwait(false);
                }

                // Assign data-backed non-colliding peak viewer slot on the target date for this channel.
                if (!string.IsNullOrWhiteSpace(post.TargetChannelId)
                    && post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing)
                {
                    var advice = await GetPublishAdviceAsync(
                        userId, post.SourceType, post.Format, post.TargetChannelId, settings.DefaultTimeZone, ct,
                        targetDateKey: post.DateKey).ConfigureAwait(false);
                    var takenOnChannel = assignedChannelTimes.GetValueOrDefault(post.TargetChannelId) ?? [];
                    var chosenSlot = PickBestNonCollidingSlot(advice, takenOnChannel, tz, post.DateKey);
                    if (chosenSlot is { } slotUtc)
                    {
                        post.ScheduledAtUtc = slotUtc;
                        takenOnChannel.Add(slotUtc);
                        assignedChannelTimes[post.TargetChannelId] = takenOnChannel;
                    }
                    else if (post.ScheduledAtUtc is { } existingUtc)
                    {
                        takenOnChannel.Add(existingUtc);
                        assignedChannelTimes[post.TargetChannelId] = takenOnChannel;
                    }
                    post.UpdatedAtUtc = UtcNow;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                }

                if (request.ForceRegenerate
                    && post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing)
                {
                    post.AttachedRenderJobId = null;
                    post.AttachedHandoffId = null;
                    post.AttachedHandoffTitle = null;
                    post.AttachedVideoSourceLabel = null;
                    if (post.Stage is not null)
                        post.Stage.BackgroundTemplateAssetId = null;
                    await DeleteThumbnailObjectAsync(post, ct).ConfigureAwait(false);
                }

                // Generate 3D / Fast-2D procedural animated video BEFORE thumbnail composition so
                // the rendered peak frame (.cleanthumb.png with our actual characters) can be reused.
                var videoGeneratedNow = false;
                if (request.GenerateVideos
                    && post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing
                    && string.IsNullOrWhiteSpace(post.AttachedRenderJobId)
                    && string.IsNullOrWhiteSpace(post.AttachedHandoffId))
                {
                    if (post.SourceType == AutomationSourceType.HinduPanchang
                        && (string.IsNullOrWhiteSpace(post.Script) || !post.Script.Contains("[SCENE]:", StringComparison.OrdinalIgnoreCase)))
                        post.PreferFast2DAnimation = true;
                    if (post.SourceType == AutomationSourceType.DailyKatha && (post.TargetSeconds is null || post.TargetSeconds > ShortMaxSeconds))
                    {
                        post.Format = AutomationVideoFormat.Wide;
                        post.NarrativeMode = AutomationNarrativeMode.FullStory;
                        post.TargetSeconds = Math.Max(post.TargetSeconds ?? 220, 220);
                    }
                    else if (post.TargetSeconds > ShortMaxSeconds)
                    {
                        post.Format = AutomationVideoFormat.Wide;
                        post.NarrativeMode = AutomationNarrativeMode.FullStory;
                    }

                    post = await GenerateAnimatedVideoAsync(
                        userId,
                        post.Id,
                        ProceduralSceneTheme.Auto,
                        durationSeconds: 0,
                        resolution: "720p",
                        ct: ct).ConfigureAwait(false);
                    videoGeneratedNow = true;
                }

                // Fill SEO, tags, description, pinned comment, compliance sanitizer + custom thumbnail.
                if (post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing)
                {
                    post = await AutoFillMissingDetailsAsync(userId, post.Id, ct).ConfigureAwait(false);
                    if (videoGeneratedNow || string.IsNullOrWhiteSpace(post.ThumbnailStorageKey))
                    {
                        await TryGenerateAndSaveSceneThumbnailAsync(post, ct).ConfigureAwait(false);
                        post.UpdatedAtUtc = UtcNow;
                        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    }
                }

                // Mirror onto /calendar
                string? calendarItemId = null;
                if (request.SyncToCalendar)
                {
                    calendarItemId = await EnsureCalendarPlanItemIdAsync(userId, post, ct).ConfigureAwait(false);
                    if (!string.IsNullOrWhiteSpace(calendarItemId))
                        calendarSynced++;
                }

                // Upload Private scheduled on YouTube (with publishAt) when ready and channel is connected.
                if (request.ScheduleOnYouTubePrivate
                    && post.Status is not AutomationPostStatus.Published and not AutomationPostStatus.Publishing
                    && string.IsNullOrWhiteSpace(post.PublishedVideoId)
                    && (!string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId))
                    && !string.IsNullOrWhiteSpace(post.TargetChannelId))
                {
                    var conn = connectedById.GetValueOrDefault(post.TargetChannelId);
                    if (conn is null || conn.NeedsReconnect)
                    {
                        note = $"Channel {post.TargetChannelTitle ?? post.TargetChannelId} needs YouTube reconnect; kept ready in queue & calendar.";
                        warnings.Add(note);
                    }
                    else if (string.Equals(post.VerificationStatus, AutomationFactVerifier.StatusMismatch, StringComparison.OrdinalIgnoreCase))
                    {
                        note = $"Fact mismatch blocked upload for '{post.Title}'.";
                        warnings.Add(note);
                    }
                    else
                    {
                        var targetSchedule = post.ScheduledAtUtc is { } sched && sched >= UtcNow + PublishQueueRules.MinYouTubeReleaseLead
                            ? sched
                            : UtcNow.AddHours(2);
                        post = await ExecutePublishAsync(
                            userId,
                            post,
                            publishNow: false,
                            scheduledAtUtc: targetSchedule,
                            ct: ct,
                            scheduleOnYouTube: true).ConfigureAwait(false);
                        scheduledYouTube++;
                        if (request.SyncToCalendar)
                        {
                            calendarItemId = await EnsureCalendarPlanItemIdAsync(userId, post, ct).ConfigureAwait(false);
                        }
                    }
                }
                else if (!string.IsNullOrWhiteSpace(post.PublishedVideoId))
                {
                    scheduledYouTube++;
                }

                var hasVideo = !string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId);
                var hasThumb = !string.IsNullOrWhiteSpace(post.ThumbnailStorageKey) || post.ThumbnailFrameAtSeconds.HasValue;
                if (hasVideo) videosReady++;
                if (hasThumb) thumbsReady++;

                itemResults.Add(new PreparePublishPackItemResult(
                    post.Id,
                    post.SourceType,
                    post.Title,
                    post.TargetChannelTitle,
                    post.TargetChannelId,
                    post.Status.ToString(),
                    hasVideo,
                    hasThumb,
                    calendarItemId,
                    post.ScheduledAtUtc,
                    post.PublishedVideoId,
                    post.PublishedVideoUrl,
                    note ?? post.LastError));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var err = $"{post.Title}: {ex.Message}";
                logger.LogWarning(ex, "PreparePublishPack step failed for post {PostId}", post.Id);
                warnings.Add(err);
                itemResults.Add(new PreparePublishPackItemResult(
                    post.Id,
                    post.SourceType,
                    post.Title,
                    post.TargetChannelTitle,
                    post.TargetChannelId,
                    post.Status.ToString(),
                    !string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId),
                    !string.IsNullOrWhiteSpace(post.ThumbnailStorageKey) || post.ThumbnailFrameAtSeconds.HasValue,
                    null,
                    post.ScheduledAtUtc,
                    post.PublishedVideoId,
                    post.PublishedVideoUrl,
                    ex.Message));
            }
        }

        return new PreparePublishPackResult(
            effectiveDate,
            rulesRebalanced,
            targetDayPosts.Count,
            videosReady,
            thumbsReady,
            calendarSynced,
            scheduledYouTube,
            warnings,
            itemResults);
    }

    private DateTime? PickBestNonCollidingSlot(
        AutomationPublishAdvice advice,
        IReadOnlyList<DateTime> alreadyTakenOnChannel,
        TimeZoneInfo tz,
        string dateKey)
    {
        var minGap = TimeSpan.FromMinutes(90);
        var minLead = UtcNow + PublishQueueRules.MinYouTubeReleaseLead + TimeSpan.FromMinutes(5);
        var targetDate = DateOnly.TryParse(dateKey, out var d) ? d : DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(UtcNow, tz));

        foreach (var slot in advice.Slots)
        {
            if (slot.AtUtc < minLead) continue;
            var localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(slot.AtUtc, tz));
            if (localDate != targetDate) continue;
            if (!alreadyTakenOnChannel.Any(t => (t - slot.AtUtc).Duration() < minGap))
                return slot.AtUtc;
        }

        // Fallback on targetDate nudging +90m past last occupied slot while staying in daytime/evening
        var seed = advice.Slots.FirstOrDefault()?.AtUtc
            ?? ComputeScheduledUtc(dateKey, "09:00", tz.Id);
        for (var step = 0; step < 6; step++)
        {
            var candidate = seed.AddMinutes(90 * step);
            var local = TimeZoneInfo.ConvertTimeFromUtc(candidate, tz);
            if (DateOnly.FromDateTime(local) != targetDate || candidate < minLead) continue;
            if (!alreadyTakenOnChannel.Any(t => (t - candidate).Duration() < minGap))
                return candidate;
        }
        return seed >= minLead ? seed : null;
    }

    private async Task UpdateTopicChannelAsync(
        string userId,
        ContentTopic topic,
        (string ChannelId, string Title, string? Handle) target,
        CancellationToken ct)
    {
        var cmd = new ContentTopicCommand(
            topic.Name,
            topic.Description,
            topic.Color,
            target.ChannelId,
            target.Title,
            topic.Days,
            topic.PublishTime,
            topic.TimeZone,
            topic.LeadDays,
            topic.PlanAheadDays,
            topic.AutoSchedule,
            topic.AutoLinkUploads,
            topic.Tags,
            topic.Checklist,
            topic.Archived);
        await planning.UpdateTopicAsync(topic.Id, userId, cmd, ct).ConfigureAwait(false);
    }

    private async Task<string?> EnsureCalendarPlanItemIdAsync(string userId, AutomationPost post, CancellationToken ct)
    {
        try
        {
            var topics = (await topicsRepo.ListByUserAsync(userId, ct).ConfigureAwait(false)).ToList();
            var topicName = DefaultCalendarTopicName(post.SourceType);
            var topic = !string.IsNullOrWhiteSpace(post.TopicId)
                ? topics.FirstOrDefault(t => string.Equals(t.Id, post.TopicId, StringComparison.Ordinal))
                : null;
            topic ??= topics.FirstOrDefault(t => string.Equals(t.Name, topicName, StringComparison.OrdinalIgnoreCase));

            var color = CalendarTopicColorHex(post.SourceType);
            if (topic is null)
            {
                topic = await planning.CreateTopicAsync(
                    userId,
                    new ContentTopicCommand(
                        topicName,
                        $"Auto-synced {post.SourceType} calendar pipeline",
                        color,
                        post.TargetChannelId,
                        post.TargetChannelTitle,
                        Days: null,
                        PublishTime: "07:00",
                        TimeZone: "Asia/Kolkata",
                        LeadDays: 1,
                        PlanAheadDays: 14,
                        AutoSchedule: true,
                        AutoLinkUploads: true,
                        Tags: null,
                        Checklist: ["Script & Fact Check", "Video Rendered", "Thumbnail Attached", "Private Scheduled on YouTube"],
                        Archived: false),
                    ct).ConfigureAwait(false);
            }
            else if (!string.IsNullOrWhiteSpace(post.TargetChannelId)
                && !string.Equals(topic.ChannelId, post.TargetChannelId, StringComparison.OrdinalIgnoreCase))
            {
                await planning.UpdateTopicAsync(
                    topic.Id,
                    userId,
                    new ContentTopicCommand(
                        topic.Name,
                        topic.Description,
                        topic.Color,
                        post.TargetChannelId,
                        post.TargetChannelTitle,
                        topic.Days,
                        topic.PublishTime,
                        topic.TimeZone,
                        topic.LeadDays,
                        topic.PlanAheadDays,
                        topic.AutoSchedule,
                        topic.AutoLinkUploads,
                        topic.Tags,
                        topic.Checklist,
                        topic.Archived),
                    ct).ConfigureAwait(false);
            }

            if (!string.Equals(post.TopicId, topic.Id, StringComparison.Ordinal))
            {
                post.TopicId = topic.Id;
                post.TopicName = topic.Name;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            }

            var targetDate = DateOnly.Parse(post.DateKey, CultureInfo.InvariantCulture);
            var fromUtc = targetDate.AddDays(-1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var toUtc = targetDate.AddDays(2).ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            var existingItems = await planning.ListItemsAsync(userId, fromUtc, toUtc, topic.Id, ct).ConfigureAwait(false);

            var marker = $"{CalendarMarkerPrefix}{post.Id}]";
            var existing = existingItems
                .Select(v => v.Item)
                .FirstOrDefault(i =>
                    (i.Notes?.Contains(marker, StringComparison.Ordinal) == true)
                    || string.Equals(i.SlotKey, ContentPlanRules.SlotKeyFor(topic.Id, targetDate), StringComparison.Ordinal));

            var cleanTitle = SanitizeSingleLine(post.Title, 190);
            if (string.IsNullOrWhiteSpace(cleanTitle))
                cleanTitle = topicName;

            var hasVideo = !string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId);
            var hasThumb = !string.IsNullOrWhiteSpace(post.ThumbnailStorageKey) || post.ThumbnailFrameAtSeconds.HasValue;
            var publishAt = post.ScheduledAtUtc ?? ComputeScheduledUtc(post.DateKey, "09:00", "Asia/Kolkata");
            if (publishAt < new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc))
                publishAt = UtcNow.AddHours(12);

            var calStatus = post.Status switch
            {
                AutomationPostStatus.Published when post.ScheduledAtUtc > UtcNow => ContentPlanStatus.Scheduled,
                AutomationPostStatus.Published => ContentPlanStatus.Published,
                AutomationPostStatus.Publishing => ContentPlanStatus.Ready,
                AutomationPostStatus.Approved or AutomationPostStatus.VideoReadyForReview => ContentPlanStatus.Ready,
                _ when hasVideo => ContentPlanStatus.Ready,
                _ => ContentPlanStatus.InProgress
            };

            var checklist = new List<ContentChecklistItem>
            {
                new() { Text = "Verified Script & Facts", Done = !string.Equals(post.VerificationStatus, AutomationFactVerifier.StatusMismatch, StringComparison.OrdinalIgnoreCase) },
                new() { Text = "Video Ready", Done = hasVideo },
                new() { Text = "Thumbnail Ready", Done = hasThumb },
                new() { Text = "SEO & Compliance Ready", Done = post.Tags.Count >= 3 && !string.IsNullOrWhiteSpace(post.Description) },
                new() { Text = "Uploaded Private / Scheduled on YouTube", Done = post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published }
            };

            var notes = $"{marker} Channel: {post.TargetChannelTitle ?? post.TargetChannelId ?? "Unassigned"}"
                + (string.IsNullOrWhiteSpace(post.PublishedVideoUrl) ? string.Empty : $"\nYouTube: {post.PublishedVideoUrl}")
                + (string.IsNullOrWhiteSpace(post.PrimaryDestinationUrl) ? string.Empty : $"\nFunnel: {post.PrimaryDestinationUrl}");
            if (notes.Length > 3800) notes = notes[..3800];

            var cmd = new ContentPlanItemCommand(
                topic.Id,
                cleanTitle,
                notes,
                publishAt,
                calStatus,
                checklist,
                ProjectId: null,
                FileLink: null);

            if (existing is null)
            {
                var created = await planning.CreateItemAsync(userId, cmd, ct).ConfigureAwait(false);
                return created.Item.Id;
            }

            if (string.IsNullOrWhiteSpace(post.PublishedVideoId) && !string.IsNullOrWhiteSpace(existing.VideoId))
            {
                await planning.UnlinkRemovedVideoAsync(userId, existing.VideoId, ct).ConfigureAwait(false);
            }

            var updated = await planning.UpdateItemAsync(existing.Id, userId, cmd, ct).ConfigureAwait(false);
            return updated.Item.Id;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Calendar sync skipped for automation post {PostId}", post.Id);
            return null;
        }
    }

    private static string DefaultCalendarTopicName(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.HinduPanchang => "Hindu Panchang & Muhurat",
        AutomationSourceType.HinduFestival => "Hindu Festivals & Vrat",
        AutomationSourceType.DailyKatha => "Daily Vedic Katha",
        AutomationSourceType.DevotionalPrarthana => "Daily Devotional Prarthana Reels",
        AutomationSourceType.DailyRashifal => "Daily Rashifal (12 Rashis)",
        AutomationSourceType.AajKaItihaas => "Aaj Ka Itihaas",
        AutomationSourceType.Pratiyogita => "Pratiyogita & Exam GK",
        AutomationSourceType.EcosystemSpotlight => "Pratiyogita & Creator Ecosystem",
        AutomationSourceType.FunnyComedy => "3D Comedy Shorts",
        _ => "Studio Automation"
    };

    private static string CalendarTopicColorHex(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha or AutomationSourceType.DailyRashifal or AutomationSourceType.DevotionalPrarthana => "#f59e0b",
        AutomationSourceType.AajKaItihaas => "#3b82f6",
        AutomationSourceType.FunnyComedy => "#f97316",
        _ => "#10b981"
    };

    private static string SanitizeSingleLine(string? value, int maxLen)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var chars = value.Select(ch => char.IsControl(ch) ? ' ' : ch).ToArray();
        var clean = string.Join(' ', new string(chars).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return clean.Length <= maxLen ? clean : clean[..maxLen].TrimEnd();
    }

    private static bool IsDriveClipValidForPost(PhoneHandoff clip, AutomationPost post)
    {
        if (!AutomationPublishAdvisor.IsDateBound(post.SourceType))
            return true;

        var title = clip.Title ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(post.DateKey) && title.Contains(post.DateKey, StringComparison.OrdinalIgnoreCase))
            return true;

        // Date-bound posts (Panchang, Rashifal, Festival, On This Day) must match the target Tithi / festival / event
        // in their clip title so an older day's pre-recorded Drive clip is never paired onto a different date's post.
        if (post.SourceType == AutomationSourceType.HinduPanchang)
        {
            var tokens = (post.SourceTitle ?? string.Empty)
                .Split(['|', '•', ',', '-', ' '], StringSplitOptions.RemoveEmptyEntries)
                .Where(t => t.Length >= 5 && !t.Equals("Shukla", StringComparison.OrdinalIgnoreCase) && !t.Equals("Krishna", StringComparison.OrdinalIgnoreCase))
                .ToList();
            return tokens.Count >= 2 && tokens.Take(2).All(t => title.Contains(t, StringComparison.OrdinalIgnoreCase));
        }

        return !string.IsNullOrWhiteSpace(post.SourceTitle)
            && post.SourceTitle.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length >= 5)
                .Take(2)
                .All(w => title.Contains(w, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<EcosystemSignalsSnapshot> DeduplicateSignalsForRuleAsync(
        string userId,
        AutomationRule rule,
        string effectiveDate,
        EcosystemSignalsSnapshot signals,
        CancellationToken ct)
    {
        if (rule.SourceType is not (AutomationSourceType.DailyKatha or AutomationSourceType.AajKaItihaas))
            return signals;

        var existingTitles = new List<string>();
        try
        {
            if (!string.IsNullOrWhiteSpace(rule.TargetChannelId) && channelAnalyses is not null)
            {
                var analysis = await channelAnalyses.GetAsync(userId, rule.TargetChannelId, ct).ConfigureAwait(false);
                if (analysis?.Videos is { Count: > 0 })
                    existingTitles.AddRange(analysis.Videos.Select(v => v.Title));
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not query channel analysis for deduplication on channel {ChannelId}", rule.TargetChannelId);
        }

        try
        {
            var recentPubs = await publications.ListByUserAsync(userId, null, 80, ct).ConfigureAwait(false);
            existingTitles.AddRange(recentPubs
                .Where(p => string.IsNullOrWhiteSpace(rule.TargetChannelId)
                    || string.Equals(p.ChannelId, rule.TargetChannelId, StringComparison.OrdinalIgnoreCase))
                .Select(p => p.Title));

            var windowFrom = DateOnly.TryParse(effectiveDate, out var ed) ? ed.AddDays(-21).ToString("yyyy-MM-dd") : null;
            var recentPosts = await repository.ListPostsAsync(userId, windowFrom, effectiveDate, null, 150, ct).ConfigureAwait(false);
            existingTitles.AddRange(recentPosts
                .Where(p => !string.Equals(p.DateKey, effectiveDate, StringComparison.Ordinal)
                    && p.Status != AutomationPostStatus.Skipped
                    && (string.IsNullOrWhiteSpace(rule.TargetChannelId)
                        || string.Equals(p.TargetChannelId, rule.TargetChannelId, StringComparison.OrdinalIgnoreCase)))
                .Select(p => $"{p.SourceTitle} {p.Title}"));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not load publication/post history for deduplication.");
        }

        if (rule.SourceType == AutomationSourceType.DailyKatha)
        {
            var freshKatha = ChannelContentDeduplicator.SelectFreshDailyKatha(
                signals.DailyKatha,
                signals.UpcomingFestivals,
                effectiveDate,
                existingTitles);
            return signals with { DailyKatha = freshKatha };
        }

        var freshHistory = ChannelContentDeduplicator.PrioritizeFreshHistorical(
            signals.HistoricalIncidents,
            existingTitles);
        if (!string.Equals(rule.Language, "hi", StringComparison.OrdinalIgnoreCase))
        {
            freshHistory = freshHistory
                .OrderBy(h => string.Equals(h.Category, "Indian History", StringComparison.OrdinalIgnoreCase) ? 1 : 0)
                .ToList();
        }
        return signals with { HistoricalIncidents = freshHistory };
    }

    /// <summary>
    /// Computes Current Week (Days 0..6) and Next Week Advance Buffer (Days 7..13) readiness per channel (DTC)
    /// and overall pipeline (DPC), producing distinct notification items for incomplete or completed targets.
    /// </summary>
    internal static WeeklyBufferSummary ComputeWeeklyBufferSummary(
        string baseDateKey,
        IReadOnlyList<AutomationRule> rules,
        IReadOnlyList<AutomationPost> posts,
        IReadOnlyList<YouTubeConnectionStatus> connectedChannels,
        StudioEcosystemConfig? ecosystem = null,
        int advanceBufferDays = 14)
    {
        var anchor = DateOnly.TryParse(baseDateKey, out var parsed)
            ? parsed
            : DateOnly.FromDateTime(DateTime.UtcNow);
        var currentWeekDates = Enumerable.Range(0, 7).Select(i => anchor.AddDays(i).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).ToList();
        var nextWeekDates = Enumerable.Range(7, 7).Select(i => anchor.AddDays(i).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).ToList();

        var enabledRules = rules.Where(r => r.Enabled).ToList();
        var activePosts = posts.Where(p => p.Status != AutomationPostStatus.Skipped).ToList();

        static bool AppliesOnDate(AutomationRule rule, string dKey) =>
            rule.DaysOfWeek.Count == 0 || (DateOnly.TryParse(dKey, out var d) && rule.DaysOfWeek.Contains((int)d.DayOfWeek));

        var postsByDateAndRule = activePosts
            .Where(p => !string.IsNullOrWhiteSpace(p.DateKey) && !string.IsNullOrWhiteSpace(p.RuleId))
            .GroupBy(p => $"{p.DateKey}|{p.RuleId}", StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.Ordinal);

        var channelGroups = enabledRules
            .GroupBy(r => string.IsNullOrWhiteSpace(r.TargetChannelId) ? "unassigned" : r.TargetChannelId!, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var channelStatuses = new List<ChannelWeeklyBufferStatus>();
        var totalExpected = 0;
        var totalPrepared = 0;
        var totalVideosReady = 0;
        var totalScheduledOrPublished = 0;

        foreach (var group in channelGroups)
        {
            var groupRules = group.ToList();
            var chKey = group.Key;
            var conn = string.Equals(chKey, "unassigned", StringComparison.OrdinalIgnoreCase)
                ? null
                : connectedChannels.FirstOrDefault(c => string.Equals(c.ChannelId, chKey, StringComparison.OrdinalIgnoreCase));

            var repRule = groupRules[0];
            var chTitle = conn?.ChannelTitle ?? repRule.TargetChannelTitle ?? (chKey == "unassigned" ? "Unassigned Drafts" : chKey);
            var chHandle = conn?.ChannelHandle ?? repRule.TargetChannelHandle;

            var isGlobalEn = IsGlobalEnglishChannelHint(chHandle, chTitle)
                || groupRules.All(r => string.Equals(r.Language, "en", StringComparison.OrdinalIgnoreCase));
            var isComedy = ComedyChannelMatcher.IsComedyChannelHint(chHandle, chTitle)
                || groupRules.Any(r => r.SourceType == AutomationSourceType.FunnyComedy);
            var isDevotional = ComedyChannelMatcher.IsDevotionalOrSeriousChannelHint(chHandle, chTitle)
                || groupRules.Any(r => IsDevotionalSource(r.SourceType));

            var audienceProfile = isGlobalEn ? "GlobalEnglish"
                : isComedy ? "HindiComedy"
                : isDevotional ? "HindiDevotional"
                : "CommunityMulti";
            var lang = isGlobalEn ? "en" : (repRule.Language ?? "hi");
            var sourceLabel = isDevotional ? "Panchang / Katha / Vrat (DPC)"
                : isGlobalEn ? "Global History / Creator Tools (DTC EN)"
                : isComedy ? "3D Comedy Shorts (DTC)"
                : string.Join(", ", groupRules.Select(r => r.SourceType.ToString()).Distinct().Take(3));

            var curDaysReady = 0;
            var curExpected = 0;
            var curPrepared = 0;
            var curReadyOrSched = 0;
            var missingCur = new List<string>();

            var nextDaysReady = 0;
            var nextExpected = 0;
            var nextPrepared = 0;
            var nextReadyOrSched = 0;
            var missingNext = new List<string>();

            var videosReady = 0;
            var thumbsReady = 0;
            var schedOrPub = 0;

            void EvaluateWeek(List<string> dates, ref int daysReady, ref int expected, ref int prepared, ref int readyOrSched, List<string> missing)
            {
                foreach (var d in dates)
                {
                    var dueRules = groupRules.Where(r => AppliesOnDate(r, d)).ToList();
                    if (dueRules.Count == 0) continue;
                    expected += dueRules.Count;
                    var dayComplete = true;
                    foreach (var r in dueRules)
                    {
                        if (postsByDateAndRule.TryGetValue($"{d}|{r.Id}", out var matched) && matched.Count > 0)
                        {
                            prepared++;
                            var p = AutomationPost.SelectPreferred(matched)!;
                            var hasVid = !string.IsNullOrWhiteSpace(p.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(p.AttachedHandoffId);
                            var hasThumb = !string.IsNullOrWhiteSpace(p.ThumbnailStorageKey) || p.ThumbnailFrameAtSeconds.HasValue;
                            var isSchedOrPub = p.Status is AutomationPostStatus.Published or AutomationPostStatus.Publishing or AutomationPostStatus.Approved
                                || p.ScheduledAtUtc.HasValue;
                            if (hasVid) videosReady++;
                            if (hasThumb) thumbsReady++;
                            if (isSchedOrPub) schedOrPub++;
                            if (hasVid || isSchedOrPub) readyOrSched++;
                        }
                        else
                        {
                            dayComplete = false;
                        }
                    }
                    if (dayComplete) daysReady++;
                    else missing.Add(d);
                }
            }

            EvaluateWeek(currentWeekDates, ref curDaysReady, ref curExpected, ref curPrepared, ref curReadyOrSched, missingCur);
            EvaluateWeek(nextWeekDates, ref nextDaysReady, ref nextExpected, ref nextPrepared, ref nextReadyOrSched, missingNext);

            totalExpected += curExpected + nextExpected;
            totalPrepared += curPrepared + nextPrepared;
            totalVideosReady += videosReady;
            totalScheduledOrPublished += schedOrPub;

            var curComplete = curExpected > 0 && missingCur.Count == 0;
            var nextComplete = nextExpected > 0 && missingNext.Count == 0;
            var curStatus = curExpected == 0 || curPrepared == 0 ? "Empty" : curComplete ? "Complete" : "Partial";
            var nextStatus = nextExpected == 0 || nextPrepared == 0 ? "Empty" : nextComplete ? "Complete" : "Partial";

            channelStatuses.Add(new ChannelWeeklyBufferStatus(
                chKey,
                chTitle,
                chHandle,
                audienceProfile,
                lang,
                sourceLabel,
                groupRules.Count,
                TargetDaysPerWeek: 7,
                CurrentWeekPreparedDays: curDaysReady,
                NextWeekPreparedDays: nextDaysReady,
                CurrentWeekExpectedPosts: curExpected,
                CurrentWeekPreparedPosts: curPrepared,
                CurrentWeekReadyOrScheduledPosts: curReadyOrSched,
                NextWeekExpectedPosts: nextExpected,
                NextWeekPreparedPosts: nextPrepared,
                NextWeekReadyOrScheduledPosts: nextReadyOrSched,
                VideosReadyCount: videosReady,
                ThumbnailsReadyCount: thumbsReady,
                ScheduledOrPublishedCount: schedOrPub,
                IsCurrentWeekComplete: curComplete,
                IsNextWeekComplete: nextComplete,
                CurrentWeekStatus: curStatus,
                NextWeekStatus: nextStatus,
                MissingCurrentWeekDates: missingCur,
                MissingNextWeekDates: missingNext));
        }

        var isAllCurrentComplete = channelStatuses.Count > 0 && channelStatuses.All(c => c.IsCurrentWeekComplete);
        var isAllNextComplete = channelStatuses.Count > 0 && channelStatuses.All(c => c.IsNextWeekComplete);
        var notifications = new List<WeeklyNotificationItem>();

        if (channelStatuses.Count == 0)
        {
            notifications.Add(new WeeklyNotificationItem(
                "notif-no-pipelines",
                "urgent",
                "PIPELINES EMPTY",
                "No Active DPC / DTC Channel Pipelines Configured",
                "Click Auto-Setup Ecosystem Pipelines so 7-day Current Week + 7-day Next Week buffers can be generated automatically.",
                "Auto-Setup Pipelines",
                null));
        }
        else
        {
            var curMissingTotal = channelStatuses.Sum(c => c.MissingCurrentWeekDates.Count);
            notifications.Add(new WeeklyNotificationItem(
                "notif-current-week",
                isAllCurrentComplete ? "success" : "urgent",
                "CURRENT WEEK (7 DAYS)",
                isAllCurrentComplete
                    ? "Current Week Content Target Complete (7/7 Days Ready)"
                    : $"Current Week Target Incomplete — {curMissingTotal} Channel-Day(s) Missing",
                isAllCurrentComplete
                    ? $"All {channelStatuses.Count} active DTC channel(s) have complete scripts, verified facts & SEO packaging across {currentWeekDates[0]} → {currentWeekDates[^1]}."
                    : "Fill missing Current Week days in 1 click so today and this week run on zero daily stress.",
                isAllCurrentComplete ? null : "Fill Current Week",
                null));

            var nextMissingTotal = channelStatuses.Sum(c => c.MissingNextWeekDates.Count);
            notifications.Add(new WeeklyNotificationItem(
                "notif-next-week",
                isAllNextComplete ? "success" : "warning",
                "NEXT WEEK ADVANCE (7 DAYS)",
                isAllNextComplete
                    ? "Next Week Advance Buffer Complete (1 Week Prepared Ahead)"
                    : $"Next Week Advance Buffer Pending — {nextMissingTotal} Day(s) Need Pre-Prep",
                isAllNextComplete
                    ? $"Next week ({nextWeekDates[0]} → {nextWeekDates[^1]}) is already prepared 1 week in advance for stress-free peak SEO publishing."
                    : "Prepare next week's content in advance (quality-first deduplicated pipeline) so you only review and refine without deadline pressure.",
                isAllNextComplete ? null : "Prepare 14-Day Buffer",
                null));

            foreach (var ch in channelStatuses.Where(c => !c.IsCurrentWeekComplete || !c.IsNextWeekComplete))
            {
                notifications.Add(new WeeklyNotificationItem(
                    $"notif-ch-{ch.ChannelKey}",
                    !ch.IsCurrentWeekComplete ? "warning" : "warning",
                    ch.AudienceProfile == "GlobalEnglish" ? "GLOBAL EN (DTC)" : "HINDI DTC CHANNEL",
                    $"{ch.ChannelTitle}: This Week {ch.CurrentWeekPreparedDays}/7 • Next Week {ch.NextWeekPreparedDays}/7",
                    $"Missing This Week: {(ch.MissingCurrentWeekDates.Count == 0 ? "None" : string.Join(", ", ch.MissingCurrentWeekDates.Take(3)))} | Missing Next Week: {(ch.MissingNextWeekDates.Count == 0 ? "None" : string.Join(", ", ch.MissingNextWeekDates.Take(3)))}",
                    "Fill Channel Buffer",
                    ch.ChannelKey == "unassigned" ? null : ch.ChannelKey));
            }
        }

        return new WeeklyBufferSummary(
            anchor.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            currentWeekDates[0],
            currentWeekDates[^1],
            nextWeekDates[0],
            nextWeekDates[^1],
            Math.Clamp(advanceBufferDays, 7, 14),
            totalExpected,
            totalPrepared,
            totalVideosReady,
            totalScheduledOrPublished,
            isAllCurrentComplete,
            isAllNextComplete,
            channelStatuses,
            notifications);
    }

    /// <summary>
    /// Pre-prepares missing content slots across Current Week + Next Week (up to 14 days in advance)
    /// without duplicating already-prepared quality drafts.
    /// </summary>
    public async Task<PrepareBufferHorizonResult> PrepareBufferHorizonAsync(
        string userId,
        PrepareBufferHorizonRequest request,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var startDateKey = ResolveDateKey(request.StartDateKey, settings.DefaultTimeZone);
        var anchor = DateOnly.Parse(startDateKey, CultureInfo.InvariantCulture);
        var days = Math.Clamp(request.Days, 1, 14);
        var warnings = new List<string>();

        var rules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        if (rules.Count == 0)
        {
            await BootstrapDefaultRulesAsync(userId, ct).ConfigureAwait(false);
        }
        if (request.RebalanceChannels)
        {
            await RebalanceStarterChannelsAsync(userId, ct).ConfigureAwait(false);
            rules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        }

        var enabledRules = rules
            .Where(r => r.Enabled && (string.IsNullOrWhiteSpace(request.ChannelId) || string.Equals(r.TargetChannelId, request.ChannelId, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var toDateKey = anchor.AddDays(days - 1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var existingPosts = (await repository.ListPostsAsync(userId, startDateKey, toDateKey, null, 600, ct).ConfigureAwait(false))
            .Where(p => p.Status != AutomationPostStatus.Skipped)
            .ToList();
        var existingKeys = existingPosts
            .Select(p => $"{p.DateKey}|{p.RuleId}")
            .ToHashSet(StringComparer.Ordinal);

        var daysNewlyPrepared = 0;
        var postsCreated = 0;
        var postsUpdated = 0;

        for (var offset = 0; offset < days; offset++)
        {
            var date = anchor.AddDays(offset);
            var dKey = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var dow = (int)date.DayOfWeek;
            var dueRules = enabledRules.Where(r => r.DaysOfWeek.Count == 0 || r.DaysOfWeek.Contains(dow)).ToList();
            if (dueRules.Count == 0) continue;

            var missingRules = request.ForceRegenerate
                ? dueRules
                : dueRules.Where(r => !existingKeys.Contains($"{dKey}|{r.Id}")).ToList();

            if (missingRules.Count == 0) continue;

            if (string.IsNullOrWhiteSpace(request.ChannelId) && missingRules.Count == dueRules.Count)
            {
                var res = await PrepareForDateAsync(userId, dKey, ruleId: null, forceRegenerate: request.ForceRegenerate, ct).ConfigureAwait(false);
                postsCreated += res.PostsCreated;
                postsUpdated += res.PostsUpdated;
                foreach (var w in res.Warnings.Take(2))
                    if (!warnings.Contains(w, StringComparer.Ordinal)) warnings.Add(w);
            }
            else
            {
                foreach (var r in missingRules)
                {
                    var res = await PrepareForDateAsync(userId, dKey, ruleId: r.Id, forceRegenerate: request.ForceRegenerate, ct).ConfigureAwait(false);
                    postsCreated += res.PostsCreated;
                    postsUpdated += res.PostsUpdated;
                    foreach (var w in res.Warnings.Take(2))
                        if (!warnings.Contains(w, StringComparer.Ordinal)) warnings.Add(w);
                }
            }
            daysNewlyPrepared++;
        }

        var refreshedRules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        var windowEnd = anchor.AddDays(13).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var refreshedPosts = await repository.ListPostsAsync(userId, startDateKey, windowEnd, null, 600, ct).ConfigureAwait(false);
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var summary = ComputeWeeklyBufferSummary(startDateKey, refreshedRules, refreshedPosts, connected, ecosystem, settings.AdvanceBufferDays);

        return new PrepareBufferHorizonResult(
            startDateKey,
            days,
            daysNewlyPrepared,
            postsCreated,
            postsUpdated,
            warnings,
            summary);
    }
}
