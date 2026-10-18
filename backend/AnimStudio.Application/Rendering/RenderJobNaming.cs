using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Rendering;

/// <summary>What a render's default name can be built from.</summary>
public sealed record RenderNameContext(
    string? ProjectName,
    string Format,
    string Aspect,
    int Width,
    int Height,
    int Number,
    DateTime CreatedAtUtc);

/// <summary>
/// Render names: a configurable default built from a template when the render is queued
/// (<c>Render:JobNameTemplate</c>), and the rules a name the user types must follow.
/// <para>
/// Tokens: <c>{project}</c>, <c>{format}</c> (Short / Video / Square), <c>{aspect}</c> (9:16),
/// <c>{resolution}</c> (1080×1920), <c>{n}</c> (this project's render number), <c>{date}</c>
/// (2026-10-10) and <c>{time}</c> (14:05, UTC). Unknown tokens are left as typed so a typo
/// in the setting is visible rather than silently dropped.
/// </para>
/// </summary>
public static partial class RenderJobNaming
{
    public const int MaxLength = 120;
    public const string DefaultTemplate = "{project} · {format} {aspect} · #{n}";

    public static string Expand(string? template, RenderNameContext context)
    {
        var pattern = string.IsNullOrWhiteSpace(template) ? DefaultTemplate : template;
        var project = string.IsNullOrWhiteSpace(context.ProjectName) ? "Render" : context.ProjectName.Trim();

        var expanded = TokenPattern().Replace(pattern, m => m.Groups[1].Value.ToLowerInvariant() switch
        {
            "project" => project,
            "format" => context.Format,
            "aspect" => context.Aspect,
            "resolution" => $"{context.Width}×{context.Height}",
            "n" => context.Number.ToString(CultureInfo.InvariantCulture),
            "date" => context.CreatedAtUtc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            "time" => context.CreatedAtUtc.ToString("HH:mm", CultureInfo.InvariantCulture),
            _ => m.Value
        });

        return Normalize(expanded) ?? project;
    }

    /// <summary>
    /// A name as stored: control characters and angle brackets removed, whitespace collapsed,
    /// trimmed and capped at <see cref="MaxLength"/>. Null when nothing usable is left.
    /// </summary>
    public static string? Normalize(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;

        var builder = new StringBuilder(name.Length);
        var lastWasSpace = false;
        foreach (var ch in name)
        {
            // Whitespace first: tabs and newlines are also control characters, and they should
            // become a space rather than glue two words together.
            if (char.IsWhiteSpace(ch))
            {
                if (!lastWasSpace && builder.Length > 0) builder.Append(' ');
                lastWasSpace = true;
                continue;
            }
            if (char.IsControl(ch) || ch is '<' or '>') continue;
            builder.Append(ch);
            lastWasSpace = false;
        }

        var cleaned = builder.ToString().Trim();
        if (cleaned.Length > MaxLength)
        {
            // Never cut an emoji or other surrogate pair in half.
            var cut = char.IsHighSurrogate(cleaned[MaxLength - 1]) ? MaxLength - 1 : MaxLength;
            cleaned = cleaned[..cut].TrimEnd();
        }
        return cleaned.Length == 0 ? null : cleaned;
    }

    [GeneratedRegex(@"\{([A-Za-z]+)\}")]
    private static partial Regex TokenPattern();
}
