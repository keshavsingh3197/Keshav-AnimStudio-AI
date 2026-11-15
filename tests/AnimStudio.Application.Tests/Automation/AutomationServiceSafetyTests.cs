using System.Net;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace AnimStudio.Application.Tests.Automation;

public sealed class AutomationServiceSafetyTests
{
    [Fact]
    public void AutomationPost_SelectPreferred_prioritizes_published_and_publishing_over_duplicate_drafts()
    {
        var t0 = new DateTime(2026, 11, 15, 0, 7, 17, DateTimeKind.Utc);
        var fp = "2026-11-15:rule-daily-katha:katha-2";

        var draftOlder = new AutomationPost
        {
            Id = "ap_draft_1",
            Fingerprint = fp,
            Status = AutomationPostStatus.PreparedPreview,
            CreatedAtUtc = t0,
            UpdatedAtUtc = t0
        };
        var draftNewer = new AutomationPost
        {
            Id = "ap_draft_2",
            Fingerprint = fp,
            Status = AutomationPostStatus.VideoReadyForReview,
            CreatedAtUtc = t0.AddSeconds(4),
            UpdatedAtUtc = t0.AddSeconds(4)
        };
        var published = new AutomationPost
        {
            Id = "ap_published",
            Fingerprint = fp,
            Status = AutomationPostStatus.Published,
            PublishedVideoId = "ijDuEWYqvC8",
            CreatedAtUtc = t0.AddSeconds(1),
            UpdatedAtUtc = t0.AddSeconds(1)
        };
        var uploading = new AutomationPost
        {
            Id = "ap_uploading",
            Fingerprint = fp,
            Status = AutomationPostStatus.Publishing,
            CreatedAtUtc = t0.AddSeconds(2),
            UpdatedAtUtc = t0.AddSeconds(2)
        };

        var preferred = AutomationPost.SelectPreferred([draftOlder, draftNewer, uploading, published]);
        Assert.NotNull(preferred);
        Assert.Equal("ap_published", preferred.Id);

        var preferredUploading = AutomationPost.SelectPreferred([draftOlder, draftNewer, uploading]);
        Assert.Equal("ap_uploading", preferredUploading?.Id);

        var preferredLatestDraft = AutomationPost.SelectPreferred([draftOlder, draftNewer]);
        Assert.Equal("ap_draft_2", preferredLatestDraft?.Id);
    }

    [Fact]
    public async Task PrepareForDateAsync_concurrent_calls_for_same_user_and_date_produce_single_post_per_fingerprint()
    {
        var repo = new FakeAutomationRepository();
        const string userId = "user-1";
        await repo.UpsertRuleAsync(new AutomationRule
        {
            Id = "rule-katha",
            UserId = userId,
            Name = "Evening Daily Vedic Katha & Mantra",
            Enabled = true,
            SourceType = AutomationSourceType.DailyKatha,
            Language = "hi",
            Mode = AutomationPostMode.PreviewOnly,
            VideoFormat = AutomationVideoFormat.Vertical,
            FunnelWebsiteKeys = ["panchang"]
        }, CancellationToken.None);

        var signals = new DelayedSignalsClient(TimeSpan.FromMilliseconds(45));
        using var harness = BuildHarness(repo, signals, _ => new HttpResponseMessage(HttpStatusCode.OK));

        using var scope1 = harness.Provider.CreateScope();
        using var scope2 = harness.Provider.CreateScope();
        var svc1 = scope1.ServiceProvider.GetRequiredService<EcosystemAutomationService>();
        var svc2 = scope2.ServiceProvider.GetRequiredService<EcosystemAutomationService>();

        var results = await Task.WhenAll(
            svc1.PrepareForDateAsync(userId, "2026-11-15", null, forceRegenerate: false, CancellationToken.None),
            svc2.PrepareForDateAsync(userId, "2026-11-15", null, forceRegenerate: false, CancellationToken.None));

        Assert.Single(repo.Posts);
        Assert.Equal(1, results.Sum(r => r.PostsCreated));
        Assert.Single(results[0].Posts);
        Assert.Single(results[1].Posts);
        Assert.Equal(results[0].Posts[0].Id, results[1].Posts[0].Id);
    }

