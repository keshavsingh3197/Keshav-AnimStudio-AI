namespace AnimStudio.Application.Rendering;

/// <summary>RGB triplet helper for pure-C# rasterization without System.Drawing dependencies.</summary>
public readonly record struct RgbColor(byte R, byte G, byte B);

/// <summary>
/// Fixed visual color identity per event source or scene theme so Panchang, Festivals,
/// Katha, Aaj Ka Itihaas, Pratiyogita, and Ecosystem Spotlights each have consistent colors
/// across the 3D scene backdrop, top header template bar, character stage, animated subtitles,
/// and 1:1 promo cards.
/// </summary>
public sealed record ProceduralEventPalette(
    string EventKey,
    string DisplayLabel,
    string HeaderBadgeText,
    ProceduralSceneTheme RecommendedTheme,
    string PrimaryHex,
    string SecondaryHex,
    string SpeakerAHex,
    string SpeakerBHex,
    string TitleHex,
    RgbColor TopBackdropRgb,
    RgbColor MidBackdropRgb,
    RgbColor BotBackdropRgb,
    RgbColor PrimaryRgb,
    RgbColor SecondaryRgb)
{
    public static readonly ProceduralEventPalette Panchang = new(
        EventKey: "HinduPanchang",
        DisplayLabel: "Hindu Panchang • Sacred Saffron & Gold",
        HeaderBadgeText: "TODAY'S HINDU PANCHANG",
        RecommendedTheme: ProceduralSceneTheme.CosmosSacred3D,
        PrimaryHex: "#F59E0B",
        SecondaryHex: "#EA580C",
        SpeakerAHex: "#FDE047",
        SpeakerBHex: "#FB923C",
        TitleHex: "#FEF3C7",
        TopBackdropRgb: new RgbColor(24, 12, 34),
        MidBackdropRgb: new RgbColor(124, 45, 18),
        BotBackdropRgb: new RgbColor(22, 10, 14),
        PrimaryRgb: new RgbColor(245, 158, 11),
        SecondaryRgb: new RgbColor(234, 88, 12));

    public static readonly ProceduralEventPalette Festival = new(
        EventKey: "HinduFestival",
        DisplayLabel: "Hindu Festival • Festive Magenta & Diya Gold",
        HeaderBadgeText: "FESTIVAL & VRAT SPECIAL",
        RecommendedTheme: ProceduralSceneTheme.VedicTempleSunrise3D,
        PrimaryHex: "#EC4899",
        SecondaryHex: "#FBBF24",
        SpeakerAHex: "#F9A8D4",
        SpeakerBHex: "#FDE68A",
        TitleHex: "#FDF2F8",
        TopBackdropRgb: new RgbColor(40, 10, 32),
        MidBackdropRgb: new RgbColor(138, 28, 76),
        BotBackdropRgb: new RgbColor(26, 8, 20),
        PrimaryRgb: new RgbColor(236, 72, 153),
        SecondaryRgb: new RgbColor(251, 191, 36));

    public static readonly ProceduralEventPalette Katha = new(
        EventKey: "DailyKatha",
        DisplayLabel: "Vedic Katha • Royal Amethyst & Temple Gold",
        HeaderBadgeText: "PAURANIK KATHA & DIALOGUE",
        RecommendedTheme: ProceduralSceneTheme.VedicTempleSunrise3D,
        PrimaryHex: "#A855F7",
        SecondaryHex: "#F59E0B",
        SpeakerAHex: "#FCD34D",
        SpeakerBHex: "#C084FC",
        TitleHex: "#F3E8FF",
        TopBackdropRgb: new RgbColor(20, 12, 46),
        MidBackdropRgb: new RgbColor(68, 28, 114),
        BotBackdropRgb: new RgbColor(14, 10, 32),
        PrimaryRgb: new RgbColor(168, 85, 247),
        SecondaryRgb: new RgbColor(245, 158, 11));

    public static readonly ProceduralEventPalette History = new(
        EventKey: "AajKaItihaas",
        DisplayLabel: "Aaj Ka Itihaas • Archival Crimson & Bronze",
        HeaderBadgeText: "AAJ KA ITIHAAS • ON THIS DAY",
        RecommendedTheme: ProceduralSceneTheme.HistoryChronicle3D,
        PrimaryHex: "#E11D48",
        SecondaryHex: "#D97706",
        SpeakerAHex: "#FCD34D",
        SpeakerBHex: "#FDA4AF",
        TitleHex: "#FFE4E6",
        TopBackdropRgb: new RgbColor(16, 20, 42),
        MidBackdropRgb: new RgbColor(88, 28, 42),
        BotBackdropRgb: new RgbColor(18, 12, 14),
        PrimaryRgb: new RgbColor(225, 29, 72),
        SecondaryRgb: new RgbColor(217, 119, 6));

    public static readonly ProceduralEventPalette Pratiyogita = new(
        EventKey: "Pratiyogita",
        DisplayLabel: "Pratiyogita • Electric Cyan & Victory Mint",
        HeaderBadgeText: "PRATIYOGITA • EXAM & QUIZ PULSE",
        RecommendedTheme: ProceduralSceneTheme.NeonCyberGrid3D,
        PrimaryHex: "#06B6D4",
        SecondaryHex: "#22C55E",
        SpeakerAHex: "#67E8F9",
        SpeakerBHex: "#86EFAC",
        TitleHex: "#CFFAFE",
        TopBackdropRgb: new RgbColor(8, 16, 38),
        MidBackdropRgb: new RgbColor(14, 62, 98),
        BotBackdropRgb: new RgbColor(6, 20, 32),
        PrimaryRgb: new RgbColor(6, 182, 212),
        SecondaryRgb: new RgbColor(34, 197, 94));

    public static readonly ProceduralEventPalette Spotlight = new(
        EventKey: "EcosystemSpotlight",
        DisplayLabel: "Creator Spotlight • Emerald & Sky Glow",
        HeaderBadgeText: "CONTENT OF THE DAY • SPOTLIGHT",
        RecommendedTheme: ProceduralSceneTheme.SereneNatureGlow,
        PrimaryHex: "#10B981",
        SecondaryHex: "#38BDF8",
        SpeakerAHex: "#6EE7B7",
        SpeakerBHex: "#7DD3FC",
        TitleHex: "#ECFDF5",
        TopBackdropRgb: new RgbColor(8, 26, 36),
        MidBackdropRgb: new RgbColor(16, 82, 74),
        BotBackdropRgb: new RgbColor(8, 20, 24),
        PrimaryRgb: new RgbColor(16, 185, 129),
        SecondaryRgb: new RgbColor(56, 189, 248));

    private static readonly IReadOnlyDictionary<string, ProceduralEventPalette> ByKey =
        new Dictionary<string, ProceduralEventPalette>(StringComparer.OrdinalIgnoreCase)
        {
            ["HinduPanchang"] = Panchang,
            ["Panchang"] = Panchang,
            ["HinduFestival"] = Festival,
            ["Festival"] = Festival,
            ["DailyKatha"] = Katha,
            ["Katha"] = Katha,
            ["AajKaItihaas"] = History,
            ["History"] = History,
            ["Pratiyogita"] = Pratiyogita,
            ["EcosystemSpotlight"] = Spotlight,
            ["CustomPrompt"] = Spotlight
        };

    public static IReadOnlyList<ProceduralEventPalette> All { get; } =
        [Panchang, Festival, Katha, History, Pratiyogita, Spotlight];

    public static ProceduralEventPalette Resolve(string? eventType, ProceduralSceneTheme themeFallback)
    {
        if (!string.IsNullOrWhiteSpace(eventType) && ByKey.TryGetValue(eventType.Trim(), out var matched))
            return matched;

        return themeFallback switch
        {
            ProceduralSceneTheme.CosmosSacred3D => Panchang,
            ProceduralSceneTheme.HistoryChronicle3D => History,
            ProceduralSceneTheme.NeonCyberGrid3D => Pratiyogita,
            ProceduralSceneTheme.SereneNatureGlow => Spotlight,
            _ => Panchang
        };
    }
}
