namespace AnimStudio.Domain.Automation;

/// <summary>Which ecosystem feed drives an automated daily content rule.</summary>
public enum AutomationSourceType
{
    HinduPanchang = 0,
    HinduFestival = 1,
    DailyKatha = 2,
    AajKaItihaas = 3,
    Pratiyogita = 4,
    EcosystemSpotlight = 5,
    CustomPrompt = 6
}

/// <summary>Whether the rule stops in the Preview List or proceeds autonomously to YouTube.</summary>
public enum AutomationPostMode
{
    /// <summary>Generates title, script, AI prompts and website links into the Preview List; waits for user video attach & approval.</summary>
    PreviewOnly = 0,

    /// <summary>Also attaches an unused Drive clip / starts AI Story render automatically, then pauses for 1-click publish approval.</summary>
    AutoVideoAndPreview = 1,

    /// <summary>Fully automated: prepares content, attaches or generates video, and publishes/schedules to YouTube on cadence.</summary>
    FullAutopilot = 2
}

/// <summary>How a prepared automation post acquires its video file.</summary>
public enum AutomationVideoStrategy
{
    PreferUnusedDriveClipThenAiRender = 0,
    PreferUnusedDriveClipOnly = 1,
    PreferFinishedRenderJob = 2,
    AutoGenerateStoryVideo = 3,
    ManualAttachOnly = 4,

    /// <summary>Generates a 2D/3D procedural animated MP4 directly on this machine with zero GPU or external AI keys required.</summary>
    AutoGenerateAnimated3DVideo = 5
}

/// <summary>Orientation/shape or surface type for prepared content & Story Agent / Procedural 3D renders.</summary>
public enum AutomationVideoFormat
{
    Vertical = 0,
    Wide = 1,
    CommunityPost = 2
}

/// <summary>Lifecycle state of a prepared daily post item.</summary>
public enum AutomationPostStatus
{
    PreparedPreview = 0,
    GeneratingVideo = 1,
    VideoReadyForReview = 2,
    Approved = 3,
    Publishing = 4,
    Published = 5,
    Failed = 6,
    Skipped = 7
}

/// <summary>
/// A dynamic routing rule configured by the creator/admin mapping an ecosystem signal
/// (e.g. Daily Hindu Panchang, Hindu Festivals, Daily Katha, Aaj Ka Itihaas, Pratiyogita)
/// to a target YouTube channel, Drive topic folder, AI generation settings, and tracked
/// website traffic links. Stored in the database so zero channel rules are hardcoded.
/// </summary>
public sealed class AutomationRule
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Enabled { get; set; } = true;

    public AutomationSourceType SourceType { get; set; } = AutomationSourceType.HinduPanchang;
    public AutomationPostMode Mode { get; set; } = AutomationPostMode.PreviewOnly;
    public AutomationVideoStrategy VideoStrategy { get; set; } = AutomationVideoStrategy.PreferUnusedDriveClipThenAiRender;
    public AutomationVideoFormat VideoFormat { get; set; } = AutomationVideoFormat.Vertical;

    /// <summary>Target connected YouTube channel ID (optional while drafting before YouTube is connected).</summary>
    public string? TargetChannelId { get; set; }
    public string? TargetChannelHandle { get; set; }
    public string? TargetChannelTitle { get; set; }
    public string? BrandChannelId { get; set; }

    /// <summary>Content Calendar / Drive Library topic paired with this rule so unused clips match automatically.</summary>
    public string? TopicId { get; set; }
    public string? TopicName { get; set; }

    /// <summary><c>hi</c>, <c>en</c>, or <c>bilingual</c>.</summary>
    public string Language { get; set; } = "hi";
    public int TargetSeconds { get; set; } = 55;
    public string Location { get; set; } = "New Delhi, India";

    /// <summary>HH:mm (24h) local publish time in <see cref="TimeZoneId"/>.</summary>
    public string PreferredPublishTime { get; set; } = "07:00";
    public string TimeZoneId { get; set; } = "Asia/Kolkata";

    /// <summary>0=Sunday .. 6=Saturday; empty means daily.</summary>
    public List<int> DaysOfWeek { get; set; } = [];
    public int FestivalLeadDays { get; set; } = 1;

    /// <summary>Keys of websites from Central Admin /api/config (e.g. panchang, studio, social, pratiyogita, blog).</summary>
    public List<string> FunnelWebsiteKeys { get; set; } = [];
    public string? SocialFunnelSlug { get; set; }

    /// <summary>YouTube upload defaults: public, unlisted, or private.</summary>
    public string Privacy { get; set; } = "public";
    public string CategoryId { get; set; } = "22";
    public bool MadeForKids { get; set; }
    public bool IncludePinnedComment { get; set; } = true;

    public string? PromptTemplateOverride { get; set; }
    public string? DescriptionFooterOverride { get; set; }

    /// <summary>For CustomPrompt rules or AI theme seeding.</summary>
    public string? CustomTopicPrompt { get; set; }

    /// <summary>Animated ASS subtitle preset: <c>event-glow</c>, <c>karaoke-pulse</c>, or <c>classic-clean</c>.</summary>
    public string SubtitlePreset { get; set; } = "event-glow";

    /// <summary>When true, procedural 3D videos render animated 2-character dialogue stages for storytelling/discussions.</summary>
    public bool EnableCharacterDialogue { get; set; } = true;

    public string? SpeakerAName { get; set; }
    public string? SpeakerBName { get; set; }

    public int SortOrder { get; set; }
    public string? LastPreparedDateKey { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

/// <summary>A tracked website CTA embedded in a post's description and pinned comment.</summary>
public sealed class AutomationWebsiteLink
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string TrackedUrl { get; set; } = string.Empty;
}

