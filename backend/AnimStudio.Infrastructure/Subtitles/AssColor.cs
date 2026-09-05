using System.Globalization;

namespace AnimStudio.Infrastructure.Subtitles;

/// <summary>
/// ASS colour formatting.
/// <para>
/// Two things trip everyone up: the byte order is <c>&amp;HAABBGGRR</c> - BGR, not RGB -
/// and the alpha channel is INVERTED, so 00 is fully opaque and FF is transparent.
/// Getting either backwards produces subtitles in the wrong colour or none at all.
/// </para>
/// </summary>
internal static class AssColor
{
    public static string FromRgb(int rgb, byte alpha = 0)
    {
        var r = (rgb >> 16) & 0xFF;
        var g = (rgb >> 8) & 0xFF;
        var b = rgb & 0xFF;
        return $"&H{alpha:X2}{b:X2}{g:X2}{r:X2}";
    }

    public static string FromHex(string? hex, string fallback)
    {
        if (string.IsNullOrWhiteSpace(hex)) return fallback;

        var trimmed = hex.TrimStart('#');
        return int.TryParse(trimmed, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var rgb)
            ? FromRgb(rgb)
            : fallback;
    }

    public const string White = "&H00FFFFFF";
    public const string NearBlack = "&H00101010";
    public const string SemiTransparentBlack = "&H80000000";
}
