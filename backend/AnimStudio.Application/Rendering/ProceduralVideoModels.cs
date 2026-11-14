using System.Text.RegularExpressions;

namespace AnimStudio.Application.Rendering;

/// <summary>Visual 3D/2D procedural engine themes rendered directly on CPU without GPUs or external AI video APIs.</summary>
public enum ProceduralSceneTheme
{
    Auto = 0,
    VedicTempleSunrise3D = 1,
    CosmosSacred3D = 2,
    HistoryChronicle3D = 3,
    NeonCyberGrid3D = 4,
    SereneNatureGlow = 5
}

public sealed record ProceduralThemePreset(
    string Id,
    ProceduralSceneTheme Theme,
    string Name,
    string BestFor,
    string AccentHex,
    string Description);

public sealed record ProceduralCaptionBeat(
    int Index,
    double StartSeconds,
    double EndSeconds,
    string Text,
    bool IsTitleHook);

public sealed class ProceduralVideoRequest
{
    public const int MinSeconds = 5;
    public const int MaxSeconds = 90;
    public const int DefaultSeconds = 18;

    public string Title { get; init; } = string.Empty;
    public string? Prompt { get; init; }
    public string? Script { get; init; }
    public ProceduralSceneTheme Theme { get; init; } = ProceduralSceneTheme.Auto;

    /// <summary><c>vertical</c> (9:16), <c>landscape</c> / <c>wide</c> (16:9), or <c>square</c> (1:1).</summary>
    public string Format { get; init; } = "vertical";

    /// <summary><c>720p</c> (fast CPU HD, default) or <c>1080p</c>.</summary>
    public string Resolution { get; init; } = "720p";

    public int DurationSeconds { get; init; } = DefaultSeconds;
    public int Fps { get; init; } = 24;
    public bool IncludeCaptions { get; init; } = true;
    public bool IncludeAmbientAudio { get; init; } = true;
    public string Language { get; init; } = "hi";
    public string? FooterLabel { get; init; }
    public string? ProjectId { get; init; }
    public string? TopicId { get; init; }
    public bool SaveAsRenderJob { get; init; } = true;
    public bool ReturnInlineBytes { get; init; }
}

public sealed record ProceduralVideoResult(
    string? RenderJobId,
    string? ProjectId,
    ProceduralSceneTheme ResolvedTheme,
    string ThemeDisplayName,
    int Width,
    int Height,
    double DurationSeconds,
    long SizeBytes,
    string? StorageKey,
    byte[]? InlineMp4Bytes,
    string Summary);

/// <summary>
/// Pure planning utilities for the procedural 2D/3D animation generator: infers visual themes from
/// bilingual Hindi/English prompts, computes beat-synced subtitle intervals, and picks safe CPU dimensions.
/// </summary>
public static partial class ProceduralVideoPlanner
{
    public static IReadOnlyList<ProceduralThemePreset> Presets { get; } =
    [
        new("auto", ProceduralSceneTheme.Auto, "Smart Auto-Match", "Panchang, Katha, History, Tech & News", "#F59E0B",
            "Reads your title, script, and AI prompt to automatically choose the matching 3D scene geometry, motion lighting, and soundscape."),
        new("vedic-sunrise", ProceduralSceneTheme.VedicTempleSunrise3D, "Vedic Temple Sunrise 3D", "Aarti, Katha, Hindu Festivals & Morning Thoughts", "#EA580C",
            "Rotating 3D Sri Yantra geometry, rising saffron solar rays, layered temple spires, and floating diya embers."),
        new("cosmos-sacred", ProceduralSceneTheme.CosmosSacred3D, "Cosmos & Nakshatra 3D", "Daily Panchang, Nakshatra, Ekadashi & Astronomy", "#6366F1",
            "3D orbital celestial rings, warp starfield, deep indigo nebula glow, and planetary conjunction arcs."),
        new("history-chronicle", ProceduralSceneTheme.HistoryChronicle3D, "History Chronicle 3D", "Aaj Ka Itihaas, Biographies & World Events", "#D97706",
            "3D rotating meridian wireframe globe, expanding documentary radar pulses, gold-bronze archival frames, and floating timeline particles."),
        new("neon-cyber", ProceduralSceneTheme.NeonCyberGrid3D, "Neon Cyber Grid 3D", "Pratiyogita Quizzes, Tech, AI & Social Analytics", "#06B6D4",
            "Endless 3D perspective synthwave horizon grid, rotating wireframe polyhedra, and animated cyan/magenta light waves."),
        new("serene-nature", ProceduralSceneTheme.SereneNatureGlow, "Serene Aurora Nature", "Quotes, Wisdom, Peace & Morning Motivation", "#10B981",
            "Multi-layer parallax mountain silhouettes, glowing aurora sky ribbons, drifting fireflies, and calm meditation tones.")
    ];

    public static ProceduralThemePreset DescribeTheme(ProceduralSceneTheme theme) =>
        Presets.FirstOrDefault(p => p.Theme == theme) ?? Presets[1];

    public static (int Width, int Height, string NormalizedFormat) ResolveDimensions(string? format, string? resolution)
    {
        var isFullHd = string.Equals(resolution?.Trim(), "1080p", StringComparison.OrdinalIgnoreCase);
        var normalized = (format ?? "vertical").Trim().ToLowerInvariant() switch
        {
            "landscape" or "wide" or "16:9" => "landscape",
            "square" or "1:1" => "square",
            _ => "vertical"
        };

        return (normalized, isFullHd) switch
        {
            ("landscape", true) => (1920, 1080, "landscape"),
            ("landscape", false) => (1280, 720, "landscape"),
            ("square", true) => (1080, 1080, "square"),
            ("square", false) => (720, 720, "square"),
            ("vertical", true) => (1080, 1920, "vertical"),
            _ => (720, 1280, "vertical")
        };
    }

