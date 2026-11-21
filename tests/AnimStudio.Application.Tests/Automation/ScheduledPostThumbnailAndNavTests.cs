using System.Net;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Options;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Ecosystem;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace AnimStudio.Application.Tests.Automation;

public sealed class ScheduledPostThumbnailAndNavTests
{
    private const string TinyPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    [Fact]
    public void UiNavigationSettings_CreateDefault_and_Reconcile_remove_redundant_youtube_subtabs_and_add_comedy()
    {
        var defaults = UiNavigationSettings.CreateDefault();
        Assert.Equal(UiNavigationSettings.CurrentSchemaVersion, defaults.SchemaVersion);
        Assert.DoesNotContain(defaults.Tabs, t => t.Id is "queue" or "details");
        Assert.Contains(defaults.Tabs, t => t.Id == "youtube" && t.Path == "/youtube");
        Assert.Contains(defaults.Tabs, t => t.Id == "comedy" && t.Path == "/comedy");
        Assert.Contains(defaults.Tabs, t => t.Id == "songs" && t.Path == "/songs");

        var storyIdx = defaults.Tabs.FindIndex(t => t.Id == "story-agent");
        var comedyIdx = defaults.Tabs.FindIndex(t => t.Id == "comedy");
        Assert.Equal(storyIdx + 1, comedyIdx);

        // Simulate an older persisted Admin:UiNavigation:Json document from before schema v2.
        var legacy = new UiNavigationSettings
        {
            EnforceGuestRestrictions = true,
            SchemaVersion = 0,
            Tabs =
            [
                new UiNavigationItemConfig { Id = "projects", Label = "Projects", Path = "/projects", Enabled = true },
                new UiNavigationItemConfig { Id = "story-agent", Label = "Story Agent", Path = "/story-agent", Enabled = true },
                new UiNavigationItemConfig { Id = "youtube", Label = "YouTube", Path = "/youtube", Enabled = true, VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = true },
                new UiNavigationItemConfig { Id = "queue", Label = "Publishing", Path = "/youtube/queue", Enabled = true },
                new UiNavigationItemConfig { Id = "details", Label = "Video Details", Path = "/youtube/details", Enabled = true },
                new UiNavigationItemConfig { Id = "automation", Label = "Auto Post", Path = "/automation", Enabled = false },
            ]
        };

        UiNavigationSettings.Reconcile(legacy);

        Assert.Equal(UiNavigationSettings.CurrentSchemaVersion, legacy.SchemaVersion);
        Assert.DoesNotContain(legacy.Tabs, t => t.Id is "queue" or "details");
        Assert.Contains(legacy.Tabs, t => t.Id == "comedy" && t.Path == "/comedy");
        // Custom admin settings on surviving tabs remain untouched.
        Assert.False(legacy.Tabs.Single(t => t.Id == "automation").Enabled);
    }

