using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Abstractions.Rendering;

public interface IMediaProbeService
{
    /// <summary>
    /// Reads technical facts from a stored media file. Called at UPLOAD time so a bad
    /// sprite or unreadable audio fails the upload with a clear message, rather than
    /// surfacing as a mysterious render failure ten minutes into a job.
    /// </summary>
    Task<MediaProbe> ProbeAsync(string storageKey, CancellationToken ct);
}
