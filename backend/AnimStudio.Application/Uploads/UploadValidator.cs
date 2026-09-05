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

    /// <summary>
    /// Subtitle formats, which are plain text and therefore have no magic bytes to check.
    /// They get their own table because the whole three-signal rule below does not apply:
    /// the file is confirmed by decoding it and looking for the structure the format
    /// requires, which is a stronger check than any prefix would be.
    /// </summary>
    private static readonly Allowed[] AllowedTextTypes =
    [
        new(AssetKind.Subtitle, "application/x-subrip", ".srt", [".srt"], []),
        new(AssetKind.Subtitle, "text/vtt", ".vtt", [".vtt"], [])
    ];

    /// <summary>How much of a text file is decoded to confirm its shape.</summary>
    private const int TextProbeBytes = 4096;

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

        var textCandidate = Array.Find(AllowedTextTypes,
            a => Array.Exists(a.Extensions, e => string.Equals(e, extension, StringComparison.Ordinal)));

        if (candidates.Count == 0 && textCandidate is null)
            return UploadValidationResult.Invalid("file-type-not-allowed",
                "That file type is not supported.");

        var buffer = new byte[TextProbeBytes];
        var read = await content.ReadAtLeastAsync(buffer, buffer.Length, throwOnEndOfStream: false, ct)
            .ConfigureAwait(false);

        if (read < 4)
            return UploadValidationResult.Invalid("file-unreadable", "That file could not be read.");

        // Sliced to what was actually read, so a short file can never be matched against
        // the buffer's trailing zeros.
        var header = buffer[..read];

        if (textCandidate is not null)
            return ValidateText(header, textCandidate, declaredContentType);

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

    /// <summary>
    /// Confirms a subtitle file by decoding it and requiring the structure its format
    /// demands: WEBVTT's signature line, or a cue arrow in SubRip. A renamed binary fails
    /// this, and so does a text file that has nothing to do with subtitles.
    /// </summary>
    private static UploadValidationResult ValidateText(
        byte[] header, Allowed allowed, string? declaredContentType)
    {
        // An image or media content type on a .srt is a contradiction worth refusing; an
        // absent or generic one is normal, because browsers rarely know these formats.
        if (!string.IsNullOrWhiteSpace(declaredContentType)
            && (declaredContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
                || declaredContentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase)
                || declaredContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase)))
        {
            return UploadValidationResult.Invalid("file-type-mismatch",
                "That file's contents do not match its type.");
        }

        string text;
        try
        {
            // Throwing on invalid UTF-8 is the point: it is what rejects binary content.
            text = new UTF8Encoding(false, throwOnInvalidBytes: true)
                .GetString(TrimTruncatedRune(header)).TrimStart('\uFEFF');
        }
        catch (DecoderFallbackException)
        {
            return UploadValidationResult.Invalid("file-content-mismatch",
                "That file is not readable text.");
        }

        // NUL and other control bytes do not occur in a subtitle file, but do in nearly
        // every binary that might be renamed into one.
        foreach (var ch in text)
        {
            if (char.IsControl(ch) && ch is not '\t' and not '\r' and not '\n')
            {
                return UploadValidationResult.Invalid("file-content-mismatch",
                    "That file is not readable text.");
            }
        }

        var looksRight = allowed.Extension switch
        {
            ".vtt" => text.StartsWith("WEBVTT", StringComparison.Ordinal),
            _ => text.Contains("-->", StringComparison.Ordinal)
        };

        if (!looksRight)
        {
            return UploadValidationResult.Invalid("file-content-mismatch",
                allowed.Extension is ".vtt"
                    ? "A WebVTT file must start with WEBVTT."
                    : "That file has no subtitle timings in it.");
        }

        return UploadValidationResult.Valid(allowed.Kind, allowed.Mime, allowed.Extension);
    }

    /// <summary>
    /// Drops a multi-byte character the probe window cut in half, so a perfectly valid file
    /// is not rejected for ending mid-rune. Only a full window can be truncated - a shorter
    /// read is the whole file.
    /// </summary>
    private static byte[] TrimTruncatedRune(byte[] header)
    {
        if (header.Length < TextProbeBytes) return header;

        // Walk back over continuation bytes (10xxxxxx) to the lead byte of the last rune.
        var lead = header.Length - 1;
        while (lead > 0 && (header[lead] & 0xC0) == 0x80) lead--;

        var expected = header[lead] switch
        {
            < 0x80 => 1,
            >= 0xF0 => 4,
            >= 0xE0 => 3,
            >= 0xC0 => 2,
            _ => 1                      // a stray continuation byte; leave it to the decoder
        };

        return header.Length - lead >= expected ? header : header[..lead];
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
