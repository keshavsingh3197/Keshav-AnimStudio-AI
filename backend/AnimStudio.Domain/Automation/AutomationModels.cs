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
    CustomPrompt = 6,
    FunnyComedy = 7,
    DailyRashifal = 8,

    /// <summary>Daily devotional prayer / bhakti image-reel Short (Shiv, Krishna, Ram, Hanuman, Devi) designed for custom voiceover, smooth non-shaking camera motion, and top captions.</summary>
    DevotionalPrarthana = 9
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

/// <summary>Visual rendering mode used when turning an automation post into a video.</summary>
public enum AutomationVisualEngine
{
    /// <summary>Follow the rule's default video strategy.</summary>
    Auto = 0,

    /// <summary>Batched multi-scene AI Story Agent video with created Studio characters, changing backgrounds, talking faces, Google TTS & BGM.</summary>
    AiRealisticStory = 1,

    /// <summary>Multi-scene Story Agent video powered by images picked from AnimStudio Storage / Project Library.</summary>
    StorageImagesStory = 2,

    /// <summary>Fast local multi-act 3D animated character stage (with optional storage backdrops).</summary>
    Procedural3D = 3,

    /// <summary>
    /// Devotional Image Reel: rounded-vignette deity images centered on a clean dark canvas with smooth non-shaking
    /// camera motion (zoom, pan, rounding/orbit, gentle tilt), synced top captions, custom voiceover, and quiet BGM.
    /// </summary>
    DevotionalImageReel = 4
}

/// <summary>Story pacing/depth target for automation posts.</summary>
public enum AutomationNarrativeMode
{
    Auto = 0,

    /// <summary>Concise reel under 60 seconds (~4-5 scenes).</summary>
    ShortReel = 1,

    /// <summary>Complete beginning-to-end story completed in under 3 minutes (&lt;= 180s, ~11-13 scenes) with opening context hook and ending moral.</summary>
    FullStory = 2
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
    public string Location { get; set; } = "India (IST)";

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

    public AutomationVisualEngine VisualEngine { get; set; } = AutomationVisualEngine.Auto;
    public AutomationNarrativeMode NarrativeMode { get; set; } = AutomationNarrativeMode.Auto;
    public List<string> AttachedAssetIds { get; set; } = [];
    public AnimStudio.Domain.Stories.ComedyToneStyle ComedyStyle { get; set; } = AnimStudio.Domain.Stories.ComedyToneStyle.Auto;
    public bool AutoInsertMemes { get; set; } = true;

    /// <summary>When false (default option for 2D Panchang/Rashifal), hides corner/footer branding watermark during video and template rendering.</summary>
    public bool? ShowWatermark { get; set; }

    /// <summary>When true, prefers the ultra-fast 2D CPU procedural animation engine for near-instant Daily Panchang &amp; Rashifal generation.</summary>
    public bool PreferFast2DAnimation { get; set; }

    /// <summary>
    /// Optional user custom voice (<c>vp_...</c>, supporting Google replicated Gemini TTS or local voice conversion)
    /// used to narrate posts prepared by this rule.
    /// </summary>
    public string? VoiceProfileId { get; set; }

    /// <summary>Human-readable label of the selected custom voice profile for dashboard display.</summary>
    public string? VoiceProfileName { get; set; }

    /// <summary>
    /// Optional deity/theme rotation focus for <see cref="AutomationSourceType.DevotionalPrarthana"/> rules
    /// (<c>auto</c>, <c>shiv</c>, <c>krishna</c>, <c>ram</c>, <c>ram-krishna</c>, <c>hanuman</c>, <c>devi</c>).
    /// </summary>
    public string? DeityFocus { get; set; }

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

    /// <summary>Object-store key for the custom/AI-generated YouTube thumbnail image (normalized JPEG/PNG).</summary>
    public string? ThumbnailStorageKey { get; set; }

    /// <summary>Optional video frame timestamp (seconds) to extract the YouTube thumbnail from when no custom image is uploaded.</summary>
    public double? ThumbnailFrameAtSeconds { get; set; }

    /// <summary>Human-readable source label for the configured thumbnail (Uploaded, AI Generated, Video Frame, Storage Image).</summary>
    public string? ThumbnailSource { get; set; }

