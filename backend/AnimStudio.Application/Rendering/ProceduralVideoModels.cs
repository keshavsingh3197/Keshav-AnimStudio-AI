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
    SereneNatureGlow = 5,
    ComedyStage3D = 6
}

public enum ProceduralRenderEngine
{
    Auto = 0,
    WebGl3D = 1,
    CpuFast = 2
}

public enum ProceduralVfxStyle
{
    Auto = 0,
    DivineAura = 1,
    ComedyBurst = 2,
    CinematicDrama = 3,
    CyberNeon = 4
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
    /// <summary>Up to 60 minutes (1 hour): supports long-form 15m/20m/30m/60m episodes in 16:9 as well as 9:16 Shorts.</summary>
    public const int MaxSeconds = 3600;
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

    /// <summary>
    /// Hard ceiling on the finished video. When set, a narration longer than this is sped up a little and,
    /// if still too long, middle lines are dropped (the opening and the ending moral are kept). YouTube
    /// treats a vertical upload longer than 180s as a normal video instead of a Short.
    /// </summary>
    public int? MaxDurationSeconds { get; init; }

    public int Fps { get; init; } = 24;
    public bool IncludeCaptions { get; init; } = true;
    public bool IncludeAmbientAudio { get; init; } = true;

    /// <summary>When true and a speech AI provider is configured, synthesizes spoken voiceover / 2-character dialogue and syncs mouth/caption timings.</summary>
    public bool IncludeSpeech { get; init; } = true;

    public string? SpeechProviderId { get; init; }
    public string? SpeakerAVoiceId { get; init; }
    public string? SpeakerBVoiceId { get; init; }

    /// <summary>Optional user custom voice profile id (<c>vp_...</c>, supporting Google replicated Gemini TTS or local voice conversion).</summary>
    public string? VoiceProfileId { get; init; }

    public string Language { get; init; } = "hi";
    public string? FooterLabel { get; init; }

    /// <summary>When false (e.g., 2D Panchang / Rashifal clean mode), omits the bottom hub/channel watermark label and card watermark.</summary>
    public bool ShowWatermark { get; init; } = true;

    /// <summary>Event source key (e.g. HinduPanchang, HinduFestival, DailyKatha, AajKaItihaas, Pratiyogita) driving fixed event colors.</summary>
    public string? EventType { get; init; }

    /// <summary>Top template header pill (e.g. TODAY'S HINDU PANCHANG • 2026-11-14).</summary>
    public string? TopCategoryLabel { get; init; }

    /// <summary>Animated ASS subtitle preset: event-glow, karaoke-pulse, or classic-clean.</summary>
    public string SubtitlePreset { get; init; } = "event-glow";

    /// <summary>When true, renders interactive animated 2-character stage + speaker-colored dialogue turns.</summary>
    public bool EnableCharacterDialogue { get; init; }

    public string? SpeakerAName { get; init; }
    public string? SpeakerBName { get; init; }

    public string? ProjectId { get; init; }
    public string? TopicId { get; init; }
    public IReadOnlyList<string>? BackgroundImagePaths { get; init; }

    /// <summary>Optional character placements and template-backdrop mode; null keeps the built-in stage.</summary>
    public ProceduralStageLayout? StageLayout { get; init; }

    /// <summary>
    /// When true every script line is spoken as written: no speed-up, no dropped or merged lines, and the video
    /// lasts exactly as long as the narration (no silent padding to a target length). <see cref="MaxDurationSeconds"/>
    /// is ignored; the only limit left is <see cref="MaxSeconds"/>.
    /// </summary>
    public bool FollowScriptExactly { get; init; }

    /// <summary>Optional path to a custom audio file (e.g. from SongLibrary) to mux as background music.</summary>
    public string? CustomBgmPath { get; init; }

    /// <summary>Optional background music volume percent (<c>0..100</c>); null keeps the preset default (45% standard, 18% devotional reel).</summary>
    public int? BgmVolumePercent { get; init; }

    /// <summary>When true, shapes punchline pacing and loop visual cue for short-form repeat loops (10s-30s).</summary>
    public bool IsSeamlessLoop { get; init; }

    /// <summary>When true (or auto-enabled on comedy renders), mixes crisp synthesized cartoon SFX (boing/bonk/boom/scratch) on meme &amp; punchline beats.</summary>
    public bool EnableComedySfx { get; init; }

