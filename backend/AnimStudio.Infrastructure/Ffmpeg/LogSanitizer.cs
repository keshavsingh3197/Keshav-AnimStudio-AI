using System.Text;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Strips control characters from text before it reaches a log.
/// <para>
/// Caption text, filenames and renderer stderr all end up in logs, and all three are
/// untrusted. Without this, a newline in the payload lets an attacker forge a log entry.
/// </para>
/// </summary>
public static class LogSanitizer
{
    public static string Sanitize(string? value, int maxLength = 2000)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        var builder = new StringBuilder(Math.Min(value.Length, maxLength));
        foreach (var ch in value)
        {
            if (builder.Length >= maxLength) break;
            builder.Append(char.IsControl(ch) ? ' ' : ch);
        }

        return builder.ToString();
    }
}
