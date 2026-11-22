namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>
/// Deterministic offline/fallback 3D/2D scene illustrator used by <c>VisualsStage</c> so scenes and thumbnails
/// are never left blank or plain when external AI image providers are unavailable or rate-limited.
/// </summary>
public interface IProceduralSceneIllustrationRenderer
{
    Task<byte[]?> RenderSceneIllustrationAsync(
        string? scenePrompt,
        string? headline,
        string? mood,
        string? genreOrCategory,
        string? eventType,
        bool vertical,
        int width,
        int height,
        int seed,
        CancellationToken ct);
}
