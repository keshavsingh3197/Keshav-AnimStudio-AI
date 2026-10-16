namespace AnimStudio.Application.Publishing;

/// <summary>
/// The thumbnail picked in the publish dialog: a frame of the video itself, or a picture the
/// user uploads. Null on both fields leaves YouTube to pick one of its own auto frames.
/// </summary>
public sealed record YouTubeThumbnailChoice(double? FrameAtSeconds, string? ImageBase64);

/// <summary>What <see cref="YouTubeThumbnailRules.Check"/> resolved a choice to.</summary>
public enum YouTubeThumbnailSource { None, Frame, Image }

/// <summary>
/// Checks a thumbnail choice before the upload starts, so a bad picture is reported next to its
/// field rather than as a warning once the whole video has gone over the wire. The picture is
/// re-encoded on the server afterwards either way; these checks only decide whether it is worth
/// trying, and keep anything that isn't a plain JPEG or PNG away from the encoder.
/// </summary>
public static class YouTubeThumbnailRules
{
    /// <summary>YouTube's own limit on a custom thumbnail's file.</summary>
    public const int MaxYouTubeBytes = 2 * 1024 * 1024;

    /// <summary>
    /// The most an uploaded picture may weigh before it is re-encoded. Larger than YouTube's
    /// limit on purpose: a phone photo is shrunk to 1280 wide on the way.
    /// </summary>
    public const int MaxUploadBytes = 8 * 1024 * 1024;

    /// <summary>YouTube's recommended thumbnail width; anything wider is scaled down to it.</summary>
    public const int TargetWidth = 1280;

    public const string Field = "thumbnail";

    public static (YouTubeThumbnailSource Source, double FrameAt, byte[]? Image, YouTubeCheck? Error) Check(
        YouTubeThumbnailChoice? choice, double? durationSeconds)
    {
        if (choice is null || (choice.FrameAtSeconds is null && string.IsNullOrWhiteSpace(choice.ImageBase64)))
            return (YouTubeThumbnailSource.None, 0, null, null);

        if (choice.FrameAtSeconds is not null && !string.IsNullOrWhiteSpace(choice.ImageBase64))
            return Fail("thumbnail-ambiguous", "Pick either a frame or an uploaded picture for the thumbnail, not both.");

        if (choice.FrameAtSeconds is { } at)
        {
            if (!double.IsFinite(at) || at < 0)
                return Fail("thumbnail-frame-invalid", "That thumbnail frame isn't in the video. Pick it again.");
            return (YouTubeThumbnailSource.Frame, ClampFrame(at, durationSeconds), null, null);
        }

        var (image, error) = DecodeImage(choice.ImageBase64!);
        return error is null ? (YouTubeThumbnailSource.Image, 0, image, null) : (YouTubeThumbnailSource.None, 0, null, error);
    }

    /// <summary>
    /// A time inside the video. The very last frame often doesn't decode, so the end is pulled
    /// in a little; an unknown length takes the time as given (ffmpeg then finds no frame and
    /// says so).
    /// </summary>
    public static double ClampFrame(double at, double? durationSeconds)
    {
        if (!double.IsFinite(at) || at < 0) return 0;
        if (durationSeconds is not { } duration || !double.IsFinite(duration) || duration <= 0) return at;
        return Math.Min(at, Math.Max(0, duration - 0.1));
    }

    /// <summary>
    /// The picture's bytes. Accepts plain base64 or a <c>data:image/...;base64,</c> URL, as
    /// a browser's FileReader produces; only JPEG and PNG, recognised by their bytes, not by a
    /// name or a declared type the client could set to anything.
    /// </summary>
    public static (byte[]? Image, YouTubeCheck? Error) DecodeImage(string input)
    {
        var text = input.Trim();
        if (text.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var comma = text.IndexOf(',');
            if (comma < 0 || !text[..comma].EndsWith(";base64", StringComparison.OrdinalIgnoreCase))
                return (null, Error("thumbnail-unreadable", "The thumbnail picture couldn't be read. Choose it again."));
            text = text[(comma + 1)..];
        }

        // Base64 is 4 characters per 3 bytes: refuse an oversized picture before decoding it.
        if (text.Length > (MaxUploadBytes + 2) / 3 * 4 + 4)
            return (null, Error("thumbnail-too-large", $"The thumbnail picture is over {MaxUploadBytes / (1024 * 1024)} MB. Use a smaller one."));

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(text);
        }
        catch (FormatException)
        {
            return (null, Error("thumbnail-unreadable", "The thumbnail picture couldn't be read. Choose it again."));
        }

        if (bytes.Length == 0)
            return (null, Error("thumbnail-unreadable", "The thumbnail picture is empty. Choose another."));
        if (bytes.Length > MaxUploadBytes)
            return (null, Error("thumbnail-too-large", $"The thumbnail picture is over {MaxUploadBytes / (1024 * 1024)} MB. Use a smaller one."));
        if (!IsJpeg(bytes) && !IsPng(bytes))
            return (null, Error("thumbnail-wrong-type", "A thumbnail must be a JPG or PNG picture."));

        return (bytes, null);
    }

    public static bool IsJpeg(ReadOnlySpan<byte> b) => b.Length > 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF;

    public static bool IsPng(ReadOnlySpan<byte> b) =>
        b.Length > 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47
        && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A;

    /// <summary>
    /// What to tell the user when YouTube refuses the thumbnail. The video is up by then, so
    /// every one of these is a warning with the way to finish by hand.
    /// </summary>
    public static string RefusedMessage(string? reason) => reason switch
    {
        "forbidden" or "insufficientPermissions" =>
            "The video is up, but YouTube didn't accept the custom thumbnail: the channel needs to be verified for custom thumbnails (youtube.com/verify). Add it in YouTube Studio once it is.",
        "invalidImage" or "mediaBodyRequired" =>
            "The video is up, but YouTube couldn't use the thumbnail picture. Add one in YouTube Studio.",
        "mediaTooLarge" =>
            "The video is up, but the thumbnail was too large for YouTube. Add a smaller one in YouTube Studio.",
        "uploadRateLimitExceeded" or "rateLimitExceeded" or "quotaExceeded" =>
            "The video is up, but YouTube is limiting thumbnail changes right now. Add it in YouTube Studio later.",
        _ => "The video is up, but its custom thumbnail wasn't set. Add it in YouTube Studio."
    };

    private static (YouTubeThumbnailSource, double, byte[]?, YouTubeCheck?) Fail(string code, string message) =>
        (YouTubeThumbnailSource.None, 0, null, Error(code, message));

    private static YouTubeCheck Error(string code, string message) => new(Field, code, message);
}
