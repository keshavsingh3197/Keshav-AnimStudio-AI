namespace AnimStudio.Domain.Voices;

/// <summary>
/// A real person's voice a user has added for voiceovers: a short consented sample that
/// script lines are re-voiced into. Belongs to the user, not a project, so it is there in
/// every project they open.
/// </summary>
public sealed class VoiceProfile
{
    /// <summary>"vp_" plus a GUID. Server-made; never client input.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>What the voice picker shows, e.g. "My voice (Hindi)".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The built-in voice that speaks the words before they are re-voiced. Its language and
    /// gender matter (a Hindi line needs a Hindi voice); its timbre is replaced.
    /// </summary>
    public string BaseVoiceId { get; set; } = string.Empty;

    /// <summary>Server-composed object-store key of the sample.</summary>
    public string StorageKey { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public double? DurationSeconds { get; set; }

    /// <summary>When the user confirmed this is their voice, or that they have permission to use it.</summary>
    public DateTime ConsentAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Object-store keys of lines already re-voiced into this voice, so a preview and the apply
    /// that follows it convert once - and so deleting the voice deletes everything made from it.
    /// </summary>
    public List<string> CachedLineKeys { get; set; } = [];
}