    [Fact]
    public async Task SetPostThumbnailAsync_and_UpdatePostAsync_sync_metadata_schedule_and_thumbnail_to_queue()
    {
        var ct = CancellationToken.None;
        const string userId = "user-sched-1";
        var repo = new FakeAutomationRepository();
        var connRepo = new FakeYouTubeConnectionRepository();
        var queueRepo = new FakePublishQueueRepository();
        var renderRepo = new FakeRenderJobRepository();
        var projectRepo = new FakeProjectRepository();
        var store = new InMemoryObjectStore();

        using var harness = BuildHarness(repo, connRepo, queueRepo, renderRepo, projectRepo, store);
        await SeedChannelAndRenderAsync(harness.Provider, userId, "UC1234567890123456789012", "proj-1", "job-1", store, renderRepo);

        var publishQueue = harness.Provider.GetRequiredService<PublishQueueService>();
        var futureAt = DateTime.UtcNow.AddHours(6);
        var queueView = await publishQueue.AddAsync(userId, new PublishQueueDraft(
            JobId: "job-1",
            ChannelId: "UC1234567890123456789012",
            Metadata: new YouTubeVideoMetadata
            {
                Title = "Initial Title",
                Description = "Initial desc",
                Tags = ["oldtag"],
                CategoryId = "22",
                Privacy = "public",
                MadeForKids = false
            },
            RelatedVideoIds: null,
            FirstComment: null,
            Thumbnail: null,
            PlanItemId: null,
            ScheduledAt: futureAt,
            Mode: PublishQueueMode.UploadAtTime,
            Hold: false,
            Notes: null), ct);

        var post = new AutomationPost
        {
            Id = "ap_sync_1",
            UserId = userId,
            RuleId = "rule-1",
            RuleName = "Comedy Pipeline",
            SourceType = AutomationSourceType.FunnyComedy,
            DateKey = "2026-11-18",
            Fingerprint = "2026-11-18:rule-1:c1",
            SourceItemKey = "c1",
            SourceTitle = "Initial Title",
            Title = "Initial Title",
            Description = "Initial desc",
            Tags = ["oldtag"],
            CategoryId = "22",
            Privacy = "public",
            MadeForKids = false,
            TargetChannelId = "UC1234567890123456789012",
            AttachedRenderJobId = "job-1",
            QueueItemId = queueView.Id,
            Status = AutomationPostStatus.Approved,
            ScheduledAtUtc = futureAt,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(post, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();

        // 1. Upload custom PNG thumbnail -> stored & synced to queue item.
        var afterThumb = await svc.SetPostThumbnailAsync(userId, post.Id, TinyPngBase64, null, null, ct);
        Assert.False(string.IsNullOrWhiteSpace(afterThumb.ThumbnailStorageKey));
        Assert.Null(afterThumb.ThumbnailFrameAtSeconds);
        Assert.Equal("Uploaded Image", afterThumb.ThumbnailSource);

        var thumbBytes = await svc.GetPostThumbnailBytesAsync(userId, post.Id, ct);
        Assert.NotNull(thumbBytes);
        Assert.True(thumbBytes!.Value.Bytes.Length > 0);

        var qAfterThumb = await publishQueue.GetAsync(userId, queueView.Id, ct);
        Assert.True(qAfterThumb.HasCustomThumbnail);

        // 2. Edit metadata, schedule, tags, category and MadeForKids -> all sync to queue item.
        var newTime = DateTime.UtcNow.AddHours(10);
        var updated = await svc.UpdatePostAsync(userId, post.Id, new AutomationPost
        {
            Title = "Updated Funny Episode",
            Description = "Updated full SEO description for viewers and algorithm discovery.",
            Tags = ["Hindi Comedy", "Shorts", "Desi Jokes"],
            CategoryId = "23",
            Privacy = "private",
            MadeForKids = true,
            PinnedComment = "Kaunsa dialogue sabse funny tha?",
            ScheduledAtUtc = newTime
        }, ct);

        Assert.True(updated.MadeForKids);
        Assert.Equal("23", updated.CategoryId);
        Assert.Equal(["Hindi Comedy", "Shorts", "Desi Jokes"], updated.Tags);

        var qAfterMeta = await publishQueue.GetAsync(userId, queueView.Id, ct);
        Assert.Equal("Updated Funny Episode", qAfterMeta.Title);
        Assert.Equal("23", qAfterMeta.CategoryId);
        Assert.Equal("private", qAfterMeta.Privacy);
        Assert.True(qAfterMeta.MadeForKids);
        Assert.Equal(["Hindi Comedy", "Shorts", "Desi Jokes"], qAfterMeta.Tags);
        Assert.Equal("Kaunsa dialogue sabse funny tha?", qAfterMeta.FirstComment);
        Assert.Equal(newTime, qAfterMeta.ScheduledAt);
        Assert.True(qAfterMeta.HasCustomThumbnail);

        // 3. Clearing tags + switching thumbnail to video frame + deleting thumbnail all propagate cleanly.
        await svc.UpdatePostAsync(userId, post.Id, new AutomationPost
        {
            Title = updated.Title,
            Description = updated.Description,
            Tags = [],
            CategoryId = "23",
            Privacy = "private",
            MadeForKids = false
        }, ct);
        var qClearedTags = await publishQueue.GetAsync(userId, queueView.Id, ct);
        Assert.Empty(qClearedTags.Tags);
        Assert.False(qClearedTags.MadeForKids);

        var afterFrame = await svc.SetPostThumbnailAsync(userId, post.Id, null, 2.5, null, ct);
        Assert.Null(afterFrame.ThumbnailStorageKey);
        Assert.Equal(2.5, afterFrame.ThumbnailFrameAtSeconds);
        var qAfterFrame = await publishQueue.GetAsync(userId, queueView.Id, ct);
        Assert.True(qAfterFrame.HasCustomThumbnail);
        Assert.Equal(2.5, qAfterFrame.ThumbnailFrameAt);

        var afterDelete = await svc.DeletePostThumbnailAsync(userId, post.Id, ct);
        Assert.Null(afterDelete.ThumbnailStorageKey);
        Assert.Null(afterDelete.ThumbnailFrameAtSeconds);
        Assert.Null(afterDelete.ThumbnailSource);
        var qAfterDelete = await publishQueue.GetAsync(userId, queueView.Id, ct);
        Assert.False(qAfterDelete.HasCustomThumbnail);
    }

    [Fact]
    public async Task ApproveAndPublishAsync_passes_post_thumbnail_to_publish_queue_instead_of_null()
    {
        var ct = CancellationToken.None;
        const string userId = "user-pub-1";
        var repo = new FakeAutomationRepository();
        var connRepo = new FakeYouTubeConnectionRepository();
        var queueRepo = new FakePublishQueueRepository();
        var renderRepo = new FakeRenderJobRepository();
        var projectRepo = new FakeProjectRepository();
        var store = new InMemoryObjectStore();

        using var harness = BuildHarness(repo, connRepo, queueRepo, renderRepo, projectRepo, store);
        await SeedChannelAndRenderAsync(harness.Provider, userId, "UC2234567890123456789012", "proj-2", "job-2", store, renderRepo);

        var post = new AutomationPost
        {
            Id = "ap_thumb_pub",
            UserId = userId,
            RuleId = "rule-2",
            RuleName = "Panchang",
            SourceType = AutomationSourceType.HinduPanchang,
            DateKey = "2026-11-18",
            Fingerprint = "2026-11-18:rule-2:p1",
            SourceItemKey = "p1",
            SourceTitle = "Aaj Ka Panchang",
            Title = "Aaj Ka Panchang",
            Description = "Daily Panchang with Shubh Muhurat and Rahu Kaal details.",
            Tags = ["Panchang", "Muhurat", "Astrology"],
            CategoryId = "27",
            Privacy = "public",
            MadeForKids = false,
            TargetChannelId = "UC2234567890123456789012",
            AttachedRenderJobId = "job-2",
            Status = AutomationPostStatus.VideoReadyForReview,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(post, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();
        await svc.SetPostThumbnailAsync(userId, post.Id, TinyPngBase64, null, null, ct);

        var result = await svc.ApproveAndPublishAsync(userId, post.Id, publishNow: true, scheduledAtUtc: null, ct);
        Assert.False(string.IsNullOrWhiteSpace(result.QueueItemId));

        var queued = await queueRepo.GetAsync(result.QueueItemId!, ct);
        Assert.NotNull(queued);
        Assert.False(string.IsNullOrWhiteSpace(queued!.ThumbnailKey));
    }

    [Fact]
    public async Task AutoFillMissingDetailsAsync_fills_missing_description_tags_category_prompt_schedule_and_frame_thumbnail()
    {
        var ct = CancellationToken.None;
        const string userId = "user-fill-1";
        var repo = new FakeAutomationRepository();
        var connRepo = new FakeYouTubeConnectionRepository();
        var queueRepo = new FakePublishQueueRepository();
        var renderRepo = new FakeRenderJobRepository();
        var projectRepo = new FakeProjectRepository();
        var store = new InMemoryObjectStore();

        using var harness = BuildHarness(repo, connRepo, queueRepo, renderRepo, projectRepo, store);
        await SeedChannelAndRenderAsync(harness.Provider, userId, "UC3234567890123456789012", "proj-3", "job-3", store, renderRepo);

        await repo.UpsertRuleAsync(new AutomationRule
        {
            Id = "rule-comedy",
            UserId = userId,
            Name = "Comedy Shorts",
            SourceType = AutomationSourceType.FunnyComedy,
            TargetChannelId = "UC3234567890123456789012",
            PreferredPublishTime = "18:30",
            TimeZoneId = "Asia/Kolkata",
            CategoryId = "22"
        }, ct);

        var post = new AutomationPost
        {
            Id = "ap_autofill_1",
            UserId = userId,
            RuleId = "rule-comedy",
            RuleName = "Comedy Shorts",
            SourceType = AutomationSourceType.FunnyComedy,
            DateKey = "2026-11-18",
            Fingerprint = "2026-11-18:rule-comedy:c1",
            SourceItemKey = "c1",
            SourceTitle = "Chotu aur Chaiwala ki funny ladai",
            Title = "Chotu aur Chaiwala ki funny ladai",
            Script = "[Chotu]: Arre bhaiya adrak kam aur attitude zyada kyun dal rahe ho!\n[Chaiwala]: Chai pini hai toh line mein aa, varna kat le!",
            Description = "",
            AiThumbnailPrompt = "",
            Tags = [],
            CategoryId = "22",
            Privacy = "",
            Format = AutomationVideoFormat.Vertical,
            Language = "hi",
            PrimaryDestinationUrl = "https://panchang.example.com",
            AttachedRenderJobId = "job-3",
            Status = AutomationPostStatus.VideoReadyForReview,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(post, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();
        var filled = await svc.AutoFillMissingDetailsAsync(userId, post.Id, ct);

        Assert.Equal("23", filled.CategoryId);
        Assert.Equal("public", filled.Privacy);
        Assert.True(filled.Description.Length >= 40);
        Assert.True(filled.Tags.Count >= 3);
        Assert.True(YouTubePublishValidator.TagsLength(filled.Tags) <= YouTubePublishValidator.MaxTagsLength);
        Assert.False(string.IsNullOrWhiteSpace(filled.AiThumbnailPrompt));
        Assert.False(string.IsNullOrWhiteSpace(filled.PinnedComment));
        Assert.NotNull(filled.ScheduledAtUtc);
        Assert.NotNull(filled.ThumbnailFrameAtSeconds);
        Assert.False(string.IsNullOrWhiteSpace(filled.ThumbnailSource));
    }

    [Fact]
    public async Task EcosystemSignalsClient_rejects_wrong_date_upstream_history_and_returns_verified_Nov18_facts()
    {
        var ct = CancellationToken.None;
        var requestedUrls = new List<string>();
        HttpResponseMessage Responder(HttpRequestMessage req)
        {
            var url = req.RequestUri?.ToString() ?? string.Empty;
            requestedUrls.Add(url);
            if (url.Contains("/api/panchang/daily", StringComparison.OrdinalIgnoreCase))
            {
                return JsonOk(new
                {
                    date = "2026-11-18T00:00:00",
                    location = "New Delhi, India",
                    tithi = "Shukla Navami",
                    nakshatra = "Shatabhisha",
                    yoga = "Vriddhi",
                    karana = "Balava",
                    vaara = "Budhawar",
                    sunrise = "06:46 AM",
                    sunset = "05:27 PM",
                    rahuKaal = "12:07 PM - 01:27 PM",
                    abhijitMuhurat = "11:46 AM - 12:27 PM",
                    brahmaMuhurat = "05:10 AM - 05:58 AM",
                    hinduMonthAmanta = "Kartika",
                    vikramSamvat = "2083 Raudra"
                });
            }
            if (url.Contains("/api/festivals/upcoming", StringComparison.OrdinalIgnoreCase))
            {
                return JsonOk(new[]
                {
                    new
                    {
                        id = "dev-deepawali",
                        nameEnglish = "Dev Deepawali",
                        nameHindi = "देव दीपावली",
                        date = "2026-11-24T00:00:00",
                        description = "Kartik Purnima festival",
                        daysUntil = 6,
                        category = "Major",
                        importance = "Kartik Purnima festival",
                        deity = "Lord Shiva"
                    }
                });
            }
            if (url.Contains("/api/culturalhistory/aaj-ka-itihaas", StringComparison.OrdinalIgnoreCase))
            {
                // Reproduce exact bug: old Render endpoint ignoring requested Nov 18 and falling back to Nov 19 Rani Lakshmibai
                return JsonOk(new[]
                {
                    new
                    {
                        id = "lakshmi-11-19",
                        dateKey = "11-19",
                        year = 1828,
                        title = "Birth Celebration of Rani Lakshmibai",
                        category = "Indian History",
                        description = "Rani Lakshmibai was born on 19 November 1828.",
                        culturalSignificance = "Symbol of courage",
                        isExactDateMatch = false
                    }
                });
            }
            if (url.Contains("api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/11/18", StringComparison.OrdinalIgnoreCase))
            {
                return JsonOk(new
                {
                    events = new[]
                    {
                        new
                        {
                            year = 1910,
                            text = "Indian revolutionary freedom fighter Batukeshwar Dutt was born.",
                            pages = new[]
                            {
                                new
                                {
                                    normalizedtitle = "Batukeshwar Dutt",
                                    extract = "Batukeshwar Dutt was an Indian socialist revolutionary.",
                                    content_urls = new { desktop = new { page = "https://en.wikipedia.org/wiki/Batukeshwar_Dutt" } }
                                }
                            }
                        }
                    }
                });
            }
            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }

        using var harness = BuildHarness(
            new FakeAutomationRepository(),
            new FakeYouTubeConnectionRepository(),
            new FakePublishQueueRepository(),
            new FakeRenderJobRepository(),
            new FakeProjectRepository(),
            new InMemoryObjectStore(),
            httpResponder: Responder,
            useRealSignalsClient: true);

        var client = harness.Provider.GetRequiredService<IEcosystemSignalsClient>();
        var snapshot = await client.FetchAsync("2026-11-18", "New Delhi, India", ct: ct);

        Assert.Contains(requestedUrls, u => u.Contains("/api/festivals/upcoming?date=2026-11-18"));
        Assert.NotNull(snapshot.Panchang);
        Assert.Equal("2026-11-18", snapshot.Panchang!.DateKey);
        Assert.Equal("Shukla Navami", snapshot.Panchang.Tithi);
        Assert.Single(snapshot.UpcomingFestivals);
        Assert.Equal("2026-11-24", snapshot.UpcomingFestivals[0].DateKey);

        Assert.DoesNotContain(snapshot.HistoricalIncidents, h => h.Title.Contains("Lakshmibai", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(snapshot.HistoricalIncidents, h => h.DateKey == "11-18" && h.IsVerified);
        Assert.Contains(snapshot.Warnings, w => w.Contains("Lakshmibai", StringComparison.OrdinalIgnoreCase) || w.Contains("11-19", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(snapshot.Verification);
        Assert.Equal(AutomationFactVerifier.StatusVerified, snapshot.Verification!.OverallStatus);
    }

    [Fact]
    public async Task Overview_flags_wrong_date_card_as_Mismatch_Publish_blocks_and_ReverifyAndFix_repairs()
    {
        var ct = CancellationToken.None;
        const string userId = "user-verify-1";
        var repo = new FakeAutomationRepository();
        var connRepo = new FakeYouTubeConnectionRepository();
        var queueRepo = new FakePublishQueueRepository();
        var renderRepo = new FakeRenderJobRepository();
        var projectRepo = new FakeProjectRepository();
        var store = new InMemoryObjectStore();

        var verifiedNov18Snapshot = new EcosystemSignalsSnapshot(
            DateKey: "2026-11-18",
            Location: "New Delhi, India",
            Panchang: new EcosystemPanchangSignal(
                DateKey: "2026-11-18",
                Location: "New Delhi, India",
                Tithi: "Shukla Navami",
                TithiEndTime: "07:12 PM",
                Nakshatra: "Shatabhisha",
                NakshatraEndTime: "09:15 PM",
                Yoga: "Vriddhi",
                Karana: "Balava",
                Vaara: "Budhawar",
                Paksha: "Shukla Paksha",
                MonthPurnimanta: "Kartika",
                VikramSamvat: "2083 Raudra",
                Sunrise: "06:46 AM",
                Sunset: "05:27 PM",
                AbhijitMuhurat: "11:46 AM - 12:27 PM",
                BrahmaMuhurat: "05:10 AM - 05:58 AM",
                AmritKaal: "02:15 PM - 03:50 PM",
                RahuKaal: "12:07 PM - 01:27 PM",
                DailySanskritSutra: "सत्यमेव जयते",
                DailySutraMeaning: "Truth alone triumphs"),
            UpcomingFestivals: [],
            DailyKatha: null,
            HistoricalIncidents:
            [
                new EcosystemHistoricalSignal(
                    "jaipur-1727", "11-18", 1727, "Foundation of Jaipur (Pink City) by Maharaja Sawai Jai Singh II",
                    "Indian Heritage", "Maharaja Sawai Jai Singh II founded the planned city of Jaipur on 18 November 1727.",
                    "Icon of classical Indian urban planning and Vastu architecture.",
                    IsExactDateMatch: true, IsVerified: true, SourceName: "Wikipedia", SourceUrl: "https://en.wikipedia.org/wiki/Jaipur"),
                new EcosystemHistoricalSignal(
                    "dutt-1910", "11-18", 1910, "Birth Anniversary of Revolutionary Batukeshwar Dutt",
                    "Freedom Struggle", "Revolutionary freedom fighter Batukeshwar Dutt was born on 18 November 1910.",
                    "Hero of India's independence struggle alongside Bhagat Singh.",
                    IsExactDateMatch: true, IsVerified: true, SourceName: "Wikipedia", SourceUrl: "https://en.wikipedia.org/wiki/Batukeshwar_Dutt")
            ],
            Competitions: [],
            FunnelCampaigns: [],
            Warnings: [],
            FetchedAtUtc: DateTimeOffset.UtcNow);

        verifiedNov18Snapshot = verifiedNov18Snapshot with
        {
            Verification = AutomationFactVerifier.VerifySignals("2026-11-18", verifiedNov18Snapshot)
        };

        using var harness = BuildHarness(
            repo, connRepo, queueRepo, renderRepo, projectRepo, store,
            signalsClient: new StaticSignalsClient(verifiedNov18Snapshot));
        await SeedChannelAndRenderAsync(harness.Provider, userId, "UC4234567890123456789012", "proj-4", "job-4", store, renderRepo);

        await repo.UpsertRuleAsync(new AutomationRule
        {
            Id = "rule-itihaas",
            UserId = userId,
            Name = "Aaj Ka Itihaas",
            SourceType = AutomationSourceType.AajKaItihaas,
            TargetChannelId = "UC4234567890123456789012",
            Language = "hi",
            PreferredPublishTime = "15:00",
            TimeZoneId = "Asia/Kolkata"
        }, ct);

        var staleWrongPost = new AutomationPost
        {
            Id = "ap_wrong_nov18",
            UserId = userId,
            RuleId = "rule-itihaas",
            RuleName = "Aaj Ka Itihaas",
            SourceType = AutomationSourceType.AajKaItihaas,
            DateKey = "2026-11-18",
            Fingerprint = "2026-11-18:rule-itihaas:stale",
            SourceItemKey = "stale",
            SourceTitle = "1828 — Birth Celebration of Rani Lakshmibai",
            Title = "आज का इतिहास (18 नवंबर): वीरांगना रानी लक्ष्मीबाई जयंती और ऐतिहासिक धरोहर",
            Script = "[सूत्रधार]: 18 नवंबर 1828 को रानी लक्ष्मीबाई का जन्म हुआ।",
            Description = "Rani Lakshmibai Nov 18",
            Tags = ["Itihaas"],
            CategoryId = "27",
            Privacy = "public",
            TargetChannelId = "UC4234567890123456789012",
            AttachedRenderJobId = "job-4",
            Status = AutomationPostStatus.Approved,
            ScheduledAtUtc = DateTime.UtcNow.AddHours(2),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(staleWrongPost, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();

        // 1. Overview immediately detects wrong Nov 19 Rani Lakshmibai claim under 2026-11-18
        var overview = await svc.GetOverviewAsync(userId, "2026-11-18", ct);
        var loaded = Assert.Single(overview.Posts);
        Assert.Equal(AutomationFactVerifier.StatusMismatch, loaded.VerificationStatus);
        Assert.Contains("19", loaded.VerificationSummary ?? string.Empty);

        // 2. Attempting to publish or approve-schedule a mismatched card is blocked cleanly
        var blockedEx = await Assert.ThrowsAsync<EditingException>(
            () => svc.ApproveAndPublishAsync(userId, staleWrongPost.Id, publishNow: true, scheduledAtUtc: null, ct));
        Assert.Equal("fact-verification-mismatch", blockedEx.Code);

        // 3. Re-Verify & Fix re-composes strictly from verified Nov 18 facts and preserves channel/video/schedule
        var fixedPost = await svc.ReverifyAndFixPostAsync(userId, staleWrongPost.Id, ct);
        Assert.Equal(AutomationFactVerifier.StatusVerified, fixedPost.VerificationStatus);
        Assert.DoesNotContain("लक्ष्मीबाई", fixedPost.Title);
        Assert.DoesNotContain("Lakshmibai", fixedPost.Title, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Jaipur", fixedPost.Script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("1727", fixedPost.Script);
        Assert.Equal("UC4234567890123456789012", fixedPost.TargetChannelId);
        Assert.Equal("job-4", fixedPost.AttachedRenderJobId);
        Assert.NotNull(fixedPost.ScheduledAtUtc);

        // 4. Now publishing succeeds cleanly
        var published = await svc.ApproveAndPublishAsync(userId, fixedPost.Id, publishNow: true, scheduledAtUtc: null, ct);
        Assert.False(string.IsNullOrWhiteSpace(published.QueueItemId));
    }

    [Fact]
    public async Task HinduFestival_detects_cross_day_date_mismatch_blocks_upload_and_fixes_to_canonical_date()
    {
        var ct = CancellationToken.None;
        const string userId = "u-fest-mismatch";
        var repo = new FakeAutomationRepository();
        var connRepo = new FakeYouTubeConnectionRepository();
        var queueRepo = new FakePublishQueueRepository();
        var renderRepo = new FakeRenderJobRepository();
        var projectRepo = new FakeProjectRepository();
        var store = new InMemoryObjectStore();

        EcosystemSignalsSnapshot SignalsFor(string dKey) => new(
            DateKey: dKey,
            Location: "New Delhi, India",
            Panchang: new EcosystemPanchangSignal(
                DateKey: dKey,
                Location: "New Delhi, India",
                Tithi: "Shukla Dashami",
                TithiEndTime: "Until 07:15 AM",
                Nakshatra: "Purva Bhadrapada",
                NakshatraEndTime: "Until 04:00 PM",
                Yoga: "Vajra",
                Karana: "Gara",
                Vaara: "Shukravara (Friday)",
                Paksha: "Shukla Paksha",
                MonthPurnimanta: "Kartika",
                VikramSamvat: "2083",
                Sunrise: "06:48 AM",
                Sunset: "05:25 PM",
                AbhijitMuhurat: "11:45 AM - 12:28 PM",
                BrahmaMuhurat: "05:05 AM - 05:53 AM",
                AmritKaal: "07:30 AM - 09:05 AM",
                RahuKaal: "10:45 AM - 12:06 PM",
                DailySanskritSutra: "सत्यमेव जयते",
                DailySutraMeaning: "Truth alone triumphs",
                NextTithi: "Shukla Ekadashi",
                NextNakshatra: "Uttara Bhadrapada"),
            UpcomingFestivals:
            [
                new EcosystemFestivalSignal(
                    "dyn-devutthana", "देवउठनी एकादशी", "Devutthana Ekadashi", "2026-11-20",
                    "Kartika Shukla Ekadashi", "Kartika", "Awakening of Lord Vishnu after Chaturmas.",
                    "Evening Tulsi puja and Vishnu Sahasranama.", "Ekadashi Vrat", true, "Major"),
                new EcosystemFestivalSignal(
                    "dyn-tulsi-vivah", "तुलसी विवाह", "Tulsi Vivah", "2026-11-21",
                    "Kartika Shukla Dwadashi", "Kartika", "Sacred ceremonial union of Tulsi and Shaligram.",
                    "Decorate Tulsi courtyard with sugarcane.", "Dwadashi Parana", true, "Major")
            ],
            DailyKatha: null,
            HistoricalIncidents: [],
            Competitions: [],
            FunnelCampaigns: [],
            Warnings: [],
            FetchedAtUtc: DateTimeOffset.UtcNow);

        using var harness = BuildHarness(
            repo, connRepo, queueRepo, renderRepo, projectRepo, store,
            signalsClient: new DateAwareSignalsClient(SignalsFor));
        await SeedChannelAndRenderAsync(harness.Provider, userId, "UC5234567890123456789012", "proj-5", "job-5", store, renderRepo);

        var festRule = new AutomationRule
        {
            Id = "rule-fest",
            UserId = userId,
            Name = "Festivals",
            SourceType = AutomationSourceType.HinduFestival,
            FestivalLeadDays = 1,
            TargetChannelId = "UC5234567890123456789012",
            Language = "hi",
            PreferredPublishTime = "08:00",
            TimeZoneId = "Asia/Kolkata"
        };
        await repo.UpsertRuleAsync(festRule, ct);

        // Stale Tulsi Vivah card stamped with 2026-11-20 (from pre-fix lead day handling)
        var brokenFestPost = new AutomationPost
        {
            Id = "ap_tulsi_wrong_date",
            UserId = userId,
            RuleId = "rule-fest",
            RuleName = "Festivals",
            SourceType = AutomationSourceType.HinduFestival,
            DateKey = "2026-11-20",
            Fingerprint = "2026-11-20:rule-fest:festival:2026-11-21:dyn-tulsi-vivah",
            SourceItemKey = "festival:2026-11-21:dyn-tulsi-vivah",
            SourceTitle = "तुलसी विवाह (Tulsi Vivah)",
            Title = "2026-11-21 तुलसी विवाह | व्रत विधि • Tulsi Vivah",
            HeaderBannerText = "FESTIVAL & VRAT SPECIAL • 2026-11-20",
            Script = "[सूत्रधार]: 2026-11-21 को कार्तिक शुक्ल द्वादशी पर तुलसी विवाह है।",
            Description = "दिनांक: 2026-11-21",
            Tags = ["Tulsi Vivah"],
            CategoryId = "22",
            Privacy = "public",
            TargetChannelId = "UC5234567890123456789012",
            AttachedRenderJobId = "job-5",
            Status = AutomationPostStatus.Approved,
            ScheduledAtUtc = DateTime.UtcNow.AddHours(2),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(brokenFestPost, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();

        // 1. Overview immediately detects 2026-11-20 vs 2026-11-21 festival mismatch
        var overview = await svc.GetOverviewAsync(userId, "2026-11-20", ct);
        var loaded = Assert.Single(overview.Posts);
        Assert.Equal(AutomationFactVerifier.StatusMismatch, loaded.VerificationStatus);
        Assert.Contains("2026-11-21", loaded.VerificationSummary ?? string.Empty);

        // 2. Attempting to publish the mismatched festival card is blocked cleanly
        var ex = await Assert.ThrowsAsync<EditingException>(
            () => svc.ApproveAndPublishAsync(userId, brokenFestPost.Id, publishNow: true, scheduledAtUtc: null, ct));
        Assert.Equal("fact-verification-mismatch", ex.Code);

        // 3. Re-Verify & Fix moves the Tulsi Vivah card to its canonical 2026-11-21 date & banner
        var fixedPost = await svc.ReverifyAndFixPostAsync(userId, brokenFestPost.Id, ct);
        Assert.Equal("2026-11-21", fixedPost.DateKey);
        Assert.Contains("2026-11-21", fixedPost.HeaderBannerText ?? string.Empty);
        Assert.Equal(AutomationFactVerifier.StatusVerified, fixedPost.VerificationStatus);

        // 4. Fresh Prepare with FestivalLeadDays=1 creates Devutthana on 2026-11-20 and Tulsi Vivah on 2026-11-21 separately
        var panchangRule = new AutomationRule
        {
            Id = "rule-panchang",
            UserId = userId,
            Name = "Daily Panchang",
            SourceType = AutomationSourceType.HinduPanchang,
            TargetChannelId = "UC5234567890123456789012",
            Language = "hi",
            PreferredPublishTime = "06:30",
            TimeZoneId = "Asia/Kolkata"
        };
        await repo.UpsertRuleAsync(panchangRule, ct);

        var prep = await svc.PrepareForDateAsync(userId, "2026-11-20", ruleId: null, forceRegenerate: true, ct);
        var devutthana = prep.Posts.FirstOrDefault(p => p.SourceTitle.Contains("Devutthana", StringComparison.OrdinalIgnoreCase));
        var tulsi = prep.Posts.FirstOrDefault(p => p.SourceTitle.Contains("Tulsi Vivah", StringComparison.OrdinalIgnoreCase));
        var panchang = prep.Posts.FirstOrDefault(p => p.SourceType == AutomationSourceType.HinduPanchang);

        Assert.NotNull(devutthana);
        Assert.Equal("2026-11-20", devutthana!.DateKey);
        Assert.Contains("2026-11-20", devutthana.HeaderBannerText ?? string.Empty);
        Assert.Equal(AutomationFactVerifier.StatusVerified, devutthana.VerificationStatus);

        Assert.NotNull(tulsi);
        Assert.Equal("2026-11-21", tulsi!.DateKey);
        Assert.Contains("2026-11-21", tulsi.HeaderBannerText ?? string.Empty);
        Assert.Equal(AutomationFactVerifier.StatusVerified, tulsi.VerificationStatus);

        Assert.NotNull(panchang);
        Assert.Contains("Shukla Dashami", panchang!.Script);
        Assert.Contains("Shukla Ekadashi", panchang.Script);
        Assert.Contains("Until 07:15 AM", panchang.Script);
    }

    private sealed class DateAwareSignalsClient(Func<string, EcosystemSignalsSnapshot> factory) : IEcosystemSignalsClient
    {
        public Task<EcosystemSignalsSnapshot> FetchAsync(string dateKey, string? location = null, string? panchangOverrideUrl = null, string? socialOverrideUrl = null, string? pratiyogitaOverrideUrl = null, CancellationToken ct = default) =>
            Task.FromResult(factory(dateKey));
    }

    private static HttpResponseMessage JsonOk(object payload) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json")
        };

    private sealed class StaticSignalsClient(EcosystemSignalsSnapshot snapshot) : IEcosystemSignalsClient
    {
        public Task<EcosystemSignalsSnapshot> FetchAsync(string dateKey, string? location = null, string? panchangOverrideUrl = null, string? socialOverrideUrl = null, string? pratiyogitaOverrideUrl = null, CancellationToken ct = default) =>
            Task.FromResult(snapshot);
    }

    private static async Task SeedChannelAndRenderAsync(
        IServiceProvider provider,
        string userId,
        string channelId,
        string projectId,
        string jobId,
        InMemoryObjectStore store,
        FakeRenderJobRepository renderRepo)
    {
        var connRepo = provider.GetRequiredService<IYouTubeConnectionRepository>();
        await connRepo.UpsertAsync(new YouTubeChannelConnection
        {
            Id = YouTubeChannelConnection.IdFor(userId, channelId),
            UserId = userId,
            ChannelId = channelId,
            ChannelTitle = "Test Creator Channel",
            ChannelHandle = "@testcreator",
            RefreshTokenCipher = "dummy-cipher",
            Scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl",
            ConnectedAt = DateTime.UtcNow
        }, CancellationToken.None);

        var projRepo = (FakeProjectRepository)provider.GetRequiredService<IProjectRepository>();
        await projRepo.InsertAsync(new Project { Id = projectId, UserId = userId, Name = "Test Project" }, CancellationToken.None);

        var mp4Key = $"renders/{jobId}.mp4";
        await using (var ms = new MemoryStream([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]))
            await store.SaveAsync(mp4Key, ms, "video/mp4", CancellationToken.None);

        await renderRepo.InsertAsync(new RenderJob
        {
            Id = jobId,
            UserId = userId,
            ProjectId = projectId,
            Status = RenderJobStatus.Completed,
            OutputStorageKey = mp4Key,
            OutputSizeBytes = 1024 * 64,
            Width = 720,
            Height = 1280,
            Diagnostics = new RenderDiagnostics { OutputDurationSeconds = 24.0 }
        }, CancellationToken.None);
    }

    private static TestHarness BuildHarness(
        IAutomationRepository repo,
        IYouTubeConnectionRepository connRepo,
        IPublishQueueRepository queueRepo,
        IRenderJobRepository renderRepo,
        IProjectRepository projectRepo,
        IObjectStore store,
        Func<HttpRequestMessage, HttpResponseMessage>? httpResponder = null,
        bool useRealSignalsClient = false,
        IEcosystemSignalsClient? signalsClient = null)
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "animstudio-sched-tests-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempRoot);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mongo:ConnectionString"] = "mongodb://localhost:27017",
                ["Mongo:Database"] = "AnimStudioTestDb",
                ["Storage:DataRoot"] = tempRoot,
                ["Ecosystem:PanchangApiBaseUrl"] = "https://panchang.example.com"
            })
            .Build();

        var services = new ServiceCollection();
        var dataPaths = AppDataPaths.Resolve(config, tempRoot);
        dataPaths.EnsureCreated();
        services.AddSingleton<IConfiguration>(config);
        services.AddSingleton(dataPaths);
        services.AddSingleton<IHostEnvironment>(new FakeHostEnvironment(tempRoot));
        services.AddLogging();
        services.AddDataProtection();
        services.AddMemoryCache();
        services.AddHttpClient();
        services.AddAnimStudioInfrastructure(config, isDevelopment: false);

        services.AddSingleton(repo);
        services.AddSingleton(connRepo);
        services.AddSingleton(queueRepo);
        services.AddSingleton(renderRepo);
        services.AddSingleton(projectRepo);
        services.AddSingleton<IObjectStore>(store);
        services.AddSingleton<IWebSettingRepository, FakeWebSettingRepository>();
        services.AddSingleton<IYouTubePublicationRepository, FakePublicationRepository>();
        services.AddSingleton<IPhoneHandoffRepository, FakePhoneHandoffRepository>();
        services.AddSingleton<IContentTopicRepository, FakeContentTopicRepository>();
        if (signalsClient is not null)
            services.AddSingleton(signalsClient);
        else if (!useRealSignalsClient)
            services.AddSingleton<IEcosystemSignalsClient, EmptySignalsClient>();
        services.AddSingleton<IEcosystemConfigProvider, FakeEcosystemConfigProvider>();
        services.AddSingleton<IAiExecutor, DisabledAiExecutor>();
        services.AddSingleton<IProceduralVideoGenerator, FakeProceduralVideoGenerator>();
        services.AddSingleton<IFfmpegRunner, FakeFfmpegRunner>();
        services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(httpResponder ?? (_ => new HttpResponseMessage(HttpStatusCode.OK))));

        return new TestHarness(services.BuildServiceProvider(), tempRoot);
    }

    private sealed class TestHarness(ServiceProvider provider, string tempRoot) : IDisposable
    {
        public ServiceProvider Provider { get; } = provider;

        public void Dispose()
        {
            Provider.Dispose();
            try
            {
                if (Directory.Exists(tempRoot))
                    Directory.Delete(tempRoot, recursive: true);
            }
            catch
            {
                // Ignore temp cleanup contention.
            }
        }
    }

    private sealed class FakeFfmpegRunner : IFfmpegRunner
    {
        private static readonly byte[] MinimalJpeg =
        [
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
            0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
        ];

        public async Task<FfmpegResult> RunAsync(
            FfmpegInvocation invocation,
            IProgress<FfmpegProgress>? progress,
            CancellationToken ct)
        {
            if (!string.IsNullOrWhiteSpace(invocation.WorkingDirectory))
            {
                Directory.CreateDirectory(invocation.WorkingDirectory);
                var outPath = Path.Combine(invocation.WorkingDirectory, "out.jpg");
                await File.WriteAllBytesAsync(outPath, MinimalJpeg, ct);
            }
            return new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero);
        }
    }

    private sealed class FakeAutomationRepository : IAutomationRepository
    {
        private readonly List<AutomationRule> _rules = [];
        private readonly List<AutomationPost> _posts = [];
        private readonly Dictionary<string, AutomationPostStatus> _savedStatus = new(StringComparer.Ordinal);

        public Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.UserId == userId)]);

        public Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.Enabled).Take(limit)]);

        public Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct) =>
            Task.FromResult(_rules.FirstOrDefault(r => r.Id == id));

        public Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct)
        {
            _rules.RemoveAll(r => r.Id == rule.Id);
            _rules.Add(rule);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteRuleAsync(string id, CancellationToken ct) =>
            Task.FromResult(_rules.RemoveAll(r => r.Id == id) > 0);

        public Task<IReadOnlyList<AutomationPost>> ListPostsAsync(string userId, string? dateFromKey, string? dateToKey, AutomationPostStatus? status, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AutomationPost>>([.. _posts.Where(p => p.UserId == userId).Take(limit)]);

        public Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(IReadOnlyList<AutomationPostStatus> statuses, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AutomationPost>>([.. _posts.Where(p => statuses.Contains(p.Status)).Take(limit)]);

        public Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct) =>
            Task.FromResult(Clone(_posts.FirstOrDefault(p => p.Id == id)));

        public Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct) =>
            Task.FromResult(AutomationPost.SelectPreferred(_posts.Where(p => p.UserId == userId && p.Fingerprint == fingerprint)));

        public Task UpsertPostAsync(AutomationPost post, CancellationToken ct)
        {
            _posts.RemoveAll(p => p.Id == post.Id);
            _posts.Add(Clone(post)!);
            _savedStatus[post.Id] = post.Status;
            return Task.CompletedTask;
        }

        public Task<bool> TryReplacePostIfStatusAsync(AutomationPost post, AutomationPostStatus expectedStatus, CancellationToken ct)
        {
            if (!_savedStatus.TryGetValue(post.Id, out var saved) || saved != expectedStatus)
                return Task.FromResult(false);
            _posts.RemoveAll(p => p.Id == post.Id);
            _posts.Add(Clone(post)!);
            _savedStatus[post.Id] = post.Status;
            return Task.FromResult(true);
        }

        public Task<bool> DeletePostAsync(string id, CancellationToken ct)
        {
            _savedStatus.Remove(id);
            return Task.FromResult(_posts.RemoveAll(p => p.Id == id) > 0);
        }

        private static AutomationPost? Clone(AutomationPost? src) =>
            src is null ? null : JsonSerializer.Deserialize<AutomationPost>(JsonSerializer.Serialize(src));
    }

    private sealed class FakeYouTubeConnectionRepository : IYouTubeConnectionRepository
    {
        private readonly List<YouTubeChannelConnection> _items = [];

        public Task<YouTubeChannelConnection?> GetAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.FirstOrDefault(c => c.Id == id));

        public Task<IReadOnlyList<YouTubeChannelConnection>> ListByUserAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<YouTubeChannelConnection>>([.. _items.Where(c => c.UserId == userId)]);

        public Task<IReadOnlyList<YouTubeChannelConnection>> ListAllAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<YouTubeChannelConnection>>([.. _items]);

        public Task UpsertAsync(YouTubeChannelConnection connection, CancellationToken ct)
        {
            _items.RemoveAll(c => c.Id == connection.Id);
            _items.Add(connection);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.RemoveAll(c => c.Id == id) > 0);
    }

