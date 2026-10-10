using System.Globalization;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Rendering;

/// <summary>How a text overlay's plate is drawn.</summary>
public enum TextBoxStyle
{
    None = 0,

    /// <summary>A plate behind each line, sized to that line.</summary>
    Box = 1,

    /// <summary>One strip the full width of the frame - fills a Short's empty bar.</summary>
    Band = 2
}

/// <summary>A text overlay's style with every value checked, defaulted and in render form.</summary>
/// <param name="FontSize">In 360-reference pixels; see <see cref="TextOverlayLayout.ReferenceShortSide"/>.</param>
/// <param name="ColorRgb">Six hex digits, no prefix - the form drawtext takes after <c>0x</c>.</param>
/// <param name="CenterX">Centre of the block, percent of the frame width.</param>
/// <param name="CenterY">Centre of the block, percent of the frame height.</param>
public sealed record TextOverlayLook(
    double FontSize,
    string ColorRgb,
    TextBoxStyle Box,
    string BoxRgb,
    double BoxOpacity,
    string OutlineRgb,
    double OutlineWidth,
    bool Shadow,
    bool Uppercase,
    double CenterX,
    double CenterY);

/// <summary>
/// The rules that decide where a text overlay's lines fall. The studio preview runs the
/// same rules (<c>text-overlay-layout.ts</c>) so the lines it shows are the lines the
/// export draws - drawtext cannot wrap, so a line break the preview made on its own would
/// be a line that runs off the side of the finished video.
/// <para>
/// Everything here is in percent of the frame or in pixels on a frame whose short side is
/// <see cref="ReferenceShortSide"/>, never in output pixels, so one style means the same
/// thing on the monitor, in a 720p draft and in a 4K master.
/// </para>
/// </summary>
public static partial class TextOverlayLayout
{
    /// <summary>The short side, in pixels, that a style's sizes are measured against.</summary>
    public const double ReferenceShortSide = 360;

    /// <summary>Line pitch as a multiple of the font size.</summary>
    public const double LineHeight = 1.25;

    /// <summary>
    /// Average advance of a bold sans glyph, as a share of the font size. An estimate - the
    /// renderer measures nothing before drawing - chosen slightly wide so a wrapped line
    /// fits rather than nearly fits.
    /// </summary>
    public const double CharWidth = 0.6;

    /// <summary>Share of the frame width a line may use.</summary>
    public const double UsableWidth = 0.9;

    /// <summary>Lines after this are dropped: each is one more drawtext pass.</summary>
    public const int MaxLines = 6;

    /// <summary>Characters per overlay. A caption, not an article.</summary>
    public const int MaxChars = 500;

    public const double MinFontSize = 8;
    public const double MaxFontSize = 200;
    public const double MaxOutlineWidth = 10;

    /// <summary>Where the three named positions put the centre of the block, in percent.</summary>
    public const double TopY = 12;
    public const double BottomY = 86;

    /// <summary>The style with every value checked: anything unusable becomes its default.</summary>
    public static TextOverlayLook Resolve(TimelineItemTextStyleSpec? style)
    {
        style ??= new TimelineItemTextStyleSpec();

        var (box, boxRgb, boxOpacity) = ResolveBox(style);

        var position = style.Position?.Trim().ToLowerInvariant();
        var (x, y) = position switch
        {
            "top" => (50d, TopY),
            "center" => (50d, 50d),
            "custom" => (Percent(style.X, 50), Percent(style.Y, 50)),
            _ => (50d, BottomY)
        };

        return new TextOverlayLook(
            FontSize: Clamp(style.FontSize, MinFontSize, MaxFontSize, 36),
            ColorRgb: Hex(style.Color) ?? "ffffff",
            Box: box,
            BoxRgb: boxRgb,
            BoxOpacity: boxOpacity,
            OutlineRgb: Hex(style.OutlineColor) ?? "000000",
            OutlineWidth: Clamp(style.OutlineWidth, 0, MaxOutlineWidth, 0),
            Shadow: style.Shadow,
            Uppercase: style.Uppercase,
            CenterX: x,
            CenterY: y);
    }

