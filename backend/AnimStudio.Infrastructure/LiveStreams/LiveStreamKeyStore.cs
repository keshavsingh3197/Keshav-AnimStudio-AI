using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.LiveStreams;
using KeshavSingh.Security;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.LiveStreams;

public sealed class LiveStreamKeyException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>
/// Saved stream keys, one per brand channel per destination, encrypted at rest with the same
/// AES-256-GCM data protector as AI provider keys. Nothing here returns a key except
/// <see cref="GetKeyAsync"/>, which the stream runner calls at the moment it connects;
/// everything else returns a masked status.
/// </summary>
public sealed class LiveStreamKeyStore(
    ILiveStreamKeyRepository repository,
    Lazy<DataProtector> protector,
    TimeProvider clock,
    ILogger<LiveStreamKeyStore> logger)
{
    public async Task<IReadOnlyList<LiveStreamKeyStatus>> DescribeAllAsync(CancellationToken ct)
    {
        var stored = await repository.ListAsync(ct).ConfigureAwait(false);
        return [.. stored.Select(Describe)];
    }

    public async Task<LiveStreamKeyStatus> DescribeAsync(string channelId, string destinationId, CancellationToken ct)
    {
        var stored = await repository.GetAsync(LiveStreamKey.IdFor(channelId, destinationId), ct).ConfigureAwait(false);
        return stored is null ? Missing(channelId, destinationId) : Describe(stored);
    }

    public async Task<LiveStreamKeyStatus> SetAsync(
        string channelId, string destinationId, string? streamKey, string? actorUserId, CancellationToken ct)
    {
        if (LiveStreamValidator.ValidateStreamKey(streamKey) is { } error)
            throw new LiveStreamKeyException("stream-key-invalid", error);

        var key = streamKey!.Trim();
        var now = clock.GetUtcNow().UtcDateTime;
        var id = LiveStreamKey.IdFor(channelId, destinationId);
        var existing = await repository.GetAsync(id, ct).ConfigureAwait(false);

        var saved = new LiveStreamKey
        {
            Id = id,
            ChannelId = channelId,
            DestinationId = destinationId,
            CipherText = protector.Value.Encrypt(key),
            Fingerprint = Fingerprint(key),
            Last4 = key[^4..],
            CreatedByUserId = existing?.CreatedByUserId ?? actorUserId,
            CreatedAt = existing?.CreatedAt ?? now,
            RotatedAt = existing is null ? null : now,
            // A new key starts clean: the old one's history says nothing about it.
            LastUsedAt = null,
            RejectedAt = null
        };

        await repository.UpsertAsync(saved, ct).ConfigureAwait(false);

        logger.LogInformation("Stream key {Action} for channel {ChannelId} on {Destination} (fingerprint {Fingerprint})",
            existing is null ? "saved" : "replaced", channelId, destinationId, saved.Fingerprint);

        return Describe(saved);
    }

    public async Task<bool> DeleteAsync(string channelId, string destinationId, CancellationToken ct)
    {
        var removed = await repository.DeleteAsync(LiveStreamKey.IdFor(channelId, destinationId), ct).ConfigureAwait(false);
        if (removed)
            logger.LogInformation("Stream key removed for channel {ChannelId} on {Destination}", channelId, destinationId);
        return removed;
    }

    /// <summary>Removes every saved key of a channel, when the channel itself is deleted.</summary>
    public async Task<int> DeleteChannelAsync(string channelId, CancellationToken ct)
    {
        var removed = 0;
        foreach (var key in (await repository.ListAsync(ct).ConfigureAwait(false)).Where(k => k.ChannelId == channelId))
        {
            if (await repository.DeleteAsync(key.Id, ct).ConfigureAwait(false)) removed++;
        }

        if (removed > 0)
            logger.LogInformation("Removed {Count} stream key(s) of deleted channel {ChannelId}", removed, channelId);
        return removed;
    }

    /// <summary>
    /// The plaintext key and its fingerprint, for the stream that is about to connect - or
    /// null with the reason the saved key can't be used.
    /// </summary>
    public async Task<(string? Key, string? Fingerprint, LiveStreamKeyState State)> GetKeyAsync(
        string channelId, string destinationId, CancellationToken ct)
    {
        var stored = await repository.GetAsync(LiveStreamKey.IdFor(channelId, destinationId), ct).ConfigureAwait(false);
        if (stored is null) return (null, null, LiveStreamKeyState.Missing);
        if (stored.RejectedAt is not null) return (null, stored.Fingerprint, LiveStreamKeyState.Rejected);

        try
        {
            return (protector.Value.Decrypt(stored.CipherText), stored.Fingerprint, LiveStreamKeyState.Saved);
        }
        catch (CryptographicException ex)
        {
            logger.LogError(ex,
                "The saved stream key for channel {ChannelId} on {Destination} could not be decrypted. " +
                "If Encryption:DataKey was rotated, add the previous key to Encryption:PreviousDataKeys, or save the stream key again.",
                channelId, destinationId);
            return (null, stored.Fingerprint, LiveStreamKeyState.Unreadable);
        }
    }

    /// <summary>
    /// Records that the ingest refused the key. Only if it is still the same key: an admin
    /// may have replaced it while the failing stream was connecting.
    /// </summary>
    public Task MarkRejectedAsync(string channelId, string destinationId, string fingerprint, CancellationToken ct) =>
        UpdateIfSameAsync(channelId, destinationId, fingerprint, key => key.RejectedAt = clock.GetUtcNow().UtcDateTime, ct);

    public Task MarkUsedAsync(string channelId, string destinationId, string fingerprint, CancellationToken ct) =>
        UpdateIfSameAsync(channelId, destinationId, fingerprint, key =>
        {
            key.LastUsedAt = clock.GetUtcNow().UtcDateTime;
            key.RejectedAt = null;
        }, ct);

    private async Task UpdateIfSameAsync(
        string channelId, string destinationId, string fingerprint, Action<LiveStreamKey> change, CancellationToken ct)
    {
        var stored = await repository.GetAsync(LiveStreamKey.IdFor(channelId, destinationId), ct).ConfigureAwait(false);
        if (stored is null || !string.Equals(stored.Fingerprint, fingerprint, StringComparison.Ordinal)) return;

        change(stored);
        await repository.UpsertAsync(stored, ct).ConfigureAwait(false);
    }

    public static LiveStreamKeyStatus Missing(string channelId, string destinationId) =>
        new(channelId, destinationId, LiveStreamKeyState.Missing, string.Empty, null, null, null, null, null);

    private static LiveStreamKeyStatus Describe(LiveStreamKey key) => new(
        key.ChannelId,
        key.DestinationId,
        key.RejectedAt is null ? LiveStreamKeyState.Saved : LiveStreamKeyState.Rejected,
        $"••••{key.Last4}",
        key.Fingerprint,
        key.CreatedAt,
        key.RotatedAt,
        key.LastUsedAt,
        key.RejectedAt);

    /// <summary>Eight hex characters of SHA-256: confirms which key is saved, useless to anyone who reads it.</summary>
    public static string Fingerprint(string key) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(key)))[..8];
}
