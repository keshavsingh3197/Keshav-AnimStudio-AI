using System.Net;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Music;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Settings;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace AnimStudio.Application.Tests.Settings;

public sealed class CentralAdminSecretsTests
{
    private const string TestDataKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

    private static Lazy<DataProtector> CreateProtector(string key = TestDataKey) =>
        new(() => new DataProtector(Microsoft.Extensions.Options.Options.Create(new EncryptionOptions { DataKey = key })));

    private sealed class FakeCredentialRepo : IAiCredentialRepository
    {
        public Dictionary<string, AiCredential> Items { get; } = new(StringComparer.Ordinal);
        public Task<AiCredential?> GetAsync(string providerId, CancellationToken ct) => Task.FromResult(Items.GetValueOrDefault(providerId));
        public Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiCredential>>([.. Items.Values]);
        public Task UpsertAsync(AiCredential credential, CancellationToken ct) { Items[credential.ProviderId] = credential; return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string providerId, CancellationToken ct) => Task.FromResult(Items.Remove(providerId));
    }

    private sealed class NoOpResolver : IAiSecretResolver
    {
        public Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct) => Task.FromResult<string?>(null);
        public bool IsInstalled(AiProviderId provider) => false;
        public void Invalidate(AiProviderId provider) { }
        public Task WarmAsync(CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class StaticOptions<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue => value;
        public T Get(string? name) => value;
        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }

    private sealed class MutableTimeProvider(DateTimeOffset start) : TimeProvider
    {
        private DateTimeOffset _now = start;
        public override DateTimeOffset GetUtcNow() => _now;
        public void Advance(TimeSpan by) => _now = _now.Add(by);
    }

    [Fact]
    public async Task Reads_and_decrypts_AdminDb_document_and_honours_60s_cache()
    {
        var protector = CreateProtector();
        var clock = new MutableTimeProvider(new DateTimeOffset(2026, 11, 13, 0, 0, 0, TimeSpan.Zero));
        var loadCount = 0;

        var provider = new CentralAdminSecretsProvider(
            _ =>
            {
                loadCount++;
                var yt = loadCount == 1 ? "AIzaCentralKey1111" : "AIzaCentralKey2222";
                return Task.FromResult<BsonDocument?>(new BsonDocument
                {
                    { "_id", "app-settings" },
                    { "YouTubeApiKeyEncrypted", protector.Value.Encrypt(yt) },
                    { "GoogleOAuthClientId", "central-client-id.apps.googleusercontent.com" },
                    { "GoogleOAuthClientSecretEncrypted", protector.Value.Encrypt("GOCSPX-CentralSecret9999") },
                    { "AdSenseClientId", "ca-pub-1234567890123456" },
                    { "JamendoClientIdEncrypted", protector.Value.Encrypt("jamendo-central-8888") },
                    { "AiProviderKeysEncrypted", new BsonDocument
                        {
                            { "groq", protector.Value.Encrypt("gsk_central_groq_1234") },
                            { "gemini", protector.Value.Encrypt("AIza_central_gemini_5678") }
                        }
                    }
                });
            },
            protector,
            clock,
            NullLogger<CentralAdminSecretsProvider>.Instance);

        var first = await provider.GetSnapshotAsync();
        Assert.Equal(1, loadCount);
        Assert.Equal("AIzaCentralKey1111", first.YouTubeApiKey);
        Assert.Equal("central-client-id.apps.googleusercontent.com", first.GoogleOAuthClientId);
        Assert.Equal("GOCSPX-CentralSecret9999", first.GoogleOAuthClientSecret);
        Assert.Equal("ca-pub-1234567890123456", first.AdSenseClientId);
        Assert.Equal("jamendo-central-8888", first.JamendoClientId);
        Assert.Equal("gsk_central_groq_1234", first.AiProviderKeys["groq"]);
        Assert.Equal("AIza_central_gemini_5678", first.AiProviderKeys["gemini"]);

        clock.Advance(TimeSpan.FromSeconds(30));
        var second = await provider.GetSnapshotAsync();
        Assert.Equal(1, loadCount);
        Assert.Equal("AIzaCentralKey1111", second.YouTubeApiKey);

        clock.Advance(TimeSpan.FromSeconds(31));
        var third = await provider.GetSnapshotAsync();
        Assert.Equal(2, loadCount);
        Assert.Equal("AIzaCentralKey2222", third.YouTubeApiKey);

        provider.Invalidate();
        await provider.GetSnapshotAsync();
        Assert.Equal(3, loadCount);
    }