    /// <summary>
    /// MJO-style dialogue breathing room: plays upbeat intro, scene-transition, and outro comic jingles while dropping
    /// BGM to whisper-quiet room tone during spoken lines so timing, sarcasm, and SFX hits cut cleanly.
    /// </summary>
    public bool SparseComedyAudio { get; init; }

    /// <summary>Series episode number (0 for standalone) used to vary procedural props, stage hues, and uniqueness seeds per upload.</summary>
    public int EpisodeNumber { get; init; }

    public bool SaveAsRenderJob { get; init; } = true;
    public bool ReturnInlineBytes { get; init; }

    /// <summary>Rendering engine: <see cref="ProceduralRenderEngine.Auto"/> prefers hardware/WebGL 3D when available and falls back safely to CPU.</summary>
    public ProceduralRenderEngine RenderEngine { get; init; } = ProceduralRenderEngine.Auto;

    /// <summary>Atmospheric &amp; reaction 3D VFX preset (<see cref="ProceduralVfxStyle.Auto"/> adapts to theme and line emotions).</summary>
    public ProceduralVfxStyle VfxStyle { get; init; } = ProceduralVfxStyle.Auto;

    /// <summary>When true, gently shifts and frames 3D camera cuts toward the active speaker unless a custom template layout locks positions.</summary>
    public bool EnableDynamicCamera { get; init; } = true;

    /// <summary>Optional live progress sink (stage text + 0-99 percent) while the render runs. Called inline from the render thread.</summary>
    public IProgress<ProceduralRenderProgress>? Progress { get; init; }
}

/// <summary>One live progress update from the procedural renderer: a short user-facing stage label and an overall percent.</summary>
public sealed record ProceduralRenderProgress(int Percent, string Stage);

/// <summary>
/// Overall-percent bands for a procedural render, shared by the renderer and its callers so the bar only moves forward.
/// 0-10 is left to the caller (writing dialogue); voices take the largest wall-clock share, then frames.
/// </summary>
public static class ProceduralRenderStages
{
    public const int Dialogue = 4;
    public const int VoicesStart = 12;
    public const int VoicesEnd = 40;
    public const int Music = 42;
    public const int Captions = 45;
    public const int Backdrops = 47;
    public const int FramesStart = 50;
    public const int FramesEnd = 90;
    public const int Encode = 92;
    public const int Save = 96;

    public static int VoicePercent(int turnIndex, int turnCount) =>
        turnCount <= 0 ? VoicesStart : VoicesStart + (VoicesEnd - VoicesStart) * Math.Clamp(turnIndex, 0, turnCount) / turnCount;

