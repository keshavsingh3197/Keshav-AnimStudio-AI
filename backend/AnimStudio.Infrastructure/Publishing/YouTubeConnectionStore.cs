using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Security;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>What the UI may know about a connected channel: never the token.</summary>
public sealed record YouTubeConnectionStatus(
    string ChannelId,
    string ChannelTitle,
    string? ChannelHandle,
    string? ThumbnailUrl,
    DateTime ConnectedAt,
    DateTime? LastUploadAt,
    bool NeedsReconnect);

/// <summary>
/// Sign-ins that have been started but not finished: the random <c>state</c> sent to Google,
/// the PKCE verifier that goes with it, and whose sign-in it is. Single-use and short-lived,
/// so a <c>state</c> seen in a browser history or a referrer is worthless.
/// </summary>
public sealed class YouTubeOAuthStateCache(TimeProvider clock)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private const int MaxPending = 1000;

    private readonly ConcurrentDictionary<string, Pending> _pending = new(StringComparer.Ordinal);

    public sealed record Pending(string UserId, string CodeVerifier, string ReturnPath, DateTime ExpiresAt);

    public (string State, string CodeChallenge) Create(string userId, string returnPath)
    {
        Prune();
        if (_pending.Count >= MaxPending)
            throw new YouTubePublishException("youtube-busy", "Too many sign-ins are in progress. Try again in a few minutes.");

        var state = Base64Url(RandomNumberGenerator.GetBytes(32));
        var verifier = Base64Url(RandomNumberGenerator.GetBytes(48));
        _pending[state] = new Pending(userId, verifier, returnPath, clock.GetUtcNow().UtcDateTime + Lifetime);

        return (state, Base64Url(SHA256.HashData(Encoding.ASCII.GetBytes(verifier))));
    }

    /// <summary>The pending sign-in for this state, removed so it can't be used twice - or null if unknown, expired or someone else's.</summary>
    public Pending? Take(string state, string userId)
    {
        if (!_pending.TryRemove(state, out var pending)) return null;
        if (pending.ExpiresAt < clock.GetUtcNow().UtcDateTime) return null;
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(pending.UserId), Encoding.UTF8.GetBytes(userId))
            ? pending
            : null;
    }

    private void Prune()
    {
        var now = clock.GetUtcNow().UtcDateTime;
        foreach (var (key, value) in _pending)
        {
            if (value.ExpiresAt < now) _pending.TryRemove(key, out _);
        }
    }

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