    [Fact]
    public async Task AiCredentialStore_resolves_local_db_then_central_admin_then_config()
    {
        var protector = CreateProtector();
        var repo = new FakeCredentialRepo();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Ai:Secrets:groq"] = "gsk_from_env_0001",
                ["Ai:Secrets:openrouter"] = "sk-or-from-env-0002"
            })
            .Build();

        var central = new CentralAdminSecretsProvider(
            _ => Task.FromResult<BsonDocument?>(new BsonDocument
            {
                { "AiProviderKeysEncrypted", new BsonDocument
                    {
                        { "groq", protector.Value.Encrypt("gsk_from_central_1111") },
                        { "gemini", protector.Value.Encrypt("AIza_from_central_2222") }
                    }
                }
            }),
            protector,
            TimeProvider.System,
            NullLogger<CentralAdminSecretsProvider>.Instance);

        var store = new AiCredentialStore(
            repo, protector, config, new NoOpResolver(), TimeProvider.System,
            NullLogger<AiCredentialStore>.Instance, central);

        // Central Admin wins over env var when local DB has no override; env var covers openrouter.
        Assert.Equal("gsk_from_central_1111", await store.GetSecretAsync(AiProviderId.Parse("groq"), CancellationToken.None));
        Assert.Equal("AIza_from_central_2222", await store.GetSecretAsync(AiProviderId.Parse("gemini"), CancellationToken.None));
        Assert.Equal("sk-or-from-env-0002", await store.GetSecretAsync(AiProviderId.Parse("openrouter"), CancellationToken.None));

        var describedAll = await store.DescribeAllAsync(CancellationToken.None);
        Assert.Equal(3, describedAll.Count);
        Assert.All(describedAll, d => Assert.Equal(AiCredentialSource.Configuration, d.Source));

        // Local DB override beats Central Admin.
        await store.SetAsync(AiProviderId.Parse("groq"), "gsk_local_override_9999", "admin", CancellationToken.None);
        Assert.Equal("gsk_local_override_9999", await store.GetSecretAsync(AiProviderId.Parse("groq"), CancellationToken.None));
        var groqStatus = await store.DescribeAsync(AiProviderId.Parse("groq"), CancellationToken.None);
        Assert.Equal(AiCredentialSource.Database, groqStatus.Source);
        Assert.Equal("9999", groqStatus.Last4);
    }

    [Fact]
    public void YouTube_and_Jamendo_clients_consume_central_credentials_and_preserve_per_app_redirect_uri()
    {
        var protector = CreateProtector();
        var central = new CentralAdminSecretsProvider(
            _ => Task.FromResult<BsonDocument?>(new BsonDocument
            {
                { "YouTubeApiKeyEncrypted", protector.Value.Encrypt("AIzaCentralAudienceKey5555") },
                { "GoogleOAuthClientId", "central-oauth-id.apps.googleusercontent.com" },
                { "GoogleOAuthClientSecretEncrypted", protector.Value.Encrypt("GOCSPX-CentralOAuthSecret") },
                { "JamendoClientIdEncrypted", protector.Value.Encrypt("jamendo-central-id-777") }
            }),
            protector,
            TimeProvider.System,
            NullLogger<CentralAdminSecretsProvider>.Instance);

        var oauth = new YouTubeOAuthClient(
            new StaticOptions<YouTubePublishOptions>(new YouTubePublishOptions
            {
                RedirectUri = "https://studio.keshavsingh.in/youtube/callback"
            }),
            NullLogger<YouTubeOAuthClient>.Instance,
            handler: null,
            central);

        Assert.True(oauth.IsConfigured);
        var authUrl = oauth.BuildAuthorizationUrl("state-1", "challenge-1");
        Assert.Contains("client_id=central-oauth-id.apps.googleusercontent.com", authUrl);
        Assert.Contains("redirect_uri=" + Uri.EscapeDataString("https://studio.keshavsingh.in/youtube/callback"), authUrl);

        var audience = new YouTubeAudienceService(
            new StaticOptions<YouTubeDataOptions>(new YouTubeDataOptions()),
            TimeProvider.System,
            NullLogger<YouTubeAudienceService>.Instance,
            handler: null,
            central);
        Assert.True(audience.IsConfigured);

        var music = new JamendoMusicCatalog(
            new StaticOptions<MusicLibraryOptions>(new MusicLibraryOptions()),
            TimeProvider.System,
            NullLogger<JamendoMusicCatalog>.Instance,
            handler: null,
            central);
        Assert.True(music.IsConfigured);
    }

    [Fact]
    public async Task Missing_data_key_returns_public_fields_and_does_not_throw()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        var throwingProtector = new Lazy<DataProtector>(() => new DataProtector(Microsoft.Extensions.Options.Options.Create(new EncryptionOptions { DataKey = "" })));
        var workingProtector = CreateProtector();

        var central = new CentralAdminSecretsProvider(
            _ => Task.FromResult<BsonDocument?>(new BsonDocument
            {
                { "GoogleOAuthClientId", "public-client-id" },
                { "GoogleOAuthClientSecretEncrypted", workingProtector.Value.Encrypt("secret-cannot-decrypt") }
            }),
            throwingProtector,
            TimeProvider.System,
            NullLogger<CentralAdminSecretsProvider>.Instance);

        var snap = await central.GetSnapshotAsync();
        Assert.Equal("public-client-id", snap.GoogleOAuthClientId);
        Assert.Null(snap.GoogleOAuthClientSecret);
        _ = emptyConfig;
    }
}