    public static int FramePercent(int frameIndex, int totalFrames) =>
        totalFrames <= 0 ? FramesStart : FramesStart + (FramesEnd - FramesStart) * Math.Clamp(frameIndex, 0, totalFrames) / totalFrames;
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
    string Summary,
    string? SpeechWarning = null);

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
            "Multi-layer parallax mountain silhouettes, glowing aurora sky ribbons, drifting fireflies, and calm meditation tones."),
        new("comedy-stage", ProceduralSceneTheme.ComedyStage3D, "Comedy Stage & Chai Tapri 3D", "Funny Shorts, Memes, Skit Loops & Punchlines (@KESHAV-ANIM-FF)", "#F97316",
            "Warm comic spotlights, expressive dual-character banter on a chai stall or comedy stage, punchline reactions, and upbeat bounce.")
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

    public static ProceduralSceneTheme InferTheme(
        ProceduralSceneTheme requested,
        string? title,
        string? prompt,
        string? script) =>
        InferTheme(requested, title, prompt, script, eventType: null);

    public static ProceduralSceneTheme InferTheme(
        ProceduralSceneTheme requested,
        string? title,
        string? prompt,
        string? script,
        string? eventType)
    {
        if (requested != ProceduralSceneTheme.Auto && Enum.IsDefined(requested))
            return requested;

        if (!string.IsNullOrWhiteSpace(eventType))
        {
            var byEvent = eventType.Trim() switch
            {
                "DailyKatha" or "HinduFestival" or "DevotionalPrarthana" => ProceduralSceneTheme.VedicTempleSunrise3D,
                "HinduPanchang" => ProceduralSceneTheme.CosmosSacred3D,
                "AajKaItihaas" => ProceduralSceneTheme.HistoryChronicle3D,
                "Pratiyogita" => ProceduralSceneTheme.NeonCyberGrid3D,
                "FunnyComedy" => ProceduralSceneTheme.ComedyStage3D,
                _ => ProceduralSceneTheme.Auto
            };
            if (byEvent != ProceduralSceneTheme.Auto)
                return byEvent;
        }

        // Prioritize title + prompt over script tail because CTA lines in Katha/History scripts often mention Panchang links.
        var leadText = $"{title} {prompt}".ToLowerInvariant();
        if (ContainsAny(leadText,
            "comedy", "funny", "कॉमेडी", "हंसी", "मज़ाक", "चुटकुला", "chutkula", "punchline",
            "skit", "parody", "roast", "meme", "tapri", "टपरी", "pappu", "पप्पू", "bablu", "बबलू"))
            return ProceduralSceneTheme.ComedyStage3D;
        if (ContainsAny(leadText,
            "katha", "कथा", "dhruva", "ध्रुव", "narad", "नारद", "harishchandra", "हरिश्चंद्र", "prahlad", "प्रह्लाद",
            "sudama", "सुदामा", "tapasya", "तपस्या", "aarti", "आरती", "festival", "vrat", "व्रत", "puja", "पूजा", "bhakti", "भक्ति"))
            return ProceduralSceneTheme.VedicTempleSunrise3D;

        if (ContainsAny(leadText,
            "panchang", "पंचांग", "nakshatra", "नक्षत्र", "tithi", "तिथि", "muhurat", "मुहूर्त",
            "rahu", "राहुकाल", "cosmos", "planet", "orbit", "space", "eclipse", "zodiac", "samvat"))
            return ProceduralSceneTheme.CosmosSacred3D;

        if (ContainsAny(leadText, "temple", "mandir", "मंदिर", "krishna", "ram", "shiv"))
            return ProceduralSceneTheme.VedicTempleSunrise3D;

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
        beats.Add(new ProceduralCaptionBeat(0, 0.15, titleHold, TruncateLine(cleanTitle, 110), IsTitleHook: true));

        var rawBody = !string.IsNullOrWhiteSpace(script) ? script : prompt ?? string.Empty;
        var chunks = ExtractReadableSegments(rawBody);
        if (chunks.Count == 0)
            chunks.Add(cleanTitle);

        var remaining = Math.Max(1.5, total - (titleHold + 0.3));
        var slotCapacity = Math.Max(1, (int)Math.Floor(remaining / 1.15));
        var combinedChunks = CoalesceChunks(chunks, slotCapacity);
        var step = remaining / combinedChunks.Count;
        var start = titleHold + 0.15;

        for (var i = 0; i < combinedChunks.Count; i++)
        {
            var end = i == combinedChunks.Count - 1 ? total - 0.15 : start + step - 0.08;
            if (end <= start + 0.35) break;

            beats.Add(new ProceduralCaptionBeat(
                i + 1,
                Math.Round(start, 2),
                Math.Round(end, 2),
                TruncateLine(combinedChunks[i], 200),
                IsTitleHook: false));
            start += step;
        }

        return beats;
    }

    private static List<string> CoalesceChunks(List<string> chunks, int maxSlots)
    {
        if (chunks.Count <= maxSlots) return chunks;
        var merged = new List<string>(maxSlots);
        var perSlot = (double)chunks.Count / maxSlots;
        for (var i = 0; i < maxSlots; i++)
        {
            var from = (int)Math.Floor(i * perSlot);
            var to = i == maxSlots - 1 ? chunks.Count : (int)Math.Floor((i + 1) * perSlot);
            if (to <= from) continue;
            merged.Add(string.Join(" • ", chunks.Skip(from).Take(to - from)));
        }
        return merged.Count > 0 ? merged : chunks;
    }

    private static List<string> ExtractReadableSegments(string raw)
    {
        var cleaned = ScriptMarkerRegex().Replace(raw ?? string.Empty, " ");
        cleaned = InlineUrlRegex().Replace(cleaned, " ");
        var lines = cleaned
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split(['\n', '।', '|', '•', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var result = new List<string>();
        foreach (var line in lines)
        {
            var c = CleanLine(line).TrimEnd(':').Trim();
            if (string.IsNullOrWhiteSpace(c)) continue;
            if (c.Length < 4) continue;

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

    [GeneratedRegex(@"https?://\S+", RegexOptions.IgnoreCase)]
    private static partial Regex InlineUrlRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}