    public static int ClampDuration(int seconds) =>
        Math.Clamp(seconds <= 0 ? ProceduralVideoRequest.DefaultSeconds : seconds,
            ProceduralVideoRequest.MinSeconds,
            ProceduralVideoRequest.MaxSeconds);

    public static ProceduralSceneTheme InferTheme(ProceduralSceneTheme requested, string? title, string? prompt, string? script)
    {
        if (requested != ProceduralSceneTheme.Auto && Enum.IsDefined(requested))
            return requested;

        var combined = $"{title} {prompt} {script}".ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(combined))
            return ProceduralSceneTheme.VedicTempleSunrise3D;

        if (ContainsAny(combined,
            "itihaas", "history", "इतिहास", "chronicle", "historical", "revolution", "independence",
            "emperor", "treaty", "expedition", "globe", "world", "archive", "century", "war"))
            return ProceduralSceneTheme.HistoryChronicle3D;

        if (ContainsAny(combined,
            "panchang", "पंचांग", "nakshatra", "नक्षत्र", "tithi", "तिथि", "muhurat", "मुहूर्त",
            "rahu", "राहुकाल", "cosmos", "planet", "orbit", "space", "eclipse", "zodiac", "samvat"))
            return ProceduralSceneTheme.CosmosSacred3D;

        if (ContainsAny(combined,
            "pratiyogita", "प्रतियोगिता", "quiz", "cyber", "neon", "analytics", "social", "coding",
            "software", "ai ", "tech", "algorithm", "rpm", "dashboard", "digital", "growth"))
            return ProceduralSceneTheme.NeonCyberGrid3D;

        if (ContainsAny(combined,
            "nature", "mountain", "river", "forest", "peace", "shanti", "शांति", "mindful",
            "meditation", "calm", "sunrise", "aurora", "morning walk", "wisdom"))
            return ProceduralSceneTheme.SereneNatureGlow;

        return ProceduralSceneTheme.VedicTempleSunrise3D;
    }

    public static IReadOnlyList<ProceduralCaptionBeat> BuildCaptionBeats(
        string title,
        string? script,
        string? prompt,
        int durationSeconds)
    {
        var total = Math.Max(5.0, durationSeconds);
        var cleanTitle = CleanLine(title);
        if (string.IsNullOrWhiteSpace(cleanTitle))
            cleanTitle = "AnimStudio 3D";

        var beats = new List<ProceduralCaptionBeat>();
        var titleHold = Math.Min(3.4, total * 0.28);
        beats.Add(new ProceduralCaptionBeat(0, 0.15, titleHold, TruncateLine(cleanTitle, 84), IsTitleHook: true));

        var rawBody = !string.IsNullOrWhiteSpace(script) ? script : prompt ?? string.Empty;
        var chunks = ExtractReadableSegments(rawBody);
        if (chunks.Count == 0)
            chunks.Add(cleanTitle);

        var remaining = Math.Max(1.5, total - (titleHold + 0.3));
        var maxSlots = Math.Max(1, Math.Min(chunks.Count, (int)Math.Floor(remaining / 2.2)));
        var step = remaining / maxSlots;
        var start = titleHold + 0.15;

        for (var i = 0; i < maxSlots; i++)
        {
            var end = i == maxSlots - 1 ? total - 0.15 : start + step - 0.08;
            if (end <= start + 0.4) break;

            beats.Add(new ProceduralCaptionBeat(
                i + 1,
                Math.Round(start, 2),
                Math.Round(end, 2),
                TruncateLine(chunks[i], 105),
                IsTitleHook: false));
            start += step;
        }

        return beats;
    }

    private static List<string> ExtractReadableSegments(string raw)
    {
        var cleaned = ScriptMarkerRegex().Replace(raw ?? string.Empty, " ");
        var lines = cleaned
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split(['\n', '।', '|', '•', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var result = new List<string>();
        foreach (var line in lines)
        {
            var c = CleanLine(line);
            if (string.IsNullOrWhiteSpace(c)) continue;
            if (c.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || c.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                continue;

            if (c.Length <= 96)
            {
                result.Add(c);
                continue;
            }

            // Split long paragraph smoothly on sentence / comma boundaries so captions stay readable.
            var sentences = c.Split([". ", "! ", "? ", ", "], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var s in sentences)
            {
                var sc = CleanLine(s);
                if (!string.IsNullOrWhiteSpace(sc))
                    result.Add(sc);
            }
        }

        return result;
    }

    private static string CleanLine(string? value) =>
        MultiSpaceRegex().Replace(value ?? string.Empty, " ").Trim();

    private static string TruncateLine(string value, int maxLen) =>
        value.Length <= maxLen ? value : value[..(maxLen - 1)].TrimEnd() + "…";

    private static bool ContainsAny(string haystack, params string[] needles)
    {
        foreach (var n in needles)
        {
            if (haystack.Contains(n, StringComparison.Ordinal))
                return true;
        }
        return false;
    }

    [GeneratedRegex(@"\[[^\]]+\]")]
    private static partial Regex ScriptMarkerRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}