/// <summary>
/// A daily prepared post entry generated from an <see cref="AutomationRule"/> + live
/// ecosystem signal, holding the script, AI video/image prompt, SEO metadata, website
/// funnel links, optional attached Drive clip / render / StoryRun, and publish status.
/// </summary>
public sealed class AutomationPost
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string RuleId { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public AutomationSourceType SourceType { get; set; }

    /// <summary>Date in yyyy-MM-dd (rule timezone).</summary>
    public string DateKey { get; set; } = string.Empty;

    /// <summary>Idempotency key <c>{DateKey}:{RuleId}:{SourceItemKey}</c>.</summary>
    public string Fingerprint { get; set; } = string.Empty;
    public string SourceItemKey { get; set; } = string.Empty;
    public string SourceTitle { get; set; } = string.Empty;
    public string? SourceSummary { get; set; }

    public string? TargetChannelId { get; set; }
    public string? TargetChannelHandle { get; set; }
    public string? TargetChannelTitle { get; set; }
    public string? TopicId { get; set; }
    public string? TopicName { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Script { get; set; } = string.Empty;
    public string AiVideoPrompt { get; set; } = string.Empty;
    public string AiThumbnailPrompt { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? PinnedComment { get; set; }
    public List<string> Tags { get; set; } = [];

    public string CategoryId { get; set; } = "22";
    public string Privacy { get; set; } = "public";
    public bool MadeForKids { get; set; }
    public AutomationVideoFormat Format { get; set; } = AutomationVideoFormat.Vertical;
    public string Language { get; set; } = "hi";

    public string? PrimaryDestinationUrl { get; set; }
    public List<AutomationWebsiteLink> TrackedFunnelUrls { get; set; } = [];

    public string? AttachedHandoffId { get; set; }
    public string? AttachedHandoffTitle { get; set; }
    public string? AttachedRenderJobId { get; set; }
    public string? AttachedStoryRunId { get; set; }
    public string? AttachedVideoSourceLabel { get; set; }

    public AutomationPostStatus Status { get; set; } = AutomationPostStatus.PreparedPreview;
    public DateTime? ScheduledAtUtc { get; set; }
    public string? QueueItemId { get; set; }
    public string? UploadId { get; set; }
    public string? PublishedVideoId { get; set; }
    public string? PublishedVideoUrl { get; set; }
    public string? LastError { get; set; }
    public string? Notes { get; set; }
    public bool GeneratedByAi { get; set; }

    /// <summary>Ready-to-paste YouTube Community Tab post body with CTA and question/poll prompt.</summary>
    public string? CommunityPostText { get; set; }

    /// <summary>2-4 concise poll choices tailored for YouTube Community Polls.</summary>
    public List<string> CommunityPollOptions { get; set; } = [];

    /// <summary>Storage key for the auto-generated 1080x1080 square PNG promo card.</summary>
    public string? CommunityCardStorageKey { get; set; }

    /// <summary>Fixed hex color accent bound to the event source type (used across template banner, subtitles, and UI).</summary>
    public string? EventColorHex { get; set; }

    /// <summary>Top template category/banner label rendered at the top of the video frame.</summary>
    public string? HeaderBannerText { get; set; }

    public bool EnableCharacterDialogue { get; set; } = true;
    public string? SpeakerAName { get; set; }
    public string? SpeakerBName { get; set; }
    public string SubtitlePreset { get; set; } = "event-glow";

    /// <summary>Timestamp when a published video was synced to sister HinduPanchang / ecosystem video hub.</summary>
    public DateTime? SyncedToEcosystemAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
}

/// <summary>
/// Workspace-level editable automation settings persisted in DB (configurable API endpoints,
/// global autopilot switch, default Panchang city, and default schedule settings).
/// </summary>
public sealed class AutomationWorkspaceConfig
{
    public bool GlobalAutopilotEnabled { get; set; } = true;
    public bool AutoPrepareDaily { get; set; } = true;
    public string DefaultLocation { get; set; } = "New Delhi, India";
    public string DefaultTimeZone { get; set; } = "Asia/Kolkata";
    public string? PanchangApiBaseUrl { get; set; }
    public string? SocialApiBaseUrl { get; set; }
    public string? PratiyogitaApiBaseUrl { get; set; }
    public bool UseAiScriptRefinement { get; set; } = true;
    public DateTime UpdatedAtUtc { get; set; }
}