    [Fact]
    public async Task DeletePostAsync_deletes_published_history_card_while_blocking_active_upload()
    {
        var repo = new FakeAutomationRepository();
        const string userId = "user-1";

        var published = new AutomationPost
        {
            Id = "ap_deleted_yt",
            UserId = userId,
            RuleId = "rule-katha",
            DateKey = "2026-11-15",
            Fingerprint = "2026-11-15:rule-katha:katha-2",
            Status = AutomationPostStatus.Published,
            PublishedVideoId = "yWR7dhXonzM",
            PublishedVideoUrl = "https://youtu.be/yWR7dhXonzM"
        };
        var publishing = new AutomationPost
        {
            Id = "ap_active_upload",
            UserId = userId,
            RuleId = "rule-panchang",
            DateKey = "2026-11-15",
            Fingerprint = "2026-11-15:rule-panchang:panchang-2026-11-15",
            Status = AutomationPostStatus.Publishing
        };
        await repo.UpsertPostAsync(published, CancellationToken.None);
        await repo.UpsertPostAsync(publishing, CancellationToken.None);

        using var harness = BuildHarness(
            repo,
            new DelayedSignalsClient(TimeSpan.Zero),
            _ => new HttpResponseMessage(HttpStatusCode.OK));
        using var scope = harness.Provider.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<EcosystemAutomationService>();

        await svc.DeletePostAsync(userId, published.Id, CancellationToken.None);
        Assert.Null(await repo.GetPostAsync(published.Id, CancellationToken.None));

        var ex = await Assert.ThrowsAsync<EditingException>(
            () => svc.DeletePostAsync(userId, publishing.Id, CancellationToken.None));
        Assert.Equal("post-uploading", ex.Code);
        Assert.NotNull(await repo.GetPostAsync(publishing.Id, CancellationToken.None));
    }

