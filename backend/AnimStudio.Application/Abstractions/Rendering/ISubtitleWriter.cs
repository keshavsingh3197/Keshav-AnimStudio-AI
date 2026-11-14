using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Abstractions.Rendering;

public enum SubtitleMotionPreset
{
    None = 0,
    EventGlow = 1,
    KaraokePulse = 2,
    TopBannerReveal = 3
}

public sealed record SubtitleStyle(
    string Name,
    string? ColorHex,
    bool Bold = true,
    int Alignment = 2,
    int MarginV = 64,
    int FontScalePercent = 100,
    string? OutlineColorHex = null,
    string? BackColorHex = null,
    string? SecondaryColorHex = null,
    SubtitleMotionPreset MotionPreset = SubtitleMotionPreset.None);

public sealed record SubtitleRequest(
    Canvas Canvas,
    IReadOnlyList<DialogueLine> Lines,
    IReadOnlyDictionary<string, SubtitleStyle> StylesByCharacterId,
    string FontName = "DejaVu Sans",
    int FontSize = 54);

public interface ISubtitleWriter
{
    /// <summary>Renders a subtitle file body. Pure: text in, file content out.</summary>
    string Write(SubtitleRequest request);
}
