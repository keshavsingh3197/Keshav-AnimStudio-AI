using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Rendering;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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

public sealed record AutomationStorageImageItem(
    string Id,
    string ProjectId,
    string ProjectName,
    string Name,
    int? Width,
    int? Height,
    DateTime UpdatedAtUtc);

public sealed record AutomationCharacterProfileItem(
    string Id,
    string ProjectId,
    string ProjectName,
    string Name,
    string? Description,
    bool IsNarrator,
    string? SubtitleColorHex);

public sealed record AutomationStorageCatalog(
    IReadOnlyList<AutomationStorageImageItem> Images,
    IReadOnlyList<AutomationCharacterProfileItem> Characters);

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
    IProceduralVideoGenerator proceduralVideoGenerator,
    ProceduralCommunityCardGenerator communityCardGenerator,
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<EcosystemServiceOptions> ecosystemServiceOptions,
    IAiExecutor ai,
    IObjectStore objectStore,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<EcosystemAutomationService> logger,
    IAssetRepository? assets = null,
    ICharacterRepository? characters = null)
{
    private const string WorkspaceConfigKey = "Automation:Workspace:Config";
    private const string StagingFolderName = "automation-staging";
    private const string CharacterLibraryProjectName = "Automation Characters Library";
    private static readonly string[] CharacterPalette =
    [
        "#93C5FD", "#FCA5A5", "#6EE7B7", "#DDD6FE", "#FDBA74", "#F9A8D4", "#A5F3FC"
    ];
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

        foreach (var post in postsTask.Result.Where(p => p.Status == AutomationPostStatus.GeneratingVideo))
        {
            await PollStoryRunProgressAsync(post, settings, ct).ConfigureAwait(false);
        }

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
        rule.SubtitlePreset = NormalizeSubtitlePreset(draft.SubtitlePreset);
        rule.VisualEngine = draft.VisualEngine;
        rule.NarrativeMode = draft.NarrativeMode;
        if (rule.NarrativeMode == AutomationNarrativeMode.FullStory && rule.TargetSeconds < 95)
            rule.TargetSeconds = 165;
        else if (rule.NarrativeMode == AutomationNarrativeMode.ShortReel && rule.TargetSeconds > 60)
            rule.TargetSeconds = 55;
        rule.AttachedAssetIds = [.. draft.AttachedAssetIds
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => a.Trim())
            .Distinct(StringComparer.Ordinal)
            .Take(40)];
        rule.EnableCharacterDialogue = draft.EnableCharacterDialogue;
        rule.SpeakerAName = string.IsNullOrWhiteSpace(draft.SpeakerAName) ? null : draft.SpeakerAName.Trim();
        rule.SpeakerBName = string.IsNullOrWhiteSpace(draft.SpeakerBName) ? null : draft.SpeakerBName.Trim();
        rule.SortOrder = draft.SortOrder;
        rule.Language = string.IsNullOrWhiteSpace(rule.Language) ? "hi" : rule.Language.Trim().ToLowerInvariant();
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
                post.CommunityPostText = refined.Content.CommunityPostText;
                post.CommunityPollOptions = [.. (refined.Content.CommunityPollOptions ?? [])];
                post.HeaderBannerText = refined.Content.HeaderBannerText;
                post.EventColorHex = refined.Content.EventColorHex;
                post.EnableCharacterDialogue = rule.EnableCharacterDialogue;
                post.SpeakerAName = rule.SpeakerAName;
                post.SpeakerBName = rule.SpeakerBName;
                post.SubtitlePreset = NormalizeSubtitlePreset(rule.SubtitlePreset);
                post.VisualEngine = rule.VisualEngine;
                post.NarrativeMode = rule.NarrativeMode;
                if (post.NarrativeMode == AutomationNarrativeMode.FullStory && post.TargetSeconds is null or < 95)
                    post.TargetSeconds = Math.Clamp(rule.TargetSeconds >= 95 ? rule.TargetSeconds : 165, 95, 180);
                else if (post.NarrativeMode == AutomationNarrativeMode.ShortReel)
                    post.TargetSeconds = Math.Clamp(rule.TargetSeconds <= 60 ? rule.TargetSeconds : 55, 25, 60);
                if (post.AttachedAssetIds.Count == 0 && rule.AttachedAssetIds.Count > 0)
                    post.AttachedAssetIds = [.. rule.AttachedAssetIds];
                post.UpdatedAtUtc = UtcNow;

                if (post.Format == AutomationVideoFormat.CommunityPost)
                {
                    if (string.IsNullOrWhiteSpace(post.CommunityCardStorageKey) && rule.Mode != AutomationPostMode.PreviewOnly)
                    {
                        await AttachCommunityPromoCardAsync(post, ct).ConfigureAwait(false);
                    }
                    post.Status = AutomationPostStatus.VideoReadyForReview;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    if (existing is null) created++;
                    else updated++;
                    touchedPosts.Add(post);
                    continue;
                }

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
            rule.Language = string.IsNullOrWhiteSpace(rule.Language) ? "hi" : rule.Language.Trim().ToLowerInvariant();
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
        if (Enum.IsDefined(update.Format))
            post.Format = update.Format;
        if (update.CommunityPostText is not null)
            post.CommunityPostText = update.CommunityPostText.Trim();
        if (update.CommunityPollOptions is { Count: > 0 })
            post.CommunityPollOptions = [.. update.CommunityPollOptions.Where(o => !string.IsNullOrWhiteSpace(o)).Select(o => o.Trim()).Take(5)];
        post.EnableCharacterDialogue = update.EnableCharacterDialogue;
        post.SpeakerAName = string.IsNullOrWhiteSpace(update.SpeakerAName) ? null : update.SpeakerAName.Trim();
        post.SpeakerBName = string.IsNullOrWhiteSpace(update.SpeakerBName) ? null : update.SpeakerBName.Trim();
        if (!string.IsNullOrWhiteSpace(update.SubtitlePreset))
            post.SubtitlePreset = NormalizeSubtitlePreset(update.SubtitlePreset);
        if (Enum.IsDefined(update.VisualEngine))
            post.VisualEngine = update.VisualEngine;
        if (Enum.IsDefined(update.NarrativeMode))
            post.NarrativeMode = update.NarrativeMode;
        if (update.TargetSeconds.HasValue)
            post.TargetSeconds = Math.Clamp(update.TargetSeconds.Value, 20, 180);
        if (update.AttachedAssetIds is { Count: > 0 })
        {
            post.AttachedAssetIds = [.. update.AttachedAssetIds
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim())
                .Distinct(StringComparer.Ordinal)
                .Take(40)];
        }
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

    public async Task<AutomationStorageCatalog> GetStorageMediaCatalogAsync(string userId, CancellationToken ct)
    {
        var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
        if (userProjects.Count == 0)
            return new AutomationStorageCatalog([], []);

        var projectNames = userProjects.ToDictionary(p => p.Id, p => p.Name, StringComparer.Ordinal);
        var projectIds = userProjects.Select(p => p.Id).ToList();

        var imageItems = new List<AutomationStorageImageItem>();
        if (assets is not null)
        {
            var allAssets = await assets.ListByProjectsAsync(projectIds, ct).ConfigureAwait(false);
            foreach (var asset in allAssets
                .Where(a => a.Kind == AssetKind.Image && !string.IsNullOrWhiteSpace(a.StorageKey))
                .OrderByDescending(a => a.CreatedAt)
                .Take(80))
            {
                projectNames.TryGetValue(asset.ProjectId, out var pName);
                imageItems.Add(new AutomationStorageImageItem(
                    asset.Id,
                    asset.ProjectId,
                    pName ?? "Project",
                    string.IsNullOrWhiteSpace(asset.Name) ? (asset.DisplayFileName ?? "Image") : asset.Name,
                    asset.Probe?.Width,
                    asset.Probe?.Height,
                    asset.CreatedAt));
            }
        }

        var characterItems = new List<AutomationCharacterProfileItem>();
        if (characters is not null)
        {
            var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var orderedProjects = userProjects
                .OrderByDescending(p => string.Equals(p.Name, CharacterLibraryProjectName, StringComparison.OrdinalIgnoreCase))
                .ThenByDescending(p => p.UpdatedAt);

            foreach (var proj in orderedProjects)
            {
                var list = await characters.ListByProjectAsync(proj.Id, ct).ConfigureAwait(false);
                foreach (var c in list)
                {
                    if (string.IsNullOrWhiteSpace(c.Name) || !seenNames.Add(c.Name.Trim()))
                        continue;
                    characterItems.Add(new AutomationCharacterProfileItem(
                        c.Id,
                        proj.Id,
                        proj.Name,
                        c.Name.Trim(),
                        c.Description,
                        c.IsNarrator,
                        c.SubtitleColorHex));
                    if (characterItems.Count >= 60) break;
                }
                if (characterItems.Count >= 60) break;
            }
        }

        return new AutomationStorageCatalog(imageItems, characterItems);
    }

    public async Task<AutomationPost> GenerateAiVideoAsync(
        string userId,
        string postId,
        CancellationToken ct,
        AutomationVisualEngine? visualEngine = null,
        AutomationNarrativeMode? narrativeMode = null,
        int? targetSeconds = null,
        IReadOnlyList<string>? attachedAssetIds = null)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");

        if (visualEngine.HasValue)
            post.VisualEngine = visualEngine.Value;
        if (narrativeMode.HasValue)
            post.NarrativeMode = narrativeMode.Value;
        if (targetSeconds.HasValue && targetSeconds.Value > 0)
            post.TargetSeconds = Math.Clamp(targetSeconds.Value, 25, 180);
        if (attachedAssetIds is not null)
        {
            post.AttachedAssetIds = [.. attachedAssetIds
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim())
                .Distinct(StringComparer.Ordinal)
                .Take(40)];
        }

        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
        var effectiveEngine = post.VisualEngine != AutomationVisualEngine.Auto
            ? post.VisualEngine
            : rule?.VisualEngine ?? AutomationVisualEngine.Auto;

        if (effectiveEngine == AutomationVisualEngine.Procedural3D)
        {
            var effectiveMode = post.NarrativeMode != AutomationNarrativeMode.Auto
                ? post.NarrativeMode
                : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
            var seconds = ResolvePostTargetSeconds(post, rule, effectiveMode, targetSeconds ?? 0);
            await AttachProceduralAnimatedVideoAsync(userId, post, rule, ProceduralSceneTheme.Auto, seconds, "720p", ct)
                .ConfigureAwait(false);
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        var run = await StartStoryRunForPostAsync(userId, post, rule, ct)
            .ConfigureAwait(false);

        post.AttachedStoryRunId = run.Id;
        post.AttachedVideoSourceLabel = "AI Story Studio (Preparing Story & Characters...)";
        post.StoryStageSummary = "Research & Story Script";
        post.StoryProgressPercent = 6;
        post.Status = AutomationPostStatus.GeneratingVideo;
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    /// <summary>
    /// Generates an instant CPU-friendly 2D/3D procedural animated MP4 for a prepared post right on this
    /// server (zero GPU or external video AI keys required), saves it as a Studio RenderJob, and attaches it.
    /// Keeps all AI Video Prompts intact on the post.
    /// </summary>
    public async Task<AutomationPost> GenerateAnimatedVideoAsync(
        string userId,
        string postId,
        Application.Rendering.ProceduralSceneTheme theme,
        int durationSeconds,
        string? resolution,
        CancellationToken ct,
        string? format = null,
        bool? enableCharacterDialogue = null,
        string? subtitlePreset = null,
        string? speakerAName = null,
        string? speakerBName = null,
        AutomationNarrativeMode? narrativeMode = null,
        IReadOnlyList<string>? attachedAssetIds = null)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");

        if (!string.IsNullOrWhiteSpace(format))
        {
            post.Format = format.Trim().ToLowerInvariant() switch
            {
                "wide" or "landscape" or "16:9" or "video" => AutomationVideoFormat.Wide,
                "community" or "communitypost" or "square" => AutomationVideoFormat.CommunityPost,
                _ => AutomationVideoFormat.Vertical
            };
        }
        if (enableCharacterDialogue.HasValue)
            post.EnableCharacterDialogue = enableCharacterDialogue.Value;
        if (!string.IsNullOrWhiteSpace(subtitlePreset))
            post.SubtitlePreset = NormalizeSubtitlePreset(subtitlePreset);
        if (speakerAName is not null)
            post.SpeakerAName = string.IsNullOrWhiteSpace(speakerAName) ? null : speakerAName.Trim();
        if (speakerBName is not null)
            post.SpeakerBName = string.IsNullOrWhiteSpace(speakerBName) ? null : speakerBName.Trim();
        if (narrativeMode.HasValue)
            post.NarrativeMode = narrativeMode.Value;
        if (attachedAssetIds is not null)
        {
            post.AttachedAssetIds = [.. attachedAssetIds
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim())
                .Distinct(StringComparer.Ordinal)
                .Take(40)];
        }
        post.VisualEngine = AutomationVisualEngine.Procedural3D;

        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
        await AttachProceduralAnimatedVideoAsync(userId, post, rule, theme, durationSeconds, resolution, ct)
            .ConfigureAwait(false);

        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> GenerateCommunityCardAsync(
        string userId,
        string postId,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        await AttachCommunityPromoCardAsync(post, ct).ConfigureAwait(false);
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<byte[]?> GetCommunityCardBytesAsync(string userId, string postId, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(post.CommunityCardStorageKey))
            await AttachCommunityPromoCardAsync(post, ct).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(post.CommunityCardStorageKey))
            return null;

        await using var stream = await objectStore.OpenAsync(post.CommunityCardStorageKey, ct).ConfigureAwait(false);
        if (stream is null) return null;
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct).ConfigureAwait(false);
        return ms.ToArray();
    }

    public async Task<AutomationPost> MarkCommunityPostPublishedAsync(string userId, string postId, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        post.Status = AutomationPostStatus.Published;
        post.PublishedAtUtc ??= UtcNow;
        post.Notes = "Marked as published manually in YouTube Studio Community Posts.";
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    public async Task<AutomationPost> SyncPostToEcosystemAsync(
        string userId,
        string postId,
        string? bearerToken,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(post.PublishedVideoId) && string.IsNullOrWhiteSpace(post.PublishedVideoUrl))
            throw EditingException.Invalid("video-not-published", "Publish the YouTube video first before syncing it to Panchang Video Hub.");

        var ok = await TrySyncPublishedPostToEcosystemAsync(post, bearerToken, ct).ConfigureAwait(false);
        if (!ok)
            throw EditingException.Invalid("panchang-sync-failed", post.LastError ?? "Could not sync to HinduPanchang Video Hub (check Admin login or Ecosystem:SyncKey).");

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

        if (run.Script is { Cast.Count: > 0 } && post.ProvisionedCharacterNames.Count == 0)
        {
            await EnsureAutomationCastCharactersAsync(post.UserId, post, run.Script, ct).ConfigureAwait(false);
        }

        if (run.Status == StoryRunStatus.Completed && !string.IsNullOrWhiteSpace(run.RenderJobId))
        {
            post.AttachedRenderJobId = run.RenderJobId;
            var durationNote = run.Script is { Scenes.Count: > 0 } ? $", {run.Script.Scenes.Count} scenes" : string.Empty;
            post.AttachedVideoSourceLabel = $"AI Story Studio (Ready{durationNote})";
            post.StoryStageSummary = "Completed & Ready for Preview";
            post.StoryProgressPercent = 100;
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
            post.StoryStageSummary = run.Status == StoryRunStatus.Cancelled ? "Cancelled" : "Failed";
            post.Status = AutomationPostStatus.Failed;
            post.LastError = run.ErrorMessage ?? "AI video generation did not complete.";
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return 1;
        }

        var (summary, percent) = SummarizeStoryRunProgress(run);
        if (!string.Equals(post.StoryStageSummary, summary, StringComparison.Ordinal)
            || post.StoryProgressPercent != percent)
        {
            post.StoryStageSummary = summary;
            post.StoryProgressPercent = percent;
            post.AttachedVideoSourceLabel = $"AI Story Studio ({percent}% • {summary})";
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
                await TrySyncPublishedPostToEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false);
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
                    await TrySyncPublishedPostToEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false);
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
                    await TrySyncPublishedPostToEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false);
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

        if (rule.VideoStrategy == AutomationVideoStrategy.AutoGenerateAnimated3DVideo
            && rule.Mode != AutomationPostMode.PreviewOnly)
        {
            try
            {
                await AttachProceduralAnimatedVideoAsync(userId, post, rule, ProceduralSceneTheme.Auto, 0, null, ct).ConfigureAwait(false);
                return (true, false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                post.Notes = $"Auto 3D video deferred: {ex.Message}";
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
                try
                {
                    await AttachProceduralAnimatedVideoAsync(userId, post, rule, ProceduralSceneTheme.Auto, 0, null, ct).ConfigureAwait(false);
                    post.Notes = $"Generated built-in 3D animation (Story Agent deferred: {ex.Message})";
                    return (true, false);
                }
                catch (Exception procEx) when (procEx is not OperationCanceledException)
                {
                    post.Notes = $"Auto-video deferred: {ex.Message}";
                }
            }
        }

        return (false, false);
    }

    private async Task EnsureRichPostDialogueBeforeRenderAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        int durationSeconds,
        CancellationToken ct)
    {
        var effectiveLang = string.IsNullOrWhiteSpace(post.Language)
            ? (string.IsNullOrWhiteSpace(rule?.Language) ? "hi" : rule!.Language.Trim().ToLowerInvariant())
            : post.Language.Trim().ToLowerInvariant();
        post.Language = effectiveLang;

        var dialogueEnabled = post.EnableCharacterDialogue || (rule?.EnableCharacterDialogue ?? true);
        if (!dialogueEnabled) return;

        var isWide = post.Format == AutomationVideoFormat.Wide;
        if (!AutomationContentComposer.NeedsHindiDialogueUpgrade(post.SourceType, effectiveLang, post.Title, post.Script, isWide))
            return;

        var effectiveRule = rule ?? new AutomationRule
        {
            UserId = userId,
            Name = post.RuleName,
            SourceType = post.SourceType,
            VideoFormat = post.Format,
            Language = effectiveLang,
            TargetSeconds = durationSeconds > 0 ? durationSeconds : (isWide ? 140 : 62),
            EnableCharacterDialogue = true,
            SpeakerAName = post.SpeakerAName,
            SpeakerBName = post.SpeakerBName,
            SubtitlePreset = post.SubtitlePreset ?? "event-glow"
        };

        var draft = new ComposedAutomationContent(
            post.SourceItemKey,
            post.SourceTitle,
            post.SourceSummary,
            post.Title,
            post.Script,
            post.AiVideoPrompt,
            post.AiThumbnailPrompt,
            post.Description,
            post.PinnedComment,
            post.Tags,
            post.PrimaryDestinationUrl,
            post.TrackedFunnelUrls,
            post.CommunityPostText,
            post.CommunityPollOptions?.ToArray(),
            post.HeaderBannerText,
            post.EventColorHex);

        var (refined, usedAi) = await TryRefineWithAiAsync(userId, effectiveRule, draft, ct).ConfigureAwait(false);
        if (usedAi && !AutomationContentComposer.NeedsHindiDialogueUpgrade(post.SourceType, effectiveLang, refined.Title, refined.Script, isWideFormat: false))
        {
            post.Title = refined.Title;
            post.Script = refined.Script;
            post.AiVideoPrompt = refined.AiVideoPrompt;
            post.PinnedComment = refined.PinnedComment;
            post.GeneratedByAi = true;
            return;
        }

        var fallback = AutomationContentComposer.TryUpgradeLegacyPostToHindiDialogue(
            post.SourceType,
            effectiveLang,
            post.Title,
            post.Script,
            post.DateKey,
            post.PrimaryDestinationUrl,
            post.SpeakerAName,
            post.SpeakerBName);
        if (fallback is { } upgraded)
        {
            post.Title = upgraded.Title;
            post.Script = upgraded.Script;
            post.SpeakerAName = string.IsNullOrWhiteSpace(post.SpeakerAName) ? upgraded.SpeakerA : post.SpeakerAName;
            post.SpeakerBName = string.IsNullOrWhiteSpace(post.SpeakerBName) ? upgraded.SpeakerB : post.SpeakerBName;
        }
    }

    private async Task AttachProceduralAnimatedVideoAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        ProceduralSceneTheme theme,
        int durationSeconds,
        string? resolution,
        CancellationToken ct)
    {
        await EnsureRichPostDialogueBeforeRenderAsync(userId, post, rule, durationSeconds, ct).ConfigureAwait(false);

        var effectiveMode = post.NarrativeMode != AutomationNarrativeMode.Auto
            ? post.NarrativeMode
            : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
        var targetSeconds = ResolvePostTargetSeconds(post, rule, effectiveMode, durationSeconds);
        var duration = Math.Clamp(targetSeconds, 15, ProceduralVideoRequest.MaxSeconds);
        var footer = post.TrackedFunnelUrls.FirstOrDefault()?.Label;
        var palette = ProceduralEventPalette.Resolve(post.SourceType.ToString(), theme);
        var formatArg = post.Format switch
        {
            AutomationVideoFormat.Wide => "landscape",
            AutomationVideoFormat.CommunityPost => "square",
            _ => "vertical"
        };

        var assetIds = post.AttachedAssetIds.Count > 0 ? post.AttachedAssetIds : (rule?.AttachedAssetIds ?? []);
        var (tempDir, bgPaths) = await MaterializeStorageImagesAsync(assetIds, ct).ConfigureAwait(false);
        try
        {
            var rendered = await proceduralVideoGenerator.GenerateAsync(userId, new ProceduralVideoRequest
            {
                Title = post.Title,
                Prompt = post.AiVideoPrompt,
                Script = post.Script,
                Theme = theme,
                Format = formatArg,
                Resolution = string.IsNullOrWhiteSpace(resolution) ? "720p" : resolution.Trim(),
                DurationSeconds = duration,
                IncludeCaptions = true,
                IncludeAmbientAudio = true,
                IncludeSpeech = true,
                Language = post.Language,
                FooterLabel = footer,
                EventType = post.SourceType.ToString(),
                TopCategoryLabel = post.HeaderBannerText ?? $"{palette.HeaderBadgeText} • {post.DateKey}",
                SubtitlePreset = NormalizeSubtitlePreset(post.SubtitlePreset),
                EnableCharacterDialogue = post.EnableCharacterDialogue,
                SpeakerAName = post.SpeakerAName ?? rule?.SpeakerAName,
                SpeakerBName = post.SpeakerBName ?? rule?.SpeakerBName,
                TopicId = post.TopicId ?? rule?.TopicId,
                BackgroundImagePaths = bgPaths,
                SaveAsRenderJob = true,
                ReturnInlineBytes = false
            }, ct).ConfigureAwait(false);

            post.AttachedRenderJobId = rendered.RenderJobId;
            post.AttachedHandoffId = null;
            post.AttachedHandoffTitle = rendered.ThemeDisplayName;
            post.EventColorHex ??= palette.PrimaryHex;
            post.HeaderBannerText ??= $"{palette.HeaderBadgeText} • {post.DateKey}";
            var hasVoice = rendered.Summary?.Contains(", voice=", StringComparison.OrdinalIgnoreCase) == true;
            post.AttachedVideoSourceLabel = hasVoice
                ? $"3D Animated ({rendered.ThemeDisplayName}, {rendered.DurationSeconds:0}s • Voice)"
                : $"3D Animated ({rendered.ThemeDisplayName}, {rendered.DurationSeconds:0}s)";
            post.StoryStageSummary = "3D Animated MP4 Ready";
            post.StoryProgressPercent = 100;
            post.Status = AutomationPostStatus.VideoReadyForReview;

            var castPlan = DialogueScriptParser.ParsePlan(
                post.Title,
                post.Script,
                post.AiVideoPrompt,
                duration,
                post.EnableCharacterDialogue,
                post.SpeakerAName ?? rule?.SpeakerAName,
                post.SpeakerBName ?? rule?.SpeakerBName,
                post.SourceType.ToString());
            await EnsureProceduralCharactersAsync(userId, post, castPlan, ct).ConfigureAwait(false);
        }
        finally
        {
            if (tempDir is not null)
            {
                try { Directory.Delete(tempDir, recursive: true); } catch { /* best-effort scratch cleanup */ }
            }
        }
    }

    private async Task AttachCommunityPromoCardAsync(AutomationPost post, CancellationToken ct)
    {
        var (storageKey, sizeBytes) = await communityCardGenerator.GenerateAndStoreAsync(
            post.Id,
            post.Title,
            post.SourceSummary ?? post.CommunityPostText ?? post.Script,
            post.SourceType.ToString(),
            post.PrimaryDestinationUrl,
            post.EnableCharacterDialogue,
            post.SpeakerAName,
            post.SpeakerBName,
            ct).ConfigureAwait(false);

        var palette = ProceduralEventPalette.Resolve(post.SourceType.ToString(), ProceduralSceneTheme.Auto);
        post.CommunityCardStorageKey = storageKey;
        post.EventColorHex ??= palette.PrimaryHex;
        post.HeaderBannerText ??= $"{palette.HeaderBadgeText} • {post.DateKey}";
        post.AttachedVideoSourceLabel = $"1:1 Promo Card PNG ({sizeBytes / 1024} KB)";
    }

    private async Task<bool> TrySyncPublishedPostToEcosystemAsync(
        AutomationPost post,
        string? bearerToken,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.PublishedVideoId) && string.IsNullOrWhiteSpace(post.PublishedVideoUrl))
            return false;

        if (post.SourceType is not (AutomationSourceType.HinduPanchang
            or AutomationSourceType.HinduFestival
            or AutomationSourceType.DailyKatha
            or AutomationSourceType.AajKaItihaas))
        {
            return false;
        }

        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var rawBase = !string.IsNullOrWhiteSpace(settings.PanchangApiBaseUrl)
            ? settings.PanchangApiBaseUrl
            : ecosystemServiceOptions.CurrentValue.PanchangApiBaseUrl;

        if (!EcosystemSignalsClient.IsSafeEndpoint(rawBase, out var normalizedBase) || normalizedBase is null)
            return false;

        var syncKey = !string.IsNullOrWhiteSpace(ecosystemServiceOptions.CurrentValue.SyncKey)
            ? ecosystemServiceOptions.CurrentValue.SyncKey!.Trim()
            : Environment.GetEnvironmentVariable("ECOSYSTEM_SYNC_KEY")?.Trim();

        if (string.IsNullOrWhiteSpace(syncKey) && string.IsNullOrWhiteSpace(bearerToken))
            return false;

        try
        {
            var client = httpClientFactory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, $"{normalizedBase}/api/videohub/automation-sync");
            if (!string.IsNullOrWhiteSpace(syncKey))
                req.Headers.TryAddWithoutValidation("X-Ecosystem-Key", syncKey);
            if (!string.IsNullOrWhiteSpace(bearerToken))
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken.Trim());

            req.Content = JsonContent.Create(new
            {
                AutomationPostId = post.Id,
                Title = post.Title,
                Description = post.Description,
                YouTubeVideoId = post.PublishedVideoId,
                YouTubeUrl = post.PublishedVideoUrl,
                SourceType = post.SourceType.ToString(),
                DateKey = post.DateKey,
                PublishedDate = post.PublishedAtUtc ?? post.UpdatedAtUtc,
                ChannelName = post.TargetChannelTitle,
                SourceChannelHandle = post.TargetChannelHandle,
                Format = post.Format == AutomationVideoFormat.Vertical ? "Short" : "Video",
                IsFeaturedDailyVideo = post.SourceType == AutomationSourceType.HinduPanchang
            }, options: JsonOpts);

            using var res = await client.SendAsync(req, ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                logger.LogWarning("Panchang Video Hub sync returned HTTP {Status} for post {PostId}: {Body}",
                    (int)res.StatusCode, post.Id, body);
                post.LastError = $"Panchang sync HTTP {(int)res.StatusCode}";
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return false;
            }

            post.SyncedToEcosystemAtUtc = UtcNow;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Panchang Video Hub sync failed for post {PostId}", post.Id);
            post.LastError = ex.Message;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return false;
        }
    }

    private static string NormalizeSubtitlePreset(string? raw) => (raw ?? string.Empty).Trim().ToLowerInvariant() switch
    {
        "karaoke-pulse" or "karaoke" => "karaoke-pulse",
        "classic-clean" or "clean" => "classic-clean",
        _ => "event-glow"
    };

    private async Task<StoryRun> StartStoryRunForPostAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        CancellationToken ct)
    {
        var effectiveVisualEngine = post.VisualEngine != AutomationVisualEngine.Auto
            ? post.VisualEngine
            : rule?.VisualEngine ?? AutomationVisualEngine.Auto;
        var effectiveNarrativeMode = post.NarrativeMode != AutomationNarrativeMode.Auto
            ? post.NarrativeMode
            : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
        var targetSeconds = Math.Clamp(
            ResolvePostTargetSeconds(post, rule, effectiveNarrativeMode, 0),
            25,
            180);

        var attachedAssetIds = post.AttachedAssetIds.Count > 0
            ? [.. post.AttachedAssetIds]
            : (rule?.AttachedAssetIds ?? []).ToList();

        if (effectiveVisualEngine == AutomationVisualEngine.StorageImagesStory
            && attachedAssetIds.Count == 0
            && assets is not null)
        {
            var catalog = await GetStorageMediaCatalogAsync(userId, ct).ConfigureAwait(false);
            attachedAssetIds = [.. catalog.Images.Take(16).Select(i => i.Id)];
        }

        var isFullStory = targetSeconds >= 95 || effectiveNarrativeMode == AutomationNarrativeMode.FullStory;
        var storyStructureInstructions = isFullStory
            ? """
              COMPLETE ANIMATED STORY STRUCTURE (STRICTLY UNDER 3 MINUTES):
              1. Opening Context Hook (Scene 1): Start with the Narrator ([सूत्रधार] / Narrator) concisely explaining who the characters are, the setting/conflict, and why this story begins so viewers relate immediately.
              2. Multi-Scene Chronological Progression: Step logically across changing locations and chapters (e.g. Royal Court -> Forest Path -> Sacred Ashram & Mantra Initiation -> Tapasya -> Divine Darshan & Boon). Shift each scene's imagePrompt environment clearly!
              3. Multi-Character Acting & Visual Consistency: Populate every speaking character in `cast` with detailed English `look` (clothes, age, ornaments, face/hair) and repeat that visual identity across scenes.
              4. Closing Moral & Portal CTA (Final Scene): Have the Narrator clearly state the moral lesson of the story at the end followed by the call-to-action.
              """
            : """
              COMPACT STORY STRUCTURE (SHORT <= 60s):
              1. Brief Opening Context Hook by Narrator so viewers instantly understand who and why.
              2. Chronological multi-scene dialogue with distinct environment shifts and consistent `cast` visual looks.
              3. Clear closing moral takeaway before CTA.
              """;

        var brief = new StoryBrief
        {
            Title = post.Title,
            Notes = $"{storyStructureInstructions}\nSource: {post.SourceTitle}\n\n{post.Script}\n\nVisual style guide: {post.AiVideoPrompt}",
            Language = string.Equals(post.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi",
            TargetSeconds = targetSeconds,
            Format = post.Format == AutomationVideoFormat.Vertical ? StoryFormat.Vertical : StoryFormat.Wide,
            Writer = StoryWriterMode.Auto,
            Mode = post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha
                ? StoryGenreMode.Scripture
                : StoryGenreMode.Creative,
            Voicing = StoryVoicing.Narrated,
            BrandChannelId = rule?.BrandChannelId
        };

        var build = new StoryBuildOptions
        {
            Narration = StoryNarrationMode.Stock,
            Visuals = effectiveVisualEngine == AutomationVisualEngine.StorageImagesStory
                ? StoryVisualMode.UploadsOnly
                : StoryVisualMode.Auto,
            StorageAssetIds = attachedAssetIds,
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
        var isEnglish = string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase);
        var isFullStory = rule.NarrativeMode == AutomationNarrativeMode.FullStory
            || (rule.NarrativeMode != AutomationNarrativeMode.ShortReel
                && (rule.VideoFormat == AutomationVideoFormat.Wide || rule.TargetSeconds >= 95));
        var dialogueEnabled = rule.EnableCharacterDialogue
            || rule.SourceType is AutomationSourceType.DailyKatha or AutomationSourceType.HinduFestival or AutomationSourceType.HinduPanchang or AutomationSourceType.AajKaItihaas;
        var speakerHint = !string.IsNullOrWhiteSpace(rule.SpeakerAName) && !string.IsNullOrWhiteSpace(rule.SpeakerBName)
            ? $"Include primary characters [{rule.SpeakerAName.Trim()}] and [{rule.SpeakerBName.Trim()}], alongside [सूत्रधार] (or [Narrator]) and supporting characters where appropriate."
            : "Use [सूत्रधार] (or [Narrator] in English) for the brief opening context & ending moral, plus authentic characters suited to the story (e.g. [रानी सुनीति], [बालक ध्रुव], [देवर्षि नारद मुनि], [भगवान श्रीहरि विष्णु] for Dhruva; [राजा हरिश्चंद्र] & [महर्षि विश्वामित्र]; [आचार्य] & [जिज्ञासु]; [इतिहासकार] & [विद्यार्थी]).";
        var dialogueGuidance = dialogueEnabled
            ? $"""
               - Structured Story Dialogue Format (MANDATORY):
                 1) Opening line: Begin with `[सूत्रधार]: ...` (or `[Narrator]: ...`) giving a crisp 1-2 sentence CONTEXT HOOK introducing who, where, and why so new viewers immediately relate.
                 2) Chronological Multi-Scene & Multi-Character Progression: Enact the story step-by-step using `[Character Name]: spoken line` turns across changing locations (conflict -> journey/question -> turning point/guidance -> climax/resolution), NOT a static lecture on one background.
                 3) Closing Moral + CTA: Close with `[सूत्रधार]: ...` narrating the explicit MORAL OF THE STORY (कथा की सीख / Moral) followed cleanly by the website URL.
               - {speakerHint}
               - Never write raw mechanical labels like "Focus:" or "Moral:" inside spoken dialogue lines; state the moral naturally as `[सूत्रधार]`.
               - Turn count: {(isFullStory ? "10 to 14 complete story-arc turns (each 18-30 words, fitting smoothly under 3 minutes / ~165s total) covering the FULL beginning-to-end story." : "5 to 7 crisp chronological turns (each 12-20 words, ~55s short) covering Context Hook + Core Action + Ending Moral + CTA.")}
               """
            : "- Keep narration structured with brief opening context hook, chronological progression, clear ending moral, and website CTA without removing facts or times.";

        var languageGuidance = isEnglish
            ? "English (clear natural spoken English)"
            : "Pure Hindi in Devanagari script ONLY (translate ALL English story summaries, titles, headings, and labels like 'Focus:' / 'Moral:' completely into natural spoken Hindi; preserve ONLY website URLs and exact Panchang clock times/Tithi terms where needed).";

        var prompt = $"""
            You refine YouTube {(isFullStory ? "full-length" : "Shorts")} animated video scripts without removing ANY facts, numbers, Tithi/Muhurat times, or website links.
            Target Language: {languageGuidance}
            {dialogueGuidance}
            Return ONLY raw JSON (no markdown code fences) with exact keys: "title", "script", "aiVideoPrompt", "pinnedComment".
            Draft Title: {draft.Title}
            Draft Script:
            {draft.Script}
            Draft AI Prompt:
            {draft.AiVideoPrompt}
            Draft Pinned Comment:
            {draft.PinnedComment}
            Keep all website URLs verbatim. Title max 95 chars (complete readable title, never cut mid-word with '...').
            """;

        var outcome = await ai.TextAsync(
            new AiTextRequest { Prompt = prompt, MaxOutputTokens = 3200, Temperature = 0.4 },
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

            var refinedScript = Read("script", draft.Script);
            if (!string.IsNullOrWhiteSpace(draft.PrimaryDestinationUrl)
                && !refinedScript.Contains(draft.PrimaryDestinationUrl, StringComparison.OrdinalIgnoreCase)
                && draft.Script.Contains(draft.PrimaryDestinationUrl, StringComparison.OrdinalIgnoreCase))
            {
                refinedScript = $"{refinedScript}\n{draft.PrimaryDestinationUrl}";
            }

            var refinedComment = draft.PinnedComment is null ? null : Read("pinnedComment", draft.PinnedComment);
            if (refinedComment is not null
                && !string.IsNullOrWhiteSpace(draft.PrimaryDestinationUrl)
                && !refinedComment.Contains(draft.PrimaryDestinationUrl, StringComparison.OrdinalIgnoreCase))
            {
                refinedComment = $"{refinedComment}\n{draft.PrimaryDestinationUrl}";
            }

            return (draft with
            {
                Title = refinedTitle,
                Script = refinedScript,
                AiVideoPrompt = Read("aiVideoPrompt", draft.AiVideoPrompt),
                PinnedComment = refinedComment
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

    private static int ResolvePostTargetSeconds(
        AutomationPost post,
        AutomationRule? rule,
        AutomationNarrativeMode mode,
        int explicitSeconds)
    {
        if (explicitSeconds > 0)
            return Math.Clamp(explicitSeconds, 25, 180);
        if (post.TargetSeconds is > 0)
            return Math.Clamp(post.TargetSeconds.Value, 25, 180);

        return mode switch
        {
            AutomationNarrativeMode.FullStory => Math.Clamp(rule?.TargetSeconds is >= 95 ? rule.TargetSeconds : 165, 95, 180),
            AutomationNarrativeMode.ShortReel => Math.Clamp(rule?.TargetSeconds is > 0 and <= 60 ? rule.TargetSeconds : 55, 25, 60),
            _ => post.Format == AutomationVideoFormat.Wide
                ? Math.Clamp(rule?.TargetSeconds is >= 95 ? rule.TargetSeconds : 165, 95, 180)
                : Math.Clamp(rule?.TargetSeconds is > 0 ? Math.Min(rule.TargetSeconds, 180) : 55, 25, 180)
        };
    }

    private static (string Summary, int Percent) SummarizeStoryRunProgress(StoryRun run)
    {
        if (run.Stages.Count == 0)
            return ("Queued", 4);

        var active = run.Stages.FirstOrDefault(s => s.Status == StoryStageStatus.Running);
        var doneCount = run.Stages.Count(s => s.Status is StoryStageStatus.Completed or StoryStageStatus.Skipped);
        var stageFrac = active is not null ? active.Progress / 100.0 : 0.0;
        var percent = Math.Clamp((int)Math.Round(((doneCount + stageFrac) / run.Stages.Count) * 100.0), 4, 98);

        if (active is not null)
        {
            var stageLabel = active.Id switch
            {
                StoryStageIds.Research => "Research",
                StoryStageIds.Script => "Writing Script & Cast",
                StoryStageIds.Visuals => "Generating Scene Pictures",
                StoryStageIds.Narration => "Synthesizing Character Voices",
                StoryStageIds.Music => "Composing Background Score",
                StoryStageIds.Assemble => "Building Studio Project",
                StoryStageIds.Render => "Rendering Final MP4",
                StoryStageIds.Kit => "Finalizing YouTube Kit",
                _ => active.Id
            };
            var detail = string.IsNullOrWhiteSpace(active.Message) ? stageLabel : $"{stageLabel}: {active.Message}";
            return (detail, percent);
        }

        var next = run.Stages.FirstOrDefault(s => s.Status == StoryStageStatus.Pending);
        return next is not null ? ($"Preparing {next.Id}", percent) : ("In Progress", percent);
    }

    private async Task EnsureAutomationCastCharactersAsync(
        string userId,
        AutomationPost post,
        StoryScript script,
        CancellationToken ct)
    {
        var names = new List<string>();
        foreach (var member in script.Cast)
        {
            if (!string.IsNullOrWhiteSpace(member.Name))
                names.Add(member.Name.Trim());
        }
        post.ProvisionedCharacterNames = [.. names.Distinct(StringComparer.OrdinalIgnoreCase).Take(12)];

        if (characters is null || script.Cast.Count == 0) return;

        try
        {
            var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
            var libProject = userProjects.FirstOrDefault(p =>
                string.Equals(p.Name, CharacterLibraryProjectName, StringComparison.OrdinalIgnoreCase));

            if (libProject is null)
            {
                libProject = new Project
                {
                    Id = $"proj_autolib_{Guid.NewGuid():n}",
                    UserId = userId,
                    Name = CharacterLibraryProjectName,
                    Description = "Reusable animated characters provisioned automatically for daily stories.",
                    Status = ProjectStatus.Draft,
                    Settings = new ProjectSettings(),
                    CreatedAt = UtcNow,
                    UpdatedAt = UtcNow
                };
                await projects.InsertAsync(libProject, ct).ConfigureAwait(false);
            }

            var existing = await characters.ListByProjectAsync(libProject.Id, ct).ConfigureAwait(false);
            var byName = existing.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
            var colorIndex = byName.Count;

            foreach (var member in script.Cast)
            {
                var name = member.Name?.Trim();
                if (string.IsNullOrWhiteSpace(name)) continue;

                var isNarrator = string.Equals(name, StoryCastMember.Narrator, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(name, "सूत्रधार", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(name, "sutradhar", StringComparison.OrdinalIgnoreCase);

                if (byName.TryGetValue(name, out var existingChar))
                {
                    var changed = false;
                    if (!string.IsNullOrWhiteSpace(member.Look) && string.IsNullOrWhiteSpace(existingChar.Appearance.AdditionalDetails))
                    {
                        existingChar.Appearance.AdditionalDetails = member.Look;
                        existingChar.Description ??= member.Look;
                        changed = true;
                    }
                    if (!string.IsNullOrWhiteSpace(member.VoiceId) && existingChar.Voice is null)
                    {
                        existingChar.Voice = new CharacterVoice { Preset = member.VoiceId };
                        changed = true;
                    }
                    if (changed)
                    {
                        existingChar.UpdatedAt = UtcNow;
                        await characters.ReplaceAsync(existingChar, ct).ConfigureAwait(false);
                    }
                    continue;
                }

                var created = new Character
                {
                    Id = $"chr_{Guid.NewGuid():n}",
                    ProjectId = libProject.Id,
                    Name = name,
                    Description = string.IsNullOrWhiteSpace(member.Look)
                        ? $"Story character created for '{post.Title}'"
                        : member.Look,
                    IsNarrator = isNarrator,
                    IsAutoCreated = false,
                    SubtitleColorHex = isNarrator ? "#FDE68A" : CharacterPalette[colorIndex++ % CharacterPalette.Length],
                    Appearance = new CharacterAppearance
                    {
                        Gender = member.Gender,
                        AdditionalDetails = member.Look,
                        Age = member.Age?.ToLowerInvariant() switch
                        {
                            "child" => 9,
                            "young" => 22,
                            "adult" => 35,
                            "elder" => 65,
                            _ => null
                        }
                    },
                    Voice = string.IsNullOrWhiteSpace(member.VoiceId) ? null : new CharacterVoice { Preset = member.VoiceId },
                    CreatedAt = UtcNow,
                    UpdatedAt = UtcNow
                };
                await characters.InsertAsync(created, ct).ConfigureAwait(false);
                byName[name] = created;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not mirror story cast characters to library for post {PostId}", post.Id);
        }
    }

    private Task EnsureProceduralCharactersAsync(
        string userId,
        AutomationPost post,
        ProceduralDialoguePlan plan,
        CancellationToken ct)
    {
        var cast = new List<StoryCastMember>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddMember(string? rawName, CharacterVisualRole? role, string? description = null)
        {
            var name = rawName?.Trim();
            if (string.IsNullOrWhiteSpace(name) || !seen.Add(name)) return;
            var age = role switch
            {
                CharacterVisualRole.ChildDevotee => "child",
                CharacterVisualRole.SageRishi => "elder",
                _ => "adult"
            };
            cast.Add(new StoryCastMember
            {
                Name = name,
                Age = age,
                Look = description ?? role?.ToString()
            });
        }

        foreach (var turn in plan.Turns)
        {
            if (turn.IsTitleHook) continue;
            AddMember(turn.SpeakerName, turn.SpeakerRole);
        }
        if (plan.LeftCharacter is not null)
            AddMember(plan.LeftCharacter.Name, plan.LeftCharacter.Role);
        if (plan.RightCharacter is not null)
            AddMember(plan.RightCharacter.Name, plan.RightCharacter.Role);

        if (cast.Count == 0)
            return Task.CompletedTask;

        var syntheticScript = new StoryScript
        {
            Title = post.Title,
            Language = string.IsNullOrWhiteSpace(post.Language) ? "hi" : post.Language,
            Cast = cast
        };
        return EnsureAutomationCastCharactersAsync(userId, post, syntheticScript, ct);
    }

    private async Task<(string? TempDir, List<string> FilePaths)> MaterializeStorageImagesAsync(
        IReadOnlyList<string> assetIds,
        CancellationToken ct)
    {
        if (assets is null || assetIds.Count == 0) return (null, []);

        var fetched = await assets.GetManyAsync(assetIds, ct).ConfigureAwait(false);
        var byId = fetched
            .Where(a => a.Kind == AssetKind.Image && !string.IsNullOrWhiteSpace(a.StorageKey))
            .ToDictionary(a => a.Id, StringComparer.Ordinal);

        if (byId.Count == 0) return (null, []);

        var tempDir = Path.Combine(Path.GetTempPath(), $"animstudio-auto-bg-{Guid.NewGuid():n}");
        Directory.CreateDirectory(tempDir);
        var paths = new List<string>(assetIds.Count);

        foreach (var id in assetIds)
        {
            if (!byId.TryGetValue(id, out var asset)) continue;
            await using var stream = await objectStore.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
            if (stream is null) continue;

            var ext = asset.MimeType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };
            var filePath = Path.Combine(tempDir, $"{paths.Count:D2}_{asset.Id}{ext}");
            await using var fs = File.Create(filePath);
            await stream.CopyToAsync(fs, ct).ConfigureAwait(false);
            paths.Add(filePath);
        }

        if (paths.Count == 0)
        {
            try { Directory.Delete(tempDir, recursive: true); } catch { }
            return (null, []);
        }

        return (tempDir, paths);
    }
}