    [Fact]
    public async Task SyncPostToEcosystemAsync_surfaces_upstream_401_and_signing_key_diagnostic_and_clears_on_success()
    {
        var repo = new FakeAutomationRepository();
        const string userId = "user-1";
        var post = new AutomationPost
        {
            Id = "ap_edfb219f123a441fb2f78c77005a8081",
            UserId = userId,
            RuleId = "rule-katha",
            SourceType = AutomationSourceType.DailyKatha,
            DateKey = "2026-11-15",
            Fingerprint = "2026-11-15:rule-katha:katha-2",
            Title = "बालक ध्रुव की तपस्या",
            Status = AutomationPostStatus.Published,
            PublishedVideoId = "ijDuEWYqvC8",
            PublishedVideoUrl = "https://youtu.be/ijDuEWYqvC8",
            PublishedAtUtc = DateTime.UtcNow
        };
        await repo.UpsertPostAsync(post, CancellationToken.None);

        string? capturedAuthHeader = null;
        string? capturedTargetUri = null;
        var nextStatus = HttpStatusCode.Unauthorized;

        using var harness = BuildHarness(
            repo,
            new DelayedSignalsClient(TimeSpan.Zero),
            req =>
            {
                capturedTargetUri = req.RequestUri?.ToString();
                capturedAuthHeader = req.Headers.Authorization?.ToString();
                return nextStatus == HttpStatusCode.Unauthorized
                    ? new HttpResponseMessage(HttpStatusCode.Unauthorized)
                    {
                        Content = new StringContent("""{"error":"Admin role or valid X-Ecosystem-Key required."}""", Encoding.UTF8, "application/json")
                    }
                    : new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""{"ok":true}""", Encoding.UTF8, "application/json")
                    };
            });

        using var scope = harness.Provider.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<EcosystemAutomationService>();

        var ex = await Assert.ThrowsAsync<EditingException>(
            () => svc.SyncPostToEcosystemAsync(userId, post.Id, "sso-token-123", CancellationToken.None));

        Assert.Equal("panchang-sync-failed", ex.Code);
        Assert.Equal("https://panchang.example.com/api/videohub/automation-sync", capturedTargetUri);
        Assert.Equal("Bearer sso-token-123", capturedAuthHeader);
        Assert.Contains("Panchang sync HTTP 401", ex.Message);
        Assert.Contains("Admin role or valid X-Ecosystem-Key required.", ex.Message);
        Assert.Contains("Jwt__SigningKey", ex.Message);

        var persistedAfterFail = await repo.GetPostAsync(post.Id, CancellationToken.None);
        Assert.NotNull(persistedAfterFail?.LastError);
        Assert.Contains("Panchang sync HTTP 401", persistedAfterFail.LastError);

        nextStatus = HttpStatusCode.OK;
        var synced = await svc.SyncPostToEcosystemAsync(userId, post.Id, "sso-token-123", CancellationToken.None);
        Assert.Null(synced.LastError);
        Assert.NotNull(synced.SyncedToEcosystemAtUtc);
    }

    private static TestHarness BuildHarness(
        IAutomationRepository repo,
        IEcosystemSignalsClient signals,
        Func<HttpRequestMessage, HttpResponseMessage> httpResponder)
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "animstudio-auto-tests-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempRoot);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "Mongo",
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

        services.AddSingleton<IAutomationRepository>(repo);
        services.AddSingleton<IWebSettingRepository, FakeWebSettingRepository>();
        services.AddSingleton<IEcosystemSignalsClient>(signals);
        services.AddSingleton<IEcosystemConfigProvider, FakeEcosystemConfigProvider>();
        services.AddSingleton<IPhoneHandoffRepository, FakePhoneHandoffRepository>();
        services.AddSingleton<IRenderJobRepository, FakeRenderJobRepository>();
        services.AddSingleton<IProjectRepository, FakeProjectRepository>();
        services.AddSingleton<IContentTopicRepository, FakeContentTopicRepository>();
        services.AddSingleton<IProceduralVideoGenerator, FakeProceduralVideoGenerator>();
        services.AddSingleton<IAiExecutor, DisabledAiExecutor>();
        services.AddSingleton<IObjectStore, InMemoryObjectStore>();
        services.AddSingleton<IHttpClientFactory>(new StubHttpClientFactory(httpResponder));

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
                // Ignore temp cleanup contention in tests.
            }
        }
    }

    private sealed class FakeAutomationRepository : IAutomationRepository
    {
        private readonly Lock _gate = new();
        private readonly List<AutomationRule> _rules = [];
        private readonly List<AutomationPost> _posts = [];

        public IReadOnlyList<AutomationPost> Posts
        {
            get { lock (_gate) return [.. _posts]; }
        }

        public Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.UserId == userId)]);
        }

        public Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult<IReadOnlyList<AutomationRule>>([.. _rules.Where(r => r.Enabled).Take(limit)]);
        }

        public Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult(_rules.FirstOrDefault(r => r.Id == id));
        }

        public Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct)
        {
            lock (_gate)
            {
                _rules.RemoveAll(r => r.Id == rule.Id);
                _rules.Add(rule);
            }
            return Task.CompletedTask;
        }

        public Task<bool> DeleteRuleAsync(string id, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult(_rules.RemoveAll(r => r.Id == id) > 0);
        }

        public Task<IReadOnlyList<AutomationPost>> ListPostsAsync(
            string userId,
            string? fromDateKey,
            string? toDateKey,
            AutomationPostStatus? status,
            int limit,
            CancellationToken ct)
        {
            lock (_gate)
            {
                var q = _posts.Where(p => p.UserId == userId);
                if (!string.IsNullOrWhiteSpace(fromDateKey))
                    q = q.Where(p => string.CompareOrdinal(p.DateKey, fromDateKey) >= 0);
                if (!string.IsNullOrWhiteSpace(toDateKey))
                    q = q.Where(p => string.CompareOrdinal(p.DateKey, toDateKey) <= 0);
                if (status.HasValue)
                    q = q.Where(p => p.Status == status.Value);
                return Task.FromResult<IReadOnlyList<AutomationPost>>([.. q.OrderByDescending(p => p.CreatedAtUtc).Take(limit)]);
            }
        }

        public Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(
            IReadOnlyList<AutomationPostStatus> statuses,
            int limit,
            CancellationToken ct)
        {
            lock (_gate)
            {
                var set = statuses.ToHashSet();
                return Task.FromResult<IReadOnlyList<AutomationPost>>([.. _posts.Where(p => set.Contains(p.Status)).Take(limit)]);
            }
        }

        public Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult(_posts.FirstOrDefault(p => p.Id == id));
        }

        public Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct)
        {
            lock (_gate)
            {
                var matches = _posts
                    .Where(p => p.UserId == userId && string.Equals(p.Fingerprint, fingerprint, StringComparison.OrdinalIgnoreCase))
                    .Take(20);
                return Task.FromResult(AutomationPost.SelectPreferred(matches));
            }
        }

        public Task UpsertPostAsync(AutomationPost post, CancellationToken ct)
        {
            lock (_gate)
            {
                _posts.RemoveAll(p => p.Id == post.Id);
                _posts.Add(post);
            }
            return Task.CompletedTask;
        }

        public Task<bool> DeletePostAsync(string id, CancellationToken ct)
        {
            lock (_gate) return Task.FromResult(_posts.RemoveAll(p => p.Id == id) > 0);
        }
    }

    private sealed class FakeWebSettingRepository : IWebSettingRepository
    {
        private readonly List<WebSetting> _items = [];

        public Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<WebSetting>>([.. _items]);

        public Task UpsertAsync(WebSetting setting, CancellationToken ct)
        {
            _items.RemoveAll(s => s.Id == setting.Id);
            _items.Add(setting);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.RemoveAll(s => s.Id == id) > 0);
    }

    private sealed class FakeEcosystemConfigProvider : IEcosystemConfigProvider
    {
        public StudioEcosystemConfig Current { get; } = new(
            StudioTitle: "AnimStudio AI",
            StudioTagline: "Stories",
            CreatorName: "Creator",
            CreatorPortfolioUrl: "https://example.com",
            LegalUpdatedDate: "2026-11-15",
            CopyrightNotice: "Copyright",
            AdminUrl: "https://admin.example.com",
            IdpUrl: "https://id.example.com",
            StudioUrl: "https://studio.example.com",
            DefaultChannelKey: "ch-1",
            EngineName: "AnimStudio",
            VisualsCredit: null,
            DefaultBranding: new ChannelBranding(),
            Websites: [new EcosystemWebsiteItem("panchang", "Hindu Panchang", "Panchang", "Daily Panchang", "https://panchang.example.com", null, null, null, null, true, 1)],
            Channels: [],
            SocialLinks: [],
            RetiredChannelUrls: [],
            RetiredChannelNames: [],
            SyncedFromCentral: true,
            LastSyncedAt: DateTimeOffset.UtcNow);

        public Task<StudioEcosystemConfig> GetAsync(bool forceRefresh = false, CancellationToken ct = default) =>
            Task.FromResult(Current);

        public void ApplyBrandKit(AiSettings? aiSettings, StudioEcosystemConfig? config = null) { }

        public Task<CentralChannelSyncSummary> SyncToAiSettingsAsync(string? actorUserId, CancellationToken ct = default) =>
            Task.FromResult(new CentralChannelSyncSummary(0, 0, 0, false, [], []));
    }

    private sealed class DelayedSignalsClient(TimeSpan delay) : IEcosystemSignalsClient
    {
        public async Task<EcosystemSignalsSnapshot> FetchAsync(
            string dateKey,
            string? location = null,
            string? panchangOverrideUrl = null,
            string? socialOverrideUrl = null,
            string? pratiyogitaOverrideUrl = null,
            CancellationToken ct = default)
        {
            if (delay > TimeSpan.Zero)
                await Task.Delay(delay, ct);

            return new EcosystemSignalsSnapshot(
                DateKey: dateKey,
                Location: location ?? "New Delhi, India",
                Panchang: null,
                UpcomingFestivals: [],
                DailyKatha: new EcosystemDailyKathaSignal(
                    Id: "katha-2",
                    Title: "Bhakta Dhruva Ki Amar Katha",
                    DeityOrSage: "Bhakta Dhruva",
                    StorySummary: "Young prince Dhruva performed steadfast tapasya in Madhuvan.",
                    MoralTeaching: "Steadfast faith brings eternal light.",
                    SanskritMantra: "ॐ नमो भगवते वासुदेवाय"),
                HistoricalIncidents: [],
                Competitions: [],
                FunnelCampaigns: [],
                Warnings: [],
                FetchedAtUtc: DateTimeOffset.UtcNow);
        }
    }

    private sealed class FakePhoneHandoffRepository : IPhoneHandoffRepository
    {
        public Task<PhoneHandoff?> GetAsync(string id, CancellationToken ct) => Task.FromResult<PhoneHandoff?>(null);
        public Task<IReadOnlyList<PhoneHandoff>> ListByUserAsync(string userId, string? jobId, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([]);
        public Task<IReadOnlyList<PhoneHandoff>> ListByStateAsync(PhoneHandoffState state, int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<PhoneHandoff>>([]);
        public Task UpsertAsync(PhoneHandoff handoff, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class FakeRenderJobRepository : IRenderJobRepository
    {
        public Task<RenderJob?> GetAsync(string id, CancellationToken ct) => Task.FromResult<RenderJob?>(null);
        public Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct) => Task.FromResult<IReadOnlyList<RenderJob>>([]);
        public Task InsertAsync(RenderJob job, CancellationToken ct) => Task.CompletedTask;
        public Task<RenderJob?> ClaimNextAsync(string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct) => Task.FromResult<RenderJob?>(null);
        public Task<JobHeartbeatResult> ReportProgressAsync(string jobId, string leaseOwner, int progress, string? message, RenderStage stage, int scenesDone, TimeSpan leaseDuration, CancellationToken ct) => Task.FromResult(new JobHeartbeatResult(false, false));
        public Task CompleteAsync(RenderJob job, CancellationToken ct) => Task.CompletedTask;
        public Task RequestCancelAsync(string jobId, CancellationToken ct) => Task.CompletedTask;
        public Task DeleteAsync(string jobId, CancellationToken ct) => Task.CompletedTask;
        public Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<string>>([]);
        public Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<RenderJob>>([]);
        public Task<bool> RequeueAsync(string jobId, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> RenameAsync(string jobId, string name, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class FakeContentTopicRepository : IContentTopicRepository
    {
        public Task<ContentTopic?> GetAsync(string id, CancellationToken ct) => Task.FromResult<ContentTopic?>(null);
        public Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([]);
        public Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<ContentTopic>>([]);
        public Task UpsertAsync(ContentTopic topic, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
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
        public HttpClient CreateClient(string name) =>
            new(new StubHandler(responder), disposeHandler: true);

        private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
                Task.FromResult(responder(request));
        }
    }
}
