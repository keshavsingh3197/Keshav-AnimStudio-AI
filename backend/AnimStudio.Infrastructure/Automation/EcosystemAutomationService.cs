using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

public sealed record AutomationVideoCandidate(
    string Kind,
    string Id,
    string Title,
    string? TopicId,
    string? TopicName,
    double? DurationSeconds,
    long? SizeBytes,
    bool IsVertical,
    bool IsUsed,
    DateTime CreatedAtUtc);

public sealed record AutomationPrepareResult(
    string DateKey,
    int RulesEvaluated,
    int PostsCreated,
    int PostsUpdated,
    int AutoVideosStarted,
    int AutoQueuedOrPublished,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<AutomationPost> Posts);

public sealed record AutomationOverview(
    string DateKey,
    AutomationWorkspaceConfig Settings,
    EcosystemSignalsSnapshot Signals,
    IReadOnlyList<EcosystemWebsiteItem> Websites,
    IReadOnlyList<YouTubeConnectionStatus> ConnectedChannels,
    IReadOnlyList<ContentTopic> Topics,
    IReadOnlyList<AutomationRule> Rules,
    IReadOnlyList<AutomationPost> Posts,
    int UnusedDriveClipsCount,
    int FinishedRendersCount);

/// <summary>
/// Central orchestration engine connecting live Hindu Panchang, Festivals, Daily Katha,
/// Aaj Ka Itihaas, Pratiyogita, and Central Admin ecosystem links with AnimStudio's Drive
/// Library, AI Story Agent renderer, Publishing Board, and YouTube uploaders.
/// </summary>
public sealed class EcosystemAutomationService(
    IAutomationRepository repository,
    IWebSettingRepository webSettings,
    IEcosystemSignalsClient signalsClient,
    IEcosystemConfigProvider ecosystemProvider,
    YouTubeConnectionStore connections,
    IYouTubePublicationRepository publications,
    GoogleDriveConnectionStore driveStore,
    GoogleDriveClient driveClient,
    IPhoneHandoffRepository handoffs,
    IRenderJobRepository renderJobs,
    IProjectRepository projects,
    IContentTopicRepository topicsRepo,
    ContentPlanningService planning,
    PublishQueueService publishQueue,
    YouTubeUploadManager uploadManager,
    StoryRunService storyRuns,
    IAiExecutor ai,
    IObjectStore objectStore,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<EcosystemAutomationService> logger)
{
    private const string WorkspaceConfigKey = "Automation:Workspace:Config";
    private const string StagingFolderName = "automation-staging";
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private DateTime UtcNow => clock.GetUtcNow().UtcDateTime;

    public async Task<AutomationWorkspaceConfig> GetWorkspaceConfigAsync(CancellationToken ct)
    {
        var all = await webSettings.ListAsync(ct).ConfigureAwait(false);
        var row = all.FirstOrDefault(s => string.Equals(s.Id, WorkspaceConfigKey, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(row?.Value))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<AutomationWorkspaceConfig>(row.Value, JsonOpts);
                if (parsed is not null) return parsed;
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Stored automation workspace config could not be parsed; using defaults.");
            }
        }
        return new AutomationWorkspaceConfig { UpdatedAtUtc = UtcNow };
    }

    public async Task<AutomationWorkspaceConfig> SaveWorkspaceConfigAsync(
        AutomationWorkspaceConfig config,
        string? actorUserId,
        CancellationToken ct)
    {
        config.DefaultLocation = string.IsNullOrWhiteSpace(config.DefaultLocation) ? "New Delhi, India" : config.DefaultLocation.Trim();
        config.DefaultTimeZone = string.IsNullOrWhiteSpace(config.DefaultTimeZone) ? "Asia/Kolkata" : config.DefaultTimeZone.Trim();
        config.PanchangApiBaseUrl = NormalizeOptionalUrl(config.PanchangApiBaseUrl, "Panchang API URL");
        config.SocialApiBaseUrl = NormalizeOptionalUrl(config.SocialApiBaseUrl, "Social Analytics API URL");
        config.PratiyogitaApiBaseUrl = NormalizeOptionalUrl(config.PratiyogitaApiBaseUrl, "Pratiyogita API URL");
        config.UpdatedAtUtc = UtcNow;

        await webSettings.UpsertAsync(new WebSetting
        {
            Id = WorkspaceConfigKey,
            Value = JsonSerializer.Serialize(config, JsonOpts),
            UpdatedAt = config.UpdatedAtUtc,
            UpdatedByUserId = actorUserId
        }, ct).ConfigureAwait(false);

        return config;
    }

    public async Task<AutomationOverview> GetOverviewAsync(string userId, string? dateKey, CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var effectiveDate = ResolveDateKey(dateKey, settings.DefaultTimeZone);

        var ecosystemTask = ecosystemProvider.GetAsync(forceRefresh: false, ct);
        var signalsTask = signalsClient.FetchAsync(
            effectiveDate,
            settings.DefaultLocation,
            settings.PanchangApiBaseUrl,
            settings.SocialApiBaseUrl,
            settings.PratiyogitaApiBaseUrl,
            ct);
        var channelsTask = connections.ListAsync(userId, ct);
        var topicsTask = topicsRepo.ListByUserAsync(userId, ct);
        var rulesTask = repository.ListRulesAsync(userId, ct);
        var postsTask = repository.ListPostsAsync(
            userId,
            DateOnly.Parse(effectiveDate).AddDays(-7).ToString("yyyy-MM-dd"),
            DateOnly.Parse(effectiveDate).AddDays(7).ToString("yyyy-MM-dd"),
            null,
            200,
            ct);
        var handoffsTask = handoffs.ListByUserAsync(userId, null, 500, ct);
        var projectsTask = projects.ListAsync(userId, ct);

        await Task.WhenAll(ecosystemTask, signalsTask, channelsTask, topicsTask, rulesTask, postsTask, handoffsTask, projectsTask)
            .ConfigureAwait(false);

        var unusedDriveCount = handoffsTask.Result.Count(h =>
            h.State != PhoneHandoffState.Cancelled && !h.DriveMissing && !h.Archived && h.UsedAt is null);

        var finishedRenders = 0;
        foreach (var project in projectsTask.Result.Take(40))
        {
            var jobs = await renderJobs.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);
            finishedRenders += jobs.Count(j =>
                j.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings
                && !string.IsNullOrWhiteSpace(j.OutputStorageKey));
        }

        return new AutomationOverview(
            effectiveDate,
            settings,
            signalsTask.Result,
            ecosystemTask.Result.Websites,
            channelsTask.Result,
            topicsTask.Result,
            rulesTask.Result,
            postsTask.Result,
            unusedDriveCount,
            finishedRenders);
    }

    public Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct) =>
        repository.ListRulesAsync(userId, ct);

    public async Task<AutomationRule> SaveRuleAsync(string userId, string? id, AutomationRule draft, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(draft.Name))
            throw EditingException.Invalid("rule-name-required", "Give this automation pipeline a clear name.");

        AutomationRule rule;
        if (!string.IsNullOrWhiteSpace(id))
        {
            rule = await repository.GetRuleAsync(id.Trim(), ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();
            if (!string.Equals(rule.UserId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException();
        }
        else
        {
            rule = new AutomationRule
            {
                Id = $"ar_{Guid.NewGuid():n}",
                UserId = userId,
                CreatedAtUtc = UtcNow
            };
        }

        rule.Name = draft.Name.Trim();
        rule.Description = string.IsNullOrWhiteSpace(draft.Description) ? null : draft.Description.Trim();
        rule.Enabled = draft.Enabled;
        rule.SourceType = draft.SourceType;
        rule.Mode = draft.Mode;
        rule.VideoStrategy = draft.VideoStrategy;
        rule.VideoFormat = draft.VideoFormat;
        rule.TargetChannelId = string.IsNullOrWhiteSpace(draft.TargetChannelId) ? null : draft.TargetChannelId.Trim();
        rule.TargetChannelHandle = string.IsNullOrWhiteSpace(draft.TargetChannelHandle) ? null : draft.TargetChannelHandle.Trim();
        rule.TargetChannelTitle = string.IsNullOrWhiteSpace(draft.TargetChannelTitle) ? null : draft.TargetChannelTitle.Trim();
        rule.BrandChannelId = string.IsNullOrWhiteSpace(draft.BrandChannelId) ? null : draft.BrandChannelId.Trim();
        rule.TopicId = string.IsNullOrWhiteSpace(draft.TopicId) ? null : draft.TopicId.Trim();
        rule.TopicName = string.IsNullOrWhiteSpace(draft.TopicName) ? null : draft.TopicName.Trim();
        rule.Language = string.IsNullOrWhiteSpace(draft.Language) ? "hi" : draft.Language.Trim().ToLowerInvariant();
        rule.TargetSeconds = Math.Clamp(draft.TargetSeconds, 20, 900);
        rule.Location = string.IsNullOrWhiteSpace(draft.Location) ? "New Delhi, India" : draft.Location.Trim();
        rule.PreferredPublishTime = NormalizeTimeHhMm(draft.PreferredPublishTime);
        rule.TimeZoneId = string.IsNullOrWhiteSpace(draft.TimeZoneId) ? "Asia/Kolkata" : draft.TimeZoneId.Trim();
        rule.DaysOfWeek = draft.DaysOfWeek.Where(d => d is >= 0 and <= 6).Distinct().OrderBy(d => d).ToList();
        rule.FestivalLeadDays = Math.Clamp(draft.FestivalLeadDays, 0, 7);
        rule.FunnelWebsiteKeys = draft.FunnelWebsiteKeys.Where(k => !string.IsNullOrWhiteSpace(k)).Select(k => k.Trim().ToLowerInvariant()).Distinct().ToList();
        rule.SocialFunnelSlug = string.IsNullOrWhiteSpace(draft.SocialFunnelSlug) ? null : draft.SocialFunnelSlug.Trim();
        rule.Privacy = YouTubePublishValidator.Privacies.Contains(draft.Privacy, StringComparer.OrdinalIgnoreCase) ? draft.Privacy.ToLowerInvariant() : "public";
        rule.CategoryId = YouTubePublishValidator.Categories.ContainsKey(draft.CategoryId ?? string.Empty) ? draft.CategoryId! : "22";
        rule.MadeForKids = draft.MadeForKids;
        rule.IncludePinnedComment = draft.IncludePinnedComment;
        rule.PromptTemplateOverride = string.IsNullOrWhiteSpace(draft.PromptTemplateOverride) ? null : draft.PromptTemplateOverride.Trim();
        rule.DescriptionFooterOverride = string.IsNullOrWhiteSpace(draft.DescriptionFooterOverride) ? null : draft.DescriptionFooterOverride.Trim();
        rule.CustomTopicPrompt = string.IsNullOrWhiteSpace(draft.CustomTopicPrompt) ? null : draft.CustomTopicPrompt.Trim();
        rule.SortOrder = draft.SortOrder;
        rule.UpdatedAtUtc = UtcNow;

        if (!string.IsNullOrWhiteSpace(rule.TargetChannelId))
        {
            var conn = await connections.GetAsync(userId, rule.TargetChannelId, ct).ConfigureAwait(false);
            if (conn is not null)
            {
                rule.TargetChannelTitle = conn.ChannelTitle;
                rule.TargetChannelHandle = conn.ChannelHandle;
            }
        }

        await repository.UpsertRuleAsync(rule, ct).ConfigureAwait(false);
        return rule;
    }

    public async Task DeleteRuleAsync(string userId, string id, CancellationToken ct)
    {
        var existing = await repository.GetRuleAsync(id, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(existing.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
        await repository.DeleteRuleAsync(id, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Dynamically creates sensible starter rules matched to the user's actually connected YouTube channels
    /// and Central Admin channel metadata — zero channel handles or IDs are hardcoded in source.
    /// </summary>
    public async Task<IReadOnlyList<AutomationRule>> BootstrapDefaultRulesAsync(string userId, CancellationToken ct)
    {
        var existing = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        if (existing.Count > 0) return existing;

        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var topics = (await topicsRepo.ListByUserAsync(userId, ct).ConfigureAwait(false)).ToList();

        var devotionalChannel = MatchConnectedChannel(connected, ecosystem, ["bhakti", "shiv", "hindu", "panchang", "devotional", "sanatan", "katha", "omkar"])
            ?? MatchCentralChannel(ecosystem, ["bhakti", "shiv", "hindu", "panchang", "devotional", "sanatan"]);

        var worldChannel = MatchConnectedChannel(connected, ecosystem, ["world", "history", "tech", "knowledge", "keshav", "ai", "fact", "education"])
            ?? MatchCentralChannel(ecosystem, ["world", "history", "tech", "knowledge", "keshav", "ai"])
            ?? devotionalChannel;

        var panchangTopic = await EnsureTopicAsync(userId, topics, "Hindu Panchang & Muhurat", devotionalChannel?.ChannelId, devotionalChannel?.Title, ct).ConfigureAwait(false);
        var festivalTopic = await EnsureTopicAsync(userId, topics, "Hindu Festivals & Vrat", devotionalChannel?.ChannelId, devotionalChannel?.Title, ct).ConfigureAwait(false);
        var kathaTopic = await EnsureTopicAsync(userId, topics, "Daily Vedic Katha", devotionalChannel?.ChannelId, devotionalChannel?.Title, ct).ConfigureAwait(false);
        var historyTopic = await EnsureTopicAsync(userId, topics, "Aaj Ka Itihaas", worldChannel?.ChannelId, worldChannel?.Title, ct).ConfigureAwait(false);
        var spotlightTopic = await EnsureTopicAsync(userId, topics, "Pratiyogita & Creator Ecosystem", worldChannel?.ChannelId, worldChannel?.Title, ct).ConfigureAwait(false);

        var now = UtcNow;
        var defaults = new[]
        {
            BuildStarterRule(userId, 1, "Daily Hindu Panchang & Muhurat", "Morning Tithi, Nakshatra, Abhijit Muhurat, Rahu Kaal & Sanskrit Sutra routed to devotional channel.",
                AutomationSourceType.HinduPanchang, devotionalChannel, panchangTopic, "06:30", settings, ["panchang", "studio"], "22", now),
            BuildStarterRule(userId, 2, "Upcoming Festivals, Ekadashi & Vrat Alert", "Automatic Puja Vidhi & significance alerts from the Panchang festival engine.",
                AutomationSourceType.HinduFestival, devotionalChannel, festivalTopic, "07:15", settings, ["panchang", "studio"], "22", now),
            BuildStarterRule(userId, 3, "Evening Daily Vedic Katha & Mantra", "Sacred spiritual story + mantra from Hindu Panchang cultural feed.",
                AutomationSourceType.DailyKatha, devotionalChannel, kathaTopic, "19:00", settings, ["panchang", "studio"], "22", now),
            BuildStarterRule(userId, 4, "Aaj Ka Itihaas (On This Day History)", "Historical events & milestones for world/knowledge channel linking back to Archive & Exam GK.",
                AutomationSourceType.AajKaItihaas, worldChannel, historyTopic, "18:00", settings, ["panchang", "pratiyogita", "blog", "studio"], "27", now),
            BuildStarterRule(userId, 5, "Pratiyogita & Ecosystem Growth Spotlight", "Promotes live quizzes/competitions, AI video tools & analytics portal to build cross-site traffic.",
                AutomationSourceType.EcosystemSpotlight, worldChannel, spotlightTopic, "20:30", settings, ["pratiyogita", "social", "studio", "blog"], "28", now),
        };

        foreach (var r in defaults)
        {
            await repository.UpsertRuleAsync(r, ct).ConfigureAwait(false);
        }
        return defaults;
    }

    public async Task<AutomationPrepareResult> PrepareForDateAsync(
        string userId,
        string? dateKey,
        string? ruleId,
        bool forceRegenerate,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var effectiveDate = ResolveDateKey(dateKey, settings.DefaultTimeZone);
        var rules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        var selectedRules = string.IsNullOrWhiteSpace(ruleId)
            ? rules.Where(r => r.Enabled).ToList()
            : rules.Where(r => string.Equals(r.Id, ruleId.Trim(), StringComparison.Ordinal)).ToList();

        if (selectedRules.Count == 0)
        {
            return new AutomationPrepareResult(effectiveDate, 0, 0, 0, 0, 0, ["No enabled automation rules found. Create or bootstrap rules first."], []);
        }

        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var leadLocation = selectedRules.FirstOrDefault()?.Location ?? settings.DefaultLocation;
        var signals = await signalsClient.FetchAsync(
            effectiveDate,
            leadLocation,
            settings.PanchangApiBaseUrl,
            settings.SocialApiBaseUrl,
            settings.PratiyogitaApiBaseUrl,
            ct).ConfigureAwait(false);

        var targetDay = DateOnly.Parse(effectiveDate).DayOfWeek;
        var userHandoffs = await handoffs.ListByUserAsync(userId, null, 500, ct).ConfigureAwait(false);
        var usedHandoffIds = (await repository.ListPostsAsync(userId, null, null, null, 400, ct).ConfigureAwait(false))
            .Where(p => p.AttachedHandoffId is not null && p.Status != AutomationPostStatus.Skipped)
            .Select(p => p.AttachedHandoffId!)
            .ToHashSet(StringComparer.Ordinal);

        var userRenders = await LoadFinishedRendersAsync(userId, ct).ConfigureAwait(false);
        var created = 0;
        var updated = 0;
        var autoVideosStarted = 0;
        var autoQueued = 0;
        var touchedPosts = new List<AutomationPost>();

        foreach (var rule in selectedRules)
        {
            if (string.IsNullOrWhiteSpace(ruleId) && rule.DaysOfWeek.Count > 0 && !rule.DaysOfWeek.Contains((int)targetDay))
                continue;

            var ruleSignals = string.Equals(rule.Location, leadLocation, StringComparison.OrdinalIgnoreCase)
                ? signals
                : await signalsClient.FetchAsync(effectiveDate, rule.Location, settings.PanchangApiBaseUrl, settings.SocialApiBaseUrl, settings.PratiyogitaApiBaseUrl, ct).ConfigureAwait(false);

            var composedItems = AutomationContentComposer.ComposeForRule(rule, ruleSignals, ecosystem);
            foreach (var composed in composedItems)
            {
                var fingerprint = $"{effectiveDate}:{rule.Id}:{composed.SourceItemKey}".ToLowerInvariant();
                var existing = await repository.FindPostByFingerprintAsync(userId, fingerprint, ct).ConfigureAwait(false);

                if (existing is not null && !forceRegenerate)
                {
                    touchedPosts.Add(existing);
                    continue;
                }
                if (existing is { Status: AutomationPostStatus.Publishing or AutomationPostStatus.Published })
                {
                    touchedPosts.Add(existing);
                    continue;
                }

                var refined = settings.UseAiScriptRefinement
                    ? await TryRefineWithAiAsync(userId, rule, composed, ct).ConfigureAwait(false)
                    : (Content: composed, UsedAi: false);

                var scheduledUtc = ComputeScheduledUtc(effectiveDate, rule.PreferredPublishTime, rule.TimeZoneId);
                var post = existing ?? new AutomationPost
                {
                    Id = $"ap_{Guid.NewGuid():n}",
                    UserId = userId,
                    RuleId = rule.Id,
                    CreatedAtUtc = UtcNow
                };

                post.RuleName = rule.Name;
                post.SourceType = rule.SourceType;
                post.DateKey = effectiveDate;
                post.Fingerprint = fingerprint;
                post.SourceItemKey = composed.SourceItemKey;
                post.SourceTitle = composed.SourceTitle;
                post.SourceSummary = composed.SourceSummary;
                post.TargetChannelId = rule.TargetChannelId;
                post.TargetChannelHandle = rule.TargetChannelHandle;
                post.TargetChannelTitle = rule.TargetChannelTitle;
                post.TopicId = rule.TopicId;
                post.TopicName = rule.TopicName;
                post.Title = refined.Content.Title;
                post.Script = refined.Content.Script;
                post.AiVideoPrompt = refined.Content.AiVideoPrompt;
                post.AiThumbnailPrompt = refined.Content.AiThumbnailPrompt;
                post.Description = refined.Content.Description;
                post.PinnedComment = refined.Content.PinnedComment;
                post.Tags = [.. refined.Content.Tags];
                post.CategoryId = rule.CategoryId;
                post.Privacy = rule.Privacy;
                post.MadeForKids = rule.MadeForKids;
                post.Format = rule.VideoFormat;
                post.Language = rule.Language;
                post.PrimaryDestinationUrl = refined.Content.PrimaryDestinationUrl;
                post.TrackedFunnelUrls = [.. refined.Content.TrackedLinks];
                post.ScheduledAtUtc ??= scheduledUtc;
                post.GeneratedByAi = refined.UsedAi;
                post.UpdatedAtUtc = UtcNow;

                var hasVideo = !string.IsNullOrWhiteSpace(post.AttachedHandoffId) || !string.IsNullOrWhiteSpace(post.AttachedRenderJobId);
                if (!hasVideo)
                {
                    var (attached, startedAi) = await TryResolveVideoAsync(userId, rule, post, userHandoffs, usedHandoffIds, userRenders, ct).ConfigureAwait(false);
                    if (startedAi) autoVideosStarted++;
                    if (attached && post.AttachedHandoffId is not null) usedHandoffIds.Add(post.AttachedHandoffId);
                }

                if (rule.Mode == AutomationPostMode.FullAutopilot
                    && settings.GlobalAutopilotEnabled
                    && !string.IsNullOrWhiteSpace(post.TargetChannelId)
                    && (!string.IsNullOrWhiteSpace(post.AttachedHandoffId) || !string.IsNullOrWhiteSpace(post.AttachedRenderJobId)))
                {
                    post.Status = AutomationPostStatus.Approved;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    if (!post.ScheduledAtUtc.HasValue || post.ScheduledAtUtc.Value <= UtcNow)
                    {
                        await ExecutePublishAsync(userId, post, publishNow: true, scheduledAtUtc: null, ct).ConfigureAwait(false);
                    }
                    autoQueued++;
                }
                else
                {
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                }

                if (existing is null) created++;
                else updated++;

                touchedPosts.Add(post);
            }

            rule.LastPreparedDateKey = effectiveDate;
            rule.UpdatedAtUtc = UtcNow;
            await repository.UpsertRuleAsync(rule, ct).ConfigureAwait(false);
        }

        return new AutomationPrepareResult(
            effectiveDate,
            selectedRules.Count,
            created,
            updated,
            autoVideosStarted,
            autoQueued,
            signals.Warnings,
            touchedPosts);
    }

    public Task<IReadOnlyList<AutomationPost>> ListPostsAsync(
        string userId,
        string? fromDateKey,
        string? toDateKey,
        AutomationPostStatus? status,
        int limit,
        CancellationToken ct) =>
        repository.ListPostsAsync(userId, fromDateKey, toDateKey, status, limit, ct);

    public async Task<AutomationPost> UpdatePostAsync(
        string userId,
        string postId,
        AutomationPost update,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot edit a post while uploading or after it is published.");

        if (!string.IsNullOrWhiteSpace(update.Title)) post.Title = update.Title.Trim();
        if (update.Script is not null) post.Script = update.Script.Trim();
        if (update.AiVideoPrompt is not null) post.AiVideoPrompt = update.AiVideoPrompt.Trim();
        if (update.AiThumbnailPrompt is not null) post.AiThumbnailPrompt = update.AiThumbnailPrompt.Trim();
        if (update.Description is not null) post.Description = update.Description.Trim();
        post.PinnedComment = string.IsNullOrWhiteSpace(update.PinnedComment) ? null : update.PinnedComment.Trim();
        if (update.Tags.Count > 0) post.Tags = [.. update.Tags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim())];
        if (!string.IsNullOrWhiteSpace(update.Privacy) && YouTubePublishValidator.Privacies.Contains(update.Privacy, StringComparer.OrdinalIgnoreCase))
            post.Privacy = update.Privacy.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(update.CategoryId) && YouTubePublishValidator.Categories.ContainsKey(update.CategoryId))
            post.CategoryId = update.CategoryId;
        if (update.TargetChannelId is not null)
        {
            post.TargetChannelId = string.IsNullOrWhiteSpace(update.TargetChannelId) ? null : update.TargetChannelId.Trim();
            if (post.TargetChannelId is not null && await connections.GetAsync(userId, post.TargetChannelId, ct).ConfigureAwait(false) is { } conn)
            {
                post.TargetChannelTitle = conn.ChannelTitle;
                post.TargetChannelHandle = conn.ChannelHandle;
            }
        }
        post.ScheduledAtUtc = update.ScheduledAtUtc ?? post.ScheduledAtUtc;
        if (update.Status == AutomationPostStatus.Skipped)
            post.Status = AutomationPostStatus.Skipped;
        post.Notes = string.IsNullOrWhiteSpace(update.Notes) ? null : update.Notes.Trim();
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<IReadOnlyList<AutomationVideoCandidate>> ListVideoCandidatesAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        var topicsMap = (await topicsRepo.ListByUserAsync(userId, ct).ConfigureAwait(false))
            .ToDictionary(t => t.Id, t => t.Name, StringComparer.Ordinal);
        var allHandoffs = await handoffs.ListByUserAsync(userId, null, 200, ct).ConfigureAwait(false);
        var renders = await LoadFinishedRendersAsync(userId, ct).ConfigureAwait(false);

        var candidates = new List<AutomationVideoCandidate>();
        foreach (var h in allHandoffs.Where(h =>
                     h.State != PhoneHandoffState.Cancelled && !h.DriveMissing &&
                     (h.DriveFileId is not null || !string.IsNullOrWhiteSpace(h.JobId))))
        {
            var isUsed = h.UsedAt.HasValue || h.Archived;
            candidates.Add(new AutomationVideoCandidate(
                "drive",
                h.Id,
                h.Title,
                h.TopicId,
                h.TopicId is not null && topicsMap.TryGetValue(h.TopicId, out var tn) ? tn : h.Topic,
                h.DurationSeconds,
                h.TotalBytes > 0 ? h.TotalBytes : null,
                true,
                isUsed,
                h.CreatedAt));
        }

        foreach (var r in renders.Take(50))
        {
            var resolvedTopicName = r.TopicId is not null && topicsMap.TryGetValue(r.TopicId, out var rtn) ? rtn : null;
            candidates.Add(new AutomationVideoCandidate(
                "render",
                r.Id,
                r.Name ?? resolvedTopicName ?? r.OutputStorageKey ?? r.Id,
                r.TopicId,
                resolvedTopicName,
                r.Diagnostics?.OutputDurationSeconds,
                r.OutputSizeBytes,
                r.Height > r.Width,
                false,
                r.CreatedAt));
        }

        return [.. candidates
            .OrderByDescending(c => !c.IsUsed)
            .ThenByDescending(c => !string.IsNullOrWhiteSpace(post.TopicId) && string.Equals(c.TopicId, post.TopicId, StringComparison.Ordinal))
            .ThenByDescending(c => c.CreatedAtUtc)];
    }

    public async Task<AutomationPost> AttachVideoAsync(
        string userId,
        string postId,
        string? handoffId,
        string? renderJobId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "This post is already uploading or published.");

        if (!string.IsNullOrWhiteSpace(renderJobId))
        {
            var job = await renderJobs.GetAsync(renderJobId.Trim(), ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();
            var project = await projects.GetAsync(job.ProjectId, ct).ConfigureAwait(false);
            if (project is null || !string.Equals(project.UserId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException();
            if (job.Status is not (RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings) || string.IsNullOrWhiteSpace(job.OutputStorageKey))
                throw EditingException.Invalid("render-not-ready", "Choose a finished render with an output video.");

            post.AttachedRenderJobId = job.Id;
            post.AttachedHandoffId = null;
            post.AttachedHandoffTitle = project.Name;
            post.AttachedVideoSourceLabel = $"Studio Render ({project.Name})";
            post.Status = AutomationPostStatus.VideoReadyForReview;
            post.LastError = null;
        }
        else if (!string.IsNullOrWhiteSpace(handoffId))
        {
            var h = await handoffs.GetAsync(handoffId.Trim(), ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();
            if (!string.Equals(h.UserId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException();

            post.AttachedHandoffId = h.Id;
            post.AttachedHandoffTitle = h.Title;
            post.AttachedRenderJobId = !string.IsNullOrWhiteSpace(h.JobId) && !h.JobId.StartsWith("drive-", StringComparison.Ordinal)
                ? h.JobId
                : null;
            post.AttachedVideoSourceLabel = string.IsNullOrWhiteSpace(h.Topic)
                ? $"Drive Library: {h.Title}"
                : $"Drive [{h.Topic}]: {h.Title}";
            post.Status = AutomationPostStatus.VideoReadyForReview;
            post.LastError = null;
        }
        else
        {
            post.AttachedHandoffId = null;
            post.AttachedHandoffTitle = null;
            post.AttachedRenderJobId = null;
            post.AttachedVideoSourceLabel = null;
            post.Status = AutomationPostStatus.PreparedPreview;
        }

        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> GenerateAiVideoAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");

        var run = await StartStoryRunForPostAsync(userId, post, await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false), ct)
            .ConfigureAwait(false);

        post.AttachedStoryRunId = run.Id;
        post.AttachedVideoSourceLabel = $"AI Story Agent ({run.Status})";
        post.Status = AutomationPostStatus.GeneratingVideo;
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> ApproveAndPublishAsync(
        string userId,
        string postId,
        bool publishNow,
        DateTime? scheduledAtUtc,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        return await ExecutePublishAsync(userId, post, publishNow, scheduledAtUtc, ct).ConfigureAwait(false);
    }

    public async Task DeletePostAsync(string userId, string postId, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status == AutomationPostStatus.Publishing)
            throw EditingException.Conflict("post-uploading", "Wait for the upload to finish before deleting.");
        await repository.DeletePostAsync(postId, ct).ConfigureAwait(false);
    }

    /// <summary>Called periodically by <see cref="DailyEcosystemPostWorker"/>.</summary>
    internal async Task<int> ProcessBackgroundTickAsync(CancellationToken ct)
    {
        var changed = 0;
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);

        // 1. Advance GeneratingVideo / Approved / Publishing posts
        var activePosts = await repository.ListPostsByStatusesAsync(
            [AutomationPostStatus.GeneratingVideo, AutomationPostStatus.Approved, AutomationPostStatus.Publishing],
            200,
            ct).ConfigureAwait(false);

        foreach (var post in activePosts)
        {
            try
            {
                if (post.Status == AutomationPostStatus.GeneratingVideo)
                {
                    changed += await PollStoryRunProgressAsync(post, settings, ct).ConfigureAwait(false);
                }
                else if (post.Status == AutomationPostStatus.Approved && (!post.ScheduledAtUtc.HasValue || post.ScheduledAtUtc.Value <= UtcNow))
                {
                    await ExecutePublishAsync(post.UserId, post, publishNow: true, scheduledAtUtc: null, ct).ConfigureAwait(false);
                    changed++;
                }
                else if (post.Status == AutomationPostStatus.Publishing)
                {
                    changed += await PollPublishProgressAsync(post, ct).ConfigureAwait(false);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Automation worker step failed for post {PostId}", post.Id);
                post.LastError = ex.Message;
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            }
        }

        // 2. Daily auto-prepare sweep when enabled
        if (settings.AutoPrepareDaily)
        {
            var enabledRules = await repository.ListAllEnabledRulesAsync(300, ct).ConfigureAwait(false);
            foreach (var group in enabledRules.GroupBy(r => r.UserId, StringComparer.Ordinal))
            {
                var dateKey = ResolveDateKey(null, settings.DefaultTimeZone);
                if (group.All(r => string.Equals(r.LastPreparedDateKey, dateKey, StringComparison.Ordinal)))
                    continue;

                try
                {
                    await PrepareForDateAsync(group.Key, dateKey, ruleId: null, forceRegenerate: false, ct).ConfigureAwait(false);
                    changed++;
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Auto-prepare daily sweep failed for user {UserId}", group.Key);
                }
            }
        }

        PruneOldStagingFiles();
        return changed;
    }

    private async Task<AutomationPost> ExecutePublishAsync(
        string userId,
        AutomationPost post,
        bool publishNow,
        DateTime? scheduledAtUtc,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.TargetChannelId))
            throw EditingException.Invalid("channel-missing", "Select a target YouTube channel before publishing.");

        var connection = await connections.GetAsync(userId, post.TargetChannelId, ct).ConfigureAwait(false)
            ?? throw EditingException.Invalid("channel-not-connected", "Connect that YouTube channel first in YouTube settings.");
        if (connection.RevokedAt is not null)
            throw EditingException.Invalid("channel-reconnect", "That YouTube connection expired. Reconnect it before posting.");

        if (!publishNow && scheduledAtUtc is { } future && future > UtcNow.AddMinutes(1))
        {
            post.ScheduledAtUtc = future;
            post.Status = AutomationPostStatus.Approved;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        // Route 1: Completed RenderJob (direct or from attached StoryRun / Handoff) -> PublishQueueService!
        var renderJob = await ResolveUsableRenderJobAsync(userId, post, ct).ConfigureAwait(false);
        if (renderJob is not null)
        {
            var metadata = new YouTubeVideoMetadata
            {
                Title = post.Title,
                Description = post.Description,
                Tags = post.Tags,
                CategoryId = post.CategoryId,
                Privacy = post.Privacy,
                MadeForKids = post.MadeForKids,
                NotifySubscribers = true,
                Language = post.Language
            };
            var queued = await publishQueue.AddAsync(userId, new PublishQueueDraft(
                renderJob.Id,
                connection.ChannelId,
                metadata,
                null,
                post.PinnedComment,
                null,
                null,
                null,
                PublishQueueMode.UploadAtTime,
                Hold: false,
                Notes: $"Automation: {post.RuleName}"), ct).ConfigureAwait(false);

            var pushed = await publishQueue.PublishNowAsync(userId, queued.Id, ct).ConfigureAwait(false);
            post.QueueItemId = pushed.Id;
            post.Status = AutomationPostStatus.Publishing;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        // Route 2: Google Drive clip (`PhoneHandoff` without a RenderJob in IObjectStore)
        if (!string.IsNullOrWhiteSpace(post.AttachedHandoffId))
        {
            var handoff = await handoffs.GetAsync(post.AttachedHandoffId, ct).ConfigureAwait(false)
                ?? throw EditingException.Invalid("video-missing", "Attached Drive clip was not found.");

            if (handoff.DriveFileId is null || handoff.DriveMissing)
                throw EditingException.Invalid("drive-file-missing", "Attached Drive file is missing. Pick another video or generate an AI video.");

            var stagingDir = Path.Combine(dataPaths.Root, StagingFolderName);
            Directory.CreateDirectory(stagingDir);
            var localFile = Path.Combine(stagingDir, $"{post.Id}.mp4");

            var driveTarget = new DriveTarget(userId, handoff.DriveChannelId, handoff.DriveFolderName);
            var driveToken = await driveStore.GetAccessTokenAsync(driveTarget, ct).ConfigureAwait(false);
            await driveClient.DownloadAsync(driveToken, handoff.DriveFileId, _ =>
                Task.FromResult<Stream>(new FileStream(localFile, FileMode.Create, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous)), ct).ConfigureAwait(false);

            var fileSize = new FileInfo(localFile).Length;
            var metaInput = new YouTubeVideoMetadata
            {
                Title = post.Title,
                Description = post.Description,
                Tags = post.Tags,
                CategoryId = post.CategoryId,
                Privacy = post.Privacy,
                MadeForKids = post.MadeForKids,
                NotifySubscribers = true,
                Language = post.Language
            };
            var validation = YouTubePublishValidator.Validate(
                metaInput,
                new YouTubeVideoFacts(true, true, fileSize, handoff.DurationSeconds ?? 45, null, null),
                UtcNow);
            if (!validation.IsValid || validation.Normalized is null)
                throw EditingException.Invalid(validation.Errors[0].Code, validation.Errors[0].Message);

            var comment = post.PinnedComment;
            if (comment is not null && !YouTubeOAuthClient.AllowsComments(connection.Scopes))
                comment = null;

            var uploadStatus = uploadManager.Start(new YouTubeUploadRequest(
                userId,
                handoff.JobId,
                StorageKey: string.Empty,
                SizeBytes: fileSize,
                connection.ChannelId,
                connection.ChannelTitle,
                validation.Normalized,
                ProjectId: handoff.ProjectId,
                FirstComment: comment,
                LocalFilePath: localFile));

            // Mark the Drive clip Used & archive on Drive best-effort so it's never reused in duplicate!
            await MarkDriveClipUsedAsync(handoff, driveToken, driveTarget, ct).ConfigureAwait(false);

            post.UploadId = uploadStatus.UploadId;
            post.Status = AutomationPostStatus.Publishing;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        throw EditingException.Invalid("video-not-attached", "Attach a Drive clip / finished Render or click 'Generate AI Video' before publishing.");
    }

    private async Task<int> PollStoryRunProgressAsync(
        AutomationPost post,
        AutomationWorkspaceConfig settings,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.AttachedStoryRunId)) return 0;
        StoryRun run;
        try
        {
            run = await storyRuns.GetAsync(post.UserId, post.AttachedStoryRunId, ct).ConfigureAwait(false);
        }
        catch (KeyNotFoundException)
        {
            post.Status = AutomationPostStatus.Failed;
            post.LastError = "Linked Story Agent run was deleted.";
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return 1;
        }

        if (run.Status == StoryRunStatus.Completed && !string.IsNullOrWhiteSpace(run.RenderJobId))
        {
            post.AttachedRenderJobId = run.RenderJobId;
            post.AttachedVideoSourceLabel = "AI Story Agent (Ready)";
            post.Status = AutomationPostStatus.VideoReadyForReview;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;

            var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
            if (rule?.Mode == AutomationPostMode.FullAutopilot
                && settings.GlobalAutopilotEnabled
                && !string.IsNullOrWhiteSpace(post.TargetChannelId))
            {
                post.Status = AutomationPostStatus.Approved;
            }
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return 1;
        }

        if (run.Status is StoryRunStatus.Failed or StoryRunStatus.Cancelled)
        {
            post.Status = AutomationPostStatus.Failed;
            post.LastError = run.ErrorMessage ?? "AI video generation did not complete.";
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return 1;
        }

        return 0;
    }

    private async Task<int> PollPublishProgressAsync(AutomationPost post, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(post.QueueItemId))
        {
            var view = await publishQueue.GetAsync(post.UserId, post.QueueItemId, ct).ConfigureAwait(false);
            if (view.State == PublishQueueState.Published)
            {
                post.PublishedVideoId = view.VideoId;
                post.PublishedVideoUrl = view.VideoUrl;
                post.Status = AutomationPostStatus.Published;
                post.PublishedAtUtc = view.FinishedAt ?? UtcNow;
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return 1;
            }
            if (view.State is PublishQueueState.Failed or PublishQueueState.Cancelled)
            {
                post.Status = AutomationPostStatus.Failed;
                post.LastError = view.Error ?? "Publish queue upload failed.";
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return 1;
            }
            return 0;
        }

        if (!string.IsNullOrWhiteSpace(post.UploadId))
        {
            var status = uploadManager.Get(post.UserId, post.UploadId);
            if (status is not null)
            {
                if (status.State == YouTubeUploadState.Completed)
                {
                    post.PublishedVideoId = status.VideoId;
                    post.PublishedVideoUrl = status.VideoUrl;
                    post.Status = AutomationPostStatus.Published;
                    post.PublishedAtUtc = status.CompletedAt ?? UtcNow;
                    post.UpdatedAtUtc = UtcNow;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    return 1;
                }
                if (status.State is YouTubeUploadState.Failed or YouTubeUploadState.Cancelled)
                {
                    post.Status = AutomationPostStatus.Failed;
                    post.LastError = status.Error ?? "YouTube upload failed.";
                    post.UpdatedAtUtc = UtcNow;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    return 1;
                }
                return 0;
            }

            // UploadManager drops aged completed entries after a few hours; check persisted publications.
            if (!string.IsNullOrWhiteSpace(post.AttachedHandoffId)
                && await handoffs.GetAsync(post.AttachedHandoffId, ct).ConfigureAwait(false) is { } h)
            {
                var recs = await publications.ListByUserAsync(post.UserId, null, 200, ct).ConfigureAwait(false);
                var found = recs.FirstOrDefault(p => string.Equals(p.JobId, h.JobId, StringComparison.Ordinal) && p.PublishedAt >= post.CreatedAtUtc);
                if (found is not null)
                {
                    post.PublishedVideoId = found.VideoId;
                    post.PublishedVideoUrl = $"https://www.youtube.com/watch?v={found.VideoId}";
                    post.Status = AutomationPostStatus.Published;
                    post.PublishedAtUtc = found.PublishedAt;
                    post.UpdatedAtUtc = UtcNow;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    return 1;
                }
            }
        }

        return 0;
    }

    private async Task<bool> ObjectExistsAsync(string key, CancellationToken ct)
    {
        await using var stream = await objectStore.OpenAsync(key, ct).ConfigureAwait(false);
        return stream is not null;
    }

    private async Task<RenderJob?> ResolveUsableRenderJobAsync(string userId, AutomationPost post, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(post.AttachedRenderJobId))
        {
            var job = await renderJobs.GetAsync(post.AttachedRenderJobId, ct).ConfigureAwait(false);
            if (job is { OutputStorageKey: { Length: > 0 } key, Status: RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings }
                && await ObjectExistsAsync(key, ct).ConfigureAwait(false))
            {
                var proj = await projects.GetAsync(job.ProjectId, ct).ConfigureAwait(false);
                if (proj is not null && string.Equals(proj.UserId, userId, StringComparison.Ordinal))
                    return job;
            }
        }

        if (!string.IsNullOrWhiteSpace(post.AttachedHandoffId))
        {
            var h = await handoffs.GetAsync(post.AttachedHandoffId, ct).ConfigureAwait(false);
            if (h is not null && !h.JobId.StartsWith("drive-", StringComparison.Ordinal))
            {
                var job = await renderJobs.GetAsync(h.JobId, ct).ConfigureAwait(false);
                if (job is { OutputStorageKey: { Length: > 0 } key, Status: RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings }
                    && await ObjectExistsAsync(key, ct).ConfigureAwait(false))
                {
                    return job;
                }
            }
        }

        return null;
    }

    private async Task<(bool Attached, bool StartedAi)> TryResolveVideoAsync(
        string userId,
        AutomationRule rule,
        AutomationPost post,
        IReadOnlyList<PhoneHandoff> userHandoffs,
        HashSet<string> alreadyReservedHandoffs,
        IReadOnlyList<RenderJob> userRenders,
        CancellationToken ct)
    {
        if (rule.VideoStrategy == AutomationVideoStrategy.ManualAttachOnly)
            return (false, false);

        if (rule.VideoStrategy is AutomationVideoStrategy.PreferUnusedDriveClipThenAiRender or AutomationVideoStrategy.PreferUnusedDriveClipOnly)
        {
            var clip = userHandoffs
                .Where(h => h.State != PhoneHandoffState.Cancelled
                            && !h.DriveMissing
                            && !h.Archived
                            && h.UsedAt is null
                            && !alreadyReservedHandoffs.Contains(h.Id)
                            && (h.DriveFileId is not null || !string.IsNullOrWhiteSpace(h.JobId)))
                .OrderByDescending(h => !string.IsNullOrWhiteSpace(rule.TopicId) && string.Equals(h.TopicId, rule.TopicId, StringComparison.Ordinal))
                .ThenByDescending(h => !string.IsNullOrWhiteSpace(rule.TopicName) && string.Equals(h.Topic, rule.TopicName, StringComparison.OrdinalIgnoreCase))
                .ThenBy(h => h.CreatedAt)
                .FirstOrDefault(h =>
                    string.IsNullOrWhiteSpace(rule.TopicId)
                    || string.Equals(h.TopicId, rule.TopicId, StringComparison.Ordinal)
                    || (!string.IsNullOrWhiteSpace(rule.TopicName) && string.Equals(h.Topic, rule.TopicName, StringComparison.OrdinalIgnoreCase)));

            if (clip is not null)
            {
                post.AttachedHandoffId = clip.Id;
                post.AttachedHandoffTitle = clip.Title;
                post.AttachedRenderJobId = !clip.JobId.StartsWith("drive-", StringComparison.Ordinal) ? clip.JobId : null;
                post.AttachedVideoSourceLabel = string.IsNullOrWhiteSpace(clip.Topic)
                    ? $"Drive Library: {clip.Title}"
                    : $"Drive [{clip.Topic}]: {clip.Title}";
                post.Status = AutomationPostStatus.VideoReadyForReview;
                return (true, false);
            }
        }

        if (rule.VideoStrategy == AutomationVideoStrategy.PreferFinishedRenderJob)
        {
            var render = userRenders
                .FirstOrDefault(r => !string.IsNullOrWhiteSpace(rule.TopicId) && string.Equals(r.TopicId, rule.TopicId, StringComparison.Ordinal));
            if (render is not null)
            {
                post.AttachedRenderJobId = render.Id;
                post.AttachedHandoffTitle = render.Name ?? render.Id;
                post.AttachedVideoSourceLabel = $"Studio Render: {render.Name ?? render.Id}";
                post.Status = AutomationPostStatus.VideoReadyForReview;
                return (true, false);
            }
        }

        if ((rule.VideoStrategy is AutomationVideoStrategy.PreferUnusedDriveClipThenAiRender or AutomationVideoStrategy.AutoGenerateStoryVideo)
            && rule.Mode != AutomationPostMode.PreviewOnly)
        {
            try
            {
                var run = await StartStoryRunForPostAsync(userId, post, rule, ct).ConfigureAwait(false);
                post.AttachedStoryRunId = run.Id;
                post.AttachedVideoSourceLabel = $"AI Story Agent ({run.Status})";
                post.Status = AutomationPostStatus.GeneratingVideo;
                return (false, true);
            }
            catch (StoryRunException ex)
            {
                post.Notes = $"Auto-video deferred: {ex.Message}";
            }
        }

        return (false, false);
    }

    private async Task<StoryRun> StartStoryRunForPostAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        CancellationToken ct)
    {
        var brief = new StoryBrief
        {
            Title = post.Title,
            Notes = $"Source: {post.SourceTitle}\n\n{post.Script}\n\nVisual style guide: {post.AiVideoPrompt}",
            Language = string.Equals(post.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi",
            TargetSeconds = rule?.TargetSeconds ?? 55,
            Format = post.Format == AutomationVideoFormat.Vertical ? StoryFormat.Vertical : StoryFormat.Wide,
            Writer = StoryWriterMode.Auto,
            Mode = post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha
                ? StoryGenreMode.Scripture
                : StoryGenreMode.Creative,
            BrandChannelId = rule?.BrandChannelId
        };

        var build = new StoryBuildOptions
        {
            Narration = StoryNarrationMode.Stock,
            Visuals = StoryVisualMode.Auto,
            Music = true,
            RenderWhenReady = true,
            AutoApprove = true
        };

        return await storyRuns.CreateAsync(userId, brief, build, ct).ConfigureAwait(false);
    }

    private async Task<(ComposedAutomationContent Content, bool UsedAi)> TryRefineWithAiAsync(
        string userId,
        AutomationRule rule,
        ComposedAutomationContent draft,
        CancellationToken ct)
    {
        var prompt = $"""
            You refine short YouTube content packages without removing ANY facts, numbers, Tithi/Muhurat times, or website links.
            Language: {(string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase) ? "English" : "Hindi (Devanagari) with clean English key terms")}
            Return ONLY JSON with keys: "title", "script", "aiVideoPrompt", "pinnedComment".
            Draft Title: {draft.Title}
            Draft Script:
            {draft.Script}
            Draft AI Prompt:
            {draft.AiVideoPrompt}
            Draft Pinned Comment:
            {draft.PinnedComment}
            Keep all website URLs verbatim. Title max 92 chars.
            """;

        var outcome = await ai.TextAsync(
            new AiTextRequest { Prompt = prompt, MaxOutputTokens = 700, Temperature = 0.4 },
            new AiCallContext(UserId: userId),
            ct).ConfigureAwait(false);

        if (!outcome.IsSuccess || string.IsNullOrWhiteSpace(outcome.Value?.Text))
            return (draft, false);

        try
        {
            var raw = ExtractJsonObject(outcome.Value.Text);
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            string Read(string name, string fallback) =>
                root.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(el.GetString())
                    ? el.GetString()!.Trim()
                    : fallback;

            var refinedTitle = Read("title", draft.Title);
            if (refinedTitle.Length > 95) refinedTitle = refinedTitle[..94].TrimEnd() + "…";

            return (draft with
            {
                Title = refinedTitle,
                Script = Read("script", draft.Script),
                AiVideoPrompt = Read("aiVideoPrompt", draft.AiVideoPrompt),
                PinnedComment = draft.PinnedComment is null ? null : Read("pinnedComment", draft.PinnedComment)
            }, true);
        }
        catch (JsonException)
        {
            return (draft, false);
        }
    }

    private async Task MarkDriveClipUsedAsync(PhoneHandoff handoff, string driveToken, DriveTarget target, CancellationToken ct)
    {
        try
        {
            handoff.UsedAt ??= UtcNow;
            handoff.Archived = true;
            const string ArchiveFolder = "Archive";
            string[] archiveFolders = handoff.Topic is null ? [ArchiveFolder] : [ArchiveFolder, handoff.Topic];
            handoff.DriveSubfolders = [.. archiveFolders];

            if (handoff.DriveFileId is not null)
            {
                var fileInfo = await driveClient.GetFileAsync(driveToken, handoff.DriveFileId, ct).ConfigureAwait(false);
                if (fileInfo is not null && !fileInfo.Trashed)
                {
                    var folderId = await driveStore.EnsureFolderPathAsync(target, archiveFolders, driveToken, ct).ConfigureAwait(false);
                    await driveClient.MoveFileAsync(driveToken, fileInfo, folderId, fileInfo.Name, ct).ConfigureAwait(false);
                }
            }
            await handoffs.UpsertAsync(handoff, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not move Drive clip {HandoffId} to Archive after automation upload.", handoff.Id);
            handoff.UsedAt ??= UtcNow;
            await handoffs.UpsertAsync(handoff, ct).ConfigureAwait(false);
        }
    }

    private async Task<List<RenderJob>> LoadFinishedRendersAsync(string userId, CancellationToken ct)
    {
        var list = new List<RenderJob>();
        foreach (var project in (await projects.ListAsync(userId, ct).ConfigureAwait(false)).Take(40))
        {
            var jobs = await renderJobs.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);
            list.AddRange(jobs.Where(j =>
                j.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings
                && !string.IsNullOrWhiteSpace(j.OutputStorageKey)));
        }
        return [.. list.OrderByDescending(j => j.CreatedAt)];
    }

    private async Task<AutomationPost> LoadOwnedPostAsync(string userId, string postId, CancellationToken ct)
    {
        var post = await repository.GetPostAsync(postId, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(post.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
        return post;
    }

    private static (string ChannelId, string Title, string? Handle)? MatchConnectedChannel(
        IReadOnlyList<YouTubeConnectionStatus> connected,
        StudioEcosystemConfig ecosystem,
        string[] keywords)
    {
        var best = connected
            .Select(c =>
            {
                var central = ecosystem.Channels.FirstOrDefault(ec =>
                    string.Equals(ec.ChannelId, c.ChannelId, StringComparison.OrdinalIgnoreCase)
                    || (!string.IsNullOrWhiteSpace(c.ChannelHandle) && string.Equals(ec.Handle, c.ChannelHandle, StringComparison.OrdinalIgnoreCase)));
                var haystack = $"{c.ChannelTitle} {c.ChannelHandle} {central?.Niche} {string.Join(' ', central?.Tags ?? [])}".ToLowerInvariant();
                var score = keywords.Count(k => haystack.Contains(k, StringComparison.OrdinalIgnoreCase));
                return (Channel: c, Score: score);
            })
            .OrderByDescending(x => x.Score)
            .FirstOrDefault();

        return best.Score > 0
            ? (best.Channel.ChannelId, best.Channel.ChannelTitle, best.Channel.ChannelHandle)
            : null;
    }

    private static (string ChannelId, string Title, string? Handle)? MatchCentralChannel(
        StudioEcosystemConfig ecosystem,
        string[] keywords)
    {
        var best = ecosystem.Channels
            .Where(c => !string.IsNullOrWhiteSpace(c.ChannelId) || !string.IsNullOrWhiteSpace(c.Handle))
            .Select(c =>
            {
                var haystack = $"{c.Name} {c.Handle} {c.Niche} {string.Join(' ', c.Tags)}".ToLowerInvariant();
                var score = keywords.Count(k => haystack.Contains(k, StringComparison.OrdinalIgnoreCase));
                return (Channel: c, Score: score);
            })
            .OrderByDescending(x => x.Score)
            .FirstOrDefault();

        if (best.Channel is null || best.Score <= 0) return null;
        return (best.Channel.ChannelId ?? string.Empty, best.Channel.Name, best.Channel.Handle);
    }

    private async Task<ContentTopic?> EnsureTopicAsync(
        string userId,
        List<ContentTopic> topics,
        string name,
        string? channelId,
        string? channelTitle,
        CancellationToken ct)
    {
        var match = topics.FirstOrDefault(t => string.Equals(t.Name, name, StringComparison.OrdinalIgnoreCase));
        if (match is not null) return match;
        try
        {
            var created = await planning.CreateTopicAsync(
                userId,
                new ContentTopicCommand(name, "Ecosystem auto-posting topic", null, channelId, channelTitle, null, null, null, 2, 14, false, true, null, null, false),
                ct).ConfigureAwait(false);
            topics.Add(created);
            return created;
        }
        catch (EditingException)
        {
            return null;
        }
    }

    private static AutomationRule BuildStarterRule(
        string userId,
        int order,
        string name,
        string desc,
        AutomationSourceType sourceType,
        (string ChannelId, string Title, string? Handle)? channel,
        ContentTopic? topic,
        string publishTime,
        AutomationWorkspaceConfig settings,
        IReadOnlyList<string> websiteKeys,
        string categoryId,
        DateTime now) => new()
        {
            Id = $"ar_{Guid.NewGuid():n}",
            UserId = userId,
            Name = name,
            Description = desc,
            Enabled = true,
            SourceType = sourceType,
            Mode = AutomationPostMode.PreviewOnly,
            VideoStrategy = AutomationVideoStrategy.PreferUnusedDriveClipThenAiRender,
            VideoFormat = AutomationVideoFormat.Vertical,
            TargetChannelId = string.IsNullOrWhiteSpace(channel?.ChannelId) ? null : channel!.Value.ChannelId,
            TargetChannelTitle = channel?.Title,
            TargetChannelHandle = channel?.Handle,
            TopicId = topic?.Id,
            TopicName = topic?.Name,
            Language = "hi",
            TargetSeconds = 55,
            Location = settings.DefaultLocation,
            PreferredPublishTime = publishTime,
            TimeZoneId = settings.DefaultTimeZone,
            FestivalLeadDays = 1,
            FunnelWebsiteKeys = [.. websiteKeys],
            Privacy = "public",
            CategoryId = categoryId,
            MadeForKids = false,
            IncludePinnedComment = true,
            SortOrder = order,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

    private string ResolveDateKey(string? rawDateKey, string tzId)
    {
        if (!string.IsNullOrWhiteSpace(rawDateKey) && DateOnly.TryParse(rawDateKey.Trim(), out var parsed))
            return parsed.ToString("yyyy-MM-dd");

        var tz = PublishSlotSuggester.ResolveTimeZone(tzId);
        return TimeZoneInfo.ConvertTimeFromUtc(UtcNow, tz).ToString("yyyy-MM-dd");
    }

    private static DateTime ComputeScheduledUtc(string dateKey, string hhMm, string tzId)
    {
        var date = DateOnly.Parse(dateKey);
        var parts = hhMm.Split(':');
        var hour = parts.Length > 0 && int.TryParse(parts[0], out var h) ? Math.Clamp(h, 0, 23) : 7;
        var min = parts.Length > 1 && int.TryParse(parts[1], out var m) ? Math.Clamp(m, 0, 59) : 0;
        var localDt = date.ToDateTime(new TimeOnly(hour, min));
        var tz = PublishSlotSuggester.ResolveTimeZone(tzId);
        return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localDt, DateTimeKind.Unspecified), tz);
    }

    private static string NormalizeTimeHhMm(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "07:00";
        if (TimeOnly.TryParse(value.Trim(), out var parsed))
            return parsed.ToString("HH:mm");
        return "07:00";
    }

    private static string? NormalizeOptionalUrl(string? url, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        if (!EcosystemSignalsClient.IsSafeEndpoint(url, out var normalized))
            throw EditingException.Invalid("invalid-url", $"{fieldName} must be an HTTPS URL (or localhost HTTP for development).");
        return normalized;
    }

    private static string ExtractJsonObject(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        return start >= 0 && end > start ? text[start..(end + 1)] : text;
    }

    private void PruneOldStagingFiles()
    {
        try
        {
            var dir = Path.Combine(dataPaths.Root, StagingFolderName);
            if (!Directory.Exists(dir)) return;
            var cutoff = DateTime.UtcNow.AddHours(-24);
            foreach (var file in Directory.EnumerateFiles(dir, "*.mp4"))
            {
                if (File.GetLastWriteTimeUtc(file) < cutoff)
                    File.Delete(file);
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Staging file cleanup skipped.");
        }
    }
}
