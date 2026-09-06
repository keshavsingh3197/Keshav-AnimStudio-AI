using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Stores AI results in the object store, so the cache survives a restart and moves to
/// cloud storage with everything else rather than being a second thing to migrate.
/// </summary>
/// <remarks>
/// Each entry is two objects: the payload, then a small metadata document. They are
/// written in that order and the metadata is the commit marker, so a process that dies
/// mid-write leaves an orphan payload that simply reads as a miss - never a truncated
/// result presented as a real one.
/// </remarks>
public sealed class AiResultCache(
    IObjectStore store,
    IOptionsMonitor<AiOptions> options,
    TimeProvider clock,
    ILogger<AiResultCache> logger) : IAiResultCache
{
    private static readonly JsonSerializerOptions Json = new() { WriteIndented = false };

    public async Task<AiCacheEntry?> TryGetAsync(AiCacheKey key, CancellationToken ct)
    {
        if (!options.CurrentValue.Cache.Enabled || key.IsEmpty) return null;

        try
        {
            var metadata = await ReadMetadataAsync(key, ct).ConfigureAwait(false);
            if (metadata is null) return null;

            await using var payload = await store.OpenAsync(key.StorageKey, ct).ConfigureAwait(false);
            if (payload is null) return null;

            using var buffer = new MemoryStream();
            await payload.CopyToAsync(buffer, ct).ConfigureAwait(false);

            return new AiCacheEntry(
                buffer.ToArray(),
                metadata.ContentType,
                metadata.ProviderId,
                metadata.Model,
                metadata.CreatedAtUtc,
                metadata.DurationSeconds,
                metadata.Format,
                metadata.Language);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A cache is an optimisation. A corrupt or unreadable entry must cost a
            // regeneration, never the caller's request.
            logger.LogWarning(ex, "Could not read an AI cache entry; treating it as a miss.");
            return null;
        }
    }

    public async Task SaveAsync(AiCacheKey key, AiCacheEntry entry, CancellationToken ct)
    {
        if (!options.CurrentValue.Cache.Enabled || key.IsEmpty) return;

        try
        {
            using var payload = new MemoryStream(entry.Content, writable: false);
            await store.SaveAsync(key.StorageKey, payload, entry.ContentType, ct).ConfigureAwait(false);

            var metadata = new CacheMetadata(
                entry.ContentType, entry.ProviderId, entry.Model,
                clock.GetUtcNow().UtcDateTime, entry.DurationSeconds, entry.Format, entry.Language);

            using var metaStream = new MemoryStream(
                JsonSerializer.SerializeToUtf8Bytes(metadata, Json), writable: false);

            await store.SaveAsync(key.MetadataKey, metaStream, "application/json", ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Failing to cache a result is not failing to produce it.
            logger.LogWarning(ex, "Could not write an AI cache entry.");
        }
    }

    private async Task<CacheMetadata?> ReadMetadataAsync(AiCacheKey key, CancellationToken ct)
    {
        await using var stream = await store.OpenAsync(key.MetadataKey, ct).ConfigureAwait(false);
        if (stream is null) return null;

        return await JsonSerializer
            .DeserializeAsync<CacheMetadata>(stream, Json, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// The optional fields exist because a speech result carries a duration and a
    /// transcription carries a format and a language - facts that cannot be recovered from
    /// the bytes without decoding them, and that a cache hit would otherwise silently lose.
    /// </summary>
    private sealed record CacheMetadata(
        string ContentType,
        string ProviderId,
        string? Model,
        DateTime CreatedAtUtc,
        double? DurationSeconds,
        string? Format,
        string? Language);
}
