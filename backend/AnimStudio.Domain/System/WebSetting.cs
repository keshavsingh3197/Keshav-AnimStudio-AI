namespace AnimStudio.Domain.System;

/// <summary>
/// One configuration value changed from the admin console, stored in the database and
/// layered over appsettings.json at runtime. Only keys in the settings catalog can be
/// stored, and secrets never are - they stay in user-secrets, environment variables or
/// Key Vault.
/// </summary>
public sealed class WebSetting
{
    /// <summary>The configuration path, e.g. <c>Render:Crf</c>. Also the id.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>The value as configuration holds it: invariant-culture text.</summary>
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }
    public string? UpdatedByUserId { get; set; }
}
