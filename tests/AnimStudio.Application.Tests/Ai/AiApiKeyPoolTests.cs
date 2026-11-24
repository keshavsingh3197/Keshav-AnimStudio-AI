using System.Net;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Ai;

public class AiApiKeyPoolTests
{
    private const string TestDataKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private const string GeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/";

    private sealed class InMemoryCredentialRepo : IAiCredentialRepository
    {
        private readonly Dictionary<string, AiCredential> _items = new(StringComparer.Ordinal);

        public Task<AiCredential?> GetAsync(string providerId, CancellationToken ct) =>
            Task.FromResult(_items.GetValueOrDefault(providerId));

        public Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiCredential>>([.. _items.Values]);

        public Task UpsertAsync(AiCredential credential, CancellationToken ct)
        {
            _items[credential.ProviderId] = credential;
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string providerId, CancellationToken ct) =>
            Task.FromResult(_items.Remove(providerId));
    }

    private sealed class InMemoryApiKeyRepo : IAiApiKeyRepository
    {
        private readonly List<AiApiKeyEntry> _items = [];
        private int _seq;

        public Task<AiApiKeyEntry?> GetByIdAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.FirstOrDefault(i => i.Id == id));

        public Task<IReadOnlyList<AiApiKeyEntry>> ListAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiApiKeyEntry>>(
                [.. _items.OrderBy(k => k.Vendor).ThenBy(k => k.Priority).ThenBy(k => k.CreatedAtUtc)]);

        public Task<IReadOnlyList<AiApiKeyEntry>> ListByVendorAsync(string vendor, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiApiKeyEntry>>(
                [.. _items.Where(k => k.Vendor == vendor).OrderBy(k => k.Priority).ThenBy(k => k.CreatedAtUtc)]);

        public Task InsertAsync(AiApiKeyEntry entry, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(entry.Id))
                entry.Id = $"ak_{++_seq}";
            _items.Add(entry);
            return Task.CompletedTask;
        }