    /// <summary>
    /// The text broken into the lines that will be drawn: explicit line breaks kept, long
    /// lines wrapped at word boundaries to fit the frame width, a word too long for a line
    /// split, and anything past <see cref="MaxLines"/> dropped.
    /// </summary>
    /// <param name="fontSize">In 360-reference pixels.</param>
    public static IReadOnlyList<string> Wrap(string text, double fontSize, int canvasWidth, int canvasHeight)
    {
        if (string.IsNullOrWhiteSpace(text) || canvasWidth <= 0 || canvasHeight <= 0) return [];

        var limit = MaxCharsPerLine(fontSize, canvasWidth, canvasHeight);
        var lines = new List<string>();

        var clipped = text.Length > MaxChars ? text[..MaxChars] : text;
        foreach (var paragraph in clipped.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n'))
        {
            var current = string.Empty;
            foreach (var word in paragraph.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                var rest = word;
                while (rest.Length > limit)
                {
                    if (current.Length > 0) { lines.Add(current); current = string.Empty; }
                    lines.Add(rest[..limit]);
                    rest = rest[limit..];
                }

                if (rest.Length == 0) continue;
                if (current.Length == 0) current = rest;
                else if (current.Length + 1 + rest.Length <= limit) current += " " + rest;
                else { lines.Add(current); current = rest; }
            }

            // A blank line in the middle of a caption is deliberate spacing; keep it.
            lines.Add(current);
        }

        // ...but not at the ends, where it only pushes the block off its position.
        while (lines.Count > 0 && lines[^1].Length == 0) lines.RemoveAt(lines.Count - 1);
        while (lines.Count > 0 && lines[0].Length == 0) lines.RemoveAt(0);

        return lines.Count > MaxLines ? lines.GetRange(0, MaxLines) : lines;
    }

    /// <summary>How many characters fit across the frame at this size.</summary>
    public static int MaxCharsPerLine(double fontSize, int canvasWidth, int canvasHeight)
    {
        var size = Clamp(fontSize, MinFontSize, MaxFontSize, 36);
        var widthInReference = canvasWidth / (double)Math.Min(canvasWidth, canvasHeight) * ReferenceShortSide;
        return Math.Max(4, (int)Math.Floor(UsableWidth * widthInReference / (CharWidth * size)));
    }

    /// <summary>Multiplier from 360-reference pixels to this canvas's pixels.</summary>
    public static double Scale(int canvasWidth, int canvasHeight) =>
        Math.Min(canvasWidth, canvasHeight) / ReferenceShortSide;

    private static (TextBoxStyle Box, string Rgb, double Opacity) ResolveBox(TimelineItemTextStyleSpec style)
    {
        if (style.BoxStyle is { } named)
        {
            var box = named.Trim().ToLowerInvariant() switch
            {
                "box" => TextBoxStyle.Box,
                "band" => TextBoxStyle.Band,
                _ => TextBoxStyle.None
            };
            return (box, Hex(style.BoxColor) ?? "000000", Clamp(style.BoxOpacity ?? 0.6, 0, 1, 0.6));
        }

        // Older clients: a CSS colour, of exactly the three shapes they ever sent.
        var css = style.BackgroundColor?.Trim() ?? string.Empty;
        if (css.Length == 0 || css.Equals("transparent", StringComparison.OrdinalIgnoreCase)
            || css.Equals("none", StringComparison.OrdinalIgnoreCase))
        {
            return (TextBoxStyle.None, "000000", 0);
        }

        if (Hex(css) is { } solid) return (TextBoxStyle.Box, solid, 1);

        var rgba = RgbaPattern().Match(css);
        if (rgba.Success
            && byte.TryParse(rgba.Groups[1].Value, CultureInfo.InvariantCulture, out var r)
            && byte.TryParse(rgba.Groups[2].Value, CultureInfo.InvariantCulture, out var g)
            && byte.TryParse(rgba.Groups[3].Value, CultureInfo.InvariantCulture, out var b))
        {
            var alpha = rgba.Groups[4].Success
                && double.TryParse(rgba.Groups[4].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var a)
                ? Clamp(a, 0, 1, 1)
                : 1;
            return (TextBoxStyle.Box, $"{r:x2}{g:x2}{b:x2}", alpha);
        }

        return (TextBoxStyle.Box, "000000", 0.6);
    }

    /// <summary>Six lowercase hex digits from <c>#rrggbb</c>, or null for anything else.</summary>
    private static string? Hex(string? value) =>
        EraseRegionSpec.IsHexColor(value) ? value![1..].ToLowerInvariant() : null;

    private static double Percent(double? value, double fallback) =>
        Clamp(value ?? fallback, 0, 100, fallback);

    private static double Clamp(double value, double min, double max, double fallback) =>
        double.IsFinite(value) ? Math.Clamp(value, min, max) : fallback;

    [GeneratedRegex(@"^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9]*\.?[0-9]+)\s*)?\)$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex RgbaPattern();
}
