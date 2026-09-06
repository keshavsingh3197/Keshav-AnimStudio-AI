namespace AnimStudio.Domain.Ai;

/// <summary>
/// A provider API key at rest.
/// <para>
/// There is deliberately no plaintext property on this type. A key is decrypted inside
/// the credential store, handed straight to the provider's HTTP handler, and never held
/// on an entity that could be serialized into a response, a log line, an exception
/// message or a Mongo document by accident. <see cref="Fingerprint"/> and
/// <see cref="Last4"/> exist so the admin UI can prove which key is installed without
/// ever revealing it.
/// </para>
/// </summary>
public sealed class AiCredential
{
    public string Id { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;

    /// <summary>AES-256 ciphertext, base64. Meaningless without the configured data key.</summary>
    public string CipherText { get; set; } = string.Empty;

    /// <summary>First 8 hex characters of SHA-256(key). Identifies a key without disclosing it.</summary>
    public string Fingerprint { get; set; } = string.Empty;

    /// <summary>Last four characters, for the <c>••••9f2c</c> display.</summary>
    public string Last4 { get; set; } = string.Empty;

    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RotatedAt { get; set; }
}
