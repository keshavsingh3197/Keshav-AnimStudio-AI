using System.Globalization;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Formatting and escaping helpers for filtergraph text.
/// <para>
/// Two small things here prevent a lot of pain. First, numbers are always formatted with
/// the invariant culture: under a locale like de-DE, 0.5 would serialize as "0,5" and the
/// comma would silently split the filter chain, producing a graph that is garbage in a way
/// that is very hard to read. Second, inside a quoted expression both "," and ":" must be
/// escaped, because they separate filters and filter options even within quotes.
/// </para>
/// </summary>
internal static class FilterExpr
{
    /// <summary>Formats a number for a filter argument, invariant culture, no exponent.</summary>
    public static string N(double value) =>
        value.ToString("0.######", CultureInfo.InvariantCulture);

    public static string N(int value) => value.ToString(CultureInfo.InvariantCulture);

    /// <summary>Seconds for a frame count, exact to the frame.</summary>
    public static string Sec(Domain.Rendering.FrameCount frames, Domain.Rendering.FrameRate rate) =>
        N(frames.ToSeconds(rate));

    /// <summary>
    /// Wraps an expression in single quotes and escapes the characters that would
    /// otherwise terminate it or split the surrounding filter chain.
    /// </summary>
    public static string Quote(string expression)
    {
        var escaped = expression
            .Replace("\\", "\\\\")
            .Replace("'", "\\'")
            .Replace(",", "\\,")
            .Replace(":", "\\:");
        return $"'{escaped}'";
    }

    /// <summary>
    /// Rewrites a filesystem path into the form ffmpeg's filter options accept.
    /// <para>
    /// Backslashes are turned into forward slashes even on Windows, where ffmpeg accepts
    /// them happily. It has to be done because a backslash is the ESCAPE character inside a
    /// filter argument, so <c>C:\Windows\Fonts\arial.ttf</c> reaches the parser as
    /// <c>C:WindowsFontsarial.ttf</c> - a path that does not exist, reported as a font that
    /// cannot be opened. The drive colon still needs escaping, which <see cref="Quote"/>
    /// does.
    /// </para>
    /// </summary>
    public static string Path(string path) => path.Replace('\\', '/');

    /// <summary>
    /// Linear interpolation from <paramref name="from"/> to <paramref name="to"/> over
    /// the first <paramref name="durationSeconds"/>, clamped afterwards.
    /// </summary>
    public static string Lerp(string from, string to, double durationSeconds)
    {
        if (durationSeconds <= 0) return to;
        var p = $"min(t/{N(durationSeconds)},1)";
        return $"({from})*(1-{p})+({to})*{p}";
    }

    /// <summary>
    /// Normalized progress across the scene as a function of the output frame index.
    /// Uses "on" (absolute output frame) which is only meaningful because zoompan runs
    /// with d=1, one output frame per input frame.
    /// </summary>
    public static string Progress(int totalFrames, Domain.Rendering.Easing easing)
    {
        var last = Math.Max(totalFrames - 1, 1);
        var linear = $"on/{N(last)}";
        return easing == Domain.Rendering.Easing.EaseInOut
            // Smoothstep: p*p*(3-2p).
            ? $"({linear})*({linear})*(3-2*({linear}))"
            : linear;
    }
}
