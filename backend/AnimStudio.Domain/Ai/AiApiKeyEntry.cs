namespace AnimStudio.Domain.Ai;

/// <summary>
/// A named, ordered API key stored inside a vendor key pool (for example multiple Google AI Studio
/// projects powering <c>gemini-tts</c>, <c>gemini</c>, and <c>gemini-image</c> with automatic failover).
/// <para>
/// Plaintext secrets never exist on this entity; only the AES-256 ciphertext, SHA-256 fingerprint,
/// and last four characters are persisted.
/// </para>
/// </summary>
public sealed class AiApiKeyEntry
{
    public string Id { get; set; } = string.Empty;

    /// <summary>Lowercase vendor bucket such as <c>google</c>, <c>groq</c>, or <c>openrouter</c>.</summary>
    public string Vendor { get; set; } = string.Empty;

    /// <summary>Human-readable project/account label (e.g. "FamSphere Automation", "VideoGenerator").</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Optional admin notes such as billing tier or daily limit reminder.</summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Optional provider id restrictions inside the vendor (e.g. <c>["gemini-tts"]</c>).
    /// Empty means this key serves every provider under <see cref="Vendor"/>.
    /// </summary>
    public List<string> ProviderIds { get; set; } = [];

    /// <summary>Zero-based priority within <see cref="Vendor"/>; lowest number is tried first.</summary>
    public int Priority { get; set; }

    /// <summary>When false, the key is skipped without losing its position or stored secret.</summary>
    public bool Enabled { get; set; } = true;

    public string CipherText { get; set; } = string.Empty;
    public string Fingerprint { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;

    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? RotatedAtUtc { get; set; }

    public DateTime? LastUsedAtUtc { get; set; }
    public DateTime? LastSucceededAtUtc { get; set; }
    public DateTime? CooldownUntilUtc { get; set; }
    public string? CooldownReason { get; set; }
    public string? LastErrorCode { get; set; }

    /// <summary>UTC <c>yyyy-MM-dd</c> bucket for <see cref="UsageCountToday"/>.</summary>
    public string? UsageDayBucket { get; set; }

    /// <summary>Approximate requests dispatched with this key during <see cref="UsageDayBucket"/>.</summary>
    public long UsageCountToday { get; set; }
}
