using System.Text.RegularExpressions;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Publishing;

/// <summary>A video uploaded from the app, as the "related videos" block lists it.</summary>
public sealed record RelatedYouTubeVideo(string VideoId, string Title);

/// <summary>
/// Linking other app-published videos from a new upload's description. YouTube's API has no
/// "related videos" field (end screens and cards are Studio-only), so the links go in the
/// description, where they are clickable on every client.
/// </summary>
public static partial class YouTubeRelatedVideos
{
    public const int MaxRelated = 10;
    public const string Heading = "Related videos:";

    public static bool IsVideoId(string? value) => value is not null && VideoIdPattern().IsMatch(value);

    public static string WatchUrl(string videoId) => $"https://youtu.be/{videoId}";

    /// <summary>The description with a "Related videos" block appended; unchanged when there are none.</summary>
    public static string AppendToDescription(string description, IReadOnlyList<RelatedYouTubeVideo> related)
    {
        var body = description.TrimEnd();
        if (related.Count == 0) return body;

        var lines = related.Select(r => $"▶ {OneLine(r.Title)}: {WatchUrl(r.VideoId)}");
        var block = $"{Heading}\n{string.Join('\n', lines)}";
        return body.Length == 0 ? block : $"{body}\n\n{block}";
    }

    /// <summary>A stored title, safe to drop into a description line.</summary>
    private static string OneLine(string title)
    {
        var flat = title.Replace('\r', ' ').Replace('\n', ' ').Replace("<", string.Empty, StringComparison.Ordinal)
            .Replace(">", string.Empty, StringComparison.Ordinal).Trim();
        return flat.Length == 0 ? "Video" : flat;
    }

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex VideoIdPattern();
}

/// <summary>What one <c>videos.list</c> answer says about a video, reduced to what the app shows.</summary>
public sealed record YouTubeVideoVerdict(YouTubeVideoHealth Health, string? IssueCode, string? IssueMessage);

/// <summary>
/// Turns YouTube's <c>status.uploadStatus</c>, <c>failureReason</c>, <c>rejectionReason</c> and
/// <c>processingDetails.processingStatus</c> into a health state with a user-safe message.
/// Only known values are echoed into codes; anything else becomes a generic issue.
/// </summary>
public static class YouTubeVideoHealthEvaluator
{
    private static readonly Dictionary<string, string> Rejections = new(StringComparer.Ordinal)
    {
        ["claim"] = "YouTube rejected it over a copyright claim.",
        ["copyright"] = "YouTube rejected it for copyright infringement.",
        ["duplicate"] = "YouTube rejected it as a duplicate of a video already on the channel.",
        ["inappropriate"] = "YouTube rejected it as inappropriate content.",
        ["legal"] = "YouTube rejected it for legal reasons.",
        ["length"] = "YouTube rejected it as too long for this channel. Verify the channel to upload longer videos.",
        ["termsOfUse"] = "YouTube rejected it for breaking its Terms of Service.",
        ["trademark"] = "YouTube rejected it for trademark infringement.",
        ["uploaderAccountClosed"] = "YouTube rejected it because the channel's account is closed.",
        ["uploaderAccountSuspended"] = "YouTube rejected it because the channel's account is suspended.",
    };

    private static readonly Dictionary<string, string> Failures = new(StringComparer.Ordinal)
    {
        ["codec"] = "YouTube couldn't process it: the video codec isn't supported. Render it again.",
        ["conversion"] = "YouTube couldn't convert the video. Render it again and re-upload.",
        ["emptyFile"] = "YouTube received an empty file. Re-upload the render.",
        ["invalidFile"] = "YouTube says the file is invalid. Render it again and re-upload.",
        ["tooSmall"] = "YouTube says the file is too small to be a video. Re-upload the render.",
        ["uploadAborted"] = "The upload was cut off before YouTube received the whole file. Re-upload the render.",
    };

    public static YouTubeVideoVerdict Evaluate(
        bool found, string? uploadStatus, string? failureReason, string? rejectionReason, string? processingStatus)
    {
        if (!found)
            return new(YouTubeVideoHealth.Removed, "removed",
                "YouTube no longer has this video. It was deleted on YouTube or removed.");

        switch (uploadStatus)
        {
            case "rejected":
                return rejectionReason is not null && Rejections.TryGetValue(rejectionReason, out var rejected)
                    ? new(YouTubeVideoHealth.Issue, $"rejected-{rejectionReason}", rejected)
                    : new(YouTubeVideoHealth.Issue, "rejected", "YouTube rejected this video. Open it in YouTube Studio to see why.");
            case "failed":
                return failureReason is not null && Failures.TryGetValue(failureReason, out var failed)
                    ? new(YouTubeVideoHealth.Issue, $"failed-{failureReason}", failed)
                    : new(YouTubeVideoHealth.Issue, "failed", "YouTube couldn't process this video. Open it in YouTube Studio to see why.");
            case "deleted":
                return new(YouTubeVideoHealth.Removed, "removed", "This video was deleted on YouTube.");
        }

        if (processingStatus is "failed")
            return new(YouTubeVideoHealth.Issue, "processing-failed", "YouTube's processing of this video failed. Open it in YouTube Studio to check.");
        if (processingStatus is "terminated")
            return new(YouTubeVideoHealth.Issue, "processing-terminated", "YouTube stopped processing this video. Open it in YouTube Studio to check.");

        return uploadStatus switch
        {
            "processed" => new(YouTubeVideoHealth.Ok, null, null),
            "uploaded" => new(YouTubeVideoHealth.Processing, null, null),
            _ => new(YouTubeVideoHealth.Unknown, null, null)
        };
    }
}
