using AnimStudio.Application.Rendering;

namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>
/// Generates free, CPU-friendly 2D/3D procedural animated videos locally using pure C# frame
/// synthesis and FFmpeg encoding, requiring neither a GPU nor external paid video APIs.
/// </summary>
public interface IProceduralVideoGenerator
{
    Task<ProceduralVideoResult> GenerateAsync(
        string userId,
        ProceduralVideoRequest request,
        CancellationToken ct);
}
