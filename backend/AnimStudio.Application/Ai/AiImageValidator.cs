namespace AnimStudio.Application.Ai;

/// <summary>
/// Decides whether bytes returned by an image provider are actually an image, and which
/// kind, from the bytes themselves.
/// </summary>
/// <remarks>
/// <para>
/// The <c>Content-Type</c> header is not consulted, because it is the provider's claim
/// rather than a fact. A free image endpoint that has fallen over answers <c>200</c> with
/// an HTML error page and <c>Content-Type: image/png</c> often enough to be the normal
/// case, and those bytes would otherwise be written to the object store, handed to FFmpeg
/// as a character sprite, and surface as a render failure three stages downstream.
/// </para>
/// <para>
/// Only the formats the render pipeline can actually consume are accepted. An allowlist
/// rather than a denylist: an SVG is an image by any reasonable definition and is also a
/// scripting container, and this is exactly the sort of place where "we did not think of
/// that one" needs to mean "refused".
/// </para>
/// </remarks>
public static class AiImageValidator
{
    /// <summary>Below this it is an error page or a placeholder, not a generated image.</summary>
    public const int MinBytes = 128;

    public const string Png = "image/png";
    public const string Jpeg = "image/jpeg";
    public const string WebP = "image/webp";

    /// <summary>
    /// The MIME type the bytes actually are, or null when they are not a supported image.
    /// </summary>
    public static string? Sniff(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length < MinBytes) return null;

        // PNG: \x89 P N G \r \n \x1a \n
        if (bytes is [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ..]) return Png;

        // JPEG: FF D8 FF, and a real end-of-image marker rather than a truncated download.
        if (bytes is [0xFF, 0xD8, 0xFF, ..] &&
            bytes[^2] == 0xFF && bytes[^1] == 0xD9)
        {
            return Jpeg;
        }

        // WebP: "RIFF" .... "WEBP"
        if (bytes.Length >= 12 &&
            bytes[..4].SequenceEqual("RIFF"u8) &&
            bytes.Slice(8, 4).SequenceEqual("WEBP"u8))
        {
            return WebP;
        }

        return null;
    }

    /// <summary>
    /// The MIME type, or a named failure. <paramref name="providerId"/> only names who
    /// returned the bytes; nothing derived from the bytes reaches the message.
    /// </summary>
    public static string Require(byte[]? bytes, string providerId)
    {
        if (bytes is null || bytes.Length == 0)
            throw new AiProviderException("empty-response", $"'{providerId}' returned no image.");

        return Sniff(bytes)
            ?? throw new AiProviderException("not-an-image",
                $"'{providerId}' returned {bytes.Length} bytes that are not a PNG, JPEG or WebP.");
    }

    /// <summary>
    /// True when the format carries an alpha channel. A sprite that has to sit over a
    /// background needs one, and a JPEG silently cannot provide it.
    /// </summary>
    public static bool SupportsTransparency(string mimeType) =>
        mimeType is Png or WebP;
}