        public Task ReplaceAsync(AiApiKeyEntry entry, CancellationToken ct)
        {
            var idx = _items.FindIndex(i => i.Id == entry.Id);
            if (idx >= 0) _items[idx] = entry;
            else _items.Add(entry);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) =>
            Task.FromResult(_items.RemoveAll(i => i.Id == id) > 0);
    }

    private sealed class QueueHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        : HttpMessageHandler
    {
        public List<(string? KeyHeader, string Uri, string Body)> Calls { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            var body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(ct);
            var key = request.Headers.TryGetValues("x-goog-api-key", out var values)
                ? values.FirstOrDefault()
                : null;
            Calls.Add((key, request.RequestUri?.ToString() ?? string.Empty, body));
            return responder(request);
        }
    }

    private sealed class Harness : IDisposable
    {
        public ServiceProvider Provider { get; }
        public InMemoryCredentialRepo LegacyRepo { get; }
        public InMemoryApiKeyRepo PoolRepo { get; }
        public ManualTimeProvider Clock { get; }
        public AiSecretResolver Resolver { get; }

        public Harness(DateTimeOffset? initialTime = null)
        {
            Clock = new ManualTimeProvider(initialTime ?? new DateTimeOffset(2026, 11, 24, 3, 25, 0, TimeSpan.Zero));
            LegacyRepo = new InMemoryCredentialRepo();
            PoolRepo = new InMemoryApiKeyRepo();

            var services = new ServiceCollection();
            services.AddSingleton<TimeProvider>(Clock);
            services.AddSingleton<IAiCredentialRepository>(LegacyRepo);
            services.AddSingleton<IAiApiKeyRepository>(PoolRepo);
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
            services.AddSingleton(new Lazy<DataProtector>(() => new DataProtector(
                Microsoft.Extensions.Options.Options.Create(new EncryptionOptions { DataKey = TestDataKey }))));
            services.AddSingleton<IAiSecretResolver>(sp => new AiSecretResolver(
                sp.GetRequiredService<IServiceScopeFactory>(),
                NullLogger<AiSecretResolver>.Instance,
                sp.GetRequiredService<TimeProvider>()));
            services.AddScoped<IAiCredentialStore>(sp => new AiCredentialStore(
                sp.GetRequiredService<IAiCredentialRepository>(),
                sp.GetRequiredService<Lazy<DataProtector>>(),
                sp.GetRequiredService<IConfiguration>(),
                sp.GetRequiredService<IAiSecretResolver>(),
                sp.GetRequiredService<TimeProvider>(),
                NullLogger<AiCredentialStore>.Instance,
                centralSecrets: null,
                apiKeyRepository: sp.GetRequiredService<IAiApiKeyRepository>()));
            services.AddScoped<IAiApiKeyPoolStore>(sp => new AiApiKeyPoolStore(
                sp.GetRequiredService<IAiApiKeyRepository>(),
                sp.GetRequiredService<IAiCredentialRepository>(),
                sp.GetRequiredService<Lazy<DataProtector>>(),
                sp.GetRequiredService<IConfiguration>(),
                sp.GetRequiredService<IAiSecretResolver>(),
                sp.GetRequiredService<TimeProvider>(),
                NullLogger<AiApiKeyPoolStore>.Instance));

            Provider = services.BuildServiceProvider();
            Resolver = (AiSecretResolver)Provider.GetRequiredService<IAiSecretResolver>();
        }

        public IAiApiKeyPoolStore Pool() => Provider.CreateScope().ServiceProvider.GetRequiredService<IAiApiKeyPoolStore>();
        public IAiCredentialStore LegacyStore() => Provider.CreateScope().ServiceProvider.GetRequiredService<IAiCredentialStore>();

        public GeminiSpeechProvider BuildSpeechProvider(HttpMessageHandler handler)
        {
            var opts = new AiOptions
            {
                Providers =
                {
                    ["gemini-tts"] = new AiProviderOptions
                    {
                        Enabled = true, BaseUrl = GeminiBaseUrl, Model = "gemini-2.5-pro-preview-tts"
                    }
                }
            };
            return new GeminiSpeechProvider(
                AiProviderId.Parse("gemini-tts"),
                new StubHttpClientFactory(handler, GeminiBaseUrl),
                Resolver,
                new StaticOptionsMonitor<AiOptions>(opts),
                NullLogger<GeminiSpeechProvider>.Instance);
        }

        public void Dispose() => Provider.Dispose();
    }

    private static HttpResponseMessage JsonReply(HttpStatusCode code, string json) =>
        new(code) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    private static string ValidAudioJson() =>
        $$"""
          { "candidates": [ { "content": { "parts": [ { "inlineData": {
              "mimeType": "audio/L16;codec=pcm;rate=24000",
              "data": "{{Convert.ToBase64String(new byte[4800])}}" } } ] } } ] }
          """;

    private static string PerDayQuotaJson() =>
        """
        { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED",
          "details": [ { "violations": [ { "quotaId": "GenerateRequestsPerDayPerProjectPerModel-Tier1" } ] } ] } }
        """;

    [Fact]
    public async Task Legacy_single_key_backfills_into_google_pool_and_syncs_reorder_and_delete()
    {
        using var h = new Harness();
        var ttsId = AiProviderId.Parse("gemini-tts");

        // Legacy single key stored before upgrade.
        await h.LegacyStore().SetAsync(ttsId, "AIzaSyPrimaryKeyAlpha11111111Bf3Q", "admin", CancellationToken.None);

        var vendors = await h.Pool().ListVendorsAsync(CancellationToken.None);
        var google = vendors.Single(v => v.Vendor == AiProviderVendors.Google);
        Assert.Single(google.Keys);
        Assert.Equal("••••Bf3Q", google.Keys[0].Masked);

        // Add VideoGenerator key under Google, then promote it to #1.
        var added = await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "VideoGenerator", "Tier 1", [], "AIzaSyBackupKeyBeta22222222xi8g"),
            "admin", CancellationToken.None);

        Assert.Equal("••••xi8g", added.Masked);
        await h.Pool().ReorderVendorAsync("google", [added.Id, google.Keys[0].Id], "admin", CancellationToken.None);

        // Rollback sync: legacy aiCredentials now reflects VideoGenerator as #1.
        var legacyStatus = await h.LegacyStore().DescribeAsync(ttsId, CancellationToken.None);
        Assert.Equal("••••xi8g", legacyStatus.Masked);

        // Deleting both removes legacy key cleanly so it cannot resurrect on restart.
        Assert.True(await h.Pool().DeleteKeyAsync(added.Id, CancellationToken.None));
        Assert.True(await h.Pool().DeleteKeyAsync(google.Keys[0].Id, CancellationToken.None));
        await h.Pool().EnsureBackfilledAsync(CancellationToken.None);
        Assert.Empty((await h.Pool().ListVendorsAsync(CancellationToken.None)).Single(v => v.Vendor == "google").Keys);
    }

    [Fact]
    public async Task Quota_exhausted_key_fails_over_immediately_and_subsequent_calls_skip_cooling_key()
    {
        using var h = new Harness(new DateTimeOffset(2026, 11, 24, 3, 25, 0, TimeSpan.Zero)); // 08:55 IST
        await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "FamSphere", null, [], "AIzaSyKeyOneQuotaExhaustedBf3Q"),
            "admin", CancellationToken.None);
        await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "VideoGenerator", null, [], "AIzaSyKeyTwoHealthyActive_xi8g"),
            "admin", CancellationToken.None);

        var handler = new QueueHttpHandler(req =>
        {
            var key = req.Headers.GetValues("x-goog-api-key").Single();
            return key.EndsWith("Bf3Q", StringComparison.Ordinal)
                ? JsonReply(HttpStatusCode.TooManyRequests, PerDayQuotaJson())
                : JsonReply(HttpStatusCode.OK, ValidAudioJson());
        });

        var speech = h.BuildSpeechProvider(handler);

        // First call tries Key #1 (429 PerDay), records cooldown, fails over immediately to Key #2 -> succeeds!
        var first = await speech.SynthesizeAsync(new AiSpeechRequest { Text = "नमस्ते", VoiceId = "kore" }, CancellationToken.None);
        Assert.NotEmpty(first.Content);
        Assert.Equal(2, handler.Calls.Count);
        Assert.EndsWith("Bf3Q", handler.Calls[0].KeyHeader);
        Assert.EndsWith("xi8g", handler.Calls[1].KeyHeader);

        // Second call goes directly to Key #2 without wasting a 429 request on Key #1.
        var second = await speech.SynthesizeAsync(new AiSpeechRequest { Text = "हर हर महादेव", VoiceId = "kore" }, CancellationToken.None);
        Assert.NotEmpty(second.Content);
        Assert.Equal(3, handler.Calls.Count);
        Assert.EndsWith("xi8g", handler.Calls[2].KeyHeader);

        // Verify Key #1 cooldown resets around next Pacific midnight (2026-11-24 08:00 UTC = 13:30 IST).
        var google = (await h.Pool().ListVendorsAsync(CancellationToken.None)).Single(v => v.Vendor == "google");
        var key1 = google.Keys.Single(k => k.Masked == "••••Bf3Q");
        Assert.Equal(AiApiKeyHealthStatus.QuotaExhausted, key1.Status);
        Assert.NotNull(key1.CooldownUntilUtc);
        Assert.True(key1.CooldownUntilUtc > h.Clock.GetUtcNow().UtcDateTime);
    }

    [Fact]
    public async Task Invalid_key_400_fails_over_while_prompt_bad_request_does_not_burn_backup_key()
    {
        using var h = new Harness();
        await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "Key1", null, [], "AIzaSyFirstKeyValue1111111111"),
            "admin", CancellationToken.None);
        await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "Key2", null, [], "AIzaSySecondKeyValue222222222"),
            "admin", CancellationToken.None);

        // API_KEY_INVALID on Key1 -> fails over cleanly to Key2.
        var authFailHandler = new QueueHttpHandler(req =>
        {
            var key = req.Headers.GetValues("x-goog-api-key").Single();
            return key.Contains("First", StringComparison.Ordinal)
                ? JsonReply(HttpStatusCode.BadRequest, """{"error":{"code":400,"status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}""")
                : JsonReply(HttpStatusCode.OK, ValidAudioJson());
        });

        var speech1 = h.BuildSpeechProvider(authFailHandler);
        var res = await speech1.SynthesizeAsync(new AiSpeechRequest { Text = "test", VoiceId = "kore" }, CancellationToken.None);
        Assert.NotEmpty(res.Content);
        Assert.Equal(2, authFailHandler.Calls.Count);

        // Non-auth 400 INVALID_ARGUMENT -> bubbles bad-request immediately without hitting backup.
        var badPromptHandler = new QueueHttpHandler(_ =>
            JsonReply(HttpStatusCode.BadRequest, """{"error":{"code":400,"status":"INVALID_ARGUMENT"}}"""));
        var speech2 = h.BuildSpeechProvider(badPromptHandler);
        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            speech2.SynthesizeAsync(new AiSpeechRequest { Text = "bad", VoiceId = "kore" }, CancellationToken.None));
        Assert.Equal("bad-request", ex.Code);
        Assert.Single(badPromptHandler.Calls);
    }

    [Fact]
    public async Task All_keys_in_cooldown_reports_quota_exhausted_instead_of_credential_missing()
    {
        using var h = new Harness();
        await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand("google", "OnlyKey", null, [], "AIzaSySoleKeyExhausted999999"),
            "admin", CancellationToken.None);

        var handler = new QueueHttpHandler(_ => JsonReply(HttpStatusCode.TooManyRequests, PerDayQuotaJson()));
        var speech = h.BuildSpeechProvider(handler);

        var firstEx = await Assert.ThrowsAsync<AiProviderException>(() =>
            speech.SynthesizeAsync(new AiSpeechRequest { Text = "one", VoiceId = "kore" }, CancellationToken.None));
        Assert.Equal("quota-exhausted", firstEx.Code);

        // Next call while still cooling down should fail fast with quota-exhausted (0 network calls).
        var secondEx = await Assert.ThrowsAsync<AiProviderException>(() =>
            speech.SynthesizeAsync(new AiSpeechRequest { Text = "two", VoiceId = "kore" }, CancellationToken.None));
        Assert.Equal("quota-exhausted", secondEx.Code);
        Assert.Single(handler.Calls);
    }

    [Fact]
    public async Task Test_key_prefers_native_v1beta_endpoint_over_openai_compat_path()
    {
        using var h = new Harness();
        var added = await h.Pool().AddKeyAsync(
            new CreateAiApiKeyCommand(
                "google", "Migrated", null, ["gemini", "gemini-tts"], "AIzaSyProbeNativeTest123456"),
            "admin", CancellationToken.None);

        var opts = new AiOptions
        {
            Providers =
            {
                ["gemini"] = new AiProviderOptions { Enabled = true, BaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/" },
                ["gemini-tts"] = new AiProviderOptions { Enabled = true, BaseUrl = GeminiBaseUrl }
            }
        };

        var calledUrls = new List<string>();
        var handler = new QueueHttpHandler(req =>
        {
            var baseAddr = opts.ProviderFor(req.RequestUri!.AbsoluteUri.Contains("/openai/")
                ? AiProviderId.Parse("gemini")
                : AiProviderId.Parse("gemini-tts"))!;
            calledUrls.Add(req.RequestUri.ToString());
            return req.RequestUri.ToString().Contains("/openai/", StringComparison.Ordinal)
                ? JsonReply(HttpStatusCode.NotFound, "{}")
                : JsonReply(HttpStatusCode.OK, """{"models":[]}""");
        });

        var factory = new RoutingHttpClientFactory(handler, opts);
        var storeWithProbe = new AiApiKeyPoolStore(
            h.PoolRepo,
            h.LegacyRepo,
            h.Provider.GetRequiredService<Lazy<DataProtector>>(),
            h.Provider.GetRequiredService<IConfiguration>(),
            h.Resolver,
            h.Clock,
            NullLogger<AiApiKeyPoolStore>.Instance,
            factory,
            new StaticOptionsMonitor<AiOptions>(opts));

        var verdict = await storeWithProbe.TestKeyAsync(added.Id, CancellationToken.None);
        Assert.True(verdict.Healthy);
        Assert.Equal(200, verdict.StatusCode);
        Assert.Single(calledUrls);
        Assert.Equal(GeminiBaseUrl + "models", calledUrls[0]);
    }

    private sealed class RoutingHttpClientFactory(HttpMessageHandler handler, AiOptions opts)
        : IAiHttpClientFactory
    {
        public HttpClient Create(AiProviderId provider)
        {
            var baseUrl = opts.ProviderFor(provider)!.BaseUrl!;
            if (!baseUrl.EndsWith('/')) baseUrl += "/";
            return new HttpClient(handler, disposeHandler: false) { BaseAddress = new Uri(baseUrl) };
        }
    }
}