    public AutomationPostStatus Status { get; set; } = AutomationPostStatus.PreparedPreview;
    public DateTime? ScheduledAtUtc { get; set; }
    public string? QueueItemId { get; set; }
    public string? UploadId { get; set; }
    public string? PublishedVideoId { get; set; }
    public string? PublishedVideoUrl { get; set; }

    /// <summary>The channel the current <see cref="PublishedVideoId"/> was uploaded to (the target can change later).</summary>
    public string? PublishedChannelId { get; set; }
    public string? PublishedChannelTitle { get; set; }

    /// <summary>When the published video was last confirmed to still exist on YouTube.</summary>
    public DateTime? YouTubeCheckedAtUtc { get; set; }

    /// <summary>Earlier uploads of this card that were deleted (in the app or in YouTube Studio), newest last.</summary>
    public List<AutomationRemovedVideo> RemovedVideos { get; set; } = [];
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

    public AutomationVisualEngine VisualEngine { get; set; } = AutomationVisualEngine.Auto;
    public AutomationNarrativeMode NarrativeMode { get; set; } = AutomationNarrativeMode.Auto;
    public int? TargetSeconds { get; set; }
    public List<string> AttachedAssetIds { get; set; } = [];
    public AnimStudio.Domain.Stories.ComedyToneStyle ComedyStyle { get; set; } = AnimStudio.Domain.Stories.ComedyToneStyle.Auto;
    public bool AutoInsertMemes { get; set; } = true;

    /// <summary>When false, omits corner/footer watermark overlays on 2D Panchang/Rashifal videos and templates.</summary>
    public bool? ShowWatermark { get; set; }

    /// <summary>When true, prefers ultra-fast 2D procedural animation (<c>CpuFast</c>) instead of launching WebGL 3D.</summary>
    public bool PreferFast2DAnimation { get; set; }

    /// <summary>Optional custom voice profile id (<c>vp_...</c>) for narrating this post with the creator's own Google-replicated or local voice.</summary>
    public string? VoiceProfileId { get; set; }

    /// <summary>Display name of the attached custom voice profile.</summary>
    public string? VoiceProfileName { get; set; }

    /// <summary>Enhanced 3D stage choices for this post: background template, character spots, music and voice pacing.</summary>
    public AutomationStageSettings? Stage { get; set; }

    public List<string> ProvisionedCharacterNames { get; set; } = [];
    public string? StoryStageSummary { get; set; }
    public int? StoryProgressPercent { get; set; }

    /// <summary>Timestamp when a published video was synced to sister HinduPanchang / ecosystem video hub.</summary>
    public DateTime? SyncedToEcosystemAtUtc { get; set; }

    /// <summary>Date/fact verification result: Verified, NeedsReview, Mismatch, or Unverified.</summary>
    public string VerificationStatus { get; set; } = "Verified";

    /// <summary>Human-readable summary of fact &amp; date verification or mismatch explanation.</summary>
    public string? VerificationSummary { get; set; }

    /// <summary>Authoritative source label (e.g. Wikipedia On This Day, Lahiri Chitrapaksha Ephemeris).</summary>
    public string? VerificationSourceName { get; set; }

    /// <summary>Direct clickable source URL or search verification URL for double-checking facts.</summary>
    public string? VerificationSourceUrl { get; set; }

    /// <summary>Detailed list of detected date or fact warnings/mismatches for this post.</summary>
    public List<string> VerificationIssues { get; set; } = [];

    public DateTime? VerifiedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? PublishedAtUtc { get; set; }

    /// <summary>
    /// Selects the highest-priority post when multiple records share the same fingerprint
    /// (always prefers Published / in-flight / video-ready records over empty drafts).
    /// </summary>
    public static AutomationPost? SelectPreferred(IEnumerable<AutomationPost> candidates) =>
        candidates
            .OrderByDescending(p => p.Status switch
            {
                AutomationPostStatus.Published => 6,
                AutomationPostStatus.Publishing => 5,
                AutomationPostStatus.Approved => 4,
                AutomationPostStatus.VideoReadyForReview => 3,
                AutomationPostStatus.GeneratingVideo => 2,
                AutomationPostStatus.PreparedPreview => 1,
                _ => 0
            })
            .ThenByDescending(p => !string.IsNullOrWhiteSpace(p.PublishedVideoId))
            .ThenByDescending(p => p.UpdatedAtUtc)
            .ThenByDescending(p => p.CreatedAtUtc)
            .FirstOrDefault();
}

