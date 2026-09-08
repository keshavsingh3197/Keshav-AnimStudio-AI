using AnimStudio.Application.Abstractions.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// What the installed renderer can actually do. Probed once at startup and cached, so the
/// graph builder can stay pure and simply be told what is available.
/// </summary>
public sealed class FfmpegCapabilities : IRenderCapabilities
{
    public bool IsAvailable { get; init; }
    public string? Version { get; init; }
    public int Major { get; init; }
    public int Minor { get; init; }
    public string? UnavailableReason { get; init; }

    public bool HasLibass { get; init; }
    public bool HasDrawtext { get; init; }
    public bool HasZoompan { get; init; }
    public bool HasXfade { get; init; }
    public bool HasAcrossfade { get; init; }
    public bool HasAlimiter { get; init; }
    public bool HasGblur { get; init; }
    public bool HasLibx264 { get; init; }
    public bool HasAac { get; init; }

    public static FfmpegCapabilities Unavailable(string reason) =>
        new() { IsAvailable = false, UnavailableReason = reason };

    public bool Supports(RenderFeature feature) => feature switch
    {
        RenderFeature.Renderer => IsAvailable,
        RenderFeature.BurnedSubtitles => IsAvailable && HasLibass,
        RenderFeature.DrawText => IsAvailable && HasDrawtext,
        RenderFeature.KenBurns => IsAvailable && HasZoompan,
        RenderFeature.CrossFadeTransitions => IsAvailable && HasXfade,
        RenderFeature.AudioCrossFade => IsAvailable && HasAcrossfade,
        RenderFeature.AudioLimiter => IsAvailable && HasAlimiter,
        RenderFeature.BlurBackdrop => IsAvailable && HasGblur,
        // Decided by version rather than by probing a filter list: this is an option
        // spelling, not a filter. The generic -/opt form arrived in 7.0 and the older
        // -filter_complex_script it replaces was removed in 8.0.
        RenderFeature.FilterGraphFromFile => IsAvailable && Major >= 7,
        _ => false
    };
}
