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
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Ecosystem;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace AnimStudio.Application.Tests.Automation;

public sealed class RebalanceAndPeakScheduleTests
{
    private const string BhaktiChannelId = "UChEkPFnexqQTL0aPqcmwlMw";
    private const string WorldChannelId = "UCVP_DbP7xIOc_LFQTqaLbyg";
    private const string ComedyChannelId = "UCMoZComedyAnimFF00000001";
    private const string DisconnectedBriefId = "UCs3o9wFfBR4Bo1-bfd0mnxg";

    private static readonly byte[] MinimalJpeg =
    [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ];

    [Fact]
    public async Task RebalanceStarterChannelsAsync_splits_devotional_to_bhakti_and_history_to_keshav_world()
    {
        const string userId = "user-rebalance-1";
        var ct = CancellationToken.None;
        using var harness = BuildHarness();

        var connRepo = harness.Provider.GetRequiredService<IYouTubeConnectionRepository>();
        await SeedChannelsAsync(connRepo, userId, ct);

        // Seed existing misrouted rules all pointing at Bhakti (reproducing live workspace bug)
        var autoRepo = harness.Provider.GetRequiredService<IAutomationRepository>();
        var topicRepo = harness.Provider.GetRequiredService<IContentTopicRepository>();
        var histTopic = new ContentTopic
        {
            Id = "topic-hist",
            UserId = userId,
            Name = "Aaj Ka Itihaas",
            ChannelId = BhaktiChannelId,
            ChannelTitle = "OMKAR SHIV Bhakti",
            PublishTime = "18:00",
            TimeZone = "Asia/Kolkata"
        };
        await topicRepo.UpsertAsync(histTopic, ct);

        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-panchang", UserId = userId, Name = "Daily Hindu Panchang",
            SourceType = AutomationSourceType.HinduPanchang,
            TargetChannelId = BhaktiChannelId, TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);
        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-history", UserId = userId, Name = "Aaj Ka Itihaas (On This Day History)",
            SourceType = AutomationSourceType.AajKaItihaas,
            TopicId = histTopic.Id, TopicName = histTopic.Name,
            TargetChannelId = BhaktiChannelId, TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);
        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-spotlight", UserId = userId, Name = "Pratiyogita & Ecosystem Growth Spotlight",
            SourceType = AutomationSourceType.EcosystemSpotlight,
            TargetChannelId = BhaktiChannelId, TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();
        var res = await svc.RebalanceStarterChannelsAsync(userId, ct);

        Assert.Equal(2, res.RulesUpdated);
        Assert.Equal(1, res.TopicsUpdated);

        var panchang = await autoRepo.GetRuleAsync("ar-panchang", ct);
        var history = await autoRepo.GetRuleAsync("ar-history", ct);
        var spotlight = await autoRepo.GetRuleAsync("ar-spotlight", ct);
        var updatedTopic = await topicRepo.GetAsync("topic-hist", ct);

        Assert.Equal(BhaktiChannelId, panchang!.TargetChannelId);
        Assert.Equal(WorldChannelId, history!.TargetChannelId);
        Assert.Equal("@keshavsinghworld", history.TargetChannelHandle);
        Assert.Equal(WorldChannelId, spotlight!.TargetChannelId);
        Assert.Equal(WorldChannelId, updatedTopic!.ChannelId);
    }

    [Fact]
    public async Task PreparePublishPackAsync_renders_thumbnails_syncs_calendar_and_queues_private_scheduled_uploads()
    {
        const string userId = "user-pack-1";
        var ct = CancellationToken.None;
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)).ToString("yyyy-MM-dd");

        using var harness = BuildHarness(signalsDateKey: futureDate);
        await SeedChannelsAsync(harness.Provider.GetRequiredService<IYouTubeConnectionRepository>(), userId, ct);

        var analysisRepo = harness.Provider.GetRequiredService<IYouTubeChannelAnalysisRepository>();
        await analysisRepo.UpsertAsync(new YouTubeChannelAnalysis
        {
            Id = "yca_bhakti",
            UserId = userId,
            ChannelId = BhaktiChannelId,
            ChannelTitle = "OMKAR SHIV Bhakti",
            FetchedAtUtc = DateTime.UtcNow,
            Videos =
            [
                AnalyzedVideo("b1", 6, 400),
                AnalyzedVideo("b2", 6, 420),
                AnalyzedVideo("b3", 19, 380),
                AnalyzedVideo("b4", 19, 360),
            ]
        }, ct);
        await analysisRepo.UpsertAsync(new YouTubeChannelAnalysis
        {
            Id = "yca_world",
            UserId = userId,
            ChannelId = WorldChannelId,
            ChannelTitle = "KeshavSinghWorld",
            FetchedAtUtc = DateTime.UtcNow,
            Videos =
            [
                AnalyzedVideo("w1", 20, 520),
                AnalyzedVideo("w2", 20, 480),
                AnalyzedVideo("w3", 14, 110),
                AnalyzedVideo("w4", 14, 100),
            ]
        }, ct);

        var autoRepo = harness.Provider.GetRequiredService<IAutomationRepository>();
        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-p", UserId = userId, Name = "Panchang", Enabled = true,
            SourceType = AutomationSourceType.HinduPanchang,
            TargetChannelId = BhaktiChannelId, TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);
        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-k", UserId = userId, Name = "Katha", Enabled = true,
            SourceType = AutomationSourceType.DailyKatha,
            TargetChannelId = BhaktiChannelId, TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);
        await autoRepo.UpsertRuleAsync(new AutomationRule
        {
            Id = "ar-h", UserId = userId, Name = "History", Enabled = true,
            SourceType = AutomationSourceType.AajKaItihaas,
            TargetChannelId = BhaktiChannelId, // intentionally misrouted first!
            TargetChannelTitle = "OMKAR SHIV Bhakti", TargetChannelHandle = "@omkarshivbhakti"
        }, ct);

        var svc = harness.Provider.GetRequiredService<EcosystemAutomationService>();
        var pack = await svc.PreparePublishPackAsync(userId, new PreparePublishPackRequest(
            DateKey: futureDate,
            ForceRegenerate: true,
            RebalanceChannels: true,
            GenerateVideos: true,
            SyncToCalendar: true,
            ScheduleOnYouTubePrivate: true,
            IncludeSpotlight: false), ct);

        Assert.Equal(futureDate, pack.DateKey);
        Assert.Equal(2, pack.RulesRebalanced);
        Assert.Equal(3, pack.PreparedCount);
        Assert.Equal(3, pack.VideosReadyCount);
        Assert.Equal(3, pack.ThumbnailsReadyCount);
        Assert.Equal(3, pack.CalendarSyncedCount);
        Assert.Equal(3, pack.ScheduledPrivateOnYouTubeCount);

        var updatedKathaRule = await autoRepo.GetRuleAsync("ar-k", ct);
        Assert.Equal(AutomationVideoFormat.Wide, updatedKathaRule!.VideoFormat);
        Assert.Equal(AutomationNarrativeMode.FullStory, updatedKathaRule.NarrativeMode);
        Assert.True(updatedKathaRule.TargetSeconds >= 220);

        var historyItem = Assert.Single(pack.Items, i => i.SourceType == AutomationSourceType.AajKaItihaas);
        Assert.Equal(WorldChannelId, historyItem.TargetChannelId);

        var panchangItem = Assert.Single(pack.Items, i => i.SourceType == AutomationSourceType.HinduPanchang);
        var kathaItem = Assert.Single(pack.Items, i => i.SourceType == AutomationSourceType.DailyKatha);
        Assert.Equal(BhaktiChannelId, panchangItem.TargetChannelId);
        Assert.Equal(BhaktiChannelId, kathaItem.TargetChannelId);

        // Verify ThumbnailPosterCopy produces crisp, purpose-clear poster labels without truncating mid-word or duplicating dates
        var panchangPoster = ThumbnailPosterCopy.Build(
            "HinduPanchang",
            "आज का पंचांग 22 नवंबर 2026 | शुक्ल त्रयोदशी, अश्विनी नक्षत्र, शुभ मुहूर्त व राहुकाल",
            null,
            "TODAY'S HINDU PANCHANG · 2026-11-22",
            isPortrait: true);
        Assert.Equal("आज का पंचांग", panchangPoster.HeroTitle);
        Assert.DoesNotContain("TODAY'S HINDU PANCHANG", panchangPoster.CategoryPill, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("22 नवंबर 2026", panchangPoster.CategoryPill, StringComparison.Ordinal);
        Assert.DoesNotContain("मुहू", panchangPoster.PurposeSubline, StringComparison.Ordinal);
        Assert.False(string.IsNullOrWhiteSpace(panchangPoster.PurposeSubline));

        var festPoster = ThumbnailPosterCopy.Build("HinduFestival", "आज कार्तिक शुक्ल प्रदोष व्रत | व्रत विधि", null, futureDate, isPortrait: true);
        Assert.Equal("प्रदोष व्रत", festPoster.HeroTitle);
        Assert.Contains("पूजा विधि", festPoster.PurposeSubline, StringComparison.Ordinal);

        var kathaPoster = ThumbnailPosterCopy.Build(
            "DailyKatha",
            "मार्कण्डेय ऋषि और भगवान शिव की अमर कथा | प्रदोष व्रत एवं महामृत्युंजय महिमा",
            null,
            futureDate,
            isPortrait: false);
        Assert.Equal("संपूर्ण पौराणिक कथा", kathaPoster.CategoryPill);
        Assert.False(kathaPoster.HeroTitle.EndsWith(" की", StringComparison.Ordinal));
        Assert.Contains("अमर कथा", kathaPoster.HeroTitle, StringComparison.Ordinal);

        var histPoster = ThumbnailPosterCopy.Build(
            "AajKaItihaas",
            "आज का इतिहास (22 नवंबर): संगीत सम्राट बालमुरलीकृष्ण और चेस चैंपियन मैग्नस कार्लसन",
            null,
            futureDate,
            isPortrait: true);
        Assert.NotEqual(histPoster.CategoryPill, histPoster.HeroTitle);
        Assert.Contains("बालमुरलीकृष्ण", histPoster.HeroTitle, StringComparison.Ordinal);
        Assert.DoesNotContain("आज का इतिहास (22 नवंबर)", histPoster.PurposeSubline, StringComparison.Ordinal);

        // Verify ChannelContentDeduplicator avoids stories already published on the channel
        var pickedKatha = ChannelContentDeduplicator.SelectFreshDailyKatha(
            new EcosystemDailyKathaSignal("k-dup", "सत्य की विजय: राजा हरिश्चंद्र की कथा", "राजा हरिश्चंद्र", "Summary", "Moral", "Om"),
            [],
            futureDate,
            ["सत्य की विजय: राजा हरिश्चंद्र और महर्षि विश्वामित्र (3:54)"]);
        Assert.DoesNotContain("हरिश्चंद्र", pickedKatha.Title, StringComparison.OrdinalIgnoreCase);

        // Two posts on the same Bhakti channel must not collide within 90 minutes!
        Assert.True(panchangItem.ScheduledAtUtc.HasValue && kathaItem.ScheduledAtUtc.HasValue);
        Assert.True((kathaItem.ScheduledAtUtc!.Value - panchangItem.ScheduledAtUtc!.Value).Duration() >= TimeSpan.FromMinutes(90));

        // Verify Calendar synced all 3 items cleanly with correct channels
        var calendarRepo = harness.Provider.GetRequiredService<IContentPlanItemRepository>();
        var calItems = await calendarRepo.ListByUserAsync(
            userId, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5), null, 50, ct);
        Assert.Equal(3, calItems.Count);
        Assert.Contains(calItems, c => c.ChannelId == WorldChannelId);
        Assert.Equal(2, calItems.Count(c => c.ChannelId == BhaktiChannelId));

        // Verify PublishQueue holds Private scheduled release mode (`ReleaseOnYouTube` + `ScheduledAt > Now` -> YouTube uploads `private` + `publishAt`)
        var queueRepo = harness.Provider.GetRequiredService<IPublishQueueRepository>();
        var queued = await queueRepo.ListByUserAsync(userId, 50, ct);
        Assert.Equal(3, queued.Count);
        Assert.All(queued, q =>
        {
            Assert.Equal(PublishQueueMode.ReleaseOnYouTube, q.Mode);
            Assert.NotNull(q.PlanItemId);
            Assert.NotNull(q.ThumbnailKey);
            var ytRelease = PublishQueueRules.YouTubeReleaseAt(q.Mode, q.Privacy, q.ScheduledAt, DateTime.UtcNow);
            Assert.NotNull(ytRelease);
        });

        // Stale Drive clips from a different Tithi/date must NOT be paired onto date-bound Panchang posts.
        var handoffRepo = (FakeHandoffRepo)harness.Provider.GetRequiredService<IPhoneHandoffRepository>();
        handoffRepo.Add(new PhoneHandoff
        {
            Id = "ho-stale-panchami",
            UserId = userId,
            JobId = "drive-stale",
            Topic = "Hindu Panchang & Muhurat",
            Title = "आज का पंचांग | Shukla Panchami • Purva Ashadha",
            DriveFileId = "drv-123",
            State = PhoneHandoffState.WaitingForPhone
        });
        var nextDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)).ToString("yyyy-MM-dd");
        await svc.PrepareForDateAsync(userId, nextDate, ruleId: "ar-p", forceRegenerate: true, ct);
        var nextPosts = await svc.ListPostsAsync(userId, nextDate, nextDate, null, 20, ct);
        var staleCheck = nextPosts.First(p => p.DateKey == nextDate && p.SourceType == AutomationSourceType.HinduPanchang);
        Assert.Null(staleCheck.AttachedHandoffId);

        // Removing a linked YouTube video from Calendar clears VideoId & returns Status to Ready so re-publishing works without 409 plan-item-taken.
        var planningSvc = harness.Provider.GetRequiredService<AnimStudio.Application.Planning.ContentPlanningService>();
        var firstCalItem = calItems[0];
        firstCalItem.VideoId = "oldDeleted1";
        firstCalItem.Status = ContentPlanStatus.Scheduled;
        firstCalItem.YouTube = new ContentYouTubeState { Privacy = "private", Exists = true, ScheduledAt = DateTime.UtcNow.AddHours(3) };
        await calendarRepo.UpsertAsync(firstCalItem, ct);

        await planningSvc.UnlinkRemovedVideoAsync(userId, "oldDeleted1", ct);
        var unlinked = await calendarRepo.GetAsync(firstCalItem.Id, ct);
        Assert.Null(unlinked!.VideoId);
        Assert.Null(unlinked.YouTube);
        Assert.Equal(ContentPlanStatus.Ready, unlinked.Status);
    }

    private static YouTubeAnalyzedVideo AnalyzedVideo(string id, int istHour, long views)
    {
        var ist = PublishSlotSuggester.ResolveTimeZone("Asia/Kolkata");
        var local = new DateTime(2026, 11, 10, istHour, 0, 0);
        return new YouTubeAnalyzedVideo
        {
            VideoId = id,
            Title = $"Video {id}",
            Privacy = "public",
            DurationSeconds = 55,
            PublishedAtUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), ist),
            Views = views,
            Likes = views / 10,
            Comments = views / 40
        };
    }

    private static async Task SeedChannelsAsync(IYouTubeConnectionRepository connRepo, string userId, CancellationToken ct)
    {
        await connRepo.UpsertAsync(new YouTubeChannelConnection
        {
            Id = YouTubeChannelConnection.IdFor(userId, BhaktiChannelId),
            UserId = userId,
            ChannelId = BhaktiChannelId,
            ChannelTitle = "OMKAR SHIV Bhakti",
            ChannelHandle = "@omkarshivbhakti",
            RefreshTokenCipher = "cipher-1",
            Scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl",
            ConnectedAt = DateTime.UtcNow
        }, ct);

        await connRepo.UpsertAsync(new YouTubeChannelConnection
        {
            Id = YouTubeChannelConnection.IdFor(userId, ComedyChannelId),
            UserId = userId,
            ChannelId = ComedyChannelId,
            ChannelTitle = "keshav-anim-ff",
            ChannelHandle = "@keshav-anim-ff",
            RefreshTokenCipher = "cipher-2",
            Scopes = "https://www.googleapis.com/auth/youtube.upload",
            ConnectedAt = DateTime.UtcNow
        }, ct);

        await connRepo.UpsertAsync(new YouTubeChannelConnection
        {
            Id = YouTubeChannelConnection.IdFor(userId, WorldChannelId),
            UserId = userId,
            ChannelId = WorldChannelId,
            ChannelTitle = "KeshavSinghWorld",
            ChannelHandle = "@keshavsinghworld",
            RefreshTokenCipher = "cipher-3",
            Scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl",
            ConnectedAt = DateTime.UtcNow
        }, ct);

        await connRepo.UpsertAsync(new YouTubeChannelConnection
        {
            Id = YouTubeChannelConnection.IdFor(userId, DisconnectedBriefId),
            UserId = userId,
            ChannelId = DisconnectedBriefId,
            ChannelTitle = "Point Blank Brief",
            ChannelHandle = "@pointblankbrief",
            RevokedAt = DateTime.UtcNow,
            RefreshTokenCipher = "cipher-4",
            Scopes = "https://www.googleapis.com/auth/youtube.upload",
            ConnectedAt = DateTime.UtcNow
        }, ct);
    }

    private static TestHarness BuildHarness(string? signalsDateKey = null)
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "animstudio-rebalance-tests-" + Guid.NewGuid().ToString("n"));
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

        var store = new InMemoryObjectStore();
        var renderRepo = new FakeRenderJobRepo();
        var projectRepo = new FakeProjectRepository();

        var services = new ServiceCollection();
        var dataPaths = AppDataPaths.Resolve(config, tempRoot);
        dataPaths.EnsureCreated();
        services.AddSingleton<IConfiguration>(config);
        services.AddSingleton(dataPaths);
        services.AddSingleton<IHostEnvironment>(new FakeHostEnv(tempRoot));
        services.AddLogging();
        services.AddDataProtection();
        services.AddMemoryCache();
        services.AddHttpClient();
        services.AddAnimStudioInfrastructure(config, isDevelopment: false);

        services.AddSingleton<IAutomationRepository, FakeAutomationRepo>();
        services.AddSingleton<IYouTubeConnectionRepository, FakeConnRepo>();
        services.AddSingleton<IPublishQueueRepository, FakeQueueRepo>();
        services.AddSingleton<IRenderJobRepository>(renderRepo);
        services.AddSingleton<IProjectRepository>(projectRepo);
        services.AddSingleton<IObjectStore>(store);
        services.AddSingleton<IWebSettingRepository, FakeWebSettings>();
        services.AddSingleton<IYouTubePublicationRepository, FakePubRepo>();
        services.AddSingleton<IPhoneHandoffRepository, FakeHandoffRepo>();
        services.AddSingleton<IContentTopicRepository, FakeTopicRepo>();
        services.AddSingleton<IContentPlanItemRepository, FakePlanItemRepo>();
        services.AddSingleton<IContentSourceLinkRepository, FakeSourceLinkRepo>();
        services.AddSingleton<IYouTubeChannelAnalysisRepository, FakeAnalysisRepo>();
        services.AddSingleton<IEcosystemConfigProvider, FakeConfigProvider>();
        services.AddSingleton<IEcosystemSignalsClient>(new FakeSignalsClient(signalsDateKey ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)).ToString("yyyy-MM-dd")));
        services.AddSingleton<IAiExecutor, DisabledAi>();
        services.AddSingleton<IProceduralVideoGenerator>(new FakeProceduralGen(store, renderRepo, projectRepo));
        services.AddSingleton<IFfmpegRunner, FakeFfmpeg>();
        services.AddSingleton<IHttpClientFactory>(new StubHttpFactory());

        return new TestHarness(services.BuildServiceProvider(), tempRoot);
    }

    private sealed class TestHarness(ServiceProvider provider, string tempRoot) : IDisposable
    {
        public ServiceProvider Provider { get; } = provider;
        public void Dispose()
        {
            Provider.Dispose();
            try { if (Directory.Exists(tempRoot)) Directory.Delete(tempRoot, recursive: true); } catch { }
        }
    }

    private sealed class FakeProceduralGen(InMemoryObjectStore store, FakeRenderJobRepo renderRepo, FakeProjectRepository projRepo) : IProceduralVideoGenerator
    {
        public async Task<ProceduralVideoResult> GenerateAsync(string userId, ProceduralVideoRequest request, CancellationToken ct)
        {
            var projId = $"proj-{Guid.NewGuid():n}";
            var jobId = $"rj-{Guid.NewGuid():n}";
            await projRepo.InsertAsync(new Project { Id = projId, UserId = userId, Name = request.Title }, ct);
            var key = $"renders/{jobId}.mp4";
            await using (var ms = new MemoryStream([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]))
                await store.SaveAsync(key, ms, "video/mp4", ct);
            await renderRepo.InsertAsync(new RenderJob
            {
                Id = jobId,
                UserId = userId,
                ProjectId = projId,
                Status = RenderJobStatus.Completed,
                OutputStorageKey = key,
                OutputSizeBytes = 64 * 1024,
                Width = 720,
                Height = 1280,
                Diagnostics = new RenderDiagnostics { OutputDurationSeconds = 40 }
            }, ct);
            return new ProceduralVideoResult(jobId, projId, ProceduralSceneTheme.VedicTempleSunrise3D, "Vedic Sunrise", 720, 1280, 40, 64 * 1024, key, null, "ok");
        }
    }

    private sealed class FakeSignalsClient(string defaultDateKey) : IEcosystemSignalsClient
    {
        public Task<EcosystemSignalsSnapshot> FetchAsync(string dateKey, string? location = null, string? panchangOverrideUrl = null, string? socialOverrideUrl = null, string? pratiyogitaOverrideUrl = null, CancellationToken ct = default)
        {
            var eff = string.IsNullOrWhiteSpace(dateKey) ? defaultDateKey : dateKey;
            var panchang = new EcosystemPanchangSignal(
                eff, "New Delhi, India", "Kartika Shukla Trayodashi", "02:38 AM",
                "Ashwini", "04:16 AM", "Siddha", "Garaja", "Ravivara", "Shukla", "Kartika", "2083",
                "06:49 AM", "05:25 PM", "11:46 AM - 12:28 PM", "05:00 AM - 05:50 AM", "09:10 AM - 10:40 AM", "04:05 PM - 05:25 PM",
                "Om Namah Shivaya", "Ravi Pradosh Vrat");
            var katha = new EcosystemDailyKathaSignal(
                "k1", "Pradosh Vrat Shiv Katha", "Lord Shiva",
                "Lord Shiva sandhya worship glory on Ravi Pradosh.", "Satya aur bhakti ki jeet.", "Om Namah Shivaya");
            var history = new EcosystemHistoricalSignal(
                "h1", eff, 1963,
                "ISRO Thumba Equatorial Rocket Launching Station established", "India Space History",
                "ISRO established TERLS at Thumba in Kerala.", "Space Milestone",
                IsExactDateMatch: true, IsVerified: true,
                SourceName: "Wikipedia", SourceUrl: "https://en.wikipedia.org/wiki/Thumba_Equatorial_Rocket_Launching_Station");
            return Task.FromResult(new EcosystemSignalsSnapshot(eff, location ?? "New Delhi, India", panchang, [], katha, [history], [], [], [], DateTimeOffset.UtcNow));
        }
    }

    private sealed class FakeFfmpeg : IFfmpegRunner
    {
        public async Task<FfmpegResult> RunAsync(FfmpegInvocation invocation, IProgress<FfmpegProgress>? progress, CancellationToken ct)
        {
            if (!string.IsNullOrWhiteSpace(invocation.WorkingDirectory))
            {
                Directory.CreateDirectory(invocation.WorkingDirectory);
                await File.WriteAllBytesAsync(Path.Combine(invocation.WorkingDirectory, "out.jpg"), MinimalJpeg, ct);
            }
            return new FfmpegResult(0, string.Empty, string.Empty, TimeSpan.Zero);
        }
    }

    private sealed class FakeAutomationRepo : IAutomationRepository
    {
        private readonly List<AutomationRule> _rules = [];
        private readonly List<AutomationPost> _posts = [];
        public Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.UserId == userId)]);
        public Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.Enabled).Take(limit)]);
        public Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct) => Task.FromResult(_rules.FirstOrDefault(r => r.Id == id));
        public Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct) { _rules.RemoveAll(r => r.Id == rule.Id); _rules.Add(rule); return Task.CompletedTask; }
        public Task<bool> DeleteRuleAsync(string id, CancellationToken ct) => Task.FromResult(_rules.RemoveAll(r => r.Id == id) > 0);
        public Task<IReadOnlyList<AutomationPost>> ListPostsAsync(string userId, string? dateFromKey, string? dateToKey, AutomationPostStatus? status, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<AutomationPost>>([.. _posts.Where(p => p.UserId == userId).Select(Clone)!]);
        public Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(IReadOnlyList<AutomationPostStatus> statuses, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<AutomationPost>>([.. _posts.Where(p => statuses.Contains(p.Status)).Select(Clone)!]);
        public Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct) => Task.FromResult(Clone(_posts.FirstOrDefault(p => p.Id == id)));
        public Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct) => Task.FromResult(Clone(AutomationPost.SelectPreferred(_posts.Where(p => p.UserId == userId && p.Fingerprint == fingerprint))));
        public Task UpsertPostAsync(AutomationPost post, CancellationToken ct) { _posts.RemoveAll(p => p.Id == post.Id); _posts.Add(Clone(post)!); return Task.CompletedTask; }
        public Task<bool> TryReplacePostIfStatusAsync(AutomationPost post, AutomationPostStatus expectedStatus, CancellationToken ct)
        {
            var cur = _posts.FirstOrDefault(p => p.Id == post.Id);
            if (cur is null || cur.Status != expectedStatus) return Task.FromResult(false);
            _posts.Remove(cur); _posts.Add(Clone(post)!); return Task.FromResult(true);
        }
        public Task<bool> DeletePostAsync(string id, CancellationToken ct) => Task.FromResult(_posts.RemoveAll(p => p.Id == id) > 0);
        private static AutomationPost? Clone(AutomationPost? p) => p is null ? null : JsonSerializer.Deserialize<AutomationPost>(JsonSerializer.Serialize(p));
    }

    private sealed class FakeConnRepo : IYouTubeConnectionRepository
    {
        private readonly List<YouTubeChannelConnection> _list = [];
        public Task<YouTubeChannelConnection?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_list.FirstOrDefault(c => c.Id == id));
        public Task<IReadOnlyList<YouTubeChannelConnection>> ListByUserAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubeChannelConnection>>([.. _list.Where(c => c.UserId == userId)]);
        public Task<IReadOnlyList<YouTubeChannelConnection>> ListAllAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubeChannelConnection>>([.. _list]);
        public Task UpsertAsync(YouTubeChannelConnection connection, CancellationToken ct) { _list.RemoveAll(c => c.Id == connection.Id); _list.Add(connection); return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_list.RemoveAll(c => c.Id == id) > 0);
    }

    private sealed class FakeQueueRepo : IPublishQueueRepository
    {
        private readonly List<PublishQueueItem> _items = [];
        public Task<PublishQueueItem?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_items.FirstOrDefault(i => i.Id == id));
        public Task<IReadOnlyList<PublishQueueItem>> ListByUserAsync(string userId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PublishQueueItem>>([.. _items.Where(i => i.UserId == userId).Take(limit)]);
        public Task<IReadOnlyList<PublishQueueItem>> ListDueAsync(DateTime dueBefore, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PublishQueueItem>>([]);
        public Task<IReadOnlyList<PublishQueueItem>> ListByStateAsync(PublishQueueState state, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PublishQueueItem>>([.. _items.Where(i => i.State == state).Take(limit)]);
        public Task InsertAsync(PublishQueueItem item, CancellationToken ct) { _items.Add(item); return Task.CompletedTask; }
        public Task<bool> ReplaceAsync(PublishQueueItem item, CancellationToken ct) { _items.RemoveAll(i => i.Id == item.Id); _items.Add(item); return Task.FromResult(true); }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_items.RemoveAll(i => i.Id == id) > 0);
    }

    private sealed class FakeRenderJobRepo : IRenderJobRepository
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

    private sealed class FakeWebSettings : IWebSettingRepository
    {
        private readonly List<WebSetting> _items = [];
        public Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<WebSetting>>([.. _items]);
        public Task UpsertAsync(WebSetting setting, CancellationToken ct) { _items.RemoveAll(s => s.Id == setting.Id); _items.Add(setting); return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_items.RemoveAll(s => s.Id == id) > 0);
    }

    private sealed class FakePubRepo : IYouTubePublicationRepository
    {
        public Task<YouTubePublication?> GetAsync(string id, CancellationToken ct) => Task.FromResult<YouTubePublication?>(null);
        public Task<IReadOnlyList<YouTubePublication>> ListByUserAsync(string userId, string? projectId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task<IReadOnlyList<YouTubePublication>> ListByVideoIdsAsync(string userId, IReadOnlyCollection<string> videoIds, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task<IReadOnlyList<YouTubePublication>> ListDueForCheckAsync(DateTime publishedAfter, DateTime checkedBefore, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<YouTubePublication>>([]);
        public Task UpsertAsync(YouTubePublication publication, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class FakeHandoffRepo : IPhoneHandoffRepository
    {
        private readonly List<PhoneHandoff> _list = [];
        public void Add(PhoneHandoff h) => _list.Add(h);
        public Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_list.FirstOrDefault(h => h.Id == id));
        public Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([.. _list.Where(h => h.UserId == userId).Take(limit)]);
        public Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([.. _list.Where(h => h.State == state).Take(limit)]);
        public Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct) { _list.RemoveAll(h => h.Id == handoff.Id); _list.Add(handoff); return Task.CompletedTask; }
    }

    private sealed class FakeTopicRepo : IContentTopicRepository
    {
        private readonly List<ContentTopic> _topics = [];
        public Task<ContentTopic?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_topics.FirstOrDefault(t => t.Id == id));
        public Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([.. _topics.Where(t => t.UserId == userId)]);
        public Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([.. _topics.Where(t => !t.Archived).Take(limit)]);
        public Task UpsertAsync(ContentTopic topic, CancellationToken ct) { _topics.RemoveAll(t => t.Id == topic.Id); _topics.Add(topic); return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_topics.RemoveAll(t => t.Id == id) > 0);
    }

    private sealed class FakePlanItemRepo : IContentPlanItemRepository
    {
        private readonly List<ContentPlanItem> _items = [];
        public Task<ContentPlanItem?> GetAsync(string id, CancellationToken ct) => Task.FromResult(_items.FirstOrDefault(i => i.Id == id));
        public Task<IReadOnlyList<ContentPlanItem>> ListByUserAsync(string userId, DateTime fromUtc, DateTime toUtc, string? topicId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. _items.Where(i => i.UserId == userId && (topicId == null || i.TopicId == topicId) && i.PublishAt >= fromUtc && i.PublishAt < toUtc).OrderBy(i => i.PublishAt).Take(limit)]);
        public Task<IReadOnlyList<ContentPlanItem>> ListByTopicAsync(string topicId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. _items.Where(i => i.TopicId == topicId).Take(limit)]);
        public Task<IReadOnlyList<ContentPlanItem>> ListInWindowAsync(DateTime fromUtc, DateTime toUtc, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. _items.Where(i => i.PublishAt >= fromUtc && i.PublishAt < toUtc).Take(limit)]);
        public Task<ContentPlanItem?> FindByVideoIdAsync(string userId, string videoId, CancellationToken ct) =>
            Task.FromResult(_items.FirstOrDefault(i => i.UserId == userId && i.VideoId == videoId));
        public Task UpsertAsync(ContentPlanItem item, CancellationToken ct) { _items.RemoveAll(i => i.Id == item.Id); _items.Add(item); return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(_items.RemoveAll(i => i.Id == id) > 0);
        public Task<int> DeleteByTopicAsync(string topicId, CancellationToken ct) => Task.FromResult(_items.RemoveAll(i => i.TopicId == topicId));
    }

    private sealed class FakeSourceLinkRepo : IContentSourceLinkRepository
    {
        public Task<ContentSourceLink?> GetAsync(string id, CancellationToken ct) => Task.FromResult<ContentSourceLink?>(null);
        public Task<ContentSourceLink?> FindByUrlHashAsync(string userId, string urlHash, CancellationToken ct) => Task.FromResult<ContentSourceLink?>(null);
        public Task<IReadOnlyList<ContentSourceLink>> ListByUserAsync(string userId, string? topicId, string? planItemId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentSourceLink>>([]);
        public Task UpsertAsync(ContentSourceLink link, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class FakeAnalysisRepo : IYouTubeChannelAnalysisRepository
    {
        private readonly List<YouTubeChannelAnalysis> _list = [];
        public Task<YouTubeChannelAnalysis?> GetAsync(string userId, string channelId, CancellationToken ct) =>
            Task.FromResult(_list.FirstOrDefault(a => a.UserId == userId && a.ChannelId == channelId));
        public Task<IReadOnlyList<YouTubeChannelAnalysis>> ListByUserAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<YouTubeChannelAnalysis>>([.. _list.Where(a => a.UserId == userId)]);
        public Task UpsertAsync(YouTubeChannelAnalysis analysis, CancellationToken ct) { _list.RemoveAll(a => a.Id == analysis.Id); _list.Add(analysis); return Task.CompletedTask; }
    }

    private sealed class FakeConfigProvider : IEcosystemConfigProvider
    {
        public StudioEcosystemConfig Current { get; } = new(
            "AnimStudio AI", "Stories", "Creator", "https://example.com", "2026-11-21", "Copyright",
            "https://admin.example.com", "https://id.example.com", "https://studio.example.com",
            "ch-1", "AnimStudio", null, new ChannelBranding(),
            [new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Panchang", "https://panchang.example.com", null, null, null, null, true, 1)],
            [], [], [], [], true, DateTimeOffset.UtcNow);
        public Task<StudioEcosystemConfig> GetAsync(bool forceRefresh = false, CancellationToken ct = default) => Task.FromResult(Current);
        public void ApplyBrandKit(AiSettings? aiSettings, StudioEcosystemConfig? config = null) { }
        public Task<CentralChannelSyncSummary> SyncToAiSettingsAsync(string? actorUserId, CancellationToken ct = default) => Task.FromResult(new CentralChannelSyncSummary(0, 0, 0, false, [], []));
    }

    private sealed class DisabledAi : IAiExecutor
    {
        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) => Task.FromResult(AiOutcome<AiTextResult>.Failed("off", "off"));
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) => Task.FromResult(AiOutcome<AiImageResult>.Failed("off", "off"));
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct) => Task.FromResult(AiOutcome<AiSpeechResult>.Failed("off", "off"));
        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) => Task.FromResult(AiOutcome<AiTranscriptionResult>.Failed("off", "off"));
    }

    private sealed class FakeHostEnv(string contentRootPath) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "AnimStudio.Tests";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class StubHttpFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(new OkHandler(), disposeHandler: true);
        private sealed class OkHandler : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{}") });
        }
    }
}