/// <summary>
/// Optional Enhanced 3D stage choices for one post. Everything here is optional: an empty object renders exactly as
/// before, except that the script is followed as written by default.
/// </summary>
public sealed class AutomationStageSettings
{
    /// <summary>
    /// A Studio Storage image (owned by the post's user) used as the whole background. It stays still and whole so
    /// characters placed on it keep their spots; light and particle effects still play on top.
    /// </summary>
    public string? BackgroundTemplateAssetId { get; set; }

    /// <summary>
    /// The user's own pictures for the directed scenes, in order: picture 1 for the first <c>[SCENE]</c> line, picture 2
    /// for the second, and so on (made in any outside tool from the template's IMAGE prompts). Used when there is no
    /// <see cref="BackgroundTemplateAssetId"/>; each gets the slow camera move and a cut between scenes.
    /// </summary>
    public List<string> SceneBackgroundAssetIds { get; set; } = [];

    /// <summary>Where the story happens, e.g. "temple courtyard at sunrise". Picks the 3D setting and guides the script.</summary>
    public string? LocationPrompt { get; set; }

    /// <summary>Spot of the left main character on the frame; null keeps the default place.</summary>
    public AutomationCharacterPlacement? LeftCharacter { get; set; }

    /// <summary>Spot of the right main character on the frame; null keeps the default place.</summary>
    public AutomationCharacterPlacement? RightCharacter { get; set; }

    /// <summary>False renders voice only (no background music), e.g. to add a track later in YouTube.</summary>
    public bool IncludeBackgroundMusic { get; set; } = true;

    /// <summary>
    /// True speaks every line as written at natural speed (no speed-up, no dropped lines) and ends the video with the
    /// narration. A vertical video longer than 3 minutes is then uploaded as a normal video rather than a Short.
    /// </summary>
    public bool FollowScriptExactly { get; set; } = true;

    /// <summary>
    /// Story engines: pause after the voices, the music and the finished video so each can be checked (and redone) in
    /// the Story Studio before the next step. Off runs straight through to the video.
    /// </summary>
    public bool ReviewSteps { get; set; }

    /// <summary>Optional SongLibrary track id (`song_&lt;hex&gt;`) to mux as custom background music in the 3D video.</summary>
    public string? AttachedSongId { get; set; }

    /// <summary>
    /// How the background picture moves behind the characters. <see cref="AutomationBackdropMotion.Still"/> keeps it
    /// exactly as placed; the others add a smooth, non-shaking camera move.
    /// </summary>
    public AutomationBackdropMotion BackgroundMotion { get; set; } = AutomationBackdropMotion.Still;

    /// <summary>Optional custom voice profile id (<c>vp_...</c>) overriding the post/rule voice selection inside the stage wizard.</summary>
    public string? VoiceProfileId { get; set; }

    /// <summary>Stage frame layout mode (Default 3D stage or centered Devotional Image Reel with top spoken captions).</summary>
    public AutomationStagePresentation PresentationMode { get; set; } = AutomationStagePresentation.Default;

    /// <summary>
    /// Optional background music volume percent (<c>0..100</c>). Defaults to ~45% on standard videos and ~18% (soft bed)
    /// on <see cref="AutomationStagePresentation.DevotionalImageReel"/> so spoken custom voice stays crisp and dominant.
    /// </summary>
    public int? BgmVolumePercent { get; set; }
}

/// <summary>Stage visual framing mode for procedural automation videos.</summary>
public enum AutomationStagePresentation
{
    Default = 0,

    /// <summary>Dark canvas with centered rounded-vignette photo frame, smooth non-shaking motion, subtle @handle below, and synced top captions.</summary>
    DevotionalImageReel = 1
}

/// <summary>Smooth, non-shaking camera moves over a user's background picture or devotional image reel.</summary>
public enum AutomationBackdropMotion
{
    /// <summary>The picture stays still and whole, so characters keep their exact spots on it.</summary>
    Still = 0,

    /// <summary>A slow, small push-in and back (a few percent), like a breathing camera.</summary>
    GentleZoom = 1,

