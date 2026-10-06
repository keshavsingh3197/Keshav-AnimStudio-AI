using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Abstractions.Rendering;

/// <summary>
/// Renders an outro on its own, as a short MP4 - to preview a card before any export uses
/// it, and to download it for attaching to videos that were uploaded before it existed.
/// </summary>
public interface IOutroPreviewRenderer
{
    /// <param name="projectId">
    /// A project the caller has already been checked to own, whose files the outro may also
    /// use (a project's own bumper). Null limits it to studio-wide files.
    /// </param>
    /// <returns>The MP4's bytes, or null when the outro has nothing to show.</returns>
    Task<byte[]?> RenderAsync(OutroSettings outro, Canvas canvas, string? projectId, CancellationToken ct);
}
