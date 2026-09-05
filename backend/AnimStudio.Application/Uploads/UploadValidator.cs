using System.Text;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Uploads;

public sealed record UploadValidationResult
{
    public bool IsValid { get; init; }
    public AssetKind Kind { get; init; }
    public string? MimeType { get; init; }

    /// <summary>Extension derived from the SNIFFED type, not from the client's filename.</summary>
    public string? CanonicalExtension { get; init; }

    public string? Code { get; init; }
    public string? Message { get; init; }

    public static UploadValidationResult Valid(AssetKind kind, string mime, string extension) =>
        new() { IsValid = true, Kind = kind, MimeType = mime, CanonicalExtension = extension };

    public static UploadValidationResult Invalid(string code, string message) =>
        new() { IsValid = false, Code = code, Message = message };
}

/// <summary>
/// Validates an uploaded file.
/// <para>
/// Three independent signals must agree - the extension, the declared content type, and
/// the file's own magic bytes - because the first two are supplied by the client and are
/// trivially forged. The bytes are what actually reach ffmpeg, so they get the final say.
/// </para>
/// </summary>
public static class UploadValidator
{
    private sealed record Allowed(
        AssetKind Kind, string Mime, string Extension, string[] Extensions, byte[][] Signatures);

    // Allowlist, never a denylist: anything not described here is refused.
    private static readonly Allowed[] AllowedTypes =
    [
        new(AssetKind.Image, "image/png", ".png", [".png"],
            [[0x89, 0x50, 0x4E, 0x47]]),

        new(AssetKind.Image, "image/jpeg", ".jpg", [".jpg", ".jpeg"],
            [[0xFF, 0xD8, 0xFF]]),

        // WEBP is "RIFF....WEBP": the size bytes in between vary, so it is matched in two parts.
        new(AssetKind.Image, "image/webp", ".webp", [".webp"],
            [[0x52, 0x49, 0x46, 0x46]]),

        new(AssetKind.Audio, "audio/wav", ".wav", [".wav"],
            [[0x52, 0x49, 0x46, 0x46]]),

        new(AssetKind.Audio, "audio/mpeg", ".mp3", [".mp3"],
            [[0x49, 0x44, 0x33], [0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]]),

        // MP4/M4A both carry "ftyp" at offset 4.
        new(AssetKind.Video, "video/mp4", ".mp4", [".mp4"],
            [[0x66, 0x74, 0x79, 0x70]]),

        new(AssetKind.Audio, "audio/mp4", ".m4a", [".m4a"],
            [[0x66, 0x74, 0x79, 0x70]])
    ];

    public static async Task<UploadValidationResult> ValidateAsync(
        string? fileName, string? declaredContentType, Stream content, CancellationToken ct)
    {
        var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension))
            return UploadValidationResult.Invalid("file-extension-missing",
                "That file has no extension, so its type cannot be confirmed.");

        var candidates = AllowedTypes
            .Where(a => Array.Exists(a.Extensions, e => string.Equals(e, extension, StringComparison.Ordinal)))
            .ToList();

        if (candidates.Count == 0)
            return UploadValidationResult.Invalid("file-type-not-allowed",
                "That file type is not supported.");

        var header = new byte[16];
        var read = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct)
            .ConfigureAwait(false);

        if (read < 4)
            return UploadValidationResult.Invalid("file-unreadable", "That file could not be read.");

        foreach (var candidate in candidates)
        {
            if (!MatchesSignature(header, candidate)) continue;

            // WAV and WEBP share the RIFF header, so the form type at offset 8 decides.
            if (candidate.Extension is ".wav" && !HasRiffType(header, "WAVE")) continue;
            if (candidate.Extension is ".webp" && !HasRiffType(header, "WEBP")) continue;

            // A declared type that contradicts the bytes is a reason to refuse, not to guess.
            if (!string.IsNullOrWhiteSpace(declaredContentType)
                && !declaredContentType.StartsWith(candidate.Kind switch
                {
                    AssetKind.Image => "image/",
                    AssetKind.Audio => "audio/",
                    AssetKind.Video => "video/",
                    _ => "application/"
                }, StringComparison.OrdinalIgnoreCase))
            {
                return UploadValidationResult.Invalid("file-type-mismatch",
                    "That file's contents do not match its type.");
            }

            return UploadValidationResult.Valid(candidate.Kind, candidate.Mime, candidate.Extension);
        }

        return UploadValidationResult.Invalid("file-content-mismatch",
            "That file's contents do not match its extension.");
    }

    private static bool MatchesSignature(byte[] header, Allowed allowed)
    {
        // "ftyp" sits at offset 4 in an MP4/M4A box, not at the start.
        var offset = allowed.Extension is ".mp4" or ".m4a" ? 4 : 0;

        foreach (var signature in allowed.Signatures)
        {
            if (offset + signature.Length > header.Length) continue;

            var matches = true;
            for (var i = 0; i < signature.Length; i++)
            {
                if (header[offset + i] != signature[i]) { matches = false; break; }
            }

            if (matches) return true;
        }

        return false;
    }

    private static bool HasRiffType(byte[] header, string type)
    {
        if (header.Length < 12) return false;
        return Encoding.ASCII.GetString(header, 8, 4) == type;
    }

    /// <summary>
    /// Keeps a client filename for display only. Path separators, traversal sequences,
    /// control characters and bidi overrides are removed so the name is safe to render.
    /// </summary>
    public static string SanitizeDisplayName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return "upload";

        var name = Path.GetFileName(fileName);
        var builder = new StringBuilder(name.Length);

        foreach (var ch in name)
        {
            if (char.IsControl(ch)) continue;
            if (ch is '/' or '\\' or ':' or '\0') continue;
            if (ch is >= '\u202A' and <= '\u202E') continue;
            if (ch is >= '\u2066' and <= '\u2069') continue;
            builder.Append(ch);
        }

        var cleaned = builder.ToString().Replace("..", string.Empty).Trim();
        if (cleaned.Length == 0) return "upload";

        return cleaned.Length <= 200 ? cleaned : cleaned[..200];
    }
}