    /// <summary>The picture glides slowly sideways, back and forth.</summary>
    SlowPan = 2,

    /// <summary>Smooth circular/elliptical orbital camera sweep around the focal subject with zero shake.</summary>
    OrbitRound = 3,

    /// <summary>Silky slow camera tilt/rotation combined with gentle breathing zoom, with zero camera shake.</summary>
    GentleRotate = 4,

    /// <summary>Starts slightly pushed in on the subject and smoothly pulls back across the shot.</summary>
    ZoomOut = 5,

    /// <summary>Automatically cycles smoothly across Zoom In, Orbit Round, Slow Pan, Zoom Out, and Gentle Rotate per image/scene.</summary>
    AutoSmooth = 6
}

/// <summary>Fractions of the frame: X = figure centre across, Y = ground line (feet) down, Scale = size multiplier.</summary>
public sealed class AutomationCharacterPlacement
{
    public double X { get; set; } = 0.5;
    public double Y { get; set; } = 0.6;
    public double Scale { get; set; } = 1.0;
}

/// <summary>A YouTube upload of an automation card that no longer exists on YouTube.</summary>
public sealed class AutomationRemovedVideo
{
    public string VideoId { get; set; } = string.Empty;
    public string? ChannelId { get; set; }
    public string? ChannelTitle { get; set; }
    public DateTime RemovedAtUtc { get; set; }

    /// <summary>True when the app deleted it through the YouTube API; false when it was found missing (deleted in YouTube Studio).</summary>
    public bool DeletedByApp { get; set; }
}

/// <summary>
/// Workspace-level editable automation settings persisted in DB (configurable API endpoints,
/// global autopilot switch, default Panchang city, and default schedule settings).
/// </summary>
public sealed class AutomationWorkspaceConfig
{
    public bool GlobalAutopilotEnabled { get; set; } = true;

    /// <summary>
    /// Full-autopilot videos are uploaded <b>private</b> as soon as they are ready, with SEO, thumbnail and policy
    /// clean-up filled in, and YouTube releases them publicly at the next audience peak slot. Off = publish at once.
    /// </summary>
    public bool AutopilotReleaseAtPeakTime { get; set; } = true;
    public bool AutoPrepareDaily { get; set; } = true;
    public string DefaultLocation { get; set; } = "India (IST)";
    public string DefaultTimeZone { get; set; } = "Asia/Kolkata";
    public string? PanchangApiBaseUrl { get; set; }
    public string? SocialApiBaseUrl { get; set; }
    public string? PratiyogitaApiBaseUrl { get; set; }
    public bool UseAiScriptRefinement { get; set; } = true;

    /// <summary>Default watermark visibility for 2D Panchang &amp; Rashifal generations (false = clean no-watermark output).</summary>
    public bool PanchangShowWatermark { get; set; }

    /// <summary>Prefer ultra-fast 2D procedural animation by default for Daily Panchang &amp; Rashifal Shorts.</summary>
    public bool PanchangUseFast2DAnimation { get; set; } = true;

    /// <summary>Studio Storage asset ID used automatically as the default thumbnail for Daily Panchang / Rashifal cards.</summary>
    public string? PanchangDefaultThumbnailAssetId { get; set; }

    /// <summary>Studio Storage asset ID used automatically as the default stage/template background for 2D Panchang &amp; Rashifal.</summary>
    public string? PanchangDefaultBackgroundAssetId { get; set; }

    /// <summary>Fixed editable headline template for Panchang thumbnails (empty = verified daily Panchang headline).</summary>
    public string? PanchangThumbnailTitleTemplate { get; set; }

    /// <summary>Fixed editable subtitle template for Panchang thumbnails.</summary>
    public string? PanchangThumbnailSubtitleTemplate { get; set; }

    /// <summary>Number of days ahead (Current Week + Next Week = 14) tracked &amp; pre-prepared by the Weekly Buffer planner.</summary>
    public int AdvanceBufferDays { get; set; } = 14;

    /// <summary>When true, background worker gently pre-fills missing days across the advance buffer window.</summary>
    public bool AutoFillBufferInBackground { get; set; } = true;

    public DateTime UpdatedAtUtc { get; set; }
}
