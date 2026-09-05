using AnimStudio.Application.Abstractions.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Capability matrix under test control, so both the full-featured graph and every
/// degraded variant can be asserted without a renderer installed.
/// </summary>
internal sealed class FakeCapabilities : IRenderCapabilities
{
    private readonly HashSet<RenderFeature> _supported;

    public FakeCapabilities(params RenderFeature[] unsupported)
    {
        _supported = [.. Enum.GetValues<RenderFeature>()];
        foreach (var feature in unsupported) _supported.Remove(feature);
    }

    public bool IsAvailable => _supported.Contains(RenderFeature.Renderer);
    public string? Version => "7.0.2";
    public string? UnavailableReason => null;
    public bool Supports(RenderFeature feature) => _supported.Contains(feature);
}
