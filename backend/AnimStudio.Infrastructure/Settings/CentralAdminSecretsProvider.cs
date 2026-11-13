using System.Security.Cryptography;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Settings;

public sealed record CentralAdminSecretsSnapshot(
    string? YouTubeApiKey,
    string? GoogleOAuthClientId,
    string? GoogleOAuthClientSecret,
    string? AdSenseClientId,
    string? JamendoClientId,
    IReadOnlyDictionary<string, string> AiProviderKeys)
{
    public static CentralAdminSecretsSnapshot Empty { get; } = new(
        null, null, null, null, null,
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));
}

/// <summary>
/// Reads shared third-party credentials directly from Central Admin MongoDB
/// (<c>AdminDb.settings</c>, <c>_id = "app-settings"</c>) and decrypts encrypted fields
/// locally with <see cref="DataProtector"/> so secrets never traverse HTTP APIs.
/// </summary>
public sealed class CentralAdminSecretsProvider
{
    private const string SettingsCollection = "settings";
    private const string SettingsDocumentId = "app-settings";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);

    private readonly string? _connectionString;
    private readonly string _databaseName;
    private readonly Lazy<DataProtector> _protector;
    private readonly TimeProvider _clock;
    private readonly ILogger<CentralAdminSecretsProvider> _logger;
    private readonly Func<CancellationToken, Task<BsonDocument?>>? _testLoader;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    private IMongoCollection<BsonDocument>? _collection;
    private CentralAdminSecretsSnapshot? _cached;
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;
    private int _warnedMissingDataKey;
    private int _warnedReadFailure;

    public CentralAdminSecretsProvider(
        IConfiguration configuration,
        Lazy<DataProtector> protector,
        TimeProvider clock,
        ILogger<CentralAdminSecretsProvider> logger)
    {
        var explicitConn = Normalize(configuration["CentralMongo:ConnectionString"]);
        var appMongoConn = Normalize(configuration["Mongo:ConnectionString"]);
        _connectionString = explicitConn ?? appMongoConn;
        _databaseName = Normalize(configuration["CentralMongo:DatabaseName"])
            ?? Normalize(configuration["CentralMongo:Database"])
            ?? "AdminDb";
        _protector = protector;
        _clock = clock;
        _logger = logger;
    }

    public CentralAdminSecretsProvider(
        Func<CancellationToken, Task<BsonDocument?>> loader,
        Lazy<DataProtector> protector,
        TimeProvider clock,
        ILogger<CentralAdminSecretsProvider> logger)
    {
        _testLoader = loader ?? throw new ArgumentNullException(nameof(loader));
        _connectionString = "test://in-memory";
        _databaseName = "AdminDb";
        _protector = protector;
        _clock = clock;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_connectionString) || _testLoader is not null;

    public void Invalidate()
    {
        _expiresAt = DateTimeOffset.MinValue;
    }

    public CentralAdminSecretsSnapshot GetSnapshot()
    {
        if (!IsConfigured) return CentralAdminSecretsSnapshot.Empty;

        var now = _clock.GetUtcNow();
        if (_cached is not null && now < _expiresAt)
            return _cached;

        if (_testLoader is not null)
            return GetSnapshotAsync(CancellationToken.None).GetAwaiter().GetResult();

        // Sync Mongo read for synchronous IsConfigured properties, avoiding sync-over-async deadlocks.
        _refreshLock.Wait();
        try
        {
            now = _clock.GetUtcNow();
            if (_cached is not null && now < _expiresAt)
                return _cached;

            var doc = LoadDocumentSync();
            return StoreSnapshot(ParseDocument(doc), now);
        }
        catch (Exception ex)
        {
            LogReadWarningOnce(ex);
            return _cached ?? CentralAdminSecretsSnapshot.Empty;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public async Task<CentralAdminSecretsSnapshot> GetSnapshotAsync(CancellationToken ct = default)
    {
        if (!IsConfigured) return CentralAdminSecretsSnapshot.Empty;

        var now = _clock.GetUtcNow();
        if (_cached is not null && now < _expiresAt)
            return _cached;

        await _refreshLock.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            now = _clock.GetUtcNow();
            if (_cached is not null && now < _expiresAt)
                return _cached;

            var doc = _testLoader is not null
                ? await _testLoader(ct).ConfigureAwait(false)
                : await LoadDocumentAsync(ct).ConfigureAwait(false);

            return StoreSnapshot(ParseDocument(doc), now);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            LogReadWarningOnce(ex);
            return _cached ?? CentralAdminSecretsSnapshot.Empty;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public async Task<string?> GetAiProviderKeyAsync(string providerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(providerId)) return null;
        var snapshot = await GetSnapshotAsync(ct).ConfigureAwait(false);
        return snapshot.AiProviderKeys.TryGetValue(providerId.Trim(), out var key) ? key : null;
    }

    public async Task<IReadOnlyDictionary<string, string>> GetAllAiProviderKeysAsync(CancellationToken ct = default) =>
        (await GetSnapshotAsync(ct).ConfigureAwait(false)).AiProviderKeys;

    public string? GetYouTubeApiKey() => GetSnapshot().YouTubeApiKey;

    public async Task<string?> GetYouTubeApiKeyAsync(CancellationToken ct = default) =>
        (await GetSnapshotAsync(ct).ConfigureAwait(false)).YouTubeApiKey;

    public (string? ClientId, string? ClientSecret) GetGoogleOAuthCredentials()
    {
        var snap = GetSnapshot();
        return (snap.GoogleOAuthClientId, snap.GoogleOAuthClientSecret);
    }

    public async Task<(string? ClientId, string? ClientSecret)> GetGoogleOAuthCredentialsAsync(CancellationToken ct = default)
    {
        var snap = await GetSnapshotAsync(ct).ConfigureAwait(false);
        return (snap.GoogleOAuthClientId, snap.GoogleOAuthClientSecret);
    }

    public string? GetJamendoClientId() => GetSnapshot().JamendoClientId;

    public async Task<string?> GetJamendoClientIdAsync(CancellationToken ct = default) =>
        (await GetSnapshotAsync(ct).ConfigureAwait(false)).JamendoClientId;

    private CentralAdminSecretsSnapshot StoreSnapshot(CentralAdminSecretsSnapshot snapshot, DateTimeOffset now)
    {
        _cached = snapshot;
        _expiresAt = now.Add(CacheTtl);
        Interlocked.Exchange(ref _warnedReadFailure, 0);
        return snapshot;
    }

    private IMongoCollection<BsonDocument> GetCollection()
    {
        if (_collection is not null) return _collection;

        var settings = MongoClientSettings.FromConnectionString(_connectionString!);
        settings.ConnectTimeout = TimeSpan.FromSeconds(4);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(4);
        settings.SocketTimeout = TimeSpan.FromSeconds(5);

        var client = new MongoClient(settings);
        _collection = client.GetDatabase(_databaseName).GetCollection<BsonDocument>(SettingsCollection);
        return _collection;
    }

    private BsonDocument? LoadDocumentSync()
    {
        var collection = GetCollection();
        var filter = Builders<BsonDocument>.Filter.Eq("_id", SettingsDocumentId);
        return collection.Find(filter).FirstOrDefault();
    }

    private async Task<BsonDocument?> LoadDocumentAsync(CancellationToken ct)
    {
        var collection = GetCollection();
        var filter = Builders<BsonDocument>.Filter.Eq("_id", SettingsDocumentId);
        return await collection.Find(filter).FirstOrDefaultAsync(ct).ConfigureAwait(false);
    }

    internal CentralAdminSecretsSnapshot ParseDocument(BsonDocument? doc)
    {
        if (doc is null) return CentralAdminSecretsSnapshot.Empty;

        var ytKey = TryDecrypt(GetString(doc, "YouTubeApiKeyEncrypted", "youTubeApiKeyEncrypted"));
        var googleClientId = Normalize(GetString(doc, "GoogleOAuthClientId", "googleOAuthClientId"));
        var googleSecret = TryDecrypt(GetString(doc, "GoogleOAuthClientSecretEncrypted", "googleOAuthClientSecretEncrypted"));
        var adSenseClientId = Normalize(GetString(doc, "AdSenseClientId", "adSenseClientId"));
        var jamendoClientId = TryDecrypt(GetString(doc, "JamendoClientIdEncrypted", "jamendoClientIdEncrypted"));

        var aiKeys = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var aiDoc = GetSubDocument(doc, "AiProviderKeysEncrypted", "aiProviderKeysEncrypted");
        if (aiDoc is not null)
        {
            foreach (var elem in aiDoc.Elements)
            {
                if (elem.Value.BsonType != BsonType.String) continue;
                var providerId = elem.Name.Trim();
                var decrypted = TryDecrypt(elem.Value.AsString);
                if (!string.IsNullOrEmpty(providerId) && decrypted is not null)
                    aiKeys[providerId] = decrypted;
            }
        }

        return new CentralAdminSecretsSnapshot(
            ytKey,
            googleClientId,
            googleSecret,
            adSenseClientId,
            jamendoClientId,
            aiKeys);
    }

    private string? TryDecrypt(string? cipherText)
    {
        var trimmed = Normalize(cipherText);
        if (trimmed is null) return null;

        try
        {
            return Normalize(_protector.Value.Decrypt(trimmed));
        }
        catch (Exception ex) when (ex is CryptographicException or InvalidOperationException)
        {
            if (Interlocked.Exchange(ref _warnedMissingDataKey, 1) == 0)
            {
                _logger.LogWarning(ex,
                    "Unable to decrypt shared integration credentials from Central AdminDb. " +
                    "Verify Encryption:DataKey matches the Central Admin key.");
            }
            return null;
        }
    }

    private void LogReadWarningOnce(Exception ex)
    {
        if (Interlocked.Exchange(ref _warnedReadFailure, 1) == 0)
            _logger.LogWarning(ex, "Could not read shared settings from Central AdminDb; falling back to local config.");
    }

    private static string? GetString(BsonDocument doc, string primary, string fallback)
    {
        if (doc.TryGetValue(primary, out var val) && val.BsonType == BsonType.String)
            return val.AsString;
        if (doc.TryGetValue(fallback, out val) && val.BsonType == BsonType.String)
            return val.AsString;
        return null;
    }

    private static BsonDocument? GetSubDocument(BsonDocument doc, string primary, string fallback)
    {
        if (doc.TryGetValue(primary, out var val) && val.BsonType == BsonType.Document)
            return val.AsBsonDocument;
        if (doc.TryGetValue(fallback, out val) && val.BsonType == BsonType.Document)
            return val.AsBsonDocument;
        return null;
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
