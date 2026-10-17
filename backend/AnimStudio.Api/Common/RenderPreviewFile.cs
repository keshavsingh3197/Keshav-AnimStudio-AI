using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Api.Common;

/// <summary>
/// A finished render staged once to a local file. <see cref="IObjectStore"/> streams are
/// forward-only, but in-page playback needs range requests and ffmpeg needs to seek for a
/// thumbnail frame, so both read this copy. The caller has already checked ownership.
/// </summary>
public static class RenderPreviewFile
{
    public static async Task<string> EnsureAsync(IObjectStore store, RenderJob job, CancellationToken ct)
    {
        if (job.OutputStorageKey is null) throw new KeyNotFoundException();

        var cacheDirectory = Path.Combine(Path.GetTempPath(), "animstudio-preview");
        Directory.CreateDirectory(cacheDirectory);

        // Job ids are server-generated; the file name is never taken from the client's text.
        var cached = Path.Combine(cacheDirectory, $"{job.Id}.mp4");

        if (!File.Exists(cached) || new FileInfo(cached).Length != (job.OutputSizeBytes ?? -1))
        {
            await using var source = await store.OpenAsync(job.OutputStorageKey, ct)
                ?? throw new KeyNotFoundException();

            // Written to a unique temp name first so a concurrent request never reads a half file.
            var staging = $"{cached}.{Guid.NewGuid():N}.partial";
            try
            {
                await using (var file = new FileStream(staging, FileMode.Create, FileAccess.Write,
                    FileShare.None, 1 << 20, useAsync: true))
                {
                    await source.CopyToAsync(file, 1 << 20, ct);
                }

                File.Move(staging, cached, overwrite: true);
            }
            finally
            {
                if (File.Exists(staging)) File.Delete(staging);
            }
        }

        return cached;
    }
}
