using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Workbooks;

/// <summary>One file that came in the bundle's <c>media/</c> folder.</summary>
/// <param name="Path">
/// The normalised path as the sheets refer to it, e.g. <c>media/arena.jpg</c>. Lower-cased,
/// because a user typing <c>Media/Arena.JPG</c> into a cell means the same file and being
/// right about that matters more than being strict.
/// </param>
/// <param name="MimeType">
/// Sniffed from the bytes, never taken from the extension. A file named <c>.png</c> that is
/// not a PNG is a refusal, and the refusal has to come from what the file actually is.
/// </param>
public sealed record BundleMedia(
    string Path,
    string FileName,
    byte[] Content,
    string MimeType,
    AssetKind Kind);

/// <summary>
/// A whole production in one file: the sheets, the pictures, the audio, and optionally the
/// transcript.
/// </summary>
/// <remarks>
/// This is the shape of the no-AI path. Everything a render needs can arrive here without a
/// provider key, a network call or a per-file upload - which is the point, and is why the
/// reader that produces it takes no dependency beyond the framework.
/// </remarks>
public sealed class ProjectBundle
{
    public required WorkbookDocument Workbook { get; init; }

    /// <summary>Keyed by normalised path, so a cell's text looks the file up directly.</summary>
    public required IReadOnlyDictionary<string, BundleMedia> Media { get; init; }

    /// <summary>A <c>transcript.srt</c>/<c>.vtt</c>/<c>.txt</c>, if the bundle carried one.</summary>
    public string? TranscriptText { get; init; }

    /// <summary>Things that were ignored, said out loud rather than silently.</summary>
    public IReadOnlyList<string> Warnings { get; init; } = [];

    /// <summary>
    /// Finds the media a cell refers to. Accepts <c>media/arena.jpg</c>, <c>arena.jpg</c> and
    /// any casing, because all three are what people actually type.
    /// </summary>
    public BundleMedia? Resolve(string? reference)
    {
        if (string.IsNullOrWhiteSpace(reference)) return null;

        var normalised = BundlePaths.Normalise(reference);

        if (Media.TryGetValue(normalised, out var direct)) return direct;

        return Media.TryGetValue($"media/{normalised}", out var underMedia) ? underMedia : null;
    }
}

public static class BundlePaths
{
    public const string MediaFolder = "media/";

    /// <summary>
    /// One spelling for a path, so a cell and a zip entry that mean the same file compare
    /// equal. Separators, casing and a leading <c>./</c> are all things a person or a zip
    /// tool varies without meaning anything by it.
    /// </summary>
    public static string Normalise(string path)
    {
        var value = path.Trim().Replace('\\', '/');

        while (value.StartsWith("./", StringComparison.Ordinal)) value = value[2..];

        return value.Trim('/').ToLowerInvariant();
    }
}
