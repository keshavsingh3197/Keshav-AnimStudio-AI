namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Which font file can draw which writing system. drawtext takes exactly one font file
/// and has no fallback chain - a glyph the face lacks is drawn as a box - so text in a
/// script the default Latin face does not cover needs its face chosen up front.
/// </summary>
internal static class ScriptFonts
{
    // Ordered: the first existing file wins. Bold first where it exists, to match the
    // weight of the default watermark face.
    private static readonly Dictionary<string, string[]> Candidates = new(StringComparer.Ordinal)
    {
        // One family covers every Indian script on Windows; Noto ships one per script.
        ["Devanagari"] = [@"C:\Windows\Fonts\NirmalaB.ttf", @"C:\Windows\Fonts\Nirmala.ttc", @"C:\Windows\Fonts\Nirmala.ttf", @"C:\Windows\Fonts\mangal.ttf",
            .. Noto("Devanagari"), "/usr/share/fonts/truetype/lohit-devanagari/Lohit-Devanagari.ttf",
            "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc", "/System/Library/Fonts/Kohinoor.ttc"],
        ["Bengali"] = [.. Nirmala(), .. Noto("Bengali")],
        ["Gurmukhi"] = [.. Nirmala(), .. Noto("Gurmukhi")],
        ["Gujarati"] = [.. Nirmala(), .. Noto("Gujarati")],
        ["Oriya"] = [.. Nirmala(), .. Noto("Oriya")],
        ["Tamil"] = [.. Nirmala(), .. Noto("Tamil")],
        ["Telugu"] = [.. Nirmala(), .. Noto("Telugu")],
        ["Kannada"] = [.. Nirmala(), .. Noto("Kannada")],
        ["Malayalam"] = [.. Nirmala(), .. Noto("Malayalam")],
        ["Arabic"] = [@"C:\Windows\Fonts\segoeuib.ttf", @"C:\Windows\Fonts\arialbd.ttf", .. Noto("Arabic"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
        ["Thai"] = [@"C:\Windows\Fonts\LeelaUIb.ttf", @"C:\Windows\Fonts\LeelawUI.ttf", .. Noto("Thai")],
        ["Cjk"] = [@"C:\Windows\Fonts\msyhbd.ttc", @"C:\Windows\Fonts\msyh.ttc", @"C:\Windows\Fonts\YuGothB.ttc", @"C:\Windows\Fonts\malgunbd.ttf",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
            "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Bold.ttc", "/System/Library/Fonts/PingFang.ttc"]
    };

    private static readonly (int From, int To, string Script)[] Ranges =
    [
        (0x0900, 0x097F, "Devanagari"), (0xA8E0, 0xA8FF, "Devanagari"),
        (0x0980, 0x09FF, "Bengali"), (0x0A00, 0x0A7F, "Gurmukhi"), (0x0A80, 0x0AFF, "Gujarati"),
        (0x0B00, 0x0B7F, "Oriya"), (0x0B80, 0x0BFF, "Tamil"), (0x0C00, 0x0C7F, "Telugu"),
        (0x0C80, 0x0CFF, "Kannada"), (0x0D00, 0x0D7F, "Malayalam"),
        (0x0600, 0x06FF, "Arabic"), (0x0750, 0x077F, "Arabic"),
        (0x0E00, 0x0E7F, "Thai"),
        (0x3040, 0x30FF, "Cjk"), (0x3400, 0x4DBF, "Cjk"), (0x4E00, 0x9FFF, "Cjk"), (0xAC00, 0xD7AF, "Cjk")
    ];

    /// <summary>The first script in the text that needs a face of its own, or null for Latin-only text.</summary>
    public static string? Detect(string? text)
    {
        if (string.IsNullOrEmpty(text)) return null;

        foreach (var c in text)
        {
            if (c < 0x0600) continue;
            foreach (var (from, to, script) in Ranges)
            {
                if (c >= from && c <= to) return script;
            }
        }

        return null;
    }

    public static string? Find(string script) =>
        Candidates.TryGetValue(script, out var paths) ? Array.Find(paths, File.Exists) : null;

    /// <summary>
    /// Faces tried, in order, for a character the line's own face has no glyph for -
    /// emoji first, then symbols. drawtext draws an outline face's emoji in the text's own
    /// colour; a colour-bitmap face (Noto Color Emoji, Apple Color Emoji) is deliberately
    /// absent, because freetype cannot scale its fixed-size bitmaps to the line.
    /// </summary>
    private static readonly string[] FallbackCandidates =
    [
        @"C:\Windows\Fonts\seguiemj.ttf", @"C:\Windows\Fonts\seguisym.ttf",
        "/usr/share/fonts/truetype/noto/NotoEmoji-Regular.ttf", "/usr/share/fonts/noto/NotoEmoji-Regular.ttf",
        "/usr/share/fonts/google-noto-emoji/NotoEmoji-Regular.ttf",
        "/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf", "/usr/share/fonts/TTF/Symbola.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf", @"C:\Windows\Fonts\arialbd.ttf"
    ];

    private static readonly Lazy<string[]> ExistingFallbacks = new(() => Array.FindAll(FallbackCandidates, File.Exists));

    /// <summary>The fallback faces this machine has, in the order they are tried.</summary>
    public static IReadOnlyList<string> Fallbacks => ExistingFallbacks.Value;

    private static string[] Nirmala() =>
        [@"C:\Windows\Fonts\NirmalaB.ttf", @"C:\Windows\Fonts\Nirmala.ttc", @"C:\Windows\Fonts\Nirmala.ttf"];

    /// <summary>The Debian and Fedora locations of a Noto Sans face for one script.</summary>
    private static string[] Noto(string script) =>
    [
        $"/usr/share/fonts/truetype/noto/NotoSans{script}-Bold.ttf",
        $"/usr/share/fonts/truetype/noto/NotoSans{script}-Regular.ttf",
        $"/usr/share/fonts/google-noto/NotoSans{script}-Bold.ttf",
        $"/usr/share/fonts/google-noto/NotoSans{script}-Regular.ttf",
        $"/usr/share/fonts/noto/NotoSans{script}-Bold.ttf"
    ];
}
