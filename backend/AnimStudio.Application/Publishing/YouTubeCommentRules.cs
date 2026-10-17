namespace AnimStudio.Application.Publishing;

/// <summary>
/// The comment posted on a video straight after it is uploaded: a welcome line, links, the
/// music credit. Checked before the upload starts, so a bad comment shows up next to its field
/// instead of as a warning after the whole file has gone over the wire.
/// </summary>
public static class YouTubeCommentRules
{
    /// <summary>YouTube's own limit on a comment's text.</summary>
    public const int MaxLength = 10_000;

    /// <summary>
    /// The comment trimmed, with line endings made <c>\n</c>, or null when there is nothing to post.
    /// Control characters other than a line break are an error, not silently dropped.
    /// </summary>
    public static (string? Text, YouTubeCheck? Error) Normalize(string? input, string field = "firstComment")
    {
        var text = (input ?? string.Empty).Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n').Trim();
        if (text.Length == 0) return (null, null);

        if (text.Length > MaxLength)
            return (null, new YouTubeCheck(field, "comment-too-long", $"A comment can be at most {MaxLength} characters (this one is {text.Length})."));
        if (text.Any(c => char.IsControl(c) && c != '\n' && c != '\t'))
            return (null, new YouTubeCheck(field, "comment-invalid-character", "The comment contains characters YouTube won't accept."));

        return (text, null);
    }

    /// <summary>
    /// Why a comment can't go on this upload, or null when it can. YouTube turns comments off
    /// for videos made for kids, and a private video has no one to read it.
    /// </summary>
    public static string? WhyNotPostable(NormalizedYouTubeMetadata metadata) =>
        metadata.MadeForKids
            ? "YouTube turns comments off on videos made for kids, so the first comment wasn't posted."
            : metadata.Privacy == "private"
                ? "The video is private, so the first comment wasn't posted. Add it in YouTube Studio once the video is public or unlisted."
                : null;
}
