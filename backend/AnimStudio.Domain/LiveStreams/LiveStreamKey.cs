namespace AnimStudio.Domain.LiveStreams;

/// <summary>
/// A saved stream key for one brand channel and one destination, at rest.
/// <para>
/// Like <c>AiCredential</c>, there is deliberately no plaintext property: the key is
/// decrypted inside the key store, handed straight to the stream that needs it, and never
/// held on an entity that could be serialized into a response or a log line.
/// <see cref="Fingerprint"/> and <see cref="Last4"/> let the UI show which key is saved.
/// </para>
/// <para>
/// YouTube's stream keys are reusable: a key keeps working until someone resets it in
/// YouTube Studio. So a saved key normally lasts, and the one way it "expires" is being
/// reset - which shows up as the ingest refusing it. <see cref="RejectedAt"/> records that,
/// so the app can ask for the key to be set again instead of failing the same way each time.
/// </para>
/// </summary>
public sealed class LiveStreamKey
{
    /// <summary><c>{channelId}:{destinationId}</c> - one key per channel per destination.</summary>
    public string Id { get; set; } = string.Empty;

    public string ChannelId { get; set; } = string.Empty;
    public string DestinationId { get; set; } = string.Empty;

    /// <summary>AES-256-GCM ciphertext, base64. Meaningless without the configured data key.</summary>
    public string CipherText { get; set; } = string.Empty;

    /// <summary>First 8 hex characters of SHA-256(key). Identifies a key without disclosing it.</summary>
    public string Fingerprint { get; set; } = string.Empty;

    /// <summary>Last four characters, for the <c>••••9f2c</c> display.</summary>
    public string Last4 { get; set; } = string.Empty;

    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RotatedAt { get; set; }

    /// <summary>When a stream last went live with this key.</summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// When the ingest last refused this key before any media was accepted. Cleared when
    /// the key is replaced or a stream with it goes live.
    /// </summary>
    public DateTime? RejectedAt { get; set; }

    public static string IdFor(string channelId, string destinationId) => $"{channelId}:{destinationId}";
}
