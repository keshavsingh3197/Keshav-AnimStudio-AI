using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Shared high-CTR pixel lighting compositor and emotion palette mapper for YouTube thumbnails (9:16 Shorts and 16:9).
/// Applies the 60-30-10 color rule: darkened periphery vignette, bright radial emotion halo behind the hero character,
/// and smooth scrim backing in mobile safe zones so thick-stroked typography pops at 150px scroll scale.
/// </summary>
internal static class ProceduralThumbnailStyler
{
    public sealed record EmotionPalette(
        string HeroTextHex,
        string HeroOutlineHex,
        string PillBgHex,
        string PillTextHex,
        string AccentHex,
        byte GlowR,
        byte GlowG,
        byte GlowB,
        double ContrastBoost,
        double SaturationBoost);

    public static EmotionPalette GetEmotionPalette(ThumbnailEmotion emotion) => emotion switch
    {
        ThumbnailEmotion.Rage => new(
            HeroTextHex: "#FFE600",
            HeroOutlineHex: "#450A0A",
            PillBgHex: "#DC2626",
            PillTextHex: "#FFFFFF",
            AccentHex: "#EF4444",
            GlowR: 239, GlowG: 68, GlowB: 68,
            ContrastBoost: 1.24,
            SaturationBoost: 1.46),
        ThumbnailEmotion.Shock => new(
            HeroTextHex: "#FFE600",
            HeroOutlineHex: "#09090B",
            PillBgHex: "#EA580C",
            PillTextHex: "#FFFFFF",
            AccentHex: "#FACC15",
            GlowR: 250, GlowG: 204, GlowB: 21,
            ContrastBoost: 1.24,
            SaturationBoost: 1.44),
        ThumbnailEmotion.Laugh => new(
            HeroTextHex: "#FFFFFF",
            HeroOutlineHex: "#1E1B4B",
            PillBgHex: "#7C3AED",
            PillTextHex: "#FEF08A",
            AccentHex: "#F97316",
            GlowR: 249, GlowG: 115, GlowB: 22,
            ContrastBoost: 1.20,
            SaturationBoost: 1.45),
        ThumbnailEmotion.Mystery => new(
            HeroTextHex: "#FFFFFF",
            HeroOutlineHex: "#0F172A",
            PillBgHex: "#1D4ED8",
            PillTextHex: "#FEF08A",
            AccentHex: "#38BDF8",
            GlowR: 56, GlowG: 189, GlowB: 248,
            ContrastBoost: 1.22,
            SaturationBoost: 1.38),
        ThumbnailEmotion.Alert => new(
            HeroTextHex: "#FDE047",
            HeroOutlineHex: "#18181B",
            PillBgHex: "#B91C1C",
            PillTextHex: "#FFFFFF",
            AccentHex: "#F59E0B",
            GlowR: 234, GlowG: 88, GlowB: 12,
            ContrastBoost: 1.22,
            SaturationBoost: 1.40),
        _ => new(
            HeroTextHex: "#FACC15",
            HeroOutlineHex: "#450A0A",
            PillBgHex: "#B91C1C",
            PillTextHex: "#FFFFFF",
            AccentHex: "#F59E0B",
            GlowR: 245, GlowG: 158, GlowB: 11,
            ContrastBoost: 1.20,
            SaturationBoost: 1.42)
    };

    public static void ApplyHighCtrLightingRgba(
        byte[] rgba,
        int width,
        int height,
        ThumbnailEmotion emotion,
        bool isPortrait,
        bool maskBottomRightWatermark = false)
    {
        if (rgba.Length < width * height * 4 || width <= 1 || height <= 1)
            return;

        var pal = GetEmotionPalette(emotion);
        // Rule-of-Thirds subject focal spotlight center (centered portrait face vs right split hero in 16:9)
        var cx = isPortrait ? 0.50 : 0.66;
        var cy = isPortrait ? 0.46 : 0.44;
        var invW = 1.0 / (width - 1);
        var invH = 1.0 / (height - 1);
        var edgeBand = Math.Max(3, (int)Math.Round(height * 0.006));

        for (var y = 0; y < height; y++)
        {
            var ny = y * invH;
            var rowOffset = y * width * 4;
            var isAccentBorder = y < edgeBand || y >= height - edgeBand;

            for (var x = 0; x < width; x++)
            {
                var nx = x * invW;
                var idx = rowOffset + x * 4;

                if (maskBottomRightWatermark && ny > 0.945 && nx > 0.72)
                {
                    rgba[idx] = (byte)(rgba[idx] * 0.06);
                    rgba[idx + 1] = (byte)(rgba[idx + 1] * 0.06);
                    rgba[idx + 2] = (byte)(rgba[idx + 2] * 0.06);
                    continue;
                }

                // Radial spotlight near subject face vs darkened outer vignette
                var dx = (nx - cx) * (isPortrait ? 1.0 : 1.35);
                var dy = (ny - cy) * (isPortrait ? 1.15 : 1.0);
                var distSq = dx * dx + dy * dy;
                var vignette = Math.Clamp(1.06 - distSq * 0.68, 0.52, 1.08);
                var halo = Math.Exp(-distSq * 6.5) * 0.14;

                // Soft smooth readability gradient strictly inside headline safe bands (top/bottom on 9:16, left panel on 16:9)
                double scrim;
                if (isPortrait)
                {
                    var topScrim = ny < 0.25 ? 0.42 + (ny / 0.25) * 0.58 : 1.0;
                    var bottomScrim = ny > 0.78 ? 1.0 - ((ny - 0.78) / 0.22) * 0.52 : 1.0;
                    scrim = Math.Min(topScrim, bottomScrim);
                }
                else
                {
                    scrim = nx < 0.45 ? 0.30 + (nx / 0.45) * 0.70 : 1.0;
                }

                var gain = vignette * scrim;
                var r = rgba[idx] * gain + pal.GlowR * halo;
                var g = rgba[idx + 1] * gain + pal.GlowG * halo;
                var b = rgba[idx + 2] * gain + pal.GlowB * halo;

                if (isAccentBorder)
                {
                    r = r * 0.28 + pal.GlowR * 0.72;
                    g = g * 0.28 + pal.GlowG * 0.72;
                    b = b * 0.28 + pal.GlowB * 0.72;
                }

                rgba[idx] = (byte)Math.Clamp(r, 0, 255);
                rgba[idx + 1] = (byte)Math.Clamp(g, 0, 255);
                rgba[idx + 2] = (byte)Math.Clamp(b, 0, 255);
            }
        }
    }
}
