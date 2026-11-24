using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using AnimStudio.Infrastructure.Settings;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Manages ordered, AES-encrypted API key pools grouped by vendor (for instance multiple Google AI Studio
/// projects under <c>google</c>) with automatic quota failover and non-destructive synchronization back to
/// <see cref="IAiCredentialRepository"/> for seamless rollback.
/// </summary>
public sealed class AiApiKeyPoolStore(
    IAiApiKeyRepository poolRepository,
    IAiCredentialRepository legacyRepository,
    Lazy<DataProtector> protector,
    IConfiguration configuration,
    IAiSecretResolver resolver,
    TimeProvider clock,
    ILogger<AiApiKeyPoolStore> logger,
    IAiHttpClientFactory? httpClientFactory = null,
    IOptionsMonitor<AiOptions>? aiOptions = null,
    CentralAdminSecretsProvider? centralSecrets = null) : IAiApiKeyPoolStore
{
    private const string SecretsSection = "Ai:Secrets";
    private const int MaxLabelLength = 80;
    private const int MaxNotesLength = 200;

    // Synchronizes backfill/mutation in-process so concurrent startup/admin reads cannot seed duplicates.
    private static readonly SemaphoreSlim WriteGate = new(1, 1);

    // Tracks in-flight day counters safely when concurrent requests run on the same key before persist.
    private readonly ConcurrentDictionary<string, long> _memoryUsage = new(StringComparer.Ordinal);

    public async Task EnsureBackfilledAsync(CancellationToken ct)
    {
        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            await EnsureBackfilledCoreAsync(ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }
    }

    public async Task<IReadOnlyList<AiApiKeyVendorSnapshot>> ListVendorsAsync(CancellationToken ct)
    {
        await EnsureBackfilledAsync(ct).ConfigureAwait(false);

        var allPool = await poolRepository.ListAsync(ct).ConfigureAwait(false);
        var hostReadOnly = await ReadHostConfiguredKeysAsync(ct).ConfigureAwait(false);
        var nowUtc = clock.GetUtcNow().UtcDateTime;
        var todayBucket = TodayBucket(nowUtc);

        var result = new List<AiApiKeyVendorSnapshot>();
        var knownVendorIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var vendor in AiProviderVendors.All)
        {
            knownVendorIds.Add(vendor.Id);
            result.Add(BuildVendorSnapshot(vendor, allPool, hostReadOnly, nowUtc, todayBucket));
        }

        // Preserve any custom/unlisted vendors that appear in stored entries or host config.
        var extraVendors = allPool.Select(k => k.Vendor)
            .Concat(hostReadOnly.Select(h => AiProviderVendors.VendorFor(h.ProviderId)))
            .Where(v => !string.IsNullOrWhiteSpace(v) && !knownVendorIds.Contains(v))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(v => v, StringComparer.OrdinalIgnoreCase);

        foreach (var vendorId in extraVendors)
        {
            var descriptor = new AiVendorDescriptor(
                vendorId,
                vendorId,
                $"Custom API keys for {vendorId}.",
                null,
                null,
                [vendorId]);
            result.Add(BuildVendorSnapshot(descriptor, allPool, hostReadOnly, nowUtc, todayBucket));
        }

        return result;
    }

    public async Task<AiApiKeySnapshot> AddKeyAsync(
        CreateAiApiKeyCommand command, string? actorUserId, CancellationToken ct)
    {
        var vendor = NormalizeAndValidateVendor(command.Vendor);
        var secret = AiCredentialStore.ValidateAndNormalize(command.Key);
        var label = NormalizeLabel(command.Label, vendor);
        var notes = NormalizeNotes(command.Notes);
        var scopedProviders = NormalizeScopedProviders(vendor, command.ProviderIds);

        var fingerprint = AiCredentialStore.ComputeFingerprint(secret);
        var last4 = AiCredentialStore.ComputeLast4(secret);
        var cipherText = protector.Value.Encrypt(secret);
        var nowUtc = clock.GetUtcNow().UtcDateTime;

        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        AiApiKeyEntry created;
        try
        {
            await EnsureBackfilledCoreAsync(ct).ConfigureAwait(false);

            var existing = (await poolRepository.ListByVendorAsync(vendor, ct).ConfigureAwait(false)).ToList();
            if (existing.Any(e => string.Equals(e.Fingerprint, fingerprint, StringComparison.Ordinal)))
            {
                throw new AiCredentialException(
                    "duplicate-key",
                    $"That exact API key (••••{last4}) is already saved under {AiProviderVendors.Find(vendor)?.DisplayName ?? vendor}. Edit the existing entry instead.");
            }

            var insertAt = command.Priority is { } requested
                ? Math.Clamp(requested, 0, existing.Count)
                : existing.Count;

            created = new AiApiKeyEntry
            {
                Vendor = vendor,
                Label = label,
                Notes = notes,
                ProviderIds = scopedProviders,
                Priority = insertAt,
                Enabled = command.Enabled,
                CipherText = cipherText,
                Fingerprint = fingerprint,
                Last4 = last4,
                CreatedByUserId = actorUserId,
                CreatedAtUtc = nowUtc,
                UpdatedAtUtc = nowUtc
            };

            await poolRepository.InsertAsync(created, ct).ConfigureAwait(false);
            existing.Insert(insertAt, created);
            await PersistVendorPrioritiesAsync(existing, ct).ConfigureAwait(false);
            await SyncLegacyPrimaryCredentialsCoreAsync(vendor, existing, nowUtc, ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }

        InvalidateVendorProviders(vendor);
        logger.LogInformation(
            "API key added under vendor {Vendor} ({Label}, fingerprint {Fingerprint}).",
            vendor, created.Label, created.Fingerprint);

        return DescribeEntry(created, clock.GetUtcNow().UtcDateTime);
    }

    public async Task<AiApiKeySnapshot> UpdateKeyAsync(
        string keyId, UpdateAiApiKeyCommand command, string? actorUserId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(keyId))
            throw new KeyNotFoundException();

        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        AiApiKeyEntry entry;
        try
        {
            entry = await poolRepository.GetByIdAsync(keyId.Trim(), ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();

            var nowUtc = clock.GetUtcNow().UtcDateTime;
            entry.Label = NormalizeLabel(command.Label, entry.Vendor);
            entry.Notes = NormalizeNotes(command.Notes);
            entry.ProviderIds = NormalizeScopedProviders(entry.Vendor, command.ProviderIds);
            entry.Enabled = command.Enabled;
            entry.UpdatedAtUtc = nowUtc;

            var newSecret = AiCredentialStore.NormalizeOrNull(command.Key);
            if (newSecret is not null)
            {
                var validated = AiCredentialStore.ValidateAndNormalize(newSecret);
                var newFingerprint = AiCredentialStore.ComputeFingerprint(validated);
                var siblings = await poolRepository.ListByVendorAsync(entry.Vendor, ct).ConfigureAwait(false);

                if (siblings.Any(s =>
                        !string.Equals(s.Id, entry.Id, StringComparison.Ordinal) &&
                        string.Equals(s.Fingerprint, newFingerprint, StringComparison.Ordinal)))
                {
                    throw new AiCredentialException(
                        "duplicate-key",
                        $"Another entry under {entry.Vendor} already holds key ••••{AiCredentialStore.ComputeLast4(validated)}.");
                }

                entry.CipherText = protector.Value.Encrypt(validated);
                entry.Fingerprint = newFingerprint;
                entry.Last4 = AiCredentialStore.ComputeLast4(validated);
                entry.RotatedAtUtc = nowUtc;
                entry.CooldownUntilUtc = null;
                entry.CooldownReason = null;
                entry.LastErrorCode = null;
                entry.UsageCountToday = 0;
            }
            else if (command.ClearCooldown || !command.Enabled)
            {
                if (command.ClearCooldown)
                {
                    entry.CooldownUntilUtc = null;
                    entry.CooldownReason = null;
                    entry.LastErrorCode = null;
                }
            }

            await poolRepository.ReplaceAsync(entry, ct).ConfigureAwait(false);

            var vendorEntries = (await poolRepository.ListByVendorAsync(entry.Vendor, ct).ConfigureAwait(false)).ToList();
            await SyncLegacyPrimaryCredentialsCoreAsync(entry.Vendor, vendorEntries, nowUtc, ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }

        InvalidateVendorProviders(entry.Vendor);
        logger.LogInformation(
            "API key updated under vendor {Vendor} ({Label}, fingerprint {Fingerprint}, enabled={Enabled}).",
            entry.Vendor, entry.Label, entry.Fingerprint, entry.Enabled);

        return DescribeEntry(entry, clock.GetUtcNow().UtcDateTime);
    }

    public async Task ReorderVendorAsync(
        string vendor, IReadOnlyList<string> orderedKeyIds, string? actorUserId, CancellationToken ct)
    {
        var normalizedVendor = NormalizeAndValidateVendor(vendor);

        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var current = (await poolRepository.ListByVendorAsync(normalizedVendor, ct).ConfigureAwait(false)).ToList();
            if (current.Count == 0) return;

            var byId = current.ToDictionary(e => e.Id, StringComparer.Ordinal);
            var reordered = new List<AiApiKeyEntry>(current.Count);
            var seen = new HashSet<string>(StringComparer.Ordinal);

            foreach (var rawId in orderedKeyIds ?? [])
            {
                var id = rawId?.Trim();
                if (string.IsNullOrEmpty(id) || !seen.Add(id)) continue;
                if (byId.TryGetValue(id, out var match))
                    reordered.Add(match);
            }

            foreach (var entry in current)
            {
                if (seen.Add(entry.Id))
                    reordered.Add(entry);
            }

            await PersistVendorPrioritiesAsync(reordered, ct).ConfigureAwait(false);
            await SyncLegacyPrimaryCredentialsCoreAsync(
                normalizedVendor, reordered, clock.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }

        InvalidateVendorProviders(normalizedVendor);
        logger.LogInformation("API key priority order updated for vendor {Vendor}.", normalizedVendor);
    }

    public async Task<bool> DeleteKeyAsync(string keyId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(keyId)) return false;

        string vendor;
        string fingerprint;
        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            var entry = await poolRepository.GetByIdAsync(keyId.Trim(), ct).ConfigureAwait(false);
            if (entry is null) return false;

            vendor = entry.Vendor;
            fingerprint = entry.Fingerprint;

            var deleted = await poolRepository.DeleteAsync(entry.Id, ct).ConfigureAwait(false);
            if (!deleted) return false;

            var remaining = (await poolRepository.ListByVendorAsync(vendor, ct).ConfigureAwait(false)).ToList();
            await PersistVendorPrioritiesAsync(remaining, ct).ConfigureAwait(false);
            await SyncLegacyPrimaryCredentialsCoreAsync(
                vendor, remaining, clock.GetUtcNow().UtcDateTime, ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }

        InvalidateVendorProviders(vendor);
        logger.LogInformation("API key removed from vendor {Vendor} (fingerprint {Fingerprint}).", vendor, fingerprint);
        return true;
    }

    public async Task<AiApiKeySnapshot?> ResetKeyStatusAsync(string keyId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(keyId)) return null;

        await WriteGate.WaitAsync(ct).ConfigureAwait(false);
        AiApiKeyEntry? entry;
        try
        {
            entry = await poolRepository.GetByIdAsync(keyId.Trim(), ct).ConfigureAwait(false);
            if (entry is null) return null;

            entry.CooldownUntilUtc = null;
            entry.CooldownReason = null;
            entry.LastErrorCode = null;
            entry.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
            await poolRepository.ReplaceAsync(entry, ct).ConfigureAwait(false);
        }
        finally
        {
            WriteGate.Release();
        }

        InvalidateVendorProviders(entry.Vendor);
        return DescribeEntry(entry, clock.GetUtcNow().UtcDateTime);
    }

    public async Task<AiApiKeyTestVerdict> TestKeyAsync(string keyId, CancellationToken ct)
    {
        var entry = await poolRepository.GetByIdAsync(keyId.Trim(), ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        var secret = DecryptSafely(entry);
        if (secret is null)
        {
            return new AiApiKeyTestVerdict(
                entry.Id, entry.Vendor, entry.Label, false, null,
                "Stored key could not be decrypted with the server's Encryption:DataKey.");
        }

        var nowUtc = clock.GetUtcNow().UtcDateTime;
        var probe = ResolveProbeTarget(entry);
        if (probe is null || httpClientFactory is null)
        {
            entry.LastSucceededAtUtc = nowUtc;
            entry.CooldownUntilUtc = null;
            entry.CooldownReason = null;
            entry.LastErrorCode = null;
            await poolRepository.ReplaceAsync(entry, ct).ConfigureAwait(false);
            InvalidateVendorProviders(entry.Vendor);

            return new AiApiKeyTestVerdict(
                entry.Id, entry.Vendor, entry.Label, true, null,
                "Encrypted key decrypted cleanly (no free metadata probe URL configured for this vendor).");
        }

        try
        {
            var client = httpClientFactory.Create(probe.Value.ProviderId);
            using var req = new HttpRequestMessage(HttpMethod.Get, probe.Value.RelativePath);
            if (probe.Value.UseGoogleHeader)
                req.Headers.Add("x-goog-api-key", secret);
            else
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);

            using var resp = await client.SendAsync(req, ct).ConfigureAwait(false);
            var status = (int)resp.StatusCode;

            if (resp.IsSuccessStatusCode)
            {
                entry.LastUsedAtUtc = nowUtc;
                entry.LastSucceededAtUtc = nowUtc;
                entry.CooldownUntilUtc = null;
                entry.CooldownReason = null;
                entry.LastErrorCode = null;
                await poolRepository.ReplaceAsync(entry, CancellationToken.None).ConfigureAwait(false);
                InvalidateVendorProviders(entry.Vendor);

                return new AiApiKeyTestVerdict(
                    entry.Id, entry.Vendor, entry.Label, true, status,
                    "Verified live with provider API (0 generation quota spent).");
            }

            var payload = await SafeReadBodyAsync(resp, ct).ConfigureAwait(false);
            var identifier = HttpAiProviderBase.ShortErrorIdentifier(payload);

            if (status is 401 or 403 ||
                (status == 400 && identifier is not null && identifier.StartsWith("API_KEY_", StringComparison.OrdinalIgnoreCase)))
            {
                await RecordOutcomeAsync(
                    probe.Value.ProviderId, entry.Id, entry.Fingerprint,
                    AiSecretOutcomeKind.CredentialRejected, identifier ?? $"http-{status}", null, CancellationToken.None)
                    .ConfigureAwait(false);

                return new AiApiKeyTestVerdict(
                    entry.Id, entry.Vendor, entry.Label, false, status,
                    $"API rejected this key ({identifier ?? $"HTTP {status}"}).");
            }

            if (status == 429)
            {
                var isPerDay = identifier is not null &&
                    (identifier.Contains("PerDay", StringComparison.OrdinalIgnoreCase) ||
                     identifier.Contains("Daily", StringComparison.OrdinalIgnoreCase));
                await RecordOutcomeAsync(
                    probe.Value.ProviderId, entry.Id, entry.Fingerprint,
                    isPerDay ? AiSecretOutcomeKind.QuotaExhausted : AiSecretOutcomeKind.RateLimited,
                    isPerDay ? "quota-exhausted" : "rate-limited", null, CancellationToken.None)
                    .ConfigureAwait(false);

                return new AiApiKeyTestVerdict(
                    entry.Id, entry.Vendor, entry.Label, false, status,
                    isPerDay
                        ? $"Key is valid but daily quota is exhausted ({identifier})."
                        : "Key is rate-limited right now (HTTP 429).");
            }

            return new AiApiKeyTestVerdict(
                entry.Id, entry.Vendor, entry.Label, false, status,
                identifier is null ? $"Provider returned HTTP {status}." : $"Provider returned HTTP {status} ({identifier}).");
        }
        catch (AiEndpointException ex)
        {
            return new AiApiKeyTestVerdict(
                entry.Id, entry.Vendor, entry.Label, false, null,
                $"Endpoint policy blocked test: {ex.Rejection}.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new AiApiKeyTestVerdict(
                entry.Id, entry.Vendor, entry.Label, false, null,
                $"Connection failed: {ex.Message}");
        }
    }

    public async Task<(IReadOnlyList<AiSecretCandidate> Candidates, AiSecretPoolCooldown Cooldown)> ResolveCandidatesAsync(
        AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty)
            return ([], AiSecretPoolCooldown.None);

        var vendor = AiProviderVendors.VendorFor(provider.Value);
        var nowUtc = clock.GetUtcNow().UtcDateTime;

        var vendorEntries = await poolRepository.ListByVendorAsync(vendor, ct).ConfigureAwait(false);
        var matching = vendorEntries
            .Where(e => e.ProviderIds.Count == 0 ||
                        e.ProviderIds.Contains(provider.Value, StringComparer.OrdinalIgnoreCase))
            .OrderBy(e => e.Priority)
            .ThenBy(e => e.CreatedAtUtc)
            .ToList();

        var candidates = new List<AiSecretCandidate>();
        var seenFingerprints = new HashSet<string>(StringComparer.Ordinal);
        var suppressedFingerprints = new HashSet<string>(StringComparer.Ordinal);
        var coolingEntries = new List<AiApiKeyEntry>();

        foreach (var entry in matching)
        {
            if (!entry.Enabled)
            {
                if (!string.IsNullOrEmpty(entry.Fingerprint))
                    suppressedFingerprints.Add(entry.Fingerprint);
                continue;
            }

            if (entry.CooldownUntilUtc is { } until && until > nowUtc)
            {
                if (!string.IsNullOrEmpty(entry.Fingerprint))
                    suppressedFingerprints.Add(entry.Fingerprint);
                coolingEntries.Add(entry);
                continue;
            }

            var secret = DecryptSafely(entry);
            if (secret is null) continue;

            if (seenFingerprints.Add(entry.Fingerprint))
                candidates.Add(new AiSecretCandidate(entry.Id, entry.Fingerprint, secret, entry.Label));
        }

        // Fallback to single-key storage / Central Admin / Configuration when no pool entry replaced it,
        // preserving full backwards compatibility and preventing suppressed/disabled keys from leaking back in.
        await AppendLegacyFallbackAsync(
            provider.Value, candidates, seenFingerprints, suppressedFingerprints, ct).ConfigureAwait(false);

        if (candidates.Count == 0 && coolingEntries.Count > 0)
        {
            var earliest = coolingEntries
                .OrderBy(e => e.CooldownUntilUtc)
                .First();
            return ([], new AiSecretPoolCooldown(
                AllInCooldown: true,
                EarliestResetUtc: earliest.CooldownUntilUtc,
                Reason: earliest.CooldownReason ?? "quota-exhausted"));
        }

        return (candidates, AiSecretPoolCooldown.None);
    }

    public async Task<bool> HasInstalledKeysAsync(AiProviderId provider, CancellationToken ct)
    {
        if (provider.IsEmpty) return false;

        var vendor = AiProviderVendors.VendorFor(provider.Value);
        var vendorEntries = await poolRepository.ListByVendorAsync(vendor, ct).ConfigureAwait(false);
        var suppressed = new HashSet<string>(StringComparer.Ordinal);

        foreach (var entry in vendorEntries)
        {
            var applies = entry.ProviderIds.Count == 0 ||
                          entry.ProviderIds.Contains(provider.Value, StringComparer.OrdinalIgnoreCase);
            if (!applies) continue;

            if (entry.Enabled) return true;
            if (!string.IsNullOrEmpty(entry.Fingerprint)) suppressed.Add(entry.Fingerprint);
        }

        var legacy = await legacyRepository.GetAsync(provider.Value, ct).ConfigureAwait(false);
        if (legacy is not null && !suppressed.Contains(legacy.Fingerprint))
            return true;

        if (centralSecrets is not null)
        {
            var central = AiCredentialStore.NormalizeOrNull(
                await centralSecrets.GetAiProviderKeyAsync(provider.Value, ct).ConfigureAwait(false));
            if (central is not null && !suppressed.Contains(AiCredentialStore.ComputeFingerprint(central)))
                return true;
        }

        var fromConfig = AiCredentialStore.NormalizeOrNull(configuration[$"{SecretsSection}:{provider.Value}"]);
        return fromConfig is not null && !suppressed.Contains(AiCredentialStore.ComputeFingerprint(fromConfig));
    }

    public async Task RecordOutcomeAsync(
        AiProviderId provider,
        string? keyId,
        string? fingerprint,
        AiSecretOutcomeKind outcome,
        string? errorCode,
        DateTime? retryAfterUtc,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(keyId)) return;

        var nowUtc = clock.GetUtcNow().UtcDateTime;
        var todayBucket = TodayBucket(nowUtc);

        try
        {
            var entry = await poolRepository.GetByIdAsync(keyId, ct).ConfigureAwait(false);
            if (entry is null) return;

            if (!string.Equals(entry.UsageDayBucket, todayBucket, StringComparison.Ordinal))
            {
                entry.UsageDayBucket = todayBucket;
                entry.UsageCountToday = 0;
                _memoryUsage[entry.Id] = 0;
            }

            var updatedCount = Math.Max(entry.UsageCountToday, _memoryUsage.GetValueOrDefault(entry.Id)) + 1;
            _memoryUsage[entry.Id] = updatedCount;
            entry.UsageCountToday = updatedCount;
            entry.LastUsedAtUtc = nowUtc;

            switch (outcome)
            {
                case AiSecretOutcomeKind.Succeeded:
                    entry.LastSucceededAtUtc = nowUtc;
                    entry.CooldownUntilUtc = null;
                    entry.CooldownReason = null;
                    entry.LastErrorCode = null;
                    break;

                case AiSecretOutcomeKind.QuotaExhausted:
                    entry.CooldownReason = "quota-exhausted";
                    entry.LastErrorCode = errorCode ?? "quota-exhausted";
                    entry.CooldownUntilUtc = ComputeQuotaCooldown(entry.Vendor, nowUtc, retryAfterUtc);
                    break;

                case AiSecretOutcomeKind.RateLimited:
                    entry.CooldownReason = "rate-limited";
                    entry.LastErrorCode = errorCode ?? "rate-limited";
                    entry.CooldownUntilUtc = retryAfterUtc is { } ra && ra > nowUtc
                        ? ra.AddSeconds(2)
                        : nowUtc.AddSeconds(65);
                    break;

                case AiSecretOutcomeKind.CredentialRejected:
                    entry.CooldownReason = "credential-rejected";
                    entry.LastErrorCode = errorCode ?? "credential-rejected";
                    entry.CooldownUntilUtc = nowUtc.AddMinutes(15);
                    break;
            }

            await poolRepository.ReplaceAsync(entry, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Telemetry persistence must never fail or abort an active AI render.
            logger.LogWarning(ex,
                "Could not persist key telemetry for provider {ProviderId} (fingerprint {Fingerprint}).",
                provider.Value, fingerprint);
        }
    }

    internal static DateTime NextQuotaResetUtc(string vendor, DateTime utcNow)
    {
        if (string.Equals(vendor, AiProviderVendors.Google, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows() ? "Pacific Standard Time" : "America/Los_Angeles");
                var local = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
                return TimeZoneInfo.ConvertTimeToUtc(local.Date.AddDays(1), tz);
            }
            catch (TimeZoneNotFoundException)
            {
                var pt = utcNow.AddHours(-8);
                return pt.Date.AddDays(1).AddHours(8);
            }
        }

        return utcNow.Date.AddDays(1);
    }

    private static DateTime ComputeQuotaCooldown(string vendor, DateTime nowUtc, DateTime? retryAfterUtc)
    {
        var nextReset = NextQuotaResetUtc(vendor, nowUtc);
        if (retryAfterUtc is { } explicitUntil && explicitUntil > nowUtc && explicitUntil < nextReset)
            return explicitUntil;
        return nextReset;
    }

    private async Task EnsureBackfilledCoreAsync(CancellationToken ct)
    {
        var legacy = await legacyRepository.ListAsync(ct).ConfigureAwait(false);
        if (legacy.Count == 0) return;

        var existingPool = await poolRepository.ListAsync(ct).ConfigureAwait(false);
        var byVendor = existingPool
            .GroupBy(e => e.Vendor, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

        var grouped = legacy.GroupBy(
            c => (Vendor: AiProviderVendors.VendorFor(c.ProviderId), c.Fingerprint));

        foreach (var group in grouped)
        {
            if (string.IsNullOrWhiteSpace(group.Key.Vendor)) continue;

            byVendor.TryGetValue(group.Key.Vendor, out var vendorEntries);
            vendorEntries ??= [];

            if (vendorEntries.Any(e => string.Equals(e.Fingerprint, group.Key.Fingerprint, StringComparison.Ordinal)))
                continue;

            var first = group.OrderBy(c => c.CreatedAt).First();
            var providers = group.Select(c => c.ProviderId).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var vendorDisplay = AiProviderVendors.Find(group.Key.Vendor)?.DisplayName ?? group.Key.Vendor;
            var label = providers.Count == 1
                ? $"{KnownAiProviders.Find(providers[0])?.DisplayName ?? providers[0]} (Primary)"
                : $"{vendorDisplay} (Primary)";

            var entry = new AiApiKeyEntry
            {
                Vendor = group.Key.Vendor,
                Label = label,
                Notes = "Migrated automatically from single-provider credentials",
                ProviderIds = providers,
                Priority = vendorEntries.Count,
                Enabled = true,
                CipherText = first.CipherText,
                Fingerprint = first.Fingerprint,
                Last4 = first.Last4,
                CreatedByUserId = first.CreatedByUserId,
                CreatedAtUtc = first.CreatedAt,
                UpdatedAtUtc = first.RotatedAt ?? first.CreatedAt,
                RotatedAtUtc = first.RotatedAt
            };

            await poolRepository.InsertAsync(entry, ct).ConfigureAwait(false);
            vendorEntries.Add(entry);
            byVendor[group.Key.Vendor] = vendorEntries;
            InvalidateVendorProviders(group.Key.Vendor);
        }
    }

    private async Task SyncLegacyPrimaryCredentialsCoreAsync(
        string vendor, List<AiApiKeyEntry> vendorEntries, DateTime nowUtc, CancellationToken ct)
    {
        var sorted = vendorEntries
            .OrderBy(e => e.Priority)
            .ThenBy(e => e.CreatedAtUtc)
            .ToList();

        var vendorProviders = AiProviderVendors.ProvidersForVendor(vendor)
            .Concat(sorted.SelectMany(e => e.ProviderIds))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (var pid in vendorProviders)
        {
            var primary = sorted.FirstOrDefault(e =>
                e.Enabled &&
                (e.ProviderIds.Count == 0 ||
                 e.ProviderIds.Contains(pid, StringComparer.OrdinalIgnoreCase)));

            var existingLegacy = await legacyRepository.GetAsync(pid, ct).ConfigureAwait(false);

            if (primary is null)
            {
                if (existingLegacy is not null)
                    await legacyRepository.DeleteAsync(pid, ct).ConfigureAwait(false);
                continue;
            }

            if (existingLegacy is not null &&
                string.Equals(existingLegacy.Fingerprint, primary.Fingerprint, StringComparison.Ordinal) &&
                string.Equals(existingLegacy.CipherText, primary.CipherText, StringComparison.Ordinal))
            {
                continue;
            }

            var synced = new AiCredential
            {
                Id = existingLegacy?.Id ?? string.Empty,
                ProviderId = pid,
                CipherText = primary.CipherText,
                Fingerprint = primary.Fingerprint,
                Last4 = primary.Last4,
                CreatedByUserId = existingLegacy?.CreatedByUserId ?? primary.CreatedByUserId,
                CreatedAt = existingLegacy?.CreatedAt ?? primary.CreatedAtUtc,
                RotatedAt = existingLegacy is null ? primary.RotatedAtUtc : nowUtc
            };

            await legacyRepository.UpsertAsync(synced, ct).ConfigureAwait(false);
        }
    }

    private async Task AppendLegacyFallbackAsync(
        string providerId,
        List<AiSecretCandidate> candidates,
        HashSet<string> seenFingerprints,
        HashSet<string> suppressedFingerprints,
        CancellationToken ct)
    {
        var legacy = await legacyRepository.GetAsync(providerId, ct).ConfigureAwait(false);
        if (legacy is not null &&
            !suppressedFingerprints.Contains(legacy.Fingerprint) &&
            seenFingerprints.Add(legacy.Fingerprint))
        {
            try
            {
                var decrypted = protector.Value.Decrypt(legacy.CipherText);
                if (!string.IsNullOrEmpty(decrypted))
                    candidates.Add(new AiSecretCandidate(null, legacy.Fingerprint, decrypted, "Legacy Primary"));
            }
            catch (CryptographicException)
            {
                // Logged elsewhere when single-key store resolves directly; keep failing safely.
            }
        }

        if (centralSecrets is not null)
        {
            var central = AiCredentialStore.NormalizeOrNull(
                await centralSecrets.GetAiProviderKeyAsync(providerId, ct).ConfigureAwait(false));
            if (central is not null)
            {
                var fp = AiCredentialStore.ComputeFingerprint(central);
                if (!suppressedFingerprints.Contains(fp) && seenFingerprints.Add(fp))
                    candidates.Add(new AiSecretCandidate(null, fp, central, "Central Admin"));
            }
        }

        var fromConfig = AiCredentialStore.NormalizeOrNull(configuration[$"{SecretsSection}:{providerId}"]);
        if (fromConfig is not null)
        {
            var fp = AiCredentialStore.ComputeFingerprint(fromConfig);
            if (!suppressedFingerprints.Contains(fp) && seenFingerprints.Add(fp))
                candidates.Add(new AiSecretCandidate(null, fp, fromConfig, "Environment Configuration"));
        }
    }

    private async Task<List<(string ProviderId, string Fingerprint, string Last4)>> ReadHostConfiguredKeysAsync(
        CancellationToken ct)
    {
        var list = new Dictionary<(string ProviderId, string Fingerprint), string>();

        if (centralSecrets is not null)
        {
            var centralKeys = await centralSecrets.GetAllAiProviderKeysAsync(ct).ConfigureAwait(false);
            foreach (var entry in centralKeys)
            {
                var value = AiCredentialStore.NormalizeOrNull(entry.Value);
                if (value is null) continue;
                list[(entry.Key, AiCredentialStore.ComputeFingerprint(value))] = AiCredentialStore.ComputeLast4(value);
            }
        }

        foreach (var entry in configuration.GetSection(SecretsSection).GetChildren())
        {
            var value = AiCredentialStore.NormalizeOrNull(entry.Value);
            if (value is null) continue;
            list.TryAdd((entry.Key, AiCredentialStore.ComputeFingerprint(value)), AiCredentialStore.ComputeLast4(value));
        }

        return [.. list.Select(kvp => (kvp.Key.ProviderId, kvp.Key.Fingerprint, kvp.Value))];
    }

    private static AiApiKeyVendorSnapshot BuildVendorSnapshot(
        AiVendorDescriptor vendor,
        IReadOnlyList<AiApiKeyEntry> allPool,
        IReadOnlyList<(string ProviderId, string Fingerprint, string Last4)> hostReadOnly,
        DateTime nowUtc,
        string todayBucket)
    {
        var keys = allPool
            .Where(k => string.Equals(k.Vendor, vendor.Id, StringComparison.OrdinalIgnoreCase))
            .OrderBy(k => k.Priority)
            .ThenBy(k => k.CreatedAtUtc)
            .Select(k => DescribeEntry(k, nowUtc, todayBucket))
            .ToList();

        var existingFingerprints = keys
            .Select(k => k.Fingerprint)
            .Where(f => !string.IsNullOrEmpty(f))
            .ToHashSet(StringComparer.Ordinal);

        var vendorHostEntries = hostReadOnly
            .Where(h => string.Equals(AiProviderVendors.VendorFor(h.ProviderId), vendor.Id, StringComparison.OrdinalIgnoreCase)
                     && !existingFingerprints.Contains(h.Fingerprint))
            .GroupBy(h => h.Fingerprint, StringComparer.Ordinal);

        var idx = keys.Count;
        foreach (var grp in vendorHostEntries)
        {
            var first = grp.First();
            keys.Add(new AiApiKeySnapshot(
                Id: $"config:{vendor.Id}:{first.Fingerprint}",
                Vendor: vendor.Id,
                Label: "Central Admin / Host Config",
                Notes: "Supplied read-only from Central Admin or server environment.",
                ProviderIds: grp.Select(x => x.ProviderId).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                Priority: idx++,
                Enabled: true,
                Source: AiCredentialSource.Configuration,
                Masked: $"••••{first.Last4}",
                Fingerprint: first.Fingerprint,
                CreatedAtUtc: null,
                UpdatedAtUtc: null,
                RotatedAtUtc: null,
                LastUsedAtUtc: null,
                LastSucceededAtUtc: null,
                CooldownUntilUtc: null,
                CooldownReason: null,
                LastErrorCode: null,
                UsageDayBucket: null,
                UsageCountToday: 0,
                Status: AiApiKeyHealthStatus.Ready));
        }

        return new AiApiKeyVendorSnapshot(
            vendor.Id,
            vendor.DisplayName,
            vendor.Description,
            vendor.KeyUrl,
            vendor.ExpandedByDefault || keys.Count > 0,
            vendor.ProviderIds,
            keys);
    }

    private static AiApiKeySnapshot DescribeEntry(
        AiApiKeyEntry entry, DateTime nowUtc, string? todayBucket = null)
    {
        todayBucket ??= TodayBucket(nowUtc);
        var countToday = string.Equals(entry.UsageDayBucket, todayBucket, StringComparison.Ordinal)
            ? entry.UsageCountToday
            : 0;

        var activeCooldown = entry.CooldownUntilUtc is { } until && until > nowUtc ? until : (DateTime?)null;
        var status = !entry.Enabled
            ? AiApiKeyHealthStatus.Disabled
            : activeCooldown is null
                ? AiApiKeyHealthStatus.Ready
                : entry.CooldownReason switch
                {
                    "quota-exhausted" => AiApiKeyHealthStatus.QuotaExhausted,
                    "credential-rejected" => AiApiKeyHealthStatus.Rejected,
                    _ => AiApiKeyHealthStatus.Cooldown
                };

        return new AiApiKeySnapshot(
            entry.Id,
            entry.Vendor,
            entry.Label,
            entry.Notes,
            entry.ProviderIds.ToList(),
            entry.Priority,
            entry.Enabled,
            AiCredentialSource.Database,
            string.IsNullOrEmpty(entry.Last4) ? string.Empty : $"••••{entry.Last4}",
            entry.Fingerprint,
            entry.CreatedAtUtc,
            entry.UpdatedAtUtc,
            entry.RotatedAtUtc,
            entry.LastUsedAtUtc,
            entry.LastSucceededAtUtc,
            activeCooldown,
            activeCooldown is null ? null : entry.CooldownReason,
            activeCooldown is null ? null : entry.LastErrorCode,
            todayBucket,
            countToday,
            status);
    }

    private async Task PersistVendorPrioritiesAsync(List<AiApiKeyEntry> entries, CancellationToken ct)
    {
        for (var i = 0; i < entries.Count; i++)
        {
            if (entries[i].Priority != i)
                entries[i].Priority = i;
            await poolRepository.ReplaceAsync(entries[i], ct).ConfigureAwait(false);
        }
    }

    private string? DecryptSafely(AiApiKeyEntry entry)
    {
        try
        {
            return protector.Value.Decrypt(entry.CipherText);
        }
        catch (CryptographicException ex)
        {
            logger.LogError(ex,
                "Stored API key {KeyId} under vendor {Vendor} could not be decrypted.",
                entry.Id, entry.Vendor);
            return null;
        }
    }

    private void InvalidateVendorProviders(string vendor)
    {
        foreach (var pid in AiProviderVendors.ProvidersForVendor(vendor))
        {
            if (AiProviderId.TryParse(pid, out var id))
                resolver.Invalidate(id);
        }
    }

    private (AiProviderId ProviderId, string RelativePath, bool UseGoogleHeader)? ResolveProbeTarget(AiApiKeyEntry entry)
    {
        var opts = aiOptions?.CurrentValue;
        var vendorProviders = AiProviderVendors.ProvidersForVendor(entry.Vendor);
        var scoped = entry.ProviderIds.Count > 0 ? entry.ProviderIds : vendorProviders;
        var candidateProviderIds = scoped
            .Concat(vendorProviders)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(pid => AiProviderId.TryParse(pid, out _))
            .ToList();

        if (string.Equals(entry.Vendor, AiProviderVendors.Google, StringComparison.OrdinalIgnoreCase))
        {
            // Prefer native v1beta endpoints (gemini-tts / gemini-image) for GET /models so
            // x-goog-api-key never hits the /openai compatibility path which rejects /models with 404.
            foreach (var pidRaw in candidateProviderIds)
            {
                var pid = AiProviderId.Parse(pidRaw);
                var configured = opts?.ProviderFor(pid);
                if (configured is null || string.IsNullOrWhiteSpace(configured.BaseUrl)) continue;

                var normalizedBase = configured.BaseUrl.Trim().TrimEnd('/');
                if (!normalizedBase.EndsWith("/openai", StringComparison.OrdinalIgnoreCase))
                    return (pid, "models", UseGoogleHeader: true);
            }

            foreach (var pidRaw in candidateProviderIds)
            {
                var pid = AiProviderId.Parse(pidRaw);
                var configured = opts?.ProviderFor(pid);
                if (configured is null || string.IsNullOrWhiteSpace(configured.BaseUrl)) continue;
                return (pid, "models", UseGoogleHeader: false);
            }

            return null;
        }

        foreach (var pidRaw in candidateProviderIds)
        {
            var pid = AiProviderId.Parse(pidRaw);
            var configured = opts?.ProviderFor(pid);
            if (configured is null || string.IsNullOrWhiteSpace(configured.BaseUrl)) continue;

            if (entry.Vendor is AiProviderVendors.Groq or AiProviderVendors.OpenRouter or AiProviderVendors.Together or AiProviderVendors.OpenAiCompatible)
                return (pid, "models", UseGoogleHeader: false);
        }

        return null;
    }

    private static string NormalizeAndValidateVendor(string vendor)
    {
        var normalized = AiProviderVendors.NormalizeVendor(vendor);
        if (string.IsNullOrWhiteSpace(normalized))
            throw new AiCredentialException("vendor-invalid", "Choose a valid provider vendor group.");
        return normalized;
    }

    private static string NormalizeLabel(string? label, string vendor)
    {
        var trimmed = label?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            trimmed = $"{AiProviderVendors.Find(vendor)?.DisplayName ?? vendor} Key";
        return trimmed.Length <= MaxLabelLength ? trimmed : trimmed[..MaxLabelLength].Trim();
    }

    private static string? NormalizeNotes(string? notes)
    {
        var trimmed = notes?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return trimmed.Length <= MaxNotesLength ? trimmed : trimmed[..MaxNotesLength].Trim();
    }

    private static List<string> NormalizeScopedProviders(string vendor, IReadOnlyList<string>? requested)
    {
        if (requested is null || requested.Count == 0) return [];

        var allowed = AiProviderVendors.ProvidersForVendor(vendor)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var cleaned = requested
            .Select(p => p?.Trim().ToLowerInvariant() ?? string.Empty)
            .Where(p => !string.IsNullOrEmpty(p) && (allowed.Count == 0 || allowed.Contains(p)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Selecting every provider in the vendor is equivalent to "All in vendor".
        return allowed.Count > 0 && cleaned.Count == allowed.Count ? [] : cleaned;
    }

    private static string TodayBucket(DateTime nowUtc) => nowUtc.ToString("yyyy-MM-dd");

    private static async Task<string?> SafeReadBodyAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            return await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }
}
