using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Renders full-frame textured 3D/2D illustrated scene PNGs via <see cref="ProceduralSceneRasterizer"/>
/// whenever AI image providers are unavailable or throttled, ensuring no Story Agent scene or thumbnail
/// is ever left plain or unrendered.
/// </summary>
public sealed class ProceduralSceneIllustrationRenderer : IProceduralSceneIllustrationRenderer
{
    public Task<byte[]?> RenderSceneIllustrationAsync(
        string? scenePrompt,
        string? headline,
        string? mood,
        string? genreOrCategory,
        string? eventType,
        bool vertical,
        int width,
        int height,
        int seed,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var resolvedWidth = Math.Clamp(width <= 0 ? (vertical ? 720 : 1280) : width, 480, 1920);
        var resolvedHeight = Math.Clamp(height <= 0 ? (vertical ? 1280 : 720) : height, 480, 1920);

        var title = string.IsNullOrWhiteSpace(headline) ? "Visual Scene" : headline.Trim();
        var bodyPrompt = string.Join(" ", new[] { scenePrompt, mood, genreOrCategory }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var inferredEvent = string.IsNullOrWhiteSpace(eventType)
            ? (IsComedyHint(genreOrCategory, bodyPrompt) ? "FunnyComedy" : "DailyKatha")
            : eventType;

        var theme = ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, title, bodyPrompt, bodyPrompt, inferredEvent);
        var palette = ProceduralEventPalette.Resolve(inferredEvent, theme);

        // Parse plan with setting inference so Temple, ForestAshram, BarberShop, Courtroom, Street, etc. render vividly
        var setting = SceneDirectives.InferSetting(bodyPrompt);
        var time = SceneDirectives.InferTime(bodyPrompt);
        var cueLine = setting != SceneSetting.Auto
            ? $"[SCENE]: {setting} | {time} | {mood ?? "vivid"}\n{bodyPrompt}"
            : bodyPrompt;

        var plan = DialogueScriptParser.ParsePlan(
            title,
            cueLine,
            bodyPrompt,
            durationSeconds: 12,
            enableDialogue: !IsAbstractBackdrop(bodyPrompt),
            eventType: inferredEvent);

        var rasterizer = new ProceduralSceneRasterizer(
            resolvedWidth,
            resolvedHeight,
            theme,
            seed,
            palette,
            plan,
            speechEnvelope: null,
            fps: 1.0,
            storyHint: bodyPrompt);

        rasterizer.RenderFrame(timeSeconds: 4.5, durationSeconds: 12.0);
        var png = PngFrameEncoder.EncodeRgba(rasterizer.Buffer, resolvedWidth, resolvedHeight);
        return Task.FromResult<byte[]?>(png);
    }

    private static bool IsComedyHint(string? genre, string body)
    {
        var hay = $"{genre} {body}".ToLowerInvariant();
        return hay.Contains("comedy") || hay.Contains("funny") || hay.Contains("slapstick")
            || hay.Contains("roast") || hay.Contains("barber") || hay.Contains("courtroom");
    }

    private static bool IsAbstractBackdrop(string body)
    {
        if (string.IsNullOrWhiteSpace(body)) return false;
        var lower = body.ToLowerInvariant();
        return lower.Contains("landscape only") || lower.Contains("empty room");
    }
}
