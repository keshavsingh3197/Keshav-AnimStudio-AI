namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>Optional renderer features that may be missing from a given ffmpeg build.</summary>
public enum RenderFeature
{
    Renderer = 0,
    BurnedSubtitles = 1,
    DrawText = 2,
    KenBurns = 3,
    CrossFadeTransitions = 4,
    AudioCrossFade = 5,
    AudioLimiter = 6
}

/// <summary>
/// What the installed renderer can actually do. Injected rather than probed on demand, so
/// the filtergraph builder stays a pure function and tests can assert both the
/// full-featured and degraded graphs.
/// </summary>
public interface IRenderCapabilities
{
    bool IsAvailable { get; }
    string? Version { get; }
    string? UnavailableReason { get; }
    bool Supports(RenderFeature feature);
}