    private sealed class FakePublishQueueRepository : IPublishQueueRepository
    {
        private readonly List<PublishQueueItem> _items = [];

        public Task<PublishQueueItem?> GetAsync(string id, CancellationToken ct) =>
            Task.FromResult(Clone(_items.FirstOrDefault(i => i.Id == id)));

        public Task<IReadOnlyList<PublishQueueItem>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<PublishQueueItem>>([.. _items.Where(i => i.UserId == userId).Take(limit).Select(Clone)!]);

        public Task<IReadOnlyList<PublishQueueItem>> ListDueAsync(DateTime dueBefore, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<PublishQueueItem>>([]);

        public Task<IReadOnlyList<PublishQueueItem>> ListByStateAsync(PublishQueueState state, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<PublishQueueItem>>([.. _items.Where(i => i.State == state).Take(limit).Select(Clone)!]);

        public Task InsertAsync(PublishQueueItem item, CancellationToken ct)
        {
            _items.Add(Clone(item)!);
            return Task.CompletedTask;
        }

        public Task<bool> ReplaceAsync(PublishQueueItem item, CancellationToken ct)
        {
            var idx = _items.FindIndex(i => i.Id == item.Id && i.Version == item.Version);
            if (idx < 0) return Task.FromResult(false);
            item.Version++;
            _items[idx] = Clone(item)!;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.RemoveAll(i => i.Id == id) > 0);

        private static PublishQueueItem? Clone(PublishQueueItem? src) =>
            src is null ? null : JsonSerializer.Deserialize<PublishQueueItem>(JsonSerializer.Serialize(src));
    }

    private sealed class FakeRenderJobRepository : IRenderJobRepository
    {
        private readonly List<RenderJob> _jobs = [];
        public Task<RenderJob?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_jobs.FirstOrDefault(j => j.Id == id));
        public Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct) => Task.FromResult<IReadOnlyList<RenderJob>>([.. _jobs.Where(j => j.ProjectId == projectId)]);
        public Task InsertAsync(RenderJob job, CancellationToken ct) { _jobs.Add(job); return Task.CompletedTask; }
        public Task<RenderJob?> ClaimNextAsync(string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct) => Task.FromResult<RenderJob?>(null);
        public Task<JobHeartbeatResult> ReportProgressAsync(string jobId, string leaseOwner, int progress, string? message, RenderStage stage, int scenesDone, TimeSpan leaseDuration, CancellationToken ct) => Task.FromResult(new JobHeartbeatResult(false, false));
        public Task CompleteAsync(RenderJob job, CancellationToken ct) => Task.CompletedTask;
        public Task RequestCancelAsync(string jobId, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(string jobId, CancellationToken ct) => Task.CompletedTask;
        public Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<string>>([]);
        public Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<RenderJob>>([.. _jobs.Take(limit)]);
        public Task<bool> RequeueAsync(string jobId, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> RenameAsync(string jobId, string name, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class FakeWebSettingRepository : IWebSettingRepository
    {
        private readonly List<WebSetting> _items = [];
        public Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<WebSetting>>([.. _items]);
        public Task UpsertAsync(WebSetting setting, CancellationToken ct) { _items.RemoveAll(s => s.Id == setting.Id); _items.Add(setting); return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_items.RemoveAll(s => s.Id == id) > 0);
    }

    private sealed class FakePublicationRepository : IYouTubePublicationRepository
    {
        public Task<YouTubePublication?> GetAsync(string id, CancellationToken ct) => Task.FromResult<YouTubePublication?>(null);
        public Task<IReadOnlyList<YouTubePublication>> ListByUserAsync(string userId, string? projectId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task<IReadOnlyList<YouTubePublication>> ListByVideoIdsAsync(string userId, IReadOnlyCollection<string> videoIds, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task<IReadOnlyList<YouTubePublication>> ListDueForCheckAsync(DateTime publishedAfter, DateTime checkedBefore, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task UpsertAsync(YouTubePublication publication, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class FakePhoneHandoffRepository : IPhoneHandoffRepository
    {
        public Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct) => Task.FromResult<PhoneHandoff?>(null);
        public Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([]);
        public Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([]);
        public Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeContentTopicRepository : IContentTopicRepository
    {
        public Task<ContentTopic?> GetAsync(string id, CancellationToken ct) => Task.FromResult<ContentTopic?>(null);
        public Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([]);
        public Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([]);
        public Task UpsertAsync(ContentTopic topic, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class EmptySignalsClient : IEcosystemSignalsClient
    {
        public Task<EcosystemSignalsSnapshot> FetchAsync(string dateKey, string? location = null, string? panchangOverrideUrl = null, string? socialOverrideUrl = null, string? pratiyogitaOverrideUrl = null, CancellationToken ct = default) =>
            Task.FromResult(new EcosystemSignalsSnapshot(dateKey, location ?? "New Delhi, India", null, [], null, [], [], [], [], DateTimeOffset.UtcNow));
    }

    private sealed class FakeEcosystemConfigProvider : IEcosystemConfigProvider
    {
        public StudioEcosystemConfig Current { get; } = new(
            "AnimStudio AI", "Stories", "Creator", "https://example.com", "2026-11-15", "Copyright",
            "https://admin.example.com", "https://id.example.com", "https://studio.example.com",
            "ch-1", "AnimStudio", null, new ChannelBranding(),
            [new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Panchang", "https://panchang.example.com", null, null, null, null, true, 1)],
            [], [], [], [], true, DateTimeOffset.UtcNow);

        public Task<StudioEcosystemConfig> GetAsync(bool forceRefresh = false, CancellationToken ct = default) => Task.FromResult(Current);
        public void ApplyBrandKit(AiSettings? aiSettings, StudioEcosystemConfig? config = null) { }
        public Task<CentralChannelSyncSummary> SyncToAiSettingsAsync(string? actorUserId, CancellationToken ct = default) =>
            Task.FromResult(new CentralChannelSyncSummary(0, 0, 0, false, [], []));
    }

    private sealed class FakeProceduralVideoGenerator : IProceduralVideoGenerator
    {
        public Task<ProceduralVideoResult> GenerateAsync(string userId, ProceduralVideoRequest request, CancellationToken ct) =>
            Task.FromResult(new ProceduralVideoResult("rj_1", "proj_1", ProceduralSceneTheme.VedicTempleSunrise3D, "Vedic", 720, 1280, 10, 1024, "key", null, "ok"));
    }

    private sealed class DisabledAiExecutor : IAiExecutor
    {
        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTextResult>.Failed("disabled", "disabled"));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiImageResult>.Failed("disabled", "disabled"));
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiSpeechResult>.Failed("disabled", "disabled"));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
            Task.FromResult(AiOutcome<AiTranscriptionResult>.Failed("disabled", "disabled"));
    }

    private sealed class FakeHostEnvironment(string contentRootPath) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "AnimStudio.Tests";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class StubHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> responder) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(new StubHandler(responder), disposeHandler: true);

        private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
                Task.FromResult(responder(request));
        }
    }
}