/// <summary>
/// Connected YouTube channels per user. Refresh tokens are encrypted at rest with the same
/// AES-256-GCM data protector as AI provider keys and stream keys, and leave this class
/// only as a short-lived access token for an upload that is about to start.
/// </summary>
public sealed partial class YouTubeConnectionStore(
    IYouTubeConnectionRepository repository,
    YouTubeOAuthClient oauth,
    YouTubeOAuthStateCache pending,
    Lazy<DataProtector> protector,
    TimeProvider clock,
    ILogger<YouTubeConnectionStore> logger)
{
    public async Task<IReadOnlyList<YouTubeConnectionStatus>> ListAsync(string userId, CancellationToken ct)
    {
        var stored = await repository.ListByUserAsync(userId, ct).ConfigureAwait(false);
        return [.. stored.Select(Describe)];
    }

    /// <summary>Where to send the browser to pick and approve a channel.</summary>
    /// <param name="returnPath">An in-app path to come back to; anything else is replaced with <c>/</c>.</param>
    public string BeginConnect(string userId, string? returnPath)
    {
        if (!oauth.IsConfigured)
            throw new YouTubePublishException("youtube-not-configured",
                "Publishing to YouTube isn't set up on this server. Ask an admin to set YouTube:Publish:ClientId, ClientSecret and RedirectUri.");

        // Checked before the round trip to Google, not after the user has approved access.
        try
        {
            _ = protector.Value;
        }
        catch (InvalidOperationException)
        {
            throw new YouTubePublishException("encryption-not-configured",
                "Connected channels are stored encrypted, and Encryption:DataKey isn't set on this server. Ask an admin to set it.");
        }

        var (state, challenge) = pending.Create(userId, SafeReturnPath(returnPath));
        return oauth.BuildAuthorizationUrl(state, challenge);
    }

    public async Task<(YouTubeConnectionStatus Connection, string ReturnPath)> CompleteConnectAsync(
        string userId, string? code, string? state, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(state) || state.Length > 128
            || pending.Take(state, userId) is not { } started)
        {
            throw new YouTubePublishException("youtube-state-invalid",
                "This sign-in link has expired or was already used. Start connecting the channel again.");
        }

        if (string.IsNullOrWhiteSpace(code) || code.Length > 2048)
            throw new YouTubePublishException("youtube-code-missing", "Google didn't send back a sign-in code. Start connecting the channel again.");

        var tokens = await oauth.ExchangeCodeAsync(code, started.CodeVerifier, ct).ConfigureAwait(false);

        if (!tokens.Scope.Contains("youtube.upload", StringComparison.Ordinal))
        {
            await oauth.RevokeAsync(tokens.RefreshToken ?? tokens.AccessToken, ct).ConfigureAwait(false);
            throw new YouTubePublishException("youtube-scope-missing",
                "Permission to upload videos wasn't granted. Connect again and leave \"Manage your YouTube videos\" ticked.");
        }

        if (string.IsNullOrEmpty(tokens.RefreshToken))
            throw new YouTubePublishException("youtube-no-refresh-token",
                "Google didn't grant lasting access. Remove AnimStudio under myaccount.google.com/permissions, then connect again.");

        var channel = await oauth.GetMyChannelAsync(tokens.AccessToken, ct).ConfigureAwait(false);
        var now = clock.GetUtcNow().UtcDateTime;
        var id = YouTubeChannelConnection.IdFor(userId, channel.Id);
        var existing = await repository.GetAsync(id, ct).ConfigureAwait(false);

        var saved = new YouTubeChannelConnection
        {
            Id = id,
            UserId = userId,
            ChannelId = channel.Id,
            ChannelTitle = Truncate(channel.Title, 200),
            ChannelHandle = channel.Handle is null ? null : Truncate(channel.Handle, 100),
            ThumbnailUrl = channel.ThumbnailUrl,
            RefreshTokenCipher = protector.Value.Encrypt(tokens.RefreshToken),
            Scopes = tokens.Scope,
            ConnectedAt = existing?.ConnectedAt ?? now,
            LastUploadAt = existing?.LastUploadAt,
            RevokedAt = null
        };
        await repository.UpsertAsync(saved, ct).ConfigureAwait(false);

        logger.LogInformation("YouTube channel {ChannelId} {Action} for user {UserId}",
            channel.Id, existing is null ? "connected" : "reconnected", userId);

        return (Describe(saved), started.ReturnPath);
    }

    public async Task<bool> DisconnectAsync(string userId, string channelId, CancellationToken ct)
    {
        var id = YouTubeChannelConnection.IdFor(userId, channelId);
        var stored = await repository.GetAsync(id, ct).ConfigureAwait(false);
        if (stored is null) return false;

        if (TryDecrypt(stored) is { } refreshToken)
            await oauth.RevokeAsync(refreshToken, ct).ConfigureAwait(false);

        var removed = await repository.DeleteAsync(id, ct).ConfigureAwait(false);
        if (removed) logger.LogInformation("YouTube channel {ChannelId} disconnected for user {UserId}", channelId, userId);
        return removed;
    }

    public async Task<YouTubeChannelConnection?> GetAsync(string userId, string channelId, CancellationToken ct) =>
        await repository.GetAsync(YouTubeChannelConnection.IdFor(userId, channelId), ct).ConfigureAwait(false);

    /// <summary>A fresh access token for an upload. Marks the connection for reconnecting if Google refuses it.</summary>
    public async Task<string> GetAccessTokenAsync(string userId, string channelId, CancellationToken ct)
    {
        var stored = await GetAsync(userId, channelId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("youtube-channel-not-connected", "That channel isn't connected any more. Connect it again.");

        var refreshToken = TryDecrypt(stored)
            ?? throw new YouTubePublishException("youtube-reconnect",
                "The saved YouTube access for this channel can't be read on this server. Connect the channel again.");

        try
        {
            return (await oauth.RefreshAsync(refreshToken, ct).ConfigureAwait(false)).AccessToken;
        }
        catch (YouTubePublishException ex) when (ex.Code == "youtube-reconnect")
        {
            stored.RevokedAt = clock.GetUtcNow().UtcDateTime;
            await repository.UpsertAsync(stored, CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    public async Task MarkUploadedAsync(string userId, string channelId, CancellationToken ct)
    {
        var stored = await GetAsync(userId, channelId, ct).ConfigureAwait(false);
        if (stored is null) return;
        stored.LastUploadAt = clock.GetUtcNow().UtcDateTime;
        await repository.UpsertAsync(stored, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Only an in-app path survives: a leading single slash and URL-safe characters. Anything
    /// else - another host, <c>//evil</c>, a <c>javascript:</c> URL - becomes <c>/</c>, so the
    /// callback can never be turned into an open redirect.
    /// </summary>
    public static string SafeReturnPath(string? path) =>
        path is { Length: > 0 and <= 300 } && ReturnPathPattern().IsMatch(path) ? path : "/";

    private string? TryDecrypt(YouTubeChannelConnection stored)
    {
        try
        {
            return protector.Value.Decrypt(stored.RefreshTokenCipher);
        }
        catch (CryptographicException ex)
        {
            logger.LogError(ex,
                "The saved YouTube token for channel {ChannelId} could not be decrypted. " +
                "If Encryption:DataKey was rotated, add the previous key to Encryption:PreviousDataKeys, or reconnect the channel.",
                stored.ChannelId);
            return null;
        }
    }

    private static YouTubeConnectionStatus Describe(YouTubeChannelConnection c) =>
        new(c.ChannelId, c.ChannelTitle, c.ChannelHandle, c.ThumbnailUrl, c.ConnectedAt, c.LastUploadAt, c.RevokedAt is not null);

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

    [GeneratedRegex(@"^/(?![/\\])[A-Za-z0-9\-._~/?=&%]*$")]
    private static partial Regex ReturnPathPattern();
}
