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
    AudioLimiter = 6,

    /// <summary>gblur, used to put a blurred backdrop behind a letterboxed clip.</summary>
    BlurBackdrop = 7,

    /// <summary>
    /// The modern way to hand ffmpeg a filtergraph from a file: <c>-/filter_complex FILE</c>,
    /// the generic "read this option's value from a file" form added in ffmpeg 7.0.
    /// <para>
    /// This is not an optional nicety - the graph is ALWAYS passed as a file, because a
    /// forty-scene merge approaches the platform command-line limit. The older
    /// <c>-filter_complex_script</c> spelling was removed in ffmpeg 8, so a build that has
    /// one does not have the other and rendering fails outright with the wrong flag.
    /// </para>
    /// </summary>
    FilterGraphFromFile = 8
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
