namespace AnimStudio.Domain.Publishing;

/// <summary>
/// A YouTube channel one user has connected for publishing, at rest.
/// <para>
/// Like <c>LiveStreamKey</c>, there is deliberately no plaintext property: the OAuth refresh
/// token is decrypted inside the connection store, traded for a short-lived access token at
/// the moment an upload starts, and never held on an entity that could be serialized into a
/// response or a log line.
/// </para>
/// <para>
/// A user can connect several channels (a personal one and brand channels) by signing in
/// once per channel - Google's consent screen is where the channel is chosen.
/// </para>
/// </summary>
public sealed class YouTubeChannelConnection
{
    /// <summary><c>{userId}:{channelId}</c> - one connection per user per channel.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>YouTube's own channel id, <c>UC…</c>.</summary>
    public string ChannelId { get; set; } = string.Empty;

    public string ChannelTitle { get; set; } = string.Empty;
    public string? ChannelHandle { get; set; }
    public string? ThumbnailUrl { get; set; }

    /// <summary>AES-256-GCM ciphertext of the refresh token, base64. Meaningless without the configured data key.</summary>
    public string RefreshTokenCipher { get; set; } = string.Empty;

    /// <summary>The scopes Google actually granted, space-separated.</summary>
    public string Scopes { get; set; } = string.Empty;

    public DateTime ConnectedAt { get; set; }
    public DateTime? LastUploadAt { get; set; }

    /// <summary>
    /// When Google last refused the refresh token (revoked in the Google account, password
    /// change, or the 7-day expiry of an app still in "Testing"). Cleared by reconnecting.
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    public static string IdFor(string userId, string channelId) => $"{userId}:{channelId}";
}
