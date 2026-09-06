namespace AnimStudio.Domain.Ai;

/// <summary>
/// A provider's stable identifier, e.g. <c>groq</c> or <c>comfyui-local</c>.
/// <para>
/// A struct rather than a bare string because these ids arrive from configuration and
/// from admin input, are used as dictionary keys, and end up in storage keys and log
/// lines. Validating once at the boundary means nothing downstream has to wonder whether
/// a value is trimmed, cased consistently, or safe to put in a path.
/// </para>
/// </summary>
public readonly record struct AiProviderId
{
    public const int MaxLength = 40;

    private AiProviderId(string value) => Value = value;

    public string Value { get; }

    public bool IsEmpty => string.IsNullOrEmpty(Value);

    /// <summary>Lower-case letters, digits and single hyphens. Nothing that can traverse a path.</summary>
    public static bool TryParse(string? raw, out AiProviderId id)
    {
        id = default;
        if (string.IsNullOrWhiteSpace(raw)) return false;

        var trimmed = raw.Trim().ToLowerInvariant();
        if (trimmed.Length > MaxLength) return false;
        if (trimmed[0] == '-' || trimmed[^1] == '-') return false;

        for (var i = 0; i < trimmed.Length; i++)
        {
            var c = trimmed[i];
            var ok = c is >= 'a' and <= 'z' || c is >= '0' and <= '9' || c == '-';
            if (!ok) return false;
            if (c == '-' && trimmed[i - 1] == '-') return false;
        }

        id = new AiProviderId(trimmed);
        return true;
    }

    public static AiProviderId Parse(string raw) =>
        TryParse(raw, out var id)
            ? id
            : throw new ArgumentException($"'{raw}' is not a valid AI provider id.", nameof(raw));

    public override string ToString() => Value ?? string.Empty;
}
