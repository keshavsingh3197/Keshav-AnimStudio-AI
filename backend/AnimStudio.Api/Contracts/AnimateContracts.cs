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

/// <summary>What this page can offer on this server, so it never offers a render that cannot run.</summary>
public sealed record AnimateCapabilitiesResponse(
    bool RendererAvailable,
    string? RendererUnavailableReason,
    double MinSeconds,
    double MaxSeconds,
    long MaxImageBytes,
    IReadOnlyList<string> Motions,
    IReadOnlyList<string> Looks,
    IReadOnlyList<string> Formats);
