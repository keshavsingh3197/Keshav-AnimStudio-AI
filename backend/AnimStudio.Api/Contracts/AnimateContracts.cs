using AnimStudio.Application.Rendering;

namespace AnimStudio.Api.Contracts;

/// <param name="Description">What the person wants the picture to do, in their words.</param>
/// <param name="UseAi">Ask the configured text AI first; the keyword reading answers when it cannot.</param>
/// <param name="Format">landscape, vertical or square; null lets the description decide.</param>
public sealed record AnimatePlanRequest(string? Description, bool UseAi = true, string? Format = null);

public sealed record AnimatePlanResponse(
    string Motion,
    double Intensity,
    double FocusX,
    double FocusY,
    string Easing,
    string Look,
    bool Vignette,
    bool Grain,
    bool CinemaBars,
    double DurationSeconds,
    string Format,
    string Summary,
    /// <summary>The AI provider that planned it, or <c>built-in</c> for the keyword reading.</summary>
    string PlannedBy,
    /// <summary>Why AI was not used, when it was asked for and could not answer.</summary>
    string? Note);

/// <summary>Request to generate a built-in CPU 2D/3D procedural animated video directly on this server.</summary>
public sealed record ProceduralVideoGenerationRequest(
    string? Title,
    string? Prompt,
    string? Script,
    ProceduralSceneTheme Theme = ProceduralSceneTheme.Auto,
    string Format = "vertical",
    string Resolution = "720p",
    int DurationSeconds = ProceduralVideoRequest.DefaultSeconds,
    bool IncludeCaptions = true,
    bool IncludeAmbientAudio = true,
    string Language = "hi",
    string? FooterLabel = null,
    string? ProjectId = null,
    string? TopicId = null,
    bool SaveAsRenderJob = true);

public sealed record ProceduralVideoResponse(
    string? RenderJobId,
    string? ProjectId,
    ProceduralSceneTheme ResolvedTheme,
    string ThemeDisplayName,
    int Width,
    int Height,
    double DurationSeconds,
    long SizeBytes,
    string? PreviewUrl,
    string? DownloadUrl,
    string Summary);

/// <summary>What this page can offer on this server, so it never offers a render that cannot run.</summary>
public sealed record AnimateCapabilitiesResponse(
    bool RendererAvailable,
    string? RendererUnavailableReason,
    double MinSeconds,
    double MaxSeconds,
    long MaxImageBytes,
    IReadOnlyList<string> Motions,
    IReadOnlyList<string> Looks,
    IReadOnlyList<string> Formats,
    IReadOnlyList<ProceduralThemePreset> ProceduralThemes,
    int ProceduralMinSeconds,
    int ProceduralMaxSeconds);
