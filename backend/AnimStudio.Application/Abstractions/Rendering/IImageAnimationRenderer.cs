using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>
/// Renders one still as a short silent MP4 with a camera move and grade - the Animate Image page. Nothing is stored:
/// the picture comes in with the request and the clip goes back in the response.
/// </summary>
public interface IImageAnimationRenderer
{
    /// <param name="image">A PNG, JPEG or WebP, already checked from its bytes.</param>
    /// <param name="extension">The file extension those bytes are, with its dot.</param>
    Task<byte[]> RenderAsync(
        byte[] image, string extension, CinematicImageSettings settings, Canvas canvas, double seconds,
        CancellationToken ct);
}
