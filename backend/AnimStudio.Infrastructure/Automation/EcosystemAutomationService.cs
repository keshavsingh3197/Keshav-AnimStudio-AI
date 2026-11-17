using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
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
/// <summary>
/// A copy-and-paste script template for a post. <c>Kind</c> is <c>story</c> (Story Agent JSON) or <c>dialogue</c>
/// (Enhanced 3D lines); <c>Ready</c> is false while the story run is still researching, with <c>Message</c> saying why.
/// </summary>
public sealed record AutomationScriptTemplate(string Kind, bool Ready, string? Prompt, string? Message);

public sealed partial class EcosystemAutomationService(
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
    YouTubeVideoStatusClient videoClient,
    IObjectStore objectStore,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<EcosystemAutomationService> logger,
    IAssetRepository? assets = null,
    ICharacterRepository? characters = null,
    AnimStudio.Application.Songs.SongLibrary? songLibrary = null,
    Microsoft.Extensions.Options.IOptions<AnimStudio.Infrastructure.Ffmpeg.FfmpegOptions>? ffmpegOptions = null,
    AnimStudio.Infrastructure.Ecosystem.CentralChannelVideoWriter? catalogWriter = null,
    IAiProviderRegistry? aiRegistry = null,
    IAiUsageRepository? aiUsage = null,
    IEffectClipRepository? effects = null,
    IAiSettingsRepository? aiSettingsRepo = null,
    YouTubeThumbnailService? thumbnailService = null)
{
    private const string WorkspaceConfigKey = "Automation:Workspace:Config";
    private const string StagingFolderName = "automation-staging";
    private const string CharacterLibraryProjectName = "Automation Characters Library";
    private const string BackgroundTemplatesProjectName = "Automation Background Templates";

    /// <summary>Start of the post's stage summary while its story waits for a review; the web app matches on it.</summary>
    private const string ReviewSummaryPrefix = "Waiting for your review: ";
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> PrepareLocks = new(StringComparer.OrdinalIgnoreCase);
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

        var posts = postsTask.Result.ToList();
        foreach (var post in posts.Where(p => p.Status == AutomationPostStatus.GeneratingVideo))
        {
            await PollStoryRunProgressAsync(post, settings, ct).ConfigureAwait(false);
        }
        // Cards prepared twice for one pipeline + day (older unstable keys, or two API instances racing) collapse here.
        await RemoveDuplicateDraftsAsync(posts, ct).ConfigureAwait(false);

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
            posts,
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
        rule.TargetSeconds = Math.Clamp(draft.TargetSeconds, MinVideoSeconds, MaxSecondsFor(rule.VideoFormat));
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
        rule.ComedyStyle = draft.ComedyStyle;
        rule.AutoInsertMemes = draft.AutoInsertMemes;
        if (rule.SourceType == AutomationSourceType.FunnyComedy && string.Equals(rule.CategoryId, "22", StringComparison.Ordinal))
            rule.CategoryId = "23";
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
            await BuildFunnyComedyStarterRuleAsync(userId, 6, worldChannel, settings, now, ct).ConfigureAwait(false)
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
        // Serialize preparation per (userId, effectiveDate) so overlapping worker/UI calls
        // cannot race past the fingerprint check and insert duplicate cards.
        var gate = PrepareLocks.GetOrAdd($"{userId}:{effectiveDate}", static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            return await PrepareForDateCoreAsync(userId, effectiveDate, ruleId, forceRegenerate, settings, ct).ConfigureAwait(false);
        }
        finally
        {
            gate.Release();
        }
    }

    private async Task<AutomationPrepareResult> PrepareForDateCoreAsync(
        string userId,
        string effectiveDate,
        string? ruleId,
        bool forceRegenerate,
        AutomationWorkspaceConfig settings,
        CancellationToken ct)
    {
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
        var postsOnDate = (await repository.ListPostsAsync(userId, effectiveDate, effectiveDate, null, 400, ct).ConfigureAwait(false)).ToList();
        var duplicatesRemoved = await RemoveDuplicateDraftsAsync(postsOnDate, ct).ConfigureAwait(false);

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
                var existing = AutomationPost.SelectPreferred(
                    postsOnDate.Where(p => string.Equals(p.Fingerprint, fingerprint, StringComparison.OrdinalIgnoreCase)));
                existing ??= await repository.FindPostByFingerprintAsync(userId, fingerprint, ct).ConfigureAwait(false);
                // One card per rule per day (festivals excepted): a slot prepared earlier under an older or
                // upstream-dependent key (e.g. Panchang API down, a different lead history event) is the same card.
                if (existing is null && IsSingleSlotSource(rule.SourceType))
                {
                    existing = AutomationPost.SelectPreferred(postsOnDate.Where(p =>
                        string.Equals(p.RuleId, rule.Id, StringComparison.Ordinal)
                        && string.Equals(p.DateKey, effectiveDate, StringComparison.Ordinal)));
                }

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
                post.ComedyStyle = rule.ComedyStyle;
                post.AutoInsertMemes = rule.AutoInsertMemes;
                if (post.NarrativeMode == AutomationNarrativeMode.FullStory && post.TargetSeconds is null or < 95)
                    post.TargetSeconds = Math.Clamp(rule.TargetSeconds >= 95 ? rule.TargetSeconds : 165, 95, MaxSecondsFor(rule.VideoFormat));
                else if (post.NarrativeMode == AutomationNarrativeMode.ShortReel)
                    post.TargetSeconds = Math.Clamp(rule.TargetSeconds <= 60 ? rule.TargetSeconds : 55, 25, 60);
                if (post.AttachedAssetIds.Count == 0 && rule.AttachedAssetIds.Count > 0)
                    post.AttachedAssetIds = [.. rule.AttachedAssetIds];
                post.UpdatedAtUtc = UtcNow;

                if (existing is null)
                {
                    // Another API instance (local dev + hosted server share one database) may prepare the same
                    // slot at the same moment; the in-process lock cannot see it. Save, re-read, and let one card
                    // win the same way on every instance so both converge on a single card.
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    var winner = await ResolveSlotWinnerAsync(userId, post, ct).ConfigureAwait(false);
                    if (!string.Equals(winner.Id, post.Id, StringComparison.Ordinal))
                    {
                        await repository.DeletePostAsync(post.Id, ct).ConfigureAwait(false);
                        if (!postsOnDate.Any(p => string.Equals(p.Id, winner.Id, StringComparison.Ordinal)))
                            postsOnDate.Add(winner);
                        touchedPosts.Add(winner);
                        continue;
                    }
                }

                if (post.Format == AutomationVideoFormat.CommunityPost)
                {
                    if (string.IsNullOrWhiteSpace(post.CommunityCardStorageKey) && rule.Mode != AutomationPostMode.PreviewOnly)
                    {
                        await AttachCommunityPromoCardAsync(post, ct).ConfigureAwait(false);
                    }
                    post.Status = AutomationPostStatus.VideoReadyForReview;
                    await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                    if (!postsOnDate.Any(p => string.Equals(p.Id, post.Id, StringComparison.Ordinal)))
                        postsOnDate.Add(post);
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

                if (!postsOnDate.Any(p => string.Equals(p.Id, post.Id, StringComparison.Ordinal)))
                    postsOnDate.Add(post);

                if (existing is null) created++;
                else updated++;

                touchedPosts.Add(post);
            }

            rule.LastPreparedDateKey = effectiveDate;
            rule.Language = string.IsNullOrWhiteSpace(rule.Language) ? "hi" : rule.Language.Trim().ToLowerInvariant();
        rule.UpdatedAtUtc = UtcNow;
            await repository.UpsertRuleAsync(rule, ct).ConfigureAwait(false);
        }

        IReadOnlyList<string> warnings = duplicatesRemoved > 0
            ? [.. signals.Warnings, $"Removed {duplicatesRemoved} duplicate draft card(s) for the same pipeline and day."]
            : signals.Warnings;
        return new AutomationPrepareResult(
            effectiveDate,
            selectedRules.Count,
            created,
            updated,
            autoVideosStarted,
            autoQueued,
            warnings,
            touchedPosts
                .GroupBy(p => p.Id, StringComparer.Ordinal)
                .Select(g => g.Last())
                .ToList());
    }

    /// <summary>Every source except festivals yields exactly one card per rule per day.</summary>
    internal static bool IsSingleSlotSource(AutomationSourceType sourceType) =>
        sourceType != AutomationSourceType.HinduFestival;

    /// <summary>The identity of a card's daily slot: rule + day, or the full fingerprint for multi-item festival rules.</summary>
    internal static string SlotKeyOf(AutomationPost post) =>
        IsSingleSlotSource(post.SourceType)
            ? $"{post.DateKey}:{post.RuleId}"
            : post.Fingerprint.ToLowerInvariant();

    /// <summary>A duplicate that can be dropped without losing anything on YouTube or an in-flight job.</summary>
    private static bool IsDisposableDuplicate(AutomationPost post) =>
        string.IsNullOrWhiteSpace(post.PublishedVideoId)
        // A card whose upload was removed from YouTube is kept on purpose (e.g. to publish to another channel).
        && post.RemovedVideos.Count == 0
        && post.Status is AutomationPostStatus.PreparedPreview
            or AutomationPostStatus.VideoReadyForReview
            or AutomationPostStatus.Failed
            or AutomationPostStatus.Skipped;

    private static bool HasVideo(AutomationPost post) =>
        !string.IsNullOrWhiteSpace(post.AttachedRenderJobId) || !string.IsNullOrWhiteSpace(post.AttachedHandoffId);

    /// <summary>
    /// Collapses cards that share a daily slot: keeps the most advanced one (published / uploading / with a video) and
    /// deletes the redundant drafts. Published, uploading or rendering duplicates are never touched, nor is a draft
    /// holding the only finished video. Returns how many were removed and drops them from <paramref name="posts"/>.
    /// </summary>
    internal async Task<int> RemoveDuplicateDraftsAsync(List<AutomationPost> posts, CancellationToken ct)
    {
        var removed = 0;
        var groups = posts
            .Where(p => !string.IsNullOrWhiteSpace(p.RuleId) && !string.IsNullOrWhiteSpace(p.DateKey))
            .GroupBy(SlotKeyOf, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .ToList();

        foreach (var group in groups)
        {
            var keep = AutomationPost.SelectPreferred(group)!;
            foreach (var dup in group.Where(p => !ReferenceEquals(p, keep) && IsDisposableDuplicate(p)).ToList())
            {
                // A draft that holds a finished video the kept card lacks is not redundant.
                if (HasVideo(dup) && !HasVideo(keep)) continue;

                if (await repository.DeletePostAsync(dup.Id, ct).ConfigureAwait(false))
                {
                    logger.LogInformation("Removed duplicate automation draft {PostId} (kept {KeptId}) for slot {Slot}", dup.Id, keep.Id, group.Key);
                    removed++;
                }
                posts.Remove(dup);
            }
        }
        return removed;
    }

    /// <summary>
    /// The card that owns this new post's slot, as the database stands now: an advanced rival (published, uploading,
    /// with a video) first, else the earliest created (ties broken by id) so every instance picks the same one.
    /// </summary>
    private async Task<AutomationPost> ResolveSlotWinnerAsync(string userId, AutomationPost post, CancellationToken ct)
    {
        var slot = SlotKeyOf(post);
        var rivals = (await repository.ListPostsAsync(userId, post.DateKey, post.DateKey, null, 400, ct).ConfigureAwait(false))
            .Where(p => string.Equals(SlotKeyOf(p), slot, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (rivals.Count <= 1) return post;

        var advanced = rivals
            .Where(p => !string.Equals(p.Id, post.Id, StringComparison.Ordinal) && (!IsDisposableDuplicate(p) || HasVideo(p)))
            .ToList();
        if (advanced.Count > 0) return AutomationPost.SelectPreferred(advanced)!;

        return rivals
            .OrderBy(p => p.CreatedAtUtc)
            .ThenBy(p => p.Id, StringComparer.Ordinal)
            .First();
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

        if (!string.IsNullOrWhiteSpace(update.Title))
        {
            var nextTitle = update.Title.Trim();
            if (!string.Equals(nextTitle, post.Title, StringComparison.Ordinal) && nextTitle.Length > YouTubePublishValidator.MaxTitleLength)
                throw EditingException.Invalid("youtube-title-too-long", $"Title must be {YouTubePublishValidator.MaxTitleLength} characters or fewer.");
            post.Title = nextTitle;
        }
        if (update.Script is not null) post.Script = update.Script.Trim();
        if (update.AiVideoPrompt is not null) post.AiVideoPrompt = update.AiVideoPrompt.Trim();
        if (update.AiThumbnailPrompt is not null) post.AiThumbnailPrompt = update.AiThumbnailPrompt.Trim();
        if (update.Description is not null) post.Description = update.Description.Trim();
        post.PinnedComment = string.IsNullOrWhiteSpace(update.PinnedComment) ? null : update.PinnedComment.Trim();
        if (update.Tags is not null)
        {
            var cleanTags = update.Tags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (cleanTags.Count > YouTubePublishValidator.MaxTagCount)
                throw EditingException.Invalid("tags-too-many", $"Use at most {YouTubePublishValidator.MaxTagCount} tags.");
            if (cleanTags.Count > 0
                && !cleanTags.SequenceEqual(post.Tags, StringComparer.Ordinal)
                && YouTubePublishValidator.TagsLength(cleanTags) > YouTubePublishValidator.MaxTagsLength)
                throw EditingException.Invalid("tags-too-long", $"Tags combined must be {YouTubePublishValidator.MaxTagsLength} characters or fewer.");
            post.Tags = cleanTags;
        }
        if (!string.IsNullOrWhiteSpace(update.Privacy) && YouTubePublishValidator.Privacies.Contains(update.Privacy, StringComparer.OrdinalIgnoreCase))
            post.Privacy = update.Privacy.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(update.CategoryId) && YouTubePublishValidator.Categories.ContainsKey(update.CategoryId))
            post.CategoryId = update.CategoryId;
        post.MadeForKids = update.MadeForKids;
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
            post.TargetSeconds = ClampStoredSeconds(update.TargetSeconds.Value);
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
        if (post.ScheduledAtUtc is { } scheduledAt)
        {
            post.ScheduledAtUtc = scheduledAt.Kind switch
            {
                DateTimeKind.Utc => scheduledAt,
                DateTimeKind.Local => scheduledAt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(scheduledAt, DateTimeKind.Utc)
            };
        }
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await SyncQueuedItemAsync(userId, post, includeSchedule: true, ct).ConfigureAwait(false);
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
        IReadOnlyList<string>? attachedAssetIds = null,
        bool useTemplateScript = false)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");

        if (visualEngine.HasValue)
            post.VisualEngine = visualEngine.Value;
        if (narrativeMode.HasValue)
            post.NarrativeMode = narrativeMode.Value;
        if (targetSeconds.HasValue && targetSeconds.Value > 0)
            post.TargetSeconds = ClampStoredSeconds(targetSeconds.Value);
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
            await AttachProceduralAnimatedVideoAsync(userId, post, rule, ProceduralSceneTheme.Auto, seconds, "720p", ct,
                trackProgress: true).ConfigureAwait(false);
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        var run = await StartStoryRunForPostAsync(userId, post, rule, ct, manualScript: useTemplateScript)
            .ConfigureAwait(false);

        post.AttachedStoryRunId = run.Id;
        post.AttachedVideoSourceLabel = useTemplateScript
            ? "AI Story Studio (Waiting for your template script...)"
            : "AI Story Studio (Preparing Story & Characters...)";
        post.StoryStageSummary = useTemplateScript ? "Preparing script template" : "Research & Story Script";
        post.StoryProgressPercent = 6;
        post.Status = AutomationPostStatus.GeneratingVideo;
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    /// <summary>
    /// Starts the post's failed or stopped story run again from the step it stopped at (e.g. the voices, once the
    /// speech engine is running). The script, pictures and voices already made are kept, so nothing is paid for twice.
    /// </summary>
    public async Task<AutomationPost> RetryAiVideoAsync(string userId, string postId, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");
        if (string.IsNullOrWhiteSpace(post.AttachedStoryRunId) || post.VisualEngine == AutomationVisualEngine.Procedural3D)
            throw EditingException.Invalid("no-story-run", "This post has no story run to retry. Use Generate Video instead.");

        // Ownership of the run is checked again inside the story service.
        await storyRuns.RetryAsync(userId, post.AttachedStoryRunId, ct).ConfigureAwait(false);

        post.Status = AutomationPostStatus.GeneratingVideo;
        post.StoryStageSummary = "Retrying from the failed step";
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
        await AttachProceduralAnimatedVideoAsync(userId, post, rule, theme, durationSeconds, resolution, ct,
            trackProgress: true).ConfigureAwait(false);

        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    /// <summary>
    /// Saves the Enhanced 3D stage choices for a post (background template, character spots, location, music, voice
    /// pacing). A background template must be an image in one of the user's own projects.
    /// </summary>
    public async Task<AutomationPost> SaveStageSettingsAsync(
        string userId,
        string postId,
        AutomationStageSettings? input,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing)
            throw EditingException.Conflict("post-locked", "This post is uploading right now. Try again when it finishes.");

        AutomationStageSettings stage;
        try
        {
            stage = AutomationStageScript.Normalize(input);
        }
        catch (ArgumentException)
        {
            throw EditingException.Invalid("stage-invalid", "That background image is not valid. Pick or upload it again.");
        }

        if (stage.BackgroundTemplateAssetId is { } templateId && !await IsOwnedImageAsync(userId, templateId, ct).ConfigureAwait(false))
            throw EditingException.Invalid("template-not-found", "That background image was not found in your Studio Storage.");

        // Default deny: every scene picture must be one of the user's own images.
        if (stage.SceneBackgroundAssetIds.Count > 0)
        {
            var owned = await OwnedImageIdsAsync(userId, stage.SceneBackgroundAssetIds, ct).ConfigureAwait(false);
            if (stage.SceneBackgroundAssetIds.Any(id => !owned.Contains(id)))
                throw EditingException.Invalid("scene-picture-not-found", "A scene picture was not found in your Studio Storage. Upload it again.");
        }

        post.Stage = stage;
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    /// <summary>The user's project that holds uploaded background templates, created on first use.</summary>
    public async Task<string> EnsureBackgroundTemplateProjectAsync(string userId, CancellationToken ct)
    {
        var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
        var existing = userProjects.FirstOrDefault(p =>
            string.Equals(p.Name, BackgroundTemplatesProjectName, StringComparison.OrdinalIgnoreCase));
        if (existing is not null) return existing.Id;

        var created = new Project
        {
            Id = $"proj_autobg_{Guid.NewGuid():n}",
            UserId = userId,
            Name = BackgroundTemplatesProjectName,
            Description = "Background pictures uploaded for Enhanced 3D auto-post videos. Reusable from Studio Storage.",
            Status = ProjectStatus.Draft,
            Settings = new ProjectSettings(),
            CreatedAt = UtcNow,
            UpdatedAt = UtcNow
        };
        await projects.InsertAsync(created, ct).ConfigureAwait(false);
        return created.Id;
    }

    private async Task<bool> IsOwnedImageAsync(string userId, string assetId, CancellationToken ct)
    {
        if (assets is null) return false;
        var found = await assets.GetManyAsync([assetId], ct).ConfigureAwait(false);
        var asset = found.FirstOrDefault(a => string.Equals(a.Id, assetId, StringComparison.Ordinal));
        if (asset is null || asset.Kind != AssetKind.Image || string.IsNullOrWhiteSpace(asset.StorageKey)) return false;
        var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
        return userProjects.Any(p => string.Equals(p.Id, asset.ProjectId, StringComparison.Ordinal));
    }

    /// <summary>The ids among <paramref name="assetIds"/> that are images in the user's own projects.</summary>
    private async Task<HashSet<string>> OwnedImageIdsAsync(string userId, IReadOnlyCollection<string> assetIds, CancellationToken ct)
    {
        var owned = new HashSet<string>(StringComparer.Ordinal);
        if (assets is null || assetIds.Count == 0) return owned;
        var found = await assets.GetManyAsync([.. assetIds.Distinct(StringComparer.Ordinal)], ct).ConfigureAwait(false);
        var projectIds = (await projects.ListAsync(userId, ct).ConfigureAwait(false)).Select(p => p.Id).ToHashSet(StringComparer.Ordinal);
        foreach (var asset in found)
        {
            if (asset.Kind == AssetKind.Image && !string.IsNullOrWhiteSpace(asset.StorageKey) && projectIds.Contains(asset.ProjectId))
                owned.Add(asset.Id);
        }
        return owned;
    }

    /// <summary>
    /// The script template for a post, to copy into any outside AI (ChatGPT, Gemini, Claude...) and paste the reply back.
    /// For the story engines it is the Story Agent's own manual prompt for the post's linked run (full JSON shape: scenes,
    /// seconds, cast looks, camera, image prompts), available once that run's research is in. For Enhanced 3D it is a
    /// dialogue template in the <c>[Speaker]: line</c> form the procedural stage parses.
    /// </summary>
    public async Task<AutomationScriptTemplate> GetScriptTemplateAsync(
        string userId,
        string postId,
        AutomationVisualEngine engine,
        int? targetSeconds,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (engine == AutomationVisualEngine.Procedural3D)
        {
            var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
            var userMemes = effects is not null && IsComedyAutomationPost(post, rule)
                ? await effects.ListByUserAsync(userId, 200, ct).ConfigureAwait(false)
                : [];
            return new AutomationScriptTemplate("dialogue", true,
                BuildDialogueTemplatePrompt(post, rule, targetSeconds ?? 0, userMemes), null);
        }

        if (string.IsNullOrWhiteSpace(post.AttachedStoryRunId))
            return new AutomationScriptTemplate("story", false, null, "Start a template story for this post first.");

        var run = await storyRuns.GetAsync(userId, post.AttachedStoryRunId, ct).ConfigureAwait(false);
        if (run.Status is not (StoryRunStatus.AwaitingScript or StoryRunStatus.ScriptReady))
        {
            var why = run.Status switch
            {
                StoryRunStatus.Failed or StoryRunStatus.Cancelled => "This story run stopped. Start a new template story.",
                StoryRunStatus.Completed => "This story is already finished.",
                _ when run.Research is null => "Researching the topic. The template is ready in a few seconds.",
                _ => "This story already has its script and is being made."
            };
            return new AutomationScriptTemplate("story", false, null, why);
        }
        if (run.Research is null)
            return new AutomationScriptTemplate("story", false, null, "Researching the topic. The template is ready in a few seconds.");

        var prompt = await storyRuns.ManualPromptAsync(userId, run.Id, ct).ConfigureAwait(false);
        return new AutomationScriptTemplate("story", true, prompt, null);
    }

    /// <summary>
    /// Takes the reply an outside AI wrote from the template. A story reply goes to the linked run, where the Story
    /// Agent's parser checks it like a model's own; the run then builds and renders on its own. A 3D reply is cleaned to
    /// its dialogue lines, kept as the post's script, and rendered straight away.
    /// </summary>
    public async Task<AutomationPost> SubmitScriptTemplateAsync(
        string userId,
        string postId,
        AutomationVisualEngine engine,
        string? reply,
        CancellationToken ct,
        int? targetSeconds = null,
        string? subtitlePreset = null)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (post.Status is AutomationPostStatus.Publishing or AutomationPostStatus.Published)
            throw EditingException.Conflict("post-locked", "Cannot regenerate video once uploading or published.");
        if (string.IsNullOrWhiteSpace(reply))
            throw EditingException.Invalid("reply-empty", "Paste the AI's reply first.");
        if (reply.Length > MaxTemplateReplyChars)
            throw EditingException.Invalid("reply-too-long", "That reply is far longer than any script. Paste only the answer.");

        if (engine == AutomationVisualEngine.Procedural3D)
        {
            var script = CleanPastedDialogue(reply)
                ?? throw EditingException.Invalid("reply-no-dialogue",
                    "No dialogue lines found. Every line must look like [Character Name]: what they say.");

            var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
            post.Script = script;
            post.EnableCharacterDialogue = true;
            post.VisualEngine = AutomationVisualEngine.Procedural3D;
            // The length picked in the wizard is the one the template was written for; keep it so re-renders match.
            if (targetSeconds is > 0)
                post.TargetSeconds = ClampStoredSeconds(targetSeconds.Value);
            if (!string.IsNullOrWhiteSpace(subtitlePreset))
                post.SubtitlePreset = NormalizeSubtitlePreset(subtitlePreset);
            var effectiveMode = post.NarrativeMode != AutomationNarrativeMode.Auto
                ? post.NarrativeMode
                : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
            var seconds = ResolvePostTargetSeconds(post, rule, effectiveMode, targetSeconds ?? 0);
            await AttachProceduralAnimatedVideoAsync(userId, post, rule, ProceduralSceneTheme.Auto, seconds, "720p", ct,
                keepScriptAsWritten: true, trackProgress: true).ConfigureAwait(false);
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return post;
        }

        if (string.IsNullOrWhiteSpace(post.AttachedStoryRunId))
            throw EditingException.Conflict("no-story-run", "Start a template story for this post first.");

        // Ownership of the run is checked again inside the Story Agent; its parser treats the reply as untrusted.
        var run = await storyRuns.SubmitScriptAsync(userId, post.AttachedStoryRunId, reply, ct).ConfigureAwait(false);
        post.Status = AutomationPostStatus.GeneratingVideo;
        post.StoryStageSummary = "Script received - building scenes";
        post.AttachedVideoSourceLabel = run.Script is { Scenes.Count: > 0 } s
            ? $"AI Story Studio (Template script, {s.Scenes.Count} scenes)"
            : "AI Story Studio (Template script)";
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        return post;
    }

    private const int MaxTemplateReplyChars = 60_000;
    /// <summary>Enough for a 10-minute full video (about 72 lines) with room to spare.</summary>
    internal const int MaxPastedDialogueTurns = 90;

    /// <summary>Spoken words per second the voice engine averages (Hindi and English are close enough to share it).</summary>
    private const double SpokenWordsPerSecond = 2.4;
    private const int WordsPerDialogueLine = 20;

    /// <summary>
    /// The scene count, dialogue-line range and spoken-word budget that fill <paramref name="seconds"/> of video, so the
    /// template asks for a 3-minute story when 3 minutes was picked, not a fixed short-or-long bucket.
    /// </summary>
    internal static (int MinScenes, int MaxScenes, int MinLines, int MaxLines, int Words) DialogueBudget(int seconds)
    {
        var s = Math.Clamp(seconds, MinVideoSeconds, FullVideoMaxSeconds);
        var words = (int)(Math.Round(s * SpokenWordsPerSecond / 10.0) * 10);
        var lines = Math.Max(5, (int)Math.Round(words / (double)WordsPerDialogueLine));
        var minLines = Math.Max(5, lines - 1);
        var maxLines = Math.Min(MaxPastedDialogueTurns, lines + 2);
        // About one setting change every 36 seconds, up to what the 3D stage keeps.
        var minScenes = Math.Clamp((int)Math.Round(s / 36.0), 2, DialogueScriptParser.MaxScenes - 1);
        var maxScenes = Math.Min(DialogueScriptParser.MaxScenes, minScenes + 1);
        return (minScenes, maxScenes, minLines, maxLines, words);
    }

    private static bool IsComedyAutomationPost(AutomationPost post, AutomationRule? rule = null) =>
        post.SourceType == AutomationSourceType.FunnyComedy
        || rule?.SourceType == AutomationSourceType.FunnyComedy
        || ComedyChannelMatcher.IsComedyChannelHint(
            post.TargetChannelHandle, post.TargetChannelTitle,
            rule?.TargetChannelHandle, rule?.TargetChannelTitle);

    internal static string BuildDialogueTemplatePrompt(
        AutomationPost post,
        AutomationRule? rule,
        int explicitSeconds = 0,
        IReadOnlyList<AnimStudio.Domain.Effects.EffectClip>? userMemes = null)
    {
        var isEnglish = string.Equals(post.Language, "en", StringComparison.OrdinalIgnoreCase);
        var isComedy = IsComedyAutomationPost(post, rule);
        var effectiveMode = post.NarrativeMode != AutomationNarrativeMode.Auto
            ? post.NarrativeMode
            : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
        var seconds = ResolvePostTargetSeconds(post, rule, effectiveMode, explicitSeconds);
        var budget = DialogueBudget(seconds);
        var isLong = seconds >= 95;
        var runtime = $"{seconds / 60}:{seconds % 60:00}";
        var turns = $"{budget.MinLines} to {budget.MaxLines}";
        var scenes = $"{budget.MinScenes} to {budget.MaxScenes}";
        var kind = isComedy ? (isLong ? "comedy skit compilation" : "viral comedy skit") : (isLong ? "complete story" : "short story");
        var narrator = isEnglish ? "Narrator" : "सूत्रधार";
        var comedyTone = post.ComedyStyle != ComedyToneStyle.Auto ? post.ComedyStyle : (rule?.ComedyStyle ?? ComedyToneStyle.Auto);
        var includeMemes = post.AutoInsertMemes && (rule?.AutoInsertMemes ?? true);
        var speakers = isComedy
            ? (!string.IsNullOrWhiteSpace(post.SpeakerAName) && !string.IsNullOrWhiteSpace(post.SpeakerBName)
                ? $"Main comedy duo: [{post.SpeakerAName!.Trim()}] and [{post.SpeakerBName!.Trim()}]. Optionally add 1 funny supporting character (e.g. [चायवाला] or [पड़ोसी])."
                : "Choose 2 sharp-tongued main buddies plus 1 funny bystander ([चायवाला], [पड़ोसी], or [दुकानदार]).")
            : (!string.IsNullOrWhiteSpace(post.SpeakerAName) && !string.IsNullOrWhiteSpace(post.SpeakerBName)
                ? $"Main characters: [{post.SpeakerAName!.Trim()}] and [{post.SpeakerBName!.Trim()}]. Add 1 to 3 supporting characters (sub-characters) if the story has them - a mother, a king, a guard, a villager, a god appearing."
                : "Choose 2 main characters who carry the story, plus 1 to 3 supporting characters (sub-characters) who really belong in it - family, king, sage, guard, villager, a deity appearing.");
        var language = isEnglish
            ? "Natural spoken English."
            : (isComedy
                ? "Colloquial spicy Hindi in Devanagari script matching the comedy tone below (NEVER stiff textbook Hindi or 'आप/महोदय'). Keep only URLs in Latin; scene and cast tags stay English."
                : "Pure spoken Hindi in Devanagari script. Keep only website URLs and exact times in their original form. Scene and cast lines may be in English.");
        var settings = isComedy
            ? "chai stall, comedy stage, village, modern city"
            : "temple, forest ashram, river ghat, himalaya, palace court, cosmos, village, battlefield, archive/library, modern city";
        var roles = isComedy
            ? "scholar, child, warrior, queen/mother, villager"
            : "king, queen/mother, sage, divine/god, child, warrior, scholar, villager";
        var stage = post.Stage;
        var location = AutomationStageScript.CleanLocation(stage?.LocationPrompt);
        var hasTemplate = !string.IsNullOrWhiteSpace(stage?.BackgroundTemplateAssetId);
        var placeRule = (hasTemplate, location) switch
        {
            (true, { } loc) => $"{Environment.NewLine}- PLACE: the whole story happens at: {loc}. A fixed background picture of this place is already used, so keep every scene there; use [SCENE] lines only to change time of day and mood.",
            (true, null) => $"{Environment.NewLine}- PLACE: a fixed background picture is already used for the whole video, so keep every scene in one place; use [SCENE] lines only to change time of day and mood.",
            (false, { } loc) => $"{Environment.NewLine}- PLACE: the story happens at: {loc}. The first [SCENE] line must describe this place.",
            _ => string.Empty
        };

        if (isComedy)
        {
            var craftBlock = ComedyCraftGuide.BuildPromptGuidance(
                comedyTone, post.Language, seconds, userMemes, includeMemes, isProceduralFormat: true);
            return $"""
                Write the complete script for a {seconds}-second ({runtime} min) {kind} as an animated 3D YouTube {(post.Format == AutomationVideoFormat.Wide ? "video (16:9)" : "Short (9:16)")}: a cast list, scene directions, spoken comedy banter, and mid-video reaction [MEME] beats.
                TARGET LENGTH: {seconds} seconds of rapid comic dialogue, about {budget.Words} spoken words total.

                TOPIC: {post.Title}
                SOURCE / CONTEXT: {post.SourceTitle}
                {(string.IsNullOrWhiteSpace(post.SourceSummary) ? string.Empty : $"FACTS: {post.SourceSummary}")}

                CURRENT DRAFT:
                {post.Script}

                {craftBlock}

                SCRIPT RULES
                - Language: {language}
                - {speakers}{placeRule}
                - CAST block first: one [CAST] line per character. Role is one of: {roles}. Look = comic outfit colours/props, e.g. "bright orange hoodie, messy hair, funky glasses".
                - Split into {scenes} brisk scenes using [SCENE]: setting | time of day | mood | IMAGE: background picture prompt (setting: {settings}; time: dawn, day, sunset, night). No people, no faces, no text in IMAGE prompt.
                - Write {turns} snappy dialogue lines (about 6-15 words each, ~{budget.Words} words altogether) with inline emotion tags like `(sarcastic)` or `(surprised)` at the start of lines when helpful.
                - Do NOT start with "नमस्कार" and do NOT end with a moral lecture!

                OUTPUT FORMAT - return ONLY lines like these (no markdown fences, no commentary):
                [CAST]: {(string.IsNullOrWhiteSpace(post.SpeakerAName) ? "पप्पू भैया" : post.SpeakerAName)} | scholar | orange jacket, messy hair, oversized shades
                [CAST]: {(string.IsNullOrWhiteSpace(post.SpeakerBName) ? "बबलू यार" : post.SpeakerBName)} | child | yellow kurta, muffler, mischievous grin
                [SCENE]: chai stall | day | playful | IMAGE: lively Indian roadside chai tapri with steaming brass kettle, plastic stools, bright morning light, photorealistic 3D cartoon background, no people
                [पप्पू भैया]: (proud) ...
                [बबलू यार]: (sarcastic) ...
                [MEME]: {(userMemes is { Count: > 0 } ? userMemes[0].Name : "shocked_face")} | अरे बावले, यो के बोल दिया!
                [SCENE]: comedy stage | sunset | excited | IMAGE: colorful Indian comedy spot stage with warm tangerine spotlights, microphone stand, vertical 9:16, no people
                [बबलू यार]: (laughing) ...
                [पप्पू भैया]: (surprised) ...
                [MEME]: {(userMemes is { Count: > 1 } ? userMemes[1].Name : "khatam_tata_bye")} | ख़त्म... टाटा... बाय-बाय!
                """;
        }

        return $"""
            Write the complete script for a {seconds}-second ({runtime} min) {kind} as an animated 3D YouTube {(post.Format == AutomationVideoFormat.Wide ? "video (16:9)" : "Short (9:16)")}: a cast list, scene directions with realistic background images, and spoken dialogue.
            TARGET LENGTH: {seconds} seconds of speech, about {budget.Words} spoken words in total. Do not write a shorter version.

            TOPIC: {post.Title}
            SOURCE: {post.SourceTitle}
            {(string.IsNullOrWhiteSpace(post.SourceSummary) ? string.Empty : $"FACTS: {post.SourceSummary}")}

            CURRENT DRAFT (keep every fact, date, number and time from it):
            {post.Script}

            RULES
            - Language of the dialogue: {language}
            - {speakers}{placeRule}
            - CAST block first: one [CAST] line per character (main and supporting). Role is one of: {roles}. Look = outfit colours and ornaments, e.g. "saffron dhoti, gold crown, rudraksha mala".
            - Split the story into {scenes} scenes, one per moment of the story (each new event, place or turn of the plot is a new scene). Start each scene with one [SCENE] line BEFORE its dialogue: setting | time of day | mood | IMAGE: background picture prompt.
              Setting is one of: {settings}. Time is one of: dawn, day, sunset, night.
            - Each IMAGE prompt is used on its own to make that scene's picture in an image tool, so make it complete and specific (25-45 words): the exact place, architecture and props from this moment of the story, light and weather, colour mood, camera angle, photorealistic cinematic style, {(post.Format == AutomationVideoFormat.Wide ? "16:9 wide frame" : "9:16 tall vertical frame")}. No people, no faces, no text: the characters are animated on top of the picture. Keep one consistent look across all scenes.
            - Write {turns} dialogue lines in total, each 15-28 words (about {budget.Words} words altogether), so everything is spoken in about {seconds} seconds.
            - Line 1 of scene 1: [{narrator}] gives a gripping hook: who, where, and why it matters.{(budget.MinScenes >= 3 ? $"{Environment.NewLine}- [{narrator}] may bridge two scenes with one short line; most lines still belong to the characters." : string.Empty)}
            - The characters act the story out (conflict -> turning point -> resolution), speaking to each other, not lecturing. Supporting characters speak at least once each.
            - Last line: [{narrator}] states the moral or takeaway in one sentence.
            - Character names stay identical on every line and match the CAST block exactly.

            OUTPUT FORMAT - return ONLY lines like these, nothing else (no headings, no markdown, no notes):
            [CAST]: Character Name | role | look
            [CAST]: Character Name | role | look
            [CAST]: Supporting Name | role | look
            [SCENE]: forest ashram | dawn | serene | IMAGE: misty forest hermitage with a thatched hut under banyan trees, golden rays through the leaves
            [{narrator}]: ...
            [Character Name]: ...
            [Character Name]: ...
            [SCENE]: palace court | day | tense | IMAGE: grand carved marble royal court with silk drapes and a golden throne
            [Supporting Name]: ...
            [Character Name]: ...
            [{narrator}]: ...
            """;
    }

    /// <summary>
    /// Keeps only the <c>[Speaker]: line</c> lines of a pasted reply (code fences, headings and notes dropped), each made a
    /// safe single line. Null when fewer than three dialogue lines are found.
    /// </summary>
    internal static string? CleanPastedDialogue(string reply)
    {
        var kept = new List<string>();
        var spoken = 0;
        var directives = 0;
        foreach (var raw in reply.Replace("\r", string.Empty).Split('\n'))
        {
            var line = raw.Trim().TrimStart('-', '*', '•', ' ').Replace("**", string.Empty).Trim();
            var match = PastedDialogueLine().Match(line);
            if (!match.Success) continue;

            var speaker = AiOutputSanitizer.ToSafeLine(match.Groups[1].Value, 34);
            if (string.IsNullOrWhiteSpace(speaker)) continue;
            // Scene lines carry a full picture prompt after the setting, time and mood.
            var text = AiOutputSanitizer.ToSafeLine(match.Groups[2].Value, SceneDirectives.IsDirectiveTag(speaker) ? 600 : 400);
            if (string.IsNullOrWhiteSpace(text)) continue;

            // [CAST], [SCENE], and [MEME] stage directions are kept (never spoken); they don't count as dialogue.
            if (SceneDirectives.IsDirectiveTag(speaker!))
            {
                if (directives >= MaxPastedDirectives) continue;
                directives++;
                kept.Add($"[{(SceneDirectives.IsSceneTag(speaker!) ? "SCENE" : "CAST")}]: {text}");
                continue;
            }
            if (SceneDirectives.IsMemeTag(speaker))
            {
                if (directives >= MaxPastedDirectives + DialogueScriptParser.MaxMemeCues) continue;
                directives++;
                kept.Add($"[MEME]: {text}");
                continue;
            }

            if (spoken >= MaxPastedDialogueTurns) continue;
            spoken++;
            kept.Add($"[{speaker}]: {text}");
        }
        return spoken >= 3 ? string.Join('\n', kept) : null;
    }

    /// <summary>Cast lines (up to 8) plus one [SCENE] line per scene (up to 12).</summary>
    private const int MaxPastedDirectives = 8 + DialogueScriptParser.MaxScenes;

    [System.Text.RegularExpressions.GeneratedRegex(@"^\[([^\[\]]{2,34})\]\s*:\s*(.+)$")]
    private static partial System.Text.RegularExpressions.Regex PastedDialogueLine();

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

        // The user asked for it: publish to Panchang whatever the source type or YouTube channel.
        var ok = await TrySyncPublishedPostToEcosystemAsync(post, bearerToken, ct, explicitRequest: true).ConfigureAwait(false);
        if (!ok)
            throw EditingException.Invalid("panchang-sync-failed", post.LastError ?? "Could not sync to HinduPanchang Video Hub (check Admin login or Ecosystem:SyncKey).");

        return post;
    }

    /// <summary>Takes this post's video off the Panchang Video Hub (it stays on YouTube).</summary>
    public async Task<AutomationPost> RemovePostFromEcosystemAsync(
        string userId,
        string postId,
        string? bearerToken,
        CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        if (!await TryRemovePostFromEcosystemAsync(post, bearerToken, ct).ConfigureAwait(false))
            throw EditingException.Invalid("panchang-remove-failed", post.LastError ?? "Could not remove the video from HinduPanchang Video Hub.");
        return post;
    }

    private async Task<bool> TryRemovePostFromEcosystemAsync(AutomationPost post, string? bearerToken, CancellationToken ct)
    {
        var target = await ResolvePanchangTargetAsync(post, bearerToken, ct).ConfigureAwait(false);
        if (target is null)
            return false;
        var (normalizedBase, syncKey) = target.Value;

        try
        {
            var client = httpClientFactory.CreateClient();
            using var req = new HttpRequestMessage(
                HttpMethod.Delete,
                $"{normalizedBase}/api/videohub/automation-sync/{Uri.EscapeDataString(post.Id)}");
            ApplyPanchangAuth(req, syncKey, bearerToken);

            using var res = await client.SendAsync(req, ct).ConfigureAwait(false);
            // 404: already gone from the hub, which is what was asked for.
            if (!res.IsSuccessStatusCode && res.StatusCode != HttpStatusCode.NotFound)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                var upstreamError = TryExtractEcosystemError(body);
                logger.LogWarning("Panchang Video Hub removal returned HTTP {Status} for post {PostId}", (int)res.StatusCode, post.Id);
                post.LastError = res.StatusCode == HttpStatusCode.Unauthorized
                    ? BuildPanchangUnauthorizedMessage(upstreamError, hasSyncKey: !string.IsNullOrWhiteSpace(syncKey))
                    : $"Panchang removal HTTP {(int)res.StatusCode}{(string.IsNullOrWhiteSpace(upstreamError) ? string.Empty : ": " + upstreamError)}";
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return false;
            }

            post.SyncedToEcosystemAtUtc = null;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Panchang Video Hub removal failed for post {PostId}", post.Id);
            post.LastError = "Could not reach HinduPanchang to remove the video.";
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
            return false;
        }
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
                var today = (int)DateOnly.Parse(dateKey).DayOfWeek;
                if (group
                    .Where(r => r.DaysOfWeek.Count == 0 || r.DaysOfWeek.Contains(today))
                    .All(r => string.Equals(r.LastPreparedDateKey, dateKey, StringComparison.Ordinal)))
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

        // 3. Published videos deleted in YouTube Studio (or removed by YouTube) go back to "video ready".
        try
        {
            changed += await DetectRemovedYouTubeVideosAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Removed-video sweep failed");
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
        if (!string.IsNullOrWhiteSpace(post.PublishedVideoId))
            throw EditingException.Conflict("already-published",
                "This card is already on YouTube. Use 'Remove / Move' first to delete it there or publish it to another channel.");

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

        // Work on the stored copy from here on: the caller's object may be stale (the worker loaded it before a
        // click published it), and the claim below has to compare against what is really saved.
        var stored = await repository.GetPostAsync(post.Id, ct).ConfigureAwait(false) ?? post;
        if (stored.Status == AutomationPostStatus.Publishing)
            throw EditingException.Conflict("publish-in-progress", "This card is already uploading to YouTube. Wait for it to finish.");
        if (stored.Status == AutomationPostStatus.Published || !string.IsNullOrWhiteSpace(stored.PublishedVideoId))
            throw EditingException.Conflict("already-published",
                "This card is already on YouTube. Use 'Remove / Move' first to delete it there or publish it to another channel.");
        post = stored;
        var previousStatus = post.Status;

        // Route 1: Completed RenderJob (direct or from attached StoryRun / Handoff) -> PublishQueueService!
        var renderJob = await ResolveUsableRenderJobAsync(userId, post, ct).ConfigureAwait(false);
        if (renderJob is not null)
        {
            // An earlier attempt may already have put this render on the channel (a lost status, a restart, a
            // second click). Adopt that video instead of uploading the same thing again.
            if (await FindLivePublicationAsync(post, renderJob.Id, connection.ChannelId, ct).ConfigureAwait(false) is { } live)
            {
                post.PublishedChannelId = connection.ChannelId;
                post.PublishedChannelTitle = connection.ChannelTitle;
                await MarkPublishedAsync(post, live.VideoId, $"https://www.youtube.com/watch?v={live.VideoId}", live.PublishedAt, ct).ConfigureAwait(false);
                logger.LogInformation("Automation post {PostId}: render {JobId} is already on channel {ChannelId} as {VideoId}; not uploading again",
                    post.Id, renderJob.Id, connection.ChannelId, live.VideoId);
                return post;
            }

            // A queue item from an earlier attempt is reused rather than adding another one next to it.
            if (await TryResumeQueueItemAsync(userId, post, previousStatus, connection, ct).ConfigureAwait(false) is { } resumed)
                return resumed;

            await ClaimForPublishAsync(post, previousStatus, connection, ct).ConfigureAwait(false);
            try
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
                // Added held, so the board's scheduler can't start it on its own while we start it here: that race
                // made PublishNow fail, left the card "Approved", and the next worker tick queued yet another copy.
                var thumbnailChoice = await BuildPostThumbnailChoiceAsync(post, ct).ConfigureAwait(false);
                var queued = await publishQueue.AddAsync(userId, new PublishQueueDraft(
                    renderJob.Id,
                    connection.ChannelId,
                    metadata,
                    null,
                    post.PinnedComment,
                    thumbnailChoice,
                    null,
                    null,
                    PublishQueueMode.UploadAtTime,
                    Hold: true,
                    Notes: $"Automation: {post.RuleName}"), ct).ConfigureAwait(false);

                // Saved before the upload starts, so any later attempt finds and reuses this item.
                post.QueueItemId = queued.Id;
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);

                await publishQueue.PublishNowAsync(userId, queued.Id, ct).ConfigureAwait(false);
                return post;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                await ReleasePublishClaimAsync(post, previousStatus, ex, ct).ConfigureAwait(false);
                throw;
            }
        }

        // Route 2: Google Drive clip (`PhoneHandoff` without a RenderJob in IObjectStore)
        if (!string.IsNullOrWhiteSpace(post.AttachedHandoffId))
        {
            await ClaimForPublishAsync(post, previousStatus, connection, ct).ConfigureAwait(false);
            try
            {
                return await PublishDriveClipAsync(userId, post, connection, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                await ReleasePublishClaimAsync(post, previousStatus, ex, ct).ConfigureAwait(false);
                throw;
            }
        }

        throw EditingException.Invalid("video-not-attached", "Attach a Drive clip / finished Render or click 'Generate AI Video' before publishing.");
    }

    /// <summary>
    /// Marks the card Publishing with an atomic compare-and-set on its status. Of two requests (a click and the
    /// worker, or two server processes on one database) only the first gets through; the other is told it is
    /// already uploading instead of starting a second upload.
    /// </summary>
    private async Task ClaimForPublishAsync(AutomationPost post, AutomationPostStatus previousStatus, YouTubeChannelConnection connection, CancellationToken ct)
    {
        post.Status = AutomationPostStatus.Publishing;
        post.PublishedChannelId = connection.ChannelId;
        post.PublishedChannelTitle = connection.ChannelTitle;
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;
        if (!await repository.TryReplacePostIfStatusAsync(post, previousStatus, ct).ConfigureAwait(false))
        {
            post.Status = previousStatus;
            throw EditingException.Conflict("publish-in-progress", "This card is already being published. Refresh to see its progress.");
        }
    }

    /// <summary>Starting the upload failed before anything was sent: put the card back so it can be tried again.</summary>
    private async Task ReleasePublishClaimAsync(AutomationPost post, AutomationPostStatus previousStatus, Exception ex, CancellationToken ct)
    {
        post.Status = previousStatus;
        post.LastError = ex is EditingException or YouTubePublishException ? ex.Message : "The upload couldn't be started. Try again.";
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        if (ex is not (EditingException or YouTubePublishException))
            logger.LogError(ex, "Starting the YouTube upload of automation post {PostId} failed", post.Id);
    }

    /// <summary>
    /// Continues with the card's queue item from an earlier attempt instead of adding a second one. Null when
    /// there is none worth reusing (never created, removed from the board, failed or cancelled).
    /// </summary>
    private async Task<AutomationPost?> TryResumeQueueItemAsync(
        string userId, AutomationPost post, AutomationPostStatus previousStatus, YouTubeChannelConnection connection, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.QueueItemId)) return null;

        PublishQueueItemView view;
        try
        {
            view = await publishQueue.GetAsync(userId, post.QueueItemId, ct).ConfigureAwait(false);
        }
        catch (KeyNotFoundException)
        {
            post.QueueItemId = null;
            return null;
        }

        // Only an item for the same channel is the same upload.
        if (!string.Equals(view.ChannelId, connection.ChannelId, StringComparison.Ordinal)) return null;

        switch (view.State)
        {
            case PublishQueueState.Published when !string.IsNullOrWhiteSpace(view.VideoId):
                post.PublishedChannelId = connection.ChannelId;
                post.PublishedChannelTitle = connection.ChannelTitle;
                await MarkPublishedAsync(post, view.VideoId!, view.VideoUrl ?? $"https://www.youtube.com/watch?v={view.VideoId}",
                    view.FinishedAt, ct).ConfigureAwait(false);
                return post;

            case PublishQueueState.Uploading:
                await ClaimForPublishAsync(post, previousStatus, connection, ct).ConfigureAwait(false);
                return post;

            case PublishQueueState.Waiting or PublishQueueState.Held:
                await ClaimForPublishAsync(post, previousStatus, connection, ct).ConfigureAwait(false);
                try
                {
                    await SyncQueuedItemAsync(userId, post, includeSchedule: false, ct).ConfigureAwait(false);
                    await publishQueue.PublishNowAsync(userId, view.Id, ct).ConfigureAwait(false);
                }
                catch (EditingException ex) when (ex.Code == "queue-item-locked")
                {
                    // The board's scheduler started it a moment ago: that is the upload we wanted.
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    await ReleasePublishClaimAsync(post, previousStatus, ex, ct).ConfigureAwait(false);
                    throw;
                }
                return post;

            default:
                // Failed or cancelled: a new item is added (the video isn't on YouTube - that was checked first).
                return null;
        }
    }

    /// <summary>
    /// The app's own record of this render on this channel since the card was made, unless that video was
    /// removed (by "Remove / Move" or in YouTube Studio).
    /// </summary>
    private async Task<YouTubePublication?> FindLivePublicationAsync(AutomationPost post, string jobId, string channelId, CancellationToken ct)
    {
        var removed = post.RemovedVideos.Select(r => r.VideoId).ToHashSet(StringComparer.Ordinal);
        var records = await publications.ListByUserAsync(post.UserId, null, 200, ct).ConfigureAwait(false);
        return records
            .Where(p => string.Equals(p.JobId, jobId, StringComparison.Ordinal)
                && string.Equals(p.ChannelId, channelId, StringComparison.Ordinal)
                && p.PublishedAt >= post.CreatedAtUtc
                && p.Health != YouTubeVideoHealth.Removed
                && !removed.Contains(p.VideoId))
            .OrderByDescending(p => p.PublishedAt)
            .FirstOrDefault();
    }

    private async Task MarkPublishedAsync(AutomationPost post, string videoId, string videoUrl, DateTime? publishedAt, CancellationToken ct)
    {
        post.PublishedVideoId = videoId;
        post.PublishedVideoUrl = videoUrl;
        post.Status = AutomationPostStatus.Published;
        post.PublishedAtUtc = publishedAt ?? UtcNow;
        post.LastError = null;
        post.UpdatedAtUtc = UtcNow;
        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        await TrySyncPublishedPostToEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false);
        if (catalogWriter is not null) await catalogWriter.UpsertPublishedPostAsync(post, ct).ConfigureAwait(false);
    }

    private async Task<AutomationPost> PublishDriveClipAsync(string userId, AutomationPost post, YouTubeChannelConnection connection, CancellationToken ct)
    {
        {
            var handoff = await handoffs.GetAsync(post.AttachedHandoffId!, ct).ConfigureAwait(false)
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

            var thumbnailJpeg = await BuildThumbnailJpegForLocalVideoAsync(post, localFile, ct).ConfigureAwait(false);
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
                LocalFilePath: localFile,
                ThumbnailJpeg: thumbnailJpeg));

            // The upload is under way: record it first, so nothing after this can put the card back to be uploaded again.
            post.UploadId = uploadStatus.UploadId;
            post.Status = AutomationPostStatus.Publishing;
            post.LastError = null;
            post.UpdatedAtUtc = UtcNow;
            await repository.UpsertPostAsync(post, CancellationToken.None).ConfigureAwait(false);

            // Mark the Drive clip Used & archive on Drive best-effort so it's never reused in duplicate!
            try
            {
                await MarkDriveClipUsedAsync(handoff, driveToken, driveTarget, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Automation post {PostId}: marking the Drive clip used failed; the upload continues", post.Id);
            }
            return post;
        }
    }

    private async Task<int> PollStoryRunProgressAsync(
        AutomationPost post,
        AutomationWorkspaceConfig settings,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(post.AttachedStoryRunId)) return 0;
        // An Enhanced 3D post renders in its own request and saves its own progress; a story run left linked from an
        // earlier attempt must not overwrite that (it would mark the post Failed mid-render).
        if (post.VisualEngine == AutomationVisualEngine.Procedural3D) return 0;
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
        if (run.Status == StoryRunStatus.AwaitingScript)
        {
            // A template run, or an AI run whose text model was unreachable: the Story Agent has the full script prompt
            // ready and is waiting for a pasted reply. Say so rather than showing a stalled percentage.
            summary = run.Research is null ? "Preparing script template" : "Waiting for your pasted script";
        }
        else if (run.Status == StoryRunStatus.AwaitingReview)
        {
            // The card shows a "Review" button for this summary; the check itself happens in the Story Studio.
            summary = run.Review switch
            {
                StoryStageIds.Narration => $"{ReviewSummaryPrefix}the voices",
                StoryStageIds.Music => $"{ReviewSummaryPrefix}the music",
                StoryStageIds.Render => $"{ReviewSummaryPrefix}the finished video",
                _ => $"{ReviewSummaryPrefix}this step"
            };
        }
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
        if (string.IsNullOrWhiteSpace(post.QueueItemId) && string.IsNullOrWhiteSpace(post.UploadId))
        {
            // Claimed, but the server stopped before the upload was handed over: nothing is tracking it.
            if (post.UpdatedAtUtc < UtcNow - TimeSpan.FromMinutes(15))
            {
                post.Status = AutomationPostStatus.Failed;
                post.LastError = "Publishing was interrupted before the upload started. Check YouTube Studio, then publish again.";
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return 1;
            }
            return 0;
        }

        if (!string.IsNullOrWhiteSpace(post.QueueItemId))
        {
            PublishQueueItemView view;
            try
            {
                view = await publishQueue.GetAsync(post.UserId, post.QueueItemId, ct).ConfigureAwait(false);
            }
            catch (KeyNotFoundException)
            {
                post.Status = AutomationPostStatus.Failed;
                post.QueueItemId = null;
                post.LastError = "The upload was removed from the publishing board. Check YouTube Studio, then publish again.";
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                return 1;
            }
            if (view.State == PublishQueueState.Published)
            {
                post.PublishedVideoId = view.VideoId;
                post.PublishedVideoUrl = view.VideoUrl;
                post.Status = AutomationPostStatus.Published;
                post.PublishedAtUtc = view.FinishedAt ?? UtcNow;
                post.UpdatedAtUtc = UtcNow;
                await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
                await TrySyncPublishedPostToEcosystemAsync(post, bearerToken: null, ct).ConfigureAwait(false);
                if (catalogWriter is not null) await catalogWriter.UpsertPublishedPostAsync(post, ct).ConfigureAwait(false);
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
                    if (catalogWriter is not null) await catalogWriter.UpsertPublishedPostAsync(post, ct).ConfigureAwait(false);
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
                    if (catalogWriter is not null) await catalogWriter.UpsertPublishedPostAsync(post, ct).ConfigureAwait(false);
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

    /// <summary>
    /// Renders and attaches an Enhanced 3D video. With <paramref name="trackProgress"/> (user-triggered renders on a post
    /// that already exists), the post is saved as <see cref="AutomationPostStatus.GeneratingVideo"/> with a live stage and
    /// percent while the render runs, so the hub can show progress. On failure those fields are put back and the post
    /// gets a readable <see cref="AutomationPost.LastError"/> before the error is rethrown.
    /// </summary>
    private async Task AttachProceduralAnimatedVideoAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        ProceduralSceneTheme theme,
        int durationSeconds,
        string? resolution,
        CancellationToken ct,
        bool keepScriptAsWritten = false,
        bool trackProgress = false)
    {
        if (!trackProgress)
        {
            await AttachProceduralAnimatedVideoCoreAsync(userId, post, rule, theme, durationSeconds, resolution, ct,
                keepScriptAsWritten, tracker: null).ConfigureAwait(false);
            return;
        }

        var previousStatus = post.Status;
        var previousStage = post.StoryStageSummary;
        var previousPercent = post.StoryProgressPercent;
        var previousStoryRunId = post.AttachedStoryRunId;
        var tracker = new PostRenderProgressWriter(post, repository.UpsertPostAsync, clock, logger, ct);
        post.Status = AutomationPostStatus.GeneratingVideo;
        post.LastError = null;
        // This render replaces any earlier AI story run. While the old run stays linked, the overview poll and the
        // background worker read its (failed / finished) state and overwrite this post mid-render, so the hub never
        // sees the render's progress. Unlink it now; it is put back only if this render fails.
        post.AttachedStoryRunId = null;
        await tracker.SaveNowAsync(ProceduralRenderStages.Dialogue,
            keepScriptAsWritten ? "Reading your pasted script" : "Writing character dialogue").ConfigureAwait(false);

        try
        {
            await AttachProceduralAnimatedVideoCoreAsync(userId, post, rule, theme, durationSeconds, resolution, ct,
                keepScriptAsWritten, tracker).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            await tracker.StopAsync().ConfigureAwait(false);
            post.Status = previousStatus;
            post.StoryStageSummary = previousStage;
            post.StoryProgressPercent = previousPercent;
            post.AttachedStoryRunId = previousStoryRunId;
            if (ex is not OperationCanceledException)
            {
                // RenderException messages are written for users; anything else stays generic (details are in the log).
                post.LastError = ex is AnimStudio.Domain.Errors.RenderException rex
                    ? $"Enhanced 3D render failed: {rex.Message}"
                    : "Enhanced 3D render failed. Please try again.";
            }
            post.UpdatedAtUtc = UtcNow;
            try
            {
                // The request may already be cancelled; the post must still leave the GeneratingVideo state.
                await repository.UpsertPostAsync(post, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception saveEx)
            {
                logger.LogWarning(saveEx, "Could not reset automation post {PostId} after a failed 3D render.", post.Id);
            }
            throw;
        }
    }

    private async Task AttachProceduralAnimatedVideoCoreAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        ProceduralSceneTheme theme,
        int durationSeconds,
        string? resolution,
        CancellationToken ct,
        bool keepScriptAsWritten,
        PostRenderProgressWriter? tracker)
    {
        if (!keepScriptAsWritten)
            await EnsureRichPostDialogueBeforeRenderAsync(userId, post, rule, durationSeconds, ct).ConfigureAwait(false);

        var effectiveMode = post.NarrativeMode != AutomationNarrativeMode.Auto
            ? post.NarrativeMode
            : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
        var targetSeconds = ResolvePostTargetSeconds(post, rule, effectiveMode, durationSeconds);
        var duration = Math.Clamp(targetSeconds, 10, ProceduralVideoRequest.MaxSeconds);
        var footer = post.TrackedFunnelUrls.FirstOrDefault()?.Label;
        var palette = ProceduralEventPalette.Resolve(post.SourceType.ToString(), theme);
        var formatArg = post.Format switch
        {
            AutomationVideoFormat.Wide => "landscape",
            AutomationVideoFormat.CommunityPost => "square",
            _ => "vertical"
        };

        var stage = post.Stage ?? new AutomationStageSettings();
        using var songLease = await MaterializeStageSongLeaseAsync(userId, stage.AttachedSongId, ct).ConfigureAwait(false);
        string? tempDir = null;
        List<string> bgPaths = [];
        var usingTemplate = false;
        if (!string.IsNullOrWhiteSpace(stage.BackgroundTemplateAssetId))
        {
            tracker?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Dialogue + 4, "Fetching your background template"));
            (tempDir, bgPaths) = await MaterializeStorageImagesAsync(userId, [stage.BackgroundTemplateAssetId], ct).ConfigureAwait(false);
            usingTemplate = bgPaths.Count > 0;
            if (!usingTemplate)
                logger.LogWarning("Background template for automation post {PostId} is no longer available; using the default stage.", post.Id);
        }

        var usingScenePictures = false;
        if (!usingTemplate && stage.SceneBackgroundAssetIds.Count > 0)
        {
            tracker?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Dialogue + 4,
                $"Fetching your {stage.SceneBackgroundAssetIds.Count} scene pictures"));
            (tempDir, bgPaths) = await MaterializeStorageImagesAsync(userId, stage.SceneBackgroundAssetIds, ct).ConfigureAwait(false);
            usingScenePictures = bgPaths.Count == stage.SceneBackgroundAssetIds.Count;
            if (!usingScenePictures)
            {
                // A missing picture would move every later scene onto the wrong one: use none rather than a shifted set.
                logger.LogWarning("Scene pictures for automation post {PostId}: {Found} of {Wanted} available; using the default stage.",
                    post.Id, bgPaths.Count, stage.SceneBackgroundAssetIds.Count);
                if (tempDir is not null)
                {
                    try { Directory.Delete(tempDir, recursive: true); } catch { /* best-effort scratch cleanup */ }
                }
                (tempDir, bgPaths) = (null, []);
            }
        }

        if (!usingTemplate && !usingScenePictures)
        {
            var assetIds = post.AttachedAssetIds.Count > 0 ? post.AttachedAssetIds : (rule?.AttachedAssetIds ?? []);
            if (assetIds.Count > 0)
                tracker?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Dialogue + 4, "Fetching your storage images"));
            (tempDir, bgPaths) = await MaterializeStorageImagesAsync(userId, assetIds, ct).ConfigureAwait(false);
        }

        // The location the user typed directs the stage: it becomes the opening [SCENE] line (never spoken) when the
        // script does not direct its own scenes, so it picks the 3D setting, light and, without a template, the
        // realistic backdrop that the image engine paints.
        var renderScript = AutomationStageScript.WithLocation(post.Script, stage.LocationPrompt);
        if (bgPaths.Count == 0 && post.EnableCharacterDialogue)
        {
            // No storage images: paint each [SCENE] of the script as a realistic backdrop with the image engine.
            (tempDir, bgPaths) = await GenerateSceneBackdropsAsync(userId, post, rule, formatArg, tracker, ct, renderScript).ConfigureAwait(false);
        }
        try
        {
            var rendered = await proceduralVideoGenerator.GenerateAsync(userId, new ProceduralVideoRequest
            {
                Progress = tracker,
                Title = post.Title,
                Prompt = post.AiVideoPrompt,
                Script = renderScript,
                Theme = theme,
                VfxStyle = post.SourceType switch
                {
                    AutomationSourceType.FunnyComedy => ProceduralVfxStyle.ComedyBurst,
                    AutomationSourceType.DailyKatha or AutomationSourceType.HinduFestival => ProceduralVfxStyle.DivineAura,
                    AutomationSourceType.Pratiyogita => ProceduralVfxStyle.CyberNeon,
                    AutomationSourceType.AajKaItihaas => ProceduralVfxStyle.CinematicDrama,
                    _ => ProceduralVfxStyle.Auto
                },
                Format = formatArg,
                Resolution = string.IsNullOrWhiteSpace(resolution) ? "720p" : resolution.Trim(),
                DurationSeconds = duration,
                MaxDurationSeconds = stage.FollowScriptExactly ? null : MaxSecondsFor(post.Format),
                FollowScriptExactly = stage.FollowScriptExactly,
                StageLayout = AutomationStageScript.ToLayout(stage, usingTemplate),
                IncludeCaptions = true,
                IncludeAmbientAudio = stage.IncludeBackgroundMusic || songLease.Path is not null,
            CustomBgmPath = songLease.Path,
            IsSeamlessLoop = post.SourceType == AutomationSourceType.FunnyComedy || duration <= 30,
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

            // The progress pump must be idle before this method changes the post again.
            if (tracker is not null)
                await tracker.StopAsync().ConfigureAwait(false);

            post.AttachedRenderJobId = rendered.RenderJobId;
            post.AttachedHandoffId = null;
            post.AttachedHandoffTitle = rendered.ThemeDisplayName;
            post.EventColorHex ??= palette.PrimaryHex;
            post.HeaderBannerText ??= $"{palette.HeaderBadgeText} • {post.DateKey}";
            var hasVoice = rendered.Summary?.Contains(", voice=", StringComparison.OrdinalIgnoreCase) == true;
            var extras = (hasVoice ? " • Voice" : string.Empty)
                + (usingTemplate ? " • Your background" : string.Empty)
                + (usingScenePictures ? $" • {bgPaths.Count} scene pictures" : string.Empty)
                + (stage.IncludeBackgroundMusic ? string.Empty : " • No music");
            post.AttachedVideoSourceLabel = $"3D Animated ({rendered.ThemeDisplayName}, {rendered.DurationSeconds:0}s{extras})";
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

    /// <summary>
    /// Source types that go to the Panchang Video Hub on their own after publishing. Any other post
    /// (e.g. an AI-trends video on Keshav Singh World) goes there only when the user asks for it.
    /// </summary>
    internal static bool IsAutoPanchangSource(AutomationSourceType sourceType) =>
        sourceType is AutomationSourceType.HinduPanchang
            or AutomationSourceType.HinduFestival
            or AutomationSourceType.DailyKatha
            or AutomationSourceType.AajKaItihaas;

    /// <summary>The Panchang API base and the auth it accepts; null (with <c>LastError</c> set) when unusable.</summary>
    private async Task<(string BaseUrl, string? SyncKey)?> ResolvePanchangTargetAsync(
        AutomationPost post,
        string? bearerToken,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var rawBase = !string.IsNullOrWhiteSpace(settings.PanchangApiBaseUrl)
            ? settings.PanchangApiBaseUrl
            : ecosystemServiceOptions.CurrentValue.PanchangApiBaseUrl;

        if (!EcosystemSignalsClient.IsSafeEndpoint(rawBase, out var normalizedBase) || normalizedBase is null)
        {
            post.LastError = "Panchang API base URL is not configured (Global Autopilot & API Settings → Panchang API).";
            return null;
        }

        var syncKey = !string.IsNullOrWhiteSpace(ecosystemServiceOptions.CurrentValue.SyncKey)
            ? ecosystemServiceOptions.CurrentValue.SyncKey!.Trim()
            : Environment.GetEnvironmentVariable("ECOSYSTEM_SYNC_KEY")?.Trim();

        if (string.IsNullOrWhiteSpace(syncKey) && string.IsNullOrWhiteSpace(bearerToken))
        {
            post.LastError = "No SSO Bearer/ks_sso token or Ecosystem:SyncKey configured for Panchang Video Hub sync.";
            return null;
        }

        return (normalizedBase, syncKey);
    }

    private static void ApplyPanchangAuth(HttpRequestMessage req, string? syncKey, string? bearerToken)
    {
        if (!string.IsNullOrWhiteSpace(syncKey))
            req.Headers.TryAddWithoutValidation("X-Ecosystem-Key", syncKey);
        if (!string.IsNullOrWhiteSpace(bearerToken))
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken.Trim());
    }

    /// <summary>The public YouTube channel link for the channel this post went out on.</summary>
    private static string? BuildChannelUrl(AutomationPost post)
    {
        var handle = post.TargetChannelHandle?.Trim();
        if (!string.IsNullOrWhiteSpace(handle))
            return $"https://www.youtube.com/{(handle.StartsWith('@') ? handle : "@" + handle)}";
        var channelId = (post.PublishedChannelId ?? post.TargetChannelId)?.Trim();
        return !string.IsNullOrWhiteSpace(channelId) && channelId.StartsWith("UC", StringComparison.Ordinal)
            ? $"https://www.youtube.com/channel/{channelId}"
            : null;
    }

    private async Task<bool> TrySyncPublishedPostToEcosystemAsync(
        AutomationPost post,
        string? bearerToken,
        CancellationToken ct,
        bool explicitRequest = false)
    {
        if (string.IsNullOrWhiteSpace(post.PublishedVideoId) && string.IsNullOrWhiteSpace(post.PublishedVideoUrl))
            return false;

        if (!explicitRequest && !IsAutoPanchangSource(post.SourceType))
            return false;

        var target = await ResolvePanchangTargetAsync(post, bearerToken, ct).ConfigureAwait(false);
        if (target is null)
            return false;
        var (normalizedBase, syncKey) = target.Value;

        try
        {
            var client = httpClientFactory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, $"{normalizedBase}/api/videohub/automation-sync");
            ApplyPanchangAuth(req, syncKey, bearerToken);

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
                ChannelName = !string.IsNullOrWhiteSpace(post.PublishedChannelTitle)
                    ? post.PublishedChannelTitle
                    : post.TargetChannelTitle,
                ChannelUrl = BuildChannelUrl(post),
                SourceChannelHandle = post.TargetChannelHandle,
                Format = post.Format == AutomationVideoFormat.Vertical ? "Short" : "Video",
                IsFeaturedDailyVideo = post.SourceType == AutomationSourceType.HinduPanchang
            }, options: JsonOpts);

            using var res = await client.SendAsync(req, ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                var upstreamError = TryExtractEcosystemError(body);
                logger.LogWarning("Panchang Video Hub sync returned HTTP {Status} for post {PostId}: {Body}",
                    (int)res.StatusCode, post.Id, body);
                post.LastError = res.StatusCode == HttpStatusCode.Unauthorized
                    ? BuildPanchangUnauthorizedMessage(upstreamError, hasSyncKey: !string.IsNullOrWhiteSpace(syncKey))
                    : string.IsNullOrWhiteSpace(upstreamError)
                        ? $"Panchang sync HTTP {(int)res.StatusCode}"
                        : $"Panchang sync HTTP {(int)res.StatusCode}: {upstreamError}";
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

    private static string BuildPanchangUnauthorizedMessage(string? upstreamError, bool hasSyncKey)
    {
        var detail = string.IsNullOrWhiteSpace(upstreamError)
            ? "Admin role or valid X-Ecosystem-Key required."
            : upstreamError;
        var hint = hasSyncKey
            ? "Verify Ecosystem:SyncKey / ECOSYSTEM_SYNC_KEY matches HinduPanchang and that HinduPanchang's Jwt__SigningKey matches id.keshavsingh.in."
            : "HinduPanchang rejected the SSO token (verify Jwt__SigningKey is configured on HinduPanchang to match id.keshavsingh.in) and AnimStudio has no Ecosystem:SyncKey / ECOSYSTEM_SYNC_KEY configured.";
        return $"Panchang sync HTTP 401: {detail} {hint}";
    }

    private static string? TryExtractEcosystemError(string? body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                if (doc.RootElement.TryGetProperty("message", out var msg) && msg.ValueKind == System.Text.Json.JsonValueKind.String)
                    return msg.GetString();
                if (doc.RootElement.TryGetProperty("error", out var err) && err.ValueKind == System.Text.Json.JsonValueKind.String)
                    return err.GetString();
            }
        }
        catch (System.Text.Json.JsonException)
        {
            // Non-JSON upstream responses fall back to bounded plain text below.
        }

        var trimmed = body.Trim();
        return trimmed.Length <= 200 ? trimmed : trimmed[..200];
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
        CancellationToken ct,
        bool manualScript = false)
    {
        var effectiveVisualEngine = post.VisualEngine != AutomationVisualEngine.Auto
            ? post.VisualEngine
            : rule?.VisualEngine ?? AutomationVisualEngine.Auto;
        var effectiveNarrativeMode = post.NarrativeMode != AutomationNarrativeMode.Auto
            ? post.NarrativeMode
            : rule?.NarrativeMode ?? AutomationNarrativeMode.Auto;
        var targetSeconds = ResolvePostTargetSeconds(post, rule, effectiveNarrativeMode, 0);

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

        var brandChannel = aiSettingsRepo is not null && !string.IsNullOrWhiteSpace(rule?.BrandChannelId)
            ? (await aiSettingsRepo.GetAsync(ct).ConfigureAwait(false))?.FindChannel(rule.BrandChannelId)
            : null;
        var isComedy = IsComedyAutomationPost(post, rule) || brandChannel?.IsComedyChannel == true;
        var isFullStory = targetSeconds >= 95 || effectiveNarrativeMode == AutomationNarrativeMode.FullStory;
        var effectiveComedyStyle = post.ComedyStyle != ComedyToneStyle.Auto
            ? post.ComedyStyle
            : (rule?.ComedyStyle != ComedyToneStyle.Auto ? rule!.ComedyStyle : brandChannel?.ComedyStyle ?? ComedyToneStyle.Auto);
        var includeMemes = post.AutoInsertMemes && (rule?.AutoInsertMemes ?? true) && (brandChannel?.AutoInsertMidMemes ?? true);
        // The brief's notes are capped at StoryRunService.MaxNotesChars, so the rules stay short and the rest of the budget
        // goes to the source facts and draft script (trimmed from their end, never the rules).
        var structureRules = isComedy
            ? $"COMEDY PLAYBOOK ({effectiveComedyStyle}): 1) Instant cold-open conflict hook on line 1 (zero formal intro). 2) Fast back-and-forth {ComedyCraftGuide.DescribeTone(effectiveComedyStyle, post.Language)} 3) Rule-of-three escalation + mid-video meme reaction beat + unexpected twist payoff (NO moral sermon)."
            : (isFullStory
                ? "STORY (<3 min): 1) [सूत्रधार]/Narrator context hook: who, where, why. 2) Chronological scenes across changing locations (court -> forest -> ashram -> climax). 3) Every speaking character in `cast` with a detailed English `look`. 4) Narrator states the moral, then the CTA."
                : "STORY (<=60s): 1) Narrator hook: who and why. 2) Chronological dialogue scenes with changing locations and consistent `cast` looks. 3) Moral, then CTA.");
        // Retention on YouTube is decided by the pictures as much as the words: a scene that sits on one image too long,
        // or a character whose face changes between scenes, is where viewers leave.
        var visualRules = isComedy
            ? $"VISUALS: fast cut every 3-6s, exaggerated expressive cartoon faces, reaction close-ups, no text in generated pictures. Consistent character faces/clothes across scenes."
            : $"VISUALS: new picture every {(isFullStory ? "8-12" : "5-8")}s, each scene its own location, time of day and framing (wide -> medium -> close-up). " +
              "imagePrompt in English as a film still: subject, action, setting, era-accurate costume/props, lighting, lens. No text in pictures. " +
              "Same face/age/clothes for a character in every scene. Striking hook frame in the first 3s.";
        var rulesBlock = $"{structureRules}\n{visualRules}\n";
        var sourceBlock = $"Source: {post.SourceTitle}\n\n{post.Script}\n\nVisual style guide: {post.AiVideoPrompt}";
        var sourceBudget = Math.Max(0, StoryRunService.MaxNotesChars - rulesBlock.Length);
        if (sourceBlock.Length > sourceBudget) sourceBlock = sourceBlock[..sourceBudget];

        var brief = new StoryBrief
        {
            Title = post.Title,
            Notes = rulesBlock + sourceBlock,
            Language = string.Equals(post.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi",
            TargetSeconds = targetSeconds,
            Format = post.Format == AutomationVideoFormat.Vertical ? StoryFormat.Vertical : StoryFormat.Wide,
            // Manual: the run stops after research with the Story Agent's full script prompt (scenes, cast looks,
            // seconds, camera, image prompts) ready to copy into any outside AI; the pasted reply is parsed and checked
            // by the same StoryScriptParser as a model's own reply, then AutoApprove carries it straight to the render.
            Writer = manualScript ? StoryWriterMode.Manual : StoryWriterMode.Auto,
            GenreId = isComedy ? StoryGenres.FunnyId : null,
            Mode = post.SourceType is AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha
                ? StoryGenreMode.Scripture
                : StoryGenreMode.Creative,
            Voicing = isComedy ? StoryVoicing.CharactersOnly : StoryVoicing.Narrated,
            BrandChannelId = rule?.BrandChannelId,
            ComedyStyle = effectiveComedyStyle,
            AutoInsertMemes = includeMemes
        };

        var build = new StoryBuildOptions
        {
            Narration = StoryNarrationMode.Stock,
            Visuals = effectiveVisualEngine == AutomationVisualEngine.StorageImagesStory
                ? StoryVisualMode.UploadsOnly
                : StoryVisualMode.Auto,
            StorageAssetIds = attachedAssetIds,
            // The Generate Video wizard's music step saves this on the post; "Voice only" leaves the track free for a
            // song or score added later in YouTube or an editor. A post never opened in the wizard keeps music.
            Music = post.Stage?.IncludeBackgroundMusic ?? true,
            RenderWhenReady = true,
            AutoApprove = true,
            // The script still flows straight on (it was written by AI or pasted by the person); only the voices, music
            // and finished video pause for a listen when the wizard's review choice is on.
            ReviewSteps = post.Stage?.ReviewSteps ?? false,
            // Quality defaults for the realistic engine: film-like pictures, cinematic cuts and camera moves, one voice
            // per character, mouths that move on stills, and a voice brought to a comfortable pace. The storage-images
            // engine keeps the genre's own look, since its pictures are the person's own.
            ArtStyle = effectiveVisualEngine == AutomationVisualEngine.AiRealisticStory ? StoryArtStyle.Realistic : StoryArtStyle.Auto,
            LookStyle = StoryLookStyle.Cinematic,
            CastVoices = true,
            TalkingFaces = true,
            AutoPace = true
        };

        return await storyRuns.CreateAsync(userId, brief, build, ct).ConfigureAwait(false);
    }

    private async Task<(ComposedAutomationContent Content, bool UsedAi)> TryRefineWithAiAsync(
        string userId,
        AutomationRule rule,
        ComposedAutomationContent draft,
        CancellationToken ct)
    {
        var isComedy = rule.SourceType == AutomationSourceType.FunnyComedy
            || ComedyChannelMatcher.IsComedyChannelHint(rule.TargetChannelHandle, rule.TargetChannelTitle);
        var isEnglish = string.Equals(rule.Language, "en", StringComparison.OrdinalIgnoreCase);
        var isFullStory = rule.NarrativeMode == AutomationNarrativeMode.FullStory
            || (rule.NarrativeMode != AutomationNarrativeMode.ShortReel
                && (rule.VideoFormat == AutomationVideoFormat.Wide || rule.TargetSeconds >= 95));
        // A full story fills the rule's length: up to 3 minutes for a Short, up to 10 for a full 16:9 video.
        var storySeconds = Math.Clamp(rule.TargetSeconds >= 95 ? rule.TargetSeconds : (isComedy ? Math.Max(15, rule.TargetSeconds) : 165), isComedy ? 15 : 95, MaxSecondsFor(rule.VideoFormat));
        var storyBudget = DialogueBudget(storySeconds);
        var dialogueEnabled = rule.EnableCharacterDialogue || isComedy
            || rule.SourceType is AutomationSourceType.DailyKatha or AutomationSourceType.HinduFestival or AutomationSourceType.HinduPanchang or AutomationSourceType.AajKaItihaas;
        IReadOnlyList<AnimStudio.Domain.Effects.EffectClip> userMemes = isComedy && effects is not null && rule.AutoInsertMemes
            ? await effects.ListByUserAsync(userId, 200, ct).ConfigureAwait(false)
            : [];

        string prompt;
        if (isComedy)
        {
            var comedyGuidance = ComedyCraftGuide.BuildPromptGuidance(
                rule.ComedyStyle, rule.Language, storySeconds, userMemes, rule.AutoInsertMemes, isProceduralFormat: true);
            prompt = $"""
                You write viral, genuinely funny YouTube {(isFullStory ? "full-length" : "Shorts")} animated 3D comedy scripts.
                Target Language: {(isEnglish ? "Casual spoken English" : "Authentic colloquial Hindi in Devanagari (NO stiff formal 'आप/महोदय')")}
                {comedyGuidance}
                Characters: [{(string.IsNullOrWhiteSpace(rule.SpeakerAName) ? "पप्पू भैया" : rule.SpeakerAName.Trim())}] and [{(string.IsNullOrWhiteSpace(rule.SpeakerBName) ? "बबलू यार" : rule.SpeakerBName.Trim())}] (keep `[Character Name]: line` format, optionally add `[MEME]: <name> | <caption>` mid-video and climax).
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
        }
        else
        {
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
               - Turn count: {(isFullStory ? $"{storyBudget.MinLines} to {storyBudget.MaxLines} complete story-arc turns (each 18-30 words, about {storyBudget.Words} words in total for ~{storySeconds}s) covering the FULL beginning-to-end story." : "5 to 7 crisp chronological turns (each 12-20 words, ~55s short) covering Context Hook + Core Action + Ending Moral + CTA.")}
               """
            : "- Keep narration structured with brief opening context hook, chronological progression, clear ending moral, and website CTA without removing facts or times.";

        var languageGuidance = isEnglish
            ? "English (clear natural spoken English)"
            : "Pure Hindi in Devanagari script ONLY (translate ALL English story summaries, titles, headings, and labels like 'Focus:' / 'Moral:' completely into natural spoken Hindi; preserve ONLY website URLs and exact Panchang clock times/Tithi terms where needed).";

        prompt = $"""
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
        }

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

    /// <summary>YouTube's own limit for a Short; vertical and community videos stay within it.</summary>
    internal const int ShortVideoMaxSeconds = 180;

    /// <summary>A full 16:9 video may tell the whole story: up to 10 minutes (the Story Agent's own ceiling).</summary>
    internal const int FullVideoMaxSeconds = 600;

    internal const int MinVideoSeconds = 10;

    /// <summary>The longest video a format may be: Shorts are capped by YouTube, full videos are not.</summary>
    internal static int MaxSecondsFor(AutomationVideoFormat format) =>
        format == AutomationVideoFormat.Wide ? FullVideoMaxSeconds : ShortVideoMaxSeconds;

    /// <summary>A stored length: the widest any format allows. The format's own cap applies when it is resolved.</summary>
    private static int ClampStoredSeconds(int seconds) => Math.Clamp(seconds, MinVideoSeconds, FullVideoMaxSeconds);

    internal static int ResolvePostTargetSeconds(
        AutomationPost post,
        AutomationRule? rule,
        AutomationNarrativeMode mode,
        int explicitSeconds)
    {
        var max = MaxSecondsFor(post.Format);
        if (explicitSeconds > 0)
            return Math.Clamp(explicitSeconds, MinVideoSeconds, max);
        if (post.TargetSeconds is > 0)
            return Math.Clamp(post.TargetSeconds.Value, MinVideoSeconds, max);

        return mode switch
        {
            AutomationNarrativeMode.FullStory => Math.Clamp(rule?.TargetSeconds is >= 95 ? rule.TargetSeconds : 165, 95, max),
            AutomationNarrativeMode.ShortReel => Math.Clamp(rule?.TargetSeconds is > 0 and <= 60 ? rule.TargetSeconds : 55, MinVideoSeconds, 60),
            _ => post.Format == AutomationVideoFormat.Wide
                ? Math.Clamp(rule?.TargetSeconds is >= 95 ? rule.TargetSeconds : 165, 95, max)
                : Math.Clamp(rule?.TargetSeconds is > 0 ? rule.TargetSeconds : 55, MinVideoSeconds, max)
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
        foreach (var extra in plan.Supporting)
            AddMember(extra.Name, extra.Role);

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

    private const int MaxSceneBackdrops = 6;
    private static readonly TimeSpan SceneBackdropBudget = TimeSpan.FromSeconds(150);

    /// <summary>
    /// One photoreal backdrop per distinct scene of the script (in first-appearance order, matching the renderer's
    /// scene index), from the configured image engine. Uses the scene's own IMAGE prompt, or one written from its
    /// setting and time. Best-effort and time-boxed: with no image engine, or on any failure, the renderer paints
    /// the scenes procedurally instead.
    /// </summary>
    private async Task<(string? TempDir, List<string> FilePaths)> GenerateSceneBackdropsAsync(
        string userId,
        AutomationPost post,
        AutomationRule? rule,
        string format,
        PostRenderProgressWriter? tracker,
        CancellationToken ct,
        string? script = null)
    {
        var plan = DialogueScriptParser.ParsePlan(
            post.Title, script ?? post.Script, post.AiVideoPrompt, 60, enableDialogue: true,
            post.SpeakerAName ?? rule?.SpeakerAName, post.SpeakerBName ?? rule?.SpeakerBName, post.SourceType.ToString());
        var cues = plan.SceneCueOrder.Take(MaxSceneBackdrops).ToList();
        // Only scripts that direct their scenes ask for pictures; auto-detected places stay procedural.
        if (cues.Count == 0 || plan.Scenes is not { Count: > 0 } directed) return (null, []);

        var (width, height) = format switch
        {
            "landscape" => (1344, 768),
            "square" => (1024, 1024),
            _ => (768, 1344)
        };

        string? tempDir = null;
        var paths = new List<string>();
        using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budget.CancelAfter(SceneBackdropBudget);
        try
        {
            for (var i = 0; i < cues.Count; i++)
            {
                tracker?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Dialogue + 4,
                    $"Painting realistic scene {i + 1} of {cues.Count}"));
                var (setting, time) = SceneDirectives.FromCue(cues[i]);
                var directive = SceneDirectives.SceneNumber(cues[i]) is { } n && n <= directed.Count
                    ? directed[n - 1]
                    : directed.FirstOrDefault(d => SceneDirectives.ToCue(d.Setting, d.TimeOfDay) == cues[i]);
                var request = new AiImageRequest
                {
                    Prompt = BuildSceneImagePrompt(directive, setting, time),
                    NegativePrompt = "text, letters, watermark, logo, people, faces, characters, cartoon, blurry, distorted",
                    Width = width,
                    Height = height,
                    Seed = StableSeed($"{post.Id}:{cues[i]}")
                };

                var outcome = await ai.ImageAsync(request, new AiCallContext(null, userId), budget.Token).ConfigureAwait(false);
                if (outcome.Kind == AiOutcomeKind.Unavailable) break;
                if (!outcome.IsSuccess || outcome.Value is not { Content.Length: > 0 } image)
                {
                    // Keep scene indexes aligned: a missing picture would shift every later scene onto the wrong photo.
                    break;
                }

                tempDir ??= Directory.CreateDirectory(Path.Combine(Path.GetTempPath(), $"animstudio-scene-bg-{Guid.NewGuid():n}")).FullName;
                var ext = image.MimeType.ToLowerInvariant() switch
                {
                    "image/png" => ".png",
                    "image/webp" => ".webp",
                    _ => ".jpg"
                };
                var file = Path.Combine(tempDir, $"{i:D2}_scene{ext}");
                await File.WriteAllBytesAsync(file, image.Content, budget.Token).ConfigureAwait(false);
                paths.Add(file);
            }
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            logger.LogInformation("Scene backdrops for post {PostId} hit the time budget after {Count} image(s).", post.Id, paths.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Scene backdrop generation failed for post {PostId}; rendering painted scenes.", post.Id);
        }

        // Partial sets would put later scenes on the wrong picture; use them only when every scene has one.
        if (paths.Count < cues.Count)
        {
            if (tempDir is not null)
            {
                try { Directory.Delete(tempDir, recursive: true); } catch { /* best-effort scratch cleanup */ }
            }
            return (null, []);
        }
        return (tempDir, paths);
    }

    internal static string BuildSceneImagePrompt(SceneDirective? directive, SceneSetting setting, SceneTimeOfDay time)
    {
        var subject = !string.IsNullOrWhiteSpace(directive?.ImagePrompt)
            ? directive!.ImagePrompt!
            : AutomationBackgroundPromptBuilder.SubjectFor(setting);
        var light = time switch
        {
            SceneTimeOfDay.Dawn => "golden sunrise light",
            SceneTimeOfDay.Sunset => "warm sunset glow",
            SceneTimeOfDay.Night => "moonlit night, lamp light",
            SceneTimeOfDay.Day => "bright natural daylight",
            _ => "cinematic soft light"
        };
        var mood = string.IsNullOrWhiteSpace(directive?.Mood) ? string.Empty : $", {directive!.Mood} mood";
        return $"{subject.TrimEnd('.', ' ')}, {light}{mood}, photorealistic cinematic background plate, empty scene with no people, " +
               "depth of field, volumetric atmosphere, highly detailed, 8k matte painting, no text";
    }

    private static long StableSeed(string input)
    {
        unchecked
        {
            long hash = 1469598103934665603;
            foreach (var c in input)
            {
                hash ^= c;
                hash *= 1099511628211;
            }
            return hash & 0x7FFFFFFF;
        }
    }

    private async Task<(string? TempDir, List<string> FilePaths)> MaterializeStorageImagesAsync(
        string userId,
        IReadOnlyList<string> assetIds,
        CancellationToken ct)
    {
        if (assets is null || assetIds.Count == 0) return (null, []);

        // Only images from the user's own projects: an asset id from another account is ignored, never rendered.
        var ownedProjectIds = (await projects.ListAsync(userId, ct).ConfigureAwait(false))
            .Select(p => p.Id)
            .ToHashSet(StringComparer.Ordinal);
        var fetched = await assets.GetManyAsync(assetIds, ct).ConfigureAwait(false);
        var byId = fetched
            .Where(a => a.Kind == AssetKind.Image && !string.IsNullOrWhiteSpace(a.StorageKey)
                && ownedProjectIds.Contains(a.ProjectId))
            .GroupBy(a => a.Id, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

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
