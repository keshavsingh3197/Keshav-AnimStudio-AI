using System.Globalization;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// A green (or any colour) screen keyed out of an image or video overlay, checked here
/// because every value ends up inside an ffmpeg filter. Drawn with <c>colorkey</c>, which
/// works on the RGBA the overlay chain already converts to.
/// </summary>
/// <param name="Rgb">Six upper-case hex digits, no '#'.</param>
public sealed record OverlayChromaKey(string Rgb, double Similarity, double Blend)
{
    public const double MinSimilarity = 0.01;
    public const double MaxSimilarity = 1;
    public const double MaxBlend = 1;

    /// <summary>Null when there is no key, it is switched off, or its colour is not a <c>#rrggbb</c>.</summary>
    public static OverlayChromaKey? From(ChromaKeySpec? spec)
    {
        if (spec is not { Enabled: true }) return null;

        var color = string.IsNullOrWhiteSpace(spec.Color) ? "#00ff00" : spec.Color.Trim();
        if (!EraseRegionSpec.IsHexColor(color)) return null;

        var similarity = double.IsFinite(spec.Similarity) ? Math.Clamp(spec.Similarity, MinSimilarity, MaxSimilarity) : 0.3;
        var blend = double.IsFinite(spec.Blend) ? Math.Clamp(spec.Blend, 0, MaxBlend) : 0.1;

        return new OverlayChromaKey(color[1..].ToUpperInvariant(), Math.Round(similarity, 3), Math.Round(blend, 3));
    }

    /// <summary>The filter, e.g. <c>colorkey=0x00FF00:0.3:0.1</c>.</summary>
    public string Filter() =>
        string.Create(CultureInfo.InvariantCulture, $"colorkey=0x{Rgb}:{Similarity}:{Blend}");
}
