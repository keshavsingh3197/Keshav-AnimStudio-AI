using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Abstractions.Rendering;

public sealed record SubtitleStyle(string Name, string? ColorHex, bool Bold = true);

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
